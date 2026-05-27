import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FLAGS, type Flags } from './url-state';
import { EVAL_TIMEOUT_MS, evaluate, setWorkerFactory, type EvalResult } from './engine';

function f(partial: Partial<Flags> = {}): Flags {
	return { ...EMPTY_FLAGS, ...partial };
}

/**
 * Minimal Worker stub. The real browser Worker dispatches `message` events
 * asynchronously; this stub matches that contract so the engine sees the
 * same event ordering it would in production.
 */
class FakeWorker {
	private listeners: Record<string, Set<(e: Event) => void>> = {};
	terminated = false;
	posted: unknown[] = [];

	constructor(private respond: (req: unknown) => EvalResult | 'never') {}

	addEventListener(type: string, listener: (e: Event) => void): void {
		(this.listeners[type] ||= new Set()).add(listener);
	}
	removeEventListener(type: string, listener: (e: Event) => void): void {
		this.listeners[type]?.delete(listener);
	}
	postMessage(data: unknown): void {
		this.posted.push(data);
		const result = this.respond(data);
		if (result === 'never') return;
		// Mimic browser semantics: the message arrives on the next tick.
		queueMicrotask(() => {
			for (const l of this.listeners['message'] ?? []) {
				l(new MessageEvent('message', { data: result }));
			}
		});
	}
	terminate(): void {
		this.terminated = true;
	}
	dispatchError(message: string): void {
		// Engine reads only `.message`; duck-type an Event-shaped object so
		// the test doesn't depend on the runtime exposing `ErrorEvent`.
		const event = { type: 'error', message } as unknown as Event;
		for (const l of this.listeners['error'] ?? []) {
			l(event);
		}
	}
}

afterEach(() => {
	setWorkerFactory(null);
	vi.useRealTimers();
});

describe('evaluate — public Promise contract', () => {
	it('resolves (never throws) on valid pattern', async () => {
		setWorkerFactory(
			() =>
				new FakeWorker((req) => {
					const { pattern, testText, flags } = req as { pattern: string; testText: string; flags: Flags };
					void pattern;
					void testText;
					void flags;
					return { ok: true, matches: [{ index: 0, start: 0, end: 1, value: 'a', groups: [] }] };
				}) as unknown as Worker
		);
		const r = await evaluate('a', 'abc', f());
		expect(r.ok).toBe(true);
	});

	it('short-circuits empty pattern without consulting the worker (item 7)', async () => {
		let constructed = 0;
		setWorkerFactory(() => {
			constructed++;
			return new FakeWorker(() => ({ ok: true, matches: [] })) as unknown as Worker;
		});
		const r = await evaluate('', 'anything', f({ global: true }));
		expect(r).toEqual({ ok: true, matches: [] });
		expect(constructed).toBe(0);
	});

	it('returns aborted after EVAL_TIMEOUT_MS when worker never responds (item 6)', async () => {
		vi.useFakeTimers();
		const fake = new FakeWorker(() => 'never');
		setWorkerFactory(() => fake as unknown as Worker);

		const promise = evaluate('(a+)+$', 'a'.repeat(30) + 'b', f());
		await vi.advanceTimersByTimeAsync(EVAL_TIMEOUT_MS + 1);
		const r = await promise;

		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('aborted');
		expect(fake.terminated).toBe(true);
	});

	it('terminates and respawns the worker after an abort (item 6 — recovery)', async () => {
		vi.useFakeTimers();
		const fakes: FakeWorker[] = [];
		let responder: (req: unknown) => EvalResult | 'never' = () => 'never';
		setWorkerFactory(() => {
			const w = new FakeWorker((req) => responder(req));
			fakes.push(w);
			return w as unknown as Worker;
		});

		// First call hangs → aborted, worker terminated.
		const slow = evaluate('(a+)+$', 'a'.repeat(30) + 'b', f());
		await vi.advanceTimersByTimeAsync(EVAL_TIMEOUT_MS + 1);
		await slow;

		// Subsequent call gets a fresh worker that responds normally.
		responder = () => ({ ok: true, matches: [] });
		vi.useRealTimers();
		const r = await evaluate('xyz', 'abc', f());
		expect(r.ok).toBe(true);
		expect(fakes).toHaveLength(2);
		expect(fakes[0].terminated).toBe(true);
		expect(fakes[1].terminated).toBe(false);
	});

	it('worker error events resolve to invalid, not unhandled rejection', async () => {
		const fake = new FakeWorker(() => 'never');
		setWorkerFactory(() => fake as unknown as Worker);

		const promise = evaluate('a', 'a', f());
		// Dispatch error after the listener is wired (next tick).
		queueMicrotask(() => fake.dispatchError('Worker crashed'));
		const r = await promise;
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('invalid');
		if (r.kind !== 'invalid') return;
		expect(r.message).toContain('Worker crashed');
	});

	it('falls back to direct execution when no worker factory and no Worker global', async () => {
		setWorkerFactory(null);
		// jsdom has no Worker. Promise should still resolve via the in-thread path.
		const r = await evaluate('\\d+', 'order 42 confirmed', f({ global: true }));
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0].value).toBe('42');
	});

	it('passes flag struct through to the worker payload (item 4)', async () => {
		const fake = new FakeWorker(() => ({ ok: true, matches: [] }));
		setWorkerFactory(() => fake as unknown as Worker);
		await evaluate('a', 'a', f({ global: true, caseInsensitive: true }));
		expect(fake.posted).toHaveLength(1);
		const [payload] = fake.posted as Array<{ pattern: string; testText: string; flags: Flags }>;
		expect(payload.pattern).toBe('a');
		expect(payload.testText).toBe('a');
		expect(payload.flags.global).toBe(true);
		expect(payload.flags.caseInsensitive).toBe(true);
		expect(payload.flags.multiline).toBe(false);
		expect(payload.flags.dotAll).toBe(false);
	});

	it('reuses the same worker across calls until termination', async () => {
		let constructed = 0;
		setWorkerFactory(() => {
			constructed++;
			return new FakeWorker(() => ({ ok: true, matches: [] })) as unknown as Worker;
		});
		await evaluate('a', 'a', f());
		await evaluate('b', 'b', f());
		await evaluate('c', 'c', f());
		expect(constructed).toBe(1);
	});
});

// Engine slice — owned by `engine` engineer (nora-regex-1-engine).
//
// Bar items this file is responsible for:
//   - 2  Live match: `evaluate()` returns within 200ms of the last keystroke
//        for normal patterns (debounce wiring is frontend's; this runs fast).
//   - 4  Flag plumbing: Flags struct → engine's native regex construction.
//   - 5  Invalid-pattern reporting: human-readable error, no stack trace.
//   - 6  Backtracking-safe abort: catastrophic patterns either complete in
//        <1s OR return an `aborted` result. UI never freezes.
//   - 7  Edge cases (engine-side): empty pattern, empty test text, valid
//        pattern with zero matches, valid pattern spanning entire text.
//
// Implementation: native `RegExp` dispatch inside a Web Worker; the main
// thread races `postMessage` response against a 1s timeout. On overrun the
// worker is terminated and respawned lazily. SSR / vitest fallback runs the
// match directly on the calling thread (no abort capability — only relevant
// in the browser anyway).
//
// No DOM access — this module is import-safe in SSR and unit tests.

import type { Flags } from './url-state';
import { runMatch } from './engine-core';

/** A single match against the test text. */
export interface Match {
	/** Zero-based index of this match within the match list. */
	index: number;
	/** Character offset where this match starts in the test text. */
	start: number;
	/** Character offset where this match ends (exclusive). */
	end: number;
	/** The full matched substring. */
	value: string;
	/**
	 * Capture groups, indexed from 1 (group 0 is `value` itself and is not
	 * repeated here). Each entry is the captured substring or null when the
	 * group was optional and did not participate in the match.
	 */
	groups: Array<string | null>;
}

/**
 * Discriminated-union result of running a pattern against test text.
 *
 *   - `{ ok: true, matches }` — pattern is valid; matches is possibly empty.
 *   - `{ ok: false, kind: 'invalid', message, hint? }` — syntactic error.
 *   - `{ ok: false, kind: 'aborted', message }` — evaluation aborted on
 *     timeout (bar item 6's backtracking-safe path).
 */
export type EvalResult =
	| { ok: true; matches: Match[] }
	| { ok: false; kind: 'invalid'; message: string; hint?: string }
	| { ok: false; kind: 'aborted'; message: string };

/** Bar item 6 cutoff. The worker is terminated if no result by this point. */
export const EVAL_TIMEOUT_MS = 1000;

/**
 * Public factory for the eval worker. Indirected so tests can inject a
 * deterministic stub (jsdom has no real Worker) and so production code
 * lazily constructs the worker on first use, not at module import — which
 * keeps SSR/test collection green.
 */
export type WorkerFactory = () => Worker;

let workerFactory: WorkerFactory | null = null;
let activeWorker: Worker | null = null;

/**
 * Override the worker factory. Production calls this once with the Vite
 * `?worker` import (in a browser-only module). Tests call it with a fake
 * Worker that simulates timeout or echoes a fixed response.
 *
 * Pass `null` to unregister (e.g. when teardown should force the SSR
 * fallback path again).
 */
export function setWorkerFactory(factory: WorkerFactory | null): void {
	workerFactory = factory;
	terminateActiveWorker();
}

function terminateActiveWorker(): void {
	if (activeWorker) {
		activeWorker.terminate();
		activeWorker = null;
	}
}

function ensureWorker(): Worker | null {
	if (activeWorker) return activeWorker;
	if (workerFactory) {
		activeWorker = workerFactory();
		return activeWorker;
	}
	if (typeof Worker === 'undefined') return null;
	try {
		// Vite-native ESM worker construction. import.meta.url + the relative
		// URL is the pattern Vite rewrites at build time; in dev it points at
		// the .ts source which Vite serves through its worker pipeline.
		activeWorker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
			type: 'module',
			name: 'regex-engine'
		});
		return activeWorker;
	} catch {
		// Bundler can't resolve the worker URL (e.g. running under a
		// non-Vite test runner). Fall back to in-thread execution.
		return null;
	}
}

/**
 * Evaluate `pattern` against `testText` with the given `flags`.
 *
 * Returns a Promise that resolves to an `EvalResult` discriminated union.
 * Always resolves — never rejects, never throws. Catastrophic patterns
 * resolve to `{ ok: false, kind: 'aborted' }` after `EVAL_TIMEOUT_MS`.
 *
 * Empty-pattern semantics (bar item 7): an empty `pattern` resolves to
 * `{ ok: true, matches: [] }` without consulting the worker. We treat an
 * empty pattern field as "no pattern entered" rather than as the native
 * regex `//` (which matches the empty string at every position).
 */
export async function evaluate(pattern: string, testText: string, flags: Flags): Promise<EvalResult> {
	if (pattern === '') return { ok: true, matches: [] };

	const worker = ensureWorker();
	if (!worker) {
		// SSR / vitest path — no Worker available. Run on the calling thread.
		// No abort capability here, but only the browser path is required to
		// honor item 6 in practice (tests use bounded fixtures).
		return runMatch(pattern, testText, flags);
	}

	return new Promise<EvalResult>((resolve) => {
		let settled = false;
		const settle = (result: EvalResult) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			worker.removeEventListener('message', onMessage);
			worker.removeEventListener('error', onError);
			resolve(result);
		};

		const onMessage = (event: MessageEvent<EvalResult>) => settle(event.data);
		const onError = (event: ErrorEvent) => {
			terminateActiveWorker();
			settle({
				ok: false,
				kind: 'invalid',
				message: event.message || 'Worker error during pattern evaluation.'
			});
		};

		const timer = setTimeout(() => {
			terminateActiveWorker();
			settle({
				ok: false,
				kind: 'aborted',
				message: `Pattern evaluation exceeded ${EVAL_TIMEOUT_MS}ms — likely catastrophic backtracking. Try a less ambiguous quantifier shape.`
			});
		}, EVAL_TIMEOUT_MS);

		worker.addEventListener('message', onMessage);
		worker.addEventListener('error', onError);
		worker.postMessage({ pattern, testText, flags });
	});
}

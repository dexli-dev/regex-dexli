import { describe, expect, it } from 'vitest';
import { PATTERNS, type Pattern } from './patterns';

const REQUIRED_LABELS = [
	'email',
	'URL',
	'IPv4',
	'UUID v4',
	'hex color',
	'ISO 8601 date',
	'semantic version',
	'US ZIP',
	'international phone',
	'slug'
];

describe('PATTERNS — bar item 8 contract', () => {
	it('contains exactly 10 entries', () => {
		expect(PATTERNS).toHaveLength(10);
	});

	it('covers every required label', () => {
		const present = new Set(PATTERNS.map((p) => p.label));
		for (const label of REQUIRED_LABELS) expect(present.has(label)).toBe(true);
	});

	it('every entry has label, source, flags, hint', () => {
		for (const p of PATTERNS) {
			expect(p.label).toBeTruthy();
			expect(p.source).toBeTruthy();
			expect(typeof p.flags).toBe('string');
			expect(p.hint.length).toBeGreaterThan(0);
		}
	});

	it('every source compiles as a RegExp with its declared flags', () => {
		for (const p of PATTERNS) {
			expect(() => new RegExp(p.source, p.flags)).not.toThrow();
		}
	});

	it('every flag char is one of g/i/m/s — the four URL-state flags', () => {
		const allowed = new Set(['g', 'i', 'm', 's']);
		for (const p of PATTERNS) {
			for (const c of p.flags) expect(allowed.has(c)).toBe(true);
		}
	});

	it('hints are concise (one-line, < 160 chars) and prose, not regex jargon', () => {
		for (const p of PATTERNS) {
			expect(p.hint.length).toBeLessThan(160);
			expect(p.hint).not.toContain('\n');
		}
	});
});

describe('PATTERNS — sample-string sanity', () => {
	function find(label: string): Pattern {
		const p = PATTERNS.find((x) => x.label === label);
		if (!p) throw new Error(`pattern '${label}' missing`);
		return p;
	}

	function matchesAll(p: Pattern, samples: string[]): void {
		const re = new RegExp(p.source, p.flags.replace('g', ''));
		for (const s of samples) {
			expect(re.test(s), `expected ${p.label} to match: ${s}`).toBe(true);
		}
	}

	function rejectsAll(p: Pattern, samples: string[]): void {
		const re = new RegExp(`^(?:${p.source})$`, p.flags.replace('g', ''));
		for (const s of samples) {
			expect(re.test(s), `expected ${p.label} to reject: ${s}`).toBe(false);
		}
	}

	it('email — matches common shapes; rejects no-@ and no-tld', () => {
		const p = find('email');
		matchesAll(p, ['a@b.co', 'user.name+tag@example.com', 'X@y.io']);
		rejectsAll(p, ['plainstring', 'no-at-sign.com', 'missing@tld', '@nouser.com']);
	});

	it('URL — matches http/https URLs; rejects bare strings', () => {
		const p = find('URL');
		matchesAll(p, ['http://example.com', 'https://api.dexli.dev/v1?x=1#z']);
		rejectsAll(p, ['example.com', 'ftp://example.com', 'just text']);
	});

	it('IPv4 — accepts valid octets, rejects out-of-range and partials', () => {
		const p = find('IPv4');
		matchesAll(p, ['0.0.0.0', '127.0.0.1', '255.255.255.255', '10.0.1.4']);
		rejectsAll(p, ['256.0.0.1', '1.2.3', '1.2.3.4.5', 'not.an.ip.addr']);
	});

	it('UUID v4 — accepts canonical v4, rejects v1/v3 and malformed', () => {
		const p = find('UUID v4');
		matchesAll(p, ['550e8400-e29b-41d4-a716-446655440000', 'F47AC10B-58CC-4372-A567-0E02B2C3D479']);
		rejectsAll(p, [
			'550e8400-e29b-11d4-a716-446655440000', // v1 (version=1)
			'550e8400-e29b-41d4-c716-446655440000', // bad variant nibble (c)
			'not-a-uuid'
		]);
	});

	it('hex color — accepts 3/4/6/8-digit hex; rejects bad length or chars', () => {
		const p = find('hex color');
		matchesAll(p, ['#fff', '#ffff', '#ff8800', '#ff8800cc', '#ABC']);
		rejectsAll(p, ['ffffff', '#gggggg', '#1234567', '#12']);
	});

	it('ISO 8601 date — accepts date and datetime; rejects bad months', () => {
		const p = find('ISO 8601 date');
		matchesAll(p, ['2026-05-27', '2026-05-27T09:30:00Z', '2026-05-27T09:30:00+02:00']);
		rejectsAll(p, ['2026-13-01', '2026-05-32', 'not a date']);
	});

	it('semantic version — accepts MAJOR.MINOR.PATCH plus pre/build', () => {
		const p = find('semantic version');
		matchesAll(p, ['1.0.0', '2.3.4-rc.1', '1.0.0-alpha+sha.abc123']);
		rejectsAll(p, ['1', '1.0', 'v1.0.0', '1.0.0.0']);
	});

	it('US ZIP — accepts 5-digit and ZIP+4', () => {
		const p = find('US ZIP');
		matchesAll(p, ['90210', '02139-1234']);
		rejectsAll(p, ['1234', '123456', '02139-12']);
	});

	it('international phone — accepts E.164-ish shapes', () => {
		const p = find('international phone');
		matchesAll(p, ['+4799112233', '+1 415 555 0100', '+47 99 11 22 33']);
		rejectsAll(p, ['4799112233', '+', '+1', '99 11 22 33']);
	});

	it('slug — accepts kebab-case, rejects leading/trailing hyphens and uppercase', () => {
		const p = find('slug');
		matchesAll(p, ['hello', 'hello-world', 'a1-b2-c3']);
		rejectsAll(p, ['-hello', 'hello-', 'Hello-World', 'hello_world']);
	});
});

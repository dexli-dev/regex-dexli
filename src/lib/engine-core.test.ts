import { describe, expect, it } from 'vitest';
import { EMPTY_FLAGS, type Flags } from './url-state';
import { flagsToNative, runMatch } from './engine-core';

function flags(partial: Partial<Flags> = {}): Flags {
	return { ...EMPTY_FLAGS, ...partial };
}

describe('flagsToNative (item 4 — flag plumbing)', () => {
	it('emits empty string when no flags set', () => {
		expect(flagsToNative(flags())).toBe('');
	});

	it('emits gims in canonical order regardless of struct property order', () => {
		expect(
			flagsToNative({ dotAll: true, multiline: true, caseInsensitive: true, global: true })
		).toBe('gims');
	});

	it('emits a single flag char when only one toggle is on', () => {
		expect(flagsToNative(flags({ global: true }))).toBe('g');
		expect(flagsToNative(flags({ caseInsensitive: true }))).toBe('i');
		expect(flagsToNative(flags({ multiline: true }))).toBe('m');
		expect(flagsToNative(flags({ dotAll: true }))).toBe('s');
	});
});

describe('runMatch — happy path', () => {
	it('returns matches with index, start, end, value, groups', () => {
		const r = runMatch('h(e)(l+)o', 'hello world', flags());
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0]).toEqual({
			index: 0,
			start: 0,
			end: 5,
			value: 'hello',
			groups: ['e', 'll']
		});
	});

	it('without g flag, returns at most one match even when many would match', () => {
		const r = runMatch('\\d+', '1 2 3', flags());
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0].value).toBe('1');
	});

	it('with g flag, returns every match', () => {
		const r = runMatch('\\d+', '1 22 333', flags({ global: true }));
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches.map((m) => m.value)).toEqual(['1', '22', '333']);
		expect(r.matches.map((m) => m.index)).toEqual([0, 1, 2]);
		expect(r.matches[1]).toMatchObject({ start: 2, end: 4 });
		expect(r.matches[2]).toMatchObject({ start: 5, end: 8 });
	});

	it('case-insensitive flag matches', () => {
		const r = runMatch('hello', 'HELLO', flags({ caseInsensitive: true }));
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0].value).toBe('HELLO');
	});

	it('multiline flag makes ^ and $ anchor per line', () => {
		const text = 'foo\nbar\nbaz';
		const r = runMatch('^[a-z]+$', text, flags({ global: true, multiline: true }));
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches.map((m) => m.value)).toEqual(['foo', 'bar', 'baz']);
	});

	it('dotAll flag lets . cross newlines', () => {
		const dotAll = runMatch('a.b', 'a\nb', flags({ dotAll: true }));
		const noDotAll = runMatch('a.b', 'a\nb', flags());
		expect(dotAll.ok && dotAll.matches).toHaveLength(1);
		expect(noDotAll.ok && noDotAll.matches).toHaveLength(0);
	});

	it('optional capture groups that did not participate are null', () => {
		const r = runMatch('(foo)|(bar)', 'bar', flags());
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches[0].groups).toEqual([null, 'bar']);
	});
});

describe('runMatch — invalid patterns (item 5)', () => {
	it('returns invalid for unbalanced parens with a hint', () => {
		const r = runMatch('(unclosed', '', flags());
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('invalid');
		if (r.kind !== 'invalid') return;
		expect(r.message).toMatch(/regular expression|regex/i);
		expect(r.hint).toBeDefined();
	});

	it('returns invalid for nothing-to-repeat with a quantifier hint', () => {
		const r = runMatch('*abc', '', flags());
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('invalid');
		if (r.kind !== 'invalid') return;
		expect(r.hint).toMatch(/quantifier/i);
	});

	it('returns invalid for reversed character-class range', () => {
		const r = runMatch('[z-a]', '', flags());
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('invalid');
		if (r.kind !== 'invalid') return;
		expect(r.hint).toMatch(/range|character/i);
	});

	it('invalid result never contains a stack-trace line', () => {
		const r = runMatch('(', '', flags());
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.kind).toBe('invalid');
		if (r.kind !== 'invalid') return;
		expect(r.message).not.toMatch(/\n\s+at\s+/);
	});

	it('produces a non-empty human message for every invalid result', () => {
		// Sample several invalid patterns; whether each gets a hint is
		// implementation detail (see hintFor heuristics), but message must
		// always be a non-empty prose string.
		const samples = ['(', '*x', '[z-a]', '(?<', '\\'];
		for (const src of samples) {
			const r = runMatch(src, '', flags());
			expect(r.ok).toBe(false);
			if (r.ok) continue;
			expect(r.kind).toBe('invalid');
			if (r.kind !== 'invalid') continue;
			expect(typeof r.message).toBe('string');
			expect(r.message.length).toBeGreaterThan(0);
		}
	});
});

describe('runMatch — edge cases (item 7)', () => {
	it('empty pattern → ok with empty matches array (no zero-width spam)', () => {
		const r = runMatch('', 'abc', flags({ global: true }));
		expect(r).toEqual({ ok: true, matches: [] });
	});

	it('empty pattern + empty text → ok with empty matches', () => {
		expect(runMatch('', '', flags())).toEqual({ ok: true, matches: [] });
	});

	it('non-empty pattern + empty test text → ok with empty matches', () => {
		const r = runMatch('\\d+', '', flags({ global: true }));
		expect(r).toEqual({ ok: true, matches: [] });
	});

	it('valid pattern with zero matches → ok with empty matches', () => {
		const r = runMatch('xyz', 'abc def', flags({ global: true }));
		expect(r).toEqual({ ok: true, matches: [] });
	});

	it('pattern spanning entire text → one match covering 0..text.length', () => {
		const text = 'abcdef';
		const r = runMatch('.+', text, flags());
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0]).toMatchObject({ start: 0, end: text.length, value: text });
	});

	it('zero-width match with g flag does not infinite-loop', () => {
		// `\b` matches at word boundaries — zero-width. With g, the engine must
		// advance lastIndex manually to avoid hanging.
		const r = runMatch('\\b', 'hi there', flags({ global: true }));
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		// 4 word boundaries in "hi there": before h, after i, before t, after e.
		expect(r.matches.length).toBeGreaterThan(0);
		expect(r.matches.length).toBeLessThan(50);
		for (const m of r.matches) {
			expect(m.value).toBe('');
			expect(m.end).toBe(m.start);
		}
	});

	it('result discriminator is set on every branch', () => {
		const ok = runMatch('a', 'a', flags());
		const invalid = runMatch('(', '', flags());
		expect(ok.ok).toBe(true);
		expect(invalid.ok).toBe(false);
	});
});

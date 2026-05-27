// Pure regex-evaluation core. No DOM, no Worker, no setTimeout.
// Import-safe in SSR, tests, and the worker thread.
//
// engine.ts wraps this in a Web Worker + timeout race (bar item 6 abort).
// engine.worker.ts is a thin shell that just delegates to runMatch.

import type { Flags } from './url-state';
import type { EvalResult, Match } from './engine';

/** Convert structured Flags → the 4-char `gims` subset. */
export function flagsToNative(flags: Flags): string {
	let s = '';
	if (flags.global) s += 'g';
	if (flags.caseInsensitive) s += 'i';
	if (flags.multiline) s += 'm';
	if (flags.dotAll) s += 's';
	return s;
}

/**
 * Run a pattern against test text. Pure compute — no abort logic here.
 * Intended to be called from a Web Worker so the host can terminate on
 * catastrophic backtracking (bar item 6).
 *
 * Item 7 edge cases honored directly here:
 *   - empty pattern → { ok: true, matches: [] } (treat as "no pattern entered")
 *   - non-empty pattern + empty test text → run normally, 0 matches expected
 *     unless the pattern matches the empty string
 *   - valid pattern with no matches → { ok: true, matches: [] }
 *   - pattern spanning entire text → one match covering 0..text.length
 */
export function runMatch(pattern: string, testText: string, flags: Flags): EvalResult {
	if (pattern === '') return { ok: true, matches: [] };

	const flagsStr = flagsToNative(flags);
	let re: RegExp;
	try {
		re = new RegExp(pattern, flagsStr);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const hint = hintFor(message);
		return hint ? { ok: false, kind: 'invalid', message, hint } : { ok: false, kind: 'invalid', message };
	}

	const matches: Match[] = [];

	if (flagsStr.includes('g')) {
		let m: RegExpExecArray | null;
		let i = 0;
		while ((m = re.exec(testText)) !== null) {
			matches.push(toMatch(m, i++));
			// Guard against infinite loop on zero-width matches.
			if (m[0] === '') {
				re.lastIndex++;
			}
		}
	} else {
		const m = re.exec(testText);
		if (m) matches.push(toMatch(m, 0));
	}

	return { ok: true, matches };
}

function toMatch(m: RegExpExecArray, index: number): Match {
	const value = m[0];
	const start = m.index;
	const end = start + value.length;
	const groups: Array<string | null> = [];
	for (let i = 1; i < m.length; i++) {
		groups.push(m[i] ?? null);
	}
	return { index, start, end, value, groups };
}

/**
 * Heuristic hints for the most common JS regex syntax errors. Keep hints
 * short, action-oriented, and free of jargon a casual user wouldn't know.
 * Returns undefined when no useful hint is available — the caller then
 * omits the field rather than supplying generic noise.
 */
function hintFor(message: string): string | undefined {
	const m = message.toLowerCase();
	if (m.includes('unmatched') && m.includes(')')) {
		return 'Unbalanced parentheses — check that every "(" has a matching ")".';
	}
	if (m.includes('unmatched') && m.includes('(')) {
		return 'Unbalanced parentheses — check that every "(" has a matching ")".';
	}
	if (m.includes('nothing to repeat')) {
		return 'A quantifier (*, +, ?, {n}) needs something to repeat before it.';
	}
	if (m.includes('range out of order')) {
		return 'A character-class range like [z-a] is reversed — use [a-z].';
	}
	if (m.includes('invalid escape')) {
		return 'Unrecognized escape sequence — a trailing "\\" or "\\X" where X is not a known escape.';
	}
	if (m.includes('invalid character class') || m.includes('invalid class')) {
		return 'Character class brackets [...] are malformed — check that "]" closes the class.';
	}
	if (m.includes('invalid group')) {
		return 'Group syntax is malformed — non-capturing groups are "(?:...)", named groups are "(?<name>...)".';
	}
	if (m.includes('unterminated')) {
		return 'A construct (group, character class, or escape) was opened but never closed.';
	}
	if (m.includes('lookbehind')) {
		return 'Lookbehind syntax: positive "(?<=...)" or negative "(?<!...)".';
	}
	if (m.includes('quantifier')) {
		return 'Quantifier syntax is malformed — try "{2,5}" for a counted range.';
	}
	return undefined;
}

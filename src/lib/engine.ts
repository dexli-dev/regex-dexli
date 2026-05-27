// Engine slice — owned by `engine` engineer (nora-21).
//
// CTO seeded the TYPE CONTRACT below so frontend can compose against the
// API surface in parallel. Function bodies are intentionally stubbed with
// `throw new Error('not implemented')` — fill them in your slice.
//
// Bar items this file is responsible for:
//   - 2  Live match: `evaluate()` returns within 200ms of the last keystroke
//        (debounce wiring is frontend's; this function just runs fast).
//   - 4  Flag plumbing: Flags struct → engine's native regex construction.
//   - 5  Invalid-pattern reporting: human-readable error, no stack trace.
//   - 6  Backtracking-safe abort: catastrophic patterns either complete in
//        <1s OR return an `aborted` result. UI never freezes.
//   - 7  Edge cases (engine-side): empty pattern, empty test text, valid
//        pattern with zero matches, valid pattern spanning entire text.
//
// No DOM access — this file is import-safe in tests and SSR.

import type { Flags } from './url-state';

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
 *     timeout / step budget (bar item 6's backtracking-safe path).
 */
export type EvalResult =
	| { ok: true; matches: Match[] }
	| { ok: false; kind: 'invalid'; message: string; hint?: string }
	| { ok: false; kind: 'aborted'; message: string };

/**
 * Evaluate `pattern` against `testText` with the given `flags`. Must return
 * within the configured step / time budget; on overrun, returns
 * `{ ok: false, kind: 'aborted' }` rather than throwing or blocking.
 *
 * TODO(engine): implement per bar items 2, 4, 5, 6, 7.
 */
export function evaluate(_pattern: string, _testText: string, _flags: Flags): EvalResult {
	throw new Error('engine.evaluate not implemented');
}

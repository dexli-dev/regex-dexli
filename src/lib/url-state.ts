// URL state sync (bar item 9). The CONTRACT both engineers consume:
//
//   ?p=<urlencoded pattern>&t=<urlencoded test text>&f=<gims subset>
//
//   - `p` — regex pattern source (without surrounding slashes)
//   - `t` — test text the pattern is matched against
//   - `f` — flag string; each char present means that flag is on. Allowed
//           chars: g, i, m, s (matching the four named toggles on the page).
//           Order doesn't matter; duplicates are coalesced to a single char;
//           unknown chars are dropped silently.
//
// Encoding goes through URLSearchParams.set() / .get(), which uses standard
// application/x-www-form-urlencoded escaping. That escapes every char the
// bar requires (`\` `/` `&` `+` `%` `[` `]` `(` `)` `?` `#`) so a pattern
// like `\d+` round-trips losslessly through the URL.
//
// replaceState (not pushState) so live-typing doesn't flood history.
// Debounced so rapid keystrokes coalesce into one URL update per ~200ms.
//
// Server-render safe: every function noops when `window` is undefined.

const DEBOUNCE_MS = 200;
let writeTimer: ReturnType<typeof setTimeout> | undefined;

/** The four named flag toggles, exposed as a structured boolean group. */
export interface Flags {
	global: boolean;
	caseInsensitive: boolean;
	multiline: boolean;
	dotAll: boolean;
}

export interface UrlState {
	pattern: string;
	testText: string;
	flags: Flags;
}

export const EMPTY_FLAGS: Readonly<Flags> = Object.freeze({
	global: false,
	caseInsensitive: false,
	multiline: false,
	dotAll: false
});

/** Convert structured flags → the 4-char `gims` subset string. */
export function flagsToString(flags: Flags): string {
	let s = '';
	if (flags.global) s += 'g';
	if (flags.caseInsensitive) s += 'i';
	if (flags.multiline) s += 'm';
	if (flags.dotAll) s += 's';
	return s;
}

/** Parse a flag string back into structured flags. Unknown chars dropped. */
export function flagsFromString(s: string | null | undefined): Flags {
	const src = s ?? '';
	return {
		global: src.includes('g'),
		caseInsensitive: src.includes('i'),
		multiline: src.includes('m'),
		dotAll: src.includes('s')
	};
}

/** Read whatever shareable state the URL currently advertises. */
export function readUrlState(): Partial<UrlState> {
	if (typeof window === 'undefined') return {};
	const params = new URLSearchParams(window.location.search);
	const out: Partial<UrlState> = {};
	const p = params.get('p');
	const t = params.get('t');
	const f = params.get('f');
	if (p !== null) out.pattern = p;
	if (t !== null) out.testText = t;
	if (f !== null) out.flags = flagsFromString(f);
	return out;
}

/**
 * Debounced replaceState writer. Omits empty fields so the URL stays clean
 * for the empty-default case. Always replaceState — pushState would let
 * every keystroke pollute the back stack.
 */
export function writeUrlState(state: UrlState): void {
	if (typeof window === 'undefined') return;
	clearTimeout(writeTimer);
	writeTimer = setTimeout(() => {
		const next = buildUrl(state);
		if (next !== window.location.pathname + window.location.search) {
			window.history.replaceState({}, '', next);
		}
	}, DEBOUNCE_MS);
}

/** Force-flush any pending replaceState (e.g. on copy-share-link). */
export function flushUrlState(state: UrlState): void {
	if (typeof window === 'undefined') return;
	clearTimeout(writeTimer);
	const next = buildUrl(state);
	window.history.replaceState({}, '', next);
}

/**
 * Fully-qualified shareable URL — for the copy-share button.
 *
 * Honors an operator-set canonical origin (PUBLIC_BASE_URL) if one is
 * provided, falling back to window.location.origin. Mirrors tinywebhook
 * cycle-4a's canonical-URL discipline so the dexli.dev family is
 * consistent: a share link minted on a preview/internal host still names
 * the operator's canonical hostname.
 */
export function shareUrl(state: UrlState, baseUrl?: string | null): string {
	if (typeof window === 'undefined') return '';
	const origin = (baseUrl && baseUrl.trim()) || window.location.origin;
	const path = buildUrl(state);
	return `${origin}${path}`;
}

function buildUrl(state: UrlState): string {
	if (typeof window === 'undefined') return '/';
	const params = new URLSearchParams();
	if (state.pattern !== '') params.set('p', state.pattern);
	if (state.testText !== '') params.set('t', state.testText);
	const f = flagsToString(state.flags);
	if (f !== '') params.set('f', f);
	const qs = params.toString();
	return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}

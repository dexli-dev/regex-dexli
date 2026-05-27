// Pattern library — owned by `engine` engineer (nora-regex-1-engine).
//
// Bar item 8: a visible library surfaces 10 named patterns. Clicking any one
// loads its regex into the pattern field, leaves the test text untouched,
// and match views update within 200ms.
//
// Each entry is a pragmatic starting point — useful for inspecting strings
// the user already has on hand, not a formal RFC validator. The hint line
// names the standard each pattern broadly targets so a user can recognise
// when their input shouldn't match.

export interface Pattern {
	/** Short human label shown in the library UI. */
	label: string;
	/** The regex source (without surrounding slashes). */
	source: string;
	/**
	 * Suggested flags this pattern is designed for. May be the empty string.
	 * Frontend may or may not auto-toggle on click. Recommendation:
	 * only auto-toggle flags that change correctness (e.g. `i` for `email`);
	 * leave `g` to the user's session preference.
	 */
	flags: string;
	/** One-line hint shown on hover or beneath the label. */
	hint: string;
}

export const PATTERNS: Pattern[] = [
	{
		label: 'email',
		source: '[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}',
		flags: 'gi',
		hint: 'Pragmatic email — local@domain.tld. Not RFC 5322; catches the shapes users actually paste.'
	},
	{
		label: 'URL',
		source: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*',
		flags: 'gi',
		hint: 'http(s):// followed by a host and path. Greedy to end-of-token; trim trailing punctuation if needed.'
	},
	{
		label: 'IPv4',
		source: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
		flags: 'g',
		hint: 'Dotted-quad with each octet 0–255. Excludes leading-zero zero-padding outside [01]?[0-9][0-9]?.'
	},
	{
		label: 'UUID v4',
		source: '\\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b',
		flags: 'gi',
		hint: 'RFC 4122 v4 UUID — version nibble is "4", variant nibble is 8/9/a/b.'
	},
	{
		label: 'hex color',
		source: '#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\\b',
		flags: 'gi',
		hint: 'CSS hex color: #RGB, #RGBA, #RRGGBB, or #RRGGBBAA.'
	},
	{
		label: 'ISO 8601 date',
		source: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])(?:[T ](?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9](?:\\.\\d+)?)?(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])?)?\\b',
		flags: 'g',
		hint: 'ISO 8601 calendar date with optional T-separated time and Z or ±HH:MM offset.'
	},
	{
		label: 'semantic version',
		source: '\\b\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?\\b',
		flags: 'g',
		hint: 'SemVer 2.0.0: MAJOR.MINOR.PATCH with optional -prerelease and +build metadata.'
	},
	{
		label: 'US ZIP',
		source: '\\b\\d{5}(?:-\\d{4})?\\b',
		flags: 'g',
		hint: 'US ZIP code — 5 digits, optionally followed by "-" and a 4-digit ZIP+4 suffix.'
	},
	{
		label: 'international phone',
		source: '\\+(?:[0-9] ?){6,14}[0-9]',
		flags: 'g',
		hint: 'E.164-ish: leading + then 7–15 digits, optionally space-separated.'
	},
	{
		label: 'slug',
		source: '\\b[a-z0-9]+(?:-[a-z0-9]+)*\\b',
		flags: 'g',
		hint: 'Lowercase URL slug — hyphen-separated alphanumeric tokens, no leading or trailing hyphen.'
	}
];

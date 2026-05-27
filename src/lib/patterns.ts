// Pattern library — owned by `engine` engineer (nora-21).
//
// Bar item 8: a visible library surfaces 10 named patterns. Clicking any one
// loads its regex into the pattern field, leaves the test text untouched,
// and match views update within 200ms.
//
// CTO seeded the type. Fill in `PATTERNS` with the ten required entries:
//   email, URL, IPv4, UUID v4, hex color, ISO 8601 date,
//   semantic version, US ZIP, international phone, slug.

export interface Pattern {
	/** Short human label shown in the library UI. */
	label: string;
	/** The regex source (without surrounding slashes). */
	source: string;
	/**
	 * Suggested flags this pattern is designed for. May be the empty string
	 * — frontend may or may not auto-toggle on click. (Recommendation:
	 *   only auto-toggle flags that change correctness, e.g. case-
	 *   insensitive for `email`; leave `g` to the user's session preference.)
	 */
	flags: string;
	/** One-line hint shown on hover or beneath the label. */
	hint: string;
}

// TODO(engine): populate with the 10 required entries.
export const PATTERNS: Pattern[] = [];

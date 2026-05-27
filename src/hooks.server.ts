// Global server hook — adds non-CSP hardening headers to every response (the
// CSP header itself is emitted by SvelteKit per svelte.config.js
// kit.csp configuration).
//
// Three always-on hardening headers:
//   - X-Content-Type-Options: nosniff  (no MIME-sniffing surprises)
//   - Referrer-Policy:       no-referrer  (don't leak the regex pattern or
//                                          test text in the URL via Referer)
//   - X-Frame-Options:       DENY  (no clickjacking embed)
//
// Cache-Control: no-store is intentionally OMITTED — regex.dexli.dev is a
// pure function of the URL (pattern + flags + test text → matches). No
// secrets on any surface; default cache semantics serve bookmark + share-URL
// flows. Same divergence rationale as cron.dexli.dev (see hooks.server.ts
// there for the long-form reasoning).

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const headers = response.headers;

	if (!headers.has('X-Content-Type-Options')) {
		headers.set('X-Content-Type-Options', 'nosniff');
	}
	if (!headers.has('Referrer-Policy')) {
		headers.set('Referrer-Policy', 'no-referrer');
	}
	if (!headers.has('X-Frame-Options')) {
		headers.set('X-Frame-Options', 'DENY');
	}

	return response;
};

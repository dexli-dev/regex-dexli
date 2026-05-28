// robots.txt for regex.dexli.dev. Permissive; points crawlers at the sitemap.

export const prerender = false;

export function GET({ url }: { url: URL }): Response {
	const origin = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') || url.origin;
	const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
}

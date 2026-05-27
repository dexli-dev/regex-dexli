<script lang="ts">
	// regex.dexli.dev — single-page live regex tester.
	//
	// CTO SCAFFOLD: this file is the engineer onboarding surface. Three slots
	// are marked below — Wordmark/brand-shell (CTO-owned, do not edit),
	// functional UI (FRONTEND slice), and family-footer (CTO-owned, do not
	// remove or rewrite links). The bar's brand-inheritance oracle (item 11)
	// is satisfied by the Wordmark render + footer-links here regardless of
	// what frontend builds in the middle.
	//
	// Engineer slot map (see CONTRIBUTING.md for commit-convention buckets):
	//   FRONTEND (nora-22) owns the `<main>` region below — bar items 1, 3,
	//   4, 5 (UI), 7 (rendering), 8 (visible library surface), 9 (copy-URL
	//   affordance UI), 10 (mobile). Compose your panes, controls, and
	//   match views inside <main>. The topbar may grow controls AROUND the
	//   Wordmark; the Wordmark itself stays first child of <header>.
	//
	//   ENGINE (nora-21) owns src/lib/engine.ts and src/lib/patterns.ts —
	//   bar items 2 (live-match firing), 4 (flag plumbing in the engine),
	//   5 (invalid-pattern reporting from the engine), 6 (backtracking-safe
	//   abort/timeout), 7 (engine-side edge cases), 8 (library data + types),
	//   9 (URL state runtime is already wired in $lib/url-state.ts — engine
	//   consumes encoder/decoder there). No DOM access in engine code.
	//
	//   CTO (nora-cto-2) owns the Wordmark render, family footer text +
	//   sibling links, palette/fonts/CSP, Dockerfile, deploy config, and
	//   merging engineer PRs. No engine or frontend code.
	import Wordmark from '$lib/components/Wordmark.svelte';
</script>

<svelte:head>
	<title>regex — live regex tester · dexli.dev</title>
</svelte:head>

<div class="page">
	<!-- BRAND-SHELL :: CTO-owned. Frontend may add controls AROUND the
	     Wordmark in the header; do not remove or replace the Wordmark
	     component itself. -->
	<header class="topbar wrap">
		<Wordmark />
		<!-- FRONTEND: add tool controls (flag toggles, copy-URL, etc.) here. -->
	</header>

	<!-- FUNCTIONAL UI :: FRONTEND slice. Build bar items 1, 3, 4, 5, 7, 8,
	     9 (UI affordances), 10 inside <main>. Consume engine via
	     `import { ... } from '$lib/engine'` and URL state via
	     `import { ... } from '$lib/url-state'`. -->
	<main class="wrap" data-engineer-slot="frontend">
		<!-- TODO(frontend): pattern input + four flag toggles + test-text
		     area + match-list panel + pattern library. See bar items 1-10. -->
	</main>

	<!-- FAMILY-FOOTER :: CTO-owned (bar item 11). Surfaces the family
	     identity and links to the two existing siblings. Do not remove or
	     rewrite the sibling links; copy adjustments fine. -->
	<footer class="foot wrap">
		<span>A tiny tool for reading regex matches.</span>
		<span class="family">
			Part of the
			<a href="https://dexli.dev">dexli.dev</a>
			tiny-tools family —
			<a href="https://webhook.dexli.dev" rel="external">webhook.dexli.dev</a>
			·
			<a href="https://cron.dexli.dev" rel="external">cron.dexli.dev</a>
		</span>
		<span class="dim">2026 · regex · dexli.dev</span>
	</footer>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background:
			radial-gradient(800px 420px at 78% -10%, var(--accent-glow), transparent 60%),
			radial-gradient(900px 500px at 8% 110%, rgba(198, 241, 53, 0.05), transparent 60%);
	}
	.wrap {
		width: 100%;
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 0 24px;
	}
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 22px;
		padding-bottom: 22px;
	}
	main {
		flex: 1;
		padding-top: 8px;
		padding-bottom: 56px;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		padding-top: 18px;
		padding-bottom: 26px;
		border-top: 1px solid var(--border-soft);
		font-size: 12px;
		color: var(--muted);
	}
	.foot .family {
		color: var(--muted);
	}
	.foot .family a {
		color: var(--accent);
	}
	.foot .dim {
		color: var(--text-faint);
	}
	@media (max-width: 640px) {
		.foot {
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}
	}
</style>

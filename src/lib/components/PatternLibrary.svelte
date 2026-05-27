<script lang="ts">
	import type { Pattern } from '$lib/patterns';

	interface Props {
		patterns: ReadonlyArray<Pattern>;
		onPick: (p: Pattern) => void;
	}
	let { patterns, onPick }: Props = $props();
</script>

<section class="lib" aria-label="pattern library">
	<header class="head">
		<h2>library</h2>
		<span class="count">{patterns.length} patterns</span>
	</header>
	{#if patterns.length === 0}
		<p class="empty">No patterns loaded yet.</p>
	{:else}
		<ul class="grid">
			{#each patterns as p (p.label)}
				<li>
					<button type="button" class="card" onclick={() => onPick(p)} title={p.hint}>
						<span class="label">{p.label}</span>
						<span class="src">{p.source}</span>
						<span class="hint">{p.hint}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.lib {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 14px 16px;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}
	h2 {
		font-family: var(--display);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		font-weight: 600;
	}
	.count {
		font-size: 11px;
		color: var(--text-faint);
	}
	.empty {
		margin: 0;
		font-size: 12px;
		color: var(--text-faint);
		font-style: italic;
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 8px;
	}
	.card {
		width: 100%;
		min-height: 64px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: 10px 12px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--fg);
		text-align: left;
		font-family: var(--mono);
		transition:
			border-color 90ms ease,
			background 90ms ease;
	}
	.card:hover {
		border-color: var(--accent);
		background: var(--surface-3);
	}
	.card:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.label {
		font-size: 13px;
		font-weight: 700;
		color: var(--accent);
	}
	.src {
		font-size: 11.5px;
		color: var(--fg);
		word-break: break-all;
	}
	.hint {
		font-size: 11px;
		color: var(--muted);
	}
</style>

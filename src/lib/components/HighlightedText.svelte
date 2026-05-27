<script lang="ts">
	import type { Match } from '$lib/engine';

	interface Props {
		text: string;
		matches: Match[];
		activeIndex?: number | null;
	}
	let { text, matches, activeIndex = null }: Props = $props();

	type Segment = { kind: 'lit'; value: string } | { kind: 'hit'; value: string; index: number };

	let segments = $derived(buildSegments(text, matches));

	function buildSegments(src: string, hits: Match[]): Segment[] {
		if (hits.length === 0) return [{ kind: 'lit', value: src }];
		const sorted = hits.slice().sort((a, b) => a.start - b.start);
		const out: Segment[] = [];
		let cursor = 0;
		for (const m of sorted) {
			const start = Math.max(m.start, cursor);
			const end = Math.max(m.end, start);
			if (start > cursor) out.push({ kind: 'lit', value: src.slice(cursor, start) });
			out.push({ kind: 'hit', value: src.slice(start, end), index: m.index });
			cursor = end;
		}
		if (cursor < src.length) out.push({ kind: 'lit', value: src.slice(cursor) });
		return out;
	}
</script>

<pre class="surface" aria-live="polite"
	>{#each segments as seg, i (i)}{#if seg.kind === 'hit'}<mark
				class:active={activeIndex === seg.index}
				data-match-index={seg.index}>{seg.value || ' '}</mark
			>{:else}{seg.value}{/if}{/each}</pre>

<style>
	.surface {
		margin: 0;
		padding: 14px 16px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--fg);
		font-family: var(--mono);
		font-size: 13.5px;
		line-height: 1.65;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		min-height: 64px;
	}
	mark {
		background: var(--accent-glow);
		color: var(--fg);
		border-radius: 3px;
		padding: 0 1px;
		box-shadow: inset 0 -1px 0 0 var(--accent-dim);
	}
	mark.active {
		background: var(--accent);
		color: var(--bg);
		box-shadow: none;
	}
</style>

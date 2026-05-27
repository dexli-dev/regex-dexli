<script lang="ts">
	import type { Match } from '$lib/engine';

	interface Props {
		matches: Match[];
		activeIndex: number | null;
		onHover: (index: number | null) => void;
	}
	let { matches, activeIndex, onHover }: Props = $props();

	let copied = $state<string | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy(value: string, key: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = key;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = null), 1200);
		} catch {
			// clipboard denied — silent; user can retry, no UX block.
		}
	}

	function preview(value: string): string {
		const trimmed = value.replace(/\n/g, '↵');
		return trimmed.length > 0 ? trimmed : '(empty match)';
	}
</script>

<ol class="list" aria-label="enumerated matches">
	{#each matches as match (match.index)}
		<li
			class="row"
			class:active={activeIndex === match.index}
			onmouseenter={() => onHover(match.index)}
			onmouseleave={() => onHover(null)}
		>
			<header class="head">
				<span class="num" aria-label="match index">#{match.index}</span>
				<span class="range">[{match.start}–{match.end}]</span>
				<button
					type="button"
					class="copy"
					title="copy match"
					onclick={() => copy(match.value, `m${match.index}`)}
				>
					{copied === `m${match.index}` ? 'copied' : 'copy'}
				</button>
			</header>
			<button
				type="button"
				class="value"
				title="click to copy"
				onclick={() => copy(match.value, `m${match.index}`)}
			>{preview(match.value)}</button>
			{#if match.groups.length > 0}
				<dl class="groups">
					{#each match.groups as g, gi (gi)}
						<div class="group">
							<dt>Group {gi + 1}</dt>
							{#if g === null}
								<dd class="null">(no match)</dd>
							{:else}
								<dd>
									<button
										type="button"
										class="gval"
										title="click to copy"
										onclick={() => copy(g, `m${match.index}-g${gi}`)}
									>{preview(g)}</button>
									<button
										type="button"
										class="copy small"
										title="copy group"
										onclick={() => copy(g, `m${match.index}-g${gi}`)}
									>
										{copied === `m${match.index}-g${gi}` ? 'copied' : 'copy'}
									</button>
								</dd>
							{/if}
						</div>
					{/each}
				</dl>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 12px 14px;
		transition: border-color 90ms ease;
	}
	.row.active {
		border-color: var(--accent);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--muted);
	}
	.num {
		color: var(--accent);
		font-weight: 700;
	}
	.range {
		color: var(--text-faint);
	}
	.copy {
		margin-left: auto;
		min-height: 32px;
		padding: 0 10px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: 11px;
	}
	.copy:hover {
		color: var(--fg);
		border-color: var(--surface-3);
	}
	.copy.small {
		min-height: 28px;
		padding: 0 8px;
		font-size: 10.5px;
	}
	.value {
		margin-top: 8px;
		display: block;
		width: 100%;
		text-align: left;
		padding: 8px 10px;
		background: var(--surface-2);
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		color: var(--fg);
		font-family: var(--mono);
		font-size: 13px;
		word-break: break-all;
	}
	.value:hover {
		border-style: solid;
		border-color: var(--surface-3);
	}
	.groups {
		margin: 10px 0 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
	}
	.group dt {
		font-size: 11px;
		color: var(--text-faint);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.group dd {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.gval {
		flex: 1;
		min-width: 0;
		text-align: left;
		padding: 4px 8px;
		background: transparent;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		color: var(--fg);
		font-family: var(--mono);
		font-size: 12.5px;
		word-break: break-all;
	}
	.gval:hover {
		border-style: solid;
		border-color: var(--surface-3);
	}
	.null {
		color: var(--text-faint);
		font-style: italic;
		font-size: 12px;
	}
</style>

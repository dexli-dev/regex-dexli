<script lang="ts">
	import type { Flags } from '$lib/url-state';

	interface Props {
		flags: Flags;
		onChange: (next: Flags) => void;
	}
	let { flags, onChange }: Props = $props();

	const ITEMS: Array<{ key: keyof Flags; label: string; hint: string }> = [
		{ key: 'global', label: 'global', hint: 'find all matches, not just the first' },
		{ key: 'caseInsensitive', label: 'case-insensitive', hint: 'A === a' },
		{ key: 'multiline', label: 'multiline', hint: '^ and $ match each line' },
		{ key: 'dotAll', label: 'dotall', hint: '. matches newlines' }
	];

	function toggle(key: keyof Flags) {
		onChange({ ...flags, [key]: !flags[key] });
	}
</script>

<div class="row" role="group" aria-label="regex flags">
	{#each ITEMS as item (item.key)}
		<button
			type="button"
			class="toggle"
			class:on={flags[item.key]}
			aria-pressed={flags[item.key]}
			title={item.hint}
			onclick={() => toggle(item.key)}
		>
			<span class="dot" aria-hidden="true"></span>
			<span class="label">{item.label}</span>
		</button>
	{/each}
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 14px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--muted);
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: -0.005em;
		transition:
			color 90ms ease,
			border-color 90ms ease,
			background 90ms ease;
	}
	.toggle:hover {
		color: var(--fg);
		border-color: var(--surface-3);
	}
	.toggle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--surface-3);
		border: 1px solid var(--border);
	}
	.toggle.on {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
	}
	.toggle.on .dot {
		background: var(--bg);
		border-color: var(--bg);
	}
</style>

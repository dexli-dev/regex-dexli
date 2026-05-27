<script lang="ts">
	type Tone = 'info' | 'error';

	interface Props {
		tone?: Tone;
		title: string;
		body?: string | null;
	}
	let { tone = 'info', title, body = null }: Props = $props();
</script>

<aside class="panel" class:error={tone === 'error'} role={tone === 'error' ? 'alert' : 'status'}>
	<strong>{title}</strong>
	{#if body}
		<span class="body">{body}</span>
	{/if}
</aside>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 16px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
		font-family: var(--mono);
		font-size: 13px;
		color: var(--fg);
	}
	.panel.error {
		border-left-color: #d35a5a;
	}
	strong {
		color: var(--fg);
		font-weight: 700;
	}
	.body {
		color: var(--muted);
		font-size: 12.5px;
	}
</style>

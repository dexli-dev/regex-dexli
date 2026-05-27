<script lang="ts">
	import { flushUrlState, shareUrl, type UrlState } from '$lib/url-state';

	// Don't name this prop `state` — Svelte 5's `$state` rune is parsed as a
	// store subscription on a local binding named `state`. Use `value`.
	interface Props {
		value: UrlState;
	}
	let { value }: Props = $props();

	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copyShare() {
		flushUrlState(value);
		const url = shareUrl(value);
		try {
			await navigator.clipboard.writeText(url);
			status = 'copied';
		} catch {
			status = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), 1500);
	}
</script>

<button
	type="button"
	class="share"
	class:copied={status === 'copied'}
	class:failed={status === 'failed'}
	aria-label="copy shareable URL to clipboard"
	onclick={copyShare}
>
	<span class="icon" aria-hidden="true">⎘</span>
	<span class="label">
		{status === 'copied' ? 'copied!' : status === 'failed' ? 'copy failed' : 'copy share URL'}
	</span>
</button>

<style>
	.share {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--fg);
		font-family: var(--mono);
		font-size: 13px;
		transition:
			color 90ms ease,
			background 90ms ease,
			border-color 90ms ease;
	}
	.share:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.share:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.share.copied {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}
	.share.failed {
		border-color: #d35a5a;
		color: #d35a5a;
	}
	.icon {
		font-size: 14px;
	}
</style>

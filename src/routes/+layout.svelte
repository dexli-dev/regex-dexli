<script lang="ts">
	// Layout shell. CSS imports only — page composition lives in +page.svelte.
	// app.css ships the family palette + base reset; fonts.css declares the
	// Bricolage Grotesque + JetBrains Mono faces and overrides --display /
	// --mono so component CSS reads the real faces.
	import '../app.css';
	import '$lib/fonts.css';

	let { children } = $props();
</script>

{@render children()}

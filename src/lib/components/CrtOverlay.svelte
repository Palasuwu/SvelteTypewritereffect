<!--
	CrtOverlay.svelte
	=================
	A whisper-subtle site-wide CRT treatment: faint static scanlines + a soft
	vignette. Pure CSS, no distortion, no flicker, no animation — text stays
	perfectly readable and there's zero performance cost.

	The full WebGL CRT shader stays exclusive to the GBA screen; this overlay
	just extends a hint of that hardware feel to the rest of the page.
	Don't like it? Delete the <CrtOverlay /> line in +page.svelte.
-->

<div class="crt-overlay" aria-hidden="true"></div>

<style>
	.crt-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		pointer-events: none;
		background:
			/* scanlines */
			repeating-linear-gradient(
				to bottom,
				rgba(0, 0, 0, 0.05) 0 1px,
				transparent 1px 3px
			),
			/* vignette */
			radial-gradient(ellipse at center, transparent 55%, rgba(0, 10, 10, 0.16));
	}
</style>

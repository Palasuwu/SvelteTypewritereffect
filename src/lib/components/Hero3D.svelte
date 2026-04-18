<!--
	Hero3D.svelte
	=============
	A scroll-driven 3D hero section. Works just like ScrollReveal:
	a tall "track" div (700vh) gives the user runway to scroll through,
	while a sticky container pins the 3D canvas to the viewport.

	As the user scrolls, we calculate a `progress` value (0 to 1) and
	pass it to GbaScene, which maps it to model position/rotation/scale
	keyframes. The page scroll is never interrupted — it flows naturally.

	STRUCTURE:
	  .track (700vh) ← scroll runway
	    .sticky (100vh, position: sticky) ← pins canvas to viewport
	      <Canvas> ← Threlte 3D canvas
	      text overlay ← title + subtitle on top of the 3D scene
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';

	// ---- Scroll progress (0 to 1) ----
	let progress = $state(0);
	let trackEl: HTMLDivElement | undefined = $state();

	// ---- Lazy-load the 3D scene only on the client ----
	const GbaScenePromise = browser
		? import('$lib/components/GbaScene.svelte').then((m) => m.default)
		: null;

	// ---- Scroll handler ----
	// Calculates how far through the track the user has scrolled.
	// 0 = track just entered the viewport, 1 = track is about to leave.
	function handleScroll() {
		if (!trackEl) return;

		const rect = trackEl.getBoundingClientRect();
		const trackHeight = rect.height - window.innerHeight;

		// rect.top starts positive (below viewport), goes negative (above).
		// When rect.top = 0, the track top is at the viewport top → progress 0.
		// When rect.top = -trackHeight, the track bottom meets viewport bottom → progress 1.
		if (trackHeight <= 0) return;

		progress = Math.max(0, Math.min(1, -rect.top / trackHeight));
	}

	// ---- Text overlay opacity ----
	// Fade "Scroll to explore" out as user starts scrolling,
	// and fade the title out a bit later.
	const subtitleOpacity = $derived(Math.max(0, 1 - progress * 8));
	const titleOpacity = $derived(Math.max(0, 1 - progress * 4));
</script>

<div
	class="track"
	bind:this={trackEl}
>
	<div class="sticky-container">
		<!-- 3D Canvas -->
		{#if browser && GbaScenePromise}
			<div class="canvas-wrapper">
				{#await GbaScenePromise then GbaScene}
					<Canvas>
						<GbaScene {progress} />
					</Canvas>
				{/await}
			</div>
		{/if}

		<!-- Text overlay — fades out as user scrolls -->
		<div class="overlay">
			<h1
				class="title"
				style:opacity={titleOpacity}
			>
				GBA
			</h1>
			<p
				class="subtitle"
				style:opacity={subtitleOpacity}
			>
				Scroll to explore
			</p>
		</div>
	</div>
</div>

<!-- Listen for scroll events on the window -->
<svelte:window onscroll={handleScroll} />

<style>
	/* Tall scroll runway — 900vh gives plenty of room for the full animation
	   including the final zoom-in before the next section */
	.track {
		position: relative;
		height: 900vh;
	}

	/* Pins the canvas to the viewport while the track scrolls */
	.sticky-container {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	/* Canvas fills the sticky container */
	.canvas-wrapper {
		position: absolute;
		inset: 0;
	}

	/* Text sits on top of the canvas, centered at the bottom */
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding-bottom: 6rem;
		pointer-events: none;
	}

	.title {
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #938160;
		transition: opacity 0.1s linear;
	}

	.subtitle {
		margin-top: 1rem;
		font-size: 1.1rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #cccccc;
		transition: opacity 0.1s linear;
	}
</style>

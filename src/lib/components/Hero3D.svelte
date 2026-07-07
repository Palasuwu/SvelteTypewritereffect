<!--
	Hero3D.svelte
	=============
	A scroll-driven 3D hero section. A tall "track" div (900vh) gives the user
	runway to scroll through, while a sticky container pins the 3D canvas to
	the viewport.

	As the user scrolls, we calculate a `progress` value (0 to 1) and
	pass it to GbaScene, which maps it to model position/rotation/scale
	keyframes. The page scroll is never interrupted — it flows naturally.

	STRUCTURE:
	  .track (900vh) ← scroll runway
	    .sticky (100vh, position: sticky) ← pins canvas to viewport
	      <Canvas> ← Threlte 3D canvas (fades in once the GLB loads)
	      loader ← pulsing dot while the model downloads
	      text overlay ← title + subtitle + scroll cue on top of the 3D scene
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import Marquee from '$lib/components/Marquee.svelte';

	// ---- Props ----
	// `marquee` : words for the giant faint ticker behind the 3D model.
	let { marquee = [] }: { marquee?: string[] } = $props();

	// ---- Scroll progress (0 to 1) ----
	let progress = $state(0);
	let trackEl: HTMLDivElement | undefined = $state();

	// ---- Model loading state ----
	let modelReady = $state(false);

	// ---- Lazy-load the 3D scene only on the client ----
	const GbaScenePromise = browser
		? import('$lib/components/GbaScene.svelte').then((m) => m.default)
		: null;

	// ---- Scroll handler ----
	// Calculates how far through the track the user has scrolled.
	function handleScroll() {
		if (!trackEl) return;

		const rect = trackEl.getBoundingClientRect();
		const trackHeight = rect.height - window.innerHeight;
		if (trackHeight <= 0) return;

		progress = Math.max(0, Math.min(1, -rect.top / trackHeight));
	}

	// ---- Text overlay opacity ----
	// Fade "Scroll to explore" out as user starts scrolling,
	// and fade the title out a bit later.
	const subtitleOpacity = $derived(Math.max(0, 1 - progress * 8));
	const titleOpacity = $derived(Math.max(0, 1 - progress * 4));
</script>

<div id="top" class="track" bind:this={trackEl}>
	<div class="sticky-container">
		<!-- Giant faint ticker — background layer behind the 3D model -->
		{#if marquee.length > 0}
			<div class="bg-marquee">
				<Marquee items={marquee} ghost duration="70s" />
			</div>
		{/if}

		<!-- 3D Canvas — fades in when the model has loaded -->
		{#if browser && GbaScenePromise}
			<div class="canvas-wrapper" class:ready={modelReady}>
				{#await GbaScenePromise then GbaScene}
					<Canvas>
						<GbaScene {progress} onready={() => (modelReady = true)} />
					</Canvas>
				{/await}
			</div>

			<!-- Loading indicator while the GLB downloads -->
			{#if !modelReady}
				<div class="loader" aria-hidden="true">
					<span class="loader-dot"></span>
					<span class="loader-dot"></span>
					<span class="loader-dot"></span>
				</div>
			{/if}
		{/if}

		<!-- Text overlay — staggers in on load, fades out as user scrolls -->
		<div class="overlay">
			<h1 class="title" style:opacity={titleOpacity}>
				{#each 'GBA' as letter, i}
					<span class="title-letter" style:--stagger="{i * 120}ms">{letter}</span>
				{/each}
			</h1>
			<p class="subtitle intro-fade" style:opacity={subtitleOpacity}>Scroll to explore</p>

			<!-- Animated scroll cue -->
			<div class="scroll-cue intro-fade" style:opacity={subtitleOpacity} aria-hidden="true">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</div>
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
		height: 100dvh;
		width: 100%;
		overflow: hidden;
	}

	/* Background ticker: vertically centered, behind everything */
	.bg-marquee {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		z-index: 0;
	}

	/* Canvas fills the sticky container; fades in once the model is ready */
	.canvas-wrapper {
		position: absolute;
		inset: 0;
		z-index: 1;
		opacity: 0;
		transition: opacity 0.8s ease;
	}

	.canvas-wrapper.ready {
		opacity: 1;
	}

	/* ---- Loading dots ---- */
	.loader {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
	}

	.loader-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background-color: #938160;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.loader-dot:nth-child(2) {
		animation-delay: 0.15s;
	}

	.loader-dot:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Text sits on top of the canvas, centered at the bottom */
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding-bottom: 4.5rem;
		pointer-events: none;
	}

	.title {
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #938160;
		transition: opacity 0.1s linear;
	}

	/* ---- Page-load intro ----
	   Letters rise in one-by-one; subtitle + cue fade up after.
	   `backwards` fill keeps elements hidden until their delay elapses. */
	.title-letter {
		display: inline-block;
		animation: letter-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(0.25s + var(--stagger, 0ms));
	}

	@keyframes letter-rise {
		from {
			opacity: 0;
			transform: translateY(0.6em);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.intro-fade {
		animation: intro-fade-up 0.8s ease-out 0.9s backwards;
	}

	/* The cue needs both: intro fade first, endless bounce after */
	.scroll-cue.intro-fade {
		animation:
			intro-fade-up 0.8s ease-out 0.9s backwards,
			bounce 2s ease-in-out 1.8s infinite;
	}

	@keyframes intro-fade-up {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}

	.subtitle {
		margin-top: 1rem;
		font-size: 1.1rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #cccccc;
		transition: opacity 0.1s linear;
	}

	/* Bouncing chevron below the subtitle */
	.scroll-cue {
		margin-top: 1.25rem;
		color: #938160;
		animation: bounce 2s ease-in-out infinite;
		transition: opacity 0.1s linear;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scroll-cue,
		.loader-dot,
		.title-letter,
		.intro-fade {
			animation: none;
		}
	}
</style>

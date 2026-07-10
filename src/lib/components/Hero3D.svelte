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

	// HUD stays through most of the journey, bows out before the final zoom
	const hudOpacity = $derived(Math.max(0, 1 - Math.max(0, progress - 0.7) * 5));
	const power = $derived(Math.round(progress * 100));
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
			<div class="headline-block" style:opacity={titleOpacity}>
				<p class="eyebrow intro-fade">Player 1 — Pala</p>
				<h1 class="title">
					{#each 'Playable web experiences.'.split(' ') as word, i}
						<span class="title-word" style:--stagger="{i * 110}ms">{word}&nbsp;</span>
					{/each}
				</h1>
				<p class="roles intro-fade">
					Design &amp; development — motion, 3D and performance, working together.
				</p>
			</div>

			<!-- Animated scroll cue -->
			<div class="cue-block" style:opacity={subtitleOpacity}>
				<p class="subtitle intro-fade">Scroll to power on</p>
				<div class="scroll-cue intro-fade" aria-hidden="true">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</div>
			</div>

			<!-- HUD frame: corner brackets + live readouts (fades before the zoom) -->
			<div class="hud intro-fade" style:opacity={hudOpacity} aria-hidden="true">
				<span class="bracket tl"></span>
				<span class="bracket tr"></span>
				<span class="bracket bl"></span>
				<span class="bracket br"></span>
				<span class="readout r-tl">PALA.SYS — V2</span>
				<span class="readout r-tr">PWR {power.toString().padStart(3, '0')}%</span>
				<span class="readout r-bl">MODEL AGB-001</span>
				<span class="readout r-br">DRAG TO INSPECT</span>
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

	/* Text sits on top of the canvas: headline bottom-left, cue bottom-center */
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.headline-block {
		position: absolute;
		left: clamp(1.5rem, 6vw, 6rem);
		bottom: clamp(6rem, 14vh, 9rem);
		max-width: 34rem;
		transition: opacity 0.1s linear;
	}

	.eyebrow {
		font-family: var(--font-pixel);
		font-size: 0.8rem;
		color: #938160;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 1rem;
	}

	.title {
		font-size: clamp(2.4rem, 5.5vw, 4.2rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.05;
		color: #e8e4da;
	}

	.roles {
		margin-top: 1.25rem;
		font-size: 1rem;
		line-height: 1.6;
		color: #9ab0b0;
		max-width: 26rem;
	}

	/* ---- Page-load intro ----
	   Words rise in one-by-one; eyebrow, roles + cue fade up after.
	   `backwards` fill keeps elements hidden until their delay elapses. */
	.title-word {
		display: inline-block;
		animation: word-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(0.35s + var(--stagger, 0ms));
	}

	@keyframes word-rise {
		from {
			opacity: 0;
			transform: translateY(0.6em);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.cue-block {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: opacity 0.1s linear;
	}

	/* ---- HUD frame ---- */
	.hud {
		position: absolute;
		inset: clamp(4.5rem, 8vh, 6rem) clamp(1.25rem, 4vw, 3rem) clamp(1.25rem, 6vh, 3rem);
		transition: opacity 0.1s linear;
	}

	.bracket {
		position: absolute;
		width: 22px;
		height: 22px;
		border: 0 solid rgba(179, 160, 124, 0.5);
	}

	.bracket.tl { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
	.bracket.tr { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
	.bracket.bl { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
	.bracket.br { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }

	.readout {
		position: absolute;
		font-family: var(--font-pixel);
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		color: rgba(154, 176, 176, 0.75);
	}

	.r-tl { top: 4px; left: 2rem; }
	.r-tr { top: 4px; right: 2rem; color: rgba(179, 160, 124, 0.9); }
	.r-bl { bottom: 4px; left: 2rem; }
	.r-br { bottom: 4px; right: 2rem; }

	@media (max-width: 720px) {
		.readout { display: none; }
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
		font-family: var(--font-pixel);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #9ab0b0;
	}

	/* Bouncing chevron below the subtitle */
	.scroll-cue {
		margin-top: 0.75rem;
		color: #938160;
		animation: bounce 2s ease-in-out infinite;
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
		.title-word,
		.intro-fade {
			animation: none;
		}
	}
</style>

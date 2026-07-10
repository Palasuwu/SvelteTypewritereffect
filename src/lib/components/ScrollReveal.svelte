<!--
	ScrollReveal.svelte
	====================
	v2 — a scroll-driven statement. The sentence reveals word-by-word as the
	user scrolls: each word rises, unblurs, and brightens over its own slice
	of the track's scroll progress (CSS Scroll-Driven Animations).

	An optional pixel-font chapter label ("01 — Craft") sits above the text.

	PROPS:
	- text (string)        — The sentence to reveal.
	- label (string)       — Optional chapter label above the text.
	- trackHeight (string) — Height of the scroll runway. Default '300vh'.

	BROWSER SUPPORT:
	Scroll-driven animations are Chromium 115+. Elsewhere (and for
	reduced-motion users) the text renders fully lit — never stuck hidden.
-->

<script lang="ts">
	let {
		text,
		label = '',
		trackHeight = '300vh'
	}: { text: string; label?: string; trackHeight?: string } = $props();

	const words = $derived(text.split(' '));
	const wordCount = $derived(words.length);
</script>

<div class="track" style:height={trackHeight} style:--word-count={wordCount}>
	<div class="sticky-container">
		<div class="content">
			{#if label}
				<p class="label">{label}</p>
			{/if}

			<p class="reveal-wrapper">
				{#each words as word, i}
					<span class="word" style:--i={i}>{word}&nbsp;</span>
				{/each}
			</p>
		</div>
	</div>
</div>

<style>
	/* The scroll runway. Registers a view-timeline that child animations bind to. */
	.track {
		position: relative;
		view-timeline-name: --reveal-timeline;
		view-timeline-axis: block;
	}

	.sticky-container {
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.content {
		max-width: 56rem;
	}

	.label {
		font-family: var(--font-pixel);
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #938160;
		margin-bottom: 2rem;
	}

	.reveal-wrapper {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 4vw, 3.2rem);
		font-weight: 600;
		line-height: 1.35;
		letter-spacing: -0.01em;
	}

	/* Fallback (no scroll-driven animations / reduced motion): fully lit */
	.word {
		display: inline-block;
		color: #e8e4da;
	}

	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.word {
				color: #4a6363;
				filter: blur(6px);
				opacity: 0.25;
				transform: translateY(0.35em);

				animation-name: word-in;
				animation-timeline: --reveal-timeline;
				animation-fill-mode: both;
				animation-duration: 1ms; /* required by spec, ignored — scroll drives timing */
				animation-timing-function: ease-out;

				/* Each word owns a slice of the first 70% of the track's
				   progress; slices overlap slightly for a fluid ripple. */
				animation-range:
					contain calc(var(--i) / var(--word-count) * 65%)
					contain calc((var(--i) + 2.5) / var(--word-count) * 65%);
			}

			@keyframes word-in {
				to {
					color: #e8e4da;
					filter: blur(0);
					opacity: 1;
					transform: translateY(0);
				}
			}
		}
	}
</style>

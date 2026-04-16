<!--
	ScrollReveal.svelte
	====================
	A scroll-driven text reveal component. It displays a string of text where
	every character starts in a muted "off" color and lights up one-by-one as
	the user scrolls down the page.

	HOW IT WORKS (high level):
	1. The text is split into individual <span> elements — one per character.
	2. A tall "track" div (e.g. 300vh) gives the user something to scroll through.
	   Inside it, a sticky container pins the text to the center of the viewport.
	3. The CSS Scroll-Driven Animations API ties each character's color animation
	   to how far the track has scrolled through the viewport.
	4. Each character is assigned a tiny slice of the total scroll progress
	   (based on its index), so they light up sequentially — letter by letter.

	PROPS:
	- text (string)       — The sentence to reveal.
	- trackHeight (string) — Height of the scrollable track. More height = slower
	                         reveal. Defaults to '300vh'.

	BROWSER SUPPORT:
	Scroll-driven animations require Chromium 115+ (Chrome, Edge, Arc, etc.).
	Firefox and Safari do not support them yet (as of 2026).
-->

<script lang="ts">
	// ---- Props ----
	// `text`        : the string to display and reveal character-by-character.
	// `trackHeight` : how tall the scroll runway is. A taller track means the
	//                 user scrolls more before all characters are revealed.
	let { text, trackHeight = '300vh' }: { text: string; trackHeight?: string } = $props();

	// Split the text into an array of individual characters so we can wrap
	// each one in its own <span> for independent animation control.
	const chars = $derived(text.split(''));

	// Total number of characters — passed to CSS as `--char-count` so each
	// character can calculate what fraction of the scroll progress it owns.
	const charCount = $derived(chars.length);
</script>

<!--
	TRACK
	=====
	This outer div is the scroll runway. Its height (e.g. 300vh) determines
	how much scrolling is needed to complete the reveal. It also registers a
	CSS `view-timeline` so child elements can bind their animations to how
	far this div has scrolled through the viewport.

	CSS custom properties passed down:
	  --char-count : total number of characters (used in animation-range calc)
-->
<div class="track" style:height={trackHeight} style:--char-count={charCount}>

	<!--
		STICKY CONTAINER
		================
		This div is `position: sticky; top: 0` with `height: 100vh`, so it
		stays pinned to the viewport while the track scrolls behind it. This
		is what keeps the text centered on screen during the scroll.
	-->
	<div class="sticky-container">

		<!--
			REVEAL WRAPPER
			==============
			An inline wrapper around all the character spans. Using `display: inline`
			ensures the text flows and wraps naturally like a paragraph, rather than
			being forced into a single line or block.
		-->
		<span class="reveal-wrapper">
			<!--
				CHARACTER LOOP
				==============
				Each character gets its own <span> with a CSS custom property `--i`
				set to its index (0, 1, 2, ...). This index is used in CSS to
				calculate when in the scroll progress this specific character
				should light up.
			-->
			{#each chars as char, i}
				<span class="char" style:--i={i}>{char}</span>
			{/each}
		</span>
	</div>
</div>

<style>
	/*
	 * TRACK
	 * -----
	 * `view-timeline-name` registers a named timeline (--reveal-timeline) that
	 * tracks how far this element has progressed through the viewport.
	 *
	 * `view-timeline-axis: block` means it tracks vertical (block-axis) scroll.
	 *
	 * Child elements can reference this timeline with:
	 *   animation-timeline: --reveal-timeline;
	 */
	.track {
		position: relative;
		view-timeline-name: --reveal-timeline;
		view-timeline-axis: block;
	}

	/*
	 * STICKY CONTAINER
	 * ----------------
	 * Sticks to the top of the viewport and spans the full viewport height.
	 * Flexbox centers the text both horizontally and vertically.
	 */
	.sticky-container {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	/*
	 * REVEAL WRAPPER
	 * --------------
	 * `display: inline` is critical — it makes the text wrap naturally across
	 * lines. If this were `block` or `inline-block`, the mask/animation would
	 * not follow the text flow line-by-line.
	 *
	 * `max-width: 60ch` keeps lines at a comfortable reading length.
	 */
	.reveal-wrapper {
		display: inline;
		max-width: 60ch;
		font-size: clamp(1.5rem, 4vw, 3.5rem);
		font-weight: 700;
		line-height: 1.4;
	}

	/*
	 * CHARACTER SPAN
	 * --------------
	 * Each character starts in the "off" color (#cccccc) and animates to the
	 * "lit" color (#938160) as the user scrolls.
	 *
	 * KEY PROPERTIES:
	 *
	 * - animation-timeline: --reveal-timeline
	 *     Binds this animation to the scroll progress of the .track element,
	 *     NOT to time. The animation advances as the user scrolls.
	 *
	 * - animation-timing-function: steps(1, end)
	 *     Makes the color change instant (a hard snap) rather than a smooth
	 *     fade. Combined with each character having its own animation-range,
	 *     this creates the "typewriter" effect.
	 *
	 * - animation-range: contain <start%> contain <end%>
	 *     `contain` means "when the element is fully contained within the
	 *     viewport." Each character maps to a tiny slice:
	 *
	 *       Character 0:   0%   to  0.5%
	 *       Character 1:   0.5% to  1.0%
	 *       Character 2:   1.0% to  1.5%
	 *       ...and so on.
	 *
	 *     We only use the first 70% of scroll progress for the reveal.
	 *     The remaining 30% keeps all text lit so the user can read it
	 *     before the section scrolls away.
	 *
	 * - animation-fill-mode: both
	 *     Ensures the character stays in its "lit" color after its slice
	 *     of scroll progress has passed (it doesn't revert to gray).
	 */
	.char {
		color: #cccccc;

		animation-name: light-up;
		animation-timeline: --reveal-timeline;
		animation-fill-mode: both;
		animation-duration: 1ms; /* required by spec but ignored — scroll drives timing */
		animation-timing-function: steps(1, end);

		animation-range:
			contain calc(var(--i) / var(--char-count) * 70%)
			contain calc((var(--i) + 1) / var(--char-count) * 70%);
	}

	/*
	 * KEYFRAMES
	 * ---------
	 * Simple color transition from "off" to "lit".
	 * The `steps(1, end)` timing function ensures this happens as an
	 * instant snap rather than a gradual interpolation.
	 */
	@keyframes light-up {
		to {
			color: #938160;
		}
	}
</style>

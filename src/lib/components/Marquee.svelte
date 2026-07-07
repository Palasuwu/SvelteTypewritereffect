<!--
	Marquee.svelte
	==============
	An infinite horizontal ticker strip. The item list is rendered twice and
	translated -50%, so the loop is seamless at any content width.

	PROPS:
	- items (string[])  — the words to scroll.
	- duration (string) — one full loop duration. Slower = calmer. Default 30s.

	Reduced motion: the global app.css rule freezes the animation, leaving a
	static single row (overflow hidden), which reads fine.
-->

<script lang="ts">
	// `ghost` renders the strip as a huge, faint background layer (used inside
	// the hero behind the 3D canvas) instead of a bordered section divider.
	let {
		items,
		duration = '30s',
		ghost = false
	}: { items: string[]; duration?: string; ghost?: boolean } = $props();
</script>

<div class="marquee" class:ghost aria-hidden="true">
	<div class="marquee-track" style:--duration={duration}>
		{#each [0, 1] as copy (copy)}
			<ul class="marquee-list">
				{#each items as item}
					<li class="marquee-item">
						<span class="separator"></span>
						{item}
					</li>
				{/each}
			</ul>
		{/each}
	</div>
</div>

<style>
	.marquee {
		overflow: hidden;
		padding: 1.75rem 0;
		border-top: 1px solid rgba(147, 129, 96, 0.15);
		border-bottom: 1px solid rgba(147, 129, 96, 0.15);
		background-color: rgba(1, 42, 45, 0.4);
		/* Fade the strip edges out */
		mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
	}

	.marquee-track {
		display: flex;
		width: max-content;
		animation: scroll var(--duration, 30s) linear infinite;
	}

	@keyframes scroll {
		to {
			transform: translateX(-50%);
		}
	}

	.marquee-list {
		display: flex;
		align-items: center;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.marquee-item {
		display: flex;
		align-items: center;
		gap: 2.5rem;
		padding-right: 2.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #9ab0b0;
		white-space: nowrap;
	}

	/* Small gold pixel between words — a nod to the GBA theme */
	.separator {
		width: 6px;
		height: 6px;
		background-color: #938160;
		flex-shrink: 0;
	}

	/* ---- Ghost variant: giant, faint, borderless — hero background ---- */
	.marquee.ghost {
		border: none;
		background: none;
		padding: 0;
	}

	.marquee.ghost .marquee-item {
		font-size: clamp(4rem, 11vw, 9rem);
		font-weight: 800;
		letter-spacing: 0.04em;
		color: rgba(147, 129, 96, 0.07);
		gap: 4rem;
		padding-right: 4rem;
	}

	.marquee.ghost .separator {
		width: 14px;
		height: 14px;
		background-color: rgba(147, 129, 96, 0.06);
	}
</style>

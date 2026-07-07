<!--
	CursorGlow.svelte
	=================
	A soft gold radial glow that trails the mouse across the whole page.
	Rendered as a fixed, pointer-events-none div moved with a rAF lerp so it
	lags slightly behind the cursor (feels organic, not glued).

	Disabled automatically on touch devices (no hover) and for reduced motion.
-->

<script lang="ts">
	import { browser } from '$app/environment';

	let glowEl: HTMLDivElement | undefined = $state();
	let enabled = $state(false);

	$effect(() => {
		if (!browser) return;

		// Only for fine pointers, and only if the user is fine with motion
		const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!fine || reduced) return;

		enabled = true;

		let targetX = window.innerWidth / 2;
		let targetY = window.innerHeight / 2;
		let x = targetX;
		let y = targetY;
		let frame: number;

		const onMove = (e: MouseEvent) => {
			targetX = e.clientX;
			targetY = e.clientY;
		};

		const tick = () => {
			x += (targetX - x) * 0.12;
			y += (targetY - y) * 0.12;
			if (glowEl) glowEl.style.transform = `translate(${x}px, ${y}px)`;
			frame = requestAnimationFrame(tick);
		};

		window.addEventListener('mousemove', onMove, { passive: true });
		frame = requestAnimationFrame(tick);

		return () => {
			window.removeEventListener('mousemove', onMove);
			cancelAnimationFrame(frame);
		};
	});
</script>

{#if enabled}
	<div class="glow" bind:this={glowEl} aria-hidden="true"></div>
{/if}

<style>
	.glow {
		position: fixed;
		top: -250px;
		left: -250px;
		width: 500px;
		height: 500px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(147, 129, 96, 0.09) 0%, transparent 65%);
		pointer-events: none;
		z-index: 50;
		will-change: transform;
	}
</style>

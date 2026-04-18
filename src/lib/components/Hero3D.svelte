<!--
	Hero3D.svelte
	=============
	A full-viewport hero section that renders the 3D GBA scene.

	WHY A SEPARATE WRAPPER?
	Threlte's <Canvas> requires browser APIs (WebGL, window, etc.) that
	don't exist during server-side rendering (SSR). By guarding the import
	behind a client-side check, we prevent SSR crashes while still getting
	the benefits of SvelteKit's SSR for the rest of the page.

	STRUCTURE:
	- A full-screen container (100vh) with the project's teal background.
	- The 3D canvas fills the entire section.
	- An overlay with the page title sits on top of the canvas using
	  absolute positioning + pointer-events-none so it doesn't block
	  mouse interactions with the 3D scene.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';

	// ---- Lazy-load the 3D scene only on the client ----
	// `import()` is deferred so the Three.js bundle isn't pulled into SSR.
	// The `{#await}` block below handles the loading state.
	const GbaScenePromise = browser
		? import('$lib/components/GbaScene.svelte').then((m) => m.default)
		: null;
</script>

<section class="relative h-screen w-full overflow-hidden bg-[#013b3f]">
	<!--
		3D CANVAS
		=========
		Only rendered in the browser. The canvas fills the section and has a
		transparent background so the teal shows through.
	-->
	{#if browser && GbaScenePromise}
		<div class="absolute inset-0">
			{#await GbaScenePromise then GbaScene}
				<Canvas>
					<GbaScene />
				</Canvas>
			{/await}
		</div>
	{/if}

	<!--
		TEXT OVERLAY
		===========
		Positioned on top of the canvas. `pointer-events-none` lets mouse
		events pass through to the 3D scene underneath. The text uses the
		project's color palette.
	-->
	<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-24">
		<h1 class="text-5xl font-bold tracking-tight text-[#938160] md:text-7xl">
			GBA
		</h1>
		<p class="mt-4 text-lg tracking-widest text-[#cccccc] uppercase">
			Scroll to explore
		</p>
	</div>
</section>

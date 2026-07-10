<!--
	ProjectConsole.svelte
	=====================
	The interactive Work section. One 3D display case: GBA on the left, a
	stack of clickable 3D cartridges (the projects) on the right. Clicking a
	cartridge inserts it, the screen boots, and the project's title screen
	appears in the GBA. PRESS START opens the project link.

	Accessibility: the 3D carts are mouse/touch-only, so a visually-hidden
	list of real buttons mirrors the picker for keyboard and screen readers.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import { projects, type Project } from '$lib/data/projects';

	// Lazy-load the 3D scene client-side only (same pattern as the hero)
	const ConsoleScenePromise = browser
		? import('$lib/components/ConsoleScene.svelte').then((m) => m.default)
		: null;

	let selected: Project | null = $state(null);
	let insertToken = $state(0);
	let ejectToken = $state(0);
	let ejecting = $state(false);
	let ejectTimer: ReturnType<typeof setTimeout>;
	let screenshot: HTMLImageElement | null = $state(null);

	function pick(project: Project) {
		// Compare by title, not identity — `selected` is a $state proxy, so
		// `selected === project` is always false against the raw object
		if (selected?.title === project.title || ejecting) return;
		selected = project;
		insertToken++;

		// Preload the project screenshot for the in-screen window
		screenshot = null;
		if (project.image) {
			const img = new Image();
			img.onload = () => {
				if (selected?.title === project.title) screenshot = img;
			};
			img.src = project.image;
		}
	}

	function eject() {
		if (!selected || ejecting) return;
		ejecting = true;
		ejectToken++;
		// Clear the selection once the cart has flown back to the stack
		// (flight is 1.25s in the scene — keep this slightly longer)
		clearTimeout(ejectTimer);
		ejectTimer = setTimeout(() => {
			selected = null;
			screenshot = null;
			ejecting = false;
		}, 1400);
	}

	// ---- Keyboard controls (only while the console is on screen) ----
	// ↑/↓ swap cartridges, Enter opens the selected project, ⌫/Esc ejects.
	let sectionEl: HTMLElement | undefined = $state();

	function handleKey(e: KeyboardEvent) {
		if (!sectionEl) return;
		// Ignore when typing in a form field or when the console is off-screen
		const target = e.target as HTMLElement;
		if (target.closest('input, textarea, select')) return;
		const rect = sectionEl.getBoundingClientRect();
		if (rect.bottom < 0 || rect.top > window.innerHeight) return;

		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			const dir = e.key === 'ArrowUp' ? 1 : -1;
			const current = selected ? projects.findIndex((p) => p.title === selected?.title) : -1;
			const next = (current + dir + projects.length) % projects.length;
			pick(projects[next]);
		} else if (e.key === 'Enter' && selected && !ejecting) {
			window.open(selected.link, '_blank', 'noopener');
		} else if ((e.key === 'Backspace' || e.key === 'Escape') && selected) {
			e.preventDefault();
			eject();
		}
	}
</script>

<svelte:window onkeydown={handleKey} />

<section id="work" class="console-section" aria-labelledby="console-heading" bind:this={sectionEl}>
	<div class="section-inner">
		<p class="eyebrow">01 / Selected Work</p>
		<h2 id="console-heading" class="section-title">Insert a cartridge</h2>
		<p class="lede">
			Every project ships on its own cart. Pick one from the stack — the console does the rest.
		</p>

		<!-- Screen-reader / keyboard picker (mirrors the 3D cartridges) -->
		<div class="sr-only">
			<h3>Choose a project</h3>
			{#each projects as project}
				<button onclick={() => pick(project)} aria-pressed={selected === project}>
					Insert cartridge: {project.title} ({project.year})
				</button>
			{/each}
		</div>

		<!-- The stage: no frame, no case — the GBA sits directly on the page -->
		<div class="stage">
			{#if browser && ConsoleScenePromise}
				{#await ConsoleScenePromise then ConsoleScene}
					<Canvas>
						<ConsoleScene
							project={selected}
							{insertToken}
							{ejectToken}
							{screenshot}
							onpick={pick}
							oneject={eject}
						/>
					</Canvas>
				{/await}
			{/if}

			{#if !selected}
				<p class="canvas-hint">Pick a cartridge from the stack to power on</p>
			{:else if !ejecting}
				<p class="canvas-hint">Click the cartridge to eject</p>
			{/if}

			<!-- Keyboard hint chips (desktop) -->
			<div class="key-hints" aria-hidden="true">
				<span class="chip">↑↓ swap</span>
				<span class="chip">⏎ start</span>
				<span class="chip">⌫ eject</span>
			</div>
		</div>

		<!-- Height always reserved so the page doesn't jump when it appears -->
		<div class="start-slot">
		{#if selected && !ejecting}
			<div class="start-row">
				<a class="start-button" href={selected.link} target="_blank" rel="noopener noreferrer">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<polygon points="6 4 20 12 6 20" />
					</svg>
					Press Start — open {selected.title}
				</a>
				<button class="eject-button" onclick={eject}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<polygon points="12 4 22 14 2 14" />
						<rect x="2" y="17" width="20" height="3" />
					</svg>
					Eject
				</button>
			</div>
		{/if}
		</div>
	</div>
</section>

<style>
	.console-section {
		padding: 8rem 1.5rem 4rem;
	}

	.section-inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.eyebrow {
		font-family: var(--font-pixel);
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #938160;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #cccccc;
		margin-bottom: 0.75rem;
	}

	.lede {
		font-size: 1.05rem;
		color: #9ab0b0;
		margin-bottom: 3rem;
	}

	/* ---- Stage: frameless — just a soft glow pooling under the scene ---- */
	.stage {
		position: relative;
		max-width: 68rem;
		margin: 0 auto;
		height: clamp(400px, 55vw, 580px);
		background: radial-gradient(ellipse at 50% 55%, rgba(2, 73, 78, 0.55), transparent 70%);
	}

	.canvas-hint {
		position: absolute;
		bottom: 1.25rem;
		left: 0;
		right: 0;
		text-align: center;
		font-family: var(--font-pixel);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #9ab0b0;
		pointer-events: none;
	}

	/* Keyboard hint chips, top-right of the stage */
	.key-hints {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.5rem;
		pointer-events: none;
	}

	.chip {
		font-family: var(--font-pixel);
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #9ab0b0;
		padding: 0.35rem 0.7rem;
		border: 1px solid rgba(147, 129, 96, 0.25);
		border-radius: 9999px;
		background-color: rgba(2, 29, 32, 0.5);
	}

	@media (max-width: 720px) {
		.key-hints {
			display: none;
		}
	}

	/* ---- START / EJECT ---- */
	.start-slot {
		min-height: 5.5rem;
	}

	.start-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.eject-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: none;
		border: 1px solid rgba(147, 129, 96, 0.35);
		border-radius: 9999px;
		color: #cccccc;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
		transition:
			border-color 0.25s ease,
			color 0.25s ease,
			background-color 0.25s ease;
	}

	.eject-button:hover {
		border-color: #938160;
		color: #b3a07c;
		background-color: rgba(147, 129, 96, 0.08);
	}

	.start-button {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 2rem;
		background-color: #938160;
		color: #013b3f;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 9999px;
		transition:
			background-color 0.25s ease,
			transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 0.25s ease;
	}

	.start-button:hover {
		background-color: #b3a07c;
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(147, 129, 96, 0.35);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

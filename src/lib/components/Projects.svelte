<!--
	Projects.svelte
	===============
	The "Work" section: a responsive grid of project cards.
	Cards fade + rise into view as they enter the viewport (IntersectionObserver
	via a Svelte attachment-style action), stagger by index, and lift on hover.
	Project data lives in src/lib/data/projects.ts.
-->

<script lang="ts">
	import { projects } from '$lib/data/projects';

	// ---- In-view reveal ----
	// Svelte action: adds the `visible` class once the element enters the
	// viewport. Falls back to instantly-visible when IO is unavailable.
	function reveal(node: HTMLElement) {
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('visible');
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						node.classList.add('visible');
						observer.unobserve(node);
					}
				}
			},
			{ threshold: 0.15 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section id="work-grid" class="projects" aria-labelledby="work-heading">
	<div class="section-inner">
		<p class="eyebrow">The Full Library</p>
		<h2 id="work-heading" class="section-title">Things I've built</h2>

		<ul class="grid">
			{#each projects as project, i}
				<li class="card" style:--delay="{i * 90}ms" use:reveal>
					<a href={project.link} target="_blank" rel="noopener noreferrer" class="card-link">
						{#if project.image}
							<div class="thumb">
								<img src={project.image} alt="Screenshot of {project.title}" loading="lazy" />
							</div>
						{/if}
						<div class="card-top">
							<span class="year">{project.year}</span>
							<span class="arrow" aria-hidden="true">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="7" y1="17" x2="17" y2="7" />
									<polyline points="7 7 17 7 17 17" />
								</svg>
							</span>
						</div>

						<h3 class="card-title">{project.title}</h3>
						<p class="card-description">{project.description}</p>

						<ul class="tags">
							{#each project.tags as tag}
								<li class="tag">{tag}</li>
							{/each}
						</ul>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.projects {
		padding: 8rem 1.5rem;
	}

	.section-inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.eyebrow {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: #938160;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #cccccc;
		margin-bottom: 3.5rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* ---- Card ---- */
	.card {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.6s ease var(--delay, 0ms),
			transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) var(--delay, 0ms);
	}

	.card:global(.visible) {
		opacity: 1;
		transform: translateY(0);
	}

	.card-link {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1.75rem;
		background-color: rgba(2, 73, 78, 0.45);
		border: 1px solid rgba(147, 129, 96, 0.18);
		border-radius: 1rem;
		text-decoration: none;
		cursor: pointer;
		overflow: hidden;
		transition:
			transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.3s ease,
			box-shadow 0.3s ease,
			background-color 0.3s ease;
	}

	/* CRT scanlines — invisible until hover, a nod to the GBA up top */
	.card-link::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0 2px,
			rgba(1, 42, 45, 0.35) 2px 4px
		);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.35s ease;
	}

	.card-link:hover::after {
		opacity: 1;
	}

	/* Optional screenshot slot */
	.thumb {
		margin: -1.75rem -1.75rem 1.5rem;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border-bottom: 1px solid rgba(147, 129, 96, 0.18);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card-link:hover .thumb img {
		transform: scale(1.04);
	}

	.card-link:hover {
		transform: translateY(-6px);
		border-color: rgba(147, 129, 96, 0.55);
		background-color: rgba(2, 73, 78, 0.7);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.year {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		color: #9ab0b0;
	}

	.arrow {
		display: flex;
		color: #938160;
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card-link:hover .arrow {
		transform: translate(3px, -3px);
	}

	.card-title {
		font-size: 1.35rem;
		font-weight: 700;
		color: #b3a07c;
		margin-bottom: 0.75rem;
	}

	.card-description {
		font-size: 0.95rem;
		line-height: 1.65;
		color: #cccccc;
		flex-grow: 1;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
	}

	.tag {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #9ab0b0;
		padding: 0.35rem 0.75rem;
		border: 1px solid rgba(147, 129, 96, 0.25);
		border-radius: 9999px;
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			opacity: 1;
			transform: none;
		}
	}
</style>

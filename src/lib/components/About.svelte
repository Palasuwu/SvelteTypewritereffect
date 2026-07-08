<!--
	About.svelte
	============
	Short bio + skills. Two-column on desktop, stacked on mobile.
	Uses the same in-view reveal pattern as Projects.
-->

<script lang="ts">
	const skills = [
		'Svelte / SvelteKit',
		'TypeScript',
		'Three.js / Threlte',
		'Tailwind CSS',
		'UI & Motion Design',
		'3D / Blender'
	];

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
			{ threshold: 0.2 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section id="about" class="about" aria-labelledby="about-heading">
	<div class="section-inner">
		<div class="columns">
			<div class="intro" use:reveal>
				<p class="eyebrow">About</p>
				<h2 id="about-heading" class="section-title">Design &amp; Development</h2>
				<p class="bio">
					I'm Pala — a developer who cares about the details. I build interactive
					experiences for the web where motion, 3D, and performance work together
					instead of fighting each other.
				</p>
				<p class="bio">
					When I'm not pushing pixels, I'm probably reverse-engineering how my
					favorite consoles work — which is how a Game Boy Advance ended up
					floating at the top of this page.
				</p>
			</div>

			<div class="skills-panel" use:reveal style:--delay="120ms">
				<!-- Placeholder pixel avatar — swap static/avatar.png for a real photo -->
				<img src="/avatar.png" alt="Pixel-art portrait of Pala" class="avatar" width="112" height="112" loading="lazy" />
				<h3 class="skills-heading">Toolbox</h3>
				<ul class="skills">
					{#each skills as skill}
						<li class="skill">
							<span class="skill-dot" aria-hidden="true"></span>
							{skill}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<style>
	.about {
		padding: 8rem 1.5rem;
		background-color: rgba(1, 42, 45, 0.5);
	}

	.section-inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.columns {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 4rem;
		align-items: start;
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
		margin-bottom: 2rem;
	}

	.bio {
		font-size: 1.05rem;
		line-height: 1.75;
		color: #cccccc;
		max-width: 55ch;
	}

	.bio + .bio {
		margin-top: 1.25rem;
	}

	/* ---- Skills panel ---- */
	.skills-panel {
		padding: 2rem;
		background-color: rgba(2, 73, 78, 0.45);
		border: 1px solid rgba(147, 129, 96, 0.18);
		border-radius: 1rem;
	}

	.avatar {
		width: 7rem;
		height: 7rem;
		border-radius: 1rem;
		border: 1px solid rgba(147, 129, 96, 0.35);
		image-rendering: pixelated;
		margin-bottom: 1.5rem;
	}

	.skills-heading {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: #938160;
		margin-bottom: 1.5rem;
	}

	.skills {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.skill {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: #cccccc;
	}

	.skill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #938160;
		flex-shrink: 0;
	}

	/* ---- In-view reveal ---- */
	.intro,
	.skills-panel {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.6s ease var(--delay, 0ms),
			transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) var(--delay, 0ms);
	}

	.intro:global(.visible),
	.skills-panel:global(.visible) {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		.columns {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.intro,
		.skills-panel {
			opacity: 1;
			transform: none;
		}
	}
</style>

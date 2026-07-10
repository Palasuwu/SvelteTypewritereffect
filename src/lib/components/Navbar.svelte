<!--
	Navbar.svelte
	=============
	v3 — quiet luxury. At rest the nav is just type on the page: pixel logo,
	three plain links with a sliding-underline hover and a gold pixel-dot on
	the active section, and an understated arrow CTA. Only when the user
	scrolls does a blurred bar materialize behind it.

	A 2px gold hairline along the nav's bottom edge tracks overall page
	scroll progress — the site is scroll-driven, so the chrome says so.
-->

<script lang="ts">
	import { browser } from '$app/environment';

	let scrolled = $state(false);
	let menuOpen = $state(false);
	let active = $state('');
	let pageProgress = $state(0);

	function handleScroll() {
		scrolled = window.scrollY > window.innerHeight * 0.4;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		pageProgress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
	}

	const links = [
		{ href: '#work', id: 'work', label: 'Work' },
		{ href: '#about', id: 'about', label: 'About' },
		{ href: '#contact', id: 'contact', label: 'Contact' }
	];

	// Scrollspy: highlight the section currently in view
	$effect(() => {
		if (!browser) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) active = entry.target.id;
				}
			},
			{ rootMargin: '-40% 0px -50% 0px' }
		);
		for (const link of links) {
			const el = document.getElementById(link.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});
</script>

<svelte:window onscroll={handleScroll} />

<header class="navbar" class:scrolled>
	<nav class="nav-inner" aria-label="Main">
		<a href="#top" class="logo" onclick={() => (menuOpen = false)}>PALA</a>

		<!-- Desktop links -->
		<ul class="links">
			{#each links as link}
				<li>
					<a href={link.href} class="nav-link" class:active={active === link.id}>
						<span class="dot" aria-hidden="true"></span>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<a href="#contact" class="cta">
			Say hello
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<line x1="7" y1="17" x2="17" y2="7" />
				<polyline points="7 7 17 7 17 17" />
			</svg>
		</a>

		<!-- Mobile hamburger -->
		<button
			class="menu-button"
			aria-expanded={menuOpen}
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				{#if menuOpen}
					<line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
				{:else}
					<line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
				{/if}
			</svg>
		</button>
	</nav>

	<!-- Scroll progress hairline -->
	<div class="progress" style:transform="scaleX({pageProgress})" aria-hidden="true"></div>

	<!-- Mobile menu panel -->
	{#if menuOpen}
		<ul class="mobile-menu">
			{#each links as link}
				<li>
					<a href={link.href} class="mobile-link" onclick={() => (menuOpen = false)}>{link.label}</a>
				</li>
			{/each}
		</ul>
	{/if}
</header>

<style>
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background-color: transparent;
		transition: background-color 0.4s ease;
	}

	.navbar.scrolled {
		background-color: rgba(2, 29, 32, 0.72);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.nav-inner {
		max-width: 76rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.1rem 2rem;
	}

	.logo {
		font-family: var(--font-pixel);
		font-size: 1rem;
		color: #b3a07c;
		text-decoration: none;
		letter-spacing: 0.04em;
		transition: color 0.25s ease;
	}

	.logo:hover {
		color: #e0d3b4;
	}

	.links {
		display: flex;
		gap: 2.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Plain type with a sliding underline; a gold pixel appears on the
	   active section. No boxes, no pills. */
	.nav-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0;
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #9ab0b0;
		text-decoration: none;
		transition: color 0.25s ease;
	}

	.nav-link::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 1px;
		background-color: #b3a07c;
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.nav-link:hover {
		color: #e8e4da;
	}

	.nav-link:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.dot {
		width: 5px;
		height: 5px;
		background-color: #b3a07c;
		opacity: 0;
		transform: scale(0);
		transition:
			opacity 0.25s ease,
			transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.nav-link.active {
		color: #e8e4da;
	}

	.nav-link.active .dot {
		opacity: 1;
		transform: scale(1);
	}

	/* Understated CTA: text + arrow, gold on hover, arrow nudges */
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #b3a07c;
		text-decoration: none;
		transition: color 0.25s ease;
	}

	.cta svg {
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.cta:hover {
		color: #e0d3b4;
	}

	.cta:hover svg {
		transform: translate(2px, -2px);
	}

	/* Gold hairline tracking total page scroll */
	.progress {
		height: 2px;
		background: linear-gradient(to right, #938160, #b3a07c);
		transform-origin: left;
		transform: scaleX(0);
	}

	.menu-button {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: none;
		background: none;
		color: #938160;
		cursor: pointer;
	}

	.mobile-menu {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0.5rem 2rem 1.25rem;
		background-color: rgba(2, 29, 32, 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(147, 129, 96, 0.15);
	}

	.mobile-link {
		display: block;
		padding: 0.85rem 0.25rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #cccccc;
		text-decoration: none;
	}

	.mobile-link:hover {
		color: #b3a07c;
	}

	@media (max-width: 720px) {
		.links,
		.cta {
			display: none;
		}

		.menu-button {
			display: flex;
		}

		.mobile-menu {
			display: block;
		}
	}
</style>

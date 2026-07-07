<!--
	Navbar.svelte
	=============
	Fixed top navigation. Transparent over the hero, gains a blurred
	teal backdrop once the user scrolls past the first viewport.
	Anchor links smooth-scroll to page sections (html { scroll-behavior: smooth }).
-->

<script lang="ts">
	let scrolled = $state(false);
	let menuOpen = $state(false);

	function handleScroll() {
		scrolled = window.scrollY > window.innerHeight * 0.5;
	}

	const links = [
		{ href: '#work', label: 'Work' },
		{ href: '#about', label: 'About' },
		{ href: '#contact', label: 'Contact' }
	];
</script>

<svelte:window onscroll={handleScroll} />

<header class="navbar" class:scrolled>
	<nav class="nav-inner" aria-label="Main">
		<a href="#top" class="logo" onclick={() => (menuOpen = false)}>Pala</a>

		<!-- Desktop links -->
		<ul class="links">
			{#each links as link}
				<li><a href={link.href} class="nav-link">{link.label}</a></li>
			{/each}
		</ul>

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
		transition:
			background-color 0.3s ease,
			border-color 0.3s ease,
			backdrop-filter 0.3s ease;
		border-bottom: 1px solid transparent;
	}

	.navbar.scrolled {
		background-color: rgba(1, 42, 45, 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom-color: rgba(147, 129, 96, 0.15);
	}

	.nav-inner {
		max-width: 72rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
	}

	.logo {
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #938160;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.logo:hover {
		color: #b3a07c;
	}

	.links {
		display: flex;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-link {
		display: inline-block;
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #cccccc;
		text-decoration: none;
		border-radius: 9999px;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.nav-link:hover {
		color: #b3a07c;
		background-color: rgba(147, 129, 96, 0.1);
	}

	.menu-button {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid rgba(147, 129, 96, 0.3);
		border-radius: 50%;
		background: none;
		color: #938160;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.menu-button:hover {
		border-color: #938160;
	}

	.mobile-menu {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0.5rem 1.5rem 1.25rem;
		background-color: rgba(1, 42, 45, 0.92);
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

	@media (max-width: 640px) {
		.links {
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

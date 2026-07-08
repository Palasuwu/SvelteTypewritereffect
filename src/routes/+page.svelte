<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Hero3D from '$lib/components/Hero3D.svelte';
	import ScrollReveal from '$lib/components/ScrollReveal.svelte';
	import ProjectConsole from '$lib/components/ProjectConsole.svelte';
	import About from '$lib/components/About.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import CursorGlow from '$lib/components/CursorGlow.svelte';
	import CrtOverlay from '$lib/components/CrtOverlay.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const marqueeItems = [
		'SvelteKit',
		'Three.js',
		'TypeScript',
		'Motion Design',
		'Threlte',
		'Tailwind',
		'3D on the Web',
		'Performance'
	];
</script>

<svelte:head>
	<title>Pala — Design & Development</title>
	<meta
		name="description"
		content="Portfolio of Pala — interactive experiences where motion, 3D, and performance work together. Built with SvelteKit and Three.js."
	/>
	<meta property="og:title" content="Pala — Design & Development" />
	<meta
		property="og:description"
		content="Interactive experiences where motion, 3D, and performance work together."
	/>
	<meta property="og:type" content="website" />
	<!-- Relative path works once deployed on your domain -->
	<meta property="og:image" content="/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="min-h-screen bg-abyss">
	<Navbar />

	<!-- 3D Hero with scroll-driven GBA model; skills ticker floats behind it -->
	<Hero3D marquee={marqueeItems} />

	<!-- First reveal -->
	<ScrollReveal
		text="We build digital experiences that push the boundaries of what's possible on the web. Every pixel, every interaction, every moment is crafted with purpose."
		trackHeight="350vh"
	/>

	<!-- Interactive GBA console — pick a cartridge, see the project -->
	<ProjectConsole />

	<!-- Second reveal -->
	<ScrollReveal
		text="Performance is not an afterthought. It is the foundation upon which great user experiences are built."
		trackHeight="350vh"
	/>

	<!-- About + skills -->
	<About />

	<!-- Contact CTA -->
	<Contact />

	<!-- Footer -->
	<Footer />

	<!-- Gold glow trailing the cursor (desktop only) -->
	<CursorGlow />

	<!-- Faint scanlines + vignette over the whole site (static, CSS-only) -->
	<CrtOverlay />
</div>

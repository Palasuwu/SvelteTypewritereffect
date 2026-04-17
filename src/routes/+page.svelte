<script lang="ts">
	import ScrollReveal from '$lib/components/ScrollReveal.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<div class="min-h-screen bg-[#013b3f]">
	<!-- Hero section -->
	<section class="flex h-screen items-center justify-center">
		<h1 class="text-5xl font-bold tracking-tight text-[#cccccc] md:text-7xl">
			Scroll Down
		</h1>
	</section>

	<!-- First reveal -->
	<ScrollReveal
		text="We build digital experiences that push the boundaries of what's possible on the web. Every pixel, every interaction, every moment is crafted with purpose."
		trackHeight="350vh"
	/>

	<!-- Spacer -->
	<section class="flex h-screen items-center justify-center">
		<p class="text-2xl text-[#cccccc]">Keep scrolling...</p>
	</section>

	<!-- Second reveal -->
	<ScrollReveal
		text="Performance is not an afterthought. It is the foundation upon which great user experiences are built."
		trackHeight="350vh"
	/>

	<!-- Footer -->
	<Footer />
</div>

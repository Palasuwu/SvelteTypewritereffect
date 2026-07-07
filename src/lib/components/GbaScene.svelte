<!--
	GbaScene.svelte
	================
	A scroll-driven 3D scene. The model's position, rotation, and scale are
	controlled by a `progress` prop (0 to 1) that maps to how far the user
	has scrolled through the hero track.

	SCROLL STORY (progress 0 → 1):
	  0.00 — GBA small, positioned left, angled
	  0.25 — GBA moves to center, scales up
	  0.40 — GBA starts rotating to show its back
	  0.38 — cartridge flies in from the right, tumbling
	  0.56 — cartridge hovers above the slot, aligned
	  0.68 — cartridge slides DOWN into the slot (the "click" moment)
	  0.70 — GBA (cart inserted) swings back to face front
	  1.00 — full glamour zoom, cartridge riding along

	The cartridge lives inside the same group as the GBA and is positioned in
	GBA-local units (both models share real-world units from the same author),
	so it inherits the group rotation and stays seated during the final zoom.

	A floating dust particle field adds atmosphere; a floating bob + mouse
	parallax run on top of everything. All motion respects reduced-motion.

	Both GLBs are Draco-compressed; the decoder is self-hosted in /static/draco/.
-->

<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF } from '@threlte/extras';
	import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
	import * as THREE from 'three';
	import { onDestroy } from 'svelte';
	import { createScreenCanvas, drawScreenOff, drawBootSequence } from '$lib/three/screen';
	import { createCrtMaterial } from '$lib/three/crtMaterial';

	// ---- Props ----
	// `progress` : 0–1 value driven by the parent's scroll position.
	// `onready`  : called once the main GLB has finished loading.
	let { progress = 0, onready }: { progress?: number; onready?: () => void } = $props();

	// ---- Draco decoder (self-hosted, no CDN) ----
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath('/draco/');
	onDestroy(() => dracoLoader.dispose());

	// ---- Reduced motion ----
	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---- Dust particles ----
	// A loose box of gold dust drifting around the model. Built once,
	// rotated slowly per-frame, faded out during the final zoom.
	const PARTICLE_COUNT = 160;
	const particleGeometry = new THREE.BufferGeometry();
	{
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 10; // x: ±5
			positions[i * 3 + 1] = (Math.random() - 0.5) * 6; // y: ±3
			positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1; // z: -3 … 1
		}
		particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	}
	onDestroy(() => particleGeometry.dispose());

	let particleMaterial: THREE.PointsMaterial | undefined = $state();
	let particleRotY = $state(0);

	// ---- GBA screen (canvas texture) ----
	// Off until the cartridge clicks in (progress 0.68), then the boot
	// sequence plays: white flash → PALA™ logo drop → tagline.
	const { canvas: screenCanvas, ctx: screenCtx } = createScreenCanvas();
	const screenTexture = new THREE.CanvasTexture(screenCanvas);
	screenTexture.colorSpace = THREE.SRGBColorSpace;
	drawScreenOff(screenCtx);
	screenTexture.needsUpdate = true;

	// CRT shader scoped to the screen plane only (curvature, scanlines,
	// vignette) — the rest of the scene is unaffected.
	const crtMaterial = createCrtMaterial(screenTexture);
	onDestroy(() => {
		screenTexture.dispose();
		crtMaterial.dispose();
	});

	let bootStart: number | null = null;
	let bootDone = false;
	let screenIsOff = true;

	// ---- Floating animation (runs on top of scroll pose) ----
	let floatY = $state(0);
	let floatRotZ = $state(0);
	let elapsed = 0;

	// ---- Mouse parallax (subtle tilt toward the cursor) ----
	let mouseX = 0;
	let mouseY = 0;
	let parallaxX = $state(0);
	let parallaxY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		mouseX = (e.clientX / window.innerWidth) * 2 - 1;
		mouseY = (e.clientY / window.innerHeight) * 2 - 1;
	}

	// ---- Interpolated values driven by scroll ----
	let posX = $state(-2.5);
	let posY = $state(0);
	let scale = $state(4);
	let rotX = $state(0);
	let rotY = $state(-0.5);

	// Cartridge pose — positions are in GBA-local units and multiplied by
	// `scale` in the template so the cart tracks the GBA at any zoom level.
	let cartVisible = $state(false);
	let cartX = $state(0.6);
	let cartY = $state(0.25);
	let cartZ = $state(-0.008);
	let cartRotX = $state(0);
	let cartRotZ = $state(0);

	// ---- Keyframe interpolation helper ----
	function lerp(stops: [number, number][], t: number): number {
		t = Math.max(0, Math.min(1, t));

		if (t <= stops[0][0]) return stops[0][1];

		for (let i = 1; i < stops.length; i++) {
			if (t <= stops[i][0]) {
				const ratio = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
				return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * ratio;
			}
		}

		return stops[stops.length - 1][1];
	}

	// ---- Per-frame update ----
	useTask((delta) => {
		// The clock always advances (the boot sequence needs it even under
		// reduced motion); only the decorative motion below is gated.
		elapsed += delta;

		if (!reducedMotion) {
			// Floating bob — subtle sine wave, always running
			floatY = Math.sin(elapsed * 1.2) * 0.08;
			floatRotZ = Math.sin(elapsed * 0.8) * 0.02;

			// Dust drifts in a slow orbit
			particleRotY += delta * 0.02;

			// Ease the parallax toward the mouse position (smooth follow)
			parallaxX += (mouseY * 0.06 - parallaxX) * Math.min(1, delta * 4);
			parallaxY += (mouseX * 0.08 - parallaxY) * Math.min(1, delta * 4);
		}

		// ---- Screen state ----
		// Boot when the cartridge seats; reset if the user scrolls back up
		// far enough that the cart has visibly popped back out.
		// Wall-clock timed so the sequence stays true even if rendering lags.
		const now = performance.now() / 1000;
		crtMaterial.uniforms.uTime.value = now;
		if (progress >= 0.68 && bootStart === null) {
			bootStart = now;
			bootDone = false;
		} else if (progress < 0.6 && bootStart !== null) {
			bootStart = null;
			screenIsOff = false; // force one redraw of the off state
		}

		if (bootStart !== null) {
			if (!bootDone) {
				bootDone = drawBootSequence(screenCtx, now - bootStart);
				screenTexture.needsUpdate = true;
				screenIsOff = false;
			}
		} else if (!screenIsOff) {
			drawScreenOff(screenCtx);
			screenTexture.needsUpdate = true;
			screenIsOff = true;
		}

		// Dust fades away during the final zoom so it never reads as noise
		if (particleMaterial) {
			particleMaterial.opacity = lerp([[0, 0.5], [0.7, 0.5], [0.95, 0]], progress);
		}

		// ---- GBA scroll keyframes ----
		posX = lerp([[0, -2.5], [0.25, 0], [1, 0]], progress);
		scale = lerp([[0, 4], [0.3, 10], [0.65, 10], [1, 24]], progress);
		rotY = lerp([[0, -0.5], [0.25, 0.3], [0.4, 1.2], [0.55, 2.8], [0.7, Math.PI * 2], [1, Math.PI * 2]], progress);
		rotX = lerp([[0, 0.1], [0.25, 0], [0.4, -0.15], [0.55, 0.05], [0.7, 0], [1, 0]], progress);
		posY = lerp([[0, -0.5], [0.25, 0], [0.4, 0.2], [0.7, 0], [1, 0.3]], progress);

		// ---- Cartridge keyframes (GBA-local units) ----
		// Hidden until the GBA starts showing its back, then: fly in from the
		// right while tumbling → hover above the slot → slide down into it.
		cartVisible = progress > 0.36;

		// Horizontal approach: far right → centered over the slot
		cartX = lerp([[0.38, 0.55], [0.56, 0], [1, 0]], progress);

		// Vertical: high above → hover at 0.16 → seated in the slot (0.047)
		cartY = lerp([[0.38, 0.3], [0.56, 0.16], [0.62, 0.16], [0.68, 0.047], [1, 0.047]], progress);

		// Sits against the back shell — deep enough that it can't be seen
		// through the (transmissive) screen glass from the front
		cartZ = -0.013;

		// Tumble that settles as it reaches the hover point
		cartRotX = lerp([[0.38, -1.2], [0.56, 0], [1, 0]], progress);
		cartRotZ = lerp([[0.38, 0.6], [0.56, 0], [1, 0]], progress);
	});
</script>

<svelte:window onmousemove={handleMouseMove} />

<!--
	CAMERA
	======
	Fixed perspective camera. No OrbitControls — the scroll drives everything.
-->
<T.PerspectiveCamera
	makeDefault
	position.x={0}
	position.y={0.5}
	position.z={6}
	fov={45}
/>

<!--
	LIGHTING
	========
	Three-point lighting for realistic PBR materials.
-->
<T.AmbientLight intensity={0.5} color="#e8dfd4" />

<T.DirectionalLight
	position.x={5}
	position.y={5}
	position.z={3}
	intensity={2}
	color="#ffeedd"
/>

<T.DirectionalLight
	position.x={-3}
	position.y={2}
	position.z={-2}
	intensity={0.6}
	color="#aaccdd"
/>

<T.DirectionalLight
	position.x={0}
	position.y={4}
	position.z={-5}
	intensity={0.8}
	color="#ffffff"
/>

<!--
	DUST PARTICLES
	==============
	Slow-orbiting gold dust for atmosphere. Sits behind the model group.
-->
<T.Points geometry={particleGeometry} rotation.y={particleRotY}>
	<T.PointsMaterial
		bind:ref={particleMaterial}
		color="#b3a07c"
		size={0.025}
		sizeAttenuation
		transparent
		opacity={0.5}
		depthWrite={false}
	/>
</T.Points>

<!--
	MODEL GROUP
	===========
	GBA + cartridge share this group, so the cartridge inherits the scroll
	rotation and the floating bob. Cartridge offsets are GBA-local units
	multiplied by the current scale.
-->
<T.Group
	position.x={posX}
	position.y={posY + floatY}
	rotation.x={rotX + parallaxX}
	rotation.y={rotY + parallaxY}
	rotation.z={floatRotZ}
>
	<GLTF
		url="/models/gba/gba.glb"
		{dracoLoader}
		scale={scale}
		onload={() => onready?.()}
	/>

	<!-- Always mounted (so the GLB preloads); shown once the story needs it -->
	<GLTF
		url="/models/gba/gba_cart.glb"
		{dracoLoader}
		visible={cartVisible}
		scale={scale}
		position.x={cartX * scale}
		position.y={cartY * scale}
		position.z={cartZ * scale}
		rotation.x={cartRotX}
		rotation.z={cartRotZ}
	/>

	<!-- Lens: a dark glossy pane inside the screen aperture. The GLB is a
	     hollow shell — without this you see straight into the empty body. -->
	<T.Mesh scale={scale} position.y={0.04 * scale} position.z={0.008 * scale}>
		<T.PlaneGeometry args={[0.08, 0.06]} />
		<T.MeshStandardMaterial color="#050807" roughness={0.25} metalness={0.2} />
	</T.Mesh>

	<!-- Screen plane — canvas texture through the CRT shader -->
	<T.Mesh
		material={crtMaterial}
		scale={scale}
		position.y={0.04 * scale}
		position.z={0.0105 * scale}
	>
		<T.PlaneGeometry args={[0.066, 0.044]} />
	</T.Mesh>
</T.Group>

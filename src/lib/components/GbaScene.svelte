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
	import { GLTF, Sparkles, interactivity } from '@threlte/extras';
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

	// Pointer events (raycasting) so the model itself is grabbable
	interactivity();

	// ---- Reduced motion ----
	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---- Smoothed scroll progress ----
	// The raw prop follows the scrollbar 1:1; the scene follows this eased
	// copy instead, so fast scrolling reads as weight, not teleporting.
	let sProgress = 0;

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

		if (dragging) {
			// Accumulate drag rotation from explicit position deltas —
			// e.movementX is 0 on some browsers/synthesized pointers.
			// Yaw-dominant: horizontal spin is the hero move, pitch is a nudge.
			dragRY += (e.clientX - lastPointerX) * 0.006;
			dragRX += (e.clientY - lastPointerY) * 0.003;
			lastPointerX = e.clientX;
			lastPointerY = e.clientY;
			// Keep it inspectable, not flippable into the void
			dragRY = Math.max(-2.4, Math.min(2.4, dragRY));
			dragRX = Math.max(-0.4, Math.min(0.4, dragRX));
		}
	}

	// ---- Drag to inspect ----
	// Grabbing the model adds rotation offsets on top of the scroll pose;
	// releasing springs them back to zero (slight overshoot), so the
	// scripted scroll animation always wins in the end.
	let dragging = $state(false);
	let dragRX = $state(0);
	let dragRY = $state(0);
	let velRX = 0;
	let velRY = 0;
	let lastPointerX = 0;
	let lastPointerY = 0;

	function startDrag(e: { stopPropagation: () => void; nativeEvent?: PointerEvent } & Partial<PointerEvent>) {
		e.stopPropagation();
		dragging = true;
		velRX = 0;
		velRY = 0;
		// Threlte interactivity events expose the DOM event's coordinates
		lastPointerX = e.clientX ?? 0;
		lastPointerY = e.clientY ?? 0;
		document.body.style.cursor = 'grabbing';
	}

	function endDrag() {
		if (!dragging) return;
		dragging = false;
		document.body.style.cursor = 'auto';
	}

	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
	});

	// ---- Interpolated values driven by scroll ----
	let posX = $state(2.2);
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

			// Ease the parallax toward the mouse position (smooth follow)
			parallaxX += (mouseY * 0.06 - parallaxX) * Math.min(1, delta * 4);
			parallaxY += (mouseX * 0.08 - parallaxY) * Math.min(1, delta * 4);
		}

		// Ease the scene toward the real scroll position (weight, not teleport).
		// Reduced motion tracks the scrollbar exactly — no trailing animation.
		sProgress = reducedMotion
			? progress
			: sProgress + (progress - sProgress) * Math.min(1, delta * 6);

		// Spring the drag offsets back to zero once released. A stiff,
		// lightly-damped spring gives a small overshoot — feels physical.
		if (!dragging && (dragRX !== 0 || dragRY !== 0)) {
			if (reducedMotion) {
				dragRX = 0;
				dragRY = 0;
			} else {
				const dt = Math.min(delta, 1 / 30);
				velRX += (-90 * dragRX - 12 * velRX) * dt;
				velRY += (-90 * dragRY - 12 * velRY) * dt;
				dragRX += velRX * dt;
				dragRY += velRY * dt;
				// Settle fully once the motion is imperceptible
				if (Math.abs(dragRX) < 0.001 && Math.abs(velRX) < 0.001) dragRX = 0;
				if (Math.abs(dragRY) < 0.001 && Math.abs(velRY) < 0.001) dragRY = 0;
			}
		}

		// ---- Screen state ----
		// Boot when the cartridge seats; reset if the user scrolls back up
		// far enough that the cart has visibly popped back out.
		// Wall-clock timed so the sequence stays true even if rendering lags.
		const now = performance.now() / 1000;
		crtMaterial.uniforms.uTime.value = now;
		if (sProgress >= 0.74 && bootStart === null) {
			bootStart = now;
			bootDone = false;
		} else if (sProgress < 0.66 && bootStart !== null) {
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

		// ---- GBA scroll keyframes (driven by the smoothed progress) ----
		// One deliberate sequence, no wandering:
		//   0.00–0.30  glide from the right to center stage, growing
		//   0.30–0.62  a single clean half-turn to face away (slot visible)
		//   0.50–0.74  cartridge enters close from the lower right, seats
		//   0.76–0.88  turn back around to face front (screen boots)
		//   0.88–1.00  full glamour zoom
		posX = lerp([[0, 2.2], [0.3, 0], [1, 0]], sProgress);
		scale = lerp([[0, 6.5], [0.3, 13], [0.85, 13], [1, 26]], sProgress);
		rotY = lerp([[0, 0.35], [0.3, 0], [0.38, 0], [0.62, Math.PI], [0.76, Math.PI], [0.88, Math.PI * 2], [1, Math.PI * 2]], sProgress);
		rotX = lerp([[0, 0.08], [0.3, 0], [0.55, -0.08], [0.74, 0], [1, 0]], sProgress);
		posY = lerp([[0, -0.2], [0.3, 0], [0.55, 0.12], [0.74, 0], [1, 0.3]], sProgress);

		// ---- Cartridge keyframes (GBA-local units) ----
		// Enters near the console (no distant speck): a short tumble up from
		// the lower right → hover above the slot → slide down into it.
		cartVisible = sProgress > 0.48;

		cartX = lerp([[0.5, 0.22], [0.64, 0], [1, 0]], sProgress);

		// Vertical: below the slot line → hover at 0.16 → seated (0.047)
		cartY = lerp([[0.5, -0.06], [0.6, 0.16], [0.66, 0.16], [0.74, 0.047], [1, 0.047]], sProgress);

		// Sits against the back shell — deep enough that it can't be seen
		// through the (transmissive) screen glass from the front
		cartZ = -0.013;

		// Tumble that settles as it reaches the hover point
		cartRotX = lerp([[0.5, -0.9], [0.64, 0], [1, 0]], sProgress);
		cartRotZ = lerp([[0.5, 0.5], [0.64, 0], [1, 0]], sProgress);
	});
</script>

<!-- Drag ends anywhere on the page, even if the pointer leaves the model -->
<svelte:window onmousemove={handleMouseMove} onpointerup={endDrag} onpointercancel={endDrag} />

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
	DUST
	====
	Soft glowing gold motes drifting through the scene (Threlte Sparkles).
-->
<Sparkles
	count={110}
	scale={[10, 5.5, 4]}
	size={2.4}
	speed={0.35}
	opacity={0.5}
	color="#b3a07c"
	position.z={-0.5}
/>

<!--
	MODEL GROUP
	===========
	GBA + cartridge share this group, so the cartridge inherits the scroll
	rotation and the floating bob. Cartridge offsets are GBA-local units
	multiplied by the current scale.
-->
<!-- The GLB's origin is at its BASE — rotating there swings the body like a
     pendulum. The outer group is raised to the model's center height and the
     children are lowered by the same amount, so all rotations (scroll, drag,
     parallax) pivot around the model's geometric center. -->
<T.Group
	position.x={posX}
	position.y={posY + floatY + 0.041 * scale}
	rotation.x={rotX + parallaxX + dragRX}
	rotation.y={rotY + parallaxY + dragRY}
	rotation.z={floatRotZ}
	onpointerdown={startDrag}
	onpointerenter={() => {
		if (!dragging) document.body.style.cursor = 'grab';
	}}
	onpointerleave={() => {
		if (!dragging) document.body.style.cursor = 'auto';
	}}
>
	<T.Group position.y={-0.041 * scale}>
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
</T.Group>

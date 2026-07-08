<!--
	ConsoleScene.svelte
	===================
	The interactive Work console. A GBA sits on the left; the projects are a
	stack of real 3D cartridges lying on the right (like a shelf of games),
	each with a procedural end-label sticker showing its name + year.

	The cartridges themselves are the clickable elements (Threlte
	interactivity/raycasting): hover lifts a cart, click picks it — the cart
	vanishes from the stack and drops into the GBA slot, the screen boots,
	and the camera dollies in to the project's title screen.

	Driven by props (parent owns selection state so HTML fallback buttons
	can drive the same flow):
	- `project`     : selected project (null = idle)
	- `insertToken` : increments on every pick — restarts the timeline
	- `screenshot`  : preloaded HTMLImageElement for the in-screen window
	- `onpick`      : called when a 3D cartridge is clicked

	TIMELINE per insert (wall-clock seconds after token change):
	  0.0–0.9  cartridge drops into the slot
	  0.9–2.4  screen boots (white flash → logo)
	  2.0–2.9  camera dollies in toward the screen
	  2.4+     project title screen, blinking PRESS START
-->

<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF, ContactShadows, interactivity, useGltf } from '@threlte/extras';
	import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
	import * as THREE from 'three';
	import { onDestroy } from 'svelte';
	import {
		createScreenCanvas,
		drawScreenOff,
		drawBootSequence,
		drawTitleScreen,
		createCartLabelCanvas
	} from '$lib/three/screen';
	import { createCrtMaterial } from '$lib/three/crtMaterial';
	import { projects, type Project } from '$lib/data/projects';

	let {
		project = null,
		insertToken = 0,
		ejectToken = 0,
		screenshot = null,
		onpick,
		oneject
	}: {
		project?: Project | null;
		insertToken?: number;
		ejectToken?: number;
		screenshot?: HTMLImageElement | null;
		onpick?: (project: Project) => void;
		oneject?: () => void;
	} = $props();

	// Enable pointer events (raycasting) on scene objects
	interactivity();

	// ---- Draco decoder ----
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath('/draco/');
	onDestroy(() => dracoLoader.dispose());

	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---- Layout constants ----
	const SCALE = 10;
	const GBA_X = -0.45; // console sits left of center
	const STACK_X = 0.72; // cartridge stack on the right
	const STACK_BASE = 0.05; // bottom cart height
	// Gap must exceed the pitched cart's vertical footprint
	// (thickness·cos + height·sin ≈ 0.14) or the carts interpenetrate
	const CART_GAP = 0.15;
	// Slight pitch toward the camera — enough to show the cart faces
	// without the stack clipping into itself
	const CART_PITCH = -Math.PI / 2 + 0.2;
	const FLIGHT_TIME = 1.25; // seconds for the stack↔slot flight

	// Small per-cart jitter so the stack looks hand-placed, not machined
	const JITTER = [
		{ x: 0.0, rotY: 0.09 },
		{ x: 0.03, rotY: -0.06 },
		{ x: -0.02, rotY: 0.04 },
		{ x: 0.02, rotY: -0.08 },
		{ x: -0.03, rotY: 0.05 }
	];

	// ---- Cartridge end labels (one CanvasTexture per project) ----
	const labelTextures = projects.map((p) => {
		const tex = new THREE.CanvasTexture(createCartLabelCanvas(p.title, p.year));
		tex.colorSpace = THREE.SRGBColorSpace;
		return tex;
	});
	onDestroy(() => labelTextures.forEach((t) => t.dispose()));

	// ---- Cartridge model, loaded ONCE and cloned per instance ----
	// A THREE object can only have one parent, and Threlte caches GLTFs by
	// URL — mounting the same GLB in several places silently re-parents one
	// instance around. Clones (shared geometry/materials) fix that.
	const cartGltf = useGltf('/models/gba/gba_cart.glb', { dracoLoader });
	const stackCarts = $derived($cartGltf ? projects.map(() => $cartGltf.scene.clone(true)) : null);
	const insertCart = $derived($cartGltf ? $cartGltf.scene.clone(true) : null);

	// ---- Screen canvas ----
	const { canvas: screenCanvas, ctx: screenCtx } = createScreenCanvas();
	const screenTexture = new THREE.CanvasTexture(screenCanvas);
	screenTexture.colorSpace = THREE.SRGBColorSpace;
	drawScreenOff(screenCtx);
	screenTexture.needsUpdate = true;

	// CRT shader scoped to the screen plane only
	const crtMaterial = createCrtMaterial(screenTexture);
	onDestroy(() => {
		screenTexture.dispose();
		crtMaterial.dispose();
	});

	// ---- Timeline state (wall-clock, frame-rate independent) ----
	let phaseStart = 0;
	let ejectStart = 0;
	let lastInsertToken = -1;
	let lastEjectToken = 0;
	let mode: 'in' | 'out' = 'in';

	// ---- Animated values ----
	let floatY = $state(0);
	let camX = $state(0);
	let camY = $state(0.55);
	let camZ = $state(2.7);

	// Flying cart pose (world space): stack → arc over the GBA → into the slot
	let fx = $state(0);
	let fy = $state(0);
	let fz = $state(0);
	let frx = $state(0);
	let fry = $state(0);
	let frz = $state(0);

	const selIndex = $derived(project ? projects.findIndex((p) => p.title === project.title) : -1);

	// ---- Hover ----
	// The hovered cart slides OUT toward the camera (eased, never snapped).
	// Sliding along the view axis keeps the cart under the pointer — a
	// vertical lift moves it off the ray, hover flips to the neighbor, and
	// the whole stack looks like it's wobbling.
	let hovered: number | null = $state(null);
	let slides = $state(projects.map(() => 0));

	function setHover(i: number | null) {
		hovered = i;
		document.body.style.cursor = i === null ? 'auto' : 'pointer';
	}
	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
	});

	function easeOutCubic(t: number): number {
		t = Math.max(0, Math.min(1, t));
		return 1 - Math.pow(1 - t, 3);
	}

	function easeInOut(t: number): number {
		t = Math.max(0, Math.min(1, t));
		return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	}

	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * Math.max(0, Math.min(1, t));
	}

	// Cart poses (world space)
	function stackPose(i: number) {
		const jit = JITTER[i % JITTER.length];
		return {
			x: STACK_X + jit.x,
			y: STACK_BASE + i * CART_GAP,
			z: 0.1,
			rx: CART_PITCH,
			ry: jit.rotY,
			rz: Math.PI
		};
	}

	// ---- Flight path ----
	// One smooth Catmull-Rom curve per flight: rise off the stack, cross
	// ABOVE the console (the body tops out at y≈0.84 — every waypoint keeps
	// the cart clear of it), then descend vertically into the slot. A single
	// eased parameter over the whole curve = no stop-start between phases.
	function buildFlightCurve(i: number, seatedY: number, reverse: boolean) {
		const s = stackPose(i);
		const pts = [
			new THREE.Vector3(s.x, s.y, s.z),
			new THREE.Vector3(s.x - 0.1, 1.05, 0.25),
			new THREE.Vector3(GBA_X + 0.35, 1.18, 0.05),
			new THREE.Vector3(GBA_X, 0.98, -0.13),
			new THREE.Vector3(GBA_X, seatedY, -0.13)
		];
		if (reverse) pts.reverse();
		return new THREE.CatmullRomCurve3(pts);
	}
	let flightCurve: THREE.CatmullRomCurve3 | null = null;

	useTask((delta) => {
		const clock = performance.now() / 1000;
		crtMaterial.uniforms.uTime.value = clock;

		const seatedYNow = 0.02 + floatY + 0.047 * SCALE;

		if (insertToken !== lastInsertToken) {
			lastInsertToken = insertToken;
			mode = 'in';
			if (selIndex >= 0) flightCurve = buildFlightCurve(selIndex, seatedYNow, false);
			// Reduced motion: jump straight to the seated/booted state
			phaseStart = reducedMotion ? clock - 99 : clock;
		}
		if (ejectToken !== lastEjectToken) {
			lastEjectToken = ejectToken;
			mode = 'out';
			if (selIndex >= 0) flightCurve = buildFlightCurve(selIndex, seatedYNow, true);
			ejectStart = reducedMotion ? clock - 99 : clock;
		}

		if (!reducedMotion) {
			floatY = Math.sin(clock * 1.1) * 0.015;
		}

		// Ease each stack cart's slide-out toward its target
		slides = slides.map((v, i) => {
			const target = hovered === i && project?.title !== projects[i].title ? 0.14 : 0;
			return v + (target - v) * Math.min(1, delta * 9);
		});

		if (!project || selIndex < 0) {
			camX = 0;
			camY = 0.55;
			camZ = 2.7;
			drawScreenOff(screenCtx);
			screenTexture.needsUpdate = true;
			return;
		}

		const start = stackPose(selIndex);

		if (mode === 'in') {
			const t = clock - phaseStart;
			const k = easeInOut(t / FLIGHT_TIME);

			if (flightCurve && k < 1) {
				const p = flightCurve.getPointAt(k);
				fx = p.x;
				fy = p.y;
				fz = p.z;
			} else {
				// Seated — track the console's float bob
				fx = GBA_X;
				fy = seatedYNow;
				fz = -0.13;
			}

			// Flip upright during the middle of the flight
			const rk = easeInOut((k - 0.15) / 0.55);
			frx = lerp(start.rx, 0, rk);
			fry = lerp(start.ry, 0, rk);
			frz = lerp(start.rz, 0, rk);

			// Camera dolly: 2.4 – 3.3s (wide two-shot → close on the screen)
			const dolly = easeOutCubic((t - 2.4) / 0.9);
			camX = lerp(0, GBA_X, dolly);
			camY = lerp(0.55, 0.44, dolly);
			camZ = lerp(2.7, 1.15, dolly);

			// Screen: off → boot (sped up 1.4×) → title
			if (t < FLIGHT_TIME + 0.1) {
				drawScreenOff(screenCtx);
			} else if (t < FLIGHT_TIME + 1.67) {
				drawBootSequence(screenCtx, (t - FLIGHT_TIME - 0.1) * 1.4);
			} else {
				drawTitleScreen(screenCtx, project, t, screenshot);
			}
			screenTexture.needsUpdate = true;
		} else {
			// ---- EJECT: same curve, reversed ----
			const t = clock - ejectStart;
			const k = easeInOut(t / FLIGHT_TIME);

			if (flightCurve && k < 1) {
				const p = flightCurve.getPointAt(k);
				fx = p.x;
				fy = p.y;
				fz = p.z;
			} else {
				fx = start.x;
				fy = start.y;
				fz = start.z;
			}

			// Flip back to the lying stack pose mid-flight
			const rk = easeInOut((k - 0.3) / 0.55);
			frx = lerp(0, start.rx, rk);
			fry = lerp(0, start.ry, rk);
			frz = lerp(0, start.rz, rk);

			// Camera pulls back out while the cart leaves
			const dolly = easeOutCubic(t / 0.8);
			camX = lerp(GBA_X, 0, dolly);
			camY = lerp(0.44, 0.55, dolly);
			camZ = lerp(1.15, 2.7, dolly);

			// Power off instantly
			drawScreenOff(screenCtx);
			screenTexture.needsUpdate = true;
		}
	});
</script>

<T.PerspectiveCamera makeDefault position.x={camX} position.y={camY} position.z={camZ} fov={45} />

<!-- Same lighting family as the hero, slightly softer -->
<T.AmbientLight intensity={0.6} color="#e8dfd4" />
<T.DirectionalLight position.x={4} position.y={5} position.z={4} intensity={1.8} color="#ffeedd" />
<T.DirectionalLight position.x={-3} position.y={2} position.z={-2} intensity={0.5} color="#aaccdd" />
<T.DirectionalLight position.x={0} position.y={4} position.z={-5} intensity={0.7} color="#ffffff" />

<!-- Soft ground shadow so console + carts feel placed, not floating -->
<ContactShadows scale={5} blur={2.5} opacity={0.4} far={1.4} />

<!-- ============ GBA CONSOLE ============ -->
<T.Group position.x={GBA_X} position.y={floatY + 0.02}>
	<GLTF url="/models/gba/gba.glb" {dracoLoader} scale={SCALE} />

	<!-- Lens: a dark glossy pane inside the screen aperture. The GLB is a
	     hollow shell — without this you see straight into the empty body. -->
	<T.Mesh scale={SCALE} position.y={0.04 * SCALE} position.z={0.008 * SCALE}>
		<T.PlaneGeometry args={[0.08, 0.06]} />
		<T.MeshStandardMaterial color="#050807" roughness={0.25} metalness={0.2} />
	</T.Mesh>

	<!-- Screen plane — canvas texture through the CRT shader -->
	<T.Mesh material={crtMaterial} scale={SCALE} position.y={0.04 * SCALE} position.z={0.0105 * SCALE}>
		<T.PlaneGeometry args={[0.066, 0.044]} />
	</T.Mesh>
</T.Group>

<!-- The travelling cartridge: flies stack → slot on insert, back on eject.
     Clicking it while inserted ejects it. -->
{#if insertCart}
	<T
		is={insertCart}
		visible={project !== null}
		scale={SCALE}
		position.x={fx}
		position.y={fy}
		position.z={fz}
		rotation.x={frx}
		rotation.y={fry}
		rotation.z={frz}
		onclick={(e: { stopPropagation: () => void }) => {
			e.stopPropagation();
			oneject?.();
			setHover(null);
		}}
		onpointerenter={() => (document.body.style.cursor = 'pointer')}
		onpointerleave={() => (document.body.style.cursor = 'auto')}
	/>
{/if}

<!-- ============ CARTRIDGE STACK (the project picker) ============ -->
{#each projects as p, i}
	{@const jitter = JITTER[i % JITTER.length]}
	<!-- Outer group: shelf position + yaw jitter. The hovered cart slides out
	     toward the camera. Hidden while "its" cart is inserted. -->
	<T.Group
		position.x={STACK_X + jitter.x}
		position.y={STACK_BASE + i * CART_GAP}
		position.z={0.1 + slides[i]}
		rotation.y={jitter.rotY}
		visible={project?.title !== p.title}
		onclick={(e: { stopPropagation: () => void }) => {
			e.stopPropagation();
			onpick?.(p);
			setHover(null);
		}}
		onpointerenter={() => setHover(i)}
		onpointerleave={() => setHover(null)}
	>
		<!-- Inner group: lay the cart down — front face up-toward-camera, grip
		     edge (and its end label) facing out, like a stack of games on a desk -->
		<T.Group rotation.x={CART_PITCH} rotation.z={Math.PI}>
			{#if stackCarts}
				<T is={stackCarts[i]} scale={SCALE} />
			{/if}

			<!-- End-label sticker on the grip edge -->
			<T.Mesh position.y={0.356} position.z={-0.0115} rotation.x={-Math.PI / 2} rotation.z={Math.PI}>
				<T.PlaneGeometry args={[0.54, 0.066]} />
				<T.MeshBasicMaterial map={labelTextures[i]} toneMapped={false} />
			</T.Mesh>
		</T.Group>
	</T.Group>
{/each}

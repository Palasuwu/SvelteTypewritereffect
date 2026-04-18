<!--
	GbaScene.svelte
	================
	A scroll-driven 3D scene. Instead of drag interaction, the model's position,
	rotation, and scale are controlled by a `progress` prop (0 to 1) that maps
	to how far the user has scrolled through the hero track.

	SCROLL KEYFRAMES (what happens as progress goes 0 → 1):
	  0.0  — Model small, positioned to the left, angled
	  0.3  — Model moves to center, scales up, rotates to front view
	  0.5  — Model centered and large, slight tilt to show detail
	  0.7  — Model rotates to show the back / side
	  1.0  — Model returns to a glamour angle, fully zoomed

	The floating bob animation runs independently on top of the scroll pose.
-->

<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF } from '@threlte/extras';

	// ---- Props ----
	// `progress` is a 0–1 value driven by the parent's scroll position.
	let { progress = 0 }: { progress?: number } = $props();

	// ---- Floating animation (runs on top of scroll pose) ----
	let floatY = $state(0);
	let floatRotZ = $state(0);
	let elapsed = 0;

	// ---- Interpolated values driven by scroll ----
	let posX = $state(-2.5);
	let posY = $state(0);
	let scale = $state(4);
	let rotX = $state(0);
	let rotY = $state(-0.5);

	// ---- Keyframe interpolation helper ----
	// Given a set of stops like [[0, val], [0.3, val], [0.7, val], [1, val]],
	// returns the linearly interpolated value at `t`.
	// This is the core of the scroll animation — each property has its own
	// set of keyframes, and this function smoothly blends between them.
	function lerp(stops: [number, number][], t: number): number {
		// Clamp t to 0–1 range
		t = Math.max(0, Math.min(1, t));

		// If before the first stop, return its value
		if (t <= stops[0][0]) return stops[0][1];

		// Walk through stops to find which two we're between
		for (let i = 1; i < stops.length; i++) {
			if (t <= stops[i][0]) {
				// Calculate how far we are between these two stops (0–1)
				const ratio = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
				// Linearly blend the two values
				return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * ratio;
			}
		}

		// Past the last stop
		return stops[stops.length - 1][1];
	}

	// ---- Per-frame update ----
	useTask((delta) => {
		elapsed += delta;

		// Floating bob — subtle sine wave, always running
		floatY = Math.sin(elapsed * 1.2) * 0.08;
		floatRotZ = Math.sin(elapsed * 0.8) * 0.02;

		// ---- Scroll-driven keyframes ----
		// X position: starts left (-2.5), moves to center (0) by 25%, stays centered
		posX = lerp([[0, -2.5], [0.25, 0], [1, 0]], progress);

		// Scale: starts small (4), grows to 10 by 30%, then zooms in to 18 at the end
		// The final zoom makes the screen fill with the model
		scale = lerp([[0, 4], [0.3, 10], [0.65, 10], [1, 24]], progress);

		// Y rotation: starts angled, shows sides in the middle, ends facing front (0)
		rotY = lerp([[0, -0.5], [0.25, 0.3], [0.4, 1.2], [0.55, 2.8], [0.7, Math.PI * 2], [1, Math.PI * 2]], progress);

		// X rotation: subtle tilt changes, ends flat (front-facing)
		rotX = lerp([[0, 0.1], [0.25, 0], [0.4, -0.15], [0.55, 0.05], [0.7, 0], [1, 0]], progress);

		// Y position: scroll-driven vertical shift
		posY = lerp([[0, -0.5], [0.25, 0], [0.4, 0.2], [0.7, 0], [1, 0.3]], progress);
	});
</script>

<!--
	CAMERA
	======
	Fixed perspective camera. No OrbitControls — the scroll drives everything.
	fov 45 gives a natural perspective without too much distortion.
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
	Three-point lighting for realistic PBR materials:
	1. Ambient: soft fill so shadows aren't pure black
	2. Key (top-right): warm main light, casts shadows
	3. Fill (left): cooler, softer, adds dimension
	4. Rim (behind): white edge light separates model from background
-->
<T.AmbientLight intensity={0.5} color="#e8dfd4" />

<T.DirectionalLight
	position.x={5}
	position.y={5}
	position.z={3}
	intensity={2}
	color="#ffeedd"
	castShadow
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
	MODEL GROUP
	===========
	Position, rotation, and scale are all reactive and update every frame
	based on the scroll progress keyframes + floating bob offset.
-->
<T.Group
	position.x={posX}
	position.y={posY + floatY}
	rotation.x={rotX}
	rotation.y={rotY}
	rotation.z={floatRotZ}
>
	<GLTF url="/models/gba/gba.glb" scale={scale} />
</T.Group>

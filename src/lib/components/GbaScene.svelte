<!--
	GbaScene.svelte
	================
	A full-screen 3D hero scene that loads a GBA model, makes it float with a
	gentle bobbing animation, and lets the user drag to rotate it. When the user
	releases, the model slowly springs back to its resting position.

	DEPENDENCIES: @threlte/core, @threlte/extras, three

	HOW IT WORKS:
	1. A Threlte <Canvas> fills the hero section.
	2. The GBA .glb model is loaded with <GLTF> from @threlte/extras.
	3. Every frame (useTask), we:
	   - Compute a floating Y offset using a sine wave.
	   - If dragging: apply drag delta directly to rotation.
	   - If not dragging: spring the rotation back to the resting pose.
	4. Lighting uses a combination of ambient + directional + a rim light
	   to give the model depth and make the textures pop.
-->

<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF } from '@threlte/extras';
	import { spring } from 'svelte/motion';

	// ---- Resting rotation ----
	// The "home" position the model returns to after dragging.
	const REST_ROT_X = 0;
	const REST_ROT_Y = 0.4;

	// ---- Drag state ----
	// Tracks whether the user is currently dragging and the last mouse position.
	let isDragging = $state(false);
	let lastPointerX = 0;
	let lastPointerY = 0;

	// ---- Rotation springs ----
	// Springs give us smooth interpolation. When dragging, we set them instantly
	// (high stiffness). When released, they ease back to resting position with
	// a soft, organic spring (low stiffness, moderate damping).
	const dragRotX = spring(REST_ROT_X, { stiffness: 0.08, damping: 0.7 });
	const dragRotY = spring(REST_ROT_Y, { stiffness: 0.08, damping: 0.7 });

	// ---- Floating animation state ----
	let floatY = $state(0);
	let floatRotZ = $state(0);
	let elapsed = 0;

	// ---- Mouse/touch handlers ----
	// On pointer down, record the starting position and switch to drag mode.
	function handlePointerDown(event: PointerEvent) {
		isDragging = true;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;

		// Make the spring respond instantly while dragging
		dragRotX.stiffness = 1;
		dragRotX.damping = 1;
		dragRotY.stiffness = 1;
		dragRotY.damping = 1;
	}

	// On pointer move, calculate how far the mouse moved and apply that
	// as rotation. We scale the pixel delta down so it feels natural.
	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;

		const deltaX = event.clientX - lastPointerX;
		const deltaY = event.clientY - lastPointerY;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;

		// Horizontal drag → Y rotation, vertical drag → X rotation
		// 0.005 is the sensitivity factor — adjust for faster/slower rotation
		dragRotY.set($dragRotY + deltaX * 0.005, { hard: true });
		dragRotX.set($dragRotX + deltaY * -0.005, { hard: true });
	}

	// On pointer up, switch back to soft springs and snap back to rest.
	function handlePointerUp() {
		isDragging = false;

		// Restore soft spring settings for the return animation
		dragRotX.stiffness = 0.04;
		dragRotX.damping = 0.6;
		dragRotY.stiffness = 0.04;
		dragRotY.damping = 0.6;

		// Spring back to resting position
		dragRotX.set(REST_ROT_X);
		dragRotY.set(REST_ROT_Y);
	}

	// ---- Per-frame update ----
	// useTask runs every frame (like requestAnimationFrame) within Threlte's
	// render loop. `delta` is the time since the last frame in seconds.
	useTask((delta) => {
		elapsed += delta;

		// Floating bob: a gentle sine wave on Y, and a very subtle Z tilt.
		// These run continuously regardless of drag state.
		floatY = Math.sin(elapsed * 1.2) * 0.15;
		floatRotZ = Math.sin(elapsed * 0.8) * 0.03;
	});
</script>

<!-- Capture pointer events across the full viewport for drag behavior -->
<svelte:window
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
/>

<!--
	CAMERA
	======
	A perspective camera positioned in front of and slightly above the model.
	`fov: 50` gives a balanced field of view for product-style framing.
	`makeDefault` tells Threlte to use this as the active camera.
-->
<T.PerspectiveCamera
	makeDefault
	position.x={0}
	position.y={1}
	position.z={6}
	fov={50}
/>

<!--
	LIGHTING
	========
	Three-point lighting setup for realistic materials:

	1. Ambient light: fills in shadows so nothing is pure black.
	2. Key light (directional): main light source, warm-tinted to match
	   the gold (#938160) palette. Positioned top-right.
	3. Fill light (directional): softer, cooler light from the opposite
	   side to add dimension.
	4. Rim/back light: positioned behind and above to create edge
	   highlights that separate the model from the background.
-->
<T.AmbientLight intensity={0.4} color="#e8dfd4" />

<T.DirectionalLight
	position.x={5}
	position.y={5}
	position.z={3}
	intensity={1.8}
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
	We wrap the GLTF in a <T.Group> so we can apply the floating Y position
	and drag rotation as a single transform. The rotation values come from
	springs, so they animate smoothly — snapping during drag, easing back
	to rest on release.

	The onpointerdown event is on the group so dragging only starts when
	the user clicks on the actual 3D model, not empty space.
-->
<T.Group
	position.y={floatY}
	rotation.x={$dragRotX}
	rotation.y={$dragRotY}
	rotation.z={floatRotZ}
	onpointerdown={handlePointerDown}
>
	<!--
		GLTF MODEL
		==========
		Loads the .glb file from the static folder. The `url` path is relative
		to the `static/` directory because SvelteKit serves it at the root.

		scale={10} sizes the model to fill the hero section nicely.

		The textures (gba_bcolor.png, gba_norm.png, etc.) must be in the same
		folder as the .glb, or embedded in the .glb itself. GLB (binary glTF)
		typically embeds textures, but if the model references them externally,
		they need to be co-located at the same path.
	-->
	<GLTF url="/models/gba/gba.glb" scale={10} />
</T.Group>

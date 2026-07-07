/**
 * crtMaterial.ts
 * ==============
 * A CRT post-effect as a THREE.ShaderMaterial applied ONLY to the GBA screen
 * plane — not a fullscreen pass, so the rest of the scene (model, particles,
 * background) is untouched.
 *
 * Effect recipe adapted from gingerbeardman/webgl-crt-shader (MIT):
 * barrel curvature via curveRemapUV, sin-based scanlines, quadratic vignette,
 * slight RGB shift, and a high-frequency flicker. Tuned down to read as a
 * handheld LCD-meets-CRT rather than a heavy arcade monitor.
 */

import * as THREE from 'three';

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform sampler2D uMap;
	uniform float uTime;
	varying vec2 vUv;

	// Barrel distortion: push UVs outward more near the edges
	vec2 curveRemapUV(vec2 uv) {
		uv = uv * 2.0 - 1.0;
		vec2 offset = abs(uv.yx) / vec2(6.5, 5.0);
		uv = uv + uv * offset * offset;
		return uv * 0.5 + 0.5;
	}

	void main() {
		vec2 uv = curveRemapUV(vUv);

		// Outside the curved tube: dark bezel
		if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
			gl_FragColor = vec4(0.015, 0.025, 0.024, 1.0);
			return;
		}

		vec3 col = texture2D(uMap, uv).rgb;

		// Slight RGB shift (chromatic fringing)
		float shift = 0.0012;
		col.r = texture2D(uMap, vec2(uv.x + shift, uv.y)).r;
		col.b = texture2D(uMap, vec2(uv.x - shift, uv.y)).b;

		// Scanlines — ~160 lines, like the GBA's vertical resolution
		float scan = 0.5 + 0.5 * abs(sin(uv.y * 160.0 * 3.14159));
		col *= mix(1.0, scan, 0.30);

		// Vignette
		vec2 c = uv * 2.0 - 1.0;
		col *= 1.0 - dot(c, c) * 0.22;

		// Subtle flicker
		col *= 1.0 + sin(uTime * 110.0) * 0.008;

		// Compensate the scanline darkening
		col *= 1.18;

		gl_FragColor = vec4(col, 1.0);
	}
`;

export function createCrtMaterial(map: THREE.Texture): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		uniforms: {
			uMap: { value: map },
			uTime: { value: 0 }
		},
		vertexShader,
		fragmentShader
	});
}

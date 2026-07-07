/**
 * screen.ts
 * =========
 * Everything drawn "inside" the GBA screen lives here. The screen is a 480×320
 * offscreen canvas used as a THREE.CanvasTexture on a plane sitting in the
 * GBA's screen aperture.
 *
 * Three states:
 *   drawScreenOff()      — dark, unpowered LCD
 *   drawBootSequence(t)  — white flash → logo drop → tagline (the DMG moment)
 *   drawTitleScreen(...) — per-project "game title screen" with blinking START
 *
 * All text uses drawPixelText: rendered tiny, upscaled 4× with smoothing off,
 * so it looks like authentic chunky console pixels at any zoom.
 */

import type { Project } from '$lib/data/projects';

export const SCREEN_W = 480;
export const SCREEN_H = 320;

// Palette (matches the site)
const TEAL_DARK = '#013b3f';
const TEAL_SCREEN = '#0b3236';
const GOLD = '#938160';
const GOLD_BRIGHT = '#b3a07c';
const MIST = '#cccccc';
const BOOT_BG = '#e9f0e2'; // pale green-white, like the original DMG boot

export function createScreenCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	const canvas = document.createElement('canvas');
	canvas.width = SCREEN_W;
	canvas.height = SCREEN_H;
	const ctx = canvas.getContext('2d')!;
	return { canvas, ctx };
}

// ---- Pixel text ----
// Draws text at 1/4 size on a shared scratch canvas, then blits it up 4×
// with image smoothing disabled → crisp chunky pixels.
let scratch: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function drawPixelText(
	ctx: CanvasRenderingContext2D,
	text: string,
	cx: number,
	cy: number,
	size: number,
	color: string
) {
	if (!scratch) {
		scratch = document.createElement('canvas');
		scratch.width = SCREEN_W / 4;
		scratch.height = SCREEN_H / 4;
		scratchCtx = scratch.getContext('2d')!;
	}
	const s = scratchCtx!;
	s.clearRect(0, 0, scratch.width, scratch.height);
	s.font = `bold ${Math.round(size / 4)}px monospace`;
	s.textAlign = 'center';
	s.textBaseline = 'middle';
	s.fillStyle = color;
	s.fillText(text, scratch.width / 2, scratch.height / 2);

	ctx.save();
	ctx.imageSmoothingEnabled = false;
	// Blit the scratch canvas centered on (cx, cy)
	ctx.drawImage(
		scratch,
		0,
		0,
		scratch.width,
		scratch.height,
		cx - SCREEN_W / 2,
		cy - SCREEN_H / 2,
		SCREEN_W,
		SCREEN_H
	);
	ctx.restore();
}

// ---- Easing ----
function easeOutCubic(t: number): number {
	t = Math.max(0, Math.min(1, t));
	return 1 - Math.pow(1 - t, 3);
}

// ---- OFF ----
export function drawScreenOff(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = '#141d1b';
	ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
	// Faint diagonal sheen so it reads as glass, not a hole
	const g = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
	g.addColorStop(0, 'rgba(255,255,255,0.05)');
	g.addColorStop(0.4, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

// ---- BOOT ----
// Timeline (seconds):
//   0.00–0.12  hard white flash
//   0.12–1.00  logo drops from above to center
//   1.00–1.50  tagline fades in
//   1.50–2.20  shimmer sweeps across the logo
// Returns true once the sequence has fully played out.
//
// PLACEHOLDER LOGO: swap the drawPixelText call marked below for a
// ctx.drawImage(yourLogoImage, ...) once a real logo asset exists.
export function drawBootSequence(ctx: CanvasRenderingContext2D, t: number): boolean {
	if (t < 0.12) {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
		return false;
	}

	ctx.fillStyle = BOOT_BG;
	ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

	// Logo drop: from y=-40 down to center
	const drop = easeOutCubic((t - 0.12) / 0.88);
	const logoY = -40 + drop * (SCREEN_H / 2 - 10 + 40);

	// >>> PLACEHOLDER LOGO — replace with drawImage(logo) when provided <<<
	drawPixelText(ctx, 'PALA™', SCREEN_W / 2, logoY, 56, TEAL_DARK);

	// Tagline fade
	if (t > 1.0) {
		const fade = Math.min(1, (t - 1.0) / 0.5);
		ctx.save();
		ctx.globalAlpha = fade;
		drawPixelText(ctx, 'DESIGN & DEVELOPMENT', SCREEN_W / 2, SCREEN_H / 2 + 42, 16, GOLD);
		ctx.restore();
	}

	// Shimmer: a translucent diagonal band sweeping left → right
	if (t > 1.5 && t < 2.2) {
		const sweep = (t - 1.5) / 0.7;
		const x = -100 + sweep * (SCREEN_W + 200);
		ctx.save();
		ctx.globalAlpha = 0.35;
		const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
		g.addColorStop(0, 'rgba(255,255,255,0)');
		g.addColorStop(0.5, 'rgba(255,255,255,1)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(x - 40, 0, 80, SCREEN_H);
		ctx.restore();
	}

	return t >= 2.2;
}

// ---- PROJECT TITLE SCREEN ----
// A "game title screen" for one project: dithered backdrop, pixel title,
// screenshot window (pixelated if provided), tags, blinking PRESS START.
export function drawTitleScreen(
	ctx: CanvasRenderingContext2D,
	project: Project,
	t: number,
	screenshot: HTMLImageElement | null
) {
	// Backdrop with a subtle dither checker
	ctx.fillStyle = TEAL_SCREEN;
	ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
	ctx.fillStyle = 'rgba(1, 59, 63, 0.55)';
	for (let y = 0; y < SCREEN_H; y += 8) {
		for (let x = (y / 8) % 2 === 0 ? 0 : 8; x < SCREEN_W; x += 16) {
			ctx.fillRect(x, y, 8, 8);
		}
	}

	// Year, top-left corner
	drawPixelText(ctx, project.year, 60, 26, 14, MIST);

	// Title — shrink to fit longer names
	const titleSize = project.title.length > 14 ? 26 : 36;
	drawPixelText(ctx, project.title.toUpperCase(), SCREEN_W / 2, 62, titleSize, GOLD_BRIGHT);

	// Screenshot window
	const winW = 300;
	const winH = 150;
	const winX = (SCREEN_W - winW) / 2;
	const winY = 92;

	ctx.strokeStyle = GOLD;
	ctx.lineWidth = 3;
	ctx.strokeRect(winX - 1.5, winY - 1.5, winW + 3, winH + 3);

	if (screenshot) {
		// Pixelate: draw tiny, then blow up with smoothing off
		if (!scratch) {
			scratch = document.createElement('canvas');
			scratch.width = SCREEN_W / 4;
			scratch.height = SCREEN_H / 4;
			scratchCtx = scratch.getContext('2d')!;
		}
		const s = scratchCtx!;
		s.clearRect(0, 0, winW / 4, winH / 4);
		s.drawImage(screenshot, 0, 0, winW / 4, winH / 4);
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(scratch, 0, 0, winW / 4, winH / 4, winX, winY, winW, winH);
		ctx.restore();
	} else {
		// No screenshot yet: diagonal stripes + label
		ctx.save();
		ctx.beginPath();
		ctx.rect(winX, winY, winW, winH);
		ctx.clip();
		ctx.strokeStyle = 'rgba(147, 129, 96, 0.25)';
		ctx.lineWidth = 6;
		for (let x = -winH; x < winW; x += 24) {
			ctx.beginPath();
			ctx.moveTo(winX + x, winY + winH);
			ctx.lineTo(winX + x + winH, winY);
			ctx.stroke();
		}
		ctx.restore();
		drawPixelText(ctx, 'NO VISUAL DATA', SCREEN_W / 2, winY + winH / 2, 16, MIST);
	}

	// Tags row under the window
	drawPixelText(ctx, project.tags.slice(0, 3).join('  ·  ').toUpperCase(), SCREEN_W / 2, 262, 13, MIST);

	// Blinking PRESS START (1.1 Hz, classic duty cycle)
	if (t % 0.9 < 0.55) {
		drawPixelText(ctx, '▶ PRESS START', SCREEN_W / 2, 294, 18, GOLD_BRIGHT);
	}
}

// ---- CARTRIDGE END LABEL ----
// The little spine sticker on a cartridge's grip edge (like a shelf of games
// viewed from the front). 512×56, drawn pixelated: a gold "GBA · YEAR" block
// on the left, project title on the right.
export function createCartLabelCanvas(title: string, year: string): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 56;
	const ctx = canvas.getContext('2d')!;

	// Draw small (128×14) then upscale 4× with smoothing off for chunky pixels
	const small = document.createElement('canvas');
	small.width = 128;
	small.height = 14;
	const s = small.getContext('2d')!;

	// Sticker background
	s.fillStyle = '#14110c';
	s.fillRect(0, 0, 128, 14);

	// Left block: GBA-style badge
	s.fillStyle = GOLD;
	s.fillRect(1, 1, 30, 12);
	s.font = 'bold 7px monospace';
	s.textBaseline = 'middle';
	s.textAlign = 'center';
	s.fillStyle = TEAL_DARK;
	s.fillText(year, 16, 8);

	// Title, truncated to fit
	let text = title.toUpperCase();
	if (text.length > 15) text = text.slice(0, 14) + '…';
	s.font = 'bold 8px monospace';
	s.textAlign = 'left';
	s.fillStyle = GOLD_BRIGHT;
	s.fillText(text, 35, 8);

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(small, 0, 0, 128, 14, 0, 0, 512, 56);
	return canvas;
}

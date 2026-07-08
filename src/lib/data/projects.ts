/**
 * Project data for the Work section (the GBA cartridge stack).
 * Edit this file to add / remove / reorder projects — the 3D stack,
 * end labels, and in-screen title screens all update automatically.
 *
 * NOTE: "Neon Drift" and "Dungeon Ledger" are PLACEHOLDER projects with
 * generated pixel-art screenshots — replace them with your real work.
 */

export interface Project {
	title: string;
	description: string;
	tags: string[];
	link: string;
	year: string;
	/** Optional screenshot — path under /static, e.g. '/projects/my-app.png' (~1200×750). */
	image?: string;
}

export const projects: Project[] = [
	{
		title: 'This Portfolio',
		description:
			'A scroll-driven cinematic portfolio: a Draco-compressed GBA model animated through keyframes as you scroll, with CSS scroll-driven text reveals.',
		tags: ['SvelteKit', 'Threlte', 'Three.js', 'Tailwind'],
		link: 'https://github.com/Palasuwu',
		year: '2026',
		image: '/projects/portfolio.png'
	},
	{
		title: 'Neon Drift',
		description:
			'Placeholder — a synthwave endless-runner prototype: procedural terrain, one-thumb controls, steady 60fps on modest hardware.',
		tags: ['Canvas', 'Game Dev', 'TypeScript'],
		link: 'https://github.com/Palasuwu',
		year: '2025',
		image: '/projects/neon-drift.png'
	},
	{
		title: 'Dungeon Ledger',
		description:
			'Placeholder — a cozy inventory tracker for tabletop campaigns. Local-first and offline-friendly; syncs when you are.',
		tags: ['Svelte', 'PWA', 'IndexedDB'],
		link: 'https://github.com/Palasuwu',
		year: '2025',
		image: '/projects/dungeon-ledger.png'
	}
];

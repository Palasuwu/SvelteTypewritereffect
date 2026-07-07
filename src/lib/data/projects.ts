/**
 * Project data for the Work section.
 * Edit this file to add / remove / reorder projects — the grid updates automatically.
 */

export interface Project {
	title: string;
	description: string;
	tags: string[];
	link: string;
	year: string;
	/** Optional screenshot — path under /static, e.g. '/projects/my-app.webp' (~1200×750). */
	image?: string;
}

export const projects: Project[] = [
	{
		title: 'This Portfolio',
		description:
			'A scroll-driven cinematic portfolio: a Draco-compressed GBA model animated through keyframes as you scroll, with CSS scroll-driven text reveals.',
		tags: ['SvelteKit', 'Threlte', 'Three.js', 'Tailwind'],
		link: 'https://github.com/Palasuwu',
		year: '2026'
	},
	{
		title: 'Project Two',
		description:
			'Replace me in src/lib/data/projects.ts — a short one-or-two sentence description of what this project does and why it matters.',
		tags: ['TypeScript', 'Svelte'],
		link: 'https://github.com/Palasuwu',
		year: '2025'
	},
	{
		title: 'Project Three',
		description:
			'Replace me in src/lib/data/projects.ts — a short one-or-two sentence description of what this project does and why it matters.',
		tags: ['Web', 'Design'],
		link: 'https://github.com/Palasuwu',
		year: '2025'
	}
];

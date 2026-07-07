<!--
	Contact.svelte
	==============
	Big closing call-to-action: a headline and a prominent email button,
	with a copy-to-clipboard affordance for people who don't use mailto.
-->

<script lang="ts">
	const email = 'gabriel.jorgito@gmail.com';

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(email);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (copied = false), 2500);
		} catch {
			// Clipboard unavailable (permissions / old browser) — the mailto
			// button still works, so we just ignore the failure.
		}
	}
</script>

<section id="contact" class="contact" aria-labelledby="contact-heading">
	<div class="section-inner">
		<p class="eyebrow">Contact</p>
		<h2 id="contact-heading" class="section-title">Let's build something<br />worth scrolling for.</h2>
		<p class="lede">
			Have a project in mind, or just want to talk shop? My inbox is open.
		</p>

		<div class="actions">
			<a href="mailto:{email}" class="email-button">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="2" y="4" width="20" height="16" rx="2" />
					<path d="m22 7-10 6L2 7" />
				</svg>
				Say hello
			</a>

			<button class="copy-button" onclick={copyEmail}>
				{#if copied}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" />
					</svg>
					Copied!
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="9" y="9" width="13" height="13" rx="2" />
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
					</svg>
					{email}
				{/if}
			</button>
		</div>

		<!-- aria-live region announces the copy result to screen readers -->
		<span class="sr-only" aria-live="polite">{copied ? 'Email address copied to clipboard' : ''}</span>
	</div>
</section>

<style>
	.contact {
		padding: 10rem 1.5rem 8rem;
		text-align: center;
	}

	.section-inner {
		max-width: 48rem;
		margin: 0 auto;
	}

	.eyebrow {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: #938160;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: clamp(2.2rem, 6vw, 3.75rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: #cccccc;
		margin-bottom: 1.5rem;
	}

	.lede {
		font-size: 1.1rem;
		line-height: 1.7;
		color: #9ab0b0;
		margin-bottom: 3rem;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	/* ---- Primary mailto button ---- */
	.email-button {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 2.25rem;
		background-color: #938160;
		color: #013b3f;
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 9999px;
		transition:
			transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			background-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	.email-button:hover {
		background-color: #b3a07c;
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(147, 129, 96, 0.35);
	}

	.email-button:active {
		transform: translateY(0);
	}

	/* ---- Copy email button ---- */
	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: none;
		border: 1px solid rgba(147, 129, 96, 0.35);
		border-radius: 9999px;
		color: #cccccc;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 0.3s ease,
			color 0.3s ease,
			background-color 0.3s ease;
	}

	.copy-button:hover {
		border-color: #938160;
		color: #b3a07c;
		background-color: rgba(147, 129, 96, 0.08);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

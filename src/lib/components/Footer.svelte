<script lang="ts">
	import githubIcon from '$lib/assets/github-svgrepo-com.svg';
	import instagramIcon from '$lib/assets/instagram-svgrepo-com.svg';
</script>

<footer class="footer">
	<div class="footer-inner">
		<!-- Top rule -->
		<div class="divider"></div>

		<div class="footer-content">
			<!-- Left: branding -->
			<div class="brand">
				<p class="brand-name">Pala</p>
				<p class="brand-tagline">Design & Development</p>
			</div>

			<!-- Center: CV download -->
			<a href="/cv.pdf" download class="cv-button">
				<span class="cv-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7 10 12 15 17 10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
				</span>
				Download CV
			</a>

			<!-- Right: socials -->
			<div class="socials">
				<a
					href="https://github.com/Palasuwu"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link"
					aria-label="GitHub"
				>
					<img src={githubIcon} alt="GitHub" class="social-icon" />
				</a>
				<a
					href="https://instagram.com/gabrieljorgito"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link"
					aria-label="Instagram"
				>
					<img src={instagramIcon} alt="Instagram" class="social-icon" />
				</a>
			</div>
		</div>

		<!-- Bottom -->
		<div class="footer-bottom">
			<p>&copy; 2026 Pala. All rights reserved.</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		padding: 3rem 2rem 2rem;
		border-top: 1px solid rgba(147, 129, 96, 0.2);
	}

	.footer-inner {
		max-width: 64rem;
		margin: 0 auto;
	}

	.divider {
		height: 1px;
		background: linear-gradient(
			to right,
			transparent,
			#938160,
			transparent
		);
		margin-bottom: 3rem;
	}

	.footer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 2rem;
	}

	/* ---- Brand ---- */
	.brand-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: #938160;
		letter-spacing: 0.05em;
	}

	.brand-tagline {
		font-size: 0.8rem;
		color: #cccccc;
		margin-top: 0.25rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* ---- CV Button ---- */
	.cv-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1.5rem;
		border: 1px solid #938160;
		border-radius: 9999px;
		color: #938160;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		text-decoration: none;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.cv-button:hover {
		background-color: #938160;
		color: #013b3f;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(147, 129, 96, 0.3);
	}

	.cv-button:active {
		transform: translateY(0);
	}

	.cv-icon {
		display: flex;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.cv-button:hover .cv-icon {
		transform: translateY(2px);
	}

	/* ---- Social Links ---- */
	.socials {
		display: flex;
		gap: 1rem;
	}

	.social-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid rgba(147, 129, 96, 0.3);
		border-radius: 50%;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.social-link:hover {
		border-color: #938160;
		background-color: rgba(147, 129, 96, 0.1);
		transform: translateY(-3px);
		box-shadow: 0 4px 16px rgba(147, 129, 96, 0.2);
	}

	.social-link:active {
		transform: translateY(0);
	}

	.social-icon {
		width: 1.25rem;
		height: 1.25rem;
		/* Colorize the black SVG to match the palette */
		filter: brightness(0) saturate(100%) invert(55%) sepia(20%) saturate(500%) hue-rotate(5deg) brightness(95%);
		transition: filter 0.3s ease;
	}

	.social-link:hover .social-icon {
		filter: brightness(0) saturate(100%) invert(60%) sepia(30%) saturate(600%) hue-rotate(5deg) brightness(100%);
	}

	/* ---- Bottom ---- */
	.footer-bottom {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(147, 129, 96, 0.1);
		text-align: center;
		font-size: 0.75rem;
		color: rgba(204, 204, 204, 0.4);
		letter-spacing: 0.05em;
	}

	/* ---- Responsive ---- */
	@media (max-width: 640px) {
		.footer-content {
			flex-direction: column;
			text-align: center;
		}

		.brand {
			order: 1;
		}

		.cv-button {
			order: 3;
		}

		.socials {
			order: 2;
		}
	}
</style>

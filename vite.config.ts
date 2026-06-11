import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ runtime: 'nodejs22.x' }),
			// Absolute asset URLs: the service worker serves the prerendered "/"
			// shell as the navigation fallback for ANY route, so relative paths
			// (SvelteKit's default) would resolve against the wrong directory and
			// blank-screen every SW-served deep link.
			paths: { relative: false }
		}),
		SvelteKitPWA({
			registerType: 'prompt',
			manifest: {
				name: 'AutoAkte',
				short_name: 'AutoAkte',
				description: 'Track and get reminded about your car maintenance.',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#fafaf7',
				background_color: '#fafaf7',
				icons: [
					{ src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				importScripts: ['push-sw.js'],
				globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
				// Offline deep links fall back to the prerendered app shell at /;
				// the client router then renders the actual route from IndexedDB.
				navigateFallback: '/',
				navigateFallbackDenylist: [/^\/api\//],
				cleanupOutdatedCaches: true
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

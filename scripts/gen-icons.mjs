// Generates all PWA icons from an inline SVG. Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const TEAL = '#0F6E56';
const LIGHT = '#E1F5EE';

// Speedometer glyph; `pad` insets the gauge for maskable safe zones.
function svg({ rounded, pad = 0 }) {
	const rx = rounded ? 96 : 0;
	const s = 512 - pad * 2;
	const scale = s / 512;
	return Buffer.from(`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
	<rect width="512" height="512" rx="${rx}" fill="${TEAL}"/>
	<g transform="translate(${pad} ${pad}) scale(${scale})">
		<path d="M 134 352 A 156 156 0 1 1 378 352" fill="none" stroke="${LIGHT}" stroke-width="40" stroke-linecap="round"/>
		<line x1="256" y1="288" x2="346" y2="180" stroke="${LIGHT}" stroke-width="32" stroke-linecap="round"/>
		<circle cx="256" cy="288" r="30" fill="${LIGHT}"/>
	</g>
</svg>`);
}

mkdirSync('static/icons', { recursive: true });

const jobs = [
	{ file: 'static/icons/pwa-192.png', size: 192, opts: { rounded: false } },
	{ file: 'static/icons/pwa-512.png', size: 512, opts: { rounded: false } },
	{ file: 'static/icons/maskable-512.png', size: 512, opts: { rounded: false, pad: 64 } },
	{ file: 'static/icons/apple-touch-icon.png', size: 180, opts: { rounded: false } },
	{ file: 'static/icons/favicon-96.png', size: 96, opts: { rounded: true, pad: 16 } }
];

for (const { file, size, opts } of jobs) {
	await sharp(svg(opts)).resize(size, size).png().toFile(file);
	console.log('wrote', file);
}

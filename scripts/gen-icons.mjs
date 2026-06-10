// Generates all PWA icons from the master artwork static/icons/AutoAkte.png
// (512×512 with transparency). Run: node scripts/gen-icons.mjs
//
// Launcher icons are flattened onto the app's paper background — iOS renders
// transparent apple-touch-icons on black, and maskable icons need a solid
// full-bleed surface.
import sharp from 'sharp';

const SOURCE = 'static/icons/AutoAkte.png';
const PAPER = { r: 250, g: 250, b: 247, alpha: 1 }; // #FAFAF7

async function onPaper(file, size, padFraction) {
	const inner = Math.round(size * (1 - 2 * padFraction));
	const icon = await sharp(SOURCE).resize(inner, inner).png().toBuffer();
	await sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
		.composite([{ input: icon, gravity: 'centre' }])
		.png()
		.toFile(file);
	console.log('wrote', file);
}

async function transparent(file, size) {
	await sharp(SOURCE).resize(size, size).png().toFile(file);
	console.log('wrote', file);
}

await onPaper('static/icons/pwa-192.png', 192, 0.06);
await onPaper('static/icons/pwa-512.png', 512, 0.06);
await onPaper('static/icons/maskable-512.png', 512, 0.18);
await onPaper('static/icons/apple-touch-icon.png', 180, 0.1);
await transparent('static/icons/favicon-96.png', 96);
await transparent('static/icons/logo-128.png', 128);

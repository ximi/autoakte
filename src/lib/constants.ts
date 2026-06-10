// Everything (header, manifest, notifications) references this constant so a
// rename stays a one-line change. The manifest in vite.config.ts and the push
// fallback title in static/push-sw.js can't import it — keep those in step.
export const APP_NAME = 'AutoAkte';

// Local-first SPA: all data lives in IndexedDB, so server-side rendering has
// nothing to render. The Vercel function serves the empty shell per route.
export const ssr = false;

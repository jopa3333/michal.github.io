import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The deployed service worker is public/sw.js (Vite publicDir). The repo root
// keeps a legacy copy; if they drift, cache bumps never reach users and stale
// cached index.html files point at deleted hashed assets (blank app screen).
const root = fileURLToPath(new URL('../../sw.js', import.meta.url));
const served = fileURLToPath(new URL('../../public/sw.js', import.meta.url));

describe('service worker copies', () => {
  it('root sw.js and public/sw.js are identical', () => {
    expect(readFileSync(root, 'utf8')).toBe(readFileSync(served, 'utf8'));
  });

  it('uses a versioned cache name', () => {
    const content = readFileSync(served, 'utf8');
    expect(content).toMatch(/const CACHE_NAME = 'trening2026-v\d+';/);
  });

  it('serves navigations network-first so a stale index cannot break deploys', () => {
    const content = readFileSync(served, 'utf8');
    expect(content).toContain("event.request.mode === 'navigate'");
    expect(content).toContain('self.skipWaiting()');
    expect(content).toContain('self.clients.claim()');
  });
});

# Phase 4 — build verification

Date: 2026-11-14

## Automated

| Check | Result |
| --- | --- |
| `npm ci` | ok (17 advisories reported by npm, none blocking) |
| `npm test` | 41 passed / 5 files |
| `npx tsc --noEmit` | clean, exit 0 |
| `npm run build` | ok, PWA precache 12 entries (592.82 KiB) |
| `npm run preview` | serves `http://localhost:4173/appcraft/` — 200 HTML, manifest 200, icon 200, sw 200; `/` 302 → `/appcraft/` |

## dist/ contents

```
dist/
  apple-touch-icon.png
  assets/index-BUE67iFQ.css
  assets/index-nVeDJQFo.js
  favicon.ico
  icon-192.png
  icon-512.png
  icon-maskable-192.png
  index.html
  manifest.webmanifest
  registerSW.js
  sw.js
  workbox-dcde9eb3.js
```

Build timestamp: 2026-11-14 22:14 (not the stale Sep 6 output).

## Subpath /appcraft/

- All `src=` / `href=` in `dist/index.html` are `/appcraft/`-prefixed. No bare `/` references.
- Manifest `start_url` and `scope` are `/appcraft/`; all icon `src` values are `/appcraft/...`.
- Service worker precache includes `index.html`, `registerSW.js`, `manifest.webmanifest`,
  both icon sets, `favicon.ico`, `apple-touch-icon.png`, and the hashed JS/CSS bundles.

## Notes

- No app logic changed in this phase.
- Build emits a >500 kB chunk warning for the single JS bundle; not a failure.
- `apple-touch-icon.png` and `favicon.ico` appear twice in the precache manifest
  (`includeAssets` + `globPatterns`); duplicates share revisions and are harmless.

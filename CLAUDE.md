# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # start dev server (Vite HMR) — localhost only
npm run dev -- --host    # expose on LAN (required for phone testing)
npm run build            # type-check then bundle for production
npm run lint             # ESLint
npm run preview          # serve the production build locally
npm run fix-models       # re-run scripts/fix-model.mjs to add normals+material to GLBs
npm run fix-usdz         # re-run scripts/fix-usdz.py to add white material to USDZ (requires pip3 install usd-core once)
node scripts/fix-model.mjs path/to/file.glb        # override default path
python3 scripts/fix-usdz.py path/to/file.usdz      # override default path
python3 scripts/fix-usdz.py --color "#c0a080"      # custom color (hex or R G B floats)
```

## Environment

Copy `.env.example` to `.env`. Two variables:

```
VITE_API_BASE=http://localhost:8000   # backend URL for production mode
VITE_LOCAL_MODE=true                  # set true to use public/catalog.json + local assets
```

`VITE_LOCAL_MODE=true` bypasses the backend entirely: `fetchCatalog` reads `public/catalog.json`, tile clicks navigate to the local AR viewer pages, and assets are served from `public/models/`.

## Architecture

React 19 SPA (Vite + TypeScript). Data flow:

- `App.tsx` reads `VITE_API_BASE`, passes as `base` prop.
- `ArCatalog` fetches `CatalogEntry[]` on mount (backend or local JSON depending on mode), groups by `category`, renders sections of `ArTile`s.
- `ArTile`: if `onSelect` prop is provided (local mode) → `<button>` that calls it; otherwise → `<a>` linking to `base + entry.ar_url` (production mode).
- In local mode, `ArCatalog` passes `openViewer` as `onSelect`, which navigates to `ar-viewer.html` with query params.

**API contract** (`src/api.ts`):
```ts
interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  ar_url: string;
  glb_local_url: string | null;
  usdz_local_url: string | null;
}
```

## Styling

Design tokens in `src/index.css` (`:root`). Component styles in `src/App.css`. `prefers-color-scheme` handles light/dark — no JS switching.

## AR architecture

Two standalone HTML pages in `public/` (no React, no build step):

### `public/ar-viewer.html` — primary AR page (iOS + Android)
- model-viewer 4.0.0 from `ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js`
- Reads `?glb=`, `?usdz=`, `?name=` from query string.
- Sets `ios-src` only when `usdz` param is present; `ar-modes` is `"webxr scene-viewer quick-look"` when USDZ exists, `"webxr scene-viewer"` otherwise.
- **iOS AR**: tapping "View in your space" triggers Apple Quick Look (requires USDZ; without it the AR button is hidden on iOS).
- **Android AR**: Scene Viewer (ARCore) or WebXR.
- Links to `ar-live.html` for Android WebXR hit-test placement.

### `public/ar-live.html` — live placement page (Android WebXR only)
- Three.js `0.160.0` (pinned — bumping can shift WebXR/hit-test behaviour) via importmap from `unpkg.com`.
- `renderer.outputColorSpace = THREE.SRGBColorSpace` — **critical**: prevents linear-to-sRGB blowout on material-less or bright models.
- Lighting: `HemisphereLight(0xffffff, 0xbbbbff, 1.0)` + `DirectionalLight(0xffffff, 1.0)` at `(5, 10, 7)` — handles GLBs with no authored materials correctly (Three.js defaults to metalness=0, matte diffuse).
- Hit-test reticle → tap to place model → scale/rotate HUD sliders.
- **iOS Safari has no WebXR** (`navigator.xr` is undefined). On iOS, shows a card with a link back to `ar-viewer.html` for Quick Look.

## Critical AR constraint — WebXR requires HTTPS

WebXR is gated behind a **secure context**. `localhost` is exempt (laptop browser works over plain HTTP), but **a phone on `http://<lan-ip>:5173` is not a secure context** — `navigator.xr` is silently `undefined` and the AR button reports "AR NOT SUPPORTED".

**Fix: use a Cloudflare Tunnel for phone testing.**

```bash
# One-time install
brew install cloudflared

# Terminal 1 — dev server
npm run dev -- --host

# Terminal 2 — HTTPS tunnel
cloudflared tunnel --url http://localhost:5173
# prints: https://<random-words>.trycloudflare.com
```

Open the printed HTTPS URL on the phone. No account, no certs, no phone-side trust setup. URL rotates each session.

## GLB asset quality

Meshy AI exports GLBs with geometry only — no material, no normals. model-viewer falls back to the default glTF material (metallic=1, roughness=1, white) which renders as blown-out/glowing white. Three.js handles this better (metalness=0 default) but normals are still needed for shading detail.

Fix with `npm run fix-models` which runs `scripts/fix-model.mjs`:
- Uses `@gltf-transform/core` + `@gltf-transform/functions`
- Computes smooth vertex normals
- Assigns white matte material (baseColor `[0.9, 0.9, 0.9]`, metallic=0, roughness=0.55)
- Overwrites `public/models/lattice.glb` in place

Run this whenever a new raw Meshy GLB is dropped into `public/models/`.

## iOS AR and USDZ

iOS Quick Look only accepts USDZ — GLB-only entries show no AR button on iOS.

Meshy exports USDZ with **no material bound** at all. iOS Quick Look renders material-less meshes with a purple placeholder. The fix is `npm run fix-usdz` (`scripts/fix-usdz.py`), which:
- Opens the USDC binary inside the USDZ using `usd-core`
- Creates a `UsdPreviewSurface` material (diffuse white, metallic=0, roughness=0.55) at `/Materials/Default`
- Applies `MaterialBindingAPI` and binds the material to the mesh
- Repacks as a valid uncompressed ZIP (USDZ spec requires `ZIP_STORED`)

Run `npm run fix-usdz` whenever a new Meshy USDZ is dropped into `public/models/`. One-time setup: `pip3 install usd-core`.

`ar-viewer.html` conditionally omits `ios-src` and removes `quick-look` from `ar-modes` when no USDZ param is provided, so the AR button is cleanly hidden on iOS rather than launching a broken Quick Look.

## Integrating into a TypeScript + Python webapp

**Backend** — the Python backend must serve:
1. `GET /api/catalog` → JSON array of `CatalogEntry` objects (see `src/api.ts` for the interface). `ar_url` should be the path to the model's AR viewer page (e.g. `/models/{id}/ar`). `glb_local_url` and `usdz_local_url` can be `null` in production; they are only used by `VITE_LOCAL_MODE`.
2. The `ar-viewer.html` and `ar-live.html` pages (copy from `public/`) at whatever routes the `ar_url` values point to, or serve them as static files.
3. Static GLB/USDZ model files at the URLs that `ar-viewer.html` receives via `?glb=` and `?usdz=` query params.

**Frontend** — drop the `ArCatalog` component into the host app. Pass `base` (the backend origin, e.g. `https://api.example.com`) as a prop. The host app's `VITE_API_BASE` env variable controls this; set `VITE_LOCAL_MODE` only for local development.

**CSS** — `src/App.css` and `src/index.css` use global selectors (`body`, `#root`). Scope or adapt them to the host app's CSS strategy to avoid conflicts.

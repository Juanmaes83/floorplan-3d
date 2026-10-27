# Point 6 — audit and implementation contract

Base: `2f6a7583a0f3d65238e1de2903f40fdd20cbe4a2` (`master`, PR #104 merged).
Authority: PR #105 at `5592f6b517000cc0365834aaa433ad36cbe15b65`, its two product documents dated 2026-10-27, approved capabilities dated 2026-10-25, and coordinator #100. The two newer documents are on the documentation branch, not master; they were read there before code changes.

## Renderer audit before implementation

- Base audit: `index.html` loaded Three.js **0.160.0** and matching addons from jsDelivr. For offline Point 6 startup, the final implementation uses a byte-identical local dependency closure of that version, with MIT license and per-file SHA manifest. Existing test helpers can still use `THREE_LOCAL_DIR`; the new solar tests instead block every external request from initial navigation. SunCalc is local too.
- `WebGLRenderer`, antialias, preserveDrawingBuffer, ACES filmic tone mapping; Y is height. Plan X maps to world X, plan Y downward maps to world Z. Origin is the active level envelope centre in mm, converted to metres.
- Existing `HemisphereLight` plus one `DirectionalLight` named `sun`. Directional light casts shadows; PCFSoftShadowMap, 4096 desktop / 2048 coarse pointer, orthographic bounds ±11 m, near 1, far 60, bias -0.0004, normalBias 0.02. Model meshes and ground already cast/receive shadows.
- `applyLight()` owns editor artistic hour/night illumination, lamps, exposure and material environment intensity. It applies presentation neutral/warm presets after the editor lighting. Existing hour is an artistic trajectory, not geography.
- Presentation HDR is local and SHA checked; neutral/warm presets use the same light. `presentationCapture/Restore` preserve camera, options, doors; lighting teardown aborts loading and disposes HDR. Route pose/cut restoration is separate.
- Free walk and PNG/delivery images consume the active scene and solar direction. Presentation entry suspends solar and restores it on exit, so its HDR presets, guided routes, batch ZIP and presentation video remain independent. Existing camera/view restoration paths are retained.
- Buildings use translated, elevated level groups; no per-level rotation. A shared north works in every level. The active level remains at world Y=0 and scene origin changes when switching levels; a direction vector is origin independent.
- Existing regression coverage: presentation-light, presentation, presentation-route, walk, capture-3d, delivery-image, presentation-batch, tour-recorder, building and import/package suites.
- No persistent north or geolocation exists. The artistic hour/night controls are the only partial predecessor.

## Contract decision

Optional `site` contains optional `northOffsetDeg` (clockwise from plan-up to declared north, [0,360)), and optional `location` with latitude, longitude, `timeZone` IANA, and minimized source metadata. No coordinates or north are inferred. Missing fields remain absent. No geometry is rotated.

Single project: optional `site`, explicit edit upgrades to 1.7.0. Building: optional root `site`, explicit edit upgrades to 1.1.0; embedded projects remain independent and are not rewritten. The root is authoritative even when absent (no fallback to conflicting per-level values). Creating a building copies a configured source project's site to its root. Exporting one level explicitly copies the shared site into that standalone output. JSON/ZIP and duplicates retain site through their existing canonical paths.

Building 1.0 remains accepted; future building versions remain rejected under its strict policy. Standalone future project V1 unknown fields remain preserved. Existing point 3 calculations and point 4 room semantics are unchanged.

Date/time is an ephemeral visualization selection, not a property of the physical building. IANA conversion rejects nonexistent and ambiguous DST local times, asking for an unambiguous time rather than selecting an offset silently. Location is internal; PNG, sheets, presentation and video overlays do not publish exact coordinates. Editable JSON/ZIP continue to contain internal project data and are described accordingly in the UI.

## Minimal implementation

`geo-provider.js`: offline Manual provider with honest capabilities and normalized provenance; future Spain adapters remain a documented boundary. `solar-core.js`: renderer independent time conversion and SunCalc adapter. `solar-renderer-adapter.js`: reversible light override using existing light objects. `solar-ui.js`: localized configuration and visible mode/status. No renderer migration, new sky, terrain, weather or external geocoding.

SunCalc 2.1.1 source pinned to `21449f34820c3c80a27a78cdc940747ff19ca1e3` in the owner's fork. Its solar-position dependency closure is vendored with the original BSD license; upstream v2 angles are **degrees, north-clockwise** (not the older SunCalc radian/south convention). Tests must explicitly protect that distinction.

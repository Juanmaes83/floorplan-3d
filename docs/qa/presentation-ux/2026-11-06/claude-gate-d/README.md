# Gate D — evidencia real de la corrección de Presentation (PR #175)

Grabaciones reales de la aplicación (Chromium + Playwright `recordVideo`, renderizado por CPU con SwiftShader, sin GPU), con el proyecto de ejemplo. Nada es simulado ni retocado.

| Archivo | Build | Viewport | Recorrido |
|---|---|---|---|
| `before-0cfe6a5-1280x800.mp4` | **ANTES** · `master@0cfe6a5` | 1280×800 | configuración → del plano al 3D → historia completa (sección, visita, fachada, axonometría) → pausa → llegada → «Explorar desde aquí» → volver |
| `after-af4351a-1280x800.mp4` | **DESPUÉS** · `af4351a` | 1280×800 | el mismo recorrido |
| `compare-before-0cfe6a5-after-af4351a-1280x800.mp4` | ANTES \| DESPUÉS lado a lado | 1280×800 | configuración, y luego la historia alineada en su inicio |
| `living-af4351a-1280x800.mp4` | `af4351a` | 1280×800 | «Dibujo vivo» (sin ambientación): grafito → manchas → pausa → «Volver al dibujo» → reproducir → final → repetir → historia completa → sección → visita → «Explorar desde aquí» |
| `living-ambience-af4351a-1280x800.mp4` | `af4351a` | 1280×800 | el mismo recorrido, con «Ambientación sugerida» |
| `mobile-after-af4351a-390x844.mp4` | `af4351a` | 390×844 | recorrido de la historia completa en móvil |
| `mobile-living-af4351a-390x844.mp4` | `af4351a` | 390×844 | «Dibujo vivo» en móvil, y después la historia completa |
| `*.steps.json` | — | — | el registro de pasos de cada grabación, con su instante (s) |
| `frames-*.png` | — | — | fotogramas extraídos de esas grabaciones, con su instante |
| `facades-A-B-C-D-front-perspective-1280x800.png` y `facade-candidates.json` | `master` | 1280×800 | las 4 fachadas reales del ejemplo, en vista frontal y en perspectiva, con sus huecos (decisión FT3D-4) |

- **`af4351a` y `45bfb61`:** `af4351a` es el último commit de aplicación de la rama `fix/e2-presentation-ux-stability`. `45bfb61` solo cambia un test.
- **Sin audio.** El ritmo de fotogramas es el de un renderizador por CPU, no el de un equipo con GPU. Las historias avanzan por tiempo, así que se ven a velocidad real.
- **Integridad:** las sumas SHA-256 están en `SHA256SUMS`.

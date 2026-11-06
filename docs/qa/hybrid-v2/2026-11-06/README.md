# Hybrid V2 «Dibujo vivo» — evidencias de la entrega (06-11-2026)

- **Código congelado:** `3767444` en `feat/hybrid-v2-living-drawing`. Los commits posteriores solo añaden documentación y estas evidencias.
- **Entorno:** Chromium 141.0.7390.37 con SwiftShader. Es CPU, no GPU, así que los tiempos solo sirven para comparar.
- **Proyecto:** el ejemplo de RUBIK («Probar el ejemplo»).
- **Estancias de la presentación:** Salón, Comedor, Cocina y Dormitorio principal.
- **Ambientación:** desactivada (el comportamiento por defecto), salvo donde se indica.

| Archivo | Qué es |
|---|---|
| `hybrid-v2-dibujo-vivo-3767444.mp4` | Vídeo definitivo de la experiencia completa (ver detalle abajo). |
| `video-contact-sheet.jpg` | 16 fotogramas del vídeo, del dibujo de la vivienda completa al dormitorio terminado. |
| `phone-390x844-dpr2.jpg` | Teléfono 390×844 con DPR 2: la misma historia, con la estancia en la mitad libre sobre la tarjeta. |
| `ambience-d3-stills.jpg` | La misma historia con la ambientación D3 activada: suelos de catálogo con el rótulo «Ambientación sugerida · no forma parte del proyecto». |
| `comparison-v1-poc-v2.jpg` | Hybrid V1 (`07ae6f9`, fachada) frente a la PoC (05-11) y Hybrid V2 en producto (`3767444`). |
| `data/manifest-*.json` | Manifiestos de render (SHA, tiempos, fase y estancia por fotograma). |
| `data/integration-25a549b.json` | Estado de materiales, renderizador y memoria tras cada escena de la integración (§ Integración). |
| `data/perf-*.json` | Coste por fotograma OFF/ON (§ Rendimiento). |
| `data/test-*.txt`, `data/unit-*.txt` | Resultados TAP de las suites ejecutadas. |

**Detalle del vídeo:**
- 1280×720, 24 fps, 687 fotogramas, 28,6 s. H.264 con CRF 27 en el repositorio.
- La versión de mayor calidad (CRF 20, 19,7 MB) se entrega aparte.
- **Método:** se pausa la historia y se fija con el deslizador en t = i / 24, el mismo camino que usa una persona. Así la tarjeta y los rótulos siguen la escena.
- **Fotogramas sin manifiesto:**
  - Los fotogramas 0–207 y 344–551 los renderizaron los dos primeros procesos con el mismo código `3767444`.
  - Esos procesos se detuvieron al llegar al límite de tiempo, antes de escribir su manifiesto.
  - Los tiempos son deterministas (t = i / 24) y no hubo errores de página.

## Pruebas (código `3767444`)

- `tests/presentation-living-drawing.browser.test.cjs`: **8/8**. Ver `data/test-living-3767444.txt`.
- Suite unitaria completa:
  - rama: 767/769 (2 omitidos);
  - `master` `0f9c6ea`: 749/751 (2 omitidos).
- CI de GitHub en el PR en borrador [Juanmaes83/floorplan-3d#170](https://github.com/Juanmaes83/floorplan-3d/pull/170): las 10 comprobaciones en verde en `3767444`.

## Integración con Section → visita y Hybrid V1

Rama de QA `qa/hv2-integration-section-v1-2026-11-05`, cabeza `25a549b`. Combina:
- `feat/hybrid-v2-living-drawing` (`3767444`);
- `feat/section-spatial-visit-v1` (`49c37f5`);
- `feat/hybrid-registered-elevation-v1` (`07ae6f9`).

No modifica esas ramas ni se fusiona.

- `tests/presentation-scenes-integration.browser.test.cjs`: **1/1** (21 min).
  - Ejecuta, dos rondas seguidas en la misma presentación: dibujo vivo + ambientación → historia completa (sección, fachada, visita validada) → fachada híbrida → dibujo vivo otra vez.
  - Tras cada escena, en la vista general, no queda capa, ambientación, plano de recorte, material ni contorno híbrido.
  - Firmas de material: 1248 mallas con 137 firmas, idénticas tras cada escena.
  - El renderizador queda igual: sin render target ni `overrideMaterial`, mismo tone mapping, clipping y lente.
  - La memoria de la segunda ronda es igual a la de la primera, el JSON del proyecto queda idéntico y no hay errores de página.
- Suites propias de Hybrid V1 (8) y Section → visita (6) sobre la misma integración: **14/14**.
- Suite unitaria de la integración: 784/786 (2 omitidos).

## Rendimiento (SwiftShader, CPU)

Intervalo mediano entre fotogramas. OFF es la vista general de la presentación habitual; ON es la escena «Dibujo vivo» pausada en p = 0,3, con manchas en curso y el dibujo en pantalla. Dos pasadas por modo.

| Viewport | OFF | ON | Diferencia |
|---|---|---|---|
| 1280×800 | 1,13–1,17 s | 1,52 s | +30 % aprox. |
| 390×844 | 0,62 s | 0,77–0,78 s | +25 % aprox. |

- **Memoria constante dentro de cada modo.** ON usa 3 texturas más (sus render targets) y menos geometrías, porque los muros quedan cortados a 1,2 m.
- **El coste en GPU real no está medido.** Aquí no hay GPU. Queda pendiente en un portátil y un móvil físicos: fps durante la escena y tiempo de `render` de la capa.

## Pendiente de verificación fuera de este entorno

- GPU real y dispositivos físicos (iOS Safari, Android Chrome): fluidez, coste y aspecto de las líneas.
- Revisión humana del vídeo y de la Preview de Vercel de la rama (no es producción):
  https://floorplan-3d-git-feat-hybrid-v-787c2c-juanma-espinosas-projects.vercel.app

# RUBIK SOTA E2 · Presentation: panel estable, estados de interfaz y «Dibujo vivo» visible (2026-11-06)

- **Rama:** `fix/e2-presentation-ux-stability`, creada desde `master@0cfe6a5f09ffddf35221dc0175e24b75b246bde0`.
- **PR:** [#175](https://github.com/Juanmaes83/floorplan-3d/pull/175), en borrador. **No fusionar sin la aprobación visual de Juanma.**
- **Alcance:** solo la experiencia Presentation y su sistema de controles. No cambian el motor 3D, las narrativas (Story, Section, Hybrid V2), los materiales, la geometría, el proyecto ni los estados persistidos.

## 1. Evidencia de origen: vídeo del propietario

| Dato | Valor |
|---|---|
| Archivo | `docs/qa/presentation-ux/2026-11-06/RUBIK_Presentation_UX_incidente_2026-11-06_comprimido.mp4` |
| Rama y commit | `evidence/presentation-ux-2026-11-06@faf1a9e9cf3b03513eaeb128b06a63495eaedafe` |
| SHA-256 | `40710f1a9fa0abead7892cd57849b5e9c94f6ff78b2d412ad280616cbb2c7f4d`, verificado tras descargarlo de GitHub (raw) |
| Formato | H.264 1920×1020 a 24 fps, 57,344 s; audio AAC estéreo a 48 kHz |
| Origen | Preview histórica de Hybrid V1 (`07ae6f9`), no `master` |

**Audio.**
- El nivel es muy bajo: media −52,6 dBFS y pico −40,9 dBFS (`volumedetect`).
- En este entorno no hay ningún sistema de reconocimiento de voz, y los servidores de modelos no son accesibles.
- **No he transcrito ni interpretado el audio.** Este informe solo usa la imagen.

**Revisión completa de la imagen.** He extraído un fotograma por segundo, los 57, y además he medido la tarjeta 4 veces por segundo (bordes de la tarjeta blanca en la columna derecha).

| Tiempo | Qué ocurre | Defecto |
|---|---|---|
| 0–11 s | Diálogo «Presentar mi vivienda»: plantilla, estancias, «Empezar desde el plano», sección, fachada narrativa con «Elevación híbrida», lectura del edificio, entrega al cliente. El usuario se desplaza unas 3 pantallas antes de «Iniciar presentación». | Configuración excesiva |
| 12–18 s | Del plano al 3D. La tarjeta está centrada en vertical: borde superior en 267 px y altura 553 px. | — |
| 18,5 s | Fin de la historia: aparecen 13 herramientas, la tarjeta crece a 609 px y el borde superior sube a 238 px. | Panel inestable |
| 24–47 s | «Historia completa»: el borde superior oscila entre 214 y 252 px y la altura entre 582 y 657 px, según la escena y el texto. | Panel inestable |
| 31–36 s | Fachada híbrida V1: planos con trama inclinada y después una caja gris lisa sin huecos visibles. El texto técnico ocupa 4 líneas. | Fachada de bajo valor; textos técnicos |
| 37–47 s | Axonometría y descenso al dormitorio. Las herramientas siguen visibles y desactivadas durante la reproducción. | Controles caóticos |
| 48–56 s | Parada del dormitorio: la tarjeta cambia de título y de contenido y la altura baja a 582 px. | Panel inestable |

Este vídeo procede de una rama antigua (Hybrid V1). La fachada híbrida V1 no está en `master` y no se integra aquí. El defecto del panel sí existe en `master`: lo he reproducido, como muestra el apartado 2.

## 2. Reproducción y medición en `master 0cfe6a5`

Sonda `scripts/qa/presentation-ux-probe.cjs`:
- Chromium con SwiftShader y el proyecto de ejemplo.
- Recorrido: «Empezar desde el plano», sección con visita espacial, fachada y axonometría, «Ver la historia completa», pausa a mitad, reanudación y llegada.
- Mide en cada fotograma de animación la tarjeta, su cabecera, el botón de reproducir, el deslizador y los botones visibles.

| Viewport | Movimiento del borde superior | Variación de altura | Cabecera | Botón de reproducir (vertical / horizontal) | Deslizador | Botones mientras reproduce |
|---|---|---|---|---|---|---|
| 1440×900 | 31→119 px (88) | 662→839 px (177) | 88 px | 47 / 179 px | 99 px | 15 |
| 1280×800 | 12→69 px (57) | 662→776 px (114) | 57 px | 32 / 179 px | 68 px | 15 |
| 390×844 | 310→414 px (104) | 422→526 px (104) | 104 px | 104 / 23 px | 104 px | 15 |
| 844×390 | 0 | 0 (ocupa todo el alto) | 0 | 31 / 185 px | 42 px | 15 |
| 1280×800, reduced motion | 12→59 px (47) | 683→776 px (93) | 47 px | 52 / 178 px | 57 px | — |

**Configuración en `master`:** 3,19 pantallas de desplazamiento en 1280×800 (6,03 en 844×390), 56 controles y 413 palabras.

**Defectos adicionales observados en `master`:**
- Durante la historia la cabecera decía «Vista general · Vista 1 de 2», también dentro del dormitorio.
- Al llegar, los cinco botones del reproductor se reorganizaban en vertical: el botón de reproducir se desplazaba 179 px.

## 3. Causa raíz (código de `master`)

1. **La tarjeta se mueve sola.**
   - En escritorio, `.presentation-overlay{align-items:center}` centra la tarjeta en vertical, y `.presentation-card` tiene altura automática.
   - Cualquier cambio de contenido la hace crecer o encoger desde el centro.
   - En móvil es una hoja inferior de altura automática: crece hacia arriba.
2. **Todo el contenido cambia en la misma caja.**
   - `drawStory()` reescribe en cada fotograma el texto, la visibilidad y el estado activo de unos 15 botones.
   - «Explorar desde aquí» y «Volver a la sección» compartían fila con el transporte.
   - Los rótulos técnicos variaban de 1 a 4 líneas.
3. **No había estados de interfaz.**
   - Reproducción, pausa, final y navegación mostraban a la vez reproductor, herramientas profesionales, escenas y paradas.
4. **Efecto secundario en el encuadre.**
   - La región libre para la cámara (`viewRegion`) se calcula con el tamaño de la tarjeta.
   - Una tarjeta cambiante desplazaba la región entre paradas e historias.

## 4. Corrección

- **Tarjeta anclada** (`index.html`, bloque «Presentation card»):
  - una cabecera fija;
  - el reproductor de la historia, solo con una historia abierta: contador, texto en una caja de altura fija con scroll propio, deslizador, transporte de tres huecos fijos (anterior, reproducir o pausar, siguiente) y una fila aparte para la llegada;
  - **un único cuerpo con scroll** para lo que cambia: textos de la parada, navegación, escenas, herramientas y paradas.
- **Tamaño de la tarjeta según el dispositivo:**
  - **Escritorio y apaisado (≥ 700 px):** columna derecha anclada arriba, bajo «Capas de contexto». Mide lo mismo en todos los estados, así que la región de la cámara es idéntica en paradas e historias.
  - **Móvil vertical:** hoja inferior; mientras hay una historia abierta tiene una altura fija `min(52 %, 440 px)`.
- **Estado explícito** `#presentationOverlay[data-story]` con tres valores:
  - `playing`: solo el reproductor y una línea («Pausa la historia para ver las vistas y las herramientas.»);
  - `paused` y `end`: vuelven las paradas y las herramientas en el cuerpo, debajo del reproductor, sin moverlo.
  - Los textos de la parada, ya no válidos, se ocultan durante la historia.
  - La cabecera nombra lo que se ve: la estancia tras el descenso o la visita, y «Dibujo vivo» en su escena.
- **Sin escrituras inútiles en el DOM:** los nodos de la historia solo cambian cuando cambia de verdad un texto o un atributo. Así la reproducción no reescribe el DOM ni repite los anuncios de las regiones vivas en cada fotograma.
- **Grupo «Escenas»** (`#presentationScenes`), justo después de la navegación y separado de las herramientas profesionales:
  - «Ver dibujo vivo» (el primero, destacado), «Volver al plano», «Entrar en…», «Ver la historia completa», sección, fachada y axonometría;
  - solo aparece donde las escenas pueden reproducirse (una vista general).
- **Configuración:**
  - encabezado «Historia y escenas» con **«Usar escenas sugeridas»**: activa «Empezar desde el plano», la sección con su visita, la fachada y la axonometría si el proyecto las admite, y lo confirma con un mensaje de estado;
  - **«Dibujo vivo» queda como primera opción del grupo**, destacada y desactivada; su «Ambientación sugerida» es una subopción separada por una línea, también desactivada y solo disponible con «Dibujo vivo»;
  - las explicaciones de las opciones no elegidas muestran dos líneas; elegidas o no disponibles (con el motivo), se muestran completas;
  - «Iniciar presentación» sigue fija en el pie del diálogo.
- **No se elimina nada:**
  - todas las herramientas, paradas, escenas, capturas, lotes, grabación, observaciones y marca siguen existiendo;
  - se reubican o se muestran según el estado;
  - todos los `id` se conservan.

### Archivos

- `js/presentation-ui.js`: estructura de la tarjeta, estados, grupo de escenas, configuración, cabecera y escrituras sin cambios inútiles.
- `index.html`: el CSS de la tarjeta, de los estados, de las escenas y de la configuración.
- `js/brand-ui.js`: la introducción de marca pasa al cuerpo, para que no desplace la cabecera.
- `tests/presentation-story.browser.test.cjs`: dos aserciones exigían que los botones de la historia estuvieran dentro de `#presentationTools`. Ahora comprueban que las herramientas no cambian y que esos botones están en «Escenas». La intención original se mantiene: una presentación sin escenas no cambia.
- **Nuevo:**
  - `tests/presentation-ux-stability.browser.test.cjs` y `.github/workflows/presentation-ux-stability.yml`;
  - `scripts/qa/presentation-ux-probe.cjs` y `scripts/qa/record-presentation-ux.cjs`.

## 5. Resultados

Los resultados se completan en el apartado «Resultados en el SHA final», al final de este documento.

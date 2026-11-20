# E · Preflight temporal de colisiones · HANDOFF para Codex

**Estado: CERRADA TÉCNICAMENTE.** Están en ✅ las fases SOURCE EXACT, ISOLATE, BASELINE, CLASSIFY, SCULPT, PULIR, NORMALIZE, VALIDATE, PREVIEW y HANDOFF. La aceptación humana y la integración son posteriores.
**Base:**
- RUBIK `floorplan-3d@02712b5147c15defa12a810b2f346e4b3e0ecb60`, solo lectura;
- donante `simulator@57d562c` (MIT).

## Qué es y qué no es

Comprueba **antes de grabar o presentar** si una trayectoria de cámara (de D, de B o sintética) atraviesa muros, vidrios, hojas de puerta cerradas o muebles a lo largo del tiempo, usando la geometría canónica de RUBIK.

**No es:**
- un motor de navegación;
- una certificación estructural, normativa ni de seguridad.

## Archivos y destino propuesto

| Laboratorio | Destino en `floorplan-3d` | Nota |
|---|---|---|
| `src/motion-preflight.cjs` | `js/motion-preflight-core.js` | Puro, sin DOM ni three. Para cargarlo en el navegador, envolver como UMD (`window.RubikMotionPreflight`) igual que `shot-timeline` |
| `src/rubik-obstacles.cjs` | `js/motion-preflight-core.js` (mismo núcleo) o `scripts/capture/` | Recibe `FloorPlanCore` por parámetro: no crea otra geometría |
| `test/motion-preflight.test.cjs` | `tests/` | Puro (Node), 8/8 |
| `demo/run-demo.cjs` | `scripts/capture/` | Requiere D (Chromium) |
| `baseline/` | `labs/` o fuera del producto | Evidencia del donante |

**Dependencias:**
- solo RUBIK `js/project-core.js` (y `js/generic-catalog.js` para las alturas de catálogo);
- la demo, además, D y Playwright.

## Contrato

- `sweep({movers, statics, times | from/to/step, allow, maxStepM})` devuelve un `status`:
  - `clear`: sin contactos y cobertura completa; es el único caso con `ok: true`;
  - `contact`;
  - `incomplete`: falta alguna pose, alguna pose no es numérica, o hay un tramo de caja móvil sin cobertura.
- `contacts[]`: un intervalo por cada **racha contigua** de cada pareja, con `from`, `to`, `samples`, `maxDepth` y `betweenSamples`.
- `allowedContacts[]`: los contactos permitidos, con su `reason`, que es obligatorio.
- Esferas (cámara): comprobación **continua** del segmento entre muestras, con búsqueda ternaria exacta sobre una distancia convexa. Cajas móviles: subdivisión adaptativa hasta `maxStepM`, o hueco declarado en `coverage.gaps`.
- **Tolerancias justificadas** (`TOLERANCES`):
  - contacto: 1 mm absoluto, porque RUBIK mide en mm enteros;
  - radio de la cámara: `cameraRadius()`, la esfera del plano cercano real del visor (`near` 0,05 m, FOV 45°; con aspecto 1,6 da 0,0635 m). Sustituye al 0,15 m arbitrario anterior.
- **Obstáculos** (`obstacles(project, {Core, heights, doors, inset})`), con las reglas del visor de `02712b5`:
  - macizos de muro;
  - antepecho y dintel;
  - **vidrio** de ventana como obstáculo `glazing`;
  - hoja de puerta según `doors: 'open' | 'closed' | {id: estado}`; por defecto `'open'`, declarado en `assumptions`;
  - vanos libres;
  - muebles con base en `elevationMm` y altura declarada, que el visor reescala, o la de catálogo, o la del modelo nativo (`acwall` a 2,2–2,5 m), siempre con `heightSource`;
  - alfombras fuera.
- Ámbito: la planta activa.

## Pruebas y resultados (ejecutados el 19–20/11/2026)

- **Baseline del donante** (`baseline/donor-collide.json`, Chromium 153):
  - `site-collide`: sin contactos, en 12,3 s;
  - `plant-collide`: `paint0|skid 12.1-19.7s (77)`, en el formato «desde–hasta» que funde los contactos;
  - `airport-collide` y `warehouse-collide`: sin contactos.
- **Unitarias: 8/8.**
  - SAT con caso girado;
  - radio derivado del plano cercano;
  - dos contactos separados dan dos intervalos;
  - un salto entre muestras se detecta (y con el método del donante, no);
  - si faltan poses, el resultado es `incomplete`;
  - los contactos permitidos llevan motivo y quedan registrados;
  - puerta abierta o cerrada, dintel y vidrio sobre el proyecto de referencia;
  - alturas y elevaciones con las reglas del visor.
- **Demo** (`evidence/preflight.json`, `evidence/preflight-plan.png`, SHA-256 `d8c7b0f0…`):
  - 14 trayectorias **reales** de RUBIK, capturadas con D (13 vuelos `flyToRoom` y la parada real de la presentación; el ejemplo tiene 2 paradas): **14 `clear`**;
  - controladas sobre el mismo proyecto:

    | Caso | Resultado |
    |---|---|
    | Válida por la puerta `opn_door-0` | `clear` |
    | Inválida por el muro `wal_ref-w18` | `contact` (1 intervalo) |
    | Ida y vuelta por el mismo muro | `contact` en **2 intervalos** (0,4–0,6 s y 1,4–1,6 s) |
    | 4 poses ausentes | `incomplete` |
    | Salto de 6 m en una sola muestra | `contact` con `betweenSamples: true` |

  - Obstáculos: 82 tramos de muro, 12 vidrios y 45 muebles; los 45 con `heightSource: catalog`, porque el ejemplo no declara `heightMm`.
  - 0 peticiones externas y 0 errores de página.
  - **Coste:** 975 ms en total para las 19 trayectorias; como máximo 18,9 µs por comprobación (muestra × obstáculo), unos 50 ms por vuelo de 31 muestras contra 139 obstáculos.

## Límites declarados

- Solo la planta activa. Las escaleras y otras plantas no son obstáculos.
- Sin la altura declarada de un mueble se usa la de catálogo, que puede no coincidir con el modelo nativo. El informe lo marca con `heightSource`.
- Los armarios R03 (`RubikCabinetBridge`) solo se tratan como modelo propio si se pasan en `cabinetTypes`. Por defecto se usa la altura declarada.
- El estado real de las puertas en cada instante no se lee del visor (`presentationInspect().doors` no expone ids). Se declara como suposición.
- Los muebles son cajas de su huella, no su malla.
- Firefox y WebKit no se usan: E es pura y solo la demo depende de Chromium a través de D.

## Orden de aplicación, riesgos y reversión

- **Orden:** E es la **primera** en aplicarse, porque es un núcleo puro sin dependencias de producto. Después vienen B (núcleo) y D (herramienta).
- **Riesgos:**
  - si el visor cambia sus reglas de huecos, elevación o reescalado, `rubik-obstacles` debe actualizarse; la prueba 8 lo detecta para las reglas cubiertas;
  - un contacto permitido mal justificado oculta un defecto: por eso exige `reason` y aparece en el informe.
- **Reversión:** borrar los archivos nuevos. Ningún archivo existente cambia.

# OBR-01 — Cierre de los pendientes de FT3D-8 (ola 1)

**Fecha:** 12-11-2026 · **Rama:** `lab/obr01-ft3d8-reliability` · **Origen:** `master@eae8cf6709a4523b1e6009e6b9bee393044977fc` · **Coordinación:** issue #206 (carril Claude, bloque C1).

**Alcance:** las cuatro deudas del catálogo para OBR-01 (`docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md`, fila OBR-01), con su especificación tomada de la matriz del examen FT3D-8 M2/S4 (`docs/qa/ft3d-8-m2-correcciones-2026-11-06/ronda-3/matriz-pruebas.md`) y del acta de integración E2 (`docs/integration/ft3d-8-e2-integracion-2026-11-07.md`).

**Datos:** solo la obra sintética del examen (`tests/qa-m2/obra-sintetica.cjs`) y la fixture territorial sintética existente. Ningún proyecto, precio ni dato de cliente. Ninguna petición externa (las pruebas fallan si la hay).

## Resultado por pendiente

| ID | Estado en el examen | Qué era de verdad | Ahora | Prueba |
|---|---|---|---|---|
| **EX-05.3** | PARTIAL: «ningún elemento de T02 es alcanzable con el ratón; causa no demostrada» | **Defecto real.** El raycast de la Evolución incluía los contornos «sin tarea» (`LineSegments`) con el umbral por defecto de Three para líneas, **1 m** en el mundo: un contorno a menos de 1 m del rayo se quedaba el clic. En la vivienda de ejemplo, los muros de carga de T02 (tramos cortos de 300–550 mm) están junto a `window-1`, `door-2` y `w6`, sin tarea. | **Corregido** en `evolucion/project-scene.js`: gana el sólido visible más cercano; un elemento sin tarea se elige por su propio volumen solo si no hay nada construido en el rayo; las líneas nunca ocultan ni capturan el clic. | `tests/obr01-ex05-pick.browser.test.cjs` (4/4). **Falla en master**: `project/wal_ref-w0` no alcanzable. |
| **EX-11-k.6** | PARTIAL: «solo se verifica la detección; no se ha medido cuadro a cuadro» | **Defecto real.** La Evolución no aplicaba `prefers-reduced-motion` al 3D: la vista AUTO giraba sola y la cámara conservaba la inercia. Medido: **90 de 90 cuadros** con pose distinta, igual que sin la preferencia. | **Corregido**: con la preferencia, sin órbita automática (AUTO queda en el encuadre ISO fijo) y sin inercia; se sigue **en vivo** si cambia durante la sesión. Las acciones del usuario (arrastrar, botones, reproducir) siguen igual. | `tests/obr01-ex11-reduced-motion.browser.test.cjs` (4/4, con control de sensibilidad). **Falla en master** (3 de 4). |
| **QA-22** | PARTIAL: «medido hasta ~1200 elementos sin GPU» | Faltaba medir a mayor escala. | **Medido hasta el límite del contrato** `FloorPlanProjectV1` (2000 muros): ×28 = **2941 elementos**, con plan disperso (el del examen) y denso (todo con tarea). Abre, se mueve en el tiempo, raycast y **clic real en el muro de carga de la copia más lejana**. Sin errores. | `tests/obr01-qa22-scale.browser.test.cjs` (2/2). |
| **EX-09.10** | NOT_RUN: «PNOA/MDT05 no se cargan en el examen» | Faltaba la ejecución en navegador. El núcleo ya probaba en Node que solo se guardan metadatos. | **Verificado en navegador**: edificio con metadatos PNOA/MDT05 (licencia del terreno verificada) abierto desde la biblioteca en la Evolución. Se dibuja (2 plantas); el expediente dice «solo metadatos»; el documento del cliente no contiene ráster, malla ni direcciones de servicio; **0 peticiones externas**; la biblioteca no cambia byte a byte. **Sin defecto.** | `tests/obr01-ex09-territory.browser.test.cjs` (3/3). |

### Métricas QA-22 (este equipo: 4 vCPU, Chromium con SwiftShader, sin GPU)

| Plan | Elementos | Con tarea | Apertura | `setPos` | Cuadro (mediana / p90) | Raycast | Memoria JS |
|---|---|---|---|---|---|---|---|
| ×1 disperso (referencia) | 106 | — | 0,9 s | 1,6 ms | 17 / 99 ms | 1,5 ms | 14 MB |
| ×28 disperso | 2941 | 15 | 2,5 s | 3,3 ms | 45 / 109 ms | 7,5 ms | 139 MB |
| ×28 denso | 2941 | 2632 | 2,1 s | 22,3 ms | 19,6 / 27 ms | 3,4 ms | 225 MB |

**Observación, no corregida:** con el plan casi vacío el cuadro es más caro que con el denso, porque cada elemento sin tarea se dibuja como contorno de líneas (unas 2900 entidades `LineSegments`). En SwiftShader las líneas son caras. Fusionar los contornos por elemento reduciría las llamadas de dibujo, pero **no puede verificarse sin GPU real**, así que queda como candidato para GOV-07 y no como defecto cerrado.

**Límites honestos:**
- Los tiempos son de CPU, **no** de hardware de cliente.
- La medida en GPU y en dispositivos reales es humana: protocolo GOV-07.
- La descarga real de teselas PNOA/MDT05 del IGN (red y licencia) no se ejecuta aquí. Ya la cubren las pruebas del editor (`tests/orthophoto.browser.test.cjs`, `tests/terrain.browser.test.cjs`) con el servicio simulado.

## Cambios

| Archivo | Tipo | Nota |
|---|---|---|
| `evolucion/project-scene.js` | Producto (FT3D-8, no reservado) | `pick()` por sólidos, `hitsAt()` de solo lectura, `screenBounds(key,{exact})`, movimiento reducido (sin órbita ni inercia, en vivo). Sin cambios de geometría, materiales, contrato ni API pública existente. |
| `tests/obr01/obra-fixture.cjs` | Prueba | Obra sintética del examen en el formato real del navegador (biblioteca + registro de obra). Proyectos y edificios; plan denso. |
| `tests/obr01/browser-kit.cjs` | Prueba | Servidor local, Chromium y apertura de la Evolución. `OBR01_ROOT` permite ejecutar las MISMAS pruebas sobre otro árbol (antes/después). |
| `tests/obr01-*.browser.test.cjs` | Prueba | EX-05.3, EX-11-k.6, EX-09.10 y QA-22. |
| `tests/obr01/capture-evidence.cjs` | Evidencia | Capturas de escritorio y móvil (toque real). |
| `.github/workflows/obr01-ft3d8-reliability.yml` | CI | Gate propio: las suites genéricas no incluyen estas pruebas. |

**No se tocan** `index.html`, `js/professional-workspace-ui.js`, `js/delivery-*`, las API, los contratos canónicos, Vercel ni las ramas de ChatGPT. **No hacía falta ninguna cirugía en archivos reservados**: los dos defectos estaban en el visor de la Evolución.

**Reutilización:** el generador de candidatas y el raycast de Three, el visor y su API, la obra sintética y el generador de carga del examen, y la fixture territorial. No hay motor nuevo.

## Regresión ejecutada (local)

| Suite | Resultado |
|---|---|
| OBR-01 (4 archivos) | 13/13 |
| `tests/ft3d-8-fidelity.browser.test.cjs` | 6/6 |
| `tests/ft3d-8-ux4d.browser.test.cjs` | 20/20 |
| `tests/int-r1-evolucion-dibujo-vivo.browser.test.cjs` (con Three 0.160 local) | 1/1 |
| Antes/después: EX-05.3 y EX-11-k.6 contra `master@eae8cf6` | **fallan** en master |

La CI repite el gate OBR-01 y `ft3d-8-e2-integration` (que se dispara con `evolucion/**`).

## Evidencias

`evidencias/` (con `manifest.json` y SHA-256):
- `ex05-3-muro-carga-T02-escritorio-1440x900.png`: clic en planta; el panel muestra «Muro · 02 Estructura».
- `ex05-3-muro-carga-T02-movil-390x844.png`: el mismo con un **toque** real.
- `ex09-10-pnoa-mdt05-solo-metadatos-escritorio-1440x900.png`: el expediente con «solo metadatos»; 0 peticiones externas.

## Recorrido humano sencillo (5 min)

1. Abre la Preview de esta PR, carga la vivienda de ejemplo y crea un plan con una tarea «Estructura» que contenga los muros de carga cortos de la fachada trasera.
2. En la Evolución, vista **PLANTA**, botón **INTERIOR**: haz clic sobre uno de esos muros. Debe abrirse su panel con la tarea «Estructura».
3. Activa «Reducir movimiento» en el sistema (macOS: Accesibilidad › Pantalla; Windows: Efectos de animación; iOS/Android: Reducir movimiento) y pulsa **AUTO**: la casa debe quedarse quieta. Desactívalo: debe volver a girar.
4. Arrastra la vista con el movimiento reducido activado: al soltar debe pararse en seco.

## Pendiente y decisiones para ChatGPT

- **Integración:** un solo archivo de producto (`evolucion/project-scene.js`) y pruebas aisladas. No hay conflicto conocido con #201–#205.
- **Catálogo:** marcar OBR-01 como hecho es decisión de integración, no de esta PR. No se crean IDs ni se cambian olas.
- **Humano:** paso 3 del recorrido en un dispositivo real; rendimiento en GPU y móviles reales (GOV-07).

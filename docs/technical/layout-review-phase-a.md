# Fase A (propuesta Pascal→Rubik) — revisión local de distribución

**Estado: integrada en `master` por [PR #27](https://github.com/Juanmaes83/floorplan-3d/pull/27)** (merge `5b93339601998d750918e01cb4431073b75cf5a0`, 06-10-2026, fusionada por Juanma; en GitHub no consta una review formal aparte). No es una fase canónica ni aprueba el resto de la propuesta Pascal.

Historial en la rama: `02b8165` (revisión inicial) y la corrección posterior de estados de evidencia y resaltado 2D, descrita aquí.

- **Base:** `claude/intelligent-pasteur-vci64k`, sobre `master` `c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3`.
- **Origen:** el borrador [PASCAL-RUBIK-INTEGRATION-ROADMAP](../proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md), sección 8, Fase A, que sigue sin aprobar.
- **Lo que no modifica:**
  - el [roadmap canónico](../ROADMAP.md) ni su numeración;
  - `FloorPlanProjectV1`, su schema, unidades, ejes, persistencia ni formato JSON/ZIP;
  - la entrega autorizada **LAB v03**.

## Qué hace

La revisión es **de solo lectura** y se recalcula en cada render del panel «Plano propio», justo debajo de los avisos W1–W4. No mueve, edita ni guarda nada. El umbral de holgura y el hallazgo resaltado viven solo en memoria de la sesión.

**No hay umbral de holgura predeterminado en esta iteración.** La persona debe introducirlo; sin él, esa comprobación queda en `insufficient_evidence`. Ofrecer valores orientativos sigue siendo una decisión abierta (D-A1 del borrador) y no se resuelve aquí.

Cubre tres comprobaciones:

| Comprobación | Método | Estado si faltan datos |
| --- | --- | --- |
| **Solapes entre muebles** | Huella orientada de Rubik (`FloorPlanTracing.footprint`, la misma de W3) y ejes separadores sobre las normales de ambos rectángulos. Mide la penetración mínima en mm. Si las huellas solo se tocan, no hay solape. | `partial` si algún objeto no tiene posición, tamaño o giro válidos (ver «Evidencia incompleta»). |
| **Holgura entre muebles** | Distancia mínima exacta entre los dos polígonos convexos (vértice-arista en ambos sentidos). Se informa si es **estrictamente menor** que el umbral que indica la persona. Si el segmento más corto atraviesa un sólido de muro activo (`FloorPlanCore.geometry`, que ya descuenta los huecos de puertas y ventanas), el par se excluye porque no es un hueco libre. | **Sin umbral: `insufficient_evidence`.** No hay valor predeterminado ni se afirma ninguna norma. Con umbral y objetos omitidos: `partial`. |
| **Barrido de puertas** | Para cada puerta abatible en un muro activo, el barrido es exactamente el que dibuja el plano 2D: cuarto de círculo con centro en la bisagra sobre la cara del muro y radio igual al ancho del hueco, de la posición cerrada a la abierta (90°). Usa la bisagra (`start`/`end`) y el sentido (`left`/`right`) **guardados** en `opening.swing`. La huella se recorta al cuadrante y se calcula el **ángulo al que la hoja alcanza el mueble**. | Una puerta sin `swing` se omite con motivo y **no se declara bloqueada**. La geometría 2D/3D le aplica por defecto la bisagra en `start` y la apertura a la izquierda (`left`) para dibujarla, pero esa suposición no se usa como evidencia. Puertas: `partial` si faltan algunas, `insufficient_evidence` si faltan todas. Con objetos omitidos y alguna puerta comprobable: `partial`. |

**Estado global:**
- `checked` solo si las tres comprobaciones son `checked`;
- `insufficient_evidence` si ninguna concluye;
- `partial` en cualquier otro caso.

### Evidencia incompleta: objetos omitidos

Un objeto sin posición, tamaño o giro válidos se omite (`skipped`), pero podría solapar, quedar cerca o estar en el barrido de una puerta. Por eso, cuando hay alguno:

| Comprobación | Estado |
| --- | --- |
| Solapes | `partial`, con el número de objetos omitidos. |
| Holgura con umbral | `partial`, con el número de objetos omitidos. |
| Holgura sin umbral | `insufficient_evidence`; el motivo añade que además hay objetos omitidos. |
| Puertas, si hay puertas abatibles activas comprobables | `partial`. Sin geometría válida no se puede descartar que el objeto omitido esté en un barrido. |
| Puertas, si no hay puertas abatibles activas | `checked` («No hay puertas abatibles activas»): no hay nada que comprobar. Una puerta en un muro demolido no cuenta como activa. |
| Puertas, si ninguna tiene `swing` | `insufficient_evidence`; el motivo menciona también los objetos omitidos. |
| Global | Nunca `checked` con objetos omitidos. |

Los hallazgos que sí pudieron calcularse se conservan. El estado indica que el análisis está incompleto.

**Cada hallazgo incluye:** los IDs implicados (`obj_…`, `opn_…`), la medición (mm o grados), el método, la limitación y una `evidence` geométrica exacta, derivada y nunca persistida. El informe lista siempre las exclusiones, las omisiones y lo no comprobado.

### Resaltado en el plano 2D

Al pulsar un hallazgo, se selecciona y centra el mueble, como antes, y además se dibuja su evidencia en el grupo SVG `#gReview`, en milímetros del plano. Comparte `viewBox` con el plano, así que queda alineado a cualquier zoom o tamaño de ventana, con trazos `non-scaling-stroke` (la convención de puertas y símbolos). El grupo tiene `pointer-events="none"` y no intercepta controles.

| Hallazgo | Se dibuja | Exactitud |
| --- | --- | --- |
| Solape | Las dos huellas orientadas (discontinuas) y su **intersección exacta**, rellena: polígono convexo obtenido recortando una huella por los semiplanos de la otra. | Exacta para los rectángulos guardados. |
| Holgura | Las dos huellas y el **segmento entre los puntos más próximos**, con marcas en los extremos. | Exacto. A poco zoom, un hueco muy pequeño (p. ej. 25 mm) se ve como una marca de 1–2 px: se dibuja a escala real y no se exagera. |
| Puerta | El cuarto de círculo del barrido, igual que el arco 2D; la parte **bloqueada** (de la posición de contacto a 90°), con más opacidad; la **hoja en el ángulo de contacto**; y la huella alcanzada. | Exacto con el modelo de Rubik: hoja de grosor nulo y longitud igual al ancho del hueco. No representa tiradores ni la puerta real. |

- **Sin texto sobre el plano:** no se dibuja ninguna etiqueta encima, para no tapar rótulos de estancias ni de muebles. La medida y el umbral aparecen en el panel («Resaltado en el plano · …») y como `<title>` accesible del grupo.
- **Cuándo se retira o actualiza:**
  - con «Quitar resaltado del plano»;
  - al cambiar de proyecto;
  - al cerrar las herramientas;
  - cuando el hallazgo deja de existir (por ejemplo, al quitar el umbral).
- **Con cada render se recalcula** con la geometría vigente.
- **Exportación PNG:** vacía `#gReview` en su copia del SVG, así que el resaltado nunca aparece en la imagen exportada.
- **Nunca modifica** el proyecto, el historial (deshacer/rehacer), `localStorage` ni las exportaciones.

### Exclusiones por apilamiento de diseño, tomadas del propio Rubik

El modelo 3D genérico de Rubik dibuja algunos tipos a una altura fija. Esos pares **no se informan como hallazgo**, pero aparecen como «Excluido» con su motivo:

- `rug`, a ras de suelo (`index.html`, caso `rug` del constructor 3D genérico).
- `stove` y `ksink`, encastrados a la altura de encimera, solo sobre `counter` o `island` (casos `stove` y `ksink`). Una placa sobre un sofá **sí** se informa.
- `acwall`, colgado en pared a 2,2 m (caso `acwall`).

En el plano de ejemplo, sin exclusiones aparecerían 4 solapes, y los 4 son intencionados: placa y fregadero sobre la encimera, alfombra bajo sofá y bajo mesa de centro. Con las exclusiones no queda ningún solape falso. La puerta `opn_door-3` (785 mm, bisagra `end`, apertura `right`) alcanza el «Mueble de baño» `obj_template-016` a unos 6° de apertura. Lo comprobé a mano: la esquina (4500, 4090) está a 774 mm de la bisagra (4580, 4860), dentro del radio de 785 mm.

## Qué no comprueba

La interfaz y el informe lo declaran siempre:
- altura o elevación;
- holgura entre mueble y muro (W3 ya avisa del solape con muros);
- recorridos completos, giros o entrega de muebles;
- normativa o accesibilidad;
- mallas 3D (usa el tamaño guardado);
- el grosor de la hoja, tiradores, aperturas menores de 90° o el lado opuesto de la puerta;
- puertas correderas y huecos sin hoja.

**Escala:** si la escala no está confirmada, la revisión lo indica (como W4). Las distancias siguen siendo orientativas.

## Código y puntos de integración

- [`js/layout-review.js`](../../js/layout-review.js): módulo UMD sin DOM ni dependencias. Expone `FloorPlanLayoutReview.review(project,{clearanceMm,label})`. No usa `new Function`, `eval` ni código de Pascal.
- [`js/tracing-core.js`](../../js/tracing-core.js): extrae `footprint(o)`, la huella orientada que W3 ya usaba, sin cambiar su fórmula. W3 la reutiliza.
- [`js/tracing-ui.js`](../../js/tracing-ui.js): sección `#layoutReview` tras `#traceWarnings`, con el mismo patrón de botones que localizan el elemento.
  - El campo `#layoutReviewClearance` es opcional.
  - El detalle `#layoutReviewLimits` muestra exclusiones y límites.
  - `drawReview()` pinta `#gReview`; `#layoutReviewActive` y `#layoutReviewClearHighlight` describen y retiran el resaltado.
  - Los nombres se traducen con `nm()`.
- [`index.html`](../../index.html):
  - carga el script tras `tracing-core.js`;
  - añade `<g id="gReview">` al SVG del plano;
  - vacía ese grupo en la copia que exporta a PNG;
  - aplica estilos de lista equivalentes a `#traceWarnings`.

**Relación con Pascal** (`pascalorg/editor` @ `67f8041`): se adapta solo el **patrón de evidencia** de `check_collisions`, con estados `checked`/`partial`/`insufficient_evidence`, omisiones y límites explícitos. **No** se usa su AABB envolvente ni su zona de puerta rectangular: Rubik ya tenía la huella orientada y datos de bisagra y sentido.

## Pruebas

Ejecutadas una a una, sin suites en paralelo, en clones git aislados del checkout, para que las capturas que escriben las suites no lo toquen.

- **Versiones comparadas:** `master` `c4f2493` frente a la Fase A con esta corrección (`02b8165` más los cambios). Antes de la batería se comprobó que el clon era idéntico al checkout, archivo por archivo.
- **Base:** los resultados de `master` son los de la ejecución secuencial de la misma sesión. `master` no ha cambiado (`c4f2493`).
- **Entorno:** Chromium headless 1194 con SwiftShader. jsDelivr devuelve 403 en el proxy, así que Three.js 0.160.0 se sirvió con un *shim* local de `curl` a partir del tarball npm de la misma versión.

| Suite | `master` | Fase A con corrección |
| --- | --- | --- |
| `tests/layout-review.test.cjs` + `tests/layout-review.browser.test.cjs` | — | 18/18 (16 unitarias, 2 de navegador a 1440×900 y 390×844) |
| Unitarias Node existentes (`tracing`, `room-layout`, `project`, `library`, `interop`, `wall_assist`, `raw_wall_export`, `surfaces`, `assets`, `furniture-search`) | 124 pasan, 1 se omite (Blender) | 124 pasan, 1 se omite (Blender) |
| `tests/browser.test.cjs` | 36 pasan, 1 se omite (test 9, chequeo de CDN propio del test) | 36 pasan, 1 se omite (mismo test) |
| `tests/assets.browser.test.cjs` (F3) | 21 pasan, 4 fallan (2, 15, 16, 17) | 21 pasan, 4 fallan (los mismos; mismo error y mismo número de ocurrencias por test: 18, 11, 11 y 11) |
| `tests/surfaces.browser.test.cjs` | 7/7 | 7/7 |
| `tests/room-layout.browser.test.cjs` (dimensiones) | 5/5 | 5/5 |

**Qué cubren las pruebas nuevas:**
- estados parciales con objetos omitidos: con umbral y puerta activa, con umbral y sin puerta activa, sin umbral, y puertas sin `swing`;
- el estado global;
- la conservación de los hallazgos válidos;
- la geometría exacta de la evidencia: intersección, segmento y hoja en el ángulo de contacto;
- en navegador, a 1440×900 y 390×844:
  - el resaltado de los tres tipos, con su posición en pantalla comparada con la evidencia mapeada por la transformación del propio SVG (menos de 3 px), también tras ampliar el zoom;
  - el retiro del resaltado al quitar el umbral, al pulsar «Quitar resaltado», al cambiar de proyecto y al cerrar las herramientas;
  - la exportación PNG sin resaltado;
  - proyecto, `localStorage` y pilas de deshacer/rehacer idénticos.

Capturas inspeccionadas visualmente en [`docs/qa/artifacts/layout-review/`](../qa/artifacts/layout-review/):
- `1440x900.png` y `390x844.png` (panel);
- `*-door.png`, `*-clearance.png` y `*-overlap.png` (resaltados).

Los resaltados coinciden con las huellas y la puerta, y no tapan controles ni texto. En móvil se ven pequeños con el zoom de ajuste.

**Fallos preexistentes en `master`, no introducidos aquí.** Los 4 fallos de F3 son errores de página «Failed to execute 'replaceChildren' … blur event handler», en flujos de edición de muebles ya existentes. Es el mismo patrón de re-render reentrante que la sección `#layoutReview` evita: su campo ignora un `change` que no cambia el valor. No se corrigen en esta entrega porque quedan fuera de su alcance.

**Búsqueda a 1440×900, de la entrega anterior.** Una ejecución en paralelo falló por un timeout de 30 s, esperando a que un GLB texturizado quedara `ready` en 3D. No era un fallo de búsqueda. En ejecución secuencial pasa en `master` y en la Fase A, dos veces cada una. En esta batería vuelve a pasar dentro de la suite F3.

`git diff --check`, `node --check` de los JS modificados y `scripts/check-documents.py`: correctos.

**Sin verificar:**
- la preview Vercel de esta rama;
- un teléfono físico;
- la revisión visual de Juanma.

SwiftShader no acredita rendimiento.

## Pendiente, no presentado como hecho

- A poco zoom, en móvil, los resaltados son pequeños. Centrar la vista no amplía automáticamente.
- Textos en inglés y chino: el panel «Plano propio» existente ya es solo en español; se sigue esa convención.
- Decisión D-A1 del borrador: si conviene ofrecer valores orientativos de holgura. En esta iteración no hay umbral predeterminado; la decisión sigue abierta.
- Ampliar las exclusiones solo con evidencia del código de Rubik. Ejemplo: sillas bajo la mesa, que hoy se informarían como solape de huellas con su limitación.

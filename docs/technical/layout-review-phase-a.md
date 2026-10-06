# Fase A (propuesta Pascal→Rubik) — revisión local de distribución

**Estado: implementación inicial en rama aislada, pendiente de revisión.** No es una fase canónica.

- **Base:** `claude/intelligent-pasteur-vci64k`, sobre `master` `c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3`.
- **Origen:** el borrador [PASCAL-RUBIK-INTEGRATION-ROADMAP](../proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md), sección 8, Fase A, que sigue sin aprobar.
- **Lo que no modifica:**
  - el [roadmap canónico](../ROADMAP.md) ni su numeración;
  - `FloorPlanProjectV1`, su schema, unidades, ejes, persistencia ni formato JSON/ZIP;
  - la entrega autorizada **LAB v03**.

## Qué hace

La revisión es **de solo lectura** y se recalcula en cada render del panel «Plano propio», justo debajo de los avisos W1–W4. No mueve, edita ni guarda nada. El umbral de holgura vive solo en memoria de la sesión. Cubre tres comprobaciones:

| Comprobación | Método | Estado si faltan datos |
| --- | --- | --- |
| **Solapes entre muebles** | Huella orientada de Rubik (`FloorPlanTracing.footprint`, la misma de W3) y ejes separadores sobre las normales de ambos rectángulos. Mide la penetración mínima en mm. Si las huellas solo se tocan, no hay solape. | `partial` si algún objeto no tiene posición, tamaño o giro válidos. |
| **Holgura entre muebles** | Distancia mínima exacta entre los dos polígonos convexos (vértice-arista en ambos sentidos). Se informa si es **estrictamente menor** que el umbral que indica la persona. Si el segmento más corto atraviesa un sólido de muro activo (`FloorPlanCore.geometry`, que ya descuenta los huecos de puertas y ventanas), el par se excluye porque no es un hueco libre. | **Sin umbral: `insufficient_evidence`.** No hay valor predeterminado ni se afirma ninguna norma. |
| **Barrido de puertas** | Para cada puerta abatible en un muro activo, el barrido es exactamente el que dibuja el plano 2D: cuarto de círculo con centro en la bisagra sobre la cara del muro y radio igual al ancho del hueco, de la posición cerrada a la abierta (90°). Usa la bisagra (`start`/`end`) y el sentido (`left`/`right`) **guardados** en `opening.swing`. La huella se recorta al cuadrante y se calcula el **ángulo al que la hoja alcanza el mueble**. | Una puerta sin `swing` se omite con motivo y **no se declara bloqueada**. La geometría 2D/3D le aplica por defecto la bisagra en `start` y la apertura a la izquierda (`left`) para dibujarla, pero esa suposición no se usa como evidencia. Puertas: `partial` si faltan algunas, `insufficient_evidence` si faltan todas. |

**Estado global:**
- `checked` si las tres comprobaciones concluyen;
- `insufficient_evidence` si ninguna concluye;
- `partial` en cualquier otro caso.

**Cada hallazgo incluye:** los IDs implicados (`obj_…`, `opn_…`), la medición (mm o grados), el método y la limitación. El informe lista siempre las exclusiones, las omisiones y lo no comprobado.

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
- [`js/tracing-ui.js`](../../js/tracing-ui.js): sección `#layoutReview` tras `#traceWarnings`, con el mismo patrón de botones que localizan el elemento. El campo `#layoutReviewClearance` es opcional. El detalle `#layoutReviewLimits` muestra exclusiones y límites. Los nombres se traducen con `nm()`.
- [`index.html`](../../index.html): carga el script tras `tracing-core.js` y aplica estilos de lista equivalentes a `#traceWarnings`.

**Relación con Pascal** (`pascalorg/editor` @ `67f8041`): se adapta solo el **patrón de evidencia** de `check_collisions`, con estados `checked`/`partial`/`insufficient_evidence`, omisiones y límites explícitos. **No** se usa su AABB envolvente ni su zona de puerta rectangular: Rubik ya tenía la huella orientada y datos de bisagra y sentido.

## Pruebas

Ejecutadas una a una (sin suites en paralelo) en clones git aislados del checkout: `master` `c4f2493` frente a la Fase A (`60060c6` más estos cambios). Así las capturas que escriben las suites no tocan el checkout de trabajo. Chromium headless 1194 con SwiftShader. **Condición del entorno:** jsDelivr devuelve 403 en el proxy. Three.js 0.160.0 se sirvió con un *shim* local de `curl` a partir del tarball npm de la misma versión.

| Suite | `master` | Fase A |
| --- | --- | --- |
| `tests/layout-review.test.cjs` (nueva) | — | 12/12 |
| `tests/layout-review.browser.test.cjs` (nueva, 1440×900 y 390×844) | — | 2/2 |
| Unitarias Node existentes (`tracing`, `room-layout`, `project`, `library`, `interop`, `wall_assist`, `raw_wall_export`, `surfaces`, `assets`, `furniture-search`) | 124 pasan, 1 se omite (Blender) | 124 pasan, 1 se omite (Blender) |
| Python (`tests/*.py`) | — | 4/4 OK (ejecutadas en el checkout; no escriben ficheros) |
| `tests/browser.test.cjs` | 36 pasan, 1 se omite (test 9, chequeo de CDN propio del test) | 36 pasan, 1 se omite (mismo test) |
| `tests/assets.browser.test.cjs` (F3) | 21 pasan, 4 fallan (2, 15, 16, 17) | 21 pasan, 4 fallan (los mismos) |
| Búsqueda de muebles 1440×900, aislada y repetida dos veces | 2/2 | 2/2 |
| `tests/surfaces.browser.test.cjs` | 7/7 | 7/7 |
| `tests/room-layout.browser.test.cjs` (dimensiones) | 5/5 | 5/5 |

**Fallos preexistentes en `master`, no introducidos aquí.** Los 4 fallos de F3 son errores de página «Failed to execute 'replaceChildren' … blur event handler», en flujos de edición de muebles ya existentes. Es el mismo patrón de re-render reentrante que la sección `#layoutReview` evita: su campo ignora un `change` que no cambia el valor. No se corrigen en esta entrega porque quedan fuera de su alcance.

**Búsqueda a 1440×900.** Una ejecución anterior en paralelo falló en ella por un timeout de 30 s, esperando a que un GLB texturizado quedara `ready` en 3D (línea 193). No era un fallo de búsqueda. Sobre `master` esa ejecución se cortó antes de llegar al caso. En ejecución secuencial pasa en ambas versiones, dos veces cada una, en unos 22 s. No es una regresión.

`git diff --check`, `node --check` de los JS modificados y `scripts/check-documents.py`: correctos.

**Sin verificar:**
- la preview Vercel de esta rama;
- un teléfono físico;
- la revisión visual de Juanma.

SwiftShader no acredita rendimiento.

## Pendiente, no presentado como hecho

- Resaltado del hallazgo sobre el plano 2D. Hoy el botón selecciona y centra el mueble, pero no dibuja la zona en conflicto.
- Textos en inglés y chino: el panel «Plano propio» existente ya es solo en español; se sigue esa convención.
- Decisión D-A1 del borrador: si conviene ofrecer valores orientativos de holgura. Hoy no hay ninguno, por instrucción expresa.
- Ampliar las exclusiones solo con evidencia del código de Rubik. Ejemplo: sillas bajo la mesa, que hoy se informarían como solape de huellas con su limitación.

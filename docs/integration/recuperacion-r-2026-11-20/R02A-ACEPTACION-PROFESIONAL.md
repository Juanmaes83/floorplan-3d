# R02-A · Techos y elementos altos: deltas pendientes y aceptación profesional (20/11/2026)

> **Estado:** conectado en master como **experimental**. Este documento no cambia código. Prepara la aceptación del propietario sobre el alcance que ya existe.

## 1. ¿Queda código desarrollado sin integrar?

**No hay delta de código con valor pendiente.** Comprobado sobre master `4ea7cb3b`:

| Origen | Situación |
|---|---|
| `lab/sculpt-r02a-normalized`, `lab/r02a-bridge-20261113`, `integration/r02a-ceiling-on-master-20261113` | **Ancestros de master** |
| `lab/sculpt-r02-ceiling-layout@7d8a6269` (#193) | Normalizado en lo anterior; no se fusiona entero (decisión de #203). Sus funciones sin equivalente en `js/r02a-*` son solo `donor3d` y `donorRule`, del comparador de paridad con el donante |
| Mallas 3D del donante (lámpara, calefactor, cortina) | Excluidas a propósito; serían **R02-B**, una pieza nueva que no se abre |

**Integrado y comprobado:**
- `js/r02a-ceiling-{core,contract,session,bridge,editor}.js` y `js/r02a-donor-extracts.js`;
- 6 puntos de conexión en `index.html`;
- pruebas puras: core 22/22, bridge 6/6, session 12/12, integration-contract 7/7, activation 3/3 (**50/50**);
- de navegador: `r02a-editor.browser`, `r02a-lab.browser` y `r02a-r03-coexistence.browser`, según `docs/technical/r02a-integracion-editor-2026-11-13.md`.

## 2. Alcance que se acepta

En el panel de **la estancia seleccionada**, «Techo y elementos altos · experimental»:
- **Referencia vertical** de planta o de estancia, con fuente obligatoria. Si es desconocida: **«Pendiente de datos»**, sin techo en 3D y sin guardar. Nunca se usa la altura de los muros.
- **Elementos:** añadir, modificar y quitar los 6 tipos rotulados del catálogo del donante.
- **Acciones:** «Comprobar», «Ver alternativas» y «Colocar tocando el plano», con ratón y con dedo.
- **Guardado:** solo con la confirmación expresa, por `commit()` y en un paso del deshacer.
- **Al abrir:** se recomprueba cada elemento.
- **Representación:** capa 2D `#gCeiling` con color por estado y grupo 3D a sus cotas.
- **Entrega:** las exportaciones y la entrega al cliente **no** incluyen los elementos de techo (ENT-01 descarta `extensions`).

## 3. Recorrido de aceptación (propietario, Preview exacta)

1. Abrir el ejemplo y seleccionar una estancia: aparece la sección experimental con sus límites visibles.
2. Sin referencia: «Pendiente de datos»; no se dibuja techo y no se puede guardar.
3. Indicar una referencia de planta con fuente (p. ej. 2600 mm, «medición»).
4. Añadir una lámpara colgante en una zona libre, «Comprobar»: «revisable», con sus cotas.
5. Colocar un elemento sobre un mueble: «pendiente de datos», porque el mueble no tiene altura.
6. Poner un elemento contra el armario R03: «Bloqueado», sin cambios.
7. «Ver alternativas» y aplicar una, confirmar y guardar. Deshacer y rehacer.
8. Guardar, recargar y reabrir: se recomprueba y avisa si algo ya no cumple.
9. Exportar el JSON de entrega al cliente: sin elementos de techo.
10. En móvil (390×844): el panel y la colocación por toque, sin desbordes.

## 4. Decisiones que necesita el propietario (de `r02a-integracion-editor` §6)

| N.º | Decisión | Recomendación |
|---|---|---|
| 1 | **Altura de paso.** Un elemento «revisable» puede colgar a 40 cm del suelo con una referencia rebajada; la prueba lo fija como límite | Definir la regla (altura mínima, dónde, para quién) antes de quitar «experimental» |
| 2 | **Muebles sin altura** | Aceptar la limitación en el piloto; indicar la altura del mueble es otro corte |
| 3 | **Contrato:** `x-r02a-ceiling` (extensión) frente a `ceilingItems[]` (versión menor) | Ratificar la extensión: ya conectada, y no toca el esquema base ni OP-07 |
| 4 | **Referencia vertical:** «planta con excepción por estancia»; derivarla de la planta superior en edificios | Ratificar lo implementado; la derivación queda como decisión aparte |
| 5 | **Recolocación automática** solo con muros alineados a los ejes | Aceptar como límite declarado |
| 6 | **Tamaños** genéricos y rotulados del donante | Aceptar en el piloto |
| 7 | **GOV-05:** coautoría de IA y aviso MIT del donante (`docs/licenses/r02a-donor-MIT.txt`) | Cerrarlo es requisito para salir de «experimental» |
| 8 | **Nombres de muebles** en los avisos, tal como se guardan | **Resuelto** en `claude/r03-holguras@e984705e`: `r02a-ceiling-editor.js` muestra muebles y estancias por `window.FloorPlanDisplayName`. Regla permanente: sin chino en ES/EN, vigilada por `tests/no-chinese-display.browser.test.cjs` |

## 5. Para salir de «experimental»

Hace falta:
- decisiones 1, 3, 4 y 7;
- el recorrido del §3 en la Preview exacta;
- Firefox y WebKit por Codex.

Mientras tanto se mantiene tal cual: no hay cambios de código.

## 6. Propuesta de cierre de las decisiones (para firmar; sigue «experimental» hasta entonces)

Cada propuesta reutiliza lo que ya existe y no amplía el alcance. No se abre R02-B.

| N.º | Propuesta concreta | Qué cambia si se aprueba | Prueba que la acredita |
|---|---|---|---|
| 1 · Altura de paso | **2100 mm** de paso libre bajo cualquier elemento en las zonas de circulación de la estancia (fuera de muebles). Por debajo, el estado pasa de «revisable» a **«bloqueado · paso libre»**, con la cota y el motivo. Fuera de circulación no se aplica | Una regla nueva en `r02a-ceiling-core` (`validate` y `previewDiff`) con su fuente declarada «decisión del propietario». **No es normativa** | La prueba que hoy **fija** el caso de 40 cm como «revisable» pasa a exigir «bloqueado». Casos en el límite: 2099 y 2100 mm |
| 2 · Muebles sin altura | **Aceptar la limitación** en el piloto: sobre un mueble, «pendiente de datos» y sin guardar. Indicar la altura del mueble queda fuera | Nada | Las pruebas actuales ya lo fijan |
| 3 · Contrato | **Ratificar `x-r02a-ceiling`** (extensión versionada). Rechazar `ceilingItems[]` | Nada (ya implementado). Se registra la ratificación en el handoff maestro | `r02a-integration-contract` 7/7 |
| 4 · Referencia vertical | **Ratificar «planta con excepción por estancia»**, con fuente obligatoria. La derivación desde la planta superior queda **fuera** hasta una decisión propia | Nada | `r02a-ceiling-core` 22/22 y `r02a-editor.browser` |
| 5 · Recolocación automática | Aceptar «solo con muros alineados a los ejes» como límite **visible** en el panel | Una línea de texto en los límites del panel | Comprobar la frase en `r02a-editor.browser` |
| 6 · Tamaños del donante | Aceptar en el piloto, **rotulados** «genéricos» | Nada | Ya rotulados |
| 7 · GOV-05 | Cerrar con el expediente de licencia y coautoría (aviso MIT en `docs/licenses/r02a-donor-MIT.txt` + nota de coautoría de IA en el handoff) | Documento | Revisión del propietario |
| 8 · Nombres | Resuelto (ver §4) | Integrar con `claude/r03-holguras` | `no-chinese-display.browser` 3/3 |

**Orden propuesto:**
1. Firmar 2, 3, 4, 5, 6 y 8: no requieren código, o es mínimo.
2. Decidir 1: es la única con código nuevo y la que más protege.
3. Cerrar 7.
4. Con las ocho cerradas y el recorrido del §3 hecho en la Preview exacta, retirar «experimental» con autorización expresa.

## 7. Decisiones del propietario (20/11/2026)

| N.º | Decisión | Estado |
|---|---|---|
| 3 | Contrato `x-r02a-ceiling` | **Ratificado** |
| 4 | Referencia vertical de planta con excepción por estancia | **Ratificada.** La derivación desde la planta superior queda fuera |
| 2, 5, 6 | Limitaciones declaradas del piloto (muebles sin altura, recolocación solo con muros alineados a los ejes, tamaños genéricos rotulados) | **Ratificadas** |
| 8 | Nombres visibles | Resuelto en `claude/r03-holguras` (`nm()` y `FloorPlanDisplayName`) |
| 1 | Paso libre | **2100 mm como criterio inicial de diseño**, pendiente de validación profesional (§8) |
| 7 | GOV-05 | Abierto |

**Sigue experimental** hasta que se cumplan las tres condiciones: GOV-05, la aceptación del recorrido (§3) y los gates de Codex (Firefox, WebKit, Windows).

## 8. Criterio de paso libre de 2100 mm · especificación CORREGIDA (sin aplicar)

> **Corrección (revisión del propietario, 20/11/2026).** La versión anterior trataba «la superficie de la estancia que no ocupa ningún mueble» como zona de circulación. **Es incorrecto:** una superficie libre no es por sí sola un lugar por el que se circula, como un rincón, el hueco tras un sofá o el espacio sobre una bañera. Queda retirada.

**Naturaleza.** Es un **criterio inicial de diseño** del propietario, pendiente de validación profesional.
- **No** es cumplimiento normativo y no se presenta como tal.
- **No** se extiende a cualquier estancia ni punto.
- **Sin una zona de circulación verificable no hay bloqueo.**

### Zona de circulación verificable (motor existente, sin motor nuevo)

Se reutiliza el planificador de recorridos de RUBIK, `FloorPlanPresentationRoute.plan(project, geometry, roomId)` (`js/presentation-route.js`), que ya calcula el camino real de una persona:
- Dijkstra sobre una rejilla de 200 mm alineada con los muros;
- desde la **puerta de entrada**, atravesando puertas de altura ≥ 1,85 m;
- con margen duro `clearanceMm` (220 mm) a muros, ventanas, correderas y muebles.

1. Para cada estancia de la planta activa se pide `plan(...)`. **Solo cuenta un resultado `kind:'interior'`** (`code:'clear'`), con sus `points` y su `clearanceMm`.
2. **Zona de circulación** = la banda de semiancho `clearanceMm` alrededor de la polilínea `points` de esos recorridos: el espacio que el propio motor garantiza libre.
3. Si el resultado es `aerial` (sin camino interior) o `unavailable` (sin entrada, sin polígono o entrada baja), **esa estancia no tiene zona verificable**:
   - el criterio **no se aplica**;
   - el estado lo dice: «Paso libre no evaluado: no hay un recorrido verificable hasta esta estancia».
4. La banda puede ser más estrecha que un paso real. Es un **mínimo verificable**, no la superficie de paso de diseño. Ampliarla a un ancho de paso (p. ej. 800 mm) es una decisión pendiente, y no se supone.

### Regla

- Se reutiliza **`lowestPointMm`** del montaje que ya calcula `r02a-ceiling-core` (`mount.lowestPointMm`, la cota más baja del elemento, incluidos descuelgue, cuerpo y cortina). No se recalcula nada.
- Un elemento queda sujeto al criterio solo si **su huella en planta corta la zona de circulación verificable**.
- Con elemento sujeto y `lowestPointMm < 2100`: el estado pasa de «revisable» a **«bloqueado · paso libre»**, con la cota, lo que falta hasta 2100 y el recorrido afectado. Texto: *«Criterio de diseño inicial (2100 mm en el recorrido de paso), pendiente de validación profesional. No es una comprobación normativa.»*
- Con `lowestPointMm ≥ 2100`: nada cambia.

**Casos sin bloqueo:**

| Caso | Estado |
|---|---|
| Elemento fuera de la banda | Sin cambios, aunque esté en una zona libre de muebles |
| Sin referencia vertical (`mount` no calculado) | «Pendiente de datos», como hoy; nunca se supone |
| Estancia sin recorrido `interior` | «Paso libre no evaluado», sin bloqueo |
| Familias `storage`, `utility`, `garage` | Excluidas, salvo decisión del propietario |

### Implementación prevista (corte pequeño, sin motor nuevo)

1. `r02a-ceiling-core`: `PASSAGE_CRITERION = { minClearMm: 2100, source: 'owner-design-criterion-2026-11-20', normative: false, zone: 'presentation-route-interior-band', excludedFamilies: ['storage','utility','garage'] }`.
   - La comprobación recibe la **zona ya calculada** (polilíneas y semiancho) como dato de entrada. El núcleo sigue puro y no llama al planificador.
2. `r02a-ceiling-editor`: obtiene la zona con `FloorPlanPresentationRoute.plan` y la pasa al núcleo. Muestra el aviso y, opcionalmente, la banda en el plano 2D, solo como lectura.
3. El contrato `x-r02a-ceiling` **no cambia**: la zona y el criterio no se guardan, se evalúan.

### Pruebas que lo acreditarán

| Tipo | Caso |
|---|---|
| Positivas | Elemento sobre el recorrido `interior` con `lowestPointMm` 2099: bloqueado, con la cota, el margen y el recorrido. 2100 exactos: sin cambios. El caso de #217 (40 cm del suelo) **sobre el recorrido**: bloqueado |
| Negativas | El mismo elemento, en una **zona libre de muebles fuera del recorrido**: sin bloqueo (es el error de la especificación anterior). Estancia con recorrido `aerial` o `unavailable`: «no evaluado», sin bloqueo. Sin referencia: «pendiente». Familias excluidas: sin criterio. El texto no menciona ninguna norma |
| Determinismo | La zona es idéntica entre ejecuciones (mismo `points`) y no depende del orden de los muebles |
| Contrato | El documento guardado es byte a byte igual con el criterio activo |
| Navegador | `r02a-editor.browser` muestra el aviso y, en el plano, la banda del recorrido |

**Siguiente:** aplicar este corte solo con tu autorización y tras la validación profesional del valor de 2100 mm. **Sin una zona verificable no se activa ningún bloqueo.**

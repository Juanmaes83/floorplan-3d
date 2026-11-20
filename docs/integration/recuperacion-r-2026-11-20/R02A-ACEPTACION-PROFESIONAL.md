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

## 8. Criterio de paso libre de 2100 mm · especificación preparada (sin aplicar)

**Naturaleza.** Es un **criterio inicial de diseño** del propietario, pendiente de validación profesional.
- **No** es cumplimiento normativo y no se presenta como tal: ni CTE ni otra norma.
- **No** se extiende a cualquier estancia ni a cualquier punto de una estancia.

**Dónde se aplica: solo en las zonas de circulación.**
- **Zona de circulación:** la superficie de la estancia que **no** ocupa ningún mueble, en planta, con la misma huella que ya usa `FloorPlanPlacement`.
- Encima de un mueble **no se aplica**: ahí sigue la regla actual, «pendiente de datos», porque el mueble no tiene altura.
- **Estancias excluidas** del criterio, por familia: `storage`, `utility` y `garage`. Se decide así para no extender la regla de forma indiscriminada; la lista es ampliable solo por decisión del propietario.
- Pasillos (`hallway`) y el resto de estancias habitables: se aplica en sus zonas libres.

**Regla.** Para un elemento de techo dentro de una zona de circulación, se calcula `puntoMasBajo = referencia − descuelgue − altura del elemento`, con los mismos datos que ya calcula `mount` en `r02a-ceiling-core`:
- si `puntoMasBajo ≥ 2100 mm`, nada cambia;
- si `puntoMasBajo < 2100 mm`, el estado pasa de «revisable» a **«bloqueado · paso libre»**, con la cota, el margen que falta y el texto *«Criterio de diseño inicial (2100 mm en zonas de paso), pendiente de validación profesional. No es una comprobación normativa.»*;
- sin referencia vertical: «pendiente de datos», como hoy; **nunca se supone**.

**Implementación prevista** (un corte pequeño, sin motor nuevo):
1. `r02a-ceiling-core`:
   - una constante `PASSAGE_CRITERION = { minClearMm: 2100, source: 'owner-design-criterion-2026-11-20', normative: false, excludedFamilies: ['storage','utility','garage'] }`;
   - la comprobación dentro de `validate`/`previewDiff`, reutilizando la huella de `FloorPlanPlacement` para saber si el punto está sobre un mueble.
2. `r02a-ceiling-editor`: el aviso con el texto anterior, siempre visible junto al estado.
3. El contrato `x-r02a-ceiling` **no cambia**: el criterio no se guarda, se evalúa.

**Pruebas que lo acreditarán:**

| Tipo | Caso |
|---|---|
| Positivas | 2100 mm exactos pasa; 2099 bloquea con la cota y el margen correctos; el caso de #217 (40 cm del suelo) pasa de «revisable», fijado hoy como límite, a «bloqueado · paso libre» |
| Negativas | Sobre un mueble: «pendiente de datos», sin criterio. En `storage`, `utility` y `garage`: no se aplica. Sin referencia: «pendiente», nunca supuesto. El texto no menciona ninguna norma ni cumplimiento |
| Contrato | El documento guardado es byte a byte igual con el criterio activo |
| Navegador | `r02a-editor.browser` muestra el aviso y el texto exacto |

**Siguiente:** aplicar este corte cuando lo autorices, y la validación profesional del valor de 2100 mm.

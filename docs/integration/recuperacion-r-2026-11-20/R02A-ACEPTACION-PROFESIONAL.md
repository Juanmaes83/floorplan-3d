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
| 8 | **Nombres de muebles** en los avisos, tal como se guardan | Traducir con el diccionario existente (corte menor) |

## 5. Para salir de «experimental»

Hace falta:
- decisiones 1, 3, 4 y 7;
- el recorrido del §3 en la Preview exacta;
- Firefox y WebKit por Codex.

Mientras tanto se mantiene tal cual: no hay cambios de código.

# QA — Corte B: entorno visual 3D decorativo (20-10-2026)

| Dato | Valor |
| --- | --- |
| Rama | `feat/premium-3d-setting`, apilada sobre `feat/premium-ux-system` (corte A) |
| Diseño | [§4 del diseño](../product/premium-ux-design-2026-10-20.md#4-entorno-visual-3d-corte-b) |
| Renderer | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))` (**render por software, sin GPU**) |
| CI | **No ejecutada** |

## 1. Problema y resultado

- **Problema.** En 3D, la vivienda flotaba sobre un plano color crema; de noche, sobre un negro absoluto. Esto último ya ocurría antes del corte: `0,0,0` medido en la base.
- **Resultado.** Hay un selector **«Entorno»** junto a la luz solar, con tres opciones:
  - **Estudio**, por defecto: fondo perla mate, sobrio y adecuado para pisos y entregas.
  - **Jardín suave:** suelo verde desaturado que se funde hacia un borde neutro, con fondo claro.
  - **Ciudad:** pavimento gris con una retícula ligera y fondo gris cálido.
- **Noche.** Cada entorno tiene un aspecto nocturno; el suelo conserva una autoiluminación tenue para que el entorno se lea sin iluminar la vivienda.
- **Aviso de fondo decorativo.** El selector lo indica de tres formas:
  - texto visible «decorativo»;
  - `title`;
  - descripción accesible: «Fondo decorativo: no representa terreno, jardín ni entorno urbano reales».
- **Dónde se guarda.** Es una **preferencia de este navegador**, no un dato del proyecto: no entra en el JSON, el ZIP ni el historial de deshacer.
- **Coherencia con la entrega.** El editor, la captura 3D, «Exportar imagen» y la presentación usan el mismo entorno. El PNG exportado tiene el mismo color que la escena: prueba con píxel de esquina, tolerancia 6.

**Capturas.** [`artifacts/premium-ux/environment/compare-1440x900.png`](artifacts/premium-ux/environment/compare-1440x900.png) muestra el antes, los tres entornos de día y los tres de noche. Además hay capturas a 390×844, los PNG exportados de día y de noche y `environment.json`.

## 2. Alternativas consideradas

| Alternativa | Decisión |
| --- | --- |
| Césped como fondo universal (como en LoRA LAB, C3/V3) | **No.** Sugiere un jardín que no existe en un piso urbano; queda como opción |
| Fondo con degradado | Probado y **descartado**. La textura de fondo pasa por el *tone mapping*: de noche se volvía negra y de día más gris de lo diseñado. Se usa un color sólido, como antes del corte |
| Entorno guardado en el proyecto | **No.** No forma parte del modelo; cambiaría el contrato sin aportar datos reales |
| Entorno decidido por la escena según su tipo | **No.** Rubik no sabe si una vivienda es urbana o unifamiliar; la elección es del profesional |
| Modelos de árboles, edificios o cielo HDR | **Fuera de alcance:** carga gráfica, licencias y riesgo de «información urbanística» falsa |

## 3. Pruebas

`tests/environment-3d.browser.test.cjs` (1440×900, 390×844 y 844×390, con three.js local):

- «Estudio» viene por defecto. Las tres opciones aparecen en español, con el aviso de fondo decorativo y `aria-describedby`.
- El selector es alcanzable.
- El fondo cambia al pasar a «Jardín suave».
- De noche la escena es más oscura, pero **no negra**: la suma RGB es de 30 o más.
- El PNG de «Exportar imagen» coincide con el fondo del editor.
- El proyecto y su historial no cambian, y el JSON no contiene el entorno.
- La preferencia sobrevive a una recarga.
- No hay desplazamiento horizontal ni errores.
- **Con el código anterior falla:** no existe `#env3d`.

**Medición** (`scripts/qa/ux/environment.cjs` y una sonda de fotogramas, sólo SwiftShader):

| | Base (`529bec0`, sin entorno) | Corte B, «Estudio» |
| --- | --- | --- |
| ms por fotograma, 1440×900 (3 tandas de 3 s) | 1064 · 1061 · 1157 y 1035 · 1025 · 1131 | 1081 · 1045 · 1087 |

**Lectura.** No hay diferencia medible en este entorno. Las cifras corresponden a render por software y **no** predicen el rendimiento con GPU ni en teléfonos. La GPU real y un teléfono físico los debe medir Juanma.

## 4. Defectos encontrados y corregidos

| # | Defecto | Corrección |
| --- | --- | --- |
| B1 | La prueba usaba el editor guiado tras recargar. Ahí los controles 3D avanzados (sol y entorno) están ocultos, igual que antes del corte | La prueba abre el editor completo, como haría una persona |
| B2 | El degradado de fondo pasaba por el *tone mapping*: cielo negro de noche (`0,0,0`) y gris de día | Fondo de color sólido por entorno |
| B3 | El suelo nocturno ya era negro antes del corte; con «Jardín» o «Ciudad» no se veía ningún contexto | Autoiluminación tenue del suelo sólo de noche. La prueba exige que no sea negro |

## 5. Regresión

**Base de comparación:** #66 `5967fa2`. Mismo entorno: Chromium 141, SwiftShader, three.js local, ejecución secuencial. Cabeza final `3eb1411`, que contiene el corte A completo (A12 y A13). Las suites del editor se cuentan en el informe de A y en el de C.

| Suite | B | Base | Lectura |
| --- | --- | --- | --- |
| Unitarias | 246/246 | — | PASS |
| `environment-3d` | 3/3 | — (no existe) | PASS |
| `capture-3d` | 3/3 | — | PASS |
| `mirror-pilot` | 1/1 | — | PASS |
| `premium-shell` | 4/4 | — | PASS |
| `variants-visual` | 4/4 | 4/4 | PASS (falló en la ronda 1: defecto A12, corregido) |
| `presentation-framing` | 6/6 | — | PASS |
| `material-detail` | 4 pasan, 1 falla (1440×900) | la misma prueba falla | Fallo previo |
| `assets` (aislada) | 20 pasan, 5 fallan | los mismos 5 | Fallo previo (cargas de GLB abortadas). Con otra suite en paralelo fallaban 11; aislada, idéntico a la base |
| `presentation-batch` | 7 pasan, 2 fallan | los mismos 2 | Fallo previo (no llega la descarga). La prueba de redimensionar falló en la ronda 2: defecto A13, corregido |
| `presentation-light` | 3 pasan, 3 canceladas | idéntico | Timeout previo, **no** es PASS |
| `presentation-minimap` | 4 pasan, 1 cancelada | idéntico | Timeout previo, **no** es PASS |
| `presentation-reveal` | 2 pasan, 6 fallan por espera | idéntico | Timeout previo, **no** es PASS |
| `presentation-contact` | 4 pasan, 1 cancelada | idéntico | Timeout previo, **no** es PASS |
| `presentation-route` | 7 pasan, 1 cancelada | idéntico | Timeout previo, **no** es PASS |
| `procedural-details`, `render-budget` | sin resultado (timeout) | sin resultado | **No ejecutado** en este entorno |
| `presentation` | sin resultado (límite de 1700 s) | sin resultado | **No ejecutado** en este entorno |

**Conclusión:** ninguna suite falla en B y pasa en la base. Las dos diferencias encontradas eran del corte A (A12 y A13), se corrigieron con una prueba que falla con el código anterior y están en `3eb1411`. Las suites con timeout necesitan GPU real para dar un resultado; no se cuentan como PASS.

## 6. Límites

- Sin GPU real ni teléfono físico.
- El entorno es decorativo: no es terreno levantado, jardín medido ni dato urbanístico.
- Las preferencias del público D-01 sobre el entorno no están medidas.
- Los preajustes de luz de la presentación («cálida» o «neutra») ya no cambian el color de fondo; lo decide el entorno elegido.

# #238 · Reconciliación con `master` (CAT-04 #237) — acta

**PR:** [Juanmaes83/floorplan-3d#238](https://github.com/Juanmaes83/floorplan-3d/pull/238) · `feat/assistant-generative-v3` · **Draft**.
**MAXIMA SEGURIDAD · STOP_GASTO · NO MERGE · NO PRODUCTION.** Publicar esta rama en Draft **no** autoriza su integración.

- **Gasto:** 0. Ningún proveedor, OpenAI, Redis de pago, Render IA ni piloto #239. El modelo de las pruebas es siempre un **doble rotulado**.
- **Base nueva:** `master@46174d6918e336119a79f5bda9fd2733aa5464c4` (merge de #237, que contiene XR-01/XR-02, F1–F7, F8 y F8-C).
- **HEAD anterior de #238:** `5e3a2e987f89e95a83d4888b08e64a4758d42f26`, apilado sobre `bd1024c`.

## 1. Reconciliación Git

| Paso | Resultado |
|---|---|
| Árbol de trabajo antes de empezar | Limpio. `HEAD` = `5e3a2e9`, `origin/master` = `46174d6`, como indicó el propietario |
| Método | `git merge --no-ff origin/master`, **sin reescribir historia y sin force-push** → commit `eb6cc57` |
| Conflictos | **Uno:** `.github/workflows/assistant-ai-v2.yml`, en la línea de las pruebas puras |
| Resolución | **Unión de ambos lados:** `tests/cat04-f1f2.test.cjs` (F1–F8 de `master`) y las pruebas generativas, de pasarela y de evaluación de #238, más el paso del libro de gasto sobre Redis **local**. YAML válido |
| `cat-ia-v1.yml` | Idéntico al de `master` (#238 no lo toca) |
| Ancestros | `origin/master` y el `5e3a2e9` anterior son **ancestros** del resultado |
| Diff residual contra `master` | Exactamente los **25 ficheros** propios de #238. En 24, el cambio es **idéntico** al que hacía #238 sobre su base anterior; en el workflow, la unión descrita |

Después del merge, esta reconciliación añade un commit (`16a7d13`, §2) y el commit de evidencias y acta (este documento). Ninguno de los dos toca los núcleos económicos de CAT-04 (`budget-core`, `budget-draft-core`, `budget-ui`, `catalog-budget-core`).

## 2. Contratos económicos del Asistente generativo × CAT-04

`tests/assistant-gen-cat04-economics.test.cjs` (puras) y `tests/assistant-gen-cat04.browser.test.cjs` (editor real, escritorio 1440×900 y móvil 390×844).

- El modelo es un **doble guionizado y rotulado**: no hay red, proveedor ni gasto.
- Las pruebas comprueban **lo que RUBIK garantiza alrededor de cualquier modelo**:
  - que las herramientas entregan el dato económico correcto;
  - que nada se modifica;
  - que una cifra inventada se marca como **no verificada** y se muestra con aviso.

| Contrato | Antes (`eb6cc57`) | Defecto | Corrección | Después |
|---|---|---|---|---|
| **1 · 180 €/m frente a ficha en €/ud** | ✗ | «Cuesta **180 EUR/ud**» pasaba la comprobación de cifras porque 180 aparecía como importe | Un importe **por unidad** («X €/ud», «€/m», «€/m²», «欧元/件») debe coincidir con un precio que una herramienta da **en esa misma unidad** | ✓ ES/EN/ZH. La herramienta entrega `price {180, m}`, `unitConflict {m→unit}`, `quantity:null`, `subtotalNet:null` y `objectCount:2` |
| **2 · Cantidad desconocida** | ✗ | «Has colocado **2 m**» pasaba porque 2 era el **recuento** de objetos | Una cifra presentada como **medida** (m, m², metros, 米…) debe venir de un campo numérico **que no sea un recuento**. Los números dentro de rótulos («rev 2») no cuentan como medidas | ✓ ES/EN/ZH. Se marcan «2» y el importe 360 € calculado desde el recuento; 180 €/m, en su unidad, no |
| **3 · Presupuesto incompleto** | ✓ | — | — | ✓. La herramienta separa partidas sin precio, cantidades pendientes, IVA no aplicable y precios sin revisar, cada causa con su recuento. `gross:null`. Un total inventado se marca (ES/EN/ZH) |
| **4 · IVA propio 10 % / 0 %** | ✗ | Un modelo **solo veía el IVA general**: no podía distinguir el tipo propio del heredado | **Aditivo:** `get_budget_summary.vat` = `{budgetRatePercent, ownRateItems[{id, description, ratePercent}], inheritingItems, withoutRateItems}`, y cada producto colocado lleva `vat {ratePercent, source: item\|budget}`. Las respuestas guiadas no cambian | ✓ tras abrir, editar (precio; general 21→4) y reabrir. Mismos importes que `calculateBudget`. Un 0 % es un tipo, no un dato que falta. En el editor real (escritorio y móvil): `localStorage` idéntico, respuesta honesta sin aviso y total inventado **con** aviso |
| **5 · Referencias visuales de otro estudio o de estudio desconocido** | ✓ | — | — | ✓. Llegan como `other-studio` / `studio-unknown` y **sin importe**. La limitación de la herramienta dice que «verified» es solo la huella visual |

**Rojo → verde:**
- Puras: **2/6 → 6/6** en `eb6cc57` → `16a7d13`.
- Navegador: **0/2 → 2/2**. En `eb6cc57` el doble no encuentra `vat`, la petición no termina y la prueba acaba por `timeout`.
- Regresión del Asistente: 84/84 pasan, incluido el arnés de evaluación (30/30 con el simulador de referencia).

**Límites declarados (no son comportamientos deseados):**
- La comprobación de cifras es **parcial**. No detecta:
  - una afirmación **sin cifras**, como «verificado comercialmente»;
  - una cifra real atribuida a **otra** partida.
- Esos casos los gobiernan la política del sistema y las limitaciones que viajan con cada herramienta. La interfaz nunca los presenta como verificados.
- **Solo se pueden medir con un modelo real** (piloto #239, **sin autorizar**).

## 3. `tests/assets.browser.test.cjs` · fallos de escritorio 1440×900 (job `132918091502`)

**Estado: ABIERTO.** No se declara resuelto. No se ha cambiado ningún límite (el cargador sigue en **8000 ms**), ni ninguna aserción, ni se ha omitido ninguna prueba.

- El test (`a3e1b812…`) y `js/asset-loader.mjs` (`f2575432…`) son **idénticos** en `master` y en la rama.
- La única diferencia en la ruta 3D es `index.html`, que carga 2 scripts del Asistente y emite `floorplan-project-switched` en `importProject`.

### 3.1 CI de GitHub: el mismo fallo en un SHA **sin** código de #238

Las escenas son cargas paralelas de 4 modelos (mixta) o de 6 (cohorte). Tiempos por modelo en ms; ABORT = abortado a los 8 s. Datos: `evidencia/assets-browser/ci-timings.txt`.

| SHA (contenido) | Job | Escena 1440×900 | Escena mixta 390×844 (pasa) |
|---|---|---|---|
| `0babb48` (**solo CAT-04**) | 132969953810 | ✗ mixta [4050, ABORT, 6262, 8125] · ✗ cohorte [… , ABORT] | [3433, 6120, 4147, 5703] |
| `5e3a2e9` (#238) | 132918091502 | ✗ mixta [4015, ABORT, 6207, 8034] · ✗ cohorte [… , ABORT] | [3386, 6041, 4108, 5631] |
| `2b1132d`, `8264f55`, `bd1024c`, `dbeb4b0` | 4 jobs | ✓ mixta [2519–2870, 5726–6263, 4064–4567, 5342–5862] | [2151–2220, 4260–4456, 2684–2803, 3951–4123] |

- **El mismo patrón en `0babb48` y en `5e3a2e9`:** las mismas dos pruebas fallan, se aborta el mismo modelo y los tiempos son casi idénticos. `0babb48` no contiene código de #238.
- En las dos ejecuciones que fallan, el runner fue **~50 % más lento en todo**, incluida la escena móvil que pasa (3,4–6,1 s frente a 2,2–4,5 s).
- La imagen era la misma en todos los jobs (`ubuntu-24.04`, `20261103.629`). El repositorio es público, así que el runner estándar tiene 4 vCPU.

### 3.2 Local: comparación secuencial y alternada `master` ↔ rama, en las mismas condiciones

- **Entorno:** Node v22.23.4, Playwright 1.63.0, Chrome for Testing 153.0.8010.12 con SwiftShader, Intel Xeon @ 2,10 GHz, 4 CPU, 16 GB.
- Por cada ejecución se guardan el TAP completo y un `.env` con fecha, CPU, `loadavg`, memoria y duración.

| Condición | `master@46174d6` (fallan / 25) | Rama `16a7d13` (fallan / 25) | Pruebas que fallan |
|---|---|---|---|
| **4 CPU (como CI)**, 3 pares | 1 · 1 · 1 | 0 · 1 · 1 | Siempre `next Asset Lab cohort … 1440x900`, abortando el mismo modelo (NORDLI). Tiempos de la cohorte iguales (±4 %) |
| **2 CPU (`taskset`, estrés)**, 3 pares | 5 · 6 · 5 | 6 · 5 · 6 | Las escenas 1440 y móviles, más `furniture search … 1440x900` (espera de 30 s), **en ambos árboles** |
| **A/B solo «mixed scene 1440×900»**, 4 CPU, 5 + 5 | 2/5 fallan | 1/5 fallan | Tiempos entremezclados (primer modelo: `master` 3416–3884 ms, rama 3519–3852 ms) |

- En la serie de 4 CPU la escena mixta, que pasa, salió un 2–6 % más lenta en la rama.
- La A/B dirigida **no lo confirma**, así que es ruido.
- El único coste que #238 añade en esa ruta es `mount()` del Asistente generativo, llamado por un `MutationObserver` sobre los hijos directos de `body`. Sale en cuanto la barra existe: son dos `getElementById`.

### 3.3 Diagnóstico grabado (vídeo, captura y línea de tiempo)

`scripts/qa/assets-lab-diagnose.cjs` carga **la misma escena de 6 modelos** con el cargador de producción y su límite de 8 s. Graba:
- un WebM;
- una captura final;
- la línea de tiempo del estado de cada modelo cada 250 ms;
- la consola;
- la ocupación de CPU.

No es una prueba y no cambia nada. Resultados en `evidencia/assets-browser/diag/`:

| Condición | `master` | Rama | Abortados (idénticos en ambos) |
|---|---|---|---|
| 4 CPU + grabación de vídeo | 2 listos (7528 y 7499 ms) | 2 listos (7511 y 7478 ms) | glostad, strandmon, knoxhult, nordli |
| 2 CPU + grabación de vídeo | 0 listos | 0 listos | los 6 |

Los 4 vídeos se decodifican por completo sin errores (`ffmpeg -f null`). Sus SHA-256 están en `evidencia/assets-browser/MANIFEST.sha256`.

### 3.4 Mecanismo y propuesta de resolución independiente (no aplicada)

- El test carga 4–6 GLB grandes **a la vez**, con SwiftShader a 1440×900. Cada carga termina en ~6–8 s y la que cruza **8000 ms** se aborta (`Loading aborted`).
- El temporizador solo puede abortar cuando el hilo principal queda libre. Por eso hay cargas que terminan en `ready` con 8037–8534 ms.
- Por tanto, el resultado depende de la **CPU disponible del runner**, no del código de #238: `master` falla igual en las mismas condiciones.
- Es un hallazgo de producto real: en un portátil lento con muchos modelos, el profesional también vería modelos abortados (con su volumen de sustitución).

**Propuesta para el responsable del pipeline de activos** (PR aparte; **no** se aplica en #238 ni concede ninguna excepción):
1. **Recomendada:** limitar la **concurrencia** de cargas en `View3D` (por ejemplo, 2 a la vez), sin tocar el límite por modelo. Reduce la contención en equipos lentos y debería estabilizar la prueba sin relajar nada.
2. Alternativa: medir el límite como **inactividad** de descarga o procesado, en lugar de tiempo total de pared con contención.
3. En cualquier caso, decidir si las escenas de 6 modelos a 1440×900 son una **prueba de rendimiento** con presupuesto explícito por tipo de runner.

Mientras no se resuelva, la intermitencia es **compartida con `master`** y se documenta así. **Una CI roja no se declara verde.**

## 4. Validación local del HEAD reconciliado

| Grupo | Resultado |
|---|---|
| Todas las pruebas puras (`tests/*.test.cjs` sin las de navegador) | **1344 pasan / 0 fallan**, 2 omitidas (Blender, preexistentes), sobre `eb6cc57`. Las 6 nuevas, sobre `16a7d13` |
| Asistente (`assistant-agent-core`, `assistant-gen-api`, `assistant-gen-eval`, `assistant-ai-v2`, `cat04-assistant`, `cat04-f1f2`, `smart-furnishing`, `r03-integration-core`, `capability-registry`) | 84/84 |
| Esquemas publicados (`write-schemas --check`) y sintaxis del workflow | Al día |
| Navegador: regresión de los workflows afectados (`assistant-ai-v2`, `cat-ia-v1` sin `assets.browser`, `project-first`, `integration-browser`, `photo-project-v1`, `ux07-activation` y `tests/browser.test.cjs`; 42 ficheros) | **180 pasan / 1 falla / 7 omitidas** (188).
- Las omitidas necesitan `THREE_LOCAL_DIR` (three.js local), como en ejecuciones anteriores.
- El fallo es «FOT-01 escritorio» (`photo-project.browser`, línea 233: `isVisible()` de la tarjeta de «Entregar» justo tras el clic, sin espera). El test es idéntico en `master` y #238 no toca esa ruta.
- **Repetido aislado: 3/3 en `master` y 3/3 en la rama.** Se registra como intermitencia bajo la carga de una ejecución larga, no atribuible a #238.
- Evidencias: `evidencia/regression/`. |
| `assets.browser` | §3: intermitencia **compartida con `master`** |

## 5. Qué se ha probado con dobles y qué sigue sin validarse

**Probado sin gasto, con dobles rotulados y motores reales de RUBIK:**
- aislamiento por proyecto y estudio;
- privacidad (redacción de correos, teléfonos, enlaces y `data:`);
- consentimiento;
- topes y libro de gasto (Redis **local**, sin red);
- herramientas en lista blanca;
- propuestas → aplicar → deshacer;
- modo guiado con la IA desactivada;
- contratos económicos 1–5;
- avisos de cifras no verificadas en el editor real.

**Sin validar con un modelo real (C):**
- comprensión generativa;
- elección correcta de herramientas;
- ausencia de afirmaciones sin cifras («verificado comercialmente»);
- atribución correcta de cada cifra a su partida.

Requieren el piloto #239, **no autorizado**.

## 6. Dictamen

- Rama **reconciliada, publicable en Draft**.
- Los tres defectos económicos que revelaron las pruebas nuevas están **corregidos con pruebas rojo → verde**.
- **No apta para merge:**
  - persiste la intermitencia `assets.browser`, compartida con `master` (§3), pendiente de una resolución independiente;
  - la comprensión con un modelo real no está demostrada.

El HEAD definitivo, su CI completa, la Preview y los artefactos se registran en la descripción de #238.

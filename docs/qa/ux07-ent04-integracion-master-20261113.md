# UX-07 / ENT-04 · Integración candidata sobre `master` (13/11/2026)

**Rama:** `integration/ux07-ent04-20261113`, desde `master@2a76cd6`. `master` ya contiene GOV-07 (#213, software PARCIAL) y R03 preintegrado sin activar (#214).

**Contenido:** un único *merge* `--no-ff` de `8e2a13f` (#216).
- La cadena es lineal (#209 `8a3cce8` ⊂ #212 `fe30072` ⊂ #216 `8e2a13f`), así que ese *merge* incorpora las tres PR **con sus SHA intactos**.
- Se puede deshacer con `git revert -m 1`.
- **No se ha modificado ni reescrito ninguna rama de Claude B.**

**Alcance:** núcleos puros, laboratorio, pruebas y adaptador preparado.
- **No** activa el comparador en `index.html`.
- **No** publica dossiers al cliente.
- **No** escribe en la biblioteca ni en los presupuestos.

## 1. Diferencia con `master`: 50 archivos, todos nuevos (+2145, −0)

| Grupo | Archivos |
|---|---|
| Núcleos puros (UMD, sin DOM, red ni almacenamiento) | `js/revision-compare-core.js`, `js/revision-budget-core.js`, `js/before-after-dossier-core.js`, `js/variants-compare-adapter.js` |
| Laboratorio aislado (`labs/`, que `.vercelignore` **no publica**) | `labs/ux07-ent04/{index.html,lab.js,lab.css,fixtures.js}` |
| Pruebas | 7 suites `tests/ux07-*.cjs`, el kit `tests/ux07/` y la fixture **auténtica** `tests/fixtures/ux07-dossier-1.0.0/` |
| CI | `.github/workflows/ux07-ent04-before-after.yml` |
| Evidencias y actas | `docs/qa/ux07-ent04-*`, `docs/qa/ux07-variantes-adaptador-2026-11-13/` |

**Ningún archivo de `master` cambia:**
- ni `index.html` ni `evolucion/`;
- ni GOV-07 ni R03;
- ni esquemas, `api/` o `vercel.json`.

Ningún archivo del producto carga los módulos nuevos: lo comprueba `grep` sobre `index.html`, `evolucion/`, `js/` y `api/`.

## 2. Revisión de los puntos pedidos

| Punto | Resultado | Evidencia |
|---|---|---|
| **Lectura de la biblioteca y origen del navegador** | El laboratorio lee `rubik-sota-project-library-v1` y `rubik-budget-v1` a través de un almacenamiento **de solo lectura**: cualquier `setItem` o `removeItem` lanza un error. `FloorPlanLibrary.load` no escribe al cargar; solo escribe en `change()`, que el laboratorio no llama. Como mismo origen, ve la biblioteca del editor de **ese** navegador; no hay red. | Lectura del código; `ux07-variants-handoff` (la biblioteca y los presupuestos quedan **idénticos byte a byte** tras comparar y preparar el dossier) |
| **Pulsar «Comparar» no guarda** | `doCompare` y `prepare()` no escriben: cero llamadas de escritura. | Ídem |
| **Privacidad, sin escritura del comparador** | Los núcleos no hacen `fetch`, `XMLHttpRequest`, `sendBeacon`, `postMessage`, `window.open` ni redirecciones. El dossier es HTML autocontenido, sin scripts ni recursos externos (`verify` lo comprueba), y se previsualiza en un `<iframe sandbox>`. Todo lo del proyecto se escapa al escribir HTML o SVG. Los colores de material están limitados por el esquema: `Core.validate` rechaza `red;background:url(…)`, y `compare()` valida los dos proyectos antes de nada. | `grep` de red; prueba manual con `Core.validate`; `watch.external = []` en todas las pruebas de navegador |
| **Presupuesto parcial o incoherente sin diferencias engañosas** | **`partial`:** importes conocidos y diferencia **solo** de las partidas comparables, con el rótulo «No es la diferencia de coste total». **`incoherent`:** ninguna diferencia ni importe por partida (`delta = null`, `status: 'withheld'`, solo cantidades) y ningún total de diferencia; el dossier lista solo los desajustes. | `ux07-ent04-budget-coherence` (incoherente: ninguna partida «exacta» ni «comparable») y `ux07-ent04-budget.browser` |
| **Las tres correcciones auditadas de #212 (`fe30072`)** | (1) `incoherent` sin datos económicos por partida; (2) dossier **1.0.0 auténtico**; (3) cambiar de origen retira la comparación y el dossier anteriores | (1) prueba pura; (3) `ux07-ent04-origin` en escritorio, móvil, biblioteca y archivos; (2) ver la fila siguiente |
| **Compatibilidad real 1.0.0** | **Verificada de forma independiente:** se regeneró la fixture con el código **original** de #209 (`8a3cce85df71…`, `D.VERSION = 1.0.0`) y los tres archivos (`dossier.html`, `manifest.json`, `origen.json`) son **idénticos byte a byte** a los de la rama. `verify` actual acepta ese manifiesto 1.0.0. | `cmp` de los tres archivos; prueba «compatibilidad 1.0.0» |
| **Compatibilidad con `master` (GOV-07 + R03)** | La fusión es limpia y los archivos solo se añaden. Las regresiones conjuntas, abajo. | §3 |

## 3. Pruebas locales (Chromium de Playwright; cada suite por separado)

| Suite | Resultado |
|---|---|
| Sintaxis de núcleos, laboratorio y pruebas | OK |
| UX-07/ENT-04 puras: `core`, `budget-coherence`, `variants-adapter` | **34/34** |
| UX-07/ENT-04 navegador: `lab`, `budget`, `origin`, `variants-handoff` (escritorio y móvil) | **17/17** |
| Regresión unitaria completa del repositorio | **1105 pruebas: 1103 pasan, 0 fallan, 2 omitidas** |
| Variantes: `variants.browser` | 4/4 |
| Variantes: `variants-visual.browser` | 3/4. El fallo (**844×390**, `locator('#tgPanel')` no clicable, 30 s) es **idéntico en `master@2a76cd6` sin esta rama**: preexistente y fuera de este corte. Ningún workflow de CI ejecuta esta suite. |
| Presupuesto: `budget-ui.browser` · `quantity-schedule.browser` | 4/4 · 2/2 |
| GOV-07: `gov07-early-loss` | 7/7 |
| R03: `r03-editor.browser` | 16/16 |
| `r03-integration-core` + `r03-cabinet-audit` + `gov07-quality-core` | 22/22. Las pruebas de bloqueo de R03 siguen **en verde** porque `index.html` no carga R03. |

## 4. Riesgos y decisiones pendientes para el **segundo corte** (activación, NO incluido)

1. **Dónde vive el comparador en el producto.** Hoy está en `labs/`, que no se publica. La activación necesita (a) una ruta de producto o (b) un diálogo en el editor. Esta integración no lo decide.
2. **La cirugía propuesta en #216 incluye `library.save(project)` al pulsar «Comparar con el original».** Comprobado en `index.html`: el editor **ya guarda solo en cada cambio** (`mutate → commit → save()`, que con biblioteca es `library.save(project)`).
   - Esa línea sería **redundante**, no un guardado nuevo.
   - Recomendación para el segundo corte: **quitarla**, apoyarse en el guardado existente y decir en pantalla «Se compara lo guardado en este navegador». No pulsar «Comparar» nunca debe ser lo que guarda.
3. **Edificios:** se compara la planta del mismo orden en cada distribución, y se avisa. La comparación del edificio completo no está cubierta.
4. **Presupuesto de las variantes:** un presupuesto guardado solo vale para su propio proyecto; el de otro se rechaza. RUBIK no registra sobre qué revisión se hizo (DEC-07), y se dice.
5. **Precios de las fixtures:** son ficticios y van rotulados. No hay importes reales.
6. **Publicación al cliente:** el dossier es un borrador interno descargable. Enviarlo al cliente depende de ENT-01/GOV-08 y de una autorización aparte.
7. **Dispositivos:** las pruebas son de Chromium de Playwright, no de dispositivos físicos.

## 5. Preview

La Preview de **esta rama** muestra el producto **igual que `master`**: no hay nada activado y `labs/` no se publica.

Para revisar el laboratorio con el código integrado hay una **rama espejo de revisión, que no se fusiona**: `review/ux07-ent04-integration-20261113`. Copia el laboratorio a `review-ux07-int/` con las rutas ajustadas, igual que hizo Claude B con `review/ux07-ent04-fase2-20261112`, cuya rama no se toca.

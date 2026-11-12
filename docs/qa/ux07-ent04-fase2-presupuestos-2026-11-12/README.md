# ENT-04 fase 2 — Coherencia entre revisiones y presupuestos (sobre UX-07 + ENT-04 fase 1)

**Fecha:** 12-11-2026 · **Rama:** `lab/ux07-ent04-budget-coherence-20261112` · **Apilada sobre:** #209 `lab/ux07-ent04-before-after@8a3cce8`, que no se modifica · **Coordinación:** issue #206.

**Catálogo:** `ENT-04 | Dossier comercial antes/después, con presupuesto rotulado (parcial o completo)`. No se crean IDs ni se cambian olas.

**Qué es:** un corte funcional en **laboratorio aislado** (`labs/ux07-ent04/`), sin integración en producto. Lo que entra en el producto lo decide ChatGPT.

## 1. Qué faltaba tras la fase 1

La fase 1 (#209) adjuntaba **un** presupuesto, el de «después», y avisaba si sus cantidades no coincidían con esa revisión. Faltaba:

- decir **sobre qué revisión** está hecho un presupuesto. RUBIK no lo guarda (DEC-07), y con dos revisiones del mismo proyecto el presupuesto guardado es **uno solo**;
- comparar el presupuesto de «antes» con el de «después» **partida a partida**, distinguiendo lo completo de lo parcial;
- relacionar cada partida que cambia con los **cambios reales** del proyecto.

## 2. Qué hace este corte

| Capacidad | Cómo | Regla de honestidad |
|---|---|---|
| ¿De qué revisión es el presupuesto? | `revisionMatch`: compara cada partida con las cantidades que el borrador real (`FloorPlanBudgetDraft.lines`) da para «antes» y para «después». Resultado: `before`, `after`, `both` (las dos revisiones dan las mismas cantidades) o `neither`. | Un presupuesto de otro proyecto se rechaza (`budget-subject-mismatch`). Con variantes, cada presupuesto solo puede ser de su propio proyecto. |
| Comparación completa | `compareBudgets`, estado `complete`: los dos presupuestos tienen neto e IVA completos **y** cada uno coincide con su revisión. | Solo entonces se da la **diferencia total**, sin IVA y con IVA. En la prueba, la suma de las diferencias por partida cuadra con ese total. |
| Comparación parcial | Estado `partial`: se dan los **importes conocidos** y la **diferencia de las partidas comparables**, con la lista de las excluidas y su motivo (`unpriced-before`/`-after`, `quantity-incomplete-…`). | Siempre dice «**No es la diferencia de coste total**». No muestra ninguna fila «Con IVA» ni ningún total. |
| Comparación no válida | Estado `incoherent`: algún presupuesto no corresponde a su revisión. Se dice cuál y a qué revisión corresponde (o que a ninguna). | **No** calcula ninguna diferencia de importes. |
| Uno o ningún presupuesto | Estados `one-sided` y `none`. | No inventa el presupuesto que falta. |
| Cada partida | Cambio: `igual`, `cantidad`, `precio`, `cantidad y precio`, `nueva` o `quitada`. Diferencia exacta, o «no comparable» con su motivo. | Una partida **sin precio no es un «cambio de precio»**: se marca como parcial. |
| Dependencias | Para cada cambio real, las partidas cuyo cálculo depende de ese dato. Ejemplos: demoler un tabique afecta a demolición y pintura; cambiar el suelo de la cocina, a la baldosa que sale y al terrazo que entra; un hueco nuevo, a la ventana y la pintura. Si una partida cambia y ningún cambio del proyecto lo explica, se avisa. | Es una **relación de cálculo**, no un reparto del coste entre los cambios. Los muebles no tienen partida en el borrador, así que no dependen de ninguna. |
| Avisos | Tipo de IVA distinto entre los dos presupuestos (compárese sin IVA). Precios sin revisar: los importes son provisionales. | — |
| Dossier 1.1.0 | Nueva sección «Presupuesto antes frente a después». El presupuesto de «después» dice si sus cantidades son las de «antes». El manifiesto lleva también la huella SHA-256 del presupuesto de «antes». | `verify` sigue aceptando dossieres **1.0.0**. Alterar el presupuesto de «antes» después de exportar se detecta. |
| Laboratorio | Selector «Presupuesto de la primera revisión», resumen con el estado y las partidas comparadas. Con la biblioteca: el presupuesto guardado de cada proyecto, en solo lectura. | Sigue sin enviar ni publicar nada: es un borrador interno. |

**Autoridades reutilizadas, sin motor nuevo ni cambios:**
- `FloorPlanBudgetPresentation.buildReport`: importes, IVA y completitud por partida, informe C2;
- `FloorPlanBudgetDraft.lines`: cantidades por revisión;
- `FloorPlanRevisionCompare` (#209): cambios reales;
- `FloorPlanVariants` y `FloorPlanLibrary`: solo lectura.

## 3. Archivos

| Archivo | Tipo |
|---|---|
| `js/revision-budget-core.js` | Nuevo, puro (UMD) |
| `js/before-after-dossier-core.js` | Ampliado a 1.1.0, compatible con 1.0.0. Archivo de #209, no de producto. |
| `labs/ux07-ent04/{index.html,lab.js,lab.css}` | Laboratorio de #209 ampliado |
| `tests/ux07-ent04-budget-coherence.test.cjs`, `tests/ux07-ent04-budget.browser.test.cjs`, `tests/ux07/capture-evidence-fase2.cjs` | Pruebas y capturas |
| `.github/workflows/ux07-ent04-before-after.yml` | El gate de #209 ejecuta también las pruebas nuevas |

**No se toca:**
- `index.html` ni la navegación;
- `js/professional-workspace-ui.js`, `js/delivery-*` ni las API de compartir, retirar, visitar o renderizar;
- la persistencia canónica (`FloorPlanProjectV1`, `rubik-budget-v1` y biblioteca solo se **leen**);
- los contratos, ni Vercel;
- Variantes: no hay sistema paralelo, solo se leen las entradas `variantOf` existentes;
- GOV-07 (#208), R03 (#202) ni OBR-02/03 (#211).

## 4. Pruebas (local, Chromium de Playwright)

| Suite | Resultado |
|---|---|
| `ux07-ent04-budget-coherence` (nueva, núcleo y dossier 1.1.0) | 11/11 |
| `ux07-ent04-budget.browser` (nueva: escritorio 1440×900, móvil 390×844 y biblioteca original+variante) | 3/3 |
| `ux07-ent04-core` y `ux07-ent04-lab.browser` (fase 1, sin cambios) | 16/16 y 7/7 |
| Autoridades reutilizadas: `budget-core`, `budget-draft`, `budget-presentation`, `budget-cost-bridge`, `quantity-core`, `variants`, `library` | 118/118 |
| **Árbol de esta rama fusionado con `master@8d9cb7b`** (ensayo local, sin subir): UX-07/ENT-04 + `budget-*`, `variants`, `library` | 113/113 |

**Casos cubiertos:**
- presupuesto sobre «antes», sobre «después» o válido para las dos;
- cantidad editada a mano (`neither`);
- presupuesto de otro proyecto o vacío;
- completo/completo (suma de partidas = total);
- parcial en «después» y en «antes»;
- presupuestos cruzados y cantidad manipulada (`incoherent`);
- uno o ningún presupuesto;
- solo cambia el precio;
- IVA distinto y precios sin revisar;
- contorno de una estancia cambiado (el rodapié y el suelo, explicados por esa estancia);
- variantes con identificadores distintos;
- no mutar ninguna entrada;
- dossier completo, parcial y no válido;
- manifiesto 1.1.0 con presupuesto de «antes» alterado;
- determinismo de la huella;
- compatibilidad con 1.0.0 y rechazo de una versión desconocida;
- móvil sin desbordar;
- biblioteca sin ninguna escritura;
- cero errores y cero peticiones externas.

**Defecto encontrado en el QA visual y corregido:** en el móvil, la tabla de partidas dejaba la «Diferencia» y la «Dependencia» fuera de la vista, sin ningún aviso, en el laboratorio; en el dossier descargado, la página **desbordaba en horizontal**. Ahora, en pantallas estrechas, cada partida es una ficha con sus rótulos. **Control negativo:** la prueba móvil, ejecutada contra el árbol sin la corrección, **falla** («ninguna celda de diferencia fuera de la pantalla»).

**Segundo defecto, detectado por la CI de la PR y corregido.** Afectaba a dos pruebas de móvil (390×844), una de la fase 1 y otra nueva:
- **Síntoma:** «Preparar dossier» no se podía pulsar porque el selector nuevo lo tapaba.
- **Causa medida:** las columnas `1fr` de `.grid2` no bajan del ancho mínimo de su contenido. El texto largo de una opción del selector ensanchaba la columna a 420 px dentro de una caja de 324 px. En local solo desbordaba hacia la derecha; con las fuentes del runner, además, tapaba el botón.
- **Corrección:** `minmax(0,1fr)` y selectores con `width:100%`.
- **Por qué no lo vieron las pruebas locales:** con `isMobile`, Chromium ensancha el viewport de diseño hasta el contenido que desborda, así que `innerWidth` crece con él. Las comprobaciones de «sin scroll horizontal», también la de la fase 1, comparaban contra ese valor y nunca podían fallar.
- **Pruebas reforzadas, no suavizadas:**
  - se mide contra el ancho real del dispositivo;
  - se comprueba con `elementFromPoint` que el botón y los selectores reciben el toque, sin depender de las fuentes.
- **Control negativo:** sin la corrección, las dos pruebas fallan; la nueva enumera 6 controles fuera de la pantalla.

## 5. Evidencias

En `evidencias/`, con `manifest.json` y SHA-256. Escritorio 1440×900 y móvil 390×844:

1. comparación completa;
2. comparación parcial;
3. comparación no válida;
4. dossier 1.1.0 verificado con los dos presupuestos;
5. sección de presupuestos del dossier descargado, abierto solo.

Navegador sin GPU ni dispositivo físico. **Las pruebas verdes no son un GO visual.**

## 6. Ejemplo con las fixtures (precios FICTICIOS)

| | Antes | Después | Diferencia |
|---|---|---|---|
| Sin IVA | 14.561,06 € | 15.319,94 € | +758,88 € |
| Con IVA | 17.618,89 € | 18.537,14 € | +918,25 € |

**Partidas que cambian (6), todas con su causa en el proyecto:**
- baldosa 60×60 quitada (suelo de la cocina);
- terrazo nuevo (suelo de la cocina);
- tabiquería nueva;
- demolición nueva;
- ventana +1;
- pintura −24,99 €: el tabique demolido resta y el muro nuevo y la ventana suman.

**Con «después» parcial** (sin precio de pintura ni de ventanas): importes conocidos de 14.561,06 € y 7652,19 €, y diferencia de las 12 partidas comparables de +393,87 €, rotulada «No es la diferencia de coste total».

## 7. Límites

- La revisión de un presupuesto se **deduce por sus cantidades**, porque RUBIK no la guarda (DEC-07). Si las dos revisiones dan las mismas cantidades, el resultado es `both`: no se puede saber de cuál es, ni hace falta.
- Las dependencias siguen la lógica del borrador actual (`FloorPlanBudgetDraft.lines`). Si un presupuesto tiene partidas añadidas a mano, se comparan por su identificador, pero no tienen dependencia conocida.
- No hay 3D sincronizado (UX-07 fase 2 original) ni integración en el editor (Variantes o Entregar).
- ENT-04 hacia el cliente sigue requiriendo las reglas de publicación de ENT-01/GOV-08. Aquí el dossier sigue siendo un **borrador interno**.

## 8. Para ChatGPT

**Auditar:**
1. que la diferencia total solo aparece en `complete`;
2. que `partial` nunca se presenta como diferencia de coste;
3. la tabla de dependencias de `dependsOn`, frente a `FloorPlanBudgetDraft.lines`;
4. la compatibilidad 1.0.0 ↔ 1.1.0 del manifiesto.

**Cirugía futura (no aplicada; toca archivos reservados):** desde el diálogo de variantes (`renderVariants()` en `index.html`, ~L2450), «Comparar antes/después» abriría esta comparación con las dos entradas, sus presupuestos guardados y la relación `library-variant`.

**HOLD o decisiones del propietario:**
- dónde vive el acceso en el producto;
- si un dossier con comparación de presupuestos puede llegar al cliente (ENT-01/GOV-08);
- el GO visual de este laboratorio.

## 9. Recorrido humano (5 min)

1. Abre la Preview de revisión y pulsa **Comparar**.
2. En **3 · Dossier interno**, elige «Presupuesto de la segunda revisión: todas las partidas con precio» y «Presupuesto de la primera revisión: todas las partidas con precio». Pulsa **Preparar dossier**. Debe decir «Comparación completa» con **+758,88 €** sin IVA y 6 partidas, cada una con «1 cambio(s)» o más.
3. Cambia la segunda a «partidas sin precio» y prepara de nuevo. Debe decir «Comparación parcial» y «No es la diferencia de coste total»; la pintura y la ventana aparecen como «no comparable».
4. Cambia la primera a «presupuesto hecho sobre «después»». Debe decir «Comparación no válida» e indicar que el de «Antes» tiene las cantidades de «Después».
5. **Verificar ahora**: «Dossier verificado», con la línea «presupuesto de «antes» sin cambios».
6. Repite en el móvil: cada partida aparece como una ficha, sin desplazamiento lateral.

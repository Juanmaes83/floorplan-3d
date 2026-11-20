# 22 · Studio Presentation E3 / K10 / ENT-03: contratos C1–C4, 43 fuentes, selector profesional y vigencia (laboratorio)

> **Complemento de cierre técnico (20/11/2026):** [23-E3-CIERRE-TECNICO.md](23-E3-CIERRE-TECNICO.md). Corrige los hallazgos de auditoría E3-A a E3-D y §8. Donde el 23 difiere (presupuesto «parcial», marca y vistas como vigencia por fuente usada, huella canónica completa, controlador de concurrencia), prevalece el 23.

**Fecha:** 20/11/2026. **Mandato:** «RUBIK SOTA — MANDATO STUDIO PRESENTATION E3 / K10 / ENT-03» (GO de preparación funcional en laboratorio).

**Rama:** `lab/studio-presentation-e0e1`.

**Bases verificadas antes de empezar:**

| Base | SHA | Árbol | Nota |
|---|---|---|---|
| Laboratorio | `8c53263423359e4fa71fc25494c7a3b6ee1f7fd1` | `1bbe949e09eb056ce483a00993b4b8aa8d35fc2f` | — |
| Master | `130ba24d420a2f4b26ab261313202e6070904fd8` | `3c26d25b229a6b908158a52b3aaa77ddab02af58` | Incluye #289 |

**Ámbito:**
- Solo escritura en `labs/studio-presentation/`. El historial se conserva: sin rebase ni reconstrucción, en un worktree independiente.
- No toca master, PR productivas, persistencia, esquemas, workflows ni ramas de Codex. Tampoco OP-05, OP-07, OP-10, OP-11, A0 ni Simulator.
- No es emisión, firma ni aceptación. **Alcance máximo: DESARROLLADO → VALIDADO.**

> **Sustituye al informe 21 en:** el mapa de fuentes. Allí se clasificaron contra `dd528119`; aquí se clasifican contra el código de `130ba24`.
>
> **Conserva:** el adaptador F0 (11/11 de nuevo sobre `130ba24`, caso E3-05) y todo E0/E1, N01–N08, RP-Q, Architecture Book, FF&E, E2 y D08.
>
> **No regenera ningún entregable aceptado.**

## 1. Qué se leyó en master `130ba24` antes de proponer nada

| Pieza | Hecho comprobado en el código |
|---|---|
| `js/persistence-store.js:120` `readConfirmed()` | Abre la base **sin crearla** (`open({create:false})`) y lee `docs` y `meta.revision` en **una sola transacción de solo lectura**. Devuelve `{revision, docs: Map}` **sin `contentId`**. Si no hay revisión (0), lanza `authority-missing`. Cierra la conexión |
| `js/persistence-store.js:44` `isTestOrigin()` | La autoridad F0.2b solo se activa en `http://f0-2b.localhost` |
| `js/persistence-store.js:29` `KEYS` | Proyecto, biblioteca, presupuestos, observaciones y **`rubik-construction-v1`** están bajo la autoridad. La marca y el catálogo no |
| `js/persistence-editor.js` | El editor guarda con `session()` y ofrece `requireSaved()` (hace **flush**, es decir, escribe). `openComparison()` publica un traspaso **solo confirmado** |
| `comparar/comparar.js:18`, `evolucion/library-source.js:43` | Consumidores reales de `readConfirmed()` (E2.1 y Evolución) con almacenamiento de solo lectura que lanza en `setItem`. **E3 sigue ese patrón** |
| `js/expediente-core.js:154` `contentId(subject, documents, imageToken)` | La identidad del trabajo cubre la geometría sin ids, cada imagen por la huella SHA-256 de sus bytes y los documentos con referencias neutralizadas. `NOT_INCLUDED` = `assistant-log`, `construction-record`, `studio-tariff`, `brand-profiles`, `published-links`, `variant-links` |
| `js/scene-delivery-core.js:59` `record({manifest, digest, confirmed})` | C6 de OP-10. La identidad es `confirmed` solo si llega `{contentId, revision}` de la autoridad F0; si no, queda `observed-only`. Su único consumidor actual (`js/scene-export-ui.js:87`) llama con **`confirmed:null`** |
| `js/professional-workspace-ui.js:49–56` | Grupos de Entregar (documentación, experiencia, seguimiento y firma) y enganche ya existente `FloorPlanDeliveryPreview?.card(…)` |
| `js/professional-workspace-ui.js:206–217` | E2.1 «Comparar con el original» (#259), tarjeta en Entregar que abre `comparar/` |
| `js/project-dossier-ui.js`, `js/economic-dossier-ui.js`, `js/economic-dossier-core.js`, `js/budget-presentation.js` | Dossier A4 y económico. **Presentan y nunca editan**, con un único `buildReport` y una única autoridad de importes. E3 no los sustituye; sus recetas los referencian como capítulos y documentos |
| `js/revision-compare-core.js`, `comparar/*` | Comparación antes/después por identificador, con el aviso «la conformidad no se infiere». Es la base de RP14 (C) |
| `js/project-views-ui.js:24–25` | `status()` = `ready` / `stale` / `none` / `busy` / `error`; `current()` solo devuelve vistas `ready` de la revisión actual |
| `docs/contracts/FloorPlanProjectV1.md:21` | **`site.northOffsetDeg`** (ProjectV1 ≥ 1.7) declara el norte. Ausente = sin configurar |
| `js/project-library.js:8` | Las entradas pueden llevar `variantOf` (id de otra entrada de la biblioteca) |
| `js/brand-core.js:10` | La marca vive en `rubik-sota-brand-profiles-v1` (localStorage), fuera de F0 y del expediente |
| `js/budget-core.js` | El presupuesto se ata a `subject {type,id}`, **no a una revisión de geometría** |
| `js/project-library.js:85` + navegador | **Hallazgo en ejecución:** con F0.2b, el proyecto abierto vive en la **entrada activa de la biblioteca confirmada** (`entries[activeId].project`). Tras «Crear mi copia», la lectura confirmada solo contiene `rubik-sota-project-library-v1`, no la clave suelta del proyecto. E3 lee de la biblioteca, y la clave suelta solo si no hay biblioteca |
| `index.html` de master | **Hallazgo:** `js/expediente-core.js` (autoridad de `contentId`) **no se carga** en el editor. Sus dependencias sí (`project-core`, `building-core`, `project-package`, `tracing-core`, `budget-core`, `project-library`). El enganche E3 la añade **sin copiarla**. Sin ella, E3 muestra «c2-sin-expediente» y no calcula ninguna identidad alternativa |
| Proyecto de ejemplo recién abierto | Revisión 1 **sin proyecto** en la autoridad (no se ha guardado). E3 lo explica como «sin revisión del proyecto» (UI-02a); la ruta real de guardado es **«Crear mi copia»** |

## 2. Contratos C1–C4 (propuesta a Codex; no se consolida ninguna interfaz compartida)

### C1 · Lectura confirmada para consumidores de solo lectura

**Implementado en el laboratorio** como `RubikStudioE3.leerConfirmado(P)` (`e3/e3-core.js`), sobre la API **existente**. No pide ninguna API nueva.

**Hace:**
- llama solo a `isTestOrigin()` y a `readConfirmed()` y devuelve una copia desprendida de las 5 claves de la autoridad;
- traduce los errores: `authority-missing` → «sin revisión», `open-blocked` → «otra pestaña», cualquier otro → «error». Fuera del origen de prueba devuelve «c1-origen»;
- detecta los **cambios sin guardar comparando contenidos** (proyecto observado frente a confirmado), sin tocar la sesión.

**No hace:**
- no abre sesión, no llama a `requireSaved` ni a `flush`, no migra y no autoguarda;
- **nunca usa el proyecto observado como revisión**;
- no crea nada si la base no existe.

**Lo que se pide a Codex:**
1. confirmar que `readConfirmed()` es la API estable para consumidores de solo lectura;
2. confirmar que la fuente del proyecto abierto es la **entrada activa de la biblioteca confirmada** (no la clave suelta) y que E3 puede cargar `js/expediente-core.js` en el editor;
3. decidir si un consumidor puede leer `session.state` (pendiente o conflicto) sin riesgo, o si basta con comparar contenidos, como hace E3;
4. dar código propio a los errores de integridad del expediente (pendiente del informe 21, `code: null`).

### C2 · Identidades separadas y vigencia

Cinco identidades que no se confunden (`identidad()` en `e3/e3-core.js`):

| Identidad | Autoridad | Uso en E3 |
|---|---|---|
| **Trabajo** | `FloorPlanExpediente.contentId` sobre la lectura confirmada | Vigencia portable: misma obra tras restaurar en otro navegador |
| **Revisión local confirmada** | `meta.revision` de F0.2b | Detectar otra pestaña o un guardado durante la preparación (relectura antes de congelar) |
| **Proyecto** | `project.id` + entrada de biblioteca | Solo informativa; cambia al restaurar |
| **Selección** | SHA-256 de `{receta, versión, catálogo, idioma, fuentes acreditadas}` | Qué se eligió |
| **Documento / paquete** | **nula**: E3 no emite | Reservada para el corte de emisión |

**Decisiones propuestas:**
- **`congelado.contentId`** (petición 2 del informe 21) se añade al candidato preparado. N05 compara el trabajo, no el id ni la revisión local. Un mismo `contentId` con otra revisión local da **«verificado»** con el motivo «restaurado» (caso E3-13).
- **Fuentes fuera del `contentId`** que una receta usa (marca, registro de obra y relaciones de variante) se congelan aparte en `congelado.externos` con su propia huella. Si cambian, el candidato pasa a **«verificado-desactualizado»** (caso E3-11). Sin esto, un cambio de firma no caducaría el candidato.
- **Token de imagen:** E3 usa `sourceImages[].sha256` del modelo, que según el contrato ProjectV1 es la huella de los bytes reales. **Codex debe confirmar** que coincide con el `Package.digest` que usa `pack`. Una imagen sin huella hace fallar la identidad y no se inventa.
- **Presupuesto:** solo se acredita el del **mismo sujeto** leído en la misma transacción que el proyecto. Uno de otro sujeto no se acredita (caso E3-10). Como el presupuesto no lleva revisión de geometría, «presupuesto de otra revisión» se detecta como cambio de `contentId`.

### C3 · Variantes (expediente v1 frente a v2)

- La biblioteca confirmada ya contiene `variantOf`. E3 la **lee** y acredita «variantes guardadas» como **parcial no portable**, con huella en `externos.variantes`.
- **No se implementa el expediente v2.** La portabilidad de variantes (`subjects[]`, `variantOf` en el expediente) sigue siendo la petición 3 del informe 21. Afecta a RP03 (alcance completo) y a la comparación económica de variantes.

### C4 · Cámaras, imágenes y Blender

**Vistas 3D:**
- Se acreditan solo si `FloorPlanProjectViews.status()==='ready'` (vistas de la revisión actual) **y** no hay cambios sin guardar.
- **No se persisten cámaras** ni resultado visual. Se mantiene la recomendación 4 del informe 21.

**Imágenes IA:** siguen sin fuente; no se inventan.

**Blender / C6 (OP-10):**
- E3 **no llama a `record()`** ni activa C6, CAM-01, K11 ni K12.
- El contrato de consumo que se propone para cuando Codex lo decida es el de la §7. El caso E3-22 solo demuestra que `record()` acepta la identidad confirmada que E3 ya calcula.

### Matriz de dependencias

| Dependencia | Autoridad / propietario | Estado en `130ba24` | Fuentes afectadas | Recetas afectadas | Decisión pendiente |
|---|---|---|---|---|---|
| C1 lectura confirmada | F0.2b · Codex | **Existe**: `readConfirmed()`, activa solo en `f0-2b.localhost` | Las 7 `confirmada`, 4 `motor` y 1 `sesion` | Todas las L | Activar F0.2b fuera del origen de prueba (D3/D4) y confirmar la API |
| C2 `congelado.contentId` + `externos` | N05 (lab) + expediente · Codex | Propuesta implementada en el lab | Todas las acreditadas | Todas las L | Aceptar el modelo de identidades y la huella de imagen |
| Consumidores sin conectar | revision-budget, catalog-budget · Codex | `consumidor-pendiente` | `presupuestoRevisado`, `catalogoProductos` | RP11 (completa), RP12 (completa), RP17 (C) | Pasarles la lectura confirmada |
| Historial (F0.3) | Codex | No existe | `revisionAnterior` | RP02, RP04, RP09, RP10 (completas); RP14 (C) | Corte F0.3 |
| Expediente v2 | Codex | No existe | `variantesGuardadas` (portable) | RP03 (completa) | Corte v2 (fuera de este mandato) |
| Autoridad de marca | Propietario + Codex | localStorage, fuera de F0 | `marca` | RP01 | Decidir su autoridad |
| Autoridad de honorarios y aportaciones | Propietario | No existe | 10 `aportacion` | RP01 (completa), RP04, RP06, RP08 y RP14 | Decidir dónde viven los datos del profesional |
| Registro de obra portable | Codex | Bajo F0 en local; excluido del expediente | `planObra`, `vinculoPlanPresupuesto` | RP08 (L, requerida), RP15 (C) | Decidir si entra en el expediente |
| C6 Blender | OP-10 · Codex | `record({confirmed:null})` | — | Futuras recetas con escena | Pasar `{contentId, revision}` de C1/C2 |
| Activación en producto | Propietario (D4) | Cerrado | — | — | GO de D4 y del parche (§5) |

## 3. Las 43 fuentes contra `130ba24`

Matriz completa, con módulo y función, autoridad, condición, revisión e identidad, consumidor, privacidad, estado efectivo, motivo y evidencia `archivo:línea`: **[22b-MATRIZ-43-FUENTES.md](22b-MATRIZ-43-FUENTES.md)**. La evidencia de cada fila se comprobó en el pin (caso E3-02, 34 evidencias).

| Clase en `130ba24` | n | Fuentes |
|---|---|---|
| confirmada | 7 | geometría, materiales, objetos, presupuesto, dimensiones de huecos, fotos aportadas, **norte** |
| motor | 4 | superficies, dibujo vivo, recorrido, sección y fachadas |
| sesion | 1 | **vistas 3D** |
| local (parcial, no portable) | 4 | **plan de obra**, **vínculo plan–presupuesto**, **marca**, **variantes guardadas** |
| consumidor-pendiente | 2 | presupuesto revisado, catálogo de productos |
| historial | 1 | revisión anterior |
| sin-fuente | 1 | imágenes IA |
| aportacion | 10 | concepto, alcance, **honorarios**, exclusiones, validez, precio del inmueble, impuestos, moodboard, oferta técnica, motivo del cambio |
| fuera | 13 | obra, comercial y F1 |

**Cambios de clase frente al informe 21** (cada uno anotado en la matriz y comprobado en E3-03):
- **norte**: «sin-fuente» → **confirmada**. ProjectV1 1.7 declara `site.northOffsetDeg`.
- **vistas 3D**: «sin-fuente» → **sesion**. El producto prepara vistas reales por revisión, pero no las guarda.
- **plan de obra** y **vínculo plan–presupuesto**: «excluido» → **local**. Están bajo la autoridad F0 de este navegador, pero no en el expediente.
- **marca**: «excluido» → **local**. Vive en localStorage; se congela su huella.
- **variantes guardadas**: «exp-v2» → **local**. `variantOf` se lee en la biblioteca confirmada.
- **honorarios**: «excluido» → **aportacion**. `studio-tariff` solo aparece como exclusión y no hay módulo de honorarios.

## 4. Selector profesional E3 (laboratorio)

**Archivos nuevos:**

| Archivo | Papel |
|---|---|
| `e3/recetas-catalogo.js` | **Generado** desde `tools/recetas.cjs` por `tools/e3-catalogo.cjs`, con la huella de los datos. E3-01 comprueba que es idéntico al origen: 21 recetas, niveles, `corte`, requeridas, completas y opcionales |
| `e3/e3-core.js` | Núcleo puro: C1, C2, la matriz de 43, la evaluación de fuentes, la resolución, el preparador cancelable y N05 |
| `e3/e3-ui.js` | Interfaz |
| `e3/e3.css` | Estilos |
| `e3/rubik-130ba24-e3.patch` | Enganche propuesto a Codex. **No se aplica a master** |

**Reutiliza:**
- **Mismas reglas que `tools/recetas.cjs`:** E3-04 compara 21 recetas × ES/EN con las mismas fuentes y obtiene el mismo estado, lo que falta, lo incompleto y lo omitido.
- **Vocabulario N05** de `tools/estado-entrega.cjs`.
- **Adaptador F0** de `tools/f0-adaptador.cjs`, para verificar contra un expediente.
- **Autoridades del producto:** `FloorPlanCore.prepare` (validación), `FloorPlanExpediente.contentId`, `FloorPlanSurfaceMetrics`, `FloorPlanProjectViews`, `FloorPlanBrandUI.snapshot` y los grupos de Entregar.

**No crea:** motor, catálogo, compositor, almacén ni autoridad.

**Integración en Entregar (sin navegación paralela):**
- Una tarjeta **«Preparar entrega»** en el grupo **Documentación**, con el mismo enganche que ya usa `FloorPlanDeliveryPreview.card`.
- Abre un `<dialog>` nativo con los pasos **Receta → Composición → Verificación → Vista previa**.
- **Parche:** 2 líneas en `js/professional-workspace-ui.js` y 1 en `index.html` (cuatro `<script>`: la autoridad existente `js/expediente-core.js` y los tres de E3).
- E2.1, la visita 3D y el resto de tarjetas siguen igual (UI-01).

**Niveles:**

| Nivel | Comportamiento |
|---|---|
| L | «Preparable» o «preparable con omisiones» solo con fuentes acreditadas. «Bloqueada» nombra cada fuente que falta |
| C | «Contrato cumplido · sin emisión» o «no elegible». Sin botón de preparar |
| F | «No disponible». Sin botón de preparar |

**Ninguna receta emite:** `emitible` es siempre `false` y `paquete` es `null`.

**Vista previa:**
- Muestra la **composición** del candidato: modalidad, capítulos, documentos, fuentes acreditadas, trabajo y selección.
- Rótulo: «no es el documento final; la emisión, la firma y la aceptación no están habilitadas».
- **No genera PDF ni ZIP:** el exportador del laboratorio sigue siendo el único que lo hace, y los D08 no se tocan.

**Estado de las recetas con el proyecto de referencia del producto confirmado** (sin presupuesto, sin vistas preparadas, sin firma):
- RP09 y RP10: preparables con omisiones.
- RP02: preparable con omisiones.
- RP07: bloqueada mientras no se preparen las vistas 3D.
- RP05 y RP12: bloqueadas sin presupuesto.
- RP01: bloqueada sin presupuesto y sin firma.
- Las 9 C/F: sin emisión.

Los estados exactos de cada caso están en `evidence/e3/e3-qa.json` y `evidence/e3/e3-ui-qa.json`.

## 5. Parche mínimo para Codex y reversión

**Parche:** `e3/rubik-130ba24-e3.patch` (22 líneas; solo los dos enganches). Incluye cargar `js/expediente-core.js`, que hoy no está en `index.html`. Los 4 archivos `e3/*` se copian a la ruta que Codex decida (propuesta: `js/studio-e3-*.js`, `css/studio-e3.css`).

**Reversión:** quitar las 3 etiquetas `<script>` y las 2 líneas del enganche. E3 no escribe datos, así que no deja nada que limpiar en el navegador.

**No autorizado:** aplicarlo a master, abrir PR productiva o desplegar.

## 6. Vigencia (N05): casos obligatorios

| Caso del mandato | Resultado | Prueba |
|---|---|---|
| Proyecto confirmado válido | preparado → **verificado** | E3-06, UI-05 |
| Sin revisión | aviso «c1-sin-revision», sin crear revisión (también el ejemplo sin guardar) | E3-07, UI-02a |
| Cambios no guardados | «cambios-sin-guardar»: no se prepara | E3-08, UI-07 (edición real) |
| Otra pestaña | almacenamiento bloqueado, revisión movida durante la preparación, y otra pestaña que confirma | E3-09, UI-09 |
| Presupuesto de otra revisión o de otro sujeto | **verificado-desactualizado** / no se acredita | E3-10 |
| Cambio de marca | **verificado-desactualizado** (`externos.marca`) | E3-11 |
| Cambio de geometría, de imágenes o de documentos | **verificado-desactualizado** | E3-12, UI-08 (norte real) |
| Restauración portable con el mismo `contentId` | **verificado** (restaurado) | E3-13 |
| Expediente alterado o truncado | **invalido** (y candidato manipulado → invalido) | E3-14 |
| Preparación cancelada | «cancelada», sin aplicar nada | E3-15 |
| Rechazar un resultado asíncrono obsoleto | «obsoleta» | E3-15 |
| Fuentes obligatorias ausentes | L **bloqueada**, con la lista nombrada | E3-16, UI-03 |
| Receta parcial con omisiones | preparable con omisiones, nombradas | E3-17, UI-05 |
| Recetas C/F sin emisión | ni preparables ni emitibles | E3-18, UI-04 |
| Conservación del almacenamiento | documentos, localStorage y autoridad idénticos; sin sesión | E3-19, UI-06 |
| Ninguna revisión confirmada falsa | origen, revisión 0/negativa/no entera y documentos ausentes | E3-20, UI-17 |

## 7. Blender y Simulator: contrato de consumo (sin activar nada)

**Entrada que E3 aceptaría de una escena** (C6 de OP-10, cuando Codex lo conecte):
- `sceneSha256` y `manifestSha256`;
- `identity.status==='confirmed'`, con el `contentId` y la `revision` de C1/C2;
- `studio.rights` (propietario del proyecto, sin imágenes ni texturas de terceros);
- `fidelity:'observed-visual'`.

**Regla de vigencia:** una escena entra como fuente de una receta solo si su `contentId` coincide con el del candidato. Si es `observed-only`, se muestra como «observada, no acreditable». **No se persisten cámaras.**

**Alimentaciones futuras de Simulator** (solo se registran; ninguna se reclama ni se conecta):

| Pieza | Para E3 | Estado |
|---|---|---|
| A (fábrica en Evolución) | Imagen de obra prevista para RP08 y RP15 | Laboratorio; requiere el corte OBR |
| B (guion de cámara) | Vídeo de presentación como pieza de RP03, RP06 y RP07 | Laboratorio; requiere el grabador (Codex) |
| C / C-bis (etiquetas y maquetación) | Vistas 3D legibles para capturas de recetas | Parches listos para Codex |
| D (paridad visual) | QA de las vistas antes de acreditarlas | Bajo Codex |

## 8. UX (Perla y UX-FIRST)

**Cada estado bloqueado da cuatro cosas:**
- **causa**, **siguiente paso**, **alternativa segura** y **qué pasa con tus datos**;
- 20 códigos en ES/EN/ZH (E3-21), más 13 motivos de fuente.

**Idiomas:**
- La interfaz nueva está en ES/EN/ZH.
- Los nombres de receta y de fuente son ES/EN (catálogo). En ZH se muestran en inglés con `lang="en"`, rotulados; **no hay respaldo silencioso**.
- La entrega se prepara en ES o EN.

**Teclado:**
- `<dialog>` modal con foco atrapado.
- Escape cierra y devuelve el foco a «Preparar entrega».
- Las flechas recorren las recetas (grupo de radios).

**Contraste:** texto ≥ 4,5:1. El gris secundario propio (`#5c5449`) sustituye a `--muted`, que no llega a AA en texto pequeño.

**Pantallas pequeñas:**
- En 390 px el diálogo ocupa la pantalla, sin desbordamiento horizontal.
- Objetivos táctiles ≥ 44 px.

**Movimiento reducido:** sin transiciones.

**Capturas (desktop 1440, tableta 820, móvil 390, EN, ZH y origen sin F0.2b):** `evidence/e3/visual/*.png`.

## 9. Pruebas por entorno

| Suite | Entorno | PASS | FAIL | SKIP | NOT_RUN | Evidencia |
|---|---|---|---|---|---|---|
| `tools/e3-qa.cjs` (núcleo, 23 casos, E3-01…E3-23) | Node 22.23.5, Linux, pin `130ba24` | 23 | 0 | 0 | 0 | `evidence/e3/e3-qa.json` |
| Adaptador F0 (dentro de E3-05) | Node 22.23.5, pin `130ba24` | 11 | 0 | 0 | 0 | `evidence/e3/f0-adaptador-qa-130ba24.json` |
| `tools/e3-ui-qa.cjs` (18 casos, UI-01…UI-17) | Chromium 157.0.8103.78 (Playwright 1.63), copia aislada `130ba24` + parche, `http://f0-2b.localhost` | 18 | 0 | 0 | 0 | `evidence/e3/e3-ui-qa.json`, 14 capturas |
| Ídem | Firefox | — | — | — | 1 | No instalado en el contenedor; no se descarga |
| Ídem | WebKit | — | — | — | 1 | No instalado en el contenedor; no se descarga |
| Safari real, dispositivos físicos, lector de pantalla | — | — | — | — | sí | Pendiente humano |

**Qué cubre cada dimensión:**

| Dimensión | Casos |
|---|---|
| Accesibilidad | Foco atrapado y retorno, flechas y Escape (UI-10); contraste mínimo medido 6,58:1 (UI-11); objetivos ≥ 44 px y «Cerrar» visible (UI-13, UI-14); `lang` en textos rotulados (UI-16) |
| Seguridad y privacidad | Sin peticiones externas ni errores (UI-12 y todas las ventanas); sin escrituras (E3-19, UI-06); sin sesión de escritura (E3-19, `Proxy` que lanza) |
| Regresión | E2.1, la visita 3D y los cuatro grupos de Entregar presentes (UI-01) |

**No aplica:** rendimiento (lectura única y sin bucle de render) y licencias nuevas (no hay donantes ni dependencias).

**Corrección hecha durante la QA visual:** en 390 px la cabecera del diálogo desbordaba y escondía «Cerrar». Se corrigió y UI-13/UI-14 lo comprueban ahora.

**Residual visual:** el botón flotante «Asistente» del producto queda por encima del diálogo. E3 deja 96 px de margen inferior para que el contenido se pueda leer al desplazarse. Corregir su capa corresponde al producto.

**Errores de la propia prueba corregidos (no de E3):**
- la bienvenida modal bloqueaba los clics;
- `waitForFunction` con una función asíncrona devolvía antes de confirmarse el guardado;
- el selector de E2.1 cambia `data-module` tras renderizarse.

## 10. Declaración §4.1 (10 puntos) y Home / Plataforma / Entregables

1. **Capacidad.** Elegir una receta profesional (RP01–RP21) y componer un candidato de entrega solo con fuentes confirmadas, con su vigencia N05. Alcance: laboratorio.
2. **Destino.** Plataforma → **Entregar**, grupo «Documentación», tarjeta «Preparar entrega».
3. **Acceso.** Editor → **Entregar** → «Preparar entrega» → elegir receta (con filtros de perfil y fase) → ver la composición → **Preparar candidato** → verificación automática → vista previa → «Verificar de nuevo» tras cualquier cambio.
4. **Visibilidad.** Visible, **experimental de laboratorio**. Solo funciona en el origen de prueba F0.2b; en los demás muestra el aviso «c1-origen».
5. **Reutilización.** Las enumeradas en la §4 (recetas, N05, adaptador F0, `readConfirmed`, `contentId`, `prepare`, motores, vistas, marca y grupos de Entregar).
6. **Experiencia.** La de la §8. Cada bloqueo da causa, siguiente paso, alternativa y estado de los datos.
7. **Condiciones.** F0.2b activa en el origen. Revisión ≥ 1. Proyecto de una planta (un edificio → aviso). Las dependencias son las de la matriz de la §2.
8. **Validación.** Node 23/23, más la suite de navegador de la §9. Firefox y WebKit, NOT_RUN (no instalados). Safari real y dispositivos físicos, pendientes.
9. **Evidencia.** `evidence/e3/` (JSON y capturas). El SHA y el árbol del commit están en el HANDOFF.
10. **Production.** **No.** Faltan D4, la revisión de Codex de C1–C4, la aplicación del parche por Codex, Preview, la aceptación visual del selector, Safari y dispositivos.

**Home:** no aplica todavía. Un beneficio «prepara tu entrega profesional» solo podrá anunciarse con E3 DISPONIBLE.

**Plataforma:** Entregar (arriba).

**Entregables:** las 12 recetas L como composición; la emisión de documentos sigue en el exportador del laboratorio (D08) y en los cortes E4–E7, que no se empiezan.

## 11. Bloqueos, GO/NO-GO graduado y siguiente actor

| Ámbito | Dictamen |
|---|---|
| Contratos C1–C4 y matriz de dependencias | **GO como propuesta.** Requiere la revisión de Codex; no hay interfaz compartida consolidada |
| Matriz de 43 fuentes contra `130ba24` | **GO** (evidencia comprobada en el pin) |
| Selector E3 en el laboratorio (núcleo, interfaz y vigencia) | **VALIDADO en laboratorio** (Chromium; ver §9) |
| Parche en Entregar | **GO técnico como propuesta.** NO-GO de aplicación sin D4 |
| E3 de producción | **NO-GO** hasta D4, C1–C4 aceptados, F0.2b activa fuera del origen de prueba, Preview, aceptación visual, Safari y dispositivos |
| Recetas C/F | Siguen siendo contratos. **NO-GO de emisión** |
| Emisión, firma y aceptación; K11/K12; E4–E7 | **NO-GO** (gates cerrados) |

**Siguiente actor:**
1. **ChatGPT**: auditoría independiente de este corte.
2. **Codex**: revisión de C1–C4 y de la huella de imagen.
3. **Propietario**: D4.

**Pendientes del propietario:** marca y tarifa (autoridad), H08, licencia N04, Safari y dispositivos, escala física.

# 23 · Studio E3 / K10 / ENT-03: cierre técnico de los hallazgos de auditoría (complemento del informe 22)

**Fecha:** 20/11/2026. **Mandato:** «RUBIK SOTA — MANDATO CC1 · CIERRE TÉCNICO STUDIO E3 / K10 / ENT-03».

**Rama:** `lab/studio-presentation-e0e1`.

| Referencia | SHA | Árbol | Nota |
|---|---|---|---|
| Partida | `448b3ef12eb6341e021308754c5fef726a28b8e4` | `9089af25…` | Remoto comprobado igual antes de empezar |
| Master de contraste | `130ba24d420a2f4b26ab261313202e6070904fd8` | `3c26d25b…` | Vuelto a consultar al cerrar: sin commits posteriores (§7.1) |

**Ámbito:** solo `labs/studio-presentation/`. Las conexiones se prueban en una copia aislada de master. No se toca master, persistencia, F0, workflows, Vercel, Codex, CC2, Simulator ni Blender productivo.

**Método:** ciclo diferencial SCULPT/PULIR sobre los hallazgos. No se reconstruyen el selector, las recetas ni los entregables.

## 1. Hallazgos: reproducción, corrección y prueba

Cada defecto se **reprodujo primero sobre el núcleo de `448b3ef`** (sección «antes» de `evidence/e3/e3-cierre-qa.json`, **8/8 reproducidos**) y después se cerró con negativos dirigidos sobre el árbol nuevo.

### E3-A · Identidad y bytes reales: REPRODUCIDO y CORREGIDO

**Antes** (A-antes y A-antes-2):
- el token de imagen era el `sha256` *declarado*;
- una foto sin bytes, o con una huella falsa, se acreditaba y el trabajo recibía identidad.

**Ahora** (`e3/e3-core.js`):
- `comprobarImagenes()` lee los bytes **efectivos** y calcula `digest(bytes)`, la misma función que `Package.digest` y `contentIdOf`;
- `identidad()` solo calcula `contentId` con esos tokens y lanza un error con código si alguno no es acreditable;
- la preparación vuelve a comprobar las imágenes antes de congelar.

**Adaptador de solo lectura (`adaptadorImagenes`):**
- usa `FloorPlanImages.get()` de `js/local-images.js`;
- `get()` abre la base con `onupgradeneeded`, así que **la crearía**. Por eso el adaptador comprueba antes `indexedDB.databases()` y, si la base no existe o no se puede saber, **no abre nada**.

**Pruebas:**

| Caso | Resultado |
|---|---|
| A-00 | **Equivalencia:** `contentId` de E3 = `contentIdOf(read(pack(...)))` del expediente canónico, con una PNG sintética real |
| A-01 | Referencia sin bytes → «imagen-sin-bytes». Al verificar después: «preparado», no «verificado» |
| A-02 | Bytes alterados → fuente «invalida» |
| A-03 | Huella declarada falsa → «imagen-alterada» |
| A-04 | El recurso desaparece durante la preparación → «recurso-cambiado» |
| A-05 | La resolución falla → «imagen-no-comprobable»; se cancela → «cancelada» |
| A-06 | Sin almacén no se llama a `get()`; sin `databases()` → no comprobable |

**Contrato pedido a Codex (C2-img):**
- un `FloorPlanImages.get` sin creación (apertura sin `upgradeneeded`), equivalente a `open({create:false})` de F0.2b;
- confirmar que el token de imagen de `contentId` son los bytes efectivos (`storage.ref || id`).

**No se modifica ninguna API productiva.**

### E3-B · Integridad del candidato: REPRODUCIDO y CORREGIDO

**Antes** (B-antes): alterar la composición, las fuentes acreditadas o las identidades fuera de `congelado` seguía dando «verificado».

**Ahora:**
- `huella` = SHA-256 de la **representación canónica completa**: esquema, versión, `congelado`, `composicion`, `identidades` y `paquete` (`rubik-lab-e3-candidato/2`);
- además, `coherencia()` **vuelve a derivar** cada parte desde lo congelado:
  - la selección frente a la receta, la versión, el idioma y el catálogo;
  - la huella de la selección;
  - la resolución recalculada con el catálogo vigente;
  - las fuentes acreditadas y parciales;
  - las identidades;
  - las fuentes de vigencia;
  - `paquete:null` y `emitible:false`.

Así, una alteración con la huella **recalculada** también se rechaza como «invalido-incoherente».

**Pruebas (B-00 a B-15):**
- B-00: sin recalcular la huella → «invalido-alterado»;
- B-01 a B-13: con la huella recalculada → «invalido-incoherente», con la incoherencia nombrada;
- B-14: catálogo de reglas distinto → «verificado-desactualizado»;
- B-15: E3-14 conservado.

**Límite:** la huella es **local**. No es una firma, no acredita autoría ni identidad profesional ni equivale a la aceptación del cliente, y así se rotula en la vista previa.

### E3-C · Concurrencia y resultados obsoletos: REPRODUCIDO (inspección) y CORREGIDO

**Antes:** el cambio de receta o de idioma vaciaba el candidato visible, pero **no cancelaba la preparación en vuelo** (C-antes, sobre `e3-ui.js` de `448b3ef`). Un resultado tardío podía aparecer sobre otra receta.

**Ahora:** `controlador()` es puro, sin DOM, y reutiliza el `preparador()` existente:
- cambiar receta o idioma, o cerrar, abre una **época nueva** y cancela la preparación;
- cada lectura y cada verificación llevan su secuencia;
- solo la preparación vigente apaga «ocupado»;
- un diálogo cerrado no emite nada;
- toda operación captura sus errores (no quedan promesas rechazadas);
- la interfaz solo dibuja el estado del controlador, y el foco solo se mueve con resultados vigentes;
- la vista previa muestra el **proyecto congelado** (`congelado.proyectoNombre`) y desaparece en cuanto cambia la selección.

**Pruebas deterministas con lecturas retenidas (promesas diferidas resueltas por la prueba, sin temporizadores):**

| Caso | Situación |
|---|---|
| C-01 | Cambio de receta durante la preparación |
| C-02 | Cambio de idioma durante la preparación |
| C-03 | Cancelar y preparar otra al instante |
| C-04 | Cerrar y reabrir durante una operación |
| C-05 | Cambio de proyecto o variante (local y confirmado) |
| C-06 | Releer con una verificación anterior pendiente |
| C-07 | Otra pestaña confirma durante la preparación |
| C-08 | Cambios locales sin confirmar a mitad de la preparación |
| C-09 | Errores sin rechazos sin capturar |

En navegador: UI-18 (la selección retira la vista previa) y UI-19 (operación en vuelo retenida descartada, sin «ocupado» ni robo del foco).

### E3-D · Vigencia de las fuentes de sesión: REPRODUCIDO y CORREGIDO

**Antes:**
- unas vistas invalidadas tras preparar RP07 seguían dando «verificado» (D-antes);
- un cambio de marca caducaba RP05, que **no** usa la marca (D-antes-2).

**Ahora** hay tres niveles distintos:
1. la **identidad portable** (`contentId`);
2. la **revisión local**;
3. la **vigencia de cada fuente USADA** por la receta (`congelado.vigencia`).

Las fuentes de vigencia son las vistas 3D (toma, origen y selección actual de vistas), la marca, el plan de obra, el vínculo plan–presupuesto y las variantes.

**Al verificar:**
- fuente distinta → «verificado-desactualizado» (`desactualizado-fuente`, con la lista);
- fuente que no se puede comprobar ahora → «preparado» (`fuente-no-comprobable`), **nunca vigente**.

La restauración portable con las mismas fuentes pertinentes sigue siendo «verificado-restaurado».

**Pruebas:**

| Caso | Situación |
|---|---|
| D-01 | Vistas sustituidas o con otra selección |
| D-02 | Vistas `stale`, `busy`, `none` o `error` |
| D-03 | Cambio de planta o proyecto |
| D-04 | Cambio de marca durante la preparación |
| D-05 | Plan de obra y variantes, solo en las recetas que los usan |
| D-06 | Firma ausente al verificar |
| D-07 | Restauración portable |
| D-08 | Sin cámaras persistidas y C6 sin activar |

### §8 · Comprobación transversal de fuentes acreditadas: REPRODUCIDO y CORREGIDO

**Presupuesto:**
- se exige el **tipo** `project` y el id, además de la validación canónica `FloorPlanBudget.parseBudget`;
- uno de otro tipo de sujeto o que no valida → «invalida» (S-02; antes se acreditaba: S-antes);
- sin la autoridad cargada no se acredita;
- ninguna autoridad liga las cantidades del presupuesto a la geometría actual (budget-core no guarda revisión de geometría), así que un presupuesto válido se acredita como **«parcial»** y se dice por qué (S-01).

**Documentos corruptos:** una biblioteca, presupuestos u observaciones ilegibles dan «documento-corrupto» y no se tratan como vacíos (S-03; antes se trataban como vacíos: S-antes-2).

**Motores:** cuentan por su **resultado** sobre la geometría confirmada, no por estar cargados:
- `home().areaM2`, `plan().points`, `timeline().rooms` y `derive().supported`;
- sin módulo → «sin-motor»; si falla → «motor-error»; si no da resultado → «motor-sin-resultado» (S-04).

**Revisión no comprobable:**
- `actualDesdeConfirmado()` y el controlador nunca rechazan: devuelven un motivo y un estado seguro;
- S-06: 0 rechazos sin capturar en toda la suite.

**Diagnóstico:** `window.__e3` solo existe con la bandera de laboratorio `RUBIK_E3_QA` (S-05, UI-20). El parche productivo no la activa.

## 2. Código y funciones afectadas

| Archivo | Cambios |
|---|---|
| `e3/e3-core.js` | `analizar` (tipo y validación del presupuesto, documentos corruptos, nombre del proyecto); `adaptadorImagenes` y `comprobarImagenes` (nuevas); `identidad` (bytes efectivos); `huellasFuentes` y `SESION` (nuevas); `evaluarFuentes` (presupuesto parcial o inválido, fotos por bytes, `PROBE` de motores); `preparar` (doble comprobación, vigencia, huella canónica completa); `coherencia` (nueva); `verificar` (coherencia, catálogo, vigencia por fuente usada); `actualDesdeConfirmado` (nunca rechaza); `controlador` (nuevo). 11 códigos nuevos o renombrados y 7 motivos de fuente, en ES/EN/ZH |
| `e3/e3-ui.js` | Interfaz delgada sobre `controlador`; dependencias reales (`FloorPlanBudget`, `FloorPlanImages` vía adaptador, motores como módulos y vistas con identidad); vista previa del proyecto congelado; estado «verificando»; diagnóstico solo con la bandera |
| `e3/e3.css` | Sin cambios funcionales en este corte (las correcciones de cabecera móvil son del corte anterior) |
| `tools/e3-qa.cjs` | Dependencias reales; E3-11 ajustado (la marca caduca solo la receta que la usa: RP01 sí, RP05 no); E3-06 registra el presupuesto como parcial; E3-19 prohíbe la **apertura** directa de IndexedDB, no la palabra |
| `tools/e3-cierre-qa.cjs` | **Nueva**: 46 negativos y sección «antes» |
| `tools/e3-ui-qa.cjs` | Bandera de laboratorio; orientaciones apaisadas (UI-13b y UI-14b); UI-18 a UI-20 |

**Parche para Codex** (`e3/rubik-130ba24-e3.patch`): **idéntico** al del corte anterior (22 líneas). Los enganches no cambian; los archivos `e3/*` viajan aparte. La propuesta productiva **no** incluye `RUBIK_E3_QA`.

## 3. Pruebas por entorno

Comandos en la sección vigente del HANDOFF. Resultados en `evidence/e3/` (`e3-qa.json`, `e3-cierre-qa.json`, `e3-ui-qa.json`, `f0-adaptador-qa-130ba24.json`, `visual/`):

| Suite | Entorno | Resultado |
|---|---|---|
| `e3-qa.cjs`: 23 casos conservados | Node 22.23.5, pin `130ba24` | **23/23 PASS** |
| `e3-cierre-qa.cjs`: negativos | Node 22.23.5, pin `130ba24` | **46/46 PASS** (E3-A 7, E3-B 16, E3-C 9, E3-D 8, §8 6) |
| `e3-cierre-qa.cjs --antes`: reproducción sobre `448b3ef` | Ídem | 8/8 defectos reproducidos |
| Adaptador F0 (E3-05) | Node 22.23.5 | 11/11 |
| `e3-ui-qa.cjs` | Chromium 157.0.8103.78 (Playwright 1.63) en una copia aislada de `130ba24` + parche, `http://f0-2b.localhost` | **23/23 PASS**: los 18 anteriores + UI-13b (tableta apaisada 1180×820), UI-14b (móvil apaisado 844×390), UI-18, UI-19 y UI-20. 20 capturas |
| Firefox / WebKit | — | **NOT_RUN** (no instalados; no se descargan aquí) |

**No se recuentan** las históricas (recetas 117, exportador 72, economía 24, estados 23) ni se regeneran los D08.

**Ejecución reproducible de Firefox/WebKit para Codex** (en una máquina con descarga permitida):
1. `cd labs/studio-presentation/tools && npm ci`;
2. `npx playwright@1.63.0 install firefox webkit`;
3. `git archive 130ba24 | tar -x -C <pin>`;
4. `node tools/e3-copia.cjs <pin> <copia> 130ba24d420a2f4b26ab261313202e6070904fd8`;
5. `E3_NAV=firefox,webkit node tools/e3-ui-qa.cjs <copia>`.

**No equivalen** a Safari real ni a dispositivos físicos.

## 4. Dependencias que solo Codex puede resolver

1. **C1:** confirmar `readConfirmed()` como API de consumidores, y que la fuente del proyecto abierto es la entrada activa de la biblioteca confirmada.
2. **C2-img:** un `FloorPlanImages.get` sin creación, y confirmar el token de imagen por bytes efectivos.
3. **Expediente en el editor:** cargar `js/expediente-core.js` en `index.html`; forma parte del parche.
4. **Presupuesto ↔ geometría:** si producto quiere acreditar un presupuesto como «disponible» (no «parcial»), hace falta una autoridad que lo ligue a la revisión de geometría. **No se crea aquí.**
5. **Vistas:** una identidad estable de la toma de vistas (`takenAt` y `source` ya existen). **No se persisten cámaras.**
6. Errores de integridad del expediente con código propio (pendiente del informe 21).
7. El botón «Asistente», que se superpone al diálogo (residual global).
8. Firefox/WebKit, Preview e integración.

## 5. GO / NO-GO por contrato

| Contrato | Dictamen |
|---|---|
| C1 lectura confirmada | **GO de laboratorio** (sin escritura, sin sesión, nunca rechaza). Integración: requiere a Codex |
| C2 identidades + bytes efectivos + vigencia por fuente | **GO de laboratorio** (equivalencia con el expediente acreditada en A-00). Requiere C2-img de Codex para no depender de `databases()` |
| C3 variantes locales | **GO de laboratorio** (solo lectura; sin expediente v2) |
| C4 vistas de sesión vigentes; Blender como futuro consumidor | **GO de laboratorio** (sin cámaras persistidas, C6 sin activar) |
| Integridad del candidato (E3-B) | **GO de laboratorio.** Es una huella local, no una firma |
| Concurrencia (E3-C) | **GO de laboratorio** (determinista en Node; comprobado en Chromium) |
| Integración y activación productiva | **NO-GO**: Codex, D4, Preview, aceptación, Firefox/WebKit, Safari y dispositivos |
| Emisión, firma y aceptación; K11/K12; E4–E7 | **NO-GO** |

## 6. Límites

- Firefox y WebKit: NOT_RUN.
- Safari real, dispositivos físicos y lector de pantalla: no ejecutados.
- La aceptación visual del selector corresponde al propietario.
- La vista previa es de **composición**, no un documento final.
- §7.4 (PR en borrador): **no se abre**, porque este mandato no autoriza PR. La entrega se acredita por rama, SHA y enlaces.

**Siguiente actor:** ChatGPT (auditoría independiente) → Codex (preparación de la integración) → propietario (D4 y aceptación).

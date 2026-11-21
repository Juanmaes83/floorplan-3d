# CC2 · Localización general ES/EN/ZH · Primer corte: Home y navegación global

> **Candidata de Codex · 21/11/2026.** Rama `codex/l10n-home-post297`, sobre `master@cf0b50128603c6064ce45837e749772ab32df23e`. Conserva como segundo padre la fuente CC2 `06c16e765475dd1f20f89231bcb4aa2585fb30ee` (árbol `20865e1f85c29baf0e5300bebcb801f59ed53483`). Los resultados y límites del laboratorio que siguen corresponden a su base histórica.

La única reconciliación textual conserva los atributos de «Plano propio» y «Proyectos» junto con el selector ES · EN · ZH de R03. Los mensajes de creación y borrado de variantes pasan los nombres visibles por `nm()` y conservan los nombres guardados. Los 24 archivos de captura siguen accesibles en el SHA fuente, sin copiarlos al árbol productivo.

El acceso es **Inicio → cambiar idioma** o **cabecera → ES · EN · ZH**. La navegación conserva el área abierta y el foco. El cambio se propaga desde `setLang()` con `rubik:languagechange` y reutiliza la preferencia actual del navegador. Este corte cubre Home y navegación global, no la traducción completa de la paleta, propiedades y tarjetas.

La interrupción voluntaria de Presentación comunicada por CC2 corresponde al laboratorio. El gate de integración requiere CI para el árbol de la candidata y revisión del efecto de Production por separado. R02-A y Studio E3 conservan candidatas propias.

**Fecha:** 21/11/2026 · **Rama:** `claude/adoring-davinci-ko2xyr` · **Base:** `master` `a6a0494b6f15ed60db542ef6c95530ae3c2c0ca2` (#295) · **Estado:** DESARROLLADO y VALIDADO en laboratorio. No es PR productiva, no se fusiona, no se despliega, no se activa. R01 HOLD, F0/A0 congeladas, OP-07 inactivo, GOV-05 abierto: sin cambios.

El SHA y el árbol de la publicación se comunican en el informe de entrega (un archivo no puede contener el hash del commit que lo incorpora); se verifican con `git rev-parse HEAD` y `git rev-parse HEAD^{tree}`.

## 1. Qué se encontró (causas, no síntomas)

| # | Causa raíz comprobada | Efecto visible |
|---|---|---|
| C1 | El idioma se cambia por **dos caminos**: `#langBtn` (cabecera) y `#welcomeLanguage` (Home). Los módulos con texto propio (barra de áreas, Asistente, observaciones del cliente, solar, hoja de superficies) escuchaban el **clic del botón de la cabecera**, no el cambio de idioma. Desde la Home llamaban a `setLang()` directamente y esos módulos no se enteraban | Tras cambiar el idioma desde la Home: **«Diseñar», «Analizar», «Presupuestar», «Entregar», «Mi estudio», «Asistente»** seguían en el idioma anterior |
| C2 | `#presentationBtn` («Presentar mi vivienda») solo se rotulaba al redibujar la presentación; no seguía al idioma | **«Presentar mi vivienda»** quedaba en español en EN/ZH hasta recargar (por cualquier camino) |
| C3 | `applyCompact()` de la guía no se llamaba en `render()` | «Ver menos / Ver más» de la guía en el idioma anterior |
| C4 | Botón de idioma de la Home reconstruía el botón (y la Home) sin devolver el foco | Con teclado, tras el primer Intro el foco caía a `<body>` y el segundo Intro no hacía nada |
| C5 | Marcado estático con `data-en` sin su par en otros idiomas (`data-es-title`, `data-zh`): el sistema existente tomaba el texto del HTML —en español— como «chino» | En ZH: «Proyectos», «Vista:», «Explorar:», «Entorno», estudio/jardín/ciudad y título del botón «Guardar proyecto» en español; en ES el título de «Subir plano» en inglés |
| C6 | Rótulos de cabecera, diálogo de proyectos, avisos y confirmaciones del núcleo escritos solo en español | Ver matriz §2 |

## 2. Matriz de textos antes / después

Convención: ES / EN / ZH. «Antes» = lo que se veía en el idioma indicado en `master`.

### 2.1 Navegación y cabecera

| Superficie | Antes (error) | Después |
|---|---|---|
| Barra de áreas tras cambiar desde la Home | Se queda en el idioma previo (C1) | Diseñar / Design / 设计 · Analizar / Analyze / 分析 · Presupuestar / Budget / 预算 · Entregar / Deliver / 交付 · Mi estudio / My studio / 我的事务所 (texto y nombre accesible) |
| Botón del estudio (`title`) | No cambiaba al cambiar de idioma | «Logo, datos e identidad profesional» / «Logo, contact and professional identity» / «标志、联系方式和专业身份» |
| `#presentationBtn` (C2) | EN/ZH: «Presentar mi vivienda» | Presentar mi vivienda / Present my home / 展示我的住宅. Misma etiqueta accesible de la capa de presentación |
| Guía «Ver menos / Ver más» (C3) | Idioma anterior | Ver menos / Show less / 显示更少 · Ver más / Show more / 显示更多 |
| `aria-label` de la guía | «Objetivo y progreso» en EN/ZH | Objetivo y progreso / Goal and progress / 目标与进度 |
| `aria-label` del dock móvil | «Accesos principales» en EN/ZH | Accesos principales / Main shortcuts / 主要入口 |
| `aria-description` de «Presentar» bloqueada | Solo ES | ES / EN / ZH (el titular `st.headline` lo emite `building-ui`: pendiente, §5) |
| Botón de idioma de la Home | EN: «中文» (chino visible en sesión EN) | Español → English → Chinese → Español. Foco conservado en el botón |
| Cabecera «Nuevo proyecto» | ES en EN/ZH | Nuevo proyecto / New project / 新建项目 |
| Cabecera «+ Estancia» | ES en EN/ZH | + Estancia / + Room / + 房间 |
| Cabecera «Plantas» / «Plantas…» | ES en EN/ZH | Plantas / Levels / 楼层 (con «…» si hay edificio) |
| Cabecera «Plano propio» | ES en EN/ZH | Plano propio / Own plan / 自有平面图 |
| Texto de escala | «Medidas orientativas · escala estimada» en EN/ZH | ES / «Indicative dimensions · scale estimated» / «尺寸仅供参考 · 比例为估算值» (y las variantes pendiente / confirmada) |
| Menú Archivo «Tu marca profesional…» | ES en EN/ZH | ES / Your professional brand… / 你的专业品牌… |
| Menú Archivo «Reformar desde fotografía» | ES en EN/ZH | ES / Renovate from a photo / 从照片改造 (solo la entrada; el diálogo es de otro corte) |
| Título de «Subir plano» (`title`) | ES: «Upload a floor plan or project» (inglés); ZH: vacío | Subir un plano o un proyecto / Upload a floor plan or project / 上传平面图或项目 |
| Título «Guardar proyecto JSON» | ZH: «Descargar una copia del proyecto actual» | 下载当前项目的副本 |
| ZH: «Proyectos», «Vista:», «Explorar:», meta del plano | Español | 项目 · 视图： · 浏览： · 3 间卧室 · 2 个客厅 · 2 间浴室 · 参考平面图 |
| Entorno 3D (etiqueta, Estudio/Jardín suave/Ciudad, «decorativo», nota y `title`) | ZH en español | 环境 · 工作室 / 柔和花园 / 城市 · 装饰性 · 装饰性背景：不代表真实的地形、花园或城市环境 |
| «Exterior» (3D) | ZH «Exterior»; título solo ES | Exterior / Exterior / 外观, con título en los tres idiomas |
| Pie de página «Navegar: …» (`#traceStatus`) | Solo ES | ES / «Navigate: drag to pan; two fingers or the wheel to zoom. Indicative dimensions.» / «浏览：拖动平移；双指或滚轮缩放。尺寸仅供参考。» (sigue al idioma) |
| `aria-label` de la capa de presentación | ES | ES / Home presentation / 住宅展示 |

### 2.2 Diálogo «Proyectos locales» (global)

Título, texto, etiquetas, los seis botones, «Variantes», su explicación y los dos botones pasan de español único a ES/EN/ZH. Las entradas de la lista («variante de», «edificio, N plantas») también. **Los nombres de proyecto no se tocan:** se muestran con `nm()` (política de nombres).

### 2.3 Avisos y confirmaciones del núcleo (`index.html`)

Altura de peto, uso intercambiado, «Añadir hueco cancelado», dos fallos de PNG, «Se perdió la escena 3D», «No se pudo abrir la colección local», «Colección local no disponible», «Variante creada y abierta», «Cubierta no disponible» y la confirmación «¿Eliminar la variante…?» pasan por `L3(es,en,zh)` (helper existente). Los nombres citados (variante, original) se muestran tal como están guardados.

## 3. Cómo se resolvió (sin segundo motor ni almacenamiento)

* `setLang()` (el motor existente de `index.html`) emite al final **un único evento** `rubik:languagechange` (`detail.lang`). No guarda nada y no introduce diccionarios. La clave `rubik-sota-floorplan-lang` sigue siendo la única.
* Los cinco módulos que escuchaban el clic de `#langBtn` escuchan ahora ese evento (misma función, mismo diferimiento): `professional-workspace-ui`, `assistant-ui`, `review-notes-ui`, `solar-ui`, `surface-sheet-ui`. Se suman `app-shell`, `presentation-ui` y `tracing-ui` (solo la línea de estado por defecto).
* Cualquier camino de cambio de idioma (cabecera, Home y la Home reconstruida de STUDIO) queda cubierto con una sola condición: **llamar a `setLang()`**.
* Textos estáticos: se usan los atributos que ya existen (`data-en`, `data-es`, `data-zh`, `data-en-title`, `data-es-title`). Sin nuevo mecanismo.
* Los datos no se tocan: contratos, proyecto, geometría, persistencia (F0) y comportamientos intactos. La prueba verifica que proyecto y claves de almacenamiento son idénticos tras ES→EN→ZH→ES.

## 4. Pruebas

Bloqueante nueva: `tests/language-home-navigation.browser.test.cjs` (7 pruebas):

1. Home abierta, **solo teclado**, ES→EN→ZH→ES, 1440×900 y 390×844: el foco se queda en `#welcomeLanguage`; la Home sigue abierta con sus **cinco fases** (`ol.solutions-phases`); lo visible en Home, cabecera, barra de áreas, dock, guía, pie y enlace legal es **idéntico a una carga limpia en ese idioma** (cualquier resto del idioma anterior falla); sin chino en ES/EN; proyecto y almacenamiento intactos.
2. Editor con el ejemplo y **cada área abierta** (Diseñar, Analizar, Presupuestar, Entregar, Mi estudio), ES→EN→ZH→ES con el teclado desde la cabecera, ambos viewports: el área sigue abierta y marcada, los nombres accesibles son los esperados, «Presentar mi vivienda» está localizado y todo equivale a una carga limpia.
3. Home → editor → Home en los tres idiomas: **Escape** cierra la Home y devuelve el foco a «← Inicio»; la Home reabierta conserva las cinco fases; el diálogo de proyectos se localiza y Escape devuelve el foco a «Proyectos»; el idioma sobrevive a una recarga.
4. Política de nombres: nombres guardados sin cambios; el ejemplo se rotula con el diccionario conocido.
5. Guarda estática: ningún `toast`/`confirm` de `index.html` con literal solo en español.

**Sobre `master` la prueba falla (6 de 7)**, es decir, detecta los defectos originales; sobre este árbol pasa 7/7 (Chromium 1243, entorno de laboratorio, 1440×900 y 390×844).

**Recuento por superficie** (recorrido automatizado de 15 escenarios con contexto limpio por idioma; `residuales-por-superficie.json` lista cada texto):

| Superficie | Antes EN / ZH | Después EN / ZH |
|---|---|---|
| Dentro del corte (Home, cabecera, dock, barra de áreas, guía, Proyectos, Legal, Buscar, Asistente) | 23 / 26 | **0 / 0** |
| Paleta «Construir / Amueblar» | 48 / 48 | 48 / 48 (siguiente corte) |
| Panel de propiedades | 13 / 11 | 13 / 11 (siguiente corte) |
| Tarjetas de las áreas Presupuestar / Entregar / Studio | 30 / 29 | 29 / 28 (siguiente corte) |
| Otras (`aria-label` del lienzo) | 3 / 3 | 3 / 3 (siguiente corte) |

El «antes» de ese recorrido no incluye dos fallos que dependen del camino de la interacción y que solo detecta la prueba bloqueante: el cambio desde el botón de la Home (C1, C4) y «Presentar mi vivienda» (C2). Sobre `master` la prueba bloqueante falla 6 de 7.

**Regresión ejecutada sobre este árbol (Chromium 1243, 1440×900 salvo indicación), todas verdes:** `guide.test` 15, `capability-registry` 8, `capability-registry-k9` 8, `browser-test-coverage` 1, `first-paint-language` 1, `ui-language` 3, `home-demos` 3, `home-legal` 4, `professional-workspace` 17, `professional-entry` 10, `premium-shell` 5, `journey-orientation` 14, `guide-navigation` 14, `multiformat-guide` 9, `solar` 14, `sheet` 9, `surface-sheet` 6, `upload` 9, `brand` 3, `building` 3, `variants` 4, `build-palette` 3, `room-layout` 5, `assistant-ai-v2` 5 y la nueva `language-home-navigation` 7.

**Completada tras el primer commit:** `browser.test` 39/39 verdes.

**No concluida:** `presentation.browser` (suite de más de una hora): 48 casos verdes y 0 rojos en una ejecución interrumpida por tiempo y otra parcial sin rojos; no se da por verde. La ejecuta la CI de integración (`presentation.browser`, partición `presentation-*`).

No ejecutado: Firefox/WebKit (CI de integración), accesibilidad con lector de pantalla real, Preview/Production.

## 5. Límites y siguiente corte (inventariado, NO corregido)

Detectado con el mismo recorrido (ES-solo visible en EN/ZH). Son superficies de cortes posteriores; no se tocaron para no mezclar alcances:

| Superficie | Alcance | Notas |
|---|---|---|
| Paleta «Construir / Amueblar» (`js/build-palette.js`) | ~48 textos | Siempre visible junto a la navegación: **siguiente prioridad** |
| Panel de propiedades «Vista general del plano», acabados, peto, atajos | ~13 | `index.html`; incluye «m² útiles» en EN |
| Tarjetas de las áreas Presupuestar/Entregar/Studio | ~29 | `construction-context.js` (Recorrido de obra, Evolución de obra), `reference-prices-ui`, `brand-ui`, `moodboard-ui`, diálogo de `photo-reform-ui` |
| `plan-intake-ui`, `room-layout-ui`, `building-ui` (+ titular de «Presentar» bloqueada), `tracing-ui` (mensajes), `opening-ui`, `own-furniture-ui` | ~50 avisos/diálogos | Literales solo ES |
| Diálogo «Comparar distribuciones» | tarjetas y mensajes | `index.html` `renderVariants` |
| Mensajes de error de `project-library` | | Se muestran tal cual en el diálogo de proyectos |
| `persistence-editor.js` (3 avisos) | | **F0 congelada**: no se toca |
| Comillas «» en EN dentro de `capability-registry` | tipográfico | No es un error de idioma; los fixtures dependen del texto |
| Rótulo del botón de idioma de la cabecera en EN («中文») | | Lo resuelve #297 (selector ES · EN · ZH); no se duplica aquí |

## 6. Coordinación

* **STUDIO (Home reconstruida).** Contrato mínimo: (1) cambiar idioma = `setLang()`; (2) tras reconstruir, restaurar el foco en el botón de idioma y el `scrollTop`; (3) conservar `ol.solutions-phases` con **cinco** fases, con su `aria-label`; (4) reabrir por `#welcomeBtn` y Escape devuelve el foco. La prueba nueva comprueba exactamente eso por ids/clases (`#welcomeLanguage`, `#welcomeDialog`, `.solutions-phases > *`); si STUDIO renombra un selector, se actualiza el selector, no el contrato.
* **#297** (R03 + idioma visible): este corte **no depende** de él y no lo toca. Prueba de compatibilidad (copia local sin publicar): mi diff sobre `57b44558` da **un solo conflicto textual** en `index.html`, en tres líneas contiguas de la cabecera (`traceBtn`, `projectsBtn` —mías— y `langBtn` —de #297—). Resolución: conservar mis atributos `data-*` de las dos primeras y el `langBtn` de #297. Con esa resolución la prueba nueva pasa 7/7 y `no-chinese-display` (#297) pasa 4/4 y `ui-language` 3/3 sobre el árbol combinado. Tras su fusión, la política «sin chino en ES/EN» y `FloorPlanDisplayName` aplican también aquí y el selector `ES · EN · ZH` sustituye al rótulo «中文» de la cabecera.
* **#271** (OP-04 UX, `codex/ux-op04-smoothui`): un conflicto textual trivial en `index.html`: mi línea de `uploadPlanBtn` (añade `title` y `data-es-title`) y la línea nueva `roomPlanJoinQuick` de #271 son contiguas. Resolución: conservar ambas líneas. Sin conflicto en `guide-ui.js` (mis añadidos van en su propia línea). `roomPlanJoinQuick` ya trae `data-en`/`data-es` pero no `data-zh` (su texto de HTML es chino, correcto).
* **STUDIO E3** (`codex/studio-e3-integracion`): mi diff se aplica sin conflicto (su cambio en `professional-workspace-ui.js` está en otra región). **#296, la rama de CC1, #273 y #271 no se han modificado.**

## 7. Evidencia

Capturas (escritorio 1440×900 y móvil 390×844, cambio en vivo ES→EN→ZH): [capturas del SHA fuente](https://github.com/Juanmaes83/floorplan-3d/tree/06c16e765475dd1f20f89231bcb4aa2585fb30ee/docs/qa/artifacts/idioma-home-navegacion-2026-11-21) — Home, editor, «Presupuestar» y diálogo de proyectos.

## 8. Siguiente actuación

Codex: integrar sobre el master efectivo (con #297 si ya está fusionada) y ejecutar el CI. Propietario: confirmar el siguiente corte (propuesta: paleta «Construir/Amueblar» + panel de propiedades).

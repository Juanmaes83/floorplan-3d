# F0: auditoría histórica y reconciliación documental

**Reconciliación:** 01-10-2026 · **Estado:** PR #3 abierta, pendiente de revisión de Juanma; F0 no se declara aprobada.
**Fuente vigente:** `master` remoto @ `133f6f47fc5f16764cb290f95e49414932b27a09`. PR #3 parte de `825ddf629d037d57690aedeea188b725ebf561b5` y se actualiza incorporando ese master mediante merge normal, sin reescritura.

## 0. Lectura vigente y alcance de la comprobación

Prevalecen [ROADMAP](../ROADMAP.md), [workflow](../DEVELOPMENT-WORKFLOW.md) y el
[contrato implementado](../contracts/FloorPlanProjectV1.md). El contrato/schema
1.3.0 y sus ejemplos se conservan exactamente como en master: **no son cambios
de esta PR**. Los únicos documentos propios de #3 son esta auditoría, el
[registro D-00–D-16](F0-decisions.md), el [plan histórico reconciliado](F1-F3-plan.md)
y la [checklist vigente](../qa/PR-preview-checklist.md).

Se consultaron README, roadmap, workflow, contrato/schema, informes F1/F2/F3 y
[la entrega dimensional](../technical/home-room-dimensions.md) de master.
Las páginas públicas de GitHub de #3/#15/#18 se leyeron por curl el 01-10-2026:
#3 y #15 abiertas hacia master; #18 fusionada. Esto **no es** una nueva prueba de
app, Three.js, CI, preview Vercel, Asset Lab ni derechos de terceros.
Los resultados de QA siguientes se atribuyen a sus informes y SHAs originales;
no se repiten suites de producto ni se crea una preview visual en esta tarea.

| Tema originalmente auditado | Estado integrado en master y evidencia | Pendiente / límite |
| --- | --- | --- |
| Español, marca y varios proyectos | PR #4/#5: [F1a](../technical/F1a.md) y [base móvil/local](../technical/F1-local-projects-mobile.md); selector persistente y proyectos locales. | No es sync ni backend. Cobertura completa de textos nuevos no reaudita aquí. |
| Sin WebGL y móvil | PR #5 aporta mensaje y modo 2D operativo; QA posterior en los informes. | SwiftShader es render por software, no rendimiento físico; las medidas 844×140 de F0 son históricas. |
| Imagen, calibración y trazado | PR #6/#7: [F1b](../technical/F1b.md); PNG/JPEG/WebP estático, dos puntos y longitud, segunda cota, muros/huecos/estancias, JSON/ZIP. | 15 MiB y 8000 px por lado; rechazo, no reescalado automático. PDF/HEIC/animación/EXIF WebP no admitidos. Medidas orientativas. |
| Modelo y vistas | Contrato 1.3.0, IDs y geometría canónica compartida por 2D/3D. | La independencia de polígonos y ejes de muro no constituye un solver topológico general. |
| F2 | PR #9/#10/#11: [prototipo](../technical/F2-wall-assist.md), [métrica](../technical/F2-wall-evaluation.md) y [exportación cruda](../technical/F2-raw-export.md) integrados. Método métrico revisado, prototipo experimental. | **No validada empíricamente**. Cinco sesiones, veinte planos y umbrales siguen pendientes; no bloquean desarrollo autorizado. No se adopta la mejora provisional del 30 %. |
| F3 | PR #12 inicial y [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17) aprobada/fusionada (`24534b5544ffa37840bf4fe77c4ad12afda0c38b`): [piloto cerrado](../technical/F3-preview-catalog-fix.md) de SONGESAND 90366839 y puf STOCKHOLM 80586139 texturizados, buscador, atribución y fallback. | No catálogo universal ni soporte general de Draco/KTX2/meshopt/WebP/texturas remotas. No se reaudita el inventario de Asset Lab aquí. |
| Crear vivienda y dimensionar | [PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18), aprobada e integrada (`10e9f96b417f866d45088fede039786180ddce95`), [informe](../technical/home-room-dimensions.md): vacío/imagen independientes, rectángulos ortogonales, lado fijo, preview y operación reversible. | Rechaza relaciones ambiguas y conflictos; conserva edición manual. No edición numérica general de formas irregulares ni medición profesional. |
| Hosting y revisión | Workflow vigente y cierres #17/#18 registran Vercel READY del SHA revisado, acceso protegido/temporal y aprobación humana. | No se prueba ahora el acceso/READY. Un alias puede cambiar, un enlace temporal caduca y un 200/check de comentarios no demuestra 3D ni aprobación. |
| Permisos | Juanma confirmó el 30-09-2026 permisos para publicar F1a ([registro](../technical/F1a.md)); confirmó uso de Asset Lab y el 01-10-2026 incorporación/Git/preview del piloto ([procedencia](../../assets/f3/ASSET-LAB-PROVENANCE.txt)). | Confirmación del propietario con ese alcance, no dictamen, licencia general, permiso IKEA ni redistribución universal. MIT de la muestra sintética no se aplica al código base o assets externos. |

Las hipótesis de cliente/agente de §2 permanecen hipótesis: D-01 corresponde a
Juanma. La [auditoría de ecosistema](ecosystem-integration-audit.md) posterior
aporta snapshots documentales; no prueba integraciones ejecutadas con CRM,
Blender/Unreal, Immersphere o vídeo. No se amplía su alcance en esta corrección.

### 0.1 Antecedentes que no son hechos actuales

A partir del encabezado **Archivo histórico** se conserva la inspección de
Claude Code del 30-09-2026: app `a03136c86842968a3de5da4c33549d3df3313c51`,
español `540b8255eddd23e5ebb805a8f51dd5406a86911f` y Asset Lab
`5dc7b182c5c227472b84aea66a3ffa1368c95981`. Sus etiquetas [C] significan
comprobado **por aquella ejecución**, no por esta reconciliación. Rutas/líneas,
comandos, recuentos (incluido «0/134»), limitaciones y bloqueos de sus §1–§6 son
históricos y quedan sustituidos como estado actual por §0 y D-00–D-16.
No se aplican hoy las conclusiones absolutas «sin preview», «sin proyectos»,
«sin licencia para publicar» o «F1/F3 bloqueadas» de aquella fotografía.

### 0.2 Validaciones de esta actualización

Solo revisión documental: diff completo contra master, ausencia de cambios en
aplicación/contratos/assets, links internos y anchors, tablas/cercas Markdown y
`git diff --check`/`git diff --cached --check`. Se registra el resultado antes
del push. No hay linter documental dedicado en el repo; se usa comprobación de
Markdown/enlaces con Python estándar, sin dependencias ni ficheros nuevos en Git.
Mergeabilidad: ausencia de conflictos comprobada localmente tras integrar
master; el estado de GitHub se informa por separado si no está disponible.

### 0.3 Registro de validación y acceso (01-10-2026)

- `python3 /tmp/reconcile-doc-validator.py` sobre los cuatro documentos: tablas/cercas Markdown, links internos y anchors correctos. Helper temporal fuera del repo; no dependencia ni documento nuevo versionado.
- `git diff --name-only origin/master`: exactamente los cuatro documentos F0.
- `git diff --exit-code origin/master -- index.html js assets docs/contracts`: sin diferencias. No reaparece contrato/schema antiguo ni ejemplo paralelo.
- `git diff --check` y `git diff --cached --check`: correctos.
- Integración local: conflictos add/add de los dos archivos de contrato resueltos con la copia íntegra de master; sin conflictos restantes. La historia se conserva por merge, no rebase/force.
- La API REST GET de PR #3 devuelve `Forbidden`; mergeabilidad de GitHub **no verificada**. Las páginas HTML públicas y Git remoto permiten verificar estado, head/base y diff. La ausencia de conflictos local no acredita políticas/revisiones/checks de GitHub.
- El intento autorizado de actualizar título/descripción de #3 por REST PATCH devolvió `Forbidden`; esos metadatos no se actualizan desde Codex. El push a la rama existente actualiza los archivos de la PR, y estos documentos explican su alcance real.
- No se ejecutan suites, scripts de QA ni previews. Los conteos de producto permanecen reportes históricos. No se modifica app, schema, assets ni roadmap canónico.

**Enlaces externos:** páginas #3/#15/#18 leídas por curl (01-10-2026). Las URL
siguientes quedan **no reconsultadas** en esta tarea documental; no se renuevan
sus resultados HTTP, licencia, contenidos o evidencia interactiva. Los links de
Vercel y APIs de hosting en las fuentes de master se usan como registro histórico,
no como acceso actual certificado. Los ejemplos con `<SHA>` son plantillas.

- `https://github.com/Juanmaes83/floorplan-3d` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F0-decisions.md` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://github.com/Juanmaes83/floorplan-3d/pull/1` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://github.com/Juanmaes83/floorplan-3d/pull/17` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://github.com/Juanmaes83/floorplan-3d/pull/2` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://juanmaes83.github.io/floorplan-3d/` — no reconsultado; conservar atribución/fecha del antecedente.
- `https://wy51ai.github.io/floorplan-3d/` — no reconsultado; conservar atribución/fecha del antecedente.

## Archivo histórico — auditoría original del 30-09-2026


**Fecha de inspección:** 30-09-2026 · **Autor:** Claude Code (a petición de Juanma). Lo revisan Juanma y Codex.
**Estado del documento:** para revisión. Nada de lo que aquí se recomienda está decidido; las decisiones están en [`F0-decisions.md`](F0-decisions.md).

Leyenda usada en todo el documento:

- **[C] Comprobado:** evidencia directa (ruta y línea, SHA, salida de comando o URL observada).
- **[I] Inferido:** conclusión razonable que no se ha verificado directamente.
- **[P] Pendiente:** dato no disponible o que requiere decisión humana.

Las referencias `l. N` apuntan a `index.html` @ `a03136c`. Las líneas pueden desplazarse unas 100 en PR #1.

---

## 1. Estado de referencia

### 1.1 Repositorio y ramas

| Dato | Valor | |
|---|---|---|
| Repositorio | https://github.com/Juanmaes83/floorplan-3d, **público**, **fork** de `wy51ai/floorplan-3d` | [C] `gh repo view` / `gh api repos/…` |
| Rama por defecto | **`master`** (no existe `main`) | [C] |
| `master` | `a03136c86842968a3de5da4c33549d3df3313c51`, 29-09-2026, autor `wuyi`. Mismo SHA que `wy51ai/floorplan-3d@master`; Juanma no ha añadido nada | [C] `git log`, `gh api …/branches` |
| Contenido de `master` | `index.html` (2664 líneas, 181 KB), `README.md` (en chino), `.gitignore`. Sin `package.json`, tests, CI ni `docs/` | [C] `ls`, `gh api …/contents` |
| Licencia del código | **Ninguna**: sin fichero LICENSE ni en el fork ni en el upstream (`license: null`, `GET /license` → 404) | [C]. Riesgo legal para uso comercial: ver D-12 |
| `feat/rubik-sota-spanish-brand` | `540b8255eddd23e5ebb805a8f51dd5406a86911f`: 3 commits sobre `a03136c` (`517aad5`, `d72dde4`, `540b825`). Toca `index.html` (+281/−15) y `README.md` (+76/−63) | [C] |
| `docs/immersphere-product-roadmap` | `84ddf72265b83d46daebdb91fde0d5e568ceb019`: 1 commit que añade `docs/ROADMAP.md` (231 líneas) | [C] |

### 1.2 Pull requests relacionados

| PR | Rama → base | Estado | Integrado en `master` | CI / checks | Preview |
|---|---|---|---|---|---|
| [#1](https://github.com/Juanmaes83/floorplan-3d/pull/1) Añadir español y marca | `feat/rubik-sota-spanish-brand` → `master` | Abierto, **borrador**, `MERGEABLE`, sin revisiones ni comentarios | **No** | Ninguno (`statusCheckRollup: []`; no existe `.github/`; `gh run list` vacío) | Ninguna asociada. Ver §1.4 |
| [#2](https://github.com/Juanmaes83/floorplan-3d/pull/2) Roadmap e integración Immersphere | `docs/immersphere-product-roadmap` → `master` | Abierto, no borrador, `MERGEABLE` | **No** | Ninguno | No aplica (solo docs) |

[C] `gh pr list --state all`, `gh pr view N --json …`. Este trabajo no ha modificado ni comentado ninguno de los dos PR.

**Consecuencia:** el español y la marca **no están en `master`**. Quien abra hoy `master` (o el Pages del upstream) ve la app en chino con título `户型装修设计` [C] (QA §8, `master` → `title: 户型装修设计`, `lang: zh-CN`).

### 1.3 Verificación del cambio de español y marca (PR #1 @ `540b825`)

| Comprobación | Resultado | |
|---|---|---|
| Idioma inicial | `es`, con clave nueva `localStorage['rubik-sota-floorplan-lang']`. Rotación de idioma es → en → zh | [C] diff (`LANG_KEY`, `setLang`) y navegador (`lang: "es"`) |
| Marca | `document.title = "Rubik Sota Floor Plan Designer"` en tiempo de ejecución, `og:title` y `.brand` «Rubik Sota / Floor Plan Designer» | [C] navegador |
| `<title>` estático | Sigue siendo `户型装修设计`. Solo cambia cuando corre el JS, así que lo ven algunos rastreadores y previsualizaciones de enlaces | [C] `curl` del blob; [I] impacto |
| Clave de proyecto | Sigue en `localStorage['huxing-design-v1']` (sin cambios) | [C] |
| Sintaxis | `node --check` OK en los 2 bloques `<script>` de `master` y de `540b825` | [C] §8.2 |
| 2D y 3D en navegador | Renderiza y es interactivo en escritorio y móvil | [C] §8.3 |
| Textos pendientes | La estimación de pavimentos sigue mostrando **¥** (por ejemplo «¥10.941») en español | [C] captura `pr1-…-desktop-3d.png` |

### 1.4 Previews y enlaces comprobados

| URL | Qué es | Acceso | Resultado |
|---|---|---|---|
| https://github.com/Juanmaes83/floorplan-3d | Repo | Público | [C] 200 |
| https://juanmaes83.github.io/floorplan-3d/ | Pages del fork | — | [C] **404**. Pages no está activado (`GET /pages` → 404) |
| https://wy51ai.github.io/floorplan-3d/ | Pages del **upstream** | Público | [C] 200. Muestra el `master` del upstream, **no** las ramas de Juanma |
| `rawcdn.githack.com/Juanmaes83/floorplan-3d/<SHA>/index.html` | Proxy de terceros ligado al SHA | Público, **con página intermedia** | [C] Los bytes servidos a `curl` coinciden con el blob git de `540b825` (sha256 `af824a94…`). Un navegador recibe primero un aviso «External Content Notice» (HTTP 200, **no es la app**). Tras pulsar «Open the page», la app carga y el 3D renderiza (§8.3) |
| Vercel | — | — | [C] La cuenta `juanmaes83` no tiene ningún proyecto para este repo (`vercel project ls`) |
| Despliegues de GitHub | — | — | [C] Ninguno (`GET /deployments` → `[]`, sin entornos) |

**Versión de referencia propuesta para pruebas: PR #1 @ `540b825`.** Motivos:

1. Es la única versión con la marca y el idioma objetivo.
2. Añade 3 commits sobre `master` sin cambiar el modelo de datos. El diff solo toca traducciones, marca y README [C].
3. Pasa la misma QA 2D/3D que `master` [C].

Mientras no se mergee, `master` @ `a03136c` sigue siendo la **línea base funcional**. Toda comparación se hace contra ese SHA. [P] La elección final corresponde a Juanma (D-00).

---

## 2. Problema, usuario y flujo MVP

### 2.1 Hipótesis de producto (no validada)

> **Hipótesis H1:** un **agente o comercializadora inmobiliaria** necesita convertir el plano 2D de una vivienda que comercializa en una **visualización amueblada 2D/3D orientativa**, a escala razonable, en menos tiempo del que le cuesta hoy encargarla. Aceptará calibrar y trazar a mano si el proceso cabe en una sesión de trabajo corta y el resultado se puede enseñar al comprador desde el móvil.
>
> **Cómo se refutaría:** en un piloto con 3–5 agentes y 10 planos reales, (a) el tiempo mediano de plano → propuesta supera lo que el agente considera aceptable, o (b) menos de la mitad de las propuestas llegan a enseñarse a un comprador.

No hay investigación de usuarios en ningún repo revisado [C]: la única fuente es el roadmap del PR #2, que es una propuesta y no evidencia de mercado. Todo lo que sigue sobre frecuencia y contexto es **[P] hipótesis**.

### 2.2 Comparación de usuarios potenciales

| | Propietario / comprador | Agente inmobiliario | Interiorista | Profesional de reformas |
|---|---|---|---|---|
| Tarea | Imaginar cómo quedaría la vivienda y decidir compra o cambios | Presentar una vivienda de su cartera de forma atractiva y generar consultas | Proponer una distribución y un mobiliario concretos a un cliente | Medir, proponer demoliciones y presupuestar obra |
| Problema actual | El plano 2D es abstracto; no sabe si «caben» sus muebles | Encargar renders o home staging es caro y lento; el plano solo no emociona | Herramientas profesionales potentes pero laboriosas para una propuesta rápida | Necesita medidas exactas y documentación técnica |
| Resultado útil | Recorrido 3D de «su» casa con muebles movibles | Enlace o imagen de la vivienda amueblada para el anuncio o la visita | Propuesta con productos reales y medidas fiables | Planos de ejecución, mediciones, presupuesto |
| Frecuencia / contexto | [P] Puntual (una compra o reforma cada años) | [P] Recurrente, por cada vivienda captada | [P] Recurrente, por proyecto | [P] Recurrente, por obra |
| Tolerancia a trazar a mano | [I] Baja, sobre todo en móvil | [I] Media si ahorra un encargo externo | [I] Alta, pero exige precisión | [I] Alta, pero exige precisión técnica |
| Coste de una representación imprecisa | Medio: decisión de compra con información orientativa | **Medio-alto**: una medida errónea en material de venta puede generar reclamaciones [P] (requiere revisión legal, D-04 y D-10) | Alto: un mueble que no cabe | **Muy alto**: obra o presupuesto erróneos |
| Encaje con lo que existe | Visualización 3D sí; no hay flujo de autoservicio | Encaja con Immersphere Pro y el CRM de leads (existen como repos privados [C]; no auditados) | Requiere un catálogo con licencia real: 0 licencias verificadas (§4) | La app no es documentación técnica y no debe presentarse así |

### 2.3 Recomendación provisional (pendiente de D-01)

- **Usuario inicial:** el **agente o comercializadora inmobiliaria**, que actúa como **operador**. El comprador es el **espectador** de la propuesta, no quien la construye.
- **Problema prioritario:** «tengo el plano en imagen de una vivienda y quiero, sin encargar nada, una versión editable a escala con muebles genéricos que pueda enseñar en 2D y 3D».
- **Por qué** (evidencia más hipótesis):
  1. [C] El flujo viable a corto plazo es **manual** (calibrar y trazar). Un operador recurrente lo amortiza; un comprador puntual en móvil difícilmente [I].
  2. [C] El ecosistema existente (Immersphere Pro, CRM de leads, web para inmobiliarias) ya está orientado a este cliente.
  3. [C] Interiorista y reformas exigen precisión y catálogo licenciado que hoy no existen (§3, §4).
  4. El coste de error es asumible **solo si** el resultado se etiqueta siempre como orientativo y la escala muestra su confianza (`scale.confidence` en el contrato).
- **Qué la invalidaría:** que las entrevistas o el piloto muestren que los agentes no quieren operar la herramienta ellos mismos y prefieren un servicio hecho por el equipo. En ese caso, el «usuario» inicial pasaría a ser el **equipo interno de Rubik Sota/Immersphere** preparando propuestas como servicio. Esta alternativa es barata de probar y tiene los mismos requisitos técnicos en F1.

### 2.4 Flujo MVP: estado actual y corrección propuesta

| # | Paso propuesto | ¿Existe hoy? | Nota |
|---|---|---|---|
| 1 | Crear proyecto | **No** [C] | Hay un único estado global en `localStorage` (l. 534-562). |
| 2 | Cargar imagen de plano (PNG/JPG) | **No** [C] | El único `<input type=file>` importa JSON (l. 1466). |
| 3 | Indicar una dimensión conocida | **No** [C] | Existe la herramienta Medir (l. 810), pero sobre la plantilla ya en mm, no sobre una imagen. |
| 4 | Calibrar escala | **No** [C] | Los botones «1:60» y «1:100» son **zoom de pantalla** (`setRatio`, l. 1125), no calibración. |
| **4b** | **Verificar con una segunda cota** *(nuevo)* | No | Detecta deformación o escalado anisótropo del escaneo antes de trazar. |
| 5 | Generar **o** trazar habitaciones y muros | **No** [C] | Solo se pueden marcar como demolidos los muros no portantes y no exteriores de la plantilla (l. 1078-1085). **Propuesta:** en el MVP solo *trazar*; «generar» pasa a F2. |
| 6 | Colocar huecos (puertas y ventanas) *(explícito)* | No [C] | Hoy están fijos en `DOORS`, `WINS` y `SLIDES`. |
| 7 | Revisar y corregir | Parcial [C] | Hay deshacer y rehacer (150 pasos, l. 564) y edición de muebles; no hay lista de avisos ni estado «revisado». |
| 8 | Visualizar en 2D y 3D | **Sí** [C] | Funciona con la plantilla (§8.3). El 3D se construye desde las **constantes**, no desde datos del proyecto (l. 2279-2320). |
| 9 | Guardar o exportar | Parcial [C] | Guardado automático local, PNG 2D/3D y JSON **sin geometría ni versión** (l. 1464). |

**Flujo corregido (propuesta):** Crear proyecto → cargar PNG/JPG → calibrar con cota conocida → verificar con 2.ª cota → trazar muros → colocar huecos → cerrar estancias → revisar avisos → 2D/3D → amueblar → guardar/exportar `FloorPlanProjectV1`. El orden cambia en un punto: la verificación de la calibración va **antes** de trazar, porque un error de escala se propaga a todo lo demás.

**Precisión que puede prometerse hoy: ninguna cifra.** Con un plano limpio y una sola cota, el error lo dominan (a) la calidad y deformación del escaneo o la foto, (b) la precisión con la que se pulsan los extremos (±1–2 px; en un plano de 3000 px a 2 mm/px, eso son ±2–4 mm por punto) [I] y (c) la fiabilidad de la propia cota del plano. Propuesta: **medir** el error en F1 con planos reales antes de comunicar ninguna precisión (D-04). Mientras tanto, mostrar siempre «medidas orientativas» y la confianza de la escala. **No debe prometerse interpretar automáticamente cualquier plano.**

---

## 3. Auditoría de la aplicación actual (`a03136c`, igual en `540b825` salvo textos)

### 3.1 Datos, almacenamiento, importación y exportación

| Aspecto | Hallazgo | |
|---|---|---|
| Almacenamiento | `localStorage`: `huxing-design-v1` (proyecto), `huxing-panes` (paneles), idioma (`huxing-lang` en master, `rubik-sota-floorplan-lang` en PR #1). Nada sale del navegador | [C] l. 342, 534, 961 |
| Qué se guarda | `{furniture[], rooms{id:{name,mat}}, demolished['w<i>'], measures[{a,b}]}` | [C] l. 529-531 |
| Qué **no** se guarda | Muros, huecos, polígonos de estancia, escala, altura: son constantes del código | [C] l. 385-448 |
| Exportar JSON | `JSON.stringify(state)`: sin `schema`, sin versión y sin geometría | [C] l. 1464 |
| Importar JSON | Solo exige que `furniture` sea un array; `fixState` rellena valores por defecto; sin validación de tipos ni referencias | [C] l. 1466-1472, 539-544 |
| Exportar PNG | 2D: SVG → canvas 3200 px de ancho. 3D: `toDataURL` del canvas WebGL | [C] l. 1379-1397, 2657 |
| Deshacer | Pila de 150 instantáneas JSON completas en memoria | [C] l. 560-567 |
| Errores de guardado | `try/catch` vacío: si `localStorage` está lleno o bloqueado, el guardado falla **en silencio** | [C] l. 562 |
| Varios proyectos | **No**. Un único estado. «Restaurar» y «Vaciar» actúan sobre él | [C] |

### 3.2 Modelo geométrico 2D y relación con 3D

| Aspecto | Hallazgo | |
|---|---|---|
| Muros | 46 rectángulos alineados a ejes `[x0,y0,x1,y1,tipo]`, con tipo `b` (portante), `e` (exterior), `n` (no portante) o `low` (murete). Sin ángulos, sin grosor explícito (va implícito en el rectángulo) y sin altura por muro | [C] l. 385-411 |
| ID de muro | **Índice en el array** (`'w'+i`), así que es inestable si se edita la lista | [C] l. 578, 1079 |
| Ventanas | 12 rectángulos `WINS`. Antepecho y dintel **por índice**: `i===0` → 1,4 m; `i>=6` → 0,45 m; resto 0,9 m; dintel 2,4 m | [C] l. 413-419, 2307 |
| Puertas | 6 abatibles (`DOORS`, con bisagra y sentido) y 2 correderas (`SLIDES`); dintel 2,1–2,4 m fijo | [C] l. 421-433, 2305 |
| Estancias | 13 polígonos (`ROOMS`), 2 marcados `counted:false` (miradores). Área por fórmula de Gauss | [C] l. 435-448, 572 |
| 3D | Construido desde las **mismas constantes**. Muros = `BoxGeometry` por rectángulo con altura global `H=2.8` m; suelos = `ShapeGeometry` por polígono; techo visible solo con muros completos | [C] l. 1514, 2266-2320 |
| Sincronía 2D ↔ 3D | Real para muebles, materiales y demoliciones (`renderAll` → `View3D.sync()`). Se puede mover un mueble en 3D y se refleja en 2D | [C] l. 856, 1576-1598 y QA |

### 3.3 Unidades, escala, origen, orientación, redondeo y límites

| Aspecto | Hallazgo | |
|---|---|---|
| Unidad | mm en todo el modelo 2D. En 3D, metros (`/1000`) | [C] l. 1515 |
| Origen y ejes | Origen del plano en la esquina interior superior izquierda de la vivienda; x → derecha, y → abajo (SVG). En 3D, centro fijo `OX=6000, OY=5300` al origen del mundo; y del plano → z del mundo | [C] l. 1514-1515 |
| Rotación | Grados, positivo horario en planta, `norm()` redondea a entero `[0,360)`. Paso de 15° (libre con Shift). 3D: `rotation.y = −rot` | [C] l. 577, 1252, 2259 |
| Redondeo | Mover: rejilla de 10 mm más imán a muros. Redimensionar: múltiplos de 10 mm y mínimo 100 mm. Medir: 10 mm. Los campos numéricos aceptan decimales (`parseFloat`) | [C] l. 1133-1146, 1257, 1034 |
| Límites | `BOUNDS` fijo `{x:-1850, y:-1750, w:15600, h:14100}` para ajustar la vista y exportar PNG. Una vivienda mayor quedaría recortada en el PNG [I] | [C] l. 550 |
| «Escala 1:60 / 1:100» | Relación de **pantalla** CSS (`PX_MM = 25.4/96`), no del plano | [C] l. 546, 1125 |
| Área útil | 87,18 m² (suma de estancias con `counted !== false`) | [C] captura |

### 3.4 Inventario real

| Elemento | Hay | |
|---|---|---|
| Estancias | 13 (11 contabilizadas y 2 miradores) | [C] |
| Muros | 46 | [C] |
| Huecos | 12 ventanas, 6 puertas abatibles, 2 correderas | [C] |
| Materiales | 8 de suelo (`MATS`), con precio en **¥/m²** y un 5 % de merma. No hay materiales de pared | [C] l. 450-459, 887 |
| Muebles de catálogo | 60 entradas en 6 categorías (`LIB`): tipo, nombre, ancho y fondo. **Sin altura** en datos; la altura 3D va en el código de cada tipo | [C] l. 461-488 |
| Muebles en la plantilla | 46 | [C] QA `furnitureNodes: 46` |
| Medidas | Herramienta Medir con imán a muros; se guardan en `measures` | [C] |

### 3.5 Three.js: inicialización, ciclo, recursos, controles y errores

| Aspecto | Hallazgo | |
|---|---|---|
| Carga | Three.js **r160** por `importmap` desde **jsDelivr**, sin SRI. Sin red no hay 3D | [C] l. 216-221 |
| Inicialización | Perezosa, en la primera entrada a 3D: `WebGLRenderer` (antialias, `preserveDrawingBuffer`), `CSS2DRenderer` para etiquetas, sombras PCF (4096 px; 2048 en táctil), ACES y `RoomEnvironment` | [C] l. 1526-1560 |
| Ciclo | Bucle `requestAnimationFrame` solo mientras el 3D está activo; se cancela al volver a 2D | [C] l. 2472, 2643-2655 |
| Redimensionado | `ResizeObserver` sobre el escenario: `renderer.setSize` y aspecto de cámara | [C] l. 1613; QA: el canvas siguió el nuevo tamaño |
| Recursos | `clearGroup` libera geometrías al reconstruir; materiales y texturas se cachean y no se liberan. [I] Aceptable con una sola vivienda; revisar con varios proyectos | [C] l. 2265, 1621-1680 |
| Controles | Orbit (ratón y táctil), Walk con `PointerLockControls` más WASD en escritorio y joystick virtual en táctil, puertas con clic o tecla E, selección y arrastre de muebles en 3D | [C] l. 1561-1612, 2538-2560 |
| **Sin WebGL** | `THREE.WebGLRenderer: Error creating WebGL context` como excepción no capturada. **La UI queda bloqueada** (`body.busy` permanente, el botón 2D deja de responder) y **no aparece ningún mensaje** | [C] Chrome con `--disable-webgl` (§8.3) |
| Sin red o CDN | Aviso «3D engine is still loading or failed…» | [C] l. 1412 (mensaje en código; no probado sin red) |

### 3.6 Móvil y escritorio

| Aspecto | Hallazgo | |
|---|---|---|
| Detección | `pointer:coarse` para táctil (umbrales de arrastre y tiradores más grandes), `max-width:1100px` para diseño estrecho con cajones | [C] l. 547-549, 173-203 |
| Táctil | Pinza para zoom, un dedo para desplazar, barra flotante para rotar, duplicar y borrar, joystick en Walk | [C] l. 1157-1275 |
| Zoom del navegador | **Deshabilitado** (`user-scalable=no, maximum-scale=1`): problema de accesibilidad | [C] l. 5 |
| **Móvil vertical 390×844** | La barra de herramientas ocupa ~57 % del alto; el 3D queda en **390×331 px** | [C] QA y captura `pr1-…-mobile-390x844-3d-orbit.png` |
| **Móvil horizontal 844×390** | El 3D queda en **844×140 px**, inutilizable | [C] QA, `resize.after.cssSize` |
| Solo teclado o ratón | Atajos (T, V/M/X, R, Supr, Ctrl+D/Z, F, +/−, [ ], Shift+F); Walk de escritorio con Pointer Lock. En táctil hay equivalentes en pantalla para las funciones principales | [C] l. 1286-1310 |

### 3.7 Plano de muestra y funciones ausentes

- **Plano de muestra:** una única vivienda de 3 dormitorios y 2 baños (unos 87 m² útiles) cuyas cotas están en comentarios del código (l. 370-383). El plano original **no está en el repo**, así que esas cotas no se pueden contrastar [C].
- **Ausentes** [C]: proyectos múltiples; carga de imagen; calibración; trazado o edición de muros, huecos y estancias (salvo marcar demoliciones); revisión con avisos; catálogo externo o GLB; materiales de pared; monedas que no sean ¥; validación de importación; aviso sin WebGL; tests; CI; preview por PR; licencia.

---

## 4. Asset Lab (`Juanmaes83/immersphere-asset-lab`)

**Acceso:** privado, con lectura concedida a la cuenta autenticada `Juanmaes83` [C]. Revisado en **solo lectura** @ `main` `5dc7b182c5c227472b84aea66a3ffa1368c95981` (08-06-2026) mediante un clon superficial en un directorio temporal. No se ha modificado, descargado a este repo ni publicado nada.

### 4.1 Resumen: declarado frente a comprobado (134 entradas en `manifest/ikea-sample.manifest.json`)

| Estado | Nº | Evidencia |
|---|---|---|
| **Declarado** en el manifest | 134 | [C] Todas con `brand: "IKEA"` y `qaStatus: "pending"` |
| **Archivo comprobado**: el `modelPath` existe | **114** | [C] Todos versionados en git (el `.gitignore` excluye `*.glb` salvo `assets/ikea/**`) y con un tamaño idéntico al del árbol git. Suman 58,5 MB; el mayor, 2,85 MB |
| Archivo **no existe** | **20** | [C] `ikea-demo-001` … `020` apuntan a `assets/_placeholder/demo-model.glb`, que no existe |
| **GLB comprobado**: cabecera `glTF` v2 válida, longitud correcta y JSON parseable | 114 | [C] |
| …que requiere extensiones | 109 | [C] `KHR_draco_mesh_compression` (109), `EXT_texture_webp` (93), `KHR_texture_transform` (6). **Para cargarlos haría falta `GLTFLoader` + `DRACOLoader`**, que hoy no están en floorplan-3d |
| Preview: el fichero existe | 134 | [C] (114 PNG reales y 20 SVG de marcador) |
| **Preview comprobado visualmente** | **3** | [C] Abiertos y revisados: sofá GLOSTAD, cama BRIMNES (la preview muestra el armazón sin colchón ni cabecero) y armario BRIMNES de 3 puertas. Los otros 131 no se han revisado visualmente |
| Dimensiones numéricas en el manifest | **1 de 114** | [C] Las demás tienen `width/height/depth: null`. Las dimensiones solo se pueden estimar desde la caja envolvente del GLB [I] (sin transformaciones de nodo en 109/114) |
| **Licencia comprobada** | **0** | [C] Ver §4.2 |

### 4.2 Licencias: lo declarado no coincide con lo documentado

- Las 134 entradas declaran `licenseType: "authorized-commercial-demo"`, `commercialUseAllowed: true` y `brandUsageAllowed: true` [C].
- `permissionDocumentRef` apunta a `permissions/README.md` (133 entradas) o a `docs/placeholder-permission-ikea.pdf` (1 entrada, **el fichero no existe**) [C].
- `permissions/README.md` es una **plantilla**. Su tabla indica **IKEA: `pending`, sin permiso comercial, sin documento y sin vigencia** [C]. No hay subcarpeta `permissions/ikea/` [C].
- `docs/licensing.md` no define el tipo `authorized-commercial-demo`; solo `commercial-demo` y `authorized-commercial` («Sí, firmado») [C].
- `npm run validate` (`node scripts/validate-manifest.js`) da **«ALL CHECKS PASSED, 134 items»** [C]. Ese validador **no comprueba** que los ficheros ni los permisos existan, así que su resultado no acredita disponibilidad ni derechos.
- Varias entradas tienen `sourceUrl` y `productUrl` vacíos y la nota «importado manualmente» [C]: **no consta la procedencia**.

**Conclusión:** existen GLB reales e inspeccionables, pero **ningún asset tiene licencia verificable**. Hasta que exista un documento firmado que cubra el uso, no deben usarse en una experiencia pública o comercial los modelos IKEA, sus nombres, SKU, imágenes ni precios. Su uso queda **sujeto a disponibilidad y a derechos verificables** (D-11).

### 4.3 Candidatos relevantes para interiores (uno por categoría del catálogo actual)

Hash = primeros 16 hex del sha256 del fichero. «Caja GLB» = tamaño bruto en metros de las posiciones sin transformar [I].

| Categoría | assetId | Ruta | Bytes | sha256 (16) | Extensiones requeridas | Dim. manifest | Caja GLB (m) | Preview | Licencia |
|---|---|---|---|---|---|---|---|---|---|
| sofa | `ikea-glostad-3-seat-sofa-knisa-dark-grey-demo` | `assets/ikea/sofa/glostad-sofa-de-3-plazas-knisa-gris-oscuro.glb` | 55 708 | `ee97e34a2da4926d` | Draco, WebP, TexTransform | null | 1,78×0,81×0,78 | Vista ✔ | No verificada |
| armchair | `ikea-saltsjobaden-armchair-tonerud-red-brown-demo` | `assets/ikea/armchair/saltsjobaden-sillon-tonerud-marron-rojizo.glb` | 100 784 | `a94ebc5651ee6423` | Draco, WebP | null | 0,93×0,90×0,82 | Existe | No verificada |
| bed | `ikea-brimnes-estructura-de-cama-con-almacenaje-blancoluroy-demo` | `assets/ikea/bed/brimnes-estructura-de-cama-con-almacenaje-blancoluroy.glb` | 630 152 | `4aa5610bb99bff38` | Draco, WebP | null | 1,51×0,47×2,05 | Vista ✔ (sin colchón) | No verificada |
| bedside-table | `ikea-brimnes-mesita-de-noche-blanco-demo` | `assets/ikea/bedside-table/brimnes-mesita-de-noche-blanco.glb` | 286 180 | `03af83991888397f` | Draco, WebP | null | 0,39×0,53×0,44 | Existe | No verificada |
| wardrobe | `ikea-brimnes-armario-con-3-puertas-blanco-demo` | `assets/ikea/wardrobe/brimnes-armario-con-3-puertas-blanco.glb` | 310 796 | `2db6efa9c99970f6` | Draco, WebP | null | 1,17×1,94×0,53 | Vista ✔ | No verificada |
| dining-table | `ikea-demo-004` | `assets/_placeholder/demo-model.glb` | — | — | — | 180×90×75 cm | — | SVG de marcador | **Archivo inexistente** |
| table | `ikea-nammaro-garden-table-light-brown` | `assets/ikea/tables/nammaro-garden-table-light-brown.glb` | 184 216 | `5ab7c7e20f99fe76` | Draco, WebP | null | 0,75×0,75×0,63 | Existe | No verificada |
| chair | `ikea-vittskar-armchair-outdoor-dark-grey-20575167` | `assets/ikea/chairs/vittskar-armchair-outdoor-dark-grey.glb` | 2 330 000 | `56f00593a0eddb94` | Draco, WebP | 64×59×95 cm | 0,61×0,95×0,66 | Existe | No verificada |
| coffee-table | `ikea-frotorp-coffee-table-white-chrome-white-glass-demo` | `assets/ikea/coffee-table/frotorp-mesa-de-centro-blanco-cromadoblanco-vidrio.glb` | 325 104 | `102063ce485aaae9` | Draco, WebP | null | 0,88×0,35×0,88 | Existe | No verificada |
| tv-unit | `ikea-brimnes-tv-unit-white-demo` | `assets/ikea/tv-unit/brimnes-mueble-tv-blanco.glb` | 478 800 | `ff59d8491500ac43` | Draco, WebP | null | 1,80×0,54×0,44 | Existe | No verificada |
| dresser | `ikea-hemnes-comoda-de-2-cajones-tinte-blanco-demo` | `assets/ikea/dresser/hemnes-comoda-de-2-cajones-tinte-blanco.glb` | 349 912 | `0aa7a66669a143f5` | Draco, WebP | null | 0,54×0,66×0,39 | Existe | No verificada |
| vanity | `ikea-hemnes-tocador-blanco-demo` | `assets/ikea/vanity/hemnes-tocador-blanco.glb` | 332 036 | `659163f13f027942` | Draco, WebP | null | 1,00×1,59×0,50 | Existe | No verificada |
| kitchen-base-cabinet | `ikea-knoxhult-ab-cajones-blanco-90326787-demo` | `assets/ikea/kitchen-base-cabinet/knoxhult-ab-cajones-blanco-90326787.glb` | 1 115 984 | `d119e6aa94274a03` | ninguna | — | 0,42×0,91×0,61 | Existe | No verificada |
| rug | `ikea-morum-indoor-outdoor-rug-beige` | `assets/ikea/rugs/morum-indoor-outdoor-rug-beige.glb` | 275 944 | `db17959485c5559b` | Draco, WebP | null | 1,59×0,02×2,32 | Existe | No verificada |

Observación [I]: el eje vertical del GLB (Y) no coincide siempre con el orden ancho × alto × fondo del catálogo actual. Habrá que normalizar orientación y unidades por asset antes de sustituir un mueble genérico (F3).

---

## 5. Comandos ejecutados y resultados

| Qué | Comando | Resultado |
|---|---|---|
| Acceso GitHub | `gh auth status` | [C] `Juanmaes83`, alcances `repo, workflow, read:org, gist` |
| Estado del repo | `gh repo view`, `gh pr list --state all`, `gh pr view 1\|2 --json …`, `gh run list`, `gh api …/deployments\|pages\|environments\|license` | [C] Ver §1 |
| Comandos de la app | Ni `package.json` ni workflows. El README indica **abrir `index.html`** o `python3 -m http.server 8000` | [C] No hay install, build, lint ni test que ejecutar |
| Servidor local | `python -m http.server 8101 --bind 127.0.0.1 --directory <worktree a03136c>` (y 8102 para `540b825`) | [C] HTTP 200 |
| Sintaxis JS | Extraer los `<script>` no `importmap` y `node --check` (Node 24.14.1) | [C] OK: 2/2 bloques en `a03136c` y 2/2 en `540b825` |
| QA 2D/3D | `node qa3d.mjs <url> <etiqueta> <out>` (script en [`../qa/PR-preview-checklist.md`](../qa/PR-preview-checklist.md), Anexo) con Chrome 64-bit headless y `playwright-core@1.47` en un directorio temporal | [C] Ver §8.3 de la checklist y abajo |
| Contrato | Ajv 8.20.0 + ajv-formats 3.0.1 en un directorio temporal | [C] Válido: OK (1 aviso). Inválido: 14 errores de esquema y 4 semánticos. Ver [`FloorPlanProjectV1.md` §8](../contracts/FloorPlanProjectV1.md) |
| Asset Lab | Clon `--depth 1` en solo lectura; script de auditoría (sha256, cabecera GLB, `git check-ignore`); `node scripts/validate-manifest.js` | [C] §4 |

### 5.1 Resultado de la QA en navegador (30-09-2026)

GPU: **SwiftShader** (WebGL2 por software). Valida el render y la interacción, **no el rendimiento** en dispositivos reales [C].

| Build | Viewport | 2D | 3D renderizado | Órbita cambia la imagen | Resize | Errores |
|---|---|---|---|---|---|---|
| `a03136c` (local) | 1440×900 | 46 muebles, `zh-CN` | Sí (351 colores distintos) | Sí (Δ luminancia 54,0) | 1024×642 ✔ | Solo `favicon.ico` 404 |
| `a03136c` (local) | 390×844 táctil | Sí | Sí (291) | Sí, con arrastre de un dedo (39,1) | 844×194 ⚠ | Ninguno |
| `540b825` (local) | 1440×900 | 46 muebles, `es` | Sí (361, σ 60,3) | Sí (54,9) | 1024×603 ✔ | Solo `favicon.ico` 404 |
| `540b825` (local) | 390×844 táctil | Sí | Sí (365) | Sí (63,7) | 844×**140** ⚠ | Ninguno |
| `540b825` (githack) | ambos | Igual que en local | Igual | Igual | Igual | Además `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` (recurso de la página intermedia del proxy) |
| `540b825` sin WebGL | 1280×800 | Sí | **No**; excepción no capturada | — | — | UI bloqueada en `busy` sin mensaje |

Las capturas no se versionan en este PR para no añadir binarios. Se adjuntarán al PR o se generan con el script.

---

## 6. Criterios de salida de F0: autoevaluación

| Criterio | Estado |
|---|---|
| Commit de referencia y estado de español y marca identificados con evidencia | ✔ §1 |
| La auditoría distingue comprobado, inferido y pendiente | ✔ |
| Usuario, problema y flujo MVP recomendados sin presentarlos como validados | ✔ §2 (hipótesis H1) |
| Esquema con ejemplo y límites | ✔ [`FloorPlanProjectV1.md`](../contracts/FloorPlanProjectV1.md) |
| Disponibilidad de assets separada de la declaración | ✔ §4 |
| Decisiones de negocio y privacidad con responsable y estado | ✔ [`F0-decisions.md`](F0-decisions.md). **Siguen abiertas**; ninguna aprobada |
| F1–F3 con alcance, exclusiones, criterios y dependencias | ✔ [`F1-F3-plan.md`](F1-F3-plan.md) |
| Comandos comprobados contra el repo | ✔ §5 (el repo no tiene comandos propios) |
| Checklist de preview que exige verificar Three.js en navegador | ✔ [`../qa/PR-preview-checklist.md`](../qa/PR-preview-checklist.md) |
| Diff solo con documentación y artefactos de contrato | ✔ (los scripts de QA y validación van dentro de los `.md`, como anexos) |

**Bloqueos para aprobar F0:**

1. Las decisiones D-00, D-01, D-04, D-06, D-08 y D-12 necesitan respuesta de Juanma (ver registro).
2. **No existe una preview oficial por PR.** La única URL pública ligada al SHA que renderiza el 3D es un proxy de terceros con página intermedia (githack), útil para revisar pero no para depender de él. La opción para resolverlo está en D-07 y requiere autorización de Juanma.

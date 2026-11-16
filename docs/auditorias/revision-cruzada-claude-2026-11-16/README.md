# Revisión cruzada independiente de la auditoría de consolidación #240 (Codex)

**Revisor:** Claude Code 1. **Fecha:** 2026-11-16.

**SHA comprobados al empezar y al cerrar:**
- `master` = `46174d6918e336119a79f5bda9fd2733aa5464c4`, sin cambios;
- #240 = `c61b87d`;
- #238 = `6568d8c83c3de8611cdbd3368effcac61c34812d`.

**Alcance y método:**
- Leí íntegramente el resumen, la matriz, las 29 fichas, el inventario, la arquitectura, los recorridos A–H, el plan, el registro de evidencias y los riesgos. `pr-forensics.json` lo consulté con scripts.
- No repetí todas las consultas de Codex. Verifiqué **de forma independiente** los hallazgos de mayor impacto con:
  - Git, con el historial completo;
  - código con número de línea;
  - pruebas puras y de navegador en `master@46174d6`.
- **No toqué** la rama de Codex ni sus ficheros, ni `index.html`, `budget-ui.js` o los módulos compartidos del Asistente.
- Sin merge, sin Production, sin gasto.

**Etiquetas:** **CONFIRMADO** · **CORREGIR** (cambia el plan) · **NO BLOQUEANTE**.

---

## 1. Discrepancia crítica (ya comunicada en #240)

### CORREGIR-1 · P1 · Copias importadas que comparten un único presupuesto
**Hecho demostrado.** Si se importa el mismo `project.json` (el «Exportar proyecto»), salen entradas de la biblioteca con **el mismo `project.id`**. Presupuesto, enlaces de catálogo e historial del Asistente se guardan con esa clave. Editar un precio en la copia **cambia el presupuesto del original**.

- **Código (`master@46174d6`):**
  - `js/project-library.js:47` (`add`) y `:49` (`importProject`, la ruta `index.html:2526` `adoptImported`) conservan el `project.id` del fichero;
  - `:54` (`duplicate`) y `:71` (`variant`) asignan uno nuevo;
  - `js/budget-ui.js:42` guarda en `rubik-budget-v1[app.project.id]`;
  - `js/assistant-ui.js:79-80` guarda el historial en `[app.project.id]`.
- **Prueba pura** (`evidencia/scripts/import-id-check.cjs` → `evidencia/presupuesto-compartido/import-id-check-46174d6.json`): importar dos veces da **3 entradas con `prj_reference-home`**; duplicar y crear variante dan ids nuevos.
- **Editor real** (`evidencia/scripts/shared-budget-demo.cjs`, Chromium 1440×900, con vídeo `demo-1440x900.webm` decodificado sin errores y captura):
  - en el original se pone un precio de 11 €; la copia importada por `#fileIn` ve **11 €**;
  - se pone 99 € en la copia y se vuelve al original por «Proyectos → Abrir»;
  - el original muestra **99 € «Precio de la copia»**: `SHARED_BUDGET: true`, una sola clave de presupuesto para 2 entradas.
- **Corrección (un contrato común, no parches):** **«un `project.id` por entrada de biblioteca»**.
  1. `add`, `importProject` e `importBuilding` re-identifican **solo si hay colisión**.
  2. Migración al cargar: las entradas que hoy comparten id se re-identifican y se les **copia** el presupuesto compartido (se bifurca; nada se borra).
  3. Ver CORREGIR-2.
- **Dependencias:** `project-library.js`, `budget-ui.js`, `assistant-ui.js`. Son **ficheros de integración de Codex**.
- **Riesgo de regresión:** bajo. Hay que revisar las pruebas que comparen `project.id` tras importar.
- **Aceptación:**
  - importar dos veces → ids distintos;
  - editar en la copia → el original intacto;
  - la migración no pierde ninguna cifra.
- **¿Cuándo?** **Ahora**, antes del ensayo A–H y de cualquier piloto.

### CORREGIR-2 · P1 · Duplicar o crear variante pierde los datos económicos
- **Hecho:** `duplicate` y `variant` cambian el `project.id`. La copia nace con un borrador nuevo: **sin precios manuales, sin IVA propio (10 %, 0 %) y sin revisiones**. Ninguna prueba ni documento de `master` lo declara como comportamiento deseado.
- **Corrección (mismo contrato):** la biblioteca emite `project-forked {from,to}` y Presupuestar copia `rubik-budget-v1[from]` → `[to]` con `subject.id` actualizado. El Asistente hace lo mismo con su historial, o empieza de cero si así se decide. Una sola señal resuelve presupuesto, historial y futuros estados por proyecto.
- **Aceptación:** duplicar y crear variante conservan precio, IVA propio, unidad y revisión con `subject.id` nuevo. Comparar variantes (UX-07) muestra importes y no «desconocido».
- **¿Cuándo?** Junto con CORREGIR-1, en el mismo corte.

---

## 2. Conclusiones de Codex — veredicto por punto

### A. PR absorbidas o duplicadas (#225, #226, #227, #217, #71, #86)
- **CONFIRMADO** · Git. Tras recuperar el historial completo, `rev-list` y `merge-base` coinciden exactamente con la matriz:
  - #217 es **ancestro** de `master` (0 por delante, 144 por detrás);
  - #86 va 61/416 y #71 28/416.
- **CONFIRMADO** · Sin pruebas exclusivas útiles (`evidencia/pruebas-exclusivas-pr-absorbidas.txt`). Ningún título de test de #225, #226, #215, #86, #71 ni #217 falta en `master`.
- **CORREGIR (precisión) · #227.** Tiene **un** título exclusivo: «envío: solo la solicitud cerrada y la imagen recomprimida con nombre fijo…». **No debe recuperarse**:
  - valida un protocolo antiguo, con `FormData` y `authorization: Bearer <token>` **desde el navegador** (`pr/227:js/photo-reform-provider.js:70-74`);
  - `master` lo sustituyó a propósito por una llamada al mismo origen sin credenciales (`js/photo-reform-provider.js:88`);
  - `master` tiene la prueba equivalente y más estricta: «envío: mismo origen, sin secretos del proveedor…».
  - Recuperarla reintroduciría un token en JS del navegador. Cierre de #227 sin rescates.
- **CORREGIR · #71 y #86, «absorbidas con pruebas».** La función está en `master`, pero **sus propias pruebas de `master` no están en CI y fallan hoy**. En `master@46174d6`, `journey-orientation` + `presentation` + `guide-navigation` dieron **50 correctas / 6 fallidas** (ejecución cortada a los 25 min, sin resumen final; `evidencia/movil/journey-presentation-guide-46174d6.tap`):
  - T1/T9/T10 en 1440, 390 y 844;
  - T8 (cabecera guiada);
  - T11: «guide height 176 px ≤ 170»;
  - T13: se resalta «Diseñar» en lugar de «Distribuir».
  - Antes de proponer el cierre de #71 y #86 hay que decidir si cada aserción está **obsoleta** (se actualiza con justificación) o es una **regresión** (se corrige). No vale con declarar «absorbida».

### B. PR parcialmente incorporadas (#166, #193, #194, #215)
- **CONFIRMADO · #193 y #194:** todo su contenido exclusivo son `labs/`, `docs/` y capturas. Nada pertenece al producto. Fusionarlas crearía un **segundo modelo de techo o de armario**. Se conservan como laboratorio.
- **CONFIRMADO · #215:** lo único exclusivo son `docs/qa/r03-professional-20261113/` (capturas y guía de revisión humana). La prueba no aporta títulos nuevos. **NO BLOQUEANTE:** si se quiere, se copia esa carpeta de documentación y se cierra.
- **CORREGIR · #166 (alcance mucho menor del que se planifica):**
  - **El servidor ya está completo en `master`:**
    - `api/share.js:16,30,42` acepta `kind=delivery` con validación;
    - `api/delivery.js` lo lee por GET con límites estrictos;
    - `tests/ent01-delivery-api.test.cjs` lo cubre.
  - **Solo faltan dos piezas de cliente:**
    1. `js/delivery-client.js:182` (`throw Error('missing')`) → `fetch('api/delivery?f='+…)`: son exactamente 2 líneas en `pr/166:js/delivery-client.js:183-184`;
    2. `js/share-link-ui.js`: subir el snapshot (`upload('delivery',…)`) y generar `?entrega=<url>` (`pr/166:js/share-link-ui.js:36`).
    - Más portar `tests/delivery-3d.browser.test.cjs`.
  - **No traer de #166:**
    - `api/delivery.js`, `api/share.js`, `api/unshare.js` y `js/share-link-ui.js` completos, que son anteriores a GOV-08 (−147 líneas);
    - las capturas `output/playwright/point-9/*`, que son resultados de pruebas versionados por error.
  - **Prioridad:** de «P1, 8 conflictos» pasa a **P2, corte pequeño de cliente**, solo si el propietario quiere visita remota.

### C. Home #236 frente a `master` y frente a #238
- **CONFIRMADO:** #236 tiene `merge-tree` limpio y **no comparte ningún fichero con #238**, así que el orden entre ambas es libre.
- **CORREGIR (reconciliación concreta):**
  - `pr/236:js/capability-registry.js:134-144`: `catalog-budget` y `assistant-catalogs` siguen en `preparation` con `gate:'CAT-04'` y el texto «Pendiente de CAT-04». Como `aiServices()` nunca devuelve trabajo con `gate`, sin cambios la Home **ocultaría CAT-04**, que ya está en `master`. Hay que quitar la puerta y pasar al estado verificado (como mucho `pilot`), con los módulos `js/catalog-budget-core.js` y `js/cat04-ui.js` y las pruebas `tests/cat04*.cjs`.
  - `:89` `AI_VERIFIED_AT='b9f7613…'` → el SHA de integración.
  - `render-ai` `available` está anclado a `dpl_5abs4…` del 9/11. Volver a comprobarlo contra el alias real en el momento de promover.
- **NO BLOQUEANTE · #238:** `assistant-llm` sigue en `preparation`, con `access:null` y sin acceso duplicado. Es correcto mientras la pasarela esté cerrada.
  - Al integrar #238, hay que añadir a sus módulos `js/assistant-agent-core.js`, `js/assistant-gen-ui.js` y `tests/assistant-gen*.cjs`.
  - El panel mostrará «Conversación con IA», que explica que no está disponible sin autorización. La tarjeta guiada («no hay ningún modelo de lenguaje conectado») sigue siendo cierta.
- **CONFIRMADO · alias:** `floorplan-3d-alpha.vercel.app/js/cat04-ui.js` devuelve **404**, aunque el despliegue de Production de `46174d6` (`dpl_85gs9…`) está READY. Ningún estado `available` de la Home debe inferirse de `master`.

### D. Asistente V3 (#238)
- **CORREGIR (información desfasada):** la ficha describe `5e3a2e9`. **El estado actual es:**
  - HEAD `6568d8c`, base `master`, Draft;
  - conflicto resuelto como unión;
  - **CI completa 25/25**; Preview `dpl_HrAGJgnujL8XES9YgZ577627QrCD` READY;
  - artefactos verificados: 36/36 y 4/4 SHA-256, 14 vídeos decodificados.
  - Además:
    - **IVA por partida y unidades comerciales visibles para el modelo**;
    - comprobación de cifras con unidad y medida;
    - pruebas rojo → verde 2/6 → 6/6 y 0/2 → 2/2.
  - La frase «no se demostró que [los fallos de `assets.browser`] fueran preexistentes» queda superada: el mismo fallo aparece en **`0babb48`**, un SHA solo de CAT-04, y hay comparaciones alternadas con 4 y 2 CPU y vídeos (acta 07 §3 en #238).
- **CONFIRMADO:** el código compartido y el `studioId` del navegador **no son identidad de servidor**. El aislamiento de #238 es local (estudio + proyecto). Por eso **CORREGIR-1 también afecta a #238**: dos copias con el mismo `project.id` comparten ámbito. Se resuelve con el mismo contrato, sin tocar #238.
- **Clasificación propuesta:** de **D** a **«lista para reauditoría independiente»**, sin merge sin GO y con la prueba C (modelo real) sin hacer.

### E. Integridad del proyecto
- **CONFIRMADO:** no hay importación del JSON de presupuesto (`budget-ui.js`: solo `.bc3` en la línea 85 y descarga JSON en la 113), y exportar el proyecto no lleva el presupuesto.
- **CORREGIR (omisión):** CORREGIR-1 y CORREGIR-2. El riesgo que la auditoría da como «a probar» está demostrado.
- **Simplificación:** no hace falta ningún motor nuevo ni duplicar el proyecto.
  - **Paso 1 (ahora):** identidad única y bifurcación del estado económico al copiar (`project-forked`).
  - **Paso 2 (solo si el piloto cruza dispositivos):** el paquete `project.zip` añade un `budget.json` validado con `FloorPlanBudgetV1`, con importación que pasa por `validateBudget`, conserva `subject.id` = nuevo `project.id` y nunca recalcula nada fuera de `calculateBudget`.

### F. Entrega al cliente
- **CONFIRMADO:** en `master` la visita solo se carga desde `opener` (`delivery-client.js:177-182`).
- **CORREGIR (alcance):** ver #166. Hacen falta dos piezas de cliente y una prueba E2E: publicar el snapshot sintético → abrir sin sesión en otro contexto → revocar → 404. Nada del servidor.

### G. Fallos móviles y carga 3D
- **CONFIRMADO · se reproducen los tres** en `master@46174d6` (`evidencia/movil/build-palette-wall-structure-46174d6.tap`).
- **CORREGIR (tipo y causa):**
  - **`build-palette` 390×844 y 844×390** es un **defecto de producto**: en 3D, `#nav3dToggle` («▸ Navegación», dentro de `#stage.is3d`) queda por encima del cajón y **tapa la pestaña «Construir»**. En un teléfono con la vista 3D abierta no se puede pulsar.
    - **Corrección:** con el cajón abierto en vista estrecha, poner los controles de NAV3D por debajo del cajón (`z-index`) u ocultar el botón.
    - **Aceptación:** `build-palette` en los 3 tamaños y `nav3d.browser` en verde.
  - **`wall-structure` 390×844:** «Inicio» pierde su margen de 10 px con el cajón abierto. Es cosmético, P2.
- **OMISIÓN RELEVANTE (CORREGIR):** **39 de los 145 ficheros de prueba de navegador no los ejecuta ningún workflow.** Entre ellos están `build-palette`, `wall-structure`, `journey-orientation`, `presentation`, `building-presentation` y `render-budget`. Por eso estas regresiones de `master` pasaron sin detectarse. Antes de declarar «producto único verificable», hay que añadir un workflow de regresión que los ejecute (por fragmentos) y un control que falle si aparece un `*.browser.test.cjs` sin workflow.
- **CONFIRMADO / NO BLOQUEANTE · Asset Lab:** es una intermitencia **compartida con `master`** y dependiente de la CPU (acta 07 de #238 §3). Propuesta independiente: limitar la concurrencia de cargas en `View3D`, sin cambiar el límite de 8 s.
- **NO BLOQUEANTE · fallo CRLF de Codex en Windows:** es de entorno. Se evita añadiendo `docs/contracts/assistant-v1/*.json text eol=lf` a `.gitattributes`.

---

## 3. Resumen exigido

| Bloque | Contenido |
|---|---|
| **Conclusiones confirmadas** | Datos Git de la matriz; A en #225/#226/#217 (y #227 sin rescate); labs #193/#194/#191/#205/#196/#197/#204 aislados; entrega solo `opener`; sin importación de presupuesto; alias antiguo; 3 fallos móviles; `studioId` no es identidad; la clasificación A–F de los documentales |
| **Errores detectados** | Estado de #238 desfasado (5e3a2e9 → 6568d8c, CI 25/25, IVA por partida); #166 sobredimensionado (servidor ya en `master`); fallos móviles atribuidos a «controles» y no a un defecto concreto de apilamiento; #71/#86 «con pruebas» cuando sus pruebas de `master` fallan fuera de CI |
| **Omisiones relevantes** | **CORREGIR-1** (presupuesto compartido entre copias importadas, demostrado); **CORREGIR-2** (duplicar o crear variante pierde datos económicos); **39/145 pruebas de navegador fuera de CI**; 6 fallos de guía/recorrido en `master`; puerta `CAT-04` aún en #236 |
| **Cambios de prioridad** | ↑ Contrato de identidad del proyecto (P1, primero); ↑ cobertura de CI de navegador (P1); ↓ #166 a corte pequeño de cliente (P2, opcional); #238 de D a «lista para reauditoría» |
| **PR aprovechables** | #236 (tras C); 2 piezas de cliente + prueba de #166; #238 (para reauditoría); carpeta de documentación de #215 (opcional). El resto: cierre o laboratorio |
| **Duplicaciones a evitar** | Fusionar #225–#227 (revierte correcciones posteriores); la prueba del proveedor de #227 (Bearer); el servidor y el share de #166; #193/#194 como producto (segundo modelo); las pilas #71/#86; MCP Etapa 2 como segundo escritor |
| **Contratos a preservar** | `FloorPlanProjectV1` como único escritor geométrico; `FloorPlanBudgetV1` + `calculateBudget` como único cálculo; IVA propio por partida (F8-C, `draft()`); unidad comercial nunca convertida (XR-01); identidad de catálogo estudio/catálogo/producto/variante; `x-r02a-ceiling`, `x-r03-cabinet`, `x-cat03-catalog-link`; snapshot `FloorPlanDelivery` + `kind=delivery`; GOV-08 S1/S2; Asistente de solo lectura + propuestas con deshacer; **nuevo: un `project.id` por entrada** |
| **Riesgos que bloquean** | CORREGIR-1/2 antes de cualquier piloto; el defecto de «Construir» en móvil si el piloto incluye teléfono; la falta de CI de navegador para declarar «verificado»; el alias sin promover para cualquier estado `available` |
| **Correcciones inmediatas para Codex** | 1) Contrato de identidad y bifurcación (CORREGIR-1/2). 2) Workflow de regresión con los 39 ficheros + control. 3) `z-index`/ocultación de `#nav3dToggle` con el cajón abierto. 4) Reconciliar #236 (puertas CAT-04 y `AI_VERIFIED_AT`). 5) Triage de los 6 fallos de `journey-orientation` (obsoleto o regresión). 6) `.gitattributes` para los esquemas |
| **#238** | **HEAD `6568d8c83c3de8611cdbd3368effcac61c34812d`**, base `master@46174d6`, **Draft**. CI 25/25, Preview READY, artefactos verificados, acta 07. No apta para merge sin GO; modelo real sin probar (piloto #239 sin autorizar) |

Gasto: 0. Ningún proveedor, Redis de pago, Render IA ni Production. No se ha modificado ninguna PR ajena.

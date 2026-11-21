# RUBIK SOTA — Estado maestro tras la consolidación #241 y HOM-04 (#242)

> **ACTUALIZACIÓN OPERATIVA · 21/11/2026, 03:35–03:39 Madrid.** [Corte V5 verificado](../integration/CORTE-OPERATIVO-VERIFICADO-2026-11-21.md). `master@cf0b50128603c6064ce45837e749772ab32df23e` (árbol `2f8d5f21d8fc912a08d7f681f2c1e545f104bd89`), Production Vercel READY del mismo SHA. **#295 Simulator A y #297 R03/idioma integradas**; #298 completó checks de Actions (92 success, 1 skipped) pero espera autorización; #299 sin CI de Actions, #300 en ejecución y #301 con fallo CAT-IA; ninguna de #298–#301 está fusionada. #297 no tiene ejecuciones posfusión del SHA consultado. Las entradas de cortes anteriores más abajo son **históricas**, no prevalecen sobre este estado.

> **Corte 21/11/2026 · R03 + idiomas.** [#297](https://github.com/Juanmaes83/floorplan-3d/pull/297) integrado mediante merge commit `cf0b50128603c6064ce45837e749772ab32df23e`, árbol `2f8d5f21d8fc912a08d7f681f2c1e545f104bd89`. Padres `a6a0494b6f15ed60db542ef6c95530ae3c2c0ca2` y `57b44558295a6dbb89d2bfa4893a8812bf741529`. CI de la PR con 93 aprobados y una omisión prevista. El [despliegue Git de Production](https://vercel.com/juanma-espinosas-projects/floorplan-3d/FtYL4vQ45xRE6Cn2GzQNe2zt1rAd) está READY para el SHA exacto. Alpha y Demo conservan los destinos previos. Chromium comprobó en el alias de master el diálogo de holguras en ES/EN/ZH con un proyecto sintético intacto. La CI posfusión sigue sin acreditar. GitHub Actions devuelve cero ejecuciones para ese SHA y rechazó el lanzamiento dirigido con HTTP 422: «Actions has been disabled for this repository», aunque su API de permisos informa `enabled:true`. Production y la CI de la PR se acreditan por separado.

> **Corte 21/11/2026 · R02-A.** R02-A está publicado en [#298 en borrador](https://github.com/Juanmaes83/floorplan-3d/pull/298), HEAD `f3a6d2314c334ab7964310bfe21efbd59803eee2`, árbol `4bc68adf1c507ffb6e7107293d3e7bef5a965818`, con [Preview READY](https://floorplan-3d-16510z8dr-juanma-espinosas-projects.vercel.app). La fuente de idioma `8a6a1e37` aporta la corrección de caché de #296 una sola vez. El paso libre de 2100 mm es experimental, orientativo y no bloqueante. GOV-05 permanece abierto. La CI remota y la autorización de integración siguen pendientes.

> **Corte 21/11/2026 · Studio E3.** [Studio E3 · Entregables profesionales #299](https://github.com/Juanmaes83/floorplan-3d/pull/299) está en borrador independiente, con [Preview READY](https://floorplan-3d-2f15ks627-juanma-espinosas-projects.vercel.app), HEAD `33aee9dca8b0f826dd0189b4bc79fe4b1f08434e` y árbol `6235e55dc506cdbf5c2d86ec2521b7c69fc6a68c`. Pendientes CI remota, aceptación visual y autorización de integración. El prototipo de firma Blender permanece separado de OP-10.

> **Corte 21/11/2026 · CI y siguiente integración.** La configuración de Actions está habilitada en este repositorio personal y el workflow de comprobación está activo. GitHub rechazó el despacho con HTTP 422 antes de crear una ejecución. El alcance y motivo interno de la deshabilitación quedan pendientes de confirmación por Soporte. Cero ejecuciones para #297 posfusión, #298 y #299. La prioridad se conserva como #298 → #299. [Procedimiento de recuperación](../integration/HANDOFF-MAESTRO-RUBIK-SOTA.md#recuperación-de-github-actions-y-cola-298--299).

> **Corte 20/11/2026 · Simulator A.** [Simulator A #295](https://github.com/Juanmaes83/floorplan-3d/pull/295) se integró en master `a6a0494b6f15ed60db542ef6c95530ae3c2c0ca2`, árbol `1dc7a264692ae6141de6156012978d4934baa567`. CI de PR con 32 aprobados y la omisión prevista de full-regression. [Production READY para el SHA exacto](https://vercel.com/juanma-espinosas-projects/floorplan-3d/Gyz9GuPknX9oaa8XSkyTsj1vo7jv). Seis recursos de Evolución coinciden byte a byte con master por HTTP autenticado. Se conserva la aceptación del propietario para la construcción por hiladas. La verificación posfusión se sigue por SHA en GitHub.

> **Corte 20/11/2026 · OP-11 / F3.** [OP-11 lote 01 #294](https://github.com/Juanmaes83/floorplan-3d/pull/294) integrado en master `9eb7c5f0bffb826fe8789c98d655172befde5da6`, árbol `3af6b5aab9bdde2d24a9b4935332ac43cc106fcd`. CI de PR 93 aprobados y una omisión prevista. [Production READY para el SHA exacto](https://vercel.com/juanma-espinosas-projects/floorplan-3d/47cKosGTbB4vox1F7HwjXk1JnNXC). La CI posfusión se acredita por separado. F3 fija un plazo global de 12 s. El banco original vuelve a entregarse con bytes idénticos bajo 2,5 s de permiso y 6 s de GLB. [Diagnóstico, parche y regresiones](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/codex/evidencia-integracion-20261120/COMPONENTES/EVIDENCIA-INTEGRACION-20261120/CONTINUIDAD-OPERATIVA/SCENE-F3-PRESUPUESTO-20261120).

> **Corte 20/11/2026 · Simulator C/C-bis.** [#293](https://github.com/Juanmaes83/floorplan-3d/pull/293) integrada en `e32c7cd7efddd791b9ff17e7dc8e8309ee19f3d4`, árbol `3a7c9c69d643758d614ac268768dde8aec008b0a`. CI de PR 93 aprobados, una omisión prevista y 30/30 workflows. CI posfusión 6/6. [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/HhqhYWuZRagzzEZrShgeyLPUXZy5). Huellas HTTP de los recursos servidos cotejadas con master. Se conserva la aceptación del propietario. Etiquetas y alcance de navegación en el editor 3D.

> **Corte 20/11/2026 · Simulator E.** [#291](https://github.com/Juanmaes83/floorplan-3d/pull/291) integrada en `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `dec6d20694e083cb615f42eae60bb74fd3209523`. Siete archivos exclusivamente de QA. CI de PR 15 aprobadas y una omisión prevista. CI posfusión 3/3 y [Production READY](https://vercel.com/juanma-espinosas-projects/floorplan-3d/6UsqaQ4HWiob45C8iCDB95F1pCby). Se conservan los 43 contratos CI y el alcance de E en la planta activa. Simulator D conserva su gate WebKit y autorización propia. [Acreditación](../integration/op07-a0-2026-11-20/README.md#simulator-e--291).

> **Corte 20/11/2026 · OP-10.** [#290](https://github.com/Juanmaes83/floorplan-3d/pull/290) quedó integrada en `adb86034d76e7ddd2033fcadf571a4358c5d25e0`, árbol `1393aef8c7f09491f52130d60ae0838b0d2421b3`. CI de la PR con 93 aprobaciones y una omisión prevista. CI posfusión 5/5 y Production READY. La descarga del ZIP se verificó por el recorrido real de Entregar con proyecto sintético. La identidad de la captura queda en `observed-only`. [Evidencia de Production](../integration/op10-evidence/entregar-56f099d/README.md).


> **Corte 20/11/2026 · SMART.** [#288](https://github.com/Juanmaes83/floorplan-3d/pull/288) integró K4, K9, UX-03 y AST-01 en `master@bf131c304391eb393412c12e6fb8c1f94e22a1a3`, árbol `e57089f61dc7a915f316a176280e4c08ebd49057`. GitHub reconoció #280, #281, #285 y #286 como fusionadas por ascendencia. La CI de la PR cerró con 93 aprobaciones y una omisión prevista. El [único relanzamiento](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44704778305/job/136200521011) de `historical (presentation-c)` pasó sobre el mismo HEAD. CI posfusión 7/7, incluidos los [42 contratos CI](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44711628218). [Production](https://vercel.com/juanma-espinosas-projects/floorplan-3d/EFDP9hkCuSwveUmp1Dni5J9RSsWY) READY para ese SHA.


> **Corte 20/11/2026 · Contrato R1.** [#272](https://github.com/Juanmaes83/floorplan-3d/pull/272) lleva a master `a02af9454cedc02c5dd26e92260a339cf10c794a` el árbol autorizado `3bd385bbdff2da91756032919611d41abb6f677f` y los dos documentos del contrato F0.2c R1. La CI de la PR cerró con 17 aprobaciones y una omisión prevista. CI posfusión 3/3. [Production](https://vercel.com/juanma-espinosas-projects/floorplan-3d/GxEbYKa9jMpgWDBLj5ndUqm6oZaV) READY para ese SHA. A0, F0.2c y F0.3 permanecen congelados.


> **Corte 20/11/2026 · K13.** [#287](https://github.com/Juanmaes83/floorplan-3d/pull/287) incorpora ProposalV1 compatible con F0.2b en `master@1daa74604b095e8e3b63d5662a303459e2c93bc1`, árbol `b78190130eb0270827462c0029b1b79846b97ca5`. CI de la PR con 93 aprobados y una omisión prevista. CI posfusión 7/7. El único relanzamiento autorizado cerró [CAT‑IA browser](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44650572153/job/136167916641). El verificador posfusión acredita [42 contratos CI](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44702496176). [Production](https://vercel.com/juanma-espinosas-projects/floorplan-3d/3cWoKf881oARMSHhweydu7LXwFnR) READY para ese SHA.


> **Corte 20/11/2026.** OP-04 quedó integrada en #284, incluyendo #268 por ascendencia. F0.2b #269 quedó integrada en master `0e1a6e0a0eaaa234a40f1940cd9834d0dd7ee1e4`, árbol `be2e5d8b87c3d5b09b973bba63a7d470f7b65045`. Production verificada para ese SHA y CI posfusión 10/10. F0.2b mantiene su origen aislado. [Continuidad y candidatos](https://github.com/Juanmaes83/floorplan-3d/pull/275).

> **Corte 19/11/2026 · OP-02.** [#266](https://github.com/Juanmaes83/floorplan-3d/pull/266) está integrada en `02712b5147c15defa12a810b2f346e4b3e0ecb60`, árbol `eac7605fb6b3f176c803255041aa510396db1d69`. [Production de master](https://vercel.com/juanma-espinosas-projects/floorplan-3d/EidmS69dvUz8rMhYfEACEPeAgfaa) está READY para ese SHA. La CI de la PR registró 91 aprobados y una omisión prevista. La [CI posfusión](https://github.com/Juanmaes83/floorplan-3d/actions?query=branch%3Amaster) se sigue en GitHub. #268 es el siguiente corte.

> **Corte 19/11/2026 · P0 H-1.** [#270](https://github.com/Juanmaes83/floorplan-3d/pull/270) está integrada en `cff21adca2938b147a10a6fc69c43ffd3da0f3bf`, árbol `6192531a11d7c569bffe306e8d5c8b6289167db7`. [Production de master](https://vercel.com/juanma-espinosas-projects/floorplan-3d/BCfqd3uVH23BMFGHNi12cfUFM3yU) está READY para ese SHA. La CI de la PR cerró con 25 checks aprobados y una omisión prevista. [CI posfusión de master](https://github.com/Juanmaes83/floorplan-3d/actions?query=branch%3Amaster) verde en los cinco workflows. F0.2b sigue pendiente de integración y de activación global.

> **Corte 18/11/2026 (reconciliación v1.12, propuesta documental).** Master `163df68e83a80ddf11a008d573ee257d51c1821f` incorpora #259 con el árbol de la candidata autorizada `26c0dbdef94676c188360c4e8869b05c16c3dc23`. Pasaron los siete workflows posteriores a la integración. [Integración #259](https://github.com/Juanmaes83/floorplan-3d/pull/259).
>
> - **Dominios públicos:** Alpha (`floorplan-3d-alpha.vercel.app`) sirve `8525025` con `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`. La Demo compartible (`floorplan-3d-demo.vercel.app`) sirve `7dccf7a` con `dpl_64ndSF5qoDKDtey7XXwEYRAzYDTF`. Ambos tienen destino Production. Los SHA se comprobaron por huella de archivos servidos. Beta 01 está pendiente de identificación.
> - #259 incorporó E2, H01/H02, MCP Etapa 2, VQ-01/F02/F03, Guardar JSON y los controles de Beta IA privada. El histórico de superficies pasó 8/8 en la candidata autorizada. MCP sigue en solo lectura y con escala estimada para la validación digital. La IA privada sigue pendiente de activación.
> - F0 se revisa en orden #262 → #263 → #264. La conexión al editor espera la acreditación de las dependencias. #260 sigue como corte independiente y el motor de CI permanece en observación.
> - **Estado por ID:** desde v1.12 vive en la [matriz de trazabilidad](MATRIZ-TRAZABILIDAD-v1.12.md). Este documento conserva la fotografía de capacidades y despliegue. La estrategia está en el [plan maestro v1.12](PLAN-MAESTRO-RUBIK-SOTA-v1.12.md).
> - **Hallazgo estructural:** la biblioteca de proyectos vive en `localStorage` de cada dominio (`js/project-library.js:7`). La propuesta de continuidad está en el [ADR de persistencia](ADR-PERSISTENCIA-CONTINUIDAD-PROYECTO.md), aprobado conceptualmente por el propietario el 18/11 (D3). F0 está autorizado por etapas; F1, proveedores, identidad, región y cuotas siguen pendientes.
>
> Lo que sigue describe el corte del 17/11 y se conserva sin cambios.

**Corte verificado 17/11/2026:** master `8525025a1470d48d52d8e365070e5a0acf116134`, #243/#244/#245 fusionadas; 11 checks de master correctos. Árbol `5441db02b71407ab03731216054165eee24940c0`, idéntico a #244 `28a01b0`. La evidencia recuperada del Preview aislado acredita 30/30 comprobaciones reales y 7/7 de conservación, sin usar Blob de Production. [Evidencia original](../qa/evidencias-s3-2026-11-17/result.json). Tras autorización expresa del propietario en esta sesión, se promovió `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`; el alias público ya apunta a ese deployment. El anterior `dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs` se conserva como recuperación. S4, S5 y GOV-06a siguen pendientes.

**Fecha:** 17/11/2026 · **Corte funcional auditado:** `40b4ae5d724ef83d0e70651545b4f5e4832becd3`. Primera versión redactada el 16/11 sobre `1296aac` y actualizada el 17/11 tras fusionar #242 y mover la URL pública.

**Consolidación técnica posterior:** `master@403e6b74c95a81e23c17badb276abeca9f8c3fd1` incorpora #245 el 17/11. Su HEAD `bcd9692` superó todas las comprobaciones, incluidos los ocho grupos históricos, en la ejecución [44092050036](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44092050036). Se conservan los mismos 35 archivos históricos y la partición bloqueante. Los ajustes afectan al reparto y a los presupuestos de tiempo de render por CPU. Esta evidencia de CI no sustituye las pruebas funcionales históricas ni amplía el alcance de GOV-08 S3 (#244).

**Corte GOV-08 S3 / ENT-02 (#244):** incorpora caducidad de 7/30/90 días, 30 por defecto, registro del almacén y limpieza manual con simulación previa. Preserva archivos vigentes, históricos e incoherentes, y rechaza listados incompletos o sin confirmación booleana de fin de paginación. Las pruebas locales dirigidas de Codex pasan 56/56 en servidor y 4/4 en navegador. La validación real aislada ya se ejecutó sobre #244: 30/30 más 7/7 de conservación; sus resultados originales están enlazados en la nota de corte. Esta nota describe el alcance del corte y su gate, sin atribuir una prueba contra Production. Siguen pendientes S4, S5 y GOV-06a. No hay Cron ni limpieza automática.

**Qué es este documento.** Es la fotografía **vigente** del producto. Responde a qué está terminado, qué es experimental, qué está simulado o desactivado y qué falta.

**Qué no es.** No es una auditoría nueva, un roadmap nuevo ni una autorización. Ningún estado de este documento autoriza merge, despliegue, gasto ni activación de proveedores.

**Autoridades.**
- **Nombres, IDs y olas:** el [catálogo maestro](rubik-catalogo-maestro-mejoras-2026-11-09.md). La **v1.11 es vigente** tras fusionar #243: 98 códigos, incluido HOM-04. Los seis descartes X-01 a X-06 conservan sus IDs.
- **Estado posterior al 12/11/2026:** este documento.
- **Documentos históricos:** conservan su fecha y su validez. No estaban equivocados: describen un corte anterior.

**Precedencia:** decisión del propietario > código de `master` > PR y actas con SHA > documentos anteriores.

**Clave de evidencia:**
- **[M]** hecho verificado en `master@40b4ae5`: el archivo existe y se carga, o la prueba existe;
- **[H]** evidencia histórica, de un acta o una PR con su SHA;
- **[P]** resultado comunicado por el propietario;
- **[D]** pendiente de decisión.

---

## A. Estado de la versión publicada

| Elemento | Valor |
|---|---|
| `master` | `8525025a1470d48d52d8e365070e5a0acf116134`; evidencias funcionales conservan sus SHA originales |
| Consolidación | [#241](https://github.com/Juanmaes83/floorplan-3d/pull/241), fusionada el 16/11/2026, con HEAD `200b936`. Integra identidad de proyectos, presupuestos independientes, importación de presupuesto, Asistente V3 (#238), HOM-03 (#236), lector y enlace de #166 y las auditorías (#240) |
| HOM-04 | [#242](https://github.com/Juanmaes83/floorplan-3d/pull/242), fusionada el 17/11/2026, con HEAD `5fcb252`. Sección «Descubre RUBIK en acción» en la Home con dos demos guiadas: Evolución 4D (`/evolucion/?demo=obra`) y Dibujo vivo (`/?demo=dibujo-vivo`). Corrige el error de `/evolucion/?lab=1&dossier=K` en Production |
| Despliegue Production | `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`, `8525025`, READY y promovido con autorización expresa el 17/11 |
| **URL pública `floorplan-3d-alpha.vercel.app`** | Alias verificado tras promoción: `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`, SHA `8525025`. Recuperación conservada: `dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs` |
| PR abiertas | 0 al recuperar este corte; #243/#244/#245 fusionadas. La PR documental posterior tiene su propio SHA y CI |

**Capacidades principales comprobadas (navegador real, 17/11):**

| Capacidad | Evidencia |
|---|---|
| Inicio, editor 2D, 3D, presentación y ZIP portable; presupuestos, importación y puertas de seguridad | Aceptación general **17/17** sobre el despliegue Production de `40b4ae5` y **17/17** sobre la URL pública [H: prueba sintética de Claude, 17/11; la misma pasó 17/17 en `1296aac` el 16/11] |
| Demos guiadas HOM-04 | **17/17** en la Preview `5fcb252`, en Production y en la URL pública: Home, Evolución 4D, Dibujo vivo, móviles 390×844 y 844×390, `localStorage` intacto, `labs/` en 404, sin errores ni peticiones a terceros [H: prueba sintética de Claude, 17/11] |
| Identidad de proyectos | La copia importada recibe un id nuevo y registra su origen (`library.origin()`). Pruebas: `tests/project-identity*.cjs` [M] |
| Presupuesto independiente | 99 € en la copia y 11 € en el original, persistentes. Pruebas: `tests/con-03-budget-import.test.cjs` [M] |
| Puertas de seguridad | Asistente generativo cerrado (`503 provider_disabled`). Publicar y revocar sin código, o con un código falso, devuelve `401`. Enlace inexistente: `404` [H, 16/11] |

**Aceptación manual de la entrega, comunicada por el propietario [P]:**
- publicación de visita 3D: **PASS**;
- apertura en incógnito: **PASS**;
- revocación del enlace: **PASS**.

Es una declaración del propietario, **no** una prueba automatizada ejecutada por Claude. No consta en qué URL se hizo. Si se hizo en la URL pública antes del 17/11, corresponde al despliegue del 09/11 y no a la consolidación [D].

**Excepciones de CI conocidas y no bloqueantes:**
- Los cortes históricos por tiempo quedaron corregidos en #245, con `RENDER_TIME_SCALE=3`, ocho grupos y un límite de 1100 × escala segundos por archivo. Todos los grupos pasaron sobre `bcd9692`. Las cancelaciones y fallos de los SHA anteriores conservan su clasificación histórica.
- `assets.browser` falla de forma intermitente con `Loading aborted`.

---

## B. Matriz de capacidades

| Estado | Significado |
|---|---|
| `INTEGRADO_VALIDADO` | Está en `master` y hay pruebas de que funciona |
| `INTEGRADO_EXPERIMENTAL` | Está conectado al producto, con límites profesionales explícitos |
| `SIMULACIÓN` | Muestra la interfaz o el recorrido, pero no presta el servicio real |
| `IMPLEMENTADO_DESACTIVADO` | El código existe, pero sus puertas operativas están cerradas |
| `PARCIAL` | Solo hay integrada una parte del alcance |
| `LABORATORIO` | Trabajo aislado; no se anuncia como función de Production |
| `PENDIENTE` | No desarrollado |
| `BLOQUEADO` | Necesita una decisión, una dependencia, datos, privacidad o autorización |

**«Validado» no significa disponible comercialmente.** Las pruebas son de Chromium con SwiftShader y datos sintéticos, sin dispositivos físicos (GOV-07).

### B.1 Producto base y editor

| Código | Estado | Qué puede usar hoy el usuario | Qué falta | Evidencia | Próxima decisión |
|---|---|---|---|---|---|
| Editor 2D/3D, importación, edificio, presentación, obra FT3D-8 (catálogo §2) | INTEGRADO_VALIDADO | Todo lo de la §2 del catálogo | Hardware real (GOV-07) | [M] `index.html` y sus suites | — |
| Identidad de proyectos (#241) | INTEGRADO_VALIDADO | Copias, variantes e importaciones con un id propio, migración idempotente y solo lectura si falla | No hay un servidor multiestudio | [M] `js/project-library.js`, `tests/project-identity*.cjs` | — |
| Importación de presupuesto CON-03 (#241) | INTEGRADO_VALIDADO | Recuperar el presupuesto de un archivo, con re-direccionamiento explícito | Proyecto y presupuesto siguen siendo dos archivos | [M] `tests/con-03-budget-import.test.cjs` | Paquete único [D] |
| NAV3D Pro V1 (#225 vía #228) | INTEGRADO_VALIDADO | Minimapa en el paseo (UX-22), accesos por estancia (UX-23) y abrir o cerrar todas las puertas (UX-25) | UX-05 (modos, plantas y cortes agrupados) y UX-09 (maqueta blanca) avanzan dentro del panel NAV3D, pero sin pruebas con su ID; falta el móvil físico | [M] `js/nav3d-*`, `tests/nav3d*.cjs` | — |
| UX-07 «Comparar con el original» (#221) | INTEGRADO_VALIDADO | Comparador de solo lectura desde Variantes | No describe los cambios del interior de un armario R03 | [M] `js/revision-compare-core.js` cargado | — |
| ENT-04 Dossier antes/después con presupuesto rotulado | PARCIAL | Comparación y dossier accesibles en `comparar/`, desde Variantes; usa presupuestos guardados | Evolución editorial y experiencia profesional coordinadas con Studio Presentation; E2 necesita autorización específica | [M] `comparar/index.html`, `comparar/comparar.js`, núcleos de dossier y revisión | Coordinar evolución, no reconstruir [D] |
| UX-08 Cotas en vivo (#224) | INTEGRADO_VALIDADO | Cotas al mover muebles, compatibles con R02-A y R03 | — | [M] `js/live-dimensions-*`, `tests/ux08-*` | — |
| UX-12/UX-13 Amueblar por estancia y recetas (#226 vía #228) | INTEGRADO_EXPERIMENTAL | Propuesta reproducible por semilla y densidad, con recetas, que solo se aplica tras confirmarla | Biblioteca con licencias (BIB-01); aceptación visual | [M] `js/smart-furnishing-*`, `tests/smart-furnishing*` | — |
| MUE-01 «Trae tu mueble» (#227 vía #228) | INTEGRADO_VALIDADO | Foto y medidas convertidas en un volumen genérico; la foto queda solo como referencia | Reconstrucción 3D (MUE-02, ola 5) | [M] `tests/photo-project*.cjs` (MUE-01) | — |
| OBR-01 Pendientes de FT3D-8 (#207) | INTEGRADO_VALIDADO | EX-05.3, EX-11-k.6, QA-22 y EX-09.10 cerrados | — | [H] `docs/qa/obr01-ft3d8-2026-11-12/README.md` | — |
| HOM-04 Demostraciones guiadas en la Home (#242) | INTEGRADO_VALIDADO | Desde la Home, sin cuenta: Evolución 4D con la vivienda de ejemplo como obra nueva (10 tareas, fechas ilustrativas, **sin importes**) y Dibujo vivo con la presentación existente. No leen ni cambian los proyectos del visitante | Revisión visual humana final. La demo 4D no representa la cubierta | [M] `js/construction-demo-core.js`, `js/home-demos.js`, `evolucion/demo-ui.js`, `tests/evolution-demo.browser.test.cjs`, `tests/home-demos.browser.test.cjs` | — |
| OBR-02/03 Fantasma de la tarea y % del plan (#219) | INTEGRADO_VALIDADO | En «Evolución», solo con un plan de la misma revisión | — | [M] `evolucion/plan-preview-ui.js`, `tests/obr02-obr03-*` | — |
| GOV-07 Resiliencia WebGL (#208/#213) | PARCIAL | Degradación controlada y pérdida de contexto en la Evolución | Matriz física iOS, Android y GPU | [M] `tests/gov07-*` | Banco de dispositivos [D] |

### B.2 Entrega al cliente y seguridad

| Código | Estado | Qué puede usar hoy el usuario | Qué falta | Evidencia | Próxima decisión |
|---|---|---|---|---|---|
| GOV-08 S1 + S2 + S3 + aislamiento (#187, #188, #195, #244) | INTEGRADO_VALIDADO en este alcance | Permiso propio, retirada, visor aislado, caducidad 7/30/90 y limpieza manual con simulación y protección de vigentes/históricos | S4 cuotas, S5 almacenamiento privado/enlaces opacos y GOV-06a; Blob público mantiene acceso directo hasta retirada | [M] #244 y evidencia aislada 30/30 + 7/7 | S4/S5 y GOV-06a [D] |
| ENT-01 Visita 3D (#189, #200, #201 y #241, lector y enlace de #166) | INTEGRADO_VALIDADO, alcance mínimo | Revisar como cliente, publicar, abrir en otra sesión revocar y caducar con respuesta 410 | Varias plantas y experiencia compartida | [M] `js/client-delivery-core.js`, `api/delivery.js`, `tests/delivery-3d-link.browser.test.cjs`; caducidad real aislada en #244 [M]; aceptación manual histórica [P] | Ampliación [D] |
| ENT-02 Ciclo de vida del enlace | PARCIAL, S3 implementado | Revocación, caducidad y limpieza manual con simulación | S4/S5 y GOV-06a; automatización no autorizada, sin Cron | [M] #244, protocolo 30/30 y conservación 7/7 | Futuros alcances [D] |
| GOV-05 Legal y privacidad | BLOQUEADO | — | Profesional jurídico externo | [H] #161 | Contratar [D] |

### B.3 IA, imágenes y catálogos

Los estados de la Home salen de `js/capability-registry.js`. Sus sellos (`VERIFIED_AT` y `AI_VERIFIED_AT`) se actualizaron el 17/11 a `40b4ae5`: los módulos y los 40 tests que cita existen en ese corte y pasaron (CI de #242 sobre el árbol idéntico `5fcb252` y tests puros en local, 119/119). Sus servicios IA definen «available» como «acreditado en Production». En Render IA hay que distinguir dos evidencias:
- **Acreditación real**, con imagen generada: la D1 del 09/11.
- **Comprobación sin gasto** del 17/11 sobre el despliegue público actual: 401 sin código y `RUBIK_RENDER_ENABLED=1`. Solo confirma que el servicio sigue cerrado sin código y activado; no genera imagen.

El campo `production` del registro guarda la comprobación del 17/11 y remite a la D1 del 09/11 como acreditación real.

| Código | Estado | Qué puede usar hoy el usuario | Qué falta | Evidencia | Próxima decisión |
|---|---|---|---|---|---|
| Render IA D1 (GOV-01a/b/c, IMG-01, IMG-02) | INTEGRADO_VALIDADO, de pago y operativo | Render con listas cerradas, código de acceso y límites por instancia | Tope global (IMG-04) y cuotas por profesional (GOV-06a) | **Acreditación real** (genera imagen): [H] [acta D1 del 09/11](../render-ai/d1-acta-de-cierre-2026-11-09.md). **Comprobación sin gasto del 17/11** sobre el despliegue público `dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs`: `POST /api/render` sin código responde `401`, sin llamar al proveedor, y `RUBIK_RENDER_ENABLED=1` consta en los metadatos [M]. La comprobación del 17/11 **no genera imagen ni sustituye** la acreditación del 09/11. Registro `render-ai: available` [M] | — |
| HOM-03 «Nuevos servicios IA» (#236 vía #241) | INTEGRADO_VALIDADO | Cuatro estados honestos: render disponible; asistente, catálogos y fichas en piloto; estudio de imágenes y reforma por foto en simulación; IA conversacional y foto real en preparación | — (la URL pública lo muestra y su sello se actualizó el 17/11) | [M] `js/capability-registry.js`, `tests/welcome-ai-services.browser.test.cjs` | — |
| CAT-02 «Mis catálogos» (fichas, SKU y medidas; #230 vía #234) | INTEGRADO_EXPERIMENTAL, piloto | Catálogo propio por estudio local | Identidad de estudio autenticada (GOV-06a) y licencias (K11) | [M] `js/catalog-ui.js`, `js/catalog-product-core.js` | — |
| CAT-03 SKU → objeto 3D validado o volumen genérico → partidas (#233 vía #234) | PARCIAL, piloto | Colocar y presupuestar en C1–C4 sin editarlo | Productos 3D validados a escala comercial | [M] `js/catalog-placement-*`, `tests/catalog-placement*` | — |
| «CAT-04» (nombre de trabajo; avance parcial de CAT-03) catálogo → Presupuestar → Asistente (#237) | INTEGRADO_VALIDADO, piloto | La misma partida C1–C4, IVA por partida y revisión del precio | Reabrirlo en un proyecto real | [M] `js/catalog-budget-core.js`, `js/cat04-ui.js`, `tests/cat04*` | — (catálogo v1.11: no es un ID propio) |
| CAT-01 Referencias del catálogo en el render; IMG-10, IMG-14 e IMG-15 (fidelidad, zona y referencias; #232 vía #234) | SIMULACIÓN | «Estudio de imágenes» rotulado como simulación local; la generación real está bloqueada | Proveedor, gasto (IMG-04, ECO-01) y GOV-05 | [M] `tests/visual-studio.browser.test.cjs`; registro `visual-studio: simulation` | Gate de gasto [D] |
| FOT-01 Reforma sobre foto (#227, #231) | SIMULACIÓN | Validaciones y simulación rotulada, solo con consentimiento | Proveedor real: `api/photo-reform.js` está cerrado por defecto y no hay ningún proveedor activo | [M] `tests/photo-reform-*`, `tests/photo-project*.cjs` (FOT-01) | Gate de gasto [D] |
| ECO-01 Medición de coste (#190) | PARCIAL | Nada en la interfaz | Medición real y aceptación por imagen | [M] `js/render-cost-core.js` (no cargado) | — |
| IMG-03 a IMG-09, IMG-11 a IMG-13, IMG-16, IMG-22, CAM-01, BIB-01 | Sin cambios desde el v1.10 | Lo del Render IA D1 | Lo que dice el catálogo | [H] catálogo §3.D | — |

---

## C. Asistente RUBIK

**El Asistente no está completo.**
- La consulta guiada **sin LLM** funciona: `INTEGRADO_VALIDADO`, en piloto.
- La conversación generativa está **implementada pero desactivada**: `IMPLEMENTADO_DESACTIVADO`.
- **No** se puede declarar «Asistente generativo completo» ni «IA conversacional real disponible» hasta superar los controles pendientes y una prueba C autorizada.

| Línea | Estado | Detalle |
|---|---|---|
| **V2: consulta guiada sin LLM** (AG-1) | INTEGRADO_VALIDADO | Usa **7 de las 12 herramientas de dominio** del núcleo, con procedencia (motor, estado y revisión) en ES, EN y ZH: 4 de AG-1 y 3 de catálogo de CAT-04. Si el presupuesto está incompleto no da total. Desglose verificado después de la tabla. [M] `js/assistant-session-core.js`, `js/assistant-domain-tools-core.js`, `js/assistant-intents-core.js` |
| **V2: propuestas tipadas** (AG-2) | INTEGRADO_VALIDADO, 2 operaciones | `set_room_floor_material` y `move_object`, con un diff legible y sin escribir nada. [M] `js/assistant-proposals-core.js` |
| **V2: aplicar, confirmar y deshacer** (AG-3) | INTEGRADO_VALIDADO, solo local | Un paso del editor, revalidado contra la revisión actual. No se puede aplicar en remoto porque no hay sesiones. [H] [acta AG-0…AG-5](assistant-ai-v2/acta-ag0-ag5-2026-11-14.md) |
| **V2: contratos y perímetro** (AG-0) | PARCIAL | Faltan sesiones, tenant, roles, cuotas durables y CSRF (GOV-06a) |
| **V3: agente y pasarela** (#238 vía #241) | IMPLEMENTADO_DESACTIVADO | `js/assistant-agent-core.js` y `js/assistant-gen-ui.js` se cargan. `api/assistant.js` responde `503 provider_disabled`: `RUBIK_ASSISTANT_ENABLED` no está activado y Production exige además `RUBIK_ASSISTANT_ALLOW_PRODUCTION` [M] |
| **V3: herramientas** de proyecto, catálogos y presupuesto | IMPLEMENTADO_DESACTIVADO | Con cifras comprobadas por oráculos. Pruebas: `tests/assistant-agent-core.test.cjs`, `tests/assistant-gen-cat04*` [M] |
| **V3: consentimiento e historial aislados** por estudio y proyecto | IMPLEMENTADO_DESACTIVADO, probado con un doble | La fuga entre ámbitos se demostró y se corrigió. [H] [acta de validación V3](assistant-ai-v3/05-acta-validacion.md) |
| **V3: privacidad y gasto** | Probados con simuladores | Ocultación honesta de correos, teléfonos y enlaces, pero no de nombres. Libro de gasto atómico (`api/_spend-ledger.js`), probado sobre un Redis real local y en CI |
| **V3: proveedor generativo real** | DESACTIVADO | Ningún proveedor está configurado y el gasto es 0 |
| **Prueba C** (30 preguntas, 33 turnos) | PENDIENTE de GO | Arnés validado con simuladores: la referencia pasa 30/30 y el simulador defectuoso se detecta en 30/30. **No se ha ejecutado con un modelo real.** [H] [propuesta](assistant-ai-v3/06-propuesta-prueba-c.md) |
| GOV-06a: identidad, sesiones, roles y cuotas | BLOQUEADO | Es condición para Production |
| Libro común con Render IA | PENDIENTE | `api/render.js` aún no anota en el libro: necesita una PR aparte |
| AG-4 Orquestar lo visual | PARCIAL | Prepara el render sin gasto y lleva a la entrada existente. Falta el lote con coste previo (IMG-04) |
| AG-5 Capacidades avanzadas | BLOQUEADO | Foto → mueble 3D y generar u optimizar distribuciones dependen de MUE-02, GEN-01, el proveedor y GOV-05 |

**Herramientas de dominio del Asistente (verificado el 17/11/2026 en el código de `master`):**

`js/assistant-domain-tools-core.js` declara **12 herramientas de solo lectura**. Hay que distinguir dónde se usan y qué las prueba:
- **Origen:** 9 se crearon con AG-1 (14/11) y 3 de catálogo las añadió CAT-04 (`3b64982`, 15/11).
- **Uso:** la consulta guiada V2 (`js/assistant-session-core.js`, sin modelo de lenguaje) llama solo a 7. Las otras 5 solo se ofrecen al agente V3, que está **desactivado**.

| Herramienta | Origen | La usa la consulta guiada V2 | Pruebas |
|---|---|---|---|
| `get_project_summary` | AG-1 | Sí (nº de estancias, datos que faltan, superficie total) | `assistant-ai-v2`, `assistant-agent-core` |
| `get_room` | AG-1 | Sí (superficie de una estancia) | `assistant-ai-v2`, con oráculo de Gauss |
| `get_layout_review` | AG-1 | Sí (conflictos de distribución) | `assistant-ai-v2` |
| `get_budget_summary` | AG-1 | Sí (coste, detalle de presupuesto) | `assistant-ai-v2`, con oráculo C1–C4; `cat04-f1f2` |
| `list_catalog_products` | CAT-04 | Sí («Mis catálogos») | `cat04-assistant` |
| `get_placed_products` | CAT-04 | Sí (productos colocados y su coste) | `cat04-assistant`, `cat04-f1f2`, `assistant-gen-cat04-economics` |
| `get_visual_references` | CAT-04 | Sí (referencias visuales) | `cat04-assistant` |
| `list_capabilities` | AG-1 | No: ninguna consulta V2 la llama (sí aparece en la lista de capacidades y en V3) | `assistant-ai-v2` (lista blanca) |
| `list_rooms` | AG-1 | No (solo V3, desactivado) | `assistant-agent-core` y `assistant-gen`, con proveedor simulado |
| `get_quantities` | AG-1 | No (solo V3, desactivado) | **Ninguna prueba propia** |
| `list_materials` | AG-1 | No (solo V3, desactivado) | **Ninguna prueba propia** |
| `list_objects` | AG-1 | No (solo V3, desactivado) | **Ninguna prueba propia** |

Por tanto, la cifra correcta para la V2 es **7 herramientas expuestas y verificadas** de 12 implementadas. Antes de exponer a usuarios `get_quantities`, `list_materials` y `list_objects`, hacen falta pruebas propias.

---

## D. Piedras SCULPT

**Solo hay tres piedras: R01, R02-A y R03. No existe R04.** Las demás referencias de donantes son investigación del [anexo SCULPT](sculpt-metodologia-y-cartera-2026-11-10.md), no piedras aprobadas.

| Piedra | Estado | Qué hay | Límites | Decisiones pendientes |
|---|---|---|---|---|
| **R01** Reconocimiento de planos | LABORATORIO | [#191](https://github.com/Juanmaes83/floorplan-3d/pull/191) y [#205](https://github.com/Juanmaes83/floorplan-3d/pull/205), no integrados; archivados el 17/11 con sus ramas conservadas | **No anunciar como conversión fiable de planos** | Validación F2 con planos reales autorizados (cinco sesiones y 20 planos), OCR, escala, permisos GOV-05 y encaje en G-01/G-06 [D] |
| **R02-A** Techos y elementos altos | INTEGRADO_EXPERIMENTAL | [#223](https://github.com/Juanmaes83/floorplan-3d/pull/223): núcleo, sesión, contrato candidato `x-r02a-ceiling`, referencias verticales y editor conectados; un solo paso de deshacer; sin tocar el esquema canónico [M] `js/r02a-ceiling-*` | No es diseño de instalaciones (MEP), luminotecnia, normativa ni certificación, y **no comprueba la altura de paso**. Los laboratorios #193 y #203 conservan evidencia | Ratificar el contrato definitivo y la referencia vertical, validación profesional, ID funcional y R02-B, que no se ha iniciado [D] |
| **R03** Armarios paramétricos | INTEGRADO_EXPERIMENTAL | [#222](https://github.com/Juanmaes83/floorplan-3d/pull/222): «Interior del armario…» en el editor, persistencia en `x-r03-cabinet`, deshacer, duplicar y borrar sin huérfanos, armario exacto en el 3D [M] `js/r03-cabinet-*` | Medidas supuestas: no es fabricación, presupuesto automático ni CAT-03 comercial. El interior no viaja en la entrega al cliente | Aceptación visual, validación profesional y el riesgo residual GOV-05 [D] |

---

## E. Olas 0–5

Mantienen la numeración y los IDs del catálogo: 98 códigos en la v1.11 vigente tras #243 (v1.10 histórica: 97, más HOM-04), repartidos 10 / 9 / 28 / 22 / 14 / 15. **Ninguna ola está completa.**

| Ola | Objetivo | Avances desde el v1.10 (12/11) | Pendientes principales | Dependencias | Siguiente corte razonable |
|---|---|---|---|---|---|
| **0** Cerrar y ordenar | Terminar lo empezado | GOV-02: se pasó de 62 PR abiertas a **0** al corte de recuperación, con #243/#244/#245 fusionadas (las 21 históricas se archivaron el 17/11: [archivo de las 21 PR](../auditorias/archivo-21-pr-2026-11-17.md)). GOV-03 se amplió con HOM-03 y sus sellos se actualizaron el 17/11 a `40b4ae5`. GOV-04: auditorías en `master` (#192 y #241); catálogo v1.11 vigente tras #243 | GOV-03: registro global de capacidades | — | — |
| **1** Vender lo que ya existe | Entregar al cliente con seguridad | GOV-08 S1/S2/S3/aislamiento y caducidad ENT-02 implementada, ENT-01 de alcance mínimo, OBR-01 cerrado, GOV-07 de software y **HOM-04** (demos guiadas en la Home, en Production desde el 17/11) | GOV-08 S4/S5, GOV-05 legal y GOV-07 con dispositivos físicos | GOV-05 (externo) y GOV-06a | CI inteligente; futuros S4/S5 según autorización |
| **2** Mejoras rápidas y medición | Experiencia y coste por imagen | UX-07, UX-08, NAV3D (UX-22, UX-23 y UX-25, más avance de UX-05 y UX-09), OBR-02/03 y HOM-03 integrados. ECO-01 como núcleo puro. ENT-04 parcial accesible en comparar/ | Evolución editorial de ENT-04, IMG-03 a IMG-12, CAM-01, BIB-01, ENT-03, UX-03/04, cerrar UX-05/09, G-06, GOV-06a e IMG-04 | ECO-01 real antes de los cortes de imagen | ENT-04 coordinado con Studio Presentation |
| **3** Servicios cobrables | Diferenciación comercial | UX-12/13 experimental, MUE-01 integrado, FOT-01 y CAT-01 en simulación, y AG-0 parcial (V2) | FOT-01 real, CAT-01 real, ENT-05/06, IMG-09/13/15/16/22, PRE-01, UX-11, UX-24, AST-01, ECO-02/03 y PER-01 | GOV-05, ECO-01, IMG-04 y presupuesto de prueba | ECO-01 real con IMG-04 |
| **4** Interoperabilidad y asistente | Confianza y productividad | AG-1 y AG-2 validados sin LLM. CAT-02 en piloto. IMG-14 en simulación | G-01, G-02, G-08, PER-02/03, PAN-01, UX-10/21/26, OBR-05 y AG-1 con LLM | GOV-06a y prueba C | Prueba C, solo con GO de gasto |
| **5** Investigación y escala | Solo con decisión expresa | AG-3 local validado (V2). CAT-03 parcial en piloto. AG-4 parcial | AG-5, FOT-02, MUE-02, PAN-02, VID-02, GEN-01, UX-14, LUZ-01, G-04, G-07, ENT-07 y GOV-06b | Decisión y presupuesto | — |

**Nota de olas.** AG-3 y CAT-03 son códigos de la ola 5 que ya tienen avances parciales. Eso no cambia su ola ni completa la ola 5.

---

## F. MCP y otras líneas pendientes

**MCP:**
- **Etapa 1:** integrada, con ocho herramientas de lectura en `tools/rubik-mcp` [M]. No está validada con proyectos reales a escala.
- **Etapa 2** (`propose_layout`): LABORATORIO en [#196](https://github.com/Juanmaes83/floorplan-3d/pull/196), [#197](https://github.com/Juanmaes83/floorplan-3d/pull/197) y [#204](https://github.com/Juanmaes83/floorplan-3d/pull/204), archivadas el 17/11 con sus ramas conservadas. **No está en `master`.** Retomarla exige validarla con un proyecto autorizado.
- **Etapas 3 y 4:** ni implementadas ni aprobadas.

**Otras líneas:**
- **[#166](https://github.com/Juanmaes83/floorplan-3d/pull/166):** PARCIAL. Solo se portaron el lector y el enlace; de sus 78 archivos, 2 coinciden con `master`. **Su rama antigua no se fusiona** (PR archivada el 17/11).
- **Calidad visual y familias residenciales:** LABORATORIO en [#165](https://github.com/Juanmaes83/floorplan-3d/pull/165), [#167](https://github.com/Juanmaes83/floorplan-3d/pull/167) y [#169](https://github.com/Juanmaes83/floorplan-3d/pull/169), archivadas el 17/11; retomarlas exige aceptación visual y licencias.
- **Vídeo, imágenes y funciones generativas avanzadas** (vídeo de recorrido generativo VID-02, imágenes reales desde foto FOT-01 real y PAN-01/02): sujetos a sus gates de gasto, legales y de proveedor.
- **Identidad multiestudio y permisos (GOV-06a):** dependencia transversal de catálogos, Asistente, Render y GOV-08.

**Archivo de PR (17/11/2026).** Por decisión del propietario, las 21 PR que quedaban abiertas se cerraron sin fusionar y **sin borrar ninguna rama**: 9 de documentación histórica, 4 ya sustituidas en `master` (#166, #193, #194 y #215) y 8 laboratorios sin validar. Qué contiene cada una y qué haría falta para retomarla: [archivo de las 21 PR](../auditorias/archivo-21-pr-2026-11-17.md). #161 se conserva como material de partida para GOV-05.

---

## G. Próximos cortes recomendados

Máximo cinco, ordenados por valor profesional, dependencias reales, riesgo, coste y facilidad de validación. **Son propuestas, no autorizaciones.**

**Decisión previa ya resuelta:** el 17/11 el propietario autorizó mover `floorplan-3d-alpha.vercel.app`; el público sirve `8525025`, promoción posterior autorizada y comprobada.

1. **CI inteligente:** implantar selector conservador, primero en observación, con gate estable, inventario, medición y rollback. Encargo técnico autorizado; sin omisiones hasta acreditar cobertura.
2. **ENT-04 / Studio Presentation:** evolución coordinada del dossier existente en comparar/. No integra automáticamente el laboratorio de Claude; E2 requiere autorización específica.
3. **ECO-01 real con IMG-04:** medición y confirmación de gasto antes de generar. Es condición para FOT-01 y CAT-01 reales.
4. **GOV-06a mínimo:** identidad y cuotas por profesional. Desbloquea el Asistente con LLM, catálogos multiestudio y GOV-08 por profesional. Valor y riesgo altos.
5. **Prueba C del Asistente en Preview**, solo con GO de gasto y tope fijado. Es el único camino para decidir si el modo generativo merece llegar a Production.

---

## H. Fuentes y trazabilidad

**Hechos verificados en `master@40b4ae5` [M]:**
- `index.html`, que carga los módulos de §B;
- `js/capability-registry.js`, `js/project-library.js`, `api/assistant.js`, `api/_share-auth.js` y `api/delivery.js`;
- `js/construction-demo-core.js`, `js/home-demos.js` y `evolucion/demo-ui.js`;
- `js/r02a-ceiling-*`, `js/r03-cabinet-*`, `js/nav3d-*`, `js/smart-furnishing-*`, `js/catalog-*` y `js/cat04-ui.js`;
- los tests citados en cada fila.

**Evidencia histórica [H]:**
- [catálogo](rubik-catalogo-maestro-mejoras-2026-11-09.md): v1.11 vigente tras #243; v1.10 histórica;
- [archivo de las 21 PR](../auditorias/archivo-21-pr-2026-11-17.md);
- [estado de piedras y olas del 12/11](../qa/rubik-estado-unico-piedras-olas-2026-11-12.md);
- [ROADMAP](../ROADMAP.md);
- [acta AG-0…AG-5](assistant-ai-v2/acta-ag0-ag5-2026-11-14.md);
- [diseño V3](assistant-ai-v3/01-diseno-asistente-generativo.md), [validación V3](assistant-ai-v3/05-acta-validacion.md) y [prueba C](assistant-ai-v3/06-propuesta-prueba-c.md);
- [R03-I1](../technical/r03-activation-i1-20261113.md) y [R02-A](../technical/r02a-integracion-editor-2026-11-13.md);
- [resumen de la consolidación](../auditorias/consolidacion-2026-11-16/01-RESUMEN-EJECUTIVO.md) y [matriz de 29 PR](../auditorias/consolidacion-2026-11-16/MATRIZ-29-PR.md).

**PR de cada integración:**

| PR | Integra |
|---|---|
| #187, #188, #195 | GOV-08 |
| #189, #200, #201 | ENT-01 |
| #190 | ECO-01 |
| #207 | OBR-01 |
| #208, #213 | GOV-07 |
| #209, #218, #221 | UX-07 y ENT-04 |
| #219 | OBR-02/03 |
| #222 | R03 |
| #223 | R02-A |
| #224 | UX-08 |
| #228 | NAV3D, UX-12/13, FOT-01 y MUE-01 |
| #234 | V2 y CAT-IA |
| #237 | CAT-04 |
| #241 | Consolidación |
| #242 | HOM-04: demostraciones guiadas en la Home |

**Comunicado por el propietario [P]:** aceptación manual de la entrega (publicar, abrir en incógnito y revocar: PASS).

**Pendiente de decisión [D]:**
- origen de la aceptación manual;
- evolución coordinada de ENT-04 y autorización específica E2 de Studio Presentation;
- GOV-08 S4/S5; retirada autorizada de variables temporales de Preview;
- prueba C y su gasto;
- GOV-05 y GOV-06a;
- contrato definitivo de R02-A;
- aceptación visual de R03;
- «CON-03» (importación de presupuesto): código de trabajo, sin ID en el catálogo.

**Contradicciones abiertas:**
- La numeración de ramas de CAT-IA (#230 dice «CAT-02 Mis catálogos») no coincide exactamente con el catálogo. Este documento usa el significado del catálogo (CAT-01 referencias, CAT-02 fichas y SKU, CAT-03 productos 3D y partidas). **Resuelto en la v1.11 vigente tras #243 para «CAT-04»:** es un nombre de trabajo y un avance parcial de CAT-03, sin ID propio. «CON-03» sigue como código de trabajo, pendiente de decisión.
- **Resuelto el 17/11:** los sellos de `js/capability-registry.js` apuntan a `40b4ae5`, el corte que sirve la URL pública.
- **Resuelto en la v1.11 vigente tras #243:** HOM-04 se da de alta en el catálogo (ola 1, hecho y en Production desde el 17/11).

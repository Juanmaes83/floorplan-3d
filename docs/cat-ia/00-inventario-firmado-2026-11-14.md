# CAT-IA + FOT Visual V2 · Inventario firmado de reutilización (CAT-G0)

**Base:** `master@c91d12d1d76c71541c3accb3779f9d95519c2725` (fusión de #228 `136f98c…`; árbol idéntico al auditado). Production `dpl_9t4hGSxDyJQPKyFeHFzBHcU9Bc1h` READY sobre ese SHA, comprobado en solo lectura el 2026-11-14 a las 13:41 UTC.
**Rama:** `feat/cat-ia-fot-visual-v2-20261114`, propia de Claude Code 2 e independiente del Asistente de Claude Code 1.
**Encargo:** `RUBIK_COLA_02_CAT_IA_FOT_VISUAL_V2_AUDITADO.md`, gate superado.

**Fuentes leídas completas:**
- `docs/rubik-evolution-preparation-2026-11-04@7ee4243`:
  - `cat-ia-catalogos-comerciales-personalizacion-fabricante-2026-11-05.md` §0–10;
  - `ia-servicios-foto-reforma-…` §1–3;
  - `ia-imagenes-asistente-plan-maestro-…` §3 y §6;
  - `ia-costes-protocolo-unitario-lotes-…`;
  - `ia-costes-pruebas-registro-….csv`.
- `master:docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md`.

**Estado de gasto: 0 peticiones a proveedores de imagen. STOP_GASTO** hasta tener un tope monetario aprobado por el propietario y aplicable técnicamente (§5).

## 1. Identificadores canónicos

- `CAT-01 = CAT-IA-1` (referencias visuales).
- `CAT-02 = CAT-IA-2` (catálogo comercial versionado).
- `CAT-03 = CAT-IA-3` (SKU → 3D → presupuesto).
- `FOT-01` (reforma sobre foto) es distinto de `FOT-02` (foto → geometría, fuera de alcance).
- Relacionados: IMG-03/04/05/06/07/08/10/12/13/14/15/16, ENT-05/06, ECO-01, GOV-05/06a/08, BIB-01.
- No se crean IDs nuevos por alias.

## 2. Inventario: ID / módulo / rama y SHA / ¿en master? / restricciones / delta real / decisión

| ID | Módulo existente | Rama · SHA del último cambio | ¿En master? | Restricciones verificadas en el código | Delta real para V2 | Decisión |
|---|---|---|---|---|---|---|
| B2/B8 · IMG-01/02 | `api/render.js` (136 l.), `js/ai-render-ui.js` (80 l.) | master · `7ac9b34` / `aad6d75` | Sí | Solo **vistas 3D de RUBIK**. `RUBIK_RENDER_ENABLED='1'` obligatorio. **Código compartido** `RUBIK_RENDER_TOKEN` que el navegador guarda en `localStorage`. Límites por hora y día **en memoria de una instancia** (freno, no tope global). Prompt fijo de servidor y listas cerradas. | Fuente A de CAT-01 (vista 3D). No sirve para fotos de cliente. | **REUSAR solo para vistas 3D**, sin editarlo (fichero compartido con CC1). **NO REUSAR** para fotos. |
| ECO-01 | `js/render-cost-core.js` (163 l.), `tests/render-cost-core.test.cjs` | master · `e5ae753` (PR #190, squash). Rama `feat/eco01-render-cost-core@fe41b17`: contenido idéntico (diff vacío). | Sí | Núcleo puro de medición. No es telemetría de extremo a extremo ni factura. | Preflight de coste para CAT-01 y FOT-01, con tarifa fechada como **entrada**, nunca constante. | **REUSAR** (no clonar). La rama ECO-01 es histórica. |
| FOT-01 (simulado) | `js/photo-reform-core.js` (107 l.), `js/photo-reform-ui.js` (196 l.) | master · `136f98c` (#227 vía #228) | Sí | Simulación rotulada, consentimiento, puerta real cerrada, 1–3 alternativas, cancelación, descarte, registro de la sesión sin imagen y proyecto intacto. | Faltan controles reales conservar/cambiar, máscaras o zonas revisables, intensidad Fiel/Equilibrado/Creativo, vínculo con CAT-01, revisión de fidelidad y ficha. | **ADAPTAR**: ampliar sin romper el contrato de la sesión ni las pruebas existentes. |
| FOT-01 (proveedor) | `js/photo-reform-provider.js` (86 l.) | master · `136f98c` | Sí (inactivo) | **Defecto de diseño:** `httpAdapter` envía `authorization: Bearer <token>` **desde el navegador**. Hoy no se instancia (`config().configured === false`). | Debe hablar con un **servidor propio `photo-reform/1`**, sin secretos en el cliente. | **ADAPTAR**: conservar `validateResponse` y la interfaz de adaptador; **NO REUSAR** el token en el navegador. |
| MUE-01 | `js/own-furniture-core.js` (128 l.), `js/own-furniture-ui.js` | master · `136f98c` | Sí | Volumen genérico con medidas; foto solo local (IndexedDB). Extensión `x-mue01-furniture-photo`. | Fallback rotulado de CAT-03 cuando no hay GLB apto. | **REUSAR** (sin cambios). |
| Activos 3D | `js/asset-catalog.js` (31 l.), `js/asset-loader.mjs` (116 l.), `js/asset-ui.js` (56 l.) | master · `96b44ee` | Sí | `adapt()` solo acepta los catálogos `rubik-sota-local` (permiso comercial propio: comercial, redistribución, streaming, modificación, mundial, marca propia) e `immersphere-asset-lab` (autorización del propietario **solo `local-app-git-and-review-preview`**, marca de terceros sin afiliación). Exige GLB sin extensiones, SHA-256, glTF Transform 4.3.0 con SHA de entrada y salida, medidas reales del modelo, normalización y `qaStatus: approved`. | CAT-03 necesita un catálogo de fixtures propios con las **mismas** exigencias, validadas para el uso objetivo. | **ADAPTAR** de forma compatible: un catálogo nuevo con permiso propio, sin relajar ninguna regla. |
| Activos F3 | `assets/f3/*` | master | Sí | `synthetic-bench.glb` con licencia MIT **solo para ese archivo** (original propio). Los GLB IKEA son **demo** con alcance «local-app-git-and-review-preview»; no hay licencia comercial ni afiliación. | El mueble de CAT-03 puede partir del banco sintético. **No existe electrodoméstico GLB apto.** | Banco sintético: **REUSAR**. IKEA: **NO REUSAR** para fichas comerciales ni entregas. Electrodoméstico: fixture propio nuevo o **CAT-G5 parcial** con volumen genérico rotulado. |
| Familias | `js/generic-catalog.js`, `js/furniture-search.js` | master · `96b44ee` | Sí | Familias y medidas genéricas. Sin SKU ni marca. | Mapear `CatalogProductV1.family` a estas familias. | **REUSAR**. |
| Superficies | `js/surface-catalog.js`, `assets/materials/catalog.json`, `assets/materials/licenses/` | master | Sí | Muestras con licencia y procedencia validadas. `partial: true`. | Referencias de material en CAT-01 y CAT-02 (fixtures con licencia registrada). | **REUSAR**. |
| Mi estudio | `js/brand-core.js`, `js/brand-ui.js`, `js/professional-workspace-ui.js` | master · `96b44ee` / `42c2313` / `44ca9f3` | Sí | Marca y firma **en `localStorage`** del navegador. Shell de áreas Diseñar/Analizar/Presupuestar/Entregar/Mi estudio. | Entrada «Mis catálogos» y cabecera de marca de la ficha. | **REUSAR** la marca. **ADAPTAR** solo con un punto de montaje mínimo. Prohibido simular multiusuario con `localStorage`. |
| Moodboard | `js/moodboard-core.js` | master · `3495c46` | Sí | Se deriva del proyecto asignado. | No es necesario en V1. | **NO REUSAR** en V1 (sin cambios). |
| C1–C4 | `js/cost-provider.js`, `js/budget-core.js`, `js/budget-cost-bridge.js`, `js/bc3-budget-core.js`, `js/cost-catalog-core.js` | master · `df72583` (cost-catalog-core) | Sí | Cantidades, costes con fuente y estado, BC3 y FIEBDC. Fichero compartido con CC1 («Entregar/C1–C4»). | CAT-03: partidas con precio solo con fuente y fecha; nunca desde píxeles. | **REUSAR solo lectura** mediante adaptador propio. **Sin editar** estos ficheros sin coordinación. |
| Entrega · GOV-08 / ENT-01 / ENT-02 | `api/share.js`, `api/unshare.js`, `api/view.js`, `api/delivery.js`, `api/_share-auth.js` | master | Sí | `_share-auth`: código propio por servicio, distinto del de render; mismo sitio; tiempo constante; nunca registrado. | Patrón de autorización para `photo-reform/1`. Publicar fichas: **posterior** (GOV-08/ENT-02). | **REUSAR el patrón** (sin editar). Publicación de fichas: **NO** en V1, que se limita a exportación local. |
| Asistente | `js/capability-registry.js`; rama antigua `feat/agent-ai-ag1-readonly-2026-11-05@e458028` | master / rama de CC1 | Registro: sí | Propiedad de **Claude Code 1**. | Interfaz `CatalogCapabilitiesForAssistantV1` en un módulo propio, sin acoplamiento. | **NO EDITAR**. Exponer la interfaz versionada desde módulos CAT. |
| Lab F3 texturas | `feat/f3-textured-external-catalog@772e24c` | +80/−328 respecto a master | No | Antiguo; catálogo externo con texturas. | Posibles texturas: requieren auditoría blob a blob y de licencia. | **NO REUSAR** en V1 (solo auditar si hace falta). |
| Lab familias visuales | `feat/visual-families-v1@de6ba2c`, `feat/visual-families-hero-fidelity-v2@fe876c1`, `feat/visual-families-next-f03-f04-f05-v1@e01e72d` (base `0f9c6ea`) | +25/+44/+66 y −256 respecto a master | No | Materiales y visuales F03/F04/F05 antiguos, fuera de master. | No son necesarios para CAT-01/02/03. | **NO REUSAR** (sin mezclar sin revisión de blobs y permisos). |
| Compat. B2/B8 | `fix/b2-b8-gpt-image-25-compat-2026-11-04@7e738ec` | +5/−256 | No | Toca `api/render.js` (compartido). | — | **NO REUSAR** (render.js queda congelado para CC2). Se registra. |
| Entregas antiguas | PR #166 | — | No | Reconciliada en #189/#200/#201. | — | **NO FUSIONAR**. |
| Legal | PR #161 | — | No | Borrador; no es autorización jurídica. | — | Solo referencia. |

## 3. Matriz de contradicciones y su resolución

Precedencia: decisión posterior del propietario > `master` probado y contratos > catálogo maestro > documentos y ramas históricos.

| # | Contradicción | Resolución |
|---|---|---|
| 1 | El doc 05/11 propone CAT-IA-1 como «extensión de la edición de imágenes actual» (`api/render.js`). V2 exige un servicio nuevo `photo-reform/1` para fotos y prohíbe intercambiar contratos. | **V2.** `api/render.js` sigue siendo solo para vistas 3D; las fotos van a `photo-reform/1`. |
| 2 | El doc 05/11 lista tarifas GPT Image 2.5 (consultadas el 05/11). V2: «no asumir tarifas antiguas». | **V2.** La tarifa es un dato fechado que se verifica en la fuente del proveedor justo antes de gastar; el código no lleva precios fijos. |
| 3 | El doc 05/11 dice «cero llamadas hasta aprobar costes»; V2 permite hasta 4 salidas facturables. | **V2 con STOP_GASTO:** sin una cifra máxima aprobada y un tope duro aplicable, 0 llamadas. |
| 4 | #227/#228 dejan `httpAdapter` con el Bearer en el navegador; V2 lo marca como defecto de seguridad. | **V2.** Cliente de mismo origen hacia un servidor propio; los secretos solo en el servidor. Se conserva la validación estricta de la respuesta. |
| 5 | El doc 05/11 sitúa las fichas en «PR #166 Entregas»; V2 dice que #166 no se fusiona y que la entrega se reconcilió en #189/#200/#201. | **V2.** Exportación local de la ficha en V1; la publicación sigue GOV-08/ENT-02 en un corte posterior. |
| 6 | `asset-catalog` solo admite dos catálogos. CAT-03 necesita fixtures nuevos. | Extensión **compatible**: un catálogo nuevo con permiso propio y las mismas comprobaciones (SHA, pipeline, medidas, normalización, QA). |
| 7 | Hay GLB IKEA disponibles, pero su permiso es solo para la app local, Git y la Preview de revisión. | **No** se usan en fichas comerciales ni como SKU. Los fixtures son sintéticos y propios. |
| 8 | V2 pide «sesión autenticada» para `photo-reform/1`, pero GOV-06a (cuentas y cuotas por profesional) no existe. | El servicio queda **cerrado por defecto**: exige su propio código distinto de los de render y share (patrón `_share-auth`), un almacén de gasto persistente configurado y un tope. Sin eso responde 503 `not-configured`. Queda documentado que **no** es una sesión por usuario: GOV-06a sigue pendiente y bloquea a clientes reales. |
| 9 | V2 exige «cuota y gasto global persistentes». No hay almacén atómico aprobado (Blob no es contador atómico). | Contrato con una interfaz de almacén. En memoria solo para pruebas. En producción, **fail-closed** si no hay almacén persistente configurado. |
| 10 | El catálogo maestro marca IMG-04 como P (límites por instancia); V2 exige confirmación de gasto con nonce e idempotencia durable. | Se implementa la confirmación con nonce de un solo uso y la idempotencia en `photo-reform/1`; **IMG-04 global** sigue dependiendo del almacén persistente. |

## 4. Dependencias con estado comprobado (hoy)

| ID | Estado | Evidencia |
|---|---|---|
| ECO-01 | Núcleo fusionado (#190) | `js/render-cost-core.js` en master; prueba unitaria existente |
| IMG-04 | Parcial | `api/render.js`: límites en memoria por instancia; sin tope global persistente |
| GOV-05 | Borrador (R) | catálogo maestro; PR #161 no vigente |
| GOV-06a | No iniciado (N) | sin cuentas ni cuotas por profesional |
| GOV-08 | Fusionado (S1/S2) | `api/_share-auth.js`, `api/share.js`, `api/unshare.js` |
| BIB-01 | Pendiente | catálogo maestro (#226: UX-13 sin suelos; BIB-01 pendiente) |

## 5. Gasto y proveedores

- 0 peticiones con coste. No se ha leído ni usado ninguna clave.
- Antes del primer ensayo facturable (máximo 4 salidas en total) hace falta:
  1. proveedor y modelo disponibles y tarifa vigente verificada en su fuente;
  2. una cifra máxima aprobada expresamente por el propietario;
  3. un tope duro en la cuenta del proveedor;
  4. un presupuesto global persistente menor o igual a esa cifra;
  5. pruebas de contrato y mocks en verde;
  6. revisión de privacidad con fixtures sintéticos.
- Si falta cualquiera de ellos: **STOP_GASTO**.

## 6. Plan de cortes (una PR Draft por corte verificable)

| Corte | Contenido | Gates |
|---|---|---|
| C0 | Este inventario y los contratos (`CatalogProductV1`, `PromptRecipeV1`, `photo-reform/1`) | CAT-G0 |
| C1 · CAT-02 | Núcleo `CatalogProductV1`; 5 fichas sintéticas (con medida y precio desconocidos); importación, duplicado rechazado, versiones, búsqueda y filtros, ficha exportable, congelación; «Mi estudio → Mis catálogos» | CAT-G3, CAT-G4 (parte), G8 |
| C2 · FOT-01 servidor | `api/photo-reform.js` (`photo-reform/1`, cerrado por defecto). Cliente de mismo origen sin secretos. Nonce, idempotencia, magic bytes, origen y CSRF, registros sin PII. Pruebas con servidor falso. | G7 (parte), seguridad |
| C3 · CAT-01 + FOT visual | Referencias 1–3 con licencia, zonas a conservar y cambiar, Fiel/Equilibrado/Creativo, preflight de coste (ECO-01), comparación y aceptación, ficha, `PromptRecipeV1` con pruebas de escape | G1/G2 (**PARCIAL con mocks**), G4 |
| C4 · CAT-03 | SKU → GLB validado por `asset-catalog` (mueble sintético + electrodoméstico propio, o fallback rotulado), deshacer y rehacer, plantas giradas, C1–C4 solo con fuente y fecha | G5, G6 |
| C5 · QA | `scripts/qa/record-cat-ia-v1.cjs` y matriz completa (1440×900, 1280×800, 390×844, 844×390; ES/EN/ZH; negativas) | G8, G9 |

---
Firmado: **Claude Code 2** · 2026-11-14 · sobre `master@c91d12d1d76c71541c3accb3779f9d95519c2725`. Sin merges, sin Production y sin gasto.

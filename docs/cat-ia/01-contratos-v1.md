# CAT-IA · Contratos V1 (CAT-G0)

Base `master@c91d12d`. Este documento fija los contratos que implementa cada corte y lo que **no** hacen. Ninguno modifica `FloorPlanProjectV1`.

## 1. `CatalogProductV1` (`rubik-catalog-product/1`) · implementado en C1

- Módulo: `js/catalog-product-core.js` (`window.RubikCatalogProduct`, UMD, sin I/O).
- Pruebas: `tests/catalog-product-core.test.cjs` y `tests/catalog-ia.browser.test.cjs`.

| Campo | Regla |
|---|---|
| `catalogId`, `productId`, `variantId` | Identificadores en minúsculas, cifras y guiones. `variantId` puede ser `null`. Clave = `productId@variantId`. |
| `sku` | `A–Z 0–9 . - _`, como máximo 64 caracteres. Es único en el catálogo: si otra clave ya lo usa, se rechaza con `sku-duplicate`. |
| `displayName`, `manufacturer`, `brand`, `collection`, `description` | Texto limpio, sin caracteres de control. Se limita al validar y no se vuelve a recortar después. |
| `brandKind` | `synthetic`, `own` o `third-party`. `synthetic` exige `source.kind = synthetic-fixture`, y a la inversa. |
| `source` | `{kind: synthetic-fixture, retailer, client o authorized-brand; ref; proofRef}`. Una marca de terceros necesita `ref` (`brand-without-source`). |
| `affiliation` | Por defecto `none`. `official` solo con `authorized-brand` y `proofRef` (`affiliation-without-proof`). |
| Marca falsa | Si el nombre, la marca, el fabricante o la colección contienen una marca conocida de terceros y `brandKind` no es `third-party`, se rechaza con `brand-misattributed`. |
| `family`, `kind` | 13 familias comerciales (`cocinas` … `textiles`). `kind` es uno de `furniture`, `appliance`, `material`, `lighting` o `fixture`, y cada uno tiene un rango plausible en mm. |
| `dimensionsMm` | `{width, height, depth}`: cada medida es un número mayor que 0 y como máximo 20 000 mm, o `null`. El 0 se rechaza. Fuera del rango del tipo se rechaza con `dimension-implausible`. Cualquier número exige `dimensionsProvenance`. Estado: `verified`, `partial` o `unknown`. |
| `technicalSheet` | `{url: solo https sin credenciales o null, version, verifiedAt}`. |
| `commercial` | `{currency: EUR o USD, unit: ud, m2 o ml, netUnitPrice: mayor que 0 o null, vatRate: de 0 a 0,3 o null, priceSource, verifiedAt}`. Un precio exige fuente y fecha no futura. **Nunca 0 ficticio.** `priceStatus` es `unknown` o `sourced`. |
| `availability` | Por defecto `unknown`. Cualquier otro estado exige `source` y `verifiedAt` (`availability-unverified`). |
| `license` | Licencia de los datos de la ficha. `scope` debe incluir `catalog-sheet` y llevar `proofRef`. Si ha caducado, se rechaza. |
| `imageRefs[0..3]` | Ruta en `assets/cat-ia/fixtures/*.png, jpg o webp`, `mediaType` coherente con la extensión, `sha256`, `usageRights` `own` o `licensed`, y licencia con `catalog-sheet`, prueba y caducidad. La interfaz comprueba la huella SHA-256 antes de mostrar la imagen. |
| `model3dRef` | `null` o `{catalog, assetId, catalogRevision}`. Lo resuelve CAT-03 con `FloorPlanAssets`; aquí no se carga nada. |
| `reviewStatus` | `DRAFT`, `REVIEWED`, `APPROVED` o `REJECTED`. |

**Catálogo (`rubik-catalog/1`).**
- La importación (`rubik-catalog-collection/1`, como máximo 200 fichas por lote) acepta o rechaza **cada ficha** con sus códigos.
- Cada cambio aceptado crea `revision + 1`, con un `revisionHash` (SHA-256 canónico de las fichas) y un `productVersion + 1`. Importar el mismo contenido no crea revisión nueva.
- Las variantes de un mismo producto comparten familia, tipo, fabricante y marca (`variant-contradictory`).

**Búsqueda.** Admite texto (sin distinguir acentos ni mayúsculas) y filtros por familia, tipo, fuente, precio conocido o desconocido, estado de las medidas y revisión. Devuelve copias.

**Selección congelada (`rubik-catalog-selection/1`).**
- Es una instantánea congelada, con su huella, de las fichas y las cantidades.
- Los cambios posteriores del catálogo no la alteran.

**Ficha (`rubik-catalog-sheet/1`).**
- Se genera en ES, EN o ZH y marca los valores desconocidos.
- Avisos que incluye: «ficha orientativa», «sin afiliación», «fixture sintético», «medidas incompletas» y «precio desconocido».
- `sheetHtml`: documento autónomo, CSP `default-src 'none'`, sin scripts, todo escapado, imágenes solo como `data:` verificadas.

**Almacenamiento.**
- Piloto local `local-pilot`: clave `rubik-cat-ia-catalogs-v1:<studioId>`.
- Al cargar, revalida las fichas y la huella; si los datos están dañados o manipulados, no se cargan.
- **No es control de acceso.** El aislamiento real entre estudios requiere GOV-06a y un almacén privado.

**`CatalogCapabilitiesForAssistantV1`.**
- Interfaz congelada de solo lectura (`listCatalogs`, `search`, `sheet`, `limits`) para el Asistente de Claude Code 1.
- No tiene métodos de escritura y devuelve copias. CC1 la consume sin editar los módulos CAT. Este corte no toca `js/capability-registry.js`.

**Fixtures.**
- `assets/cat-ia/fixtures/` contiene cinco fichas sintéticas: un aparador con 2 variantes, un horno **sin precio**, una encimera **sin medidas** y una lámpara.
- Las imágenes son dibujos generados por `scripts/cat-ia/make-fixtures.py`, con su SHA-256, bajo `LICENSE.txt`.
- No contienen personas, marcas de terceros ni productos reales.

## 2. `photo-reform/1` en el servidor · corte C2 (pendiente)

Contrato acordado en el inventario (§3, contradicciones 4, 8, 9 y 10):
- Activación explícita y cierre por defecto.
- Código propio distinto del de render y del de share.
- Mismo origen, CSRF y nonce de un solo uso.
- Comprobación de magic bytes y tamaño.
- Idempotencia, y cuota y gasto **persistentes**; sin almacén configurado responde 503.
- Registros sin imagen, EXIF ni PII.
- El cliente de navegador **no** lleva secretos.

## 3. `PromptRecipeV1` · corte C3 (pendiente)

- Recetas versionadas en el servidor: `kitchen-catalog-faithful`, `bath-product-fidelity`, `furniture-showcase`, `finish-material-match`, `lighting-catalog` y `developer-showroom`.
- Cada receta declara sus invariantes que se preservan, la zona, las referencias validadas, los proveedores permitidos y el coste.
- Incluye pruebas de escape y de inyección de instrucciones.
- **Una receta o un mock no acreditan fidelidad comercial real.**

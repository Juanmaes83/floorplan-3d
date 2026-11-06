# FT3D-8 · Misión M1 (S2 + S3) — Informe final

Fecha: 2026-11-06 · Responsable: Claude Code 2 · **Pendiente de revisión del propietario.** No hay merge, despliegue
a Production, publicación de datos ni gasto externo.

## A. Identidad
- **Rama:** `feat/ft3d-8-s2-s3-m1-2026-11-05`.
- **Base:** `master@0f9c6ea`, verificada como HEAD remoto. No se mezcla con Gate D (`b12b925`).
- **Commits:**
  - `59a955c`: M1-0, auditoría;
  - `0029b3b`: núcleos S2 y S3;
  - `fb00083`: interfaz, verificación en directo y correcciones de revisión;
  - `c1955b8`: CI, adenda legal y evidencias;
  - más el commit de este informe.
- **Archivos creados:**
  - `js/cost-catalog-core.js`, `js/catastro-wfs-provider.js`, `js/parcel-association-core.js`;
  - `labs/m1-s2-s3/` (`index.html`, `m1.css`, `shell.js`, `fixtures.js`, `s2-ui.js`, `s3-ui.js`);
  - `tests/cost-catalog-core.test.cjs`, `tests/catastro-wfs-provider.test.cjs`, `tests/parcel-association-core.test.cjs`,
    `tests/m1-s2-s3.browser.test.cjs`, `tests/fixtures/bcca-es/editions.cjs`;
  - `.github/workflows/ft3d-8-m1-s2-s3.yml`;
  - `docs/legal/bcca-es-reuse-gate-addendum-m1-2026-11-05.md`;
  - documentos M1-0 y este informe;
  - evidencias en `docs/product/ft3d-8-m1-evidencias/`.
- **Archivos compartidos modificados: ninguno.** No se ha tocado:
  - `index.html`, `budget-core`, `budget-ui`, `budget-cost-bridge`, `bc3-budget-core`, `cost-provider*`;
  - `geo-provider`, `catastro-parcel-provider`, `territory-*`;
  - los workflows existentes.

## B. S2 — Precios de referencia (BCCA, BC3 y tarifa propia)
- **Ya desarrollado:**
  - contrato `CostProvider` 1.0.0;
  - adaptador BCCA sin red, con modos y puerta legal;
  - lector BC3;
  - puente de presupuesto (unidad y moneda estrictas);
  - motor C1–C4 (cálculo, revisión, serializar y reabrir).
- **Implementado ahora:** `FloorPlanCostCatalog`.
  - Búsqueda multifuente por código, texto y familia (familias leídas de la estructura FIEBDC), sin mezclar
    ediciones ni regiones.
  - Comparación sin aplicar.
  - Vista previa y aplicación **solo** con confirmación; un precio ya revisado exige además consentimiento.
  - Registro del cambio con etiquetas de revisión.
  - Propuesta de actualización de edición, aplicada partida a partida.
  - Unidades: solo se iguala la notación (ud→unit, m²→m2, ml→m), nunca se convierte.
  - Estados en lenguaje natural.
  - Cobertura que nunca presenta un importe parcial como total.
  - Límites (30 MB, 200.000 conceptos, 100 resultados) y caché LRU acotada.
  - Gestionado bloqueado sin excepción.
- **Interfaz utilizable:** `labs/m1-s2-s3/?tab=precios`.
- **Contratos conservados:** el presupuesto sigue en 1.1.0 (y 1.0 se lee con actualización explícita).
  `priceReference` y `priceSource` son los del motor. Sin campos nuevos.
- **Bloqueado por licencia:** el catálogo BCCA gestionado por RUBIK (descarga, alojamiento, actualización y
  redistribución). Véase la adenda legal.

## C. S3 — Catastro directo
- **Ya existía:**
  - contrato `GeoProvider` 1.3.0, que preveía el modo `reference` sin proveedor;
  - lector GML INSPIRE;
  - núcleo de parcela y CRS;
  - `site.parcel`, colocación explícita y política de exportación.
- **Completado ahora:**
  - proveedor `catastro-inspire-wfs`, contra el servicio oficial de la DGC (`ovc.catastro.meh.es/INSPIRE/wfsCP.aspx`,
    consulta guardada `GetParcel`). Reutiliza `parseDocument`, sin segundo parser;
  - núcleo de asociación a **un** sujeto, con revisión, sustitución confirmada y conservación o retirada explícita
    de la colocación;
  - comprobación de ida y vuelta;
  - exportación por canal;
  - contexto PNOA/MDT05 opcional;
  - interfaz.
- **Servicio oficial y evidencia:**

  | Prueba | Resultado |
  |---|---|
  | Desde Chromium, el camino real del producto, con la referencia de ejemplo de la documentación oficial (`3662001TF3136S`) | **HTTP 200 con parcela válida**: 1 polígono, 63 vértices, EPSG:25830, licencia `restricted` conservada. Evidencia: `catastro-en-directo-encontrada-3662001TF3136S.json` |
  | Referencia inexistente | Excepción oficial «No se ha encontrado la parcela … para el huso 25830». Se trata como «no encontrada en ese huso». Evidencia: `catastro-en-directo-no-encontrada-0000000AA0000A.json` |
  | Cliente de línea de órdenes (`curl`) | HTTP 400 en HTML. RUBIK no usa esa vía. |

  - CORS abierto (`Access-Control-Allow-Origin: *`).
  - No se guarda la geometría oficial en el repositorio: la licencia de la DGC no permite difundirla sin
    transformar.
- **Mocks frente a verificación:**
  - la suite de CI intercepta el host oficial (rechazo simulado y respuesta INSPIRE sintética) y nunca lo alcanza;
  - la verificación real es la prueba opcional `FT3D8_M1_LIVE=1`, ejecutada dos veces el 06/11/2026.
- **Alternativa:** abrir el GML descargado de la Sede, con el proveedor existente. Ningún error borra la parcela ni
  la colocación guardadas.
- **Persistencia:** una clave de navegador por proyecto en el laboratorio; la integración real con la biblioteca es
  S4. Reabrir restaura solo ese proyecto.

## D. Calidad
| Suite | Resultado |
|---|---|
| Puras M1 (S2 12, WFS 4, asociación 7) | 23 de 23 |
| Puras de los motores reutilizados (base 214) | 214 de 214 |
| Total puras | 237 de 237 |
| Navegador M1 (`m1-s2-s3.browser`) | 11 de 11, más 1 en directo opcional |
| Navegador existente (`budget-ui` 4, `parcel` 5, `territory-integration` 3) | 12 de 12 |

- **Rendimiento medido** con 20.000 conceptos: carga de unos 0,8 s, búsqueda de unos 20 ms, búsqueda en caché de
  unos 0,02 ms.
- **CI:** workflow `ft3d-8-m1-s2-s3.yml`. El resultado de la ejecución asociada al SHA final se indica en el mensaje
  de entrega.
- **Capturas** en `docs/product/ft3d-8-m1-evidencias/`, de la ventana visible:
  - escritorio, 1440 × 900: estado inicial, procedencia, confirmación, unidad incompatible, actualización de edición,
    servicio rechazado, parcela encontrada, colocación y sustitución;
  - móvil, 390 × 844: precios, comparar, parcela y colocación.
- **Revisión visual y correcciones:**
  - la barra superior tapaba el contenido; ya no es fija;
  - el atributo `hidden` quedaba anulado (el botón «Cancelar» estaba siempre visible); corregido;
  - etiquetas internas en inglés; ahora en castellano;
  - «Desconocido» en mayúscula a mitad de frase, y «sin IVA» tras un importe desconocido; corregido;
  - unidades m2 y m² mezcladas; unificadas;
  - el número de partidas contaba capítulos; ahora cuenta solo partidas con precio;
  - la fórmula de superficie omitía un lado; corregida;
  - el error de ida y vuelta salía en notación científica; ahora en castellano;
  - el huso salía recortado; se ve completo;
  - el orden en móvil ponía el historial antes que la búsqueda; el historial va al final.
- **Errores conocidos o limitaciones:**
  - la búsqueda por referencia necesita el huso correcto (lo indica la propia respuesta oficial). RUBIK no lo deduce
    de la referencia;
  - la persistencia S3 del laboratorio es local al navegador.

## E. Integración futura (S4)
- **Contratos listos para S4:** `FloorPlanCostCatalog` y su API, y el proveedor `catastro-inspire-wfs`. Para el
  editor, basta registrarlo en el registro territorial cuando se autorice. También `FloorPlanParcelAssociation`.
- **Archivos compartidos que requieren coordinación:**
  - `index.html` y `budget-ui.js`, para llevar la interfaz a Presupuestar;
  - `territory-ui.js` y `geo-provider.createDefaultRegistry`, para la consulta por referencia en el editor;
  - `project-library.js`, para la persistencia real.
- **Dependencias:**
  - Claude original: Entregar y la política de exportación en entregas;
  - Kimi: ninguna para M1.
- **Cambios de esquema:** ninguno; DEC-06 y DEC-07 siguen pendientes.
- **Licencias y servicios:** BCCA gestionado `UNKNOWN`, desactivado; Catastro con licencia restringida (uso propio,
  geometría no exportable); PNOA y MDT05 opcionales.

## F. Auditoría de aceptación
| Requisito | Estado | Prueba / evidencia |
|---|---|---|
| FT8-S2-01 Consulta por código, texto y familia, con edición y región | PROBADO (sintético) | `cost-catalog-core` S2-01; navegador «search, provenance» |
| FT8-S2-02 Ficha de procedencia | PROBADO | S2-02; captura `s2-02` |
| FT8-S2-03 Comparar sin aplicar y consentimiento | PROBADO | S2-03 (dos pruebas); captura `s2-03` |
| FT8-S2-04 Actualización de edición sin sobrescribir | PROBADO | S2-04 / QA-06; captura `s2-05` |
| FT8-S2-05 Unidades estrictas | PROBADO | S2-05 / QA-05; captura `s2-04` |
| FT8-S2-06 Procedencia al reabrir | PROBADO | S2-06 / QA-24; navegador «save and reopen» |
| FT8-S2-07 Gestionado bloqueado | **BLOQUEADO** por permisos (bloqueo probado) | S2-07 / QA-07; adenda legal |
| FT8-S2-08 Estados y mensajes | PROBADO | S2-08; navegador |
| FT8-S2-09 Límites, caché y recuperación | PARCIAL: probado con catálogo sintético; caché del modo gestionado no aplicable mientras siga bloqueado | S2-09 (medido) |
| FT8-S3-01 Consulta oficial por referencia | PROBADO en directo desde Chromium (2 consultas), más pruebas con red inyectada | `live-*.json`; `catastro-wfs-provider` |
| FT8-S3-02 Parcela canónica, CRS y huella | PROBADO | `parcel-association-core` S3-02; respuesta real normalizada |
| FT8-S3-03 Asociación sin contaminación | PROBADO (laboratorio) | S3-03 / QA-10; navegador «persists, B untouched» |
| FT8-S3-04 Colocación explícita e ida y vuelta | PROBADO | S3-04; captura `s3-03` |
| FT8-S3-05 Estados de red, cancelación y alternativa GML | PROBADO | WFS S3-05; navegador «cancel … GML» |
| FT8-S3-06 PNOA y MDT05 opcionales | IMPLEMENTADO (estado y licencia); carga no ejercitada en M1 | S3-06 |
| FT8-S3-07 Exportación por canal | PROBADO como política; la integración en vídeo y HTML reales es S4 | S3-07 / QA-17 |
| FT8-S3-08 Interfaz de parcela | PROBADO en el laboratorio; integración en el editor pendiente (S4) | navegador S3 y capturas |

## G. Reversibilidad
- Todo es aditivo y está aislado:
  - tres módulos nuevos sin consumidores fuera del laboratorio;
  - un laboratorio aislado;
  - un workflow propio.
- **Para desactivar:** basta no cargar `labs/m1-s2-s3`, o revertir los commits de la rama. No hay migraciones ni
  campos nuevos.
- **Datos existentes:**
  - los presupuestos guardados no cambian: el cambio solo se produce con confirmación y devuelve un documento nuevo;
  - la clave de navegador del laboratorio (`rubik-m1-lab:v1:*`) puede borrarse sin afectar al editor.

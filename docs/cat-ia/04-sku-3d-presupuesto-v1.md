# CAT-03 · SKU → objeto 3D → partidas (corte C4)

**Estado: MOCK_VALIDADO_PARCIAL.**
- Los fixtures son legales y propios (sintéticos).
- **No se atribuye ninguna marca real.**
- La integración visible en «Presupuestar», que pertenece a C1–C4 y está compartida con CC1, queda para la PR de integración.

## Modelos 3D (pipeline de activos existente, sin excepciones)
- `assets/f3/cat-ia-aparador-lumen.glb` (1600 × 780 × 450 mm) y `assets/f3/cat-ia-horno-h60.glb` (595 × 595 × 548 mm).
  - Son sólidos rectangulares originales, generados por `scripts/cat-ia/make-glb-fixtures.py` (`--check` comprueba que son idénticos byte a byte).
  - Permiso propio: `assets/f3/LICENSE-cat-ia.txt`.
- Manifiesto propio: `assets/f3/cat-ia.manifest.json`.
  - Catálogo `rubik-sota-local`, con **las mismas reglas** de `FloorPlanAssets.adapt`: permiso para el uso objetivo, SHA-256 del modelo y del permiso, medidas en mm, normalización, GLB sin extensiones, `qaStatus: approved` y caducidad.
  - `js/asset-ui.js` lo lee como tercera fuente.
  - En 3D, el cargador de producción vuelve a comprobar los bytes, el permiso y las medidas (±20 mm).
- Estas entradas **no aparecen en la búsqueda genérica de muebles** (no llevan `room`): solo se colocan con «Producto de mi estudio», que crea el vínculo de SKU, revisión y precio. Así no puede entrar un aparador de catálogo sin su vínculo.
- El banco sintético y los modelos IKEA no cambian. Los GLB IKEA siguen siendo **solo de revisión**: no se usan para SKU.

## Vínculo (`js/catalog-placement-core.js`, `js/catalog-placement-ui.js`)
- **Entrada:** «Diseñar → Amueblar → Producto de mi estudio» abre «Mis catálogos». La ficha muestra **qué se colocará y por qué**.
- **Representación:**
  - Modelo validado, solo si la referencia `model3dRef` se resuelve y sus medidas coinciden (±20 mm).
  - Si no, **volumen genérico rotulado** con su motivo: sin modelo, el modelo no pasa el pipeline (licencia vencida, unidades dudosas…) o las medidas no coinciden.
  - **No se coloca** si las medidas no están verificadas o si es un material.
- **Colocación:** `FloorPlanApp.addOwnFurniture` hace la colocación ordinaria, con colisiones y aviso de solape (aviso, no bloqueo), en **un paso del deshacer** y con guardado.
- **Vínculo en el proyecto:** `project.extensions['x-cat03-catalog-link']` guarda catálogo, revisión y huella, versión de la ficha, SKU y representación.
  - **El SKU nunca cambia la geometría.**
  - Duplicar conserva el vínculo (una línea en `duplicateSel` de `index.html`, junto al gancho de MUE-01).
  - Viaja al exportar e importar.
- **Panel del objeto:** «Producto de catálogo: SKU · rev. · representación». Las medidas del proyecto mandan.

## Presupuesto (C1–C4 sin editar)
- `costProvider()` cumple el contrato `FloorPlanCostProvider` (`cost-provider.js`: `inspectProvider`, `createRegistry`, `validateQuote`). Cotiza **solo** el precio de la ficha, con su fuente y su fecha, en EUR.
  - Sin precio: `unavailable`, nunca 0.
  - **Nunca desde imágenes ni píxeles.**
- `budgetLines()`: la cantidad es el número de objetos vinculados. El total solo incluye precios con fuente. Se marcan las líneas sin precio y las fichas que cambiaron después de colocar.
- **Exportación:** «Mis catálogos → Partidas del proyecto», descargable como `rubik-catalog-budget-lines/1`.
- Instalación, encimeras y recortes necesitan partidas propias en Presupuestar: no se infieren.

## Pruebas

| Fichero | Pruebas | Qué cubre |
|---|---|---|
| `tests/catalog-placement-core.test.cjs` | 6 | Pipeline y bytes de los GLB; validado frente a genérico; negativos (medidas desconocidas, licencia vencida, unidades dudosas, 45 mm de desfase); vínculo; huérfanos; duplicar; proveedor C1–C4 registrado; partidas. |
| `tests/catalog-placement.browser.test.cjs` | 2 | Escritorio: material no colocable, roble validado (cargado en 3D), nogal genérico, horno validado sin precio, partidas y JSON, deshacer/rehacer, duplicar, reabrir, exportar e importar en otro contexto. Planta girada 30° en teléfono 390×844: colocación válida y, si hay solape, aviso del editor. |
| `tests/assets*.cjs`, `tests/browser.test.cjs` | — | Ajuste de recuento de activos: 21 → 23. El nuevo manifiesto se añade a la lista de peticiones permitidas. |

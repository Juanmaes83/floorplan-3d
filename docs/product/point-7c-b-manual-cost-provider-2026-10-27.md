# Punto 7C-B — ManualCostProvider offline permanente

**Fecha:** 27-10-2026
**Base:** `master@325897b7497359e742eec28577a1cda3056df213`
**Estado de esta PR:** **CANDIDATO EN REVISIÓN**

7A, 7B y 7C-A están **CERRADOS**. 7C-B aporta el primer provider concreto del contrato cerrado `FloorPlanCostProvider`:

```text
Profesional → ManualCostProvider → FloorPlanCostProvider → CostQuote normalizado
```

Manual permanece disponible como opción offline independiente. No existe selección automática ni lógica que lo active cuando otro provider falla. El corte termina en el quote; 7C-C es el siguiente paso para conectar provenance de providers con Budget.

## API y resultado

`js/cost-provider-manual.js` exporta `FloorPlanManualCostProvider` por CommonJS y como global de navegador si se carga expresamente después de `FloorPlanCostProvider`. No se añade a `index.html` ni se auto-registra.

```js
const Cost=require('../../js/cost-provider.js');
const Manual=require('../../js/cost-provider-manual.js');
const registry=Cost.createRegistry();
registry.register(Manual);
const result=await registry.getPrice('manual','floor-bedroom',{
  description:'Pavimento porcelánico',
  unit:'m2',
  unitPrice:31,
  label:'Tarifa propia estudio',
  asOf:'2026-10-15'
});
```

El ID estable es `manual`. Capabilities: `{search:false,getItem:false,getPrice:true,network:'none'}`. `search` y `getItem` no tienen métodos ficticios; los wrappers de 7C-A devuelven `unsupported`. El registry real admite `register`, `get`, `inspect`, `getPrice`, rechazo de ID duplicado y `unregister`.

`getPrice(itemId, context)` exige identidad explícita, descripción, unidad, `unitPrice` y `label`. El contrato genérico normaliza strings y valida el quote. `unitPrice` debe ser `number`, finito y `>= 0`; cero es un precio conocido. Strings monetarios y números no finitos producen `invalid`. El adapter fija `currency:'EUR'` y `priceKind:'manual'`, sin FX. Conserva unidades genéricas (`m2`, `m`, `unit`, `m3`, `kg`, `h`, entre otras) sin convertirlas. No inventa un código de catálogo: `code` es `null` cuando falta.

`label` es procedencia humana obligatoria, sin valor por defecto. `asOf` representa la fecha del precio, es opcional y solo acepta una fecha de calendario `YYYY-MM-DD`; si se desconoce queda `null`. `retrievedAt` es siempre `null`: la entrada manual no se recuperó de una fuente remota. La metadata del provider declara `kind:'manual'`; su licencia y la del quote son `not-applicable`. No inventa URLs, edición, región ni attribution.

El resultado no contiene `review` ni aprueba una partida. **Introducir un precio no equivale a `reviewed`**. La eventual aplicación a Budget y su revisión profesional quedan para 7C-C. `FloorPlanBudgetV1` **1.0.0**, `js/budget-core.js` y el JSON Schema permanecen intactos; no hay `provider-reference` ni bridge CostQuote → Budget.

## Límites del corte

El módulo es stateless y solo transforma input en quote. No utiliza red, DOM, filesystem, storage, servidor, catálogo, histórico, favoritos, recomendaciones ni credenciales. No incorpora BCCA, BC3, DDC, parser, UI, exportación ni orquestación entre providers. No mide geometría, cantidades ni superficies; no calcula merma, subtotales, IVA o totales. No modifica proyecto, edificio, JSON/ZIP, Solar, 2D ni 3D.

## QA

- `tests/cost-provider-manual.test.cjs`: **35 PASS / 0 FAIL / 0 SKIP**. Incluye validación de precio/procedencia, fecha imposible, cero, unidades, no mutación, registry, export CommonJS/global y ejecución en VM donde `fetch`, `XMLHttpRequest`, `window`, `document`, `localStorage` e `indexedDB` lanzan error si se leen; no se inicia servidor.
- `tests/cost-provider.test.cjs` + tests Manual: **69 PASS / 0 FAIL / 0 SKIP**.
- `tests/budget-core.test.cjs`: **34 PASS / 0 FAIL / 0 SKIP**.
- Unitarios completos sin tests `*browser*`: **429 PASS / 0 FAIL / 2 SKIP** (integraciones Blender sin `BPY_PYTHON`). Sintaxis JS y `git diff --check`: PASS.
- Checks de GitHub del HEAD publicado: registrar en la PR tras el push.

7C-B permanece **CANDIDATO EN REVISIÓN** hasta CI verde, revisión y merge humano. **7C-C — SIGUIENTE**.

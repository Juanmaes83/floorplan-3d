# FloorPlanBccaEsCostProvider — superficie específica 7C-E

El módulo `js/cost-provider-bcca-es.js` expone `FloorPlanBccaEsCostProvider.create(options)` por CommonJS y global explícito. `id='bcca-es'`; no se registra solo. Sus resultados siguen el contrato existente de `FloorPlanCostProvider`.

```js
const provider=FloorPlanBccaEsCostProvider.create({
  model:FloorPlanFIEBDC3.parse(bc3Bytes),
  datasetMode:'user-supplied', // synthetic | user-supplied | rubik-managed
  currency:'EUR',              // configuración explícita, nunca inferida
  source:{label,sourceName,sourceUrl:null,edition:null,attribution:null,
    licenseName:null,licenseUrl:null},
  legalGate:{status:'UNKNOWN'}
});
```

`create()` llama siempre a `FloorPlanFIEBDC3.validate(model)` y usa solo el modelo canónico devuelto. `getGateStatus()` expone `{technical:{status:'PASS'|'FAIL',reason}, legal:{status:'VERIFIED'|'UNKNOWN'|'RESTRICTED',scope}}`. Los warnings de 7C-D no bloquean automáticamente. La metadata exige `kind`: `other` para fixture `synthetic` y `official-dataset` para los dos modos oficiales.

La matriz de acceso es:

| Modo | Gate técnico | Gate legal | Operaciones |
|---|---|---|---|
| `synthetic` | PASS | synthetic-only | Permitidas con datos inventados |
| `user-supplied` | PASS | UNKNOWN | Permitidas; metadata y quote retienen licencia `unknown` |
| `user-supplied` | PASS | RESTRICTED | Bloqueadas |
| `rubik-managed` | PASS | UNKNOWN/RESTRICTED | Bloqueadas |
| `rubik-managed` | PASS | VERIFIED | Activables; no se implementa descarga/alojamiento |
| cualquiera | FAIL | cualquiera | Bloqueadas |

`VERIFIED` para `rubik-managed` exige una declaración explícita de fuente oficial, uso comercial y reutilización, al menos una URL de evidencia y fecha de revisión. Una URL sola no cambia el gate. La factory registra una declaración de configuración; la revisión humana de evidencia sigue siendo necesaria. El estado documental actual de BCCA gestionada por Rubik es `UNKNOWN`.

El índice en memoria se construye una vez. Cada item usa `concept.code` como `itemId`. Se indexan `concept.code`, `concept.identity` y alias **exactos** de `concept.aliases`; no se normalizan alias por una segunda regla `#`/`##`. `getItem`/`getPrice` respetan mayúsculas; solo la búsqueda textual ignora mayúsculas. Raíz/capítulo o concepto sin unidad/descripción no son priceable y no bloquean por sí solos el dataset. `~T` puede suplir resumen solo si el código se relaciona mediante una clave ya proyectada. La categoría es `null` porque no se deriva de forma segura.

`search` ordena coincidencia exacta de código/alias, prefijo y descripción, con desempate por código y `limit`. Filtra unidad y región exactas (`Andalucía, España`); una categoría no fiable devuelve lista vacía con `category-filter-unavailable`. `getItem` distingue `item-not-found` y `item-not-priceable`.

`getPrice` exige selector `{index}` o `{label}` cuando hay más de una variante. Una sola se selecciona sin selector; ninguna devuelve `price-unavailable`. Label duplicado devuelve `price-selector-ambiguous`; selector inválido, `invalid-price-selector`. El adapter usa la entrada `concept.prices` seleccionada tal como la proyectó 7C-D, incluso `inheritedPrice` e `inheritedDate`; no recalcula herencia ni cambia de variante. Precio `0` es válido; ausente, negativo o no finito no genera quote. El quote es siempre `reference`, moneda EUR declarada, unidad intacta, sin revisión profesional. Una fecha completa de ocho dígitos se interpreta como DDMMYYYY según la especificación FIEBDC; fecha parcial o de calendario imposible produce `asOf:null`. `retrievedAt:null` en este provider offline.

Las razones estables son `item-not-found`, `item-not-priceable`, `price-unavailable`, `price-selector-required`, `price-selector-ambiguous`, `invalid-price-selector`, `invalid-price-value`, `currency-unverified`, `technical-gate-failed`, `legal-gate-not-verified`, `legal-gate-restricted` y `category-filter-unavailable`.

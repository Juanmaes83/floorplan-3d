# FloorPlanCostProvider — Point 7C-A contract

Runtime: `js/cost-provider.js`, pure UMD. This cut defines the provider boundary, normalization rules and registry only. It does **not** implement Manual, BCCA, DDC, network access, storage, UI or budget persistence of provider prices.

Contract version: `1.0.0`.

## 1. Purpose

`FloorPlanCostProvider` isolates FLOOR PLAN 3D from the origin and transport of cost data.

A provider may be offline or online, manual, official, commercial or another source. Consumers never branch on a specific provider name to understand results. All provider data crosses the same validation boundary.

7C-A deliberately does not change the formulas closed in 7B. It does not calculate quantities, merma, IVA or subtotals.

## 2. Required provider shape

Every provider is an object with:

```js
{
  id,
  getCapabilities(),
  getSourceMetadata(),
  // operations required only when the matching capability is true
  search(query, context),
  getItem(itemId, context),
  getPrice(itemId, context)
}
```

`id` is stable and non-empty.

`getCapabilities()` and `getSourceMetadata()` are mandatory and synchronous. Data operations may return a value or a Promise; the core wrappers always expose them asynchronously.

## 3. Capabilities

Normalized capabilities:

```js
{
  search: boolean,
  getItem: boolean,
  getPrice: boolean,
  network: 'none' | 'optional' | 'required'
}
```

A capability declared `true` requires the corresponding method.

A capability declared `false` is not invoked. The core returns:

```js
{status:'unsupported', providerId, reason:'capability-disabled'}
```

This prevents fake successful empty responses for unsupported behavior.

## 4. Source metadata and legal/provenance gate

Every provider exposes normalized source metadata:

```js
{
  providerId,
  label,
  kind: 'manual' | 'official-dataset' | 'commercial' | 'other',
  sourceName,
  sourceUrl: string | null,
  edition: string | null,
  region: string | null,
  attribution: string | null,
  license: {
    status: 'not-applicable' | 'unknown' | 'verified' | 'restricted',
    name: string | null,
    url: string | null,
    note?: string
  }
}
```

`providerId` must equal `provider.id`.

`license.status` is deliberately explicit. `unknown` is not treated as permission. 7C-A does not decide the legal status of BCCA or any external dataset; adapters must state the evidence they actually have.

Only `http`/`https` URLs are accepted by the normalized metadata contract.

## 5. Search

Normalized query:

```js
{
  text,
  unit?,
  category?,
  region?,
  limit? // integer 1..100
}
```

`text` is mandatory.

A successful search returns:

```js
{
  status: 'available',
  providerId,
  reason: null,
  items: [
    {
      providerId,
      itemId,
      code: string | null,
      description,
      unit,
      category: string | null
    }
  ]
}
```

Provider units are normalized as non-empty unit identifiers but are not restricted to the current Budget V1 set (`m2 | m | unit`). This is intentional: future official databases may expose other units. 7C-C must only apply a provider quote to a budget line when the unit is compatible; no unit conversion is invented by 7C-A.

## 6. Item lookup

Successful lookup:

```js
{
  status:'available',
  providerId,
  reason:null,
  item:{...normalizedItem}
}
```

Missing data is represented by status, not by an empty fake item.

## 7. Price quote

Successful quote:

```js
{
  status:'available',
  providerId,
  reason:null,
  quote:{
    providerId,
    itemId,
    code: string | null,
    description,
    unit,
    unitPrice,
    currency:'EUR',
    priceKind:'manual' | 'reference',
    source:{
      label,
      asOf: 'YYYY-MM-DD' | null,
      retrievedAt: '<offset-aware ISO>' | null,
      edition: string | null,
      region: string | null,
      sourceUrl: string | null,
      attribution: string | null,
      licenseStatus: 'not-applicable' | 'unknown' | 'verified' | 'restricted' | null,
      licenseName: string | null,
      licenseUrl: string | null
    }
  }
}
```

Contract V1 is EUR-only to match `FloorPlanBudgetV1` V1.

`unitPrice: 0` is valid and different from “no quote”. A successful quote cannot carry `unitPrice: null`.

`priceKind` distinguishes a value manually supplied through a provider from an external/reference value. It does **not** imply professional review or approval.

## 8. Result statuses

All operations use one of:

- `available`;
- `not-found`;
- `unavailable`;
- `invalid`;
- `cancelled`;
- `unsupported`.

Operational exceptions thrown by a provider are isolated by the core and become:

```js
{status:'unavailable', providerId, reason:'provider-error'}
```

Malformed provider payloads are different: they are contract/programming errors and are rejected with `TypeError`. Invalid provider data is never silently accepted.

## 9. Context

Operation context must be a JSON-compatible object. The core clones query/context before invoking providers so an adapter cannot mutate caller-owned objects accidentally.

7C-A does not define user identity, credentials or secrets in context.

## 10. Registry

`FloorPlanCostProvider.createRegistry()` creates an in-memory registry with:

- `register(provider)`;
- `unregister(id)`;
- `has(id)`;
- `get(id)`;
- `list()`;
- `inspect(id)`;
- `search(id, query, context)`;
- `getItem(id, itemId, context)`;
- `getPrice(id, itemId, context)`.

Duplicate provider IDs are rejected.

`list()` is deterministic by provider ID and exposes normalized capabilities/source metadata, not implementation internals.

No global singleton is created in this cut.

## 11. Relationship to 7B

`FloorPlanBudgetV1` 1.0.0 remains unchanged and manual-only.

A 7C-A quote is **not** persisted directly into Budget V1.0.0. 7C-C will introduce an explicit compatible budget evolution for provider provenance/reference prices.

This preserves existing 7B documents and avoids pretending that a reference quote is already a reviewed budget price.

## 12. Next cuts

- **7C-B:** `ManualCostProvider`, permanent offline fallback.
- **7C-C:** compatible evolution of `FloorPlanBudgetV1` for provider/reference provenance.
- **7C-D:** FIEBDC-3/BC3 parser.
- **7C-E:** `BCCA_ES` adapter with synthetic fixtures and legal/technical gate.
- Real BCCA data is activated only after official reuse/redistribution conditions are verified.

## 13. Non-goals

7C-A does not implement:

- Manual provider implementation;
- BCCA adapter or data;
- DDC database;
- BC3 parsing;
- network requests;
- credentials/authentication;
- caching/storage;
- automatic selection of a provider;
- automatic acceptance of a price;
- Budget V1.1 persistence;
- UI/export;
- price comparison/ranking;
- currency conversion;
- unit conversion;
- ERP/accounting/invoicing.

## First conforming provider: Manual (Point 7C-B)

`js/cost-provider-manual.js` exports `FloorPlanManualCostProvider`. It is loaded explicitly and is not registered automatically or added to the editor UI. Its stable ID is `manual`; its capabilities are `{search:false,getItem:false,getPrice:true,network:'none'}`. The core wrappers return `unsupported` for search and item lookup. Manual has no catalog, network access or storage.

`getPrice(itemId, context)` accepts an explicit item ID and `{description, unit, unitPrice, label, asOf?, code?}` in context. The adapter uses this contract's `validateQuote()` for input and returns a normalized `available` quote or `invalid` with reason `invalid-manual-input`. A missing or blank item ID is rejected by the core before invoking the adapter. Price must be a finite number at least zero; `0` is an available known price. Units are preserved without conversion. The adapter fixes `currency:'EUR'` and `priceKind:'manual'`.

The quote's `source.label` must be supplied by the professional; there is no silent default. `asOf` is an optional valid calendar date and remains `null` when unknown. `retrievedAt` remains `null`; Manual does not invent a retrieval time. Provider metadata has `kind:'manual'` and a `not-applicable` license. Quote source has `licenseStatus:'not-applicable'` and no fabricated URL, edition, region or attribution.

The quote has no review status. Entering a price does not approve a budget item. Budget V1.0.0, provider selection/fallback orchestration and the CostQuote-to-Budget bridge are outside 7C-B; 7C-C will address the latter.

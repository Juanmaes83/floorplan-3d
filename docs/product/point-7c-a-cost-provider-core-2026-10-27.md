# Punto 7C-A — FloorPlanCostProvider core

**Fecha:** 27-10-2026  
**Estado:** implementación candidata en `feat/point-7c-a-cost-provider-core`; no cierra todavía 7C completo.  
**Base exacta:** `master@bdfd1394e84df7adf856273ec9058516887f2697`.  
**Dependencias:** 7A y 7B cerrados.  
**Siguiente corte:** 7C-B — `ManualCostProvider`.

## 0. Objetivo

Crear una frontera estable entre el Budget Core y cualquier origen futuro de precios sin acoplar FLOOR PLAN 3D a BCCA, DDC, un endpoint, un formato de archivo o un proveedor comercial.

7C-A implementa solamente:

- contrato de provider;
- validación normalizada;
- envelopes de resultado;
- item/quote normalizados;
- metadata/provenance/licencia;
- registry en memoria;
- wrappers async-compatible;
- tests compartidos de contrato.

No implementa ningún proveedor real.

## 1. Decisiones que este corte cierra

### 1.1 Provider agnóstico

El consumidor conoce `FloorPlanCostProvider`, no `BCCA_ES`, Manual ni otro adaptador concreto.

### 1.2 Async-compatible desde V1

`search`, `getItem` y `getPrice` pueden ser sync o Promise. El core los consume siempre con API async.

Esto permite que 7C-B sea offline y un futuro adapter sea local/remoto sin cambiar consumidores.

### 1.3 Capabilities honestas

Cada provider declara:

```js
{
  search,
  getItem,
  getPrice,
  network:'none'|'optional'|'required'
}
```

Una operación no soportada devuelve `unsupported`; nunca se simula éxito vacío.

### 1.4 Provenance/legal explícito

Cada provider declara fuente, edición, región, atribución y estado de licencia.

Estados de licencia:

- `not-applicable`;
- `unknown`;
- `verified`;
- `restricted`.

`unknown` nunca se interpreta como autorización.

### 1.5 EUR first

El contrato de quote V1 admite EUR únicamente, alineado con Budget V1.

No hay cambio de moneda ni conversión.

### 1.6 Unidad del provider no limitada a Budget V1

Los items/quotes pueden declarar cualquier identificador de unidad no vacío.

Esto permite representar fielmente catálogos externos. 7C-C será responsable de exigir compatibilidad exacta con la partida antes de aplicar un precio; 7C-A no inventa conversiones.

## 2. API runtime

Nuevo módulo:

`js/cost-provider.js`

Namespace:

`FloorPlanCostProvider`

API pública:

- constantes de contrato;
- `inspectProvider()`;
- `validateCapabilities()`;
- `validateSourceMetadata()`;
- `validateSearchQuery()`;
- `validateItem()`;
- `validateQuote()`;
- `validateResultEnvelope()`;
- `search()`;
- `getItem()`;
- `getPrice()`;
- `createRegistry()`.

Pure UMD, CommonJS en tests y global de navegador cuando se carga explícitamente.

No DOM, almacenamiento ni red.

## 3. Provider contract

Proveedor mínimo:

```js
{
  id,
  getCapabilities(),
  getSourceMetadata()
}
```

Si una capability es `true`, se exige también el método correspondiente.

No se obliga a implementar operaciones desactivadas.

## 4. Result envelopes

Estados:

- `available`;
- `not-found`;
- `unavailable`;
- `invalid`;
- `cancelled`;
- `unsupported`.

Una excepción operacional del provider queda aislada como `unavailable/provider-error`.

Un payload mal formado produce `TypeError`, porque es un incumplimiento del contrato y no una simple indisponibilidad de datos.

## 5. Quote normalizado

El quote conserva:

- provider/item/code;
- descripción;
- unidad;
- precio unitario;
- EUR;
- `manual | reference`;
- etiqueta de fuente;
- fecha de referencia;
- fecha de obtención;
- edición;
- región;
- URL;
- atribución;
- estado/nombre/URL de licencia cuando exista.

Un precio 0 es válido.

Ausencia de precio no se representa mediante quote disponible con `null`; el provider debe devolver otro status.

## 6. Registry

Registry en memoria por ID estable.

Funciones:

- registrar;
- eliminar;
- consultar;
- listar determinísticamente;
- inspeccionar metadata/capabilities;
- ejecutar operaciones por ID.

Un provider inexistente devuelve `not-found/provider-not-registered`.

No existe singleton global ni auto-discovery.

## 7. Relación con Budget Core

`FloorPlanBudgetV1` 1.0.0 no cambia en 7C-A.

Sigue aceptando únicamente `priceSource.type = manual`.

El quote de provider todavía no se persiste como partida. Eso se hará explícitamente en 7C-C mediante una evolución compatible del contrato.

Por tanto 7C-A no puede modificar subtotales, IVA, merma, revisión ni fórmulas de 7B.

## 8. Seguridad y robustez

- inputs/context se clonan antes de entregarlos al adapter;
- contexto debe ser JSON-compatible;
- URLs normalizadas solo `http(s)`;
- provider ID y metadata deben coincidir;
- duplicate IDs rechazados;
- valores monetarios finitos y no negativos;
- `null` no se convierte en 0;
- no hay credenciales/secrets en este contrato;
- no hay red en el core.

## 9. QA dirigido

Suite nueva:

`tests/cost-provider.test.cjs`

Cobertura local previa a publicación: **34 PASS · 0 FAIL · 0 SKIP**.

Incluye:

- constantes;
- provider válido;
- IDs inválidos;
- métodos obligatorios;
- capabilities inconsistentes;
- source metadata;
- licencia explícita;
- URLs;
- search query;
- límites;
- units externas;
- provider mismatch;
- quote 0 €;
- null rechazado como quote disponible;
- EUR only;
- manual/reference;
- timestamp con offset;
- search/getItem/getPrice;
- capability disabled;
- error operacional aislado;
- payload mal formado rechazado;
- licencia de quote inválida;
- no mutación de inputs;
- context JSON-compatible;
- registry;
- duplicados;
- provider ausente;
- unregister;
- global de navegador.

CI debe ejecutar además la suite general y regresiones del repositorio.

## 10. No objetivos

Fuera de 7C-A:

- `ManualCostProvider` real;
- BCCA/BC3;
- DDC;
- datos externos;
- HTTP/fetch;
- storage/cache;
- Budget 1.1;
- aplicar quote a una partida;
- UI;
- exportación;
- comparador de proveedores;
- cambio de moneda;
- cambio de unidades.

## 11. Criterio de cierre

7C-A puede cerrarse cuando:

- `cost-provider.js` y contrato estén integrados;
- suite dirigida esté verde;
- regresiones necesarias estén verdes;
- no exista ningún provider real adelantado;
- no cambie Budget V1.0.0;
- no haya red/UI/BCCA;
- PR revisada y autorizada para merge.

Tras su cierre, el siguiente paso es 7C-B — `ManualCostProvider`.


## Incidente de CI solar

7C-A sigue **CANDIDATO EN REVISIÓN**. Diagnóstico, corrección de test y resultados en [informe de CI solar](../qa/pr-112-solar-ci-timeout-2026-10-27.md). Sin cambios de CostProvider ni inicio de 7C-B.

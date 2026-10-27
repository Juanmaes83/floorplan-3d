# Programa de capacidades — estado vigente tras el cierre del Punto 7

**Decisión original:** 25-10-2026  
**Estado actualizado:** 28-10-2026  
**Fuente canónica de estado:** [`current-status-2026-10-28.md`](current-status-2026-10-28.md)

> Este archivo ya no debe leerse como un plan previo a implementación. Los Puntos **1–7 están CERRADOS en `master`**. Se conserva esta ruta porque fue la referencia del programa y muchos PR/agentes la enlazan, pero su función actual es indicar el estado vigente y el siguiente trabajo.

## Estado del programa

| Nº | Capacidad | Estado actual |
|---:|---|---|
| 1 | Construir/medir: acceso y contexto | **CERRADO** |
| 2 | Tipo declarado de muro | **CERRADO** — PR #101 |
| 3 | Superficie estancia → planta → vivienda | **CERRADO** — PR #102 |
| 4 | Familia funcional + nombre libre de estancia | **CERRADO** — PR #103 |
| 5 | Ficha profesional de superficies | **CERRADO** — PR #104 |
| 6 | Orientación + ubicación + solar orientativo + GeoProvider | **CERRADO** — PR #106 |
| 7 | Presupuesto de acabados/materiales | **CERRADO** — PR #120 |
| 8 | Exterior V1 → V3 | **ACTUAL — 8A EN IMPLEMENTACIÓN** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Puntos 1–6

No reabrirlos ni reconstruirlos desde documentos anteriores salvo regresión reproducible o nueva decisión expresa. El detalle de estado, contratos y evidencia está resumido en [`current-status-2026-10-28.md`](current-status-2026-10-28.md) y en los PR de cierre.

### Punto 6 — definición final

El Punto 6 cerrado es:

- **6A Orientación básica**: norte declarado/configurable, visible, persistente y multiplanta.
- **6B Ubicación**: latitud, longitud y timezone IANA, manual/offline y privada por defecto.
- **6C Solar orientativo**: SunCalc 2.1.1, cambio mínimo del renderer, separación Presentación/Solar, sin pretensión científica/normativa.
- **6D `FloorPlanGeoProvider`**: frontera estable; proveedor manual activo; Catastro/IGN/CNIG/PNOA quedan para fases territoriales posteriores.

PR de cierre: **#106**, squash `422d6a893325e343e6e045805c2ec034a27ae631`.

## Punto 7 — CERRADO

El presupuesto no parte de los antiguos precios en ¥. El corte aprobado se orienta a acabados/materiales y queda cerrado en:

### 7A — Quantity Engine

Convierte conocimiento ya existente y justificable en cantidades:

- suelo m²;
- paredes m² cuando sean calculables;
- perímetros/ml;
- otras cantidades solo cuando exista evidencia suficiente.

### 7B — Budget Core

- partidas;
- cantidad;
- unidad;
- merma/exclusiones visibles;
- precio unitario introducido o revisado por profesional;
- subtotal;
- moneda EUR;
- IVA configurable;
- estado de revisión;
- procedencia y fecha del precio.

Proveedor inicial obligatorio: **Manual**.

### 7C — `FloorPlanCostProvider`

Frontera estable para precios/costes con:

- provider core agnóstico;
- Manual offline permanente;
- provenance/reference prices en Budget 1.1;
- codec FIEBDC-3/BC3;
- adapter `BCCA_ES` con fixtures sintéticos y gate técnico/legal.

Reglas que siguen vigentes:

- no depender en producción de la compilación DDC publicada bajo CC BY-NC;
- el código Apache-2.0 de `OpenConstructionEstimate-DDC-CWICR` puede servir como acelerador técnico cuando sea aplicable y se conserven avisos/licencia;
- `OpenConstructionERP` es referencia funcional/arquitectónica; no copiar código AGPL al core comercial de Rubik;
- nunca inventar un precio ausente;
- BCCA real gestionada por Rubik permanece deshabilitada hasta verificar condiciones oficiales de reutilización/redistribución comercial para el uso concreto.

### 7D — Presentación/exportación — CERRADO

PR #120, squash `69a9b20a0ceab6f379150e2c7fb0b64f7136b4f5`.

Incluye:

- resumen por estancia cuando la procedencia lo demuestra;
- por planta;
- por vivienda;
- capítulos/partidas;
- reporte estructurado JSON;
- CSV interoperable;
- futura adaptación XLSX/PDF/CRM sobre el reporte estructurado, sin recalcular el presupuesto ni introducir dependencias sólo para marcar formatos.

`FloorPlanBudget.calculateBudget()` sigue siendo la autoridad monetaria; 7D no recrea fórmulas de merma, subtotal o IVA.

### Etapa 2 posterior

**Asset Lab** para mobiliario/equipamiento/catálogo comercial cuando exista demanda. Identidad de producto, SKU, cantidades y resumen comercial son reutilizables como patrón; precio desconocido debe seguir figurando como pendiente, nunca inventado.

## Punto 8 — Exterior — ACTUAL

La secuencia aprobada es:

- **8A / V1**: paredes/fachada/materiales, puertas/ventanas visibles exteriormente, suelo/terraza/balcón. **Corte funcional actual.**
- **8B / V2**: cubierta sencilla, petos, retranqueos y volúmenes exteriores. Debe permanecer deliberadamente limitado; no resolver un generador universal de tejados. Documento obligatorio de alcance: [`point-8b-exterior-v2-roof-volumes-2026-10-27.md`](point-8b-exterior-v2-roof-volumes-2026-10-27.md).
- **8C / V3**: parcela/terreno, desniveles y contexto exterior.

Para 8B, la ruta de menor riesgo queda fijada como:

```text
8B-A
huella + superficies superiores + cubierta plana + retranqueos

8B-B
petos + volúmenes exteriores simples

8B-C
sólo si está justificado:
monopendiente / dos aguas simples con parámetros explícitos
```

No implementar un solver universal de cubiertas, ni inferir automáticamente cumbreras, limatesas, limahoyas o soluciones arquitectónicas complejas a partir de la huella. Los casos no soportados deben degradar de forma honesta o pedir parámetros explícitos.

`FloorPlanGeoProvider` puede alimentar especialmente 8C, pero no sustituye ni renumera el Punto 8. 8A y 8B deben funcionar sin proveedores territoriales.

## Punto 9 — Instalaciones ligeras

Capa de símbolos/elementos editables (electricidad, iluminación, clima, agua, datos/domótica cuando proceda), **no** cálculo MEP, dimensionado ni certificación normativa.

## Reglas permanentes

- mostrar más información sin fingir más certeza de la disponible;
- distinguir dato conocido/fuente, estimación, visualización y no disponible;
- no presentar Rubik como certificador estructural, energético, catastral, MEP ni de mediciones oficiales;
- guardar datos internos y publicarlos son decisiones separadas cuando exista privacidad relevante;
- conservar procedencia/licencia/fecha cuando se use una fuente externa;
- no reabrir Puntos 1–7 salvo regresión reproducible o nueva decisión expresa;
- no adelantar 8B/8C dentro de 8A.

Para cualquier agente: **leer primero [`current-status-2026-10-28.md`](current-status-2026-10-28.md)** y verificar el HEAD actual de `master` antes de ejecutar trabajo.

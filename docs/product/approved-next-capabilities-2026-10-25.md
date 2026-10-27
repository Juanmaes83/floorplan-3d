# Programa de capacidades — estado vigente tras el cierre del Punto 6

**Decisión original:** 25-10-2026  
**Estado actualizado:** 27-10-2026  
**Fuente canónica de estado:** [`current-status-2026-10-27.md`](current-status-2026-10-27.md)

> Este archivo ya no debe leerse como un plan previo a implementación. Los Puntos **1–6 están CERRADOS en `master`**. Se conserva esta ruta porque fue la referencia del programa y muchos PR/agentes la enlazan, pero su función actual es indicar el estado vigente y el siguiente trabajo.

## Estado del programa

| Nº | Capacidad | Estado actual |
|---:|---|---|
| 1 | Construir/medir: acceso y contexto | **CERRADO** |
| 2 | Tipo declarado de muro | **CERRADO** — PR #101 |
| 3 | Superficie estancia → planta → vivienda | **CERRADO** — PR #102 |
| 4 | Familia funcional + nombre libre de estancia | **CERRADO** — PR #103 |
| 5 | Ficha profesional de superficies | **CERRADO** — PR #104 |
| 6 | Orientación + ubicación + solar orientativo + GeoProvider | **CERRADO** — PR #106 |
| 7 | Presupuesto de acabados/materiales | **SIGUIENTE** |
| 8 | Exterior V1 → V3 | **APROBADO, POSTERIOR** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Puntos 1–6

No reabrirlos ni reconstruirlos desde documentos anteriores salvo regresión reproducible o nueva decisión expresa. El detalle de estado, contratos y evidencia está resumido en [`current-status-2026-10-27.md`](current-status-2026-10-27.md) y en los PR de cierre.

### Punto 6 — definición final

El Punto 6 cerrado es:

- **6A Orientación básica**: norte declarado/configurable, visible, persistente y multiplanta.
- **6B Ubicación**: latitud, longitud y timezone IANA, manual/offline y privada por defecto.
- **6C Solar orientativo**: SunCalc 2.1.1, cambio mínimo del renderer, separación Presentación/Solar, sin pretensión científica/normativa.
- **6D `FloorPlanGeoProvider`**: frontera estable; proveedor manual activo; Catastro/IGN/CNIG/PNOA quedan para fases territoriales posteriores.

PR de cierre: **#106**, squash `422d6a893325e343e6e045805c2ec034a27ae631`.

## Punto 7 — siguiente capacidad

El presupuesto no parte de los antiguos precios en ¥. El primer corte se orienta a acabados/materiales y se divide en:

### 7A — Quantity Engine

Convertir conocimiento ya existente y justificable en cantidades:

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

Crear una frontera estable para precios/costes.

Primer candidato español: **BCCA_ES**, únicamente después de confirmar las condiciones oficiales de reutilización del producto/endpoint concreto.

Reglas:

- no depender en producción de la compilación DDC publicada bajo CC BY-NC;
- el código Apache-2.0 de `OpenConstructionEstimate-DDC-CWICR` puede servir como acelerador técnico cuando sea aplicable y se conserven avisos/licencia;
- `OpenConstructionERP` es referencia funcional/arquitectónica; no copiar código AGPL al core comercial de Rubik;
- nunca inventar un precio ausente.

### 7D — Presentación/exportación

- resumen por estancia;
- por planta;
- por vivienda;
- capítulos/partidas;
- CSV/Excel/PDF cuando proceda;
- futura adaptación CRM mediante contrato propio, no acoplamiento directo.

### Etapa 2 posterior

**Asset Lab** para mobiliario/equipamiento/catálogo comercial cuando exista demanda. Identidad de producto, SKU, cantidades y resumen comercial son reutilizables como patrón; precio desconocido debe seguir figurando como pendiente, nunca inventado.

## Punto 8 — Exterior (se conserva)

- **V1 / 8A**: paredes/fachada/materiales, puertas/ventanas visibles exteriormente, suelo/terraza/balcón.
- **V2 / 8B**: cubierta sencilla, petos, retranqueos y volúmenes exteriores. Debe limitarse deliberadamente a geometría explícita y testeable; **no** implementar un generador universal de tejados ni inferir soluciones arquitectónicas complejas a partir de la huella. Documento de alcance obligatorio para agentes: [`point-8b-exterior-v2-roof-volumes-2026-10-27.md`](point-8b-exterior-v2-roof-volumes-2026-10-27.md).
- **V3 / 8C**: parcela/terreno, desniveles y contexto exterior.

Para 8B, la ruta de menor riesgo es: cubierta plana y superficies expuestas → petos/volúmenes simples → sólo después, si está justificado, monopendiente o dos aguas para casos geométricos cerrados y con parámetros explícitos. Los casos no soportados deben degradar de forma honesta; no se resuelven con heurísticas plausibles pero no demostrables.

`FloorPlanGeoProvider` puede alimentar especialmente V3, pero no sustituye ni renumera este Punto 8. 8A/8B deben funcionar sin proveedores territoriales.

## Punto 9 — Instalaciones ligeras

Capa de símbolos/elementos editables (electricidad, iluminación, clima, agua, datos/domótica cuando proceda), **no** cálculo MEP, dimensionado ni certificación normativa.

## Reglas permanentes

- mostrar más información sin fingir más certeza de la disponible;
- distinguir dato conocido/fuente, estimación, visualización y no disponible;
- no presentar Rubik como certificador estructural, energético, catastral, MEP ni de mediciones oficiales;
- guardar datos internos y publicarlos son decisiones separadas cuando exista privacidad relevante;
- conservar procedencia/licencia/fecha cuando se use una fuente externa;
- no adelantar Puntos 8/9 dentro del Punto 7.

Para cualquier agente: **leer primero [`current-status-2026-10-27.md`](current-status-2026-10-27.md)** y verificar el HEAD actual de `master` antes de ejecutar trabajo.

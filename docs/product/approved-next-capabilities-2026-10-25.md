# Programa de capacidades — estado vigente tras el cierre de 8B

**Decisión original:** 25-10-2026  
**Estado actualizado:** 28-10-2026  
**Fuente canónica de estado:** [`current-status-2026-10-28.md`](current-status-2026-10-28.md)

Este archivo conserva la ruta del programa, pero el estado operativo debe leerse siempre desde el estado canónico y el HEAD real de `master`.

## Estado del programa

| Nº | Capacidad | Estado actual |
|---:|---|---|
| 1–6 | Construcción, medición, superficies, clasificación, ficha profesional, orientación/ubicación/solar/GeoProvider | **CERRADO** |
| 7 | Presupuesto de acabados/materiales | **CERRADO** |
| 8A | Exterior V1 — fachada y exterior básico | **CERRADO** — PR #121 |
| 8B | Exterior V2 — cubierta y volúmenes | **CERRADO** — PR #124 + #125 + auditoría #126 |
| 8C | Exterior V3 — parcela, terreno y contexto territorial | **ACTUAL / SIGUIENTE** |
| 9 | Instalaciones ligeras | **APROBADO, POSTERIOR** |

## Punto 8 — Exterior

### 8A — CERRADO

Fachadas derivadas de geometría existente, huecos exteriores, materiales y terrazas/balcones únicamente cuando están declarados. No crea un segundo edificio ni depende de proveedores territoriales.

### 8B — CERRADO

El corte V2 cerrado comprende:

- cubierta plana sobre huellas demostrables;
- retranqueos ortogonales soportados y superficies `exposed-roof`;
- niveles/elevaciones/offsets desde `FloorPlanBuildingV1`;
- petos sólo mediante intención explícita `roofParapet`;
- volúmenes exteriores simples derivados;
- persistencia de intención, nunca de mallas derivadas;
- integración con renderer, Presentación, Recorrer, Solar y capturas;
- exportación documentada con omisiones honestas;
- abstención explícita en topología o evidencia insuficiente.

La auditoría final #126 reforzó la huella para que un ciclo de fachada no se considere cuerpo válido si no encierra completamente las estancias interiores soportadas. Incluye el caso de aristas de habitación que salen por una concavidad aunque todos sus vértices estén dentro.

Documento de cierre: [`point-8b-closure-2026-10-28.md`](point-8b-closure-2026-10-28.md).

### 8B-C — DIFERIDO

Las cubiertas inclinadas simples eran una ampliación opcional, no el mínimo obligatorio del Punto 8B. `mono-pitch` / `gable`, pendientes, direcciones y cumbreras quedan diferidos hasta una decisión futura explícita.

No implementar un solver universal de cubiertas ni inferir automáticamente cumbreras, limatesas, limahoyas o soluciones arquitectónicas complejas.

## 8C — Parcela, terreno y contexto territorial — ACTUAL

8C es un problema distinto de 8B. Debe aportar contexto territorial sin elevar artificialmente la certeza del proyecto.

La secuencia interna recomendada es:

```text
8C-A
GeoProvider / contratos territoriales
→ capacidades normalizadas
→ procedencia / fecha / condiciones de uso
→ UI agnóstica de proveedor

8C-B
parcela / referencia / geometría territorial
→ separar geometría fuente de geometría editable
→ proveedor real sólo cuando esté técnica y legalmente verificado

8C-C
ortofoto / contexto
→ cobertura y atribución explícitas
→ no asumir disponibilidad de IGN/CNIG/PNOA

8C-D
elevación / terreno
→ superficie de contexto
→ no cálculo geotécnico
→ no precisión topográfica certificada

8C-E
integración exterior final
→ edificio + parcela + terreno + orientación + contexto
→ presentación
→ exportación sólo cuando el contrato lo permita
```

Esta secuencia es un plan de implementación, no una afirmación de que proveedores concretos estén disponibles.

## `FloorPlanGeoProvider`

La frontera ya existe y el proveedor Manual es la capacidad segura/offline actual. 8C debe extender la frontera mediante capacidades normalizadas y adapters, no incrustar lógica de Catastro/IGN/CNIG/PNOA directamente en UI, renderer o contratos de proyecto.

Reglas permanentes:

- una fuente externa debe conservar procedencia y fecha/cobertura;
- licencia/condiciones de uso y atribución deben verificarse para el servicio concreto antes de activarlo;
- geometría fuente/oficial y geometría editable deben mantenerse separadas;
- un dato territorial de contexto no es una certificación catastral, topográfica, geotécnica o normativa;
- proveedor no disponible debe degradar a `unavailable`, no inventarse ni simularse como real;
- 8C no debe romper Manual/offline.

## Punto 9 — Instalaciones ligeras

Capa de símbolos/elementos editables (electricidad, iluminación, clima, agua, datos/domótica cuando proceda), **no** cálculo MEP, dimensionado ni certificación normativa.

## Reglas permanentes

- mostrar más información sin fingir más certeza de la disponible;
- distinguir dato fuente, dato editable, derivación, estimación, visualización y no disponible;
- no presentar Rubik como certificador estructural, energético, catastral, topográfico, geotécnico o MEP;
- no reabrir 1–8B salvo regresión reproducible o nueva decisión expresa;
- para cualquier agente: leer primero [`current-status-2026-10-28.md`](current-status-2026-10-28.md) y verificar `master` antes de trabajar.

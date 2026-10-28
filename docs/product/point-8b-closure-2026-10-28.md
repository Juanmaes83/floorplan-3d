# Punto 8B — cierre canónico — 28-10-2026

**Estado:** CERRADO  
**Predecesor:** 8A / Exterior V1 — CERRADO  
**Sucesor:** 8C / Exterior V3 — parcela, terreno y contexto territorial

## Implementación cerrada

| Corte | PR | Squash en `master` |
|---|---:|---|
| 8B-A — huella, cubierta plana, retranqueos | #124 | `7dc8b41aa21a37ebbb59ccf4855a2f4cbaf5ba4d` |
| 8B-B — petos declarados y volúmenes simples | #125 | `be8374f85512f19fdec0c5b6660095201594fd01` |
| Auditoría geométrica final A+B | #126 | `581da1a24d8600b89ed20c5558cfe6195cafdd49` |

8A, autoridad exterior de entrada, quedó cerrada previamente por PR #121, squash `10872796080a5b731290d45f1a3d6770dd00f7bf`.

## Alcance que se considera cerrado

8B proporciona una lectura exterior superior y volumétrica **limitada, explícita y conservadora**. No intenta ser un generador universal de tejados.

Queda cerrado:

- ciclo de fachada demostrable desde 8A;
- huella exterior derivada por semigrosor real de muro;
- canonicalización, winding, autointersección, miter y tolerancias centralizadas;
- validación de que las estancias interiores soportadas quedan completamente dentro/sobre la huella, no sólo sus vértices;
- cubierta plana superior;
- superficies inferiores `exposed-roof` en diferencias ortogonales soportadas;
- solape y voladizo como relaciones geométricas, sin estructura inferida;
- una y dos plantas con `elevationMm` y `offsetMm` desde `FloorPlanBuildingV1`;
- petos exclusivamente declarados mediante `roofParapet`;
- volúmenes exteriores simples reutilizando `FloorPlanRoof`;
- materiales/fallback visual sin capas constructivas inventadas;
- renderer Three.js, normales `+Y`, control «Exterior», Recorrer, Presentación, Solar y capturas;
- JSON/ZIP persistiendo sólo intención editable;
- exportadores auditados y límites explícitos.

## Guardrail de huella tras auditoría #126

La auditoría final encontró un caso de falsa certeza: un ciclo cerrado de muros de fachada podía corresponder a un patinillo interior o dejar estancias fuera, y aun así generar cubierta y volúmenes `available`.

La regla final de `FloorPlanRoof.footprint` exige que las estancias interiores que 8A usa como ocupación queden encerradas por la huella exterior soportada:

1. todos sus vértices están dentro o sobre el borde;
2. cada arista se divide por sus contactos reales con el perímetro exterior;
3. contactos tangenciales y solapes colineales con el borde son válidos;
4. cada intervalo no degenerado debe permanecer dentro o sobre la huella;
5. si una arista sale por una concavidad y vuelve a entrar, se abstiene.

Resultado de abstención:

`unavailable / room-outside-facade-cycle`

Esto evita que 8B-B herede una huella falsa y derive de ella petos, volúmenes o `exposed-roof` incorrectos.

## Soporte exacto

### Soportado

- rectángulos;
- L/U y concavidades simples que superan las validaciones de huella;
- espesores de muro distintos con intersecciones y miters válidos;
- superficies superiores pequeñas válidas sin umbral de producto;
- una planta;
- dos plantas con huella igual;
- retranqueos ortogonales;
- tangencia y solape parcial soportados;
- offsets entre niveles;
- voladizo como geometría, sin apoyos;
- petos explícitos con altura válida y material mural opcional;
- contactos de estancia con el borde y aristas coincidentes con el borde cuando siguen dentro de la huella.

### No soportado / abstención explícita

- fachada abierta o ramificada;
- varios ciclos independientes;
- clasificación 8A incompleta;
- ciclo que no encierra completamente las estancias interiores soportadas;
- topología degenerada o autointersectada;
- offset exterior inválido / miter patológico;
- alturas de fachada heterogéneas;
- retranqueos no ortogonales distintos que requieren Boolean general;
- huecos interiores/patios no expresables por el soporte actual;
- múltiples cuerpos arbitrarios;
- CSG general;
- masas freeform;
- estructura, cargas, pilares o vigas inferidos;
- impermeabilización, aislamiento, drenaje o normativa;
- parcela, terreno y contexto territorial.

## Persistencia y compatibilidad

- 8B-A no añade campos persistentes.
- 8B-B añade sólo la intención opcional `roofParapet` desde ProjectV1 1.8.0.
- ProjectV1 1.0–1.7 no admite `roofParapet` y abrir documentos antiguos no migra ni eleva versión automáticamente.
- JSON/ZIP conservan intención editable; **derived geometry not persisted**.
- Huellas, triangulación, superficies expuestas, caras y mallas se recalculan en runtime.

## Presentación y navegador

- «Exterior» activa/desactiva la lectura de cubierta/petos/volúmenes;
- Recorrer oculta el exterior y lo restaura al volver a órbita;
- Presentación oculta el exterior para mantener la lectura interior y restaura el estado;
- PNG y captura de entrega usan la visibilidad real;
- Solar conserva su matemática y sus contratos existentes.

## Exportadores

| Exportador | Estado 8B |
|---|---|
| PNG 3D / captura de entrega | Incluye lo visible del renderer |
| JSON/ZIP | Persiste sólo intención editable (`roofParapet`) |
| GLB/Blender offline | No incluye la envolvente 8B completa; omisión explícita |
| Exportación de una planta | Conserva sólo lo permitido por el contrato de esa planta |
| Predicciones crudas de muros | Fuera del modelo 8B |

No se presenta ningún exportador parcial como si incluyera toda la envolvente.

## Evidencia de cierre

Auditoría final, HEAD de PR #126:

`d94206b18937c878ab2557ba7e282b975b2a42e8`

Resultados locales reportados y revisados:

- tests específicos relevantes: **34/34 PASS**;
- suite Node no-browser: **528 PASS, 0 FAIL, 2 SKIP** opcionales;
- Chromium: **24/24 PASS**;
- `node --check`: PASS;
- `git diff --check`: PASS.

Resultados GitHub sobre ese HEAD:

- Guided experience: **SUCCESS**;
- Point 6 solar and compatibility: **SUCCESS**;
- Multiformat guided import: **SUCCESS**;
- Vercel: **SUCCESS**;
- sin hilos de revisión pendientes;
- PR `mergeable: true` antes del merge.

PR #126 se fusionó con squash `581da1a24d8600b89ed20c5558cfe6195cafdd49` y `[skip ci]` únicamente para no repetir en `master` la suite ya validada sobre el HEAD exacto.

## Decisión sobre 8B-C

8B-C — cubiertas inclinadas simples — se **difiere por alcance**.

El documento de diseño de 8B permitía `mono-pitch` / `gable` sólo como ampliación posterior y explícita, una vez estabilizada la base plana. No era requisito obligatorio para el primer V2 defendible.

No se introducen ahora:

- `roof.kind` adicional;
- pendiente;
- dirección;
- eje de cumbrera;
- nuevos faldones;
- nueva UI;
- persistencia adicional;
- solver de encuentros.

Si se retoma, requerirá una decisión de producto explícita y un corte separado. **8B-C no bloquea este cierre.**

## Resultado

**PUNTO 8B CERRADO.**

El siguiente trabajo funcional es **8C — parcela, terreno y contexto territorial**.

Principio que continúa vigente:

> Más contexto, no más falsa certeza.

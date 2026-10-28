# Punto 8B-B — petos declarados y volúmenes exteriores simples — CERRADO

**Implementación:** PR #125  
**Base funcional:** 8B-A fusionado en PR #124  
**HEAD final de #125:** `e89a7af163ccb8cdcfb75c7d2b1f7bbcdcd85d8d`  
**Squash de #125:** `be8374f85512f19fdec0c5b6660095201594fd01`  
**Auditoría geométrica final de 8B:** PR #126, squash `581da1a24d8600b89ed20c5558cfe6195cafdd49`

## Autoridad y persistencia

`FloorPlanExteriorVolumes` consume el resultado de `FloorPlanRoof` de 8B-A. No vuelve a recorrer muros, normalizar huellas, calcular offsets ni diferencias entre plantas. La autoridad durable sigue siendo `FloorPlanProjectV1` y, cuando hay edificio, `FloorPlanBuildingV1` (`elevationMm`, `offsetMm`, `order`).

El resultado puro contiene `volumes` y `parapets`, sin objetos Three.js. **Derived geometry not persisted.**

El único campo durable añadido es `project.roofParapet` o `levels[].project.roofParapet`, opcional desde ProjectV1 1.8.0:

`{enabled:boolean,heightMm?:integer,materialId?:materialId}`

La auditoría de schema previa al merge dejó alineados JSON Schema y `Core.validate()`: ProjectV1 1.0–1.7 no puede declarar `roofParapet`; 1.8.0 sí. Abrir documentos antiguos no crea el campo ni eleva versión automáticamente.

## Petos

Ningún peto se infiere de cubierta, retranqueo, terraza o balcón.

Con `enabled:true` se exige altura entera declarada de 100–3000 mm. `materialId` opcional debe referir a material mural existente. Sin material se usa un fallback visual neutro. La altura no representa cumplimiento normativo ni requisito de seguridad.

Para cubierta superior, el peto sigue el perímetro demostrado. En superficies inferiores expuestas por retranqueo, sólo se admiten bordes exteriores demostrables; se excluyen costuras entre celdas y el borde interior contra el cuerpo superior.

## Volúmenes exteriores simples

Cada volumen reutiliza la huella canónica ya demostrada por 8B-A en coordenadas del edificio.

- `zBottom`: elevación del nivel;
- `zTop`: cota superior uniforme demostrada por 8B-A;
- `offsetMm`: autoridad de `FloorPlanBuildingV1`;
- `zTop > zBottom` obligatorio;
- falta de huella/cotas demostrables → `unavailable`.

Un voladizo es sólo una relación geométrica. No genera pilares, vigas ni apoyos inferidos.

La auditoría #126 no cambió `FloorPlanExteriorVolumes`; reforzó su entrada: una huella de `FloorPlanRoof` ya no puede quedar `available` si el ciclo de fachada no encierra completamente las estancias interiores soportadas, incluidas sus aristas en concavidades.

## Visualización

«Exterior» sigue siendo el único control para cubierta, petos y lectura de cuerpos exteriores. Recorrer y Presentación los ocultan para mantener accesible el interior y restauran el estado al salir.

PNG y captura de entrega reflejan la visibilidad real del renderer. La escena se reconstruye con la arquitectura, no en cada frame.

## Cobertura de exportación

| Exportador | Incluye 8B-B | Límite |
|---|---|---|
| PNG 3D y captura de entrega | Sí, si «Exterior» está visible | Imagen del renderer, sin geometría editable |
| JSON/ZIP editables | Sólo intención `roofParapet` | Huellas, caras y mallas se derivan al abrir |
| GLB/paquete Blender offline | No | No es exportación exterior completa ni edificio multipiso |
| Exportación de una planta desde edificio | Sólo declaración de esa planta | Omite relación, offsets y otras plantas según contrato existente |
| Predicciones crudas de muros | No | Formato ajeno a la escena derivada |

La omisión de geometría 8B en exportadores independientes se considera un límite explícito, no soporte implícito.

## Casos y límites

Se admiten las huellas que 8B-A declara disponibles, una o dos plantas, huellas iguales, retranqueos ortogonales, offsets y solape parcial/voladizo geométrico. Cada nivel conserva su propia cota demostrada y su propia decisión de peto.

Quedan fuera:

- petos inferidos;
- barandillas calculadas;
- masas freeform;
- elementos curvos;
- pilares/vigas/apoyos derivados;
- CSG general;
- solver de cubiertas inclinadas;
- estructura, cargas, normativa o solución constructiva.

## Evidencia de cierre

Antes del merge de #125:

- 10/10 tests puros específicos de 8B-B;
- suite no-browser: **525 PASS, 0 FAIL, 2 SKIP** opcionales;
- schemas Python: **13/13 PASS**;
- Chromium: **24/24 PASS**;
- cinco workflows de la PR y Vercel: **SUCCESS**.

La auditoría posterior #126 validó 8B-A + 8B-B de forma adversarial y corrigió la falsa certeza de huella. Su HEAD final `d94206b18937c878ab2557ba7e282b975b2a42e8` terminó con **528 PASS, 0 FAIL, 2 SKIP** en Node, **24/24** Chromium y Guided/Solar/Multiformat/Vercel verdes.

8B-B queda cerrado dentro del Punto 8B cerrado. 8B-C queda diferido por alcance; 8C pasa a ser el siguiente trabajo funcional.

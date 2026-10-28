# Punto 8C-E — integración territorial final

Estado: **CERRADO**.

Base funcional: `master` `51a3a07b16da8876ab32189b8db9db18eb182c12` (8C-D cerrado).
PR: **#132** `feat/point-8c-e-territorial-integration`.
HEAD final revisado: `482a2b8a8bef15f33c16de5580713a45b9941a30`.
Squash en `master`: `012fb1409f1e73f4ca3c088aea0bb8682bec3197`.

## Colocación explícita y autoridad espacial

Project 1.12 / Building 1.5 añaden `site.buildingPlacement`. Building mantiene esta autoridad exclusivamente en la raíz. La lectura no migra proyectos antiguos; escribir placement eleva la versión; retirarlo no la reduce.

El usuario selecciona un punto parcel-local y lo vincula al ancla indicada del modelo. No hay detección de edificio ni geolocalización automática. `northOffsetDeg` sigue siendo la única autoridad de norte: no existe una segunda rotación de placement.

Cadena cerrada:

```text
CRS fuente
→ parcel.frame
→ parcel-local
→ buildingPlacement + northOffsetDeg
→ marco Project/Building existente
→ renderer existente
```

Para puntos de modelo M, ancla A y ancla parcel-local P:

```text
parcelLocal = P + R(-northOffsetDeg) × (M − A)
model       = A + R(+northOffsetDeg) × (parcelLocal − P)
renderer XZ = (model − level.offsetMm − geometry.center) / 1000
renderer Y  = terrainElevationM − modelZeroElevationM − level.elevationMm / 1000
```

Los CRS fuente nunca se entregan directamente a Three.js. La geometría editable, offsets de plantas y Solar no se rotan ni desplazan. Tests cubren norte 0°, 90°, 37°, inversa y offsets/elevación distintos de cero. `exportLevel` resta offset al ancla del modelo y suma elevación a `modelZeroElevationM`, conservando la misma posición física.

La cota vertical es opcional y explícita: introducida por el usuario o derivada mediante una acción expresa sobre el TerrainGrid disponible. No existe alineación automática de planta cero. Quitar o actualizar terreno no mueve automáticamente el edificio ni borra la decisión vertical guardada.

## Runtime, capas y limpieza

Parcela, ortofoto, terreno y norte se renderizan en un grupo de contexto independiente. El edificio conserva sus transformaciones. El contexto no participa en picking ni en colliders de Walk.

Blob/object URL y TerrainGrid son de sesión; JSON/ZIP guardan únicamente snapshots y placement. No se recuperan assets remotamente al cargar. Cambio de propietario, parcela o snapshot incompatible invalida assets. Sustitución/eliminación revoca URL; reconstrucción/salida dispone geometrías, materiales y texturas.

### Independencia Ortofoto / Terreno

La revisión final detectó una incoherencia menor: la ortofoto drapeada usaba `['orthophoto','terrain']` también como control de visibilidad. Se corrigió antes del merge:

- mesh terrain → `territoryLayers = ['terrain']`;
- mesh ortofoto → `territoryLayers = ['orthophoto']`;
- cuando la ortofoto utiliza la geometría terrain, conserva las **policies/licencias de ortofoto + terrain** para atribución/exportación.

La regresión browser prueba:

- Ortofoto ON / Terreno OFF → ortofoto visible y terrain oculto;
- Ortofoto OFF / Terreno ON → ortofoto oculta y terrain visible.

Los créditos siguen siendo correctos: la ortofoto drapeada reconoce también la fuente terrain cuya geometría utiliza.

## Presentación móvil y framing

El botón `#presentationBtn` abre `#presentationConfig`; el CTA real dentro del diálogo es **Iniciar presentación**. La regresión usa el CTA acotado al diálogo y acción real, sin `force:true`, cierre artificial ni cambios de z-index.

Se corrigió el layout móvil del diálogo para permanecer dentro del viewport dinámico. 390×844 y 844×390 pasan.

La inspección visual detectó además que el límite de distancia de OrbitControls recortaba el encuadre territorial. La vista de contexto amplía temporalmente ese límite y el far plane, y los restaura al volver a habitación/editor. No cambia el algoritmo de framing de habitaciones.

Presentación valida configuración → contexto exterior → habitación → salida y restaura cámara, target, quaternion, opciones, capas, reveal/sección y Solar/luz. Los stops interiores conservan su framing.

## Solar y Recorrer

Solar mantiene su matemática. `northOffsetDeg` continúa siendo única autoridad; placement no introduce doble norte.

El contexto territorial no se usa como collider. La comparación nueva de Walk con/sin contexto —placement no cero, norte 37° y terrain visible— conserva origen, altura de cámara 1.6 m, puertas y movimiento real.

Los 10 fallos de las suites Walk antiguas siguen documentados como baseline previo: reproducen exactamente nombres, mensajes y ubicaciones en `master` base y rama, con 0 fallos nuevos. No se modificó Walk ni se debilitaron sus tests.

## Salidas y licencia

Decisión exclusivamente desde snapshots, sin ramas por provider:

- `not-applicable` → exportable;
- `verified` + atribución no vacía → exportable;
- `restricted` → no autoexport;
- `unknown` → no autoexport.

Mostrar una fuente internamente no autoriza exportarla. Los créditos se deduplican y ordenan de forma estable.

Captura y delivery filtran temporalmente el grupo y restauran visibilidad. Share usa el pipeline de delivery. GLB/Blender conservan su perfil geométrico local y omiten contexto territorial. Vídeo TourRecorder omite contexto conservadoramente porque su contrato actual no incorpora estos créditos.

Matriz final: `docs/product/point-8-final-audit-2026-10-28.md`.

## Evidencias locales

- Integración/core/Project/Building: 66/66 PASS.
- Parcel/orthophoto/terrain/exterior/roof/volumes/Solar core: 66/66 PASS.
- JSON Schema independiente: 25/25 PASS.
- Node no-browser: 569 casos; 567 PASS, 0 FAIL, 2 SKIP (Blender/bpy no configurado).
- Browser específico 8C-E: 3/3 PASS.
- Terrain browser: 2/2 PASS.
- Privacidad F2: 4/4 PASS.
- Building Presentation: 7 PASS en regresión específica.
- `node --check`: PASS.
- `git diff --check`: PASS.

Resultado browser amplio: 104 PASS / 1 FAIL histórico de aspect ratio, reproducido también en master base. Regresión Walk/Journey/Building Presentation: 24 PASS / 10 FAIL Walk; los diez fallos Walk coinciden exactamente con master base y no son regresiones 8C-E.

Detalles completos: `docs/qa/point-8c-e-local-validation-2026-10-28.md`.

## CI y merge finales

HEAD final antes del merge: `482a2b8a8bef15f33c16de5580713a45b9941a30`.

Todos los workflows naturales finales terminaron en `success`, sin reruns manuales:

- Guided experience;
- Rubik local MCP;
- Point 8C-C orthophoto context;
- Point 8C-D terrain context / integración 8C-E;
- Integrated browser regressions;
- Point 6 solar and compatibility;
- Multiformat guided import.

PR #132 se fusionó con squash y `expected_head_sha` fijado. Squash final: `012fb1409f1e73f4ca3c088aea0bb8682bec3197`, con `[skip ci]` para no repetir en `push` a master la validación ya ejecutada sobre el HEAD exacto.

## Límites del cierre

Sin nuevos providers, red automática, detección del edificio, alineación automática floor0↔terrain, certificación catastral/topográfica, geotecnia ni cambio de matemática Solar. Runtime territorial no se persiste. GLB/Blender/vídeo no adquieren contexto territorial que su contrato no pueda atribuir correctamente.

**8C-E queda CERRADO.** El cierre global de Punto 8 se documenta en `docs/product/point-8-final-audit-2026-10-28.md`.

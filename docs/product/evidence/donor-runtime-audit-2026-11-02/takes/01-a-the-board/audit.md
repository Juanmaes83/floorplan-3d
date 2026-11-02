# 01-a · The Board — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo una **casa de madera authored** pasa de capas legibles en un dibujo axonométrico a un volumen que se puede recorrer. El servicio observable es comprensión de relaciones entre componentes y espacio interior. La demo no certifica estructura, secuencia de obra ni especificaciones trasladables a otro proyecto. Evidencia: donor README y recorrido continuo desktop/portrait/landscape en RAW.

## Identidad y control

- Rubik baseline: `0f9c6ead9732901681498efec326d1ca92e42ffe`; branch `audit/donor-runtime-7x14-2026-11-02`.
- Donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`; selector `https://sam1983aing.github.io/flat-to-3d/#01`; standalone y final `https://sam1983aing.github.io/flat-to-3d/01-exploded-house/index.html?dir=a`.
- Source entrypoint: `01-exploded-house/index.html`; source runner `01-exploded-house/main.js`, take `dir-a.js`.
- Tooling: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR real 1 en los tres viewports.
- Cada viewport tuvo calibración descartada, contexto limpio de Discovery forward/reverse y contexto limpio de Semantic. El intro temporal se dejó estabilizar 4.5 s antes de A0; la primera tentativa desktop con intro inestable fue descartada y reemplazada.

## Evolución observada

Los vídeos Discovery y Semantic, telemetría NDJSON y muestras de seguridad están en `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\01-a-the-board`. Las muestras del 5 % no son milestones.

| Milestone | Estado/cambio observado | Centro nativo D/P/L | Donor source | Cuts/Atlas | Continuidad |
|---|---|---|---|---|---|
| M01 | Floor slab lands on the drawn sheet; first assembly layer. | 0.0889 / 0.0882 / 0.0883 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M02 | Structural walls drop into position while higher layers retain their relation. | 0.1422 / 0.1411 / 0.1413 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M03 | Glazing slides into the same building shell. | 0.1956 / 0.2029 / 0.2031 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M04 | External cladding panels close around the same openings. | 0.2578 / 0.2558 / 0.2561 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M05 | Rafters settle over the same walls. | 0.3111 / 0.3175 / 0.3179 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M06 | Roof panels complete the six-layer assembly. | 0.3733 / 0.3705 / 0.3709 | dir-a.js:316-390 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M07 | Whole building reads as a closed volume in axonometric projection. | 0.4444 / 0.441 / 0.4416 | dir-a.js:340-361 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M08 | Long-lens axonometric view opens to eye-level perspective at the glazed porch; sliding door opens. | 0.6222 / 0.6174 / 0.6182 | dir-a.js:340-391; core.js:312-348 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M09 | Camera passes the same glazed threshold and enters the dining room. | 0.7111 / 0.7056 / 0.7066 | dir-a.js:340-368 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M10 | Walk reaches kitchen, lounge and stove. | 0.8 / 0.8027 / 0.8037 | dir-a.js:340-368 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M11 | Camera rises to the same building's mezzanine loft. | 0.8889 / 0.8909 / 0.892 | dir-a.js:340-368 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |
| M12 | Final camera looks back across the long room from the loft/ridge. | 0.9867 / 0.9879 / 0.9892 | dir-a.js:340-368 | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |

El end B es el vistazo desde el loft al Long Room. Se alcanzó scroll máximo mediante wheel natural, se añadieron dos wheel events sin nuevo estado importante y se esperó estabilización. Reverse ocurrió sin recarga ni reset; los tres viewports retornaron a scrollY 0 y a la composición A0. Veredicto: `VISUALLY_EQUIVALENT`, porque camera/material/geometry internos no se observaron pasivamente. No hay reverse-only milestone demostrado; el vídeo inverso muestra la visita y las capas replegándose en orden inverso.

## Viewports

| Viewport | A→B→A | Runtime support | Evidencia / límite |
|---|---|---|---|
| Desktop 1440×900 | 0 → 8100 → 0 | SUPPORTED | Seis capas, transición a perspectiva, puerta y cuatro stops interiores visibles |
| Portrait 390×844 | 0 → 7596 → 0 | SUPPORTED | Phone layout del source y progresión completa; algunas vistas recortan bordes del edificio |
| Landscape 844×390 | 0 → 3510 → 0 | DONOR_LIMITATION | Source usa phone sólo si width<700; desktop HUD, radar, etiquetas y caption se solapan en poco alto. La evolución y reverse siguen funcionando. |

## Reconciliación por milestone

M01–M06: `dir-a.js:316-390` crea ORDER de seis grupos authored y evalúa lift/pull absoluto. El dibujo, openings y techo siguen siendo el mismo modelo. Cut 2 §23 D10 lo documentó; el runtime continuo lo confirma y amplía temporalmente. Rubik ya deriva Project/Building geometry y FT3D-5 despiece **por niveles**; no existe evidencia de pertenencia genérica de componentes estructurales. Gap: decisión de servicio/semántica y posible orquestación, no ausencia del renderer.

M07–M08: `dir-a.js:340-391` y `core.js:312-348` cambian el encuadre de 1.5° a perspectiva y abren la puerta por Z; `main.js:120-184` suaviza el progreso nativo. Cut 1 D01 y Global D13 separan cámara y handoff. Rubik conserva su cámara, Story y route authority; la trayectoria authored del donor no se importa como ruta de proyecto.

M09–M12: `dir-a.js:340-369` define los stops porch/dining/living/loft/ridge. El runtime muestra muebles, huecos y techo continuos, luego cambia la cámara. Rubik tiene room descent, minimap y player; una visita de un proyecto real debe consumir rutas/stops válidos del host, no las coordenadas de esta casa.

No se encontró conflicto nuevo runtime/source/Cut. El Atlas histórico enumera categorías conceptuales adicionales; Cut 2 C2-CC1 y Global D10 ya distinguen esas categorías de las seis capas authored.

## Rubik, gaps y bridge documental

El crosswalk completo de 12 dimensiones está en `manifest.json`. Hay capacidades reutilizables de datos, geometría, Story, cámara, UI móvil, restore, salidas y QA. Las diferencias concretas son membership honesto de componentes, anotaciones ligadas a matrices y orquestación de la lectura con una visita validada. La clasificación propuesta es `PRODUCT_DECISION_REQUIRED` + `ORCHESTRATION_GAP`; el posible bridge es `ADAPT_EXISTING`, `implementationAuthorized:false`. No es una decisión de prioridad ni de fusión con FT3D-5.

## Known unknowns y QA derivada

No se observó pasivamente el estado interno exacto tras reverse; por eso no se declara RESTORED. Para una futura verificación interna haría falta un snapshot read-only acotado. Los invariantes QA futuros están en el manifest: semántica honesta, ownership disjunto, continuidad de cámara, restore, móvil y regresión FT3D-5. No se implementó ninguno.

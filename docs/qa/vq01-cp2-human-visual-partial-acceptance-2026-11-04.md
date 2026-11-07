# Decisión humana CP2 — VISUAL_PARTIAL_ACCEPT_FOUNDATION

**Emitida por:** propietario del proyecto Rubik (Juanma), en esta conversación el 2026-11-04.  
**Decisión literal:** «Apruebo VISUAL_PARTIAL_ACCEPT_FOUNDATION para CP2: conservar B2 como base material, registrar la decisión en GitHub, mantener las mejoras pendientes para Visual Families y preparar la integración segura sin fusionar automáticamente.»

**Estado de decisión:** `HUMAN_VISUAL_PARTIAL_ACCEPT_FOUNDATION`  
**Estado técnico:** `TECHNICAL_PASS`  
**Calidad profesional final de Rubik:** `NOT_CLAIMED`  
**Autorización de merge a `master`:** `NOT_GRANTED`

## 1. Candidato, línea base y evidencia verificada

- `A0`: `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
- `B1`: `fac408025c9cc11ed554f6f395cd3153d1838861`
- **`B2`: `feat/vq-01-material-fidelity-foundation@894607b38fa43a5e89a9f5296a41cdbcc989d5ce`**
- [CI final CP2 — run 41802674784: SUCCESS](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41802674784)
- [Artefacto final A0/B1/B2 — 13310485726](https://github.com/Juanmaes83/floorplan-3d/actions/runs/41802674784/artifacts/13310485726)
- [PR de integración, **draft y sin merge** — #165](https://github.com/Juanmaes83/floorplan-3d/pull/165)
- [Checkpoint técnico detallado](./vq01-cp2-ci-success-human-visual-handoff-2026-11-04.md)

`review/comparison.json` del artifact histórico contiene `visualVerdict=PENDING_JUANMA` porque **fue generado ANTES de esta decisión humana**. No modificar ni reescribir el artefacto histórico. Este documento posterior registra la decisión humana y prevalece como **acta de aceptación parcial**; no altera su reproducibilidad ni convierte el comparador en un evaluador de calidad.

## 2. Alcance de la aceptación

1. Conservar el mecanismo B2 de fidelidad material —mapas deterministas de color/normal/roughness, su ownership en SurfaceRenderer, sus límites de recursos y su lifecycle— como **fundación técnica aceptada parcialmente en lo visual**.
2. Reconocer una **mejora perceptiva especialmente evidente en madera**, validada por observación humana; `TIMBER_CLOSEUP B1→B2≈39.8%` píxeles cambiados acompaña a una mejora perceptiva observada. La cifra **no equivale** a 39.8% de calidad ganada, ni basta por sí sola para declarar mejoras.
3. Mantener y documentar los límites por familia: piedra beige con juntas y detalles no inventados; yeso quizá demasiado plano; hormigón con posible uniformidad/repetición; vidrio/metal sin salto óptico; vista general prácticamente inalterada respecto de B1.
4. El `GLOBAL B1→B2≈1.19%` de píxeles cambiados **no invalida** la mejora local de madera: el material ocupa poca superficie de esa vista.
5. **No convertir la aceptación parcial en `VISUAL_PASS_CP2` pleno, ni en declaración de fotorrealismo alcanzado.** La fase de iluminación, fachadas, ventanas y presentación sigue pendiente.
6. Mantener `B2` intacto como evidencia de lo que se aprobó; cualquier ampliación visual posterior requiere fixture y comparación propios.

## 3. Trabajo pendiente derivado a VISUAL FAMILIES

Fuente y alcance: [Rubik Visual Families + Residential Experience — roadmap](../research/vecinia/rubik-visual-families-integration-roadmap-2026-11-04.md).

| Prioridad | Familia / mejora | Gap trasladado | Autoridad / condición |
|---|---|---|---|
| P1 | Ventanas, marcos, jambas, contraventanas y Three-Fenestra opcional | Vidrio plano y profundidad insuficiente | Huecos reales Rubik; `InteriorMappingMaterial` sólo para contexto/modo ilustrativo declarado |
| P1 | Familias de casas — villas, townhouses, casco antiguo, ladera | Ausencia de diversidad residencial en presentaciones | Recetas y builders semánticos de VECINIA; no reemplazar estructura del inmueble Rubik |
| P1 | Fachadas, estuco, piedra, madera, cerámica, cubierta | Escala y detalle del acabado; reproducibilidad y criterios por familia | `SurfaceCatalog` / `SurfaceRenderer` siguen siendo autoridad |
| P2 | Piscinas, pérgolas, terrazas, balcones, barandillas y mobiliario | Carencia de riqueza exterior comercial en fixture CP2 | Geometría real donde existe; resto de contexto `VISUAL_ONLY` |
| P2 | Vegetación mediterránea, jardines, árboles | Escena poco contextualizada | Landscape/territory con perfiles HERO/MIDGROUND/BACKGROUND |
| P3 | Mar, costa, playa, puerto, embarcaciones, agua | Contexto costero | Workstream exterior con presupuesto GPU |
| P3 | Gaviotas, coches, barcos, delfines y vida ambiental | Falta de movimiento y escala humana/ambiental | Contexto ilustrativo reversible y animación bajo presupuesto |
| P4 | Iluminación, sombras, estados de luz, recorridos vídeo | Escena GLOBAL poco profunda; profesionalidad visual no alcanzada | Nueva evidencia A/B y vídeo, QA técnico + gate humano |

**Metodología:** `REFERENCIAS PROFESIONALES → FAMILIA SEMÁNTICA + RECETA → IMPLEMENTACIÓN → RENDER/VÍDEO → CRÍTICA DE DEFECTOS DOMINANTES → CORRECCIÓN Y REPETICIÓN → QA → GATE HUMANO → VERSIONAR Y PROPAGAR`. Los cambios de píxeles pueden apoyar una mejora cuando coincide con el juicio humano, pero no lo sustituyen.

## 4. Integración segura pendiente: NO MERGE AUTOMÁTICO

La decisión de hoy **autoriza conservar B2 y dejar preparada su integración**, no la ejecución del merge. [PR #165](https://github.com/Juanmaes83/floorplan-3d/pull/165) seguirá **draft/open**.

Antes de pedir autorización independiente de merge:
- Confirmar `HEAD` del PR #165 contra el candidato `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`, `base=master`, sin cambios de terceros y sin divergencias inesperadas.
- Revisar los **26 archivos** del PR, sus políticas, assets/procedencia, cambios de UI y tests. No asumir que un único workflow CP2 representa todas las regresiones del producto.
- Exigir QA CI adecuado al merge, verificaciones Project-First y de presentación sobre el SHA aplicable; no hacer merge con tests rojos ni ocultar fixtures.
- Confirmar que las 3 referencias profesionales del usuario no se han utilizado como copia literal ni se han publicado sin control de derechos.
- Obtener una autorización de merge **expresa y separada**. Hasta entonces, `master` permanece intacto.

Después de cualquier merge autorizado, volver a verificar CI y proyecto desde `master` y actualizar el registro. **No dar por realizado ese paso ahora.**

## 5. Handoff económico a Astra/Codex y próximos frentes

**No repetir**: M08, capturas dobles A0/B1/B2, comparador final, cálculo GPU, fallback, context loss con reload, preparación de PR #165. CI final del candidato ya está verde.

**Al recuperar créditos**: leer esta acta; no reiniciar CP2. Su siguiente trabajo requiere ticket nuevo y alcance concreto: o revisión final de integración con autorización, o un único workstream de Visual Families / deuda técnica / Hybrid. No mezclar ramas ni abrir una nueva cantera de materiales sin objetivos de calidad específicos.

**Hybrid:** `feat/hybrid-registered-elevation-v1@07ae6f9969cae9df746443e97410e40cee2e932a` continúa congelado. **Deuda técnica y 26 capacidades NeonPlan:** backlogs independientes, no cerrados por CP2.

**STOP:** merge automático, PASS visual total inventado, sustitución de geometría verificable por elementos decorativos, duplicación del renderer o persistencia de contexto ilustrativo como verdad del inmueble.

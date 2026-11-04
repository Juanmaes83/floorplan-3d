# Section → Spatial Visit V1 — progreso

- **Rama:** `feat/section-spatial-visit-v1`. **Base:** `master@0f9c6ea` + misión `0ff2c97`.
- **Worktree:** `/home/user/fp-ssv`, aislado de Delivery, Hybrid y Kimi.
- **Estado:** R1 en curso.

## Qué existe (no se reconstruye)
- **FT3D-3:**
  - `js/presentation-section-core.js` hace la derivación.
  - `sectionOpen` en `js/presentation-story-core.js` cubre las fases barrido → frontal → dolly zoom → apertura → vista general con corte.
  - `beginSection`/`applySection`/`endSection` en `index.html` aplican el clipping real y las caras de corte.
- **Story (FT3D-2):** `sequence`, player (play, pausa, búsqueda, reversa, repetición) y `presentationStoryBegin`/`Apply`/`End`.
- **Rutas (D13):**
  - `FloorPlanPresentationRoute.plan`: rejilla con Dijkstra y holgura frente a muros, ventanas, puertas bajas y muebles; si no hay camino, cae a un recorrido aéreo explícito.
  - `choreography`: cámara a la altura de los ojos, yaw y pitch suavizados, vista de llegada.
  - `View3D.presentationRoute`: lo reproduce con su propio RAF, **no se puede buscar ni invertir**, y desciende atravesando la altura completa (techo).
- **Recorrer:** `setMode('walk')`, colisiones (`blocked`) y puertas.

## Brecha concreta
1. No existe una transición sección → estancia → interior dentro de Story, que es lo único que se puede buscar e invertir.
2. No hay relevo de esa llegada a Recorrer conservando la pose.
3. No hay opción profesional ni fallback explícito.

## Decisión R1
Una nueva narrativa pura, `room-visit`, que solo **cronometra y mezcla** lo que devuelven `Route.plan` y `Route.choreography`. No inventa rutas. Fases:
1. aproximación por encima de todo muro y mueble;
2. descenso vertical sobre el primer punto de la ruta que está dentro de una estancia, nunca bajo un dintel;
3. cierre: el corte pasa a altura completa a la altura de los ojos (una sola reconstrucción);
4. paseo con las muestras exactas;
5. giro;
6. llegada.

Se encadena como `section-open → room-visit` en la misma secuencia de Story.

## Registro
| Hito | SHA | Estado | Evidencia |
|---|---|---|---|
| R0 | (este commit) | checkpoint | — |

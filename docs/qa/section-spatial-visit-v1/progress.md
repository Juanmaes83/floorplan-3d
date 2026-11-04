# Section → Spatial Visit V1 — progreso

- **Rama:** `feat/section-spatial-visit-v1`. **Base:** `master@0f9c6ea` + misión `0ff2c97`.
- **Worktree:** `/home/user/fp-ssv`, aislado de Delivery, Hybrid y Kimi.
- **Estado:** R4 en curso (R1–R3 grabados e inspeccionados).

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
| R1 | `7b32e23` | room-visit + opción profesional + tests unitarios (56/56) | `evidence/r1/` hoja de contactos y vídeo de 10 s (fotograma a fotograma, 1280×800, SwiftShader) |
| R2 WIP | `78bc59d` | relevo a Recorrer, vuelta a la presentación y a la sección; test de navegador escrito | — |

## Inspección R1 (vídeo `evidence/r1/r1-section-to-visit-1280x800.mp4`)
- **S1 sección frontal:** legible, con caras de corte rojas y caption veraz. **S2 apertura:** continua sobre el mismo modelo.
- **S3/S4, defecto:** el descenso aterriza junto a la entrada (salón) y el paseo recorre la casa entera, con encuadres de pared blanca muy cercanos. Válido, pero poco legible y largo.
- **Corrección aplicada:**
  - el aterrizaje pasa a ser 1,2–4 m de ruta antes de la puerta del destino, en la estancia previa, para cruzar el acceso real;
  - el reloj del paseo arranca desde parado (curva C¹).
- **Pendiente:** el minimapa no sigue la posición durante la visita (R3); el render se cortó a los 40 min (unos 170 de 200 pasos).

| R2 | `b0e1088` | llegada dentro del destino (prolongación por la ruta validada), relevo y vuelta; test de navegador 2/2 | `evidence/r2/` 348 fotogramas, 14,5 s |
| R3 parcial | `1619efc` | el minimapa muestra destino y ruta durante la visita; motivo del fallback visible | — |

## Inspección R2
- **Correcto:**
  - S1/S2;
  - la continuidad de la vista general con corte a la aproximación;
  - la entrada por el corte;
  - la llegada en el dormitorio a la altura de los ojos;
  - Recorrer con la barra de vuelta;
  - la vuelta a la sección.
- **Defectos corregidos tras el render:**
  - el aterrizaje seguía en la entrada, porque la coreografía termina en una vista desde la puerta: ahora la referencia es ese final;
  - la tarjeta de Recorrer decía «desde la entrada»: ahora habla de «esta estancia».

| R3 | `982546f` → evidencia `ab81f88` | aterrizaje junto al destino, ruta en el minimapa, texto del relevo | `evidence/r3/` 348 fotogramas |
| R4 | `9323105` | Escape e invalidación durante el paseo; test de navegador 6/6 (OFF, ON, fallback, 5 ciclos, móvil vertical y horizontal) | log local |

## Próxima acción
Regresiones (sección, historia, ruta, Recorrer, controles de Recorrer, revelado, plantillas), rendimiento comparable y PR en borrador.

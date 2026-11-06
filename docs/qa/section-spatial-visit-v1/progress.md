# Section → Spatial Visit V1 — progreso

- **Rama:** `feat/section-spatial-visit-v1`. **Base:** `master@0f9c6ea` + misión `0ff2c97`.
- **Worktree:** `/home/user/fp-ssv`, aislado de Delivery, Hybrid y Kimi.
- **Estado:** R5 en curso. R1–R4 completos.

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


## Regresiones (en solitario, SwiftShader)
| Suite | Rama | Base `master@0f9c6ea` | Clasificación |
|---|---|---|---|
| Unitarias de presentación y Recorrer | 155/155 | — | OK |
| presentation-visit (nueva) | 6/6 | — | OK |
| presentation-section | 7/7 | — | OK |
| presentation-story | 8/8 | — | OK |
| walk | 2/2 | — | OK |
| walk-controls | 8/8 (falló 1 vez en la primera tanda) | 8/8 | inestable por carga; no reproducible |
| presentation-route | 5–6/7 | 6/7 | **M18 a 1440×900 y a 390×844:** fallan también en `master` (tiempo agotado y +2 geometrías), preexistentes e inestables. **«M18 returns to the preexisting 3D camera and door state»:** ver abajo. |

### «M18 returns to the preexisting 3D camera and door state»: carrera preexistente, medida
- **Recuento:** con el `index.html` de la rama falla 6 de 11 veces; con el de `master`, 0 de 10. La bisección por ficheros lo sitúa en `index.html`. El diff solo añade funciones, exportaciones y CSS que no se ejecutan sin la visita.
- **Traza fotograma a fotograma**, con la sonda temporal ya retirada:

  | Momento | `master` | Rama |
  |---|---|---|
  | Cierre de la presentación | escenario a 0 px durante unos 500 ms | escenario a 0 px durante unos 500 ms |
  | Proporción de la cámara después | 0 → 0,068 → 0,508 | 0 → 0,137 → 0,508 |

  La secuencia es la misma en ambos casos.
- **Mecanismo:** el test lee la cámara nada más `active=false`, dentro de esa ventana transitoria que también existe en `master`. Que pase o falle depende del momento exacto de la lectura.
- **Clasificación:** carrera preexistente de la app y del test, reproducida en la base con la misma traza. La frecuencia observada es mayor en la rama, pero sin mecanismo atribuible al código nuevo. Se deja documentada y no se modifica ese test ajeno.


| presentation-reveal | 3/8 | 3/8 (los mismos 5 por tiempo agotado) | **preexistente**, idéntico en la base |
| presentation-templates | 18/18 | — | OK |
| presentation-visit sobre `1a7034f` | 6/6 | — | OK |

## Rendimiento (`scripts/qa/measure-section-visit.cjs`, 1280×800, misma sesión, SwiftShader)
- **Recursos:** geometrías 1189 → 1143 y texturas 10 → 10 tras ambas escenas. No crecen.
- **Primera iteración:** entrar en `room-visit` costaba 937 ms, porque la coreografía (unos 1000 ms de JavaScript) se calculaba al entrar.
- **Corrección:** plan en caché por geometría, estancia y pantalla. La comprobación de disponibilidad, que ocurre al dibujarse el panel mientras se lee la vista general, lo calcula una sola vez (828 ms).

| Medida | `room-descent` (base) | `room-visit` |
|---|---|---|
| Entrada en la escena | 135 ms | **12 ms** |
| Intervalo entre fotogramas p50 / p95 | 917 / 1867 ms | 1100 / 1283 ms |

- **Cómo leer las cifras:** ambas rondan 1 fps porque se renderiza en CPU. Sirven para comparar, no son cifras de GPU ni de móvil (`MOBILE_PHYSICAL_PENDING`).
- **Encuadre:** la cámara de la visita se centra en la pantalla completa, sin compensar la tarjeta. Así la caché es compartida y el relevo a Recorrer, que es a pantalla completa, no se descoloca.

| R5 | `1a7034f` | vídeo final y storyboard S0–S6 inspeccionados | `evidence/r5/` |

## Próxima acción
PR en borrador Juanmaes83/floorplan-3d#168 abierta contra `master`, pendiente de revisión visual humana. Sin merge ni despliegue.

## Iteración de calidad visual (revisión humana del 5-11)
| Commit | Cambio |
|---|---|
| `96dad92` | **Restauración de cámara al salir** (causa raíz, ver documento técnico): «M18 returns to the preexisting 3D camera and door state» pasa 6/6 (antes fallaba 4 de 7). |
| `6862240`–`c7ed454` | Composición: aterrizaje despejado o dentro del destino, muros bajos durante la llegada, giro decidido una vez (corrige uno de 360°), llegada amplia, encuadre según la tarjeta, contorno del destino. |
| `be5ee5a` | No hay techo hasta que los muros están arriba. El test de navegador comprueba «dentro de un muro» con su altura. |

### Comparación final con `master` (ejecuciones alternas, en solitario)
| Suite | `master` | Rama `be5ee5a` |
|---|---|---|
| presentation-reveal | 3/8, 3/8 (M10 ×4 y caras compartidas) | 3/8, 3/8 (los mismos 5) |
| presentation-route M18 interior | falla en 1440 y en 390 (×2) | falla igual, en 1440 o en 390 |
| presentation-route «returns to the preexisting…» | **falla 1 de 2** | 0 fallos (corregido en esta rama) |

Revelado y M18 son idénticos a `master`: **preexistentes**. No hay fallos exclusivos de la rama.

Resto de la batería sobre `c7ed454`/`be5ee5a`:
- unitarias 155/155;
- section 7/7;
- story 8/8;
- walk 2/2;
- walk-controls 8/8;
- templates 18/18;
- presentation-visit 6/6 sobre `c7ed454`. Tras el cambio de `be5ee5a` solo se ha vuelto a pasar el caso ON (1/1).

### Validación final (`be5ee5a`)
- **presentation-visit.browser:** 6/6 sobre el código final:
  - OFF;
  - ON con estados seguros, reversa, relevo y salida limpia;
  - fallback;
  - Escape y 5 ciclos;
  - móvil vertical y horizontal.
- **Vídeo final 1280×800:** revisado completo en `evidence/final/`, con la lámina S0–S6 y la comparación antes/después.
- **Móvil (viewport emulado, no dispositivo):**
  - En horizontal, correcto.
  - **En vertical, limitación:** la tarjeta de presentación existente ocupa cerca de la mitad inferior. La visita encuadra en la mitad libre, pero el área útil es pequeña. Propuesta para una iteración aparte: plegar las herramientas de la tarjeta durante la visita en vertical (no se ha rediseñado el panel aquí).
- **GPU real y móvil físico:** `MOBILE_PHYSICAL_PENDING`; solo hay SwiftShader.

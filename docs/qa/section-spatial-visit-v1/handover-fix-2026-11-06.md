# Section → visita espacial — corrección del final de la historia y del traspaso a Recorrer (2026-11-06)

- Incidencia: QA humano bloqueante en el PR #172 (grabación `Grabación 2026-11-06 101313.mp4`, 59,8 s).
- Base verificada: staging `integration/rubik-e2-section-2026-11-06` @ `339d24bfe2b6f4d3704151f9b4a9d9e55f1eee23`.
- Rama aislada de corrección: `fix/section-visit-handover-2026-11-06`. Conserva todo el contenido del staging.
- No toca `master`, producción, Section original (#168), Hybrid V1, Hybrid V2 (#170) ni ramas de otros agentes.

## Síntoma

1. Con «Empezar desde el plano», «Incluir sección dinámica» y «Sección → visita espacial», «Ver la historia completa» recorre bien plano → sección → visita.
2. La cámara llega al dormitorio a la altura de los ojos.
3. Al completarse, salta a la vista elevada convencional de la estancia y desaparecen los controles de la historia.
4. No aparecen «Explorar desde aquí» ni «Volver a la sección». Solo queda «Recorrer desde entrada», que no reanuda desde la llegada.

## Causa raíz (verificada en el código y en el navegador)

En `js/presentation-ui.js` había **dos** finales de reproducción automática, y los dos cerraban la historia:

1. `openStory(…, {to: 1})`, que usa «Ver la historia completa»:
   `if(done&&to>=1&&story===run)await finishStory();`
2. El botón de reproducción («Ver»/«Seguir») al reanudar tras una pausa:
   `playStory(1).then(done=>{if(done)finishStory();})`

`finishStory()` hace `seekStory(1)`, después `closeStory()` y después `go(sceneEnd(…))`, que lleva a la parada de la estancia: la vista elevada.
- `drawStory()` solo muestra «Explorar desde aquí» con una escena `room-visit` en P = 1 y detenida. Ese estado desaparecía al cerrarse la historia.
- `walkFromVisit()` exige la misma condición (`sc.kind==='room-visit'&&run.P>=1`).

Reproducido en Chromium sobre `339d24b` con la prueba nueva, ver `before-339d24b-arrival.png`: tras la reproducción, historia `null`, parada «Dormitorio principal» en vista elevada y «Recorrer desde entrada».

Las suites de Section no lo detectaban porque siempre llegaban al final con el deslizador (`seek(page,1)`), nunca dejando que la historia se reprodujera sola.

## Corrección (mínima)

`js/presentation-ui.js`, 8 líneas: un ayudante y dos condiciones.

```js
const endsInVisit=run=>run?.scenes.at(-1)?.kind==='room-visit';
// openStory:
if(done&&to>=1&&story===run&&!endsInVisit(run))await finishStory();
// botón de reproducción:
else{const run=story;playStory(1).then(done=>{if(done&&!endsInVisit(run))finishStory();});}
```

- Una historia cuya última escena es `room-visit` **no se cierra** al terminar la reproducción automática.
  - La cámara queda dentro de la estancia, a la altura de los ojos.
  - Se conserva el panel de la historia, con «Explorar desde aquí» y «Volver a la sección».
- Salir sigue siendo decisión explícita del usuario: «Continuar presentación», una parada o «Volver a editar».
- Las demás historias terminan exactamente igual que antes.
- No se cambia ninguna UI, botón, estilo, narrativa ni parte del motor 3D.

## Pruebas

### Nueva: `tests/presentation-visit-handover.browser.test.cjs`

Recorrido real en el navegador, con reproducción automática, sin deslizador ni reduced motion. Falla sobre `339d24b` y pasa con la corrección.

**1. Llegada y traspaso, dos ciclos.**
- Opciones del vídeo, después «Ver la historia completa» (plano → sección → visita).
- En la llegada:
  - historia abierta, `room-visit`, P = 1, fase `room`;
  - cámara a 1,6 m;
  - panel visible con «Explorar desde aquí» y «Volver a la sección».
- 3 s después, la misma posición y orientación: sin salto.
- «Explorar desde aquí»:
  - Recorrer abre en la **misma posición y orientación**;
  - con «Empezar el recorrido» y W, el visitante se desplaza a la altura de los ojos;
  - «Volver a la presentación» deja la presentación en la parada de la estancia.
- Segundo ciclo:
  - pausa durante la visita y reanudación con el botón de reproducción (el segundo camino de la causa), llegando a la misma llegada;
  - «Explorar desde aquí» y después «Volver a la sección»: la sección queda detenida en su inicio.
- Vista general:
  - sin recorte;
  - altura de muros 2,8 restaurada;
  - un ciclo más por el mismo camino deja la memoria del renderizador igual que al principio (±4 geometrías, ±2 texturas).
- Al cerrar: sin recorte ni Recorrer activo, y el JSON del proyecto queda idéntico.

**2. Regresión.**
- Una historia completa **sin** la visita sigue cerrándose al final, en su última parada (la estancia del descenso), como antes.
- «Ver sección dinámica» sola sigue terminando en la vista general, sin recorte.

**3. Regresión con reduced motion.**
- La historia espera en su inicio y avanza paso a paso hasta la llegada, con los dos botones.
- «Continuar presentación» sigue llevando a la parada de la estancia.

### Resultados

| Prueba | Resultado |
|---|---|
| `presentation-visit-handover.browser.test.cjs` sobre la rama | **3/3** |
| La misma prueba sobre `339d24b` | **falla**: «the story is still open at the arrival» |
| Suite propia de Section `presentation-visit.browser.test.cjs` sobre la rama | **6/6** (OFF; ON con reversa, Recorrer y vuelta; fallback; Escape y 5 ciclos; móvil vertical y apaisado) |
| Suite unitaria completa (Node) | 756/758 (2 omitidos) |
| CI de GitHub | en el PR de validación en borrador (ver el PR) |

## Observaciones registradas, sin cambios (fuera de alcance)

- **Memoria tras «Volver a la sección»:** al volver a la vista general, la escena de sección conserva sus geometrías (1320 frente a 1178) hasta la siguiente escena, que las libera (vuelve a 1178). No se acumulan.
  - El comportamiento es idéntico, número por número, en `339d24b`; es previo, no lo introduce esta corrección.
  - No queda ningún plano de recorte ni recorte local.
- **Título de la tarjeta:** durante la historia completa sigue siendo «Vista general · Vista 1 de 2», también en la llegada al dormitorio. También es previo, y cambiarlo sería UI: queda para la auditoría visual registrada en el PR #172.
- **«Volver a la presentación»** desde Recorrer lleva a la parada de la estancia (vista elevada), como diseñó Section. El regreso a la experiencia de sección es «Volver a la sección».

## Evidencias (`evidence/handover-fix/`)

- `handover-fix-1280x800.mp4`: 25 s de fotogramas reales capturados de la app en Chromium con SwiftShader, montados en su orden y con las pausas necesarias para leerlos.
  - **Recorrido:** historia completa → llegada → la llegada sigue igual 3 s después → «Explorar desde aquí» → Recorrer en la misma pose → pasos → «Volver a la presentación» → segunda llegada → Recorrer → «Volver a la sección».
  - Manifiesto en `video-manifest.json`.
- `before-339d24b-arrival.png`: el defecto (vista elevada, sin controles).
- `after-arrival.png`, `after-recorrer.png`, `after-back-to-section.png`: el comportamiento corregido.
- `handover-fix-contact-sheet.jpg`: todos los fotogramas del vídeo.

## Riesgos pendientes

- GPU real y dispositivos físicos no probados; este entorno solo tiene SwiftShader.
- Validación humana en la Preview de la rama de corrección pendiente.
- Promoción a staging o `master`: requiere autorización separada; esta rama no la realiza.

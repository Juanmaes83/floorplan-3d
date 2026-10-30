# FT3D-1b «Entrar en la estancia» — informe del corte

Fecha: 30-10-2026 · Rama: `feat/ft3d-1b-room-descent`, apilada sobre `feat/ft3d-1a-plan-reveal` (PR #150).
Programa: [flat-to-3d-presentation-knowledge-programme-2026-10-30.md](flat-to-3d-presentation-knowledge-programme-2026-10-30.md), fase FT3D-1: «Plano vivo → 3D → primera estancia».

**Estado.** Segundo corte de FT3D-1. Con 1a y 1b, la secuencia de la fase queda completa como experiencia opcional:

```text
Plano (vista 2D) → muros que suben → la vista se abre → vista general → la cámara desciende → primera estancia
```

No se marca FT3D-1 ni Presentation Story como completos: falta la revisión humana de 1a y 1b.

## 1. Objetivo

Que la llegada a la primera estancia elegida sea un **descenso continuo** desde la vista general, sin vuelo fijo y sin un corte de muros de golpe. También debe ser reversible y controlable por progreso, como el capítulo 1a.

## 2. Experiencia

- **Dónde aparece.** Solo si en la configuración se marcó «Empezar desde el plano» (1a), en cada vista general aparece la herramienta **«Entrar en ‹estancia›»**. La estancia es la primera elegida en esa planta, la misma a la que llevaría «Siguiente →».
- **Al pulsarla:**
  - la cámara desciende de forma continua hasta la vista de esa estancia que ya calcula la Presentación;
  - si esa vista usa la sección de muros a 1,2 m, los muros bajan progresivamente hasta esa altura;
  - al llegar, la presentación continúa en esa estancia como siempre: tarjeta, contorno, «Revelar acabados», «Recorrer desde entrada», etc.
- **Controles durante el descenso:**
  - deslizador de 0 (vista general) a 100 (estancia);
  - **«Volver a la vista general»**, que reproduce hacia atrás y termina en la vista general;
  - botón principal «Entrar en ‹estancia›» / «Pausa» / «Continuar presentación».
- **Reducción de movimiento.** Salta directamente de la vista general a la estancia y viceversa, sin fotogramas intermedios.
- **Navegación existente intacta.** «Siguiente →», las paradas, el minimapa y el teclado funcionan igual. La herramienta nueva es una forma adicional de llegar, no un sustituto.

## 3. Arquitectura

| Pieza | Cambio |
|---|---|
| `js/presentation-story-core.js` | Nueva narrativa pura `room-descent` en el registro `NARRATIVES`, junto a `plan-reveal`. |
| `index.html` (View3D) | `presentationStoryBegin(stop, view, kind)` acepta `kind`; por defecto es `plan-reveal`, como en 1a.<br>Para `room-descent`, la pose final es `presentationFrame()`, la misma función que usa `presentationGo` para la estancia. |
| `js/presentation-ui.js` | Herramienta «Entrar en ‹estancia›». El panel del capítulo sirve para ambas narrativas.<br>`finishStory` termina en la parada correspondiente: la estancia en p = 1, la vista general en p = 0. |

No hay schemas, persistencia ni contratos nuevos, ni segunda geometría. No se toca ProjectV1 ni BuildingV1.

## 4. Fórmula de cámara

- **Extremos.** El inicio es la cámara actual (la vista general). El final es la pose de la parada de estancia: `eye` y `look` de `presentationFrame`, con el mismo FOV.
- **Trayectoria.** Interpolación esférica alrededor de un objetivo que se desplaza, con la misma fórmula que el `camTween` del editor:
  - radio y ángulo polar lineales;
  - acimut por el camino más corto;
  - suavizado `smoothstep`.
  
  Así el movimiento es el lenguaje habitual de Rubik, pero controlado por p.
- **Duración.** Proporcional al recorrido: `distancia / 3 m/s`, acotada entre 1,8 y 4,2 s. En el ejemplo, 18,2 m → 4,2 s.
- **Near/far.** No cambian. `orbit.maxDistance` se mantiene por encima de la distancia de cada estado y se restaura al terminar.

## 5. Muros y sección

- Si la parada de estancia usa una sección de muros (por ejemplo, a 1,2 m), los muros, construidos a altura completa, bajan con `archUp.scale.y` entre p = 0,15 y p = 0,75, hasta esa altura.
- **Al llegar a la altura de la sección**, en p = 0,75 y con la cámara todavía en movimiento:
  - se aplica la sección real (`setPresentationCut`), que es una sola reconstrucción en el umbral, nunca una por fotograma;
  - si se vuelve por debajo del umbral, se restaura el corte de la vista general.
- **Por qué así.** Al escalar, se comprimen ventanas y puertas; la sección real las conserva. La primera versión hacía el cambio en p = 1, al continuar, y la prueba midió una diferencia visible: 12,2/255 de media en la escena, sobre todo en marcos de ventanas.

  Con el cambio en p = 0,75, más el contorno de la estancia y las luminarias que aparecen al llegar como en la parada, la diferencia al continuar es de **0,06/255**: imperceptible.

## 6. Reversibilidad

- `stateAt(p)` es puro. 0→1, 1→0 y saltos desordenados de p reproducen los mismos estados, con tolerancia 1e-9 en Node y 1e-6 en el navegador.
- p = 0 es la vista general de la que partió y p = 1 la parada de estancia (tolerancia 1e-4).

## 7. Pruebas

**Unitarias** (`tests/presentation-story.test.cjs`, 3 nuevas)

- **Extremos.** p = 0 es la vista general y p = 1 la pose exacta de la estancia, con la sección activada.
- **Umbral único.** El cambio a la sección ocurre en un solo punto, con vuelta atrás.
- **Distancia.** Cada estado incluye la distancia de cámara.
- **Movimiento.** La cámara nunca sube, los muros nunca vuelven a subir, el movimiento es continuo y reversible, y el radio coincide con el tween del editor.
- **Duración.** Acotada.
- **Errores.** Son legibles.

**Navegador** (`tests/presentation-story.browser.test.cjs`, 2 nuevas)

1. **Escritorio 1440×900.**
   - Sin el capítulo, «Siguiente» da la pose y la sección de referencia y no aparece ninguna herramienta nueva.
   - Con el capítulo:
     - puntos de control 0 / .25 / .5 / .75 / 1;
     - p = 1 igual a la parada de estancia;
     - la cámara desciende y los muros bajan;
     - la sección de la estancia está aplicada en p = 1;
     - reversibilidad;
     - al continuar, la escena cambia 0,06/255;
     - la sección final es la de la parada;
     - «Volver a la vista general» funciona;
     - la salida es limpia: mismo proyecto, historial, materiales y almacenamiento, y el mismo estado 3D que sin el capítulo.
2. **Dúplex de dos plantas con reducción de movimiento.** Cada planta entra en su primera estancia, solo se observan p = 0 y p = 1, y se restaura la planta del editor.

Además siguen pasando las 4 pruebas de 1a, en total 6/6 de navegador. Están en el job de CI `presentation-story`.

## 8. Vídeo de validación

Se usan dos herramientas, las dos sobre la app real con Playwright y Chromium:

- **`scripts/qa/record-presentation-story.cjs <repo> <salida> 1b 1440x900`.** Graba en tiempo real.

  En este entorno, Chromium renderiza por software (SwiftShader) a ~1,7 s por fotograma en cualquier vista. Lo medimos: vista general 1691 ms, parada de estancia 1791 ms, ya sin narrativa. Por eso ese vídeo se ve a saltos. No es un defecto del descenso: cada aplicación del estado cuesta 0 ms, y 36 ms en el umbral de la sección.
- **`scripts/qa/render-presentation-story-frames.cjs <repo> <salida> 1440x900 100`.** Vídeo **fotograma a fotograma**.

  Como la narrativa es determinista, cada paso del deslizador es un estado real de la app; se captura ya renderizado y se monta a 24 fps. Muestra el movimiento como se verá con una GPU normal.

Gracias a los vídeos se encontraron y corrigieron:

- **Doble transición en 1a.** La entrada 3D existente y el capítulo hacían cada uno su propia subida. Se corrigió en la PR #150.
- **Cambio de sección visible al final del descenso** (§5).
- **Límite de órbita.** El descenso no daba la distancia de cámara y el límite de órbita quedaba sin valor numérico (`NaN`) durante la narrativa.

## 9. Límites

- **Solo la primera estancia.** El descenso lleva a la primera estancia de la planta. Entre estancias se sigue usando el vuelo existente: «Siguiente →» y las paradas.
- **Sin recorrido.** El descenso no atraviesa puertas ni hace recorrido interior; eso sigue siendo «Recorrer desde entrada».
- **Capturas.** PNG, compartir y ZIP están deshabilitados durante la narrativa, como en 1a.

## 10. Multiplanta

- «Entrar en ‹estancia›» aparece en la vista general de cada planta y lleva a la primera estancia elegida de esa planta (probado en dúplex).

## 11. Rendimiento

- El coste por fotograma es solo de cámara y de una escala de grupo, sin asignaciones.
- Hay una reconstrucción de muros en el umbral de la sección, de unos 36 ms en SwiftShader.
- No hay geometría nueva.

## 12. Regresiones

- **Cambios en código existente:** ninguno, salvo los de 1a. La firma de `presentationStoryBegin` gana un parámetro opcional con el valor de 1a por defecto.
- **Herramientas nuevas:** «Entrar en ‹estancia›» solo existe con el capítulo elegido y desaparece al salir.
- **Batería:** resultados en la PR.

## 13. Siguiente corte recomendado

- **FT3D-1c (opcional).** Plano con apariencia de plano a p = 0 (sombreado de muros de corte, nombres de estancias y cotas), que se desvanece al abrir la lente.
- **Alternativa: empezar FT3D-2 (motor reusable).** Secuencias de escenas con siguiente/anterior, callbacks y captions sobre el registro `NARRATIVES`, que ya tiene dos narrativas.

## Garantía de integración aditiva

- **Se reutiliza:**
  - de View3D: `presentationFrame` (la pose y la sección de la parada de estancia), `setPresentationCut`, `showRoomOutline` y la fórmula de `camTween`;
  - Presentation Core y la navegación de paradas;
  - el capítulo de 1a: panel, deslizador y reproducción.
- **Permanece intacto:**
  - la presentación sin capítulo;
  - «Siguiente →», las paradas, el minimapa y el teclado;
  - el vuelo entre estancias;
  - «Revelar acabados», «Recorrer desde entrada», capturas, ZIP y vídeo;
  - multiplanta, materiales, mobiliario, Solar y exterior;
  - el historial y los datos guardados.
- **Se añade:** la herramienta «Entrar en ‹estancia›», la narrativa `room-descent` y dos pruebas de navegador.
- **Cómo se accede:** «Presentar mi vivienda» → «Empezar desde el plano» → en la vista general, «Entrar en ‹estancia›».
- **Sin activar el capítulo:** no aparece nada nuevo y Rubik se comporta como antes (comprobado en las pruebas).
- **No se elimina, sustituye ni oculta ninguna capacidad existente.**

# FT3D-2a «Motor de historias» — informe del corte

Fecha: 30-10-2026 · Rama: `feat/ft3d-2-story-engine` (propia), que sale de `feat/ft3d-1b-room-descent` (#151).
Programa: [flat-to-3d-presentation-knowledge-programme-2026-10-30.md](flat-to-3d-presentation-knowledge-programme-2026-10-30.md), fase FT3D-2 «Motor reusable de Presentation Story».

**Estado:** primer corte de FT3D-2. No se marcan como completos ni FT3D-2 ni Presentation Story.

## 1. Objetivo

El objetivo es dejar de codificar secuencias fijas: un solo reproductor para todas las narrativas. Además, una historia completa se genera a partir de la presentación configurada:

```text
por cada planta: plano → vista general → primera estancia
```

**PASS técnico del programa:** «una segunda narrativa se puede montar sin duplicar el motor de transición». Los capítulos de 1a y de 1b, y la historia completa, son ahora historias del mismo reproductor. Para añadir otra narrativa basta con registrarla en `NARRATIVES` y en `SCENE_MS`.

## 2. Experiencia

**Acceso.** Si en la configuración se marcó «Empezar desde el plano», cada vista general ofrece además la herramienta **«Ver la historia completa»**.

**La historia** encadena estas escenas en un único progreso:
- **una planta:** «plano → vista general» y después «vista general → primera estancia» (2 escenas);
- **un edificio:** las mismas dos escenas en cada planta, de abajo arriba (dúplex: 4 escenas, con cambio de planta).

**Controles:**
- un **deslizador global** (0–1000) para toda la historia;
- **«← Escena anterior»**: al inicio de la escena actual o, si ya se está ahí, al de la anterior;
- **«Escena siguiente →»**;
- el botón principal: «Reproducir historia», «Pausa», «Seguir» o, al final, «Continuar presentación».

**Textos de cada escena:**
- un contador: «Historia · escena 2 de 4 · ‹planta›»;
- el texto de la escena: «Plano de la vivienda», «Los muros se levantan desde el plano», «Bajando a ‹estancia›»…

**Al terminar,** la presentación continúa en la última estancia como siempre.

**Edición de orden y selección sin tocar la geometría:** la historia sale del plan de la presentación, así que el orden y las estancias elegidas en el diálogo la definen.

**Reducción de movimiento:** reproducir, y los botones de escena anterior y siguiente, saltan directamente al estado final.

## 3. Arquitectura

| Pieza | Cambio |
|---|---|
| `js/presentation-story-core.js` | `sequence(weights)` es pura: `locate(P) → {i, p}` y `at(i, p) → P`, inversas entre sí y deterministas. Una frontera pertenece a la escena siguiente con p = 0, salvo P = 1.<br>`SCENE_MS` fija el peso de cada clase de escena, de modo que el mismo P es siempre la misma escena en el mismo p. |
| `index.html` (View3D) | `presentationStoryBegin` acepta `view.fromStop` y `view.fromRegion`. El descenso puede empezar, de forma determinista, en la pose de una vista general aunque la cámara esté en otro sitio (saltos de escena, deslizador). |
| `js/presentation-ui.js` | Reproductor genérico: escenas `{kind, stop, from}`, `enterScene`, `seekStory`, `playStory` y `finishStory`.<br>Entrar en una escena cierra la narrativa anterior, cambia de planta si hace falta, mide la tarjeta como la mostrará la parada y empieza la siguiente narrativa.<br>Los capítulos de 1a y 1b son historias de una escena, con los mismos identificadores y comportamiento. |

No hay schemas, persistencia ni contratos nuevos, ni segunda geometría.

## 4. Continuidad entre escenas

**Dentro de una planta, la frontera es continua:**
- el final de «plano → vista general» (p = 1) es la pose de la vista general;
- el inicio del descenso (p = 0) es esa misma pose (`fromStop`);
- comprobado en el navegador con una tolerancia de 1e-4.

**Entre plantas hay un cambio de planta**, con la reconstrucción existente de `showLevel`: el plano de la planta siguiente aparece tras la estancia de la anterior. Es un corte asumido y queda en los límites.

**El tiempo de reproducción** no cuenta el que tarda una planta en reconstruirse, así que la reproducción no se salta una escena.

## 5. Reversibilidad y determinismo

- **`sequence`** es pura y se ha comprobado en Node:
  - 1001 valores de P, ida y vuelta, con tolerancia de 1e-12;
  - la escena nunca retrocede cuando P crece;
  - los valores fuera de rango se recortan.
- **En el navegador:**
  - recorrer P de forma desordenada, atravesando la frontera, reproduce los mismos estados (tolerancia de 1e-6);
  - P = 1 es la parada de la primera estancia.

## 6. Pruebas

- **Unitarias:** 1 nueva (`sequence`), 12 en total del módulo.
- **Navegador:** 2 nuevas, 8 en total del capítulo:
  1. Historia completa en escritorio:
     - P = 0 es el plano y la frontera es la vista general;
     - P = 1 es la primera estancia;
     - es reversible;
     - escena anterior y siguiente funcionan;
     - no hay capturas durante la historia;
     - al final continúa en la estancia sin salto;
     - salida limpia, con el mismo estado que sin el capítulo.
  2. Dúplex con reducción de movimiento:
     - 4 escenas, con la escena 3 en la planta alta y la vuelta a la baja;
     - «Reproducir historia» salta y termina en la primera estancia de la planta alta;
     - se restaura la planta del editor.
- **Pruebas de 1a y 1b:** siguen pasando sobre el reproductor nuevo. Solo se ajustaron dos expectativas propias: la lista de herramientas incluye la nueva, y la medición táctil ignora botones ocultos.

## 7. Vídeo de validación

- **Tiempo real:** `scripts/qa/record-presentation-story.cjs <repo> <salida> 2 1440x900`.
- **Fotograma a fotograma:** `scripts/qa/render-presentation-story-frames.cjs <repo> <salida> 1440x900 60 2`, que recorre la historia completa paso a paso.

## 8. Límites

- **Cambio de planta:** es un corte; una transición entre plantas (por ejemplo, «subir» de una planta a otra) queda para un corte posterior.
- **Solo la primera estancia de cada planta:** el resto de estancias se visita con la navegación existente. Añadir vuelos entre estancias como escenas es un paso natural siguiente.
- **Capturas:** deshabilitadas durante la historia, como en 1a y 1b.

## 9. Siguiente corte recomendado

- **FT3D-2b:** escenas «estancia → estancia» para recorrer todas las estancias elegidas como parte de la historia; textos editables por escena (solo en memoria); duración por escena.
- **FT3D-3:** sección dinámica, como nueva narrativa del mismo registro.

## Garantía de integración aditiva

- **Se reutiliza:**
  - las narrativas de 1a y 1b;
  - de View3D: `presentationStopPose`, `presentationFrame` y la entrada desde la vista 2D;
  - la navegación de paradas, `showLevel` del edificio y el plan de la presentación.
- **Permanece intacto:**
  - la presentación sin capítulo y su navegación;
  - los capítulos de 1a y 1b, con su comportamiento y sus identificadores (las pruebas siguen pasando);
  - capturas, ZIP, vídeo, recorrido, revelado, multiplanta, materiales, mobiliario, Solar y exterior;
  - el historial y los datos guardados.
- **Se añade:**
  - la herramienta «Ver la historia completa»;
  - el contador de escena y el botón «Escena siguiente →», visibles solo en la historia;
  - `sequence`, `SCENE_MS` y `fromStop`.
- **Acceso:** «Presentar mi vivienda» → «Empezar desde el plano» → en la vista general, «Ver la historia completa».
- **Sin el capítulo** no aparece nada nuevo.
- **No se elimina, sustituye ni oculta ninguna capacidad existente.**

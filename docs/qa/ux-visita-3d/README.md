# §5.1 · Visita 3D: recuperar los controles durante el recorrido

**Rama:** `claude/ux-visita-3d` · **base:** `master` `dacb5d39`. **Ruta:** Entregar → «Revisar como cliente» → Explorar la vivienda.

## Reproducido en la interfaz normal (antes)
| Hallazgo | Causa |
|---|---|
| Tras Esc, pulsar la interfaz «no responde» y vuelve a mirar con el ratón | El aviso del recorrido (`#walkOverlay`) cubre todo el lienzo y **cualquier clic sobre él recapturaba el ratón** (`#walkOverlay.onclick = startWalkInput`) |
| Dos miniplanos con «Ocultar plano» | El miniplano de la visita y el del editor (`#nav3dMap`) a la vez |
| Asistente solapado abajo a la derecha | El dock de paneles del editor (`#mobileDock`) bajo el botón del Asistente; en móvil, el Asistente sobre «Salir del recorrido»; el panel «Navegación» del editor bajo el miniplano |
| **Texto en chino visible** en la barra de la visita y la portada (`三室两厅两卫`) | El título del proyecto se mostraba sin pasar por el embudo `nm()`: **incumplía la regla permanente del idioma visible** (corregido) |

## Resultado (después)
- Abre con el cursor libre y **«Activar mirada con el ratón»**. Con el ratón capturado: aviso persistente **«Esc · Pausar y mostrar controles»**.
- Esc: **«Recorrido en pausa»** compacto arriba; los controles funcionan al primer clic; pulsar la escena o la interfaz **no recaptura**; la cámara conserva posición y orientación. **«Reanudar recorrido»** vuelve a capturar desde el mismo encuadre.
- Un solo miniplano; sin los controles del editor en la visita del cliente; el Asistente no tapa ningún control (escritorio y móvil).
- El cambio del aviso vale también para el paseo del editor (mismo componente): el clic en la escena ya no recaptura.

## Pruebas
- Nueva y bloqueante: `tests/visita-3d-controles.browser.test.cjs` 2/2 (captura **real** del ratón en Chromium; móvil táctil 390×844), estable 3/3.
- Regresión tanda 1 (`walk`, `walk-controls`, `nav3d`, `no-chinese-display`, `delivery-3d-link`, `ent01-preview`): 29/29.
- Regresión tanda 2 (`assistant-ai-v2`, `integration-v1`, `presentation*`, `territory`) sobre b7345f5b: 73/78. Cuatro fallos P08 eran
  **regresión de este corte** (la capa entera dejaba pasar el clic y ya no arrancaba el recorrido): corregido en b1fc6248 (antes de
  empezar, toda la capa arranca; en pausa solo la tarjeta recibe el clic). Tras la corrección: P08 4/4 y la prueba nueva 2/2.
- `R2 P16 … 1440x900` falla **también en la base dacb5d39** (la última parada sobresale 12 px de la tarjeta de presentación):
  preexistente, ajena a este corte, sin tocar.
- Límite: la tanda 2 completa no se ha repetido tras b1fc6248 (solo P08, P16 y la prueba nueva).

Capturas: `1-inicio-cursor-libre.png`, `2-mirada-capturada.png`, `3-pausa-controles-libres.png`, `4-movil.png`.

# «Recorrer»: visibilidad y cortes de vídeo — plan

**Fecha:** 2026-10-24 · **Base:** `master` · **Estado:** plan de diseño y de cortes. No anuncia grabación, descarga ni
compartir de vídeo. Reconcilia el estudio #83 (`docs/tour-video-study`, `84e6abdc`) y responde a la nota de #89.
El arreglo del recorrido libre (movimiento real, puertas, matriz de controles) va en su propio PR (`fix/walk-start`).

## 1. Regla de exposición (no negociable)
Ningún corte enseña al usuario un botón, texto o ayuda de «Grabar» hasta que en ese mismo corte existan y estén
comprobados: (a) una vista previa que reproduce el mismo `Blob` que se descarga y (b) un archivo descargable que se
abre fuera de Rubik. Hasta entonces la grabación vive solo detrás de una bandera interna sin entrada en la interfaz.
La revisión profesional es la **confirmación humana de una versión concreta** (SHA + preview), no una certificación.

## 2. Visibilidad de «Recorrer» (puede avanzar ya)
| Punto | Hoy | Propuesta | Toca |
|---|---|---|---|
| Panel de entrada del modo | rehecho en `fix/walk-start`: título, qué es, controles del dispositivo, «Empezar el recorrido» | mantener; contraste medido ≥ 4,5 (título 15,83, cuerpo 6,21) | `fix/walk-start` |
| Cabecera 3D | botones de vista al mismo nivel | «Recorrer» como acción secundaria destacada, un solo control (sin duplicar en «Tareas y ayuda») | #71/#85 |
| Bienvenida | CTA de presentación (#76) | mención breve: «Recorre tu vivienda en 3D» enlazando al modo, sin vídeo ni «Grabar» | #76 |
| Guía «Tareas y ayuda» | sin fila de recorrido | fila «Recorrer la vivienda» que abre el modo (patrón `listed()` de #86, una acción por fila) | #86 |
| Paneles | — | en teléfono el panel de entrada no debe quedar tapado por toasts (hallazgo 14 abierto) | #85 |

Criterios: jerarquía (una acción primaria por pantalla), contraste AA, siguiente acción explícita, sin controles
duplicados, sin promesas de funciones inexistentes (ventanas con E, subir escaleras, puertas correderas).

## 3. Cortes de vídeo (cada uno en su PR, cada uno con SHA, resultados, límites, evidencia y preview)
| Corte | Contenido | Depende de | Visible al usuario |
|---|---|---|---|
| V0 Confirmar versión | el profesional confirma qué versión del proyecto se graba (nombre, fecha, SHA de la app en la preview) | — | sí (no menciona vídeo) |
| V1 Grabación + vista previa (interno) | `canvas.captureStream()` + `MediaRecorder` sobre lienzo de composición, paradas de la presentación, sin paneles; vista previa del mismo `Blob` | #81 (identidad/rótulos de `delivery-image.js`) | **no** |
| V2 Descarga | archivo con extensión según el tipo real (nunca WebM renombrado a `.mp4`); se comprueba que reproduce fuera de Rubik | V1 | **solo cuando V1+V2 pasan**: entonces aparece «Grabar recorrido» con vista previa y descarga |
| V3 Compartir | «Compartir…» del sistema con el mismo gesto de usuario de #78; sin publicación automática ni enlace alojado | V2, #78 | sí, si el navegador declara `canShare({files})` |

Primer punto seguro para incorporar la decisión de #89: ya aplicado — no había validación en curso cuando llegó;
el arreglo del recorrido entró en la integración siguiente y este plan no cambia código.

## 4. Compatibilidad (por comprobar salvo lo medido)
| Elemento | Estado |
|---|---|
| Chromium de pruebas 141: `webm;vp9`, `webm;vp8`, `mp4` sin `avc1` | **medido** (#83) |
| Chrome escritorio, Safari macOS/iOS, Chrome Android (`isTypeSupported`) | por comprobar |
| WhatsApp (formato, tamaño de adjunto) | por comprobar; no se asume con WebM |
| Idealista (subida de vídeo) | por comprobar |
| Fluidez | requiere GPU real y teléfono físico; SwiftShader no mide |

## 5. Reconciliación con #83
Se mantienen: cinco conceptos separados, técnica de lienzo de composición, preferencia `mp4;avc1` → WebM con aviso,
sin audio en el primer corte, límites de §4 de #83. Cambia: el «primer corte» de #83 se parte en V1 (interno) y V2,
y el botón «Grabar recorrido» no aparece hasta V2 (regla §1). Decisión abierta que sigue siendo de Juanma: con
WebM sin H.264, ¿ofrecer con aviso o no ofrecer en ese navegador?

## 6. Límites actuales del recorrido libre (no anunciar)
Puertas correderas no se abren con E; no se suben escaleras caminando; E no controla ventanas; ratón físico, GPU
real y teléfono físico sin probar.

# Vídeo del recorrido descargable y compartible — estudio

**Fecha:** 2026-10-22 · **Base:** `master@e796e3d` · **Estado:** estudio; no se anuncia grabación, descarga ni compartir
hasta que funcionen con el proyecto real. Encargo: `delivery-programme-2026-10-22.md` línea E; petición de Juanma del
22-10: «grabar el recorrido y descargar el vídeo y que se pueda compartir en los mismos canales que la imagen».

## 1. Cinco conceptos que no se mezclan
| Concepto | Qué es | Estado hoy |
|---|---|---|
| Vídeo demostrativo de Rubik (bienvenida) | pieza corta auténtica grabada con Rubik | no existe; la bienvenida usa una captura fija |
| **Grabación del proyecto en la aplicación** | el recorrido de la presentación del profesional, grabado en su navegador | **objeto de este estudio** |
| Render offline (Blender) | piloto documentado; calidad alta, no está en la app | piloto, fuera de la app |
| Descarga local | archivo de vídeo guardado por el profesional | depende de la grabación |
| Enlace alojado | URL pública al vídeo | **no**: D-06/D-08/D-09 sin decidir |

## 2. Resultado buscado
El profesional pulsa «Grabar recorrido» en la presentación, Rubik reproduce sus paradas (vista general → estancias
elegidas) sin paneles del editor, y entrega un archivo de vídeo con la **misma identidad que la imagen de entrega
(#81)**: apertura con nombre del inmueble y marca, rótulo de cada estancia, cierre con marca y contacto si el
profesional lo marca. Puede verlo antes de descargarlo o compartirlo por los mismos canales que la imagen
(«Compartir…» del sistema, descarga, WhatsApp, correo), sin enlace a ningún servidor.

## 3. Técnica candidata y medidas iniciales
- `canvas.captureStream()` + `MediaRecorder` sobre un lienzo de composición (escena 3D + rótulos dibujados), no sobre
  la pantalla: así no se graban paneles, cursor ni datos del editor.
- **Medido en Chromium 141 de pruebas (sin códecs propietarios):** `video/webm;codecs=vp9` ✔, `vp8` ✔,
  `video/mp4` ✔ pero `avc1` (H.264) ✘. Ese MP4 no lleva H.264 → **no se puede asumir** compatibilidad con WhatsApp ni
  iPhone. Pendiente medir en Chrome de escritorio, Safari (macOS/iOS) y Chrome Android con su detección
  `MediaRecorder.isTypeSupported` real.
- Estrategia: preferir `video/mp4;codecs=avc1` si el navegador lo admite; si no, WebM y avisar de que algunos
  dispositivos pueden no reproducirlo; nunca renombrar un WebM a `.mp4`.
- Sin audio en el primer corte.

## 4. Límites a medir antes de prometer
| Aspecto | Criterio |
|---|---|
| Duración | objetivo 30–60 s; tope configurable |
| Peso | medir MB/min a 1280×720 y 1080×1350; canales con límite de tamaño de adjunto |
| Rendimiento | SwiftShader no sirve para medir fluidez: requiere GPU real y teléfono físico |
| Fidelidad | la vista previa reproduce el mismo `Blob` que se descarga/comparte |
| Privacidad | sin paneles, rutas, IDs internos ni ubicación; contacto solo si se marca |
| Interrupción | Escape/Atrás cancelan y no dejan archivos parciales |

## 5. Primer corte propuesto
1. Prueba técnica en una rama: grabar la presentación del ejemplo a 1280×720, WebM/MP4 según soporte, sin rótulos;
   medir duración, peso y fotogramas perdidos (SwiftShader y, con el protocolo, GPU/teléfono de Juanma).
2. Con medidas aceptables: rótulos e identidad reutilizando `js/delivery-image.js` (#81), vista previa y
   compartir con la misma lógica de gesto de usuario de #78.
3. QA: una y dos plantas, 1440/390/844, cancelar, Escape/Atrás, archivo reproducible fuera de Rubik.

## 6. Decisiones abiertas
- Formato por defecto si H.264 no está disponible (WebM con aviso vs. no ofrecer grabación en ese navegador).
- Vídeo demostrativo de la bienvenida: grabarlo con esta misma función cuando exista (autenticidad), no con material
  genérico.
- Enlace alojado: depende de D-06/D-08/D-09.

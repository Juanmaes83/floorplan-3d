# Validación de la muestra profesional · Windows

**Base de prueba:** `claude/pelicula-efectos` en `8bf9baa3791579fd8924c1114e826406a3b1011a`. Entorno: Windows, Blender 5.2.1 LTS, Chromium local y FFmpeg.

## Reproducción y cambios

1. La prueba de navegador existente abre RUBIK, prepara Maqueta abierta en perfil `revision` y descarga el ZIP desde Entregar. Se verifican los seis casos y las 17 comprobaciones de guion, perfil, revisión, kit y cancelación.
2. En el ZIP original, `RODAR-windows.bat muestra` sale con código 1 antes de abrir Blender. El mensaje es `Perfil desconocido / unknown profile: "revision"`. El análisis del JSON mediante `findstr` deja las comillas en la comparación.
3. En modo película o muestra, el lanzador deja que Python lea el perfil del guion del ZIP. Los rodajes convencionales conservan el argumento de perfil. Los nodos Principled se identifican por su tipo de Blender, después de reproducir un fallo de búsqueda por nombre visible con la configuración local.

## Comprobado en la candidata

- Suite dirigida de efectos, entrega y kit: 21/21. Prueba de navegador de ZIP: 1/1 con 17/17 comprobaciones, incluida la descarga de un ZIP nuevo con el kit corregido.
- El lanzador real `muestra` extraído de ese ZIP prepara la escena sin forzar el idioma. Importa 1.508 de 1.508 mallas. Empieza el rodaje en `f0312` y escribe fotogramas consecutivos a 1280 × 720 en `resultados/muestra/frames`.
- El guion elige Maqueta abierta, perfil `revision`, tramo 312–587, 276 fotogramas esperados a 24 fps (11,5 s). El cierre exige verificar `muestra.mp4` con FFprobe/FFmpeg y cotejar el efecto, perfil y revisión con el guion y el manifiesto del ZIP. El render de prueba está en curso al registrar este corte.

Corrección candidata para que Claude la revise en su rama de efectos. Los renders largos del piloto y de las películas finales siguen en la cola acordada.

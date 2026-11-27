# Gesture Labs §6 · ensayo aislado «Presentar con gestos»

> **Estado (27/11, noche):** pendiente. Queda fuera de la tanda de integración de §9 y Entregar. Falta la prueba del
> propietario con la cámara frontal del móvil, y la evolución se define con Codex. Avances y evidencias se conservan en esta
> rama para retomarlos con la guía de auditoría y laboratorios.

**Rama:** `claude/gesture-labs` · base `cd694e88` (StoryLayersV1 aprobado). **Estado:** laboratorio aislado; no es una función
publicada. Solo se carga con `?gesture-lab=1`; sin ese parámetro, RUBIK no cambia.

## Autorización y procedencia de las piezas
- Autorización del propietario (27/11/2026): los donantes son suyos y públicos; se pueden consultar y adaptar sus piezas
  según el encargo y sus SHA fijados.
- **Director de Orquesta** @ `dcf4b7ac`:
  - *Antes y después de reforma v2.1.2*: clasificación por dedos extendidos con EMA de apertura (0,52/0,48), estabilización
    (OPEN 2 · FIST 4 · HOLDING 5), deslizamiento (|dx| ≥ 0,18, |dy| ≤ 0,11, ≥ 0,55/s, ventana de 520 ms y 850 ms entre
    disparos), mano perdida a 700 ms sin disparo y parada de pistas → **adaptado** en `gesture-core.js`.
  - *Bola Imagen v1.3*: despliegue animado de una imagen → **adaptado** como despliegue del plano (`gl-unfold`, respeta
    «movimiento reducido»).
  - *Air Guitar V2*: **descartado** en este corte; con dos gestos no hace falta distinguir funciones por mano.
- **map-gesture-controls · La Batuta v0.2** @ `6939d43a`: tutorial corto siempre visible, indicador de cámara (punto de estado y
  texto) y modo sin cámara con el mismo recorrido → **adaptados** a la barra y al HUD del laboratorio. OpenLayers no se usa.
- No se copia interfaz, marca ni recursos de los donantes.

## Qué hace
Vivienda real de RUBIK (proyecto de ejemplo) con **dos revisiones guardadas**: el original y su variante de P10, que tiene un
mueble retirado y guardado.

| Paso | Qué se ve | Gesto | Control equivalente |
|---|---|---|---|
| 1 · Plano | plano guardado de la revisión «antes» que se despliega; rótulo «Imagen del plano guardado · revisión …» y estancia resaltada (Salón) | mano abierta quieta ≥ 600 ms = siguiente | «Siguiente →», → o Espacio |
| 2 · Vista 3D | visor 3D **interactivo** de la misma revisión, encuadrado en el Salón; el rótulo lo dice | mano abierta = siguiente | igual |
| 3 · Antes y después | plano de las dos revisiones con el mismo encuadre y la misma escala; llamadas con valor, unidad, fuente, revisión (nombre y fecha de guardado) y estado | mano cerrada y deslizar = antes/después | «Ver después/antes», A/D |

Además:
- Si se pierde la mano durante 700 ms, se pausan los gestos sin disparar nada; la vista se conserva y los botones siguen.
- Si se deniega el permiso de cámara, aparece un aviso y la presentación sigue con botones y teclado.
- Al salir, al apagar la cámara o al ocultar la pestaña, las pistas de la cámara se detienen.
- Nada se escribe en el proyecto y no se graba ni se guarda imagen. El modelo de manos de MediaPipe se descarga del CDN solo al
  activar la cámara.

## Pruebas y evidencia
- `tests/gesture-core.test.cjs`: 7/7. Clasificación, un solo disparo por gesto sostenido, apertura breve sin disparo,
  deslizamiento en espejo con enfriamiento, movimiento lento o vertical ignorado, y mano perdida sin acción.
- `tests/gesture-lab.browser.test.cjs`: 3/3. Recorrido completo en 1440×900 y 390×844 con **gestos sintéticos** inyectados
  (`RubikGestureLab.feed`) y una pista de cámara simulada. Comprueba:
  - siguiente por gesto, botón y teclado;
  - deslizar a «después»;
  - pérdida de la mano;
  - continuidad con los botones;
  - las llamadas;
  - que al salir las pistas queden en `ended`;
  - que no haya chino con el laboratorio abierto;
  - el caso de permiso denegado.
- Vídeos: `video/gl-recorrido-{escritorio,movil}.mp4`. Capturas: `gl-{1-plano,2-3d,3-antes,4-despues}-{escritorio,movil}.png`.
- Entorno: Chromium (Playwright) sin interfaz, en el contenedor. No hay webcam física.

## Pendiente de comprobar con cámara real (no hay webcam en este entorno)
- Clasificación real con MediaPipe Hands: iluminación, distancia y fondos.
- Disparos involuntarios en uso real.
- Comodidad de los 600 ms de «mano abierta quieta».
- Comportamiento en portátil y móvil con cámara frontal.
- Prueba de usabilidad con una persona que no conozca la demo.

Reproducir: abre `/?gesture-lab=1`, pulsa «Presentar con gestos · laboratorio» y después «Activar cámara (opcional)». Hace
falta HTTPS o localhost, y una variante guardada con algún cambio (Entregar → P10).

## Decisiones del propietario (27/11) · objetivos de producto y criterios de aceptación
**1 · Experiencia inicial: desenrollar el plano y ver la vivienda en 3D.**
- El cliente abre la presentación y ve el plano **enrollado**. Con un gesto (o con un control visible) lo **despliega** y lo
  puede leer.
- Con otro gesto intencional pasa al **3D de esa misma vivienda** y reconoce en 3D una estancia o un elemento que acaba de ver
  en planta.
- Se valora la transición completa y cómo ayuda a entender el espacio.
- Funciona con **una sola revisión guardada**. La variante solo se pide al elegir «Antes y después».
- Cámara opcional y controles visibles en ambos pasos. Al perder la mano se conserva el punto y se puede seguir. Al salir se
  apaga la cámara.

**2 · Presencia en RUBIK: el profesional entiende qué puede ofrecer.**
- **Home:** «Presentación con gestos» tiene presencia propia junto a los módulos destacados, con el estándar visual de RUBIK.
  Quien llega por primera vez entiende qué podrá hacer y encuentra una demo con la vivienda de ejemplo.
- **Entregar:** ficha propia y fácil de localizar, que explica:
  - qué experiencia se prepara;
  - los requisitos de cada modo;
  - qué verá el cliente.

  P1 puede ofrecer un acceso contextual a la misma experiencia. Se distingue lo disponible para revisión de lo que sigue en
  ensayo.

**Evidencia para aprobar:**
- Preview identificada por SHA.
- Capturas de Home y Entregar.
- Grabación continua en móvil desde la entrada, pasando por el plano desplegado y el paso a 3D, hasta la salida. Debe mostrar
  qué encuentra el profesional y qué experimenta el cliente.
- Prueba sintética y prueba con cámara física separadas.

El propietario aprobará con la cámara frontal del móvil.

## Avance (27/11, noche) · viñetas y salida durante la carga del modelo
- **Viñeta por paso** (handoff ampliado `c532877a`): dibujo de la mano, movimiento o tiempo, resultado en pantalla y botón
  equivalente. Ejemplo: «Mano abierta, palma a la cámara, quieta 1 segundo → se despliega el plano. Sin cámara: botón
  «Desplegar el plano»».
- **Salir mientras se carga el modelo de manos:** la cámara se apaga y nada se reactiva cuando el modelo responde tarde.
  Mientras carga se ve «Pidiendo permiso y cargando el modelo de manos… puedes salir o seguir con los botones».
- **Pruebas:** reloj virtual para los gestos sintéticos (33 ms por fotograma). Con la máquina cargada por las regresiones, la
  versión anterior fallaba igual que el código previo; la causa era el entorno y los umbrales del detector no cambian.
  Navegador 6/6 y núcleo 7/7.
- **Pendiente:** prueba con cámara física (propietario) y el siguiente ensayo recomendado (girar la maqueta con la palma
  moviéndose despacio).

## Candidata para revisión (27/11) · «Presentación con gestos»
**Estado:** en ensayo, candidata para revisión, no publicada. Solo se activa con `?gesture-lab=1`; sin el parámetro, RUBIK no
cambia.

**Qué encuentra el profesional**
- **Home:** en «Módulos para tu trabajo», ficha destacada «Presentación con gestos». Lleva la etiqueta «En ensayo · para
  revisión», el detalle de qué es, qué no es y sus condiciones, y el botón «Ver la demo con la vivienda de ejemplo».
- **Entregar:** ficha propia **P11 «Presentación con gestos»**, con portada del plano real y el estado «En ensayo · para
  revisión». Su detalle explica qué experiencia prepara, los requisitos de cada modo (botones: ninguno; cámara: permiso, HTTPS y
  buena luz) y qué verá el cliente. Acción: «Preparar la presentación».
- **P1:** acceso contextual «Presentar con gestos (en ensayo)» a la misma experiencia.
- **Inicio de la presentación:** proyecto, revisión que verá el cliente, si «Antes y después» está disponible, qué verá el
  cliente y los requisitos de cada modo. Dos acciones: «Empezar con botones» (principal) y «Activar cámara».

**Qué experimenta el cliente (una sola revisión guardada)**
1. **Plano enrollado** de la vivienda. Para desplegarlo: mano abierta quieta 1 s, o el botón «Desplegar el plano».
2. **Plano desplegado y legible**, con la estancia principal (el salón) resaltada. Para pasar al 3D: mano abierta quieta 1 s, o
   el botón «Ver en 3D →».
3. **3D de la misma revisión**, con la cámara volando a esa misma estancia (`View3D.focusRoom`; el visor la rotula, p. ej.
   «Salón 21,5 m²»). Una miniatura de la planta la marca: «Salón · la estancia que viste en planta».
4. **«Antes y después» (opcional):** solo al elegirlo. Si no hay variante guardada con cambios, se explica y se ofrece «Ir a
   P10 · crear la variante». El punto actual se conserva.

**En todos los pasos**
- Al perder la mano: «Mano perdida · gestos en pausa, no se ha cambiado nada»; se sigue con los botones desde el mismo punto.
- Al salir: la cámara se apaga y se vuelve al origen («Volver a Entregar», «Volver a P1» o «Volver al inicio») con el proyecto
  activo restaurado.
- Una sola acción principal por paso. El panel de navegación 3D se cierra para no tapar la vivienda. En escritorio, durante el
  3D, el panel del recorrido va a la derecha.

**Pruebas (locales, Chromium sin interfaz):** 12/12.
- Núcleo, 7: incluye enrollado → plano → 3D con una revisión y comparar solo al pedirlo.
- Navegador, 5:
  - una revisión desde P11, en escritorio y en móvil;
  - comparación desde P1 con una variante;
  - permiso denegado;
  - Home con su demo.

**Evidencia:**
- `video/gl-recorrido-movil.mp4`: grabación continua en 390×844 táctil. Va de Entregar a la ficha P11, el inicio, la cámara,
  el plano enrollado, el gesto de desplegar, el plano legible, el gesto al 3D en el salón, la mano perdida, «Antes y después»
  (pide la variante), la vuelta al plano y «Volver a Entregar» con la cámara apagada.
- `video/gl-recorrido-escritorio.mp4`: el mismo recorrido en escritorio.
- Capturas:
  - `gl-home-movil.png` y `gl-entregar-p11-{escritorio,movil}.png`;
  - `gl-0-inicio-*`, `gl-1-enrollado-*`, `gl-2-desplegado-*` y `gl-3-3d-*`;
  - `gl-vercel-boton-*` (acceso en la Preview desplegada, cámara apagada).

**Sintético frente a físico:** todos los gestos de estas pruebas y vídeos son **sintéticos** (mano generada e inyectada) con
una pista de cámara simulada. Falta la **prueba con cámara física**, que hará el propietario con la cámara frontal del móvil
(pasos más abajo). La integración definitiva espera esa revisión.

## Revisión 27/11 · despliegue y acceso guiado
- **Despliegue:** `.vercelignore` excluye `labs/`, por eso el acceso no aparecía en Vercel. Los tres recursos se mueven a
  `gesture-lab/` (solo `gesture-core.js`, `gesture-ui.js` y `gesture.css`); el resto de `labs/` sigue sin publicarse. Siguen
  cargándose **solo** con `?gesture-lab=1`.
- **Acceso guiado:** Entregar → ficha **P1 Presentación 3D** → «Presentar con gestos · laboratorio» (solo con el parámetro).
  - El inicio identifica el proyecto y las dos revisiones: nombre, fecha de guardado y número de cambios. Ofrece «Empezar con
    botones» (primaria) y «Activar cámara».
  - Sin una variante con cambios guardados, ofrece «Ir a P10 · crear la variante» y explica cómo volver.
- **Cada gesto se enseña en su paso:** franja «Gesto para seguir / Gesto para comparar».
  - Al detectar un gesto aparece «✓ Gesto detectado: …» en verde.
  - Al perder la mano aparece «Mano perdida · gestos en pausa, no se ha cambiado nada».
  - Sin cámara: «sigue con los botones o el teclado, desde este mismo punto».
- **Una acción primaria por vista:** «Siguiente →» en los pasos 1 y 2 y «Ver después/antes» en el 3. «Volver a P1» devuelve a
  Entregar con la ficha P1 y restaura el proyecto activo. El acceso del Asistente queda al final, sin tapar controles.
- Pruebas: 11/11 (núcleo 7 + navegador 4). Vídeos `video/gl-recorrido-{escritorio,movil}.mp4` desde P1 hasta «Volver a P1».
  Capturas `gl-0-inicio-*` … `gl-4-despues-*`.

## Prueba con la cámara frontal del móvil (revisión del propietario)
**URL:** la Preview del SHA indicado en el handoff, con `/?gesture-lab=1`. Necesita HTTPS y Chrome en Android o Safari en iOS.
Pon el móvil de pie, apoyado, a unos 40–60 cm, con luz de frente y la mano dentro del encuadre de la cámara frontal.
1. **Prepara las dos revisiones:** Entregar → P10 → Crear variante → retira un mueble → espera «✓ Guardado» → vuelve.
2. Entregar → **P1 Presentación 3D** → «Presentar con gestos · laboratorio». Comprueba que el inicio nombra el proyecto y las
   dos revisiones con su fecha.
3. «Activar cámara» → Permitir.
   - **Señal:** punto verde y «Cámara activa · …»; con la mano a la vista, «mano abierta detectada» o «puño detectado».
4. **Gesto 1 · desplegar y pasar al 3D:** mano abierta, palma hacia la pantalla, dedos separados, **quieta 1 segundo**.
   Primero despliega el plano enrollado y, repitiendo el gesto, pasa al 3D en el salón.
   - **Señal de detección:** franja verde «✓ Gesto detectado: mano abierta → siguiente» y el paso pasa a «2 · Vista 3D».
   - Repite para llegar a «3 · Antes y después».
   - Mantener la mano abierta más tiempo **no** avanza otro paso. Para repetir, cierra la mano y vuelve a abrirla.
5. **Gesto 2 · antes/después:** puño cerrado y desliza en horizontal unos 15–20 cm en menos de medio segundo.
   - **Señal:** «✓ Gesto detectado: deslizar → después», y el rótulo del plano pasa a «mostrando: DESPUÉS».
   - En sentido contrario vuelve a «antes».
6. **Retirar la mano no dispara nada:**
   - en el paso 1 o 2, empieza a abrir la mano y sácala del encuadre antes del segundo; o deja el puño quieto y retíralo
     hacia abajo;
   - **señal:** punto ámbar y «Mano perdida · gestos en pausa, no se ha cambiado nada»;
   - el paso y el lado no cambian (compáralos con los resaltados de la cabecera);
   - vuelve a mostrar la mano y el punto vuelve a verde.
7. **Seguir con botones sin cambiar de punto:** con la cámara activa o perdida, pulsa «← Anterior», «Siguiente →» o «Ver
   antes/después». El recorrido sigue desde el mismo paso.
8. **Apagar al salir:** pulsa «Volver a P1». La cámara se apaga en 1–2 s (desaparece el indicador del sistema) y vuelves a la
   ficha P1. Repite con «Apagar cámara» y cambiando de app: en ambos casos la cámara se apaga.
9. **Permiso denegado:** en otra pestaña, «Bloquear». Debe aparecer un punto rojo y «Permiso de cámara denegado · sigue con los
   botones o el teclado», y el recorrido sigue con los botones.

Anota por paso: OK, falla o falso disparo (cuántos). Un falso disparo o un gesto que necesite más de dos intentos obliga a
ajustar umbrales antes de integrar.

### Qué está comprobado y qué no
| Comprobado con entrada **sintética** (Playwright, sin cámara física) | Pendiente de validar con **cámara física** |
|---|---|
| lógica de los dos gestos (núcleo, 7 pruebas): un disparo por gesto sostenido, apertura breve sin disparo, deslizar con espera, lento o vertical ignorado, mano perdida sin acción | clasificación real de MediaPipe con la cámara frontal: luz, distancia y fondo |
| recorrido completo en la app (escritorio y 390×844): P1 → inicio → gesto → 3D → mano perdida → botones → deslizar → «Volver a P1»; pista de cámara simulada que queda `ended` al salir; permiso denegado | falsos disparos en uso real y comodidad del segundo de espera |
| sin texto chino visible con el laboratorio abierto | el indicador de cámara del sistema se apaga en el móvil |
| | rendimiento del modelo en el móvil (fluidez y temperatura) |

## Dónde se integraría en Entregar
Como acción de la ficha **P1 «Presentación 3D»**: «Presentar con gestos (opcional)», junto a «Preparar presentación». Abriría
este mismo recorrido con la revisión activa y su variante de P10. **Pendiente de la revisión con webcam física** (sección anterior) y de tu aprobación; no se integra antes.

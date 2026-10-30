# FT3D-1a «Del plano a la vivienda» — informe del corte

Fecha: 30-10-2026 · Rama: `feat/ft3d-1a-plan-reveal`, que sale de `docs/flat-to-3d-knowledge-integration` en `a318cff`.
Programa: [flat-to-3d-presentation-knowledge-programme-2026-10-30.md](flat-to-3d-presentation-knowledge-programme-2026-10-30.md).

**Estado: primer corte de FT3D-1.** No está completo ni FT3D-1 ni «Presentation Story». Este corte crea la base de las narrativas y una primera narrativa.

## 1. Objetivo

Hacer visible que la vivienda en 3D sale del plano. La presentación puede empezar, de forma opcional, con el plano del proyecto abierto. Después:

1. los muros se levantan desde el plano;
2. la vista se abre en 3D (efecto «dolly zoom»);
3. la narrativa termina exactamente en la vista general 3D que ya existía;
4. desde ahí sigue la presentación actual, sin cambios.

## 2. Experiencia

- **Dónde se activa.** En «Presentar mi vivienda», el diálogo de configuración tiene una casilla nueva:
  - nombre: **«Empezar desde el plano»**, desactivada por defecto;
  - texto de ayuda: «Opcional: … No cambia el proyecto.»;
  - no se guarda: cada vez que se abre el diálogo vuelve a aparecer desmarcada.
- **Con la casilla marcada**, la presentación abre en el plano y se reproduce sola hacia el 3D (unos 6 s).
  - La tarjeta muestra un bloque «Desde el plano»:
    - una frase de estado: «Plano de la vivienda», «Los muros se levantan desde el plano», «La vista se abre en 3D» o «Vista general 3D»;
    - un deslizador de 0 (plano) a 100 (3D);
    - el botón «Ver el plano», que reproduce hacia atrás;
    - un botón principal que alterna «Ver en 3D», «Pausa» y «Continuar presentación».
  - Al llegar a 3D, el bloque desaparece y la presentación sigue tal como era.
  - En cada vista general aparece la herramienta **«Volver al plano»**, que repite el capítulo al revés (1 → 0). En el caso de un edificio, cada planta tiene su propia vista general.
- **Con reducción de movimiento**:
  - el capítulo se detiene en el plano;
  - «Ver en 3D» y «Volver al plano» saltan directamente de un estado al otro, sin fotogramas intermedios;
  - el deslizador sigue disponible, porque lo mueve el usuario y no es una animación automática.
- **Teclado y accesibilidad.**
  - El deslizador es un `input type=range` con `aria-label` y `aria-valuetext`, y responde a las flechas.
  - Las flechas fuera del deslizador navegan las vistas como antes.
  - Escape sale de la presentación.
  - En móvil, todos los objetivos táctiles miden 44 px o más.

## 3. Arquitectura

| Pieza | Papel |
|---|---|
| `js/presentation-story-core.js` (nuevo) | Módulo puro, sin DOM ni Three.js. `create(kind, input)` devuelve `stateAt(p)`, determinista. `NARRATIVES` registra los constructores: hoy solo `plan-reveal`. |
| `index.html` (View3D) | Añade `presentationStoryBegin(stop, {region, startRegion})`, `presentationStoryApply(p)`, `presentationStoryEnd({keepPose})` y el getter `presentationStoryInfo`. Saca el cálculo de la pose de vista general a `presentationStopPose()`, que ahora usan tanto `presentationGo` como la narrativa; la matemática es idéntica. |
| `js/presentation-ui.js` | La casilla del diálogo, el bloque de controles y la herramienta «Volver al plano». Los controles se crean solo si el capítulo está elegido y se eliminan del DOM al salir. |
| `.github/workflows/integration-browser.yml` | Un job nuevo, `presentation-story`, con la prueba unitaria y la de navegador. El job existente no cambia. |

Un único modelo:

- la narrativa no reconstruye geometría (no toca `opt.cut` por fotograma, no hay segundo modelo ni capas nuevas);
- solo cambia, de forma temporal, cuatro cosas: la cámara, la lente, near/far y la escala vertical del grupo de muros `archUp`. Es el mismo mecanismo que usa la animación de entrada y salida del 3D (`grow` / `applyGrow`).

Sin contratos nuevos: no se tocan schemas, persistencia, ProjectV1, BuildingV1 ni el plan de presentación.

## 4. Fórmula de cámara

Todo sale del proyecto abierto. No se copian FOV, distancias ni tiempos de FT3D.

**Datos de partida**

- las esquinas de los límites de la parada (`stop.bounds`);
- la altura máxima de muro;
- el aspecto de la pantalla;
- la región libre que deja la tarjeta;
- la pose final `E = presentationStopPose(stop)`: posición, objetivo y FOV 45°.

**Final (p = 1).** Se toma de la pose final:

- `d₁ = |E.pos − E.target|`;
- `dir₁ = (E.pos − E.target)/d₁`;
- la altura encuadrada en el plano del objetivo, `F₁ = 2·d₁·tan(fov₁/2)`.

**Inicio (p = 0)**

- La dirección tiene el mismo acimut que `dir₁` y una elevación de 89,9° (casi cenital). Así la transición es una inclinación pura, sin giro.
- El encuadre `F₀` es la menor altura con la que todas las esquinas del plano caben en la región libre, más un 8 % de margen.
- La lente es estrecha y derivada: el FOV más amplio que cumple `distancia ≥ 100 × altura de muro`. Con eso, la diferencia de perspectiva entre el pie y la coronación de un muro es ≤ 1 %, lo que se lee como plano. El FOV se acota entre 1,5° y 8°.
- El centro del plano se coloca en el centro de la región libre, con la misma compensación que `overviewPose`.

**Transición**, con `s = smoothstep((p − 0,12)/0,88)`:

- `tan(fov/2) = tan₀ · (tan₁/tan₀)^s` y `F = F₀ · (F₁/F₀)^s`, ambas interpolaciones geométricas, para que el cambio de tamaño por paso sea uniforme;
- `d = F / (2·tan(fov/2))`: es el dolly zoom, con el encuadre conservado;
- la elevación se interpola linealmente en ángulo; el objetivo, linealmente.

**Valores de la vivienda de ejemplo** (10 × 7 m, 16:10). Son medidos, no fijados en el código:

| p | fase | muros | FOV | distancia | altura encuadrada |
|---|---|---|---|---|---|
| 0 | plano | 0,012 | 2,86° | 280 m | 13,99 m |
| 0,25 | lente | 0,26 | 3,38° | 238 m | 14,04 m |
| 0,5 | lente | 0,90 | 8,75° | 94 m | 14,35 m |
| 0,75 | lente | 1 | 26,85° | 31 m | 14,73 m |
| 1 | 3D | 1 | 45° | 18 m | 14,91 m |

## 5. Conservación del encuadre

- La altura encuadrada pasa de forma continua de `F₀` a `F₁` y en el ejemplo varía un 6,6 %.
- Las pruebas unitarias comprueban que las esquinas del plano siguen en pantalla en los cinco puntos de control.
- La pose de p = 1 es la pose de la vista general (prueba de navegador, tolerancia de 1e-4).
- Si el capítulo está desactivado, esa pose no cambia, porque la calcula el mismo `presentationStopPose`.

**Dos regiones.** Para que al continuar no haya salto:

- la pose final se encuadra para la tarjeta tal como la dejará la presentación, sin el bloque del capítulo;
- el plano se encuadra junto a la tarjeta con el bloque (`startRegion`).

En móvil esto es necesario: la tarjeta está abajo y crece con el bloque. Lo detectó la prueba de 390×844.

## 6. Near/far

- Mientras dura la narrativa:
  - `near = max(near base, (d − alcance)·0,5)`;
  - `far = max(far base, d + 2·alcance)`;
  - `orbit.maxDistance` sube temporalmente;
  - alcance = radio del plano + altura de muro.
- En p = 1 se aplican los valores base.
- `presentationStoryEnd` restaura lente, near/far, `maxDistance` y la entrada de órbita, y deja la órbita sin actualizar mientras la narrativa está activa (guarda en `loop()`).
- `presentationGo`, `presentationRoute` y `presentationRestore` cierran la narrativa antes de hacer nada. Así ninguna ruta existente hereda una lente o unos límites modificados.

## 7. Elevación de muros

- `archUp.scale.y` va de 0,012 a 1 entre p = 0,08 y p = 0,6, con suavizado.
- Las luminarias de techo esperan a que los muros estén a altura completa.
- El mobiliario (`furnG`) no se escala: el plano se lee amueblado, como en el editor.
- Al terminar se llama a `applyGrow()`, la función existente, que devuelve los muros a su estado normal.

## 8. Reversibilidad

- `stateAt(p)` es una función pura y el reproductor solo elige p.
- Por eso 0→1, 1→0 y 0→1→0 pasan por estados idénticos:
  - en Node, 101 pasos con tolerancia de 1e-9;
  - en el navegador, posición, cuaternión y FOV con tolerancia de 1e-6 tras cambios de p desordenados.
- Una narrativa reconstruida con los mismos datos da los mismos estados.
- Los valores de p fuera de [0,1] se recortan; nunca se extrapolan.

## 9. Reducción de movimiento

- `playMs = 0`: plano ⇄ 3D sin fotogramas intermedios.
- La prueba registra p en cada fotograma y solo observa 0 o 1.
- El capítulo no avanza solo.

## 10. Pruebas

**Unitarias**: `tests/presentation-story.test.cjs`, 7 pruebas.

- p = 1 coincide exactamente con la pose final.
- p = 0 es el plano: lente derivada, vista cenital, mismo acimut y esquinas dentro de pantalla y de near/far.
- Puntos de control monótonos, con el encuadre conservado.
- Reversibilidad y determinismo.
- Funciona con otros tamaños, otro aspecto y la región de la tarjeta en móvil.
- Errores legibles y entrada intacta.
- `playMs`.

**Navegador**: `tests/presentation-story.browser.test.cjs`, 4 pruebas, con el edificio real y la escena real.

1. Escritorio 1440×900:
   - con el capítulo desactivado: sin controles nuevos, misma lista de herramientas, misma pose;
   - con el capítulo activado: puntos de control 0 / .25 / .5 / .75 / 1, p = 1 igual a la vista general sin capítulo, near/far base en p = 1, reversibilidad, continuación sin salto, «Volver al plano» y vuelta a 3D;
   - al salir: mismo proyecto, mismo historial de deshacer y rehacer, mismos materiales, ninguna preferencia guardada, mismo estado 3D que sin el capítulo (lente, near/far, órbita, muros, mobiliario y muros sin duplicar).
2. Reducción de movimiento.
3. Móvil 390×844: encuadre, objetivos de 40 px o más, sin desplazamiento horizontal, p = 1 igual a la vista general.
4. Dúplex de dos plantas: capítulo en la planta baja, «Volver al plano» en la planta alta, cada planta termina en su vista general y se restauran el nivel del editor y el proyecto.

**Batería completa.** Resultados en la descripción de la PR:

- todas las pruebas unitarias del repositorio;
- las suites existentes de Presentación (general, vista general, encuadre, foco, revelado, recorrido, lote ZIP, sombras, luz, minimapa y edificio);
- captura 3D;
- humo del grabador de vídeo.

## 11. Capturas

Se generan con la prueba de navegador en `STORY_ARTIFACTS`; en CI se suben como artefacto `presentation-story-<sha>`:

- `1440x900-p000…p100.png`
- `1440x900-off-overview.png`
- `390x844-p000/p050.png`
- `1440x900-duplex-p000/p050.png`
- `1440x900-duplex-upper-p000.png`

No se suben al repositorio.

## 12. Límites conocidos

- **Orientación del plano.** El plano inicial se orienta como la vista 3D final (mismo acimut), no con el norte arriba como el editor 2D. Es intencionado, para evitar que la imagen gire mientras se inclina. Mostrarlo «como en el editor» exigiría un giro durante la transición y queda como posible variante.
- **Altura de muro.** Los muros suben como un único volumen, con una sola escala para el grupo. No hay orden por tramos ni por estado (existente, nuevo o a demoler). Un sombreado del plano «a lo CAD» queda para un corte siguiente.
- **Capturas a mitad de narrativa.** No se permiten capturas ni el lote ZIP mientras la narrativa está abierta: «Guardar PNG», «Compartir imagen» y «Vistas + proyecto ZIP» están desactivados. Al terminar se activan como antes.
- **Grabación de vídeo.** El vídeo del recorrido no incluye el capítulo.
- **Capítulo inicial.** Solo existe para paradas de vista general; las estancias siguen como estaban.

## 13. Multiplanta

- Cada planta usa su propia vista general (`stop.bounds`, nivel activo) y su propio grupo de muros.
- Las plantas inferiores siguen apiladas como siempre, porque la narrativa no toca `levelsG`.
- Al salir, el editor vuelve a la planta en la que estaba.

## 14. Rendimiento

- `stateAt` cuesta unos 0,5 µs por llamada en Node.
- Por fotograma solo se asignan unas propiedades de cámara, una matriz de proyección y una escala de grupo:
  - no hay reconstrucciones, materiales nuevos ni geometría nueva;
  - no hay asignaciones de GPU.
- El bucle de render es el existente.
- La prueba de 1440×900 en SwiftShader reproduce el capítulo completo sin errores de página.

## 15. Regresiones

- La categoría **«NO REGRESSION / ADDITIVE CHECK»** está en la PR, con cada capacidad y cómo se ha comprobado.
- **Capítulo desactivado.** La única diferencia visible es la casilla nueva en el diálogo. La presentación, sus herramientas, su pose, su salida y lo que guarda son idénticos.
- **Cambio interno.** El único cambio en código existente es la extracción de `presentationStopPose` (misma matemática) y llamadas que no hacen nada cuando no hay narrativa: `endPresentationStory()` en `presentationGo`, `presentationRoute` y `presentationRestore`, y la guarda de `orbit.update()` en `loop()`.

## 16. Siguiente corte (propuesta, sin implementar)

- **FT3D-1b.** Plano con apariencia de plano: sombreado de muros de corte, etiquetas de estancias y cotas principales a p = 0, que se desvanecen al abrir la lente. Opcionalmente, el giro hacia norte arriba como variante.
- **Narrativas aditivas** sobre el mismo registro `NARRATIVES`:
  - Section Sweep;
  - Open Section;
  - axonometría explosionada por plantas;
  - Sunlit Elevation, que usaría el motor Solar existente.

## Garantía de integración aditiva

**Se reutiliza**

- View3D: la escena, el bucle, `overviewPose`, `applyGrow`/`grow` y `archUp`.
- Presentation Core: el plan de paradas y la vista general.
- La presentación existente (`presentationGo`, salida y `presentationRestore`) y su tarjeta.
- El gestor de niveles del edificio (`showLevel`).
- Los materiales, la luz de presentación, el exterior y el mobiliario, que la narrativa no cambia.

**Se mantiene intacto**

- Vista 2D y Vista 3D del editor.
- La presentación y todas sus herramientas: captura, compartir, contexto exterior, material, luz, revelar acabados, sombras, recorrido, lote ZIP y observaciones.
- El minimapa, la navegación por teclado y las flechas.
- Multiplanta, mobiliario, materiales y Solar.
- El vídeo del recorrido y todas las exportaciones.
- El historial de deshacer y rehacer, y los datos guardados.
- Reducción de movimiento.

**Se añade**

- La casilla «Empezar desde el plano», desactivada por defecto y sin persistencia.
- El bloque de controles del capítulo.
- La herramienta «Volver al plano», solo si el capítulo está elegido.
- Cuatro funciones de View3D.
- El módulo puro de narrativas.
- Las pruebas y un job de CI separado.

**Cómo se accede.** Pulsa «Presentar mi vivienda», marca «Empezar desde el plano» y pulsa «Iniciar presentación».

**Sin activarlo**, Rubik se comporta como antes. Las pruebas lo comprueban en escritorio, móvil, reducción de movimiento y dúplex: no hay controles nuevos, la lista de herramientas, la pose, el estado 3D tras salir y lo guardado son los mismos.

**No se elimina, sustituye, oculta ni cambia sustancialmente ninguna capacidad existente.** No hay cambios de contratos, schemas ni persistencia. La Presentación actual no se convierte en FT3D de forma automática.

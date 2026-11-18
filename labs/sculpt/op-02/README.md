# SCULPT OP-02 · Render 3D bajo demanda

Base RUBIK `163df68e83a80ddf11a008d573ee257d51c1821f`. Código medido `ee90df612f51c430bfb7c6569e8cea7ccea165c7`. [Archivo SOURCE EXACT y clasificación](https://github.com/Juanmaes83/floorplan-3d/blob/50a4bab0026d08e8c30f4c18b3dca86448973c31/labs/sculpt/op-02/README.md).

## Escultura y cirugía

Se recuperó la coalescencia de `drawScheduler.ts` de OpenPlan3D `771c9e1`, con su licencia MIT. Se generalizó la cancelación para que el visor de RUBIK pueda ocultarse y reaparecer con la misma instancia. El visor sigue usando las firmas de escena, el renderer, los materiales, las cámaras y la geometría de RUBIK.

La entrada, el cambio de cámara, el acabado, el modelo cargado, el tamaño, la luz, la selección o el paso de narrativa invalidan el frame. La amortiguación de órbita, la animación, el vuelo, el desplazamiento de paseo y las puertas mantienen el bucle mientras tienen trabajo. Las animaciones con reloj propio, como el revelado o el recorrido guiado, publican los cambios al mismo visor. El reloj de simulación se rearma al salir del reposo. Se conservan la captura síncrona y la suspensión durante las áreas de trabajo.

### Corrección de órbita y Recorrer

**SOURCE / ISOLATE.** `orbitDamping.ts`, `orbit-damping.test.ts` y `walkthroughMotion.ts` ya están fijados en el [SOURCE EXACT de OP-02](https://github.com/Juanmaes83/floorplan-3d/blob/50a4bab0026d08e8c30f4c18b3dca86448973c31/labs/sculpt/op-02/SOURCE-EXACT.json). El baseline del donante se reutiliza. En la candidata `d27baca`, [GitHub Actions registró 78 renders en 75 s después del arrastre](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44389372598/job/135102509264). [El traspaso de Studio Presentation](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44385563153/job/135089034833) llegó a Recorrer, pero falló al medir el desplazamiento con W. [NAV3D](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44385563155/job/135089033005) registró además que el canvas interceptaba el clic de cabecera al pulsar Esc inmediatamente después de pedir la captura del puntero.

**CLASSIFY / SCULPT.** KEEP de la fórmula de amortiguación del donante, `1 - (1 - factor) ** (60 × segundos)`, con su límite de un segundo y restauración del factor de los eventos de puntero. GENERALISE del arranque del reloj por entrada, el límite de 250 ms y el descarte de entrada al perder foco de `WalkthroughMotion`. RUBIK conserva el factor orbital de `0.05`, WASD y flechas, joystick, velocidad y sprint, poses del recorrido y los subpasos de colisión de hasta 50 ms. El movimiento pendiente se consume antes de cambiar o soltar la entrada, incluido un pulso completo entre dos renders. Esc cancela tanto una captura activa como una captura aún pendiente.

**TEST.** Las comprobaciones originales de órbita y del traspaso a Recorrer conservan sus aserciones y esperas. Las pruebas de contrato añaden equivalencia temporal entre 1 y 120 FPS, restauración del factor y consumo de movimiento antes del primer frame. Las comparativas archivadas corresponden al SHA que figura en su encabezado.

## Comparación en el mismo equipo

Se conservaron las [12 mediciones anteriores](https://github.com/Juanmaes83/floorplan-3d/blob/50a4bab0026d08e8c30f4c18b3dca86448973c31/labs/sculpt/op-02/rubik-baseline-163df68.json). Su ventana tras la entrada podía incluir parte de la transición. Para medir reposo estable y fidelidad se añadió un control de `master` por escenario y perfil. Los controles y las 12 mediciones de OP-02 usan las mismas escenas, cámara, resolución y criterio de espera a la entrada, la geometría y las cargas.

| Escena y perfil | Antes archivado, renders/s sin entrada de usuario | Master ya estable, renders/s | OP-02 estable, renders/s | Tarea del hilo del renderer %, master → OP-02 | Pulsación hasta cámara distinta, ms, master → OP-02 |
|---|---:|---:|---:|---:|---:|
| Vacía, escritorio | 56,4 | 58,7 | **0** | 4,0 → 1,6 | 16,3 → 17,2 |
| Amueblada, escritorio | 3,4 | 3,9 | **0** | 4,6 → 0,9 | 201,7 → 23,9 |
| Multiplanta, escritorio | 28,2 | 27,1 | **0** | 5,7 → 1,8 | 35,8 → 18,5 |
| Vacía, táctil | 45,2 | 41,7 | **0** | 3,1 → 1,2 | 73,4 → 33,3 |
| Amueblada, táctil | 3,9 | 4,7 | **0** | 4,9 → 1,0 | 662,7 → 39,7 |
| Multiplanta, táctil | 25,6 | 25,1 | **0** | 4,5 → 1,6 | 120,1 → 35,0 |

- **12/12 ventanas de 1.500 ms** con cero callbacks del renderizador, cero renders y cero reconstrucciones. Cada arrastre generó un nuevo frame con cambio de cámara.
- **12/12 PNG con SHA-256 idéntico** a su control, y 12/12 cámaras idénticas. El escritorio es 1440×900 DPR 1 y el perfil táctil 390×844 DPR 2. Se usaron Chromium 151, Windows 11 y SwiftShader en el mismo equipo. El tiempo de tarea del hilo y la latencia de entrada caracterizan este ensayo; no son medidas de potencia, GPU física ni móvil físico.
- [Control estable](rubik-pre-settled.json) · [OP-02](rubik-after.json) · [Medidor reproducible](measure-rubik.cjs). El JSON de OP-02 conserva el SHA de checkout durante la captura y el SHA del código correspondiente. Se confirmó que el SHA-256 del HTML instrumentado reproduce el de cada muestra con el blob del commit de producto.

Para repetir, usar Node 22 y Playwright 1.62.1 con `NODE_PATH` y `CHROME` configurados de la misma forma. Ejecutar `node labs/sculpt/op-02/measure-rubik.cjs <worktree> <salida.json>`. El modo `OP02_DEMAND=1` exige cero callbacks y renders. `OP02_REPEATS` define muestras por combinación. El medidor deja los archivos del worktree intactos.

## Validación, convivencia y rollback

La suite [OP-02](../../../.github/workflows/op02-render-demand.yml) mantiene un único workflow dirigido. Cubre coalescencia, cancelación y rearme, órbita, luz, puertas, maqueta blanca, suspensión, GLB autorizado tardío y texturas verificadas que repintan los píxeles al llegar.

Pasaron cuatro casos propios y nueve regresiones dirigidas de multiplanta, captura PNG, Evolución de obra 4D, navegación en escritorio y táctil, Dibujo vivo reversible, detalle arquitectónico y paseo sobre terreno. El último caso reprodujo una regresión de la primera candidata: el navegador podía haber adquirido Pointer Lock mientras `PointerLockControls.isLocked` aún era falso. Se perdía el primer despertar del teclado. La notificación de bloqueo ahora encola un frame y este comprueba el movimiento tras actualizarse el controlador. La prueba original volvió a pasar con y sin terreno. Ese ajuste afecta al paseo; las mediciones y capturas en órbita conservan el código medido.

La simulación local con #265 `b9f4b3c` da el árbol `b3ebee4f59f0f2a468a1576136056eab8bc09179`, sin conflicto. Con #262 → #263 → #264 y #265, da `774485d7dee7852d00eb78223abe1ddad3b140c8` para el código medido. El código funcional de las otras ramas conserva su historial. Revalidar contra el SHA efectivo de master antes de integrar. El orden de F0 y la cartera canónica de 14 piedras más R01–R03 siguen en su [handoff](https://github.com/Juanmaes83/floorplan-3d/blob/341624b79ed2cb8bb6c4df38073deeeccbb35f33/docs/integration/HANDOFF-F0-G02-SCULPT-2026-11-18.md).

**GO para Preview y revisión humana** con la evidencia local. La integración requiere checks del SHA definitivo, cierre de las dependencias y autorización. El rollback tras una integración autorizada es revertir el commit de integración de OP-02 y verificar el bucle anterior, navegación, captura, capas de escena y exportación G-02. El corte no cambia datos persistidos.

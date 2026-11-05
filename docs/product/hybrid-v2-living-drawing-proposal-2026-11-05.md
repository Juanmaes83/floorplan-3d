# Hybrid V2: «el dibujo que cobra vida». Propuesta, storyboard y prueba de concepto

Fecha: 05-11-2026.

**Estado:** propuesta para aprobación humana. La prueba de concepto (PoC) es **aislada y está fuera del producto**. Esta entrega no cambia código de producto, no hace merge ni despliega. Hybrid V1 (`feat/hybrid-registered-elevation-v1@07ae6f9`) queda intacto.

Brief: «RUBIK SOTA — HYBRID V2 · SPATIAL REALISM PATCHES».

## 0. Qué se entrega

| Pieza | Dónde |
|---|---|
| Esta propuesta: análisis, storyboard, estrategia y decisiones | este documento |
| Vídeo de la PoC (13 s, 1280×720, 24 fps) sobre la vivienda de ejemplo de RUBIK (`master@0f9c6ea`) | `docs/qa/hybrid-v2/2026-11-05/hybrid-v2-poc-salon-cocina.mp4` |
| Storyboard S1–S7 con fotogramas reales de la PoC | `docs/qa/hybrid-v2/2026-11-05/storyboard-S1-S7.jpg` |
| Comparación V1 frente a V2, fotogramas reales de ambos | `docs/qa/hybrid-v2/2026-11-05/v1-vs-v2.jpg` |
| Vídeo de Hybrid V1 grabado hoy en su HEAD (`07ae6f9`) | `docs/qa/hybrid-v2/2026-11-05/hybrid-v1-07ae6f9-forward.mp4` |
| Fuente del prototipo: arnés de QA, no lo carga la app | `docs/qa/hybrid-v2/2026-11-05/poc/` |
| Plan de la secuencia: claves de cámara, semillas, objetos y vestido de materiales | `docs/qa/hybrid-v2/2026-11-05/plan.json` |

## 1. Referencias estudiadas

- **`Juanmaes83/lintel-flat-2d`.** Es la fuente más útil: v10 legible y la carpeta `teach/` con las decisiones, las técnicas y las lecciones.
  - *«Each room stays an ink drawing until you step in, then its real materials sweep across it.»*
  - Decisión 12: *«The scan has to follow the camera, nothing ahead is finished early»*.
  - Decisión 33: *«Furniture and decor arrive one whole thing at a time, opaque… ink on paper or finished»*.
  - Lección de la técnica: el primer relleno crecía como una esfera y se rechazó porque *«feels like a big round circle is just growing»*.
- **`Juanmaes83/lintel-live` y `Juanmaes83/casa-serra`.** Son copias publicadas y minificadas. El mecanismo es `revealAt` por estancia: un frente desde un origen, con un anillo de acento. La tinta sale de un pase de bordes sobre profundidad y normales (`fx-post.js`).
- **`Juanmaes83/flat-to-3d`.** Contiene las siete técnicas. La 07 (*Sunlit Elevation*) es el origen de Hybrid V1.
- **Vídeo de referencia de 9 min usado en V1.** Revisé fotograma a fotograma los segmentos de Lintel:
  - 05:28–05:52: el plano sube, la entrada y el salón se materializan con la cocina todavía dibujada;
  - 06:44–06:57: la puerta real con el interior dibujado detrás;
  - 07:43–08:12: el salón real y la cocina dibujada en profundidad.
- **Las cuatro capturas de Juanma:** *The Entrance*, *The Living Room*, el patio y *The Glass Gallery*.
- **Pendiente:** el archivo `ESTO SI QUE MUESTRA LA TRANSICIÓN DE FORMA CLARA.mp4` **no está en este entorno**. El análisis se apoya en el vídeo de 9 min, en las capturas y en el código. Si se adjunta, lo contrasto fotograma a fotograma.

## 2. Qué hace especial la referencia

1. **Un modelo y dos representaciones registradas píxel a píxel.** El dibujo es la misma geometría 3D vista como tinta sobre papel. Por eso la transición no es un fundido entre dos imágenes: un punto pasa de dibujo a material **en su sitio**.
2. **Cada punto tiene su momento.** La realidad no llega a toda la estancia a la vez: llega a cada pieza cuando le toca. La escena *termina alrededor de la cámara*.
3. **Contraste en profundidad.** El momento más fuerte es un primer plano real con una estancia dibujada detrás (salón real, cocina dibujada). Esa composición es el plano de venta.
4. **Opacidad.** Un objeto es tinta o está terminado. Nunca hay fantasmas translúcidos.
5. **Contención gráfica.** Línea fina de 1 px, papel claro, apenas rayado y un acento solo en el frente.
6. **La cámara no espera.** Lo que está detrás y a los lados es real; lo que está delante sigue dibujado.

**Dónde va más allá el brief:** Lintel usa un frente por estancia o «piezas colocadas» (*laid*). El brief pide **varias manchas asíncronas que nacen sobre muebles protagonistas**, crecen por su cuenta y se conectan. Eso es lo que implementa la PoC.

## 3. Por qué Hybrid V1 no alcanza esa experiencia

Lo grabé hoy con Playwright sobre su HEAD (`07ae6f9`, 72 pasos, 1280×800): `hybrid-v1-07ae6f9-forward.mp4`.

| Aspecto | Hybrid V1 (medido) | Lo que pide Hybrid V2 |
|---|---|---|
| Ámbito | Solo la fachada exterior (`elevation-open`) | Estancias interiores, una tras otra |
| Dibujo | Rayado diagonal negro y grueso donde no llega el sol (mapa de sombras) | Grafito fino sobre papel, muebles reconocibles |
| Transición | **Un único frente diagonal** en coordenadas de fachada, de izquierda a derecha | Manchas asíncronas ancladas a muebles elegidos |
| Contenido | Muros lisos; ni mobiliario ni objetos | Mobiliario, carpinterías y objetos protagonistas |
| Cámara | Alzado frontal que se abre a perspectiva | La cámara se mueve antes del 100 % hacia una estancia aún dibujada |
| Resultado final | Un paño beige liso | Una estancia viva |

**Conclusión:** V1 no se puede afinar hasta V2 porque el mecanismo es otro. Se reutiliza la disciplina, pero no el shader (ver §6.3).

## 4. Storyboard: demostración mínima (salón → cocina)

Lámina: `storyboard-S1-S7.jpg`. Tiempos de la PoC; el producto los recibirá del `p` de la Story.

| | Tiempo | Qué se ve | Elementos protagonistas | Cámara |
|---|---|---|---|---|
| **S1** | 0–0,9 s | Salón dibujado a grafito: sofá, mesa de centro, alfombra, mueble de TV, sillón y planta reconocibles; al fondo, comedor y cocina también dibujados | — | Altura de ojos (1,6 m), avance mínimo |
| **S2** | 0,9 s | **Primera mancha** sobre el brazo y el cojín del sofá: crece por el sofá revelando tela, color y sombra | Sofá | Avance lento |
| **S3** | 1,75–4,0 s | Manchas independientes a 1,75 / 2,35 / 2,9 / 3,45 / 3,95 s (intervalos de 0,85 / 0,6 / 0,55 / 0,55 / 0,5 s, no regulares). Desde cada mueble la realidad se abre al suelo de roble y a los muros con borde irregular | Mesa de centro y alfombra, muro del fondo, mueble de TV, planta, sillón | Avance lento con deriva lateral |
| **S4** | 4,4–5,0 s | **Momento decisivo:** salón casi materializado, con fragmentos de techo y esquinas aún a lápiz; comedor y cocina **dibujados en profundidad** | — | Se inicia el giro |
| **S5** | 4,4–7,2 s | Antes del 100 %, la cámara gira y avanza hacia el comedor y la cocina | — | Giro y desplazamiento continuos (spline), sin paradas |
| **S6** | 6,55–9,25 s | Nueva transformación: manchas en la mesa de comedor, el frigorífico, la encimera, el aparador y el frente de cocina. El suelo y el azulejo se abren desde ellas | Mesa, frigorífico, encimera, aparador, frente de cocina | Aproximación a la cocina |
| **S7** | 10,2–13 s | Cocina hacia el 80–90 %, con el techo aún dibujado; la cámara **ya prepara** el giro a la siguiente estancia | — | Giro hacia el pasillo |

**Para la experiencia completa (tras aprobación):** entrada → salón → comedor y cocina → pasillo → dormitorio principal → baño, con la misma gramática. En cada estancia hay de 3 a 6 protagonistas elegidos por reglas (§6.2), las manchas son asíncronas y la cámara sale antes del 100 %.

## 5. Cómo funciona la PoC (método gráfico)

Todo ocurre sobre la escena real de RUBIK, con el `renderer` de RUBIK. El arnés inyecta en memoria un gancho de **solo lectura**; el repositorio no se modifica.

1. **Pase REAL.** La escena tal como la dibuja RUBIK: sus materiales, la luz de presentación «cálida» con HDR, las sombras de contacto y las superficies en calidad «enhanced».
2. **Pase AUX.** La misma escena escribe por píxel su **posición en el mundo** y su **identidad** (arquitectura o pieza de mobiliario). Los materiales se cambian solo durante este pase y se restauran al momento.
3. **Composición.**
   - **Dibujo:**
     - papel claro con fibra y un sombreado muy suave;
     - grafito a partir de los bordes de profundidad, de normal y de identidad;
     - un segundo trazo levemente desplazado (el lápiz que repasa la línea);
     - rayado fino solo donde falta luz (oclusión);
     - líneas que se aclaran con la distancia, para dar profundidad.
   - **Momento de llegada t(p) de cada punto del mundo:**
     - una **mancha anclada** crece primero por su mueble protagonista;
     - después se abre al suelo y los muros **de su propia estancia**, limitada por un mapa de estancias rasterizado desde los polígonos del plano;
     - el borde es irregular (ruido 3D en coordenadas de mundo más piezas de 45 cm con desfase);
     - los muebles no protagonistas llegan **enteros y opacos** cuando el frente alcanza su punto de entrada (la lección de Lintel);
     - el techo llega el último, después de los muros.
   - **Frente:** un contorno de grafito que sigue el borde y una breve subida de luz en lo que acaba de llegar. No hay fundidos ni transparencias.
   - **Capa real:** se le aplica oclusión ambiental desde el buffer AUX y un grado suave (contraste ×1,10, saturación ×1,03, viñeta).
4. **Las manchas están ancladas en el mundo, no en la pantalla.** Cuando la cámara se mueve siguen pegadas a sus objetos. No es una máscara 2D superpuesta.

**Vestido de materiales.** El ejemplo usa colores lisos en tono pastel y el realismo resulta débil. Solo para la PoC (no se guarda), y únicamente con el catálogo de RUBIK mediante `FloorPlanSurfaces.apply`:

| Superficie | Material del catálogo |
|---|---|
| Suelo de salón, comedor y pasillo | `surface-oak-wood-planks` (PBR) |
| Suelo de cocina | `surface-marble-01` (PBR) |
| Muros de cocina | `surface-long-white-tiles` |

Probé los yesos del catálogo en los muros del salón y **los descarté**: a esa escala se leen como manchas de humedad.

## 6. Estrategia de implementación en RUBIK (solo tras aprobación)

### 6.1 Arquitectura compatible

- **Narrativa pura `living-drawing`** en `presentation-story-core.js`: `stateAt(p)` determinista con las poses de cámara y un reloj por estancia. Hereda el player: pausa, búsqueda, reversa, *reduced motion* y captions.
- **Cámara.** Usa la ruta validada `FloorPlanPresentationRoute.plan` + `choreography`, con 220 mm de holgura, igual que «Sección → visita espacial V1». La cámara nunca atraviesa muros ni muebles. El encuadre de cada estancia se calcula desde su conjunto de protagonistas y desde la región que deja libre la tarjeta.
- **Núcleo puro `presentation-living-drawing-core.js`, con tests unitarios:**
  - elige los protagonistas;
  - genera semillas con desfase determinista;
  - aplica reglas de tiempo: intervalo mínimo e irregular, y nada por delante de la cámara terminado.
- **View3D** gana `presentationLivingDrawing{Begin,Apply,End}`:
  - un *render target* AUX y un pase de composición;
  - no clona materiales; el cambio dura solo el pase AUX;
  - libera sus recursos al terminar.
  - **Fallback honesto:** sin render target float, la Story sigue sin el efecto y el caption dice por qué.
- **Rendimiento:**
  - AUX a media resolución en móvil;
  - oclusión de 6 muestras;
  - tinta con 4 vecinos;
  - objetivo de 60 fps en escritorio con GPU y 30 fps en móvil, a medir.
  - En la PoC se midió entre 2,4 y 5 s por fotograma con SwiftShader (CPU). **No representa una GPU** (`MOBILE_PHYSICAL_PENDING`).

### 6.2 Protagonistas por tipo de estancia (regla inicial, ajustable)

| Estancia | Orden de protagonistas |
|---|---|
| Salón | sofá > mesa de centro o alfombra > mueble de TV > sillón > planta > un muro con luz |
| Comedor y cocina | mesa > frigorífico > encimera > aparador > frente de cocina |
| Dormitorio | cama > armario > escritorio > mesillas |
| Baño | lavabo > ducha o bañera |

El primero nace donde la cámara mira al llegar. Los intervalos son irregulares, con un mínimo de 0,45 s.

### 6.3 Qué se reutiliza y qué se replantea

| Se reutiliza | Se replantea |
|---|---|
| Player de Story, `p`, reversa, *reduced motion*, captions | El shader de V1 (rayado por sombra y frente diagonal): se sustituye |
| Ruta validada y coreografía (D13) de «Sección → visita espacial» | El ámbito de fachada: pasa a estancias interiores |
| Identidad real de objetos (`userData.fid` y `wallId`) | Los muebles reciben identidad por pieza en el pase AUX |
| Luz de presentación, superficies y sombras de contacto de RUBIK (la capa real es RUBIK) | — |
| Disciplina de V1: gestión de recursos, procedencia y ningún cambio en el JSON | — |

### 6.4 Checkpoints, cada uno con vídeo y puerta humana

| Checkpoint | Contenido | Evidencia |
|---|---|---|
| **C0** | Núcleo puro y tests: protagonistas, semillas, tiempos | — |
| **C1** | Solo la capa de dibujo en el producto | Láminas para aprobar el grafito |
| **C2** | Manchas y llegada en una estancia | Vídeo comparado con esta PoC |
| **C3** | Cadena salón → cocina dentro de la Story real | Vídeo |
| **C4** | Vivienda completa, reversa, *reduced motion*, móvil vertical y horizontal | Vídeos |
| **C5** | Rendimiento en GPU real, fallback, regresiones (section, story, walk, templates) y CI | Informe |

## 7. Auditoría de la PoC

Auditoría completa: `docs/qa/hybrid-v2/2026-11-05/poc-audit.md`.

**Resumen:**
- **Demuestra el mecanismo:** dibujo a grafito sobre la geometría real, manchas asíncronas ancladas a muebles, coexistencia en profundidad y salida de cámara antes del 100 %.
- **Defectos abiertos:**
  - la TV negra entra en el encuadre (5–6,5 s);
  - la puerta de entrada abierta, con un exterior blanco (6–8,5 s);
  - bordes rasgados en los muros del comedor (~10 s);
  - la planta en primer plano (9–13 s);
  - un realismo correcto pero no premium por los materiales del ejemplo;
  - un trazo aún «CAD».
- Cada defecto tiene causa y corrección propuesta.

## 8. Decisiones que necesito de Juanma

1. **Storyboard y protagonistas.** ¿Se aprueban S1–S7 y el orden de protagonistas de §6.2?
2. **Acento del frente.** Las opciones son grafito solo (como en la PoC), una línea petróleo de RUBIK o el naranja de Lintel.
3. **Materiales de la presentación.** ¿Puede RUBIK proponer acabados del catálogo para estancias que no los tienen (como hace la PoC), o la presentación debe usar exactamente los del proyecto?
4. **Ritmo.** Unos 6 s por estancia. ¿Reproducción automática o guiada por desplazamiento (*scroll*)?
5. **Implementación.** ¿Se autorizan C0–C1 en una rama aislada?

## 9. Decisiones de Juanma (05-11-2026) y lo que implican

| # | Decisión | Qué implica en el diseño |
|---|---|---|
| D1 | **Storyboard S1–S7 aprobado como dirección.** Se mantienen las manchas asíncronas sobre protagonistas, la convivencia de dibujo y realismo y la salida antes del 100 %. La TV, la puerta y la planta no deben dominar la composición | Regla de encuadre en el núcleo: penaliza los objetos grandes y oscuros (pantallas), las puertas abiertas al exterior y los objetos altos a menos de 1,5 m de la línea de visión. La puerta de entrada se cierra durante la secuencia y se restaura al terminar. Ningún protagonista oscuro abre una estancia |
| D2 | **Bordes en grafito fino y elegante.** Sin naranja ni color. Deben leerse como materialización arquitectónica, no como pintura desconchada | En muros y techos, el frente avanza por **paneles completos** (piezas arquitectónicas) con un contorno de grafito fino. El ruido orgánico queda solo en suelos y muebles, con amplitud baja. Sin islas por debajo de un tamaño mínimo en pantalla |
| D3 | **Ambientación opcional** con acabados del catálogo de RUBIK, **claramente diferenciada** de los materiales del cliente; el proyecto no se modifica ni se guarda | Una capa de ambientación aparte, solo para la presentación, desactivada por defecto. Lleva etiqueta visible «Ambientación sugerida · no forma parte del proyecto». El JSON del proyecto no cambia, y un test lo comprueba |
| D4 | **Reproducción automática y cinematográfica**, con pausa, avance y retroceso; unos 6 s por estancia como referencia flexible | Narrativa pura de Story: hereda pausa, búsqueda, reversa y *reduced motion*. La duración por estancia se ajusta a su número de protagonistas, entre 5 y 8 s |
| D5 | **Recomendación:** empezar C0 y C1 en una rama aislada, con `master`, Section y Hybrid V1 intactos. **La autorización efectiva se confirmará por separado** | **No se empieza C0 ni C1 hasta esa confirmación.** No hay merge y no se amplía el alcance |

**Fuera de alcance hasta nuevo aviso:** el merge de Hybrid V2, el despliegue y cambios en Section, Story existente o Hybrid V1 más allá de lo que pida cada checkpoint aprobado.

La PoC y su evidencia se conservan en `docs/qa/hybrid-v2/2026-11-05/` como referencia visual.

## 10. Plan de C0 y C1 (pendiente de autorización expresa)

**Rama:** `feat/hybrid-v2-living-drawing`, creada desde `master`. Cada checkpoint termina con commit, push, HEAD remoto verificado, pruebas y evidencia, y espera revisión.

### C0: núcleo puro (sin efecto visible en la app)

`js/presentation-living-drawing-core.js` (UMD) y `tests/presentation-living-drawing-core.test.cjs`.

**Contenido:**
- **Protagonistas por tipo de estancia (§6.2)** con reglas de exclusión de D1: una pantalla o un objeto oscuro y grande nunca es la primera mancha; las puertas nunca son protagonistas; las plantas, solo como protagonista secundario.
- **Semillas deterministas** (hash del proyecto y de la estancia): intervalos irregulares de al menos 0,45 s y nunca dos iguales seguidos.
- **Línea de tiempo por estancia:** 5–8 s según el número de protagonistas; la cámara sale hacia el 70–80 %.
- **Variante de movimiento reducido:** manchas por estancia sin desplazamiento de cámara.
- **Ambientación (D3):** sugerencias del catálogo con `source: 'ambientacion'`, en un objeto aparte.

**Pruebas que deben pasar:**
- determinismo;
- intervalos irregulares;
- protagonistas y exclusiones en el ejemplo y en el edificio de 2 plantas;
- `stateAt(p)` puro y simétrico en reversa;
- ambientación sin mutar el proyecto (igualdad profunda antes y después).

**Evidencia:** tabla de protagonistas y tiempos que el núcleo genera para el ejemplo. **Visual:** ninguna; es núcleo puro.

### C1: capa de dibujo en el producto (solo dibujo, sin manchas)

**Contenido:**
- View3D gana `presentationLivingDrawingBegin/Apply/End`: un render target AUX (posición e identidad), composición de grafito sobre papel según D2 y fallback si no hay render target float.
- Opción nueva en «Presentar mi vivienda», **desactivada por defecto**. Sin ella, la app es idéntica a `master`, y un test lo comprueba.

**Evidencia:**
- láminas del salón, comedor y cocina y del dormitorio principal a 1440×900, 390×844 y 844×390, en dibujo puro, para aprobar el grafito;
- recursos antes y después de entrar y salir 5 veces, sin fugas;
- coste por fotograma en SwiftShader, indicando que no es una GPU;
- suites `section`, `story`, `walk`, `walk-controls` y `templates`, más regresiones comparadas con `master`;
- CI en el HEAD final.

**Puerta humana:** revisión del grafito antes de pasar a C2 (manchas).

# Estudio LoRA LAB frente a Rubik: gate de Roadmap 2 §3.4 (17-10-2026)

**Estado:** estudio documental para decisión. **No es una fase aprobada, no contiene código y no cambia `FloorPlanProjectV1`.** Responde a la evaluación transversal de [Roadmap 2 §3.4](../ROADMAP-2-proposal.md#34-lora-lab-siguiente-evaluación-de-vivienda-completa) que el [roadmap canónico](../ROADMAP.md#estado-vigente-tras-la-integración-del-17-10-2026) abrió tras integrar #38, #39 y #42. Amplía, sin sustituirlas, la [nota exploratoria](loralab-design-reference-2026-10-17.md), la [auditoría de la grabación](loralab-video-gap-audit-2026-10-17.md) y la [matriz de candidatos](loralab-deep-review-2026-10-17.md). El orden 4–8 de Roadmap 2 sigue siendo orientativo y la cadena MCP #40 → #41 → #43 queda fuera de este estudio.

**Base comparada:** `master` `b294739`, posterior a los merges de #38 (`34aff2c`), #39 (`85aaf77`), #42 (`05d5514`) y la reconciliación #47. Candidate 04 de LAB Astra sigue siendo una referencia visual independiente; no se compara como capacidad de Rubik.

## 1. Acceso a la herramienta

| Fecha y vía | Resultado |
| --- | --- |
| 17-10-2026, `curl` a `https://fun.loralab.top/tool/c9ae6fe7-…` y a `loralab.top` desde el contenedor de esta sesión | **Denegado** por la política de red del entorno (`CONNECT tunnel failed, response 403`). En la revisión anterior el nombre ni siquiera resolvía (`ENOTFOUND`). |
| 17-10-2026 21:37 UTC, segundo y último intento, sin cambio de configuración | Igual: `CONNECT tunnel failed, response 403`. No se repetirá hasta que el entorno permita `fun.loralab.top` en sus dominios autorizados. |
| 17-10-2026 21:47 UTC, Playwright con Chromium 141.0.7390.37 de este entorno | `net::ERR_TUNNEL_CONNECTION_FAILED`. Esta sesión no tiene conexión con el PC de Juanma, así que la prueba directa **no se ha realizado**. No se ha usado ninguna vía de red alternativa. |

**Acceso directo desde este entorno:** sigue bloqueado. El 18-10-2026 Juanma aportó una sesión guiada de su Chrome en Windows, el manifiesto, capturas y el JSON exportado. La revisión de esos artefactos se describe en §1.1 y actualiza sólo las filas justificadas de la matriz. La grabación anterior de 3:24 y sus seis capturas siguen aportando la evidencia previa. El resto de las pruebas del anexo A no se ejecutó; la recomendación de la §4 sigue condicionada al contrato y a los flujos pendientes.

Leyenda de la evidencia LoRA LAB:

- **Ejecutado:** la grabación muestra la acción y su efecto.
- **Visible:** el control o la ayuda aparecen en pantalla, pero no se ve usarlos.
- **No comprobado:** ni ejecutado ni visible en la evidencia disponible.

## 1.1 Evidencia recibida del PC de Juanma (18-10-2026)

Sesión guiada con Chrome 153.0.8010.53, 1440×900, HTTP 200; vídeo `session.webm` de 19:58 (SHA-256 `9f096648b1c380854871db9c35869d21231ee1b25f5993cc0e4b3aae93e5a762`), capturas y `manifest.json`. Se revisaron las capturas y una muestra temporal del vídeo; no se ha certificado su visionado completo a velocidad 1×. Los originales permanecen fuera del repositorio. El informe generado por la versión anterior del capturador contiene **un nombre erróneo**: llama JSON a la primera descarga. La corrección del capturador está en `1a5f72b` de #48; no se ha repetido la sesión con ese código.

| Evidencia | Hallazgo y límite |
| --- | --- |
| Primera descarga, 896 934 bytes, SHA-256 `f2071c9d78221f943a4e64546de0b4267bb70bbd456d9212599a840b3d5983a1` | Nombre sugerido `Villa moderna-3d.png`; firma y contenido **PNG**, aunque el script antiguo la guardó como `villa-original.json`. Es una captura 3D, no un modelo Blender ni CAD. |
| Segunda descarga, 48 182 bytes, SHA-256 `9eec99abc697f2a1a652d06c8c17fd9a57cf6a202e95d4fee7de4221f67ce62a` | Nombre sugerido `Villa moderna.json`: **JSON válido**, objeto `v: 2` con `floors` de longitud 3; tres alturas `h` (3400, 3200, 3200), 23 muros, 17 estancias, 37 huecos, 106 objetos interiores y 35 exteriores. Dos entradas en `stairs`: una tipo U en la primera planta y otra tipo spiral en la segunda; la tercera no tiene. No se infiere que la transición entre niveles sea transitable. |
| Estructura del JSON | `site` tiene norte, mes, hora, latitud y terreno; `ext` contiene acabados de fachada/cubierta y luces; `outdoor` incluye jardín, piscina y otros objetos. No hay campo explícito de escala ni referencia de imagen por planta en este ejemplo. La interfaz muestra altura en mm; el JSON no declara por sí mismo una unidad global. No se reutiliza como contrato Rubik. |
| Captura A y vídeo | Se ven 1F/2F/3F, corte por planta, altura de 2F (3200 mm), materiales de exterior, catálogo de escaleras, órbita y menú de exportar JSON e imagen. El vídeo muestra la exportación JSON y captura PNG y entrada a la vista «Recorrido». |
| Informe y capturas B/C | B y C se clasificaron «no comprobado». La captura B sigue en la villa; la C muestra el «Solar vacío» 2D. No documentan crear una segunda planta ni colocar una escalera. D y E1–E6 se saltaron. El control para iniciar desde una plantilla sí es visible; cargar una plantilla vacía no demuestra haber trazado geometría nueva. |
| Consola a 3:48 de vídeo | `Blocked pointer lock … frame is sandboxed` y `THREE.PointerLockControls: Unable to use Pointer Lock API`. La vista de recorrido se abrió, pero el desplazamiento libre y la subida de escaleras no se validaron en este iframe. Son errores de este contexto de prueba, sin demostrar un defecto universal de la plataforma. |

**Implicación para #50:** LoRA LAB guarda esta villa como un documento con `floors[]`, pero este ejemplo de plantilla no contiene imágenes ni escala por planta. Favorece ver que un único archivo puede representar tres niveles; **no decide entre A y D** para Rubik. La elección sigue dependiendo del material de entrada prioritario de sus clientes (imagen/PDF por planta o modelo común), del validador actual y de los requisitos de compatibilidad. Tampoco prueba guardado/recarga, importación, edición exterior, controles de cortinas, alturas de ojos ni recorrido vertical.

## 2. Flujos pedidos: LoRA LAB frente a Rubik en `master`

Las referencias de Rubik son al código de `master` `b294739`; `5c822cf` (#49) sólo cambia documentación, así que siguen siendo válidas.

| Flujo | LoRA LAB | Rubik en `master` | Brecha real |
| --- | --- | --- | --- |
| Crear desde plantilla | **Visible:** menú «Nuevo desde plantilla»; plantillas «Villa moderna», «Piso clásico» y «Solar vacío». **Ejecutado** sólo con la villa ya abierta. | Ejemplo de bienvenida (`#welcomeExample`, `js/guide-ui.js`) y proyecto de referencia (`js/reference-project.js`). Un único ejemplo, de una planta. | Sin plantillas de vivienda unifamiliar ni de solar. Menor. |
| Crear desde cero | **Ejecutado:** se abrió la plantilla «Solar vacío». **No comprobado:** trazar o guardar geometría nueva. | «Nuevo proyecto» vacío o desde imagen (#18), trazado y guía Distribuir → Amueblar → Revisar y guardar. | Ninguna demostrada. |
| Importar JSON | **Visible:** «Importar diseño (.json)». No se ve importar. | JSON y ZIP de `FloorPlanProjectV1`; importación guiada de PDF, imagen, DXF, IFC, RoomPlan, JSON y ZIP (#38, `js/plan-intake*.js`). | Ninguna. Rubik acepta más formatos. No consta que LoRA LAB lea CAD. |
| Guardar, recargar y exportar | **Ejecutado:** exportación JSON y captura 3D PNG de la villa; estructura resumida en §1.1. **Visible:** copiar enlace. **No comprobado:** guardar, recargar, reimportar ni el enlace. | Proyectos locales con IndexedDB, variantes (#30), JSON, ZIP, PNG, lámina SVG, paquete GLB/Blender (#24) y vídeo offline (#42). | Sin enlace compartible, que exige servicio, privacidad y caducidad (decisión 8 de Roadmap 2). |
| Construir | **Visible:** pestaña Construir con estancias, muros, puertas, ventanas y seis tipos de escalera. **Ejecutado según #58** (fuente secundaria, §5.1): delimitar estancias y seleccionar puerta y ventana. **No comprobado por mí:** guardar esa geometría. | Muros, huecos, estancias, cotas y edición numérica de rectángulos (#18); revisión de distribución (#27). | Ninguna en una planta. Las escaleras no existen en Rubik (ver «Plantas»). |
| Amueblar | **Visible:** pestaña Amueblar y catálogo; Juanma confirma que puede añadir objetos. | Catálogo genérico, F3 local, doce GLB de Asset Lab (#20, #23), materiales de suelo y pared (#19). | Ninguna demostrada. |
| Editar exterior | **Visible:** pestaña Exterior; materiales de fachada, cubierta y terreno; terraza, jardín y piscina en la villa. **No comprobado:** crear o editar nada exterior. | No hay terreno, fachada ni cubierta: un plano de suelo neutro (`ground`) y balcones como estancias. | **Brecha.** Depende de la envolvente y, para la cubierta, de las plantas. |
| Cambiar entre plantas | **Ejecutado:** 1F/2F/3F, «Cubierta» y corte por nivel en la villa; altura y superficie por planta. | Una planta por proyecto (contrato §1 y riesgo C-4). El importador IFC escoge la planta con más muros y avisa de cuántas hay (`js/plan-intake.js`). **Superado el 18-10-2026:** `master` `d9cd11b` tiene edificio con plantas, selector «Plantas» y 3D apilado (#51, contrato D de #50). | **Brecha cerrada en su primer corte** (ver §5.4). |
| Usar escaleras | **Visible:** catálogo y escaleras de la villa; el JSON exportado incluye una U y una de caracol en dos plantas. **No comprobado:** construir una, comprobar su hueco o pasar por ella. | No hay entidad escalera. **Superado el 18-10-2026:** escalera recta con hueco, avisos BW5 y recolocación asistida (#51–#54). Recorrerla caminando sigue fuera. | Escalera recta resuelta; L, U, caracol y recorrido vertical siguen pendientes. |
| Día y noche | **Ejecutado:** cambio de hora a noche, con oscurecimiento y luces visibles. **Visible:** norte, mes y latitud. | Botón «Noche» que baja sol y cielo y enciende una luz por estancia (`index.html`, `applyLight`); deslizador de hora de 7 a 18 h en arco estilizado; presets HDR en la presentación (#39). | Sin norte, fecha ni latitud. Menor; ya registrado como candidato «sol». |
| Visita libre: entrada | **Ejecutado:** empieza en la puerta principal y la abre. | El modo «Recorrido» coloca la cámara en la puerta de entrada (`entry`, que viene de `isEntrance`) o, si no hay, en la primera puerta (`setMode('walk')`). | Ninguna. |
| Visita libre: altura de ojos | **Visible:** opción adulto 1,70 m o niño 1,05 m. | Fija en 1,6 m en el recorrido libre y 1,5 m en la visita guiada (`js/presentation-route.js`). | Menor: sin selector. |
| Visita libre: puertas | **Ejecutado:** una puerta. **Visible:** E para puerta, ventana o cortina. | Tecla E o toque sobre una puerta a < 2,5 m (`KeyE`, `pick()`). | Ventanas no abribles. Menor. |
| Visita libre: cortinas y luces | **Visible:** «Cortinas» y L para luces. **No comprobado:** usarlas. | Sin cortinas. Luces sólo globales, con el botón «Noche». | Requiere entidades nuevas (cortina, luminaria); beneficio menor. |
| Visita libre: controles | **Visible:** WASD, ratón, Mayús correr, Espacio saltar, Esc pausa. | WASD y Mayús, ratón con `PointerLockControls`, colisión con muros, joystick y arrastre táctil, Esc. Visita guiada por estancias (#39) y vídeo Blender (#42). | Sin salto, que no aporta a una vivienda. La medida en móvil de LoRA LAB no está comprobada. |
| CAD, DXF y Blender | **No comprobado** y no visible: el menú no ofrece CAD ni Blender. No se atribuye a LoRA LAB, y tampoco el CAD/Blender de Summerz3002. | DXF en #38; GLB y verificación Blender (#24); piloto offline de vídeo (#42). | Ninguna. |

**Conclusión de la matriz:** Rubik ya cubre buena parte de lo ejecutado en la grabación sobre una planta: entrada por la puerta, apertura de puertas y noche con luces. El cambio visual 1F/2F/3F demuestra una **brecha estructural de varias plantas** frente a Rubik; crear una escalera y atravesarla sigue sin comprobarse. Exterior y cortinas aparecen en la interfaz, pero su edición o interacción tampoco se verificó. La altura de ojos es una preferencia de vista que no exige cambiar el contrato; entidades de cortina o luminaria y un edificio de varios niveles sí requerirían modelado adicional. La exportación JSON y PNG de la villa sí se ejecutó en la sesión de Juanma; la importación sigue sólo visible. Las capacidades correspondientes de Rubik se verificaron en su código.

## 3. Brechas: beneficio y contrato

| Brecha | Beneficio para el usuario | Cambio de contrato | Coste estimado |
| --- | --- | --- | --- |
| **Plantas conectadas y escalera** | Representar en un solo proyecto un chalet, adosado o dúplex, con superficies por planta y 3D completo. Hoy hay que partir la casa en proyectos sueltos, y el IFC pierde plantas al importarse. | **Sí.** Niveles, pertenencia de muros, estancias, objetos y cotas a un nivel, y una entidad escalera con su hueco. Ignorar el nivel superpone plantas, es decir, pierde significado, así que por §3 del contrato **no cabe en un minor** (ver §4.4). | L |
| **Exterior y envolvente** | Presentar fachada, cubierta y parcela de una vivienda unifamiliar. | **Sí** para la cubierta: tipo, pendiente y apoyo en el nivel superior. Terreno y fachada podrían derivarse en un sidecar de presentación. | M–L, y depende de las plantas para cualquier casa de más de una altura. |
| **Interacciones de visita** | Altura de ojos para niños o personas en silla; cortinas y luces por estancia para presentar de noche. | Altura: **no** (preferencia de vista). Ventanas abribles: no, porque el hueco ya existe. Cortinas y luminarias como entidades: **sí**, un minor opcional. | S para la altura; S–M para el resto. |
| Norte, fecha y latitud | Luz orientada a la casa real; coherencia con #42. | No: sidecar de presentación. | S |
| Plantillas unifamiliares | Arrancar más rápido. | No, salvo plantillas de varias plantas, que heredan la brecha 1. | S |
| Enlace compartible | Enviar la vivienda sin archivo. | No en el proyecto; sí un servicio con privacidad y caducidad (decisión 8). | M |

## 4. Recomendación: un solo corte mínimo

> **Actualización 18-10-2026:** este corte se aprobó con la opción D de #50 y está integrado en `master` (#51 y #52–#54). La recomendación vigente de entrega mínima de experiencia de usuario está en la **§5.6**.

### 4.1 Corte: «Dos plantas y una escalera recta en un mismo proyecto»

**D-01 confirmada por Juanma el 17-10-2026 para priorización:** público prioritario de inmobiliarias, promotoras y estudios de arquitectura, y segundo público de reformas e interiorismo; problema prioritario de preparar y presentar viviendas completas mediante plano editable, mobiliario y vistas coherentes. La decisión está integrada en `master` por la PR #49 (merge `5c822cf`); D-16, varias plantas, sigue «en estudio; implementación no aprobada». Este público hace pertinente evaluar el corte multipiso; la recomendación sigue provisional hasta probar LoRA LAB y decidir el contrato. Si una evaluación posterior muestra que el trabajo inicial se concentra en pisos de una planta, se revisará la prioridad frente a su coste L.

**Por qué este y no otro.** Es la única brecha estructural comprobada en la grabación (1F/2F/3F ejecutado). Además, es requisito de la segunda (cubierta y exterior sobre una casa de dos alturas) y de la visita entre plantas. Las demás brechas son menores o ya existen en `master`.

**Problema que resuelve.** Una vivienda de dos plantas no cabe hoy en un proyecto Rubik. Los niveles importados de IFC se descartan. Superficies, 3D, presentación y exportación muestran sólo una planta.

**Público objetivo de este corte:** equipos inmobiliarios y promotores que presentan viviendas de dos plantas, junto con estudios de arquitectura que comunican propuestas de ese tipo. Reformas e interiorismo son un segundo público. Este corte no acredita mediciones profesionales, documentación técnica ni un flujo BIM completo.

### 4.2 Alcance

1. **Niveles.** Hasta 2 niveles por proyecto en este corte, con nombre, `elevationMm` y `heightMm`. Ampliar a 3 o más queda fuera.
2. **Pertenencia.** Muros, estancias, objetos y cotas llevan su nivel. Los huecos heredan el nivel de su muro.
3. **Escalera recta.** Una entidad con nivel de salida y de llegada contiguos, posición, dirección, ancho, longitud y número de peldaños. El hueco del forjado superior se deriva de su huella.
4. **Editor 2D.**
   - Selector de planta, operable con teclado y tacto.
   - Se edita sólo la planta activa.
   - La planta inferior se dibuja atenuada como referencia de alineación.
   - La escalera se dibuja con flecha de subida abajo y contorno del hueco arriba.
5. **3D.** Niveles apilados a su elevación y forjado derivado de los polígonos de estancia del nivel superior, menos el hueco. Un control «ver hasta planta N» extiende el corte actual de muros.
6. **Superficies por planta y total**, con la fórmula de Gauss que ya usa Rubik.
7. **Intercambio.** JSON y ZIP de ida y vuelta, con IDs estables. «Exportar esta planta como proyecto 1.x» para los consumidores de una sola planta.
8. **Consumidores existentes** que aún no entienden varios niveles muestran un aviso explícito y operan sobre una planta elegida, **nunca aplanan en silencio**:
   - paquete Blender (#24) y piloto (#42);
   - MCP local;
   - presentación (#39) y su sidecar;
   - variantes (#30) y revisión de distribución (#27);
   - avisos W2 y W3.

**Fuera de alcance:**

- recorrer la escalera en la visita libre o en la guiada;
- cubierta, fachada, terreno y exterior;
- escaleras en L, U o caracol;
- más de dos niveles;
- importar IFC multiplanta (siguiente candidato natural, sin aprobar);
- Blender y MCP multiplanta;
- plantillas nuevas;
- cortinas y luces.

### 4.3 Antes de escribir código: decisión de contrato (gate 0)

> **Actualización, 17-10-2026:** el gate 0 se ha desarrollado aparte, en la PR documental #50 (`docs/technical/multilevel-contract-gate0-2026-10-17.md`). Una sonda sobre el validador actual muestra que **acepta** un `1.5.0` con `levels[]` y un `x-levels` en `extensions`, superponiendo plantas, y rechaza tanto `2.0.0` como un contenedor con otro `schema`. Con esa evidencia, #50 **recomienda un contenedor de edificio que incrusta un proyecto 1.x por planta** (su opción D) en lugar de la opción A de la tabla siguiente, sobre todo por la escala por planta. La tabla se conserva como recomendación provisional original; la decisión es de Juanma en #50.

Ningún código de producto hasta que Juanma apruebe un documento de contrato con:

- schema;
- un fixture asimétrico de dos plantas;
- el migrador;
- las nuevas reglas semánticas;
- la lista de consumidores con su comportamiento ante varios niveles.

Opciones, con mi recomendación en la primera:

| Opción | Ventaja | Inconveniente |
| --- | --- | --- |
| **A (recomendada).** `schemaVersion 2.0.0` **sólo** para proyectos con más de un nivel. Los de una planta siguen escribiéndose como 1.x, sin cambios de bytes. Prefijos nuevos `lvl_` y `str_`. Migrador 1.x → 2.0 que envuelve lo existente en `lvl_ground` cuando el usuario añade la segunda planta. | Cumple la §3 del contrato: un lector 1.x **rechaza** un 2.0 sin modificarlo, en lugar de abrirlo superponiendo plantas. Los proyectos y consumidores actuales no notan nada. | Dos majors conviven en el lector. Hay que mantener el exportador «planta como 1.x». |
| B. Minor 1.5.0 con `levels[]` y `levelId` opcionales | Un único esquema. | Un lector 1.4 abre el archivo, ignora `levelId` y superpone plantas: pérdida de significado prohibida para un minor por la §3. |
| C. Varios proyectos enlazados, uno por planta (riesgo C-4) | Sin cambio de esquema. | IDs, escalera y forjado entre archivos; la ida y vuelta y las variantes se complican. No hay vista de casa completa sin un contenedor nuevo. |

Reglas semánticas nuevas propuestas:

- **S8:** todo `levelId` existe.
- **S9:** la escalera une niveles contiguos y su huella cae dentro de estancias de ambos.
- **S10:** la altura de la escalera es igual a la diferencia de elevaciones (±1 mm).
- **W5:** muro del nivel superior sin apoyo bajo él. Es un aviso orientativo, **nunca un dictamen estructural**.

### 4.4 Pruebas

**Unitarias (Node):**

- esquema 1.x y 2.0;
- S8–S10 y W5;
- migrador idempotente;
- proyecto de una planta con bytes canónicos idénticos tras abrir y guardar;
- ida y vuelta del fixture de dos plantas;
- «planta como 1.x» válida para el validador actual.

**Navegador (Playwright), a 1440×900, 390×844 y 844×390:**

- crear la segunda planta;
- trazar muros y estancias;
- colocar la escalera;
- cambiar de planta con teclado y con tacto;
- editar la planta 1 y comprobar que el hash de la planta 0 no cambia;
- 3D apilado y «ver hasta planta N»;
- exportar, importar y comparar;
- deshacer y rehacer;
- avisos de cada consumidor de una planta;
- consola y `pageerror` limpios.

**GPU:** el procedimiento de [r10-gpu-regression.md](../qa/r10-gpu-regression.md), con `gpu-check.cjs` representativo, en el PC de Juanma.

**Móvil físico:** al menos un Android de gama media y un iPhone, con el fixture de dos plantas frente a una planta de superficie total equivalente. Se miden la mediana de fotograma, la memoria y la carga. Como Roadmap 2 aún no fija un presupuesto móvil (decisión 3), la primera medida establece la línea base.

**CI:** se registra «no ejecutada» mientras Actions termine sin pasos.

### 4.5 Criterios de aceptación

1. Los proyectos 1.x de una planta siguen siendo válidos y exportan datos semánticamente equivalentes tras abrir y guardar; no se modifica el archivo original sin una acción del usuario. La regresión existente sigue pasando. Cualquier exigencia de identidad byte a byte de la exportación debe definirse y probarse por separado.
2. Fixture asimétrico de dos plantas: planta baja 9 × 7 m, planta alta 6 × 7 m desplazada, y escalera recta de 14 peldaños para 2800 mm. Sus IDs se mantienen tras 20 ediciones y su ida y vuelta JSON y ZIP es semánticamente idéntica.
3. Elevación 3D de cada nivel igual a `elevationMm` (±1 mm). Hueco del forjado igual a la huella de la escalera (±1 mm).
4. La superficie por planta es igual a la suma de Gauss de sus estancias, y la total es igual a la suma de plantas.
5. Editar una planta nunca modifica otra.
6. Ningún consumidor de una planta aplana en silencio: cada uno ofrece aviso y elección de planta.
7. Móvil físico: con el fixture de dos plantas, la mediana de fotograma no supera 1,5 veces la de una planta de superficie equivalente en el mismo teléfono, sin errores de contexto WebGL.
8. Selector de planta con nombre accesible, foco visible y uso completo por teclado y tacto.

### 4.6 Dependencias y decisiones de Juanma

1. **D-01:** público prioritario confirmado por Juanma el 17-10-2026 (inmobiliarias, promotoras y estudios de arquitectura; reformas e interiorismo como segundo público); integrada por #49 (`5c822cf`). Medir ahora si el corte resuelve tareas frecuentes de presentación de viviendas de varias plantas, sin prometer precisión técnica.
2. **Contrato:** opción A, B o C, aprobada en el gate 0 antes de cualquier código.
3. **Cadena MCP #40 → #41 → #43:** cerrarla o fijar su comportamiento ante 2.0 antes del gate 0, porque el MCP lee el contrato.
4. **Prueba de LoRA LAB del anexo A:** sobre todo el JSON exportado de la villa, para ver cómo modela niveles y escaleras sin copiar código.
5. **Dispositivos físicos** para la línea base móvil. Un plano real de dos plantas autorizado es opcional; el fixture sintético va primero.

## 5. Edición contextual: contraste con la observación de #58 (18-10-2026)

[#58](https://github.com/Juanmaes83/floorplan-3d/pull/58) aporta `docs/technical/loralab-editor-ux-observation-2026-10-18.md`: un análisis de una grabación de LoRA LAB de 104 s centrada en tres cosas:

- dibujar estancias sobre el plano;
- elegir nombres reconocibles;
- editar puertas, ventanas y materiales desde un panel contextual.

**Límite de esta revisión:**

- **No he visto ese vídeo.** No está en este entorno y el acceso a LoRA LAB sigue bloqueado (§1).
- Cito sus filas como **evidencia secundaria** con los tiempos que da #58. No las presento como observación propia y no he contrastado esos tiempos.
- La comparación con Rubik sí es directa: código de `master` `d9cd11b` y una tarea medida en el navegador (§5.3).

### 5.1 Contraste por observación

Leyenda (§1): **ejecutado** = acción y efecto visibles; **visible** = control en pantalla sin uso; **hipótesis** = interpretación de experiencia de usuario no medida.

| # | Observación de #58 | Clase de evidencia | Contraste con mi evidencia de #48 | Rubik en `master` `d9cd11b` | Veredicto |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:12–0:20: se delimita una estancia sobre el plano y aparece «Garaje» con muros y superficie | Ejecutado (según #58) | En mi sesión y en la grabación de 3:24, «Construir» sólo era **visible**: no vi crear geometría (§2). | Dos caminos con resultado distinto. <br>• **«+ Estancia»:** diálogo modal con nombre, ancho, profundidad, posición X/Y o «a la derecha / debajo de» otra estancia, vista previa «Ver cambio» y «Confirmar y guardar». Crea la estancia **y sus 4 muros** (`js/room-layout-ui.js`, `L.create`). <br>• **«Plano propio → Estancia»:** se marcan vértices y se pulsa «Cerrar estancia». Crea **sólo el polígono**, sin muros (`T.room`); los muros se trazan aparte. <br>No hay rectángulo arrastrado sobre el lienzo. | **Confirmo** la diferencia de interacción y **corrijo** mi fila «Construir»: crear una estancia pasa a «ejecutado», con fuente secundaria. **Pendiente:** las reglas de unión de muros de LoRA LAB y su guardado. |
| 2 | 0:24–0:40: «Habitación de invitados»; panel con `Tipo de estancia`, nombre, muestras de suelo y pared con nombre y color de luz | Ejecutado (selección); el resto, visible | No observado en mi evidencia. | El panel de estancia ya es **contextual**: nombre editable en el sitio, superficie, perímetro, medidas y **muestras de suelo en el propio panel** (los materiales de suelo del proyecto, 8 en un proyecto nuevo, `roomPanel` en `index.html`). El catálogo verificado de 50 acabados se abre en un **diálogo aparte** («Biblioteca de acabados · suelo»). No hay tipo de estancia ni color de luz por estancia: el nombre es libre, con «Estancia N» por defecto. | **Corrijo** #58: el suelo **no está sólo** en un diálogo; las muestras básicas ya son contextuales y el catálogo verificado es un diálogo. **Confirmo** que no hay tipo ni nombres sugeridos. El color de luz por estancia queda fuera: requiere una entidad nueva (§3). |
| 3 | 0:40–0:52: se selecciona una puerta; el panel ofrece estilos con nombre, ancho, alto, color de marco y sentido | Ejecutado (selección); estilos, visibles | Mi §2: en la visita, una puerta se **abrió** (ejecutado); E sobre ventana y cortina era sólo visible. | **No se puede seleccionar una puerta en «Seleccionar».** Sólo se llega por «Plano propio → Seleccionar/editar». Ese panel tiene campos numéricos (distancia desde el inicio del muro, ancho, alto y antepecho), el ID del hueco y «Guardar geometría». **No hay control de sentido ni de bisagra**, aunque el contrato ya guarda `swing.hinge` y `swing.side` y los usan la revisión de puertas, el 3D y la visita. Tampoco se puede cambiar el tipo de hueco. | **Confirmo** la brecha y la **amplío**: además de estar en otro modo, el sentido no es editable (§5.2). Los estilos con nombre, el marco y su color **no se atribuyen a Rubik** ni se proponen. |
| 4 | 1:00–1:16: ventana exterior con familias, dimensiones, antepecho, marco y cortina | Visible | Cortinas: sólo visibles en mi sesión. | Ventana con ancho, alto y antepecho editables por el mismo camino del punto 3. No hay familias, marcos ni cortinas. | **Confirmo** el antepecho y las medidas como capacidad existente. Familias, marcos y cortinas, **pendientes y sin proponer**: requieren contrato y 3D propios. |
| 5 | 1:20–1:32: «Vestidor» y muestras en el mismo contexto de selección | Hipótesis de interfaz | — | Igual que el punto 2. | **Confirmo** que es una pauta, no una regla: el tipo no implica muebles ni comportamiento. |
| 6 | Ayuda para añadir una esquina y arrastrar vértices | Visible | — | Rubik edita vértices como texto «X,Y» por línea en el panel de edición de estancia, no arrastrándolos. Sólo las estancias rectangulares con muros inequívocos admiten «Editar dimensiones interiores». | **Pendiente:** el arrastre de vértices no se ve ejecutado en LoRA LAB, y en Rubik implica unión de muros, así que queda fuera de una entrega mínima. |
| 7 | Tabla §2 de #58: «Tipos de estancia y ejemplos» | Hipótesis | — | Correcta; además, el proyecto de referencia trae nombres de estancia reales. | **Confirmo.** |

**Planta y escalera.** El vídeo de #58 no las trata. Mi §2 está corregida: `master` ya tiene un edificio con plantas y una escalera recta (#51–#54).

### 5.2 ¿Capacidad técnica existente repartida en modos?

Sí, en cuatro casos comprobados en el código:

1. **Sentido de puerta.**
   - El contrato lo guarda (`swing`) y lo consumen la revisión de distribución (comprobación «Puertas»), el 3D y la visita.
   - Toda puerta creada a mano o **importada** recibe el valor por defecto `hinge:'start', side:'left'` (`T.opening`; `plan-intake.js` pasa por la misma función). No lee el arco del DXF ni la hoja de un IFC.
   - Ninguna pantalla permite corregirlo, así que la revisión y la visita pueden basarse en un sentido supuesto.
   - Este es el hallazgo de más impacto: un dato existente, sin control, que afecta a otros resultados.
2. **Huecos.** Ancho, alto, antepecho y posición se editan, pero sólo tras entrar en «Plano propio», cambiar a «Seleccionar/editar», tocar el hueco y volver con «Navegar/cancelar». En mi medición:
   - cerrar las herramientas sin «Navegar/cancelar» dejó activo el modo de edición;
   - el toque siguiente sobre la estancia no la seleccionó.
3. **Acabado de pared.** El diálogo pide elegir la pared en una lista de **IDs con coordenadas** (`wal_b23e… · (-120, -120) → (-120, 3120) mm`) que incluye todos los muros del proyecto, no sólo los de la estancia seleccionada.
4. **Estancia.** «+ Estancia» crea los muros; el trazado libre no. Son dos resultados distintos para un mismo nombre de acción.

### 5.3 Tarea medida en Rubik

Se mide con el script `scripts/qa/loralab/rubik-room-task.cjs`, ejecutado sobre `master` `d9cd11b` en Chromium a 1440×900 con ratón, en 2D. Resultado en [`task.json`](../qa/artifacts/loralab/rubik-room-task/task.json).

**Tarea:** desde un proyecto vacío, conseguir una estancia «Habitación de invitados» de 4000 × 3000 mm, con una puerta de 900 mm, una ventana, un suelo del catálogo verificado y un acabado en una pared.

| Medida | Valor |
| --- | --- |
| Acciones desde el proyecto abierto («+ Estancia» incluida) | **26** (28 contando la creación del proyecto) |
| Diálogos o paneles distintos recorridos | 4: diálogo de estancia, panel «Plano propio», panel de propiedades y biblioteca de acabados (dos veces) |
| Cambios de modo dentro de «Plano propio» | 4: Puerta, Ventana, Seleccionar/editar, Navegar/cancelar |
| Acciones para colocar y ajustar puerta y ventana | 12 de las 26 |
| Resultado tras recargar | Estancia, huecos y muros idénticos; suelo `surface-wood-floor`; 1 pared con acabado |
| Sentido de la puerta | `start/left` por defecto, sin control para cambiarlo |
| Errores de consola o `pageerror` | Ninguno |

**Capturas:**

- [formulario de estancia](../qa/artifacts/loralab/rubik-room-task/1440x900-01-room-form.png);
- [edición de hueco por campos](../qa/artifacts/loralab/rubik-room-task/1440x900-02-opening-edit.png);
- [pared elegida por ID](../qa/artifacts/loralab/rubik-room-task/1440x900-03-wall-finish-by-id.png).

**Sin comparación numérica con LoRA LAB:** no hay una tarea equivalente medida allí, y el vídeo de #58 parte de un proyecto abierto. No afirmo que LoRA LAB necesite menos pasos.

### 5.4 Qué confirmo, corrijo y dejo pendiente

- **Confirmo de #58:**
  - Rubik tiene las entidades y operaciones básicas de estancia, hueco y acabado.
  - La diferencia está en dónde y cómo se accede a ellas.
  - No hay tipos de estancia con nombre sugerido.
  - Los estilos de LoRA LAB no son capacidades de Rubik.
- **Corrijo de #58:**
  - las muestras de suelo ya están en el panel de estancia;
  - los dos caminos de creación de estancia no dan el mismo resultado (con muros o sin ellos);
  - el sentido de puerta no es sólo una brecha de interfaz, porque se asigna por defecto a puertas importadas.
- **Corrijo de mi #48:**
  - las filas «Cambiar entre plantas» y «Usar escaleras» (§2) y la recomendación §4, que ya están integradas;
  - la fila «Construir», que pasa a «ejecutado» con fuente secundaria.
- **Pendiente:**
  - los tiempos del vídeo de 104 s;
  - la persistencia en LoRA LAB de tipo, muestras y estilos tras recargar;
  - las reglas de unión de muros de su dibujo directo;
  - una tarea equivalente medida en LoRA LAB;
  - arrastrar vértices.

### 5.5 Hipótesis de experiencia de usuario, sin medir

- **Hipótesis:** para el público D-01 (inmobiliarias, promotoras, estudios), editar una puerta donde se ve, con su sentido, reduce errores en la visita y en la revisión de puertas. Se validaría con la misma tarea medida antes y después, y con una sesión con un usuario. No hay cifras todavía.
- **No es hipótesis:** el sentido por defecto no corregible es un hecho del código.

### 5.6 Recomendación: una sola entrega mínima

**«Seleccionar y editar una puerta o ventana donde está».**

**Tarea de usuario.** En el plano 2D, con «Seleccionar» activo:

1. tocar o hacer clic en una puerta o ventana;
2. ver un panel con su tipo, medidas, posición y, si es una puerta, su sentido de apertura;
3. cambiarlos con vista inmediata en el plano y deshacer en un paso;
4. añadir una puerta o ventana a un muro de la estancia seleccionada sin entrar en «Plano propio».

**Alcance:**

1. **Selección.** Se añade la selección de un hueco al modo «Seleccionar» de 2D, con un área de toque mínima de 44 px en táctil. El hueco queda resaltado y el atajo `Esc` deselecciona.
2. **Panel de propiedades del hueco.** Patrón del panel de mueble:
   - **Tipo:** sólo los cuatro del contrato (`door`, `sliding-door`, `window`, `opening`), con sus nombres en castellano.
   - **Medidas y posición:** ancho, alto, antepecho y posición en el muro, con un botón «Centrar en el muro».
   - **Puerta abatible:** «Bisagra: izquierda / derecha» y «Abre hacia: «Estancia A» / «Estancia B»», con los nombres tomados de la relación espacial de #40. Si el hueco no está entre dos estancias únicas, se muestran «lado 1 / lado 2» con la flecha de barrido como guía.
   - **Acciones:** «Eliminar» y «Volver».
   - **Avisos:** los que hoy dan el validador y la revisión de puertas se muestran en el panel, junto al dato.
3. **«Añadir puerta» y «Añadir ventana» en el panel de estancia.** Se toca un muro de esa estancia; un toque fuera de sus muros explica el motivo y no crea nada. Al terminar, el hueco nuevo queda seleccionado en el mismo modo.
4. **Origen del sentido.** Se distingue en la interfaz entre una puerta sin sentido revisado («sentido por defecto, sin revisar») y una revisada. Revisar el sentido marca la `source.review` del hueco como `confirmed`, con el campo que ya existe.
5. **Planta activa.** En un edificio, la edición es la de la planta activa, como hoy.

**Reutilización:**

- `T.opening` y `T.remove`, y la ruta `apply` con `Core.validate`;
- la persistencia antes del estado y la pila de deshacer de 150 pasos;
- el dibujo 2D de huecos y barridos existente;
- `FloorPlanLayoutReview` para los avisos;
- la relación espacial para nombrar las estancias;
- el patrón de `furnPanel` y el `fab` táctil.

«Plano propio → Seleccionar/editar» sigue disponible para el trazado sobre imagen.

**Contrato:** sin cambios. `kind`, `swing.hinge`, `swing.side`, `offsetMm`, `widthMm`, `heightMm`, `sillHeightMm` y `source.review` ya existen. Las reglas que deben respetarse, y probarse:

- `swing` sólo en `door`: al cambiar a otro tipo se elimina, y al volver a puerta se pide el sentido;
- `sillHeightMm + heightMm ≤` altura del muro;
- el hueco dentro del muro y sin solapar otro hueco del mismo muro (hoy el validador no lo impide; el panel lo rechazaría con un mensaje);
- el ID del hueco se conserva.

**Fuera de alcance:**

- estilos, familias, marcos, colores, cortinas y luces;
- tipo de estancia y nombres sugeridos;
- dibujar estancias arrastrando y arrastrar vértices;
- elegir la pared del acabado tocándola (es el **siguiente candidato natural**, sin aprobar);
- huecos en 3D, MCP, #57 y cambios de contrato.

**QA funcional** (Node y Playwright):

- Seleccionar, editar y deshacer o rehacer cada tipo, conservando el ID; tras F5 y tras ida y vuelta de JSON y ZIP, los datos son idénticos.
- Cambiar de puerta a ventana y vuelta: sin `swing` inválido; el validador acepta cada paso.
- Una medida fuera del muro o solapada se rechaza con mensaje y sin cambio de estado; un fallo de guardado (cuota) deja el proyecto anterior.
- El sentido cambiado se refleja en la comprobación «Puertas» de la revisión y en la geometría que usa la visita (`presentation-route`).
- «Añadir puerta» desde el panel de estancia rechaza un muro ajeno y no deja huecos huérfanos.
- Edificio de dos plantas: la edición sólo afecta a la planta activa; la otra mantiene su hash.
- La tarea de §5.3 repetida con el script baja de 12 acciones y 4 cambios de modo para los huecos a un número menor, y se registra sin fijar un objetivo inventado.
- Regresión: suites unitarias, `room-layout`, `building`, `layout-review`, `stair-*`, `upload` y `guide`.
- La consola y `pageerror` quedan limpios.

**QA visual:**

- Capturas a 1440×900, 390×844 y 844×390 de:
  - hueco seleccionado;
  - panel de puerta;
  - cambio de bisagra y de sentido, antes y después;
  - ventana con antepecho;
  - aviso de rechazo.
- En ellas, el resaltado no tapa cotas ni etiquetas, el panel no recorta controles y el `fab` táctil no tapa el hueco.
- Revisión humana en 2D y en 3D: el sentido coincide en ambos.
- Teléfono físico cuando proceda.

**Decisiones para Juanma y Codex antes del documento de implementación:**

1. Si «Abre hacia» se expresa por nombre de estancia o por lado.
2. Si revisar el sentido marca `source.review:'confirmed'` o sólo lo hace un botón explícito.
3. Si el rechazo de huecos solapados se queda en la interfaz o se lleva al validador (eso sí sería un cambio de contrato y queda fuera de esta entrega).

**Por qué esta y no otra.** Es la única brecha en la que Rubik **tiene el dato pero no el control**, y ese dato afecta a la revisión de puertas, al 3D y a la visita. Es la de más acciones en la tarea medida (12 de 26), no necesita contrato y se prueba en una PR acotada. Los nombres sugeridos y el dibujo directo de estancias aportan menos y dependen de decisiones de taxonomía o de unión de muros.

## Anexo A. Prueba de Juanma en Chrome para Windows

**Objetivo:** convertir lo «visible» y «no comprobado» de la §2 en «ejecutado» o «falla», con evidencia fechada.

**Reglas:**

- Usar datos de plantilla, sin subir planos reales ni información personal para esta comparación.
- Registrar si el sitio exige cuenta o pago para una prueba, sin inferir que la función está disponible gratuitamente.
- Conservar únicamente la evidencia necesaria para reproducir cada resultado.

### A.0 Sesión guiada con Playwright (recomendada)

`scripts/qa/loralab/annex-a-session.cjs` produce la evidencia pedida en un contexto aislado de Chrome:

- vídeo `session.webm`, `trace.zip` con capturas y snapshots, y capturas numeradas;
- la descarga del JSON como `villa-original.json`, con su SHA-256;
- errores de consola y `pageerror`;
- `manifest.json` y `report.md`, con el minuto del vídeo y la captura de cada resultado.

**No pulsa dentro del lienzo 3D ni adivina selectores.** Juanma realiza cada paso en la ventana mientras se graba. En la terminal pulsa Enter para capturar y clasificar el resultado («ejecutado y funciona», «ejecutado y falla», «solo control visible» o «no comprobado»), `s` para una captura adicional o `x` para saltar el paso.

Al cerrar, comprueba que el vídeo se reproduce y marca las capturas casi uniformes (en blanco o negras). Orden de pasos: primero A–D (JSON de la villa, segunda planta, escalera con su hueco, subir la escalera en el recorrido libre), después guardar y recargar, importar, exterior, día y noche, altura de ojos, y puertas, ventanas, cortinas y luces.

```powershell
git -C C:\Users\temp123\work\floorplan-3d-casa-serra fetch origin docs/loralab-study-gate
git -C C:\Users\temp123\work\floorplan-3d-casa-serra worktree add C:\Users\temp123\work\fp-lora origin/docs/loralab-study-gate
cd C:\Users\temp123\work\fp-lora
npm init -y > $null; npm install --no-save playwright@1.62.1
$env:CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node scripts/qa/loralab/annex-a-session.cjs C:\Users\temp123\loralab-evidence
node scripts/qa/loralab/analyze-export.cjs C:\Users\temp123\loralab-evidence\villa-original.json | Out-File -Encoding utf8 C:\Users\temp123\loralab-evidence\villa-structure.md
```

**Qué compartir para el repositorio, tras revisión manual:** `report.md`, `manifest.json`, `villa-structure.md` y sólo las capturas necesarias. `manifest.json` puede contener URL final, errores de consola y notas introducidas por el operador; elimina tokens, datos personales o rutas sensibles antes de publicarlo. La traza y el vídeo pueden registrar la sesión completa. `villa-structure.md` contiene el árbol de claves del JSON, con los textos redactados a su longitud y un recuento de posibles datos sensibles (email, URL, JWT, data URI), sin valores. **No se suben** al repositorio el JSON original de un tercero, el vídeo, la traza ni datos de sesión; se conservan en la carpeta local y se citan por su SHA-256.

Validación del script en este entorno, sin LoRA LAB:

- contra una página local de prueba: descarga y hash, vídeo reproducible (`readyState` 4), errores de consola, informe y manifiesto;
- contra la URL real bloqueada: registra el error de navegación y no ejecuta ninguna prueba;
- contra `about:blank`: la captura uniforme queda marcada como en blanco.

Esto valida la herramienta, **no la plataforma**.

### A.1 Qué decidirá el JSON entre las opciones A y D de #50

| En `villa-structure.md` | Favorece |
| --- | --- |
| Una imagen de fondo, una escala o una calibración **por planta** | D: un proyecto 1.x incrustado por planta |
| Un único marco de coordenadas con elevación por planta y escaleras que referencian ambas | A: un 2.0 con `levelId`, o D con `offsetMm` cero |
| Elementos que cruzan plantas (huecos de doble altura, cubierta ligada a varias) | A, o un dato de contenedor en D |
| Sin imágenes ni escala (todo geométrico) | Neutro: decide la entrada típica de los clientes de D-01 |

**Límite:** el JSON muestra cómo modela LoRA LAB, no qué traen los clientes de Rubik ni qué es correcto para `FloorPlanProjectV1`. Es evidencia de apoyo para #50; no decide el contrato ni se copia.

### A.2 Procedimiento manual (alternativa)

**Preparación:**

1. Chrome actualizado, en una ventana de invitado (menú de perfil → Invitado), maximizada a 1440×900 o más.
2. Grabar la pantalla con Xbox Game Bar (`Win+Alt+R`) u OBS.
3. Activar el contador de FPS: `F12` → `Ctrl+Shift+P` → «Show Rendering» → «Frame rendering stats».
4. Abrir `https://fun.loralab.top/tool/c9ae6fe7-55ca-4fde-bae4-f8484c49bfc6?lang=es` (o `zh-CN` si `es` no existe). Anotar la fecha, la hora y la versión de Chrome que aparece en `chrome://version`.

**Pruebas.** En cada una, anotar «funciona», «visible sin efecto» o «falla», con el minuto de la grabación y una captura.

| # | Prueba | Qué registrar |
| --- | --- | --- |
| 1 | Nuevo desde plantilla: «Piso clásico» y «Solar vacío» | Si cargan; plantas y superficies que muestran. |
| 2 | Proyecto desde cero: dibujar una estancia de 4 × 3 m con una puerta y una ventana | Si permite introducir medidas exactas y en qué unidad. |
| 3 | Exportar JSON de la villa | Guardar el archivo y ejecutar `Get-FileHash .\archivo.json -Algorithm SHA256` en PowerShell. Conservar el JSON original localmente y compartir de forma privada con quien haga la auditoría si hace falta inspeccionarlo; publicar en el repositorio sólo su hash y un resumen revisado de la estructura. |
| 4 | Recargar (`F5`) y cerrar y reabrir la pestaña tras un cambio | Si el cambio persiste y dónde. |
| 5 | Importar el JSON de la prueba 3 en una plantilla vacía | Si se recupera idéntico. |
| 6 | Amueblar: añadir, mover y girar un mueble en 2F | Si queda en esa planta al cambiar a 1F. |
| 7 | Exterior: cambiar el material de fachada y el de cubierta y añadir un elemento de jardín | Si afecta sólo a la villa o también a la plantilla del paso 2. |
| 8 | Plantas: añadir una planta nueva al proyecto del paso 2 | Si se puede y cómo se fija su altura. |
| 9 | Escalera: colocar una entre 1F y 2F | Si abre hueco en el forjado y si cambia algo en 2F. |
| 10 | Día y noche: hora, mes, latitud y norte | Si la sombra cambia de dirección con el norte y la latitud. |
| 11 | Visita libre a 1,70 m y a 1,05 m | Altura percibida; colisiones con muros y muebles. |
| 12 | Visita: E sobre puerta, ventana y cortina; L para luces | Qué responde a cada una. |
| 13 | Visita: subir la escalera de la villa | Si se puede pasar de 1F a 2F caminando. |
| 14 | Rendimiento | FPS en órbita y en visita, en calidad Media y Alta. |
| 15 | Móvil físico (opcional, pero necesario para cerrar el gate móvil): repetir 1, 11 y 14 en el teléfono | Modelo, navegador y si hay control táctil para caminar. **El modo dispositivo de DevTools no cuenta como móvil.** |

**Entrega:**

- la grabación o su SHA-256;
- el JSON exportado;
- la tabla rellena;
- las capturas.

Con eso se actualiza la §2 de este documento, y la §4 deja de ser provisional o se corrige si la evidencia lo contradice. Nada de LoRA LAB se reutiliza sin análisis de código y de licencia.

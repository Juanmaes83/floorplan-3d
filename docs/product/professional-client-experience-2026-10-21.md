# Experiencia profesional y entrega al cliente — programa de cinco resultados

| | |
| --- | --- |
| Estado | Programa revisado el 22-10-2026 sobre la propuesta de #70 (21-10-2026) |
| Base | `master` `e796e3d` |
| Público | D-01: inmobiliarias, promotoras y estudios de arquitectura; en segundo lugar, reformas e interiorismo |
| Límite del producto | Rubik prepara y presenta viviendas editables. No certifica planos de ejecución, accesibilidad ni cumplimiento normativo |
| CI | No ejecutada en ninguno de los cortes |
| Prueba con personas D-01 | Preparada (§8); **resultados pendientes** |

## 1. Estado único de las cinco líneas

| Resultado | Estado | Dónde |
| --- | --- | --- |
| 1. Identificación profesional al entrar | **PR en revisión** | `feat/professional-entry` (incluye los commits de #70 mediante una fusión, sin reescribirlos), apilada sobre #71 |
| 2. Del plano a la experiencia | **PR en revisión** | `feat/plan-provenance`, sobre `master` |
| 3. Revisión y participación del cliente | **Pendiente de decisión** | §5; sin código |
| 4. Entrega profesional reutilizable | **PR en revisión** | `feat/scaled-sheet`, sobre `master` |
| 5. Ayuda inteligente opcional | **Pendiente de decisión** (especificación) | §7; sin código ni proveedor |

«Integrado» no se aplica a ninguno: no se ha hecho merge ni despliegue.

## 2. Auditoría de la propuesta de #70

Lo que se conserva:

- El selector es opcional y se guarda en el navegador (`rubik-professional-audience-v1`), fuera del proyecto.
- Las tres entradas siguen primero. La prueba de #70, que no se había ejecutado en Codex, **pasa 3/3** aquí (Chromium 141, emulación).

Lo que se corrige:

| # | Hallazgo | Corrección |
| --- | --- | --- |
| A1 | Elegir un perfil no producía ninguna respuesta: el botón quedaba pulsado y nada más. El profesional no «se reconoce». | Al elegirlo aparece una frase sobre para qué le sirve Rubik y la primera acción, que ejecuta la misma entrada «Subir un plano» (o «Crear desde cero»). |
| A8 | La bienvenida describía el paso del plano a la vivienda sin mostrarlo (patrón visto en Enviz e3/e4) | Selector «El plano / La vivienda en 3D» sobre el mismo ejemplo: dibujo 2D y captura real del 3D de Rubik (`assets/welcome/example-3d.webp`, 29 KB), con el pie «Captura real de Rubik». En el teléfono la figura sigue oculta para que las tres entradas vayan primero |
| A2 | El titular hablaba a un particular («Tu espacio, paso a paso», «recorre tu idea»). | Antetítulo «Para inmobiliarias, promotoras y estudios» y una entradilla sobre convertir el plano en una vivienda editable y presentarla al cliente. Se conserva el título «¿Qué quieres hacer?». |
| A3 | Restos de color crema en la bienvenida. | Pasan a los roles «Perla». Se conserva el logotipo. |
| A4 | El documento omitía la cadena GLB/Blender que ya existe fuera de la aplicación (#24, #42) y el orden 5 de la hoja de ruta 2 (glTF). | §6 |
| A5 | Citaba como «decisiones abiertas» lo que ya registran D-06, D-08 y D-09, sin nombrarlas. | §5 y §7 las citan. |
| A6 | La línea 5 proponía operaciones como «ensancha la isla 200 mm». El MCP local solo lee una copia exportada y sus etapas 2–4 no están aprobadas. | §7 separa la ayuda para comprender de la modificación de datos. |
| A7 | Afirmaba un «beneficio para D-01» sin plan de medida. D-01 deja la demanda comercial «por comprobar». | Cada resultado lleva su observación (§8). |

**Evidencia de las referencias:**

- **Enviz.** Juanma aportó cinco capturas de su web comercial el 22-10, versionadas en [`references/enviz-2026-10-22/`](references/enviz-2026-10-22/). Son páginas de marketing con ilustraciones, no sesiones de la herramienta: todo lo que muestran es **afirmación comercial** salvo el selector «The plan / The experience», que es un **control visible** de la propia página. Nada se presenta como capacidad de Rubik.
- **LoRA LAB.** Se usan las clases del estudio de #48 (rama `docs/loralab-study-gate`).

| Observación | Clase | Uso aquí |
| --- | --- | --- |
| LoRA LAB empieza por plantillas («Villa moderna», «Piso clásico», «Solar vacío») | Función ejecutada | Referencia de entrada sin perfil profesional |
| LoRA LAB: cambio 2D↔3D, corte por planta, recorrido desde la puerta | Función ejecutada | Contexto del resultado 2; Rubik ya tiene 2D/3D y presentación de dos plantas |
| LoRA LAB: «Copiar enlace» en el menú, sin enlace generado | Control visible | No prueba un servicio de revisión |
| LoRA LAB: exporta JSON y PNG 3D; no hay CAD en el menú | Función ejecutada / control visible | Contexto del resultado 4 |
| LoRA LAB: no se observa asistente de IA ni comentarios | Inferencia por ausencia | — |
| Enviz e1 «Own the model / Download the 3D model»: SKP, GLB, FBX, USDZ, BLEND; «Works with SketchUp, Revit…» | Afirmación comercial | Resultado 4: no se anuncia ningún formato no comprobado; Rubik solo tiene GLB fuera de la aplicación |
| Enviz e1/e2 «AI Modelling Agent», «widen the kitchen island by 200mm», «You approve every change before it lands» | Afirmación comercial (maqueta ilustrada) | Resultado 5: se adopta el principio «apruebas cada cambio»; no la capacidad |
| Enviz e3/e4 ejemplos de una y dos plantas con selector «The plan / The experience» y «Upload Your Plans» | Control visible en la web + afirmación («hours later») | Resultado 1/2: **se adopta el patrón**, con material propio: la bienvenida alterna «El plano / La vivienda en 3D» del mismo ejemplo con una captura real de Rubik |
| Enviz e5 «Send one link. Everyone gets it», `enviz.co/share/abc123` | Afirmación comercial (ilustración) | Resultado 3: no se simula un enlace; pendiente de decisión |

## 3. Resultado 1 — identificación profesional al entrar

- **Tarea real.** Quien llega desde una inmobiliaria, una promotora o un estudio decide en segundos si la herramienta es para su trabajo y por dónde empezar.
- **Qué falla hoy (en `master` y en #70).** La bienvenida habla a un particular, y el perfil de #70 no responde a la elección.
- **Alternativas:**
  - (a) #70 tal cual: coste mínimo, valor casi nulo y un control sin efecto.
  - (b) **Elegida:** titular profesional, y un perfil que responde con una frase honesta y la primera acción, que es una entrada existente.
  - (c) Recorridos y objetivos distintos por perfil: promete una personalización que no existe y exige pruebas D-01.
  - (d) Perfil obligatorio antes de entrar: añade un paso y contradice «opcional».
- **Por qué (b).** Responde a «¿para qué me sirve?» sin prometer herramientas distintas. Cada frase usa solo funciones que hay en `master`:
  - subir PDF, imagen, DXF o IFC;
  - comprobar la escala;
  - 3D;
  - marca;
  - dos plantas;
  - huecos;
  - acabados.
- **Datos.** No cambia ningún contrato. La preferencia es local y la prueba comprueba que no entra en el proyecto.
- **Fuera del corte.** Contenidos o plantillas por perfil, analítica de perfiles y conciliación con los perfiles de marca (que son otra cosa: la identidad del profesional en la entrega).
- **Observación.** En la sesión D-01 (§8): ¿la persona dice para qué le sirve y elige la primera acción sin ayuda? Se registran el tiempo hasta la primera acción y los errores.
- **Convivencia con #71.** La rama se apila sobre #71. Con la fusión de #70 hubo cero conflictos en `guide-ui.js` y `guided-experience.css`.

## 4. Resultado 2 — del plano a la experiencia

- **Tarea real.**
  - El profesional explica al cliente qué venía en el plano, qué se dibujó en Rubik y qué va a recorrer.
  - El cliente necesita saber cuánta confianza dar a las medidas.
- **Qué falla hoy.** La presentación muestra la vivienda, pero no su procedencia. Una imagen calibrada y una distribución dibujada a ojo se presentan igual.
- **Alternativas:**
  - (a) Comparar el plano original con el modelo, lado a lado: es convincente, pero la imagen está en IndexedDB, no existe en DXF/IFC ni en una plantilla, y puede contener datos personales (D-08).
  - (b) **Elegida:** un resumen «Del plano a la vivienda» leído de los campos que ya guarda el proyecto, en «Presentar mi vivienda», con un bloque por planta.
  - (c) Una tarjeta de introducción dentro de la presentación: cambia la presentación y el lote, y su contrato de capturas.
- **Por qué (b).** El contrato ya registra, por muro, hueco y estancia, `source.method` (`imported`, `manual`, `suggested`, `template`) y `source.review`, además de la escala y su calibración. El resumen no infiere nada que no esté registrado; si un elemento no tiene procedencia, lo dice. No muestra el nombre de archivo (D-08).
- **Datos.** Solo lectura de `FloorPlanProjectV1` y de cada planta del edificio; no cambia contratos.
- **Fuera del corte:**
  - la comparación visual (a), que queda como siguiente corte posible con consentimiento sobre la imagen;
  - la procedencia en la lámina o en el lote ZIP, que cambiaría el contrato del lote;
  - registrar «ajustado en Rubik» cuando se edita un elemento importado: hoy no se registra, y por eso el texto dice «dibujados», no «ajustados».
- **Observación.** En D-01, el cliente simulado responde «¿de dónde salen estas medidas?» y «¿qué es propuesta de Rubik?» antes y después de ver el resumen.

## 5. Resultado 3 — revisión y participación del cliente (pendiente de decisión)

- **Tarea real:**
  - el profesional entrega una versión;
  - el cliente sabe qué versión ve y deja observaciones identificables (estancia, vista);
  - el profesional decide qué incorporar y conserva el control.
- **Qué existe hoy.** El lote de presentación ZIP identifica la versión (`projectId`, `revision`, sha256) y trae las vistas PNG y el proyecto editable. No hay comentarios, ni enlace, ni modo de revisión.
- **Restricciones registradas:**
  - D-06: el alojamiento como política está abierto;
  - D-08: cualquier subida o servidor requiere decisión y revisión de privacidad;
  - D-09: no hay servicio de retención;
  - hoja de ruta 2, decisión 8: cuenta y datos, abierta.

| Opción | Qué hace | Coste | Riesgo |
| --- | --- | --- | --- |
| A. **Recomendada:** intercambio por archivo, sin servidor | El cliente abre en Rubik un paquete de revisión en **modo solo lectura**, deja observaciones ancladas a estancia o vista y descarga `observaciones.json` con `projectId` y `revision`. El profesional lo importa y acepta o descarta cada observación. Una observación nunca edita el proyecto. | Medio: modo revisión, contrato `rubik-sota.review-notes` v1 y pruebas de identidad, versión y control | El cliente debe abrir la web y un archivo. No hay notificaciones. |
| B. Enlace alojado | Enlace con caducidad, retirada y acceso | Alto: almacenamiento, autenticación, política de datos y coste recurrente | Necesita D-06, D-08 y D-09. No se simula. |
| C. Entrega estática y respuesta por correo | Lámina y vistas numeradas; el cliente responde por correo | Bajo | Sin trazabilidad ni anclaje; el profesional transcribe a mano |

- **Decisión que necesita Juanma:**
  - aprobar A como siguiente corte, con un contrato nuevo `observaciones.json` que no toca `FloorPlanProjectV1` ni el lote;
  - o decidir antes B.
- **Mientras tanto.** El lote ZIP ya permite entregar una versión identificable.

## 6. Resultado 4 — entrega profesional reutilizable

**Auditoría de salidas en `master`:**

| Salida | Formato | Identidad | Unidades y escala | Se abre fuera de Rubik | Se reimporta |
| --- | --- | --- | --- | --- | --- |
| Proyecto | JSON / ZIP | id, nombre, esquema | mm; confianza de escala | El ZIP sí; el JSON solo tiene sentido para Rubik | Sí |
| Edificio | ZIP con `manifest.json` | buildingId | mm, plantas, cotas | El ZIP sí | Sí |
| Imagen del plano | PNG de 3200 px | Ninguna | Sin escala | Sí | No |
| Lámina | SVG de 1600×1100 | id, revisión, marca | mm, **sin escala de impresión** | Sí | No |
| Lote de presentación | ZIP con PNG, `presentation.json` y proyecto editable | id, revisión, sha256 | Sin escala en las vistas | Sí | Sí, el proyecto incluido |
| GLB / Blender (#24, #42) | `scene.glb` y `.blend` | id, sha256 | metros | Sí (Blender, visor glTF) | No. **Solo línea de comandos, una planta, sin botón** |

- **Alternativas:**
  - (a) **Elegida:** la lámina a una escala declarada (1:50, 1:100 o 1:200) con barra gráfica, que se pueda medir fuera de Rubik.
  - (b) DXF por planta con capas: el mayor valor para estudios, coste medio.
  - (c) GLB dentro de la aplicación: hay que portar `scripts/interop` al navegador y añadir plantas.
- **Por qué (a).** La lámina ya es la pieza de entrega con identidad y marca, y lo que le falta para ser reutilizable es que se pueda medir sobre papel. Es el corte más pequeño con fidelidad demostrable.
- **Qué hace la lámina con escala:**
  - mide 420 mm de ancho, así que cabe en un A3 apaisado al 100 %;
  - el recuadro del plano recibe su tamaño exacto en papel;
  - una escala que no cabe se rechaza, explicando por qué;
  - la lámina sin escala sigue igual y es la opción por defecto.
- **Fidelidad demostrada.** El SVG descargado se abre solo en una página en blanco, sin código de Rubik. A 1:100, una estancia y la barra de escala miden lo esperado con un error menor de 0,6 mm, en los tres tamaños.
- **No se anuncia:**
  - SKP, FBX, USDZ ni BLEND;
  - el GLB dentro de la aplicación;
  - la impresión física: no se ha probado con una impresora, solo con la medición CSS a 96 ppp.
- **Siguiente corte recomendado.** (b) DXF, con una prueba de ida y vuelta mediante el importador DXF existente.

## 7. Resultado 5 — ayuda inteligente opcional (pendiente de decisión)

Se separan dos capacidades.

**Ayuda para comprender la herramienta.** Hoy existe sin IA:

- la guía con la siguiente acción y su razón (#71);
- la búsqueda local «¿Qué quieres hacer?»;
- «Tareas y ayuda».

Alternativas:

1. Ampliar la ayuda local con explicaciones del estado: coste bajo y sin datos fuera del navegador.
2. Usar el MCP local de solo lectura (`tools/rubik-mcp`, ocho herramientas), conectado a un asistente que el profesional ya usa sobre su proyecto **exportado**. No requiere proveedor de Rubik, pero no ve el estado sin guardar, y hoy es una función para usuarios técnicos.
3. Integrar un proveedor en la aplicación, lo que requiere D-08: decidir si el plano puede salir del navegador.

**Modificar datos con lenguaje natural.** Requiere:

- un conjunto cerrado de operaciones estructuradas (mover o dimensionar un elemento, añadir un hueco);
- validación con los módulos existentes;
- vista previa;
- aprobación;
- deshacer con el historial;
- rechazo sin efectos.

El MCP no tiene escritura, y sus etapas 2–4 no están aprobadas.

**Límites antes de conectar un proveedor:**

- consentimiento por proyecto;
- qué datos salen: geometría sin imagen ni nombre de archivo, salvo que se acepten;
- presupuesto y límite de coste;
- registro de propuestas;
- errores visibles («no he entendido», «no es posible»);
- ninguna afirmación de cumplimiento normativo.

**Decisiones que necesita Juanma:**

1. ¿Puede salir del navegador la geometría del proyecto hacia un proveedor (D-08)? ¿Con qué proveedor y presupuesto?
2. ¿Se aprueba la etapa 2 del MCP (propuestas explicables, aún de solo lectura)?

**Recomendación.** Primero la opción 1, sin IA y sin decisión pendiente. Después un prototipo de «propuesta estructurada», con operaciones simuladas sobre una copia y aprobación, antes de cualquier proveedor.

## 8. Prueba con personas D-01 (preparada; resultados pendientes)

**Participantes:** seis, uno por perfil (inmobiliaria, promotora, estudio, reformas, interiorismo) y un cliente final simulado. Teléfono y escritorio.

| Tarea | Resultado | Se mide |
| --- | --- | --- |
| «Abre Rubik y dime para qué te serviría» | 1 | Frase de la persona, tiempo hasta la primera acción, si elige el perfil |
| «Prepara la presentación de este dúplex y explica a tu cliente de dónde salen las medidas» | 2 | Respuestas a «¿qué venía en el plano?» y «¿qué es propuesta?»; errores |
| «Entrega una lámina a 1:100 y comprueba un muro con la regla» | 4 | Si mide bien, y si entiende «imprime al 100 %» |
| Opciones A, B y C del resultado 3 y del 5, en papel | 3 y 5 | Preferencia y objeciones de privacidad |

Las pruebas automáticas no acreditan que la experiencia sea comprensible.

## 9. Visión conjunta: duplicidades y saltos detectados

| Hallazgo | Estado |
| --- | --- |
| Dos «Presentar mi vivienda» visibles a la vez, en la cabecera guiada y en la fila de la guía (introducido por #71 al mostrar la entrada de la cabecera) | Corregido en #71: solo una a la vez |
| La cabecera guiada pasaba de 71 a 116 px en escritorio por el mismo motivo | Corregido en #71 |
| En el teléfono, «Propiedades» aparece en la barra de selección y en la barra inferior | Pendiente: son dos caminos al mismo cajón. Se aceptan porque la barra de selección es contextual; no se elimina ninguna |
| El perfil profesional de la bienvenida y el «perfil de marca» de la entrega usan la misma palabra para dos cosas | Aceptado por ahora; se propone llamar al segundo «Tu marca» de forma consistente |
| Editor → presentación → cliente: el cliente no tiene superficie propia; recibe un ZIP | Resultado 3, pendiente de decisión |

## 10. Matriz de las cinco referencias de Enviz (22-10-2026)

Las cinco son capturas de la web comercial de Enviz ([`references/enviz-2026-10-22/`](references/enviz-2026-10-22/)). Ninguna es una sesión de la herramienta.

| Ref. | Qué muestra realmente | Solo afirmación comercial | Qué puede hacer Rubik ahora (código o prueba) | Experiencia deseada para D-01 | Evidencia que demostraría la mejora |
| --- | --- | --- | --- | --- | --- |
| e1 «Own the model» | Un rótulo, una foto de cocina con una burbuja «AI Modelling Agent: widen the kitchen island by 200mm · Updating model…» y un icono de carpeta | Agente de IA que remodela; descarga en SKP, GLB, FBX, USDZ y BLEND; «works with SketchUp, Revit…» | Exporta JSON/ZIP del proyecto y del edificio y el lote de presentación. GLB y `.blend` solo por línea de comandos (`scripts/interop`, `tests/interop.test.cjs`). Lámina a escala (#72, `tests/sheet-scale.browser.test.cjs`). Sin IA | El estudio se lleva un archivo que abre en su software con unidades e identidad comprobables | Apertura independiente: un visor CAD o glTF y medidas contra el JSON; ida y vuelta automatizada |
| e2 «Change it by asking» | Una ilustración con tres burbujas de voz sobre un dormitorio y una lista de ventajas | Mover muros, añadir ventanas o cambiar acabados hablando; «the model rebuilds» | La edición manual es completa (muros, huecos, estancias, acabados, muebles) y tiene deshacer y rehacer. El MCP local es de solo lectura (`tools/rubik-mcp`) | La persona entiende qué cambiará, lo aprueba o lo rechaza y puede deshacerlo. Sin IA, todo sigue siendo posible | Una prueba que demuestre que la propuesta no cambia nada hasta aprobarla, que rechazar no deja efectos y que deshacer devuelve el proyecto idéntico. Además, comprensión en la sesión D-01 |
| e3/e4 «See what you could hand your clients» | Dos tarjetas (una y dos plantas) con un selector «The plan / The experience» que cambia el plano escaneado por un render | «Hours later», «stairs, landings and ceiling heights all to scale» | Bienvenida «El plano / La vivienda en 3D» con una captura real de Rubik (#73). Edificios de dos plantas con escalera (#51–#54). Procedencia y precisión en «Presentar mi vivienda» (#74). Subir PDF, imagen, DXF o IFC | El profesional y su cliente ven el mismo proyecto como plano y como experiencia, y saben qué es original y qué precisión tiene | `tests/professional-entry` (alternancia y captura real), `tests/provenance.browser` (líneas iguales a los datos). En D-01: «¿de dónde salen estas medidas?» |
| e5 «Send one link» | Una maqueta del cuadro «Share» con WhatsApp, iMessage, correo y la URL `enviz.co/share/abc123` | Un enlace en cualquier dispositivo; todos ven la misma versión | No hay enlace ni servidor. El lote ZIP identifica la versión con `projectId`, `revision` y sha256 (`tests/presentation-batch`) | El cliente ve una versión identificable y responde; el profesional decide qué se incorpora | Identidad de versión comprobada en la ida y vuelta de las observaciones, y que una observación no edite nada (§11) |

## 11. Decisiones preparadas (no aprobadas)

Ninguna de estas opciones está aprobada. Las preferencias provisionales de Juanma se tratan como hipótesis.

### 11.1 Revisión del cliente

| Opción | Alcance | Beneficio | Riesgos | Coste aproximado | Recomendación |
| --- | --- | --- | --- | --- | --- |
| **A. Archivo, sin servidor** | Paquete de revisión, modo de solo lectura, observaciones ancladas a estancia o vista, `observaciones.json` con `projectId` y `revision`, importar y decidir | Funciona hoy, sin datos fuera del navegador ni costes recurrentes; el control queda en el profesional | Fricción: el cliente abre la web y un archivo, y no hay avisos | Desarrollo medio; cero de infraestructura | **Recomendada como primer corte** |
| B. Enlace alojado | Almacenamiento del proyecto, enlace con caducidad, retirada y acceso | Experiencia de un enlace | Datos personales en servidor (D-08), retención (D-09), seguridad de enlaces, coste | Alojamiento y base de datos con un coste mensual recurrente, además de autenticación; desarrollo alto | Después de A y de decidir D-06, D-08 y D-09 |
| C. Correo con lámina y vistas | Sin código nuevo | Inmediato | Sin trazabilidad ni anclaje | Ninguno | Alternativa provisional |

### 11.2 Datos del proyecto

| Opción | Recomendación |
| --- | --- |
| **Mantenerlos en el navegador**, con exportación explícita | **Recomendada ahora.** Es coherente con D-08 y D-09, y A no la necesita cambiar |
| Sincronizar o alojar en la nube | Solo con la opción B, previa decisión |

### 11.3 «Soluciones» por perfil

| Opción | Beneficio | Riesgo | Recomendación |
| --- | --- | --- | --- |
| **Sección «Soluciones» bajo la bienvenida**, con una ficha por perfil (problema, pasos con capturas reales, qué entrega al cliente, botón «Empezar»), después de las tres entradas | El profesional se reconoce sin un paso obligatorio | Alarga la bienvenida en el teléfono | **Recomendada**, plegada en el teléfono |
| Página comercial aparte | Libertad de diseño | Duplica mensajes y puede prometer más de lo que hace la app | Más adelante, a partir del mismo contenido |
| Pestaña dentro del editor | — | Compite con la guía | No |

Regla: solo se muestra lo que ya funciona. Lo demás aparece como «en preparación» o no aparece.

### 11.4 Ayuda inteligente

| Nivel | Qué es | Requiere decisión |
| --- | --- | --- |
| Ayuda local determinista | Explicaciones del estado y de la siguiente acción, a partir de la guía y la búsqueda local | No |
| Prototipo | Propuestas estructuradas (por ejemplo, «ensanchar 200 mm») simuladas sobre una copia, con aprobación, rechazo y deshacer, **sin modelo de lenguaje** | No: es código local |
| Agente conectado real | Un proveedor de IA interpreta texto y genera propuestas | **Sí:** si la geometría sale del navegador (D-08), proveedor, presupuesto con coste por uso, consentimiento por proyecto y registro |

**Recomendación:** primero la ayuda local, después el prototipo. El agente real solo tras la decisión, con un piloto acotado.

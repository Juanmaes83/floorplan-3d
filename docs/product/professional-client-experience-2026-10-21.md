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
| A2 | El titular hablaba a un particular («Tu espacio, paso a paso», «recorre tu idea»). | Antetítulo «Para inmobiliarias, promotoras y estudios» y una entradilla sobre convertir el plano en una vivienda editable y presentarla al cliente. Se conserva el título «¿Qué quieres hacer?». |
| A3 | Restos de color crema en la bienvenida. | Pasan a los roles «Perla». Se conserva el logotipo. |
| A4 | El documento omitía la cadena GLB/Blender que ya existe fuera de la aplicación (#24, #42) y el orden 5 de la hoja de ruta 2 (glTF). | §6 |
| A5 | Citaba como «decisiones abiertas» lo que ya registran D-06, D-08 y D-09, sin nombrarlas. | §5 y §7 las citan. |
| A6 | La línea 5 proponía operaciones como «ensancha la isla 200 mm». El MCP local solo lee una copia exportada y sus etapas 2–4 no están aprobadas. | §7 separa la ayuda para comprender de la modificación de datos. |
| A7 | Afirmaba un «beneficio para D-01» sin plan de medida. D-01 deja la demanda comercial «por comprobar». | Cada resultado lleva su observación (§8). |

**Evidencia de las referencias:**

- **Enviz.** No hay ninguna referencia visual en el repositorio: `git grep -i enviz` en todas las ramas solo encuentra este documento. Todo lo atribuido a Enviz es **afirmación comercial** o captura no versionada, y no se presenta como capacidad de Rubik.
- **LoRA LAB.** Se usan las clases del estudio de #48 (rama `docs/loralab-study-gate`).

| Observación | Clase | Uso aquí |
| --- | --- | --- |
| LoRA LAB empieza por plantillas («Villa moderna», «Piso clásico», «Solar vacío») | Función ejecutada | Referencia de entrada sin perfil profesional |
| LoRA LAB: cambio 2D↔3D, corte por planta, recorrido desde la puerta | Función ejecutada | Contexto del resultado 2; Rubik ya tiene 2D/3D y presentación de dos plantas |
| LoRA LAB: «Copiar enlace» en el menú, sin enlace generado | Control visible | No prueba un servicio de revisión |
| LoRA LAB: exporta JSON y PNG 3D; no hay CAD en el menú | Función ejecutada / control visible | Contexto del resultado 4 |
| LoRA LAB: no se observa asistente de IA ni comentarios | Inferencia por ausencia | — |
| Enviz: perfiles, revisión de cliente, SKP/FBX/USDZ/BLEND, IA | Afirmación comercial | No se anuncian en Rubik |

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

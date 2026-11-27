# RUBIK SOTA · Auditoría previa al lanzamiento

Primer corte · 27/11/2026. Candidata de la PR #324: 6e95151718d9300fc12aa78a390dc95433a7f1b6. Base de referencia: dacb5d395abf32449102d73ffd03200e6c09c019.

La Preview respondió HTTP 200 con la CLI autenticada de Vercel. Chromium sin sesión de Vercel recibió el inicio de sesión. Las comprobaciones interactivas de este corte se hicieron en Chromium contra el mismo SHA, servido localmente. Datos sintéticos. Sin cambios al producto.

## Alta · Bloquea el cierre: el presupuesto de una planta puede parecer el total del edificio

**Impacto:** un profesional puede interpretar el importe de la planta activa como el presupuesto de todo el edificio y trasladar un importe incompleto a su cliente. **Esfuerzo preliminar:** bajo a medio para explicitar el alcance y mantenerlo en las salidas, alto para desarrollar consolidación de edificio. **Estado:** reproducido con un edificio sintético en la candidata. La auditoría se detiene aquí para decisión del propietario.

1. Importar el fixture de dos plantas. Superficies comprobadas independientemente por el área de sus polígonos: baja 16,80 m², primera 10,56 m², total 27,36 m².
2. Abrir Analizar. La superficie total es correcta, pero el resumen dice «Planta única».
3. Abrir Presupuestar desde la planta baja. El resumen baja a 16,8 m². El diálogo «Ver cantidades» avisa correctamente que se trata de la planta activa.
4. Abrir el presupuesto desde esa misma planta. Rellenar con 100 € sintéticos cada una de sus cinco partidas y seleccionar 21 % de IVA en este escenario. Aparece «Total» por 28.125,67 € y el diálogo carece de una indicación de la planta presupuestada. El archivo exportado confirma que el sujeto es el proyecto de la planta baja (`prj_fixture-ground`). La planta superior queda fuera.
5. El cálculo dentro de la planta es coherente con su alcance. La discrepancia está en cómo la interfaz comunica ese alcance entre Analizar, Cantidades y el presupuesto.

**Causa inspeccionada:** el presupuesto se prepara con `app.project` (la planta activa), mientras que Analizar puede totalizar todas las plantas. El diálogo de presupuesto no indica ese alcance.

**Comparación de ramas:** reproducido en Chromium sobre `master@dacb5d39` con el mismo edificio, las mismas cinco partidas y el total de 28.125,67 € sin etiqueta de planta. Analizar también muestra «Planta única» en ambas versiones. El problema es preexistente. [Captura de la base](edificio-presupuesto-base-total.png) · [Resultado](edificio-presupuesto-base.log).

**Alcance hasta el cliente:** con el nombre neutro «Reforma QA» en los proyectos de ambas plantas, D4 Cliente y su ventana de impresión muestran «Total con IVA · 28.125,67 €» sin indicar que abarca solo la planta baja. La salida verificada es el HTML que usa la ventana de impresión. [Captura de la salida](edificio-d4-alcance-neutro.png) · [Procedimiento](edificio-d4-neutro.js) · [Resultado](edificio-d4-neutro.log).

**Opciones:** (A) Hacer explícito «Presupuesto de planta · Planta baja» y «Total de Planta baja» desde el resumen hasta el expediente económico y las exportaciones, con prueba en ambas plantas. Corregir «Planta única» en Analizar. (B) Implementar presupuesto global por edificio con desglose por planta, preservando precios y revisión por nivel. Recomendación de auditoría: A como corrección inmediata, B como desarrollo independiente si se requiere.

**Evidencia:** [diálogo del presupuesto](edificio-presupuesto.png) · [total mostrado](edificio-presupuesto-total-detalle.png). Entrada y salida sintéticas: [edificio de prueba](edificio-dos-plantas.json) · [presupuesto exportado](edificio-presupuesto-baja.json).

## Alta · D3 pierde el borrador cuando el navegador rechaza la escritura

**Impacto:** se pierden datos introducidos en Entregar → D3 sin que la persona pueda advertirlo antes de avanzar. **Esfuerzo preliminar:** medio. **Estado:** reproducido en escritorio y a 390 × 844, con rechazo de almacenamiento simulado solo para la clave de D3.

1. Abrir Entregar → Dossier del proyecto → Preparar dossier y seleccionar estilo Cliente.
2. En una sesión de prueba, simular `QuotaExceededError` al escribir `rubik-dossier-client-v1`. Introducir un nombre sintético.
3. Pulsar «Siguiente: nota de presentación» y volver a «Cliente y contacto».
4. El campo vuelve vacío, sin aviso sobre la escritura. Esperado: preservar la edición durante la sesión e informar de que no quedará guardada si se cierra.

**Causa inspeccionada:** `save()` en `js/dossier-client-ui.js` absorbe la excepción de `localStorage.setItem`. Los pasos se vuelven a renderizar desde el almacenamiento y pierden la edición rechazada. El flujo «Preparar imágenes» también muestra un aviso de borrador guardado sin comprobar el resultado de esa escritura.

**Propuesta:** conservar el borrador en memoria asociado al ID del proyecto, comunicar el resultado real de la persistencia y evitar el mensaje de guardado cuando falle. Probar fallo, reintento y cambio de proyecto sin mezclar borradores.

**Evidencia:** [antes](d3-antes.png), [después](d3-despues.png), [móvil emulado](d3-movil-despues.png). Con almacenamiento operativo, el nombre permanece al avanzar y volver durante el mismo proyecto. El archivo del panel D3 es nuevo respecto a la base inspeccionada.

## Media · D3 oculta el fallo real de captura 3D

**Impacto:** el usuario vuelve a Revisar con las imágenes aún pendientes y sin conocer el motivo del fallo. **Esfuerzo preliminar:** bajo. **Estado:** reproducido con Chromium en el SHA auditado.

**Pasos:** abrir D3 → estilo Cliente → Revisar. Simular una excepción en `View3D.deliveryShot` y pulsar «Preparar imágenes». El motor queda en `error` con el motivo «QA: captura 3D indisponible». El dossier vuelve a abrirse sin ese mensaje. [Captura](d3-captura-error-sin-aviso.png).

**Causa inspeccionada:** `js/project-views-ui.js` captura el error internamente y lo expone como estado y propiedad. `js/dossier-client-ui.js` espera la promesa y solo mira si rechaza. El test de D3 existente sustituye `prepare()` por una promesa que sí rechaza, por eso no cubre la ruta real del error.

**Propuesta:** consumir el resultado efectivo de preparación, mostrar el motivo en D3, conservar el borrador y probar la ruta con un fallo en la captura, sin sustituir `prepare()`. Pendiente de coordinar con Claude porque ese flujo está en el alcance activo de #324.

## Media · Cambiar a Escena 3D marca la revisión como hecha

**Impacto:** una acción de visualización modifica el progreso del proyecto, en contra de la ayuda visible. **Esfuerzo preliminar:** medio. **Estado:** reproducido en un perfil Chromium nuevo. Mismo registro automático en el código de la base. La ayuda explícita de la separación está en la candidata.

**Pasos:** abrir Diseñar con un proyecto de ejemplo sin la revisión marcada. Pulsar únicamente «Escena 3D». El estado pasa a «Revisa la distribución en 3D: hecho». La ayuda de «Revisar en 3D» dice que «Escena 3D» solo cambia la vista. [Antes](revision-3d-antes.png) · [Después](revision-3d-despues.png).

**Causa inspeccionada:** `js/guide-ui.js` registra evidencia de revisión al recibir `floorplan-view-ready`, independientemente de la acción que abrió la escena. `js/perla-editor-ui.js` describe dos intenciones distintas.

**Propuesta:** separar escena cargada de revisión registrada. Probar selector 2D/3D, acción «Revisar en 3D», accesos programáticos de los entregables y retorno. Validar también los recorridos guiados que hoy se apoyan en el evento. Pendiente de coordinar con #324.

## Media · El resumen llama carpinterías a todos los huecos

**Impacto:** la cabecera y el CSV pueden inducir al lector a tratar huecos sin puerta o ventana como carpinterías. **Esfuerzo preliminar:** bajo. **Estado:** reproducido con el ejemplo. El código de la base usa el mismo total en la etiqueta.

**Evidencia:** el panel y el CSV muestran 22 «carpinterías». El CSV contiene **20 puertas o ventanas y 2 huecos de paso**. El presupuesto solo genera 6 puertas de paso, 2 correderas y 12 ventanas. Las 20 carpinterías presupuestadas son correctas para este caso. [Panel de cantidades](mediciones-presupuesto.png).

**Causa y propuesta:** el resumen y la tabla reutilizan el recuento de todos los huecos. Mostrar «22 huecos» o «20 carpinterías · 2 huecos de paso». Revisar consumidores de CSV antes de variar el nombre de la sección y comprobar ES/EN/ZH. Pendiente de coordinar porque la vista compartida de Presupuestar está en la candidata.

## Pendiente de calificar · identidad del Proyecto de ejemplo en la recarga

En el control con escritura operativa, una recarga del editor de ejemplo abrió un ID de proyecto distinto. El borrador anterior quedó almacenado bajo la clave original. En una copia propia («Mi distribución») la recarga conservó el mismo ID y el nombre de cliente guardado. La observación se limita al proyecto de ejemplo. Falta contrastar la intención del ejemplo antes de clasificarla como defecto de producto.

## Registro de validaciones superadas

**Referencia:** candidata `6e95151718d9300fc12aa78a390dc95433a7f1b6`, PR #324, base `dacb5d395abf32449102d73ffd03200e6c09c019`. Chromium local con datos sintéticos y pruebas dirigidas de Node. Estas filas acreditan resultados técnicos del escenario indicado. Las aprobaciones visuales del propietario conservan los SHA de sus respectivas Previews.

| ID | Caso comprobado | Resultado y evidencia | Repetir si cambia |
|---|---|---|---|
| QA‑01 | Proyecto → Descargar JSON → Subir plano o proyecto → volver a exportar | Solo difiere `/id`. Conservados 13 estancias, 70 muros, 22 huecos y 46 objetos. [Original](json-original.json) · [Reimportado](json-reimportado.json) | Importación, serialización, identidad o esquema del proyecto. |
| QA‑02 | Copia propia guardada → completar D3 → recargar | Se conservan el ID de «Mi distribución» y el nombre del cliente con almacenamiento operativo. [Recorrido](probar-copia.js) | Persistencia, biblioteca, identidad o guardado de D3. Los casos de fallo de almacenamiento y ejemplar efímero figuran como hallazgos aparte. |
| QA‑03 | D3 Cliente → revisar → ventana de impresión | Se incluyen el contacto marcado para mostrar y la nota pública. La nota interna queda excluida de ambas salidas. El dossier indica 87,18 m². [Comprobación](d3-impresion-privacidad.js) | Ficha de cliente, selección de datos, composición o impresión. |
| QA‑04 | Coherencia de superficie útil en la vivienda de una planta | Analizar, Presupuestar y D3 coinciden en 87,18 m² útiles. Presupuestar muestra por separado 86,83 m lineales de muro. Los dos miradores constan fuera del cómputo en el CSV. [Pantalla](mediciones-presupuesto.png) · [CSV](cantidades.csv) | Medición, cómputo de estancias, precisión o formato de entrega. El alcance del presupuesto de varias plantas sigue abierto. |
| QA‑05 | Precio manual, merma, IVA y estado de revisión | 32,56282 m² con 5 % de merma y 42,75 €/m² producen 1.461,66 € de base, 306,95 € de IVA de prueba y 1.768,61 € de parcial. UI, CSV y recálculo desde JSON coinciden. El precio pasa a revisado solo al marcarlo y las demás partidas siguen sin precio. [Pantalla](presupuesto-qa.png) · [CSV](presupuesto-qa.csv) · [JSON](presupuesto-qa.json) | Cantidades, fórmula, redondeo, estado de revisión o exportación económica. |
| QA‑06 | Precio manual en origen → reimportar copia independiente | El precio de prueba de 77,77 € permanece en el origen y el campo equivalente de la copia empieza vacío. [Comprobación](presupuesto-aislamiento.js) | Identidad de importación, traspaso de precios o persistencia de presupuestos. |
| QA‑07 | Entregar → Escena para Blender → descargar ZIP | El proyecto conserva su contenido. El hash del GLB coincide con el manifiesto. Se identifican las 13 estancias, 70 muros y 46 muebles. Los límites X/Z de los 13 suelos coinciden con sus polígonos 2D con una desviación inferior a 0,001 mm en esta muestra. [Pantalla](escena-blender-exportacion.png) · [ZIP sintético](escena-auditada.zip) | Geometría, origen o escala, mallas, identificadores, conversión o empaquetado. |
| QA‑08 | D3 a 360 × 800 y retorno de foco | Los tres pasos caben sin desplazamiento horizontal del diálogo. Escape devuelve el foco al acceso de D3 y al del presupuesto. [Captura](d3-360-revision.png) · [Comprobación](movil-foco.js) | Diálogos, estilos adaptables o gestión del foco. |
| QA‑09 | Pruebas dirigidas de Node | **65/65** en superficies, cantidades y coherencia presupuestaria. **74/74** en edificios, DXF y presupuesto/BC3. | Núcleos y contratos cubiertos por estas suites, o si se necesita validar una composición nueva. |
| QA‑10 | Proyecto girado 30° → Escena para Blender → comparación por estancia | Los 13 suelos conservan límites y superficie. Desviación máxima de límites X/Z inferior a 0,001 mm y diferencia de área de la cara superior inferior a 0,000002 m² frente al polígono 2D importado. Comparación por altura en los miradores elevados. Coincide el hash del GLB y el proyecto conserva su contenido. [Pantalla](escena-girada-30.png) · [Cálculo](comprobar-glb-girado.py) · [Resultado](comprobar-glb-girado.log) | Rotación, triangulación, origen, escala, suelos elevados o exportación GLB. |
| QA‑11 | Analizar → retranqueo vacío, negativo y 2,5 m sin parcela → estudio solar sin orientar | El navegador rechaza −1 y la evaluación queda igual. Con 2,5 m mantiene el retranqueo pendiente por falta de datos y conserva la superficie estimada. Sin orientación el estudio solar pide ubicación, zona horaria y norte. Escape devuelve el foco al acceso. [Pantalla](qa-analizar-sin-parcela.png) · [Resultado](qa-analizar.log) | Validación del formulario, estado de escala, reglas de parcela o estudio solar. |
| QA‑12 | Presupuestar → introducir un precio en baja → pasar a primera → regresar | Planta primera presenta sus 10,56 m², con cinco precios vacíos. Al volver a baja se conserva el precio manual de prueba de 77,77 €. Este aislamiento por planta es coherente. El bloqueo de comunicación del alcance sigue abierto. [Resultado](qa-plantas.log) | Identidad del presupuesto, cambio de planta, cantidades o persistencia. |
| QA‑13 | Escena para Blender → cancelar captura diferida → reintentar | Se simuló una captura pendiente sensible a la señal de cancelación. Aparece «Preparación cancelada» y no se ofrece ni inicia descarga. Reintentar ejecuta el capturador real y vuelve al estado listo. El contenido del proyecto no cambia. [Pantalla](qa-glb-cancelado.png) · [Resultado](qa-cancelar-glb.log) | Señal de cancelación, estados de exportación, entrega del ZIP o gestión de proyecto. |
| QA‑14 | Subir JSON malformado sobre un proyecto abierto | Mensaje «El archivo JSON no es válido o está incompleto». Se conservan el ID y el contenido del proyecto activo. Inyección del archivo mediante el input de Playwright. [Pantalla](qa-importacion-malformada.png) · [Resultado](qa-importacion-malformada.log) | Detección de formato, importador, transacciones de biblioteca o avisos. |
| QA‑15 | Móvil 390 × 844 → P2 Interiorismo → foto sintética → rechazar sin consentimiento, cancelar y reintentar | Abre «Cambiar el suelo · Roble claro». Antes de consentir informa qué falta y no genera alternativa. Una ejecución lenta se cancela. Al reintentar aparece «SIMULACIÓN». El proveedor real y la descarga permanecen bloqueados y no se observaron solicitudes POST/PUT/PATCH desde la selección de la foto hasta el resultado. [Pantalla](qa-fot01-simulacion-movil.png) · [Resultado](qa-fot01.log) | Carga de fotos, consentimiento, adaptadores, cancelación, rotulado o exportación de propuestas. |

Para retomar, consulta el HEAD de #324. Si coincide el SHA, comienza por los pendientes. Si cambió, revisa el delta y repite solo las comprobaciones afectadas, dejando las demás como evidencia del corte original. La regresión conjunta y la aprobación final mantienen su propio SHA.

**Entorno del segundo corte:** dos navegadores recibieron `ERR_CONNECTION_REFUSED` en recursos del servidor estático local al iniciar varias sesiones simultáneas. Se repitieron los dos casos de uno en uno y QA‑12/QA‑13 pasaron. La incidencia se atribuye a esta ejecución local y queda fuera de los defectos confirmados. La PR #324 seguía sobre `6e951517` en borrador, con comprobaciones fallidas en GitHub. Los resultados dirigidos de esta auditoría no acreditan el cierre de la CI.

## Siguiente tanda

### Tres proyectos nuevos · recorridos ejecutados

Chromium de escritorio, candidata `6e951517` servida localmente. Entradas y datos sintéticos. Los enlaces de vídeo son grabaciones del navegador durante la auditoría. Cada exportación se identifica en su propia prueba.

| ID | Escenario y validación | Evidencia |
|---|---|---|
| QA‑16 | **A · Patio claro.** Creado desde un plano vacío. Salón de 5 × 4 m y estudio de 3 × 4 m, 32 m² totales y siete muros. Deshacer y rehacer alternan una y dos estancias. Al recargar se conservan el ID y los polígonos. Probado el acceso a «Recorrer» en la escena 3D. El desplazamiento y las colisiones quedan por verificar. Crear un rectángulo contiguo con profundidad diferente devuelve un aviso y deriva al trazado manual. | [Dibujo y 3D](proyecto-a-dibujo.webm) · [Registro](proyecto-a.log) |
| QA‑17 | **A · Análisis y entrega.** Tras cambiar el suelo del salón a Baldosa 600 y añadir un mueble, Analizar y D3 muestran 32,00 m² estimados. Una partida manual de ese pavimento da 20 m² × 1,05 × 25 €/m² = 525 € antes del IVA de prueba. D4 identifica el importe como parcial y el total con IVA como pendiente, con cuatro partidas sin precio. Descarga DXF con `$INSUNITS=4` (mm). | [Recorrido](proyecto-a-entrega.webm) · [DXF](proyecto-a-patio-claro.dxf) |
| QA‑18 | **A · Blueprint y Despiece.** Blueprint abrió planta, sección y alzado. Despiece recuperó exactamente la firma de transformaciones tras separar y ensamblar. El proyecto quedó idéntico al cerrar los visores. Las dos láminas PNG descargadas se verificaron como archivos de 3307 × 2339 px y comparten el identificador de revisión en su nombre. Quedan por cotejar sus cotas impresas y exportar los vídeos de producto. | [Visores](proyecto-a-bpdp.webm) · [Descargas](proyecto-a-laminas.webm) · [Blueprint](proyecto-a-blueprint-lamina.png) · [Despiece](proyecto-a-despiece-lamina.png) |
| QA‑19 | **A · P2 con una vista amueblada propia.** Se capturó la escena 3D de Patio claro y se cargó como imagen de entrada. «Roble claro» abre el modo suelo. Rechazo antes del consentimiento, cancelación y reintento correctos. Resultado identificado como simulación, proveedor real y descarga bloqueados. Cero POST/PUT/PATCH observados en el tramo comprobado. | [Vista de entrada](proyecto-a-vista-3d.png) · [Recorrido P2](proyecto-a-foto.webm) · [Registro](proyecto-a-foto.log) |
| QA‑20 | **B · Reforma diagonal.** Se importó un PNG construido para este ensayo. Cota de 4000 mm y verificación perpendicular de 2500 mm, con error comunicado del 0 %. Cinco muros trazados manualmente. El polígono da 9,59375 m² y Analizar presenta 9,59 m² como medidos/calibrados. | [Plano fuente](proyecto-b-plano.png) · [Calibración y trazado](proyecto-b-calibrado.webm) · [Registro](proyecto-b-trazado.log) |
| QA‑21 | **B · Variante y P10.** Variante de la planta calibrada con cambio de roble a Baldosa 600. P10 identifica la historia anterior como obsoleta. Rehacer, guardar y previsualizar permite exportar. La tabla de evidencias muestra el material anterior y posterior con sus revisiones. El ZIP abre sin errores y contiene manifiesto y dos páginas PNG. | [Captura del cambio](proyecto-b-p10-cambio.png) · [Grabación de la entrega](proyecto-b-p10-entrega.webm) · [ZIP](proyecto-b-historia.zip) |
| QA‑22 | **C · Casa Taller.** Adaptación sintética de dos plantas importada como caso nuevo, baja 16,80 m² y primera 10,56 m². Plan guardado en borrador con dos tareas vinculadas a muros. Evolución abrió la revisión del edificio, avanzó, pausó y llegó al final de la cronología con ambas tareas. Tras cerrar, se observó Entregar con Casa Taller activa. El alcance del presupuesto por planta conserva el bloqueo anterior. | [Edificio](proyecto-c-obra.json) · [Plan y acceso](proyecto-c-evolucion.webm) · [Reproducción](proyecto-c-reproduccion.webm) |
| QA‑23 | **C · HERO FINAL.** Desde P6 se creó y asignó la marca sintética «Estudio Taller QA», con estilo editorial y mensaje de cierre. La configuración de la entrega devuelve la marca, el estilo y el mensaje esperados asociados al edificio. Se comprobó la vista previa. La firma en el archivo de vídeo queda pendiente. | [Personalización](proyecto-c-hero.webm) · [Vista previa](proyecto-c-hero.png) |

Quedan pendientes la modificación dimensional con comprobación del estado de revisión de precios, el movimiento a pie y las colisiones de navegación, la comprobación de cotas en lámina, los vídeos exportados de Evolución/HERO y P8/P9, y la repetición móvil de estos tres casos nuevos. Se mantiene la cobertura móvil anterior acreditada para sus escenarios.

1. El alcance del presupuesto por planta está reproducido en candidata y base y confirmado en la salida de impresión D4. Mantener el bloqueo hasta la decisión del propietario, la asignación de un responsable y la validación de la solución en el SHA acordado.
2. Verificar las correcciones de D3 y revisión 3D sobre la rama que las reciba, siguiendo los casos de fallo documentados.
3. Ampliar cobertura a planos propios calibrados, cancelación y recuperación en otros tipos de entregables, cambio de revisión con vistas ya preparadas y accesibilidad integral. Las pruebas del plano girado, cambio de planta, cancelación GLB y simulación de P2 quedan acreditadas en QA‑10 a QA‑15.

## Corte Villa Linde · 5a061725

Edificio sintético de 2 plantas, 14 dormitorios y 1.073,52 m² interiores. El nuevo fixture vuelve a reproducir la etiqueta «Planta única» de Analizar sobre el total del edificio. Conserva pruebas de Hybrid, P8, P9, Studio, Evolución y exportación Blender. [Informe y evidencias](villa-linde/INFORME-VILLA-LINDE.md).

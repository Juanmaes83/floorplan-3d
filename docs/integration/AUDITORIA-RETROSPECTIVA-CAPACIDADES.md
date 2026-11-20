# Auditoría retrospectiva de capacidades · RUBIK SOTA

**Estado.** Inventario inicial y recorridos indicados contrastados. Auditoría de capacidades restantes abierta. Simulator E quedó integrado en `8e917e1a70f499a6b8dc68850c8413b7d06c5682` como QA interno. Base observada `adb86034d76e7ddd2033fcadf571a4358c5d25e0`, árbol `1393aef8c7f09491f52130d60ae0838b0d2421b3`. Este registro enlaza las autoridades y sus evidencias. El catálogo y la matriz conservan los identificadores y estados canónicos.

## Cobertura inicial

- Catálogo y matriz v1.12. Las secciones canónicas contienen exactamente los mismos 98 IDs. Conservar los descartes, anexos y capacidades con seguimiento separado en sus secciones actuales.
- K9/GOV-03. El registro del árbol comprobado devuelve 24 entradas. Sus declaraciones son 14 en Production, cuatro piloto, dos simulación, dos planificadas, una integrada y una desarrollada. Son niveles declarados en código pendientes de contrastar con acceso, permisos y entorno efectivo.
- Alcance retrospectivo. Cruzar las capacidades base de las primeras versiones con consumidores actuales, 23 piedras SCULPT y módulos todavía experimentales. El registro K9 cubre solo una parte de este universo.

## Primeros contrastes

| Capacidad y fuente | Home | Plataforma | Entregables | Estado de la comprobación |
| --- | --- | --- | --- | --- |
| Importación multiformato · AST-01 | «Subir un plano» enumera PDF, imagen, DXF, IFC, RoomPlan y JSON/ZIP. La tarjeta de Arquitectura pide comprobar la escala. | Cabecera → Subir plano o Archivo → Subir plano o proyecto. Comparten selector. La detección usa el contenido y la revisión depende del formato. El editor conserva una ruta explícita de JSON. | El proyecto importado sigue los flujos existentes de JSON y ZIP. El JSON conserva las referencias y omite los bytes de imagen. | Inspección de la interfaz y del enrutamiento en la base. Las pruebas del repositorio cubren selector, calibración, formatos y cancelación. Validación de la Home por profesión y contraste en dispositivos pendientes. |
| Unión RoomPlan · OP-04 | La Home ofrece importar un archivo RoomPlan. La unión se realiza desde el editor. | Archivo → Unir escaneo RoomPlan → seleccionar JSON de una planta → indicar dos puertas → revisar propuesta → confirmar. La unión confirmada entra en el historial existente y conserva la entrada de biblioteca. | La geometría queda en el proyecto y su procedencia en una extensión sin el nombre ni el JSON original. La escala sigue estimada. | [#284](https://github.com/Juanmaes83/floorplan-3d/pull/284) y aceptación sintética de #268. Pendientes captura real y aceptación separada de los cambios UX en #271. |
| Exportación de planta activa · G-02 | La tarjeta de Arquitectura menciona importar DXF y entregar una vivienda editable. | Archivo → Exportar planta activa en DXF. El editor descarga un DXF 2D de la planta o variante abierta, sin mutar el proyecto. | DXF en milímetros con capas, cotas y leyenda. La reimportación comprueba integridad y recupera una escala estimada. Los huecos se reconocen por heurística. Para conservar edificio, mobiliario y escaleras se usa el JSON canónico. | Detectado el desfase de la matriz, que aún decía que RUBIK solo leía DXF. [#265 integrada](https://github.com/Juanmaes83/floorplan-3d/pull/265). Descarga de planta activa 1/1 en Chromium Windows sobre la base de la auditoría. Quedan dos CAD comerciales y el contraste del nombre en el entorno que falló. |
| Exportación visual OP‑10 | Evaluar su valor para arquitectura e interiorismo una vez revisadas las tarjetas existentes. | Escena 3D → Entregar → Documentación → Escena para Blender → Preparar escena → Descargar ZIP. | ZIP para colaboración visual en Blender. El manifiesto identifica una escena observada y registra sus huellas. | Descarga verificada en Production con un proyecto sintético. [PR #290](https://github.com/Juanmaes83/floorplan-3d/pull/290) |
| Simulator E | No aplica. Es una herramienta interna de QA. | Consumidor de QA de trayectorias, con geometría canónica como entrada. | Evidencia interna de contactos o cobertura incompleta. | Integrado en [#291](https://github.com/Juanmaes83/floorplan-3d/pull/291). Ocho pruebas dirigidas y CI posfusión 3/3. Uso interno desde `scripts/capture/simulator-e/`. |

## Evidencia reutilizada de la familia de importación

- El contrato multiformato y sus rutas están en [Subir plano](../technical/upload-multiformat.md). En el árbol auditado, el selector y el arrastre reutilizan FloorPlanIntake, y la unión reutiliza el conversor RoomPlan. Los tipos desconocidos o no importables reciben orientación. Se comprobó el cableado, sin repetir los casos acreditados de navegador.
- [OP-04](../technical/op04-roomplan-join.md) documenta límites de anclaje, transformación rígida, un solo paso de historial y el resultado sintético aceptado (11,31 → 22,62 m², puertas de 900 mm y diferencia de 0 mm). La visibilidad y el control de solapamientos de #271 conservan su propia aceptación.
- [G-02](../technical/g02-dxf.md) separa el dibujo 2D del proyecto portable. El [contraste del residual](op07-a0-2026-11-20/README.md#dxf-de-planta-activa--residual-independiente) identifica base, entorno y alcance del 1/1 reutilizado.

## Home por profesión · HOM-01–HOM-04

| Perfil | Primera acción que ofrece la Home | Consumidor que debe acreditarse en el recorrido completo |
| --- | --- | --- |
| Estudio de arquitectura | Subir un plano | Calibración, mediciones y láminas con marca. |
| Inmobiliaria | Recorrer el ejemplo 3D | Presentación por estancias y recorrido. |
| Promotora | Abrir el proyecto de ejemplo | Plantas, tipologías y marca. |
| Reformas | Subir un plano | Comparar propuestas, mediciones y presupuesto. |
| Decoración e interiorismo | Abrir el proyecto de ejemplo | Mobiliario, acabados y recorrido por estancias. |
| Constructora / jefe de obra | Abrir el proyecto de ejemplo | Presupuesto, plan Gantt y Evolución 3D a partir del plan. |

El perfil elige la primera acción y prioriza accesos que ya existen. [El check de Home de #290](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44717087403/job/136223129351) acredita los seis perfiles, enlaces que reutilizan áreas del editor y foco visible. Las pruebas de HOM-03 comprueban sus cuatro estados y usan simulación para las funciones que la necesitan. La evidencia cubre la entrada, el destino y el estado comunicado. La disponibilidad de una generación real requiere consultar su permiso y entorno. En HOM-04 queda por cruzar cada demostración con su aprendizaje y con la disponibilidad efectiva del recorrido que muestra. Los tests `home-demos.browser.test.cjs` y `construction-demo-core.test.cjs` permiten distinguir la demostración de los datos de un proyecto del usuario.

## Entregar · primera comprobación activa

| Superficie existente | Autoridad y alcance contrastados | Siguiente comprobación |
| --- | --- | --- |
| Documentación | Ficha de superficies y lámina reutilizan la geometría del proyecto. El dossier enumera sus secciones disponibles. OP-10 añade el archivo de colaboración visual desde Escena 3D. | Cruzar revisión, escala y firma de cada resultado por separado. |
| La vivienda, para tu cliente | Presentación, imágenes y el acceso local «Revisar como cliente» comparten el grupo, con resultados distintos. La revisión local usa la visita 3D en otra pestaña y una instantánea minimizada. El enlace publicado tiene permisos y ciclo de retirada propios. | Acreditar los permisos efectivos de publicación y cada tipo de salida antes de anunciar disponibilidad. |
| Seguimiento del proyecto | Presupuesto y observaciones enlazan sus autoridades existentes. La comparativa lee el original y las variantes guardadas del mismo grupo. La evolución representa el plan previsto. | Comprobar la correspondencia entre revisión de obra, presupuesto y entregables de la misma alternativa. |
| Identidad de la entrega | Reutiliza los perfiles locales de marca y la firma elegida por proyecto. La vista previa muestra cómo se aplica al plano de esa entrega. | Contrastar marca, privacidad y revisión en cada formato que reutiliza la firma. |

**Presupuesto en Entregar.** En Chromium 1440 × 900, sobre el checkout exacto de Production, «Probar el ejemplo → Entregar» mostró «Presupuesto: sin preparar». Tanto el grupo de Seguimiento como el dossier económico ofrecen «Revisar presupuesto». El botón del grupo abrió Presupuestar, que mostró 11 partidas y 11 sin precio. «Abrir presupuesto» abrió el editor con acciones CSV, JSON y BC3 visibles. Solo se recorrió el acceso, sin guardar precios ni descargar archivos. El texto antiguo del archivo base se actualiza durante el arranque de la interfaz por `js/economic-dossier-ui.js`. El archivo profesional servido y el del checkout coincidieron después de normalizar el BOM y los finales de línea (SHA-256 `399f897f3cc08777b2785fe30f46d9e389a6d7469b673501a3860fbc4d157ad0`). Este hallazgo queda cerrado para la entrada comprobada. Los demás recorridos, permisos y dispositivos conservan sus comprobaciones propias.

## Continuidad y privacidad · F0

| Capacidad | Acceso y consumidor en el corte | Alcance acreditado y gate |
| --- | --- | --- |
| Guardado confirmado de F0.2b | En el origen aislado del editor. La fachada de cinco claves se instala antes de cargar la biblioteca. Variantes, Presupuestar, Comparar y Evolución consumen esa autoridad. | [#269](https://github.com/Juanmaes83/floorplan-3d/pull/269) y las [pruebas dirigidas](F0-2B-VERIFICACION.md) acreditan migración en el piloto, conflicto, recarga y recuperación. La incorporación a master mantiene el origen aislado. Capacidad interna con efectos en guardado, sin acción propia en la Home. |
| Identidad portable y restauración | El contrato de expediente v1 usa el núcleo de proyecto o edificio y sus imágenes por referencia exacta y planta. Valida documentos de presupuesto y observaciones antes de restaurar. | Las pruebas separan revisión local, identidad portable y vigencia de una entrega. Las exclusiones del expediente v1 no eliminan la autoridad de obra, tarifa o identidad. Su recorrido de usuario y el almacenamiento físico siguen en F0.3. |
| Protección de recursos y escritores | P0 protege referencias de fotografías MUE-01 en el almacenamiento existente. A0 acredita la convivencia de escritores antes de admitir un esquema incompatible. | P0 está integrado en [#270](https://github.com/Juanmaes83/floorplan-3d/pull/270). A0 mantiene la investigación WebKit. F0.2c es contrato documental en esta ruta. La copia privada de emergencia y las salidas ordinarias conservan sus permisos y alcances propios. |

## Continuación

1. Partir del catálogo, sus pendientes históricos, la matriz, K9 y los recorridos base. Enlazar cada módulo, consumidor y prueba existente. Registrar las correspondencias múltiples por ID.
2. Auditar HOM-01–04 por profesión. Contrastar beneficios y llamadas a la acción con recorridos y permisos reales en desktop y móvil.
3. Contrastar los recorridos prioritarios por familias con Entregar y Studio. Verificar revisión, privacidad, marca, licencias y trazabilidad. Documentar por qué una superficie queda fuera cuando corresponda.
4. Priorizar déficits con el protocolo de #289. Mantener la auditoría en lectura y las propuestas de corrección en cortes independientes. Reutilizar evidencia vigente vinculada al SHA y comprobar los deltas posteriores.

[Mandato y protocolo](https://github.com/Juanmaes83/floorplan-3d/pull/289)

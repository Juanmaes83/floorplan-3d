# Experiencia guiada Rubik Sota — integrada

Entrega autorizada el 13-10-2026 en `feat/unified-guided-experience`, desde master `88aef0bfeea8abb67865c3d2a33a484c909511ea`. Juanma aprobó la revisión de `5f0ae7200c206fec2ad22ada8b5be3ae17ebd5f0` y la [PR #34](https://github.com/Juanmaes83/floorplan-3d/pull/34) se fusionó en `master` (`92a1193fc1386d3f69566beab15923cc62836222`). [Cierre y comprobaciones](../qa/guided-experience-integration-2026-10-13.md). Producción automática READY; sin promoción manual.

## Experiencia

- Bienvenida: buscador de necesidades, subir PNG/JPG/WebP, crear desde cero y probar el ejemplo. Continuación cuando hay un proyecto propio recuperable.
- «Crear desde cero» utiliza la creación local existente y abre la primera estancia, sin volver a preguntar si se quiere un plano vacío.
- El ejemplo permanece identificado. «Crear a partir del ejemplo» guarda una copia independiente. Un objetivo propio sobre el ejemplo ofrece esa acción explícita como requisito.
- Cinco etapas, objetivo visible, tarea actual, acción principal y detalles de todas las tareas. El progreso ocupa una fila del editor; no tapa el plano.
- Buscador local con sugerencias, tildes, mayúsculas, sinónimos y tipos de mueble del catálogo existente. Navegación con flechas/Enter/Escape y Ctrl/Cmd+K. «Cambiar la cocina» muestra tres posibilidades compatibles con el editor.
- Guía cerrable y recuperable. Acceso al editor completo, historial existente y confirmaciones de vaciado/eliminación. El modo completo sigue disponible al crear otro proyecto.
- Español principal y textos nuevos ES/EN/ZH; adaptación a móvil vertical y horizontal; foco visible, combobox/listbox y estados con texto, símbolo y color. La URL base abre la bienvenida con continuación del proyecto conservado; recargar `#editor` retoma el editor sin reabrirla.

## Integración de «Subir plano»

La PR #33 estaba abierta, no fusionada, con HEAD `d17b3a28baf01d50e8828b79005ec571c6b84443`. Se incorporan sus dos cambios: CTA superior y conexión al importador de imagen. No se duplica el botón superior ni se modifica/cierra la PR #33. Los accesos de bienvenida, buscador y Archivo reutilizan `FloorPlanTraceUI.openImage`.

Una importación crea un proyecto independiente solo después de leer, validar, decodificar y almacenar la imagen. Cancelar o rechazar la imagen conserva el proyecto anterior. Formatos: imagen estática PNG/JPG/JPEG/WebP, máximo 15 MiB y 8000 px por lado. No convierte automáticamente una imagen en geometría 3D.

## Datos y evidencia

El schema y los archivos de proyecto no cambian. La guía usa `rubik-sota-guide-v1`, separado de `rubik-sota-project-library-v1` y de JSON/ZIP exportados. Cada entrada guarda identidad, objetivo, tarea, opcionales saltadas, estado de interfaz y evidencias. Al cambiar de proyecto o recargar se reconcilia con los datos reales.

| Tarea | Evidencia de finalización |
| --- | --- |
| Empezar | Proyecto propio para objetivos propios; ejemplo identificado para exploración |
| Imagen | Referencias presentes y todas las imágenes locales decodificadas y disponibles |
| Escala condicional | Calibración, segunda cota concordante y confirmación humana del estado `real`; la transformación coincide con la calibración |
| Distribución | Al menos una estancia con área positiva y muros existentes, sobre un documento aceptado por el contrato actual |
| Muebles | Objeto del tipo solicitado con centro dentro de la estancia elegida; abrir el catálogo no completa la tarea |
| 3D | Escena cargada para la revisión concreta del documento |
| Guardar | Lectura del almacenamiento persistente igual al proyecto abierto, no solo un clic ni una copia en memoria |
| PNG | Generación correcta del PNG; una operación tardía de otra versión/proyecto no acredita el actual |

El porcentaje usa solo tareas necesarias aplicables. Imagen y escala se vuelven necesarias si el origen o el documento utiliza una imagen. Un proyecto vacío con dimensiones introducidas no hereda calibración de imagen. Amueblar requiere muebles; revisar/guardar en 3D requiere la escena; guardar una distribución sin pedir 3D tiene objetivo propio; exportar PNG requiere su generación. Las opcionales tienen contador y salto independientes.

Los cambios del documento invalidan las evidencias de 3D/PNG, conservando el estado «Necesita revisión». Deshacer puede recuperar una versión acreditada. Las imágenes locales ausentes ofrecen recuperación ZIP. Guardado local automático y «Confirmar guardado» comparten el mecanismo existente. El resultado indica Proyectos → nombre y ofrece copia JSON o ZIP con imágenes.

## Límites explícitos

- La guía comprueba resultados de las capacidades actuales. No determina que se haya dibujado toda una vivienda ni certifica geometría, medidas, normativa o accesibilidad.
- La comprobación de colocación usa el centro del mueble. Los avisos geométricos y las revisiones avanzadas existentes siguen disponibles para huellas, solapes y holguras.
- Escala estimada y confirmada por la persona se distinguen. Incluso tras una segunda cota, las medidas son orientativas; el umbral del 2 % sigue siendo provisional.
- La tarea 3D acredita carga de esa versión. No equivale a aprobación visual humana. Three.js necesita conexión y WebGL; un fallo conserva el 2D y la tarea pendiente.
- El guardado es local al navegador/origen. Una preview nueva puede tener otro almacenamiento. Se necesita exportar JSON/ZIP para transportar un proyecto; PNG conserva una imagen, no la edición.
- El navegador gestiona la ubicación final de las descargas. No se declara que se haya escrito en una carpeta del dispositivo que el producto no puede verificar.
- El historial de deshacer es de sesión y se reinicia al recargar, como en el editor existente.
- Las pruebas de móvil son emulación Chromium/SwiftShader. No se acredita rendimiento en GPU o teléfonos físicos.

## Verificación

Resultados reproducibles y fallos corregidos: [informe QA](../qa/guided-experience-2026-10-13.md). La rama añade un gate de CI para las pruebas de lógica/editor. Los tests antiguos entran explícitamente al editor completo mediante `tests/editor-fixture.cjs`; los nuevos prueban la primera visita y la guía.

## Navegación de vuelta

La URL de entrada abre la bienvenida aunque haya un proyecto recuperado; «Continuar mi proyecto» y «Volver al proyecto» vuelven al documento conservado. `#inicio` y `#editor` representan las pantallas, y el historial del navegador permite Atrás/Adelante. Recargar `#editor` retoma el trabajo. Volver no cambia el documento ni el historial de deshacer. El botón «← Inicio» permanece visible al desplazar la barra horizontal en móvil.

«← Paso anterior» y las etapas permiten revisar tareas completadas. La elección manual se conserva en los metadatos de la guía (`manualTask`), separada del proyecto, evitando que la reconciliación salte de nuevo a una tarea posterior. La evidencia y el porcentaje siguen calculándose a partir del documento. Cancelar o Escape al preparar la primera estancia devuelve a la bienvenida. Atrás cierra ese diálogo sin aplicar la previsualización de estancia. Una importación tardía no cambia la pantalla si la persona ha navegado mientras se procesaba.

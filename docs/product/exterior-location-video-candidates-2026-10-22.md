# Candidatos de producto: exterior, mobiliario 3D, visita, ubicación y vídeo

**Fecha:** 2026-10-22. **Estado:** propuesta para revisar por cortes; ninguna capacidad descrita aquí queda aprobada ni implementada por este documento. **Base de comparación:** `master@e796e3d`. No mezclar con el trabajo en curso de orientación de recorridos de la PR #71. Auditar de nuevo la base antes de implementar.

## Fuentes y alcance de la observación

Juanma aportó cuatro capturas de la referencia LoRA LAB (17-10-2026). Las primeras muestran el editor, las pestañas Construir / Amueblar / Exterior, catálogos y controles de fachada, cubierta y entorno; la cuarta muestra una escena interior en primera persona junto a una escalera. Las imágenes son **evidencia de interfaz**, no prueban que se coloquen objetos, que se suba una escalera caminando ni la calidad, accesibilidad o rendimiento de la visita en dispositivos reales. Para observaciones anteriores y los vídeos, consultar el estudio #48 y su matriz visual, teniendo en cuenta su fecha y los cambios posteriores de Rubik.

## 1. Exterior y contexto del edificio

**Resultado buscado:** que el profesional encuentre con claridad el futuro espacio de edición exterior y que, cuando exista, pueda presentar edificio y entorno sin confundir un fondo decorativo con terreno, orientación o geografía real.

Rubik ya ofrece Construir / Amueblar y tres fondos 3D visuales (Estudio, Jardín suave y Ciudad). Un fondo de jardín es decorativo y no constituye un catálogo editable de exterior. Propuesta inmediata de descubribilidad: evaluar `Exterior · Próximamente` junto a las otras familias, con una explicación breve y accesible de lo que aún no hace. No permitir que parezca una acción disponible, no abrir una paleta vacía y no ocupar el CTA principal del flujo. Validar si mostrar una función no disponible ayuda realmente a usuarios D-01; si estorba, documentarla solo en «Próximamente» o en el roadmap.

La implementación exterior real necesita decidir qué se edita: terreno, caminos, vegetación, fachada, cubierta, límites y elementos externos; su representación por planta y en 3D; sus unidades; guardado/importación/exportación; y pruebas de coherencia. **No deducir esa implementación de las capturas ni prometerla en el botón.**

## 2. «Sube tus muebles en 3D»

**Resultado buscado:** que un estudio reutilice su catálogo o el modelo autorizado del fabricante en un proyecto sin perder escala, edición ni portabilidad. Es una capacidad futura, distinta de los muebles genéricos, los modelos 3D autorizados existentes y la exportación GLB. No anunciar una importación disponible antes de probarla.

Corte de investigación antes de código: seleccionar un formato inicial según muestras reales de usuarios D-01; comprobar licencia y procedencia, tamaño y límites de triángulos/texturas, unidades y ejes, punto de apoyo, dimensiones/huella 2D, materiales, animaciones, seguridad del archivo, rendimiento móvil, miniatura y fallback si el activo falta. Definir cómo se conserva en JSON/ZIP sin romper lectores actuales ni filtrar archivos locales. Ensayar modelos correctos y malformados; no permitir que un mueble se sitúe silenciosamente en una escalera o hueco.

## 3. Paridad de experiencia inmersiva

**Resultado buscado:** que la visita permita entender habitaciones, puertas, orientación y cambio de planta sin perderse, manteniendo una calidad útil para la entrega profesional. Rubik ya tiene recorrido libre, recorrido guiado, puertas interactivas y presentación; la captura de LoRA LAB solo prueba la vista visible en un instante. **No declarar paridad por comparación de imágenes estáticas.**

Preparar un ensayo equivalente con un proyecto de dos plantas y escenas comparables: escritorio con GPU y móvil físico; inicio, altura de ojos, acceso a controles, puerta, estancia estrecha, escalera, transición de planta, iluminación de día/noche, legibilidad, continuidad y estabilidad. Registrar vídeos reales y métricas por dispositivo, errores y límites. Separar expresamente «escalera visible en 3D» de «subirla caminando», que no está acreditado en la referencia. El resultado será una lista corta de diferencias reproducibles, no un rediseño indiscriminado.

## 4. Identidad de la vivienda y ubicación controlada

**Resultado buscado:** el profesional nombra y presenta una vivienda concreta; el cliente reconoce el proyecto y, cuando el profesional lo autoriza, conoce su zona o ubicación. Reutilizar «Tu marca» para distinguir identidad de empresa de identidad del inmueble: nombre comercial de la vivienda, nombre interno, texto de presentación y ubicación opcional. Revisar compatibilidad con edificios y proyectos de una planta, copias, importación/exportación, presentación, lámina y lote ZIP antes de elegir dónde se guarda cada dato.

Privacidad por defecto: no geolocalizar automáticamente ni publicar dirección exacta al compartir; permitir indicar solo barrio/ciudad o un punto aproximado y decidir qué ve el cliente. Primero contrastar si basta una dirección editable con enlace externo a un mapa. Un mapa incrustado o buscador geográfico supone servicio externo, condiciones de uso, atribución, límites, claves/coste según proveedor y datos enviados. Comparar Google Maps y OpenStreetMap y decidir proveedor y modo de uso antes de integrar. No asumir que los servidores públicos de mapas o geocodificación admiten tráfico ilimitado.

## 5. Vídeo de recorrido: muestra, descarga y distribución

**Resultado buscado:** que el profesional pueda entregar un recorrido comprensible en vídeo y que la bienvenida muestre una demostración auténtica de Rubik. El piloto Blender offline y las capturas/ZIP de imágenes existentes no equivalen a un botón de grabación en la aplicación.

Separar dos cortes: (a) vídeo demostrativo real y corto en la bienvenida, con póster, reproducción bajo demanda, subtítulos si hay voz, y alternativa de carga ligera en móvil; (b) grabar un recorrido 3D desde la aplicación, previsualizarlo y descargarlo localmente. Elegir entre captura de canvas/MediaRecorder y render offline después de medir compatibilidad, duración, formato, audio, calidad, memoria, reproducibilidad y capacidad del dispositivo. Asegurar que la grabación no expone paneles privados, rutas de archivo, direcciones exactas, identificadores internos ni datos de clientes sin elección expresa. La distribución por archivo descargado se puede estudiar antes que un enlace alojado; alojar/compartir por URL requiere las decisiones pendientes de servidor, caducidad, acceso y privacidad (D-06, D-08 y D-09). No simular un enlace público con un archivo local.

## Orden para decidir sin interferir con #71

1. Cerrar y auditar el flujo de orientación #71, las PR documentales abiertas y la base de `master`; conservar su evidencia y no duplicar el selector profesional de #70.
2. Validar con personas D-01 si el rótulo «Exterior · Próximamente» informa o distrae. Si se elige, un corte pequeño de interfaz, accesibilidad e idioma, sin simulación de capacidades.
3. Ensayo comparativo de visita y propuesta de las diferencias verificadas; priorizar defectos observados.
4. Elegir **un** corte funcional independiente entre identidad/ubicación con privacidad, vídeo descargable y muebles 3D, basándose en tareas reales, contratos y coste de validación. Exterior real exige antes su propio contrato de datos y alcance. Documentar lo que se posterga.

Para cada corte: fijar base y SHA, criterios observables, pruebas en escritorio y móvil, proyectos de una y dos plantas, importación/exportación y regresiones; revisión visual humana; evidencia de GPU/teléfonos si el resultado depende de ellos. CI sin pasos no cuenta como aprobada. No hacer merge ni despliegue a partir de esta propuesta.

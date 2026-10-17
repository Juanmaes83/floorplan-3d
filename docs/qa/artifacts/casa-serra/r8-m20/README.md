# R8 M20 — presentación portable

Código probado: `d267e4c`. Chromium/SwiftShader y Playwright local. Se abrieron y revisaron los tres PNG: vista 3D antes y después de descargar, y editor 2D tras reimportar el ZIP interno en un contexto limpio. En la vista posterior se lee «3 vistas PNG y proyecto editable descargados»; la imagen reimportada muestra la geometría de las estancias sin diálogo superpuesto.

El ZIP exterior `presentacion-estancias.zip` contiene `presentation.json`, tres `views/view-NNN.png` de 1280×800 y `editable-project.zip`. El último se extrae e importa con el control de proyecto ZIP del editor. Las vistas son imágenes estáticas; el proyecto interno es editable, no una escena 3D interactiva portable. No hay subida a servidor. El producto rechaza una carga mayor que el límite anunciado de 320 MB antes de construir el ZIP exterior.

`portable-package-metrics.json` conserva tamaño y SHA-256 del ZIP exterior (1.103.207 bytes), ZIP editable (56.280 bytes), cada vista y la imagen de origen. El manifiesto registra el ID y la revisión exacta de origen, la revisión del paquete y una huella estable de la revisión reimportada. Esta última normaliza la referencia de almacenamiento de imágenes por su hash porque cada navegador les asigna una referencia local distinta. La prueba comprobó el mismo ID, 13 estancias, 46 objetos, sus IDs y los bytes originales de imagen después de importar en un contexto nuevo.

Suite afectada `project`, `tracing`, `presentation-batch`, `capture-3d`: **68/68 PASS**, sin fallos ni saltos. Log externo `C:\Users\temp123\work\floorplan-serra-supervisor\r8-m20-final.log`.

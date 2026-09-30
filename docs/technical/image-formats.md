# Decisión de formatos y claridad de importación

Entrega de seguimiento F1b sobre master `0f67a63`; F1a/F1b ya integradas. No
abre F2, no introduce dependencias de ejecución y no transmite planos a terceros.

## Acciones y recorrido local

- **Archivo → Importar proyecto JSON:** abre únicamente `fileIn`, filtrado a
  `.json,application/json`. Importa datos versionados y mantiene la migración F1a;
  no transporta imágenes. Extensión/MIME incompatible recibe una instrucción para
  usar la acción de imagen. La lectura/validación sigue siendo atómica.
- **Archivo → Cargar imagen de plano (PNG/JPG/WebP):** abre `traceImageFile` y
  reutiliza el mismo `openImage(true)` que **Plano propio → Nuevo desde imagen**.
  Crea un proyecto, conserva el anterior. **Añadir imagen** reutiliza el selector
  con `openImage(false)` y conserva la geometría del proyecto actual.
- Ayuda vinculada mediante `aria-describedby`, etiquetas de menú en ES/EN/ZH,
  menú con ancho y scroll vertical limitados al viewport, también en horizontal.
- Validación: tamaño antes de leer; firma/tipo real, contenedor y dimensiones
  antes de decodificar; MIME vacío permitido, MIME declarado incompatible o
  extensión falsa rechazados. `createImageBitmap` debe decodificar y devolver las
  dimensiones declaradas; se cierra el bitmap antes de guardar. Se conserva el
  error visible y el proyecto anterior en caso de rechazo.
- **15 MiB** y **8000 px en el lado mayor** permanecen iguales; no se reescala,
  recomprime, recorta ni convierte silenciosamente. El máximo raster admite hasta
  64 millones de píxeles; estos techos no prueban viabilidad en todos los móviles.
  Decodificar puede requerir al menos 256 MB para RGBA, más memoria del navegador.
  No se presenta como presupuesto de rendimiento aprobado.

## Formatos

| Formato | Decisión y validación |
| --- | --- |
| PNG | Conservado; firma/IHDR, dimensiones, decodificación real. EXIF rechazado como antes. |
| JPEG/JPG | Conservado; marcadores/SOF/EXIF, dimensiones y decodificación. EXIF 1/3/6/8 aplicado solo a representación; original intacto. Reflejos rechazados como antes. |
| WebP estático | Implementado: RIFF/WEBP y longitud exacta, límites de chunks, VP8 (lossy), VP8L (lossless), VP8X (extendido) y coherencia de dimensiones, más decodificación real. No depende de una biblioteca ni CDN. Si el navegador no lo decodifica se rechaza sin guardar. |
| WebP animado o con EXIF | No admitido: ANIM/ANMF o flags correspondientes se rechazan, así como chunks EXIF. Evita escoger un fotograma o aplicar orientación implícita sin contrato. Exportar una copia estática orientada localmente. |
| PDF | **Diferido.** El repositorio no incluye rasterizador de PDF local. Visor PDF del navegador no proporciona un contrato de rasterización en canvas usable por este flujo. No se añade un CDN o servicio externo. |
| HEIC/HEIF | **Diferido.** No hay decodificador local verificado ni soporte portátil comprobado en los navegadores objetivo. No se admite por extensión/MIME ni por una preview ocasional. |

Para PDF, exportar la página relevante en una herramienta local a PNG/JPG/WebP;
para HEIC/HEIF, exportar una copia local orientada a esos formatos. Conservar la
fuente original fuera del editor, comprobar resolución y calibrar la copia.
La aplicación no realiza esa conversión ni afirma conservar procedencia del
PDF: recibe un raster elegido por la persona.

Una futura incorporación PDF exige elegir/pinear un rasterizador y worker
empaquetados localmente (por ejemplo, evaluar PDF.js, Apache-2.0), verificar licencia,
origen, versión, atribuciones y peso del paquete **realmente elegido**, manejo de
páginas/passwords, procedencia/página/resolución, cancelación y presupuesto medido
de memoria/tiempo antes de decodificar. No se ha instalado, auditado o probado
PDF.js aquí ni se afirma un peso o versión. HEIC/HEIF requiere evaluar aparte un
codec local, sus licencias/componentes y compatibilidad, orientación y límites;
no se presume que un wrapper JavaScript acredite esos requisitos.

## Contrato, persistencia y ZIP

`FloorPlanProjectV1` conserva sus campos y reglas. WebP amplía `mediaType`; los
proyectos creados con WebP se escriben como **1.2.0**, sin bajar de versión al
recalibrar o añadir PNG/JPEG. V1.0/V1.1 siguen importando sin migración destructiva.
Lectores anteriores a esta ampliación pueden rechazar WebP: no se promete
compatibilidad con el enum antiguo.

IndexedDB guarda el Blob con tipo real y **bytes originales**. ZIP incluye
`images/<imageId>.png|jpg|webp`; valida extensión frente a firma y mediaType,
dimensiones, longitud, SHA-256 y decodificación antes de guardar cualquier recurso
importado. Se restaura con clave local nueva y los mismos bytes/calibración.
JSON nunca incrusta binarios ni URLs blob/data. No cambia STORE/DEFLATE ni sus
límites (21 entradas, 15 MiB/entrada, 320 MiB total).

Se reutiliza la transacción IndexedDB y la retirada de claves nuevas si falla la
colección. Lectura, conversión/decodificación y guardado fallidos no cambian el
proyecto ni dejan claves nuevas. Persiste la limitación histórica de dos almacenes:
un cierre brusco entre IndexedDB y localStorage puede requerir limpieza posterior.

## Evidencia y pendientes

Fixtures propios sintéticos; no se subieron viviendas o imágenes a servicios.
Las pruebas distinguen selector JSON/imagen mediante el evento `filechooser` de
Playwright y el ID del input. Inyectan archivos de prueba en el input; **no** validan
el aspecto/filtro del diálogo nativo de Windows/macOS ni el acceso a Descargas.
Pruebas táctiles emuladas: 360×800, 390×844, 844×390; escritorio: 1440×900.
Comprueban WebP: decodificación, calibración y segunda cota, recarga, ZIP en contexto
limpio y bytes restaurados; PNG/JPEG y rechazo atómico de fallos siguen cubiertos.

Pendientes: revisión humana de estos cambios, cinco planos autorizados, teléfono
físico, variantes/navegadores no probados, PDF y HEIC/HEIF con decisión independiente.
Los resultados reales de los comandos se registran en el informe de QA de esta
entrega; no equivalen a evaluación con cinco planos reales ni rendimiento físico.

# F1b: imagen, calibración y trazado manual local

## Estado de cierre (30-09-2026)

F1b está integrada en `master` mediante la [PR #6](https://github.com/Juanmaes83/floorplan-3d/pull/6), merge commit `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`. La PR #5, base de proyectos locales/mobile-first, se integró antes por el merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.

HEAD de código de F1b revisado: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`. Vercel informó deployment de preview READY para ese SHA. La sesión de revisión usó URL compartible temporal, que caduca el 01-10-2026; ver [registro de preview](../qa/F1b-preview.md).

Juanma autorizó explícitamente los merges con estos pendientes:
- La ruta «Archivo > Importar plano» filtra proyectos JSON. Las imágenes PNG/JPG se cargan mediante «Plano propio > Nuevo desde imagen». Se requiere mejorar las etiquetas/accesos y probar la carga del PNG proporcionado.
- Evaluación de cinco planos reales autorizados y prueba de rendimiento en móvil físico.
- PDF, WebP y HEIC/HEIF no están implementados.

Codex reportó 77 pruebas Node y 7 Python aprobadas en su checkout local. No se repitió la suite completa en esta sesión contra la revisión remota final; los checks remotos visibles eran de Vercel. La implementación 3D se probó con Chromium/SwiftShader, que no acredita rendimiento móvil físico.

La PR #2 contiene el roadmap de producto existente y sigue pendiente de reconciliar con los merges F1a/F1b. No se ha inventado una numeración nueva de fases.

## Base histórica de implementación

La implementación se preparó originalmente sobre `966ab8395dcef2875de0e25337cae9058052ea34`, rama `feat/f1-local-projects-mobile`. F1b se publicó apilada sobre esa base para conservar sus dependencias; tras aprobarse, PR #5 y PR #6 se fusionaron en orden. El merge final incorpora ambos conjuntos de cambios en master.
## Uso

1. «Plano propio» → «Nuevo desde imagen». Seleccionar PNG/JPG válido. El proyecto
   anterior se conserva. «Añadir imagen» mantiene también la geometría existente.
2. Elegir referencia, origen X/Y, giro, visibilidad y opacidad. La imagen original
   no se recorta ni modifica. La referencia se dibuja sobre el pavimento con su
   opacidad y bajo muros/muebles, para poder releer cotas tras trazar estancias. «Colocar imagen sin transformación» prepara referencias
   antiguas que no tengan `placement`.
3. «Calibrar»: tocar dos puntos de una cota e introducir su distancia en **mm**.
   Los puntos se guardan en píxeles originales, invirtiendo giro, desplazamiento y
   escala de presentación. «Segunda cota» usa otro par de puntos y distancia conocida.
4. Revisar distancia medida y error porcentual. El **2 % es un aviso provisional
   de producto, no garantía de exactitud**. Solo con resultado consistente y una
   pulsación explícita de «Confirmar escala» se marca `confidence:real` en este flujo.
   Con discrepancia queda estimada. Recalibrar elimina la segunda verificación y
   confirmación. Conserva la geometría ya trazada en mm: debe revisarse/corregirse,
   no se escala silenciosamente un diseño ni sus muebles.
5. «Muro»: dos extremos. «Puerta»/«Ventana»: tocar el muro portador (ancho inicial
   800 mm; editable). «Estancia»: marcar vértices y «Cerrar estancia». «Quitar último
   punto» corrige el borrador. Ajuste opcional a extremos próximos (10 px de pantalla)
   y ángulos 45°/90°. No es interpretación automática de la imagen.
6. «Seleccionar/editar»: tocar muro, hueco o estancia. El panel permite coordenadas,
   grosor/altura, medidas del hueco o vértices X,Y de la estancia. Guardados inválidos
   no alteran el proyecto. Borrar un muro borra sus huecos; borrar estancia limpia
   referencias `object.roomId`. Deshacer/rehacer conserva IDs e historial geométrico.
7. «Navegar/cancelar» separa navegación de dibujo. En trazado solo se aceptan toques;
   arrastrar o introducir un segundo dedo cancela ese toque, no crea geometría.
   Para pan/pinza/rueda, cambiar a navegar. Escape cancela borrador/selección.
8. Revisar W1–W4 y confirmar cada elemento cuando proceda; pulsar un aviso abre
   sus propiedades y centra el plano. Añadir/mover/girar/eliminar mobiliario genérico
   con las herramientas existentes. El 3D deriva del mismo proyecto.
9. «Exportar ZIP» incluye `project.json` y `images/img_<id>.png|jpg`. Importarlo en
   otro contexto reconstruye imágenes y proyecto. El JSON normal de F1a continúa
   disponible, pero no transporta binarios. El ZIP no incluye nombres originales
   de ficheros; conserva bytes originales y por ello puede conservar metadatos EXIF.
   Revisar datos personales antes de compartirlo.
10. Borrar imagen/proyecto con confirmación elimina sus bytes cuando ninguna otra
    entrada de la colección los referencia. Duplicados comparten el recurso local
    hasta borrar la última referencia. Borrar explícitamente una imagen vacía el
    historial para impedir que deshacer restaure una referencia sin bytes.

## Arquitectura y límites

- `tracing-core.js`: validación de encabezados, transforms, calibración, operaciones
  geométricas y W1–W4. No DOM ni red. Reutiliza el validador/proyección F1a.
- `local-images.js`: bytes originales en IndexedDB `rubik-sota-images-v1`.
- `project-package.js`: ZIP sin dependencias nuevas. Exporta método STORE; lee STORE
  y DEFLATE mediante `DecompressionStream('deflate-raw')` cuando el navegador lo admite.
  Rechaza cifrado, multipartes/ZIP64, enlaces, rutas fuera de la estructura, duplicados,
  CRC/longitudes incoherentes, rangos solapados y recursos ajenos/faltantes. Comprueba
  dimensiones, tipo y SHA-256 y decodifica realmente antes de modificar la colección.
- `tracing-ui.js`: integra los controles con proyecto, persistencia, historial, SVG
  y Three.js existentes; no crea otra geometría persistente ni sube datos.
- Compatibilidad y registro de segunda cota: [changelog](../contracts/CHANGELOG.md).
- Imágenes nuevas: **15 MiB**, **8000 px** de lado mayor; 20 imágenes, 2000 muros,
  2000 huecos, 500 estancias (200 vértices cada una), 5000 objetos y 1000 medidas.
  El esquema conserva sus 20000 px de metadatos históricos; la ingesta nueva limita
  a 8000. Se **rechaza**, en lugar de reescalar silenciosamente, la imagen excesiva
  para mantener bytes y coordenadas originales. Supuesto reversible derivado de D-10.
- ZIP: máximo 21 entradas, 15 MiB para JSON o cada imagen, 320 MiB total comprimido
  y descomprimido. Se limita el flujo DEFLATE antes de acumular el resultado.
  Es un techo de rechazo, no un presupuesto de rendimiento acreditado en móvil.
- EXIF JPEG 1/3/6/8: se aplica el giro inicial; para representación se neutraliza
  la etiqueta en una **copia**, conservando raster original, bytes, SHA y calibración.
  PNG con chunk EXIF se rechaza de forma explícita para evitar giros implícitos.
  Orientaciones reflejadas 2/4/5/7 no caben en `placement` V1: se rechazan con instrucción
  de exportar una copia PNG orientada. No hay recorte ni transformaciones destructivas.
- IndexedDB y localStorage no comparten transacción. Se valida todo, se guardan bytes
  con claves nuevas y después la colección. Si esta escritura falla, se retiran las
  claves nuevas. Tras borrar, se limpian las no referenciadas. Una interrupción brusca
  entre almacenes puede dejar bytes huérfanos; una limpieza explícita posterior los
  retira. Una pestaña de edición a la vez: no hay coordinación entre pestañas.
- Fuentes `remote`/`sidecar-file` no se descargan ni buscan en el sistema de archivos.
  Una referencia sin bytes locales muestra aviso; recuperar mediante ZIP.
- Las imágenes permanecen como referencia 2D; el 3D muestra la geometría trazada,
  no inserta una textura de plano con datos personales.
- No hay detección, backend, PDF, assets comerciales, cuotas de precios ni despliegue
  a producción. Falta evaluación en dispositivo físico y cinco viviendas autorizadas.

## Verificación

Comandos reales del checkout:

```bash
node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/browser.test.cjs
python3 tests/schema.test.py
git diff --check
```

Node usa la infraestructura ya disponible de Playwright/Chromium. Python usa
`jsonschema`. Las pruebas crean y cierran un servidor efímero y contextos aislados.
Los fixtures son planos sintéticos propios; no se descargaron viviendas privadas.
Las pruebas 3D emplean Chromium/SwiftShader y el transporte Three.js con curl/TLS
verificado de F1a: **renderizado por software**, sin acreditar rendimiento móvil.
La carga directa del CDN en este Chromium sigue condicionada por su confianza TLS;
no se cambia la red. Ver el resultado final ejecutado en la sección de cierre.

## Revisión humana, pruebas y cierre

Juanma revisó la interfaz desplegada mediante las capturas de escritorio y autorizó el merge. La revisión detectó que «Archivo > Importar plano» abre el selector JSON; esto explica que Windows oculte el PNG. El flujo de imagen separado es «Plano propio» → «Nuevo desde imagen». La carga del PNG adjunto por esa ruta, el uso en móvil físico y la evaluación de cinco planos reales autorizados permanecen pendientes.

Codex informó en su checkout:
- 77/77 pruebas Node aprobadas, sin omisiones.
- 7/7 pruebas Python aprobadas, sin omisiones.
- Recorridos de navegador, incluidos recalibración, 2D/3D y ZIP; capturas 390×844, 844×390 y 1440×900.
- 3D en Chromium/SwiftShader; no acredita rendimiento con GPU física o móvil.

No se repitió la suite completa en esta sesión sobre el HEAD remoto final; los checks remotos visibles eran de Vercel y no constituyen CI de tests. Por ello los resultados anteriores se atribuyen a Codex y no se presentan como nueva ejecución independiente.

F1b quedó integrada en master con aprobación expresa de Juanma:
- PR #5 (base local/mobile-first) merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.
- PR #6 (F1b) merge commit `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`.
- SHA de código de F1b revisado: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`.
- Preview Vercel: READY para ese SHA; el acceso temporal compartible caduca el 01-10-2026.
- Vercel creó automáticamente el deployment de producción al fusionarse en master; no se hizo despliegue manual.

El merge cierra F1b con limitaciones y evaluación restante explícitas; no demuestra precisión profesional ni termina la evaluación con planos reales.

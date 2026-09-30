# F1b: imagen, calibración y trazado manual local

## Base y dependencia

Base verificada final: `966ab8395dcef2875de0e25337cae9058052ea34`, rama
`feat/f1-local-projects-mobile`. La PR #5 sigue abierta como borrador hacia master.
966ab83 añade solo `docs/DEVELOPMENT-WORKFLOW.md` sobre a4b5a9d; las pruebas
se ejecutaron con el mismo código de base. El encargo actual autoriza explícitamente
avanzar con F1b apilada, como excepción al avance secuencial del flujo general.
No aprueba, fusiona ni marca cerrada la fase anterior.
F1a está en master mediante PR #4 (`de195e3`), pero proyectos múltiples, español,
uso móvil y fallback WebGL dependen todavía de #5. La PR F1b debe apilarse sobre
`feat/f1-local-projects-mobile`; no fusiona ni sobrescribe las PR #1/#2/#3/#5.

Autoridad de alcance: [plan F1–F3 de PR #3](https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F1-F3-plan.md).
Los documentos product/plan, F0-decisions y la checklist de PR #3 no están fusionados
en esta base: se consultaron desde su commit publicado, sin resolver la PR abierta.

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

## Decisiones y evaluación humana

D-02/03/04/06/08/09/10 se usan como supuestos locales de esta fase; D-07 continúa
pendiente para preview. No se han marcado decisiones F0 como aprobadas ni prometido
precisión profesional. [Matriz de cinco planos](../qa/F1b-five-plans.md): vacía y
**pendiente de validación humana**; impide declarar F1b aceptada o cerrada.

## Cierre de pruebas ejecutado el 30-09-2026

- Suite completa Node: **77/77**, cero fallos y cero omisiones, 203,94 s; incluye
  F1a, colección F1, lógica F1b y navegador.
- Esquema independiente Python: **4/4**, incluyendo el nuevo ejemplo compatible.
- Tras la revisión visual del pie y capas de referencia: navegador **20/20**,
  cero fallos/omisiones, 211,51 s. Comando: `node --test tests/browser.test.cjs`.
- Recorrido F1b final con recalibración después de trazar, en las tres vistas:
  **3/3**, 65,78 s; comando
  `node --test --test-name-pattern='F1b full workflow' tests/browser.test.cjs`.
- Recorridos comprueban interacción real de cámara, pixels renderizados y fuente
  compartida de 2D/3D; ZIP en contexto limpio, recarga y borrado de bytes en IndexedDB.
- Capturas propias 2D/3D de 390×844, 844×390 y 1440×900 revisadas; los mensajes de
  estado quedan en el pie y no cubren acciones del mobiliario.
- Sintaxis de 2 scripts inline y los módulos locales, y diff sin errores.
- No se acredita rendimiento de GPU/móvil físico ni los cinco planos reales.
- No hay workflows CI en la base ni se añadió un servicio de CI. Estado remoto de
  checks y PR/deployment no verificable por el bloqueo de API y falta de acceso Vercel.

Publicación: código en 9cd74a59fdb6db14ee132674df974e6c71a3057d, rama
feat/f1b-image-calibration-tracing. El cierre documental posterior no cambia código.
POST REST para abrir PR fue rechazado con Forbidden; no se insiste por GraphQL.
La conexión sin autenticar a la preview histórica de la base fue bloqueada por
el proxy con CONNECT 403: no se acredita protección de Vercel ni preview F1b.

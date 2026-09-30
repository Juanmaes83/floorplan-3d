# F2 — exportación local de sugerencias crudas

Estado de esta rama: **F2 experimental; exportación implementada, QA local registrada
más abajo; F2 no validada**. Requiere PR, preview y revisión/aprobación de Juanma;
no se fusiona en esta tarea. Las cinco sesiones y veinte planos reales son
validación empírica posterior y **no bloquean esta implementación**.

Base verificada: `master` @ `65518be43c1ff6680f53af5b6c3cf4a9f2257635`, exactamente
la indicada. Checkout inicial limpio en la rama del evaluador; creada únicamente
`feat/f2-local-raw-export` desde esa base, sin sobrescribir ramas/trabajo previos.
La PR #10 aprobó `axis-length-capacity-v1`: diagonales sin crédito pero incluidas
en denominadores globales; exhaustividad sobre ejes soportados aparte. No cambia
esa regla, el detector, FloorPlanProjectV1, calibración ni criterios de producto.

## Auditoría del recorrido y demostración del marco

1. «Plano propio» → cargar imagen → calibrar → «Sugerir muros localmente».
   `tracing-ui.js` decodifica bytes locales, neutraliza orientación EXIF en una
   copia como F1b y analiza un canvas reducido de lado máximo 512 px.
2. `FloorPlanWallAssist.detect` devuelve extremos en **píxeles del canvas reducido**.
   Sus IDs temporales `candidate_N` no son IDs del proyecto. Este detector actual
   solo propone horizontales/verticales en ese raster; el exportador no filtra
   diagonales y las conserva si existen en una salida cruda futura o fixture.
3. `toWorld` convierte a píxeles originales con `widthPx/sampledWidth` y
   `heightPx/sampledHeight`, aplica origen/giro/escala de `placement`, y redondea
   a mm con `Core.point`. Los `candidates` que se dibujan ya son geometría del
   **marco del proyecto**; no se pueden etiquetar como image-aligned-mm.
4. La nueva captura ocurre **entre detect y toWorld**, desde el mismo `result`,
   sin reconstruir muros aceptados ni invertir geometría ya redondeada.
   Fórmula por extremo: `x_mm = round(x_sample * widthPx/sampleWidth * mmPerPixel)`;
   análoga para Y. Origen imagen (0,0), X derecha/Y abajo, sin origen/giro placement.
   Puede haber factores X/Y ligeramente distintos por redondeo de tamaño del canvas;
   se usan ambos factores reales. No se retocan extremos para forzar horizontalidad.
5. Se exige calibración `known-dimension` de **esa misma imagen** y coincidencia
   entre `calibration.mmPerPixel` y `placement.mmPerPixel`. Se acepta escala estimada
   o confirmada y se registra su estado real, sin fingir verificación independiente.
   Sin calibración, imagen distinta o escala incoherente: asistencia manual intacta,
   exportación bloqueada con motivo visible. No se usa el 10 mm/px inicial como
   escala conocida ni se pide inventar un factor para permitir la descarga.

Demostración unitaria: raster original 800×400, muestra 400×200, 10 mm/px;
segmento crudo (20,10)→(120,10) produce (400,200)→(2400,200) mm alineados con
la imagen, aunque placement tenga origen (1000,−500) y giro 30°. Su candidato
visible tiene otros extremos; exportar este último como image-aligned-mm sería
incorrecto. Playwright recorre también una fixture PNG con desplazamiento y giro
30°, compara el archivo con la salida cruda del detector y demuestra la diferencia
respecto a la capa SVG. Usa la **escala efectivamente calculada** por el gesto,
con sus decimales, nunca la sustituye por un número ideal redondeado.

## Instantánea, revisión y caducidad

La captura es inmutable y solo vive en memoria. No entra en proyectos, JSON/ZIP
habituales, localStorage, sessionStorage, IndexedDB ni historial. Se invalida al
aceptar, guardar una corrección o rechazar **cualquier** candidato: no se permite
exportar el subconjunto superviviente como si fuera la salida cruda completa.
Abrir/cancelar el diálogo de corrección sin guardar no altera la geometría.
Para otra instantánea, volver a analizar; el nuevo análisis sigue siendo salida
cruda y puede incluir muros ya aceptados, pues el detector no deduplica geometría.

Cambiar imagen, proyecto, escala o placement invalida capa/instantánea y cierra
el diálogo de exportación. También Navegar/cancelar, Escape fuera del diálogo,
importar/reemplazar proyecto y un nuevo análisis. El análisis asíncrono conserva
la comprobación de serial y snapshot de F1b/F2: una respuesta tardía no resucita
una descarga. Antes de abrir y descargar se vuelve a comprobar la referencia.
El diálogo de metadatos conserva su propio Escape para cancelar solo la descarga.

## Acción y metadatos fiables

«Exportar sugerencias para evaluación» aparece al haber candidatos y solo está
habilitado con instantánea cruda calibrada vigente, sin revisión humana. Diálogo
con labels, foco inicial, validación nativa, botones ≥44 px, teclado/ratón/toque,
cancelación y límites del modal existentes en móvil. No requiere hover ni autenticación.
No hay descarga automática al analizar; cancelar no escribe ni descarga nada.

La persona introduce explícitamente `eval_NNN`, `case_NNN`, tipo de plano
(`digital/scan/photo`) y origen (`synthetic/real`). Sin valores seleccionados por
defecto ni inferencia por nombre de archivo. Son declaraciones: revisar localmente
la pertenencia al conjunto/permiso, conservar correspondencias fuera de Git y no
usar IDs derivados de direcciones, nombres o identificadores de vivienda.

`detector_commit` se obtiene de una fuente fija verificable:
`9e35908e9206738a34c3b9ac1d8bad3d1b3b2b61`, último commit que cambió
`js/wall-assist.js` en la historia verificada, **no** SHA de deployment, `latest`
ni una fecha. SHA-256 del archivo detector:
`3a5cb242556dc2aa404b1182f8306ac0268de8a36a793d7afd20c85d31db19db`.
Constantes en `raw-wall-export.js`, con prueba que compara los bytes del detector
actual; un cambio del detector sin actualizar su ancla/digest rompe esa prueba.
No se hace una petición de red para resolver la versión durante la descarga.
Este ancla identifica el detector, no todo el código de la app/preview.

## Formato intermedio explícito: versión 1

Descarga genérica `sugerencias-crudas-evaluacion.json`, sin nombre del proyecto,
imagen o archivo fuente. **No pasar directamente este envelope al evaluador**;
la conversión local posterior extrae su registro de evaluación.

| Campo raíz | Contenido permitido |
| --- | --- |
| `export_format` | `rubik-sota.raw-wall-predictions` |
| `export_version` | Entero 1 |
| `scale_applied` | `method:known-dimension`, factor positivo `mm_per_pixel` ≤1000 y `confidence:estimated/real` procedentes de calibración |
| `detector_source_sha256` | Digest del código detector, no de la imagen |
| `evaluation_record` | Registro compatible con el evaluador existente, descrito abajo |

Registro interno: `record_version:1`, IDs/metadata explícitos, SHA del detector,
`units:mm`, `coordinate_frame:image-aligned-mm`, y un caso con `analysis_status:ok`,
`reference_status:missing`, `references:null` y todas las predicciones crudas.
Cada segmento tiene ID anónimo estable `seg_000…`, extremos enteros mm en
±1 000 000. Se redondea solo al convertir desde píxeles; coordenadas fuera de
límites o segmentos que colapsen al redondear bloquean **toda** la exportación,
sin recortar/omitir segmentos. Máximo 40 candidatos del detector existente;
original hasta 8000 px y canvas de muestra hasta 512 px, sin modificar esos límites.

[Ejemplo sintético](../../tests/fixtures/f2-raw-export.synthetic.json): horizontal
4000 mm y diagonal 500 mm. No representa una vivienda. No contiene imágenes,
blobs, miniaturas, EXIF, nombres/rutas, project/image IDs, URLs ni historial.
Se construye por lista blanca; los objetos de imagen/proyecto nunca se serializan.
El factor de escala y extremos sí son datos geométricos necesarios: el archivo real
sigue siendo privado y debe revisarse antes de compartirlo por cualquier medio.

## Conversión y referencias solo en archivos locales

Desde raíz, Python estándar, sin dependencias nuevas ni red:

```bash
# Demostración exclusivamente sintética; salidas fuera del checkout.
python3 scripts/f2-raw-export-to-evaluation.py tests/fixtures/f2-raw-export.synthetic.json > /tmp/f2-raw-converted.json
python3 scripts/f2-wall-evaluation.py /tmp/f2-raw-converted.json --tolerance-mm 5
```

El conversor valida campos/versiones/escala/SHA/ID/unidad/marco usando el validador
existente, rechaza claves repetidas y cualquier referencia inventada en el raw.
Solo extrae `evaluation_record`; **no transforma otra vez** sus coordenadas,
no cambia escala ni inventa metadatos. No imprime rutas ni datos de un error.
No prueba por sí mismo que un archivo editado externamente corresponda a una
versión desplegada: el ancla/digest y la procedencia de sesión deben conservarse.

Para una descarga real: guardarla fuera de Git y convertir en otra copia local.
Conservar el original crudo; en la copia convertida añadir ejes de referencia
manuales independientes en el **mismo marco alineado con la imagen, en mm** y
cambiar `reference_status` a `reviewed` solo tras revisión. La normalización de
referencias desde proyecto aplica giro/desplazamiento inversos locales como en
el protocolo; no usar salida corregida del detector como verdad de referencia.
No ajustar escala o detector usando esas referencias reservadas.

Ejecutar después el evaluador con tolerancia explícitamente elegida/documentada;
5 mm es solo parámetro de pruebas sintéticas, no decisión de producto. Sin referencias,
el caso queda `metrics:null`, fallo `reference_missing`, `f2_validated:false`.
Al completar la referencia sintética idéntica, M=4000, R=P=4500: precisión y
exhaustividad global 8/9, exhaustividad soportada 1. La diagonal de 500 mm sigue
contando aunque no reciba crédito según la regla aprobada de PR #10.
No afirma precisión real, calidad dimensional, ahorro de tiempo o rendimiento físico.

## Privacidad y evidencia de pruebas

Playwright observa peticiones intentadas y WebSockets durante el flujo; solo GET
estáticos locales/Three.js ya existente, sin body/query ni nuevos destinos. Verifica
cero escrituras Storage/IndexedDB de exportación, proyecto/almacenamiento idénticos
antes/después, archivo sin campos privados y revocación de URL blob temporal de
la descarga. La URL no se persiste; el fichero se guarda solo por acción voluntaria.
El navegador mantiene el archivo descargado bajo control del usuario.

Solo fixtures sintéticos, ninguna descarga de planos reales. No cambia red ni TLS.
La suite heredada que ejercita 3D usa Chromium/SwiftShader y, cuando Chromium
rechaza el CA del CDN, curl con TLS verificado para módulos oficiales. Es
**renderizado por software**, no «QA 3D» de GPU/móvil físico ni medición de rendimiento.

## Capturas y revisión visual

| Tamaño | Diálogo de exportación sintética |
| --- | --- |
| 360×800 | [Captura](../qa/artifacts/f2-raw-export/360x800.png) |
| 390×844 | [Captura](../qa/artifacts/f2-raw-export/390x844.png) |
| 844×390 | [Captura](../qa/artifacts/f2-raw-export/844x390.png) |
| 1440×900 | [Captura](../qa/artifacts/f2-raw-export/1440x900.png) |

Capturas de controles, no planos privados ni baseline visual aprobado. Se comprueban
overflow, tamaños y descarga funcional. Se requiere preview ligada al HEAD final
para revisión humana; READY no equivale a aprobación. No se reutiliza preview
histórica #9/#10 para presentar esta interfaz. Publicación/verificación real se
registra al cerrar esta tarea; no se hace merge ni despliegue manual a producción.

## QA ejecutada

Comandos reales desde la raíz, sobre esta implementación:

| Comando | Resultado |
| --- | --- |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/wall_assist.test.cjs tests/raw_wall_export.test.cjs tests/browser.test.cjs` | 110/110, cero fallos, omitidos o cancelados; 292234.1898 ms |
| `python3 tests/schema.test.py` | 10/10 |
| `python3 tests/f2_readiness.test.py` | 12/12 |
| `python3 tests/f2_wall_evaluation.test.py` | 16/16 |
| `python3 tests/f2_raw_export.test.py` | 3/3 |
| `node --check js/raw-wall-export.js` | OK |
| `node --check js/tracing-ui.js` | OK |
| `node --check tests/raw_wall_export.test.cjs` | OK |
| `node --check tests/browser.test.cjs` | OK |
| `git diff --check` | OK |

También se comprobaron con `node --check` los scripts inline ejecutables de
`index.html` (excluyendo el importmap JSON) y con `ast.parse` ambos archivos Python
nuevos, sin crear bytecode. La conversión CLI de la fixture sintética y su
evaluación con `--tolerance-mm 5` terminaron con código 0; las métricas permanecen
ausentes mientras `reference_status` sea `missing`.

El primer pase dirigido de navegador dio 2/5: tres aserciones exigían exactamente
10 mm/píxel, pero el gesto de calibración produce un factor ligeramente decimal.
La descarga conservaba correctamente el factor real. Se corrigió la expectativa
para compararla con la calibración efectiva, sin redondear ni alterar el export.
El pase dirigido corregido dio 5/5 y la suite completa posterior dio los 110/110
indicados arriba, incluidas las nuevas comprobaciones de rechazo/corrección.

Se revisaron las capturas móvil vertical y horizontal. El diálogo horizontal
permite desplazamiento vertical; la descarga y cancelar son utilizables por toque.
Las capturas heredadas regeneradas por las regresiones se excluyeron del cambio;
solo se publican las cuatro nuevas capturas sintéticas de este flujo.

## Publicación y pendientes de revisión

Código y QA publicados en `feat/f2-local-raw-export`, commit
`298c6fd18d346fc724f274c4c60229d56f6c8c16`, desde la base obligatoria
`65518be43c1ff6680f53af5b6c3cf4a9f2257635`. El cierre documental posterior
no altera el código probado. `git push -u origin HEAD` funcionó sin force push.

La creación REST de PR falló exactamente con:

```text
Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden
```

La lista pública posterior seguía mostrando únicamente #1, #2 y #3 abiertas;
no se inventa una PR de esta tarea. Se puede preparar desde
[comparar master con la rama](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/f2-local-raw-export?expand=1).
No se intentó GraphQL, no se cambió la política de red, no hubo merge ni
despliegue manual a producción.

Los checks públicos del commit de código muestran
`Vercel / Vercel Preview Comments: succeeded`. No es evidencia de estado READY
del deployment ni ejecución remota de la suite. No hay workflow CI propio en
`.github/`. La consulta REST de check-runs también devuelve `Forbidden`.

El comentario de feedback de ese check apunta a esta
[URL candidata de preview](https://floorplan-3d-git-feat-f2-local-0acbc2-juanma-espinosas-projects.vercel.app/).
La petición sin autenticar desde este entorno falló con
`curl: (56) CONNECT tunnel failed, response 403` (`HTTP 000`, sin respuesta
del deployment). Por ello no se acredita READY, asociación del deployment al
HEAD documental final, acceso público ni revisión visual de esa URL. No se
deduce protección de autenticación del deployment a partir de un bloqueo del
túnel. Quedan pendientes crear la PR y confirmar el deployment READY del HEAD
final con URL accesible para revisión humana, desde GitHub/Vercel autorizados.
El trabajo y sus pruebas permanecen publicados; F2 sigue **no validada**.

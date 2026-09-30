# Preparación de la puerta F2 — sin asistencia implementada

Base verificada: `master` @ `d64466599e4ee5267471e1c136acc044062f0fa0`.
Estado: **preparación documental e infraestructura offline**; F2 no iniciada ni
validada. El [roadmap canónico](../ROADMAP.md) conserva la autoridad sobre fases.
Fuente de requisitos F2: [plan F0 de PR #3 @ 825ddf6](https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F1-F3-plan.md).
Esta preparación no aprueba decisiones F0 ni implementa detección/sugerencias.

## Inventario y evidencia disponible

| Evidencia | Disponible / estado |
| --- | --- |
| Cinco planos reales y permisos de uso revisados | 0 candidatos reales encontrados en `/workspace`; 0 autorizaciones documentadas. Línea base no ejecutada. |
| Veinte o más planos variados autorizados | 0 disponibles; no hay un conjunto fijo ni geometría/cotas de referencia documentadas. |
| Seis raster de tests | Sintéticos propios, formatos PNG/JPEG/WebP. Solo prueban infraestructura; no cuentan para ninguno de los conjuntos. |
| Funcionamiento en teléfono | Confirmado por Juanma; sin modelo/navegador ni mediciones de rendimiento físico. |
| Prototipo de asistencia y métricas asistidas | No existe en esta entrega; no se ha evaluado. |
| Error, tiempo, correcciones, latencia, memoria observados en planos reales | No disponibles; no se inventan valores o umbrales. |

La ausencia se refiere al checkout y carpetas accesibles inspeccionadas, no a
archivos que Juanma pueda conservar en otro dispositivo. La herramienta consume
registros declarados y no comprueba que existan los archivos o los derechos:
la revisión humana de las evidencias locales sigue siendo obligatoria.

## Cobertura mínima obligatoria de ambos conjuntos

La exportación digital sigue siendo requisito de la [línea base de cinco](F1b-five-plans.md).
El calculador aplica estos mínimos sobre registros **aptos**, no sobre todas las
filas declaradas; los criterios de aptitud se detallan más abajo:

| Conjunto | Número mínimo de planos distintos aptos | Tipos obligatorios | Mobiliario dibujado |
| --- | --- | --- | --- |
| Línea base manual | 5 sesiones medidas | Al menos uno `digital`, uno `scan` y uno `photo` | Sin mínimo con/sin mobiliario |
| Evaluación fija | 20 planos con referencias; revisión `eval_NNN` y conjunto congelado | Al menos uno `digital`, uno `scan` y uno `photo` | Al menos uno con (`true`) y uno sin (`false`) |

Para el conjunto de veinte, tipos y ambos estados de mobiliario son **mínimos
obligatorios**, no recomendaciones. No hay cuotas por encima de uno por categoría
ni obligación de cubrir las seis combinaciones tipo × mobiliario: un mismo plano
puede aportar cobertura a su tipo y a su estado de mobiliario. Los restantes
planos pueden distribuirse libremente entre esas categorías. Registros sintéticos,
sin autorización revisada, fuera de los límites o incompletos no completan número
ni cobertura. Cumplir estos mínimos de inventario no acredita representatividad,
precisión ni autorización para implementar F2.

## Conjunto fijo de evaluación: al menos veinte planos

Asignar un ID anónimo `plan_NNN` estable a cada plano original; copias, conversiones
y variantes del mismo plano no cuentan como viviendas distintas. Juanma debe
verificar esa correspondencia en el registro privado, pues el script no inspecciona
imágenes ni puede probar identidad o autorización. Registrar revisión `eval_NNN`, responsable y fecha de
congelación antes de probar asistencia. Exigir la cobertura mínima anterior de
exportación digital (CAD rasterizado localmente), escaneo, foto y con/sin mobiliario
dibujado. Procurar distintas resoluciones/orientaciones/calidades y con/sin cotas
impresas cuando existan medidas independientes fiables; estas variaciones no añaden
mínimos automáticos. No se presume cobertura más allá de los casos registrados.
Los casos fuera de los tipos cubiertos deben declararse no evaluados.

Por cada plano, exigir autorización revisada y evidencia privada, raster admitido,
geometría de referencia manual revisada (muros/huecos/estancias y unidades), cotas
conocidas y correspondencia con píxeles originales. Cuando falte referencia,
registrarlo: el plano no cuenta como apto para evaluación dimensional/geométrica.
No inventar medidas para completar la muestra ni usar la salida de un detector
como verdad de referencia. La preparación de referencias tiene tiempo/coste
propios; no mezclarlo con el tiempo de la asistencia evaluada.

Separar cotas usadas para calibración de cotas reservadas para validación; conservar
los IDs y mapas de puntos en local. No usar las cotas de validación para ajustar
escala ni elegir parámetros del prototipo. Reservar geometría/cotas de referencia
para evaluación. Si se afinan parámetros con algún plano, registrarlo y separar
ese uso de la evaluación; congelar versión del conjunto y del prototipo antes de
comparar, sin seleccionar solo casos exitosos.

Las cinco sesiones de base y el conjunto de veinte tienen propósitos distintos.
Podrían compartir algún plano si Juanma documenta el solapamiento y controla el
uso de sus referencias; eso no reduce el requisito de veinte planos distintos ni
permite presentarlo como generalización independiente. El script informa la
cantidad de IDs compartidos y mantiene ambos denominadores separados. La decisión
sobre reutilización y un conjunto reservado sin ajuste queda para revisión.

## Diccionario del registro anónimo

Copiar `f2-evaluation.template.json` fuera del repo. `baseline` y
`evaluation.plans` son listas separadas; se prohíben IDs duplicados dentro de cada
lista. `evaluation.frozen` y `revision_id` registran el cierre del conjunto; no
significan que haya ocurrido una evaluación. No incluir rutas, nombres de fichero,
direcciones, personas, EXIF, imágenes, proyectos o contenido de permisos.

Campos comunes por plano:

| Campo | Registro requerido |
| --- | --- |
| `id` | `plan_NNN` anónimo; tabla de correspondencia privada |
| `data_kind` | `real` o `synthetic`; los sintéticos nunca cuentan como datos reales |
| `type` | `digital`, `scan` o `photo` |
| `format` | `png`, `jpeg` o `webp` estático usado por la app |
| `bytes`, `width_px`, `height_px` | Tamaño/dimensiones enteros del raster; el cálculo excluye recursos sobre 15 MiB/8000 px |
| `orientation_deg` | 0/90/180/270 del raster de sesión; no copiar EXIF |
| `authorization` | `status:pending` o `reviewed`, y `evidence_id:auth_NNN` cuando Juanma haya revisado la evidencia local |
| `calibration_reference_ids` | IDs `dim_NNN` dentro del plano; listas vacías si faltan |
| `validation_reference_ids` | IDs de cotas independientes, sin coincidencias con calibración |

Para `baseline`, añadir `load_success` y `calibration_success` (booleanos),
`known_length_mm` y `measured_length_mm` de **una segunda cota**,
`tracing_seconds` (tiempo activo definido en el protocolo de cinco planos),
`corrections:{wall,opening,room,scale}` con contadores enteros e `incidents_count`.
Mediciones inexistentes y contadores no registrados son `null`, no cero; listas de
referencias pueden quedar vacías. Una sesión apta tiene una cota de calibración y
una de validación, carga/calibración exitosas y registros completos. Guardar
error firmado, tiempos por etapa, tipos de incidencia y datos de equipo en la
ficha privada; el script calcula el error absoluto y resumen de los aptos, que no
sustituye el informe de fallos de todas las sesiones.

Para `evaluation.plans`, añadir `geometry_reference_available` y `furniture_drawn`
(booleanos). Cotas de referencia y geometría deben revisarse en privado; el
booleano es una declaración, no prueba de exactitud. El script solo resume
inventario, no precisión/exhaustividad de un detector todavía inexistente.

El script local calcula mediana y p90 por rango más cercano, error absoluto de
segunda cota, tiempo activo, número/categoría de correcciones y fracción de planos
que necesitaron corrección entre las sesiones aptas; informa además fallos de carga/
calibración y recursos sobre límites, con sus propios contadores y denominadores. P90 es el elemento `ceil(0.9*n)` de la lista ordenada;
con cinco planos es muy sensible al máximo y no acredita generalización. Revisar
además resultados por tipo y todos los fallos, sin promediar casos incompatibles.
Ningún resultado de tests sintéticos es una métrica real publicada.

## Propuestas de criterio — pendientes de decisión de Juanma

Sin datos no se pueden proponer valores numéricos responsables. Estos son los
comparadores propuestos para decidir después de medir, **no umbrales aprobados**:

| Métrica | Propuesta para decidir con la línea base | Valor/decisión ahora |
| --- | --- | --- |
| Error dimensional | Comparar mediana/p90 absoluto por tipo y no empeorar la referencia manual; fijar máximo aceptable y tratamiento de deformación | Pendiente de medir/aprobar |
| Tiempo | Comparar preparación total y trazado activo manual/asistido en el mismo conjunto; exigir una mejora demostrable cuyo mínimo fijará Juanma | Pendiente; no adoptar el 30 % provisional de F0 |
| Correcciones | Comparar fracción de planos y número/tipo de correcciones, junto a precisión/exhaustividad de muros/huecos con tolerancia en mm acordada | Pendiente; no inventar tolerancia ni tasa objetivo |
| Cobertura | Publicar qué tipos/calidades fueron evaluados, número de éxitos y fallos y alcance soportado; no prometer cualquier plano | Pendiente de inventario y decisión |
| Latencia | Medir tiempo de respuesta/preparación, mediana/p90 y operaciones lentas en dispositivo/navegador documentados; acordar límite usable | Pendiente de medición física y decisión |
| Memoria | Medir pico/incremento, método y límites del navegador/dispositivo; acordar presupuesto que preserve edición y evite cierres | Pendiente; 15 MiB/8000 px son límites de ingesta, no presupuesto aprobado de RAM |

Al obtener datos, completar una decisión fechada por Juanma con versión de conjunto,
método/dispositivo, valores o comparadores aceptados, responsable y alcance. El
aviso existente del 2 % no aprueba D-04 ni una precisión profesional. Los métodos
de memoria varían por navegador: identificar APIs/herramientas disponibles y qué
parte de la memoria miden; no equiparar heap JS a consumo total del navegador.

## Puerta y condiciones del futuro prototipo

La puerta sigue cerrada: faltan cinco sesiones autorizadas medidas, referencias y
conjunto fijo de veinte, y umbrales explícitos acordados. La preparación de estos
materiales no equivale a iniciar F2. Revisar privacidad, operador y criterios con
Juanma y después seguir PR/revisión/aprobación/merge del flujo del proyecto.
`implementation_authorized:false` es permanente en esta herramienta: un informe
no modifica el roadmap ni concede permisos de implementar.

Cuando se autorice el prototipo local, toda propuesta será `suggested/unreviewed`,
aceptable, rechazable y corregible por una persona. Mantendrá edición manual,
historial e IDs, mostrará incertidumbre, no confirmará escala ni alterará geometría
silenciosamente. Respetará almacenamiento/límites locales. Quedan fuera backend,
IA externa, envío de planos, publicación automática, Asset Lab/CRM y precios.

## Reproducción y revisión

```bash
python3 scripts/f2-readiness.py docs/qa/f2-evaluation.template.json
python3 tests/f2_readiness.test.py
python3 tests/schema.test.py
node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs
git diff --check
```

No hay cambios de interfaz ni de asistencia en la app: no se requiere una nueva
preview UI para esta preparación. La preview de #7 es histórica y no valida estos
registros. Las pruebas de recorder usan entradas artificiales, sin planos privados;
se distinguen de las pruebas Node existentes y de la confirmación manual de Juanma.
Publicar esta preparación como PR hacia master, sin merge ni despliegue manual.
Los resultados reales de comandos se registran en el informe de entrega.

## Verificación inicial de esta preparación (30-09-2026; anterior a la reconciliación)

| Comando real | Resultado |
| --- | --- |
| `python3 scripts/f2-readiness.py docs/qa/f2-evaluation.template.json` | Código 0: 0 sesiones aptas y 0 planos de evaluación; métricas null; implementation_authorized false. No son mediciones de planos. |
| `python3 tests/f2_readiness.test.py` | 8/8 aprobadas, 0,18 s: cálculo, referencias independientes, duplicados, faltantes/fallos/sintéticos, límites, veinte variados/congelados y privacidad de salida. |
| `python3 tests/schema.test.py` | 10/10 aprobadas, 0,28 s. |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs` | 59/59 aprobadas, sin fallos/cancelaciones/omisiones, 0,38 s. |
| `git diff --check` | Código 0, sin errores. |

No se ejecutó browser.test.cjs ni una prueba nueva en teléfono para esta entrega:
no cambia la app o su interfaz. No se ejecutó trazado de cinco viviendas ni un
prototipo F2. Pruebas artificiales del recorder no acreditan métricas reales.
La inspección de traducciones de #1 tuvo un error al intentar interpretar NAMES_EN
como JSON (su literal usa sintaxis JavaScript); se corrigió comparando directamente
ese literal, que coincide con master. No fue un fallo de una suite de producto.
El cierre REST de #1 quedó bloqueado por Forbidden y se registra en el workflow.

## Reconciliación de cobertura: verificación ejecutada (30-09-2026)

Se conserva la exportación digital como mínimo obligatorio de la línea base y se
explicitan los mínimos obligatorios de tipos y mobiliario del conjunto de veinte.
No cambian la app, los criterios de aptitud ni la puerta de autorización F2.

| Comando real | Resultado de esta corrección |
| --- | --- |
| `python3 tests/f2_readiness.test.py` antes de corregir el calculador | 10 tests ejecutados; 2 subcasos fallaron al aceptar una línea base sin digital, también cuando solo un registro sintético aportaba ese tipo. Defecto reproducido. |
| `python3 tests/f2_readiness.test.py` tras la corrección | 12/12 aprobadas, 0,079 s. Cobertura de cada tipo, ambos estados de mobiliario en veinte, registros no aptos, mínimos de tamaño y ausencia de cuotas o combinaciones adicionales. |
| `python3 scripts/f2-readiness.py docs/qa/f2-evaluation.template.json` | Código 0; ambos conjuntos vacíos, métricas null, ambas condiciones de completitud false e implementation_authorized false. |
| `git diff --check` | Código 0, sin errores. |

Las suites de app/schema de la verificación inicial no se repitieron en esta
corrección: solo cambian protocolo, calculador offline y sus pruebas. Ninguna de
estas pruebas usa planos reales ni completa la evaluación pendiente. Juanma abrirá
la PR desde GitHub para revisión; esta corrección no crea ni fusiona una PR.

Publicación para revisión: rama `docs/f2-entry-evaluation` conservada en GitHub;
creación de PR por REST bloqueada con `Forbidden`. [Abrir PR hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...docs/f2-entry-evaluation?expand=1).
Detalle y commit de código en [workflow](../DEVELOPMENT-WORKFLOW.md). Sin merge ni
despliegue manual; no hay preview UI nueva requerida para esta preparación.

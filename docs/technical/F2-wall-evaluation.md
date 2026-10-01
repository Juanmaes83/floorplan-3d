# F2 — herramienta offline de evaluación geométrica

Estado: **infraestructura integrada; método métrico aprobado por Juanma el 30-09-2026; umbrales de producto pendientes**. F2 permanece
**prototipo experimental integrado, no validado**. No cambia ni afina el detector,
la app, FloorPlanProjectV1 o los criterios de producto. Sin nuevas dependencias.

Base remota verificada el 30-09-2026: `master` @
`fbb6448ee7931d6fa1a5e7ae486d4c368a921663`, coincide con la última referencia
comunicada. Contiene el merge PR #9 `10f7439b3fc86b0a0bd325d94531709d45cbcad4`.
Checkout inicial limpio en `feat/f2-local-wall-assist` @ `3e3e611`; se conservó
esa rama y se creó únicamente `feat/f2-evaluation-harness` desde master vigente.
Las PR abiertas #1/#2/#3 se comprobaron por listado público; ninguna es esta tarea.

## Datos encontrados y separación de responsabilidades

Inspección limitada a archivos del entorno de trabajo `/workspace`, sin acceder
carpetas privadas externas ni buscar viviendas en Internet: solo seis raster
sintéticos de tests y doce capturas del prototipo; **cero candidatos reales y cero
autorizaciones disponibles identificadas**. No acredita que Juanma carezca de
material fuera de este entorno. Ningún plano real se incorpora al repositorio.

`f2-readiness.py` sigue siendo el único registro/cálculo del inventario y de las
cinco sesiones manuales. Se reutilizan su parser estricto de claves JSON y su
comprobación de números finitos. Su código, plantilla y tests no se modifican.
Este nuevo comando compara geometría; no inventaría permisos, imágenes, mobiliario
ni métricas de sesiones. No cuenta sus casos como veinte autorizados y no abre
las puertas de readiness. No mezcla las cinco sesiones con la evaluación fija.

No compara tiempos, correcciones o errores manual/asistido: los campos no están
admitidos. Una comparación futura exigiría mismo plano, condiciones comparables,
registro de etapas y definición de tiempo iguales; requiere otra decisión revisada.

## Preparar la entrada local (versión 1)

Guardar JSON **fuera del repo** en la carpeta privada elegida por Juanma. Solo
se admiten estos campos exactos; claves desconocidas o repetidas se rechazan:

| Campo raíz | Obligatorio y significado |
| --- | --- |
| `record_version` | Entero `1`, versión del formato de evaluación (independiente del proyecto) |
| `dataset_id` | ID opaco `eval_NNN` de la revisión congelada del conjunto |
| `detector_commit` | SHA completo de cuarenta hexadecimales del detector probado; no `latest` |
| `units` | Constante `mm` |
| `coordinate_frame` | Constante `image-aligned-mm`; convenio detallado abajo |
| `data_kind` | `synthetic` o `real` para el registro completo; no mezclar ambos |
| `cases` | Lista no vacía de casos distintos; no filtrar fallos |

| Campo de cada caso | Obligatorio y significado |
| --- | --- |
| `id` | ID opaco `case_NNN`, único en el registro |
| `type` | `digital`, `scan` o `photo` |
| `analysis_status` | `ok` (ejecutado, también si no detectó nada) o `failed` |
| `reference_status` | `reviewed` (anotación manual revisada, también si no contiene muros) o `missing` |
| `predictions` | Segmentos crudos sugeridos por ese detector, sin selección ni correcciones humanas; `[]` cuando el análisis correcto no propone nada, `null` solo si falló |
| `references` | Segmentos de ejes de muros anotados/revisados manualmente; `[]` si la referencia revisada realmente no contiene muros; `null` si falta |

Cada segmento tiene solo `id:seg_NNN`, `start:{x,y}`, `end:{x,y}`. Coordenadas
enteras en mm, finitas, entre −1 000 000 y 1 000 000, extremos distintos.
IDs únicos dentro de cada lista; una predicción y referencia pueden tener el mismo
ID porque no supone correspondencia. No incluir confianza, nombres, rutas, EXIF,
URLs, imágenes, polígonos/estancias, proyectos ni permisos completos. La pertenencia
al conjunto y relación `case_NNN` ↔ `plan_NNN` del inventario se conservan en la
correspondencia **local privada**; no derivar IDs de direcciones u otros datos personales.
Usar el mismo `eval_NNN` que la revisión congelada de readiness; comprobar en privado
que los casos corresponden al conjunto completo, no solo a sus mejores resultados.
La CLI no comprueba identidad, existencia de planos ni permisos jurídicos.

### Sistema de coordenadas y revisión independiente

Ambas listas deben usar un marco común **alineado con los ejes del raster original**,
con unidad mm y origen arbitrario común. Si se parte de coordenadas de proyecto
F1b, deshacer **para ambas listas** el desplazamiento/giro de `placement` antes de
comparar, conservando las distancias en mm: rotación inversa y traslación inversa,
sin reescalar la geometría ni usar píxeles como mm. Para candidatos crudos en píxeles,
usar la escala congelada/revisada para convertirlos a mm en ese mismo marco.
Redondear al mm solo al escribir el registro, como el contrato existente.
No basta renombrar unidades ni se acepta `coordinate_frame:world`. El redondeo
de geometría ya transformada puede dejar un residuo oblicuo de 1 mm al invertir
un giro: este comparador exige paralelismo exacto y lo contará como no soportado.
Preferir candidatos crudos en el marco original y documentar ese residuo, sin
ajustar segmentos a la referencia para mejorar artificialmente resultados.

La normalización se prepara localmente; el comando no lee imágenes/proyectos ni
calibra, rota, afina o registra automáticamente predicciones contra la referencia.
No usar la geometría de referencia reservada para ajustar esa normalización o el
detector. Documentar en privado las referencias de escala y transformación
congeladas y las cotas independientes de validación. La herramienta presupone ese
marco consistente; no puede demostrarlo. Un giro de colocación de la imagen no
es por sí mismo una orientación que el detector no soporte: primero normalizar.

Conservar todas las sugerencias crudas antes de aceptar/corregir/rechazar en la UI.
El prototipo no persiste candidatos pendientes; este harness no añade exportación
ni instrumentación al detector. Captura/anotación local de esos segmentos sigue
siendo una preparación manual de evaluación. No convertir la geometría corregida
por la persona en predicciones crudas ni en verdad independiente.

Límites de formato/recursos del evaluador: 8 MiB por JSON, 100 casos y 200 segmentos
por lista/caso. Son límites de esta herramienta y evitan entradas descontroladas;
no presupuestos de producto ni afirmaciones de rendimiento móvil. No truncar casos
para caber: conservar el conjunto original y preparar lotes con revisiones/alcance
explícitos si fuera necesario. No sumar promedios de lotes como si fueran métricas
micro; para el conjunto de veinte habitual cabe un único registro.

## Regla métrica aprobada para el comparador (30-09-2026)

Versión reproducible de la regla: `axis-length-capacity-v1`. Se elige **longitud
cubierta**, no conteo de instancias de muro, para no penalizar cortar un mismo eje
en segmentos contiguos ni premiar duplicados. Es una decisión de esta implementación
para revisión humana; no es un umbral aprobado de calidad del producto.

1. Normalizar el sentido de cada segmento; separar horizontales y verticales.
   Los oblicuos se registran como orientación no soportada en este marco y reciben
   cero crédito, incluso si predicción y referencia coinciden. No se descartan:
   su longitud euclídea figura en denominadores globales y conteos de cobertura.
2. Para cada orientación, dividir su eje en intervalos atómicos usando **todos**
   los extremos de predicciones y referencias. Solo cuentan solapes proyectados
   de longitud positiva; compartir un punto o cruzarse perpendicularmente no cuenta.
3. En cada intervalo, permitir un par solo si ambos segmentos lo cubren entero,
   tienen igual orientación y distancia transversal ≤ `--tolerance-mm`.
   Tolerancia finita ≥0 obligatoria, sin valor por defecto; cero significa coincidencia
   transversal exacta. No alargar extremos por tolerancia ni aplicar tolerancia angular.
4. Resolver un emparejamiento bipartito de cardinalidad máxima por intervalo,
   capacidad uno por segmento en cada lado. Orden de predicciones por ID; vecinos
   por distancia transversal y después ID; caminos aumentantes BFS deterministas.
   No se optimiza globalmente la distancia ni se infiere identidad de muro.
   Una línea puede cubrir varias anotaciones contiguas; cada mm se asigna una vez.
5. Sumar la longitud de intervalos emparejados `M`, todas las longitudes sugeridas
   `P` y todas las de referencia `R`. **Precisión por longitud = M/P**;
   **exhaustividad global por longitud = M/R**. Longitud falsa/extra = `P−M`;
   longitud de referencia omitida = `R−M`. Denominador cero produce `null`, no 1.

`recall_length_supported_axes` usa solo longitud de referencias horizontal/vertical
como denominador y se publica junto al global; no permite ocultar las diagonales.
No se interpreta ninguna métrica como confianza de cada candidato.

### Duplicados, solapes y parciales

Predicciones duplicadas/superpuestas mantienen toda su longitud en `P`, pero no
pueden reutilizar la misma capacidad de referencia: dos duplicados de 100 mm
frente a una referencia de 100 mm dan M=100, P=200, precisión=0,5 y exhaustividad=1.
Solapes colineales de longitud positiva en las **referencias** (también oblicuas)
son error de anotación: revisar y unir/dividir en local; el comando rechaza el
registro completo. Referencias contiguas y muros paralelos distintos son válidos.

Una propuesta de 40 mm frente a una referencia de 100 mm da precisión=1 y
exhaustividad=0,4. Una propuesta de 200 mm que cubre esa referencia da precisión=0,5
y exhaustividad=1. Contadores por lado distinguen segmentos totalmente cubiertos,
parcialmente cubiertos, sin correspondencia y de orientación no soportada; los
últimos son un subconjunto de los no emparejados. Estos conteos no son TP/FP/FN
por instancia: cambiar la segmentación cambia conteos, pero no longitud cubierta.

Muros paralelos dentro de tolerancia generan ambigüedad: el máximo emparejamiento
puede cubrir más pares que elegir el primero de forma voraz. Esto es reproducible
pero no demuestra identidad arquitectónica; revisar la tolerancia y distribución
por caso. Nunca se propone un valor de tolerancia para planos reales por defecto.

## Fallos, agregados y privacidad de salida

El informe incluye cada ID/tipo opaco, fallos de análisis/referencia, conteos,
longitudes, denominadores y métricas; no imprime extremos ni IDs de segmentos.
Agregado **micro**: suma M/P/R de casos con referencia revisada, luego divide;
no promedia porcentajes de planos. Revisar siempre cada caso: un plano largo
puede dominar el agregado. No hay umbral de aceptación ni estado automático de aprobado.

- Análisis fallido con referencia revisada: cero crédito y toda la longitud de
  referencia en el denominador; precisión `null` al no haber predicciones disponibles.
- Referencia ausente: métricas del caso `null`, no se puede inventar su denominador;
  se declara cuántos casos quedan sin puntuar y longitud de predicciones no puntuadas.
- Ambos fallos: ambos códigos explícitos; ninguna falsa métrica cero/uno.
- Referencia revisada vacía: permite evaluar falsos positivos, precisión cero
  si hay predicciones; exhaustividad `null`. Ambos lados vacíos: ambas `null`.
- Datos inválidos: salida de error código 2, **sin ningún resumen parcial**.
  JSON con claves repetidas se rechaza antes de sobrescribirlas, incluso anidadas.

`all_cases_have_reviewed_reference`, `all_analyses_succeeded`, conteos de fallos y
casos incluidos/excluidos se publican junto al agregado. `f2_validated:false` y
`rules_status:metric_method_approved_thresholds_pending` son permanentes. El registro completo se
valida antes de calcular; ningún agregado convierte un caso fallido en éxito.

Se lee solo el JSON local; cálculo sin sockets, red, imágenes ni servicios externos.
La salida estándar es un resumen JSON; los errores y errores de argumentos no
repiten valores, rutas privadas ni contenido de registros. Revisar **también el
resumen** antes de compartirlo: IDs y longitudes agregadas siguen siendo datos de
una evaluación privada. Solo los fixtures sintéticos y sus resultados de test se
publican; nunca subir el JSON geométrico real, anotaciones o autorizaciones.

## Ejecución reproducible

Desde la raíz, con Python 3 estándar; no requiere instalar paquetes nuevos:

```bash
# Demostración SINTÉTICA: 5 mm es parámetro elegido para estos tests, no para producto.
python3 scripts/f2-wall-evaluation.py tests/fixtures/f2-wall-evaluation.synthetic.json --tolerance-mm 5
python3 tests/f2_wall_evaluation.test.py
```

Para datos reales: preparar archivo local privado con los campos anteriores;
ejecutar el mismo comando con su ruta y una tolerancia **explícitamente elegida
para esa evaluación**, documentada antes de comparar, redirigiendo stdout a otro
archivo privado. No pegar comandos que contengan rutas privadas en la PR.
No elegir tolerancia mirando solo resultados favorables ni convertirla en
umbral aprobado de producto. Congelar revisión del conjunto y SHA del detector.

El fixture de tres casos se creó proceduralmente para tests, sin raster: exacto,
parcial desplazado y duplicado. Con 5 mm: M=250, P=350, R=300; precisión=5/7,
exhaustividad=5/6. Son aritmética de un fixture, **no precisión real del prototipo**.

## Pruebas, alcance de revisión y publicación

Resultados ejecutados y publicación se registran al finalizar. No cambia interfaz:
**no corresponde preview visual**. Un deployment Vercel READY no verifica esta CLI.
La revisión debe inspeccionar reglas, formato, código, resultados por caso y pruebas.
No se fusiona, no se hace despliegue manual y F2 sigue sin validar.

### Resultados ejecutados el 30-09-2026

Entorno: Python 3 estándar y Node v24.19.0, Linux x64 de este workspace cloud.

| Comando real | Resultado final |
| --- | --- |
| `python3 tests/f2_wall_evaluation.test.py` | 16/16 aprobadas, 0,460 s: exacto/invertido/vertical, listas vacías, parciales, tolerancia, duplicados/solapes, fragmentación, ambigüedad de emparejamiento, diagonales, fallos, micro, inválidos, privacidad, no red/IO de imágenes. |
| `python3 tests/f2_readiness.test.py` | 12/12 aprobadas, 0,076 s; mínimos de cinco/veinte preservados. |
| `python3 tests/schema.test.py` | 10/10 aprobadas, 0,139 s; contrato y copia embebida intactos. |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/wall_assist.test.cjs` | 67/67 aprobadas, 0 fallos/cancelaciones/omisiones, 0,265 s. |
| `python3 scripts/f2-wall-evaluation.py tests/fixtures/f2-wall-evaluation.synthetic.json --tolerance-mm 5` | Código 0: tres casos sintéticos; M=250, P=350, R=300; precisión 5/7, exhaustividad 5/6; f2_validated false. |
| `python3 scripts/f2-readiness.py docs/qa/f2-evaluation.template.json` | Código 0: cero sesiones/planos aptos, métricas null y puerta sin autorizar. |
| `ast.parse` de `scripts/f2-wall-evaluation.py` y `tests/f2_wall_evaluation.test.py` | Sintaxis válida en ambos archivos; sin generar bytecode en el repo. |
| `git diff --check` | Código 0, sin errores. |
| `git diff --exit-code -- docs/qa/f2-evaluation.template.json scripts/f2-readiness.py tests/f2_readiness.test.py index.html js/ docs/contracts/` | Código 0: esos archivos permanecen intactos. |

Todos los comandos de pruebas ejecutados pasaron; no se ocultaron fallos. No se
ejecutó `tests/browser.test.cjs`, QA visual, nuevo render 3D ni pruebas físicas:
no cambia la app. No se ejecutó la suite completa de navegador ni se afirma
«suite completa». No hay mediciones de precisión con planos reales, comparación
de tiempos manual/asistido, validación humana de métricas ni umbrales aprobados.

### Archivos y revisión

- `scripts/f2-wall-evaluation.py`: parser estricto compartido, validación del
  registro, asignación por intervalos, métricas por caso/micro y CLI privada.
- `tests/f2_wall_evaluation.test.py`: dieciséis pruebas de geometría, fallos,
  privacidad y ausencia de red/lectura de imágenes durante el cálculo.
- `tests/fixtures/f2-wall-evaluation.synthetic.json` y su README: ejemplo
  procedural calculable a mano, marcado como sintético.
- Este informe y `docs/qa/F2-entry-protocol.md`: regla aprobada, marco común,
  preparación privada, comandos/resultados y limitaciones.
- `docs/ROADMAP.md`: solo infraestructura en preparación/revisión; F2 no validada.

Decisión de Juanma (30-09-2026): acepta esta **definición de métrica**, incluida la regla de que las diagonales no reciben crédito en este comparador de ejes y permanecen en los denominadores globales. Esta aprobación fija el método del comparador; no fija una tolerancia universal ni umbrales de aceptación del producto. Si se ejecuta una evaluación real, Juanma prepara/revisa en privado las referencias, registra las cinco sesiones separadas y congela los veinte casos con sus fallos, SHA del detector y tolerancia explícita. No se publican sus datos geométricos.

### Publicación y estado de revisión (actualizado 30-09-2026)

La rama está publicada en [feat/f2-evaluation-harness](https://github.com/Juanmaes83/floorplan-3d/tree/feat/f2-evaluation-harness). La [PR #10](https://github.com/Juanmaes83/floorplan-3d/pull/10) se aprobó y fusionó en `master` mediante merge commit `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`. La implementación inicial fue `759ca53a4afd32c1f89ae1cbffa34a4c64eb29f9`; la aprobación métrica y las conciliaciones documentales quedaron registradas en la misma PR.

Vercel confirmó como **READY** el deployment de la rama para el SHA `43af835776b3067013a04853269fe89189994dba`:
[preview](https://floorplan-3d-git-feat-f2-evalu-2df055-juanma-espinosas-projects.vercel.app/) ·
[inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/9UypwsaXVTp1xPyqKLwoDzPFEK8e).
Esa verificación precede al commit documental que actualiza este informe; no se cambió código de interfaz.

No hay cambios de interfaz; por tanto, la preview no sustituye las pruebas de la CLI ni requiere revisión visual de la app. El deployment es automático desde Git; no se hizo despliegue manual. El deployment citado corresponde al SHA de rama antes del último commit documental; el merge no modifica código de UI.
La herramienta calcula geometría anónima local; no incluye imágenes ni permisos. Juanma aprobó el método métrico el 30-09-2026, incluida la ausencia de crédito para diagonales en este comparador; estas líneas siguen dentro de los denominadores globales. La aprobación del método o de la implementación no valida F2 ni fija umbrales de calidad del producto. Los datos reales no bloquean continuar el desarrollo del prototipo y solo se necesitan para la validación empírica. Conservar imágenes, referencias y registros completos fuera de GitHub/Vercel.

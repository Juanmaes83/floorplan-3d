# MCP local — diagnóstico y medidas (segundo corte de Etapa 1)

Base apilada: PR #40, `bf5fa9f4ea9f85d33e371c2220e6381dc61d2129`. Se reutilizan su lector y sus relaciones espaciales; no se cambia `FloorPlanProjectV1` ni el editor.

## Diagnóstico controlado

`diagnose_project({})` lee el mismo archivo seleccionado al arrancar, con los mismos controles de ruta, symlink, archivo normal, 15 MiB y SHA-256. El servidor puede arrancar si el archivo tiene JSON mal formado o no cumple el contrato, para poder explicar el bloqueo. En ese caso `get_project_summary`, `list_project_elements`, `get_project_element`, `measure_elements` y `review_layout` siguen rechazándolo. Si el archivo o la ruta no se pueden leer de forma segura, también se rechaza el arranque o la llamada: el diagnóstico no evita esos controles.

El validador canónico `js/project-core.js` entrega **solo el primer error**. `findings[0]` lo presenta con `severity:error`, `category` (`format`, `contract`, `reference` o `geometry`), `rule`, `path`, ID/tipo cuando el path los identifica y mensaje comprobable. Las referencias rotas son errores del contrato, no una comprobación paralela. `checks` marca `contract:failed_first_error`, `references:not_exhaustive`, `geometry:not_run` y `spatialRelations:not_run`; no se simula una lista exhaustiva. Corrige y vuelve a consultar para descubrir errores posteriores.

Cuando el contrato pasa, `checks` indica validación y referencias aprobadas. Se recogen independientemente: escala `estimated` o `pending` como `info`, procedencia sin revisar o sugerida como `info`, puerta sin `swing` como `incomplete`, y relaciones de #40 `ambiguous` o `unattributed` con IDs y razón geométrica. La ausencia de estancia calculable no infringe el contrato ni una norma. La proyección espacial que no pueda calcularse da `status:partial` y explica qué verificación no se completó. Máximo 100 hallazgos visibles, con `totalFindings` y `truncated` explícitos; no se incluyen imágenes ni JSON completo.

Ejemplo resumido de un contrato roto:

```json
{"status":"blocked","valid":false,"findings":[{"severity":"error","category":"reference","rule":"FloorPlanProjectV1","path":"/openings/opn_shared-door/wallId","elementType":"openings","elementId":"opn_shared-door","evidence":"missing walls reference wal_missing"}],"checks":{"contract":"failed_first_error","references":"not_exhaustive","geometry":"not_run","spatialRelations":"not_run"}}
```

La respuesta real añade `snapshot.sha256`, `sizeBytes` y `modifiedAt`, sin ruta local.

## Medida explícita en planta

`measure_elements({"idA":"obj_rect","idB":"obj_next","mode":"reference_points"})` compara los centros guardados de muebles o los puntos medios de ejes de muros/huecos. Las estancias no tienen un punto de referencia inequívoco y dan error en este modo. En el fixture, esos centros están en `(1000,1000)` y `(5000,1000)` mm: **4000 mm**.

`measure_elements({"idA":"obj_rect","idB":"obj_next","mode":"regions"})` compara regiones cerradas 2D: huella girada de mueble, banda de eje y grosor de muro, subtramo del hueco o polígono de estancia. Devuelve la distancia euclídea mínima y `pointA`/`pointB`; da **0 mm** si las regiones se tocan o solapan. En el mismo fixture: huellas a **3450 mm**, con puntos `(1300,750)` y `(4750,750)` mm. Un mueble girado frente a una banda vertical de muro tiene **561.091 mm** de separación según su huella, no su caja sin girar. Se usa EPS numérico de `1e-7` en coordenadas y la salida se redondea a `0.001 mm`; no se aplica umbral de diseño.

Ambos modos devuelven `snapshot.sha256`, `units:mm`, `plane:2d`, `scaleConfidence`, método, geometría de cada ID y `relationStatus`. Si alguna relación por estancia es `ambiguous` o `unattributed`, `status:spatial_relation_uncertain` conserva la medida geométrica y comunica la incertidumbre de atribución. ID ausente, mismo ID, modo no admitido, estancia en `reference_points` o geometría degenerada producen error explícito. Un proyecto inválido se rechaza antes de medir.

Estas cifras son distancias en el plano del JSON. `scaleConfidence:estimated` o `pending` impide tratarlas como dimensiones físicas confirmadas. Ni la distancia entre centros ni el mínimo entre regiones se declara holgura transitable: no se comprueban muro interpuesto, huecos utilizables, empotramiento, altura, recorridos, accesibilidad o normas.

## Tercer corte pendiente

Revisar holguras entre muebles y obstáculos con umbral explícito aportado por quien consulta. Para cada par, modelar muros activos y sus huecos reales, extremos de muro y conectividad entre estancias; separar empotramientos y solapes intencionales de pasos utilizables; propagar escala y evidencia parcial. Probar puertas, muros que separan el par, huecos fuera del segmento mínimo, estancias cóncavas y cambios de ruta. No asumir que una distancia corta entre huellas define por sí sola un paso libre.

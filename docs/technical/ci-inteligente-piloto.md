# CI inteligente. Primer corte de deduplicación

La primera activación retira una segunda ejecución de `tests/photo-reform-provider.test.cjs` dentro de `CAT-IA V1 / pure`. La primera sigue ejecutando sus siete casos con el mismo comando de Node, en el mismo job, sobre el mismo SHA. Si esa ejecución falla, el job falla. El repositorio conserva las pruebas, los jobs, los disparadores y las matrices. El observador sigue publicando impacto y medición de Actions, y su gate sigue acreditando solo el informe y la validación universal.

## Evidencia y alcance

En las cuatro ejecuciones siguientes el log de `pure` muestra los mismos siete casos del proveedor en los dos pasos. El test solo usa un servidor HTTP local de prueba y módulos del repositorio. Node 22.13.0 aísla cada archivo en un proceso. Ambos pasos usan `--test-concurrency=1` y carecen de configuración de entorno propia. El paso anterior ejecuta el archivo completo junto a las pruebas de API y del núcleo visual. [Modelo de ejecución de Node 22.13.0](https://nodejs.org/download/release/v22.13.0/docs/api/test.html#test-runner-execution-model).

| Origen | SHA probado | Evidencia de GitHub Actions |
| --- | --- | --- |
| #255 | `1565830` | [CAT-IA / pure](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44280763937/job/134720512271) |
| #257 | `7dd0b45` | [CAT-IA / pure](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44282510243/job/134726602415) |
| #258 | `56e6777` | [CAT-IA / pure](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44283329667/job/134729485664) |
| #259, ejecución histórica | `116e2f0` | [CAT-IA / pure](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44286701359/job/134741104161) |

El verificador existente `prove-workflows.py` registra una única excepción en `workflow-preservation.json`. Solo la acepta si detecta las dos invocaciones con el mismo comando, Node fijado a 22.13.0, la ejecución original anterior y una diferencia exacta de un único argumento en el segundo paso. Rechaza diferencias de entorno, cambios adicionales y la desaparición de la ejecución original. El inventario y el selector conservador mantienen sus reglas.

La comparación entre runners, eventos, ramas, matrices o suites de navegador requiere sus propias evidencias. Un resultado verde en otro SHA, una cancelación, una coincidencia de nombre o un ahorro proyectado quedan fuera del piloto. Asset Lab y Studio Presentation conservan todas sus ejecuciones.

## Medición

La comparación ejecutó los dos comandos YAML del paso que cambia, alternando el orden antes/después en siete parejas sobre el mismo contenedor Linux x64, con Node 22.13.0, Python 3 y la red externa desactivada. En cada pareja se comparó el conjunto de títulos de los casos TAP incluyendo el paso conservado de `photo-reform/1`. El conjunto quedó en 120 casos únicos antes y después. El paso que cambia pasó de 99 a 92 casos. Los siete retirados estaban en los 28 casos del paso conservado. Todas las ejecuciones terminaron con código 0.

| Pareja | Original (ms) | Piloto (ms) | Diferencia (ms) |
| --- | ---: | ---: | ---: |
| 1 | 3757 | 1956 | 1801 |
| 2 | 3584 | 1915 | 1669 |
| 3 | 3554 | 1919 | 1635 |
| 4 | 3637 | 1921 | 1716 |
| 5 | 3631 | 1931 | 1700 |
| 6 | 3594 | 1924 | 1671 |
| 7 | 3541 | 1924 | 1616 |

La mediana del ahorro observado fue **1,671 s por ejecución del paso**. Es una diferencia de tiempo transcurrido en una comparación controlada. Se eliminan siete ejecuciones duplicadas y cero jobs. El ahorro facturado, el tiempo de cola y la duración global de una PR quedan sin atribuir. Usar [la medición existente](ci-inteligente.md#evidencia-y-medición) y el mismo SHA al registrar el resultado remoto.

## Aceptación y rollback

- **GO técnico local** para la única deduplicación descrita. El GO remoto requiere que `CAT-IA V1 / pure` termine en verde en el SHA del corte, que el log muestre los siete casos solo en el paso conservado y que el artefacto del observador registre exactamente una duplicidad certificada.
- **NO-GO** para ampliar omisiones a otros pasos, cambiar el gate o cancelar verificaciones selectivamente. Antes de ampliar, acreditar equivalencia por comando, SHA, dependencias, entorno y variante con evidencia original explícita.
- Para volver a la doble ejecución, revertir el commit del piloto. El rollback restaura el argumento repetido y el comportamiento anterior del verificador. Los workflows funcionales, las protecciones administrativas y Production mantienen su proceso de control.

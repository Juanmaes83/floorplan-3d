# CI inteligente — observación conectada

Este corte conecta el selector con GitHub Actions; **no habilita omisiones**. Los 36 workflows originales conservan jobs, comandos, aserciones, entornos, timeouts y activaciones anteriores, salvo el fallback explícito al SHA de dispatch. Se añade ejecución manual a los que no la tenían. Un workflow nuevo ejecuta validación universal, construye el inventario de base/candidato, observa el impacto, publica cobertura y tiempos reales, y mantiene un gate estable. No se afirma ahorro: trabajos evitados y minutos ahorrados son cero durante observación.

## Autoridades y límites de la selección

`inventory.py` lee objetos Git de ambos SHA, nunca ejecuta código de la base. Expande referencias y globs de tests en los workflows y el manifiesto de regresión, conserva los jobs completos (comandos, matrices y entorno declarado), resuelve literales locales y combina dependencias de ambas versiones para eliminaciones y renombrados.

Las suites de navegador dependen conservadoramente de **todo el runtime**: las dependencias UMD, assets y carga dinámica no se suponen independientes. Los lectores dinámicos de `docs/` dependen de todos los documentos. Esa sobreaproximación puede seleccionar más trabajo; no justifica una futura omisión sin revisión. Un test sin propietario fuerza regresión integral. Documentación consumida por pruebas no queda exenta por su extensión. Los cambios desconocidos, seguridad, esquemas, contratos, configuración, motores core y selector fuerzan nivel 3.

La cobertura JSON identifica cada test, sus dependencias y workflows. La matriz Markdown resume los propietarios. Las coincidencias textuales no certifican que una rama condicional de un test haya sido ejecutada. La observación no cambia los filtros de ruta existentes: su propuesta de cobertura se compara con ellos antes de cualquier activación selectiva. Si encuentra cobertura insuficiente, el gate falla o mantiene selección integral; no inventa un PASS.

| Área | Autoridades y dependencias | Respuesta conservadora |
|---|---|---|
| Proyecto/geometría | project-core, building-core, esquemas, index.html | Integral |
| Seguridad/entregas | api/, contratos, docs/security | Integral |
| Presupuesto/catálogo | budget-core, adapters, persistencia, CAT-04, Asistente | Core integral; UI por cierre transitivo, incluido navegador |
| Home/estilos | welcome, home-demos, CSS y runtime UMD | Navegadores consumidores; lecturas dinámicas no resueltas fuerzan integral |
| 3D/Evolución/presentación | runtime compartido, assets, render y fixtures | Overaproximación de navegador; no se deduplican entornos distintos |
| Documentación | consumidores literales y dinámicos de docs | Solo nivel 1 si consta independencia; si hay consumidor se selecciona o cae a integral |
| CI/dependencias/desconocidos | scripts/ci, .github, locks, entradas sin grafo | Integral |

Estados de evidencia: `EXECUTED_PASS`, `EXECUTED_FAIL`, `REUSED_VERIFIED`, `NOT_APPLICABLE`, `PENDING`, `CANCELLED`, `UNKNOWN`. El plan usa PENDING y NOT_APPLICABLE; una conclusión verde de workflow no se convierte automáticamente en EXECUTED_PASS de cada test. `compare.cjs` publica workflows previstos ausentes y ejecuciones pendientes/fallidas, y mantiene `coverageCertified:false` hasta acreditar ejecución por suite. Las evidencias reutilizadas solo pasan el verificador explícito y mantienen su SHA original.

## Tres niveles

1. Universal: sintaxis de selector, pruebas propias, contratos esenciales de proyecto/presupuesto/seguridad, inventario y guarda de cobertura.
2. Impacto conservador: cierre transitivo sobre unión de grafos base/candidato; resultado por test `PENDING` o `NOT_APPLICABLE`. La propuesta no omite trabajo todavía.
3. Integral: autoridades críticas, desconocidos, selector/CI y ejecución manual/periódica. El dispatch completo usa los workflows originales, sin cambiar sus pasos. La ronda semanal es un schedule de **GitHub Actions**, no Cron de Production, y solo se activa al integrar el workflow en la rama por defecto.

`integration-gate` acredita la validación universal y la generación correcta del informe. **No sustituye los checks funcionales originales ni convierte sus fallos en éxito**; hasta aprobar selección y gobernanza, deben revisarse todos los checks pertinentes. No se modifican protecciones administrativas.

## Evidencia y medición

`measure.cjs owner/repo SHA output.json` consulta paginado por un SHA exacto: jobs, estados, tiempos en cola, duración y suma de minutos de jobs completados. No mezcla candidatos ni presenta minutos como facturación. Las ejecuciones pendientes no tienen duración final. El campo de coste queda `null` sin datos de facturación. El total de duraciones solapadas no es el tiempo de PR ni el camino crítico.

`representative.cjs` produce casos de documentación, estilos, módulo, core, seguridad, contratos, desconocido, simultáneo, renombrado, selector y workflow. Los 22 casos originales del prototipo y las pruebas nuevas comprueban negativos. `prove-workflows.py` acredita que los 36 contratos de ejecución originales permanecen iguales en este corte.

`evidence.cjs` solo admite evidencia original explícita con `EXECUTED_PASS`, SHA, URL de artefacto, fecha, comando, navegador, huellas de archivos/dependencias, configuración y entorno idénticos. Devuelve `REUSED_VERIFIED`, nunca `EXECUTED_PASS`. Diferencias → `PENDING`; original incompleto, cancelado o fallido → `UNKNOWN`. La adquisición del artefacto debe ser de fuente confiable: el validador no autentica JSON arbitrario. Este corte no reutiliza resultados automáticamente.

## Activación posterior y rollback

Antes de omitir jobs: contrastar decisiones con resultados reales de varios candidatos representativos; resolver todos los propietarios y dependencias ambiguas; acreditar que cada suite obligatoria se ejecuta o posee equivalencia completa; comparar entornos y parámetros de aparentes duplicidades; revisar el gate estable y obtener aceptación de la política. No basta que los 22 tests del prototipo pasen.

El modo de observación es la configuración efectiva y no contiene interruptor oculto para activar omisiones. La omisión necesitará otro cambio revisable. Volver atrás consiste en revertir este corte: los workflows originales siguen funcionando y no se elimina ninguna prueba. Desactivar el nuevo schedule en GitHub también es reversible; no toca aplicación, Vercel, secretos ni datos.

## Reproducción local

```powershell
node --test scripts/ci/*.test.cjs
python scripts/ci/inventory.py BASE_SHA > base.json
python scripts/ci/inventory.py HEAD_SHA > head.json
python scripts/ci/check-inventory.py head.json
node scripts/ci/observe.cjs base.json head.json BASE_SHA HEAD_SHA plan.json
node scripts/ci/representative.cjs base.json head.json cases.json
python scripts/ci/prove-workflows.py BASE_SHA HEAD_SHA preservation.json
node scripts/ci/measure.cjs Juanmaes83/floorplan-3d HEAD_SHA measurement.json
```

Python requiere PyYAML 6.0.3. Los resultados remotos correspondientes al SHA exacto se adjuntan como `ci-impact-SHA`; las pruebas locales no se etiquetan como CI.

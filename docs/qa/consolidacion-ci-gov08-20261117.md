# Consolidación de CI, gobierno y GOV-08 S3 · 17/11/2026

## Integración autorizada

| PR | Candidato validado | Comprobaciones GitHub | Merge |
|---|---|---|---|
| [#245](https://github.com/Juanmaes83/floorplan-3d/pull/245) | `bcd9692bd6b8d89adeec4246a145230f55358b3e` | 16 correctas | `403e6b74c95a81e23c17badb276abeca9f8c3fd1` |
| [#243](https://github.com/Juanmaes83/floorplan-3d/pull/243) | `47cfcd1f2e630929f4b353f5242eb81e5f446503` | 92 correctas | `f0ca0b9e58f1d7f6a942e57f9404788b8df6a086` |
| [#244](https://github.com/Juanmaes83/floorplan-3d/pull/244) | `28a01b0b0195593d966729d385ab97d32bc16c6c` | 93 correctas | `8525025a1470d48d52d8e365070e5a0acf116134` |

No se cancelaron comprobaciones activas ni se eliminaron pruebas o aserciones. Las ramas se conservaron. El árbol integrado de #244 es `5441db02b71407ab03731216054165eee24940c0`, idéntico al del candidato validado. No fue necesario modificar ese candidato al fusionar #243.

## Causas y correcciones

Los fallos históricos de render se debían a presupuestos de tiempo en ejecución por CPU. El reparto conserva exactamente 35 archivos históricos y la partición bloqueante. #245 usa ocho grupos, `RENDER_TIME_SCALE=3` y 1100 × escala segundos por archivo. Los cortes anteriores por trabajo o archivo conservan su clasificación y logs. La ronda aprobada tiene 242 pruebas históricas correctas en esos 35 archivos.

Codex añadió en #244 el rechazo de una respuesta de listado sin `hasMore` booleano. El caso nuevo fallaba con respuesta 200 antes de corregirlo. Ahora una limpieza confirmada responde 409 y envía cero peticiones de borrado si la paginación no acredita su final. La prueba cubre seis valores ausentes o malformados. Validación dirigida local con 56/56 pruebas de servidor y 4/4 de navegador S3.

## Validación real aislada

Preview `dpl_BLpr8QmGMd6mUxn1Wfaf5cCmLkep`, READY sobre el candidato `28a01b0`. Blob exclusivo `rubik-s3-validation-20261117`, limitado mediante variables a Preview de la rama S3. Se verificaron su host, listado completo y estado vacío antes de escribir. La variable compartida de Production conservó ID, ámbitos, referencia de almacén y fecha de modificación. No se leyó su valor ni se usó su almacenamiento para pruebas.

El protocolo original `scripts/qa/gov08-s3-preview-validation.cjs` pasó **30/30**. Incluyó publicación a siete días, retirada exacta, página/vídeo/visita con una misma identidad y fecha corta, cierre 410 al caducar, simulación sin cambios, borrado exacto de los tres archivos, rechazo 401/401/403 y UI en 1440×900 y 390×844. Se verificó el límite conocido del acceso directo a Blob público y la retirada posterior con tolerancia de caché.

Una prueba adicional pasó **7/7** con tres publicaciones sintéticas, vigente, caducada e histórica. La simulación seleccionó solo la caducada y conservó exactamente el conjunto de archivos. La limpieza real eliminó exclusivamente ese archivo. Vigente e histórica conservaron respuesta 200. La retirada final afectó solo a las URLs creadas por la prueba y dejó el almacén vacío.

Se revocó el acceso temporal compartido al Preview y se eliminaron los archivos locales de credenciales temporales. El Blob de pruebas quedó vacío. No hubo gasto de IA ni operaciones sobre publicaciones de Production. Las evidencias originales recuperadas están versionadas en [evidencias-s3-2026-11-17](evidencias-s3-2026-11-17/result.json). La revocación del bypass se comunicó en PROGRESS.md; los dos archivos privados locales ya no existen, verificado en esta continuación. No se atribuye a esta sesión la revocación ni se confunde con la revocación de las variables de rama, cuya permanencia se comunica históricamente.

## CI y despliegues

- [CI de consolidación #245](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44092050036).
- [CI de consolidación #243](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44105306580).
- [CI de consolidación #244](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44105767942).
- Production automático READY del código consolidado en `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`, SHA `8525025`.
- Continuación autorizada: se promovió el deployment READY de `8525025` y la API del alias confirmó `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`. El deployment anterior se conserva.

El commit posterior de cierre actualiza únicamente esta acta y los documentos de gobierno. La validación funcional corresponde al árbol de código acreditado anterior. Las comprobaciones automáticas que dispare ese cierre conservan su resultado propio.

## Límites y continuidad

Las corridas locales ampliadas en Windows tuvieron fallos de entorno, recursos omitidos por sparse-checkout, diferencias CRLF y Redis ausente. No se presentan como una suite completa aprobada. Los logs se preservaron y las suites dirigidas y gates remotos pertinentes terminaron correctos.

Persisten los límites aprobados de Blob público, S4/S5 y GOV-06a. La aprobación de una ronda de CI no equivale a una certificación universal de ausencia de regresiones. No se detectaron regresiones nuevas en los gates de integración ejecutados.

La auditoría posterior de CI inteligente se prepara en un laboratorio separado. No cambia estos HEAD validados ni las aprobaciones históricas. Las futuras selecciones requieren cobertura de dependencias, evidencia compatible y fallback conservador.

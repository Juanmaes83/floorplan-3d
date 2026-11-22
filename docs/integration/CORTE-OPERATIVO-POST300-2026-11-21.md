# RUBIK SOTA — Auditoría operativa posterior a #300
**Corte:** 21/11/2026, consulta GitHub + documentación + Vercel posterior al merge de #300. **Repositorio:** `Juanmaes83/floorplan-3d`. **Documento:** propuesta en la PR documental #305, sin fusión ni despliegue de código. Esta fotografía no es monitorización continua.

## 1. Estado factual contrastado
- `master@414e53acf302c434afb85cf86434382b81eb7b0e` incorpora la localización #300, tras #306 Blender. [Commit](https://github.com/Juanmaes83/floorplan-3d/commit/414e53acf302c434afb85cf86434382b81eb7b0e).
- Vercel: deployment `dpl_H44PTGMbkoJGsjgnJ2Z59gMUBkRa`, target `production`, `READY`, SHA Git `414e53acf302c434afb85cf86434382b81eb7b0e`. [Inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/H44PTGMbkoJGsjgnJ2Z59gMUBkRa). READY no equivale a smoke funcional ni a verificación de recuperación de datos. Alias Alpha/Demo no revalidados en este corte.
- [#306](https://github.com/Juanmaes83/floorplan-3d/pull/306) Blender: fusionada; revisión de kit, renders y ZIP comunicada por Codex, sin ejecución independiente aquí. [#300](https://github.com/Juanmaes83/floorplan-3d/pull/300) ES/EN/ZH: fusionada, aceptación visual comunicada por propietario; PREVIEW y CI originales del HEAD `5ed0d9fd` acreditadas en GitHub. En la consulta posterior de CI de `master@414e53ac`: 6 `success`, 1 `in_progress`, 1 `skipped`; no declarar finalizada la CI posfusión hasta que terminen esos tres.
- Se conservan integraciones ya comprobadas: E3 [#299](https://github.com/Juanmaes83/floorplan-3d/pull/299); M05 [#303](https://github.com/Juanmaes83/floorplan-3d/pull/303)/[#304](https://github.com/Juanmaes83/floorplan-3d/pull/304); M08 [#308](https://github.com/Juanmaes83/floorplan-3d/pull/308); R02-A [#298](https://github.com/Juanmaes83/floorplan-3d/pull/298); R03 [#297](https://github.com/Juanmaes83/floorplan-3d/pull/297); Simulator A/C/E [#295](https://github.com/Juanmaes83/floorplan-3d/pull/295), [#293](https://github.com/Juanmaes83/floorplan-3d/pull/293), [#291](https://github.com/Juanmaes83/floorplan-3d/pull/291). #296 absorbida por #298; #307 describe la incidencia original de M08, corregida posteriormente por #308.

## 2. Cola de cierre de producto, por árbol y restricciones
| Candidata | Evidencia directa del HEAD consultado | Base/delta y decisión pendiente |
| --- | --- | --- |
| M12 Cámara [#301](https://github.com/Juanmaes83/floorplan-3d/pull/301) | `0d80abe638fff4cbaf2a7830ecb6a4be2f0f68f8`: 91 success, 1 failure (`browser`), 1 skipped de 93 check-runs | 42 commits detrás del `master` consultado en comparación anterior; reconstruir la causa de bienvenida, reconciliar #300, aserciones sin rebaja, CI y aceptación por árbol nuevo. |
| M12 RoomPlan UX [#271](https://github.com/Juanmaes83/floorplan-3d/pull/271) | `60116e8bed31146dd764fd04937165d91be833e8`: 90 success, 2 failure (`scene` y `app-m2-gate-d`), 1 skipped | 109 commits detrás; base OP-04 está integrada vía #284; cierre solo de UX residual, resolver bytes GLB/siluetas sobre árbol efectivo. |
| M11 HERO [#309](https://github.com/Juanmaes83/floorplan-3d/pull/309) | `9e3e7c5c9fb29b80bc31b5771f961c45635c58d7`: 89 success, 9 failure, 0 in_progress, 1 skipped de 99 | 17 commits detrás; no fusionar. Evidencia del laboratorio no sustituye CI de esta PR. Integrar fuentes definitivas, regresiones, exportación C/alcance y firma/epílogo B antes de aceptación. |
| M01 A0 [#310](https://github.com/Juanmaes83/floorplan-3d/pull/310) | `2c7e77392a6137be2d1efb5674fd774385942e85`: 99 success, 1 skipped de 100 check-runs; autor comunicó 1522/1522 puras y 14/14 A0 Chromium | 17 commits detrás; **gate específico persistente de concurrencia WebKit y Firefox pendiente según la PR**. CI verde no sustituye R1-T02/T04, multitab, épocas y `onversionchange`. No fusionar/activar hasta cerrar el gate y comprobar nueva base. |
| Documentación [#305](https://github.com/Juanmaes83/floorplan-3d/pull/305) | 14 success, 1 skipped del HEAD anterior `da302617`; sólo Markdown | Actualizar a este corte en la misma rama. Solicitar revisión/fusión separada, no confundir con autorización de producto. |
| M07 F03 V2 laboratorio | [Fuente `ba4b138`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/ba4b138063f47f4095615a367bf8668cc67356d5): 15/15 según autor; ON/OFF y medios visuales, OFF por defecto | GO-LAB, no integración de producto; reconciliar con master, licencias, 42 MB escritorio/17 MB móvil estimados, rendimiento y validación visual/hardware. |
| Simulator B laboratorio | [`b201f7a`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/b201f7a73bf3421b73ac7c49b885cd8838323a9f): 11/11 combinado + accesibilidad según autor; procedencia de tres runs separada | No sustituye master ni CI de HERO; MP4 sin firma/epílogo y C sin exportación propia acreditada. |
| F0.2c/F0.3 [#274](https://github.com/Juanmaes83/floorplan-3d/pull/274), [#276](https://github.com/Juanmaes83/floorplan-3d/pull/276), [#277](https://github.com/Juanmaes83/floorplan-3d/pull/277), [#278](https://github.com/Juanmaes83/floorplan-3d/pull/278), [#279](https://github.com/Juanmaes83/floorplan-3d/pull/279) | Núcleo, backup, migración sintética y UX funcional en ramas; #279 reporta 47/47 de cadena en laboratorio | No combinar ni activar antes de A0 activo, convivencia R1 ≥7 días, escritores antiguos ausentes, copia completa, rollback probado y autorización separada. |

Los contadores son snapshots de checks, no porcentaje de progreso del módulo. Se distinguen pruebas del autor (H) de lecturas CI (CI). No atribuir causas raíces comunes a nueve fallos de HERO sin logs individuales.

## 3. Resumen de 14 módulos (unidades operativas, no 14 autorizaciones)
| Módulo | Capacidad existente | Residual de cierre |
| --- | --- | --- |
| M01 Continuidad | Biblioteca, F0.1, F0.2a/b | A0, convivencia, R1, F0.3, prueba de restauración, F1 separado |
| M02 Identidad y entrega | Publicación/revocación/limpieza | Identidad individual, aislamiento, cuotas, GOV-05 |
| M03 Blender | Kit, Cycles y entrega integrados | Hardware/calidad ampliada según contrato; no rehacer #306 |
| M04 Studio | E3 y accesos integrados | Entregables E4–E7/K11, consumidores reales, privacidad |
| M05 Asistente/MCP | #303/#304 integrados | Proveedor real, roles, gasto, autorización de escritura |
| M06 Imágenes IA | D1/flujos existentes | Presupuesto, resultados persistentes, proveedor y consentimiento |
| M07 Fidelidad | OP-11 lote 01; F03 V2 laboratorio | Integración, materiales, rendimiento y pruebas físicas |
| M08 Geometría | R02-A/R03, tabique #308 | OP-07 y consumidores v2, sin atribuir normativa |
| M09 Reconocimiento | Importación/corrección, R01 laboratorio | Corpus real, escala y precisión medidas |
| M10 Mobiliario | F3/R03 y OP-05 en laboratorio | GLB privados persistentes, licencias y referencias |
| M11 Presentación/vídeo | Simulator A/C/E y recorder existentes | HERO+B, D WebKit, F derechos, exportaciones genuinas |
| M12 Editor/UX | Home, ES/EN/ZH #300, OP-04 funcional | #301 cámara y #271 UX, hardware físico |
| M13 Presupuesto/obra | Medición y obra/4D, BC3 | Lector/exportación profesional, precios trazables |
| M14 Interoperabilidad | DXF e IFC de alcance limitado | Validación CAD/BIM externa y límites roundtrip |

El [maestro de 14 módulos](https://github.com/Juanmaes83/floorplan-3d/blob/3401038afdfa14f5150f737397d53733f1128f7f/docs/product/MAESTRO-OPERATIVO-14-MODULOS-DE-CIERRE.md) está en rama documental independiente; no afirmar que el archivo exista en `master`. Mantener 98 IDs, P1–P8, olas 0–5, 23 piedras SCULPT y seis Simulator como ejes trazables distintos.

## 4. Recuperación: código frente a datos de usuarios
- **Desarrollo:** GitHub contiene la fuente y la historia accesibles. No consta prueba de restauración integral desde backup independiente de repositorio, dependencias y configuración no secreta.
- **Datos de cliente:** `localStorage`/IndexedDB por origen no viven en GitHub; un ZIP o expediente ordinario no equivale a copia completa del estudio. F0.1 tiene exclusiones declaradas; fotos privadas MUE-01 y otros datos exigen inventario explícito.
- **Cadena obligatoria:** A0 verificada e **instalada/activa** → ≥7 días sin escritores de época anterior, con evidencia → backup independiente completo SHA-256 → migración R1 reversible y probada con datos sintéticos/autorizados → F0.3 accesible → prueba de restauración en perfil limpio. F1 multiusuario/nube tiene contrato y autorización separadas.
- No prometer cero pérdidas, RPO/RTO, recuperación global, migración realizada ni activación de cuentas sin prueba medida. Esta actualización documental no ha manipulado proyectos locales ni datos personales.

## 5. Auditoría complementaria: próximos cortes, riesgos y tareas
1. **Codex M12:** terminar CI post-#300 y #301 sobre `master@414e53ac`, diagnosticar su `browser`, luego #271 sin volver a integrar la unión básica; mantener la evidencia original por SHA.
2. **Carril seguridad:** cerrar gate WebKit/Firefox de #310 y actualizar su árbol; ausencia de escritores antiguos y controles R1 son independientes de CI general. La ventana ≥7 días no empezó aquí.
3. **Constructor M11:** publicar candidato completo HERO+B y una prueba combinada con resultados/videos del mismo run; no dejar exportación/epílogo esencial para que lo programe Codex. #309 sigue bloqueada.
4. **Laboratorios maduros:** F03 V2 GO-LAB; Studio E4 y recetas, OP-05 GLB privado, OP-07 geometría v2, R01 reconocimiento y Simulator D contienen valor pero **NO** están listos por simple existencia de pruebas aisladas. Mantener límites, licencias y roles.
5. **Gobierno documental:** reconciliar #302 (documentación anterior) y #307 (incidencia M08 ya corregida en #308) sin reabrir bugs históricos ni duplicar PR; considerar #296 absorbida por #298. Actualizar la misma #305 con evidencias nuevas sin borrar versiones anteriores.
6. **Seguridad documental:** no incorporar volcados de interfaz/sesión, tokens temporales, identificadores privados o trazas de diagnóstico en documentación pública. Publicar solo evidencias depuradas. Si un token Vercel pudo quedar expuesto, confirmar alcance y revocación/caducidad antes de cierre de higiene.
7. **Comercialización:** GOV-06a identidad real, GOV-05 dictamen legal, control de gasto IA y pruebas profesionales en hardware siguen bloqueando promesas de beta abierta. M03/M04/M05/M08/M12 ya contienen funcionalidades útiles, pero no equivalen a todos sus resultados de usuario cerrados.

## 6. Gobierno de este corte
- El texto anterior de `CONTINUIDAD-OPERATIVA-VIGENTE.md`, plan, matriz y handoff conserva su fecha y valor histórico. La presente nota prevalece *solo* para hechos posteriores a #300 y se debe revalidar frente a GitHub antes de cualquier operación.
- **Ninguna mutación de producto:** esta PR modifica únicamente documentación. Sin merge, despliegue, activación, gasto ni migración. La publicación no implica GO-MERGE.
- Próximo gate documental: consultar HEAD/árbol/CI nuevos, actualizar corte de nuevo si Codex fusiona otra candidata, conservar la aceptación previa solo en su alcance exacto.

## 7. Auditoría de fallos por job (consulta complementaria del mismo 21/11)
- **#301 Cámara:** el único check rojo es `browser`, en el paso «My studio, brand and the photo project keep working with the catalogue loaded». Codex asocia el fallo al recorrido de bienvenida tras recarga; confirmar causa en el nuevo árbol, sin eliminar la prueba. [Job](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44852929212/job/136688285130).
- **#271 RoomPlan UX:** `scene` falla en «App, UI end to end and robustness» y `app-m2-gate-d` en «Gate D ... and M1»; las investigaciones del autor describen GLB retrasado y siluetas, pero esa hipótesis debe reproducirse en el árbol reconciliado. [Scene](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44742945982/job/136310912898) · [D](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44742946362/job/136310914308).
- **#309 HERO:** los 9 fallos ya terminaron; aparecen en `real-3d`, `app-m2-gate-d`, dos `ux-stability-browser` (escritorio/móvil), `gov07`, `import-and-regressions`, `contract`, `living-section-combined-browser` y `living-browser`. Los checks rojos son nueve, no nueve causas independientes demostradas. Enviar al autor el conjunto de regresiones y requerir una única fuente consistente con la evidencia. [Checks](https://github.com/Juanmaes83/floorplan-3d/pull/309/checks).
- **#310 A0:** 99 checks correctos y 1 omisión prevista sin fallos, pero su propio comentario de validación mantiene pendientes los gates de concurrencia persistente WebKit, Firefox y composición con master. Una suite general verde no levanta un HOLD específico de R1. [PR](https://github.com/Juanmaes83/floorplan-3d/pull/310).
- **Documentación #305:** después de publicar esta actualización su CI está en curso; no proclamarla lista para merge hasta validar el nuevo HEAD, el diff sólo Markdown y ausencia de regresión de documentos de master. El cuerpo histórico sigue conservado.

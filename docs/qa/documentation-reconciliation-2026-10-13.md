# Reconciliación documental de PR #28 y #32 — 13-10-2026

## Alcance y autorización

Juanma aprobó el plan de recuperación de control y pidió preparar la documentación desde el master vigente, preservar aportes únicos, integrar la actualización y después cerrar las PR sustituidas. Esta entrega es solo Markdown: no incorpora producto, recursos, contrato, dependencias ni settings de producción.

Base auditada: `88b0cb568e9824533764518ec42e235e9c2774a9`. La referencia [baseline/control-2026-10-13-88b0cb5](https://github.com/Juanmaes83/floorplan-3d/tree/baseline/control-2026-10-13-88b0cb5) conserva ese producto. #34/#35 contienen la bienvenida, buscador, guía, navegación y proyectos locales. Los próximos cambios deben partir del master resultante, sin mover esta referencia.

## Fuentes y aportes únicos

| Fuente | Referencia exacta | Aporte conservado | Destino |
| --- | --- | --- | --- |
| [PR #28](https://github.com/Juanmaes83/floorplan-3d/pull/28) | `eb28ce1e40f7c1ba1c97da7ec96778dcdfe9dd80` | Cierre A/B, pruebas comparadas y límites; LAB v03, autorización C y D-C1; decisiones abiertas | [Roadmap](../ROADMAP.md#registro-histórico-rescatado-de-pr-28--06-10-2026), [workflow](../DEVELOPMENT-WORKFLOW.md#registros-históricos-recuperados-de-28-y-32) e informes A/B/C |
| [PR #32](https://github.com/Juanmaes83/floorplan-3d/pull/32) | `918c134b85eee3f50f95cd20689a2592464c0bde` | Cuatro etapas MCP completas, aceptación, límites y experiencia Windows/Claude Code | [Roadmap MCP](../technical/local-mcp-roadmap.md), roadmap canónico y workflow |
| [PR #35](https://github.com/Juanmaes83/floorplan-3d/pull/35) | Merge `88b0cb568e9824533764518ec42e235e9c2774a9` | Guía/navegación y cierre #23 vigentes | Contenido base preservado; [cierre de guía](guided-experience-integration-2026-10-13.md) |
| [PR #21](https://github.com/Juanmaes83/floorplan-3d/pull/21) | `27775a5d4fd085c45423d99a7c1f18eef97f3972` | Crédito en cabecera y textos adicionales, rescatados antes de cerrar | Registro independiente de adaptación visual de esta página y comentario fuente |

Los diffs completos de #28/#32 se revisaron frente a los documentos actuales. Sus párrafos vigentes antiguos no sustituyen el encabezado del 13-10-2026. El contenido de pruebas y decisiones se mantiene fechado; los informes A/B/C y la propuesta Pascal enlazan ahora el estado real.

## Qué está integrado y qué sigue propuesto

| Entrega | Estado remoto comprobado | Referencia de merge |
| --- | --- | --- |
| A, revisión local | MERGED #27; 06-10-2026 | `5b93339601998d750918e01cb4431073b75cf5a0` |
| B, captura 3D | MERGED #29; 06-10-2026 | `217ed068b90232907a40b8dff7748a11e6259e7f` |
| C, variantes | MERGED #30; 07-10-2026 | `3599e71432265860ba932147e1d9765f609b68c4` |
| MCP de lectura | MERGED #31; 07-10-2026 | `88aef0bfeea8abb67865c3d2a33a484c909511ea` |
| Guía y navegación | MERGED #34/#35; 13-10-2026 | `92a1193fc1386d3f69566beab15923cc62836222` / `88b0cb568e9824533764518ec42e235e9c2774a9` |
| Evolución MCP | Cuatro etapas propuestas; no implementadas aquí | PR #32 rescatada |
| Casa Serra | PR #36 abierta en borrador; preparación documental | Implementación/preview de producto pendientes; no se integra en esta entrega |

A/B/C no cambian la numeración canónica F0–F3. El MCP de lectura no aprueba toda D ni D–G. D-C1 queda resuelta como metadato de biblioteca, fuera del contrato y del JSON exportado; D-A1 y decisiones de producto explícitamente abiertas siguen pendientes.

LAB #2/#3/#4 figuran MERGED en `feat/astra-blender-gate-1`; #4 corresponde a v03 `37df8472e6163263f435424f6989b6c0e10b8ad9`, aprobada por Juanma. LAB #1 y #5 siguen abiertas según la lectura remota del 13-10-2026. No se inspeccionó su producto ni se reejecutó Blender; no se modificó LAB. Sus cierres y previews requieren revisión propia.

## Evidencia histórica y límites

- A: 18/18 pruebas propias. Comparación histórica: unitarias 124 aprobadas/1 omitida; navegador 36/1 omitida; F3 21 aprobadas/4 fallos iguales en ambas versiones; superficies 7/7 y dimensiones 5/5. Los fallos históricos `replaceChildren … blur` se conservan, no se declara que estén resueltos hoy.
- B: captura 3D 3/3 y comparación de suites registrada en su informe; mismos cuatro fallos F3 históricos. Límites de captura, presupuesto de buffer y ausencia de etiquetas CSS2D conservados.
- C: batería y límites originales preservados en [su informe](../technical/variants-phase-c.md); no se repite aquí.
- MCP: uso reportado el 07-10-2026, 47 llamadas con SHA estable y sin escrituras; Windows `npm run check` correcto y tests 5/6 por `EPERM` de fixture symlink; CI Linux 6/6. `roomId` y cuatro pares posiblemente separados por muros siguen como hipótesis a reproducir. 600 mm fue un ejemplo.
- SwiftShader y emulación no acreditan GPU ni rendimiento en teléfono físico. La referencia incluye QA de guía 162 aprobadas/1 omitida, navegación 4/4 y recorridos 5/5; son resultados de #34, no nuevos tests de esta documentación.
- F2 permanece experimental: cinco sesiones autorizadas, veinte planos con referencias y umbrales pendientes. Escala física de modelos de malla y medición móvil siguen sin acreditar.

## Adaptación visual rescatada de #21 — entrega independiente

#21 está CLOSED sin merge. #22 mantiene el panel «Legal y uso» del pie y su enlace `#legal-y-uso`. El [registro de rescate](https://github.com/Juanmaes83/floorplan-3d/pull/21#issuecomment-6149918723) conserva el crédito permanente en cabecera, declaraciones adicionales de uso/alcance, fragmentos y fuente exacta. Issues está deshabilitado; el comentario y la descripción de la PR conservan el seguimiento.

**Estado: rescate documental; implementación pendiente.** La rama original se conserva. No se incorpora su index.html completo ni se considera cubierta la autoría permanente en cabecera por la autoría del panel.

1. Crear una rama desde el master vigente cuando se aborde esta entrega.
2. Adaptar solo el crédito de cabecera y revisar expresamente los textos adicionales de uso/alcance.
3. Reutilizar el panel actual; mantener un único diálogo y añadir solo lo acordado.
4. Comprobar ES/EN/ZH, escritorio y móvil, espacio de cabecera, Inicio, buscador, navegación, cierre legal y conservación de proyectos/guardado/exportaciones.
5. Publicar PR y preview del SHA final; revisión propia antes de fusionar según el workflow.

La reconciliación documental actual no implementa esa adaptación ni aprueba sus cambios visuales por anticipado.

## Verificación de esta actualización

Verificación documental: tablas, cercas, destinos internos y anclas mediante `scripts/check-documents.py`; destinos contrastados con el árbol GitHub de referencia. Diff revisado con `git diff --check`. Comprobación remota de que el diff final solo contiene los nueve Markdown de esta entrega y de que los blobs de todos los archivos de producto coinciden con la base.

Resultado local: **9/9 Markdown comprobados**, tablas/cercas/enlaces/anclas correctos y `git diff --check` correcto. Se materializaron los 46 Markdown de la base y los cuatro archivos fuente referenciados; las carpetas de recursos se contrastaron con el árbol remoto. No se descargaron ni revalidaron los recursos binarios.

No se ejecutan suites de producto ni revisión visual nueva porque no cambia la aplicación. CI/estado remoto del SHA final se registra en la PR de esta reconciliación, sin reutilizar checks de otros SHA como resultados nuevos.

## Protocolo de integración y cierre sustitutivo

1. Publicar la actualización con base vigente y registrar el HEAD exacto y la verificación documental en su PR.
2. Comprobar que no hay cambios de producto y que la base/HEAD siguen siendo los revisados; fusionar la actualización por autorización de Juanma.
3. Verificar MERGED y contenido en master antes de cerrar #28/#32.
4. Dejar en cada PR sustituida el enlace a la PR nueva, su SHA de merge, los aportes preservados y este registro; cerrar sin volver a fusionar sus ramas antiguas.
5. Conservar sus ramas/SHAs durante este cierre. La eliminación de ramas históricas se gestiona en una limpieza posterior.

El registro efectivo de merge y cierre queda en las conversaciones de las PR correspondientes, que son la fuente de sus estados finales.

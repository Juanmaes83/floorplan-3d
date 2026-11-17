# 15 · Registro del delta v1.4 (N01–N08, RP-Q01–RP-Q12)

**Ámbito:** laboratorio `lab/studio-presentation-e0e1`. Nada de esto acredita el producto ni autoriza integrarlo.
**Mandatos:** `mandatos/RUBIK-SOTA-PROMPT-CLAUDE-DELTA-DOCUMENTAL-v1.4.md` y su anexo; correcciones V1–V5 e interpretaciones de `reports/14`. Índice y huellas: `mandatos/INDICE-MANDATOS.md`.

**Estados** (los del anexo §8):

| Estado | Significado |
|---|---|
| EXECUTED_PASS | Ejecutado sobre el candidato v1.4 y superado. |
| EXECUTED_FAIL | Ejecutado y no superado. |
| REUSED_VERIFIED | Evidencia anterior válida: mismas fuentes, dependencias, entorno y artefacto. |
| BLOCKED | Falta una fuente o un permiso. |
| NO_VERIFICADO | No se puede probar en este entorno. |
| N/A | No aplica. |
| EXPECTED | Planificado, aún no ejecutado. |

## Baseline congelada (cierre v1.3)

| Qué | Valor |
|---|---|
| Commit | `585fd9c` (rama del laboratorio) |
| Snapshot | `snapshot/snapshot.json`, SHA-256 `fcb6e19f…b390` |
| ZIP de cliente ES / EN | `a3f9958a…7bbe8` / `7a19c71a…01258` |
| ZIP del laboratorio | `309e077b…c1b07` |
| QA | 25 PDF con QA 0; web 42/42; exportador 72/72; reconstrucción ×2: 25/25 |
| Evidencia | `evidence/paquetes/`, `reports/13-REGISTRO-VIVO-v1.3.md` |

## N01 · Catálogo y selector de recetas RP01–RP21

**Qué existía:** 7 modalidades de entrega (`entrega.json` → `tipos`), el catálogo único de módulos, capítulos y documentos (`tools/catalogo-entrega.cjs`), el exportador con gates (`tools/exportar.cjs`), el verificador y «Preparar entrega».

**Qué se añade:**

| Pieza | Qué hace |
|---|---|
| `tools/recetas.cjs` | Catálogo de las 21 recetas (campos del anexo §5 N01), 6 perfiles, 3 fases y 43 fuentes evaluadas sobre el snapshot y el registro reales. `resolver()` devuelve el estado y, para una L, la selección del contrato v1.3 (modalidad, capítulos y documentos existentes). |
| `tools/receta-exportar.cjs` | Adaptador mínimo. Una L va a `exportar.cjs` **sin cambiar su contrato**. La receta y su versión quedan en la nota de la selección y en `<dir>.receta.json`, que liga la receta a la huella del ZIP. Una C, F o L bloqueada deja solo `<dir>.receta-rechazo.json`: ninguna carpeta, ZIP ni resumen. |
| «Preparar entrega», paso 1 | Filtros de perfil y fase (reversibles), lista con estado, detalle (qué obtendrás, qué falta, qué se omite, qué verificar). «Aplicar» rellena la selección libre, que sigue editable. C y F explican por qué no hay descarga. |
| `tools/recetas-qa.cjs` | Esquema, filtros, exportación real ES/EN de cada L, rechazo de cada C/F, negativos, navegador. |

**Interpretaciones aplicadas** (`reports/14` §3):

- Las aportaciones de fixture no cuentan en una L: los documentos actuales no las componen, así que la receta sigue parcial y lo dice.
- RP02 y RP09 comparten la selección y, por tanto, los bytes. Se acredita con las huellas del manifiesto, sin duplicar salida.
- El registro de la receta no entra en el manifiesto del cliente: el contrato del exportador no cambia. La evidencia es interna del laboratorio (`<dir>.receta.json`), como permite el anexo.

**Resolución sobre la entrega real** (`evidence/recetas/matriz-recetas.json`):

| Estado | Recetas |
|---|---|
| L completa | RP05, RP07 |
| L parcial (exportada; nombra lo que falta) | RP01, RP02, RP03, RP04, RP06, RP08, RP09, RP10, RP11, RP12 |
| C no elegible (sin descarga) | RP13, RP14, RP15, RP17, RP21 |
| F no disponible (sin descarga) | RP16, RP18, RP19, RP20 |

Resultados de las pruebas: ver la sección «RP-Q» más abajo.

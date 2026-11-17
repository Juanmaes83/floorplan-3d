# HANDOFF v1.4 · Studio Presentation (laboratorio). Leer ENTERO antes de tocar nada.

**Rama:** `lab/studio-presentation-e0e1` (push solo aquí). **Sesión anterior:** se quedó sin contexto a mitad de v1.4.
**Prohibido:** merge, PR, Production, Vercel, secretos, ramas/workflows de Codex, IA de pago, editar el producto (`js/`, `css/`, `api/`, `index.html`, `comparar/`). E2–E7: solo diagnóstico y plan.
**Mandatos vigentes** (acumulativos): `mandatos/INDICE-MANDATOS.md` (v1.3, prompt v1.4, anexo v1.4, con SHA-256). La especificación v1.2 y los hallazgos V13-01..09 **no se recibieron**: BLOCKED (no reconstruir de memoria).
**Correcciones aceptadas al anexo:** `reports/14-AUDITORIA-MANDATO-v1.4.md` §2 (V1–V5) y §3 (6 interpretaciones). No editar los originales en `mandatos/`.

## 1. Estado

| Bloque | Estado | Evidencia |
|---|---|---|
| v1.3 completo | CERRADO (commit `585fd9c`): reconciliación A10/A22/A23/A27–A29, H08, avisos del ZIP, HANDOFF vigente, Playwright fijado, informes 00/07/09/10/11/12, paquetes y 2 reconstrucciones (25/25) | `reports/13`, `evidence/paquetes/` |
| Baseline v1.4 | Congelada en `reports/15` | `reports/15-REGISTRO-v1.4.md` |
| **N01 recetas** | HECHO salvo cierre de evidencia: `tools/recetas.cjs` (21 recetas, 6 perfiles, 3 fases, 43 fuentes), `tools/receta-exportar.cjs` (L → `exportar.cjs` sin cambiar su contrato; C/F → solo `.receta-rechazo.json`), selector en «Preparar entrega» (paso 1), `tools/recetas-qa.cjs` | `evidence/recetas/` |
| N01 QA | esquema+negativos 24/24; exportación real 12 L × ES/EN + 9 C/F rechazadas: 96/96 tras corregir un falso positivo (base64 con «EUR»); navegador: desborde a 320 px (defecto v1.3 de la barra de vista previa) corregido y en PASS. Estado guardado 109/110: falla `UI-rp07-artefacto-real-igual-al-adaptador` porque compara con exportaciones hechas ANTES del último recompose (el registro cambia en cada composición). **Primer paso: `RECETAS_SOLO=RP07 node tools/recetas-qa.cjs /tmp/rq exportar,ui`** (misma composición para ambos lados). Si sigue fallando, es un defecto real: investigar la diferencia de archivos. | `evidence/recetas/recetas-qa.json` |
| **N05 estados** | HECHO: `tools/estado-entrega.cjs` (preparado → verificado / verificado-desactualizado / inválido; emitido solo `--simulacion`; firmar/aceptar siempre rechazado; sustituir enlaza sin borrar). `tools/estado-qa.cjs` 23/23 | `evidence/estados/estado-qa.json` |
| N02, N03, N04, N06, N07, N08 | PENDIENTE | plan en `reports/14` §5 |
| RP-Q01–RP-Q12, paquetes, 2 reconstrucciones, cierre | PENDIENTE | — |

## 2. Primeros pasos en la nueva ventana

```bash
cd labs/studio-presentation
git pull origin lab/studio-presentation-e0e1
node tools/compose.cjs snapshot out/v3                      # QA 0 esperado en 25 PDF; out/v3 está versionado
RECETAS_SOLO=RP07 node tools/recetas-qa.cjs /tmp/rq exportar,ui   # cerrar el único FAIL pendiente
node tools/recetas-qa.cjs /tmp/rq2                          # completo: ~10 min (12 L × ES/EN exportadas)
node tools/estado-qa.cjs /tmp/eq
```
Reejecución acotada de recetas: `RECETAS_SOLO=RP07,RP08 node tools/recetas-qa.cjs <dir> exportar`.
Exportar una receta: `node tools/receta-exportar.cjs RP09 es /tmp/x/rp09 --reconocer "Identidad del estudio,Presupuesto revisado,Imágenes IA,Plan de obra"`.

## 3. Siguiente trabajo, en orden (reports/14 §5)

1. Completar `reports/15` con N01/N05 y sus resultados (sección «RP-Q»). Añadir N01/N05 al mapa de recetas del handoff.
2. **N02:** tabla A-01…A-08 → AB-01…AB-11 con elegibilidad por hoja dentro del Architecture Book (`tools/architecture-book.cjs`); cajetín (autor/titulación optativos, norte solo con fuente: no hay), índice ↔ hojas verificable, huecos: solo ancho (sin alto ni sentido en ventanas). No renombrar AB-xx (V3). Revisar todas las páginas afectadas ES/EN y añadir textos nuevos a `i18n/en.exact.cjs` (el gate bloquea el inglés si falta uno).
3. **N03:** oráculo FF&E en `tools/b1.cjs`/libro de materiales: conjunto exacto de 46 instancias/40 líneas, códigos M-xx estables, no doble conteo, fixtures negativas (SKU duplicado con distinto acabado, genérico, sin precio, cantidad 0, otro proyecto, 1/50/200/500 filas). Sin SKU ni precios reales: todo «sin referencia».
4. **N04:** copiar `revision-budget-core` de `master@8525025` a `vendor/` con huella y procedencia (V4) y probar los 5 estados (complete/partial/incoherent/one-sided ambos sentidos/none) en propuesta e inmobiliaria, sin recalcular. Honorarios/precio inmueble solo como fixture atribuida y rotulada.
5. **N06:** conciliación informativa (fuente, método, unidad, revisión, ámbito) y contratos RP13–RP21 (ya en `recetas.cjs`); reutilizar A25/A26 (`evidence/e2/`).
6. **N07:** paleta con origen (snapshot), callouts con referencia estable; sin tocar D1–D5.
7. **N08:** mapa machine-readable receta → módulo → fuente → pieza → gate/test con huellas Git/binarios/entorno (`evidence/` + legible). No editar `.github/` ni CI de Codex.
8. RP-Q01–RP-Q12 completos, revisión visual de páginas nuevas/modificadas (`evidence/revision-visual/`), `bash tools/package.sh`, `bash tools/reconstruir.sh dist/rubik-studio-presentation-lab.zip /tmp/rec`, informe E2–E7 (actualizar `reports/11`), GO/NO-GO graduado, handoff.

## 4. Reglas que la sesión anterior aprendió

- Commit + push después de cada bloque. Atribución en commits: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_01QDzoLgCxdVTbtJTJCfqnTi` (o la de la nueva sesión).
- No recomponer `out/v3` mientras corre una exportación: el exportador la rechaza como obsoleta (correcto).
- Rótulos de interfaz que coinciden con datos del proyecto: marcarlos `data-ui` (caso «Ventana»).
- La revisión humana (D08) sigue pendiente; nada de esto es aceptación.

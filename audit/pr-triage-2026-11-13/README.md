# Auditoría de PR abiertas · RUBIK SOTA · 13/11/2026

Carpeta de **auditoría administrativa**. **No forma parte del producto.** Está en la rama `claude/bold-allen-ug56ci`:
- no hay PR para ella;
- no se fusiona en `master`;
- ningún workflow ni despliegue la usa.

Sirve para que cualquiera pueda reproducir la clasificación de las PR abiertas y las decisiones de cierre por lotes.

## Contenido

| Archivo | Qué es |
|---|---|
| `PR_TRIAGE_RUBIK_2026-11-13.md` | Informe completo: estado de ejecución (L1 hecho; L2 y L3 preparados), clasificación A–F, lotes y comentarios de cierre literales |
| `PR_TRIAGE_RUBIK_2026-11-13.csv` | Una fila por PR (las 67 del triaje): métricas, evidencia, decisión, SHA completos, enlaces, última comprobación y comentario de cierre |
| `scripts/audit.py` | Métricas de cada PR frente a `master`: ascendencia, delta propio, `patch-id`, `git apply --check` en los dos sentidos, blobs y líneas |
| `scripts/succ.py` | Delta propio de una PR frente a un commit sucesor (patch-id y % de líneas) |
| `scripts/missing.py`, `scripts/overlap.sh` | Líneas añadidas que no están en master; solapamiento de JS entre ramas |
| `scripts/classify.py`, `scripts/build_md.py` | Clasificación A–F (decisiones documentadas en el código) y generación del CSV y el MD base |
| `scripts/l2.py` | L2: delta propio y patch-id de #133–#151 frente a sus sucesores, con residuos en ambos sentidos |
| `scripts/l3.py`, `scripts/l3-residual.py` | L3: líneas añadidas y borradas frente al squash `f3d7678` (#96), blobs y similitud de cada línea residual |
| `scripts/run-one.sh`, `scripts/run-l3-tests.sh` | Ejecutan sobre un *worktree* de `master` las pruebas que añadió o modificó cada PR de L3 |
| `scripts/decide.py`, `scripts/augment.py`, `scripts/build_exec_md.py` | Decisiones APTA / REVISAR / BLOQUEADA, columnas nuevas del CSV y sección de ejecución del MD |
| `data/` | Entradas y resultados intermedios: `prs.tsv`, `metrics.tsv`, `succ-*.tsv`, `l2*.tsv/txt`, `l3*.tsv/txt`, `decisions.json`, `l1-result.json`, `state-github.tsv` y los registros de las pruebas |

## Reproducir

Desde un clon de `Juanmaes83/floorplan-3d`:

```bash
git fetch origin '+refs/pull/*/head:refs/remotes/pr/*' '+master:refs/remotes/origin/master'
git worktree add --detach /tmp/mw origin/master
D=audit/pr-triage-2026-11-13
mkdir -p /tmp/triage && cp $D/scripts/* $D/data/*.tsv $D/data/*.json $D/data/*.txt /tmp/triage/
cd /tmp/triage
python3 -I audit.py <repo> prs.tsv /tmp/mw > metrics.tsv
python3 -I l2.py <repo> > l2.tsv
python3 -I l3.py <repo> > l3.tsv
python3 -I l3-residual.py <repo> metrics.tsv > l3-residual.tsv
# Pruebas de L3 (requiere Chromium de Playwright; CHROME y THREE_LOCAL_DIR se fijan dentro):
xargs -P 2 -I{} ./run-one.sh /tmp/mw l3-test-logs {} < l3-queue.txt
python3 -I decide.py && python3 -I augment.py && python3 -I build_exec_md.py
```

`prs.tsv` es la lista de PR abiertas del 13/11 (número, borrador, rama, HEAD corto, base, fechas y título). Si una PR ha cambiado de HEAD, los scripts usan el `refs/pull/N/head` actual, y `state-github.tsv` registra la diferencia.

## Límites

- `patch-id` idéntico prueba que el **cambio textual** es el mismo, no que el comportamiento actual de master coincida.
- El porcentaje de líneas es aproximado. Por eso cada residuo de L3 se explica una a una y, además, se ejecutan las pruebas de cada PR sobre master.
- Las pruebas se ejecutaron con Chromium de Playwright (SwiftShader). No hay dispositivos físicos ni GPU real.
- Esta carpeta **no autoriza** ningún cierre. L2 y L3 están preparados a la espera de autorización expresa.

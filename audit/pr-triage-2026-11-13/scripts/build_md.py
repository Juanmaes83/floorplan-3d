#!/usr/bin/env python3
import csv, json, os
D = os.path.dirname(os.path.abspath(__file__))
rows = {r['pr']: r for r in csv.DictReader(open(f'{D}/PR_TRIAGE_RUBIK_2026-11-13.csv'))}
def t(s): return s.replace('|', '\\|').replace('\n', ' ')
def short(n): return f"#{n}"
order = sorted(rows, key=lambda x: -int(x))
by = lambda pred: [n for n in order if pred(rows[n])]
L1 = by(lambda r: r['lote']=='L1'); L2 = by(lambda r: r['lote']=='L2'); L3 = by(lambda r: r['lote']=='L3')
L4 = by(lambda r: r['lote'].startswith('L4')); L5 = by(lambda r: r['lote'].startswith('L5'))
cnt = {k: sum(1 for r in rows.values() if r['categoria']==k) for k in 'ABCDEF'}
out = []
w = out.append
w(f"""# Triaje de las 67 PR abiertas de RUBIK SOTA (13/11/2026)

**Base auditada:** `master@f5c08c7efc0aabb0204246da311504fe3b778ee8`, que ya contiene #213, #214 y #218. Las 67 PR abiertas se leyeron por su `HEAD` real (`refs/pull/N/head`) el 13/11/2026.
**Alcance:** auditoría de **solo lectura**.
- No se ha cerrado, fusionado ni comentado ninguna PR.
- No se ha tocado ninguna rama, y `master` no cambia.
- Las ramas en curso #215, #219 y #220 no se han modificado.

**Ficheros** (copia persistente en la rama `claude/bold-allen-ug56ci`, carpeta `audit/pr-triage-2026-11-13/`):
- `PR_TRIAGE_RUBIK_2026-11-13.csv`: una fila por PR, con métricas, evidencia, acción, riesgos y comentario de cierre.
- Este documento.
- Los scripts reproducibles, en §9.

## 0. Resultado en una línea

| Categoría | N.º | Qué significa aquí |
|---|---|---|
| **A · INTEGRADA** | {cnt['A']} | El contenido está en master, con prueba: ascendencia, `patch-id` idéntico o ≥ 98 % de líneas en un commit de master identificado |
| **B · SUSTITUIDA** | {cnt['B']} | Hay una sucesora identificada, con prueba (ascendencia, rescate documentado o reescritura medida) |
| **C · INTEGRABLE** | {cnt['C']} | Diferencia real que aplica limpia: #219 y #220, ambas de agentes activos y **no tocadas** |
| **D · BLOQUEADA** | {cnt['D']} | Espera una decisión humana o externa concreta (gate) |
| **E · EXPERIMENTAL/DOCUMENTAL/HISTÓRICA** | {cnt['E']} | Documentos sin incorporar (GOV-04) y la evidencia R03 v1 |
| **F · INDETERMINADA** | {cnt['F']} | Ninguna: cada PR tiene al menos una prueba mecánica más un vínculo documental |

**Deuda que se puede retirar ya, con prueba y sin decisiones de producto: {len(L1)+len(L2)+len(L3)} PR** (lotes L1, L2 y L3).
- Otras {len(L4)} dependen de un hecho concreto: fusionar #219, o que el propietario decida R02-A, VQ-01 o ENT-01.
- Otras {len(L5)} son documentos o evidencias que el propietario debe decidir si se incorporan (GOV-04).

Hallazgo importante sobre las 39 PR históricas (#70–#90, #133–#151):
- **35** no se pueden fusionar hoy sin hacer daño: su parche no aplica sobre master en ningún sentido (`git apply --check`, directo e inverso).
- Las otras 4 son documentos: #82 y #83 ya están idénticos en master; #77 y #89 aplican limpios.

En tres casos, fusionar **desharía controles de seguridad ya integrados**:
- **#141** volvería a aceptar el código del Render IA para publicar enlaces, deshaciendo GOV-08 S1 (#187).
- **#139** dejaría `api/render.js` sin los límites de acceso y gasto de D1.
- **#166** quitaría `RUBIK_SHARE_TOKEN` y reescribiría `api/share.js`, `api/unshare.js` y `api/view.js`, deshaciendo GOV-08 S1 y S2.

## 1. Método (reproducible) y límites

Se calculó para cada PR con `audit.py`, frente a `origin/master@f5c08c7`:

1. **Ascendencia:** `git merge-base --is-ancestor HEAD master`.
2. **Delta propio:** `merge-base(HEAD, base)`, donde la base es el HEAD de la PR inferior en las pilas (por ejemplo, #151 sobre #150). Si no, `master`.
3. **`git patch-id --stable`** de cada commit propio, comparado con los 574 commits sin *merge* de master.
4. **`git apply --check`** del delta propio sobre un *worktree* desacoplado de master, en sentido inverso (¿ya está aplicado?) y directo (¿aplica hoy?).
5. **Estado de cada archivo tocado en master:** idéntico (mismo blob), distinto o ausente. También se busca si el blob existe en otra ruta.
6. **Líneas añadidas significativas** (> 25 caracteres, sin espacios en los extremos) que están en el **mismo archivo** de master y en cualquier archivo.
7. **Referencias `#N`** en el log de master.

Después, `succ.py` comparó el delta propio de cada PR con el commit sucesor candidato: `patch-id` del delta completo y % de líneas añadidas presentes en el diff de ese commit. Los candidatos son:
- **#133–#151:** los commits `integration: … sobre master consolidado` del 30/10, con correspondencia 1:1.
- **#70–#90 y #36:** el *squash* `f3d7678` (#96).

**Límites:**
- `patch-id` idéntico prueba que el **cambio textual** es el mismo, no que el comportamiento actual de master coincida. Master siguió evolucionando después.
- El % de líneas es una **heurística**: una línea presente no prueba la misma semántica, y una ausente puede haberse reescrito a propósito. Por eso todos los casos por debajo del 100 % se revisaron a mano y se explican en la evidencia (#70, #72, #73, #78, #79, #81, #90, #134, #36).
- Las *squash merges* rompen la ascendencia. #96 es la prueba: ninguna de las PR #70–#90 es ancestro de master y, aun así, su contenido está.
- La ausencia de conflictos entre #219, #220 y #215 (`git merge-tree`) es **solo textual**: no sustituye a las pruebas.
- **CI:** se consultó solo en las PR activas (#211, #215, #217, #219 y, antes en la sesión, #220). En #203 también se consultó: 13/13 en verde. Para el resto de laboratorios se cita el estado único del 12/11, sin reconsultar. Las históricas no se consultaron: su CI es de octubre y no sirve como evidencia sobre el master actual.
- No se verificó el comportamiento en navegador de ninguna PR histórica: la equivalencia aquí es de **contenido**, no funcional.

## 2. Tabla por impacto y esfuerzo

| # | Acción | PR | Impacto en la deuda | Esfuerzo | Riesgo | Prueba |
|---|---|---|---|---|---|---|
| 1 | Cerrar el lote L2 (Punto 9, Project-First, Fases B y C, FT3D-1a/1b) | {len(L2)} | **Alto** | Mínimo: un comentario y cerrar | Bajo | `patch-id` idéntico en 16; 100 % de líneas en #150; código idéntico en #134 |
| 2 | Cerrar el lote L3 (programa de entrega de octubre, absorbido por #96, y #36) | {len(L3)} | **Alto** | Mínimo | Bajo | 98–100 % de líneas en `f3d7678` en 17; sucesora explícita en #70, #78 y #36 |
| 3 | Cerrar el lote L1 (#212, #216) | {len(L1)} | Bajo | Mínimo | Nulo | Ascendencia |
| 4 | Integrar #219 (Claude B), y después cerrar #210 y #211 | 1 + 2 | Medio | Medio: CI y GO | Medio | Ascendencia (#210 ⊂ #211 ⊂ #219) |
| 5 | Integrar #220 (UX-07, activación) | 1 | Medio (producto) | Revisión del propietario | Bajo-medio | CI 57/57; *merge-tree* limpio con #219 y #215 |
| 6 | Decisión GOV-04 sobre documentos | 8 | Medio | Decisión de 15 minutos por documento | Bajo | Solo documentación; todos aplican limpio |
| 7 | Decisión VQ-01/F03 | 4 (#164, #165, #167, #169) | Medio | Decisión visual | Alto si se fusiona | Ascendencia #165 ⊂ #167 ⊂ #169 |
| 8 | Confirmar ENT-01 por #189/#200/#201 y retirar #166 | 1 | Bajo (pero aclara ENT-01) | Decisión y una línea en el catálogo | **Muy alto si se fusiona** | Rescate documentado en 44ca9f3 |
| 9 | Adoptar #203 como R02-A canónico y cerrar #193 | 1 | Bajo | Hoja de decisión R02-A | Bajo | 87 % del JS de #193 en #203 |
| 10 | GO R03 (#215), y después cerrar #194 | 1 + 1 | Medio | Prueba C humana | Alto sin GO | Guía de revisión en #215 |
| 11 | Laboratorios D (R01, MCP, R02-A R1): mantener | 7 | — | — | — | Gates del estado único |

## 3. Lista 1 · PR cerrables documentalmente, con prueba ({len(L1)+len(L2)+len(L3)})

**Cómo cerrarlas:**
- **No borrar ramas** hasta cerrar todo el lote: borrar la rama base de una PR apilada hace que GitHub cierre o rebase las hijas.
- Cerrar de la **cima de cada pila hacia abajo**:
  - #151 → #150;
  - #149 → #148 → #147 → #146 → #145 → #143 → #142 → #141 → #140 → #139 → #138 → #137 → #136 → #135 → #134 → #133;
  - #86 → #76 → #73 → #71;
  - #81 → #78.
- Cerrar no destruye nada: la PR se puede reabrir y la rama queda.

| PR | Cat. | Lote | Sucesor en master | Prueba principal |
|---|---|---|---|---|""")
for n in L1 + L2 + L3:
    r = rows[n]; w(f"| #{n} | {r['categoria']} | {r['lote']} | {t(r['pr_sucesora'])} | {t(r['evidencia'])} |")
w(f"""
## 4. Lista 2 · Diferencias reales fáciles de integrar

| PR | Qué aporta | Estado | Siguiente paso |
|---|---|---|---|
| #219 | OBR-02/03 sobre master@f5c08c7: solo `evolucion/*` y 44 archivos nuevos. Contiene #210 y #211 | {t(rows['219']['ci'])} | **No tocar (Claude B).** CI en verde y GO del propietario |
| #220 | UX-07: «Comparar con el original» en Variantes, ruta de solo lectura | {t(rows['220']['ci'])} | **No tocar (Claude A).** Revisión del propietario |
| #48, #77, #89, #160, #162, #164 | Documentos sin equivalente en master; aplican limpio | Solo documentación | Decisión GOV-04: incorporar en **una** PR documental o archivar |

No se ha encontrado **ninguna** diferencia de código fácil de rescatar en las 39 PR históricas (#70–#90, #133–#151). Su código está en master; lo que falta son textos de documentos reescritos después, o versiones intermedias sustituidas.

## 5. Lista 3 · Bloqueadas por decisión humana o externa

| PR | Gate | Quién decide | Evidencia |
|---|---|---|---|""")
for n in by(lambda r: r['categoria']=='D'):
    r = rows[n]; w(f"| #{n} | {t(r['accion_recomendada'])} | {'Externo (jurídico)' if n=='161' else 'Propietario'} | {t(r['evidencia'])} |")
w("""
## 6. Lista 4 · Se quedan como laboratorio o evidencia

| PR | Motivo para mantener | Cuándo se podría cerrar |
|---|---|---|
| #191 → #205 (R01) | Única evidencia R01; F2 sin datos reales | Si el propietario descarta R01, o cuando haya un corte F2 integrado |
| #196 → #197 → #204 (MCP Etapa 2) | Etapa 2 con HOLD; 250 verificaciones provisionales | Tras validar con dato real autorizado e integrar, o al descartarla |
| #203 → #217 (R02-A) | Laboratorio R02-A canónico; hoja de decisión pendiente | Tras la decisión R02-A |
| #194 (R03 v1) | Evidencia del taller del donante | Tras el GO R03 (#215) |
| #169 (VQ-01/F03) | Única copia de los activos F03 | Tras la decisión VQ-01 |

## 7. Dependencias y orden más seguro de las próximas integraciones

```
master@f5c08c7
 ├─ #219 OBR-02/03 (Claude B) ── contiene #211 ⊃ #210
 ├─ #220 UX-07 activación (Claude A)
 ├─ #215 R03 en el editor (prueba C + GO) ── requiere #198/#214 (ya en master)
 ├─ #203 R02-A ── #217 R02-A R1        (sustituye a #193)
 ├─ #196 MCP ── #197 ── #204
 ├─ #191 R01 ── #205
 └─ #169 VQ-01 ⊃ #167 ⊃ #165          (acta #164)
```

**Comprobación de conflictos** (`git merge-tree`, en seco, sobre master): las combinaciones de dos (#219+#220, #219+#215, #220+#215) y la de las tres (#219, después #220, después #215) se fusionan **sin conflictos textuales**. Los archivos modificados no se solapan salvo `index.html`, que tocan #220 y #215 en zonas distintas.

**Orden recomendado:**
1. **#219.** Es la más madura en su carril y solo toca `evolucion/`. Cuando esté en verde y tenga GO: fusionar, y después cerrar #210 y #211 (lote L4).
2. **#220.** Es independiente de #219. Tras fusionarla, volver a pasar `variants*`, `premium-shell` y `ux07-*` sobre el master resultante.
3. **#215**, solo tras la prueba C humana y el GO R03. En ese mismo corte se actualizan las 2 pruebas de bloqueo de `pure`. Tras fusionar, cerrar #194.
4. Después, una sola cosa a la vez: decisión R02-A (#203 → #217; cerrar #193), decisión VQ-01 (#169) y validación real de MCP.

**Lo que no se debe hacer:** fusionar en bloque laboratorios D, o reactivar #166 (ENT-01) en lugar de #189/#200/#201.

## 8. Plan de cierre por lotes y comentario de sustitución

Cada PR tiene su comentario literal en la columna `comentario_cierre` del CSV, listo para pegar y con el pie de atribución.

| Lote | PR | Condición para ejecutarlo | Plantilla del comentario |
|---|---|---|---|""")
w(f"| L1 | {', '.join('#'+n for n in L1)} | Ninguna | «Cierre documental (GOV-02). Esta PR ya está en `master`: su HEAD es ancestro de `master@f5c08c7`…» |")
w(f"| L2 | {', '.join('#'+n for n in L2)} | Ninguna. Cerrar de la cima hacia abajo, sin borrar ramas | «…su delta propio tiene el mismo `git patch-id --stable` que el commit `<sha>` de `master` («integration: …»)…». En #139 y #141 se añade la advertencia de seguridad |")
w(f"| L3 | {', '.join('#'+n for n in L3)} | Ninguna. Apiladas primero | «…entró en `master` con el squash `f3d7678` (#96): X de sus Y líneas…», o la sucesora explícita (#70 → #73; #78 → #81; #36 → 5c24490) |")
w(f"| L4 | {', '.join('#'+n for n in L4)} | #210 y #211: tras fusionar #219. #193: tras adoptar #203. #165 y #167: con la decisión VQ-01. #166: con la confirmación de ENT-01 | Sustitución o consolidación, citando la sucesora y su SHA |")
w(f"| L5 | {', '.join('#'+n for n in L5)} | Decisión GOV-04. #61 y #64 se pueden archivar ya si el propietario lo acepta. #194, tras el GO R03 | «Cierre como histórica…», o incorporar el documento en una única PR documental |")
w("""
**Comentarios literales por PR**, agrupados en el orden de ejecución:
""")
for lot, ns in (('L1', L1), ('L2', L2), ('L3', L3), ('L4', L4), ('L5', L5)):
    w(f"\n### {lot}\n")
    for n in ns:
        c = rows[n]['comentario_cierre']
        if c: w(f"**#{n}**\n\n> " + c.replace('\n', '\n> ') + "\n")
        else: w(f"**#{n}**: sin comentario de cierre. Se decide en GOV-04 si se incorpora o se archiva.\n")
w("""
## 9. Inventario completo (67)

| PR | Título | Cat. | Lote | Anc. | patch-id | % líneas en master | apply −R / + | Exclusivos | Acción |
|---|---|---|---|---|---|---|---|---|---|""")
for n in order:
    r = rows[n]
    w(f"| #{n} | {t(r['titulo'][:70])} | {r['categoria']} | {t(r['lote'])} | {'sí' if r['ancestro_de_master']=='True' else 'no'} | {r['patchid_en_master']} | {r['pct_mismo_archivo']} | {r['apply_reverse'][0]} / {r['apply_forward'][0]} | {r['archivos_exclusivos_n']} | {t(r['accion_recomendada'])} |")
w("""
*La columna «patch-id» compara cada commit propio con los commits sin *merge* de master. En #133–#151 la coincidencia con el commit `integration:` se calcula sobre el delta completo (`succ-133.tsv`), y es la que se usa como prueba.*

### Reproducir

```bash
cd floorplan-3d
git fetch origin '+refs/pull/*/head:refs/remotes/pr/*' '+master:refs/remotes/origin/master'
git worktree add --detach /tmp/mw origin/master
python3 -I audit.py . prs.tsv /tmp/mw > metrics.tsv
python3 -I succ.py . metrics.tsv 133=6411179 134=a88c724 … 151=579189d > succ-133.tsv
python3 -I succ.py . metrics.tsv 70=f3d7678 71=f3d7678 … 36=f3d7678 > succ-96.tsv
python3 -I classify.py && python3 -I build_md.py
```
""")
txt = '\n'.join(out) + '\n'
ex = f'{D}/exec-section.md'
if os.path.exists(ex):
    txt = txt.replace('## 0. Resultado en una línea', open(ex).read() + '\n## 0. Resultado del triaje original (67 PR, antes de L1)', 1)
open(f'{D}/PR_TRIAGE_RUBIK_2026-11-13.md', 'w').write(txt)
print(len(out))

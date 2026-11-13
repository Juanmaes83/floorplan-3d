#!/usr/bin/env python3
"""Genera la sección «Estado de ejecución» (L1 hecho, L2 y L3 preparados) e inserta su texto en el MD del triaje."""
import json, os, csv
D = os.path.dirname(os.path.abspath(__file__)); U = 'https://github.com/Juanmaes83/floorplan-3d'
dj = json.load(open(f'{D}/decisions.json')); dec = dj['decisions']; WHEN = dj['when']; MS = dj['master']
l1 = json.load(open(f'{D}/l1-result.json'))
l2 = {r['pr']: r for r in csv.DictReader(open(f'{D}/l2.tsv'), delimiter='\t')}
l3 = {r['pr']: r for r in csv.DictReader(open(f'{D}/l3.tsv'), delimiter='\t')}
P = lambda n: f'[#{n}]({U}/pull/{n})'
Cm = lambda s, k=12: f'[`{s[:k]}`]({U}/commit/{s})'
t = lambda s: s.replace('|','\\|').replace('\n',' ')
o = []; w = o.append
w(f"""## Estado de ejecución (última comprobación: {WHEN}, `master@{MS}`)

### L1 · Ejecutado: #212 y #216 cerradas sin fusionar

| PR | HEAD | ¿Ancestro de master? | Estado verificado | Comentario de cierre | Rama |
|---|---|---|---|---|---|""")
for n in ('216', '212'):
    c = l1['closed'][n]
    w(f"| {P(n)} | {Cm(c['head'])} | Sí (`merge-base --is-ancestor`) | `closed`, `merged: false`, {c['closed_at']} | [comentario]({c['comment']}) | `{c['branch']}` conservada en {Cm(c['branch_after'])} |")
w(f"""
**Comprobaciones previas:**
1. #218 está `merged` ({l1['successor']['merged_at']}, HEAD `{l1['successor']['head'][:12]}`).
2. Los HEAD de #212 y #216 son los mismos del triaje y ambos son ancestros de `master@{MS[:12]}`.
3. Dependencias de pila: {l1['stack_check']} Se cerró primero #216 y después #212. No se ha borrado ninguna rama.

**Después del cierre:**
- `master` antes: `{l1['master_before']}`; después: `{l1['master_after']}`. Sin cambios.
- No se ha hecho ningún *merge* ni ningún despliegue por esta operación.
- PR abiertas: 67 → **{l1['open_prs_after']}**.

**Cambio externo detectado:** #219 (Claude B) tiene un HEAD nuevo, `a9d953fadee58ebd4a6e972a412a609553edaad3`; en el triaje era `b942a6d`. #210 y #211 siguen siendo ancestros de ese HEAD. No se ha tocado. Ninguna otra PR ha cambiado.

### L2 · Preparado, NO ejecutado (18 PR, pila #133–#151)

Método: el delta propio de cada PR frente a la PR de debajo en su pila se compara con su commit sucesor en master (`l2.py`, que también escribe `l2.tsv` y `l2-detail.txt`). Todos los sucesores son ancestros de `master@{MS[:12]}`.

| PR | HEAD (PR) | Sucesor en master | Equivalencia acreditada | Commits posteriores en master sobre esos archivos | Riesgo | Decisión |
|---|---|---|---|---|---|---|""")
for n in ['151','150','149','148','147','146','145','143','142','141','140','139','138','137','136','135','134','133']:
    d = dec[n]; r = l2[n]
    succ = ' + '.join(Cm(s) for s in d['sucesor'])
    w(f"| {P(n)} | {Cm(d['pr_head'])} | {succ} | {t(d['equivalencia'])} | {r['master_commits_since_on_files']} | {t(d['riesgo'])} | **{d['decision']}** |")
w("""
**Seguridad (#139, #141 y #146):** cerrarlas no reintroduce nada, pero **ninguna debe reabrirse, fusionarse ni servir para recuperar código**:
- **#141:** su `api/share.js` acepta `RUBIK_RENDER_TOKEN` para publicar. Master exige `RUBIK_SHARE_TOKEN` desde GOV-08 S1 (#187).
- **#139 y #146:** su `api/render.js` no tiene los límites de acceso y gasto D1 (`14419c2`, `7ac9b34`).

El aviso va en el comentario de cierre de cada una. **Ninguna PR de L2 se ha cerrado.**

**Orden propuesto, si se autoriza:** de la cima de cada pila hacia abajo, sin borrar ramas:
- #151 → #150;
- #149 → #148 → #147 → #146 → #145 → #143 → #142 → #141 → #140 → #139 → #138 → #137 → #136 → #135 → #134 → #133.

### L3 · Preparado, NO ejecutado (20 PR históricas)

Método:
1. Líneas añadidas **y borradas** de cada PR, buscadas en el squash `f3d7678` (#96), con `l3.py`.
2. Blob por archivo, comparado con el squash y con master.
3. Similitud (`difflib`) de cada línea residual con la línea más parecida del mismo archivo, con `l3-residual.py`.
4. **Ejecución en el `master` actual de las pruebas que añadió o modificó cada PR** (`run-one.sh`). Se usan las versiones de master; la columna «idéntica» indica si la prueba de master es la misma que la de la PR.

`f3d7678` es ancestro de master.

| PR | HEAD (PR) | Grupo | Evidencia | Pruebas sobre master | Decisión |
|---|---|---|---|---|---|""")
order3 = ['90','88','87','86','85','84','83','82','81','80','79','78','76','75','74','73','72','71','70','36']
for n in order3:
    d = dec[n]
    tt = '<br>'.join(f"`{x['test'].split('/')[-1]}`: " + ('pendiente' if x['rc']=='pendiente' else (f"{x['pass_'] or '?'} ok" + (f" / {x.get('asserts',0)} aserciones fallidas" if x.get('asserts') else '') + (f" / {x.get('timeouts',0)} cortes por tiempo" if x.get('timeouts') else '') + (' (suite cortada a los 40 min)' if x['rc']=='124' else '') + (' · repetida en solitario' if x.get('rerun') else ''))) + (' · idéntica' if x['identical_to_pr'] else '') for x in d['tests']) or 'Sin pruebas (documentación)'
    w(f"| {P(n)} | {Cm(d['pr_head'])} | {d['grupo']} | {t(d['equivalencia'])} | {tt} | **{d['decision']}** |")
groups = {}
for n in order3: groups.setdefault(dec[n]['grupo'], []).append('#'+n)
w('\n**Resumen por grupo:**\n')
for k, v in groups.items(): w(f'- **{k}:** {", ".join(v)}')
rr = os.path.exists(f'{D}/l3-test-logs/rerun/summary.tsv') and 'DONE' in open(f'{D}/l3-test-logs/rerun/summary.tsv').read()
w("""
**Por qué #71 y #86 quedan en REVISAR:** su suite `journey-orientation.browser.test.cjs` (la de master es idéntica a la de #86) da en `master@f5c08c7` 11 casos en verde y 6 fallos de aserción. Los 6 comprueban rótulos y jerarquía visual que master cambió **a propósito después**:
- la pestaña «Distribuir» pasó a «Diseñar» con HOM-01 (`5b5c874`, 09/11);
- el botón de la guía (`guidePrimary`) ya no es el único con estilo dominante;
- la guía de móvil mide 176 px y la prueba exige 170 o menos.

Lo que esta suite comprueba sigue funcionando: el siguiente paso al subir una imagen, el regreso a una tarea ya hecha, el conflicto en dúplex, el ejemplo y la cabecera guiada en 2D, 3D y con dos plantas. **Ningún workflow de CI ejecuta esta suite**, así que es deuda de pruebas de `master`, no código perdido de las PR.

Cerrar #71 o #86 no cambia nada de esto. Lo que conviene decidir aparte es si se actualiza o se retira esa suite de `master`. Por prudencia no las marco APTA hasta que el propietario lo vea.

**Cortes por tiempo:** en la tanda paralela (2 suites 3D a la vez, Chromium con SwiftShader), `browser.test.cjs` y `presentation.browser.test.cjs` tuvieron cancelaciones por tiempo, **sin ningún fallo de aserción**. `presentation.browser` se cortó además a los 40 minutos.
""" + ("Se repitieron en solitario: el resultado figura en la tabla («repetida en solitario»)." if rr else "**La repetición en solitario de las dos suites estaba en curso al generar este documento.**") + """
""")
w("""
**Aviso:** una coincidencia de líneas del 98–100 % no se ha tomado como prueba de equivalencia funcional. La decisión APTA exige además:
- que las líneas residuales estén explicadas una a una;
- que las pruebas propias de la PR sigan existiendo y pasen hoy en master.

Donde una suite falla, la decisión es REVISAR, con la causa abajo.

**Orden propuesto, si se autoriza:** primero las apiladas (#86 → #76 → #73 → #71; #81 → #78), después el resto. Sin borrar ramas. **Ninguna PR de L3 se ha cerrado.**
""")
open(f'{D}/exec-section.md','w').write('\n'.join(o)+'\n')
print('ok')

#!/usr/bin/env python3
"""Añade al CSV del triaje los SHA completos, los enlaces, el estado de la última comprobación, el resultado de L1
y las decisiones de L2 y L3; y escribe el MD de ejecución. Uso: python3 -I augment.py"""
import csv, json, os
D = os.path.dirname(os.path.abspath(__file__))
U = 'https://github.com/Juanmaes83/floorplan-3d'
dj = json.load(open(f'{D}/decisions.json')); dec = dj['decisions']; WHEN = dj['when']; MS = dj['master']
l1 = json.load(open(f'{D}/l1-result.json'))
state = {l.split('\t')[0]: l.rstrip('\n').split('\t') for l in open(f'{D}/state-github.tsv') if not l.startswith('master')}
rows = list(csv.DictReader(open(f'{D}/PR_TRIAGE_RUBIK_2026-11-13.csv')))
cols = list(rows[0].keys())
new = ['pr_url','head_sha_completo','estado_github','ultima_comprobacion','decision_lote','sucesor_sha_completo','sucesor_url','evidencia_adicional','resultado_l1']
for r in rows:
    n = r['pr']; s = state.get(n); d = dec.get(n, {})
    r['pr_url'] = f'{U}/pull/{n}'
    r['head_sha_completo'] = s[1] if s else ''
    if n in l1['closed']:
        c = l1['closed'][n]
        r['estado_github'] = f"CERRADA SIN FUSIONAR ({c['closed_at']})"
        r['resultado_l1'] = f"Cerrada en L1. Comentario: {c['comment']}. Rama conservada en {c['branch_after']}"
        r['head_sha_completo'] = c['head']
        r['comentario_cierre'] = f"PUBLICADO el {c['closed_at'][:10]} con el texto autorizado por el propietario: {c['comment']}"
        r['decision_lote'] = 'L1: EJECUTADA (cerrada sin fusionar)'
    else:
        r['estado_github'] = 'ABIERTA' + ('' if s and s[2]=='sin_cambios' else f' · HEAD CAMBIADO desde el triaje ({s[2] if s else "?"})')
        r['resultado_l1'] = ''
        rc = json.load(open(f'{D}/recheck.json')) if os.path.exists(f'{D}/recheck.json') else {}
        if n in rc.get('auto_merged', {}): r['estado_github'] = f"MERGED por contención en #219 ({rc['auto_merged'][n]})"
        if n == '219' and rc: r['estado_github'] = 'MERGED en master@10e025b (2026-11-13T14:57:59Z)'
    r['ultima_comprobacion'] = f'{WHEN} · master@{MS}'
    if d:
        r['decision_lote'] = f"{d['lote']}: {d['decision']}" + (f" ({d['grupo']})" if d.get('grupo') else '')
        sc = d['sucesor'] if isinstance(d['sucesor'], list) else []
        if not sc and 'f3d7678' in d['sucesor']: sc = ['f3d76787061569624f57021347085bb1ec846372']
        r['sucesor_sha_completo'] = ' + '.join(sc)
        r['sucesor_url'] = ' '.join(f'{U}/commit/{x}' for x in sc)
        tests = '; '.join(f"{t['test']}: rc={t['rc']} pass={t['pass_']} fail={t['fail']}" for t in d.get('tests', []))
        r['evidencia_adicional'] = d['equivalencia'] + (f' | Pruebas en master: {tests}' if tests else '') + (f" | SEGURIDAD: {d['seguridad']}" if d.get('seguridad') else '')
        r['comentario_cierre'] = d['comentario']
        r['riesgo_cerrar'] = d['riesgo'] if d['lote']=='L2' else r['riesgo_cerrar']
    else:
        for k in ('sucesor_sha_completo','sucesor_url','evidencia_adicional'): r[k] = ''
        r.setdefault('decision_lote', '')
        if n not in l1['closed']: r['decision_lote'] = ''
    if n == '36' and d:
        r['sucesor_sha_completo'] = '5c24490 + 61efd05'
with open(f'{D}/PR_TRIAGE_RUBIK_2026-11-13.csv','w',newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols + [c for c in new if c not in cols]); w.writeheader(); w.writerows(rows)
print('csv ok', len(rows))

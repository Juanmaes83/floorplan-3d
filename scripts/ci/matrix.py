import json,sys,pathlib
j=json.load(open(sys.argv[1]));out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
rows=['# Matriz de cobertura observada','','Generada del árbol Git. Los comandos, matrices, entornos y dependencias permanecen en el inventario JSON. No acredita ejecución.','','| Workflow | Jobs | Tests explícitos/expandidos |','|---|---:|---:|']
for p,w in j['workflows'].items():rows.append('| '+p+' | '+str(len(w['jobs']))+' | '+str(len(w['tests']))+' |')
(out/'coverage.md').write_text('\n'.join(rows)+'\n')
# Preserve commands and environment definitions, not runtime environment values.
summary={k:j[k] for k in ['workflows','unresolvedOwnership','dependencies','uncertainFiles','tests','sha'] if k in j}
(out/'inventory.json').write_text(json.dumps(summary,indent=2))

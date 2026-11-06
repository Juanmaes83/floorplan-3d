'use strict';
/* Genera matriz-pruebas.md a partir de resultados.json (+ resultados-v4-hallazgos.json y el resumen de regresión). */
const fs=require('node:fs'),path=require('node:path');
const OUT=process.argv[2]||path.join(__dirname,'..','..','docs','qa','ft3d-8-m2-examen-final-2026-11-06');
const load=f=>fs.existsSync(path.join(OUT,f))?JSON.parse(fs.readFileSync(path.join(OUT,f),'utf8')):null;
const R=load('resultados.json'),V=load('resultados-v4-hallazgos.json');
const cell=x=>String(x??'').replace(/\|/g,'\\|').replace(/\n/g,' ').slice(0,220);
const obs=c=>c.status==='PASS'?'':cell(c.why||(typeof c.observed==='string'?c.observed:JSON.stringify(c.observed)));
let md=`# Matriz de pruebas — Examen final M2/S4\n\n**SHA examinado:** \`${R.codigoSha}\` · **Navegador:** ${R.navegador} · **Generada:** ${R.fecha}\n\n`;
const sum=(r)=>Object.entries(r.resumenComprobaciones).map(([k,v])=>`${k} ${v}`).join(' · ');
md+=`| Conjunto | Escenarios | Comprobaciones |\n|---|---|---|\n| Examen (EX-01…EX-13) | ${Object.entries(R.resumenEscenarios).map(([k,v])=>`${k} ${v}`).join(' · ')} | ${sum(R)} |\n`;
if(V)md+=`| Vídeo 4 (reproducción de hallazgos) | ${Object.entries(V.resumenEscenarios).map(([k,v])=>`${k} ${v}`).join(' · ')} | ${sum(V)} |\n`;
md+=`\nEstados: PASS (cumple), FAIL (defecto), PARTIAL (cubierto en parte; motivo indicado), BLOCKED (no ejecutable por causa externa), NOT_RUN (fuera de este examen; motivo indicado).\n`;
for(const [titulo,data] of [['Examen',R],['Vídeo 4',V]]){if(!data)continue;
 for(const s of data.escenarios){md+=`\n## ${s.id} · ${s.titulo} — **${s.status}**\n\nÁrea: ${s.area}.${s.notes.length?' Notas: '+s.notes.map(cell).join(' / '):''}\n\n| ID | Comprobación | Estado | Observado (si no PASS) |\n|---|---|---|---|\n`;
  for(const c of s.checks)md+=`| ${c.id} | ${cell(c.desc)} | ${c.status} | ${obs(c)} |\n`;}}
if(R.metricas?.length){md+=`\n## Métricas\n\n| Métrica | Valor |\n|---|---|\n`;for(const m of R.metricas)md+=`| ${cell(m.name||m.id||m[0])} | ${cell((m.value??m[1])+' '+(m.unit??m[2]??''))} |\n`;}
const reg=path.join(OUT,'regresion','summary.txt');if(fs.existsSync(reg)){md+=`\n## Regresión de suites existentes (secuencial, sin concurrencia, mismo SHA)\n\n| Suite | rc | PASS | FAIL | omitidas | duración |\n|---|---|---|---|---|---|\n`;
 for(const l of fs.readFileSync(reg,'utf8').trim().split('\n')){const [n,rc,p,f,k,d]=l.split('|');md+=`| ${n} | ${rc.split('=')[1]} | ${p.split('=')[1]} | ${f.split('=')[1]} | ${k.split('=')[1]||0} | ${d} |\n`;}}
fs.writeFileSync(path.join(OUT,'matriz-pruebas.md'),md);console.log('matriz',md.length);

// v1.3 · A17/A18 · FLUJO DE PREPARACIÓN del profesional en el laboratorio, sin servidor y sin exponer el disco:
//   Preparar entrega (página) → selección JSON → node tools/preparar.cjs <seleccion.json> → revisar el ARTEFACTO REAL →
//   reconocer los avisos (la página descarga la selección con los reconocimientos) → node tools/preparar.cjs otra vez →
//   ZIP verificado + registro. La página de revisión abre los BYTES PRODUCIDOS (no una simulación) y su manifiesto.
// Estados (campo «estado» de revision.json y rótulo de la página): bloqueado · pendiente (avisos sin reconocer: se muestra
// el candidato exportado en modo borrador, rotulado) · exportado · obsoleto (las fuentes cambiaron) · error · sin datos.
// Uso: node tools/preparar.cjs <seleccion.json> [dirCandidatos=dist/preparacion]   (código = el del exportador)
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const LAB=path.resolve(__dirname,'..');const [selFile,rootArg]=process.argv.slice(2);
if(!selFile){console.error('Uso: node tools/preparar.cjs <seleccion.json> [dirCandidatos]');process.exit(1);}
const ROOT=path.resolve(rootArg||path.join(LAB,'dist/preparacion'));fs.mkdirSync(ROOT,{recursive:true});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let SEL=null;try{SEL=JSON.parse(fs.readFileSync(selFile,'utf8'));}catch{}
const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15).toLowerCase();
const id=`${String(SEL?.tipo||'seleccion').replace(/[^a-z0-9-]/g,'').slice(0,30)||'seleccion'}-${stamp}`;
const exp=(sel,name)=>{const f=path.join(ROOT,name+'.sel.json');fs.writeFileSync(f,JSON.stringify(sel,null,1));const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),f,path.join(ROOT,name)],{encoding:'utf8'});
 const read=x=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,name)+x,'utf8'));}catch{return null;}};return {code:r.status,res:read('.resultado.json'),rej:read('.rechazo.json'),stderr:r.stderr};};
let estado,main=exp(SEL||{},id+'-cliente'),preview=null;
const motivo=main.rej?.motivo||[];
if(main.code===0)estado='exportado';
else if(main.code===2&&main.rej?.tipo==='obsoleto'||motivo.some(m=>/obsolet/.test(m)))estado='obsoleto';
else if(main.code===2&&main.rej?.tipo==='bloqueado'&&motivo.every(m=>m.startsWith('SIN RECONOCER')))estado='pendiente';
else if(main.code===2&&main.rej?.tipo==='selección inválida'&&!SEL)estado='sin datos';
else if(main.code===2)estado='bloqueado';else estado='error';
// pendiente: se produce el MISMO contenido en modo borrador (rotulado) para revisarlo antes de reconocer
if(estado==='pendiente'){preview=exp({...SEL,modo:'borrador'},id+'-borrador');if(preview.code!==0)estado='bloqueado';}
const cand=estado==='exportado'?id+'-cliente':estado==='pendiente'?id+'-borrador':null;
const man=cand?JSON.parse(fs.readFileSync(path.join(ROOT,cand,'MANIFIESTO.json'),'utf8')):null;
const dig=cand?JSON.parse(fs.readFileSync(path.join(ROOT,cand+'.digest.json'),'utf8')):null;
const avisos=(main.rej?.gates||[]).filter(g=>g.s==='warn');
const ROT={exportado:['ok','Exportada y verificada','La carpeta, el ZIP de reparto y su resumen externo están listos. Lo que ves abajo son los bytes exactos que recibirá el cliente.'],
 pendiente:['warn','Pendiente de reconocer avisos','Abajo, el candidato real en modo BORRADOR (rotulado). Revísalo, marca los avisos que aceptas y descarga la selección; vuelve a ejecutar la preparación para exportar en modo cliente.'],
 bloqueado:['block','Bloqueada','Hay un fallo que ningún reconocimiento salta. Corrige la causa y vuelve a preparar.'],
 obsoleto:['block','Obsoleta','Las fuentes han cambiado desde que se compuso o se eligió el contenido. Vuelve a componer y a preparar la selección.'],
 error:['block','Error del entorno','La exportación no ha podido completarse (herramientas, destino o verificación). No hay ningún candidato válido.'],
 'sin datos':['info','Sin datos','No hay una selección legible.']}[estado];
const page=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisar entrega, ${esc(SEL?.tipo||'')}</title>
<style>:root{--ink:#1f2326;--muted:#5b6266;--rule:#d9dcdc;--surface:#f4f5f4;--paper:#fff;--ok:#2f6e4a;--warn:#7a5200;--block:#9b2c2c;--action:#1f5a66}*{box-sizing:border-box}
body{margin:0;font:15px/1.5 system-ui,sans-serif;color:var(--ink);background:var(--surface)}.app{display:grid;grid-template-columns:minmax(340px,420px) 1fr;min-height:100vh}
aside{background:var(--paper);border-right:1px solid var(--rule);padding:20px 22px 40px;overflow:auto}h1{font-size:20px;margin:0}h2{font-size:15px;margin:18px 0 8px}
.st{display:inline-block;font-weight:700;border-radius:999px;padding:3px 10px;margin:10px 0 6px}.ok{background:#e6f1ea;color:var(--ok)}.warn{background:#fff4dc;color:var(--warn)}.block{background:#f8e1e1;color:var(--block)}.info{background:#e7eef0;color:var(--action)}
ul{padding-left:18px;margin:6px 0}li{margin:3px 0;font-size:13.5px}table{border-collapse:collapse;width:100%;font-size:12px}td{border-top:1px solid var(--surface);padding:4px 6px 4px 0;vertical-align:top}code{font-size:12px;word-break:break-all;color:var(--muted)}
label{display:flex;gap:8px;font-size:13.5px;margin:4px 0}.btn{font:inherit;font-weight:700;border:1px solid var(--action);background:var(--action);color:#fff;border-radius:8px;padding:9px 14px;cursor:pointer;margin-top:8px}a{color:var(--action)}
main{display:flex;flex-direction:column;min-width:0}.bar{padding:10px 16px;background:var(--paper);border-bottom:1px solid var(--rule);font-size:13.5px}iframe{flex:1;border:0;background:#fff;min-height:80vh;width:100%}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}@media (max-width:900px){.app{grid-template-columns:1fr}}</style></head><body><div class="app"><aside>
<h1>Revisar entrega</h1><p style="margin:4px 0 0;color:var(--muted);font-size:13.5px">${esc(SEL?.tipo||'—')} · modo ${esc(SEL?.modo||'—')} · idioma ${esc(SEL?.idioma||'—')}</p>
<p class="st ${ROT[0]}" role="status">${esc(ROT[1])}</p><p style="font-size:13.5px;margin:0">${esc(ROT[2])}</p>
${motivo.length?`<h2>Motivos</h2><ul>${motivo.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>`:''}
${estado==='pendiente'?`<h2>Avisos que reconoces</h2><p style="font-size:13px;color:var(--muted);margin:0">Reconocer un aviso no es una autorización comercial, una licencia ni una revisión humana del contenido: solo deja constancia de que lo has visto.</p>
<form id="ack">${avisos.map(g=>`<label><input type="checkbox" name="r" value="${esc(g.k)}"> <span><b>${esc(g.k)}.</b> ${esc(g.t)}</span></label>`).join('')}<button class="btn" type="submit">Descargar la selección con los reconocimientos</button></form>`:''}
${man?`<h2>Archivos del candidato (${man.files.length} + manifiesto)</h2><table><tbody>${man.files.map(f=>`<tr><td><a href="${esc(cand)}/${esc(f.path)}">${esc(f.path)}</a></td><td>${(f.bytes/1024).toFixed(0)} KB</td><td><code>${f.sha256.slice(0,12)}…</code></td></tr>`).join('')}</tbody></table>
<h2>Paquete</h2><p style="font-size:13.5px;margin:0"><a href="${esc(cand)}.zip">${esc(cand)}.zip</a> (${(dig.zipBytes/1048576).toFixed(1).replace('.',',')} MB)<br>SHA-256 del ZIP: <code>${dig.zipSha256}</code><br>Resumen externo: <a href="${esc(cand)}.digest.json">${esc(cand)}.digest.json</a> (integridad, no firma)</p>`:''}
</aside><main><div class="bar">${cand?`<b>${estado==='exportado'?'Entrega del cliente: bytes exportados':'Candidato en BORRADOR: bytes exportados'}</b> · <a href="${esc(cand)}/index.html" target="_blank">abrir en otra pestaña</a>`:'<b>No hay artefacto que revisar</b>'}</div>
${cand?`<iframe src="${esc(cand)}/index.html" title="Entrega exportada" sandbox="allow-same-origin allow-popups"></iframe>`:''}</main></div>
${estado==='pendiente'?`<script>const SEL=${JSON.stringify(SEL).replace(/</g,'\\u003c')};document.getElementById('ack').addEventListener('submit',e=>{e.preventDefault();const r=[...document.querySelectorAll('[name=r]:checked')].map(x=>x.value);
const s={...SEL,reconocidos:[...new Set([...(SEL.reconocidos||[]),...r])]};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(s,null,1)],{type:'application/json'}));a.download='seleccion-reconocida.json';document.body.append(a);a.click();a.remove();});</script>`:''}</body></html>`;
// v1.4 §6 · RECIBO DE RECETA (interno, junto al candidato; nunca dentro del ZIP del cliente)
let recibo=null;if(SEL?.receta){const RC=require('./recetas.cjs');const SRC=process.env.ENTREGA_SRC||path.join(LAB,'out/v3/entrega');const ctx=RC.contexto(LAB,SRC,null);
 const res=RC.resolver(SEL.receta.key,ctx,SEL.idioma||'es');const base=res.seleccion||null;const diff=base?['tipo','capitulos','documentos','omitir'].filter(k=>JSON.stringify(base[k]||[])!==JSON.stringify(SEL[k]||(k==='omitir'?[]:base[k]))):[];
 recibo={schema:'rubik-lab-recibo-receta/1',fecha:new Date().toISOString(),receta:SEL.receta.key,version:SEL.receta.version,versionCatalogo:res.version,catalogo:RC.VERSION,versionCoincide:res.version===SEL.receta.version,
  nombre:res.nombre,nivel:res.nivel,estadoReceta:res.estado,seleccion:diff.length?{aplicada:'modificada por el estudio',cambios:diff}:{aplicada:'la de la receta, sin cambios'},
  fuentes:Object.fromEntries(Object.entries(res.fuentes||{}).map(([k,v])=>[k,v.estado])),alcanceParcial:res.incompleta||[],avisos:[...(res.motivo||[]),...((main.rej?.gates||main.res?.gates||[]).filter(g=>g.s==='warn').map(g=>g.k+': '+g.t))],
  estadoPreparacion:estado,candidato:cand?{nombre:cand,zip:cand+'.zip',zipSha256:dig.zipSha256,manifestSha256:dig.manifestSha256}:null,
  alcance:'Recibo interno del laboratorio. El ZIP del cliente no lo contiene; su manifiesto no cambia de esquema.'};
 fs.writeFileSync(path.join(ROOT,id+'.recibo-receta.json'),JSON.stringify(recibo,null,1));}
const rev=path.join(ROOT,id+'.revisar.html');fs.writeFileSync(rev,page);
const info={schema:'rubik-lab-preparacion/1',id,estado,recibo:recibo?id+'.recibo-receta.json':null,candidato:cand,revisar:path.relative(LAB,rev),motivo,codigo:main.code};fs.writeFileSync(path.join(ROOT,id+'.revision.json'),JSON.stringify(info,null,1));
console.log(JSON.stringify(info,null,1));process.exit(main.code);

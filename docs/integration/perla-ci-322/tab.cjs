// Decisión 2 · 820×1180 con panel abierto: Propiedades y Biblioteca reciben el clic; un diálogo abierto queda encima y bloquea el fondo.
const {chromium}=require('playwright');(async()=>{const s=await require(process.env.SERVE||'../probe/serve.cjs')(process.argv[2]);const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:1180},hasTouch:true});const out={};
await p.goto(`http://localhost:${s.address().port}/`);await p.waitForFunction(()=>document.documentElement.dataset.editorReady==='true',null,{timeout:120000});await p.locator('#welcomeExample').click();await p.waitForTimeout(1200);
const open=sel=>p.evaluate(s=>document.querySelector(s).classList.contains('open'),sel);
const hit=id=>p.evaluate(id=>{const r=document.getElementById(id).getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!h&&!!h.closest('#'+id);},id);
if(!(await open('aside.right')))await p.locator('#tgPanel').click();
out.panelAbierto=await open('aside.right');out.propiedadesRecibeClic=await hit('tgPanel');out.bibliotecaRecibeClic=await hit('tgLib');
await p.locator('#tgPanel').click();out.propiedadesCierraPanel=!(await open('aside.right'));await p.locator('#tgPanel').click();out.propiedadesReabre=await open('aside.right');
await p.locator('#tgLib').click();out.bibliotecaAbre=await open('aside.lib');
await p.screenshot({path:process.argv[3]+'/tableta-820x1180-paneles.png'});
await p.evaluate(()=>document.getElementById('projectsBtn').click());await p.waitForTimeout(600);
const d=await p.evaluate(()=>{const d=[...document.querySelectorAll('dialog[open]')].pop();if(!d)return null;const r=document.getElementById('tgPanel').getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{id:d.id,modal:d.matches(':modal'),encimaDeLaBotonera:!!h&&!h.closest('#mobileDock')};});
out.dialogo=d;let fondo='bloqueado';try{await p.locator('#tgPanel').click({timeout:2000,trial:true});fondo='accesible';}catch{}out.fondoConDialogo=fondo;
await p.screenshot({path:process.argv[3]+'/tableta-820x1180-dialogo.png'});console.log(JSON.stringify(out));await b.close();s.close();})();

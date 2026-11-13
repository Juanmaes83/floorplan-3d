'use strict';
/* UX-07 · apertura del comparador desde Variantes (handoff del adaptador): el laboratorio recibe dos entradas de la
   biblioteca REAL de este navegador, las compara en solo lectura y, si no existen, lo dice sin mostrar nada. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),V=require('../js/variants-compare-adapter.js'),L=require('../js/project-library.js');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
function seed(){const m=new Map(),storage={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
  const lib=L.load(storage,F.before());lib.variant(F.before(),'Reforma A');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());
  const e=F.after();e.id=v.project.id;e.name=v.project.name;lib.save(e);const group=lib.group(lib.activeId());
  m.set('rubik-budget-v1',JSON.stringify({[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[1].project)}));
  return {storage:Object.fromEntries(m),group};}
const open=async(env,storage,query,opts={})=>{const ctx=await env.browser.newContext(opts);const page=await ctx.newPage();const w=K.watch(page,env.base);
  await page.addInitScript(st=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(st))localStorage.setItem(k,v);sessionStorage.setItem('s','1');},storage);
  await page.goto(env.base+'labs/ux07-ent04/index.html?'+query);await page.waitForFunction(()=>!!window.__ux07);return {ctx,page,w};};

for(const [label,opts] of [['escritorio',{}],['móvil 390×844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]])
test(`${label}: abre la variante frente a su original, con sus presupuestos guardados, sin escribir nada`,{timeout:180000},async()=>{
  const {storage,group}=seed(),{ctx,page,w}=await open(env,storage,V.handoff({beforeId:group[0].id,afterId:group[1].id}),opts);try{
    await page.waitForSelector('#cmpCard:not([hidden])');
    assert.equal(await page.locator('#cmpSource').textContent(),'Origen: biblioteca de este navegador');
    assert.match(await page.locator('#relation').textContent(),/Original y variante/);assert.equal(await page.locator('#changes li').count(),7);
    await page.selectOption('#budgetSel','saved');await page.selectOption('#budgetBeforeSel','saved');await page.getByRole('button',{name:'Preparar dossier'}).click();
    await page.waitForSelector('#dosOut:not([hidden])');assert.equal(await page.evaluate(()=>document.getElementById('bcOut').dataset.status),'complete');
    const after=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
    assert.deepEqual(JSON.parse(after),storage,'la biblioteca y los presupuestos no cambian (mismas claves y mismos valores)');
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
  }finally{await ctx.close();}
});

test('entradas que no están en la biblioteca: se dice cuáles y no se muestra ninguna comparación',{timeout:120000},async()=>{
  const {storage,group}=seed(),{ctx,page,w}=await open(env,storage,V.handoff({beforeId:group[0].id,afterId:'prj_no-existe'}));try{
    await page.waitForFunction(()=>document.getElementById('srcError').textContent.length>0);
    assert.match(await page.locator('#srcError').textContent(),/No están en la biblioteca de este navegador: prj_no-existe/);
    assert.equal(await page.evaluate(()=>document.getElementById('cmpCard').hidden&&!window.__ux07.comparison),true);
    assert.deepEqual(w.errors,[]);
  }finally{await ctx.close();}
});

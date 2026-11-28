// «Tu proyecto cobra vida» (claude/pelicula-efectos, fuera de #324): Home junto a «Dibujo vivo» y Entregar → Vídeo junto a P1.
// Escritorio y móvil, ES y EN: orden, selector (ratón y teclado), requisitos sobre el proyecto real, previa ligera del guion,
// estimación honesta, confirmar/cancelar sin iniciar nada, sin desbordes y sin chino visible.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const CJK=/[㐀-鿿豈-﫿]/;
before(async()=>{server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://l').pathname),f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
for(const vp of [{width:1440,height:900,tag:'escritorio'},{width:390,height:844,tag:'movil'}])for(const lang of ['es','en'])
test(`Home y Entregar · ${vp.tag} · ${lang}`,{timeout:180000},async t=>{
 const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.width<1100,hasTouch:vp.width<1100});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
 await page.addInitScript(l=>{try{localStorage.setItem('rubik-sota-floorplan-lang',l);}catch{}},lang);
 await page.goto(url);
 if(lang==='en')await page.evaluate(()=>window.setLang?.('en'));
 await page.waitForSelector('#peliculaEfectosHome');
 // Home: la ficha va justo después de «Dibujo vivo», con los tres nombres y sin vídeo inventado.
 assert.deepEqual(await page.evaluate(()=>{const c=[...document.querySelectorAll('#welcomeInAction .demo-card')].map(x=>x.dataset.demo);return c.slice(c.indexOf('dibujo-vivo'),c.indexOf('dibujo-vivo')+2);}),['dibujo-vivo','pelicula-efectos']);
 const names=lang==='en'?['Piece by piece','Open model','From the landscape']:['Pieza a pieza','Maqueta abierta','Desde el paisaje'];
 for(const [i,id] of ['pieza-a-pieza','maqueta-abierta','desde-el-paisaje'].entries())assert.equal((await page.locator('#peliculaTab-'+id).textContent()).trim(),names[i]);
 assert.equal(await page.locator('#peliculaEfectosHome video').count(),0,'sin MP4 aprobado no hay vídeo');
 await page.locator('#peliculaTab-maqueta-abierta').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#peliculaTab-desde-el-paisaje').getAttribute('aria-checked'),'true','flechas del teclado');
 // «Preparar con mi proyecto» → Entregar → diálogo del efecto elegido.
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.evaluate(()=>window.RubikPeliculaEfectos.openDeliver('desde-el-paisaje'));await page.waitForSelector('#peliculaEfectosDialog[open]');
 assert.equal(await page.evaluate(()=>{const c=document.querySelector('#peliculaEfectosCard');return c?.previousElementSibling?.dataset.module;}),'presentation','Entregar: junto a P1');
 assert.equal(await page.locator('#peliculaReq [data-req="site"]').getAttribute('class'),'missing');assert.equal(await page.locator('#peliculaConfirm').isDisabled(),true,'sin emplazamiento no se prepara');
 await page.locator('#peliculaDlgTab-maqueta-abierta').click();assert.equal(await page.locator('#peliculaConfirm').isDisabled(),false);
 assert.match(await page.locator('#peliculaEstimate').textContent(),lang==='en'?/Estimate not available/:/Estimación no disponible/);
 await page.locator('#peliculaPreviewPlay').click();await page.waitForFunction(()=>document.querySelector('#peliculaPreview')?.dataset.played==='false');
 await page.locator('#peliculaConfirm').click();assert.equal(await page.evaluate(()=>document.querySelector('#peliculaEfectosDialog').dataset.state),'confirm');
 const mu=page.locator('#peliculaMuestra');assert.equal(await mu.getAttribute('data-frames'),'312-587','muestra de Maqueta abierta: mobiliario → entrada (13–24,5 s)');assert.match(await mu.innerText(),/rodar\.sh muestra|rodar\.sh muestra/);
 await page.locator('#peliculaCancel').click();assert.equal(await page.evaluate(()=>document.querySelector('#peliculaEfectosDialog').dataset.state),'choose','cancelar no inicia nada');
 assert.equal(await page.evaluate(()=>window.RubikPeliculaEfectos._last||null),null,'nada preparado tras cancelar');
 assert.equal(await page.evaluate(()=>{const d=document.querySelector('#peliculaEfectosDialog').getBoundingClientRect();return d.left>=0&&d.right<=innerWidth+1;}),true,'sin desborde');
 assert.doesNotMatch(await page.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(errors,[]);
});

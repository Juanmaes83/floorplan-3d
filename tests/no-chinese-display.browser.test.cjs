// REGLA PERMANENTE (propietario, 20/11/2026): en español o inglés NUNCA se muestra texto en chino.
// Recorre la interfaz REAL con el proyecto de ejemplo (que guarda sus nombres en chino) en ES y EN: plano, panel de cada
// mueble y de cada estancia, diálogo de interiores R03 con sus holguras y sección de techo R02-A. Falla con el texto exacto
// y su sitio si aparece un solo carácter CJK visible. La fuente única de nombres visibles es window.FloorPlanDisplayName.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

// Texto VISIBLE con CJK (nodos de texto con caja visible, más title/aria-label/placeholder/value de controles visibles).
// ÚNICA excepción, explícita: #langBtn muestra el NOMBRE del idioma al que cambia («中文»), en su propio idioma, para
// que quien lo hable pueda encontrarlo (pendiente de confirmación del propietario). Nada más se exime.
const FIND=()=>{const EXEMPT=new Set(['langBtn']);const re=/[⺀-⿿　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/,out=[];
 const visible=el=>{if(!el||!el.isConnected)return false;const st=getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden')return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let n;(n=w.nextNode());){const p=n.parentElement;if(!p||p.closest('script,style,template'))continue;if(EXEMPT.has(p.id))continue;if(re.test(n.nodeValue)&&visible(p))out.push({where:p.closest('[id]')?.id||p.tagName,text:n.nodeValue.trim().slice(0,60)});}
 for(const el of document.querySelectorAll('[title],[aria-label],[placeholder],input,select,option')){for(const v of [el.title,el.getAttribute('aria-label'),el.placeholder,el.tagName==='INPUT'?el.value:'',el.tagName==='SELECT'?el.selectedOptions?.[0]?.textContent:''])if(v&&re.test(v)&&visible(el.tagName==='OPTION'?el.parentElement:el))out.push({where:el.id||el.tagName,text:String(v).slice(0,60)});}
 for(const t of document.querySelectorAll('svg text'))if(re.test(t.textContent)&&visible(t))out.push({where:'svg:'+(t.closest('[id]')?.id||''),text:t.textContent.slice(0,60)});
 return out;};

for(const lang of ['es','en'])
test(`sin chino visible en ${lang.toUpperCase()}: plano, paneles, interiores R03 con holguras y techo R02-A`,{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 await page.evaluate(l=>setLang(l),lang);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>LANG),lang);
 const found=[];const scan=async where=>{for(const f of await page.evaluate(FIND))found.push({at:where,...f});};
 await scan('plano');
 const ids=await page.evaluate(()=>({furn:project.objects.map(o=>o.id),rooms:project.rooms.map(r=>r.id)}));
 for(const id of ids.furn){await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},id);await page.waitForTimeout(60);await scan('panel mueble '+id);}
 for(const id of ids.rooms){await page.evaluate(id=>{select({kind:'room',id});drawer('panel',true);},id);await page.waitForTimeout(60);await scan('panel estancia '+id);}
 for(const id of await page.evaluate(()=>project.objects.filter(o=>RubikCabinetBridge.isCabinet(o)).map(o=>o.id))){
  await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},id);await page.waitForTimeout(150);
  await page.locator('#aInterior').first().click();await page.locator('.r03-rubik-dialog').waitFor();await scan('interior R03 '+id);await page.evaluate(()=>RubikCabinetRubikUI.close());}
 assert.deepEqual(found,[],'texto chino visible:\n'+found.slice(0,15).map(f=>`${f.at} · ${f.where} · «${f.text}»`).join('\n'));
 assert.deepEqual(errors,[]);
});

test('FloorPlanDisplayName: traducción, red de seguridad por tipo y genérico; en chino se respeta el original', async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const r=await page.evaluate(()=>{const o={};for(const l of ['es','en','zh']){setLang(l);o[l]=[FloorPlanDisplayName('衣柜','wardrobe'),FloorPlanDisplayName('不存在的名字','wardrobe'),FloorPlanDisplayName('不存在的名字','tipo-inexistente'),FloorPlanDisplayName('Mi armario','wardrobe')];}setLang('es');return o;});
 assert.deepEqual(r.es,['Armario','Armario','Elemento','Mi armario']);
 assert.equal(r.en[0],'Wardrobe');assert.equal(r.en[2],'Item');assert.equal(r.en[3],'Mi armario');
 assert.equal(r.zh[1],'不存在的名字','en chino se muestra el original');
 for(const v of [...r.es,...r.en])assert.doesNotMatch(v,/[㐀-鿿]/);
});

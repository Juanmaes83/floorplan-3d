'use strict';
// E3 · residual E3-D · «antes» en navegador con la autoridad REAL (FloorPlanProjectViews): dos tomas reales con distinto
// takenAt (Date) dan la MISMA huella con el núcleo y el vistasInfo() de e9bd6bf, y distinta con el núcleo actual.
// Uso: node tools/e3-tomas-antes-navegador.cjs <copiaAislada> <dirNucleoAnterior> [salida.json]
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [copia,antes,salida]=process.argv.slice(2);if(!copia||!antes){console.error('Uso: node tools/e3-tomas-antes-navegador.cjs <copia> <dirAnterior> [salida.json]');process.exit(1);}
const ROOT=path.resolve(copia),LAB=path.resolve(__dirname,'..'),OUT=salida||path.join(LAB,'evidence/e3/e3-tomas-antes-navegador.json');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const OLD=fs.readFileSync(path.join(path.resolve(antes),'e3-core.js'),'utf8').replace("root.RubikStudioE3=api","root.RubikStudioE3Antes=api");
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/__antes.js'){s.writeHead(200,{'content-type':'text/javascript'});s.end(OLD);return;}
 if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return;}
 s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(0,async()=>{
 const port=srv.address().port;const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const ext=[];
 await pg.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='f0-2b.localhost'){ext.push(u.href);return r.abort();}return r.continue();});
 await pg.goto(`http://f0-2b.localhost:${port}/`);await pg.waitForFunction(()=>window.FloorPlanProjectViews&&window.RubikStudioE3,null,{timeout:60000});
 await pg.waitForFunction(()=>window.FloorPlanPersistenceEditor?.session,null,{timeout:60000});
 // Igual que tools/e3-ui-qa.cjs: la bienvenida modal se cierra con Escape (como una persona) antes de usar el editor.
 await pg.waitForFunction(()=>document.getElementById('welcomeDialog')?.open,null,{timeout:6000}).catch(()=>{});
 for(let i=0;i<3&&await pg.evaluate(()=>!!document.getElementById('welcomeDialog')?.open);i++){await pg.keyboard.press('Escape');await pg.waitForTimeout(200);}
 await pg.addScriptTag({url:'/__antes.js'});
 const toma=async()=>{const a=await pg.evaluate(()=>FloorPlanProjectViews.takenAt?.getTime?.()??null);await pg.evaluate(()=>{FloorPlanProjectViews.prepare();});
  await pg.waitForFunction(a=>FloorPlanProjectViews.status()==='ready'&&FloorPlanProjectViews.takenAt?.getTime()!==a,a,{timeout:90000});
  return pg.evaluate(async()=>{const hex=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const V=FloorPlanProjectViews,items=V.current(),A={ok:true,obra:{},variantes:[]};
   const viejo={estado:V.status(),n:items.length,id:{takenAt:V.takenAt,source:V.source,items:items.map(v=>[v.id,v.label])}};// vistasInfo() de e9bd6bf
   return {takenAt:V.takenAt.toISOString(),antes:(await RubikStudioE3Antes.huellasFuentes(A,{vistas:viejo},hex)).vistas3d,ahora:(await RubikStudioE3.huellasFuentes(A,{vistas:RubikStudioE3.vistasDesde(V)},hex)).vistas3d};});};
 const t1=await toma(),t2=await toma();await b.close();srv.close();
 const o={schema:'rubik-lab-e3-tomas-antes-navegador/1',fecha:new Date().toISOString(),navegador:'chromium',autoridad:'FloorPlanProjectViews (copia aislada de master 130ba24 + parche)',
  nucleoAnterior:'e9bd6bfd9e5053c56dd151a289f5ed1e4054a941',tomas:[t1,t2],antesMismaHuella:t1.antes===t2.antes,ahoraHuellasDistintas:t1.ahora!==t2.ahora,externas:ext.length};
 fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');console.log(JSON.stringify({antesMismaHuella:o.antesMismaHuella,ahoraHuellasDistintas:o.ahoraHuellasDistintas,externas:o.externas}));
 process.exit(o.antesMismaHuella&&o.ahoraHuellasDistintas&&!ext.length?0:2);});

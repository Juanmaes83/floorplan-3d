// Ejecuta un procedimiento de auditoría (async page=>{...}) contra un árbol del repo. Uso: node run.cjs <repo> <proc.js> [ancho alto]
const path=require('path'),fs=require('fs/promises'),{createServer}=require('http'),{chromium}=require('playwright');
const [root,...procs]=process.argv.slice(2),W=path.join(__dirname,'ws');
(async()=>{const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const s=createServer(async(q,r)=>{try{const p=decodeURIComponent(new URL(q.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(await fs.readFile(f));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.route('**/*',r=>{const u=r.request().url();if(/^(http:\/\/127\.0\.0\.1|blob:|data:)/.test(u))return r.continue();return r.abort();});
await page.goto(`http://127.0.0.1:${s.address().port}/`);
const base=`http://127.0.0.1:${s.address().port}/`;const outs={};
for(const proc of procs){const src=(await fs.readFile(proc,'utf8')).replaceAll('AUDIT_WORKSPACE',W).replaceAll('http://127.0.0.1:18765/',base);const fn=eval('('+src.trim().replace(/;\s*$/,'')+')');
 let out;try{out=await fn(page);}catch(e){out={ERROR:String(e.message||e).slice(0,1500)};}outs[path.basename(proc)]=out;}
console.log(JSON.stringify({result:outs,pageErrors:errs.slice(0,5)},null,1));await b.close();s.close();})();

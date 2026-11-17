// i18n · extrae las cadenas visibles (nodos de texto y alt/aria-label/title) de los documentos y la web compuestos, y separa
// los DATOS DEL PROYECTO (nombres de estancias, materiales, objetos, partidas, estudio, título, texto del estudio), que no se
// traducen. Salida: i18n/cadenas.json (lista ordenada) para construir/actualizar el diccionario i18n/en.json.
// Uso: node i18n-extract.cjs <outV> <snapshotDir>
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [outV,snapDir]=process.argv.slice(2).map(x=>path.resolve(x));const S=JSON.parse(fs.readFileSync(path.join(snapDir,'snapshot.json'),'utf8'));
const DOCS=['architecture-book','interior-book-v3','materials-furniture-book-v3','commercial-proposal-client-v3','real-estate-sheet-v3','real-estate-sheet-v3-sin-presupuesto','entrega-integral'];
const WEB=fs.readdirSync(path.join(outV,'entrega')).filter(f=>f.endsWith('.html')).map(f=>'entrega/'+f);
const data=new Set([S.project.name,S.brand?.title,S.brand?.intro,S.brand?.profile?.name,S.brand?.profile?.person,S.brand?.profile?.tagline,S.brand?.profile?.email,
 ...S.geometry.rooms.map(r=>r.name),...S.materials.map(m=>m.name),...S.objects.map(o=>o.name),...S.views.map(v=>v.label),...(S.board?.floors||[]).map(f=>f.name),
 ...Object.values(S.budget?.test?.view||{}).flatMap(v=>(v.chapters||[]).flatMap(c=>[c.title,...c.lines.map(l=>l.description)]))].filter(Boolean));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});const all=new Map();
 for(const f of [...DOCS.map(d=>d+'.html'),...WEB]){const file=path.join(outV,f);if(!fs.existsSync(file))continue;const p=await b.newPage();await p.goto('file://'+file);
  const items=await p.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
   while((n=w.nextNode())){if(n.parentElement.closest('script,style'))continue;const t=n.textContent.replace(/\s+/g,' ').trim();if(t)out.push(t);}
   for(const e of document.querySelectorAll('[alt],[aria-label],[title]'))for(const a of ['alt','aria-label','title'])if(e.getAttribute(a))out.push(e.getAttribute(a).replace(/\s+/g,' ').trim());
   out.push(document.title);return out;});
  for(const t of items){if(!/[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(t))continue;if(data.has(t))continue;if(!all.has(t))all.set(t,new Set());all.get(t).add(f);}await p.close();}
 await b.close();const list=[...all].map(([t,fs])=>({t,files:[...fs].length})).sort((a,b)=>a.t.localeCompare(b.t,'es'));
 fs.mkdirSync(path.join(__dirname,'../i18n'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../i18n/cadenas.json'),JSON.stringify({data:[...data],strings:list},null,1));
 console.log('strings',list.length,'chars',list.reduce((s,x)=>s+x.t.length,0),'data',data.size);})().catch(e=>{console.error(e);process.exit(1);});

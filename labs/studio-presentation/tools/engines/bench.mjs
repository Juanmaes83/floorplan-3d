// B3 · E1 PDF engines on the same table: CSS Print (Chromium page.pdf, flowing), Paged.js 0.4.3 (polyfill in Chromium)
// and Typst.ts 0.7.0 (WASM). Rows 1/50/200/500 + one extreme row. Rows are SYNTHETIC test data derived from the
// canonical budget line descriptions (labelled «PRUEBA» with an index): engine behaviour only, never a budget.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';import {compiler,compilePdf} from './typst-wasm.mjs';const {chromium}=createRequire(import.meta.url)('playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),LAB=path.resolve(here,'../..'),out=process.argv[2]||path.join(LAB,'out/v3/b3');fs.mkdirSync(out,{recursive:true});
const S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));
const lines=S.budget.test.view.professional.chapters.flatMap(c=>c.lines);
const INTER=process.env.IFC_FONTS?path.join(process.env.IFC_FONTS,'Inter-Regular.ttf'):new URL('../../vendor/fonts/inter/Inter-Regular.ttf',import.meta.url).pathname;
const INTERB=INTER.replace('Regular','Bold');
const nf=new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const EXTREME='Partida extrema de prueba: '+'descripción muy larga que no cabe en una línea y debe partirse en varias sin salirse de la celda ni de la página; '.repeat(14)+'SuperPalabraSinEspaciosParaComprobarCorteDeLineaSinGuiones'.repeat(3)+' FIN-EXTREMA';
const HUGE='Partida enorme de prueba, más alta que una página: '+'descripción muy larga que no cabe en una página y debe continuar en la siguiente sin perder ninguna línea; '.repeat(90)+' FIN-EXTREMA';
function rows(n,extreme){const r=[];for(let i=0;i<n;i++){const l=lines[i%lines.length];r.push({id:`F-${String(i+1).padStart(4,'0')}`,d:`${l.description} (PRUEBA ${i+1})`,q:nf.format(l.budgetQuantity),p:nf.format(l.unitPrice),t:nf.format(l.subtotalNet)});}
 if(extreme)r.splice(Math.min(3,r.length),0,{id:'F-XTRM',d:extreme==='huge'?HUGE:EXTREME,q:'1,00',p:'0,00',t:'0,00'});return r;}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const css=`@font-face{font-family:Inter;src:url(data:font/ttf;base64,${fs.readFileSync(INTER).toString('base64')})}@font-face{font-family:Inter;font-weight:700;src:url(data:font/ttf;base64,${fs.readFileSync(INTERB).toString('base64')})}
@page{size:210mm 297mm;margin:18mm 16mm 20mm;@bottom-right{content:"Página " counter(page) " de " counter(pages);font:8pt Inter}}
body{font:9pt/1.35 Inter;margin:0;color:#2d332f}h1{font-size:14pt;margin:0 0 4mm}table{width:100%;border-collapse:collapse}thead{display:table-header-group}
th{text-align:left;border-bottom:.35mm solid #2d332f;padding:1.2mm 1.5mm 1.2mm 0}td{border-bottom:.2mm solid #cbc2b3;padding:1.2mm 1.5mm 1.2mm 0;vertical-align:top}td.d{overflow-wrap:anywhere}td:first-child{white-space:nowrap}
td.n,th.n{text-align:right;white-space:nowrap}tr{break-inside:avoid}`;
const html=R=>`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}</style></head><body><h1>Presupuesto, tabla de prueba (${R.length} filas)</h1>
<table><thead><tr><th>Ref.</th><th>Partida</th><th class="n">Cantidad</th><th class="n">Precio</th><th class="n">Importe</th></tr></thead><tbody>${R.map(r=>`<tr><td>${r.id}</td><td class="d">${esc(r.d)}</td><td class="n">${r.q}</td><td class="n">${r.p}</td><td class="n">${r.t}</td></tr>`).join('')}</tbody></table></body></html>`;
const typ=R=>{const s=t=>'['+String(t).replace(/[\\#*_`$<>@\[\]]/g,c=>'\\'+c)+']';
 return `#set page(paper:"a4",margin:(top:18mm,bottom:20mm,x:16mm),footer:context align(right,text(8pt)[Página #counter(page).display() de #counter(page).final().first()]))
#set text(font:"Inter",size:9pt,lang:"es")
#text(14pt,weight:"bold")[Presupuesto, tabla de prueba (${R.length} filas)]
#v(4mm)
#table(columns:(auto,1fr,auto,auto,auto),stroke:(x,y)=>(bottom:if y==0 {0.35mm} else {0.2mm+rgb("#cbc2b3")}),align:(x,y)=>if x>=2 {right} else {left},inset:(x:1.5mm,y:1.2mm),
 table.header([*Ref.*],[*Partida*],[*Cantidad*],[*Precio*],[*Importe*]),
${R.map(r=>`[${r.id}],${s(r.d)},[${r.q}],[${r.p}],[${r.t}],`).join('\n')})`;};
function inspect(file,R){const info=execFileSync('pdfinfo',[file]).toString(),pages=+/Pages:\s+(\d+)/.exec(info)[1];
 const per=[...Array(pages)].map((_,i)=>execFileSync('pdftotext',['-f',String(i+1),'-l',String(i+1),'-layout',file,'-']).toString());const all=per.join('\n');
 const fonts=execFileSync('pdffonts',[file]).toString().split('\n').slice(2).filter(Boolean);
 return {pages,bytes:fs.statSync(file).size,headerOnPages:per.filter(t=>/Partida/.test(t)&&/Importe/.test(t)).length,rowsFound:R.filter(r=>all.includes(r.id)).length,rowsExpected:R.length,
  extremeComplete:!R.some(r=>r.id==='F-XTRM')||all.replace(/\s/g,'').includes('FIN-EXTREMA'),pageNumbers:per.filter((t,i)=>new RegExp(`Página ${i+1} de ${pages}`).test(t)).length,fontsEmbedded:fonts.length>0&&fonts.every(l=>/ yes /.test(l)),fonts:fonts.length};}
const sizes=[1,50,200,500],results=[];
const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});
const PAGED=fs.readFileSync(path.join(here,'../node_modules/pagedjs/dist/paged.polyfill.js'),'utf8');
const tc=await compiler([INTER,INTERB]);
for(const n of sizes)for(const extreme of (n===50?[false,true,'huge']:[false,true])){const R=rows(n,extreme),tag=`${n}${extreme==='huge'?'xx':extreme?'x':''}`;
 for(const engine of ['css-print','pagedjs','typst-wasm']){const file=path.join(out,`${engine}-${tag}.pdf`);const ext=[];let t0=Date.now(),err=null;
  try{if(engine==='typst-wasm'){fs.writeFileSync(file,compilePdf(tc,typ(R)));}
   else{const ctx=await browser.newContext();ctx.on('request',r=>{if(!/^(data|about|blob):/.test(r.url()))ext.push(r.url());});const pg=await ctx.newPage();
    let h=html(R);if(engine==='pagedjs')h=h.replace('</head>',()=>`<script>window.PagedConfig={auto:true,after:()=>{window.__paged=true}};</script><script>${PAGED}</script></head>`);
    await pg.setContent(h,{waitUntil:'load'});await pg.evaluate(()=>document.fonts.ready);if(engine==='pagedjs')await pg.waitForFunction(()=>window.__paged===true,null,{timeout:600000});
    await pg.pdf({path:file,preferCSSPageSize:true,printBackground:true});await ctx.close();}}catch(e){err=String(e.message||e).slice(0,160);}
  const ms=Date.now()-t0;const res={engine,rows:n,extreme,ms,error:err,external:ext.length,...(err?{}:inspect(file,R))};results.push(res);console.log(JSON.stringify(res));}}
await browser.close();fs.writeFileSync(path.join(out,'bench.json'),JSON.stringify({generated:new Date().toISOString(),versions:{chromium:'playwright local',pagedjs:'0.4.3','typst-ts-web-compiler':'0.7.0'},results},null,1));

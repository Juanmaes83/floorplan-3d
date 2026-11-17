// Ampliación · ENTREGA INTEGRAL del profesional al cliente (laboratorio E1). La llama compose.cjs con sus mismos helpers y el
// mismo snapshot: un solo camino de datos. Produce:
//   out/<v>/entrega/index.html            experiencia web de cliente, offline, solo lectura (entrega «integral»)
//   out/<v>/entrega/tipo-<id>.html        la misma experiencia recortada a cada tipo de entrega (7 tipos)
//   out/<v>/entrega/media/, documentos/   imágenes, vídeos y PDF que la web enlaza (rutas relativas, sin red)
//   out/<v>/entrega/entrega.json          registro de la entrega: piezas, origen, SHA-256, qué es orientativo
//   D['entrega-integral']                 la presentación integral paginada (A4 apaisado, portada B), por el QA de siempre
// Regla de oro: RUBIK no inventa nada. Las cifras salen del snapshot; las imágenes IA van siempre junto a una vista del modelo
// y rotuladas; el plan de obra es el de la demo FT3D-8 (mismo proyecto, ejemplo ilustrativo, sin presupuesto); lo que falta se
// escribe. Sin capturas de la interfaz de RUBIK: solo lienzo 3D, vistas del modelo, dibujos y exportaciones del propio producto.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
module.exports=function entrega(C){
 const {S,T,TITLE,date,rev,rooms,counted,area,matById,floors,views,viewBy,VIEW_NOTE,STATUS_AREA,nf,num,eur,esc,plan,axo,doc,fig,
  STUDIO,AREA,INTRO,prof,LOGO,objectRows,roomArea,planPage,coverDrawing,FONT_CSS,b64,outDir,LAB,roomPlan,chapterChart,chapterTotals}=C;
 // v1.3 A11: todo se prepara en una carpeta temporal exclusiva; solo writeWeb() la publica (renombrado) si compose no ha
 // bloqueado nada. La entrega publicada anterior pasa a entrega-anterior/ (se conserva exactamente una).
 const FINAL=path.join(outDir,'entrega'),OUT=fs.mkdtempSync(path.join(outDir,'.entrega-preparacion-')),MEDIA=path.join(OUT,'media'),DOCS=path.join(OUT,'documentos'),A=path.join(LAB,'assets');
 for(const d of [MEDIA,DOCS])fs.mkdirSync(d,{recursive:true});
 const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
 const exists=f=>{try{return fs.statSync(f).size>0;}catch{return false;}};
 const ff=args=>execFileSync('ffmpeg',['-y','-v','error',...args.slice(0,-1),'-map_metadata','-1','-fflags','+bitexact','-flags','+bitexact',args[args.length-1]]);
 const kb=f=>{const b=fs.statSync(f).size;return b>=1048576?(b/1048576).toFixed(1).replace('.',',')+' MB':Math.round(b/1024)+' KB';};
 const reg=[];// registro de piezas
 const jpg=(src,name,w=1600)=>{const dst=path.join(MEDIA,name);if(!exists(src))return null;ff(['-i',src,'-vf',`scale='min(${w},iw)':-2`,'-q:v','3',dst]);reg.push({file:'media/'+name,from:path.relative(LAB,src),sourceSha256:sha(src),sha256:sha(dst)});return 'media/'+name;};
 const dataUri=rel=>rel?'data:image/jpeg;base64,'+b64(path.join(OUT,rel)):null;

 // ---------- piezas ----------
 const V=S.budget?.test?.view?.client||null,BVp=S.budget?.test?.view?.professional||null;
 const viewFile=l=>{const v=S.views.find(x=>x.label===l);return v?path.join(LAB,'snapshot',v.file):null;};
 const renders=(()=>{try{const t=JSON.parse(fs.readFileSync(path.join(LAB,'evidence/render-ia/trazabilidad.json'),'utf8'));return t.pairs;}catch{return [];}})();
 const ai=Object.fromEntries(renders.map((p,i)=>[p.sourceViewLabel,{...p,web:jpg(path.join(LAB,'evidence/render-ia',p.render),`ia-${i+1}.jpg`),exact:p.meanAbsDiff0to255<8}]));
 const VW={};for(const v of S.views)VW[v.label]=jpg(path.join(LAB,'snapshot',v.file),`vista-${v.file.replace(/^.*view-|\.png$/g,'')}.jpg`);
 const drawing=jpg(path.join(A,'dibujo-vivo/00-overview.png'),'dibujo-vivo.jpg',1800);
 const tourDir=path.join(A,'recorrido'),tourVideo=fs.existsSync(tourDir)?fs.readdirSync(tourDir).find(f=>/\.(mp4|webm)$/.test(f)):null;
 const tour=tourVideo?(()=>{const src=path.join(tourDir,tourVideo),dst=path.join(MEDIA,'recorrido.mp4');ff(['-i',src,'-c','copy','-movflags','+faststart',dst]);ff(['-ss','12','-i',dst,'-frames:v','1','-q:v','3',path.join(MEDIA,'recorrido-poster.jpg')]);reg.push({file:'media/recorrido-poster.jpg',from:path.relative(LAB,src),transform:'fotograma del segundo 12 del vídeo',sha256:sha(path.join(MEDIA,'recorrido-poster.jpg'))});
  reg.push({file:'media/recorrido.mp4',from:path.relative(LAB,src),sha256:sha(dst),producer:'RUBIK · Presentar mi vivienda · Grabar vídeo'});return {video:'media/recorrido.mp4',poster:'media/recorrido-poster.jpg',dur:+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',dst]).toString()};})():null;
 const tourFrames=fs.existsSync(tourDir)?fs.readdirSync(tourDir).filter(f=>/^\d\d-.*\.png$/.test(f)).sort().map(f=>({id:'rom_'+f.slice(3,-4),src:jpg(path.join(tourDir,f),'recorrido-'+f.replace('.png','.jpg'),1200)})):[];
 // FT3D-8: exportaciones del producto (vídeo, presentación de solo lectura, manifiesto)
 const ftDir=path.join(A,'ft3d8'),ftFiles=fs.existsSync(ftDir)?fs.readdirSync(ftDir):[];
 const ftVid=ftFiles.find(f=>/\.(mp4|webm)$/.test(f)),ftDoc=ftFiles.find(f=>/\.html$/.test(f)),ftMan=ftFiles.find(f=>/\.json$/.test(f));
 const obra=ftVid?(()=>{const src=path.join(ftDir,ftVid),dst=path.join(MEDIA,'obra.mp4');
  if(/\.mp4$/.test(ftVid))ff(['-i',src,'-c','copy','-movflags','+faststart',dst]);else ff(['-i',src,'-c:v','libx264','-pix_fmt','yuv420p','-crf','26','-movflags','+faststart','-an',dst]);
  const dur=+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',dst]).toString();
  const stills=[.12,.4,.68,.96].map((k,i)=>{const n=`obra-${i+1}.jpg`;ff(['-ss',String(Math.max(0,dur*k-.2)),'-i',dst,'-frames:v','1','-q:v','3',path.join(MEDIA,n)]);reg.push({file:'media/'+n,from:path.relative(LAB,src),transform:`fotograma al ${Math.round(k*100)} % del vídeo`,sha256:sha(path.join(MEDIA,n))});return 'media/'+n;});
  reg.push({file:'media/obra.mp4',from:path.relative(LAB,src),sourceSha256:sha(src),sha256:sha(dst),producer:'RUBIK · Evolución de obra (FT3D-8) · Entrega · Generar vídeo',transcoded:!/\.mp4$/.test(ftVid)});
  return {video:'media/obra.mp4',poster:stills[1],stills,dur};})():null;
 const ftManifest=ftMan?JSON.parse(fs.readFileSync(path.join(ftDir,ftMan),'utf8')):null;
 if(ftDoc){fs.copyFileSync(path.join(ftDir,ftDoc),path.join(DOCS,'obra-presentacion.html'));reg.push({file:'documentos/obra-presentacion.html',from:path.relative(LAB,path.join(ftDir,ftDoc)),sha256:sha(path.join(DOCS,'obra-presentacion.html')),producer:'RUBIK · Evolución de obra (FT3D-8) · Presentación de solo lectura'});}
 const planDemo=(()=>{try{return JSON.parse(fs.readFileSync(path.join(A,'ft3d8-plan-demo.json'),'utf8'));}catch{return null;}})();

 // ---------- documentos que acompañan (PDF ya compuestos por este mismo compositor) ----------
 const DOCLIST=[
  {id:'interior-book-v3',name:'Libro de interiorismo',what:'Estancia por estancia: planta, objetos numerados y vista 3D.'},
  {id:'materials-furniture-book-v3',name:'Libro de materiales y mobiliario',what:'Pavimentos por estancia y una ficha por cada línea del listado de mobiliario.'},
  {id:'commercial-proposal-client-v3',name:'Propuesta económica',what:'Resumen por capítulos y detalle de partidas con precio.'},
  {id:'real-estate-sheet-v3',name:'Ficha inmobiliaria',what:'Una página: vista, cifras con su origen (incluido el coste de la reforma) y planta.'},
  {id:'real-estate-sheet-v3-sin-presupuesto',name:'Ficha inmobiliaria',what:'Una página: vista, cifras con su origen y planta. Sin cifras económicas.'},
  {id:'architecture-book',name:'Libro de arquitectura',what:'Planta general, cuadro de superficies, cada estancia con sus objetos, sección esquemática y fachadas que reconoce el modelo. Sin cotas.'},
  {id:'architecture-sheet-strip',name:'Lámina de arquitectura A3',what:`Planta 1:50 sobre las medidas del modelo${S.project.scale==='estimated'?' (escala estimada)':''}, con cajetín; alzados y secciones no incluidos.`},
  {id:'entrega-integral',name:'Presentación integral (PDF)',what:'Esta misma entrega, paginada para imprimir o adjuntar.'}];
 const docRef=d=>({...d,href:`documentos/${d.id}.pdf`});

 // ---------- tipos de entrega ----------
 const CH={portada:'Portada',concepto:'Concepto',vivienda:'La vivienda',dibujo:'Del dibujo a la imagen',estancias:'Estancia por estancia',materiales:'Materiales',presupuesto:'Presupuesto',obra:'Cómo avanzará la obra',recorrido:'Recorrer la vivienda',decisiones:'Lo que hay que decidir',documentos:'Documentos',procedencia:'De dónde sale cada cosa'};
 const TIPOS=[
  {id:'integral',name:'Documentación integral',lead:'Todo el proyecto en una entrega: la vivienda, sus estancias, materiales, presupuesto, la obra prevista y los documentos.',ch:Object.keys(CH),docs:DOCLIST.map(d=>d.id).filter(d=>d!=='real-estate-sheet-v3-sin-presupuesto')},
  {id:'primera-reunion',name:'Primera reunión',lead:'Un primer vistazo para hablar del proyecto: la distribución, cómo se ve y qué queda por decidir.',ch:['portada','concepto','vivienda','dibujo','estancias','decisiones','documentos','procedencia'],docs:['real-estate-sheet-v3-sin-presupuesto']},
  {id:'propuesta-comercial',name:'Propuesta comercial',lead:'La propuesta del estudio con el presupuesto por capítulos y los documentos que la acompañan.',ch:['portada','concepto','vivienda','estancias','materiales','presupuesto','decisiones','documentos','procedencia'],docs:['commercial-proposal-client-v3','interior-book-v3']},
  {id:'dossier-tecnico',name:'Dossier técnico',lead:'Planta, superficies, materiales y mediciones con precio, para revisar el proyecto con detalle.',ch:['portada','vivienda','estancias','materiales','presupuesto','documentos','procedencia'],docs:['architecture-book','architecture-sheet-strip','materials-furniture-book-v3','commercial-proposal-client-v3']},
  {id:'interiorismo',name:'Presentación de interiorismo',lead:'Cómo se verán las estancias: vistas del modelo, imágenes orientativas, materiales y un recorrido.',ch:['portada','concepto','dibujo','estancias','materiales','recorrido','decisiones','documentos','procedencia'],docs:['interior-book-v3','materials-furniture-book-v3']},
  {id:'inmobiliaria',name:'Presentación inmobiliaria',lead:'La vivienda para presentarla: imagen, cifras con su origen, planta y recorrido.',ch:['portada','vivienda','estancias','recorrido','documentos','procedencia'],docs:['real-estate-sheet-v3-sin-presupuesto']},
  {id:'obra',name:'Explicación de la obra',lead:'Cómo se construirá la vivienda, fase a fase, con un ejemplo ilustrativo del plan de obra.',ch:['portada','vivienda','obra','decisiones','documentos','procedencia'],docs:['architecture-sheet-strip']}];
 // Módulo 02 · Concepto: SOLO el texto que el profesional escribió para esta entrega (FloorPlanBrand, delivery.intro). Si no lo
 // escribió, el capítulo no se compone y sale de todas las modalidades: RUBIK no redacta el planteamiento del estudio.
 const PRO_TEXT=(S.brand?.intro||'').trim()||null;
 if(!PRO_TEXT){delete CH.concepto;for(const t of TIPOS)t.ch=t.ch.filter(c=>c!=='concepto');}

 // ---------- textos y datos derivados ----------
 const big=[...rooms].filter(r=>r.areaM2!=null).sort((a,b)=>b.areaM2-a.areaM2);
 const objRows=objectRows(),noRef=objRows.filter(r=>!r.ref).length;
 const roomObjs=r=>{const m=new Map();S.objects.forEach(o=>{if(o.roomId===r.id)m.set(o.name,(m.get(o.name)||0)+1);});return [...m].map(([n,q])=>(q>1?q+' × ':'')+n[0].toLowerCase()+n.slice(1)).join(', ');};
 const floorOf=r=>matById[r.floorMaterialId]?.name||'Sin pavimento asignado';
 const roomViews=S.views.filter(v=>v.kind==='room').map(v=>({v,r:rooms.find(x=>x.id===v.roomId)})).filter(x=>x.r);
 const ROOM_IA=Object.keys(ai).filter(l=>l!=='Vista general');
 const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
 const dfmt=s=>{const [y,m,d]=s.split('-').map(Number);return `${d} ${months[m-1].slice(0,3)}.`;};
 const tasks=planDemo?.tasks||[];const t0=tasks.length?Math.min(...tasks.map(t=>Date.parse(t.start))):0,t1=tasks.length?Math.max(...tasks.map(t=>Date.parse(t.end)))+864e5:1;
 const notDrawn=t=>/no se dibuja/.test(t.title)||t.elements===0;const cleanTitle=t=>t.title.replace(/\s*\(no se dibuja[^)]*\)/,'');
 const totalGross=V?V.summary.gross.amount:null;
 const PRICE_NOTE=S.budget?.test?.label||'';
 const decisions=[
  {q:'La distribución',d:`${rooms.length} estancias y ${AREA} m² útiles computados. ¿Encaja con cómo vas a vivir la casa?`,where:'vivienda',state:'Para comentar'},
  ...floors.map(f=>({q:`Pavimento: ${f.name}`,d:`${num(f.areaM2)} m² en ${f.rooms.join(', ')}.`,where:'materiales',state:'Por confirmar'})),
  {q:'Mobiliario y productos',d:`${objRows.length} líneas de mobiliario${noRef?`, ${noRef===objRows.length?'ninguna':noRef} con producto elegido`:''}. El estudio te propondrá referencias; cuéntale tus prioridades (estilo, medidas, presupuesto).`.replace(', ninguna con producto elegido',', todavía sin producto elegido'),where:'documentos',state:'Pendiente del estudio'},
  ...(V?[{q:'El presupuesto',d:`${V.summary.items} partidas, ${eur(V.summary.gross.amount)} con IVA. ${V.summary.unreviewed?`El estudio aún no ha revisado ${V.summary.unreviewed===V.summary.items?'ninguna':V.summary.unreviewed} de ellas: te pedirá la aprobación cuando lo haga.`:'Revisado por el estudio.'}`,where:'presupuesto',state:V.summary.reviewComplete?'Para aprobar':'Pendiente del estudio'}]:[]),
  ...(planDemo?[{q:'Las fechas de obra',d:'El plan que ves es un ejemplo para explicar el proceso. El calendario real se fija con la licencia y la empresa constructora.',where:'obra',state:'No se decide aún'}]:[]),
  ...(Object.keys(ai).length?[{q:'Las imágenes con IA',d:'Son orientativas: sirven para imaginar el ambiente. Las decisiones se toman sobre el modelo del proyecto y las muestras reales.',where:'estancias',res:'ia',state:'Solo informativo'}]:[])];

 // ---------- piezas visuales comunes ----------
 const planSvg=plan({w:130,h:101}).svg; // web: dibujo más compacto para que los rótulos se vean ≥ 12 px al escalarlo (medido en navegador)
 const gridSvg=({w=250,h=96}={})=>{if(!tasks.length)return '';const L=86,tw=w-L-2,rowH=(h-10)/tasks.length,x=d=>L+tw*(Date.parse(d)-t0)/(t1-t0);
  const ms=[];for(let d=new Date(t0);d<=t1;d.setUTCMonth(d.getUTCMonth()+1,1)){const t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);if(t>=t0)ms.push(t);}
  return `<svg width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" role="img" aria-label="Plan de obra de ejemplo por fases"><title>Plan de obra de ejemplo, ${tasks.length} fases</title>
   ${ms.map(t=>`<line x1="${L+tw*(t-t0)/(t1-t0)}" y1="6" x2="${L+tw*(t-t0)/(t1-t0)}" y2="${h}" stroke="${T.rule}" stroke-width=".2"/><text x="${L+tw*(t-t0)/(t1-t0)+1}" y="4" font-size="3.3" fill="${T.muted}">${months[new Date(t).getUTCMonth()]}</text>`).join('')}
   ${tasks.map((t,i)=>{const y=8+i*rowH,a=x(t.start),b=x(new Date(Date.parse(t.end)+864e5).toISOString().slice(0,10));return `<text x="${L-2.5}" y="${y+rowH/2}" text-anchor="end" dominant-baseline="middle" font-size="3.5" fill="${T.ink}">${esc(cleanTitle(t))}</text>
    <rect x="${a}" y="${y+rowH*.22}" width="${Math.max(b-a,1)}" height="${rowH*.56}" rx=".6" fill="${notDrawn(t)?'none':T.ink}" stroke="${T.ink}" stroke-width=".25"${notDrawn(t)?' stroke-dasharray="1 .8"':''}/>`;}).join('')}</svg>`;};

 // ---------- web ----------
 const WEB_CSS=`:root{--ink:${T.ink};--muted:${T.muted};--rule:${T.rule};--paper:${T.paper};--field:${T.field};--accent:#875936;--read:'RUBIK Serif',Georgia,serif;--tech:'RUBIK Inter',system-ui,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:72px;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 var(--tech);font-variant-numeric:tabular-nums lining-nums}
img,video,svg{max-width:100%;display:block}a{color:inherit}:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.wrap{max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,40px)}
.top{position:sticky;top:0;z-index:10;background:rgba(255,253,248,.95);border-bottom:1px solid var(--rule)}
.top .wrap{display:flex;align-items:center;gap:20px;min-height:56px}
.top b{font-size:14px;white-space:nowrap}.top b span{font-weight:400;color:var(--muted)}
.toc{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin-left:auto;min-width:0}.toc::-webkit-scrollbar{display:none}
.toc a{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 10px;border-radius:999px;white-space:nowrap}
.toc a[aria-current=true]{color:var(--ink);background:var(--field)}
h1,h2,h3{font-family:var(--read);font-weight:600;letter-spacing:-.01em;margin:0}
h1{font-size:clamp(34px,5.2vw,60px);line-height:1.04}h2{font-size:clamp(28px,3.6vw,40px);line-height:1.1}h3{font-size:21px;line-height:1.25}
.lead{font-family:var(--read);font-size:clamp(18px,2vw,21px);line-height:1.5;max-width:40em;margin:14px 0 0}
.small,figcaption,.cap{font-size:13.5px;line-height:1.45;color:var(--muted)}
.hero{padding:clamp(24px,5vw,56px) 0 clamp(32px,6vw,72px);border-bottom:1px solid var(--rule)}
.hero .wrap{display:grid;grid-template-columns:5fr 7fr;gap:clamp(24px,4vw,56px);align-items:end}
.hero .studio{font-weight:700;font-size:14px;margin:0 0 clamp(24px,6vw,72px)}.hero .studio span{display:block;font-weight:400;color:var(--muted)}
.hero .kind{font-family:var(--read);font-size:20px;margin:12px 0 0}.hero .meta{margin:18px 0 0}
.hero figure{margin:0}.hero figure img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:2px}
.figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:32px 0 0;padding:20px 0 0;border-top:1px solid var(--rule)}
.fig .n{font-family:var(--read);font-size:clamp(26px,3vw,34px);line-height:1.1}.fig .n small{font-size:.5em;margin-left:3px}.fig .l{font-weight:700;font-size:13.5px;margin-top:4px}.fig .s{font-size:12.5px;color:var(--muted)}
.ch{padding:clamp(48px,8vw,104px) 0;border-bottom:1px solid var(--rule)}.ch:nth-of-type(even){background:var(--field)}
.cols{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(20px,3vw,40px);margin-top:36px;align-items:start}
.s4{grid-column:span 4}.s5{grid-column:span 5}.s6{grid-column:span 6}.s7{grid-column:span 7}.s8{grid-column:span 8}.s12{grid-column:span 12}
figure{margin:0}figure svg{width:100%;height:auto}figcaption{margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;font-size:12.5px;color:var(--muted);font-weight:700;border-bottom:1.5px solid var(--ink);padding:8px 10px 8px 0}
td{border-bottom:1px solid var(--rule);padding:8px 10px 8px 0;vertical-align:top}td.num,th.num{text-align:right;white-space:nowrap;padding-right:0}tr.tot td{font-weight:700;border-bottom:1.5px solid var(--ink)}tr.chap td{font-weight:700;padding-top:16px}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.qm{display:none}@media (max-width:600px){.budget :is(th,td):nth-child(2):nth-last-child(3),.budget :is(th,td):nth-child(3):nth-last-child(2){display:none}.qm{display:block;font-size:13px;color:var(--muted);margin-top:2px}}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pair img{width:100%;aspect-ratio:3/2;object-fit:cover;background:#e9e5dc}
.tag{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border:1px solid currentColor;border-radius:999px;margin-bottom:8px}
.tag.ia{color:var(--accent)}.room{padding:32px 0;border-top:1px solid var(--rule)}.room:first-of-type{border-top:0}
.room .head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px}.room .head p{margin:0;color:var(--muted);font-size:14px}
.room .plan svg{max-height:340px;width:auto;max-width:100%}
.sw{display:grid;grid-template-columns:56px 1fr;gap:14px;padding:14px 0;border-top:1px solid var(--rule)}.sw i{display:block;height:56px;border:1px solid rgba(0,0,0,.12)}
.bar{height:6px;background:var(--rule);margin-top:8px}.bar span{display:block;height:100%;background:var(--ink)}
.total{font-family:var(--read);font-size:clamp(40px,6vw,64px);line-height:1.12;margin-bottom:4px}.total small{font-size:.4em}
.note{border-top:1.5px solid var(--ink);padding:10px 0 0;font-size:14px}
.gantt{display:grid;grid-template-columns:minmax(150px,30%) 1fr;row-gap:6px;column-gap:16px;font-size:14px;margin-top:8px}
.gantt .track{position:relative;height:24px;background:repeating-linear-gradient(90deg,transparent 0 calc(var(--m) - 1px),var(--rule) calc(var(--m) - 1px) var(--m))}
.gantt .track span{position:absolute;top:5px;bottom:5px;background:var(--ink);border-radius:2px}.gantt .track span.nd{background:none;border:1.5px dashed var(--ink)}
.gantt .lab small{display:block;color:var(--muted);font-size:12.5px}
.months{display:flex;justify-content:space-around;font-size:12.5px;color:var(--muted)}
@media (max-width:600px){.gantt>.months{display:none}}
video{width:100%;background:#111;border-radius:2px}
.stills{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}.stills img{width:100%;aspect-ratio:16/9;object-fit:cover}
.dec{counter-reset:d;margin:0;padding:0;list-style:none}.dec li{display:grid;grid-template-columns:44px 1fr auto;gap:6px 18px;padding:18px 0;border-top:1px solid var(--rule);align-items:start}
.dec li::before{counter-increment:d;content:counter(d);font-family:var(--read);font-size:26px;line-height:1}
.dec b{display:block;font-size:16px}.dec p{margin:4px 0 0;color:var(--muted);font-size:14.5px}.dec .st{font-size:12.5px;font-weight:700;white-space:nowrap;border:1px solid var(--ink);border-radius:999px;padding:3px 10px}
.docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:28px}
.doc{display:block;text-decoration:none;border:1px solid var(--rule);background:var(--paper);padding:18px;border-radius:2px}.doc:hover{border-color:var(--ink)}.doc b{display:block;font-family:var(--read);font-size:19px}.doc p{margin:6px 0 10px;font-size:14px;color:var(--muted)}.doc span{font-size:12.5px;font-weight:700}
.prov td:first-child{font-weight:700;width:28%}
.concept blockquote{margin:0}.concept blockquote p{font-family:var(--read);font-size:clamp(24px,3.2vw,38px);line-height:1.28;letter-spacing:-.01em;margin:0;max-width:24em;text-wrap:pretty}.concept figcaption{margin-top:16px}
footer{padding:40px 0 56px;font-size:13.5px;color:var(--muted)}footer b{color:var(--ink)}
.missing{border:1px dashed var(--rule);padding:18px;color:var(--muted);font-size:14px}
@media (max-width:900px){.hero .wrap{grid-template-columns:1fr}.hero .studio{margin-bottom:24px}.cols>*{grid-column:span 12!important}.stills{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:601px){.pan-hint{display:none}}
@media (max-width:600px){.pan{overflow-x:auto;-webkit-overflow-scrolling:touch}.pan svg{width:640px;max-width:none}.pan-hint{display:inline}.top b span{display:none}.figs{grid-template-columns:1fr 1fr}.pair{grid-template-columns:1fr}.gantt{grid-template-columns:1fr;row-gap:2px}.gantt .track{margin-bottom:10px}
 .dec li{grid-template-columns:34px 1fr}.dec .st{grid-column:2;justify-self:start}.prov td:first-child{width:auto}.prov tr{display:grid}.prov td{border:0;padding:2px 0}.prov tr{border-bottom:1px solid var(--rule);padding:10px 0}}`;
 const mediaFig=(src,alt,cap,cls='')=>src?`<figure class="${cls}"><img src="${src}" alt="${esc(alt)}" loading="lazy"><figcaption>${cap}</figcaption></figure>`:`<div class="missing">${esc(alt)}: no disponible en esta entrega.</div>`;
 const videoFig=(o,label,cap)=>o?`<figure><video controls playsinline preload="metadata" poster="${o.poster}" aria-label="${esc(label)}"><source src="${o.video}" type="video/mp4"></video><figcaption>${cap} Duración ${Math.round(o.dur)} s.</figcaption></figure>`:`<div class="missing">${esc(label)}: el vídeo no está disponible en esta entrega.</div>`;
 const chap=(id,n,body)=>`<section class="ch" id="${id}"><div class="wrap">${body.replace('%N%','')}</div></section>`;
 const sections={
  concepto:n=>!PRO_TEXT?'':chap('concepto',n,`<h2>%N%Concepto</h2><div class="cols"><figure class="s8 concept"><blockquote lang="es"><p>${esc(PRO_TEXT)}</p></blockquote>
   <figcaption>${esc(STUDIO)}${prof.person?`, ${esc(prof.person)}`:''}. Texto escrito por el estudio para esta entrega.</figcaption></figure>
   <div class="s4"><p class="note"><b>Es el planteamiento del estudio, no una medición.</b> Las superficies, estancias y cifras del proyecto están en «La vivienda» y en los documentos.</p></div></div>`),
  vivienda:n=>chap('vivienda',n,`<h2>%N%La vivienda</h2><p class="lead">${rooms.length} estancias y ${AREA} m² útiles computados, medidos por RUBIK sobre el modelo del proyecto.</p>
   <div class="cols"><figure class="s8"><div class="pan">${planSvg}</div><figcaption><span class="pan-hint">Desliza para ver el dibujo completo. </span>Planta dibujada desde la geometría del proyecto. El color de cada estancia es su pavimento.</figcaption></figure>
   <div class="s4"><table><thead><tr><th>Estancia</th><th class="num">m²</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${esc(r.name)}${r.counted?'':' <span class="small">(no computa)</span>'}</td><td class="num">${r.areaM2==null?'—':num(r.areaM2)}</td></tr>`).join('')}<tr class="tot"><td>Superficie útil computada</td><td class="num">${AREA}</td></tr></tbody></table><p class="cap">${esc(STATUS_AREA)}</p></div></div>`),
  dibujo:n=>{const g=ai['Vista general'];return chap('dibujo',n,`<h2>%N%Del dibujo a la imagen</h2><p class="lead"><span data-res="ia">El mismo proyecto en tres grados de verdad: el dibujo, el modelo 3D medido y una imagen orientativa del ambiente.</span><span data-res-sin="ia" hidden>El mismo proyecto en dos grados de verdad: el dibujo y el modelo 3D medido.</span></p>
   <div class="cols"><div class="s4">${mediaFig(drawing,'Dibujo vivo de la vivienda','<b>Dibujo.</b> Apertura de la presentación con Dibujo vivo de RUBIK: el modelo dibujado a lápiz.')}</div>
   <div class="s4">${mediaFig(VW['Vista general'],'Vista general del modelo 3D',`<b>Modelo.</b> ${esc(VIEW_NOTE)}`)}</div>
   <div class="s4" data-res="ia">${g?mediaFig(g.web,'Imagen orientativa generada con IA',`<span class="tag ia">Imagen IA orientativa</span><br>Generada con IA; corresponde visualmente a la vista del modelo de su izquierda (la imagen enviada no se conservó). Puede alterar detalles; la geometría válida es la del modelo.`):'<div class="missing">Sin imagen IA para la vista general.</div>'}</div></div>`);},
  estancias:n=>chap('estancias',n,`<h2>%N%Estancia por estancia</h2><p class="lead">${roomViews.length} estancias con vista 3D${ROOM_IA.length?`<span data-res="ia">; ${ROOM_IA.length===1?'una de ellas':ROOM_IA.join(' y ')} también con una imagen orientativa generada con IA, siempre junto a la vista del modelo</span>`:''}.</p>
   ${roomViews.map(({v,r})=>{const p=roomPlan(r,{scale:50,maxW:90,maxH:80,markers:false}),x=ai[v.label];return `<article class="room"><div class="head"><h3>${esc(r.name)}</h3><p>${roomArea(r)}</p><p>${esc(floorOf(r))}</p></div>
    <div class="cols" style="margin-top:20px"><figure class="s4 plan">${p.svg}<figcaption>Planta a 1:${p.scale} de las medidas del modelo${S.project.scale==='estimated'?' (escala estimada; no sirve para medir sobre la pantalla)':''}. ${esc(roomObjs(r)?roomObjs(r)[0].toUpperCase()+roomObjs(r).slice(1)+'.':'Sin objetos colocados.')}</figcaption></figure>
    <div class="s8">${x?`<div data-res-sin="ia" hidden>${mediaFig(VW[v.label],'Vista del modelo 3D: '+r.name,'Vista del modelo del proyecto.')}</div><div class="pair" data-res="ia">${mediaFig(VW[v.label],'Vista del modelo 3D: '+r.name,`<span class="tag">Modelo 3D</span><br>Vista del modelo del proyecto.`)}${mediaFig(x.web,'Imagen IA orientativa: '+r.name,`<span class="tag ia">Imagen IA orientativa</span><br>${x.exact?`Corresponde a esta vista del modelo: comparación visual de miniaturas (diferencia media ${num(x.meanAbsDiff0to255,1)} sobre 255); la imagen enviada no se conservó.`:'Generada a partir de otra vista del modelo de la misma estancia (la enviada no se conservó).'}${/Salón/.test(r.name)?' Añade en primer plano un dormitorio que no forma parte de esta estancia y cambia la proporción del encuadre: no sirve para juzgar la distribución.':''}`)}</div>`:mediaFig(VW[v.label],'Vista del modelo 3D: '+r.name,'Vista del modelo del proyecto.')}</div></div></article>`;}).join('')}`),
  materiales:n=>{const tot=floors.reduce((s,f)=>s+f.areaM2,0);return chap('materiales',n,`<h2>%N%Materiales</h2><p class="lead">${floors.length} pavimentos asignados en el modelo, de mayor a menor superficie.</p>
   <div class="cols"><div class="s7">${floors.map(f=>`<div class="sw"><i style="background:${f.color}"></i><div><b>${esc(f.name)}</b><div class="small">${num(f.areaM2)} m², ${num(f.areaM2/tot*100,0)} % del pavimento modelado</div><div class="small">${esc(f.rooms.join(', '))}</div><div class="bar"><span style="width:${(f.areaM2/floors[0].areaM2*100).toFixed(1)}%"></span></div></div></div>`).join('')}</div>
   <div class="s5"><p class="note"><b>Color del modelo, no muestra física.</b> Los tonos son los del material en el modelo 3D. La elección final se hace con la muestra real del fabricante.</p></div></div>`);},
  presupuesto:n=>!V?chap('presupuesto',n,`<h2>%N%Presupuesto</h2><p class="lead">El proyecto todavía no tiene presupuesto con precios. No se muestra ningún importe.</p>`):chap('presupuesto',n,`<h2>%N%Presupuesto</h2><p class="lead">${V.summary.items} partidas medidas por RUBIK sobre el modelo, agrupadas en ${V.chapters.length} capítulos.</p>
   <div class="cols"><div class="s5"><div class="total">${nf(2).format(totalGross)}<small> €</small></div><p style="margin:6px 0 0"><b>Total con IVA</b></p><p class="cap">Base ${eur(V.summary.net.amount)} más IVA ${num(V.summary.tax.ratePercent,0)} % (${eur(V.summary.tax.amount)}).</p>
    <p class="note" style="margin-top:20px"><b>${V.summary.reviewComplete?'Revisado por el estudio.':'Pendiente de revisión del estudio.'}</b> ${esc(PRICE_NOTE)}</p></div>
   <figure class="s7"><div class="pan">${chapterChart(V,{w:150})}</div><figcaption><span class="pan-hint">Desliza para ver el dibujo completo. </span>Importe neto por capítulo, de mayor a menor.</figcaption></figure>
   <div class="s12"><table class="budget"><thead><tr><th>Partida</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Importe neto</th></tr></thead><tbody>${V.chapters.map(c=>`<tr class="chap"><td colspan="4">${esc(c.title)}</td></tr>${c.lines.map(l=>`<tr><td>${esc(l.description)}<span class="qm">${num(l.budgetQuantity,l.quantity.unit==='unit'?0:2)} ${({m2:'m²',m:'m',unit:'ud'})[l.quantity.unit]||''} × ${eur(l.unitPrice)}</span></td><td class="num">${num(l.budgetQuantity,l.quantity.unit==='unit'?0:2)} ${({m2:'m²',m:'m',unit:'ud'})[l.quantity.unit]||''}</td><td class="num">${eur(l.unitPrice)}</td><td class="num">${eur(l.subtotalNet)}</td></tr>`).join('')}`).join('')}
    <tr class="tot"><td colspan="3">Base imponible</td><td class="num">${eur(V.summary.net.amount)}</td></tr><tr><td colspan="3">IVA ${num(V.summary.tax.ratePercent,0)} %</td><td class="num">${eur(V.summary.tax.amount)}</td></tr><tr class="tot"><td colspan="3">Total con IVA</td><td class="num">${eur(V.summary.gross.amount)}</td></tr></tbody></table></div></div>`),
  obra:n=>chap('obra',n,`<h2>%N%Cómo avanzará la obra</h2><p class="lead">Un ejemplo para explicar el proceso: las fases de una obra sobre esta misma vivienda. <b>Las fechas son ilustrativas y el plan no tiene presupuesto vinculado.</b></p>
   <div class="cols"><div class="s8" data-res-sin="video" hidden><div class="missing">El vídeo de la obra no se incluye en esta entrega. Debajo, cuatro fotogramas suyos.</div></div><div class="s8" data-res="video">${videoFig(obra,'Vídeo de la evolución de la obra','Vídeo exportado por la Evolución de obra de RUBIK sobre este mismo proyecto, con su plan de obra.')}</div>
   <div class="s4">${obra?`<div class="stills" style="grid-template-columns:1fr 1fr;margin-top:0">${obra.stills.map((s,i)=>`<img src="${s}" alt="Momento ${i+1} del vídeo de la obra" loading="lazy">`).join('')}</div>`:''}
    ${ftDoc?`<p style="margin-top:16px" data-res="video"><a href="documentos/obra-presentacion.html">Abrir la presentación de la obra</a><br><span class="small">Documento de solo lectura exportado por RUBIK, con las fases y las fechas.</span></p>`:''}</div>
   <div class="s12">${tasks.length?`<h3 style="margin-bottom:12px">Fases del plan de ejemplo</h3><div class="gantt" style="--m:${(100/((t1-t0)/(30.44*864e5))).toFixed(2)}%"><div></div><div class="months">${(()=>{const o=[];for(let d=new Date(t0);d.getTime()<t1;d.setUTCMonth(d.getUTCMonth()+1,1))o.push(`<span>${months[d.getUTCMonth()]}</span>`);return o.join('');})()}</div>${tasks.map(t=>{const a=(Date.parse(t.start)-t0)/(t1-t0)*100,b=(Date.parse(t.end)+864e5-t0)/(t1-t0)*100;return `<div class="lab">${esc(cleanTitle(t))}<small>${dfmt(t.start)} – ${dfmt(t.end)}${notDrawn(t)?', no se ve en el modelo':''}</small></div><div class="track" role="img" aria-label="${esc(cleanTitle(t))}: del ${dfmt(t.start)} al ${dfmt(t.end)}"><span class="${notDrawn(t)?'nd':''}" style="left:${a.toFixed(2)}%;width:${(b-a).toFixed(2)}%"></span></div>`;}).join('')}</div>
    <p class="cap" style="margin-top:12px">Año ${new Date(t0).getUTCFullYear()}, fechas de ejemplo. Línea discontinua: fases que el modelo no dibuja.</p>`:'<div class="missing">Sin plan de obra.</div>'}</div></div>`),
  recorrido:n=>chap('recorrido',n,`<h2>%N%Recorrer la vivienda</h2><p class="lead">Un recorrido por ${tourFrames.length||'las'} estancias, grabado por RUBIK desde el modelo del proyecto<span data-res-sin="video" hidden>; aquí, sus fotogramas</span>.</p>
   <div class="cols"><div class="s8" data-res-sin="video" hidden><div class="missing">El vídeo del recorrido no se incluye en esta entrega.</div></div><div class="s8" data-res="video">${videoFig(tour,'Vídeo del recorrido por la vivienda','Vídeo exportado por «Presentar mi vivienda» de RUBIK: solo la vista 3D, sin interfaz.')}</div>
   <div class="s4"><p class="note"><b>La visita 3D interactiva</b> se abre con un enlace que te envía el estudio. Esta entrega no la incluye: es una carpeta para ver sin conexión y no contiene el proyecto editable.</p>
   ${tourFrames.length?`<div class="stills" style="grid-template-columns:1fr 1fr">${tourFrames.map(f=>`<img src="${f.src}" alt="${esc(rooms.find(r=>r.id===f.id)?.name||'Estancia')} en el recorrido" loading="lazy">`).join('')}</div>`:''}</div></div>`),
  decisiones:n=>chap('decisiones',n,`<h2>%N%Lo que hay que decidir</h2><p class="lead">Lo que el proyecto deja abierto, para hablarlo con el estudio. Nada de esto está decidido todavía. Los pavimentos se confirman sobre la muestra real del fabricante, no sobre el color del modelo.</p>
   <ol class="dec" style="margin-top:28px">${decisions.map(d=>`<li data-needs="${d.where}"${d.res?` data-res="${d.res}"`:''}><div><b>${esc(d.q)}</b><p>${esc(d.d)}</p></div><span class="st">${esc(d.state)}</span></li>`).join('')}</ol>
   <p class="cap" style="margin-top:20px">Para responder, escribe al estudio${prof.email?` (${esc(prof.email)})`:''}.</p>`),
  documentos:(n,t)=>chap('documentos',n,`<h2>%N%Documentos</h2><p class="lead">Los documentos de esta entrega, para leer, imprimir o reenviar.</p>
   <div class="docs">${DOCLIST.filter(d=>t.docs.includes(d.id)).map(docRef).map(d=>`<a class="doc" data-doc="${d.id}" href="${d.href}"><b>${esc(d.name)}</b><p>${esc(d.what)}</p><span>PDF${d.pages?`, ${d.pages} ${d.pages===1?'pág.':'págs.'}`:''}${d.size?`, ${d.size}`:''}</span></a>`).join('')}</div>`),
  procedencia:n=>chap('procedencia',n,`<h2>%N%De dónde sale cada cosa</h2><p class="lead">Lo que es medida del proyecto y lo que es ilustrativo, para que sepas cuánto fiarte de cada pieza.</p>
   <div class="cols"><div class="s12"><table class="prov"><tbody>
   <tr><td>Planta, superficies y estancias</td><td>Geometría del proyecto en RUBIK, revisión ${esc(rev)}. ${esc(STATUS_AREA)}</td></tr>
   <tr><td>Vistas 3D y recorrido</td><td>Vistas del modelo 3D del proyecto generadas por RUBIK. No son fotografías.</td></tr>
   <tr><td>Dibujo</td><td>Fotograma de la apertura de la presentación con Dibujo vivo de RUBIK.</td></tr>
   ${Object.keys(ai).length?`<tr data-res="ia"><td>Imágenes con IA</td><td>${Object.keys(ai).length} imágenes generadas con IA a partir de vistas del modelo. Orientativas: pueden cambiar objetos, materiales y lo que queda fuera del encuadre.</td></tr>`:''}
   ${V?`<tr data-needs="presupuesto"><td>Presupuesto</td><td>Mediciones de RUBIK sobre el modelo, con la merma indicada. ${esc(PRICE_NOTE)} ${V.summary.reviewComplete?'':'Pendiente de revisión del estudio.'}</td></tr>`:''}
   ${planDemo?`<tr data-needs="obra"><td>Plan de obra<span data-res="video"> y vídeo</span></td><td>Plan de ejemplo de RUBIK aplicado a este mismo proyecto y exportado por su Evolución de obra como entrega orientativa: plan en borrador, sin revisar y sin presupuesto vinculado; fechas ilustrativas. No es un calendario de obra.</td></tr>`:''}
   <tr><td>Esta entrega</td><td>Carpeta de solo lectura para ver sin conexión. No contiene el proyecto editable ni datos de otros proyectos.</td></tr></tbody></table></div></div>`)};
 const pdfInfo=id=>{const f=path.join(outDir,id+'.pdf');if(!exists(f))return {};try{return {pages:+/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo',[f]).toString())[1],size:kb(f)};}catch{return {};}};
 const web=(t,{preview=false}={})=>{const list=t.ch.filter(c=>c!=='portada'&&sections[c]);
  for(const d of DOCLIST)Object.assign(d,pdfInfo(d.id));
  const body=list.map((c,i)=>sections[c](i+1,t)).join('\n');
  const hero=`<section class="hero" id="portada"><div class="wrap"><div><p class="studio">${prof.logo?.dataUrl?`<img src="${prof.logo.dataUrl}" alt="${esc(prof.logo.label||'Logotipo del estudio')}" style="max-height:44px;width:auto;margin-bottom:8px">`:''}${esc(STUDIO)}<span>${esc(prof.tagline||'')}</span></p>
   <h1>${esc(TITLE)}</h1><p class="kind">${esc(t.name)}</p><p class="lead" id="tipoLead" style="font-size:17px">${esc(t.lead)}</p><p class="meta small">${esc(date)}. Revisión del proyecto ${esc(rev)}.</p>
   <div class="figs"><div class="fig"><div class="n">${AREA}<small>m²</small></div><div class="l">Superficie útil</div><div class="s">Calculada por RUBIK sobre el modelo</div></div>
   <div class="fig"><div class="n">${rooms.length}</div><div class="l">Estancias</div><div class="s">${counted.length} computan</div></div>
   ${V?`<div class="fig" data-needs="presupuesto"${t.ch.includes('presupuesto')?'':' hidden'}><div class="n">${nf(0).format(Math.round(totalGross))}<small>€</small></div><div class="l">Presupuesto con IVA</div><div class="s">Precios de prueba, sin revisar</div></div>`:''}<div class="fig" data-unless="presupuesto"${t.ch.includes('presupuesto')&&V?' hidden':''}><div class="n">${floors.length}</div><div class="l">Pavimentos</div><div class="s">Asignados en el modelo</div></div></div></div>
   <figure>${drawing?`<img src="${drawing}" alt="Dibujo de la vivienda (Dibujo vivo de RUBIK)"><figcaption>La vivienda en la apertura de la presentación con Dibujo vivo. Dibujo del modelo, no fotografía.</figcaption>`:`${axo({w:178,h:150})}`}</figure></div></section>`;
  const out_=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">${preview?'<base href="../entrega/">':''}<title>${esc(TITLE)}, ${esc(t.name)}</title>
<style>${FONT_CSS}\n${WEB_CSS}</style></head><body data-tipo="${t.id}"><header class="top"><div class="wrap"><b>${esc(STUDIO)} <span>${esc(TITLE)}</span></b><nav class="toc" aria-label="Capítulos">${list.map(c=>`<a href="#${c}">${esc(CH[c])}</a>`).join('')}</nav></div></header>
<main>${hero}\n${body}</main><footer><div class="wrap"><b>${esc(STUDIO)}</b>${[prof.person,prof.email,(prof.web||'').replace(/^https?:\/\//,'')].filter(Boolean).map(x=>'<br>'+esc(x)).join('')}<p>${esc(t.name)}, ${esc(date)}. Revisión del proyecto ${esc(rev)}. Documento de solo lectura preparado con RUBIK; no contiene el proyecto editable.</p></div></footer>
${preview?'':''}<script>(()=>{const links=[...document.querySelectorAll('.toc a')];const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){links.forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+e.target.id)));const a=links.find(a=>a.hash==='#'+e.target.id);a&&a.scrollIntoView({block:'nearest',inline:'nearest'});}},{rootMargin:'-40% 0px -55% 0px'});document.querySelectorAll('section.ch').forEach(s=>io.observe(s));
 /*PREVIEW*/if(window.parent!==window&&document.body.dataset.preview==='1')addEventListener('message',e=>{if(e.source!==window.parent||(location.origin!=='null'&&e.origin!==location.origin))return;const d=e.data||{};if(d.rubikHide&&!Array.isArray(d.rubikHide))return;if(d.rubikHide){document.querySelectorAll('section.ch').forEach(s=>s.hidden=d.rubikHide.includes(s.id));links.forEach(a=>a.hidden=d.rubikHide.includes(a.hash.slice(1)));
   document.querySelectorAll('[data-needs]').forEach(x=>x.hidden=d.rubikHide.includes(x.dataset.needs));document.querySelectorAll('[data-unless]').forEach(x=>x.hidden=!d.rubikHide.includes(x.dataset.unless)&&!!document.querySelector('[data-needs='+x.dataset.unless+']'));}
  if(d.rubikLead){const l=document.getElementById('tipoLead');if(l)l.textContent=d.rubikLead;}
  if(d.rubikDocs)document.querySelectorAll('.doc').forEach(a=>a.hidden=!d.rubikDocs.includes(a.dataset.doc));if(d.rubikKind){const k=document.querySelector('.hero .kind');if(k)k.textContent=d.rubikKind;}});})();</script></body></html>`;
  // A05: solo la copia de vista previa del profesional escucha mensajes; la web del cliente no lleva ese código.
  return preview?out_.replace('<body data-tipo=','<body data-preview="1" data-tipo='):out_.replace(/ \/\*PREVIEW\*\/[\s\S]*?\}\}\);\}\)\(\);<\/script>/,'})();</script>');};

 // ---------- presentación integral paginada (A4 apaisado, portada B: D1) ----------
 const im=(rel,alt,style='')=>rel?`<img class="img" src="${dataUri(rel)}" alt="${esc(alt)}" style="${style}">`:`<div class="note">${esc(alt)}: no disponible.</div>`;
 const P=[];
 P.push(coverDrawing('Presentación integral',`Entrega al cliente, ${date}`));
 const idx=[...(PRO_TEXT?[['Concepto','El planteamiento del estudio, con sus palabras.']]:[]),['La vivienda','Planta y superficies medidas sobre el modelo.'],['Del dibujo a la imagen','Dibujo, modelo 3D e imagen orientativa de la misma vivienda.'],...ROOM_IA.map(l=>[l,'Vista del modelo junto a su imagen IA orientativa.']),
  ...(planDemo?[['Cómo avanzará la obra','Ejemplo ilustrativo del plan de obra y su vídeo.']]:[]),...(V?[['Presupuesto','Importe por capítulos con precios de prueba.']]:[]),['Lo que hay que decidir','Lo que el proyecto deja abierto.'],['Documentos y procedencia','Qué acompaña a esta entrega y de dónde sale cada cosa.']];
 P.push({html:`<div class="grid"><div class="c1-4"><h2 class="h2">Esta entrega</h2><p class="read">${esc(TIPOS[0].lead)}</p><p class="caption" style="margin-top:6mm">Junto a este PDF, la carpeta de la entrega contiene una versión para pantalla (index.html) con los vídeos, para ver sin conexión.</p></div>
  <div class="c6-12"><table style="font-size:10.5pt"><tbody>${idx.map(([a,b],i)=>`<tr><td style="padding:2.4mm 0;width:10mm;font-family:var(--f-read);font-size:14pt">${i+1}</td><td style="padding:2.4mm 0"><b>${esc(a)}</b><br><span class="muted">${esc(b)}</span></td></tr>`).join('')}</tbody></table></div></div>`});
 if(PRO_TEXT)P.push({html:`<div class="grid" style="align-content:center"><div style="grid-column:1 / span 3"><h2 class="h2">Concepto</h2></div><div style="grid-column:4 / span 8"><p lang="es" style="font-family:var(--f-read);font-size:24pt;line-height:1.3;letter-spacing:-.01em;margin:0">${esc(PRO_TEXT)}</p>
  <p class="caption" style="margin-top:6mm">${esc(STUDIO)}${prof.person?`, ${esc(prof.person)}`:''}. Texto escrito por el estudio para esta entrega. Es su planteamiento, no una medición: las cifras del proyecto están en las páginas siguientes.</p></div></div>`});
 P.push(planPage('La vivienda'));
 const g=ai['Vista general'];
 P.push({html:`<div class="grid" style="align-content:start"><div class="c1-12"><h2 class="h2">Del dibujo a la imagen</h2></div>
  ${[[drawing,'Dibujo','Apertura de la presentación con Dibujo vivo de RUBIK: el modelo dibujado a lápiz.'],[VW['Vista general'],'Modelo',VIEW_NOTE],[g&&g.web,'Imagen IA orientativa','Generada con IA; corresponde visualmente a la vista del modelo de su izquierda (la imagen enviada no se conservó). Puede alterar detalles; la geometría válida es la del modelo.']].map(([s,t,c],i)=>`<div style="grid-column:${i*4+1} / span 4;margin-top:4mm">${im(s,t,'width:100%;height:92mm;object-fit:cover')}<h3 class="h3" style="margin-top:3mm">${esc(t)}</h3><p class="caption">${esc(c)}</p></div>`).join('')}</div>`});
 for(const l of ROOM_IA){const r=rooms.find(x=>x.name===l),x=ai[l];
  P.push({html:`<div class="grid"><div class="c1-12" style="display:flex;align-items:baseline;gap:6mm"><h2 class="h2">${esc(l)}</h2><p class="meta">${r?roomArea(r):''}${r?', '+esc(floorOf(r)):''}</p></div>
   <div class="c1-6" style="margin-top:4mm">${im(VW[l],'Modelo 3D: '+l,'width:100%;height:100mm;object-fit:cover')}<p class="caption"><b>Modelo 3D.</b> ${esc(VIEW_NOTE)}</p></div>
   <div class="c7-12" style="margin-top:4mm">${im(x.web,'Imagen IA orientativa: '+l,'width:100%;height:100mm;object-fit:cover')}<p class="caption"><b>Imagen IA orientativa.</b> ${x.exact?`Corresponde a la vista de la izquierda (comparación visual de miniaturas, diferencia media ${num(x.meanAbsDiff0to255,1)}/255; la imagen enviada no se conservó).`:'Generada a partir de otra vista del modelo de la misma estancia (la enviada no se conservó).'}${/Salón/.test(l)?' Añade en primer plano un dormitorio que no forma parte de esta estancia y cambia la proporción del encuadre: no sirve para juzgar la distribución.':''} La geometría válida es la del modelo.</p></div>
   ${r?`<div class="c1-12"><p class="caption">En la estancia: ${esc(roomObjs(r)||'sin objetos colocados')}.</p></div>`:''}</div>`});}
 if(planDemo)P.push({html:`<div class="grid" style="align-content:start"><div class="c1-12"><h2 class="h2">Cómo avanzará la obra</h2><p class="read" style="max-width:200mm">Plan de ejemplo de RUBIK aplicado a esta misma vivienda en la Evolución de obra. <b>Fechas ilustrativas; sin presupuesto vinculado; no es un calendario de obra.</b></p></div>
  <div class="c1-8" style="margin-top:3mm">${gridSvg({w:172,h:84})}<p class="caption">Línea discontinua: fases que el modelo no dibuja.</p></div>
  <div class="c9-12" style="margin-top:3mm;display:grid;grid-template-columns:1fr 1fr;gap:2mm;align-content:start">${obra?obra.stills.map((s,i)=>im(s,'Fase '+(i+1),'width:100%;height:26mm;object-fit:cover')).join(''):''}<p class="caption" style="grid-column:1/-1">${obra?`Fotogramas del vídeo exportado por la Evolución de obra (${Math.round(obra.dur)} s), incluido en la versión para pantalla.`:'El vídeo de obra no está disponible en esta entrega.'}</p></div></div>`});
 if(V)P.push({html:`<div class="grid"><div class="c1-5"><h2 class="h2">Presupuesto</h2>${fig(nf(2).format(totalGross),'€','Total con IVA',`Base ${eur(V.summary.net.amount)} más IVA ${num(V.summary.tax.ratePercent,0)} %`,'focal')}
  <p class="note" style="margin-top:6mm"><b>${V.summary.reviewComplete?'Revisado por el estudio.':'Pendiente de revisión del estudio.'}</b> ${esc(PRICE_NOTE)}</p></div><div class="c6-12">${chapterChart(V,{w:150})}<p class="caption">Importe neto por capítulo. El detalle de partidas está en la propuesta económica.</p></div></div>`});
 P.push({html:`<div class="grid"><div class="c1-4"><h2 class="h2">Lo que hay que decidir</h2><p class="read">Lo que el proyecto deja abierto, para hablarlo con el estudio.</p><p class="caption" style="margin-top:4mm">Los pavimentos se confirman sobre la muestra real del fabricante, no sobre el color del modelo.</p><p class="caption" style="margin-top:4mm">Para responder, escribe al estudio${prof.email?` (${esc(prof.email)})`:''}.</p></div>
  <div class="c5-12"><table class="flow"><thead><tr><th style="width:8mm"></th><th>Qué</th><th>Estado</th></tr></thead><tbody>${decisions.map(d=>`<tr><td><svg width="4mm" height="4mm"><rect x=".3" y=".3" width="3.4" height="3.4" rx=".4" fill="none" stroke="${T.ink}" stroke-width=".3"/></svg></td><td><b>${esc(d.q)}</b><br><span class="muted">${esc(d.d)}</span></td><td style="white-space:nowrap">${esc(d.state)}</td></tr>`).join('')}</tbody></table></div></div>`});
 P.push({html:`<div class="grid"><div class="c1-5"><h2 class="h2">Documentos</h2><table><tbody>${DOCLIST.filter(d=>d.id!=='entrega-integral').map(d=>`<tr><td><b>${esc(d.name)}</b><br><span class="muted">${esc(d.what)}</span></td></tr>`).join('')}</tbody></table></div>
  <div class="c7-12"><h2 class="h2">Procedencia</h2><p class="read">Planta, superficies y mediciones: geometría del proyecto en RUBIK, revisión ${esc(rev)}. Vistas: modelo 3D del proyecto, no fotografías. Imágenes con IA: orientativas, a partir de vistas del modelo. ${V?esc(PRICE_NOTE):''} ${planDemo?'Plan de obra: ejemplo ilustrativo sin presupuesto.':''}</p><p class="caption" style="margin-top:4mm">Entrega de solo lectura. No contiene el proyecto editable.</p></div></div>`});
 const Dout={'entrega-integral':doc('entrega-integral','Presentación integral','client',P)};

 // ---------- escribir la web (los PDF se copian en documentos/ cuando existen: compose escribe la web después de imprimir) ----------
 const discard=()=>fs.rmSync(OUT,{recursive:true,force:true});
 const writeWeb=async(fresh,en)=>{for(const d of DOCLIST){const f=path.join(outDir,d.id+'.pdf');if(fresh.has(d.id)&&exists(f)){fs.copyFileSync(f,path.join(DOCS,d.id+'.pdf'));}}
  const files=[];for(const t of TIPOS){const name=t.id==='integral'?'index.html':`tipo-${t.id}.html`;fs.writeFileSync(path.join(OUT,name),web(t));files.push({tipo:t.id,name:t.name,file:name,chapters:t.ch,documents:t.docs});}
  // v1.3 · inglés: solo si TODOS los documentos de cliente pasaron en inglés (el compositor lo decide). La web se traduce en el
  // DOM con el mismo diccionario; los enlaces van a los PDF ingleses; si queda español o falta un PDF, no se publica en inglés.
  let idiomas=['es'],enReport=null;
  if(en){const docsEn=DOCLIST.filter(d=>fresh.has(d.id+'.en')&&exists(path.join(outDir,d.id+'.en.pdf')));
   if(docsEn.length===DOCLIST.filter(d=>fresh.has(d.id)).length){for(const d of docsEn)fs.copyFileSync(path.join(outDir,d.id+'.en.pdf'),path.join(DOCS,d.id+'.en.pdf'));
    const pg=await en.browser.newPage();enReport=[];
    for(const x of files){const src=path.join(OUT,x.file),dst=x.file.replace(/\.html$/,'.en.html');await pg.goto('file://'+path.resolve(src));
     const r=await pg.evaluate(`(${en.js})(${JSON.stringify(en.dict)},${JSON.stringify(en.data)})`);
     await pg.evaluate(()=>{for(const a of document.querySelectorAll('a.doc[href$=".pdf"]'))a.setAttribute('href',a.getAttribute('href').replace(/\.pdf$/,'.en.pdf'));});
     fs.writeFileSync(path.join(OUT,dst),'<!doctype html>\n'+(await pg.evaluate(()=>document.documentElement.outerHTML)));x.fileEn=dst;enReport.push({file:dst,residual:r.residual.length,sample:r.residual.slice(0,8)});}
    await pg.close();
    if(enReport.every(r=>!r.residual))idiomas=['es','en'];else for(const x of files){fs.rmSync(path.join(OUT,x.fileEn),{force:true});delete x.fileEn;}}}
  const pieces=[...reg,...DOCLIST.flatMap(d=>[d.id+'.pdf',...(idiomas.includes('en')?[d.id+'.en.pdf']:[])]).filter(f=>exists(path.join(DOCS,f))).map(f=>({file:`documentos/${f}`,sha256:sha(path.join(DOCS,f)),producer:'compositor del laboratorio (tools/compose.cjs)',...(f.endsWith('.en.pdf')?{idioma:'en'}:{})}))];
  // v1.3 A07/A08: el registro liga la entrega al snapshot exacto (huella del archivo), declara la huella de cada página web
  // y el capítulo propietario de cada pieza (grafo de contenido que usa la exportación).
  const web_=files.flatMap(x=>[x.file,...(x.fileEn?[x.fileEn]:[])]).map(f=>({file:f,sha256:sha(path.join(OUT,f))}));
  const OWNER=f=>/^media\/obra|^documentos\/obra-/.test(f)?'obra':/^media\/recorrido/.test(f)?'recorrido':/^media\/ia-/.test(f)?'estancias':/^media\/dibujo-vivo/.test(f)?'portada':/^media\/vista-/.test(f)?null:undefined;
  const ftManSrc=ftMan?path.join(ftDir,ftMan):null;
  fs.writeFileSync(path.join(OUT,'entrega.json'),JSON.stringify({schema:'rubik-lab-entrega/0.2',generated:new Date().toISOString(),idiomas,i18n:enReport,project:S.project,snapshot:{file:path.relative(LAB,C.snapFile),sha256:sha(C.snapFile)},web:web_,studio:{name:STUDIO,synthetic:/\.invalid/.test(prof.email||'')},
   tipos:files,pieces:pieces.map(x=>{const o=OWNER(x.file);return o===undefined?x:{...x,capitulo:o};}),ft3d8:ftManifest?{manifestId:ftManifest.id,project:ftManifest.project||ftManifest.projectRef||null,file:path.relative(LAB,ftManSrc),sha256:sha(ftManSrc)}:null,
   orientative:['imágenes IA','plan y vídeo de obra (ejemplo, fechas ilustrativas, sin presupuesto)','precios (de prueba de laboratorio)'],
   notIncluded:['proyecto editable','visita 3D interactiva (requiere enlace publicado)','datos de otros proyectos']},null,1));
  const PRO=path.join(outDir,'profesional');fs.mkdirSync(PRO,{recursive:true});
  if(exists(path.join(outDir,'commercial-proposal-studio-v3.pdf')))fs.copyFileSync(path.join(outDir,'commercial-proposal-studio-v3.pdf'),path.join(PRO,'propuesta-estudio.pdf'));
  fs.writeFileSync(path.join(PRO,'vista-previa.html'),web(TIPOS[0],{preview:true}));
  // publicación: la anterior se conserva como entrega-anterior/, la nueva entra por renombrado
  const prep=prepararPage(files,pieces);
  const PREV=path.join(outDir,'entrega-anterior');if(fs.existsSync(FINAL)){fs.rmSync(PREV,{recursive:true,force:true});fs.renameSync(FINAL,PREV);}
  fs.renameSync(OUT,FINAL);
  fs.writeFileSync(path.join(PRO,'preparar-entrega.html'),prep);
  return files;};

 // ---------- profesional: «Preparar entrega» (out/<v>/profesional/preparar-entrega.html) ----------
 // El profesional elige el tipo de entrega, ajusta capítulos y documentos, ve la entrega del cliente tal cual (iframe de la
 // web integral con lo no elegido oculto), repasa las comprobaciones previas y descarga el registro de la entrega (JSON con
 // SHA-256 de cada pieza). Todo local: no envía ni publica nada.
 const prepararPage=(files,pieces)=>{const MB=b=>(b/1048576).toFixed(1).replace('.',',')+' MB';
  const folderBytes=(()=>{let t=0;const walk=d=>{for(const f of fs.readdirSync(d)){const x=path.join(d,f),st=fs.statSync(x);st.isDirectory()?walk(x):t+=st.size;}};walk(OUT);return t;})();
  const vids=[obra&&{n:'Vídeo de la obra',f:path.join(OUT,obra.video)},tour&&{n:'Vídeo del recorrido',f:path.join(OUT,tour.video)}].filter(Boolean).map(v=>({...v,b:fs.statSync(v.f).size}));
  const ftRev=ftManifest?JSON.stringify(ftManifest).match(/"revision"\s*:\s*"([^"]+)"/)?.[1]||null:null;
  const synthetic=/\.invalid/.test(prof.email||'');
  const checks=[
   {k:'Identidad del estudio',s:!prof.name?'block':synthetic?'warn':'ok',t:!prof.name?'Falta el perfil de «Mi estudio»: la entrega saldría sin firma.':synthetic?`${STUDIO}: perfil sintético del laboratorio (dominio .invalid). En una entrega real se usa el perfil de «Mi estudio» sin cambiar el logotipo ni la identidad.`:STUDIO},
   {k:'Mismo proyecto en todas las piezas',s:'ok',t:`Proyecto ${S.project.id}, revisión ${rev}. Las vistas, la planta, el presupuesto y el recorrido salen de esa revisión.${ftManifest?` El vídeo de obra declara en su manifiesto el mismo proyecto${ftRev?` (huella ${ftRev.slice(0,12)}…)`:''}.`:' Vídeo de obra: no incluido.'}`},
   ...(V?[{k:'Presupuesto revisado',s:V.summary.reviewComplete?'ok':'warn',t:`${V.summary.items-V.summary.unreviewed} de ${V.summary.items} partidas revisadas. El cliente verá «Pendiente de revisión del estudio». ${PRICE_NOTE}`}]:[{k:'Presupuesto',s:'info',t:'El proyecto no tiene presupuesto con precios: ningún capítulo muestra importes.'}]),
   ...(Object.keys(ai).length?[{k:'Imágenes IA',s:Object.values(ai).every(x=>x.exact)?'ok':'warn',t:`${Object.keys(ai).length} imágenes, siempre junto a una vista del modelo y rotuladas «orientativa». ${Object.entries(ai).filter(([,x])=>!x.exact).map(([l])=>`${l}: generada desde otra vista de la misma estancia (la imagen enviada no se conservó).`).join(' ')} RUBIK guarda los renders solo en la memoria de la sesión: guárdalos antes de cerrar.`}]:[]),
   ...(planDemo?[{k:'Plan de obra',s:'warn',t:'Plan de ejemplo de la demo de RUBIK importado al proyecto: fechas ilustrativas, sin partidas vinculadas. Rotulado así en la entrega; no es un calendario de obra.'}]:[]),
   {k:'Sin el proyecto editable',s:'ok',t:'La carpeta de la entrega no contiene el archivo del proyecto. Ojo: la descarga «Vistas + proyecto ZIP» de RUBIK sí incluye el proyecto editable; no la adjuntes a una entrega de cliente.'},
   {k:'Peso y formato',s:folderBytes>25*1048576?'warn':'ok',t:`Carpeta completa: ${MB(folderBytes)}. ${vids.map(v=>`${v.n}: MP4 H.264, ${MB(v.b)}${v.b>12*1048576?' (supera los 12 MB que RUBIK incrusta en la presentación de obra)':''}`).join('; ')}. ${folderBytes>25*1048576?'Supera lo que admite un correo habitual: envíala como ZIP por un servicio de archivos o en mano.':'Cabe en un correo habitual comprimida en ZIP.'}`},
   {k:'Enlace para el cliente',s:'info',t:'Esta entrega es una carpeta para ver sin conexión. La publicación remota de la entrega de obra está desactivada hasta la decisión DEC-05. Si se publica un enlace: «no indexado» no es privado (lo abre cualquiera que lo tenga) y la caducidad del almacenamiento depende de #244.'},
   {k:'Visita 3D interactiva',s:'info',t:'No va en la carpeta: necesita un enlace publicado. Este proyecto es de una planta; en edificios de varias plantas la visita del cliente tiene restricciones.'},
   {k:'Datos personales',s:'ok',t:'Sin datos de clientes ni de otros proyectos. Solo el contacto del estudio.'}];
  const DATA={tipos:TIPOS,ch:CH,docs:DOCLIST.map(d=>({id:d.id,name:d.name,what:d.what,pages:d.pages||null,size:d.size||null})),files,pieces:pieces.map(x=>({file:x.file,sha256:x.sha256})),checks,project:{id:S.project.id,name:TITLE,revision:rev,snapshotSha256:sha(C.snapFile)},studio:STUDIO};
  const css=`:root{--ink:#1f2326;--muted:#5b6266;--rule:#d9dcdc;--surface:#f4f5f4;--paper:#fff;--action:#1f5a66;--warn:#7a5200;--warnSoft:#fff4dc;--ok:#2f6e4a;--block:#9b2c2c}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 'RUBIK Inter',system-ui,sans-serif;color:var(--ink);background:var(--surface)}h1,h2{margin:0;font-weight:700}h1{font-size:20px}h2{font-size:15px;margin:0 0 10px}
.app{display:grid;grid-template-columns:minmax(360px,440px) 1fr;height:100vh}.side{overflow:auto;background:var(--paper);border-right:1px solid var(--rule);padding:20px 22px 40px}.side header p{margin:4px 0 0;color:var(--muted);font-size:13.5px}
.step{border-top:1px solid var(--rule);padding:18px 0}.step:first-of-type{margin-top:16px}.step h2 span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-size:12px;margin-right:8px}
.types{display:grid;gap:8px}.types label{display:block;border:1px solid var(--rule);border-radius:8px;padding:10px 12px;cursor:pointer}.types label:has(input:checked){border-color:var(--action);box-shadow:0 0 0 1px var(--action)}.types input{margin-right:8px}.types small{display:block;color:var(--muted);margin:2px 0 0 24px;font-size:12px}
.opts{display:grid;gap:4px;font-size:13.5px}.opts label{display:flex;gap:8px;align-items:flex-start}.opts small{color:var(--muted)}
.check{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:9px 0;border-top:1px solid var(--surface);font-size:13.5px}.check b{font-size:13.5px}.pill{font-size:12px;font-weight:700;border-radius:999px;padding:2px 8px;align-self:start;white-space:nowrap}
.ok{background:#e6f1ea;color:var(--ok)}.warn{background:var(--warnSoft);color:var(--warn)}.block{background:#f8e1e1;color:var(--block)}.info{background:#e7eef0;color:var(--action)}
.btn{display:inline-block;font:inherit;font-weight:700;border:1px solid var(--ink);background:var(--paper);border-radius:8px;padding:9px 14px;cursor:pointer;text-decoration:none;color:inherit}.btn.primary{background:var(--action);border-color:var(--action);color:#fff}.row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.preview{display:flex;flex-direction:column;min-width:0}.bar{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--rule);background:var(--paper);font-size:13.5px}.bar .seg{margin-left:auto;display:flex;gap:4px}.bar button{font:inherit;border:1px solid var(--rule);background:var(--paper);border-radius:6px;padding:5px 10px;cursor:pointer}.bar button[aria-pressed=true]{border-color:var(--ink);font-weight:700}
.stage{flex:1;overflow:auto;display:flex;justify-content:center;padding:16px}iframe{border:1px solid var(--rule);background:#fff;height:100%;min-height:600px;width:100%;}
table{width:100%;border-collapse:collapse;font-size:12px}td{border-top:1px solid var(--surface);padding:5px 6px 5px 0;vertical-align:top}td code{font-size:12px;color:var(--muted);word-break:break-all}
#log li{font-size:13.5px;margin:4px 0}
@media (max-width:900px){.app{grid-template-columns:1fr;height:auto}.side{border-right:0}.stage{height:80vh}}`;
  const js=`const D=${JSON.stringify(DATA).replace(/</g,'\\u003c')};const $=s=>document.querySelector(s);const fr=$('#pv');let tipo=D.tipos[0];
const ALL=Object.keys(D.ch).filter(c=>c!=='portada');
function drawOpts(){ $('#chs').innerHTML=ALL.map(c=>'<label><input type=checkbox data-ch="'+c+'"'+(tipo.ch.includes(c)?' checked':'')+'> '+D.ch[c]+'</label>').join('');
 $('#dcs').innerHTML=D.docs.map(d=>'<label><input type=checkbox data-doc="'+d.id+'"'+(tipo.docs.includes(d.id)?' checked':'')+'> <span>'+d.name+(d.pages?' <small>('+d.pages+(d.pages===1?' pág., ':' págs., ')+d.size+')</small>':'')+'</span></label>').join('');}
function sel(){return {ch:[...document.querySelectorAll('[data-ch]:checked')].map(x=>x.dataset.ch),docs:[...document.querySelectorAll('[data-doc]:checked')].map(x=>x.dataset.doc)};}
function push(){const s=sel();fr.contentWindow.postMessage({rubikHide:ALL.filter(c=>!s.ch.includes(c)),rubikDocs:s.docs,rubikKind:tipo.name,rubikLead:tipo.lead},location.origin==='null'?'*':location.origin);
 const same=s.ch.length===tipo.ch.filter(c=>c!=='portada').length&&s.ch.every(c=>tipo.ch.includes(c))&&s.docs.length===tipo.docs.length&&s.docs.every(d=>tipo.docs.includes(d));
 $('#custom').textContent=same?'Contenido del tipo «'+tipo.name+'».':'Contenido personalizado a partir de «'+tipo.name+'».';
 const f=D.files.find(x=>x.tipo===tipo.id);$('#open').href='../entrega/'+f.file;}
document.addEventListener('change',e=>{if(e.target.name==='tipo'){tipo=D.tipos.find(t=>t.id===e.target.value);drawOpts();}push();});
fr.addEventListener('load',push);
for(const b of document.querySelectorAll('[data-w]'))b.onclick=()=>{fr.style.width=b.dataset.w;document.querySelectorAll('[data-w]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
$('#reg').onclick=()=>{const s=sel(),now=new Date().toISOString();
 const r={tipo:tipo.id,capitulos:s.ch,documentos:s.docs,omitir:[...document.querySelectorAll('[data-omit]:checked')].map(x=>x.dataset.omit),modo:document.querySelector('[name=modo]:checked').value,idioma:document.querySelector('[name=idioma]:checked').value,reconocidos:[],seleccionadaEn:now,base:{proyecto:D.project.id,revision:D.project.revision,snapshotSha256:D.project.snapshotSha256},nota:'Selección para tools/preparar.cjs. No es el registro de la entrega: el registro es el MANIFIESTO.json que escribe la exportación, con las comprobaciones recalculadas sobre los archivos finales.'};
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,1)],{type:'application/json'}));a.download='seleccion-'+tipo.id+'-'+now.slice(0,10)+'.json';document.body.append(a);a.click();a.remove();
 const li=document.createElement('li');li.textContent=now.slice(0,16).replace('T',' ')+', '+tipo.name+': '+(r.capitulos.length+1)+' capítulos, '+s.docs.length+' documentos, modo '+r.modo;$('#log').prepend(li);};
drawOpts();`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preparar entrega, ${esc(TITLE)}</title><style>${FONT_CSS}\n${css}</style></head><body>
<div class="app"><aside class="side"><header><h1>Preparar entrega</h1><p>${esc(TITLE)} · revisión ${esc(rev)} · ${esc(STUDIO)}</p></header>
<section class="step"><h2><span>1</span>Tipo de entrega</h2><div class="types">${TIPOS.map((t,i)=>`<label><input type="radio" name="tipo" value="${t.id}"${i?'':' checked'}>${esc(t.name)}<small>${esc(t.lead)}</small></label>`).join('')}</div></section>
<section class="step"><h2><span>2</span>Contenido</h2><p id="custom" class="opts" style="color:var(--muted);font-size:13.5px;margin:0 0 8px"></p><div class="opts" id="chs"></div><h2 style="margin-top:14px">Documentos que acompañan</h2><div class="opts" id="dcs"></div></section>
<section class="step"><h2><span>3</span>Comprobaciones previas</h2><p style="font-size:13.5px;margin:0 0 6px;color:var(--muted)">Resumen orientativo calculado al componer. Quien decide es la exportación: recalcula cada comprobación sobre los archivos finales, bloquea los fallos y exige reconocer los avisos en modo cliente.</p>${checks.map(c=>`<div class="check"><span class="pill ${c.s==='block'?'block':c.s}">${({ok:'Correcto',warn:'Revisar',block:'Bloquea',info:'A saber'})[c.s]}</span><div><b>${esc(c.k)}</b><div>${esc(c.t)}</div></div></div>`).join('')}</section>
<section class="step"><h2><span>4</span>Preparar y revisar</h2><p style="font-size:13.5px;margin:0">La vista de la derecha es una <b>simulación</b> para elegir: oculta en pantalla lo no elegido. Para revisar la entrega <b>real</b>, descarga la selección y ejecuta <code>node tools/preparar.cjs seleccion.json</code>: exporta, verifica el ZIP exacto y abre una página de revisión con los bytes producidos, su manifiesto y los avisos que hay que reconocer. Nada se publica.</p>
<div class="opts" style="margin-top:8px"><b style="font-size:13.5px">Idioma</b><label><input type="radio" name="idioma" value="es" checked> Español</label><label><input type="radio" name="idioma" value="en"> Inglés (solo si la entrega está compuesta en inglés)</label></div>
<div class="opts" style="margin-top:8px"><b style="font-size:13.5px">Omitir aunque el capítulo vaya</b><label><input type="checkbox" data-omit="imagenes-ia"> Imágenes generadas con IA</label><label><input type="checkbox" data-omit="videos"> Vídeos (obra y recorrido)</label></div>
<div class="opts" style="margin-top:8px"><label><input type="radio" name="modo" value="cliente" checked> Cliente: los avisos deben reconocerse</label><label><input type="radio" name="modo" value="borrador"> Borrador: rotulado «no apto para enviar»</label></div>
<div class="row"><a class="btn" id="open" href="../entrega/index.html" target="_blank">Abrir la página del tipo</a><button class="btn primary" id="reg" type="button">Descargar la selección (JSON)</button></div>
<h2 style="margin-top:16px">Selecciones de esta sesión</h2><ul id="log" style="padding-left:18px;margin:0"></ul>
<h2 style="margin-top:16px">Solo para el estudio</h2><p style="font-size:13.5px;margin:0"><a href="propuesta-estudio.pdf">Propuesta económica del estudio</a>: origen de cada precio, merma y estado de revisión. No va en ninguna entrega de cliente.</p>
<details style="margin-top:14px"><summary style="font-size:13.5px;font-weight:700;cursor:pointer">Piezas y huellas SHA-256 (${pieces.length})</summary><table><tbody>${pieces.map(x=>`<tr><td>${esc(x.file)}</td><td><code>${x.sha256.slice(0,16)}…</code></td></tr>`).join('')}</tbody></table></details></section></aside>
<main class="preview"><div class="bar"><b>Vista del cliente</b><span style="color:var(--muted)">la entrega tal como la recibe, sin la interfaz de RUBIK</span><div class="seg"><button data-w="100%" aria-pressed="true">Escritorio</button><button data-w="820px" aria-pressed="false">Tableta</button><button data-w="390px" aria-pressed="false">Móvil</button></div></div>
<div class="stage"><iframe id="pv" src="vista-previa.html" title="Vista previa de la entrega del cliente"></iframe></div></main></div><script>${js}</script></body></html>`;};
 return {D:Dout,writeWeb,discard,TIPOS,CH,meta:{entrega:{ai:Object.keys(ai),drawing:!!drawing,tour:!!tour,obra:!!obra,ftDoc:!!ftDoc,tasks:tasks.length}}};
};

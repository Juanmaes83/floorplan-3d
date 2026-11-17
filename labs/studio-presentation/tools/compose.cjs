// E0 · Composer v2 of the Studio Presentation prototypes from the canonical snapshot (snapshot.json). Lab only.
// Regla de oro: every figure, name, line and image comes from the snapshot (RUBIK's own engines). The composer only
// formats, lays out and does labelled arithmetic. Unknown data is printed as unknown, never filled in.
// v2 applies: GSP EXTEND (RUBIK tokens kept), Brand Identity audits (cv08, ZH gap declared), Huashu (no "·" chains,
// lint port, three-direction gate), Diagram Design (tag backing, ≤2 italic callouts, legend strip, axonometric plan).
// Usage: node compose.cjs <snapshotDir> <outDir>   → <outDir>/<id>.html + .pdf + qa.json
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const [snapDir,outDir]=process.argv.slice(2);fs.mkdirSync(outDir,{recursive:true});
const S=JSON.parse(fs.readFileSync(path.join(snapDir,'snapshot.json'),'utf8'));
const LAB=path.resolve(__dirname,'..');
const IFC_FONTS=process.env.IFC_FONTS||path.join(LAB,'vendor/fonts/inter'); // Inter OFL, copia sin modificar (vendor/PROCEDENCIA.md)
const FS4=path.join(__dirname,'node_modules/@fontsource/source-serif-4/files');
const HUASHU_PROBE=process.env.HUASHU_PROBE||path.join(LAB,'vendor/huashu/design-lint-collect.js'); // MIT (vendor/PROCEDENCIA.md)
const b64=f=>fs.readFileSync(f).toString('base64');
const FONT_CSS=[
 ['RUBIK Inter',400,'normal',path.join(IFC_FONTS,'Inter-Regular.ttf'),'truetype'],
 ['RUBIK Inter',700,'normal',path.join(IFC_FONTS,'Inter-Bold.ttf'),'truetype'],
 ['RUBIK Serif',400,'normal',path.join(FS4,'source-serif-4-latin-400-normal.woff2'),'woff2'],
 ['RUBIK Serif',600,'normal',path.join(FS4,'source-serif-4-latin-600-normal.woff2'),'woff2'],
 ['RUBIK Serif',400,'italic',path.join(FS4,'source-serif-4-latin-400-italic.woff2'),'woff2'],
].map(([fam,w,st,f,fmt])=>`@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};font-display:block;src:url(data:font/${fmt==='woff2'?'woff2':'ttf'};base64,${b64(f)}) format('${fmt}')}`).join('\n');
const CSS=fs.readFileSync(path.join(LAB,'system/rubik-editorial.css'),'utf8');
const T={ink:'#2d332f',muted:'#626457',rule:'#cbc2b3',paper:'#fffdf8',field:'#f4f0e8',partition:'#626457',low:'#8d8a7f'};
const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:true});
const eur=v=>nf(2).format(v)+' €',num=(v,d=2)=>nf(d).format(v);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const date=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(S.brand?.takenAt||S.takenAt));
const P=S.project,B=S.brand,prof=B.profile||{},rev=P.revision||'sin revisión',TITLE=B.title||P.name||'Proyecto sin título';
const rooms=S.geometry.rooms,counted=rooms.filter(r=>r.counted),area=S.surfaces?.areaM2??null;
// B2 · honest defaults: a missing value is written as missing, never as 0 or as an empty string.
const STUDIO=prof.name||'Estudio no facilitado';
const AREA=area==null?'—':num(area);
const INTRO=B.intro?esc(B.intro):'<span class="unk">El profesional no ha escrito la descripción del proyecto.</span>';
const NOGEO=!rooms.length&&!S.geometry.walls.length;
const emptyDrawing=(w,h,t)=>`<div class="frame" style="width:${w}mm;height:${h}mm;display:flex;align-items:center;justify-content:center;text-align:center;padding:6mm"><p class="caption" style="margin:0">${t}</p></div>`;
const LOGO=(h=14,w=50)=>prof.logo?.dataUrl?`<img class="logo" src="${prof.logo.dataUrl}" alt="${esc(prof.logo.label||'Logotipo del estudio')}" style="display:block;max-height:${h}mm;max-width:${w}mm;width:auto;height:auto;object-fit:contain">`:'';
// B2 · long names: type steps down one size instead of overflowing; lists switch to a shorter honest form. Nothing is cut.
const LONGEST=Math.max(0,...rooms.map(r=>r.name.length));const LONG_ROOMS=LONGEST>34;
const h1Size=t=>t.length>90?'18pt':t.length>55?'22pt':null;
const H1=(t,extra='')=>`<h1 class="h1" style="${h1Size(t)?'font-size:'+h1Size(t)+';':''}${extra}">${esc(t)}</h1>`;
const NO_GEO_TEXT='El proyecto no tiene geometría dibujada: no hay planta ni axonometría que mostrar.';
const roomArea=r=>r&&r.areaM2!=null?num(r.areaM2)+' m²':'superficie no disponible';
const biggest=[...rooms].filter(r=>r.areaM2!=null).sort((a,b)=>b.areaM2-a.areaM2)[0]||null;
// Rooms whose name does not fit in the drawing are numbered (by their order in the project) and listed under it.
const roomNo=r=>rooms.indexOf(r)+1;
const sheetTable=()=>LONG_ROOMS?`<table><thead><tr><th>N.º</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${roomNo(r)}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('')}<tr class="total"><td>Útil computada</td><td class="num">${AREA}</td><td></td></tr></tbody></table><p class="caption">Los nombres de las estancias son largos para la lámina: están en el cuadro completo de la página siguiente, con el mismo número que en el dibujo.</p>`:null;
const annexPage=(sheetNo)=>({foot:true,html:`<div class="grid"><div class="c1-4"><h2 class="h2">Cuadro de superficies</h2><p class="read">Anexo a la lámina ${sheetNo}. Cada número es el de la estancia en el dibujo.</p><p class="caption">${esc(STATUS_AREA)}</p></div><div class="c5-12"><table><thead><tr><th>N.º</th><th>Estancia</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rooms.map(r=>`<tr><td class="muted">${roomNo(r)}</td><td>${esc(r.name)}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('')}<tr class="total"><td colspan="2">Superficie útil computada</td><td class="num">${AREA}</td><td></td></tr></tbody></table></div></div>`});
const keyList=k=>k&&k.length?`<p class="caption"><b>Estancias numeradas en el dibujo</b> (su nombre no cabe en el plano): ${k.map(x=>`${x.n} ${esc(x.name)}, ${esc(x.area)}`).join('; ')}.</p>`:'';
const keySvg=(t,u,at)=>`<g><circle cx="${at.x}" cy="${at.y}" r="${6.5*u}" fill="${T.paper}" stroke="${T.ink}" stroke-width="${.5*u}"/><text x="${at.x}" y="${at.y+2.6*u}" text-anchor="middle" font-size="${7.4*u}" font-weight="700" fill="${T.ink}">${roomNo(t.r)}</text></g>`;
const matById=Object.fromEntries(S.materials.map(m=>[m.id,m]));
const byName=re=>rooms.filter(r=>re.test(r.name)).length;
const floors=[...S.board.floors].sort((a,b)=>b.areaM2-a.areaM2);
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const toHex=c=>'#'+c.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
const tint=(h,k)=>toHex(hex2rgb(h).map(v=>1-(1-v)*k));
const VIEW_NOTE='Vista del modelo 3D del proyecto generada por RUBIK. No es una fotografía.';
const STATUS_AREA=`Superficies calculadas por RUBIK sobre el modelo, con escala ${P.scale==='estimated'?'estimada':'verificada'}. No sustituyen a una medición en obra.`;
let views=[];const viewBy=l=>views.find(v=>v.label===l);
const VW={}; // viewport width (px at 96 dpi) per document, from its page size: A4 landscape 1123, A4 portrait 794, A3 landscape 1588
// ---------- geometry helpers ----------
const centroid=r=>r.labelAt||{x:r.polygon.reduce((s,p)=>s+p.x,0)/r.polygon.length,y:r.polygon.reduce((s,p)=>s+p.y,0)/r.polygon.length};
const bbox=pts=>({x0:Math.min(...pts.map(p=>p.x)),y0:Math.min(...pts.map(p=>p.y)),x1:Math.max(...pts.map(p=>p.x)),y1:Math.max(...pts.map(p=>p.y))});
const wallById=Object.fromEntries(S.geometry.walls.map(x=>[x.id,x]));
const W_COLOR={'load-bearing':T.ink,exterior:T.ink,partition:T.partition,low:T.low};
// Room tags (Diagram Design): fixed sizes, opaque paper backing with hairline, never shrunk to fit. If a tag does not fit
// its room on one or two lines it becomes an italic-serif callout in the margin with a dashed leader (max 2 per drawing).
function tagLayout(u){const fsN=7.5*u,fsA=7.5*u,cw=.6;const out=[];
 for(const r of rooms){const b=bbox(r.polygon),c=centroid(r),availW=b.x1-b.x0-260,availH=b.y1-b.y0-260;
  const areaTxt=r.areaM2==null?'sin área':num(r.areaM2)+' m²'+(r.counted?'':', no computa');
  // Balanced breaks into 1–3 lines at spaces or after hyphens (never shrinking the type).
  const toks=r.name.match(/[^\s-]+-?/g)||[r.name],join=a=>a.reduce((s,t,i)=>s+(i&&!a[i-1].endsWith('-')?' ':'')+t,'');
  const splits=n=>{if(n===1)return [[join(toks)]];const res=[];const rec=(i,acc)=>{if(acc.length===n-1){res.push([...acc,join(toks.slice(i))]);return;}for(let j=i+1;j<toks.length;j++)rec(j,[...acc,join(toks.slice(i,j))]);};rec(0,[]);return res.filter(l=>l.length===n&&l.every(x=>x));};
  const cands=[1,2,3].map(n=>splits(n).sort((a,b)=>Math.max(...a.map(x=>x.length))-Math.max(...b.map(x=>x.length)))[0]).filter(Boolean);
  const size=lines=>({w:Math.max(...lines.map(l=>l.length*fsN*cw),areaTxt.length*fsA*.56)+2.4*u,h:lines.length*fsN*1.2+fsA*1.3+2.4*u});
  // B2: a tag in the drawing holds a short name only; a longer one (> 28 characters) is numbered and listed, never set as 3 lines of 7.5 pt.
  let lines=null;if(r.name.length<=28)for(const L of cands){const s=size(L);if(s.w<=availW&&s.h<=availH){lines=L;break;}}
  out.push({r,c,lines,areaTxt,fsN,fsA,callout:!lines,box:lines?size(lines):null});}
 return out;}
function tagSvg(t,u,at){const {lines,areaTxt,fsN,fsA}=t,box=t.box,x=at.x,y=at.y-box.h/2;
 return `<g><rect x="${x-box.w/2}" y="${y}" width="${box.w}" height="${box.h}" fill="${T.paper}" stroke="${T.rule}" stroke-width="${.15*u}"/>${lines.map((l,i)=>`<text x="${x}" y="${y+1.2*u+fsN*(i+1)}" text-anchor="middle" font-size="${fsN}" font-weight="700" fill="${T.ink}">${esc(l)}</text>`).join('')}<text x="${x}" y="${y+1.2*u+fsN*1.2*lines.length+fsA*1.05}" text-anchor="middle" font-size="${fsA}" fill="${T.muted}">${esc(areaTxt)}</text></g>`;}
// ---------- orthographic plan from canonical geometry ----------
function plan({w=170,h=150,objects=false,floorTint=true,scale=null,callouts=true,labels=true,pad=400}={}){
 if(NOGEO)return {svg:emptyDrawing(w,h,NO_GEO_TEXT),pw:w,ph:h,mmPerUnit:1/50,callouts:0,dropped:0,keys:[]};
 const pts=[...S.geometry.walls.flatMap(x=>[x.start,x.end]),...rooms.flatMap(r=>r.polygon)];const b=bbox(pts);
 // Callout text is wrapped (≤3 lines) and the right margin is sized to it, so nothing is clipped.
 const callLines=t=>{const toks=t.r.name.split(' ');const L=[];let cur='';for(const w of toks){if((cur+' '+w).trim().length>12&&cur){L.push(cur);cur=w;}else cur=(cur+' '+w).trim();}if(cur)L.push(cur);return L;};
 const callArea=t=>t.r.areaM2==null?['sin área']:[num(t.r.areaM2)+' m²',...(t.r.counted?[]:['no computa'])];
 let right=0,vbW,vbH,pw,ph;const minX=b.x0-pad,minY=b.y0-pad;vbH=b.y1-b.y0+2*pad;
 for(let it=0;it<4;it++){vbW=b.x1-b.x0+2*pad+right;if(scale){pw=vbW/scale;ph=vbH/scale;}else{const k=Math.min(w/vbW,h/vbH);pw=vbW*k;ph=vbH*k;}
  const uu=.3528/(pw/vbW),callers=callouts&&labels?tagLayout(uu).filter(t=>t.callout).slice(0,2):[];if(!callers.length)break;
  const need=900+Math.max(...callers.flatMap(t=>[...callLines(t).map(l=>l.length*9*uu*.5),...callArea(t).map(l=>l.length*7.5*uu*.56)]));if(Math.abs(need-right)<20)break;right=need;}
 const mmPerUnit=pw/vbW,u=.3528/mmPerUnit; // u = model units per pt
 const out=[`<title>Planta de ${esc(TITLE)}</title><desc>Planta dibujada desde la geometría de RUBIK: ${S.geometry.walls.length} muros, ${S.geometry.openings.length} huecos y ${rooms.length} estancias.</desc>`];
 for(const r of rooms){const m=matById[r.floorMaterialId];out.push(`<polygon points="${r.polygon.map(p=>p.x+','+p.y).join(' ')}" fill="${floorTint&&m?tint(m.color,.5):T.paper}"/>`);}
 if(objects)for(const o of S.geometry.objects)out.push(`<rect x="${-o.size.widthMm/2}" y="${-o.size.depthMm/2}" width="${o.size.widthMm}" height="${o.size.depthMm}" fill="none" stroke="${T.muted}" stroke-width="${.35*u}" transform="translate(${o.position.x} ${o.position.y}) rotate(${o.rotationDeg})"/>`);
 for(const x of S.geometry.walls)out.push(`<line x1="${x.start.x}" y1="${x.start.y}" x2="${x.end.x}" y2="${x.end.y}" stroke="${W_COLOR[x.structure]||T.ink}" stroke-width="${x.thicknessMm}" stroke-linecap="square"/>`);
 for(const o of S.geometry.openings){const x=wallById[o.wallId];if(!x)continue;const L=Math.hypot(x.end.x-x.start.x,x.end.y-x.start.y)||1,d={x:(x.end.x-x.start.x)/L,y:(x.end.y-x.start.y)/L};
  const a={x:x.start.x+d.x*o.offsetMm,y:x.start.y+d.y*o.offsetMm},c={x:a.x+d.x*o.widthMm,y:a.y+d.y*o.widthMm};
  out.push(`<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="${T.paper}" stroke-width="${x.thicknessMm+2}" stroke-linecap="butt"/>`);
  if(o.kind==='window'){const n={x:-d.y,y:d.x},t=x.thicknessMm/2;for(const s of [-t,0,t])out.push(`<line x1="${a.x+n.x*s}" y1="${a.y+n.y*s}" x2="${c.x+n.x*s}" y2="${c.y+n.y*s}" stroke="${T.ink}" stroke-width="${(s?.5:.25)*u}"/>`);}
  else out.push(`<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="${T.ink}" stroke-width="${.25*u}" stroke-dasharray="${2*u} ${1.5*u}"/>`);}
 const tags=tagLayout(u);let ci=0,lastY=-1e9;const callX=b.x1+pad+400,MAX_CALLOUTS=2; // Diagram Design: max 2 annotation callouts. A dropped tag is reported in qa.meta and blocks acceptance
 for(const t of labels?[...tags].sort((p,q)=>p.c.y-q.c.y):[]){if(!t.callout){out.push(tagSvg(t,u,t.c));continue;}
  if(!callouts||ci>=MAX_CALLOUTS){t.keyed=true;out.push(keySvg(t,u,t.c));continue;}
  const ty=Math.max(t.c.y,lastY+9*u*1.6);ci++;
  out.push(`<path d="M ${t.c.x} ${t.c.y} Q ${(t.c.x+callX)/2} ${t.c.y} ${callX-150} ${ty}" fill="none" stroke="${T.ink}" stroke-opacity=".45" stroke-width="${.3*u}" stroke-dasharray="${1.4*u} ${1*u}"/><circle cx="${t.c.x}" cy="${t.c.y}" r="${.7*u}" fill="${T.ink}"/>`);
  const cl=callLines(t);out.push(`<text font-family="RUBIK Serif" font-style="italic" font-size="${9*u}" fill="${T.ink}">${cl.map((l,i)=>`<tspan x="${callX}" y="${ty+i*9*u*1.15}">${esc(l)}</tspan>`).join('')}</text><text font-size="${7.5*u}" fill="${T.muted}">${callArea(t).map((l,i)=>`<tspan x="${callX}" y="${ty+cl.length*9*u*1.15+i*7.5*u*1.2}">${esc(l)}</tspan>`).join('')}</text>`);lastY=ty+cl.length*9*u*1.15+callArea(t).length*7.5*u*1.2;}
 return {svg:`<svg class="plan" viewBox="${minX} ${minY} ${vbW} ${vbH}" width="${pw}mm" height="${ph}mm" role="img">${out.join('')}</svg>`,pw,ph,mmPerUnit,callouts:ci,dropped:tags.filter(t=>t.dropped).length,keys:labels?tags.filter(t=>t.keyed).sort((a,b)=>roomNo(a.r)-roomNo(b.r)).map(t=>({n:roomNo(t.r),name:t.r.name,area:t.areaTxt})):[]};}
function scaleBar(mmPerUnit,metres=2){const seg=1000*mmPerUnit,len=metres*seg;return `<svg width="${len+16}mm" height="7mm" viewBox="-3 0 ${len+16} 7"><g font-family="RUBIK Inter" font-size="2.6" fill="${T.ink}">${Array.from({length:metres+1},(_,i)=>`<text x="${i*seg}" y="2.6" text-anchor="middle">${i}</text>`).join('')}<text x="${len+3}" y="2.6">m</text></g>${Array.from({length:metres},(_,i)=>`<rect x="${i*seg}" y="4" width="${seg}" height="1.4" fill="${i%2?T.paper:T.ink}" stroke="${T.ink}" stroke-width=".25"/>`).join('')}</svg>`;}
// ---------- axonometric plan (Diagram Design type-axonometric-plan: 2:1 dimetric, walls cut at a drawing height) ----------
function axo({w=180,h=120,H=1100,label=true}={}){
 if(NOGEO)return Object.assign(new String(emptyDrawing(w,h,NO_GEO_TEXT)),{keys:[]});
 const iso=(x,y,z)=>[x-y,(x+y)/2-z];const prisms=[],flat=[];
 for(const r of rooms){const m=matById[r.floorMaterialId];flat.push({pts:r.polygon.map(p=>iso(p.x,p.y,0)),fill:m?tint(m.color,.55):T.field});}
 for(const o of S.geometry.objects){const a=(o.rotationDeg||0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),hw=o.size.widthMm/2,hd=o.size.depthMm/2;
  flat.push({pts:[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([dx,dy])=>iso(o.position.x+dx*cs-dy*sn,o.position.y+dx*sn+dy*cs,0)),fill:'none',stroke:T.muted});}
 for(const x of S.geometry.walls){const L=Math.hypot(x.end.x-x.start.x,x.end.y-x.start.y)||1,d={x:(x.end.x-x.start.x)/L,y:(x.end.y-x.start.y)/L},n={x:-d.y,y:d.x},t=x.thicknessMm/2;
  const cuts=S.geometry.openings.filter(o=>o.wallId===x.id).map(o=>[o.offsetMm,o.offsetMm+o.widthMm]).sort((p,q)=>p[0]-q[0]);
  let s=-t;const segs=[];for(const [a,b] of cuts){if(a>s)segs.push([s,a]);s=Math.max(s,b);}if(L+t>s)segs.push([s,L+t]);
  for(const [a,b] of segs){const p=k=>({x:x.start.x+d.x*k,y:x.start.y+d.y*k});const A=p(a),Bp=p(b);
   const foot=[{x:A.x+n.x*t,y:A.y+n.y*t},{x:Bp.x+n.x*t,y:Bp.y+n.y*t},{x:Bp.x-n.x*t,y:Bp.y-n.y*t},{x:A.x-n.x*t,y:A.y-n.y*t}];
   prisms.push({foot,key:Math.max(...foot.map(q=>q.x+q.y)),top:x.structure==='partition'||x.structure==='low'?T.partition:T.ink});}}
 prisms.sort((p,q)=>p.key-q.key);
 const all=[...flat.flatMap(f=>f.pts),...prisms.flatMap(p=>p.foot.flatMap(q=>[iso(q.x,q.y,0),iso(q.x,q.y,H)]))];
 const X=all.map(p=>p[0]),Y=all.map(p=>p[1]),pad=300,minX=Math.min(...X)-pad,minY=Math.min(...Y)-pad,vbW=Math.max(...X)-minX+pad,vbH=Math.max(...Y)-minY+pad;
 const k=Math.min(w/vbW,h/vbH),u=.3528/k,poly=(pts,fill,stroke='none',sw=0)=>`<polygon points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
 const out=[`<title>Axonometría de ${esc(TITLE)}</title><desc>Dibujo axonométrico generado desde la geometría de RUBIK; muros seccionados a ${num(H/1000)} m por convención de dibujo; mobiliario como huella en planta.</desc>`];
 for(const f of flat)out.push(f.fill==='none'?poly(f.pts,'none',f.stroke,.3*u):poly(f.pts,f.fill));
 for(const p of prisms){const F=p.foot,cx=F.reduce((s,q)=>s+q.x,0)/4,cy=F.reduce((s,q)=>s+q.y,0)/4;for(let i=0;i<4;i++){const a=F[i],b=F[(i+1)%4];const ex=b.x-a.x,ey=b.y-a.y,nx=ey,ny=-ex;
   const sg=((a.x+b.x)/2-cx)*nx+((a.y+b.y)/2-cy)*ny>0?1:-1,vx=nx*sg,vy=ny*sg;if(vx+vy<=0)continue;
   out.push(poly([iso(a.x,a.y,0),iso(b.x,b.y,0),iso(b.x,b.y,H),iso(a.x,a.y,H)],vx>Math.abs(vy)?'#bdb5a7':'#ddd6ca',T.ink,.12*u));}
  out.push(poly(F.map(q=>iso(q.x,q.y,H)),p.top));}
 const keys=[],later=[];if(label){const placed=[];for(const t of tagLayout(u)){if(t.callout){later.push(t);continue;}let [x,y]=iso(t.c.x,t.c.y,0);const one={...t,lines:[t.r.name]};one.box={w:Math.max(t.r.name.length*t.fsN*.6,t.areaTxt.length*t.fsA*.56)+2.4*u,h:t.fsN*1.2+t.fsA*1.3+2.4*u};
  const hit=(x,y)=>placed.some(q=>Math.abs(q.x-x)<(q.w+one.box.w)/2+1.5*u&&Math.abs(q.y-y)<(q.h+one.box.h)/2+1.5*u);for(let k=0;k<12&&hit(x,y);k++)y+=(k%2?-1:1)*(k+1)*(one.box.h/2+u);placed.push({x,y,w:one.box.w,h:one.box.h});out.push(tagSvg(one,u,{x,y}));}
  // Numbered rooms (name does not fit): a 13 pt disc placed where it touches no tag and no other disc.
  const R=13*u;for(const t of later){let [x,y]=iso(t.c.x,t.c.y,0);const free=(x,y)=>!placed.some(q=>Math.abs(q.x-x)<(q.w+R)/2+1*u&&Math.abs(q.y-y)<(q.h+R)/2+1*u);
   for(let k=0;k<24&&!free(x,y);k++){const a=k*Math.PI/4,rr=R*(1+Math.floor(k/8));[x,y]=[iso(t.c.x,t.c.y,0)[0]+Math.cos(a)*rr,iso(t.c.x,t.c.y,0)[1]+Math.sin(a)*rr];}
   placed.push({x,y,w:R,h:R});out.push(keySvg(t,u,{x,y}));keys.push({n:roomNo(t.r),name:t.r.name,area:t.areaTxt});}}
 return Object.assign(new String(`<svg class="axo" viewBox="${minX} ${minY} ${vbW} ${vbH}" width="${vbW*k}mm" height="${vbH*k}mm" role="img">${out.join('')}</svg>`),{keys:keys.sort((a,b)=>a.n-b.n)});}
// ---------- document frame ----------
function doc(id,title,style,pages,{size='A4L'}={}){
 const N=pages.length,studio=STUDIO;
 const body=pages.map((p,i)=>`<section class="page ${p.cls||''}" data-page="${i+1}">${p.html}${p.foot===false?'':`<footer class="foot">${p.note?`<span style="color:var(--d-ink);font-weight:700">${esc(p.note)}</span>`:`<span>${esc(studio)}</span><span>${esc(TITLE)}</span><span>Revisión ${esc(rev)}</span><span>${esc(date)}</span>`}<span class="pg">${i+1} / ${N}</span></footer>`}</section>`).join('\n');
 VW[id]=size==='A3L'?1588:size==='A4P'?794:1123;
 const page=size==='A3L'?`@page{size:420mm 297mm;margin:0}:root{--page-w:420mm;--page-h:297mm}`:size==='A4P'?`@page{size:210mm 297mm;margin:0}:root{--page-w:210mm;--page-h:297mm;--m-side:14mm}`:'';
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}, ${esc(TITLE)}</title><style>${FONT_CSS}\n${CSS}\n${page}</style></head><body data-doc="${id}" data-style="${style}">${body}</body></html>`;}
const fig=(n,u,l,p,cls='')=>`<div class="fig ${cls}"><div class="n">${n}<span class="u">${u}</span></div><div class="l">${esc(l)}</div>${p?`<div class="caption">${esc(p)}</div>`:''}</div>`;
const img=(v,style='')=>`<img class="img" src="${v.src}" alt="${esc(v.label)}" style="${v.fit==='contain'?'object-fit:contain;':''}${style}">`;
// ---------- covers: the three directions (Huashu gate) ----------
const coverImage=(kind,sub,view)=>!view?coverDrawing(kind,sub):({cls:'bleed',head:false,html:`<div style="position:absolute;inset:0 0 auto 0;height:150mm;background:${view.bg}" class="frame">${img(view)}</div>
 <div style="position:absolute;left:16mm;right:16mm;top:157mm;height:auto" class="grid"><div class="c1-7">${LOGO(10,40)}<p class="meta" style="color:var(--d-ink);font-weight:700;margin-top:${prof.logo?'2mm':'0'}">${esc(STUDIO)}</p>${H1(TITLE,"margin-top:2mm")}<p class="lead" style="margin-top:1.5mm">${esc(kind)}</p></div>
 <div class="c8-12"><p class="meta">${esc(sub)}</p><p class="caption">${esc(view.label)}. ${VIEW_NOTE}</p></div></div>`});
const coverDrawing=(kind,sub)=>{const a=axo({w:178,h:176});return {head:false,html:`<div class="grid"><div class="c1-4" style="display:flex;flex-direction:column;justify-content:space-between;height:180mm">
 <div>${LOGO()}<p class="meta" style="color:var(--d-ink);font-weight:700;margin-top:${prof.logo?'3mm':'0'}">${esc(STUDIO)}</p><p class="meta">${esc(prof.tagline||'')}</p></div>
 <div>${H1(TITLE)}<p class="lead" style="margin-top:3mm">${esc(kind)}</p><p class="meta" style="margin-top:6mm">${esc(sub)}</p></div>
 <div><p class="caption">Axonometría dibujada desde la geometría del proyecto en RUBIK. Muros seccionados a 1,10 m; mobiliario en huella.</p>${a.keys.length>3?`<p class="caption">${a.keys.length} estancias van numeradas en el dibujo porque su nombre no cabe; sus nombres están en la planta.</p>`:keyList(a.keys)}</div></div>
 <div class="c5-12" style="display:flex;align-items:center;justify-content:center">${a}</div></div>`};};
const coverFigure=(kind,sub)=>{const p=plan({w:100,h:110,callouts:false,labels:false});return {head:false,html:`<div class="grid"><div class="c1-7" style="display:flex;flex-direction:column;justify-content:space-between;height:180mm">
 <p class="meta" style="color:var(--d-ink);font-weight:700">${esc(STUDIO)}</p>
 <div><div style="font-weight:700;font-size:96pt;line-height:1;letter-spacing:-.04em">${AREA}<span style="font-size:30pt;font-weight:400;margin-left:2mm">m²</span></div><p class="meta" style="margin-top:3mm">Superficie útil estimada por RUBIK sobre el modelo</p></div>
 <div>${H1(TITLE)}<p class="lead" style="margin-top:2mm">${esc(kind)}</p><p class="meta" style="margin-top:4mm">${esc(sub)}</p></div></div>
 <div class="c8-12" style="display:flex;align-items:center">${p.svg}</div></div>`};};
// ---------- shared pages ----------
const legend=(p,extra='')=>NOGEO?'':`<div class="legend" style="margin-top:3mm">${scaleBar(p.mmPerUnit)}<span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.ink}"/></svg>Portante y fachada</span><span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.partition}"/></svg>Tabique</span><span><svg width="7mm" height="3mm"><line x1="0" y1="1.5mm" x2="7mm" y2="1.5mm" stroke="${T.ink}" stroke-width=".3mm"/><line x1="0" y1=".4mm" x2="7mm" y2=".4mm" stroke="${T.ink}" stroke-width=".15mm"/><line x1="0" y1="2.6mm" x2="7mm" y2="2.6mm" stroke="${T.ink}" stroke-width=".15mm"/></svg>Ventana</span><span><svg width="7mm" height="3mm"><line x1="0" y1="1.5mm" x2="7mm" y2="1.5mm" stroke="${T.ink}" stroke-width=".15mm" stroke-dasharray="1.2 1"/></svg>Puerta o paso</span>${extra}</div>`;
function planPage(title){const p=plan({w:172,h:142});
 const rowsHtml=(withNo)=>rooms.map(r=>`<tr>${withNo?`<td class="muted">${roomNo(r)}</td>`:''}<td>${esc(r.name)}</td><td class="num">${r.areaM2==null?'<span class="unk">sin área</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('');
 const table=withNo=>`<table><thead><tr>${withNo?'<th>N.º</th>':''}<th>Estancia</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rowsHtml(withNo)}<tr class="total"><td${withNo?' colspan="2"':''}>Superficie útil computada</td><td class="num">${AREA}</td><td></td></tr></tbody></table>`;
 const note=`<p class="caption">${esc(STATUS_AREA)} ${counted.length} de ${rooms.length} estancias computan según el cálculo de superficies de RUBIK. El color de fondo de cada estancia es su pavimento (página de materiales).</p>`;
 const meta={callouts:p.callouts,dropped:p.dropped,keyed:p.keys.length,split:LONG_ROOMS};
 if(LONG_ROOMS){const pg={html:`<div class="grid"><div class="c1-9" style="display:flex;flex-direction:column">${p.svg}${NOGEO?'':legend(p)}${p.keys.length?`<p class="caption">${p.keys.length} estancias van numeradas en el dibujo porque su nombre no cabe: el número es el del cuadro de superficies de la página siguiente.</p>`:''}</div>
  <div class="c10-12"><h2 class="h2">${esc(title)}</h2>${note}</div></div>`,meta};
  pg.extra={html:`<div class="grid"><div class="c1-4"><h2 class="h2">Cuadro de superficies</h2>${note}</div><div class="c5-12">${table(true)}</div></div>`};return pg;}
 return {html:`<div class="grid"><div class="c1-8" style="display:flex;flex-direction:column">${p.svg}${NOGEO?'':legend(p)}${keyList(p.keys)}</div>
 <div class="c9-12"><h2 class="h2">${esc(title)}</h2>${table(false)}
 ${note}</div></div>`,meta};}
function materialsPage(title){if(!floors.length)return {html:`<div class="grid"><div class="c1-6"><h2 class="h2">${esc(title)}</h2><p class="read">El proyecto no tiene pavimentos asignados a sus estancias. No se muestra ninguna muestra ni color.</p></div></div>`};
 const tot=floors.reduce((s,f)=>s+f.areaM2,0),notCounted=rooms.filter(r=>!r.counted&&r.floorMaterialId&&r.areaM2!=null);
 const diff=area!=null&&Math.abs(tot-area)>.01?(notCounted.length?`Incluye ${notCounted.length===1?'una estancia que no computa':notCounted.length+' estancias que no computan'} como superficie útil (${esc(notCounted.map(r=>r.name).join(', '))}): por eso suma ${num(tot)} m² y no ${AREA} m².`:`Suma ${num(tot)} m² de pavimento modelado; la superficie útil es ${AREA} m².`):'';
 const bar=floors.map(f=>`<div style="flex:${f.areaM2};background:${f.color};border-right:.4mm solid ${T.paper}"></div>`).join('');
 const list=floors.map(f=>`<div class="sw"><i style="background:${f.color}"></i><div><div class="h3" style="margin:0">${esc(f.name)}</div><div class="meta">${num(f.areaM2)} m², ${num(f.areaM2/tot*100,0)} % del pavimento modelado</div><div class="meta">${f.rooms.join(', ').length>70?`${f.rooms.length} estancias; en la planta, el color de cada estancia es su pavimento`:esc(f.rooms.join(', '))}</div></div></div>`).join('');
 return {html:`<div class="grid"><div class="c1-4"><h2 class="h2">${esc(title)}</h2><p class="read">Pavimentos asignados en el modelo, ordenados por superficie. La barra reparte los ${num(tot)} m² de pavimento modelado entre materiales.</p>
  <div style="display:flex;height:9mm;margin:4mm 0 2mm;border:.2mm solid rgba(0,0,0,.12)">${bar}</div>${diff?`<p class="caption">${diff}</p>`:''}
  <p class="note" style="margin-top:8mm"><b>Color del modelo, no muestra física.</b> Los tonos son los del material en el modelo 3D. La elección final requiere la muestra real del fabricante.</p></div>
  <div class="c6-12" style="columns:2;column-gap:6mm">${list}</div></div>`};}
function objectRows(){const map=new Map();S.objects.forEach((o,i)=>{const g=S.geometry.objects[i];const sz=g?.size?`${num(g.size.widthMm,0)} × ${num(g.size.depthMm,0)}`:null;const k=(o.room||'')+'|'+o.name+'|'+sz;
  if(!map.has(k))map.set(k,{room:o.room||'Fuera de los recintos',name:o.name,size:sz,qty:0,ref:o.catalogRef});map.get(k).qty++;});
 const order=rooms.map(r=>r.name);return [...map.values()].sort((a,b)=>(order.indexOf(a.room)+1||99)-(order.indexOf(b.room)+1||99)).map((r,i)=>({...r,tag:'M-'+String(i+1).padStart(2,'0')}));}
function schedulePages(title){const rows=objectRows();if(!rows.length)return [{html:`<div class="grid"><div class="c1-6"><h2 class="h2">${esc(title)}</h2><p class="read">El proyecto no tiene objetos colocados. No hay listado de mobiliario.</p></div></div>`}];let last='';
 // B3: one page; the measured pagination (flow.js) splits it where the rows really stop fitting, whatever the name lengths.
 const tr=rows.map(r=>{const roomCell=r.room!==last?esc(r.room):'';last=r.room;return `<tr><td class="muted" style="white-space:nowrap">${r.tag}</td><td data-repeat="${esc(r.room)}">${roomCell}</td><td>${esc(r.name)}</td><td class="num">${r.qty}</td><td class="num">${r.size?r.size:'<span class="unk">sin medida</span>'}</td><td>${r.ref?esc(r.ref):'<span class="unk">Sin referencia de producto</span>'}</td></tr>`;}).join('');
 return [{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${esc(title)}</h2><p class="caption" style="margin:-2mm 0 4mm" data-flow-part hidden></p><div data-flow-first><p class="read">${S.objects.length} objetos colocados en el modelo, agrupados en ${rows.length} líneas por estancia y medida.</p><p class="note" style="margin-top:6mm"><b>Sin productos asignados.</b> Los objetos del proyecto no tienen referencia de fabricante, acabado ni precio. RUBIK no los inventa: la columna queda abierta hasta que el estudio los elija.</p><p class="caption" style="margin-top:4mm">Estancia de cada objeto: la que contiene su posición en el plano (regla del producto). Medidas en mm, ancho por fondo.</p></div><p class="caption" data-flow-cont hidden>Continúa el listado de la página anterior.</p></div>
   <div class="c5-12"><table class="flow"><thead><tr><th>Ref.</th><th>Estancia</th><th>Objeto</th><th class="num">Ud.</th><th class="num">Medida (mm)</th><th>Producto</th></tr></thead><tbody>${tr}</tbody></table></div></div>`}];}
const BV=S.budget?.test?.view?.professional||null;
const noBudgetPage=title=>({html:`<div class="grid"><div class="c1-6"><h2 class="h2">${esc(title)}</h2><p class="read">El proyecto no tiene presupuesto con precios en RUBIK. No se muestra ningún importe.</p><p class="caption">Cuando el estudio prepare el presupuesto en Presupuestar, esta página mostrará sus capítulos, partidas y totales.</p></div></div>`});
function budgetPage(title){if(!BV)return noBudgetPage(title);const sm=BV.summary,unit={m2:'m²',m:'m',unit:'ud'};
 const body=BV.chapters.map(c=>{const lines=c.lines.map(l=>`<tr><td>${esc(l.description)}</td><td class="num">${num(l.quantity.value,l.quantity.unit==='unit'?0:2)} ${unit[l.quantity.unit]||esc(l.quantity.unit)}${l.quantity.status==='estimated'?' <span class="muted">est.</span>':''}</td><td class="num">${num(l.wastePercent||0,0)} %</td><td class="num">${num(l.budgetQuantity,l.quantity.unit==='unit'?0:2)}</td><td class="num">${eur(l.unitPrice)}</td><td class="num">${eur(l.subtotalNet)}</td></tr>`).join('');
  return `<tr class="chap"><td colspan="6">${esc(c.title)}</td></tr>${lines}<tr class="sub"><td colspan="5">Subtotal</td><td class="num">${eur(c.lines.reduce((s,l)=>s+l.subtotalNet,0))}</td></tr>`;}).join('');
 return {html:`<div class="grid"><div class="c1-8"><table class="flow"><thead><tr><th>Partida</th><th class="num">Medición</th><th class="num">Merma</th><th class="num">Cantidad</th><th class="num">Precio unitario*</th><th class="num">Importe neto</th></tr></thead><tbody>${body}
  <tr class="total"><td colspan="5">Base imponible</td><td class="num">${eur(sm.net.amount)}</td></tr><tr><td colspan="5">IVA ${num(sm.tax.ratePercent,0)} %</td><td class="num">${eur(sm.tax.amount)}</td></tr><tr class="total"><td colspan="5">Total con IVA</td><td class="num">${eur(sm.gross.amount)}</td></tr></tbody></table></div>
  <div class="c9-12"><h2 class="h2">${esc(title)}</h2><p class="caption" data-flow-part hidden></p><div data-flow-first>${fig(nf(2).format(sm.gross.amount),'€','Total con IVA','Suma de las partidas con precio de prueba','focal')}</div>
  <div style="margin-top:6mm" data-flow-first><span class="status">Pendiente de revisión profesional</span><p class="caption">${sm.items-sm.unreviewed} de ${sm.items} partidas revisadas por el estudio.</p></div>
  <p class="note" style="margin-top:6mm"><b>* Precios de prueba de laboratorio, fechados el 17/11/2026.</b> ${esc(S.budget.test.label)} Mediciones calculadas por RUBIK sobre el modelo, con la merma indicada.</p></div></div>`};}
const imagePage=v=>({html:`<figure style="height:${v.label.length>40?140:150}mm;background:${v.bg}" class="frame">${img(v)}</figure><div class="grid" style="height:auto;margin-top:3mm"><div class="${v.label.length>40?'c1-7':'c1-4'}"><h2 class="h2" style="margin:0;${v.label.length>40?'font-size:var(--t-lead)':''}">${esc(v.label)}</h2></div><div class="${v.label.length>40?'c8-12':'c5-12'}"><p class="caption" style="margin:0">${esc(v.label)}, ${roomArea(rooms.find(r=>r.id===v.roomId))}. ${VIEW_NOTE}</p></div></div>`});
const studioBlock=()=>B.profile?`<div class="note">${LOGO(12,44)}<b style="display:block;margin-top:${prof.logo?'2mm':'0'}">${esc(STUDIO)}</b>${[prof.person,prof.email,(prof.web||'').replace(/^https?:\/\//,''),prof.phone].filter(Boolean).map(esc).join('<br>')}</div><p class="caption">Datos del perfil de marca del estudio en RUBIK.${prof.logo?'':' Logotipo: no facilitado.'}</p>`:`<p class="note"><b>Perfil de estudio no facilitado.</b> El proyecto no tiene datos del estudio: nombre, contacto ni logotipo.</p>`;
// ---------- deliverables ----------
function build(){
 const hero=(biggest&&views.find(v=>v.roomId===biggest.id))||views.find(v=>v.kind==='room')||views[0]||null,over=views.find(v=>v.kind==='overview')||views[0]||null,bedrooms=views.filter(v=>v.kind==='room'&&v!==hero);
 const D={},meta={};
 const pp=planPage('Planta');meta.plan=pp.meta;if(pp.meta.dropped)throw new Error('plan: room tags dropped '+pp.meta.dropped);
 const viewPages=[hero?imagePage(hero):null,bedrooms.length?{html:`<div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:5mm;height:164mm">${bedrooms.slice(0,3).map((v,i)=>`<figure style="${i===0?'grid-row:1/3;':''}display:flex;flex-direction:column;min-height:0"><div class="frame" style="flex:1;min-height:0;background:${v.bg}">${img(v)}</div><p class="caption"><b>${esc(v.label)}</b>, ${roomArea(rooms.find(r=>r.id===v.roomId))}</p></figure>`).join('')}</div><p class="caption" style="margin-top:1mm">${VIEW_NOTE}</p>`}:null].filter(Boolean);
 const noViews=views.length?null:{html:`<div class="grid"><div class="c1-6"><h2 class="h2">Vistas del modelo 3D</h2><p class="read">El proyecto no tiene vistas 3D generadas. RUBIK no fabrica imágenes: esta sección aparecerá cuando el profesional genere vistas del modelo.</p></div></div>`};
 D['directions']=doc('directions','Direcciones de portada','client',[coverImage('Dirección A: la vista 3D',`Libro de interiorismo, ${date}`,over),coverDrawing('Dirección B: el dibujo',`Libro de interiorismo, ${date}`),coverFigure('Dirección C: la cifra',`Libro de interiorismo, ${date}`)]);
 D['interior-book']=doc('interior-book','Libro de interiorismo','client',[
  coverDrawing('Libro de interiorismo',`Presentado por ${prof.person||STUDIO}, ${date}`),
  {html:`<div class="grid"><div class="c1-6" style="display:flex;flex-direction:column;justify-content:space-between;height:176mm"><div><h2 class="h2">El proyecto</h2><p class="read">${INTRO}</p><p class="caption">Texto del profesional en la ficha de entrega.</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm"><div>${studioBlock()}</div><p class="note"><b>Estado de los datos.</b> ${esc(STATUS_AREA)}</p></div></div>
   <div class="c8-12" style="display:grid;grid-template-columns:1fr 1fr;gap:9mm 5mm;align-content:start">
    ${fig(AREA,'m²','Superficie útil estimada',`${counted.length} estancias computadas`)}${fig(rooms.length,'','Estancias en el plano',`${rooms.length-counted.length} no computan`)}
    ${fig(byName(/^Dormitorio/),'','Dormitorios','Según el nombre de las estancias')}${fig(byName(/^Baño/),'','Baños','Según el nombre de las estancias')}
    ${fig(S.objects.length,'','Objetos colocados','Mobiliario y equipamiento del modelo')}${fig(views.length,'','Vistas del modelo 3D','Generadas por RUBIK')}</div></div>`},
  pp,...(pp.extra?[pp.extra]:[]),...viewPages,...(noViews?[noViews]:[]),
  materialsPage('Materiales de pavimento')]);
 D['materials-furniture-book']=doc('materials-furniture-book','Libro de materiales y mobiliario','client',[
  coverImage('Materiales y mobiliario',`${S.materials.length} materiales, ${S.objects.length} objetos, ${date}`,hero),
  materialsPage('Materiales de pavimento'),
  {html:`<div class="grid"><div class="c1-4"><h2 class="h2">Dónde va cada objeto</h2><p class="read">Planta con la huella de los ${S.objects.length} objetos del modelo, en su posición y tamaño.</p><p class="caption">Las referencias M-01 y siguientes del listado siguen el orden de las estancias.</p></div><div class="c5-12">${(()=>{const p=plan({w:182,h:150,objects:true});return p.svg+keyList(p.keys);})()}</div></div>`},
  ...schedulePages('Mobiliario y equipamiento')]);
 D['commercial-proposal']=!BV?doc('commercial-proposal','Propuesta económica','client',[noBudgetPage('Propuesta económica')]):doc('commercial-proposal','Propuesta económica','client',[
  {html:`<div class="grid"><div class="c1-6" style="display:flex;flex-direction:column;justify-content:space-between;height:178mm"><div><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(STUDIO)}</p><p class="meta">${esc(prof.tagline||'')}</p></div>
   <div><h1 class="h1">Propuesta económica</h1><p class="lead" style="margin-top:3mm">${esc(TITLE)}</p></div>
   <div class="grid" style="grid-template-columns:repeat(6,1fr);height:auto"><div style="grid-column:1/4">${fig(nf(2).format(BV.summary.gross.amount),'€','Total con IVA','Con precios de prueba de laboratorio','focal')}</div><div style="grid-column:4/7">${fig(AREA,'m²','Superficie útil estimada','Calculada sobre el modelo')}</div></div></div>
   <div class="c7-12" style="display:flex;flex-direction:column">${(()=>{const a=axo({w:146,h:120});return a+'<p class="caption">Axonometría dibujada desde la geometría del proyecto en RUBIK.</p>'+keyList(a.keys);})()}<p class="meta" style="margin-top:auto">Preparada por ${esc(prof.person||STUDIO)}, ${esc(prof.email||'')}, ${esc(date)}</p></div></div>`},
  {html:`<div class="grid"><div class="c1-6"><h2 class="h2">Alcance</h2><p class="read">${INTRO}</p><p class="caption">Texto del profesional en la ficha de entrega.</p>
   <h3 class="h3" style="margin-top:10mm">Qué incluye este presupuesto</h3><table><thead><tr><th>Capítulo</th><th class="num">Partidas</th><th class="num">Importe neto</th></tr></thead><tbody>${BV.chapters.map(c=>`<tr><td>${esc(c.title)}</td><td class="num">${c.lines.length}</td><td class="num">${eur(c.lines.reduce((s,l)=>s+l.subtotalNet,0))}</td></tr>`).join('')}</tbody></table></div>
   <div class="c8-12"><h3 class="h3">Qué no incluye</h3><p class="read">Mobiliario, equipamiento y honorarios: el proyecto no tiene precios ni referencias para ellos y RUBIK no los estima.</p><h3 class="h3" style="margin-top:8mm">Condiciones</h3><p class="read unk">El estudio no ha facilitado condiciones, plazos ni forma de pago. Esta sección queda vacía a propósito.</p><div style="margin-top:10mm">${studioBlock()}</div></div></div>`},
  budgetPage('Presupuesto')]);
 D['real-estate']=doc('real-estate','Presentación inmobiliaria','realestate',[
  coverImage('Presentación de la vivienda',`Propuesta de reforma, ${date}`,hero),
  {html:`<div class="grid"><div class="c1-4"><h2 class="h2">La vivienda en cifras</h2><p class="read">${INTRO}</p><p class="note" style="margin-top:10mm"><b>No disponibles en el proyecto:</b> ubicación, precio de venta, año de construcción, orientación y certificado energético. No se muestran.</p></div>
   <div class="c6-12" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10mm 6mm;align-content:start">
    ${fig(AREA,'m²','Superficie útil estimada','Calculada sobre el modelo')}${fig(rooms.length?byName(/^Dormitorio/):'—','','Dormitorios','Según el nombre de las estancias')}${fig(rooms.length?byName(/^Baño/):'—','','Baños','Según el nombre de las estancias')}
    ${fig(rooms.length?byName(/^Balc/):'—','','Balcones','Según el nombre de las estancias')}${biggest?fig(num(biggest.areaM2),'m²',biggest.name,'La estancia mayor del plano'):fig('—','','Estancia mayor','Sin estancias con superficie')}${BV?fig(nf(0).format(BV.summary.gross.amount),'€','Reforma propuesta, IVA incluido','Precios de prueba de laboratorio'):fig('—','','Reforma propuesta','El proyecto no tiene presupuesto')}
    ${BV&&area?`<div style="grid-column:1/4">${fig(nf(2).format(BV.summary.gross.amount/area),'€/m²','Coste de la reforma por m² útil','Cálculo: total con IVA dividido por la superficie útil estimada. Con precios de prueba, solo ilustra el formato.')}</div>`:''}</div></div>`},
  {html:`<div class="grid"><div class="c1-4"><h2 class="h2">La distribución</h2><p class="read">Axonometría dibujada desde la geometría del proyecto.</p><p class="caption">Muros seccionados a 1,10 m por convención de dibujo; el mobiliario se muestra como huella en planta. Los nombres de todas las estancias están en la planta de la página siguiente.</p></div><div class="c5-12" style="display:flex;flex-direction:column;align-items:center">${(()=>{const a=axo({w:182,h:164});return a+keyList(a.keys);})()}</div></div>`},
  pp,...(pp.extra?[pp.extra]:[]),
  ...([over,...bedrooms].filter(Boolean).length?[{html:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;height:164mm">${[over,hero,...bedrooms].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,4).map(v=>`<figure style="display:flex;flex-direction:column;min-height:0"><div class="frame" style="flex:1;min-height:0;background:${v.bg}">${img(v)}</div><p class="caption"><b>${esc(v.label)}</b></p></figure>`).join('')}</div><p class="caption" style="margin-top:1mm">${VIEW_NOTE}</p>`}]:[noViews])]);
 {const p=plan({scale:50,objects:true,floorTint:false,pad:160});meta.sheet={callouts:p.callouts,dropped:p.dropped,keyed:p.keys.length};if(p.dropped)throw new Error('sheet: room tags dropped '+p.dropped);const tb=(c,v,cls='')=>`<div class="${cls}"><small>${c}</small>${v?esc(v):'<span class="unk">No facilitado</span>'}</div>`;
  D['architecture-sheet']=doc('architecture-sheet','Lámina de arquitectura','technical',[{head:false,foot:false,html:`
  <div class="sheet-frame" style="position:absolute;inset:10mm;border:.7mm solid var(--d-ink)"></div>
  <div style="position:absolute;left:18mm;top:11mm;line-height:0">${p.svg}</div>
  <div style="position:absolute;right:16mm;top:16mm;left:${(18+p.pw+8).toFixed(1)}mm"><h2 class="h2" style="font-size:16pt">Cuadro de superficies</h2>${sheetTable()||`<table><thead><tr><th>Estancia</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${esc(r.name)}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('')}<tr class="total"><td>Superficie útil computada</td><td class="num">${AREA}</td><td></td></tr></tbody></table>`}
   ${LONG_ROOMS?'':`<p class="caption">${esc(STATUS_AREA)}</p>${keyList(p.keys)}`}</div>
  <div style="position:absolute;left:18mm;bottom:14mm;width:200mm">${NOGEO?'':legend(p,`<span><svg width="7mm" height="3mm"><rect x=".3mm" y=".3mm" width="6.4mm" height="2.4mm" fill="none" stroke="${T.muted}" stroke-width=".2mm"/></svg>Mobiliario</span>`)}</div>
  <div class="tb">${tb('Proyecto',TITLE)}${tb('Dirección',null)}${tb('Cliente',null)}${tb('Organización',prof.name)}${tb('Título','Planta de distribución propuesta','wide')}${tb('Dibujado por',prof.person)}${tb('Revisado por',null)}${tb('Fecha',date)}${tb('Revisión',rev)}
   <div class="side">${prof.logo?`<div>${LOGO(9,44)}</div>`:''}<div><small>Lámina</small><span class="num">A-01</span></div><div><small>Escala</small><span style="font-size:12.8pt;font-weight:700">${NOGEO?'—':'1:50'}</span></div><div><small>Formato</small>A3, escala sobre medidas del modelo</div></div></div>`},...(LONG_ROOMS?[annexPage('A-01')]:[])],{size:'A3L'});}
 // B1 (v3): more designs per deliverable, built by tools/b1.cjs from the same snapshot and the same helpers.
 if(process.env.STUDIO_B1!=='0'){const b1=require('./b1.cjs')({S,T,P,B,BV,prof,TITLE,date,rev,rooms,counted,area,matById,floors,views,viewBy,VIEW_NOTE,STATUS_AREA,W_COLOR,wallById,
  nf,num,eur,esc,tint,bbox,centroid,plan,axo,tagLayout,tagSvg,scaleBar,legend,doc,fig,img,studioBlock,coverDrawing,coverImage,materialsPage,objectRows,planPage,
  STUDIO,AREA,INTRO,NOGEO,emptyDrawing,NO_GEO_TEXT,roomArea,biggest,keyList,LOGO,noBudgetPage,schedulePages,LONG_ROOMS,sheetTable,annexPage});Object.assign(D,b1.D);Object.assign(meta,b1.meta);
  {const ab=require('./architecture-book.cjs')({S,T,doc,plan,roomPlan:b1.helpers.roomPlan,esc,num,date,rev,rooms,counted,AREA,STATUS_AREA,STUDIO,TITLE,NOGEO,coverDrawing,keyList,matById,snapDir,roomArea,scaleBar});Object.assign(D,ab.D);Object.assign(meta,ab.meta);}}
 let E=null;if(process.env.STUDIO_B1!=='0'&&!S.variant&&process.env.STUDIO_ENTREGA!=='0'){const h=require('./b1.cjs')({S,T,P,B,BV,prof,TITLE,date,rev,rooms,counted,area,matById,floors,views,viewBy,VIEW_NOTE,STATUS_AREA,W_COLOR,wallById,
  nf,num,eur,esc,tint,bbox,centroid,plan,axo,tagLayout,tagSvg,scaleBar,legend,doc,fig,img,studioBlock,coverDrawing,coverImage,materialsPage,objectRows,planPage,
  STUDIO,AREA,INTRO,NOGEO,emptyDrawing,NO_GEO_TEXT,roomArea,biggest,keyList,LOGO,noBudgetPage,schedulePages,LONG_ROOMS,sheetTable,annexPage}).helpers;
  E=require('./entrega.cjs')({snapFile:path.resolve(snapDir,'snapshot.json'),S,T,TITLE,date,rev,rooms,counted,area,matById,floors,views,viewBy,VIEW_NOTE,STATUS_AREA,nf,num,eur,esc,plan,axo,doc,fig,STUDIO,AREA,INTRO,prof,LOGO,objectRows,roomArea,planPage,coverDrawing,FONT_CSS,b64,outDir,LAB,...h});
  Object.assign(D,E.D);Object.assign(meta,E.meta);}
 return {D,meta,E};}
// ---------- Huashu design_lint, ported: same probe (read from the donor file), print floors 12 px body / 9.3 px label ----------
const PROBE=fs.readFileSync(HUASHU_PROBE,'utf8'); // sin la sonda no hay lint: se falla, no se omite en silencio
function judge(f){const red=[],yellow=[];if(f.broken.length)red.push(`imágenes rotas ${f.broken.length}`);if(f.bodySmall.length)red.push(`texto de lectura bajo el mínimo ${f.bodySmall.length}: ${JSON.stringify(f.bodySmall.slice(0,2))}`);
 if(f.small.length>=3)red.push(`texto bajo el mínimo de etiqueta ${f.small.length}: ${JSON.stringify(f.small.slice(0,3))}`);if(f.lowContrast.length)red.push(`contraste insuficiente ${f.lowContrast.length}: ${JSON.stringify(f.lowContrast.slice(0,3))}`);
 const chrome=[];if(f.eyebrows.length>=3)chrome.push(`etiquetas en mayúsculas espaciadas ${f.eyebrows.length}`);if(f.dots>=2)chrome.push(`cadenas «A · B · C» ${f.dots}`);if(f.emDashLabels)chrome.push(`etiquetas «WORD — texto» ${f.emDashLabels}`);if(f.arrows>=2)chrome.push(`flechas de cola ${f.arrows}`);if(f.monoSmall>=4)chrome.push(`mono pequeña ${f.monoSmall}`);
 if(chrome.length)yellow.push('decoración de plantilla: '+chrome.join('; '));if(f.accentWord.length)yellow.push(`una palabra del titular en otro color ${f.accentWord.length}`);if(f.numbered.length>=3)yellow.push(`numeración 01/02/03 ${f.numbered.length}`);
 if(f.display&&/^(inter|roboto|arial|helvetica|system-ui|-apple-system|rubik inter)$/i.test(f.display))yellow.push(`la mayor tipografía de la página es ${f.display} (fuente de interfaz como display)`);return {red,yellow};}
// ---------- render + QA ----------
// v1.3 · inglés: los documentos de cliente se componen también en inglés (mismo HTML, traducido en el DOM antes de paginar).
const I18N_JS=fs.readFileSync(path.join(__dirname,'i18n.js'),'utf8').replace(/^\/\/.*$/mg,'').trim().replace(/^function I18N\(/,'function(');
const EN_DICT={exact:require('../i18n/en.exact.cjs'),rules:require('../i18n/en.rules.cjs'),spanishWords:require('../i18n/es-words.cjs')};
const EN_DOCS=new Set(['interior-book-v3','materials-furniture-book-v3','commercial-proposal-client-v3','real-estate-sheet-v3','real-estate-sheet-v3-sin-presupuesto','architecture-book','architecture-sheet-strip','entrega-integral']);
const EN_ON=process.env.STUDIO_EN!=='0'&&!S.variant;
// Datos del proyecto que no se traducen: nombres (y sus trozos, que los rótulos del plano parten en líneas), materiales, objetos,
// partidas y capítulos del presupuesto, tareas del plan de obra, estudio, título y texto del estudio.
const I18N_DATA=(()=>{const out=new Set(),mask=new Set();const add=(x,m=true)=>{if(x&&String(x).trim()){out.add(String(x).trim());if(m)mask.add(String(x).trim());}};
 for(const r of S.geometry.rooms){add(r.name);const w=r.name.split(/\s+/);for(let a=0;a<w.length;a++)for(let b=a+1;b<=w.length;b++)add(w.slice(a,b).join(' '));for(const h of r.name.split('-').slice(0,-1))add(h+'-');for(const h of r.name.split('-').slice(1))add(h);}
 for(const m of S.materials)add(m.name);for(const f of S.board?.floors||[])add(f.name);for(const o of S.objects){add(o.name,false);add(o.name[0].toLowerCase()+o.name.slice(1),false);} // objetos: palabras sueltas («Planta») que chocan con el texto; no se protegen
 for(const v of S.views)add(v.label);for(const V of Object.values(S.budget?.test?.view||{}))for(const c of V.chapters||[]){add(c.title);add(c.title.toLowerCase());for(const l of c.lines)add(l.description);}
 add(S.project.name);add(B.title);add(B.intro);for(const k of ['name','person','tagline','email'])add(prof[k]);add(prof.logo?.label);
 try{const pd=JSON.parse(fs.readFileSync(path.join(LAB,'assets/ft3d8-plan-demo.json'),'utf8'));for(const t of pd.tasks){add(t.title);add(t.title.replace(/\s*\(no se dibuja[^)]*\)/,''));}}catch{}
 return {all:[...out],mask:[...mask]};})();
const figs=(txt,lang)=>new Set([...txt.matchAll(lang==='en'?/\d{1,3}(?:,\d{3})*\.\d+/g:/\d{1,3}(?:\.\d{3})*,\d+/g)].map(m=>String(parseFloat(lang==='en'?m[0].replace(/,/g,''):m[0].replace(/\./g,'').replace(',','.')))));
const FIGS={};
const FLOW_JS=fs.readFileSync(path.join(__dirname,'flow.js'),'utf8').replace(/^\/\/.*$/mg,'').trim().replace(/^function paginateFlow\(\)/,'function()');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});
 {const pg=await browser.newPage();for(const v of S.views){const src='data:image/png;base64,'+b64(path.join(snapDir,v.file));
   const bg=await pg.evaluate(async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(2,2,1,1).data;return `rgb(${d[0]},${d[1]},${d[2]})`;},src);
   views.push({...v,src,bg,fit:v.kind==='overview'?'contain':'cover'});}await pg.close();}
 const {D,meta,E}=build();const qa={meta,probe:!!PROBE,docs:{}};const fresh=new Set();
 const jobs=Object.entries(D).flatMap(([id,html])=>EN_ON&&EN_DOCS.has(id)?[[id,html,'es'],[id+'.en',html,'en']]:[[id,html,'es']]);const enBlocked=[];
 for(const [id,html,lang] of jobs){const baseId=id.replace(/\.en$/,'');const f=path.resolve(outDir,id+'.html');fs.writeFileSync(f,html);const vw=VW[baseId]||1123;
  const ctx=await browser.newContext({locale:'es-ES',viewport:{width:vw,height:1000}});const ext=[],errors=[];ctx.on('request',r=>{if(!/^(file|data|about):/.test(r.url()))ext.push(r.url());});
  const pg=await ctx.newPage();pg.on('pageerror',e=>errors.push(e.message));await pg.addInitScript('window.__MIN_BODY=12;window.__MIN_LABEL=9.3;');await pg.goto('file://'+f);await pg.evaluate(()=>document.fonts.ready);
  let i18n=null;if(lang==='en')i18n=await pg.evaluate(`(${I18N_JS})(${JSON.stringify(EN_DICT)},${JSON.stringify(I18N_DATA)},'translate')`);
  if(process.env.FLOW_FAULT==='multi'&&id==='commercial-proposal-client-v3')await pg.evaluate(()=>{const t=document.querySelector('table.flow');t.after(t.cloneNode(true));}); // negative test: two flow tables in one page
  const flow=await pg.evaluate(`(${FLOW_JS})()`);if(flow.tables){fs.writeFileSync(f,'<!doctype html>\n'+(await pg.evaluate(()=>document.documentElement.outerHTML)));}
  if(lang==='en'){await pg.evaluate(()=>document.querySelectorAll('[data-flow-part]').forEach(e=>e.textContent=e.textContent.replace(/^Parte (\d+) de (\d+)$/,'Part $1 of $2')));
   const chk=await pg.evaluate(`(${I18N_JS})(${JSON.stringify(EN_DICT)},${JSON.stringify(I18N_DATA)},'check')`);
   const mine=figs(await pg.evaluate(()=>{const c=document.body.cloneNode(true);c.querySelectorAll('[lang="es"]:not(html),script,style').forEach(x=>x.remove());const w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);let t='',n;while((n=w.nextNode()))t+=' '+n.textContent;return t;}),'en'),theirs=FIGS[baseId]||new Set();
   const missing=[...theirs].filter(x=>!mine.has(x)),extra=[...mine].filter(x=>!theirs.has(x));
   i18n={...i18n,residual:chk.residual.slice(0,20),residualCount:chk.residual.length,figures:{es:theirs.size,en:mine.size,missing,extra,ok:!missing.length&&!extra.length}};
   if(i18n.residualCount||!i18n.figures.ok)enBlocked.push({doc:id,residual:i18n.residualCount,figures:i18n.figures});
   fs.writeFileSync(f,'<!doctype html>\n'+(await pg.evaluate(()=>document.documentElement.outerHTML)));}
  else FIGS[id]=figs(await pg.evaluate(()=>{const c=document.body.cloneNode(true);c.querySelectorAll('[lang="es"]:not(html),script,style').forEach(x=>x.remove());const w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);let t='',n;while((n=w.nextNode()))t+=' '+n.textContent;return t;}),'es');
  const H=await pg.evaluate(()=>document.documentElement.scrollHeight);await pg.setViewportSize({width:vw,height:Math.min(H,16000)});
  const m=await pg.evaluate(()=>{const pages=[...document.querySelectorAll('.page')];const over=[];
   for(const p of pages){const box=p.getBoundingClientRect();for(const el of p.querySelectorAll('*')){if(el.closest('svg')&&el.tagName!=='svg')continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
     if(r.right>box.right+.5||r.bottom>box.bottom+.5||r.left<box.left-.5)over.push({page:p.dataset.page,tag:el.tagName,text:(el.textContent||'').trim().slice(0,40)});}
    const foot=p.querySelector('.foot')?.getBoundingClientRect();if(foot)for(const el of p.querySelectorAll(':scope > :not(.foot):not(.runhead) *')){if(el.closest('svg')&&el.tagName!=='svg')continue;const r=el.getBoundingClientRect();if(r.height&&r.bottom>foot.top+.5&&r.top<foot.top)over.push({page:p.dataset.page,collides:'foot',tag:el.tagName,text:(el.textContent||'').trim().slice(0,30)});}}
   let blockOverlaps=[];for(const p of pages){const kids=[...p.children].filter(e=>!e.classList.contains('sheet-frame')).map(e=>({e,r:e.getBoundingClientRect()}));for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){const a=kids[i].r,b=kids[j].r;if(a.width&&b.width&&a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)blockOverlaps.push({page:p.dataset.page,a:kids[i].e.className||kids[i].e.tagName,b:kids[j].e.className||kids[j].e.tagName});}}
   const tags=[...document.querySelectorAll('svg.plan g, svg.axo g')].map(g=>g.getBoundingClientRect());let tagOverlaps=0;for(let i=0;i<tags.length;i++)for(let j=i+1;j<tags.length;j++){const a=tags[i],b=tags[j];if(a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)tagOverlaps++;}
   // B1 QA: text lines that overlap each other inside a page (a caption running into the next row, a label over a title).
   // Line boxes of every visible text node outside SVG; two boxes of different text nodes may touch but not intersect.
   const textOverlaps=[];for(const p of pages){const boxes=[];const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){if(!n.textContent.trim()||n.parentElement.closest('svg'))continue;const st=getComputedStyle(n.parentElement);if(st.visibility==='hidden'||st.display==='none')continue;
     const rg=document.createRange();rg.selectNodeContents(n);const fs=parseFloat(st.fontSize),k=fs>=48?.15:0; // display type: the glyph box is taller than the line; compare its inner 70 %
     let clip=null;for(let e=n.parentElement;e&&e!==p;e=e.parentElement){if(getComputedStyle(e).overflow!=='visible'){const c=e.getBoundingClientRect();clip=clip?{left:Math.max(clip.left,c.left),right:Math.min(clip.right,c.right),top:Math.max(clip.top,c.top),bottom:Math.min(clip.bottom,c.bottom)}:{left:c.left,right:c.right,top:c.top,bottom:c.bottom};}}
     for(const r0 of rg.getClientRects()){const r=clip?{left:Math.max(r0.left,clip.left),right:Math.min(r0.right,clip.right),top:Math.max(r0.top,clip.top),bottom:Math.min(r0.bottom,clip.bottom),width:1,height:1}:r0;if(r.right-r.left>1&&r.bottom-r.top>1)boxes.push({n,r:{left:r.left,right:r.right,top:r.top+(r.bottom-r.top)*k,bottom:r.bottom-(r.bottom-r.top)*k},t:n.textContent.trim().slice(0,30)});}}
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){if(boxes[i].n===boxes[j].n)continue;const a=boxes[i].r,b=boxes[j].r;const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
     if(ix>1&&iy>1.5)textOverlaps.push({page:p.dataset.page,a:boxes[i].t,b:boxes[j].t});}}
   // B1 QA: a child that runs out of the bottom of a fixed-height box (grid row, card) whose overflow is visible.
   const spill=[];for(const p of pages)for(const el of p.querySelectorAll('*')){if(el.closest('svg'))continue;const st=getComputedStyle(el);if(st.overflow!=='visible'||st.display==='inline'||!el.children.length)continue;
    const r=el.getBoundingClientRect();if(!r.height)continue;for(const c of el.children){const cs=getComputedStyle(c);if(cs.position==='absolute'||cs.position==='fixed')continue;const k=c.getBoundingClientRect();
     if(k.height&&k.bottom>r.bottom+1.5){spill.push({page:p.dataset.page,box:(el.className||el.tagName).toString().slice(0,20),child:(c.textContent||c.tagName).trim().slice(0,30),by:+(k.bottom-r.bottom).toFixed(1)});break;}}}
   // B1 QA: SVG text cut by its own canvas (a value label past the end of a chart, a dimension past a footprint box).
   const svgClip=[];for(const sv of document.querySelectorAll('.page svg')){const b=sv.getBoundingClientRect();for(const t of sv.querySelectorAll('text')){const r=t.getBoundingClientRect();
    if(r.width&&(r.right>b.right+.8||r.left<b.left-.8||r.bottom>b.bottom+.8||r.top<b.top-.8)){svgClip.push({page:sv.closest('.page').dataset.page,text:t.textContent.slice(0,30)});}}}
   return {pages:pages.length,blockOverlaps,svgClipCount:svgClip.length,svgClip:svgClip.slice(0,8),spillCount:spill.length,spill:spill.slice(0,8),textOverlapCount:textOverlaps.length,textOverlaps:textOverlaps.slice(0,8),overflowCount:over.length,overflow:over.slice(0,12),tagOverlaps,fontsLoaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>`${f.family} ${f.weight} ${f.style}`)};});
  let lint=null;if(PROBE){const facts=await pg.evaluate(`(${PROBE})()`);lint={...judge(facts),fonts:facts.fonts,display:facts.display,body:facts.body};}
  // v1.2 · A04/ST05: a table that breaks the invariant (row lost, duplicated or taller than a page) never becomes a PDF.
  const {rowText,...flowRec}=flow;const pdfPath=path.join(outDir,id+'.pdf');let pdfRows=null;
  if(fs.existsSync(pdfPath))fs.rmSync(pdfPath); // v1.3 A11: nunca queda un PDF de una ejecución anterior
  if(lang==='en'&&enBlocked.some(b=>b.doc===id)){/* inglés con restos o cifras distintas: no se publica en inglés */}
  else if(!flow.ok){qa.blocked=(qa.blocked||[]).concat({doc:id,reason:flow.oversized.length?'fila más alta que una página':flow.multiTable.length?'varias tablas paginables en una página (no soportado)':flow.postOverflow.length?'desborde tras escribir las etiquetas de continuación':flow.orphanHeads.length?'cabecera de capítulo huérfana':'invariante de filas',oversized:flow.oversized,labelErrors:flow.labelErrors,multiTable:flow.multiTable,postOverflow:flow.postOverflow,orphanHeads:flow.orphanHeads});}
  else{if(process.env.FLOW_FAULT==='print')await pg.addStyleTag({content:'@media print{table.flow tbody tr:nth-child(4){visibility:hidden}}'}); // negative test of ST05 only
   await pg.emulateMedia({media:'print'});const tmpPdf=pdfPath+'.'+process.pid+'.tmp';await pg.pdf({path:tmpPdf,preferCSSPageSize:true,printBackground:true});
   // ST05: compare every row with the text actually printed. Count each row's main text in the final DOM and in the PDF.
   // ST05: per-cell proof on the printed PDF. Each canonical cell of each flow row is located in its page (rect relative to
   // the page, CSS px → PDF pt ×0.75); the words that pdftotext -tsv places inside that rect must be exactly the cell's text.
   if(flow.tables){const cells=await pg.evaluate(()=>{const pages=[...document.querySelectorAll('section.page')];const out=[];
     for(const td of document.querySelectorAll('table.flow tbody td')){if(td.hasAttribute('data-repeat'))continue;const t=td.textContent.replace(/\s+/g,' ').trim();if(!t)continue;
      const sec=td.closest('section.page'),pr=sec.getBoundingClientRect(),r=td.getBoundingClientRect();out.push({page:pages.indexOf(sec)+1,x:r.left-pr.left,y:r.top-pr.top,w:r.width,h:r.height,t,k:td.parentElement.dataset.k});}return out;});
    const tsv=require('child_process').execFileSync('pdftotext',['-q','-tsv',tmpPdf,'-']).toString().split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c[0]==='5'&&c[11]&&c[11].trim()).map(c=>({p:+c[1],x:+c[6],y:+c[7],w:+c[8],h:+c[9],t:c[11]}));
    const norm=t=>t.replace(/[\u00a0\u2009\u202f]/g,' ').replace(/\s+/g,'').trim();const bad=[];
    for(const c of cells){const X=c.x*.75-1,Y=c.y*.75-1,W=c.w*.75+2,H=c.h*.75+2;const got=tsv.filter(w=>w.p===c.page&&w.x+w.w/2>=X&&w.x+w.w/2<=X+W&&w.y+w.h/2>=Y&&w.y+w.h/2<=Y+H).map(w=>w.t).join(' ');
     if(norm(got)!==norm(c.t))bad.push({row:c.k,page:c.page,want:c.t.slice(0,60),got:got.slice(0,60)});}
    pdfRows={cells:cells.length,rows:new Set(cells.map(c=>c.k)).size,mismatches:bad.slice(0,10),bad:bad.length,ok:!bad.length};
    if(!pdfRows.ok)qa.blocked=(qa.blocked||[]).concat({doc:id,reason:'celdas impresas distintas del documento',mismatches:bad.slice(0,10)});}
   // v1.3 A11: el PDF solo se publica (renombrado atómico) si ha pasado todas sus pruebas; si no, se borra el temporal.
   if(pdfRows&&!pdfRows.ok)fs.rmSync(tmpPdf);else{fs.renameSync(tmpPdf,pdfPath);fresh.add(id);}}
  qa.docs[id]={...m,flow:flowRec,pdfRows,i18n,external:ext,errors,lint};await ctx.close();}
 qa.en={on:EN_ON,blocked:enBlocked};
 // v1.3 A11: con un documento bloqueado NO se publica la entrega: se descarta la preparación y se escribe un informe de
 // rechazo aparte. La entrega anterior aprobada (si existe) queda intacta. Solo se copian los PDF producidos en ESTA ejecución.
 if(E){if(qa.blocked){E.discard();fs.writeFileSync(path.join(outDir,'entrega-rechazo.json'),JSON.stringify({schema:'rubik-lab-entrega-rechazo/1',generated:new Date().toISOString(),project:S.project.id,revision:S.project.revision,blocked:qa.blocked,note:'No se ha publicado la entrega. La anterior, si existe, sigue en entrega/ sin cambios.'},null,1));}
  else{qa.entregaWeb=await E.writeWeb(fresh,EN_ON&&!enBlocked.length?{dict:EN_DICT,data:I18N_DATA,js:I18N_JS,browser}:null,browser);if(fs.existsSync(path.join(outDir,'entrega-rechazo.json')))fs.rmSync(path.join(outDir,'entrega-rechazo.json'));}}
 fs.writeFileSync(path.join(outDir,'qa.json'),JSON.stringify(qa,null,1));
 if(EN_ON)fs.writeFileSync(path.join(outDir,'i18n-datos.json'),JSON.stringify(I18N_DATA)); // para el QA del consumidor (no va en ninguna entrega)
 for(const [k,v] of Object.entries(qa.docs))console.log(k,'pages',v.pages,'blocks',JSON.stringify(v.blockOverlaps),'overflow',v.overflowCount,'textOverlaps',v.textOverlapCount,'spill',v.spillCount,'svgClip',v.svgClipCount,'flow',JSON.stringify(v.flow),'tagOverlaps',v.tagOverlaps,'ext',v.external.length,'errors',v.errors.length,'RED',JSON.stringify(v.lint?.red),'YELLOW',JSON.stringify(v.lint?.yellow));
 console.log('meta',JSON.stringify(meta));if(qa.blocked){console.log('BLOQUEADO',JSON.stringify(qa.blocked));process.exitCode=2;}await browser.close();})().catch(e=>{console.error(e);process.exit(1);});

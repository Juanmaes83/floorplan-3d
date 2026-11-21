/* SCULPT Simulator · A · HERO final de la Evolución (módulo de navegador). Pulido de A, no una piedra nueva.
 *
 * Se engancha a lo que ya existe: el reproductor (window.__ft3dFidelity), su escena (project-scene: setPose y `stage`), el
 * evento «ft3d8-moment» (stage «final»), la firma de Mi estudio (window.__ft3dDelivery.snapshot()) y, en la demo de la Home,
 * su tarjeta de cierre. No crea motor de cámara ni de render: pone poses, luz y una capa decorativa sobre la escena real.
 *
 * Garantías:
 *  - el proyecto, el plan, el presupuesto, la persistencia y la geometría no se tocan: el mobiliario se lee de los objetos
 *    canónicos (solo lectura) y la ambientación vive en un grupo propio, fuera de `root` (inspect() no la ve);
 *  - la ambientación usa solo los GLB públicos aprobados de OP-11 (Kenney, CC0); si no cargan, no se sustituyen;
 *  - comunica el éxito de la SIMULACIÓN, nunca que la obra real haya terminado;
 *  - prefers-reduced-motion: sin órbita ni fundidos; pose fija y firma;
 *  - cualquier acción del usuario (tecla, toque, «Ver controles») sale del HERO y devuelve la interfaz intacta.
 * renderAt(t) es determinista: la misma t da la misma imagen (captura, vídeo exportado, QA). */
import * as THREE from 'three';
import {load as cargarF3,dispose as liberarF3} from '../js/asset-loader.mjs';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const C=window.RubikFinalCore,F=()=>window.__ft3dFidelity;
if(!C)throw new Error('final-hero: falta RubikFinalCore');
const lang=()=>{const l=(document.documentElement.lang||'es').slice(0,2);return ['es','en','zh'].includes(l)?l:'es';};
const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Ambientación: SOLO los GLB admitidos por F3 (OP-11), por su manifiesto, su catálogo (FloorPlanAssets.adapt) y su cargador
// (asset-loader.mjs, que verifica permiso, bytes y SHA-256). Sin cargador ni catálogo propios.
const MANIFIESTO='../assets/f3/op11-lote-01.manifest.json',BASE_F3=new URL('../',location.href).href;
const IDS={plant:'op11-plant-small-1',potted:'op11-potted-plant'};
// Fuera del visor: barra de reproducción, panel del plan y cabecera. Dentro del visor, todo lo que no sea el lienzo, el HERO,
// la tarjeta de la demo o los avisos de WebGL (GOV-07, nunca se ocultan) sigue la variable --rf-ov (final-hero.css).
const OVERLAYS=['#panel-evolucion>.transport','#panel-evolucion>.evo-panel','.topbar'];

let previo=null,generacion=0,ultimo=null,niebla=null,pendiente=false,seq=null,activo=false,t0=0,raf=0,decor=null,lawn=null,sky=null,base=null,desde=null,capa=null,firmaEl=null,salirBtn=null,clip0=null,modelos=null,cargando=null;
let autoDisparo=true;
const api=window.__rubikFinal={get autoDisparo(){return autoDisparo;},set autoDisparo(v){autoDisparo=!!v;},get ultimo(){return ultimo;},dibujarVideo,get activo(){return activo;},get pendiente(){return pendiente;},get seq(){return seq;},reproducir,salir,renderAt,preparar,get cobertura(){return F()?.ctx?C.alcance(F().ctx.model):null;},get duracion(){return seq?.total??C.secuencia().total;}};

// ---------------------------------------------------------------- recursos
async function catalogoF3(){
 const A=window.FloorPlanAssets;if(!A||!crypto.subtle)return [];
 const r=await fetch(new URL(MANIFIESTO,location.href),{credentials:'same-origin',cache:'no-cache',redirect:'error'});if(!r.ok)return [];
 const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>65536)return [];
 // Misma revisión que asset-ui (SHA-256 de los bytes del manifiesto, 40 hex): mismas reglas de admisión que el editor.
 const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
 return A.adapt(JSON.parse(new TextDecoder().decode(bytes)),{catalog:'rubik-sota-local',revision}).entries;}
function cargarModelos(){
 if(modelos)return Promise.resolve(modelos);if(cargando)return cargando;
 cargando=catalogoF3().catch(()=>[]).then(entries=>Promise.all(Object.entries(IDS).map(([k,id])=>{const en=entries.find(e=>e.id===id);
  return en?cargarF3(en,{base:BASE_F3}).then(r=>[k,{scene:r.scene,altoM:r.dimensionsMm.height/1000,atribucion:r.attribution}]).catch(()=>[k,null]):[k,null];})))
  .then(p=>{cargando=null;return (modelos=Object.fromEntries(p));});
 return cargando;}
/** Libera las plantillas F3 (GPU y memoria). Se recargan, verificadas, la próxima vez. */
function liberarModelos(){if(!modelos)return;for(const m of Object.values(modelos))if(m)liberarF3(m.scene);modelos=null;}
// Misma fórmula que envBox() de project-scene (contorno {x,y,w,h} por planta + desplazamiento), en metros del mundo.
function envMetros(inv){
 const o=inv.origin,e=inv.levels.reduce((a,l)=>({x0:Math.min(a.x0,l.envelope.x+l.offsetMm.x),y0:Math.min(a.y0,l.envelope.y+l.offsetMm.y),
  x1:Math.max(a.x1,l.envelope.x+l.envelope.w+l.offsetMm.x),y1:Math.max(a.y1,l.envelope.y+l.envelope.h+l.offsetMm.y)}),{x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
 return {x0:(e.x0-o.x)/1000,x1:(e.x1-o.x)/1000,z0:(e.y0-o.y)/1000,z1:(e.y1-o.y)/1000,top:Math.max(...inv.levels.map(l=>l.elevationMm))/1000+3};}
// Mobiliario REAL del proyecto (objetos canónicos), como volúmenes redondeados: posición, giro, tamaño y color del proyecto.
// Altura: la declarada; si falta, la del catálogo genérico del editor (FloorPlanGenericCatalog.heights) o 800 mm, como él.
function muebles(src,inv,grupo){
 const o=inv.origin,heights=window.FloorPlanGenericCatalog?.heights||{};let n=0;
 const niveles=src?.levels?src.levels.map(l=>({project:l.project,lv:inv.levels.find(x=>x.levelId===l.id)})):[{project:src,lv:inv.levels[0]}];
 for(const {project,lv} of niveles){if(!project||!lv)continue;
  for(const ob of project.objects||[]){const s=ob.size||{};if(!(s.widthMm>0&&s.depthMm>0))continue;
   const h=(s.heightMm||heights[ob.type]||800)/1000,w=s.widthMm/1000,d=s.depthMm/1000;
   const g=new RoundedBoxGeometry(w,h,d,2,Math.min(.04,w/6,d/6,h/6));g.translate(0,h/2,0);
   const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:new THREE.Color(ob.color||'#d9d2c4'),roughness:.72,transparent:true,opacity:0}));
   m.position.set((ob.position.x+lv.offsetMm.x-o.x)/1000,lv.elevationMm/1000+(ob.elevationMm||0)/1000+.008,(ob.position.y+lv.offsetMm.y-o.y)/1000);
   m.rotation.y=-(ob.rotationDeg||0)*Math.PI/180;m.castShadow=m.receiveShadow=true;m.userData.decor='mueble';grupo.add(m);n++;}}
 return n;}
// Degradado radial para el césped: se funde con el suelo, sin borde duro.
function fundido(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),gr=g.createRadialGradient(128,128,40,128,128,128);
 gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#fff');gr.addColorStop(.8,'#333');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);}
function cielo(){const c=document.createElement('canvas');c.width=4;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
 gr.addColorStop(0,'#c9d6de');gr.addColorStop(.5,'#e9e4dc');gr.addColorStop(1,'#efe9e0');g.fillStyle=gr;g.fillRect(0,0,4,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

/** Prepara la capa decorativa del proyecto mostrado (idempotente por proyecto). */
async function preparar(){
 const fid=F(),st=fid?.scene?.stage;if(!fid?.ctx||!st)return false;
 const inv=fid.ctx.model.inventory,cob=C.alcance(fid.ctx.model);
 if(decor?.userData.inv===inv&&decor.userData.estado===cob.estado)return true;
 limpiarDecor();const gen=++generacion;
 const capaD=new THREE.Group();capaD.name='rubik-final-decor';capaD.userData.inv=inv;capaD.userData.estado=cob.estado;
 const env=envMetros(inv),cx=(env.x0+env.x1)/2,cz=(env.z0+env.z1)/2,r=Math.hypot(env.x1-env.x0,env.z1-env.z0);
 const cesped=new THREE.Mesh(new THREE.CircleGeometry(r*1.55,128),new THREE.MeshStandardMaterial({color:0xa7b58c,roughness:1,transparent:true,opacity:0,alphaMap:fundido(),depthWrite:false}));
 cesped.userData.decor='cesped';cesped.rotation.x=-Math.PI/2;cesped.position.set(cx,-.0012,cz);cesped.receiveShadow=true;capaD.add(cesped);
 // Gate de cobertura: sin plan completo NO se amuebla ni se ambienta (sería fingir una vivienda terminada). Césped y luz sí:
 // el cierre parcial es digno, pero honesto.
 const completo=cob.estado==='completo';
 const nMuebles=completo?muebles(fid.ctx.input?.source,inv,capaD):0;
 const M=completo?await cargarModelos():{};
 // Proyecto cambiado (o HERO cancelado) durante la carga asíncrona: esta capa ya no vale; se libera y no se añade.
 if(gen!==generacion||F()?.ctx?.model.inventory!==inv){liberarCapa(capaD);return false;}
 let nPlantas=0;
 for(const p of C.ambientacion(env)){const src=M[p.modelo];if(!src)continue;const g=src.scene.clone(true);
  g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=o.material.clone();o.material.transparent=true;o.material.opacity=0;}});
  // Altura real del GLB → escala para una altura objetivo creíble (maceta ~0,9–1,2 m · planta baja ~0,5–0,7 m).
  const alto=Math.max(.01,src.altoM),objetivo=(p.modelo==='potted'?0.42:0.26)*p.escala;
  g.position.set(p.x,0,p.z);g.rotation.y=p.rot;g.scale.setScalar(objetivo/alto);g.userData.decor='planta';capaD.add(g);nPlantas++;}
 capaD.userData.resumen={cobertura:cob,muebles:nMuebles,plantas:nPlantas,modelos:Object.fromEntries(Object.entries(M).map(([k,v])=>[k,!!v])),cargador:'F3 asset-loader',atribucion:[...new Set(Object.values(M).filter(Boolean).map(m=>m.atribucion))]};
 capaD.visible=false;st.scene.add(capaD);decor=capaD;lawn=cesped;
 return true;}
/** Libera lo que la capa creó: geometrías propias, materiales clonados y texturas propias (la geometría de las plantillas F3
 *  es compartida y se libera con liberarModelos). */
function liberarCapa(g){g.parent?.remove(g);g.traverse(o=>{if(!o.isMesh)return;if(o.userData.decor==='mueble'||o.userData.decor==='cesped')o.geometry.dispose();
 const m=o.material;if(m){m.alphaMap?.dispose();m.dispose();}});}
function limpiarDecor(){generacion++;if(!decor)return;liberarCapa(decor);decor=lawn=null;}

// ---------------------------------------------------------------- luz y capa de interfaz
function guardarBase(st){base={hemiSky:st.hemi.color.clone(),hemiGround:st.hemi.groundColor.clone(),hemiI:st.hemi.intensity,sunC:st.sun.color.clone(),sunI:st.sun.intensity,sunP:st.sun.position.clone(),
 bg:st.scene.background,fog:st.scene.fog||null,sombra:{...st.sun.shadow.camera},ground:st.ground.material.color.clone()};}
function aplicarLuz(st,k,env){
 if(!base)return;const c=(a,b)=>a.clone().lerp(new THREE.Color(b),k);
 // Tarde suave: cielo apenas cálido, sol dorado no saturado, rebote del suelo neutro; sombras más largas pero abiertas.
 st.hemi.color.copy(c(base.hemiSky,0xf4f1ec));st.hemi.groundColor.copy(c(base.hemiGround,0xcfc6b6));st.hemi.intensity=base.hemiI+(1.35-base.hemiI)*k;
 st.sun.color.copy(c(base.sunC,0xffe2bd));st.sun.intensity=base.sunI+(1.9-base.sunI)*k;
 const cx=(env.x0+env.x1)/2,cz=(env.z0+env.z1)/2,warm=new THREE.Vector3(cx-14,17,cz+10);st.sun.position.copy(base.sunP.clone().lerp(warm,k));st.sun.target.position.set(cx,0,cz);st.sun.target.updateMatrixWorld();
 st.ground.material.color.copy(c(base.ground,0xe4e0d8));
 // El volumen de sombras cubre el césped completo (sin bandas lejanas); se restaura al salir.
 const rs=Math.max(base.sombra.right,Math.hypot(env.x1-env.x0,env.z1-env.z0)*1.6),sc=st.sun.shadow.camera;
 if(sc.right!==rs){Object.assign(sc,{left:-rs,right:rs,top:rs,bottom:-rs,far:Math.max(base.sombra.far,rs*3)});sc.updateProjectionMatrix();}
 if(!sky)sky=cielo();st.scene.background=k>.02?sky:base.bg;
 // Niebla de horizonte: funde el suelo con el cielo y da profundidad (solo durante el HERO).
 const r=Math.hypot(env.x1-env.x0,env.z1-env.z0);if(k>.02){if(!niebla)niebla=new THREE.Fog(0xebe6de,r*2.2,r*6);st.scene.fog=niebla;niebla.near=r*(6-3.8*k);niebla.far=r*(14-8*k);}
 else if(st.scene.fog===niebla)st.scene.fog=base.fog;}
function restaurarLuz(st){if(!base)return;st.hemi.color.copy(base.hemiSky);st.hemi.groundColor.copy(base.hemiGround);st.hemi.intensity=base.hemiI;st.sun.color.copy(base.sunC);st.sun.intensity=base.sunI;
 st.sun.position.copy(base.sunP);st.scene.background=base.bg;st.scene.fog=base.fog;
 {const sc=st.sun.shadow.camera,b=base.sombra;Object.assign(sc,{left:b.left,right:b.right,top:b.top,bottom:b.bottom,far:b.far});sc.updateProjectionMatrix();}st.ground.material.color.copy(base.ground);base=null;}
function crearCapa(){
 const wrap=document.querySelector('#panel-evolucion>.stagewrap');if(!wrap)return;
 const r=wrap.getBoundingClientRect();clip0={top:r.top,right:innerWidth-r.right,bottom:innerHeight-r.bottom,left:r.left};
 document.body.classList.add('rubik-final');wrap.classList.add('rf-full');
 const f=C.firma({marca:window.__ft3dDelivery?.snapshot?.()||null,proyecto:F().ctx.model.subject?.name||'',lang:lang(),cobertura:C.alcance(F().ctx.model)}),t=C.textos(lang());
 firmaEl=document.createElement('div');firmaEl.className='rf-firma';firmaEl.id='rfFirma';firmaEl.setAttribute('role','status');
 const el=(tag,cls,txt,p=firmaEl)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;p.append(n);return n;};
 // Títulos de cierre integrados en el plano (sin caja): cada línea aparece a su tiempo (data-i).
 let i=0;const L=(n)=>{n.dataset.i=String(i++);return n;};
 if(f.logo){const im=L(el('img','rf-logo'));im.src=f.logo;im.alt='';}
 if(f.estudio)L(el('p','rf-estudio',f.estudio));
 L(el('h2','rf-titulo',f.titulo));
 if(f.lema)L(el('p','rf-claim',f.lema));
 if(f.web||f.cta){const r=L(el('p','rf-cta'));if(f.cta)el('span','rf-cta-t',f.cta,r);if(f.web)el('span','rf-web',f.web,r);}
 L(el('p','rf-ok',f.completada+' · '+f.aviso));
 firmaEl.dataset.n=String(i);
 const pie=el('div','rf-pie',null,wrap);pie.id='rfPie';el('span','rf-decor',t.decor,pie);el('span','rf-rubik',f.atribucion,pie);
 wrap.append(firmaEl);
 F().scene.resize();// el lienzo adopta ya la pantalla completa: el primer fotograma usa el aspecto correcto
 salirBtn=document.createElement('button');salirBtn.type='button';salirBtn.className='rf-salir';salirBtn.id='rfSalir';salirBtn.textContent=t.saltar;salirBtn.onclick=()=>salir();wrap.append(salirBtn);
 capa={wrap,pie};}
function quitarCapa(){document.body.classList.remove('rubik-final');capa?.wrap.classList.remove('rf-full');if(capa?.wrap)capa.wrap.style.clipPath='';
 for(const s of OVERLAYS)for(const n of document.querySelectorAll(s))n.style.opacity='';firmaEl?.remove();capa?.pie?.remove();salirBtn?.remove();firmaEl=salirBtn=capa=null;}

// ---------------------------------------------------------------- render determinista
function renderAt(tMs,{render=true}={}){
 const fid=F(),st=fid?.scene?.stage;if(!seq||!st||!decor)return null;
 const e=seq.en(tMs);ultimo=e;const inv=fid.ctx.model.inventory,env=envMetros(inv),[w,h]=fid.scene.size,aspect=w/h||16/9;
 // Interfaz técnica → fuera; el visor se abre de su rectángulo a la pantalla completa (recorte animado, sin saltos de tamaño).
 for(const s of OVERLAYS)for(const n of document.querySelectorAll(s))n.style.opacity=String(e.overlays);
 capa?.wrap.style.setProperty('--rf-ov',String(e.overlays));
 if(capa&&clip0){const k=1-e.overlays;capa.wrap.style.clipPath=`inset(${clip0.top*(1-k)}px ${clip0.right*(1-k)}px ${clip0.bottom*(1-k)}px ${clip0.left*(1-k)}px)`;}
 const hero=C.poseHero(env,{angulo:e.orbita,aspecto:aspect,elevacionDeg:30});
 fid.scene.setPose(desde?C.mezclarPose(desde,hero,e.acercar):hero);
 aplicarLuz(st,e.luz,env);
 decor.visible=e.decor>0;for(const o of decor.children){const op=o===lawn?e.decor*.92:e.decor;o.traverse(m=>{if(m.isMesh){m.material.opacity=op;m.material.transparent=op<1;m.material.depthWrite=op>.5;}});
  if(o.userData.decor==='planta'){const s=o.userData.s0??(o.userData.s0=o.scale.x);o.scale.setScalar(s*(.6+.4*e.decor));}}
 if(firmaEl){const n=+firmaEl.dataset.n||1;firmaEl.style.opacity=e.firma>0?'1':'0';capa?.wrap.style.setProperty('--rf-velo',String(Math.min(1,e.firma*2)));
  for(const c of firmaEl.children){const k=C.escalon(e.firma,+c.dataset.i,n);c.style.opacity=String(k);c.style.transform=`translateY(${(1-k)*18}px)`;c.style.filter=k<1?`blur(${(1-k)*6}px)`:'';}}
 if(capa?.pie)capa.pie.style.opacity=String(Math.max(e.decor,e.firma));
 if(render)fid.scene.renderNow?.();
 return e;}


// ---------------------------------------------------------------- vídeo exportado (lienzo del grabador existente)
const imgs=new Map();const img=src=>{if(!src)return null;if(!imgs.has(src)){const i=new Image();i.src=src;imgs.set(src,i);}return imgs.get(src);};
/** Dibuja el cierre del HERO sobre un fotograma del vídeo con el contrato común de títulos (RubikFinalTitulos): el mismo
 *  que usa la previsualización de STUDIO. Sin chips técnicos. */
function dibujarVideo(x,W,H,{marca=null,proyecto=''}={}){
 const e=ultimo;if(!e)return;const f=C.firma({marca,proyecto,lang:'es',cobertura:F()?.ctx?C.alcance(F().ctx.model):null}),t=C.textos('es');
 const pie=Math.max(e.decor,e.firma),s=Math.min(H/900,W/1440);
 if(pie>0){x.save();x.globalAlpha=pie;x.textAlign='right';x.textBaseline='alphabetic';x.fillStyle='rgba(255,255,255,.88)';x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=6;
  x.font=`500 ${Math.round(14*s)}px Inter, "Helvetica Neue", Arial, sans-serif`;x.fillText(t.decor,W-36*s,H-40*s);x.font=`700 ${Math.round(13*s)}px Inter, "Helvetica Neue", Arial, sans-serif`;x.fillText(f.atribucion,W-36*s,H-20*s);x.restore();}
 if(e.firma>0)window.RubikFinalTitulos.pintar(x,W,H,f,{progreso:e.firma,estilo:f.estilo,logo:img(f.logo)});
}
// ---------------------------------------------------------------- ciclo en vivo
/** reproducir({manual:true}): sin reloj en vivo; solo renderAt(t) avanza (captura determinista, vídeo exportado y QA). */
async function reproducir({duraciones,manual=false,capaUI=true}={}){
 const fid=F();if(!fid?.ctx||activo)return false;
 if(!manual&&(document.body.classList.contains('capture')||window.__ft3dDelivery?.state?.recording))return false;
 // Estado exacto anterior, tomado al PEDIR el HERO (antes de la carga asíncrona: con el giro automático la cámara sigue moviéndose).
 const antes={pose:fid.pose,auto:fid.scene.autoRotating,foco:document.activeElement};
 if(!(await preparar()))return false;
 // Si mientras se preparaba cambió el proyecto, el usuario salió o se disparó otro HERO, no se empieza.
 if(activo||!F()?.ctx||decor?.userData.inv!==F().ctx.model.inventory)return false;
 const st=fid.scene.stage;seq=C.secuencia({duraciones,reducedMotion:reduce()});
 // Estado exacto anterior: pose de cámara, giro automático, foco y si el usuario había movido la vista.
 previo=antes;
 activo=true;desde=previo.pose;guardarBase(st);fid.scene.setAuto(false);if(capaUI)crearCapa();
 window.dispatchEvent(new CustomEvent('rubik-final-inicio',{detail:{total:seq.total}}));
 if(manual)return true;
 t0=performance.now();
 const paso=now=>{if(!activo)return;const e=renderAt(now-t0,{render:false});if(e?.fin){raf=0;window.dispatchEvent(new CustomEvent('rubik-final-fin'));return;}raf=requestAnimationFrame(paso);};
 raf=requestAnimationFrame(paso);salirBtn?.focus({preventScroll:true,focusVisible:false});
 return true;}
/** Sale del HERO y deja la Evolución EXACTAMENTE como estaba: cámara, giro automático, foco, luz, niebla, sombras, interfaz y
 *  lienzo. La ambientación temporal se retira y se libera siempre (GPU y memoria); el HERO queda en reposo (sin bucles). */
function salir(){
 if(!activo)return;activo=false;cancelAnimationFrame(raf);raf=0;const fid=F(),st=fid.scene.stage;
 quitarCapa();restaurarLuz(st);limpiarDecor();liberarModelos();
 if(sky){sky.dispose();sky=null;}seq=null;ultimo=null;desde=null;
 const p=previo;previo=null;
 if(p){fid.scene.setPose(p.pose);if(p.auto)fid.scene.setAuto(true);}
 fid.scene.resize();fid.scene.renderNow?.();
 if(p?.foco?.isConnected&&p.foco!==document.body)p.foco.focus({preventScroll:true});
 window.dispatchEvent(new CustomEvent('rubik-final-salida'));}

// Disparo: al llegar al final DEL PLAN reproduciendo (no al desplazarse a mano), una vez por llegada.
let llegada=false;
window.addEventListener('ft3d8-moment',e=>{if(window.__ft3dDelivery?.state?.recording)return;// el grabador gobierna el HERO mientras graba
 const fin=e.detail?.stage==='final',fid=F();
 if(!fin){llegada=false;if(activo)salir();else limpiarDecor();return;}
 if(llegada)return;llegada=true;if(!autoDisparo)return;
 if(fid?.playing||window.__ft3dSource?.mode==='demo'){pendiente=true;reproducir().finally(()=>{pendiente=false;});}});
// Cualquier gesto del usuario sale del HERO (la interfaz vuelve intacta). Escape también.
for(const ev of ['pointerdown','wheel'])document.addEventListener(ev,e=>{if(activo&&!e.target.closest?.('.rf-firma'))salir();},{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(activo&&(e.key==='Escape'||e.key===' '||e.key.startsWith('Arrow')))salir();},{capture:true});
// Proyecto nuevo: la capa decorativa se rehace para él.
window.addEventListener('ft3d8-loaded',()=>{if(activo)salir();limpiarDecor();});
// Al abandonar la página no queda nada retenido.
window.addEventListener('pagehide',()=>{if(activo)salir();limpiarDecor();liberarModelos();});

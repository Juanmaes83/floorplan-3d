/* HERO FINAL universal · consumidor C · Hybrid V2 «Dibujo vivo» (núcleo puro, UMD, sin three ni DOM).
 *
 * Envuelve la narrativa EXISTENTE «living-drawing» (FloorPlanPresentationStory) con un epílogo HERO en cuatro fases, puro
 * en p (pausa, avance, retroceso y movimiento reducido funcionan igual que en el resto de la escena):
 *   1 · grafito       la vivienda entera vuelve a ser dibujo (capa del dibujo vivo con t = -1) y los muros bajan a planta;
 *                     la cámara sale al exterior, a una vista de tres cuartos (RubikFinalCore.poseHero);
 *   2 · construccion  los muros se levantan desde el plano hasta su altura real (wallScale, el mismo mecanismo de la
 *                     narrativa «plan-reveal»), todavía a grafito;
 *   3 · realidad      cada estancia cobra vida con SUS semillas del dibujo vivo (reproducción acelerada y determinista
 *                     del mismo reloj de llegada), mientras la cámara orbita despacio;
 *   4 · firma         títulos de cierre del contrato común (RubikFinalTitulos) sobre la vivienda real.
 * No toca el proyecto: solo produce estados de presentación (pose, t de la capa, escala de muros, corte y firma).
 */
(function(root,factory){const api=factory(root.RubikFinalCore||(typeof require==='function'?require('./final-core.cjs'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikFinalDibujo=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 // Sin el núcleo común (recurso no servido o bloqueado) el epílogo no existe y la presentación queda exactamente como en
 // master: no se lanza ningún error que pueda interrumpir el arranque del editor.
 if(!C){if(typeof console!=='undefined')console.warn('HERO dibujo vivo: falta RubikFinalCore; epílogo desactivado');return undefined;}
 const VERSION='rubik-final-dibujo/1';
 const FASES=Object.freeze(['grafito','construccion','realidad','firma']);
 const DURACIONES=Object.freeze({grafito:3500,construccion:6000,realidad:8000,firma:6500});
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),suave=C.suave,tramo=(t,a,b)=>clamp((t-a)/(b-a));
 const lerp=(a,b,k)=>a+(b-a)*k,lerp3=(a,b,k)=>[0,1,2].map(i=>lerp(a[i],b[i],k));

 /** Estado del epílogo en e (ms desde su inicio). Valores 0..1 salvo órbita (rad) y tVivo (s del reloj del dibujo vivo). */
 function epilogoEn(e,{duraciones=DURACIONES,reducedMotion=false,intro,totalBase}={}){
  const d={...DURACIONES,...duraciones},i={grafito:0};i.construccion=d.grafito;i.realidad=i.construccion+d.construccion;i.firma=i.realidad+d.realidad;
  const total=i.firma+d.firma,t=clamp(e,0,total),r=reducedMotion;let fase='firma';for(const f of FASES)if(t<i[f]+d[f]){fase=f;break;}
  // Muros: bajan a planta en el grafito, se levantan en la construcción (escala mínima 0,02: el trazo del plano se ve).
  const baja=r?1:suave(tramo(t,0,d.grafito*0.6)),sube=r?(t>=i.realidad?1:t>=i.construccion?0.5:0.02):suave(tramo(t,i.construccion,i.construccion+d.construccion*0.9));
  const muros=t<i.construccion?lerp(1,0.02,baja):lerp(0.02,1,sube);
  // Llegada a la realidad: el MISMO reloj del dibujo vivo (de intro a totalBase) recorrido en la fase «realidad».
  const kReal=r?(t>=i.realidad?1:0):tramo(t,i.realidad,i.realidad+d.realidad*0.92);
  const tVivo=t<i.realidad?-1:kReal>=1?totalBase+1:intro+(totalBase-intro)*kReal;
  const acercar=r?1:suave(tramo(t,0,d.grafito));
  const orbita=r?0:0.5*suave(tramo(t,i.construccion,i.firma+d.firma*0.7));
  const firma=r?(t>=i.firma?1:0):tramo(t,i.firma,i.firma+d.firma*0.75);
  // kReal: avance de la llegada a la realidad de TODA la vivienda (aterrizajeHero); -1 = todo dibujo; 1 = todo real.
  return Object.freeze({e:t,fase,muros,tVivo,kReal:t<i.realidad?-1:kReal,acercar,orbita,firma,interfaz:r?(t>0?0:1):1-suave(tramo(t,0,1500)),completos:t>=i.construccion,fin:t>=total,total});}

 /**
  * Envuelve una narrativa «living-drawing». env: contorno de la vivienda en metros del mundo {x0,x1,z0,z1,top}.
  * El resultado es otra narrativa con el mismo contrato (stateAt(p), info, checkpoints) y una duración total mayor.
  */
 function epilogo(base,{env,aspect=16/9,fov=40,reducedMotion=false,duraciones}={}){
  if(!base||base.kind!=='living-drawing'||typeof base.stateAt!=='function')throw new Error('Se espera la narrativa «living-drawing».');
  if(!env||![env.x0,env.x1,env.z0,env.z1].every(Number.isFinite))throw new Error('Contorno de la vivienda no válido.');
  const totalBase=base.info.total,intro=base.info.intro||0,dur=epilogoEn(0,{duraciones,reducedMotion,intro,totalBase}).total/1000,total=totalBase+dur;
  const fin=base.stateAt(1),pose0={position:fin.position,target:fin.target,fov:fin.fov};
  // Encuadre propio de este consumidor: la vivienda algo más alta que en A (deja el tercio inferior a los títulos).
  const alza=Math.hypot(env.x1-env.x0,env.z1-env.z0)*0.1;
  const heroPose=k=>{const h=C.poseHero(env,{angulo:k,aspecto:aspect,fov,elevacionDeg:30});return {...h,position:[h.position[0],h.position[1]-alza,h.position[2]],target:[h.target[0],h.target[1]-alza,h.target[2]]};};
  function stateAt(raw){
   const p=clamp(Number(raw)||0),t=p*total;
   if(t<=totalBase+1e-9){const st=base.stateAt(totalBase?t/totalBase:1);return {...st,p,wallScale:1,fullWalls:false,hero:null};}
   const e=epilogoEn((t-totalBase)*1000,{duraciones,reducedMotion,intro,totalBase}),h=heroPose(e.orbita);
   const pose=reducedMotion?h:{position:lerp3(pose0.position,h.position,e.acercar),target:lerp3(pose0.target,h.target,e.acercar),fov:lerp(pose0.fov,h.fov,e.acercar)};
   const position=[...pose.position],target=[...pose.target],len=Math.hypot(position[0]-target[0],position[1]-target[1],position[2]-target[2]);
   return {p,t:e.tVivo,phase:'hero',heroPhase:e.fase,roomIndex:-1,roomId:null,position,target,fov:pose.fov,near:fin.near,far:Math.max(fin.far,len*6),distance:len,
    wallScale:e.muros,fullWalls:e.completos,hero:e};}
  const ends=[...(base.info.rooms||[]).map(r=>r.end/total)];
  return {kind:'living-drawing',stateAt,checkpoints:[0,.25,.5,.75,1],
   info:{...base.info,total,playMs:Math.round(total*1000),hero:{version:VERSION,from:totalBase/total,total:dur,fases:FASES},rooms:(base.info.rooms||[]),ends}};}

 /**
  * Llegada de la vivienda ENTERA para la fase «realidad»: mismas estancias, mismo mobiliario y mismo motor de la capa del
  * dibujo vivo (setLanding/setTime), con una visita por estancia escalonada y semillas en sus piezas (las grandes primero,
  * huecos irregulares). La escena original solo da vida a las estancias elegidas; el cierre necesita toda la vivienda.
  */
 function aterrizajeHero(landing0,{escalon=0.5,duracion=2.6}={}){
  if(!landing0?.rooms?.length)return null;const furn=landing0.furniture||[];
  const vol=f=>(f.max[0]-f.min[0])*(f.max[1]-f.min[1])*(f.max[2]-f.min[2]);
  const visits=landing0.rooms.map((r,i)=>{const piezas=furn.filter(f=>f.roomIndex===r.index).sort((a,b)=>vol(b)-vol(a)).slice(0,8);
   return {roomIndex:r.index,start:i*escalon,duration:duracion,seeds:piezas.map((f,j)=>({fid:f.fid,at:Math.min(duracion*0.8,0.25+j*0.32+((j*37)%5)*0.035),dark:false}))};});
  const total=(landing0.rooms.length-1)*escalon+duracion+0.3;
  return {rooms:landing0.rooms,visits,furniture:furn,levelY:landing0.levelY,total};}
 /** Contorno en metros desde los polígonos de estancias (coordenadas del mundo [x,z]) y la altura de muro. */
 function contorno(polys,top){let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;for(const p of polys)for(const [x,z] of p){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
  return {x0,x1,z0,z1,top:Math.max(2.6,Number(top)||2.8)};}
 return Object.freeze({VERSION,FASES,DURACIONES,epilogoEn,epilogo,contorno,aterrizajeHero});
});

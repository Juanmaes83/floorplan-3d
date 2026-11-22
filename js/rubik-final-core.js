/* SCULPT Simulator · A · PULIDO DEL DESENLACE («HERO final») · núcleo puro (UMD, sin three ni DOM).
 *
 * Al terminar el plan, la Evolución pasa por cuatro fases encadenadas en un tiempo único y determinista:
 *   1 · cierre-obra   la obra termina: los paneles técnicos se retiran y la cámara se aproxima a la vivienda;
 *   2 · revelacion    mobiliario del proyecto (volúmenes reales, solo lectura) y ambientación decorativa aparecen;
 *                     la luz pasa a una tarde cálida;
 *   3 · hero          órbita lenta y continua, encuadre arquitectónico de tres cuartos;
 *   4 · firma         logotipo, estudio y título del proyecto (Mi estudio); RUBIK como atribución discreta.
 * Todo es función de t (ms): la misma t da la misma imagen en vivo, en captura y en el vídeo exportado.
 * Nada aquí toca el proyecto: la ambientación es decorativa y no entra en mediciones, plan, presupuesto ni persistencia.
 * Comunica el éxito de la SIMULACIÓN; nunca certifica que la obra real haya terminado.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikFinalCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='rubik-final-hero/1';
 // Duraciones por defecto (ms). Prima la calidad: son más largas que la referencia orientativa y se pueden ajustar.
 const DURACIONES=Object.freeze({'cierre-obra':3500,revelacion:5000,hero:10000,firma:6500});
 const FASES=Object.freeze(Object.keys(DURACIONES));
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 // Curvas sin aristas: smootherstep (derivadas 1.ª y 2.ª nulas en los extremos) → sin tirones al entrar ni al salir.
 const suave=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const tramo=(t,a,b)=>clamp((t-a)/(b-a));

 function secuencia({duraciones=DURACIONES,reducedMotion=false}={}){
  const d={...DURACIONES,...duraciones};for(const f of FASES)if(!(Number.isFinite(d[f])&&d[f]>=0))throw new Error('Duración no válida: '+f);
  const inicio={};let t=0;for(const f of FASES){inicio[f]=t;t+=d[f];}
  const total=t;
  /**
   * Estado en t (ms). Valores 0..1 salvo la órbita (radianes) y la pose relativa.
   * overlays  1 = paneles técnicos visibles, 0 = retirados.
   * decor     aparición del mobiliario y la ambientación.
   * luz       mezcla hacia la luz de tarde.
   * acercar   transición de la pose de partida a la pose HERO.
   * orbita    ángulo añadido a la pose HERO (velocidad suave que se detiene en la firma).
   * firma     opacidad de la firma.
   */
  function en(tMs){
   const t=clamp(tMs,0,total);let fase=FASES[FASES.length-1];for(const f of FASES)if(t<inicio[f]+d[f]){fase=f;break;}
   const r=reducedMotion;
   const overlays=r?(t>0?0:1):1-suave(tramo(t,0,inicio.revelacion+d.revelacion*0.25));
   const acercar=r?1:suave(tramo(t,d['cierre-obra']*0.15,inicio.revelacion+d.revelacion*0.6));
   const decor=r?(t>=inicio.revelacion?1:0):suave(tramo(t,inicio.revelacion,inicio.revelacion+d.revelacion*0.8));
   const luz=r?(t>=inicio.revelacion?1:0):suave(tramo(t,inicio['cierre-obra']+d['cierre-obra']*0.5,inicio.revelacion+d.revelacion));
   // Órbita: integral de una velocidad con rampa suave de entrada y de salida (empieza en la revelación, se apaga en la firma).
   const ARCO=0.62; // radianes recorridos en total (~36°): lento, de tres cuartos a tres cuartos
   const a0=inicio.revelacion+d.revelacion*0.4,a1=inicio.firma+d.firma*0.7;
   const orbita=r?0:ARCO*suave(tramo(t,a0,a1));
   const firma=r?(t>=inicio.firma?1:0):tramo(t,inicio.firma,inicio.firma+d.firma*0.75);// lineal: escalon() da la suavidad por línea
   return Object.freeze({t,fase,overlays,acercar,decor,luz,orbita,firma,fin:t>=total});
  }
  return Object.freeze({total,inicio:Object.freeze(inicio),duraciones:Object.freeze(d),en,reducedMotion});
 }

 /** Pose HERO desde el contorno del proyecto (m): tres cuartos, mirada al tercio inferior, ~24° de elevación. */
 function poseHero(env,{angulo=0,aspecto=16/9,fov=40,elevacionDeg=24}={}){
  const cx=(env.x0+env.x1)/2,cz=(env.z0+env.z1)/2,w=env.x1-env.x0,dz=env.z1-env.z0,top=Math.max(2.6,env.top||2.8);
  const radio=Math.hypot(w,dz)/2;
  // Distancia para que el contorno (con un margen del 18 %) quepa en el lado limitante del encuadre.
  const vfov=fov*Math.PI/180,hfov=2*Math.atan(Math.tan(vfov/2)*aspecto);
  const base=Math.PI*0.25+angulo,el=elevacionDeg*Math.PI/180;
  const lim=Math.min(vfov,hfov),dist=(radio*1.06)/Math.tan(lim/2)+radio*0.2;
  // Composición: la vivienda a la derecha del encuadre (deja aire a la firma, abajo a la izquierda).
  const rx=Math.cos(base),rz=-Math.sin(base),shift=radio*0.4;
  const target=[cx-rx*shift,top*0.26,cz-rz*shift];
  return {position:[cx+Math.sin(base)*Math.cos(el)*dist,target[1]+Math.sin(el)*dist,cz+Math.cos(base)*Math.cos(el)*dist],target,fov};
 }
 const lerp=(a,b,k)=>a+(b-a)*k,lerp3=(a,b,k)=>[0,1,2].map(i=>lerp(a[i],b[i],k));
 function mezclarPose(desde,hacia,k){return {position:lerp3(desde.position,hacia.position,k),target:lerp3(desde.target,hacia.target,k),fov:lerp(desde.fov,hacia.fov,k)};}

 /** Ambientación decorativa exterior, determinista: macetas y plantas fuera de la huella, en esquinas y fachada principal.
  *  Devuelve posiciones en metros (mundo), nunca dentro del contorno. */
 function ambientacion(env,{margen=0.75}={}){
  // Junto a las dos fachadas que ve la cámara de tres cuartos (x máx. y z máx.) y en las esquinas, a ~0,75 m del muro:
  // macetas grandes flanqueando, plantas bajas entre ellas. Escalas: alturas de exterior creíbles (~0,8–1,4 m).
  const {x0,x1,z0,z1}=env,out=[];const add=(modelo,x,z,rot=0,escala=1)=>out.push({modelo,x:+x.toFixed(3),z:+z.toFixed(3),rot:+rot.toFixed(4),escala});
  const fila=(a,b,fijo,eje,n)=>{for(let i=0;i<n;i++){const v=lerp(a,b,(i+.5)/n),big=i%3===1;const [x,z]=eje==='x'?[v,fijo]:[fijo,v];add(big?'potted':'plant',x,z,i*1.3,big?2.4:2.0);}};
  fila(x0+.4,x1-.4,z1+margen,'x',Math.max(3,Math.round((x1-x0)/2.2)));
  fila(z0+.4,z1-.4,x1+margen,'z',Math.max(3,Math.round((z1-z0)/2.2)));
  add('potted',x1+margen*1.4,z1+margen*1.4,0.6,2.6);add('potted',x0-margen,z1+margen,0.2,2.3);add('potted',x1+margen,z0-margen,-0.5,2.3);
  return out;
 }
 const dentro=(p,env)=>p.x>env.x0&&p.x<env.x1&&p.z>env.z0&&p.z<env.z1;

 // ---------------------------------------------------------------- nada en chino para un cliente en ES/EN
 // Regla del propietario: en una sesión ES/EN nunca se entrega texto en chino. Los datos de ejemplo de RUBIK guardan nombres
 // en chino (el editor los traduce al mostrarlos); aquí se traducen igual o, si no hay traducción, se usa un nombre neutro.
 const CJK=/[\u2e80-\u2fdf\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
 const CONOCIDOS=Object.freeze({'三室两厅两卫':{es:'Vivienda de ejemplo de RUBIK',en:'RUBIK example home'}});
 function textoVisible(texto,lang='es'){
  const t=String(texto??'');if(lang==='zh'||!CJK.test(t))return t;
  // Regla común con CC2 (nm()/FloorPlanDisplayName): el DATO original nunca se reescribe; solo cambia lo que se muestra.
  //  1 · datos de ejemplo conocidos de RUBIK → su traducción;
  //  2 · en el editor, el embudo único del producto (nm) si existe y la sesión está en este idioma;
  //  3 · si no, el mismo marcador que nm: «Nombre sin traducir» / «Untranslated name». El nombre localizado AUTORIZADO lo
  //      escribe el profesional (título del proyecto en STUDIO) y entonces ya no es chino.
  const k=CONOCIDOS[t.trim()]?.[lang==='en'?'en':'es'];if(k)return k;
  const g=typeof globalThis!=='undefined'?globalThis:{};
  if(typeof g.nm==='function'&&typeof g.LANG==='string'&&g.LANG===lang){try{const v=g.nm(t);if(v&&!CJK.test(v))return v;}catch{}}
  return lang==='en'?'Untranslated name':'Nombre sin traducir';
 }
 const esEjemplo=t=>!!CONOCIDOS[String(t??'').trim()];
 /** Gate de cierre con las autoridades existentes (FloorPlanConstructionProject → model.planning y model.coverage).
  *  «completo» solo con plan válido y sin elementos representables sin tarea; si no, cierre PARCIAL honesto. No modifica nada. */
 function alcance(model){
  // Alcance REPRESENTADO: cuenta solo los elementos sin tarea que la Evolución dibuja (inventario, representable). Lo no
  // representable (p. ej. la cubierta, «no se dibuja») no se finge construido ni bloquea; se declara aparte.
  const plan=model?.planning?.status==='available',c=model?.coverage?.elements,els=model?.inventory?.elements||[];
  const repr=new Set(els.filter(e=>e.representable).map(e=>e.key??e.id)),lista=Array.isArray(c?.unscheduled)?c.unscheduled.map(x=>x?.id??x):null;
  const sin=lista?lista.filter(id=>repr.has(id)).length:null,fuera=lista?lista.filter(id=>!repr.has(id)):[];
  const completo=!!(plan&&c&&sin===0);
  return Object.freeze({estado:completo?'completo':'parcial',plan,sinPlanificar:sin,noRepresentadosSinTarea:Object.freeze(fuera),representables:c?.representable??null,conTarea:c?.scheduled??null});}
 const tieneChino=t=>CJK.test(String(t??''));
 // ---------------------------------------------------------------- textos (ES/EN/ZH)
 const T={
  es:{completada:'Simulación completada',aviso:'Evolución planificada · no certifica que la obra real esté terminada',generado:'Generado con RUBIK SOTA',decor:'Ambientación decorativa: no forma parte del proyecto ni de sus mediciones',saltar:'Ver controles',para:'Para {cliente}',parcial:'Simulación parcial',avisoParcial:'Existen {n} elementos sin planificar · no representa una obra terminada',avisoSinPlan:'Sin plan de obra válido · no representa una obra terminada',dibujo:'Del dibujo a la vivienda',avisoDibujo:'Visualización del proyecto · no representa una obra construida'},
  en:{completada:'Simulation complete',aviso:'Planned evolution · it does not certify that the real works are finished',generado:'Made with RUBIK SOTA',decor:'Decorative styling: not part of the project or its measurements',saltar:'Show controls',para:'For {cliente}',parcial:'Partial simulation',avisoParcial:'{n} elements are not planned · it does not represent finished works',avisoSinPlan:'No valid construction plan · it does not represent finished works',dibujo:'From drawing to home',avisoDibujo:'Project visualisation · it does not represent built works'},
  zh:{completada:'模拟完成',aviso:'计划中的施工演进 · 不证明实际工程已完工',generado:'由 RUBIK SOTA 生成',decor:'装饰性布置：不属于项目及其测量',saltar:'显示控制',para:'致 {cliente}',parcial:'部分模拟',avisoParcial:'有 {n} 个元素未纳入计划 · 不代表已完工',avisoSinPlan:'没有有效的施工计划 · 不代表已完工',dibujo:'从图纸到住宅',avisoDibujo:'项目可视化 · 不代表已建成'}};
 function textos(lang){if(!T[lang])throw new Error('Idioma sin textos: '+lang);return T[lang];}
 /** Firma: identidad de Mi estudio si existe; sin ella, solo el título del proyecto y la atribución. Nunca inventa un estudio.
  *  Campos por proyecto (contrato FloorPlanBrand ampliado, corte B): cliente (solo si el profesional lo autoriza), mensaje de
  *  cierre y estilo; la CTA es del estudio. Nunca se muestran datos de contacto personales (OP-05). */
 const ESTILOS=Object.freeze(['cine','editorial']);
 function firma({marca=null,proyecto='',lang='es',cobertura=null,contexto='obra'}={}){
  const t=textos(lang),present=!!(marca&&marca.present&&marca.name),h=present&&marca.hero||{};
  const cliente=present&&h.cliente&&h.clienteAutorizado===true?textoVisible(h.cliente,lang):null;
  return Object.freeze({estudio:present?textoVisible(marca.name,lang):null,logo:present&&marca.logo?String(marca.logo):null,lema:present&&marca.tagline?textoVisible(marca.tagline,lang):null,
   titulo:textoVisible(proyecto||'',lang),web:present&&marca.web?String(marca.web).replace(/^https?:\/\//,''):null,cta:present&&marca.cta?textoVisible(marca.cta,lang):null,
   cliente,para:cliente?t.para.replace('{cliente}',cliente):null,cierre:present&&h.cierre?textoVisible(h.cierre,lang):null,estilo:ESTILOS.includes(h.estilo)?h.estilo:'cine',
   // Sin cobertura declarada (p. ej. previsualización de STUDIO) se muestra el texto completo de ejemplo; con cobertura parcial, el honesto.
   ...(contexto==='dibujo'?{estado:'dibujo',completada:t.dibujo,aviso:t.avisoDibujo}:cobertura&&cobertura.estado!=='completo'?{estado:'parcial',completada:t.parcial,aviso:cobertura.plan?t.avisoParcial.replace('{n}',String(cobertura.sinPlanificar)):t.avisoSinPlan}
    :{estado:cobertura?'completo':'ejemplo',completada:t.completada,aviso:t.aviso}),atribucion:t.generado});
 }
 /** Aparición escalonada de los títulos de cierre: línea i (0..n-1) dentro de la fase de firma (0..1). */
 function escalon(firma,i,n){const a=i/(n+1),b=a+2/(n+1);return suave(Math.max(0,Math.min(1,(firma-a)/(b-a))));}
 return Object.freeze({VERSION,ESTILOS,DURACIONES,FASES,escalon,textoVisible,esEjemplo,tieneChino,alcance,secuencia,poseHero,mezclarPose,ambientacion,dentro,textos,firma,suave});
});

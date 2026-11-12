'use strict';
/* GOV-07 · sonda de recursos de la vista 3D de la Evolución, por ciclo. Distingue lo que Three CUENTA (renderer.info,
   que solo suma geometrías ya subidas a la GPU) de lo que de verdad VIVE:
   - GL real: llamadas createBuffer/deleteBuffer, createTexture/deleteTexture, createProgram/deleteProgram y VAOs del
     contexto WebGL (la verdad de la GPU, sin depender de los contadores de Three).
   - JS: cada geometría y material creados desde que se instala la sonda, con referencia débil; tras un GC forzado se
     sabe cuáles siguen vivos, cuáles se liberaron (dispose) y cuáles siguen vivos SIN estar en la escena (fuga).
   - Escena: mallas, líneas, contornos fantasma, contornos de selección, recursos ilustrativos.
   - Escuchadores (CDP DOMDebugger) en #gantt y window: callbacks duplicados.
   Solo lectura: envuelve métodos para contar, no cambia lo que hacen. Se instala en una página ya abierta. */
async function install(page){
  await page.evaluate(()=>{
    if(window.__gov07Probe)return;
    const f=window.__ft3dFidelity,sc=f.scene,r=sc.renderer,gl=r.getContext();
    const P=window.__gov07Probe={gl:{buffers:0,textures:0,programs:0,vaos:0,framebuffers:0,renderbuffers:0},geo:new Map(),mat:new Map(),
      geoCreated:0,geoDisposed:0,matCreated:0,matDisposed:0,loads:0,threeScene:null};
    const wrap=(o,name,fn)=>{const orig=o[name];if(!orig)return;o[name]=function(...a){const out=orig.apply(this,a);fn(out,a);return out;};};
    for(const [c,d,k] of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs'],
      ['createVertexArray','deleteVertexArray','vaos'],['createFramebuffer','deleteFramebuffer','framebuffers'],['createRenderbuffer','deleteRenderbuffer','renderbuffers']]){
      wrap(gl,c,o=>{if(o)P.gl[k]++;});wrap(gl,d,(_,a)=>{if(a[0])P.gl[k]--;});}
    // La escena de Three se observa en el render (la Evolución no la expone).
    const render0=r.render;r.render=function(s,c){P.threeScene=s;return render0.call(this,s,c);};
    // Prototipos a partir de un objeto real de la escena (BufferGeometry y Material de ESTE Three).
    P.ready=new Promise(res=>{const t=()=>{const s=P.threeScene;let m=null;s?.traverse(o=>{if(!m&&o.isMesh)m=o;});if(!m){requestAnimationFrame(t);return;}
      let G=Object.getPrototypeOf(m.geometry);while(G&&!Object.prototype.hasOwnProperty.call(G,'setAttribute'))G=Object.getPrototypeOf(G);
      let M=Object.getPrototypeOf([].concat(m.material)[0]);while(M&&!(Object.prototype.hasOwnProperty.call(M,'dispose')&&Object.prototype.hasOwnProperty.call(M,'setValues')))M=Object.getPrototypeOf(M);
      // Registro: toda geometría fija atributos al crearse; todo material pasa por setValues/clone o se usa en un render.
      const reg=(map,o,kind)=>{if(!map.has(o.id)){map.set(o.id,{ref:new WeakRef(o),disposed:false,type:o.type});P[kind+'Created']++;}};
      const sa=G.setAttribute;G.setAttribute=function(...a){reg(P.geo,this,'geo');return sa.apply(this,a);};
      const gd=G.dispose;G.dispose=function(){const e=P.geo.get(this.id);if(e&&!e.disposed){e.disposed=true;P.geoDisposed++;}return gd.call(this);};
      const md=M.dispose;M.dispose=function(){const e=P.mat.get(this.id);if(e&&!e.disposed){e.disposed=true;P.matDisposed++;}return md.call(this);};
      // Los materiales se registran al verse en la escena (cada ciclo) y al clonarse.
      const mc=M.clone;M.clone=function(){const c=mc.call(this);reg(P.mat,c,'mat');return c;};
      P.regMaterial=o=>reg(P.mat,o,'mat');res(true);};t();});
    const load0=sc.load;sc.load=function(...a){P.loads++;return load0.apply(this,a);};
  });
  await page.evaluate(()=>window.__gov07Probe.ready);
}
// Una medición. gc: función que fuerza la recolección (CDP). Después del GC, WeakRef dice qué sigue vivo de verdad.
async function measure(page,gc,label){
  // Registro de materiales vistos ahora en la escena (antes del GC, para no perder ninguno).
  await page.evaluate(()=>{const P=window.__gov07Probe;P.threeScene?.traverse(o=>{for(const m of [].concat(o.material||[]))P.regMaterial(m);});});
  await gc();
  return page.evaluate(label=>{
    const P=window.__gov07Probe,f=window.__ft3dFidelity,sc=f.scene,r=sc.renderer,s=P.threeScene;
    const inGeo=new Set(),inMat=new Set();let meshes=0,lines=0,ghostLines=0,marks=0,illustrative=0,objects=0;
    s.traverse(o=>{objects++;if(o.geometry)inGeo.add(o.geometry.id);for(const m of [].concat(o.material||[]))inMat.add(m.id);
      if(o.isMesh)meshes++;if(o.isLineSegments)lines++;if(o.userData?.illustrative)illustrative++;});
    // Contornos fantasma: LineSegments bajo grupos invisibles de «sin tarea»; contornos de selección: hijos de marks.
    s.traverse(o=>{if(o.isLineSegments&&o.parent&&o.parent.parent&&o.parent.parent.name&&!o.parent.parent.userData?.illustrative&&o.material?.opacity===.75)ghostLines++;
      if(o.isLineSegments&&o.renderOrder===10)marks++;});
    const leakGeo=[],leakMat=[];let aliveGeo=0,aliveMat=0,deadUndisposedGeo=0;
    for(const [id,e] of P.geo){const o=e.ref.deref();if(!o){if(!e.disposed)deadUndisposedGeo++;continue;}aliveGeo++;if(!e.disposed&&!inGeo.has(id))leakGeo.push(e.type);}
    for(const [id,e] of P.mat){const o=e.ref.deref();if(!o)continue;aliveMat++;if(!e.disposed&&!inMat.has(id))leakMat.push(e.type);}
    const count=a=>Object.entries(a.reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{})).sort((x,y)=>y[1]-x[1]).slice(0,6);
    return {label,pos:+f.pos.toFixed(2),three:{...r.info.memory,programs:r.info.programs.length,calls:r.info.render.calls},gl:{...P.gl},
      geometries:{created:P.geoCreated,disposed:P.geoDisposed,alive:aliveGeo,inScene:inGeo.size,aliveOffScene:leakGeo.length,offSceneTypes:count(leakGeo),gcUndisposed:deadUndisposedGeo},
      materials:{created:P.matCreated,disposed:P.matDisposed,alive:aliveMat,inScene:inMat.size,aliveOffScene:leakMat.length,offSceneTypes:count(leakMat)},
      scene:{objects,meshes,lines,ghostLines,marks,illustrative,elements:sc.objectCount,visiblePieces:sc.visiblePieces},
      renderer:{ratio:r.getPixelRatio(),shadows:r.shadowMap.enabled,lost:r.getContext().isContextLost(),canvas:[r.domElement.width,r.domElement.height],css:[r.domElement.clientWidth,r.domElement.clientHeight],frame:r.info.render.frame,hidden:document.hidden},camera:{position:f.pose.position.map(v=>+v.toFixed(2)),target:f.pose.target.map(v=>+v.toFixed(2)),offset:f.pose.offset},loads:P.loads,heapMB:+(performance.memory.usedJSHeapSize/1e6).toFixed(2)};
  },label);
}
// Escuchadores reales registrados (CDP), por tipo, en un selector o en window.
async function listeners(cdp,page,expr){
  const {result}=await cdp.send('Runtime.evaluate',{expression:expr});if(!result.objectId)return null;
  const {listeners}=await cdp.send('DOMDebugger.getEventListeners',{objectId:result.objectId});
  const by={};for(const l of listeners)by[l.type]=(by[l.type]||0)+1;return by;
}
module.exports={install,measure,listeners};

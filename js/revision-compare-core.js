/* UX-07 · Comparación antes/después de dos revisiones de un proyecto. Núcleo puro: no guarda, no publica, no mide nada
   que el proyecto no diga. Entrada: dos FloorPlanProjectV1 (validados por FloorPlanCore). Salida: las diferencias por
   identificador estable, cada una con su evidencia (el dato del proyecto), los materiales cambiados SOLO cuando el
   proyecto los declara, lo que el dibujo muestra sin que sea dato (ilustrativo), métricas con la autoridad existente
   (FloorPlanVariants.metrics) y un encuadre común (FloorPlanVariants.comparisonFrame: mismo marco y misma escala).

   Límites honestos, siempre en la salida:
   - la comparación es por identificador: un elemento redibujado con otro ID aparece como quitado + añadido;
   - si la escala no está confirmada, las medidas son orientativas;
   - dos proyectos distintos solo se comparan si la relación se declara (variante de la biblioteca o declaración
     expresa del profesional); con el mismo ID de proyecto es la misma obra. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./project-core.js'):root.FloorPlanCore,node?require('./project-variants.js'):root.FloorPlanVariants);
  if(node)module.exports=api;else root.FloorPlanRevisionCompare=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Variants){
  'use strict';
  if(!Core||!Variants)throw Error('FloorPlanRevisionCompare requiere FloorPlanCore y FloorPlanVariants.');
  const SCHEMA='rubik-sota.revision-comparison',VERSION='1.0.0';
  const RELATIONS=['same-project','library-variant','declared'];
  const ENTITIES=['wall','opening','room','object'];
  const fail=(code,message)=>{const e=new Error(message||code);e.code=code;throw e;};
  const byId=list=>new Map((list||[]).map(x=>[x.id,x]));
  const area=poly=>{let s=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];s+=a.x*b.y-b.x*a.y;}return Math.abs(s)/2/1e6;};
  const r2=x=>Math.round(x*100)/100;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const STATUS_ES={existing:'existente',demolished:'a demoler',new:'nuevo'};
  const KIND_ES={door:'puerta','sliding-door':'puerta corredera',window:'ventana',opening:'hueco'};
  const ENTITY_ES={wall:'Muro',opening:'Hueco',room:'Estancia',object:'Objeto',material:'Material'};

  // Campos que se comparan por entidad (los de geometría y los declarados por la persona). Lo demás no se interpreta.
  const FIELDS={
    wall:[['start','mm'],['end','mm'],['thicknessMm','mm'],['heightMm','mm'],['structure'],['status'],['surfaceMaterialId','material']],
    opening:[['wallId'],['kind'],['offsetMm','mm'],['widthMm','mm'],['heightMm','mm'],['sillHeightMm','mm'],['swing'],['isEntrance']],
    room:[['name'],['family'],['polygon','mm'],['floorMaterialId','material'],['countsTowardArea']],
    object:[['name'],['catalogId'],['position','mm'],['rotationDeg','deg'],['size','mm'],['roomId']],
  };
  function nameOf(kind,x){if(!x)return null;if(kind==='room')return x.name||x.id;if(kind==='object')return x.name||x.catalogId||x.id;if(kind==='opening')return KIND_ES[x.kind]||x.kind;return x.id;}
  function matView(project,id){if(!id)return null;const m=(project.materials||[]).find(x=>x.id===id);return m?{id,name:m.name,color:m.appearance?.color||null,category:m.category}:{id,name:null,color:null,category:null,missing:true};}

  function summarize(kind,change,x,fields){
    const label=`${ENTITY_ES[kind]} ${nameOf(kind,x)}`;
    if(change==='added')return kind==='wall'&&x.status==='new'?`${label}: muro nuevo`:`${label}: añadido`;
    if(change==='removed')return `${label}: quitado`;
    const parts=fields.map(f=>{
      if(f.field==='status')return `estado ${STATUS_ES[f.before]||f.before||'sin indicar'} → ${STATUS_ES[f.after]||f.after||'sin indicar'}`;
      if(f.field==='polygon')return `contorno cambiado (${f.delta>=0?'+':''}${f.delta} m²)`;
      if(f.field==='floorMaterialId'||f.field==='surfaceMaterialId')return 'acabado cambiado';
      if(f.unit==='mm'&&typeof f.before==='number')return `${f.field} ${f.before} → ${f.after} mm`;
      if(f.field==='position')return `movido ${f.distanceMm} mm`;
      if(f.field==='start'||f.field==='end')return `${f.field==='start'?'inicio':'final'} movido ${f.distanceMm} mm`;
      return `${f.field} cambiado`;});
    return `${label}: ${parts.join(', ')}`;
  }
  function diffEntity(kind,a,b){
    const out=[];
    for(const [field,unit] of FIELDS[kind]){
      if(same(a[field],b[field]))continue;
      const f={field,before:a[field]===undefined?null:Core.clone(a[field]),after:b[field]===undefined?null:Core.clone(b[field])};if(unit)f.unit=unit;
      if((field==='start'||field==='end'||field==='position')&&a[field]&&b[field])f.distanceMm=Math.round(Math.hypot(b[field].x-a[field].x,b[field].y-a[field].y));
      if(field==='polygon')f.delta=r2(area(b.polygon)-area(a.polygon)),f.areaBeforeM2=r2(area(a.polygon)),f.areaAfterM2=r2(area(b.polygon));
      out.push(f);
    }
    return out;
  }

  /* before/after: FloorPlanProjectV1. relation: 'same-project' (mismo id; se deduce), 'library-variant' (enlace local de
     variante) o 'declared' (el profesional declara que son dos revisiones de la misma obra). */
  function compare(before,after,{relation=null,beforeLabel='Antes',afterLabel='Después'}={}){
    Core.validate(before);Core.validate(after);
    const rel=before.id===after.id?'same-project':relation;
    if(!rel)fail('relation-required','Son dos proyectos distintos: indica si uno es variante del otro o declara que son dos revisiones de la misma obra.');
    if(!RELATIONS.includes(rel))fail('relation-invalid','Relación no válida.');
    if(rel==='same-project'&&before.id!==after.id)fail('relation-invalid','«Mismo proyecto» exige el mismo identificador de proyecto.');
    const changes=[];
    for(const kind of ENTITIES){
      const list=kind==='wall'?'walls':kind==='opening'?'openings':kind==='room'?'rooms':'objects';
      const A=byId(before[list]),B=byId(after[list]);
      for(const [id,a] of A){const b=B.get(id);
        if(!b){changes.push({entity:kind,entityId:id,change:'removed',fields:[],summary:summarize(kind,'removed',a,[])});continue;}
        const fields=diffEntity(kind,a,b);if(fields.length)changes.push({entity:kind,entityId:id,change:'modified',fields,summary:summarize(kind,'modified',b,fields)});}
      for(const [id,b] of B)if(!A.has(id))changes.push({entity:kind,entityId:id,change:'added',fields:[],summary:summarize(kind,'added',b,[])});
    }
    // Definición de materiales con el mismo ID pero otro nombre o aspecto: cambia todo lo que lo usa.
    const MA=byId(before.materials),MB=byId(after.materials);
    for(const [id,a] of MA){const b=MB.get(id);if(b&&!same(a,b))changes.push({entity:'material',entityId:id,change:'modified',fields:[{field:'definition',before:Core.clone(a),after:Core.clone(b)}],summary:`Material ${b.name}: definición cambiada (mismo identificador)`});}
    for(const c of changes){c.nature='real';c.evidence='project-data';}

    // Materiales: solo los que el proyecto declara (suelo de cada estancia, acabado de cada muro). Sin declaración no hay
    // material: el dibujo usa un color por defecto y eso se dice como ilustrativo.
    const materials=[];
    for(const c of changes){
      for(const f of c.fields||[])if(f.unit==='material'){const x=(c.entity==='room'?after.rooms:after.walls).find(e=>e.id===c.entityId);
        materials.push({scope:c.entity,entityId:c.entityId,entityName:nameOf(c.entity,x),before:matView(before,f.before),after:matView(after,f.after),evidence:'project-data'});}
      if(c.entity==='room'&&c.change!=='modified'){const p=c.change==='added'?after:before,x=byId(p.rooms).get(c.entityId);
        materials.push({scope:'room',entityId:c.entityId,entityName:nameOf('room',x),before:c.change==='removed'?matView(before,x.floorMaterialId):null,after:c.change==='added'?matView(after,x.floorMaterialId):null,evidence:'project-data'});}
    }
    const illustrative=[];
    const noFinish=p=>p.walls.filter(w=>!w.surfaceMaterialId&&w.status!=='demolished').length;
    if(noFinish(before)||noFinish(after))illustrative.push({what:'Color de los muros sin acabado declarado',why:`El proyecto no indica acabado en ${noFinish(after)} muro(s) de «${afterLabel}» y ${noFinish(before)} de «${beforeLabel}»: se dibujan con un gris por defecto, no con un material.`});
    illustrative.push({what:'Colores de resaltado (verde, rojo, ámbar)',why:'Son anotaciones de la comparación, no materiales ni acabados.'});
    if((after.objects||[]).length||(before.objects||[]).length)illustrative.push({what:'Muebles',why:'Se dibuja su huella en planta (posición, giro y tamaño reales del proyecto); su aspecto no forma parte de la comparación.'});
    const missing=materials.filter(m=>m.before?.missing||m.after?.missing);
    if(missing.length)illustrative.push({what:'Material citado sin definición',why:`${missing.length} acabado(s) citan un material que no está en la tabla del proyecto: se muestra el identificador, sin color.`});

    const metric=p=>{const m=Variants.metrics(p);return {netAreaM2:r2(m.netAreaM2),walls:p.walls.length,openings:p.openings.length,rooms:p.rooms.length,objects:m.objects,scaleConfidence:p.scale?.confidence||'unknown'};};
    const mb=metric(before),ma=metric(after);
    const delta={};for(const k of ['netAreaM2','walls','openings','rooms','objects'])delta[k]=r2(ma[k]-mb[k]);
    const frame=Variants.comparisonFrame([before,after]);
    const limits=['Comparación por identificador: un elemento redibujado con otro identificador aparece como quitado y añadido.'];
    if(mb.scaleConfidence!=='real'||ma.scaleConfidence!=='real')limits.push('Escala no confirmada en alguna revisión: las medidas son orientativas.');
    if(rel==='declared')limits.push('Los dos proyectos tienen identificadores distintos: la relación entre ellos la declara el profesional, no RUBIK.');
    const count=c=>changes.filter(x=>x.change===c).length;
    return {schema:SCHEMA,version:VERSION,relation:rel,
      before:{projectId:before.id,name:before.name,updatedAt:before.updatedAt,label:beforeLabel},
      after:{projectId:after.id,name:after.name,updatedAt:after.updatedAt,label:afterLabel},
      perspective:{kind:'plan-2d',sharedFrame:true,viewBox:frame.viewBox,statement:'Misma planta, mismo encuadre y misma escala para las dos revisiones (marco común).'},
      scenes:frame.scenes,changes,materials,illustrative,metrics:{before:mb,after:ma,delta},
      counts:{added:count('added'),removed:count('removed'),modified:count('modified'),total:changes.length},identical:changes.length===0,limits};
  }

  /* Planta en SVG (texto), la misma para el laboratorio y para el dossier. side: 'before' | 'after'. Las estancias se
     rellenan con el color de SU material declarado; los cambios se resaltan como anotación. */
  function openingPoly(w,o){if(!w)return null;const dx=w.end.x-w.start.x,dy=w.end.y-w.start.y,L=Math.hypot(dx,dy);if(!L)return null;
    const ux=dx/L,uy=dy/L,nx=-uy*w.thicknessMm/2,ny=ux*w.thicknessMm/2,a={x:w.start.x+ux*o.offsetMm,y:w.start.y+uy*o.offsetMm},b={x:a.x+ux*o.widthMm,y:a.y+uy*o.widthMm};
    return [[a.x+nx,a.y+ny],[b.x+nx,b.y+ny],[b.x-nx,b.y-ny],[a.x-nx,a.y-ny]];}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function planSvg(comparison,side,project,{title}={}){
    const scene=comparison.scenes[side==='before'?0:1],[x,y,w,h]=comparison.perspective.viewBox,mats=byId(project.materials),rooms=byId(project.rooms),walls=byId(project.walls);
    const mark=new Map();for(const c of comparison.changes){if(c.entity==='material')continue;
      // Un muro que pasa a «a demoler» se marca como quitado (rojo discontinuo) en «después», no como un cambio cualquiera.
      const demolish=c.entity==='wall'&&c.change==='modified'&&c.fields.some(f=>f.field==='status'&&f.after==='demolished');
      const tag=demolish&&side==='after'?'del':c.change==='modified'?'mod':c.change==='added'?(side==='after'?'add':null):(side==='before'?'del':null);if(tag)mark.set(c.entity+':'+c.entityId,tag);}
    const d=poly=>poly.map((p,i)=>`${i?'L':'M'}${Math.round(p[0])} ${Math.round(p[1])}`).join(' ')+' Z';
    const sw=Math.max(w,h)/400;
    const parts=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${esc(title||(side==='before'?'Planta antes':'Planta después'))}" data-side="${side}">`,
      `<style>.r{stroke:#9b978f;stroke-width:${sw}}.w{fill:#3a3d40}.w.st-demolished{fill:#fff;stroke:#b3261e;stroke-width:${sw*1.5};stroke-dasharray:${sw*6} ${sw*4}}.w.st-new{fill:#1f6f5c}.d{fill:#fff;stroke:#3a3d40;stroke-width:${sw}}.k-window{fill:#d8ecf3}.o{fill:#fff;fill-opacity:.65;stroke:#55595d;stroke-width:${sw}}.add{stroke:#1f8a4c!important;stroke-width:${sw*4}!important}.del{stroke:#b3261e!important;stroke-width:${sw*4}!important;stroke-dasharray:${sw*8} ${sw*5}}.mod{stroke:#c77d0a!important;stroke-width:${sw*4}!important}</style>`];
    for(const r of scene.rooms){const m=mats.get(rooms.get(r.id)?.floorMaterialId);parts.push(`<path class="r${mark.has('room:'+r.id)?' '+mark.get('room:'+r.id):''}" fill="${esc(m?.appearance?.color||'#f1efe9')}" d="${d(r.poly)}" data-id="${esc(r.id)}"/>`);}
    for(const wl of scene.walls){const st=walls.get(wl.id)?.status;parts.push(`<path class="w${st?' st-'+st:''}${mark.has('wall:'+wl.id)?' '+mark.get('wall:'+wl.id):''}" d="${d(wl.poly)}" data-id="${esc(wl.id)}"/>`);}
    // Huecos (puertas, ventanas, pasos) calculados desde su muro: la geometría no da identificador a las ventanas.
    for(const o of project.openings){const poly=openingPoly(walls.get(o.wallId),o);if(poly)parts.push(`<path class="d k-${esc(o.kind)}${mark.has('opening:'+o.id)?' '+mark.get('opening:'+o.id):''}" d="${d(poly)}" data-id="${esc(o.id)}"/>`);}
    for(const o of scene.objects)parts.push(`<path class="o${mark.has('object:'+o.id)?' '+mark.get('object:'+o.id):''}" d="${d(o.poly)}" data-id="${esc(o.id)}"/>`);
    // Lo quitado solo existe en «antes» (rojo discontinuo) y lo añadido solo en «después» (verde): cada lado dibuja sus datos.
    parts.push('</svg>');return parts.join('');
  }
  return Object.freeze({SCHEMA,VERSION,RELATIONS,compare,planSvg,area});
});

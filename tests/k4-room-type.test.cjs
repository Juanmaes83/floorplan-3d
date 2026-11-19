'use strict';
/* K4 · UX-24 + UX-26 · prueba PURA de la heurística única de tipo de estancia (js/project-core.js) y de sus dos
   consumidores (NAV3D y Dibujo vivo). Se comprueba contra las dos heurísticas ANTERIORES, copiadas tal cual de
   master@02712b51 (js/nav3d-core.js:13 y js/presentation-living-drawing-core.js:28): mismo resultado salvo las
   ampliaciones declaradas aquí, una a una. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Core=require('../js/project-core.js'),Nav=require('../js/nav3d-core.js'),Living=require('../js/presentation-living-drawing-core.js'),reference=require('../js/reference-project.js');
const ROOT=path.resolve(__dirname,'..');

// ── Heurísticas anteriores (referencia histórica, NO código vivo) ───────────────────────────────────────────────────
const OLD_NAV=[[/sal[oó]n|estar|living|lounge/i,'living'],[/comedor|dining/i,'dining'],[/cocina|kitchen/i,'kitchen'],[/dormitorio|habitaci[oó]n|bedroom/i,'bedroom'],
  [/ba[ñn]o|bath/i,'bathroom'],[/aseo|toilet|wc/i,'toilet'],[/despacho|estudio|office/i,'office'],[/pasillo|distribuidor|recibidor|hall/i,'hallway'],
  [/lavadero|laundry/i,'laundry'],[/trastero|almac[eé]n|storage/i,'storage'],[/terraza|terrace/i,'terrace'],[/balc[oó]n|mirador|balcony/i,'balcony']];
const oldNavHint=(family,name)=>family&&family!=='unspecified'?family:(OLD_NAV.find(([re])=>re.test(name||''))||[,'unspecified'])[1];
const OLD_LIV=[[/sal[oó]n|estar|living|lounge|客厅|起居/i,'living'],[/comedor|dining|餐厅/i,'dining'],[/cocina|kitchen|厨房/i,'kitchen'],
  [/dormitorio|habitaci[oó]n|bedroom|卧|房$/i,'bedroom'],[/ba[nñ]o|aseo|bath|卫/i,'bathroom'],[/lavader|laundry|洗衣/i,'laundry'],[/terraza|balc[oó]n|terrace|balcony|阳台/i,'terrace']];
const OLD_FAMILY={living:'living',dining:'dining',kitchen:'kitchen',bedroom:'bedroom',bathroom:'bathroom',toilet:'bathroom',laundry:'laundry',terrace:'terrace',balcony:'terrace'};
function oldLivClassify(room,objects){
  if(OLD_FAMILY[room?.family])return OLD_FAMILY[room.family];
  const t=new Set((objects||[]).map(o=>o.type));
  if(t.has('counter')||t.has('stove')||t.has('ksink'))return 'kitchen';
  if(t.has('toilet')||t.has('shower')||t.has('bathtub'))return 'bathroom';
  if(t.has('bed'))return 'bedroom';
  if(t.has('sofa'))return 'living';
  if(t.has('table')&&[...(objects||[])].filter(o=>o.type==='chair').length>=2)return 'dining';
  if(t.has('washer'))return 'laundry';
  for(const [re,c] of OLD_LIV)if(re.test(room?.name||''))return c;
  return 'other';
}

// Etiquetas que el propio editor muestra (index.html, ROOM_FAMILY_LABELS): se leen del archivo, no se copian.
const LABELS=(()=>{const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),m=/const ROOM_FAMILY_LABELS=(\{[^;]+\});/.exec(src);return Function('return '+m[1])();})();
const CORPUS=['Salón','Salón comedor','Sala de estar','Living','Lounge','Comedor','Cocina','Cocina-comedor','Cocina office','Dormitorio','Dormitorio 2','Dormitorio principal','Habitación','Habitacion','Bedroom','Master bedroom',
  'Baño','Bano','Baño del dormitorio','Bathroom','Aseo','Toilet','WC','Despacho','Estudio','Office','Pasillo','Distribuidor','Recibidor','Hall','Hallway','Lavadero','Lavandería','Laundry','Trastero','Almacén','Storage',
  'Terraza','Terrace','Balcón','Balcon','Mirador','Balcony','Garaje','Garage','Cuarto técnico','Utility room','Vestidor','','Sala','Zona','Otra estancia','Despacho con terraza','Pasillo comedor',
  '客厅','起居室','餐厅','厨房','主卧室','卧室','小孩房','子女房','书房','主卫浴','卫生间','浴室','洗衣房','洗衣阳台','阳台','休闲阳台','露台','走廊','过道','储藏室','车库','设备间','主卧飘窗','子女房飘窗'];
for(const l of Object.values(LABELS))for(const s of l)if(!CORPUS.includes(s))CORPUS.push(s);

// Ampliaciones declaradas: nombres que antes no se reconocían (o se reconocían mal) y ahora sí. Cualquier otra
// diferencia hace fallar la prueba.
const NAV_EXPECTED={'客厅':'living','起居室':'living','餐厅':'dining','厨房':'kitchen','主卧室':'bedroom','卧室':'bedroom','小孩房':'bedroom','子女房':'bedroom','书房':'office','主卫浴':'toilet','卫生间':'toilet','浴室':'bathroom',
  '洗衣房':'laundry','洗衣阳台':'laundry','阳台':'balcony','休闲阳台':'balcony','露台':'terrace','走廊':'hallway','储藏室':'storage','车库':'garage','设备间':'utility','主卧飘窗':'bedroom',
  'Garaje':'garage','Garage':'garage','Cuarto técnico':'utility','Utility room':'utility','Lavandería':'laundry'};
const LIV_EXPECTED={'洗衣房':'laundry','WC':'bathroom','Toilet':'bathroom','Mirador':'terrace','Lavandería':'laundry','浴室':'bathroom','露台':'terrace'};

test('una sola heurística: NAV3D y el Dibujo vivo ya no tienen tablas propias y leen project-core',()=>{
  const nav=fs.readFileSync(path.join(ROOT,'js/nav3d-core.js'),'utf8'),liv=fs.readFileSync(path.join(ROOT,'js/presentation-living-drawing-core.js'),'utf8');
  for(const [f,src] of [['nav3d-core',nav],['living-drawing-core',liv]]){
    assert.doesNotMatch(src,/sal\[oó\]n|dormitorio\|habitaci/,f+': sin tabla de nombres propia');
    assert.match(src,/require\('\.\/project-core\.js'\)/,f+': usa project-core en Node');assert.match(src,/root\.FloorPlanCore/,f+': y en el navegador');}
  assert.doesNotMatch(liv,/t\.has\('counter'\)/,'el Dibujo vivo tampoco repite las reglas de contenido');
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),at=s=>html.indexOf(s);
  assert.ok(at('js/project-core.js')<at('js/presentation-living-drawing-core.js')&&at('js/project-core.js')<at('js/nav3d-core.js'),'project-core se carga antes que sus dos consumidores');
});

test('toda etiqueta del editor (es/en/zh) vuelve a su propio tipo',()=>{
  for(const [family,labels] of Object.entries(LABELS)){if(family==='unspecified'||family==='other')continue;
    for(const l of labels)assert.equal(Core.roomFamilyFromName(l),family,`«${l}» → ${family}`);}
  assert.equal(Core.roomFamilyFromName('Otra estancia'),null);assert.equal(Core.roomFamilyFromName(''),null);assert.equal(Core.roomFamilyFromName(undefined),null);
  for(const [,f] of Core.ROOM_NAME_HINTS)assert.ok(Core.roomFamilies.includes(f),f+' es un tipo del contrato');
});

test('NAV3D: mismo resultado que la heurística anterior salvo las ampliaciones declaradas',()=>{
  const diff={};
  for(const name of CORPUS)for(const family of [undefined,'unspecified','bedroom']){const a=oldNavHint(family,name),b=Nav.familyHint(family,name);
    if(a!==b){assert.ok(family===undefined||family==='unspecified','un tipo declarado manda siempre: '+name);diff[name]=b;}}
  assert.deepEqual(diff,NAV_EXPECTED);
  for(const [name,f] of Object.entries(NAV_EXPECTED))assert.equal(oldNavHint(undefined,name),'unspecified',`«${name}» antes no se reconocía (${f})`);
});

test('Dibujo vivo: mismo resultado que la heurística anterior, también con contenido y en el proyecto de ejemplo',()=>{
  const diff={};
  for(const name of CORPUS)for(const family of [undefined,'unspecified','office','toilet','balcony']){const room={id:'x',name,family,poly:[[0,0],[1000,0],[1000,1000],[0,1000]]};
    const a=oldLivClassify(room,[]),b=Living.classify(room,[]);if(a!==b)diff[name]=b;}
  assert.deepEqual(diff,LIV_EXPECTED);
  for(const [name] of Object.entries(LIV_EXPECTED))assert.equal(oldLivClassify({name},[]),name==='洗衣房'?'bedroom':'other','antes: '+name);
  const sets=[[{type:'counter'}],[{type:'toilet'}],[{type:'bed'},{type:'sofa'}],[{type:'sofa'}],[{type:'table'},{type:'chair'},{type:'chair'}],[{type:'table'},{type:'chair'}],[{type:'washer'}],[{type:'plant'}],[]];
  for(const objs of sets)for(const name of ['Dormitorio','Salón','','Cocina'])assert.equal(Living.classify({id:'x',name,poly:[[0,0],[1,0],[1,1]]},objs),oldLivClassify({name},objs),name+' '+JSON.stringify(objs));
  const p=Core.clone(Core.initial());
  for(const r of Core.geometry(p).rooms){const objs=Living.objectsIn(p,r);assert.equal(Living.classify(r,objs),oldLivClassify(r,objs),r.id);}
});

test('sugerencia (UX-24): contenido antes que nombre, con el objeto que la explica; nunca escribe en el proyecto',()=>{
  const p=Core.clone(Core.initial()),before=JSON.stringify(p);
  const master=p.rooms.find(r=>r.id==='rom_master'),s=Core.suggestRoomFamily(master,Core.roomObjects(p,master));
  assert.equal(s.family,'bedroom');assert.equal(s.source,'contents');assert.equal(s.object.type,'bed');
  assert.deepEqual(Core.suggestRoomFamily({name:'Cocina'},[]),{family:'kitchen',source:'name'});
  assert.equal(Core.suggestRoomFamily({name:'Vestidor'},[]),null,'sin pistas no se inventa nada');
  assert.equal(Core.suggestRoomFamily({name:'Despacho'},[],{among:['bedroom']}),null,'among limita los tipos que entiende quien pregunta');
  assert.equal(JSON.stringify(p),before);
  // roomObjects: por roomId cuando lo lleva y si no por su centro; mismo criterio que el objectsIn anterior.
  const r={id:'rom_x',polygon:[{x:0,y:0},{x:1000,y:0},{x:1000,y:1000},{x:0,y:1000}]};
  const objs=Core.roomObjects({objects:[{id:'a',position:{x:500,y:500}},{id:'b',position:{x:5000,y:5000}},{id:'c',roomId:'rom_x',position:{x:9e3,y:9e3}},{id:'d',roomId:'otra',position:{x:500,y:500}},null,{id:'e'}]},r);
  assert.deepEqual(objs.map(o=>o.id),['a','c']);
});

test('intercambiar usos (UX-26): solo nombre y tipo, campos ausentes conservados, todo lo demás intacto, reversible',()=>{
  const p=Core.clone(Core.initial());
  p.rooms.find(r=>r.id==='rom_kid').family='office';p.schemaVersion='1.6.0';Core.validate(p);
  const strip=q=>{const c=Core.clone(q);for(const r of c.rooms){delete r.name;delete r.family;}return JSON.stringify(c);};
  const a=p.rooms.find(r=>r.id==='rom_master'),b=p.rooms.find(r=>r.id==='rom_kid'),before=JSON.stringify(p);
  const n=Core.swapRoomUses(p,'rom_master','rom_kid'),na=n.rooms.find(r=>r.id==='rom_master'),nb=n.rooms.find(r=>r.id==='rom_kid');
  assert.equal(na.name,b.name);assert.equal(na.family,'office');assert.equal(nb.name,a.name);assert.equal('family' in nb,false,'un tipo ausente sigue ausente');
  assert.equal(strip(n),strip(p),'geometría, acabados, muebles, aberturas y techos sin cambios');
  assert.equal(n.schemaVersion,p.schemaVersion);assert.equal(JSON.stringify(p),before,'no muta la entrada');
  assert.equal(JSON.stringify(Core.swapRoomUses(n,'rom_kid','rom_master')),before,'dos intercambios devuelven el original');
  const labels=Object.fromEntries(Object.entries(LABELS).map(([k,v])=>[k,v[0]]));
  assert.equal(Core.roomName(na,labels),Core.roomName(b,labels),'cada estancia se muestra como la otra antes');
  assert.throws(()=>Core.swapRoomUses(p,'rom_master','rom_master'),/dos estancias distintas/);
  assert.throws(()=>Core.swapRoomUses(p,'rom_master','rom_nada'),/no encontrada/);
  assert.throws(()=>Core.swapRoomUses(p,'',undefined),/dos estancias distintas/);
});

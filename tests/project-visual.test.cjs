// Project-First A1: the visual read model is derived from Core.geometry and the existing surface metric, never
// invents outputs and never mutates the project.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Surfaces=require('../js/surface-core.js'),Visual=require('../js/project-visual-core.js');
const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.values(o).forEach(deepFreeze);}return o;};
const parse=points=>points.split(' ').map(p=>p.split(',').map(Number));
const inputs=project=>({project,geometry:Core.geometry(project),metrics:Surfaces.home(project)});

test('project preview derives from the current project geometry',()=>{
 const p=Core.initial(),g=Core.geometry(p),plan=Visual.plan(g);
 assert.equal(plan.status,'available');
 assert.equal(plan.rooms.length,g.rooms.length);assert.equal(plan.walls.length,g.walls.length);
 // Same coordinates as the model (rounded to 0.1 mm), inside the viewBox.
 const [x,y,w,h]=plan.viewBox;
 for(const r of plan.rooms){const src=g.rooms.find(s=>s.id===r.id);parse(r.points).forEach((q,i)=>{assert.ok(Math.abs(q[0]-src.poly[i][0])<=.05&&Math.abs(q[1]-src.poly[i][1])<=.05);assert.ok(q[0]>=x&&q[0]<=x+w&&q[1]>=y&&q[1]<=y+h);});}
 assert.deepEqual(plan.rooms.filter(r=>!r.counted).map(r=>r.id),g.rooms.filter(r=>r.counted===false).map(r=>r.id));
 // A change in the project is reflected: removing a room removes it from the preview.
 const q=Core.clone(p);q.rooms.pop();assert.equal(Visual.plan(Core.geometry(q)).rooms.length,plan.rooms.length-1);
 // Demolished walls stay flagged, as the 2D plan draws them.
 const d=Core.clone(p);d.walls[0].status='demolished';assert.ok(Visual.plan(Core.geometry(d)).walls.some(w=>w.demolished));
 assert.deepEqual(Visual.plan({rooms:[],walls:[]}),{status:'unavailable',reason:'no-geometry'});
});

test('axonometric uses the declared wall heights and skips demolished walls',()=>{
 const p=Core.initial(),g=Core.geometry(p),axo=Visual.axonometric(g);
 assert.equal(axo.status,'available');
 assert.equal(axo.maxHeightMm,Math.max(...p.walls.filter(w=>w.status!=='demolished').map(w=>w.heightMm)));
 const tops=axo.faces.filter(f=>f.kind==='wall-top').length;assert.equal(tops,g.walls.filter(w=>w.status!=='demolished').length);
 assert.equal(axo.faces.filter(f=>f.kind==='floor').length,g.rooms.length);
 const taller=Core.clone(p);taller.walls.forEach(w=>w.heightMm+=500);assert.equal(Visual.axonometric(Core.geometry(taller)).maxHeightMm,axo.maxHeightMm+500);
 assert.equal(Visual.axonometric({rooms:g.rooms,walls:[]}).status,'unavailable');
});

test('surface preview reflects the real metric and its status',()=>{
 const p=Core.initial(),i=inputs(p),s=Visual.summary(i);
 assert.equal(s.areaM2,i.metrics.areaM2);assert.equal(s.status,i.metrics.status);assert.equal(s.complete,i.metrics.complete);
 assert.equal(s.roomsCounted,i.metrics.levels[0].rooms.filter(r=>r.counted).length);assert.equal(s.roomsExcluded,i.metrics.excluded.length);
 assert.equal(s.spacesOnLevel,i.geometry.rooms.length);assert.equal(s.name,p.name);assert.equal(s.level,null);
 const real=Core.clone(p);real.scale={...real.scale,confidence:'real'};assert.equal(Visual.summary(inputs(real)).status,'measured');
 const level=Visual.summary({...i,levelContext:{activeLevelId:'b',levels:[{id:'b',name:'Planta primera',order:1},{id:'a',name:'Planta baja',order:0}]}});
 assert.deepEqual(level.level,{name:'Planta primera',index:2,count:2});
});

test('delivery preview does not invent unavailable outputs',()=>{
 const s=Visual.summary(inputs(Core.initial()));
 const base=Visual.deliveryStates({summary:s});
 assert.equal(base.states.budget,'unavailable');assert.equal(base.states.images,'generate','no saved images are shown as ready');
 assert.equal(base.states.sheet,'missing','sheet is ready only when its real preview was produced');assert.equal(base.states.identity,'missing');
 const ready=Visual.deliveryStates({summary:{...s,brand:{name:'Estudio'}},sheet:{ok:true},review:{pending:2,written:0}});
 assert.equal(ready.states.sheet,'ready');assert.equal(ready.states.identity,'ready');assert.equal(ready.states.review,'review');assert.equal(ready.states.budget,'unavailable');
 assert.equal(Visual.deliveryStates({summary:s,building:'pending'}).states.presentation,'review');
 assert.equal(Visual.deliveryStates({summary:{...s,areaM2:null}}).states['surface-sheet'],'missing');
});

test('brand preview reflects the selected profile only',()=>{
 const i=inputs(Core.initial());
 assert.equal(Visual.summary(i).brand,null);
 const brand={profile:{name:'Estudio Ejemplo',person:'Ana',email:'a@example.com',logo:'data:image/png;base64,AAAA'}};
 assert.deepEqual(Visual.summary({...i,brand}).brand,{name:'Estudio Ejemplo',person:'Ana',tagline:'',email:'a@example.com',phone:'',web:'',logo:'data:image/png;base64,AAAA'});
 assert.equal(Visual.summary({...i,brand:{profile:{name:'X',logo:'https://example.com/a.png'}}}).brand.logo,null,'only local data images');
});

test('preview components do not mutate the project',()=>{
 const p=deepFreeze(Core.initial()),g=deepFreeze(Core.geometry(p)),m=deepFreeze(Surfaces.home(p)),before=JSON.stringify([p,g,m]);
 Visual.plan(g);Visual.axonometric(g);Visual.deliveryStates({summary:Visual.summary({project:p,geometry:g,metrics:m})});
 assert.equal(JSON.stringify([p,g,m]),before);
});

test('automatic views use the saved presentation rooms, then main rooms by family and area',()=>{
 const p=Core.initial(),g=Core.geometry(p),area=poly=>Math.abs(poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
 // No family declared: the largest counted rooms.
 const auto=Visual.automaticRoomIds({geometry:g,project:p});
 assert.equal(auto.source,'automatic');assert.equal(auto.roomIds.length,4);
 const expected=g.rooms.filter(r=>r.counted!==false).sort((a,b)=>area(b.poly)-area(a.poly)).slice(0,4).map(r=>r.id);assert.deepEqual(auto.roomIds,expected);
 // A saved presentation selection wins, keeps its order, drops unknown ids.
 assert.deepEqual(Visual.automaticRoomIds({geometry:g,project:p,saved:['rom_kitchen','nope','rom_living']}),{source:'presentation',roomIds:['rom_kitchen','rom_living']});
 // Declared families: living, kitchen, dining, bedroom first; service rooms only if nothing else.
 const q=Core.clone(p);const set=(id,f)=>{q.rooms.find(r=>r.id===id).family=f;};set('rom_hall','hallway');set('rom_kitchen','kitchen');set('rom_living','living');set('rom_dining','dining');set('rom_master','bedroom');
 const fam=Visual.automaticRoomIds({geometry:Core.geometry(q),project:q});assert.deepEqual(fam.roomIds,['rom_living','rom_kitchen','rom_dining','rom_master']);
 assert.ok(!Visual.automaticRoomIds({geometry:Core.geometry(q),project:q,max:20}).roomIds.includes('rom_hall'),'service rooms are not chosen while main rooms exist');
 assert.deepEqual(Visual.automaticRoomIds({geometry:{rooms:[]},project:q}),{source:'automatic',roomIds:[]});
});

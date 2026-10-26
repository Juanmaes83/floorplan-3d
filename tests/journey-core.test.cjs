// Next action of the professional's journey (js/journey-core.js): truthful to the project, the building and what was
// already reviewed or presented; at most one primary action; nothing in the input is changed.
const {test}=require('node:test'),assert=require('node:assert/strict');
const J=require('../js/journey-core.js'),L=require('../js/room-layout.js'),C=require('../js/project-core.js'),T=require('../js/tracing-core.js');
const fs=require('node:fs'),path=require('node:path');
const own=(project,extra={})=>({project,kind:'own',revision:'r1',evidence:{},view:'2d',building:{state:'clear'},...extra});
const room=()=>L.create(L.blank('Mi vivienda'),{name:'Salón',width:3000,depth:4000,x:0,y:0}).project;
const withOpening=()=>{const p=room(),w=p.walls[0];p.openings.push({id:'opn_test-door',kind:'door',wallId:w.id,offsetMm:500,widthMm:800,heightMm:2100,sillHeightMm:0,swing:{hinge:'start',side:'left'}});return p;};
const withFurniture=()=>{const p=withOpening();const {cx,cy,w,d,rot,...o}={...C.object('sofa','Sofá',1500,2000,2000,900,0,'#999'),id:'obj_test-sofa'};p.objects.push(o);return p;};
const imageProject=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/contracts/examples/floorplan-project-v1.f1b.example.json'),'utf8'));

test('the example offers 3D first and then a copy of one\'s own; in 3D it does not offer 3D again',()=>{
 const p=C.initial();
 let r=J.next({...own(p),kind:'example'});assert.equal(r.id,'example');assert.equal(r.primary.id,'view3d');assert.equal(r.secondary,null,'the example line already offers the copy');
 r=J.next({...own(p),kind:'example',evidence:{view3d:'r1'}});assert.equal(r.primary.id,'copy');assert.equal(r.secondary,null);
 r=J.next({...own(p),kind:'example',view:'3d'});assert.equal(r.primary.id,'copy','no «Ver en 3D» while the scene is open');
});

test('an empty project has no guide button: the plan already shows «Crear primera estancia»',()=>{
 const r=J.next(own(L.blank('Mi vivienda')));assert.equal(r.id,'empty');assert.equal(r.primary,null);assert.equal(r.secondary,null);
});

test('after the first room the next action is doors and windows, not «Objetivo completado»; then furniture, 3D, presentation',()=>{
 let r=J.next(own(room()));assert.equal(r.id,'openings');assert.equal(r.primary.id,'openings');assert.equal(r.secondary.id,'room');assert.ok(r.skippable);
 r=J.next(own(withOpening()));assert.equal(r.id,'furnish');assert.equal(r.primary.id,'furnish');assert.match(r.text[0],/^1 estancia sin muebles/);
 r=J.next(own(withFurniture()));assert.equal(r.id,'review');assert.equal(r.primary.id,'view3d');
 r=J.next(own(withFurniture(),{evidence:{view3d:'r1'}}));assert.equal(r.id,'present');assert.equal(r.primary.id,'present');
 r=J.next(own(withFurniture(),{evidence:{view3d:'r1',present:'r1'}}));assert.equal(r.id,'done');assert.equal(r.primary,null,'nothing to push when the delivery is ready');assert.equal(r.secondary.id,'exportCopy');
});

test('a change after presenting asks to review that version again; the 3D scene open counts as reviewing',()=>{
 let r=J.next(own(withFurniture(),{revision:'r2',evidence:{view3d:'r1',present:'r1'}}));assert.equal(r.id,'review');
 r=J.next(own(withFurniture(),{view:'3d'}));assert.equal(r.id,'reviewing');assert.equal(r.primary.id,'present');assert.equal(r.secondary.id,'plan2d');
});

test('«Ahora no» puts off doors and windows, furniture or the 3D review for this project only',()=>{
 assert.equal(J.next(own(room(),{skipped:['openings']})).id,'furnish');
 assert.equal(J.next(own(room(),{skipped:['openings','furnish']})).id,'review');
 assert.equal(J.next(own(room(),{skipped:['openings','furnish','review']})).id,'present');
});

test('building conflicts come before furniture and presentation, with the real headline and no promise to present',()=>{
 const r=J.next(own(withFurniture(),{evidence:{view3d:'r1'},building:{state:'pending',headline:'2 conflictos en 2 plantas: distribución pendiente'}}));
 assert.equal(r.id,'conflicts');assert.equal(r.primary.id,'conflicts');assert.match(r.text[0],/^2 conflictos en 2 plantas: distribución pendiente\. Mientras sigan, no se puede presentar/);
});

test('an image plan walks through calibrate → second dimension → (repeat | confirm) → draw',()=>{
 const p=imageProject();p.rooms=[];p.walls=[];p.openings=[];p.objects=[];const image=p.sourceImages[0];
 delete p.scale.calibration;delete p.scale.verification;p.scale.confidence='unknown';
 assert.equal(J.next(own(p)).primary.id,'calibrate');
 T.calibrate(p,image.id,{x:10,y:10},{x:110,y:10},1000);assert.equal(J.scaleState(p),'calibrated');assert.equal(J.next(own(p)).primary.id,'verify');
 T.verify(p,{x:10,y:20},{x:10,y:70},900);assert.equal(J.scaleState(p),'discrepant');let r=J.next(own(p));assert.equal(r.primary.id,'reverify');assert.equal(r.secondary.id,'recalibrate');
 T.verify(p,{x:10,y:20},{x:10,y:70},500);assert.equal(J.scaleState(p),'consistent');assert.equal(J.next(own(p)).primary.id,'confirm');
 T.confirm(p);assert.equal(J.scaleState(p),'confirmed');assert.equal(J.next(own(p)).primary.id,'trace');
});

test('every result has at most one primary action, labels in the three languages and no placeholder left; input unchanged',()=>{
 const inputs=[{...own(C.initial()),kind:'example'},own(L.blank('x')),own(room()),own(withOpening()),own(withFurniture()),own(withFurniture(),{view:'3d'}),own(withFurniture(),{evidence:{view3d:'r1'}}),own(withFurniture(),{evidence:{view3d:'r1',present:'r1'}}),own(withFurniture(),{building:{state:'pending',headline:'1 conflicto en 1 planta: distribución pendiente'}})];
 for(const input of inputs){const before=JSON.stringify(input),r=J.next(input);assert.equal(JSON.stringify(input),before,`${r.id}: input unchanged`);
  for(const labels of [r.title,r.text,r.primary?.label,r.secondary?.label].filter(Boolean)){assert.equal(labels.length,3);for(const s of labels){assert.ok(s.trim().length>1,`${r.id}: label present`);assert.doesNotMatch(s,/[{}]/,`${r.id}: no placeholder`);}}}
});

'use strict';
/* NAV3D V1 · Navegación 3D profesional (Ola 2 · corte 2a: UX-05, UX-09, UX-22, UX-23, UX-25) en el editor REAL.
   Datos SINTÉTICOS: el piso de ejemplo, una vivienda con un armario empotrado inaccesible y el edificio sintético de dos
   plantas. Cada prueba recorre la experiencia como un profesional y comprueba al final que el proyecto, el historial y la
   biblioteca guardada no han cambiado, sin errores de consola ni peticiones fuera del servidor local. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./nav3d/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const status=page=>page.locator('#nav3dStatus').innerText();
const marker=page=>page.evaluate(()=>RubikNav3D.marker);
const translate=t=>t&&t.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/)?.slice(1).map(Number);
async function pickRoom(page,label){const v=await page.locator('#nav3dRoom option',{hasText:label}).first().getAttribute('value');await page.locator('#nav3dRoom').selectOption(v);
  await page.waitForFunction(()=>!document.querySelector('#nav3dRoom').disabled&&document.querySelector('#nav3dStatus').textContent);await K.settled(page);}
// El minimapa se actualiza con los fotogramas del 3D (en un navegador sin GPU son pocos por segundo): se espera a que el
// marcador refleje la pose real de la cámara, nunca un tiempo fijo.
const freshMarker=page=>page.waitForFunction(()=>{const p=View3D.walkPose(),m=RubikNav3D.marker.transform?.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);
  return p&&m&&Math.abs(+m[1]-p.x)<2&&Math.abs(+m[2]-p.y)<2&&Math.abs(((+m[3]-Math.atan2(p.dy,p.dx)*180/Math.PI)%360+540)%360-180)<1;},null,{timeout:30000});
async function waitDoors(page,open){await page.waitForFunction(o=>View3D.walkDoors.every(d=>d.open===o&&Math.abs(d.angle-(o?d.openAngle:d.closedAngle))<.02),open,{timeout:15000});}

test('recorrido completo en escritorio: estancia, maqueta blanca, mobiliario, puertas, paseo con minimapa y vuelta al editor intacto',{timeout:300000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const before=await K.snapshot(page);
    await K.open3D(page);
    // UX-05: el panel se encuentra al entrar, abierto en escritorio, con el modo activo claro.
    assert.equal(await page.locator('#nav3d').isVisible(),true);assert.equal(await page.locator('#nav3dToggle').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#nav3dMode-interior').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[id^="nav3dMode-"][aria-pressed="true"]').count(),1,'un único modo activo');
    if(await page.locator('#nav3dMode-exterior').isDisabled())assert.match(await page.locator('#nav3dMode-exterior').getAttribute('title'),/no disponible/,'lo no disponible se explica');
    // UX-23: estancias del proyecto, ordenadas por uso; encuadre de la cocina.
    const labels=await page.locator('#nav3dRoom option').allInnerTexts();
    assert.equal(labels[0],'Ir a una estancia…');assert.ok(labels.indexOf('Salón')<labels.indexOf('Cocina')&&labels.indexOf('Cocina')<labels.indexOf('Dormitorio principal'),labels.join(' | '));
    const cam0=await page.evaluate(()=>View3D.cameraState.position);
    await pickRoom(page,'Cocina');assert.match(await status(page),/Encuadre de «Cocina»/);
    assert.notDeepEqual(await page.evaluate(()=>View3D.cameraState.position),cam0,'la cámara se ha movido a la estancia');
    // UX-09: maqueta blanca reversible, sin materiales nuevos por malla ni texturas/geometrías nuevas.
    const sig0=await page.evaluate(()=>View3D.presentationMaterialSignature),mem0=await page.evaluate(()=>View3D.rendererMemory);
    await page.locator('#nav3dWhite').click();
    const white=await page.evaluate(()=>({s:View3D.navState,sig:View3D.presentationMaterialSignature}));
    assert.equal(white.s.white,true);assert.ok(white.s.whiteMeshes>100,'mallas en blanco: '+white.s.whiteMeshes);
    assert.ok(Object.keys(white.sig.materials).length<=Object.keys(sig0.materials).length/3,'pocos materiales compartidos: '+Object.keys(white.sig.materials).length);
    assert.equal(await page.locator('#nav3dWhite').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#nav3dFinishes').getAttribute('aria-pressed'),'false');
    for(let i=0;i<3;i++){await page.locator('#nav3dFinishes').click();await page.locator('#nav3dWhite').click();}
    await page.locator('#nav3dFinishes').click();
    assert.deepEqual(await page.evaluate(()=>View3D.presentationMaterialSignature),sig0,'acabados originales restaurados exactamente');
    const mem1=await page.evaluate(()=>View3D.rendererMemory);assert.ok(mem1.geometries<=mem0.geometries+2&&mem1.textures===mem0.textures,`sin fugas de GPU ${JSON.stringify([mem0,mem1])}`);
    // Mobiliario: el mismo estado que el botón «Muebles» de la barra (una sola fuente de verdad).
    await page.locator('#nav3dFurniture').click();
    assert.equal(await page.evaluate(()=>View3D.navState.furniture),false);assert.equal(await page.locator('#toggles3d [data-t="furn"]').evaluate(b=>b.classList.contains('on')),false);
    assert.match(await status(page),/no se borra nada/);
    await page.locator('#toggles3d [data-t="furn"]').click();await page.waitForFunction(()=>document.querySelector('#nav3dFurniture').getAttribute('aria-pressed')==='true');
    // UX-25: cerrar todas → todas las hojas cerradas y bloquean el paso.
    assert.match(await page.locator('#nav3dDoors').innerText(),/Cerrar todas las puertas/);
    await page.locator('#nav3dDoors').click();await waitDoors(page,false);
    assert.match(await page.locator('#nav3dDoorInfo').innerText(),/0 de 6 abiertas/);assert.match(await page.locator('#nav3dDoors').innerText(),/Abrir todas/);
    const doors=await page.evaluate(()=>View3D.walkDoors);
    const mid=d=>[d.hinge[0]+Math.cos(d.closedAngle)*d.len/2,d.hinge[1]-Math.sin(d.closedAngle)*d.len/2];
    for(const d of doors)assert.deepEqual(await page.evaluate(([x,y])=>View3D.walkBlockedAt(x,y),mid(d)),{by:'door',id:d.id},'una puerta cerrada bloquea el paso');
    // UX-22: paseo con minimapa; el panel se recoge y el minimapa toma el relevo.
    await page.locator('#nav3dMode-walk').click();await page.waitForFunction(()=>View3D.walking());
    await page.locator('#walkStart').click();
    await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden&&document.querySelector('#nav3dMap').dataset.state);
    assert.equal(await page.locator('#nav3dToggle').getAttribute('aria-expanded'),'false','panel recogido al caminar');
    // Minimapa con el puntero bloqueado (caminando): posición y orientación reales, que responden al movimiento y al giro.
    const d0=doors[0],[mx,my]=mid(d0),nx=Math.sin(d0.closedAngle),ny=Math.cos(d0.closedAngle);
    let at=null;for(const s of [1,-1]){const p=[mx+nx*s*1100,my+ny*s*1100];if(!(await page.evaluate(([x,y])=>View3D.walkBlockedAt(x,y),p)).by){at=p;break;}}
    assert.ok(at,'hay sitio delante de la puerta');
    await K.standAt(page,at,[at[0]+1000,at[1]]);await freshMarker(page);
    const m1=await marker(page),[x1,y1,a1]=translate(m1.transform);
    assert.ok(Math.abs(x1-at[0])<5&&Math.abs(y1-at[1])<5,`marcador en la posición ${m1.transform} vs ${at}`);assert.equal(a1,0);
    await K.standAt(page,at,[at[0],at[1]+1000]);await freshMarker(page);assert.equal(translate((await marker(page)).transform)[2],90,'el marcador gira con la cámara');
    await K.standAt(page,at,[2*at[0]-mx,2*at[1]-my]);await freshMarker(page);
    await page.keyboard.down('KeyW');await page.waitForFunction(([x,y])=>{const p=View3D.walkPose();return Math.hypot(p.x-x,p.y-y)>300;},at,{timeout:30000});await page.keyboard.up('KeyW');await freshMarker(page);
    const m2=await marker(page),p2=translate(m2.transform);assert.ok(p2&&Math.hypot(p2[0]-x1,p2[1]-y1)>150,`avanza en el minimapa ${m1.transform} → ${m2.transform}`);
    // Puerta individual después de la orden global: se apunta a una puerta cerrada y E la abre; el resumen lo refleja.
    // Con el puntero liberado (Esc), como haría una persona antes de usar el panel.
    await page.keyboard.press('Escape');await K.standAt(page,at,[mx,my]);
    assert.equal((await page.evaluate(()=>View3D.walkAim)).door,d0.id);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(id=>View3D.walkDoors.find(d=>d.id===id).open,d0.id);
    await page.locator('#nav3dToggle').click();
    await page.waitForFunction(()=>/1 de 6 abiertas/.test(document.querySelector('#nav3dDoorInfo').textContent));
    assert.match(await page.locator('#nav3dDoors').innerText(),/Abrir todas/,'estado mixto: la acción global es abrir todas');
    await page.locator('#nav3dDoors').click();await waitDoors(page,true);
    for(const d of doors)assert.notEqual((await page.evaluate(([x,y])=>View3D.walkBlockedAt(x,y),mid(d))).by,'door','las colisiones siguen a las hojas abiertas');
    // Sin datos fiables: estado seguro, sin posición inventada.
    await page.evaluate(()=>{window.__walkPose=View3D.walkPose;View3D.walkPose=()=>null;});await page.waitForFunction(()=>RubikNav3D.marker.state==='unknown',null,{timeout:30000});
    let m=await marker(page);assert.equal(m.state,'unknown');assert.equal(m.caption,'Posición no disponible');
    assert.equal(await page.locator('#nav3dMarker').evaluate(n=>getComputedStyle(n).display),'none');
    await page.evaluate(()=>{View3D.walkPose=window.__walkPose;});
    // Ir a una estancia en el paseo: salto a un punto libre (no se promete una ruta) y el minimapa lo muestra.
    await pickRoom(page,'Dormitorio principal');assert.match(await status(page),/salto de cámara a un punto libre, no un recorrido/);
    await page.waitForFunction(()=>RubikNav3D.marker.caption==='Dormitorio principal');
    const pose=await page.evaluate(()=>View3D.walkPose());assert.equal((await page.evaluate(([x,y])=>View3D.walkBlockedAt(x,y),[pose.x,pose.y])).by,null,'no queda dentro de un muro ni de una puerta');
    // Plegar y desplegar el minimapa.
    await page.locator('#nav3dMapToggle').click();assert.equal(await page.locator('#nav3dMapSvg').isVisible(),false);assert.equal(await page.locator('#nav3dMapToggle').getAttribute('aria-expanded'),'false');
    await page.locator('#nav3dMapToggle').click();assert.equal(await page.locator('#nav3dMapSvg').isVisible(),true);
    // Salir del paseo desde el panel: el minimapa se va y el panel vuelve como estaba.
    await page.locator('#nav3dMode-interior').click();await page.waitForFunction(()=>!View3D.walking()&&!View3D.navState.busy);
    await page.waitForFunction(()=>document.querySelector('#nav3dMap').hidden&&document.querySelector('#nav3dToggle').getAttribute('aria-expanded')==='true');
    // Vuelta al editor con la maqueta blanca puesta: se apaga sola y el proyecto no ha cambiado.
    await page.locator('#nav3dWhite').click();
    await page.locator('#viewSeg .btn[data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&document.querySelector('#nav3d').hidden);
    assert.equal(await page.evaluate(()=>View3D.navState.white),false);
    assert.deepEqual(await K.snapshot(page),before,'proyecto, historial y biblioteca intactos');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('estancia inaccesible en el paseo: se explica y la cámara no se mueve; en observación sí se encuadra',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    await K.importProject(page,K.closetProject());await K.open3D(page);
    assert.deepEqual(await page.locator('#nav3dRoom option').allInnerTexts(),['Ir a una estancia…','Salón','Armario empotrado']);
    assert.equal(await page.locator('#nav3dDoors').isDisabled(),true);assert.match(await page.locator('#nav3dDoorInfo').innerText(),/no tiene puertas batientes/);
    const before=await K.snapshot(page);
    await page.locator('#nav3dMode-walk').click();await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy);
    await page.locator('#nav3dToggle').click();const cam=await page.evaluate(()=>View3D.cameraState.position);
    await pickRoom(page,'Armario empotrado');
    assert.match(await status(page),/No hay un punto libre dentro de esa estancia/);assert.deepEqual(await page.evaluate(()=>View3D.cameraState.position),cam);
    await pickRoom(page,'Salón');assert.match(await status(page),/Te hemos situado en «Salón»/);
    await page.locator('#nav3dMode-interior').click();await page.waitForFunction(()=>!View3D.walking()&&!View3D.navState.busy);
    await pickRoom(page,'Armario empotrado');assert.match(await status(page),/Encuadre de «Armario empotrado»/);
    assert.deepEqual(await K.snapshot(page),before);assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('multiplanta: plantas en el panel, estancia de otra planta (encuadre y paseo) sin mezclar ids, edificio intacto',{timeout:300000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    await K.importBuilding(page);await K.open3D(page);
    const ctx0=await page.evaluate(()=>FloorPlanBuildingUI.context);
    assert.equal(await page.locator('#nav3dLevelLabel').isVisible(),true);
    assert.deepEqual(await page.locator('[id^="nav3dLevel-"]').allInnerTexts(),await page.evaluate(()=>library.building().levels.sort((a,b)=>a.order-b.order).map(l=>l.name)));
    const groups=await page.evaluate(()=>RubikNav3D.groups);assert.equal(groups.length,2);
    assert.equal(await page.locator('#nav3dRoom optgroup').count(),2,'estancias agrupadas por planta');
    const keys=groups.flatMap(g=>g.rooms.map(r=>r.key));assert.equal(new Set(keys).size,keys.length);
    const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.find(e=>e.kind==='building').building.levels.map(l=>JSON.stringify(l.project)),K.KEY);
    const other=groups.find(g=>!g.active),room=other.rooms[0];
    await page.locator('#nav3dRoom').selectOption(room.key);
    await page.waitForFunction(id=>FloorPlanBuildingUI.context.levelId===id&&/Encuadre de/.test(document.querySelector('#nav3dStatus').textContent),other.levelId,{timeout:30000});
    assert.match(await status(page),new RegExp(`«${room.label}» \\(${other.name}\\)`));
    assert.equal(await page.locator(`#nav3dLevel-${other.levelId}`).getAttribute('aria-pressed'),'true','la planta activa se marca en el panel');
    // Paseo y estancia de la otra planta: cambia de planta y sitúa a la persona en un punto libre de ESA estancia.
    await page.locator('#nav3dMode-walk').click();await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy);
    const back=groups.find(g=>g.levelId===ctx0.levelId),target=back.rooms[0];
    await page.locator('#nav3dToggle').click();await page.locator('#nav3dRoom').selectOption(target.key);
    await page.waitForFunction(id=>FloorPlanBuildingUI.context.levelId===id&&/Te hemos situado/.test(document.querySelector('#nav3dStatus').textContent),back.levelId,{timeout:30000});
    const pose=await page.evaluate(()=>View3D.walkPose()),inRoom=await page.evaluate(([id,x,y])=>{const r=FloorPlanApp.project.rooms.find(r=>r.id===id);const P=r.polygon;let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;},[target.roomId,pose.x,pose.y]);
    assert.ok(inRoom,'dentro de la estancia elegida de la planta correcta');
    await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden);assert.match((await marker(page)).caption,new RegExp(back.name));
    // Botón de planta en el paseo: cambia y deja a la persona en un punto libre de la otra planta.
    await page.locator(`#nav3dLevel-${other.levelId}`).click();
    await page.waitForFunction(id=>FloorPlanBuildingUI.context.levelId===id&&/Planta «/.test(document.querySelector('#nav3dStatus').textContent),other.levelId,{timeout:30000});
    const p2=await page.evaluate(()=>View3D.walkPose());assert.equal((await page.evaluate(([x,y])=>View3D.walkBlockedAt(x,y),[p2.x,p2.y])).by,null);
    const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.find(e=>e.kind==='building').building.levels.map(l=>JSON.stringify(l.project)),K.KEY);
    assert.deepEqual(after,before,'las plantas del edificio no cambian');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

for(const viewport of [{width:390,height:844},{width:844,height:390}])
test(`teléfono ${viewport.width}x${viewport.height}: panel plegable, estancia, visualización, puertas y paseo táctil con minimapa sin tapar los controles`,{timeout:300000},async()=>{
  const {context,page,watch}=await K.editor(env,{viewport,isMobile:true,hasTouch:true});
  try{
    const before=await K.snapshot(page);await K.open3D(page);
    assert.equal(await page.locator('#nav3dToggle').getAttribute('aria-expanded'),'false','en el teléfono empieza plegado: no tapa la escena');
    await page.locator('#nav3dToggle').tap();
    const vp=page.viewportSize(),panel=await K.box(page,'#nav3d');
    assert.ok(panel.left>=0&&panel.right<=vp.width&&panel.top>=0&&panel.bottom<=vp.height,'panel dentro de la pantalla '+JSON.stringify(panel));
    assert.equal(await K.hScroll(page),false,'sin desbordamiento horizontal');
    for(const sel of ['#nav3dMode-walk','#nav3dWhite','#nav3dDoors'])assert.ok((await K.box(page,sel)).height>=43,sel+' táctil (44 px)');
    await pickRoom(page,'Salón');assert.match(await status(page),/Encuadre de «Salón»/);
    await page.locator('#nav3dWhite').tap();assert.equal(await page.evaluate(()=>View3D.navState.white),true);
    await page.locator('#nav3dDoors').tap();await waitDoors(page,false);
    await page.locator('#nav3dMode-walk').tap();await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy);
    await page.locator('#walkStart').tap();await page.locator('#joy').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden&&RubikNav3D.marker.state==='ok');
    // El joystick y «Salir del paseo» se pueden tocar en su centro (la barra inferior del teléfono no los tapa).
    await page.waitForFunction(()=>['#joy','#walkExit'].every(sel=>{const n=document.querySelector(sel),r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),null,{timeout:30000});
    const map=await K.box(page,'#nav3dMap'),joy=await K.box(page,'#joy'),exit=await K.box(page,'#walkExit'),pill=await K.box(page,'#nav3d');
    assert.equal(K.overlaps(map,joy),false,'el minimapa no tapa el joystick');assert.equal(K.overlaps(map,exit),false,'ni «Salir del paseo»');
    assert.equal(K.overlaps(map,pill),false,'ni la pastilla del panel');assert.equal(K.overlaps(pill,joy),false);
    // Joystick con un dedo real (eventos táctiles del navegador): hacia delante unos instantes; el marcador avanza.
    const m0=translate((await marker(page)).transform),cx=joy.left+joy.width/2,cy=joy.top+joy.height/2,cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
    for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-i*9,id:1}]});
    const p0=await page.evaluate(()=>View3D.walkPose());
    await page.waitForFunction(p0=>{const p=View3D.walkPose();return Math.hypot(p.x-p0.x,p.y-p0.y)>300;},p0,{timeout:30000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await freshMarker(page);
    const m1=translate((await marker(page)).transform);assert.ok(Math.hypot(m1[0]-m0[0],m1[1]-m0[1])>150,`el marcador sigue al joystick ${m0} → ${m1}`);
    await page.locator('#walkExit').tap();await page.waitForFunction(()=>!View3D.walking()&&document.querySelector('#nav3dMap').hidden);
    assert.equal(await K.hScroll(page),false);
    await page.locator('#viewSeg .btn[data-view="2d"]').tap();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
    assert.equal(await page.evaluate(()=>View3D.navState.white),false);
    assert.deepEqual(await K.snapshot(page),before);assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('Presentación y WebGL: el panel cede a la Presentación, el minimapa sirve a su paseo y una pérdida de contexto no deja estado colgado',{timeout:300000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const before=await K.snapshot(page);await K.open3D(page);
    await page.locator('#nav3dWhite').click();assert.equal(await page.evaluate(()=>View3D.navState.white),true);
    await page.locator('#presentationBtn').click();await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación'}).click();
    await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:90000});
    await page.waitForFunction(()=>document.querySelector('#nav3d').hidden&&!View3D.navState.white,null,{timeout:5000});
    // Paseo desde la Presentación: el mismo minimapa, por encima de su capa.
    assert.equal((await page.evaluate(()=>View3D.presentationWalkFrom())).ok!==false,true);
    await page.waitForFunction(()=>View3D.walking()&&!document.querySelector('#nav3dMap').hidden&&RubikNav3D.marker.state);
    const top=await page.evaluate(()=>{const r=document.querySelector('#nav3dMap').getBoundingClientRect(),e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return document.querySelector('#nav3dMap').contains(e);});
    assert.equal(top,true,'el minimapa se ve por encima de la capa de la Presentación');
    await page.evaluate(()=>View3D.presentationWalkEnd());await page.waitForFunction(()=>document.querySelector('#nav3dMap').hidden);
    await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
    await page.waitForFunction(()=>!document.querySelector('#nav3d').hidden&&View3D.navState.white,null,{timeout:10000});
    // Pérdida del contexto WebGL (GOV-07): vuelta al plano, panel y minimapa fuera, maqueta blanca apagada.
    await page.evaluate(()=>document.querySelector('#view3d canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&document.querySelector('#nav3d').hidden&&document.querySelector('#nav3dMap').hidden,null,{timeout:15000});
    assert.equal(await page.evaluate(()=>View3D.navState.white),false);
    assert.deepEqual(await K.snapshot(page),before);assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

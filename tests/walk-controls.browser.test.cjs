/* «Recorrer»: every control the interface announces, exercised for real and recorded control by control (PR #89 §6).
   An instruction on screen is not evidence: each row moves the camera, opens or closes a door, or shows that nothing
   happens where nothing should. Desktop: W A S D, arrows, Shift, mouse look, E (open and close, in and out of reach),
   Esc (pause) and click (resume), focus in a text field, «Vista aérea» (leave) and «Recorrer» (return). Phone:
   joystick, drag to look, tap a door, «Salir del recorrido». Results and captures go to WALK_ARTIFACTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;const OUT=process.env.WALK_ARTIFACTS||path.join(os.tmpdir(),'walk-controls');const matrix=[];
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;await fs.mkdir(OUT,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await fs.writeFile(path.join(OUT,'controls.json'),JSON.stringify(matrix,null,1));await browser?.close();await new Promise(r=>server?.close(r));});
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the walk needs 3D';
const contract=require('../docs/contracts/examples/floorplan-project-v1.example.json');
const record=(vp,control,expected,observed,pass,shot)=>{matrix.push({viewport:vp,control,expected,observed,result:pass?'PASS':'FAIL',shot});return pass;};

async function open(t,viewport,project,input){
 const mobile=input?input==='touch':viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForTimeout(500);
 if(project){await page.evaluate(p=>FloorPlanApp.importProject(p),project);await page.waitForFunction(n=>FloorPlanApp.project.rooms.length===n,project.rooms.length);}
 const tap=async s=>{const l=page.locator(s);if(mobile)await l.tap();else await l.click();};
 if(mobile&&!(await page.locator('[data-view="3d"]').isVisible())){}
 await tap('[data-view="3d"]');
 await page.waitForFunction(()=>window.View3D?.cameraState&&!View3D.lifecycleMetrics.animating&&!View3D.lifecycleMetrics.flying,null,{timeout:200000});await page.waitForTimeout(800);
 if(!(await page.locator('[data-mode="walk"]').isVisible())&&await page.locator('#guideClose').isVisible())await tap('#guideClose');
 const where=()=>page.evaluate(()=>{const s=View3D.cameraState,[x,,z]=s.position,[qx,qy,qz,qw]=s.quaternion,p=[x*1000+geometry.center.x,z*1000+geometry.center.y];
  const inside=(q,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  return {p,room:geometry.rooms.find(r=>inside(p,r.poly))?.name||null,fwd:[-2*(qx*qz+qw*qy),-(1-2*(qx*qx+qy*qy))],locked:!!document.pointerLockElement,mode:View3D.walking()?'walk':'orbit'};});
 const hold=async(keys,ms)=>{for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(ms);for(const k of [...keys].reverse())await page.keyboard.up(k);await page.waitForTimeout(120);};
 // Turning (desktop): the event the mouse sends under Pointer Lock (see walk.browser.test.cjs for why it is dispatched).
 const turnTo=async target=>{for(let n=0;n<12;n++){const w=await where(),want=Math.atan2(target[1]-w.p[1],target[0]-w.p[0]),have=Math.atan2(w.fwd[1],w.fwd[0]);let e=want-have;while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;if(Math.abs(e)<.05)return;
  // A drag of a few pixels is a tap (it would toggle a door under the finger): small corrections are left as they are.
  if(mobile&&Math.abs(e/0.005)<20)return;
  if(mobile){const r=await page.locator('canvas').first().boundingBox();const x=r.x+r.width*.7,y=r.y+r.height*.4;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-e/0.005,y,{steps:6});await page.mouse.up();}
  else await page.evaluate(px=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:px,movementY:0})),e/0.002);await page.waitForTimeout(150);}};
 // Through a list of points, as in walk.browser.test.cjs: turn when off course, then short steps of W.
 const route=async points=>{for(const w of points)for(let n=0;n<30;n++){const a=await where(),d=dist(a.p,w);if(d<200)break;
  const want=Math.atan2(w[1]-a.p[1],w[0]-a.p[0]),have=Math.atan2(a.fwd[1],a.fwd[0]);let e=want-have;while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
  if(Math.abs(e)>.08){await page.evaluate(px=>{for(let k=0;k<4;k++)document.dispatchEvent(new MouseEvent('mousemove',{movementX:px/4,movementY:0}));},e/0.002);await page.waitForTimeout(150);continue;}
  await hold(['KeyW'],Math.min(1200,d*1.2));}};
 const go=async target=>{for(let n=0;n<10&&dist((await where()).p,target)>200;n++){await turnTo(target);const a=await where();await hold(['KeyW'],Math.min(900,dist(a.p,target)*1.4));if(dist((await where()).p,a.p)<10)break;}};
 const shot=async name=>{const f=path.join(OUT,`${viewport.width}x${viewport.height}${input?'-'+input:''}-${name}.png`);await page.screenshot({path:f});return path.basename(f);};
 return {page,errors,mobile,tap,where,hold,turnTo,shot,go,route};
}
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const along=(a,b,v)=>((b[0]-a[0])*v[0]+(b[1]-a[1])*v[1])/Math.hypot(v[0],v[1]);

test('desktop controls: keys, Shift, mouse, Esc, resume, focus, leave and return 1440x900',{timeout:900000,skip},async t=>{
 const vp='1440x900',{page,errors,where,hold,turnTo,shot,tap}=await open(t,{width:1440,height:900});
 await tap('[data-mode="walk"]');const start=await where();await page.locator('#walkOverlay').click();
 assert.ok(record(vp,'Clic en «Pulsa para empezar»','captura el ratón y muestra la cruz',JSON.stringify({locked:(await where()).locked}),(await where()).locked,await shot('locked')));
 // Face the longest free direction of the living room (towards the hall) so every key has room to act.
 await turnTo([start.p[0],start.p[1]-3000]);
 const keyRow=async(label,keys,axis,sign)=>{const a=await where();await hold(keys,900);const b=await where();const right=[-a.fwd[1],a.fwd[0]];
  const v=axis==='fwd'?along(a.p,b.p,a.fwd):along(a.p,b.p,right);return record(vp,label,`${sign>0?'avanza':'retrocede'} ${axis==='fwd'?'hacia delante':'de lado'} (> 80 mm)`,`${Math.round(v)} mm`,v*sign>80,await shot(label.replace(/\W+/g,'_')));};
 assert.ok(await keyRow('W','KeyW'.split(' '),'fwd',1));assert.ok(await keyRow('S',['KeyS'],'fwd',-1));
 assert.ok(await keyRow('↑',['ArrowUp'],'fwd',1));assert.ok(await keyRow('↓',['ArrowDown'],'fwd',-1));
 assert.ok(await keyRow('D',['KeyD'],'right',1));assert.ok(await keyRow('A',['KeyA'],'right',-1));
 assert.ok(await keyRow('→',['ArrowRight'],'right',1));assert.ok(await keyRow('←',['ArrowLeft'],'right',-1));
 // Shift runs: the same time covers clearly more ground (2.6 vs 1.4 m/s).
 await turnTo([start.p[0],start.p[1]-3000]);let a=await where();await hold(['KeyS'],1200);a=await where();
 const w0=await where();await hold(['KeyW'],700);const w1=await where();await hold(['KeyS'],700);const s0=await where();await hold(['ShiftLeft','KeyW'],700);const s1=await where();
 const walk=dist(w0.p,w1.p),run=dist(s0.p,s1.p);assert.ok(record(vp,'Mayús + W','corre (≥ 1,4 × la distancia de W en el mismo tiempo)',`W ${Math.round(walk)} mm · Mayús+W ${Math.round(run)} mm`,run>=walk*1.4,await shot('shift')));
 // Mouse look turns the view.
 const y0=(await where()).fwd;await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:300,movementY:0})));await page.waitForTimeout(200);const y1=(await where()).fwd;
 const turned=Math.abs(Math.atan2(y0[0]*y1[1]-y0[1]*y1[0],y0[0]*y1[0]+y0[1]*y1[1]));assert.ok(record(vp,'Ratón','gira la vista',`${(turned*180/Math.PI).toFixed(0)}°`,turned>.4,await shot('mouse')));
 // Esc pauses: the pointer is released, the start panel returns and W does not move.
 await page.keyboard.press('Escape');await page.waitForTimeout(300);const p0=await where();await hold(['KeyW'],700);const p1=await where();
 const overlay=await page.locator('#walkOverlay').isVisible();
 assert.ok(record(vp,'Esc','pausa: libera el ratón, vuelve el panel y no se mueve',JSON.stringify({locked:p1.locked,overlay,moved:Math.round(dist(p0.p,p1.p))}),!p1.locked&&overlay&&dist(p0.p,p1.p)<5,await shot('esc')));
 // Focus in a text field: typing does not walk.
 await page.locator('#walkOverlay').click();await page.keyboard.press('Escape');await page.waitForTimeout(200);
 // The header search («¿Qué quieres hacer?») opens a dialog with a text field: typing W there must not walk.
 await tap('#actionSearchBtn');const field=page.locator('#editorActionInput');await field.waitFor();const f0=await where();await hold(['KeyW'],600);const f1=await where();
 const typed=await field.inputValue();assert.ok(record(vp,'Foco en un campo de texto','escribe en el campo y no camina',JSON.stringify({moved:Math.round(dist(f0.p,f1.p)),typed}),dist(f0.p,f1.p)<5&&/w/i.test(typed),await shot('focus')));await field.fill('');await page.keyboard.press('Escape');await page.waitForTimeout(300);
 // Resume: a click on the panel captures the pointer again and W moves.
 await page.locator('#walkOverlay').click();await page.waitForTimeout(300);const r0=await where();await hold(['KeyW'],700);const r1=await where();
 assert.ok(record(vp,'Reanudar (clic)','vuelve a capturar el ratón y W mueve',JSON.stringify({locked:r1.locked,moved:Math.round(dist(r0.p,r1.p))}),r1.locked&&dist(r0.p,r1.p)>80,await shot('resume')));
 // Leave with «Vista aérea» and come back with «Recorrer»: back at the start, nothing of the project changed.
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await page.keyboard.press('Escape');await tap('[data-mode="orbit"]');await page.waitForTimeout(800);
 const orbit=await where();await tap('[data-mode="walk"]');await page.waitForTimeout(300);const back=await where();
 assert.ok(record(vp,'Vista aérea → Recorrer','sale a la vista aérea y vuelve a empezar en la entrada',JSON.stringify({left:orbit.mode,again:back.mode,atStart:Math.round(dist(back.p,start.p))}),orbit.mode==='orbit'&&back.mode==='walk'&&dist(back.p,start.p)<5,await shot('leave-return')));
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'the walk does not change the project');assert.deepEqual(errors,[]);
});

test('desktop E: out of reach nothing changes; near, E closes the door (blocked) and opens it (pass) 1440x900',{timeout:900000,skip},async t=>{
 const vp='1440x900',{page,errors,where,hold,turnTo,shot,tap,go,route}=await open(t,{width:1440,height:900},contract);
 await tap('[data-mode="walk"]');await page.locator('#walkOverlay').click();
 // Bath door of the contract example: hinge (5200, 2250), closed leaf along the wall towards −x, 700 mm. In the walk
 // every door starts open; E toggles the door the cross points at within 2.5 m.
 const state=()=>page.evaluate(()=>View3D.walkDoors.find(d=>d.id==='opn_bath-door').open),door=[4850,2250],front=[4850,2850];
 // The leaf the cross must point at: hinge + half the leaf along its current angle (plan: (cos a, −sin a)).
 const leaf=()=>page.evaluate(()=>{const d=View3D.walkDoors.find(d=>d.id==='opn_bath-door');return [d.hinge[0]+Math.cos(d.angle)*d.len/2,d.hinge[1]-Math.sin(d.angle)*d.len/2];});
 assert.equal(await state(),true,'doors start open');
 await turnTo([1000,3500]);await hold(['KeyW'],2200);await turnTo(door);const far=await where();
 const f0=await page.screenshot();await page.keyboard.press('KeyE');await page.waitForTimeout(1000);const f1=await page.screenshot();
 assert.ok(record(vp,`E fuera de alcance (${(dist(far.p,door)/1000).toFixed(1)} m)`,'no cambia la puerta',JSON.stringify({distance:Math.round(dist(far.p,door)),open:await state(),imageChanged:Buffer.compare(f0,f1)!==0}),dist(far.p,door)>2500&&await state()===true,await shot('E-far')));
 // Stand about 1.1 m in front of the open leaf, as a person would to reach it with E.
 const L0=await leaf(),near=[L0[0]-1100,L0[1]];for(let n=0;n<10&&dist((await where()).p,near)>150;n++){await turnTo(near);await hold(['KeyW'],500);}
 await turnTo(await leaf());const c0=await page.screenshot();await page.keyboard.press('KeyE');await page.waitForTimeout(1200);const c1=await page.screenshot();const closedShot=await shot('E-near-close');
 // Blocked: from just in front of the doorway (west of where the leaf opens), walking straight in does not enter.
 await go(front);await turnTo([4850,1700]);const b0=await where();await hold(['KeyW'],1500);const b1=await where();
 assert.ok(record(vp,'E cerca (cerrar)','cierra la puerta (la imagen cambia) y ya no se puede pasar',JSON.stringify({open:await state(),imageChanged:Buffer.compare(c0,c1)!==0,room:b1.room,at:b0.p.map(Math.round),leaf:(await leaf()).map(Math.round),aim:await page.evaluate(()=>View3D.walkAim),doors:await page.evaluate(()=>View3D.walkDoors)}),await state()===false&&Buffer.compare(c0,c1)!==0&&b1.room!=='Baño',closedShot));
 await turnTo(await leaf());const o0=await page.screenshot();await page.keyboard.press('KeyE');await page.waitForTimeout(1200);const o1=await page.screenshot();const openShot=await shot('E-near-open');
 // The leaf opens towards x 5200, east of the person: straight through the doorway.
 await route([front,[4850,2250],[4850,1600]]);const inBath=await where();inBath.front=null;
 assert.ok(record(vp,'E cerca (abrir)','abre la puerta (la imagen cambia) y se puede pasar',JSON.stringify({open:await state(),imageChanged:Buffer.compare(o0,o1)!==0,room:inBath.room,front:inBath.front,at:inBath.p.map(Math.round),aim:await page.evaluate(()=>View3D.walkAim)}),await state()===true&&Buffer.compare(o0,o1)!==0&&inBath.room==='Baño',openShot));
 assert.deepEqual(errors,[]);
});

test('phone: joystick, drag to look, tap a door, «Salir del recorrido» 390x844',{timeout:900000,skip},async t=>{
 const vp='390x844',{page,errors,where,turnTo,shot,tap}=await open(t,{width:390,height:844},contract);
 await tap('[data-mode="walk"]');await tap('#walkOverlay');await page.waitForTimeout(300);
 assert.ok(record(vp,'Tocar «Pulsa para empezar»','muestra el joystick y «Salir del recorrido»',JSON.stringify({joy:await page.locator('#joy').isVisible(),exit:await page.locator('#walkExit').isVisible()}),await page.locator('#joy').isVisible()&&await page.locator('#walkExit').isVisible(),await shot('touch-start')));
 const joy=await page.locator('#joy').boundingBox(),jx=joy.x+joy.width/2,jy=joy.y+joy.height/2;
 const push=async(dx,dy,ms)=>{await page.mouse.move(jx,jy);await page.mouse.down();await page.mouse.move(jx+dx,jy+dy,{steps:4});await page.waitForTimeout(ms);await page.mouse.up();await page.waitForTimeout(150);};
 const door=[4850,2250],front=[4850,2850];
 await turnTo(front);const a=await where();await push(0,-50,1200);const b=await where();
 assert.ok(record(vp,'Joystick hacia arriba','avanza',`${Math.round(along(a.p,b.p,a.fwd))} mm`,along(a.p,b.p,a.fwd)>150,await shot('joystick')));
 const y0=(await where()).fwd;await turnTo([1000,3500]);const y1=(await where()).fwd;
 const turned=Math.abs(Math.atan2(y0[0]*y1[1]-y0[1]*y1[0],y0[0]*y1[0]+y0[1]*y1[1]));assert.ok(record(vp,'Arrastrar para mirar','gira la vista',`${(turned*180/Math.PI).toFixed(0)}°`,turned>.3,await shot('drag-look')));
 const nearW=[4100,2600];for(let n=0;n<8&&dist((await where()).p,nearW)>250;n++){await turnTo(nearW);await push(0,-50,700);}
 const state=()=>page.evaluate(()=>View3D.walkDoors.find(d=>d.id==='opn_bath-door').open);
 const leaf=()=>page.evaluate(()=>{const d=View3D.walkDoors.find(d=>d.id==='opn_bath-door');return [d.hinge[0]+Math.cos(d.angle)*d.len/2,d.hinge[1]-Math.sin(d.angle)*d.len/2];});
 const tapDoor=async()=>{await turnTo(await leaf());const c=await page.locator('canvas').first().boundingBox();const s0=await page.screenshot();await page.touchscreen.tap(c.x+c.width/2,c.y+c.height*.45);await page.waitForTimeout(1200);return Buffer.compare(s0,await page.screenshot())!==0;};
 const closedChanged=await tapDoor();for(let n=0;n<8&&dist((await where()).p,front)>200;n++){await turnTo(front);await push(0,-50,500);}await turnTo([4850,1700]);const c0=await where();await push(0,-50,1200);const c1=await where();
 assert.ok(record(vp,'Tocar la puerta (cerrar)','la cierra (la imagen cambia) y no se puede pasar',JSON.stringify({open:await state(),changed:closedChanged,room:c1.room}),await state()===false&&closedChanged&&c1.room!=='Baño',await shot('tap-door-close')));
 // Into the room: the stick is tilted towards the target relative to the view (forward = up, right = right).
 const stickTo=async(w,ms)=>{const a=await where(),rel=Math.atan2(w[1]-a.p[1],w[0]-a.p[0])-Math.atan2(a.fwd[1],a.fwd[0]);await push(Math.sin(rel)*50,-Math.cos(rel)*50,ms);};
 const openChanged=await tapDoor();for(let n=0;n<14&&dist((await where()).p,[4850,1600])>200;n++)await stickTo([4850,1600],500);const inBath=await where();
 assert.ok(record(vp,'Tocar la puerta (abrir)','la abre (la imagen cambia) y se puede pasar',JSON.stringify({open:await state(),changed:openChanged,room:inBath.room,at:inBath.p.map(Math.round),aim:await page.evaluate(()=>View3D.walkAim)}),await state()===true&&openChanged&&inBath.room==='Baño',await shot('tap-door-open')));
 await tap('#walkExit');await page.waitForTimeout(800);const out=await where();
 assert.ok(record(vp,'«Salir del recorrido»','vuelve a la vista aérea y oculta el joystick',JSON.stringify({mode:out.mode,joy:await page.locator('#joy').isVisible()}),out.mode==='orbit'&&!(await page.locator('#joy').isVisible()),await shot('exit')));
 assert.deepEqual(errors,[]);
});

// The entry panel says what the walk is, how to move on this device and how it differs from the presentation; one
// primary action; readable contrast. When the browser refuses the pointer (pointerlockerror), the walk falls back to
// the stick and drag, which work with a mouse, and W still moves.
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`entry panel and pointer refusal ${viewport.width}x${viewport.height}`,{timeout:600000,skip},async t=>{
 const vp=`${viewport.width}x${viewport.height}`,{page,errors,where,hold,tap,shot,mobile}=await open(t,viewport);
 await tap('[data-mode="walk"]');await page.waitForTimeout(300);
 const panel=await page.evaluate(()=>{const o=document.querySelector('#walkOverlay'),card=o.querySelector('.walk-card'),r=card.getBoundingClientRect();
  const lum=c=>{const v=c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return +((x+.05)/(y+.05)).toFixed(2);};const bg=getComputedStyle(card).backgroundColor;
  return {title:o.querySelector('h3').textContent,what:o.querySelector('#wo1').textContent,keys:o.querySelector('#wo2').textContent+' | '+o.querySelector('#wo3').textContent,note:o.querySelector('#wo4').textContent,
   hint:document.querySelector('#hint3d').textContent,primary:[...o.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent),inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,
   contrast:{title:ratio(getComputedStyle(o.querySelector('h3')).color,bg),body:ratio(getComputedStyle(o.querySelector('#wo2')).color,bg),note:ratio(getComputedStyle(o.querySelector('#wo4')).color,bg)}};});
 const ok=panel.title==='Recorre la vivienda'&&/Visita libre/.test(panel.what)&&/Presentar mi vivienda/.test(panel.note)&&panel.primary.length===1&&panel.primary[0]==='Empezar el recorrido'&&panel.inView&&Math.min(...Object.values(panel.contrast))>=4.5&&(mobile?!/WASD/.test(panel.hint):/WASD/.test(panel.hint));
 assert.ok(record(vp,'Panel de entrada','dice qué es, cómo moverse aquí y cómo enseñarla con paradas; un botón; contraste ≥ 4,5:1; cabe en pantalla; la ayuda superior coincide con el dispositivo',JSON.stringify(panel),ok,await shot('entry-panel')),JSON.stringify(panel));
 if(!mobile){
  await page.locator('#walkStart').click();await page.waitForTimeout(300);
  assert.ok(record(vp,'Botón «Empezar el recorrido»','captura el ratón',JSON.stringify({locked:(await where()).locked}),(await where()).locked));
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  // The browser refuses the pointer: the stick and drag appear, and W moves.
  await page.evaluate(()=>{Element.prototype.requestPointerLock=function(){setTimeout(()=>document.dispatchEvent(new Event('pointerlockerror')),0);};});
  await page.locator('#walkStart').click();await page.waitForTimeout(400);const a=await where();await hold(['KeyW'],900);const b=await where();
  const joy=await page.locator('#joy').isVisible();
  assert.ok(record(vp,'Captura del ratón rechazada','pasa a joystick y arrastrar; W sigue moviendo',JSON.stringify({joy,moved:Math.round(dist(a.p,b.p))}),joy&&dist(a.p,b.p)>80,await shot('lock-refused')));
 }
 assert.deepEqual(errors,[]);
});

// The same landscape phone-sized screen with two inputs: a mouse and keyboard (a small laptop window) and a touch
// screen. Every walk text visible there (panel, hint above the scene, footer) must describe only what works with
// that input, and the first instruction is then carried out.
for(const input of ['mouse','touch'])test(`844x390 with ${input}: only instructions that work with that input`,{timeout:600000,skip},async t=>{
 const vp=`844x390 ${input}`,{page,errors,where,hold,tap,shot}=await open(t,{width:844,height:390},null,input);
 await tap('[data-mode="walk"]');await page.waitForTimeout(300);
 const texts=await page.evaluate(()=>({panel:document.querySelector('#wo2').textContent+' | '+document.querySelector('#wo3').textContent,hint:document.querySelector('#hint3d').textContent,tip:document.querySelector('#tip').textContent}));
 // Everything the card shows is inside the scene and on screen: no instruction is cut off.
 const fit=await page.evaluate(()=>{const o=document.querySelector('#walkOverlay').getBoundingClientRect();return [...document.querySelectorAll('#walkOverlay .walk-card>*')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return {id:e.id,inside:r.top>=o.top-1&&r.bottom<=o.bottom+1&&r.bottom<=innerHeight};});});
 texts.cut=fit.filter(f=>!f.inside).map(f=>f.id);texts.shown=fit.map(f=>f.id);
 const all=[texts.panel,texts.hint,texts.tip].join(' | '),keyboard=/WASD|W A S D|ratón|Mayús|Shift|\bE\b|Esc/,touch=/joystick|arrastra|Toca|toca|dedo|Salir del recorrido/,orbitOnly=/mueble|suelo para editar|dos dedos/;
 const textsOk=!texts.cut.length&&texts.shown.includes('walkStart')&&texts.shown.includes('wo2')&&(input==='mouse'?keyboard.test(texts.panel)&&keyboard.test(texts.hint)&&!touch.test(all)&&!orbitOnly.test(all):touch.test(texts.panel)&&touch.test(texts.hint)&&!keyboard.test(all)&&!orbitOnly.test(all));
 assert.ok(record(vp,'Textos del recorrido',input==='mouse'?'solo teclado y ratón (panel, ayuda superior y pie); nada recortado':'solo joystick, arrastre y toque (panel, ayuda superior y pie); nada recortado',JSON.stringify(texts),textsOk,await shot('texts')),JSON.stringify(texts));
 const a=await where();
 if(input==='mouse'){await page.locator('#walkOverlay').click();const locked=(await where()).locked;await hold(['KeyW'],900);const b=await where();
  const moved=along(a.p,b.p,a.fwd);await page.keyboard.press('Escape');await page.waitForTimeout(400);const paused=await page.locator('#walkOverlay').isVisible();
  assert.ok(record(vp,'Clic, W y Esc','captura el ratón, W avanza y Esc pausa',JSON.stringify({locked,moved:Math.round(moved),paused}),locked&&moved>80&&paused,await shot('works')));}
 else{await tap('#walkOverlay');await page.waitForTimeout(300);const joy=await page.locator('#joy').boundingBox();const jx=joy.x+joy.width/2,jy=joy.y+joy.height/2;
  await page.mouse.move(jx,jy);await page.mouse.down();await page.mouse.move(jx,jy-50,{steps:4});await page.waitForTimeout(900);await page.mouse.up();await page.waitForTimeout(150);
  const b=await where(),moved=dist(a.p,b.p),exit=await page.locator('#walkExit').isVisible();
  assert.ok(record(vp,'Tocar, joystick y «Salir del recorrido» visible','el joystick mueve y la salida está a la vista',JSON.stringify({moved:Math.round(moved),exit}),moved>80&&exit,await shot('works')));}
 assert.deepEqual(errors,[]);
});

/* Counts the user actions Rubik needs today for one task: from an empty project to a named room with a door,
   a window, a verified floor finish and one wall finish. Drives the real UI at 1440x900 (mouse, 2D, no WebGL),
   records every action with the surface it happens on, and saves a screenshot per surface change.
   Usage: node scripts/qa/loralab/rubik-room-task.cjs <rubik checkout> <output dir> */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [root,out]=process.argv.slice(2).map(p=>path.resolve(p));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await require(path.join(root,'tests/editor-fixture.cjs'))(page);
 const log=[];let surface='editor',shots=0;
 const where=async()=>page.evaluate(()=>document.querySelector('dialog[open]')?.id||(document.querySelector('#tracePanel')&&!document.querySelector('#tracePanel').hidden?'tracePanel':'propertiesPanel'));
 async function act(label,fn){const before=await where();await fn();await page.waitForTimeout(150);const after=await where();log.push({n:log.length+1,label:label.replace(/^!/,''),surface:before,...(after!==before?{opens:after}:{})});
  if(after!==before||label.startsWith('!')){await page.screenshot({path:path.join(out,`${String(++shots).padStart(2,'0')}-${after}.png`)});}}
 const tapWorld=async q=>{const s=await page.evaluate(p=>{const svg=document.querySelector('#plan'),m=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());return {x:m.x,y:m.y};},q);await page.mouse.click(s.x,s.y);};
 await act('Nuevo proyecto',()=>page.click('#newProjectBtn'));
 await act('Escribir nombre del proyecto',()=>page.fill('#newProjectName','Prueba de tarea'));
 await act('Plano vacío',()=>page.click('#newProjectBlank'));
 await act('Escribir nombre de la estancia',()=>page.fill('#roomDesignName','Habitación de invitados'));
 await act('Escribir ancho',()=>page.fill('#roomDesignWidth','4000'));
 await act('Escribir profundidad',()=>page.fill('#roomDesignDepth','3000'));
 await act('!Ver cambio',()=>page.click('#roomDesignReview'));
 await act('Confirmar y guardar',()=>page.click('#roomDesignConfirm'));
 const room=await page.evaluate(()=>FloorPlanApp.project.rooms[0]),xs=room.polygon.map(p=>p.x),ys=room.polygon.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 await act('Plano propio (herramientas)',()=>page.click('#traceBtn'));
 await act('Puerta',()=>page.click('#traceDoor'));
 await act('Tocar el muro inferior',()=>tapWorld({x:(x0+x1)/2,y:y1+50}));
 await act('Ventana',()=>page.click('#traceWindow'));
 await act('Tocar el muro superior',()=>tapWorld({x:(x0+x1)/2,y:y0-50}));
 await act('Seleccionar/editar',()=>page.click('#traceEdit'));
 await act('Tocar la puerta',()=>tapWorld({x:(x0+x1)/2,y:y1+50}));
 await act('Escribir ancho de puerta 900',()=>page.fill('#traceEdit-widthMm','900'));
 await act('!Guardar geometría',()=>page.click('#traceEditSave'));
 const swingControl=await page.locator('#panel').evaluate(p=>/bisagra|sentido|apertura|hinge|swing/i.test(p.textContent));
 await act('Volver',()=>page.click('#traceEditBack'));
 await act('Navegar/cancelar',()=>page.click('#traceNavigate'));
 await act('Cerrar herramientas',()=>page.click('#traceHidePanel'));
 await act('Tocar la estancia',()=>tapWorld({x:x0+600,y:y0+600}));
 if(!(await page.locator('#surfaceFloor').count()))console.error('room not selected',JSON.stringify(await page.evaluate(()=>({tool:document.querySelector('#plan').getAttribute('class'),hit:document.elementFromPoint(700,250)?.outerHTML.slice(0,160),editing:!!document.querySelector('#traceEditSave'),panel:document.querySelector('#panel').textContent.slice(0,120)}))));
 const panelText=await page.locator('#panel').textContent();
 await act('Biblioteca de acabados · suelo',()=>page.click('#surfaceFloor'));
 await act('Elegir un acabado',()=>page.locator('#surfaceCards .surface-card:not([disabled])').first().click());
 await act('Aplicar',()=>page.click('#surfaceApply'));
 await act('Acabado de una pared',()=>page.click('#surfaceWall'));
 const wallOptions=await page.locator('#surfaceWallTarget option').allTextContents();
 await act('Elegir pared en la lista',()=>page.selectOption('#surfaceWallTarget',{index:1}));
 await act('Elegir un acabado',()=>page.locator('#surfaceCards .surface-card:not([disabled])').first().click());
 await act('Aplicar',()=>page.click('#surfaceApply'));
 const p=await page.evaluate(()=>FloorPlanApp.project);await page.reload();await require(path.join(root,'tests/editor-fixture.cjs'))(page).catch(()=>{});const q=await page.evaluate(()=>FloorPlanApp.project);
 const door=p.openings.find(o=>o.kind==='door'),win=p.openings.find(o=>o.kind==='window');
 const surfaces=log.reduce((n,a,i)=>n+(a.opens?1:0),0);
 const result={rubikRoot:root,viewport:'1440x900 mouse, 2D',actions:log.length,surfaceChanges:surfaces,log,
  outcome:{room:p.rooms[0]?.name,door:door&&{widthMm:door.widthMm,swing:door.swing},window:win&&{widthMm:win.widthMm,sillHeightMm:win.sillHeightMm},
   floorPreset:p.materials.find(m=>m.id===p.rooms[0].floorMaterialId)?.appearance.preset,wallFinishes:p.walls.filter(w=>w.surfaceMaterialId).length,
   persistedAfterReload:JSON.stringify(q.rooms)===JSON.stringify(p.rooms)&&JSON.stringify(q.openings)===JSON.stringify(p.openings)&&JSON.stringify(q.walls)===JSON.stringify(p.walls)},
  observed:{swingControlInOpeningPanel:swingControl,inlineFloorSwatchesInRoomPanel:/Flooring|地面材料|Suelo/i.test(panelText),wallTargetOptions:wallOptions.slice(0,3)},errors};
 await fs.writeFile(path.join(out,'task.json'),JSON.stringify(result,null,1));console.log(JSON.stringify({actions:result.actions,surfaceChanges:surfaces,outcome:result.outcome,observed:result.observed,errors},null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});

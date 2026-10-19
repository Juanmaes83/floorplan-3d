/* Repeats the task measured in #48 (scripts/qa/loralab/rubik-room-task.cjs) from an open project, at 1440x900 with
   the mouse in 2D: a 4000 x 3000 mm room «Habitación de invitados», a 900 mm door, an 800 mm window, a verified
   floor finish and one wall finish.
   Action = one user click, tap, field fill or option choice. Mode change = a control that changes what the next
   tap on the plan does («Plano propio» tools Puerta, Ventana, Seleccionar/editar, Navegar/cancelar; the new
   «Añadir puerta/ventana» pick). Creating the empty project and closing its automatic room dialog are not counted,
   as in #48, which counted from «+ Estancia».
   Usage: node scripts/qa/openings/room-task.cjs <rubik checkout> <out dir> <base|contextual> */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [root,out,flow='base']=process.argv.slice(2).map((v,i)=>i<2?path.resolve(v):v);
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await require(path.join(root,'tests/editor-fixture.cjs'))(page);
 await page.click('#newProjectBtn');await page.fill('#newProjectName','Prueba de tarea');await page.click('#newProjectBlank');await page.click('#roomDesignCancel');
 const log=[];let shots=0,section='estancia';
 async function act(label,fn,{mode=false,shot=false}={}){await fn();await page.waitForTimeout(150);log.push({n:log.length+1,section,label,...(mode?{modeChange:true}:{})});if(shot)await page.screenshot({path:path.join(out,`${flow}-${String(++shots).padStart(2,'0')}.png`)});}
 const tapWorld=async q=>{const s=await page.evaluate(p=>{const m=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},q);await page.mouse.click(s.x,s.y);};
 await act('+ Estancia',()=>page.click('#newRoomBtn'));
 await act('Escribir nombre de la estancia',()=>page.fill('#roomDesignName','Habitación de invitados'));
 await act('Escribir ancho',()=>page.fill('#roomDesignWidth','4000'));
 await act('Escribir profundidad',()=>page.fill('#roomDesignDepth','3000'));
 await act('Ver cambio',()=>page.click('#roomDesignReview'));
 await act('Confirmar y guardar',()=>page.click('#roomDesignConfirm'));
 const room=await page.evaluate(()=>FloorPlanApp.project.rooms[0]),xs=room.polygon.map(p=>p.x),ys=room.polygon.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const bottom={x:(x0+x1)/2,y:y1+120},top={x:(x0+x1)/2,y:y0-120};
 section='huecos';
 if(flow==='base'){
  await act('Plano propio (herramientas)',()=>page.click('#traceBtn'));
  await act('Puerta',()=>page.click('#traceDoor'),{mode:true});
  await act('Tocar el muro inferior',()=>tapWorld(bottom));
  await act('Ventana',()=>page.click('#traceWindow'),{mode:true});
  await act('Tocar el muro superior',()=>tapWorld(top));
  await act('Seleccionar/editar',()=>page.click('#traceEdit'),{mode:true});
  await act('Tocar la puerta',()=>tapWorld(bottom));
  await act('Escribir ancho de puerta 900',()=>page.fill('#traceEdit-widthMm','900'));
  await act('Guardar geometría',()=>page.click('#traceEditSave'),{shot:true});
  await act('Volver',()=>page.click('#traceEditBack'));
  await act('Navegar/cancelar',()=>page.click('#traceNavigate'),{mode:true});
  await act('Cerrar herramientas',()=>page.click('#traceHidePanel'));
 }else{
  await act('Añadir puerta',()=>page.click('#roomAddDoor'),{mode:true,shot:true});
  await act('Tocar el muro inferior',()=>tapWorld(bottom),{shot:true});
  await act('Escribir ancho de puerta 900',()=>page.fill('#opening-widthMm','900'));
  await act('Aplicar y añadir',()=>page.click('#openingApply'),{shot:true});
  await act('← Estancia',()=>page.click('#openingBack'));
  await act('Añadir ventana',()=>page.click('#roomAddWindow'),{mode:true});
  await act('Tocar el muro superior',()=>tapWorld(top));
  await act('Aplicar y añadir',()=>page.click('#openingApply'),{shot:true});
 }
 section='acabados';
 await act('Tocar la estancia',()=>tapWorld({x:x0+600,y:y0+600}));
 await act('Biblioteca de acabados · suelo',()=>page.click('#surfaceFloor'));
 await act('Elegir un acabado',()=>page.locator('#surfaceCards .surface-card:not([disabled])').first().click());
 await act('Aplicar',()=>page.click('#surfaceApply'));
 await act('Acabado de una pared',()=>page.click('#surfaceWall'));
 await act('Elegir pared en la lista',()=>page.selectOption('#surfaceWallTarget',{index:1}));
 await act('Elegir un acabado',()=>page.locator('#surfaceCards .surface-card:not([disabled])').first().click());
 await act('Aplicar',()=>page.click('#surfaceApply'),{shot:true});
 const p=await page.evaluate(()=>FloorPlanApp.project);await page.reload();await require(path.join(root,'tests/editor-fixture.cjs'))(page).catch(()=>{});const q=await page.evaluate(()=>FloorPlanApp.project);
 const door=p.openings.find(o=>o.kind==='door'),win=p.openings.find(o=>o.kind==='window'),count=s=>log.filter(a=>a.section===s).length;
 const commit=(await require('node:util').promisify(require('node:child_process').execFile)('git',['-C',root,'rev-parse','HEAD'])).stdout.trim();
 const result={flow,commit,viewport:'1440x900, mouse, 2D, software rendering without WebGL',definition:'action = click, tap, field fill or option choice; mode change = control that changes what the next plan tap does',
  actions:log.length,openings:{actions:count('huecos'),modeChanges:log.filter(a=>a.modeChange).length},bySection:{estancia:count('estancia'),huecos:count('huecos'),acabados:count('acabados')},log,
  outcome:{room:p.rooms[0]?.name,door:door&&{widthMm:door.widthMm,swing:door.swing,review:door.source?.review,opensIntoRoom:door.swing?await page.evaluate(([p,o])=>window.FloorPlanOpenings?FloorPlanOpenings.sides(p,o)[o.swing.side].roomId===p.rooms[0].id:null,[p,door]):null},window:win&&{widthMm:win.widthMm,sillHeightMm:win.sillHeightMm},
   floorPreset:p.materials.find(m=>m.id===p.rooms[0].floorMaterialId)?.appearance.preset,wallFinishes:p.walls.filter(w=>w.surfaceMaterialId).length,
   persistedAfterReload:JSON.stringify([q.rooms,q.openings,q.walls])===JSON.stringify([p.rooms,p.openings,p.walls])},errors};
 await fs.writeFile(path.join(out,`${flow}-task.json`),JSON.stringify(result,null,1));
 console.log(JSON.stringify({flow,commit:commit.slice(0,7),actions:result.actions,openings:result.openings,bySection:result.bySection,outcome:result.outcome,errors},null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});

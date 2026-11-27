async page => {
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.setViewportSize({width:1440,height:900});
 const snap=()=>page.evaluate(()=>({id:FloorPlanApp.entryId,project:structuredClone(FloorPlanApp.project)}));
 const area=p=>p.polygon? Math.abs(p.polygon.reduce((s,x,i)=>{const y=p.polygon[(i+1)%p.polygon.length];return s+x.x*y.y-x.y*y.x},0))/2e6:null;
 await page.getByLabel('Acciones del proyecto',{exact:true}).click();
 await page.locator('#newProjectBtn').click();
 await page.locator('#newProjectName').fill('Auditoría A · Patio claro');
 await page.locator('#newProjectBlank').click();
 const create=async(name,width,depth)=>{
  await page.locator('#roomDesignName').fill(name);
  await page.locator('#roomDesignWidth').fill(String(width));
  await page.locator('#roomDesignDepth').fill(String(depth));
  await page.locator('#roomDesignReview').click();
  const reviewError=await page.locator('#roomDesignError').textContent();
  if(reviewError) throw Error(reviewError);
  await page.locator('#roomDesignConfirm').click();
  await page.locator('#roomDesignConfirm').waitFor({state:'hidden'});
 };
 await create('Salón de lectura',5000,4000);
 const first=await snap();
 await page.locator('#paletteNewRoom').click();
 await page.locator('#roomDesignPlacement').selectOption(first.project.rooms[0].id+':right');
 await create('Estudio',3000,4000);
 const second=await snap();
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-2d.png'});
 await page.locator('#undo').click(); const undo=(await snap()).project.rooms.length;
 await page.locator('#redo').click(); const redo=(await snap()).project.rooms.length;
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&View3D.renderedSource===FloorPlanApp.project);
 await page.getByRole('button',{name:'Recorrer',exact:true}).click();
 const walk=await page.locator('[data-mode="walk"]').getAttribute('aria-pressed');
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-3d-recorrer.png'});
 await page.getByRole('button',{name:'Plano 2D',exact:true}).click();
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const reload=await snap();
 await page.getByLabel('Acciones del proyecto',{exact:true}).click();
 const [out]=await Promise.all([page.waitForEvent('download'),page.locator('#pmDownloadJson').click()]);
 await out.saveAs('AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-patio-claro.json');
 return {title:second.project.name,areas:second.project.rooms.map(r=>[r.name,area(r)]),wallCount:second.project.walls.length,undo,redo,walk,identityUnchanged:reload.id===second.id,geometryUnchanged:JSON.stringify(reload.project.rooms)===JSON.stringify(second.project.rooms)};
}


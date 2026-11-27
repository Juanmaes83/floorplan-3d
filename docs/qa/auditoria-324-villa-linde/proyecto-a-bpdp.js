async page => {
 const saved=()=>page.evaluate(()=>structuredClone(FloorPlanApp.project));
 const r=(await saved()).rooms[0];
 await page.locator('#panel tr[data-room="'+r.id+'"]').click();
 await page.locator('#panel [data-mat="mat_tile600"]').click();
 await page.locator('#paletteTabFurnish').click();
 const seat=page.locator('.item[data-key="0:0"]').first();
 await seat.click();
 const now=await saved();
 await page.getByRole('button',{name:'Escena 3D',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 const outcome={project:now.name,material:now.rooms[0].floorMaterialId,objects:now.objects.length};
 const open=async (mod,card)=>{
  const key=page.locator('#bpdpOpen-'+mod);
  if(!(await key.isVisible())){
   await page.locator('[data-entrega-code="'+card+'"] .perla-card-selector').click({position:{x:12,y:12}});
   const panel=page.locator('.perla-panel-open');
   await panel.getByRole('button',{name:mod==='blueprint'?'Abrir Blueprint':'Abrir Despiece',exact:true}).click();
  }else await key.click();
  await page.waitForFunction(()=>Boolean(window.BPDP?.studio));
  return page.locator('dialog.bpdp-host[open]');
 };
 let d=await open('blueprint','P8');
 const views=[];
 for(const v of ['plan','section','elev']){const b=d.locator('[data-view="'+v+'"]');if(!(await b.isVisible())) await d.locator('[data-intent="clean"]').click(); await b.click(); views.push(await page.evaluate(()=>BPDP.app.state.view));}
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-blueprint.png'});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.BpdpEntregar.abierta);
 d=await open('despiece','P9');
 const original=await page.evaluate(()=>JSON.stringify(BPDP.studio.transformSignature()));
 await d.getByRole('button',{name:'Separar',exact:true}).click();
 await page.waitForFunction(()=>BPDP.app.state.A===0&&!BPDP.app.state.playing);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-a-despiece.png'});
 await d.getByRole('button',{name:'Ensamblar',exact:true}).click();
 await page.waitForFunction(()=>BPDP.app.state.A===1&&!BPDP.app.state.playing);
 const equal=await page.evaluate(s=>JSON.stringify(BPDP.studio.transformSignature())===s,original);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.BpdpEntregar.abierta);
 return {...outcome,views,reassembled:equal,projectUnchanged:JSON.stringify(now)===JSON.stringify(await saved())};
}

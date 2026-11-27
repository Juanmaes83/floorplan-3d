async page => {
 const assert=(test,label)=>{if(!test)throw Error(label)};
 const path='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 await page.setViewportSize({width:1440,height:900});
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(path+'villa-linde-edificio.json');
 await page.waitForFunction(()=>window.FloorPlanApp?.levelContext?.levels===2);
 console.log('IMPORT',await page.evaluate(()=>({context:FloorPlanApp.levelContext,rooms:FloorPlanApp.project.rooms.length,title:document.title})));
 await page.screenshot({path:path+'01-villa-plano.png'});
 for(const tab of ['Analizar','Presupuestar','Entregar']){
  await page.getByRole('button',{name:tab,exact:true}).first().click();
  const panel=page.locator('#professionalWorkspace');
  await panel.waitFor({state:'visible'});
  console.log(tab,(await panel.innerText()).slice(0,1700));
  await page.screenshot({path:path+tab+'.png'});
 }
 await page.getByRole('button',{name:'Diseñar',exact:true}).first().click();
 await page.getByRole('button',{name:'Escena 3D',exact:true}).first().click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
 const both=page.locator('#levelViewAll');
 if(await both.isVisible())await both.click();
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 console.log('VIEW',await page.evaluate(()=>({view:FloorPlanApp.viewMode,levelView:View3D.levelView,context:FloorPlanApp.levelContext,canvases:[...document.querySelectorAll('canvas')].filter(c=>c.clientWidth>0).map(c=>[c.width,c.height])})));
 await page.screenshot({path:path+'02-villa-3d.png'});
}

async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.keyboard.press('Escape');
 if(await page.locator('#presentationClose').isVisible())await page.locator('#presentationClose').click();
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.evaluate(()=>{const root=library.list().find(e=>e.id==='prj_4d7ab34fcbbc4ca29f8758258039d178'); if(!root)throw Error('Missing original');FloorPlanApp.openEntry(root.id);});
 await page.waitForFunction(()=>FloorPlanApp.levelContext?.buildingId==='bld_linde-aprobada');
 await page.locator('#presentationBtn').click();
 await page.locator('#presentationLivingDrawing').check();
 const brand=await page.evaluate(()=>({marca:FloorPlanBrandUI.snapshot()?.profile?.name,estudio:window.RubikStudioHero?.leer?.(),id:FloorPlanApp.levelContext.buildingId}));
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing',null,{timeout:35000});
 const state=await page.waitForFunction(()=>{const h=window.RubikFinalDibujoUI?.ultimo?.hero;if(h?.fin)return 'hero';if(!FloorPlanPresentation.story)return 'final-sin-hero';return false;},null,{timeout:120000}).then(x=>x.jsonValue());
 const title=page.locator('#rfDibujoTitulos');
 await page.screenshot({path:out+'HERO-dibujo-vivo.png'});
 return {brand,state,rendered:await title.count(),alpha:await title.first().getAttribute('data-firma',{timeout:1500}).catch(()=>null)};
}


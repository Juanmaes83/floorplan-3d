async page => {
 await page.getByRole('button',{name:'Personalizar el cierre en Mi estudio',exact:true}).click();
 await page.getByRole('button',{name:'Crear mi firma profesional',exact:true}).click();
 await page.locator('#brand-name').fill('Estudio Taller QA');
 await page.locator('#brandSave').click();
 await page.locator('#brandDialog .brand-status').filter({hasText:'guardada'}).waitFor();
 await page.locator('#brandClose').click();
 await page.locator('#professionalBrandChoice select').selectOption({label:'Estudio Taller QA'});
 await page.locator('#shClosing').fill('Cierre de prueba Casa Taller');
 await page.locator('#shClosing').press('Tab');
 const c=page.locator('[data-module="studio-hero"]');
 await c.locator('input[name="shStyle"][value="editorial"]').check();
 await c.locator('canvas').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-c-hero.png'});
 const before=await page.evaluate(()=>({id:FloorPlanApp.entryId,name:FloorPlanApp.levelContext.buildingName,brand:FloorPlanBrandUI.snapshot().profile?.name,hero:FloorPlanBrandUI.snapshot().hero}));
 return {before,closing:await c.locator('#shClosing').inputValue(),editorial:await c.locator('input[name="shStyle"][value="editorial"]').isChecked()};
}

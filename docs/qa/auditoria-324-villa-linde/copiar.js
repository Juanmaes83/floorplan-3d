async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.reload();
 await page.getByRole('button',{name:'Diseñar',exact:true}).click();
 await page.getByLabel('Acciones del proyecto',{exact:true}).click();
 await page.getByRole('menuitem',{name:/^Crear copia/}).click();
 return {id:await page.evaluate(() => window.FloorPlanApp.entryId), dialogs:await page.locator('dialog[open]').allTextContents(), project:await page.getByRole('button',{name:/^Proyecto activo/}).getAttribute('aria-label')};
}

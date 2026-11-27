async page => {
 const field = page.locator('#dc-client-name').or(page.getByRole('textbox',{name:'Nombre del cliente',exact:true}));
 const before = await field.inputValue();
 await field.fill('Cliente QA sintetico');
 const visibleWhileTyping = await field.inputValue();
 await page.getByRole('button',{name:'Siguiente: nota de presentación'}).click();
 await page.getByRole('button',{name:'1 · Cliente y contacto'}).click();
 const after = await field.inputValue();
 return {before, visibleWhileTyping, after, liveNotices: await page.getByRole('status').allTextContents()};
}

async page => {
 const open = async () => {
  await page.goto('http://127.0.0.1:18765/#editor'); await page.reload();
  await page.getByRole('button',{name:'Entregar',exact:true}).click();
  await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
  await page.getByRole('combobox',{name:'Estilo'}).selectOption('client');
  return page.getByRole('textbox',{name:'Nombre del cliente',exact:true});
 };
 const roundTrip = async field => {
  await page.getByRole('button',{name:'Siguiente: nota de presentación'}).click();
  await page.getByRole('button',{name:'1 · Cliente y contacto'}).click();
  return field.inputValue();
 };
 const desktop = await open();
 await desktop.fill('Control QA');
 const normal = await roundTrip(desktop);
 const identity = () => page.evaluate(() => ({project:window.FloorPlanApp.entryId, saved:Object.keys(JSON.parse(localStorage.getItem('rubik-dossier-client-v1') || '{}'))})); const initialIdentity = await identity(); const afterReload = await (await open()).inputValue(); const reloadedIdentity = await identity();
 await page.setViewportSize({width:390,height:844});
 const mobile = await open();
 await page.evaluate(() => {
  const write = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
   if (key === 'rubik-dossier-client-v1') throw new DOMException('QA','QuotaExceededError');
   return write.call(this,key,value);
  };
 });
 await mobile.fill('Cambio movil QA');
 const mobileWhileTyping = await mobile.inputValue();
 const mobileAfter = await roundTrip(mobile);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/d3-movil-despues.png'});
 return {normal,afterReload,initialIdentity,reloadedIdentity,mobileWhileTyping,mobileAfter,liveNotices:await page.getByRole('status').allTextContents()};
}



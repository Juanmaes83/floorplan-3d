async page => {
 await page.evaluate(() => { const real = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if (k === "rubik-dossier-client-v1") throw new DOMException("QA: almacenamiento indisponible","QuotaExceededError"); return real.call(this,k,v); }; });
 const field = page.getByRole("textbox", {name:"Nombre del cliente"});
 await field.fill("Cliente QA sintetico");
 console.log("ANTES=" + await field.inputValue());
 await page.screenshot({path:"AUDIT_WORKSPACE/output/auditoria-324/d3-antes.png"});
 await page.getByRole("button",{name:"Siguiente: nota de presentación"}).click();
 await page.getByRole("button",{name:"1 · Cliente y contacto"}).click();
 console.log("DESPUES=" + JSON.stringify(await field.inputValue()));
 console.log("AVISOS=" + JSON.stringify(await page.getByRole("status").allTextContents()));
 await page.screenshot({path:"AUDIT_WORKSPACE/output/auditoria-324/d3-despues.png"});
}

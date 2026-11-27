async page => {
 const out={};
 await page.locator('#uploadIn').setInputFiles('AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/villa-linde-aprobada.json');
 await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels>=2,null,{timeout:60000});
 await page.locator('#workArea-deliver').click();await page.waitForTimeout(1500);
 const btns=await page.evaluate(()=>[...document.querySelectorAll('#bpdpCard-blueprint button')].map(b=>b.textContent.trim()));
 await page.evaluate(()=>{const b=[...document.querySelectorAll('#bpdpCard-blueprint button')].find(b=>/Abrir|Ver/.test(b.textContent));b?.click();});
 await page.waitForFunction(()=>!!window.BPDP?.studio,null,{timeout:120000});await page.waitForTimeout(2000);
 await page.evaluate(()=>{BPDP.app.setView('section');});await page.waitForTimeout(1500);
 for(const vp of [[1600,1000],[1440,900],[1280,800],[844,390],[390,844]]){await page.setViewportSize({width:vp[0],height:vp[1]});await page.waitForTimeout(900);
  await page.screenshot({path:'v09app-'+vp.join('x')+'.png'});
  out[vp.join('x')]=await page.evaluate(()=>[...document.querySelectorAll('.dock .seg .btn')].map(b=>({t:b.textContent,w:Math.round(b.getBoundingClientRect().width),sw:b.scrollWidth,cw:b.clientWidth})));}
 return {btns,out};
}

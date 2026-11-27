async page => {
 const out={};
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#workArea-deliver').click();await page.waitForTimeout(1500);
 const btns=await page.evaluate(()=>[...document.querySelectorAll('#bpdpCard-blueprint button')].map(b=>b.textContent.trim()));
 await page.locator('#bpdpOpen3d-blueprint').evaluate(b=>b.click());
 await page.waitForSelector('#bpdpOpen-blueprint',{timeout:120000});await page.locator('#bpdpOpen-blueprint').evaluate(b=>b.click());
 await page.waitForFunction(()=>!!window.BPDP?.studio,null,{timeout:120000});await page.waitForTimeout(2000);
 await page.evaluate(()=>{BPDP.app.setView('section');});await page.waitForTimeout(1500);
 for(const vp of [[1600,1000],[1440,900],[1280,800],[844,390],[390,844]]){await page.setViewportSize({width:vp[0],height:vp[1]});await page.waitForTimeout(900);
  await page.screenshot({path:'v09app-'+vp.join('x')+'.png'});
  out[vp.join('x')]=await page.evaluate(()=>[...document.querySelectorAll('.dock .seg .btn')].map(b=>({t:b.textContent,w:Math.round(b.getBoundingClientRect().width),sw:b.scrollWidth,cw:b.clientWidth})));}
 return {btns,out};
}

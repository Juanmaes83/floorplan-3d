async page => {
 const out={};await page.goto(page.url().replace(/#.*$/,'')+'#inicio');await page.locator('#welcomeDemo-blueprint-3d').click();
 await page.waitForFunction(()=>!!window.BPDP?.studio,null,{timeout:90000});await page.waitForTimeout(1500);
 await page.locator('.dock').getByRole('button',{name:'Sección',exact:true}).first().click().catch(()=>{});await page.waitForTimeout(1200);
 for(const vp of [[1600,1000],[1440,900],[1280,800],[844,390],[390,844]]){await page.setViewportSize({width:vp[0],height:vp[1]});await page.waitForTimeout(700);
  await page.screenshot({path:'v09s-'+vp.join('x')+'.png'});
  out[vp.join('x')]=await page.evaluate(()=>[...document.querySelectorAll('.dock .seg .btn')].map(b=>({t:b.textContent,w:Math.round(b.getBoundingClientRect().width),sw:b.scrollWidth,cw:b.clientWidth})));}
 return out;
}

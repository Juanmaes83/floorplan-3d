async page => {
 const logs=[];page.on('console',m=>{if(m.type()==='error')logs.push(m.text().slice(0,200));});page.on('requestfailed',r=>logs.push('FAIL '+r.url().slice(0,120)));
 await page.goto(page.url().replace(/#.*$/,'')+'#inicio');await page.waitForTimeout(1500);
 const href=await page.evaluate(()=>{const b=document.getElementById('welcomeDemo-blueprint-3d');return b?b.outerHTML.slice(0,200):'NO BOTON';});
 await page.locator('#welcomeDemo-blueprint-3d').click().catch(e=>logs.push('click '+e.message.slice(0,100)));await page.waitForTimeout(8000);
 return {href,url:page.url(),bp:await page.evaluate(()=>!!window.BPDP),logs:logs.slice(0,12)};
}

/* ENT-01 I1B: the real RUBIK WebGL engine with a strict client snapshot. Synthetic example only.
   No requests to /api/share, /api/delivery, /api/unshare or a real Blob store. */
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
let server,browser,url;
before(async()=>{
 server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://local'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error('unsafe');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 url='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server.close(resolve));});
const track=ctx=>{const requests=[];ctx.on('request',r=>{const u=r.url();if(/\/api\/(share|unshare|delivery)/.test(u))requests.push(u);});return requests;};
async function professional(ctx){
 const page=await ctx.newPage();page.setDefaultTimeout(30000);await page.goto(url);
 await page.locator('#welcomeExample').click();
 await page.waitForFunction(()=>window.FloorPlanDeliveryPreview?.eligible()===true);
 await page.locator('#workArea-deliver').click();
 await page.locator('#delivery3dPreview').waitFor();
 return page;
}
async function clientTab(ctx,pro){
 const [client]=await Promise.all([ctx.waitForEvent('page'),pro.locator('#delivery3dPreview').click()]);
 client.setDefaultTimeout(45000);
 await client.waitForFunction(()=>window.FloorPlanDeliveryClient?.state==='ready',null,{timeout:120000});
 return client;
}
test('I1B desktop: strict snapshot, no upload or editor, real walk, minimap room switch, exit',{timeout:450000},async t=>{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>ctx.close());const requests=track(ctx);
 const pro=await professional(ctx),beforeProject=await pro.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const client=await clientTab(ctx,pro);
 assert.equal(await client.locator('#deliveryPreviewNote').count(),1);
 assert.equal(await client.locator('#deliveryWalk').isVisible(),true);
 assert.equal(await client.evaluate(()=>window.RUBIK_DELIVERY.preview),true);
 assert.equal(await client.evaluate(()=>FloorPlanDeliveryClient.snapshot.schema),'rubik-sota.client-delivery');
 assert.equal(await client.evaluate(()=>window.localStorage.getItem('rubik-render-token')),null,'professional render credential does not reach the client');
 assert.equal(await client.locator('#professionalWorkspace:visible').count(),0,'editor not presented');
 await client.locator('#deliveryWalk').click();
 await client.waitForFunction(()=>window.View3D?.walking()&&!!document.querySelector('#deliveryMap'),null,{timeout:90000});
 const count=await client.locator('#deliveryMap polygon[data-room-id][role=button]').count();assert.ok(count>=2,'real rooms in minimap');
 const first=await client.locator('#deliveryMap polygon[data-room-id]').first().getAttribute('data-room-id');
 await client.locator('#deliveryMap polygon[data-room-id]').first().click({force:true});
 await client.waitForFunction(id=>FloorPlanDeliveryClient.map?.room===id,first,{timeout:30000});
 await client.locator('#deliveryMapToggle').click();assert.equal(await client.locator('#deliveryMapPanel').isVisible(),false);
 await client.locator('#deliveryExit').click();
 await client.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate'&&!View3D.walking(),null,{timeout:30000});
 assert.deepEqual(requests,[],'preview never contacts publication or Blob endpoints');
 assert.equal(await pro.evaluate(()=>JSON.stringify(FloorPlanApp.project)),beforeProject,'professional project unchanged');
});
test('I1B mobile portrait: touch controls and responsive minimap; no horizontal overflow',{timeout:450000},async t=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});t.after(()=>ctx.close());const requests=track(ctx);
 const pro=await professional(ctx),client=await clientTab(ctx,pro);
 assert.equal(await client.locator('#deliveryWalk').isVisible(),true);
 await client.locator('#deliveryWalk').click();
 await client.waitForFunction(()=>window.View3D?.walking()&&!!document.querySelector('#deliveryMap'),null,{timeout:90000});
 assert.equal(await client.evaluate(()=>matchMedia('(pointer: coarse)').matches),true,'mobile test must emulate a coarse pointer');
 assert.equal(await client.locator('#walkStart').isVisible(),true,'real 3D walk shows the explicit Start step');
 await client.locator('#walkStart').click();
 await client.locator('#joy').waitFor({state:'visible',timeout:15000});
 assert.equal(await client.locator('#walkOverlay').isVisible(),false,'start action hides the walk entry card');
 assert.equal(await client.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2),false,'no horizontal overflow');
 const toggle=client.locator('#deliveryMapToggle');assert.equal(await toggle.isVisible(),true);
 await toggle.click();assert.equal(await client.locator('#deliveryMapPanel').isVisible(),false);
 await client.locator('#deliveryExit').click();
 await client.waitForFunction(()=>FloorPlanDeliveryClient.mode==='gate',null,{timeout:30000});
 assert.deepEqual(requests,[]);
});
test('I1B direct preview link without an approved opener cannot load a project',{timeout:90000},async t=>{
 const ctx=await browser.newContext();t.after(()=>ctx.close());const requests=track(ctx),page=await ctx.newPage();
 await page.goto(url+'?entrega=vista-previa');
 await page.waitForFunction(()=>window.FloorPlanDeliveryClient?.state==='error',null,{timeout:35000});
 assert.equal(await page.locator('#deliveryWalk').count(),0);
 assert.match(await page.locator('#deliveryGate h1').innerText(),/no está disponible|could not|not available/i);
 assert.deepEqual(requests,[]);
});

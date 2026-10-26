# Builds a step-timed copy of P13 (measurement only, 400 s window, never committed). argv: src dst
import sys,re
s=open(sys.argv[1]).read()
i=s.index("test(`R2 P13 presentation PNG"); j=s.index("\n});",i)+4
body=s[i:j]
body=body.replace("{timeout:150000},async t=>{","{timeout:400000},async t=>{const T=Date.now(),L=x=>console.log('STEP',x,((Date.now()-T)/1000).toFixed(1));",1)
marks=[("consoleErrors=[];","setup"),
 ("await (await presentEntry(page)).click();","entry"),("await page.locator('#guidePresent').click();","entry"),
 ("await page.getByRole('button',{name:'Iniciar presentación'}).click();","start-click"),
 ("dataset.moving==='false',null,{timeout:30000});","presenting"),
 ("const general=await viewState(),generalPng=await presentationPng(page);","overview-png"),
 ("await screenshot(page,`${size}-p13-overview`);","overview-shot"),
 ("await page.getByRole('button',{name:'Siguiente →'}).click();","next-click"),
 ("window.__motion.some(m=>m.moving==='true'),null,{timeout:30000});","motion-seen"),
 ("textContent.includes('Vista 2'));","arrived"),
 ("const room=await viewState(),roomPng=await presentationPng(page);","room-png"),
 ("await screenshot(page,`${size}-p13-room`);","room-shot"),
 ("await page.locator('#presentationClose').click();","close-click")]
for a,b in marks:
    if a not in body: print('skip marker',b); continue
    e=body.index(a)+len(a)
    # place the marker after the statement ending at e
    body=body[:e]+f"L('{b}');"+body[e:]
open(sys.argv[2],'w').write(s[:i]+body+s[j:])

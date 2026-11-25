// §2 · Home → «Hablar con el Asesor» (6 perfiles, ida y vuelta, teclado y toque) con registro de peticiones externas.
const {chromium}=require('playwright'),fs=require('fs');(async()=>{const [,,tree,W,H,out]=process.argv;const s=await require(process.env.SERVE||'../probe/serve.cjs')(tree);const b=await chromium.launch();
const mobile=+W<700;const ctx=await b.newContext({viewport:{width:+W,height:+H},hasTouch:mobile,isMobile:mobile});const ext=[];
await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='localhost'){ext.push(u.hostname+u.pathname);return r.abort();}return r.continue();});
const p=await ctx.newPage();const err=[];p.on('pageerror',e=>err.push(e.message));const base=`http://localhost:${s.address().port}/`;const res=[];
const ids=['architecture','real-estate','developer','renovation','interior','construction'];
for(const [i,id] of ids.entries()){await p.goto(base+'#inicio');await p.locator('#welcomeDialog[open]').waitFor({timeout:120000});
 const opt=p.locator('#welcomeAudience-'+id);await opt.scrollIntoViewIfNeeded();
 if(mobile)await opt.tap();else if(i%2){await opt.focus();await p.keyboard.press('Enter');}else await opt.click();
 const talk=p.locator('#welcomeAudienceAdvisor');await talk.waitFor();const href=await talk.getAttribute('data-href');
 const box=await talk.boundingBox();if(i===0&&out)await p.locator('.welcome-audience-purpose').screenshot({path:`${out}/home-asesor-${W}x${H}.png`});
 if(mobile)await talk.tap();else if(i%2){await talk.focus();await p.keyboard.press('Enter');}else await talk.click();
 await p.waitForURL(/labs\/asesor-rubik/);await p.locator('#profile').waitFor();
 const lab=await p.evaluate(()=>({perfil:document.getElementById('profile').value,saludo:document.querySelector('.profile-greeting')?.textContent,ejemplos:[...document.querySelectorAll('#chips .chip[data-profile-example]')].map(c=>c.textContent),badge:document.getElementById('badgeSim').textContent,estado:document.getElementById('state')?.textContent,vuelta:!!document.getElementById('advBackHome')}));
 if(i===0&&out)await p.screenshot({path:`${out}/asesor-perfil-${W}x${H}.png`});
 const back=p.locator('#advBackHome');if(mobile)await back.tap();else await back.click();await p.locator('#welcomeDialog[open]').waitFor({timeout:120000});
 res.push({id,href,alto:Math.round(box.height),...lab,vuelveAHome:true});}
console.log(JSON.stringify({W,H,res,externas:ext,errores:err},null,1));if(out)fs.writeFileSync(`${out}/asesor-home-${W}x${H}.json`,JSON.stringify({res,externas:ext,errores:err},null,1));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(2);});

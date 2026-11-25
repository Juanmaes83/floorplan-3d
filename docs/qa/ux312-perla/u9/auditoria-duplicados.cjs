// Igual que dup.cjs, pero recorre la página desplazando y cuenta solo duplicados VISIBLES A LA VEZ en la pantalla.
const {chromium}=require('/home/user/pwcli/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'});
for(const [w,h,m] of [[1440,900,false],[390,844,true]]){const p=await (await b.newContext({viewport:{width:w,height:h},isMobile:m,hasTouch:m})).newPage();
await p.goto('http://127.0.0.1:43984/');await p.waitForFunction(()=>window.FloorPlanProfessionalUI);await p.evaluate(()=>document.querySelector('#welcomeExample').click());await p.waitForTimeout(900);
for(const a of ['design','analyze','budget','deliver','studio']){
 if(a==='design')await p.evaluate(()=>FloorPlanProfessionalUI.close());else await p.evaluate(a=>FloorPlanProfessionalUI.open(a),a);await p.waitForTimeout(800);
 const d=await p.evaluate(async()=>{const s=document.querySelector('#professionalWorkspace');const sc=s&&!s.hidden?s:document.scrollingElement;const found=new Set();
  for(let y=0;y<=sc.scrollHeight;y+=Math.round(innerHeight*0.5)){sc.scrollTop=y;await new Promise(r=>setTimeout(r,120));
   const m=new Map();for(const e of document.querySelectorAll('button,a[href],summary,[role=button],[role=tab]')){if(!e.checkVisibility()||getComputedStyle(e).visibility==='hidden'||e.closest('dialog:not([open])'))continue;const r=e.getBoundingClientRect();if(r.width<2||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)continue;
    const top=document.elementFromPoint(Math.min(innerWidth-1,r.left+r.width/2),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));if(!(top===e||e.contains(top)))continue;
    const n=(e.getAttribute('aria-label')||e.textContent||'').replace(/\s+/g,' ').trim();if(n)(m.get(n)||m.set(n,[]).get(n)).push(1);}
   for(const [n,l] of m)if(l.length>1)found.add(n.slice(0,40)+' ×'+l.length);}
  return [...found];});
 console.log(`${w} ${a}:`,d.length?d.join(' · '):'sin duplicados a la vista');}
}
await b.close();})();

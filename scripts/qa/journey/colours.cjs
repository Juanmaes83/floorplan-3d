/* Reproducible colour inventory of the application chrome in real states (premium «Perla», cut B of
   docs/product/journey-orientation-2026-10-21.md §6). For every visible element outside the content (plan SVG, 3D
   canvas, material and furniture swatches, brand logos) it reads the computed background, border and text colours and
   flags warm hues (cream/orange/brown: hue 15–55°, saturation > 0.12) that «Perla» does not define. Each state saves a
   screenshot with the flagged elements outlined and the inventory JSON.
   Usage: node scripts/qa/journey/colours.cjs <checkout> <outdir> [1440x900 390x844] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
function scan(){
 const CONTENT='#plan,#plan *,canvas,.mat,.mat *,.item svg,.item svg *,.surface-card img,.surface-swatch,.brand-logo,.presentation-brand img,.welcome-visual svg,.welcome-visual svg *,.presentation-minimap svg,.presentation-minimap svg *,#roomDesignSvg,#roomDesignSvg *,.variant-plan,.variant-plan *,#sheetPreview,#sheetPreview *,.room-swatch,[data-swatch]';
 const rgba=c=>{const m=String(c).match(/[\d.]+/g)||[];return {r:+m[0]||0,g:+m[1]||0,b:+m[2]||0,a:m.length>3?+m[3]:1};};
 const hsl=({r,g,b})=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return {h:0,s:0,l};const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;return {h,s,l};};
 const warm=c=>{const v=rgba(c);if(v.a<.15)return false;const x=hsl(v);return x.h>=15&&x.h<=55&&x.s>.12;};
 const hex=c=>{const v=rgba(c);return '#'+[v.r,v.g,v.b].map(n=>Math.round(n).toString(16).padStart(2,'0')).join('')+(v.a<1?`@${v.a}`:'');};
 const vis=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return true;};
 const path=e=>{const parts=[];for(let n=e;n&&n!==document.body&&parts.length<4;n=n.parentElement)parts.unshift(n.id?`#${n.id}`:n.tagName.toLowerCase()+(n.classList.length?'.'+[...n.classList].slice(0,2).join('.'):''));return parts.join(' > ');};
 const found=[];
 for(const e of document.querySelectorAll('body *')){if(e.matches(CONTENT)||!vis(e))continue;const s=getComputedStyle(e);
  for(const [prop,val] of [['background',s.backgroundColor],['border',s.borderTopWidth!=='0px'&&s.borderTopStyle!=='none'?s.borderTopColor:'transparent'],['text',e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())?s.color:'transparent']])
   if(warm(val)){found.push({element:path(e),prop,colour:hex(val),text:(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40)});e.style.outline='2px dashed #d0021b';e.style.outlineOffset='-1px';}}
 return found;
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const report={commit:require('node:child_process').execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim(),states:[]};
 for(const [w,h] of VPS){const narrow=w<=1100,vp=`${w}x${h}`;
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const press=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();await page.waitForTimeout(350);};
  const state=async(id,label)=>{await page.waitForTimeout(400);const found=await page.evaluate(scan);await page.screenshot({path:path.join(out,`${vp}-${id}.png`)});await page.evaluate(()=>{for(const e of document.querySelectorAll('[style*="outline"]'))e.style.outline='';});report.states.push({viewport:vp,id,label,found});console.log(vp,id,found.length);};
  const closeDrawers=async()=>{for(const [a,t] of [['aside.lib','#tgLib'],['aside.right','#tgPanel']])if(await page.evaluate(s=>matchMedia('(max-width:1100px)').matches&&document.querySelector(s).classList.contains('open'),a))await press(t);};
  await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI);await state('welcome','Bienvenida');
  await press('#welcomeBlank');await page.locator('#roomDesignName').fill('Salón');await state('room-dialog','Diálogo «Nueva estancia»');await press('#roomDesignReview');await state('room-preview','Vista previa de la estancia');await press('#roomDesignConfirm');
  await state('editor-room','Editor con la estancia seleccionada');await closeDrawers();
  await press('#tgLib');await press('#paletteTabBuild');await state('palette-build','Paleta «Construir»');await press('#paletteTabFurnish');await state('palette-furnish','Paleta «Amueblar»');await closeDrawers();
  await press('#guideDetails');await state('guide-dialog','«Tareas y ayuda»');await press('#guideDialogClose');
  if(narrow&&!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))))await press('#tgPanel');
  if(await page.locator('#surfaceFloor').isVisible()){await press('#surfaceFloor');await state('surface-dialog','Diálogo de acabados');await page.keyboard.press('Escape');}
  await closeDrawers();await press('#projectsBtn');await state('projects','Proyectos');await page.keyboard.press('Escape');
  await press('#presentationBtn').catch(async()=>{await press('#guideDetails');await press('#guideAllTools');await closeDrawers();await press('#presentationBtn');});
  await page.locator('#presentationConfig[open]').waitFor({timeout:8000}).catch(()=>{});await state('presentation-config','Configurar presentación');
  if(await page.locator('#brandConfigManage').isVisible()){await press('#brandConfigManage');await state('brand-dialog','«Tu marca profesional»');await page.keyboard.press('Escape');}
  await ctx.close();}
 await fs.writeFile(path.join(out,'colours.json'),JSON.stringify(report,null,1));
 const sum={};for(const s of report.states)for(const f of s.found){const k=`${f.element} · ${f.prop} ${f.colour}`;(sum[k]=sum[k]||new Set()).add(`${s.viewport}/${s.id}`);}
 console.log(Object.entries(sum).map(([k,v])=>`${k}  [${[...v].join(', ')}]`).join('\n'));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});

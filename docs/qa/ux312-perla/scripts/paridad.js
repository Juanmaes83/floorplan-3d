async page => { const out={};
 for (const [port,tag] of [[43985,'base'],[43984,'perla']]) { await page.setViewportSize({width:1536,height:1024});
  await page.goto(`http://127.0.0.1:${port}/#inicio`); await page.evaluate(()=>localStorage.clear()); await page.reload(); await page.locator('#welcomeExample').click(); await page.waitForTimeout(1500);
  out[tag]=await page.evaluate(()=>{const v=s=>{const n=document.querySelector(s);return !!n&&n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden';};
   const ids=['tools','newRoomBtn','levelsBtn','traceBtn','scaleConfidence','uploadPlanHelp','guideResume','editHistory','exportJsonQuick','presentationBtn','projectsBtn','fullscreen','layersMenu','modes3d'];
   const r={};for(const id of ids)r[id]=v('#'+id);
   r.paletaSeleccionar=[...document.querySelectorAll('#paletteBuild button')].some(b=>/Seleccionar/.test(b.textContent)&&b.getClientRects().length);
   r.paletaMedir=[...document.querySelectorAll('#paletteBuild button')].some(b=>/Medir/.test(b.textContent)&&b.getClientRects().length);
   r.paletaNuevaEstancia=[...document.querySelectorAll('#paletteBuild button,#paletteBuild [id]')].some(b=>/Nueva estancia/.test(b.textContent)&&b.getClientRects().length);
   r.paletaPlantas=[...document.querySelectorAll('#paletteBuild button')].some(b=>/Plantas/.test(b.textContent)&&b.getClientRects().length);
   r.paletaPlanoPropio=[...document.querySelectorAll('#paletteBuild button')].some(b=>/Plano propio|Calcar/.test(b.textContent)&&b.getClientRects().length);
   r.escalaPie=document.querySelector('footer')?.textContent.match(/Escala[^·]{0,20}/)?.[0]||'';
   r.scaleConfText=document.querySelector('#scaleConfidence')?.textContent.trim().slice(0,60);
   return r;});}
 return JSON.stringify(out);}

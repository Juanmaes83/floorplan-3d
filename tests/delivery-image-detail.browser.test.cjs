// RENDER AI D1 · IMG-01: the finishes of an AI render were cut in the exported image (view capped at 60 characters and
// drawn on one line). Now they travel as `detail` and get their own room. Two guarantees, checked on real canvases:
// 1) without detail, every format and layout draws byte-identical PNGs to the version before IMG-01 (fixture copy);
// 2) with detail, the whole finishes text is drawn, never cut with «…», in every format and layout.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const NEW=fs.readFileSync(path.join(root,'js/delivery-image.js'),'utf8');
const OLD=fs.readFileSync(path.join(__dirname,'fixtures/delivery-image-before-img01.js'),'utf8');
const LOGO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAYCAYAAACbU/80AAAAKElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAA4G8hOAABzCpR2gAAAABJRU5ErkJggg==';
const CASES=[['landscape','band'],['landscape','header'],['landscape','side'],['portrait','band'],['portrait','header']];
let browser,page;
before(async()=>{browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
 page=await browser.newPage();await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
 await page.addScriptTag({content:OLD});await page.evaluate(()=>{window.OldImage=window.FloorPlanDeliveryImage;delete window.FloorPlanDeliveryImage;});
 await page.addScriptTag({content:NEW});
 // A synthetic view: gradient and shapes, so a shifted or missing pixel would show.
 await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1200,800);g.addColorStop(0,'#c9d6df');g.addColorStop(1,'#52616b');x.fillStyle=g;x.fillRect(0,0,1200,800);x.fillStyle='#f0a500';x.fillRect(300,200,600,400);window.VIEW=c.toDataURL('image/png');});});
after(async()=>{await browser?.close();});

test('IMG-01: without detail, all formats and layouts are byte-identical to before (with and without brand)',async()=>{
 for(const brand of [null,{name:'Estudio Norte Arquitectura y Reformas Integrales',logo:LOGO,contact:'600 123 456 · hola@estudionorte.es'}])
  for(const [format,layout] of CASES){
   const same=await page.evaluate(async([format,layout,brand])=>{
    const input={title:'Casa Mirador · Propuesta de reforma integral',view:'Salón comedor',level:'Planta baja',rooms:[{poly:[[0,0],[5000,0],[5000,4000],[0,4000]]}],brand};
    const a=await OldImage.compose({image:VIEW,format,layout,data:OldImage.content(input)});
    const b=await FloorPlanDeliveryImage.compose({image:VIEW,format,layout,data:FloorPlanDeliveryImage.content(input)});
    return a.dataUrl===b.dataUrl&&a.width===b.width&&a.height===b.height;},[format,layout,brand]);
   assert.ok(same,`${format}/${layout}/${brand?'brand':'no brand'}: identical PNG`);}
});

test('IMG-01: with detail, the whole finishes line is drawn in every format and layout, never cut',async()=>{
 const detail='Suelo: Porcelánico gran formato · Paredes: Estuco arena';
 for(const brand of [null,{name:'Estudio Norte',logo:LOGO,contact:''}])
  for(const facts of [false,true])
   for(const [format,layout] of CASES){
    const drawn=await page.evaluate(async([format,layout,brand,facts,detail])=>{
     const texts=[],orig=CanvasRenderingContext2D.prototype.fillText;
     CanvasRenderingContext2D.prototype.fillText=function(t,...r){texts.push(String(t));return orig.call(this,t,...r);};
     try{const data=FloorPlanDeliveryImage.content({title:'Casa Mirador',view:'Render IA · Salón comedor',detail,rooms:facts?[{poly:[[0,0],[5000,0],[5000,4000],[0,4000]]}]:[],brand});
      data.note='Imagen generada por IA a partir de la vista real del proyecto · orientativa, puede alterar detalles';
      await FloorPlanDeliveryImage.compose({image:VIEW,format,layout,data});}
     finally{CanvasRenderingContext2D.prototype.fillText=orig;}
     return texts;},[format,layout,brand,facts,detail]);
    const tag=`${format}/${layout}/${brand?'brand':'no brand'}/${facts?'facts':'no facts'}`;
    const all=drawn.join('\n');
    // In the side column the detail may wrap over lines: the words must all be there, in order, uncut.
    const joined=drawn.join(' ').replace(/\s+/g,' ');
    assert.ok(joined.includes(detail),`${tag}: the full finishes text is drawn\n${all}`);
    assert.ok(!drawn.some(t=>t.includes('Suelo')&&t.endsWith('…')),`${tag}: no cut finishes line`);
    assert.ok(drawn.some(t=>t.startsWith('Render IA · Salón comedor')),`${tag}: the view stays`);
   }
});

test('IMG-01: the AI render download sends the finishes as detail, not inside the view',()=>{
 const ui=fs.readFileSync(path.join(root,'js/ai-render-ui.js'),'utf8');
 assert.match(ui,/view:tx\('Render IA · ','AI render · ','AI 渲染 · '\)\+result\.label,detail:finishText\(result\)\|\|undefined/);
});

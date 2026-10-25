// A room label (name, area, dimensions) must not be drawn over a piece of furniture when the room has a clear place
// for it: journey G step 4, a new 3000 × 4000 room with a bed added from the palette in the middle of it.
// When no clear place exists (a room full of furniture) the label stays where it was.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const OUT=process.env.LABEL_ARTIFACTS||'qa-results/room-label-clear';
let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('outside');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'content-type':type});res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(r=>server.close(r)));

// What is drawn on screen: every text of the room label against the piece, its rotation handle and its size tag.
const overlaps=page=>page.evaluate(()=>{const box=e=>e.getBoundingClientRect(),hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 const marks=[...document.querySelectorAll('#gFurn .furn, #gSel [data-handle], #gSel text')].map(e=>({what:e.dataset.handle||e.dataset.fid&&'mueble'||'cota',r:box(e)})).filter(m=>m.r.width>0);
 return labelBoxes.map(l=>({room:l.room,box:[l.x0,l.y0,l.x1,l.y1].map(Math.round),hits:[...document.querySelectorAll('#gLabels text')].flatMap(t=>marks.filter(m=>hit(box(t),m.r)).map(m=>`${t.textContent}/${m.what}`))}));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`room label keeps clear of a bed in a new room ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});t.after(()=>browser.close());
 const mobile=viewport.width<1000,page=await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/cdn\.jsdelivr\.net|unpkg\.com/,r=>r.abort());await page.goto(url);
 const press=async s=>{const l=page.locator(s).first();if(mobile)await l.tap();else await l.click();};
 await press('#welcomeBlank');await page.locator('#roomDesignName').fill('Salón');await press('#roomDesignReview');await press('#roomDesignConfirm');await page.waitForTimeout(400);
 const open=await page.evaluate(()=>{const a=document.querySelector('aside.lib'),r=a.getBoundingClientRect();return r.width>60&&r.right>10&&!(matchMedia('(max-width:1100px)').matches&&!a.classList.contains('open'));});
 if(!open)await press('#tgLib');await press('#paletteTabFurnish');await page.locator('#furnitureSearch').fill('cama');await page.waitForTimeout(400);await press('#searchResults .item');await page.waitForTimeout(400);
 if(mobile&&await page.locator('aside.lib.open').count())await press('#tgLib');
 const rows=await overlaps(page);await fs.mkdir(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,`${viewport.width}x${viewport.height}-bed.png`)});
 assert.equal(rows.length,1,JSON.stringify(rows));
 assert.deepEqual(rows[0].hits,[],`label over furniture: ${JSON.stringify(rows)}`);
 // The label stays inside its room.
 const inside=await page.evaluate(([x0,y0,x1,y1])=>{const r=geometry.rooms[0].poly,xs=r.map(p=>p[0]),ys=r.map(p=>p[1]);return x0>=Math.min(...xs)&&x1<=Math.max(...xs)&&y0>=Math.min(...ys)&&y1<=Math.max(...ys);},rows[0].box);
 assert.ok(inside,JSON.stringify(rows[0]));assert.deepEqual(errors,[]);
});

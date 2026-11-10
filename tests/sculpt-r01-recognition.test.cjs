// SCULPT-R01 · RecognitionEvidenceV1 adapter, comparator and provenance guards. Synthetic data only.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const LAB=path.join(__dirname,'..','labs','sculpt','r01-recognition');
const E=require(path.join(LAB,'recognition-evidence-core.js'));
const C=require(path.join(LAB,'recognition-compare-core.js'));
const F=require(path.join(LAB,'fixtures','synthetic-plans.js'));
const R=require(path.join(LAB,'workshop','recognition-core.js'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clone=img=>({width:img.width,height:img.height,data:new Uint8ClampedArray(img.data)});
// OCR words are given by hand (no OCR engine runs in tests), placed inside the synthetic rooms.
const word=(text,x,y,confidence)=>({text,bbox:{x0:x,y0:y,x1:x+40,y1:y+14},...(confidence==null?{}:{confidence})});

test('provenance: exact-source manifest is complete and the third-party plan image is not in the repository',()=>{
  const lines=fs.readFileSync(path.join(LAB,'SOURCE-EXACT.sha256'),'utf8').trim().split('\n');
  assert.equal(lines.length,23);
  const map=new Map(lines.map(l=>{const [h,f]=l.split(/\s+/);return [f,h];}));
  assert.match(map.get('tests/fixtures/user-floorplan.png'),/^6206fcc8/);
  assert.match(map.get('js/recognition-core.js'),/^52fe5237/);
  assert.equal(map.get('LICENSE'),sha(fs.readFileSync(path.join(LAB,'workshop','LICENSE-donor-MIT.txt'))),'donor MIT notice kept verbatim');
  // No file in the repository has the hash of the donor's plan screenshot.
  const files=execFileSync('git',['ls-files'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim().split('\n');
  for(const f of files.filter(f=>/\.(png|jpe?g|webp)$/i.test(f)&&f.startsWith('labs/sculpt/')))
    assert.notEqual(sha(fs.readFileSync(path.join(__dirname,'..',f))),map.get('tests/fixtures/user-floorplan.png'),f);
  assert.match(fs.readFileSync(path.join(__dirname,'..','.vercelignore'),'utf8'),/^labs\/$/m,'labs/ stays out of Vercel');
});

test('workshop keeps the donor options available: legacy mask constant and donor heuristics on by default',()=>{
  assert.deepEqual(R.LEGACY_UI_MASK.map(r=>[...r]),[[.72,0,1,.16]]);
  assert.equal(typeof R.scaleCandidates,'function');
  assert.deepEqual({...E.ENRICH_OPTIONS},{synthesizeRooms:false,heuristicNames:false,inferDroppedDecimal:false});
});

test('evidence contract on every synthetic plan: valid, image pixels, scale unknown, nothing canonical, all unreviewed',()=>{
  for(const name of F.NAMES){
    const p=F.plan(name),r=E.analyse(p.image);
    assert.ok(r.ok,name);const ev=r.evidence;
    assert.deepEqual(E.validate(ev),[],name);
    assert.equal(ev.canonical,false);
    assert.deepEqual(ev.frame,{units:'image-px',origin:'top-left',yAxis:'down',width:p.image.width,height:p.image.height});
    assert.deepEqual({status:ev.scale.status,mmPerPx:ev.scale.mmPerPx},{status:'unknown',mmPerPx:null});
    assert.equal(ev.ocr.status,'not-run');
    assert.ok(ev.walls.length>0&&ev.rooms.length===3,name);
    for(const room of ev.rooms){assert.equal(room.label,null,'no name without OCR text');assert.ok(!('name' in room));}
    assert.ok(!JSON.stringify(ev).includes('"confidence"'));
    for(const l of E.STANDING_LIMITS)assert.ok(ev.limits.includes(l));
  }
});

test('pure and deterministic: same input gives the same evidence and the image is not modified',()=>{
  const p=F.plan('grey-walls-fills'),before=sha(Buffer.from(p.image.data.buffer));
  const a=E.analyse(p.image),b=E.analyse(clone(p.image));
  assert.deepEqual(a,b);
  assert.equal(sha(Buffer.from(p.image.data.buffer)),before);
});

test('invalid input is refused with a code, never a guess',()=>{
  const p=F.plan('black-walls');
  assert.deepEqual(E.analyse(null),{ok:false,error:{code:'image-missing'}});
  assert.deepEqual(E.analyse({width:10,height:10,data:new Uint8ClampedArray(400)}),{ok:false,error:{code:'image-size-out-of-range'}});
  assert.deepEqual(E.analyse({width:2000,height:2000,data:new Uint8ClampedArray(2000*2000*4)}),{ok:false,error:{code:'image-size-out-of-range'}});
  assert.deepEqual(E.analyse({width:64,height:64,data:new Uint8ClampedArray(10)}),{ok:false,error:{code:'image-invalid'}});
  assert.deepEqual(E.analyse(p.image,{words:[{text:'x'}]}),{ok:false,error:{code:'ocr-words-invalid',detail:'word 0'}});
  assert.deepEqual(E.analyse(p.image,{ocrEngine:'tesseract'}),{ok:false,error:{code:'ocr-engine-without-words'}});
});

test('OCR observations are bounded: inside the image frame, no silent truncation, engine score finite or absent',()=>{
  const p=F.plan('black-walls'),W=p.image.width,H=p.image.height;
  const code=words=>{const r=E.analyse(p.image,{words});return r.ok?'ok':r.error.code+(r.error.detail?' @'+r.error.detail:'');};
  assert.equal(code([word('ok',10,10),{text:'x',bbox:{x0:-1,y0:0,x1:5,y1:5}}]),'ocr-word-out-of-frame @word 1');
  assert.equal(code([{text:'x',bbox:{x0:W-5,y0:0,x1:W+1,y1:5}}]),'ocr-word-out-of-frame @word 0');
  assert.equal(code([{text:'x',bbox:{x0:0,y0:H-2,x1:4,y1:H+0.5}}]),'ocr-word-out-of-frame @word 0');
  assert.equal(code([{text:'x',bbox:{x0:0,y0:0,x1:W,y1:H}}]),'ok','the full frame is still inside');
  assert.equal(code([{text:'x',bbox:{x0:5,y0:5,x1:4,y1:9}}]),'ocr-words-invalid @word 0','inverted box');
  assert.equal(code([{text:'x',bbox:{x0:NaN,y0:0,x1:4,y1:4}}]),'ocr-words-invalid @word 0');
  assert.equal(code([{text:'x'.repeat(E.LIMITS.maxText+1),bbox:{x0:0,y0:0,x1:4,y1:4}}]),'ocr-word-text-too-long @word 0','never truncated silently');
  assert.equal(code([{text:'x',bbox:{x0:0,y0:0,x1:4,y1:4},confidence:Infinity}]),'ocr-word-score-invalid @word 0');
  assert.equal(code([{text:'x',bbox:{x0:0,y0:0,x1:4,y1:4},confidence:'90'}]),'ocr-word-score-invalid @word 0','a score is a number or absent');
  assert.equal(code(Array.from({length:E.LIMITS.maxWords+1},()=>word('a',1,1))),'ocr-too-many-words');
  assert.equal(code([null]),'ocr-words-invalid @word 0');
});

test('image provenance: file hash declared vs verified, pixel hash computed and re-checkable',()=>{
  const p=F.plan('black-walls'),file=Buffer.from('synthetic plan file bytes'),fileHash=sha(file);
  assert.equal(E.sha256(file),fileHash,'pure SHA-256 equals node:crypto');
  for(const n of [0,55,56,64,65,1000])assert.equal(E.sha256(crypto.randomBytes(n).fill(7)),sha(Buffer.alloc(n,7)));
  const plain=E.analyse(p.image).evidence.source.image;
  assert.deepEqual({id:plain.id,file:plain.file,status:plain.pixels.status},{id:null,file:null,status:'computed'});
  const head=Buffer.alloc(8);head.writeUInt32BE(p.image.width,0);head.writeUInt32BE(p.image.height,4);
  assert.equal(plain.pixels.sha256,sha(Buffer.concat([head,Buffer.from(p.image.data.buffer)])),'pixel hash = uint32be(w)+uint32be(h)+rgba');
  const declared=E.analyse(p.image,{imageRef:{id:'plan-a',fileSha256:fileHash}}).evidence.source.image;
  assert.deepEqual(declared.file,{sha256:fileHash,status:'declared'},'a hash given without bytes stays declared');
  const verified=E.analyse(p.image,{imageRef:{fileSha256:fileHash},fileBytes:file}).evidence.source.image;
  assert.deepEqual(verified.file,{sha256:fileHash,status:'verified',bytes:file.length});
  assert.deepEqual(E.analyse(p.image,{fileBytes:file}).evidence.source.image.file,{sha256:fileHash,status:'verified',bytes:file.length});
  assert.deepEqual(E.analyse(p.image,{imageRef:{fileSha256:'0'.repeat(64)},fileBytes:file}),{ok:false,error:{code:'image-file-hash-mismatch'}});
  assert.deepEqual(E.analyse(p.image,{imageRef:{fileSha256:'abc'}}),{ok:false,error:{code:'image-ref-invalid'}});
  assert.deepEqual(E.analyse(p.image,{imageRef:{sha256:'a'.repeat(64)}}),{ok:false,error:{code:'image-ref-ambiguous-hash'}});
  assert.deepEqual(E.analyse(p.image,{fileBytes:new Uint8Array(0)}),{ok:false,error:{code:'image-file-bytes-invalid'}});
  // validate with the image recomputes the pixel hash: evidence moved to another image is caught.
  const ev=E.analyse(p.image).evidence;
  assert.deepEqual(E.validate(ev,{image:p.image}),[]);
  const other=clone(p.image);other.data[0]^=1;
  assert.ok(E.validate(ev,{image:other}).includes('pixels-hash-mismatch'));
  const forged=JSON.parse(JSON.stringify(ev));forged.source.image.file={sha256:fileHash,status:'verified'};
  assert.ok(E.validate(forged).includes('source-image-file-bytes'),'"verified" must carry the byte count it was verified on');
});

test('OCR words: text kept verbatim, engine score passed through, no invented rooms, decimals or names',()=>{
  const p=F.plan('black-walls');
  const words=[word('卧室',150,200,88),word('Dormitorio',380,120,91),word('418m',150,230),word('12.50m²',380,140,70),word('阳台',20,20,60)];
  const r=E.analyse(p.image,{words,ocrEngine:'test-fixture'});assert.ok(r.ok);const ev=r.evidence;
  assert.deepEqual(E.validate(ev),[]);
  assert.equal(ev.ocr.status,'provided');assert.equal(ev.ocr.engine,'test-fixture');
  assert.deepEqual(ev.ocr.words.map(w=>w.engineScore),[88,91,null,70,60],'missing engine score stays null, never 0');
  const left=ev.rooms.find(r=>r.label&&r.label.text==='卧室');
  assert.ok(left,'zh label read inside the left room');assert.equal(left.label.placement,'inside');assert.equal(left.label.matched,'卧室');
  assert.equal(left.areaLabel,null,'418m is not turned into 4.18 m²');
  const rt=ev.rooms.find(r=>r.areaLabel&&r.areaLabel.valueM2===12.5);
  assert.ok(rt,'explicit decimal area is read');
  assert.equal(ev.rooms.length,3,'the label outside every room creates no room');
  assert.deepEqual(ev.unplacedLabels.map(l=>l.text),['阳台']);
  assert.ok(ev.warnings.includes('labels-without-room'));
  // The donor defaults (kept in the workshop) do invent: proof the switches matter.
  const donor=R.enrich(R.detect(clone(p.image),{}),words.map(w=>({...w,bbox:{...w.bbox}})));
  assert.ok(donor.rooms.some(r=>r.synthetic),'donor default synthesises a room for the orphan label');
  assert.ok(donor.rooms.some(r=>r.areaLabel===4.18),'donor default reads 418m as 4.18 m²');
});

test('Spanish decimal comma is not read yet (GENERALISE pending): no value rather than a wrong one',()=>{
  const p=F.plan('black-walls');
  const ev=E.analyse(p.image,{words:[word('Salón',150,200),word('12,50 m²',150,220)]}).evidence;
  assert.ok(ev.rooms.every(r=>!r.label),'the donor alias table is Chinese only: no room is named');
  const room=ev.rooms.find(r=>r.wordsInside.length);
  assert.ok(room,'C5: the words are still attached to the room that contains them, verbatim');
  assert.deepEqual(room.wordsInside.map(i=>ev.ocr.words[i].text),['Salón','12,50 m²']);
  assert.ok(ev.rooms.every(r=>!r.areaLabel),'12,50 is neither 1250 nor 1.25');
});

test('OCR dimension numbers only produce unverified, unapplied scale hints',()=>{
  const p=F.plan('black-walls');
  const words=[word('2200',150,425),word('2600',400,425),word('1800',565,120),word('1800',565,330)];
  const ev=E.analyse(p.image,{words}).evidence;
  assert.equal(ev.scale.mmPerPx,null);assert.equal(ev.scale.status,'unknown');
  assert.ok(ev.scale.hints.length>=1);
  for(const h of ev.scale.hints){assert.equal(h.applied,false);assert.equal(h.status,'unverified');assert.ok(Array.isArray(h.valuesRead));}
  assert.ok(ev.walls.every(w=>!('mm' in w)&&!('lengthMm' in w)));
  const tampered=JSON.parse(JSON.stringify(ev));tampered.scale.mmPerPx=10;tampered.scale.status='declared';
  assert.ok(E.validate(tampered).includes('scale-must-stay-unknown'));
});

test('validate rejects evidence that claims more than it may',()=>{
  const ev=E.analyse(F.plan('black-walls').image).evidence;
  const bad=f=>{const x=JSON.parse(JSON.stringify(ev));f(x);return E.validate(x);};
  assert.ok(bad(x=>x.canonical=true).includes('canonical-must-be-false'));
  assert.ok(bad(x=>x.walls[0].confidence=.9).some(e=>e.startsWith('forbidden-field:')));
  assert.ok(bad(x=>x.walls[0].review='accepted').includes('wall-review:wall-0'));
  assert.ok(bad(x=>x.rooms[0].name='Salón').includes('room-invented-field:room-0'));
  assert.ok(bad(x=>x.rooms[0].synthetic=true).includes('room-invented-field:room-0'));
  assert.ok(bad(x=>x.openings[0].kind='sliding').includes('opening-kind:opening-0'));
  assert.ok(bad(x=>x.walls[0].rect=[0,0,99999,10]).includes('wall-rect:wall-0'));
  assert.ok(bad(x=>x.limits=[]).includes('limits'));
});

test('comparator: measured facts on synthetic plans (lengths in px, tolerance reported, no verdict)',()=>{
  const run=n=>{const p=F.plan(n);return C.compare(p.image,{mmPerPx:p.mmPerPx,truth:p.truth});};
  const black=run('black-walls');
  assert.equal(black.tolerancePx,3);
  assert.equal(black.donor.walls.coveredLengthPx,black.donor.walls.truthLengthPx);
  assert.equal(black.rubik.walls.coveredLengthPx,black.rubik.walls.truthLengthPx);
  assert.deepEqual(black.rubik.counts,{walls:9,openings:3,rooms:3});
  // Grey walls next to near-black text: RUBIK's mid-grey threshold drops the walls; the donor keeps them.
  const text=run('grey-walls-black-text');
  assert.equal(text.rubik.counts.walls,0);
  assert.equal(text.donor.walls.coveredLengthPx,text.donor.walls.truthLengthPx);
  // Glyph strokes become donor "walls" off any true wall; the evidence flags them as touching no other wall.
  const dim=run('dimension-lines');
  assert.ok(dim.donor.walls.offWallLengthPx>0);
  assert.equal(dim.donor.touchingWalls.offWallLengthPx,0);
  assert.equal(dim.rubik.walls.offWallLengthPx,0);
  // The flag is not a filter: at low resolution it also marks a true wall.
  const low=run('low-resolution');
  assert.ok(low.donor.counts.isolatedWalls>0);
  assert.ok(low.donor.touchingWalls.coveredLengthPx<low.donor.walls.coveredLengthPx);
  assert.throws(()=>C.compare(F.plan('black-walls').image,{}),/mmPerPx/);
});

// Audit 10/11: this proves RECOVERY AFTER A REJECTION, not cancellation. analyse() is synchronous: once started it cannot be
// interrupted. Interruptible cancellation needs the donor worker (recognition-worker.js) + terminate(), not implemented yet.
test('recovery after rejection (not cancellation): no partial evidence, no mutation, next run clean; empty image reported',()=>{
  assert.ok(!('cancel' in E)&&!('abort' in E),'no cancellation API is claimed');
  const W=1200,H=1200,data=new Uint8ClampedArray(W*H*4).fill(255);
  // Dense texture of short strokes: the donor refuses it (more than 600 wall pieces).
  for(let y=0;y<H;y+=24)for(let x=0;x<W;x+=24){
    for(let yy=y;yy<y+6;yy++)for(let xx=x;xx<x+20;xx++){const i=(yy*W+xx)*4;data[i]=data[i+1]=data[i+2]=20;}
    for(let yy=y+8;yy<y+22;yy++)for(let xx=x;xx<x+6;xx++){const i=(yy*W+xx)*4;data[i]=data[i+1]=data[i+2]=20;}
  }
  const before=sha(Buffer.from(data.buffer)),texture=E.analyse({width:W,height:H,data});
  assert.equal(texture.ok,false);assert.equal(texture.error.code,'detector-rejected');assert.ok(!('evidence' in texture));
  assert.equal(sha(Buffer.from(data.buffer)),before);
  const p=F.plan('black-walls');assert.deepEqual(E.analyse(p.image),E.analyse(clone(p.image)),'the next run is unaffected');
  const blank=E.analyse({width:200,height:150,data:new Uint8ClampedArray(200*150*4).fill(255)});
  assert.ok(blank.ok);assert.deepEqual(E.validate(blank.evidence),[]);
  assert.deepEqual([blank.evidence.walls.length,blank.evidence.rooms.length],[0,0]);
  assert.ok(blank.evidence.warnings.includes('no-walls')&&blank.evidence.warnings.includes('no-closed-rooms'));
});

test('validate checks OCR and annotation geometry structurally',()=>{
  const p=F.plan('black-walls');
  const ev=E.analyse(p.image,{words:[word('Salón',150,200),word('Cocina',380,120)]}).evidence;
  assert.deepEqual(E.validate(ev),[]);
  const bad=f=>{const x=JSON.parse(JSON.stringify(ev));f(x);return E.validate(x);};
  assert.ok(bad(x=>x.ocr.words[0].bbox=[0,0,99999,5]).includes('ocr-word-bbox:0'));
  assert.ok(bad(x=>x.ocr.words[1].engineScore='high').includes('ocr-word-score:1'));
  assert.ok(bad(x=>{x.rooms[0].wordsInside=[0];x.rooms[1].wordsInside=[0];}).includes('word-in-two-rooms:0'));
  assert.ok(bad(x=>x.rooms[0].wordsInside=[7]).includes('room-words:room-0'));
  assert.ok(bad(x=>{x.ocr.status='not-run';}).includes('ocr-words-without-run'));
  assert.ok(bad(x=>x.annotations.compass={at:[-5,3],angleDeg:0,facing:'N',basis:'raster-heuristic'}).includes('compass-at'));
  assert.ok(bad(x=>x.unplacedLabels=[{text:'x',matched:null,bbox:[0,0,1e6,1]}]).includes('unplaced-label:0'));
  assert.ok(bad(x=>x.source.image.pixels.status='verified').includes('source-image-pixels'));
});

test('fetch-source-exact.sh never deletes or overwrites what exists (guards run before any network access)',()=>{
  const script=path.join(LAB,'fetch-source-exact.sh'),os=require('node:os');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sculpt-r01-fetch-'));
  const run=(...args)=>{try{execFileSync('bash',[script,...args],{stdio:'pipe'});return 0;}catch(e){return e.status;}};
  const full=path.join(tmp,'full');fs.mkdirSync(full);fs.writeFileSync(path.join(full,'keep.txt'),'precious');
  const file=path.join(tmp,'file.txt');fs.writeFileSync(file,'precious');
  fs.symlinkSync(full,path.join(tmp,'link'));
  assert.equal(run(full),3,'existing non-empty directory is refused');
  assert.equal(run(file),3,'existing file is refused');
  assert.equal(run(path.join(tmp,'link')),2,'symbolic link is refused');
  assert.equal(run(path.join(LAB,'snapshot-here')),2,'inside the repository is refused');
  assert.equal(run('a','b'),64);
  assert.equal(fs.readFileSync(path.join(full,'keep.txt'),'utf8'),'precious');
  assert.equal(fs.readFileSync(file,'utf8'),'precious');
  assert.ok(!fs.existsSync(path.join(LAB,'snapshot-here')));
  // --verify only reads: a directory that is not the snapshot fails and is left as it was.
  assert.equal(run('--verify',full),5);
  assert.deepEqual(fs.readdirSync(full),['keep.txt']);
  const src=fs.readFileSync(script,'utf8');
  assert.ok(!/rm -rf\s+"?\$\{?(DEST|ABS)/.test(src),'no recursive removal of the destination');
  fs.rmSync(tmp,{recursive:true,force:true});
});

test('integration stays blocked: no product file loads the lab, and the evidence keeps its standing limits',()=>{
  let out='';
  try{out=execFileSync('git',['grep','-l','-e','labs/sculpt','-e','RubikRecognitionEvidence','-e','RubikRecognitionCompare','--','js','api','css','index.html','evolucion'],{cwd:path.join(__dirname,'..'),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
  catch(e){assert.equal(e.status,1,'git grep: 1 means no match');}
  assert.equal(out,'','the product does not reference the lab');
  for(const l of ['not-validated-on-real-plans','human-review-required'])assert.ok(E.STANDING_LIMITS.includes(l));
});

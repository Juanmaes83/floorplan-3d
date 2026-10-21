// LoRA LAB evidence tools (QA only, no product code). Files are typed by content, never by extension: the first
// «Villa moderna» download from Juanma's session was a PNG saved as `villa-original.json`. The structure analyzer must
// refuse it instead of failing on JSON.parse, and must still summarize a real JSON export without copying its text.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {fileType}=require('../scripts/qa/loralab/file-type.cjs');
const analyzer=path.join(__dirname,'../scripts/qa/loralab/analyze-export.cjs');
// Minimal PNG: signature and IHDR chunk, as the 3D capture starts.
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('0000000d49484452000000010000000108060000001f15c489','hex')]);
const villa={v:2,floors:[{h:3400,walls:[{}],stairs:[{type:'u'}]},{h:3200},{h:3200}],site:{north:0},owner:'persona@example.com'};

test('evidence files are typed by content, not by extension',()=>{
 assert.equal(fileType(png),'png');
 assert.equal(fileType(Buffer.from([255,216,255,224,0,16])),'jpeg');
 assert.equal(fileType(Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBPVP8 ')])),'webp');
 assert.equal(fileType(Buffer.from([80,75,3,4,20,0])),'zip');
 assert.equal(fileType(Buffer.from(JSON.stringify(villa))),'json');
 assert.equal(fileType(Buffer.from('﻿'+JSON.stringify(villa))),'json','UTF-8 BOM accepted');
 assert.equal(fileType(Buffer.from('[1,2]')),'json');
 assert.equal(fileType(Buffer.from('3')),'otro','a JSON scalar is not an export');
 assert.equal(fileType(Buffer.from('{"v":2,')),'otro','truncated JSON');
 assert.equal(fileType(Buffer.alloc(0)),'otro');
});

test('the analyzer refuses a PNG named .json and summarizes a real JSON without its text',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loralab-'));
 try{
  const bad=path.join(dir,'villa-original.json');fs.writeFileSync(bad,png);
  const r1=spawnSync(process.execPath,[analyzer,bad],{encoding:'utf8'});
  assert.equal(r1.status,3);assert.match(r1.stderr,/el contenido es png, no JSON; no se analiza/);assert.equal(r1.stdout,'');
  const good=path.join(dir,'download-2-Villa_moderna.json');fs.writeFileSync(good,JSON.stringify(villa));
  const r2=spawnSync(process.execPath,[analyzer,good],{encoding:'utf8'});
  assert.equal(r2.status,0,r2.stderr);
  assert.match(r2.stdout,/\| `\$\.floors` \| array \| 1 \| 3 \|/,'three floors counted');
  assert.match(r2.stdout,/\*\*escalera:\*\* .*`\$\.floors\[\]\.stairs`/);
  assert.match(r2.stdout,/email 1/,'sensitive value counted');
  assert.doesNotMatch(r2.stdout,/persona@example\.com/,'no text value is copied');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

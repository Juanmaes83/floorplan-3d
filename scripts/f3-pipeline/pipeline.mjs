// Read-only Asset Lab audit and explicit, reproducible GLB preparation.
// Usage: node pipeline.mjs audit|prepare /path/to/immersphere-asset-lab [asset-id ...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {NodeIO,getBounds} from '@gltf-transform/core';
import sharp from 'sharp';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const [mode,labArg,...ids]=process.argv.slice(2);
if(!['audit','prepare'].includes(mode)||!labArg){console.error('Usage: node pipeline.mjs audit|prepare /path/to/immersphere-asset-lab [asset-id ...]');process.exit(2);}
const lab=fs.realpathSync(labArg);
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:lab,encoding:'utf8'}).trim();
const manifest=JSON.parse(fs.readFileSync(path.join(lab,'manifest/ikea-sample.manifest.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const cli=path.join(here,'node_modules/.bin/gltf-transform');
const safeModel=p=>typeof p==='string'&&/^assets\/ikea\/[a-zA-Z0-9/_.-]+\.glb$/.test(p)&&!p.includes('..');
function glb(p){const b=fs.readFileSync(p);if(b.length<20||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error('invalid GLB header');return {bytes:b,doc:JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'))};}
async function profile(p){const {bytes,doc}=glb(p),images=[];let offset=12,binOffset=0;while(offset<bytes.length){const n=bytes.readUInt32LE(offset),kind=bytes.readUInt32LE(offset+4);if(kind===0x004e4942)binOffset=offset+8;offset+=8+n;}
 for(const im of doc.images||[]){let meta={mime:im.mimeType||'uri',width:null,height:null,opaque:null};if(im.bufferView!==undefined&&binOffset){const v=doc.bufferViews[im.bufferView],data=bytes.subarray(binOffset+(v.byteOffset||0),binOffset+(v.byteOffset||0)+v.byteLength);try{const s=await sharp(data).metadata();meta={...meta,bytes:data.length,...s};}catch{meta.bytes=data.length;}}images.push(meta);}
 return {bytes:bytes.length,sha256:sha(bytes),extensionsRequired:doc.extensionsRequired||[],extensionsUsed:doc.extensionsUsed||[],images:images.map(i=>({mime:i.mime,bytes:i.bytes||0,width:i.width||null,height:i.height||null,hasAlpha:i.hasAlpha??null})),meshes:doc.meshes?.length||0,materials:doc.materials?.length||0,externalResources:(doc.images||[]).some(i=>i.uri)||(doc.buffers||[]).some(b=>b.uri)};
}
async function main(){
 const listed=new Set(manifest.map(x=>x.modelPath));const physical=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.toLowerCase().endsWith('.glb'))physical.push(path.relative(lab,p).replaceAll(path.sep,'/'));}}walk(path.join(lab,'assets'));
 const rows=await Promise.all(manifest.map(async x=>{const p=x.modelPath,found=safeModel(p)&&fs.existsSync(path.join(lab,p));let info={id:x.id,name:x.productName,category:x.category,modelPath:p,exists:found,manifestDimensions:x.dimensions||null,licenseType:x.licenseType||null,redistributionAllowed:x.redistributionAllowed,permissionDocumentRef:x.permissionDocumentRef,qaStatus:x.qaStatus};if(found)try{info={...info,...await profile(path.join(lab,p))};}catch(e){info.error=e.message;}return info;}));
 const unlisted=physical.filter(p=>!listed.has(p));
 if(mode==='audit'){const result={revision,manifestEntries:rows.length,physicalGlb:physical.length,missing:rows.filter(r=>!r.exists).length,unlisted,rows};const out=path.join(repo,'docs/technical/F3-pipeline-inventory.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({revision,manifestEntries:rows.length,physicalGlb:physical.length,missing:result.missing,unlisted,output:out}));return;}
 if(!ids.length)throw Error('prepare requires explicit asset IDs');
 const outputs=[],rejected=[];
 for(const id of ids){const row=rows.find(x=>x.id===id);if(!row?.exists)throw Error('missing listed GLB: '+id);if(row.externalResources)throw Error('external resources: '+id);if(row.bytes>8*1024*1024)throw Error('input over 8 MiB: '+id);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'f3-pipeline-'));
  try{const a=path.join(tmp,'decoded.glb'),b=path.join(tmp,'jpeg-webp.glb'),b2=path.join(tmp,'jpeg-png.glb'),c=path.join(tmp,'resized.glb'),out=path.join(repo,'assets/f3',id+'.glb');
   for(const args of [['copy',path.join(lab,row.modelPath),a],['jpeg',a,b,'--formats','webp','--quality','82'],['jpeg',b,b2,'--formats','png','--quality','82'],['resize',b2,c,'--width','1024','--height','1024']])try{execFileSync(cli,args,{stdio:'pipe'});}catch(e){throw Error(`${id}: ${args[0]}: ${e.stdout?.toString()||''} ${e.stderr?.toString()||e.message}`);}
   const pr=await profile(c),d=glb(c).doc;
   if(pr.bytes>8*1024*1024||pr.extensionsUsed.length||pr.extensionsRequired.length||pr.externalResources||pr.images.length>4||pr.materials>8||pr.images.some(i=>i.mime!=='image/jpeg'||i.bytes>1024*1024||i.width>2048||i.height>2048)||d.animations?.length||d.skins?.length)throw Error('outside Rubik output profile: '+id+' '+JSON.stringify(pr));
   const io=new NodeIO(),document=await io.read(c),scene=document.getRoot().listScenes()[0];if(!scene)throw Error('no scene: '+id);const bounds=getBounds(scene),size=bounds.max.map((v,i)=>Math.round((v-bounds.min[i])*1000));if(size.some(v=>!Number.isFinite(v)||v<10||v>10000))throw Error('invalid model bounds: '+id);
   const current=fs.existsSync(out)?sha(fs.readFileSync(out)):null;if(current&&current!==pr.sha256)throw Error('output already exists with different hash: '+out);if(!current)fs.copyFileSync(c,out);
   outputs.push({id,sourcePath:row.modelPath,sourceSha256:row.sha256,sourceBytes:row.bytes,sourceExtensions:row.extensionsRequired,sourceImages:row.images,outputPath:path.relative(repo,out),outputSha256:pr.sha256,outputBytes:pr.bytes,outputImages:pr.images,modelDimensionsMm:{width:size[0],height:size[1],depth:size[2]},bboxMinMeters:bounds.min,bboxMaxMeters:bounds.max,officialDimensions:null});
  }catch(e){rejected.push({id,reason:e.message});}finally{fs.rmSync(tmp,{recursive:true,force:true});}
 }
 const result={revision,tool:'glTF Transform 4.3.0 / sharp 0.34.4',steps:['copy: decode Draco','jpeg: convert WebP then PNG to JPEG quality 82','resize: maximum 1024 pixels per side'],outputs,rejected};const dest=path.join(repo,'docs/technical/F3-pipeline-results.json');fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({prepared:outputs.length,rejected:rejected.length,output:dest}));
}
main().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});

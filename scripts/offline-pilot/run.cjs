'use strict';
// Offline pilot orchestrator: Floorplan project -> PR #24 package -> verified .blend -> shots -> Cycles review
// video, every step into a NEW folder. Ctrl+C cancels the running step and records it.
// Usage: node run.cjs project.json NEW-OUT --python PY [--visual] [--rooms a,b] [--resolution 640x360]
//        [--samples 16] [--frames all|anchors] [--threads N]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),here=__dirname,interop=path.join(here,'..','interop');
function parse(argv){const pos=[],opt={};for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')){const k=argv[i].slice(2);if(argv[i+1]&&!argv[i+1].startsWith('--'))opt[k]=argv[++i];else opt[k]=true;}else pos.push(argv[i]);}return {pos,opt};}
let child=null,cancelled=false;
function step(log,name,cmd,args){return new Promise((resolve,reject)=>{const t=Date.now();if(cancelled)return reject(Error('cancelled'));child=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let out='',err='';
 child.stdout.on('data',d=>{out+=d;});child.stderr.on('data',d=>{err+=d;});child.on('close',code=>{child=null;const row={step:name,command:[path.basename(cmd),...args.map(a=>path.isAbsolute(a)?path.basename(a):a)].join(' '),exit:code,seconds:+((Date.now()-t)/1000).toFixed(1),stdoutTail:out.trim().split('\n').slice(-3)};log.push(row);
  if(code===0&&!cancelled)resolve(out);else reject(Error(cancelled?'cancelled':`${name} failed (${code}): ${(err||out).trim().split('\n').slice(-4).join(' | ')}`));});});}
async function main(){
 const {pos:[src,out],opt}=parse(process.argv.slice(2)),py=opt.python||process.env.BPY_PYTHON;
 if(!src||!out||!py)throw Error('Usage: node run.cjs project.json NEW-OUT --python PY [--visual] [--rooms a,b]');
 if(fs.existsSync(out))throw Error('Refusing overwrite: '+out);fs.mkdirSync(out,{recursive:true});
 const before=sha(fs.readFileSync(src)),log=[],started=Date.now(),O=p=>path.join(out,p),run={format:'floorplan-offline-pilot-run',version:'0.1.0',status:'running',project:{path:path.basename(src),sha256Before:before},options:opt,steps:log};
 const stop=()=>{cancelled=true;if(child)child.kill('SIGTERM');};process.on('SIGINT',stop);process.on('SIGTERM',stop);
 const save=()=>fs.writeFileSync(O('run.json'),JSON.stringify(run,null,1)+'\n');
 try{
  await step(log,'export',process.execPath,[path.join(interop,'export.cjs'),src,O('package'),py]);
  await step(log,'verify',py,['-I',path.join(interop,'blender-verify.py'),'--',O('package'),O('verify-report.json'),O('verified.blend')]);
  if(opt.visual)await step(log,'visual',process.execPath,[path.join(here,'capture-visual.cjs'),src,O('visual')]);
  await step(log,'shots',process.execPath,[path.join(here,'shots.cjs'),src,O('shots.json'),...(opt.rooms?[opt.rooms]:[])]);
  const r=['-I',path.join(here,'render.py'),'--',O('verified.blend'),O('package'),O('shots.json'),O('render')];
  for(const k of ['rooms','resolution','samples','frames','threads'])if(opt[k])r.push('--'+k,String(opt[k]));if(opt.visual)r.push('--visual',O('visual/visual-furniture.glb'));
  await step(log,'render',py,r);
  await step(log,'reopen',py,['-I',path.join(here,'reopen.py'),'--',O('render'),O('reopen-report.json')]);
  if((opt.frames||'all')==='all'){await step(log,'encode','ffmpeg',['-loglevel','error','-n','-framerate','30','-i',O('render/frames/%05d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20',O('review-30fps.mp4')]);
   await step(log,'contact-sheet','ffmpeg',['-loglevel','error','-n','-i',O('review-30fps.mp4'),'-vf','fps=3,scale=320:-2,tile=6x8','-q:v','4',O('contact-sheet-3fps-%02d.jpg')]);}
  run.status='complete';
 }catch(e){run.status=cancelled?'cancelled':'failed';run.error=e.message;process.exitCode=1;}
 finally{run.project.sha256After=sha(fs.readFileSync(src));run.project.unchanged=run.project.sha256After===before;run.wallSeconds=+((Date.now()-started)/1000).toFixed(1);save();console.log(JSON.stringify({status:run.status,wallSeconds:run.wallSeconds,projectUnchanged:run.project.unchanged,error:run.error}));}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});

// Virtual-time recorder: the page clock (performance.now + requestAnimationFrame) is advanced exactly 1/30 s
// per captured frame, so the encoded 30 fps video shows the camera motion at 1x independent of how slowly
// SwiftShader renders each frame here. It does NOT measure real-time frame rate.
const fs=require('node:fs/promises'),path=require('node:path'),{execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
async function install(page){
 await page.evaluate(()=>{if(window.__vt)return;const realNow=performance.now.bind(performance);let t=realNow(),q=new Map(),id=0;
  performance.now=()=>t;window.requestAnimationFrame=cb=>{q.set(++id,cb);return id;};window.cancelAnimationFrame=h=>{q.delete(h);};
  window.__vt={step(dt){t+=dt;const cbs=[...q.values()];q.clear();for(const cb of cbs){try{cb(t);}catch(e){setTimeout(()=>{throw e;});}}},get now(){return t;},get pending(){return q.size;}};});
}
const step=(page,ms)=>page.evaluate(ms=>window.__vt.step(ms),ms);
class Recorder{
 constructor(page,dir,{fps=30}={}){this.page=page;this.dir=dir;this.fps=fps;this.n=0;this.log=[];}
 async init(){await fs.rm(this.dir,{recursive:true,force:true});await fs.mkdir(this.dir,{recursive:true});await install(this.page);}
 // advance one frame, flush microtasks, capture
 async frame(sample){await step(this.page,1000/this.fps);await this.page.evaluate(()=>new Promise(r=>setTimeout(r,0)));
  await this.page.screenshot({path:path.join(this.dir,`f${String(this.n).padStart(5,'0')}.jpg`),type:'jpeg',quality:82});
  if(sample)this.log.push({frame:this.n,t:this.n/this.fps,...await this.page.evaluate(sample)});this.n++;}
 async hold(seconds,sample){for(let i=0;i<Math.round(seconds*this.fps);i++)await this.frame(sample);}
 async until(fn,sample,maxSeconds=60){for(let i=0;i<maxSeconds*this.fps;i++){await this.frame(sample);if(await this.page.evaluate(fn))return true;}return false;}
 async encode(file){await run('ffmpeg',['-loglevel','error','-y','-framerate',String(this.fps),'-i',path.join(this.dir,'f%05d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','23','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2',file]);return file;}
}
module.exports={install,step,Recorder};

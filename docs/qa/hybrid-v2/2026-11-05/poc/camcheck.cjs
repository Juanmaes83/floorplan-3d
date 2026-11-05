const src=require('fs').readFileSync(__dirname+'/sequence.cjs','utf8');
const KEYS=eval(src.slice(src.indexOf('const KEYS=[')+11,src.indexOf('// Realism seeds')).trim().replace(/;$/,''));
const body=src.slice(src.indexOf('// Time-parameterised'),src.indexOf('(async()=>'));eval(body);
let prev=null,prevT=null,out=[];for(let i=0;i<=312;i++){const t=i/24,c=camAt(t);if(prev){const v=Math.hypot(...c.pos.map((x,k)=>x-prev.pos[k]))*24;const a=Math.atan2(c.tgt[0]-c.pos[0],c.tgt[2]-c.pos[2]),b=Math.atan2(prev.tgt[0]-prev.pos[0],prev.tgt[2]-prev.pos[2]);let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;out.push([t.toFixed(2),v.toFixed(2),(d*24*180/Math.PI).toFixed(1)]);}prev=c;}
console.log(out.filter((_,i)=>i%6===0).map(r=>r.join(' ')).join('\n'));

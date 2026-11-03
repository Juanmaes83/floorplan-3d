/* Rubik finite material recipes. Donor mechanisms and limits: docs/qa/vq01-cp2-impact.md.
 * No runtime donor, shader patch, AO or inferred metalness. All outputs use standard Three maps.
 */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const srgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
export function stoneTransfer(input,channel){
 const out=new Uint8Array(input.length),mean=[0,0,0],count=input.length/4;
 if(channel==='color')for(let i=0;i<input.length;i+=4)for(let c=0;c<3;c++)mean[c]+=linear(input[i+c]/255)/count;
 for(let i=0;i<input.length;i+=4){
  if(channel==='color')for(let c=0;c<3;c++)out[i+c]=Math.round(255*srgb(clamp(mean[c]+1.6*(linear(input[i+c]/255)-mean[c]))));
  else if(channel==='roughness'){const r=Math.round(255*(.28+.5*input[i+1]/255));out[i]=out[i+1]=out[i+2]=r;}
  else throw Error('Unknown stone transfer channel');
  out[i+3]=255;
 }return out;
}
export function bitmapPixels(bitmap){
 const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
 return ctx.getImageData(0,0,canvas.width,canvas.height).data;
}
export function replaceStoneTexture(T,item,channel){
 const old=item.texture,data=stoneTransfer(bitmapPixels(item.bitmap),channel);
 const texture=new T.DataTexture(data,item.bitmap.width,item.bitmap.height,T.RGBAFormat);
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.copy(old.repeat);
 texture.colorSpace=old.colorSpace;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 texture.magFilter=T.LinearFilter;texture.anisotropy=4;texture.needsUpdate=true;
 old.dispose();item.texture=texture;return item;
}

const recipes=Object.freeze({'surface-oak-wood-planks':'oak','surface-white-plaster-02':'plaster','surface-brushed-concrete':'concrete'});
export const proceduralFamily=id=>recipes[id]||null;
const fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
function hash(x,y,seed){let n=Math.imul(x+seed*31,374761393)^Math.imul(y+seed*17,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
// Periodic value noise: fixed seed, no time, no world/room dependency, no seams at a tile boundary.
function noise2(u,v,nx,ny,seed){const x=fract(u)*nx,y=fract(v)*ny,ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,s=a*a*(3-2*a),t=b*b*(3-2*b);
 return mix(mix(hash(ix,iy,seed),hash((ix+1)%nx,iy,seed),s),mix(hash(ix,(iy+1)%ny,seed),hash((ix+1)%nx,(iy+1)%ny,seed),s),t)-.5;}
const noise=(u,v,n,seed)=>noise2(u,v,n,n,seed);
function scatteredPores(u,v){
 const n=24,x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y);let sum=0;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const cx=ix+dx,cy=iy+dy,hx=(cx+n)%n,hy=(cy+n)%n;
  if(hash(hx,hy,12)<.80)continue;
  const px=cx+.15+.7*hash(hx,hy,31),py=cy+.15+.7*hash(hx,hy,41),radius=(.003+.003*hash(hx,hy,21))*n;
  sum+=Math.exp(-((x-px)**2+(y-py)**2)/(radius*radius));
 }return clamp(sum);
}
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// LT's useful mechanism is correlation: the SAME pores/grain define height, color and roughness.
// Authored heights in metres; never brightness-as-height. Rubik's tile is 1m at repeatMm=1000.
export function materialField(family,u,v){
 u=fract(u);v=fract(v);
 if(family==='oak'){
  const row=Math.floor(v*4),across=fract(v*4),seed=31+row*19,offset=hash(row,7,9),along=fract(u+offset);
  const r1=hash(row,1,3),r2=hash(row,2,7),r3=hash(row,3,11),y=(across-.5)*.25;
  const yy=y+.0035*Math.sin(2*Math.PI*u+r1*6)+.004*noise2(u,0,2,1,seed);
  const st=noise2(u,v+.012*Math.sin(2*Math.PI*u+row),2,68,seed)+.65*noise2(u,v,4,120,seed+1);
  const quarter=r1>.62,vc=quarter?(r2<.5?-1:1)*(.22+.2*r3):(r2-.5)*.11;
  const dc=quarter?.015*r3:.032+.14*r3,rr=Math.hypot(yy-vc,dc+.018*Math.sin(2*Math.PI*u+r2*6));
  const ring=rr/(.004+.003*r3),rf=fract(ring),strength=.4+.6*hash(Math.floor(ring),row,67);
  const band=smooth(0,.28,rf)*(1-smooth(.55,.95,rf))*strength;
  const pores=((1-smooth(0,.24,rf))*.5+.25*band)*(quarter?.5:1);
  const edge=Math.min(across,1-across)*.25,end=Math.min(along,1-along),joint=1-smooth(.0005,.0035,Math.min(edge,end));
  const tone=(.91+.18*r1)*(1+.32*st-.12*band-.15*pores-.24*joint);
  const height=.00015*Math.cos(2*Math.PI*across)+.00012*st-.00010*pores-.00065*joint;
  return [height,clamp(.40+.08*r2+.16*pores-.08*st+.28*joint,.28,.9),tone];
 }
 if(family==='plaster'||family==='concrete'){
  const concrete=family==='concrete',cloud=noise(u,v,3,43),mid=noise(u,v,20,71),fine=noise(u,v,80,19);
  const pores=scatteredPores(u,v),trowel=Math.sin(2*Math.PI*(v*5+.12*Math.sin(2*Math.PI*u*3)));
  if(!concrete)return [.00010*mid+.00008*fine+.00004*trowel-.00018*pores,clamp(.91+.05*fine+.04*pores),1+.045*cloud+.025*mid+.018*fine-.035*pores];
  const aggregate=smooth(.15,.4,noise(u,v,45,29));
  return [.00032*mid+.00013*fine-.0011*pores+.00016*aggregate,clamp(.68+.14*mid+.20*pores-.10*aggregate,.42,.94),1+.22*cloud+.15*mid+.1*fine-.24*pores+.08*aggregate];
 }
 throw Error('Unknown Rubik surface recipe');
}
export function normalsFromHeights(heights,size,metres){
 const out=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const at=(dx,dy)=>heights[((y+dy+size)%size)*size+(x+dx+size)%size];
  let dx=(at(1,0)-at(-1,0))/(2*metres.x/size),dy=(at(0,1)-at(0,-1))/(2*metres.y/size);
  const slope=Math.hypot(dx,dy);if(slope>.7){dx*=.7/slope;dy*=.7/slope;}
  const len=Math.hypot(dx,dy,1),i=(y*size+x)*4;
  out[i]=Math.round(127.5*(1-dx/len));out[i+1]=Math.round(127.5*(1-dy/len));out[i+2]=Math.round(127.5*(1+1/len));out[i+3]=255;
 }return out;
}
export function bakeSurface(family,mean,repeat={x:1000,y:1000}){
 if(!['oak','plaster','concrete'].includes(family))throw Error('Unsupported surface recipe');
 if(!(repeat.x>0&&repeat.y>0))throw Error('Invalid physical repeat');
 const size=family==='oak'?512:256,color=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let h=0,r=0,t=0;for(const [dx,dy]of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]]){const q=materialField(family,(x+dx)/size,(y+dy)/size);h+=q[0]/4;r+=q[1]/4;t+=q[2]/4;}const i=(y*size+x)*4;
  height[y*size+x]=h;for(let c=0;c<3;c++){color[i+c]=Math.round(clamp(mean[c]*t,0,255));roughness[i+c]=Math.round(r*255);}
  color[i+3]=roughness[i+3]=255;
 }
 return {size,color,normal:normalsFromHeights(height,size,{x:repeat.x/1000,y:repeat.y/1000}),roughness,height};
}
export function meanColor(pixels){const mean=[0,0,0];for(let i=0;i<pixels.length;i+=4)for(let c=0;c<3;c++)mean[c]+=pixels[i+c]/(pixels.length/4);return mean;}
export function recipeTextures(T,bake,repeat){
 const textures=[];try{for(const [channel,data]of [['color',bake.color],['normal',bake.normal],['roughness',bake.roughness]]){
  const t=new T.DataTexture(data,bake.size,bake.size,T.RGBAFormat);textures.push(t);
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1000/repeat.x,1000/repeat.y);t.colorSpace=channel==='color'?T.SRGBColorSpace:T.NoColorSpace;
  t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;
 }return textures;}catch(error){textures.forEach(t=>t.dispose());throw error;}
}

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

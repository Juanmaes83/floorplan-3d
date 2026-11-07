/* FT3D-8 MP4 muxer (FloorPlanConstructionMp4): writes a complete, indexed ISO-BMFF file for one H.264 track
   produced by WebCodecs VideoEncoder (avc format: length-prefixed NAL units + avcC description).
   Unlike MediaRecorder's fragmented output, the file has a real duration (mvhd/mdhd), a keyframe index (stss) and a
   sample table (stts/stsz/stco), so any player can show its length and seek through it. Pure: no DOM, no network.
   inspect() parses the same structure back (used by tests and by the lab to check a file before offering it). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanConstructionMp4=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const err=s=>{throw new TypeError('FloorPlanConstructionMp4: '+s);};
  const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255],u16=n=>[(n>>>8)&255,n&255];
  const ascii=s=>[...s].map(c=>c.charCodeAt(0));
  const concat=parts=>{let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;};
  const box=(type,...parts)=>{const body=concat(parts.map(p=>p instanceof Uint8Array?p:Uint8Array.from(p)));return concat([Uint8Array.from([...u32(body.length+8),...ascii(type)]),body]);};
  const full=(type,version,flags,...parts)=>box(type,Uint8Array.from([version,(flags>>>16)&255,(flags>>>8)&255,flags&255]),...parts);
  const MATRIX=[0x00010000,0,0,0,0x00010000,0,0,0,0x40000000].flatMap(u32);
  function mux({width,height,fps,samples,avcC,timescale=90000,movieTimescale=1000}){
    if(!(width>0&&height>0))err('width/height required');
    if(!Number.isInteger(fps)||fps<=0||timescale%fps)err('fps must divide the timescale');
    if(!Array.isArray(samples)||!samples.length)err('samples required');
    if(!(avcC instanceof Uint8Array)||avcC.length<7||avcC[0]!==1)err('avcC (AVCDecoderConfigurationRecord) required');
    if(!samples[0].key)err('the first sample must be a keyframe');
    const delta=timescale/fps,count=samples.length,mediaDuration=count*delta,movieDuration=Math.round(mediaDuration*movieTimescale/timescale);
    const ftyp=box('ftyp',ascii('isom'),u32(0x200),ascii('isom'),ascii('iso2'),ascii('avc1'),ascii('mp41'));
    const data=concat(samples.map(s=>s.data));
    const mdat=concat([Uint8Array.from([...u32(data.length+8),...ascii('mdat')]),data]);
    const chunkOffset=ftyp.length+8;
    const keys=samples.map((s,i)=>s.key?i+1:0).filter(Boolean);
    const avc1=box('avc1',[0,0,0,0,0,0],u16(1),new Array(16).fill(0),u16(width),u16(height),u32(0x00480000),u32(0x00480000),u32(0),u16(1),
      new Array(32).fill(0),u16(0x0018),u16(0xffff),box('avcC',avcC));
    const stbl=box('stbl',
      full('stsd',0,0,u32(1),avc1),
      full('stts',0,0,u32(1),u32(count),u32(delta)),
      full('stss',0,0,u32(keys.length),keys.flatMap(u32)),
      full('stsc',0,0,u32(1),u32(1),u32(count),u32(1)),
      full('stsz',0,0,u32(0),u32(count),samples.flatMap(s=>u32(s.data.length))),
      full('stco',0,0,u32(1),u32(chunkOffset)));
    const minf=box('minf',full('vmhd',0,1,u16(0),u16(0),u16(0),u16(0)),box('dinf',full('dref',0,0,u32(1),full('url ',0,1))),stbl);
    const mdia=box('mdia',full('mdhd',0,0,u32(0),u32(0),u32(timescale),u32(mediaDuration),u16(0x55c4),u16(0)),
      full('hdlr',0,0,u32(0),ascii('vide'),u32(0),u32(0),u32(0),ascii('RUBIK FT3D-8 video'),[0]),minf);
    const tkhd=full('tkhd',0,3,u32(0),u32(0),u32(1),u32(0),u32(movieDuration),u32(0),u32(0),u16(0),u16(0),u16(0),u16(0),MATRIX,u32(width<<16),u32(height<<16));
    const mvhd=full('mvhd',0,0,u32(0),u32(0),u32(movieTimescale),u32(movieDuration),u32(0x00010000),u16(0x0100),u16(0),u32(0),u32(0),MATRIX,new Array(24).fill(0),u32(2));
    const moov=box('moov',mvhd,box('trak',tkhd,mdia));
    return concat([ftyp,mdat,moov]);
  }
  // Minimal reader of what mux() writes (and of standard MP4 boxes in general).
  function inspect(bytes){
    const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
    const type=o=>String.fromCharCode(b[o+4],b[o+5],b[o+6],b[o+7]);
    const walk=(start,end,depth=0)=>{const out=[];let o=start;while(o+8<=end){const size=dv.getUint32(o);if(size<8||o+size>end)break;const t=type(o);
      const node={type:t,offset:o,size};if(['moov','trak','mdia','minf','stbl','dinf'].includes(t))node.children=walk(o+8,o+size,depth+1);out.push(node);o+=size;}return out;};
    const top=walk(0,b.length),find=(list,path)=>{let cur=list,node=null;for(const t of path){node=(cur||[]).find(x=>x.type===t);if(!node)return null;cur=node.children;}return node;};
    const moov=top.find(x=>x.type==='moov');if(!moov)return {valid:false,boxes:top.map(x=>x.type),reason:'no moov box (fragmented or incomplete file)'};
    const mvhd=find(top,['moov']).children.find(x=>x.type==='mvhd'),mdhd=find(top,['moov','trak','mdia']).children.find(x=>x.type==='mdhd');
    const stbl=find(top,['moov','trak','mdia','minf','stbl']).children,by=t=>stbl.find(x=>x.type===t);
    const tkhd=find(top,['moov','trak']).children.find(x=>x.type==='tkhd');
    const mvTs=dv.getUint32(mvhd.offset+20),mvDur=dv.getUint32(mvhd.offset+24),mdTs=dv.getUint32(mdhd.offset+20),mdDur=dv.getUint32(mdhd.offset+24);
    const stts=by('stts'),stss=by('stss'),stsz=by('stsz');
    const sttsEntries=dv.getUint32(stts.offset+12);let samples=0,ticks=0;for(let i=0;i<sttsEntries;i++){const c=dv.getUint32(stts.offset+16+i*8),d=dv.getUint32(stts.offset+20+i*8);samples+=c;ticks+=c*d;}
    const keyCount=stss?dv.getUint32(stss.offset+12):samples,keys=stss?Array.from({length:keyCount},(_,i)=>dv.getUint32(stss.offset+16+i*4)):[];
    return {valid:true,boxes:top.map(x=>x.type),brand:String.fromCharCode(...b.slice(8,12)),movieTimescale:mvTs,movieDurationSec:mvDur/mvTs,mediaTimescale:mdTs,mediaDurationSec:mdDur/mdTs,
      sampleCount:samples,sampleCountStsz:dv.getUint32(stsz.offset+16),sampleTicks:ticks,keyframes:keys,width:dv.getUint32(tkhd.offset+84)>>>16,height:dv.getUint32(tkhd.offset+88)>>>16,
      codec:find(top,['moov','trak','mdia','minf','stbl'])&&String.fromCharCode(...b.slice(by('stsd').offset+20,by('stsd').offset+24))};
  }
  return Object.freeze({mux,inspect});
});

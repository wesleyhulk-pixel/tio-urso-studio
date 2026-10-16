/* Tio Urso Studio - MP4 muxer local, AVC/H264 video-only, ISO BMFF. No network dependencies. */
(function (global) {
 'use strict';
 const encoder = new TextEncoder();
 function u8(...v) {return Uint8Array.from(v.map(x=>x&255));}
 function u16(n) {return u8(n>>>8,n);}
 function u32(n) {return u8(n>>>24,n>>>16,n>>>8,n);}
 function str(s) {return encoder.encode(s);}
 function join(...parts){
  const data=parts.flat().map(p=>p instanceof Uint8Array?p:new Uint8Array(p));
  const n=data.reduce((a,p)=>a+p.byteLength,0),out=new Uint8Array(n);let cursor=0;
  for(const part of data){out.set(part,cursor);cursor+=part.length;}return out;
 }
 function box(name,...parts) {const data=join(...parts);return join(u32(data.length+8),str(name),data);}
 function full(name,version,flags,...parts){return box(name,u8(version,flags>>>16,flags>>>8,flags),...parts);}
 function pad(n){return new Uint8Array(n);}
 function matrix(){return join(u32(0x10000),u32(0),u32(0),u32(0),u32(0x10000),u32(0),u32(0),u32(0),u32(0x40000000));}
 function videoSampleEntry(width,height,avcc){
  const name=pad(32);
  return box('avc1',pad(6),u16(1),pad(16),u16(width),u16(height),u32(0x480000),u32(0x480000),u32(0),u16(1),name,u16(0x18),u16(0xffff),box('avcC',avcc));
 }
 function videoTrack(width,height,durationMs,totalTicks,videoTimescale,frames,avcc,dataOffset){
  const movieTimescale=1000;
  const tkhd=full('tkhd',0,7,u32(0),u32(0),u32(1),u32(0),u32(durationMs),pad(8),u16(0),u16(0),u16(0),u16(0),matrix(),u32(width<<16),u32(height<<16));
  const mdhd=full('mdhd',0,0,u32(0),u32(0),u32(videoTimescale),u32(totalTicks),u16(0x55c4),u16(0));
  const hdlr=full('hdlr',0,0,u32(0),str('vide'),pad(12),str('VideoHandler\0'));
  const vmhd=full('vmhd',0,1,u16(0),pad(6));
  const dref=full('dref',0,0,u32(1),full('url ',0,1));
  const stsd=full('stsd',0,0,u32(1),videoSampleEntry(width,height,avcc));
  const stts=full('stts',0,0,u32(1),u32(frames.length),u32(Math.round(videoTimescale*durationMs/1000/frames.length)));
  const stsc=full('stsc',0,0,u32(1),u32(1),u32(frames.length),u32(1));
  const stsz=full('stsz',0,0,u32(0),u32(frames.length),...frames.map(f=>u32(f.data.length)));
  const stco=full('stco',0,0,u32(1),u32(dataOffset));
  const keys=frames.map((f,i)=>f.key?i+1:null).filter(Boolean);
  const stss=full('stss',0,0,u32(keys.length),...keys.map(u32));
  const stbl=box('stbl',stsd,stts,stsc,stsz,stco,stss);
  const minf=box('minf',vmhd,box('dinf',dref),stbl);
  return box('trak',tkhd,box('mdia',mdhd,hdlr,minf));
 }
 function movieHeader(durationMs){
  return full('mvhd',0,0,u32(0),u32(0),u32(1000),u32(durationMs),u32(0x10000),u16(0x100),pad(10),matrix(),pad(24),u32(2));
 }
 class Mp4VideoMuxer {
  constructor({width,height,fps=24}){
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||width>4000||height>4000)throw new Error('Resolução de vídeo inválida.');
   this.width=width;this.height=height;this.fps=fps;this.frames=[];this.avcc=null;
  }
  add(chunk,metadata){
   if(metadata?.decoderConfig?.description){this.avcc=new Uint8Array(metadata.decoderConfig.description);}
   const bytes=new Uint8Array(chunk.byteLength);chunk.copyTo(bytes);
   this.frames.push({data:bytes,key:chunk.type==='key'});
  }
  finalize(){
   if(!this.frames.length||!this.avcc)throw new Error('O codificador não forneceu os dados H.264 necessários para MP4.');
   if(!this.frames[0].key)throw new Error('O primeiro quadro MP4 deve ser um quadro-chave.');
   const durationMs=Math.round(this.frames.length/this.fps*1000),timescale=90000;
   const ftyp=box('ftyp',str('isom'),u32(512),str('isom'),str('iso2'),str('avc1'),str('mp41'));
   const mdat=box('mdat',...this.frames.map(f=>f.data));
   const moov=box('moov',movieHeader(durationMs),videoTrack(this.width,this.height,durationMs,Math.round(durationMs*timescale/1000),timescale,this.frames,this.avcc,ftyp.length+8));
   return new Blob([ftyp,mdat,moov],{type:'video/mp4'});
  }
 }
 global.TioMp4VideoMuxer=Mp4VideoMuxer;
})(window);

/* Tio Urso Studio — GIF89a encoder local, sem CDN. */
'use strict';
let bytes=[];
let width=0,height=0,count=0;
const push=(...arr)=>{for(let i=0;i<arr.length;i++)bytes.push(arr[i]&255);};
const u16=n=>push(n&255,(n>>>8)&255);
const ascii=s=>{for(let i=0;i<s.length;i++)push(s.charCodeAt(i));};
function lzw(indices){
  let minCode=8,clear=1<<minCode,stop=clear+1,next=stop+1,bits=minCode+1;
  const dict=new Map();
  let current=0,nbits=0;
  const data=[];
  function emit(code){
    current |= code << nbits;
    nbits += bits;
    while(nbits>=8){data.push(current&255);current>>>=8;nbits-=8;}
  }
  emit(clear);
  let prev=indices[0]??0;
  for(let i=1;i<indices.length;i++){
    const symbol=indices[i];
    const key=(prev<<8)|symbol;
    const found=dict.get(key);
    if(found!==undefined){prev=found;continue;}
    emit(prev);
    // Reinicia o dicionário antes de ultrapassar os 9 bits.
    // Aumenta ligeiramente o tamanho, mas mantém o GIF leve e confiável no Android.
    if(next<480){dict.set(key,next++);}
    else{emit(clear);dict.clear();next=stop+1;bits=minCode+1;}
    prev=symbol;
  }
  emit(prev);
  emit(stop);
  if(nbits>0)data.push(current&255);
  return data;
}
function writeBlocks(data){
  for(let i=0;i<data.length;i+=255){
    const n=Math.min(255,data.length-i);push(n);
    for(let j=0;j<n;j++)push(data[i+j]);
  }
  push(0);
}
function initialize(w,h){
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>1200||h>1800)throw Error('Invalid GIF size');
  width=w|0;height=h|0;count=0;bytes=[];
  ascii('GIF89a');u16(width);u16(height);push(0xF7,0,0);
  for(let i=0;i<256;i++)push(Math.round(((i>>5)&7)*255/7),Math.round(((i>>2)&7)*255/7),Math.round((i&3)*255/3));
  push(0x21,0xff,11);ascii('NETSCAPE2.0');push(3,1,0,0,0);
}
function frame(data, delay){
  if(!(data instanceof Uint8ClampedArray)||data.length!==width*height*4)throw Error('Invalid frame');
  let indexes=new Uint8Array(width*height);
  for(let i=0,j=0;i<data.length;i+=4,j++){
    let a=data[i+3]/255,r=data[i],g=data[i+1],b=data[i+2];
    if(a<1){r=r*a+244*(1-a);g=g*a+248*(1-a);b=b*a+250*(1-a);}
    indexes[j]=(r>>5)<<5|((g>>5)<<2)|(b>>6);
  }
  const time=Math.max(2,Math.min(65535,Math.round(delay/10)));
  push(0x21,0xF9,4,0x08);u16(time);push(0,0);
  push(0x2C);u16(0);u16(0);u16(width);u16(height);push(0);
  push(8);
  writeBlocks(lzw(indexes));
  count++;
  self.postMessage({type:'progress',frame:count});
}
self.onmessage=e=>{
  const d=e.data;
  try{
    if(d.type==='init'){initialize(d.width,d.height);self.postMessage({type:'ready'});}
    else if(d.type==='frame')frame(new Uint8ClampedArray(d.buffer),d.delay);
    else if(d.type==='finish'){
      if(!count)throw Error('Nenhum quadro recebido');
      push(0x3B);
      const result=new Uint8Array(bytes);
      self.postMessage({type:'done',buffer:result.buffer,frames:count},[result.buffer]);
      bytes=[];
    }
  }catch(err){self.postMessage({type:'error',message:String(err?.message||err)});}
};

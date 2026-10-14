/* Tio Urso Studio Alpha 0.7.7 — caneca real do Meshy — correção da geometria da caneca tradicional.
 * Ajusta proporção do corpo, posição/forma da alça e mapeamento da arte. */
(() => {
'use strict';
function createTioMock3D(canvas){
 let gl;
 try { gl = canvas.getContext('webgl', {alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false}); }
 catch(_) { return {supported:false}; }
 if(!gl) return {supported:false};

 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;
 uniform float yaw;uniform float aspect;varying vec2 vUv;varying float shade;
 void main(){
   float c=cos(yaw),s=sin(yaw);
   vec3 pos=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
   vec3 nor=normalize(vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z));
   float py=pos.y*.958-pos.z*.286;
   float pz=pos.z*.958+pos.y*.286;
   float depth=5.7-pz;
   float f=2.48;
   gl_Position=vec4(pos.x*f/aspect,py*f,(depth*1.003-.201),depth);
   shade=.82+.18*max(dot(nor,normalize(vec3(-.45,.75,1.0))),0.);
   vUv=uv;
 }`;
 const fs=`precision mediump float;varying vec2 vUv;varying float shade;
 uniform sampler2D tex;uniform vec3 base;uniform float textured;uniform float repeatU;
 void main(){
   vec3 col=base;
   if(textured>.5 && (repeatU>.5 || (vUv.x>=0. && vUv.x<=1.)) && vUv.y>=0. && vUv.y<=1.) col=texture2D(tex,vUv).rgb;
   float sideLight=1.0;
   if(textured>.5 && vUv.x>=0. && vUv.x<=1.) sideLight=.992-.06*pow(abs(vUv.x-.5)*2.,2.);
   col*=shade*sideLight;
   gl_FragColor=vec4(min(col*1.055,vec3(1.)),1.);
 }`;

 function compile(type, source){
   const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
   if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
   return s;
 }

 let program;
 try {
   program=gl.createProgram();
   gl.attachShader(program, compile(gl.VERTEX_SHADER,vs));
   gl.attachShader(program, compile(gl.FRAGMENT_SHADER,fs));
   gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
 } catch(e){ return {supported:false,error:String(e)}; }
 gl.useProgram(program);

 const ap=gl.getAttribLocation(program,'p');
 const an=gl.getAttribLocation(program,'n');
 const au=gl.getAttribLocation(program,'uv');
 const yy=gl.getUniformLocation(program,'yaw');
 const aspect=gl.getUniformLocation(program,'aspect');
 const color=gl.getUniformLocation(program,'base');
 const textured=gl.getUniformLocation(program,'textured');
 const repeatU=gl.getUniformLocation(program,'repeatU');

 const texture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'tex'),0);
 gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);

 const meshCache=new Map();
 let meshyMug=null;
 let meshyError=null;
 let meshySqueeze=null;
 let squeezeMaterialReady=false;
 const squeezeMaterial=gl.createTexture();
 // Centraliza pelo eixo do CORPO cerâmico (e não pelo bounding box com a alça).
 // Assim o modelo gira como uma caneca sobre seu eixo vertical, sem orbitar.
 function normalizeMeshyGeometry(parts){
   const body=parts[0];
   const bmin=[Infinity,Infinity,Infinity], bmax=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<body.length;i+=8){
     for(let k=0;k<3;k++){
       const v=body[i+k];
       bmin[k]=Math.min(bmin[k],v); bmax[k]=Math.max(bmax[k],v);
     }
   }
   const centerX=(bmin[0]+bmax[0])*0.5;
   const centerY=(bmin[1]+bmax[1])*0.5;
   const centerZ=(bmin[2]+bmax[2])*0.5;
   const height=bmax[1]-bmin[1];
   const printBottom=bmin[1]+height*.035;
   const printHeight=height*.93;
   // 80% da circunferência; área branca atrás da caneca e sob a alça.
   // Diferente do antigo UV automático, não repete nem estica a arte na emenda.
   const halfArc=Math.PI*.80;
   return parts.map((source,partIndex)=>{
     const copy=new Float32Array(source);
     for(let i=0;i<copy.length;i+=8){
       const x=source[i]-centerX;
       const y=source[i+1]-centerY;
       const z=source[i+2]-centerZ;
       copy[i]=x;copy[i+1]=y;copy[i+2]=z;
       if(partIndex===0){
         const theta=Math.atan2(x,z);
         copy[i+6]=(theta+halfArc)/(2*halfArc);
         copy[i+7]=(source[i+1]-printBottom)/printHeight;
       }
     }
     if(partIndex===0){
       // Triângulos que atravessam a junção angular traseira não podem
       // interpolar 0..1 pelo meio da estampa, o que causava arte duplicada.
       for(let i=0;i<copy.length;i+=24){
         let lo=Infinity,hi=-Infinity;
         const angles=[];
         for(let j=0;j<3;j++){
           const off=i+j*8;
           const theta=Math.atan2(copy[off],copy[off+2]);
           angles.push(theta);
           lo=Math.min(lo,theta);hi=Math.max(hi,theta);
         }
         if(hi-lo>Math.PI){
           // Mesmo ramo angular perto de +/-180 graus, na área NÃO impressa.
           // Leva todas as coordenadas UV além de 1: corpo branco na emenda.
           for(let j=0;j<3;j++){
             const off=i+j*8;
             const fixed=angles[j]<0?angles[j]+2*Math.PI:angles[j];
             copy[off+6]=(fixed+halfArc)/(2*halfArc);
           }
         }
       }
     }
     return copy;
   });
 }
 async function loadMeshyMug(){
   try{
     const resp=await fetch('meshy-caneca.bin?v=0710',{cache:'no-store'});
     if(!resp.ok)throw new Error('Falha ao carregar o modelo Meshy: HTTP '+resp.status);
     const buffer=await resp.arrayBuffer();
     const reader=new DataView(buffer);
     const signature=String.fromCharCode(...new Uint8Array(buffer,0,4));
     if(signature!=='TUM7')throw new Error('Geometria Meshy incompatível');
     let offset=4; const raw=[];
     for(let i=0;i<4;i++){
       const count=reader.getUint32(offset,true);offset+=4;
       if(count>500000||offset+count*32>buffer.byteLength)throw new Error('Modelo Meshy incompleto');
       // Copia para evitar limitações de alinhamento e editar a malha separadamente.
       const part=new Float32Array(buffer,offset,count*8);
       raw.push(new Float32Array(part));offset+=count*32;
     }
     const parts=normalizeMeshyGeometry(raw).map(upload);
     meshyMug={body:parts[0],inside:parts[1],handle:parts[2],trim:parts[3],insideFloor:null};
     window.dispatchEvent(new Event('tio-meshy-ready'));
   }catch(error){
     meshyError=error; console.warn('Meshy:',error);
     window.dispatchEvent(new Event('tio-meshy-failed'));
   }
 }


 // Novo modelo GLB convertido do Meshy: superfície da estampa e peças originais
 // separadas. A malha da caneca de café permanece INTACTA.
 async function loadMeshySqueeze(){
   try{
     const resp=await fetch('meshy-squeeze.bin?v=0770',{cache:'no-store'});
     if(!resp.ok)throw new Error('Não foi possível carregar o squeeze Meshy');
     const data=await resp.arrayBuffer(), view=new DataView(data);
     const signature=String.fromCharCode(...new Uint8Array(data,0,4));
     if(signature!=='TUSQ')throw new Error('Squeeze Meshy incompatível');
     let off=4, lists=[];
     for(let part=0;part<2;part++){
       if(off+4>data.byteLength)throw new Error('Arquivo incompleto');
       const count=view.getUint32(off,true);off+=4;
       if(count>350000||off+count*32>data.byteLength)throw new Error('Geometria incorreta');
       // Cópia independente da malha: preservar o arquivo Meshy e as coordenadas U.
       const item=new Float32Array(new Float32Array(data,off,count*8));
       if(part===0){
         // Ajuste SOMENTE no corpo sublimável do squeeze.
         // A ideia aqui é alongar o corpo um pouco PARA BAIXO, ancorando-o logo
         // abaixo da tampa. Assim a arte cobre melhor o pé branco inferior sem
         // mexer no material cinza/preto da tampa e sem apagar a borda preta.
         let topY=-Infinity;
         for(let i=0;i<item.length;i+=8) topY=Math.max(topY,item[i+1]);
         const topInset=0.020;
         const scaleDown=1.085;
         for(let i=0;i<item.length;i+=8){
           const dy=topY-item[i+1];
           item[i+1]=(topY-topInset)-(dy*scaleDown);
         }
       }
       lists.push(upload(item)); off+=count*32;
     }
     meshySqueeze={body:lists[0],extras:lists[1]};
     window.dispatchEvent(new Event('tio-meshy-ready'));
   }catch(err){console.warn('Squeeze Meshy:',err);}
 }
 function loadSqueezeMaterial(){
   const im=new Image();
   im.onload=()=>{
     gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,squeezeMaterial);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     squeezeMaterialReady=true;
     window.dispatchEvent(new Event('tio-meshy-ready'));
   };
   im.onerror=()=>console.warn('Não foi possível carregar os materiais do squeeze');
   im.src='squeeze-material.jpg?v=0770';
 }
 const mesh = () => [];
 const vec3 = (x,y,z) => [x,y,z];
 const sub = (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
 const add = (a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
 const mul = (a,s) => [a[0]*s, a[1]*s, a[2]*s];
 const len = a => Math.hypot(a[0],a[1],a[2]) || 1;
 const norm = a => { const l=len(a); return [a[0]/l,a[1]/l,a[2]/l]; };

 function vertex(dst,pt,n,u=-1,v=-1){ dst.push(pt[0],pt[1],pt[2],n[0],n[1],n[2],u,v); }
 function quad(dst,a,b,c,d,normal,uvs=[[-1,-1],[-1,-1],[-1,-1],[-1,-1]]){
   vertex(dst,a,normal,...uvs[0]); vertex(dst,b,normal,...uvs[1]); vertex(dst,c,normal,...uvs[2]);
   vertex(dst,a,normal,...uvs[0]); vertex(dst,c,normal,...uvs[2]); vertex(dst,d,normal,...uvs[3]);
 }
 function ring(dst,outer,inner,y,matNormal){
   const N=88;
   for(let i=0;i<N;i++){
     const a=(i/N)*2*Math.PI, b=((i+1)/N)*2*Math.PI;
     const p=(r,t)=>[r*Math.sin(t),y,r*Math.cos(t)];
     quad(dst,p(outer,a),p(outer,b),p(inner,b),p(inner,a),matNormal);
   }
 }
 function cylinder(dst, rBottom,rTop,bottom,top,{inward=false,uvMode='window'}={}){
   const N=180;
   for(let j=0;j<N;j++){
     const a=-Math.PI + j/N*Math.PI*2;
     const b=-Math.PI + (j+1)/N*Math.PI*2;
     const rr=(phi,r,y)=>[Math.sin(phi)*r, y, Math.cos(phi)*r];
     const normal=norm([Math.sin((a+b)/2), .035, Math.cos((a+b)/2)]).map(v=>v*(inward?-1:1));
     const uvFor = (phi) => {
       if(uvMode==='full') return (phi + Math.PI) / (2*Math.PI);
       // Janela frontal mais estreita para a arte parecer menos "achatada"
       // e mais próxima da proporção percebida na referência.
       if(uvMode==='front') return (phi + Math.PI*0.62) / (Math.PI*1.24);
       return -1;
     };
     quad(dst,
       rr(a,rBottom,bottom), rr(b,rBottom,bottom), rr(b,rTop,top), rr(a,rTop,top),
       normal,
       [[uvFor(a),0],[uvFor(b),0],[uvFor(b),1],[uvFor(a),1]]
     );
   }
 }

 function sweepTube(dst, pathFn, segments, sides, tubeRadius){
   for(let i=0;i<segments;i++){
     const t=i/segments, t2=(i+1)/segments;
     const p=pathFn(t), q=pathFn(t2);
     const pa=pathFn(Math.max(0,t-0.001)), pb=pathFn(Math.min(1,t+0.001));
     const qa=pathFn(Math.max(0,t2-0.001)), qb=pathFn(Math.min(1,t2+0.001));
     const tan1=norm(sub(pb,pa));
     const tan2=norm(sub(qb,qa));
     const n1=norm([-tan1[1], tan1[0], 0]);
     const n2=norm([-tan2[1], tan2[0], 0]);
     const b1=[0,0,1], b2=[0,0,1];
     for(let k=0;k<sides;k++){
       const ang=(k/sides)*2*Math.PI, ang2=((k+1)/sides)*2*Math.PI;
       const pt=(center,norm2,binorm,a)=> add(center, add(mul(norm2, Math.cos(a)*tubeRadius), mul(binorm, Math.sin(a)*tubeRadius)));
       const a=pt(p,n1,b1,ang), b=pt(p,n1,b1,ang2), c=pt(q,n2,b2,ang2), d=pt(q,n2,b2,ang);
       const mid=(ang+ang2)*0.5;
       const nm = norm(add(mul(n1, Math.cos(mid)), mul(b1, Math.sin(mid))));
       quad(dst,a,b,c,d,nm);
     }
   }
 }

 function mugHandle(dst, radius, topY, bottomY){
   const yMid=(topY+bottomY)/2;
   const half=(topY-bottomY)/2;
   const attachX=radius*0.88;
   const depth=0.60;
   const tubeR=0.12;
   sweepTube(dst, t => {
     const theta=-Math.PI/2 + t*Math.PI;
     return vec3(attachX + depth*Math.cos(theta), yMid + half*Math.sin(theta), 0);
   }, 72, 18, tubeR);
 }

 // Alça da caneca tradicional: fica no plano YZ, na RETAGUARDA (-Z).
 // A frente da estampa está em +Z; a emenda UV da arte fica no lado oposto (-Z).
 // Uma seção circular acompanha a semicircunferência da alça sem pontas.
 function coffeeHandle(dst, radius, top, bottom){
   const segments=128, sides=24;
   const yMid=(top+bottom)/2;
   const half=(top-bottom)/2;
   const zAttach=-radius*0.985; // penetra discretamente no corpo cerâmico
   const outerDepth=0.70;       // abertura moderada em C, próxima da referência
   const tubeRadius=0.086;      // espessura visual realista da alça
   function point(t, alpha){
     const theta=-Math.PI/2+t*Math.PI;
     const center=[0, yMid+half*Math.sin(theta), zAttach-outerDepth*Math.cos(theta)];
     // Derivada analítica da curva no plano YZ.
     const tangent=norm([0, half*Math.PI*Math.cos(theta), outerDepth*Math.PI*Math.sin(theta)]);
     // Vetores perpendiculares à tangente para criar tubo CIRCULAR, não achatado.
     const across=[1,0,0];
     const radialYZ=norm([0,-tangent[2],tangent[1]]);
     const normal=norm(add(mul(across,Math.cos(alpha)),mul(radialYZ,Math.sin(alpha))));
     return {position:add(center,mul(normal,tubeRadius)),normal};
   }
   function face(a,b,c){
     vertex(dst,a.position,a.normal);
     vertex(dst,b.position,b.normal);
     vertex(dst,c.position,c.normal);
   }
   for(let i=0;i<segments;i++){
     const t=i/segments,tNext=(i+1)/segments;
     for(let j=0;j<sides;j++){
       const a=(j/sides)*Math.PI*2, b=((j+1)/sides)*Math.PI*2;
       const p=point(t,a),q=point(t,b),r=point(tNext,b),v=point(tNext,a);
       face(p,q,r);face(p,r,v);
     }
   }
 }

 function ceramicInteriorFloor(dst,radius,y){
   const N=96;
   for(let i=0;i<N;i++){
     const a=i*2*Math.PI/N,b=(i+1)*2*Math.PI/N;
     const center=[0,y,0],p=[Math.sin(a)*radius,y,Math.cos(a)*radius],q=[Math.sin(b)*radius,y,Math.cos(b)*radius];
     vertex(dst,center,[0,1,0]);vertex(dst,p,[0,1,0]);vertex(dst,q,[0,1,0]);
   }
 }
 function choppHandle(dst, radius, topY, bottomY){
   const attachX=radius*0.84;
   const outerX=radius+0.46;
   const r=0.16;
   const top=topY, bottom=bottomY;
   const y1=top-r, y2=bottom+r;
   const x1=attachX+r, x2=outerX-r;
   function path(t){
     if(t<0.20){ // top horizontal saindo do corpo
       const s=t/0.20; return vec3(attachX + (x2-attachX)*s, top, 0);
     }
     if(t<0.35){ // curva superior
       const s=(t-0.20)/0.15; const ang=-Math.PI/2 + s*Math.PI/2;
       return vec3(x2 + r*Math.cos(ang), y1 + r*Math.sin(ang), 0);
     }
     if(t<0.65){ // lateral externa reta
       const s=(t-0.35)/0.30; return vec3(outerX, y1 + (y2-y1)*s, 0);
     }
     if(t<0.80){ // curva inferior
       const s=(t-0.65)/0.15; const ang=0 + s*Math.PI/2;
       return vec3(x2 + r*Math.cos(ang), y2 + r*Math.sin(ang), 0);
     }
     const s=(t-0.80)/0.20; // base voltando ao corpo
     return vec3(x2 + (attachX-x2)*s, bottom, 0);
   }
   sweepTube(dst, path, 84, 18, 0.105);
 }

 function upload(src){
   if(!src.length) return null;
   const buf=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,buf);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(src),gl.STATIC_DRAW);
   return {buffer:buf,count:src.length/8};
 }

 function makeProduct(kind){
   const tall = kind==='chopp' ? 2.55 : kind==='squeeze' ? 2.65 : kind==='caneca' ? 2.32 : 1.98;
   const radius = kind==='squeeze' ? 0.82 : kind==='chopp' ? 1.10 : kind==='caneca' ? 0.95 : 1.10;
   const up=tall/2, down=-tall/2;
   const bR = kind==='chopp' ? radius*0.84 : kind==='squeeze' ? radius*0.96 : kind==='caneca' ? radius*0.988 : radius*0.985;

   const body=mesh(), trim=mesh(), inside=mesh(), insideFloor=mesh(), handle=mesh();
   const uvMode = (kind==='squeeze' || kind==='caneca' || kind==='chopp') ? 'full' : 'front';

   if(kind==='squeeze'){
     cylinder(body, radius*0.96, radius, down+0.04, up-0.16, {uvMode:'full'});
     cylinder(trim, 0.42, 0.42, up-0.10, up+0.28);
     ring(trim, 0.45, 0.10, up+0.28, [0,1,0]);
     cylinder(trim, 0.21, 0.21, up+0.28, up+0.44);
     ring(trim, radius+0.01, radius-0.06, down+0.04, [0,-1,0]);
   } else {
     cylinder(body, bR, radius, down+0.05, up-0.10, {uvMode});
     if(kind==='caneca'){
       cylinder(inside, radius-0.024, radius-0.028, up-0.34, up-0.094, {inward:true});
       ceramicInteriorFloor(insideFloor,radius-0.024,up-0.34);
       ring(trim, radius+0.002, radius-0.024, up-0.090, [0,1,0]);
       ring(trim, bR+0.003, bR-0.016, down+0.05, [0,-1,0]);
     }else{
       cylinder(inside, radius-0.048, radius-0.052, up-0.41, up-0.097, {inward:true});
       ring(trim, radius+0.004, radius-0.058, up-0.089, [0,1,0]);
       ring(trim, bR+0.006, bR-0.028, down+0.05, [0,-1,0]);
     }
     if(kind==='chopp') choppHandle(handle, radius, up-0.46, down+0.44);
     else coffeeHandle(handle, radius, up-0.25, down+0.22);
   }

   return { body:upload(body), trim:upload(trim), inside:upload(inside), insideFloor:upload(insideFloor), handle:upload(handle) };
 }

 function draw(obj, rgb, useTexture){
   if(!obj) return;
   gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);
   const stride=8*4;
   gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap,3,gl.FLOAT,false,stride,0);
   gl.enableVertexAttribArray(an); gl.vertexAttribPointer(an,3,gl.FLOAT,false,stride,12);
   gl.enableVertexAttribArray(au); gl.vertexAttribPointer(au,2,gl.FLOAT,false,stride,24);
   gl.uniform1f(textured, useTexture?1:0);
   gl.uniform3f(color, rgb[0], rgb[1], rgb[2]);
   gl.drawArrays(gl.TRIANGLES, 0, obj.count);
 }

 let wasLost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();wasLost=true;});

 function finishColor(hex){
   if(typeof hex!=='string'||!/^#[0-9a-fA-F]{6}$/.test(hex))return [1,1,1];
   return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 }
 function render(kind, art, angle, mugFinishColor='#ffffff'){
   if(wasLost) return false;
   if(kind==='caneca' && !meshyMug)return false;
   if(kind==='squeeze' && !meshySqueeze)return false;
   const config = kind==='caneca' ? meshyMug : kind==='squeeze' ? meshySqueeze : (meshCache.get(kind) || makeProduct(kind));
   if(kind!=='caneca'&&kind!=='squeeze') meshCache.set(kind,config);

   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform1f(yy, (kind==='caneca'?-angle:angle)*Math.PI/180);
   gl.uniform1f(aspect, canvas.width/canvas.height);
   gl.uniform1f(repeatU,kind==='squeeze'?1:0);
   gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   if(kind==='squeeze'){
     // Textura POT para GL_REPEAT na emenda 360°, sem faixa branca ou costura.
     if(!render.squeezeCanvas){render.squeezeCanvas=document.createElement('canvas');render.squeezeCanvas.width=1024;render.squeezeCanvas.height=1024;}
     const sc=render.squeezeCanvas,ctx=sc.getContext('2d');
     ctx.clearRect(0,0,1024,1024); ctx.drawImage(art,0,0,1024,1024);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sc);
   }else{
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);
   }
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,kind==='squeeze'?gl.REPEAT:gl.CLAMP_TO_EDGE);
   if(kind==='squeeze'){
     draw(config.body,[1,1,1],true);
     gl.bindTexture(gl.TEXTURE_2D,squeezeMaterial);
     draw(config.extras,[.94,.95,.96],squeezeMaterialReady);
     gl.flush();
     const err=gl.getError();
     if(err!==gl.NO_ERROR)return false;
     const p=new Uint8Array(4);
     gl.readPixels(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);
     return p[3]>0;
   }

   const isCoffee=kind==='caneca';
   const finish=isCoffee?finishColor(mugFinishColor):[1,1,1];
   draw(config.body,[1,1,1],true);
   if(kind!=='squeeze')draw(config.inside,isCoffee?finish:[.75,.80,.85],false);
   if(isCoffee)draw(config.insideFloor,finish,false);
   draw(config.trim,kind==='squeeze'?[.17,.20,.24]:[.965,.978,.992],false);
   draw(config.handle,isCoffee?finish:(kind==='chopp'?[.97,.98,1]:[.975,.985,1]),false);
   gl.flush();
   // Confirma que o renderizador desenhou algo; evita mockup vazio em falhas de WebGL.
   const glError = gl.getError();
   if(glError !== gl.NO_ERROR) return false;
   const centerPixel = new Uint8Array(4);
   gl.readPixels(Math.floor(canvas.width/2), Math.floor(canvas.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, centerPixel);
   return centerPixel[3] > 0;
 }

 loadMeshyMug();
 loadMeshySqueeze();
 loadSqueezeMaterial();
 return {supported:true,render,getMeshyStatus:()=>meshyMug?'ready':meshyError?'error':'loading'};
}
window.createTioMock3D=createTioMock3D;
})();

/* Tio Urso Studio Alpha 0.6.0 — foco exclusivo no modelo da caneca tradicional.
 * Geometrias de chopp e squeeze preservadas; refinando a caneca tradicional. */
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
 uniform sampler2D tex;uniform vec3 base;uniform float textured;
 void main(){
   vec3 col=base;
   if(textured>.5 && vUv.x>=0. && vUv.x<=1. && vUv.y>=0. && vUv.y<=1.) col=texture2D(tex,vUv).rgb;
   float sideLight=1.0;
   if(textured>.5 && vUv.x>=0. && vUv.x<=1.) sideLight=.985-.10*pow(abs(vUv.x-.5)*2.,2.);
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

 const texture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'tex'),0);
 gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);

 const meshCache=new Map();
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
       if(uvMode==='front') return (phi + Math.PI*0.75) / (Math.PI*1.5);
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

 // Alça cerâmica da caneca de café. Eixo local na retaguarda (-Z),
 // garantindo Frente=escondida, Esquerda=esquerda, Direita=direita.
 // Curva cúbica lisa, tubo circular com as pontas embutidas no corpo.
 function coffeeHandle(dst, radius, top, bottom){
   const tubeR=0.115;
   const zStart=-radius+0.12;
   const zOutside=-radius-0.82;
   const yMid=(top+bottom)/2;
   const half=(top-bottom)/2;
   const cubic=(a,b,c,d,t)=>{const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d;};
   function curve(t){
     return [
       cubic(0,0.02,0.02,0,t),
       cubic(top, top-half*0.08, bottom+half*0.08, bottom, t),
       cubic(zStart, zOutside, zOutside, zStart, t)
     ];
   }
   function section(t,a){
     const center=curve(t),before=curve(Math.max(0,t-.0004)),after=curve(Math.min(1,t+.0004));
     const tangent=norm(sub(after,before));
     const ref=[1,0,0];
     let n=norm([ref[1]*tangent[2]-ref[2]*tangent[1], ref[2]*tangent[0]-ref[0]*tangent[2], ref[0]*tangent[1]-ref[1]*tangent[0]]);
     if(!isFinite(n[0]))n=[1,0,0];
     const b=[tangent[1]*n[2]-tangent[2]*n[1], tangent[2]*n[0]-tangent[0]*n[2], tangent[0]*n[1]-tangent[1]*n[0]];
     const c=Math.cos(a),s=Math.sin(a);
     return [center[0]+tubeR*(n[0]*c+b[0]*s),center[1]+tubeR*(n[1]*c+b[1]*s),center[2]+tubeR*(n[2]*c+b[2]*s)];
   }
   const N=112,M=24;
   for(let i=0;i<N;i++){
     const t=i/N,t2=(i+1)/N;
     for(let j=0;j<M;j++){
       const a=j*2*Math.PI/M,b=(j+1)*2*Math.PI/M;
       const v0=section(t,a),v1=section(t,b),v2=section(t2,b),v3=section(t2,a);
       const c0=curve((t+t2)*.5);
       const mid=[(v0[0]+v1[0]+v2[0]+v3[0])*.25-c0[0],(v0[1]+v1[1]+v2[1]+v3[1])*.25-c0[1],(v0[2]+v1[2]+v2[2]+v3[2])*.25-c0[2]];
       quad(dst,v0,v1,v2,v3,norm(mid));
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
   const tall = kind==='chopp' ? 2.55 : kind==='squeeze' ? 2.65 : 1.98;
   const radius = kind==='squeeze' ? 0.82 : kind==='chopp' ? 1.10 : 1.10;
   const up=tall/2, down=-tall/2;
   const bR = kind==='chopp' ? radius*0.84 : kind==='squeeze' ? radius*0.96 : radius*0.985;

   const body=mesh(), trim=mesh(), inside=mesh(), insideFloor=mesh(), handle=mesh();
   const uvMode = kind==='squeeze' ? 'full' : 'front';

   if(kind==='squeeze'){
     cylinder(body, radius*0.96, radius, down+0.04, up-0.16, {uvMode:'full'});
     cylinder(trim, 0.42, 0.42, up-0.10, up+0.28);
     ring(trim, 0.45, 0.10, up+0.28, [0,1,0]);
     cylinder(trim, 0.21, 0.21, up+0.28, up+0.44);
     ring(trim, radius+0.01, radius-0.06, down+0.04, [0,-1,0]);
   } else {
     cylinder(body, bR, radius, down+0.05, up-0.10, {uvMode});
     cylinder(inside, radius-0.09, radius-0.095, up-0.50, up-0.09, {inward:true});
     if(kind==='caneca')ceramicInteriorFloor(insideFloor,radius-0.09,up-0.50);
     ring(trim, radius+0.012, radius-0.108, up-0.085, [0,1,0]);
     ring(trim, bR+0.01, bR-0.045, down+0.05, [0,-1,0]);
     if(kind==='chopp') choppHandle(handle, radius, up-0.46, down+0.44);
     else coffeeHandle(handle, radius, up-0.44, down+0.40);
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
   const config = meshCache.get(kind) || makeProduct(kind);
   meshCache.set(kind, config);

   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform1f(yy, (kind==='caneca'?-angle:angle)*Math.PI/180);
   gl.uniform1f(aspect, canvas.width/canvas.height);
   gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);

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

 return {supported:true,render};
}
window.createTioMock3D=createTioMock3D;
})();

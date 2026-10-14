/* Tio Urso Studio Alpha 0.5.6 — mockup 3D local sem dependências externas.
 * Correções: alças redesenhadas para caneca/chopp e fechamento 360° do squeeze. */
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
   float py=pos.y*.977-pos.z*.213;
   float pz=pos.z*.977+pos.y*.213;
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
   float sideLight=.985-.10*pow(abs(vUv.x-.5)*2.,2.);
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
   const tall = kind==='chopp' ? 2.55 : kind==='squeeze' ? 2.65 : 2.10;
   const radius = kind==='squeeze' ? 0.82 : kind==='chopp' ? 1.10 : 1.14;
   const up=tall/2, down=-tall/2;
   const bR = kind==='chopp' ? radius*0.84 : kind==='squeeze' ? radius*0.96 : radius*0.96;

   const body=mesh(), trim=mesh(), inside=mesh(), handle=mesh();
   const uvMode = kind==='squeeze' ? 'full' : 'front';

   if(kind==='squeeze'){
     cylinder(body, radius*0.96, radius, down+0.04, up-0.16, {uvMode:'full'});
     cylinder(trim, 0.42, 0.42, up-0.10, up+0.28);
     ring(trim, 0.45, 0.10, up+0.28, [0,1,0]);
     cylinder(trim, 0.21, 0.21, up+0.28, up+0.44);
     ring(trim, radius+0.01, radius-0.06, down+0.04, [0,-1,0]);
   } else {
     cylinder(body, bR, radius, down+0.05, up-0.10, {uvMode});
     cylinder(inside, radius-0.095, radius-0.10, up-0.53, up-0.095, {inward:true});
     ring(trim, radius+0.012, radius-0.115, up-0.09, [0,1,0]);
     ring(trim, bR+0.01, bR-0.045, down+0.05, [0,-1,0]);
     if(kind==='chopp') choppHandle(handle, radius, up-0.46, down+0.44);
     else mugHandle(handle, radius, up-0.48, down+0.44);
   }

   return { body:upload(body), trim:upload(trim), inside:upload(inside), handle:upload(handle) };
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

 function render(kind, art, angle){
   if(wasLost) return;
   const config = meshCache.get(kind) || makeProduct(kind);
   meshCache.set(kind, config);

   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform1f(yy, angle*Math.PI/180);
   gl.uniform1f(aspect, canvas.width/canvas.height);
   gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);

   draw(config.body,[1,1,1],true);
   if(kind!=='squeeze') draw(config.inside,[.75,.80,.85],false);
   draw(config.trim, kind==='squeeze' ? [.17,.20,.24] : [.965,.978,.992], false);
   draw(config.handle, kind==='chopp' ? [.97,.98,1] : [.975,.985,1], false);
   gl.flush();
 }

 return {supported:true,render};
}
window.createTioMock3D=createTioMock3D;
})();

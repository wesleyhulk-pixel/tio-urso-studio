/* Tio Urso Studio Alpha 0.5.3 — mockup 3D com cobertura total da arte e alça arredondada. */
(() => {
'use strict';
function createTioMock3D(canvas){
 let gl;
 try {gl=canvas.getContext('webgl',{alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false});}catch(_){return{supported:false};}
 if(!gl) return {supported:false};
 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;
 uniform float yaw;uniform float aspect;varying vec2 vUv;varying float shade;
 void main(){
   float c=cos(yaw),s=sin(yaw);
   vec3 pos=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
   vec3 nor=normalize(vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z));
   float py=pos.y*.985-pos.z*.12;
   float pz=pos.z*.985+pos.y*.12;
   float depth=6.1-pz;float f=2.18;
   gl_Position=vec4(pos.x*f/aspect,py*f,(depth*1.003-.201),depth);
   vec3 light=normalize(vec3(-.38,.8,1.0));
   shade=.78+.22*max(dot(nor,light),0.0);
   vUv=uv;
 }`;
 const fs=`precision mediump float;varying vec2 vUv;varying float shade;
 uniform sampler2D tex;uniform vec3 base;uniform float textured;
 void main(){
   vec3 col=base;
   if(textured>.5){
     float gap=0.055;             // pequena folga de alça, não metade da caneca
     float u=fract(vUv.x);        // 0/1 ficam na retaguarda da peça
     float artU;
     if(u<gap*0.5 || u>1.0-gap*0.5){
       col=base;
     }else{
       artU=(u-gap*0.5)/(1.0-gap);
       col=texture2D(tex, vec2(artU, clamp(vUv.y,0.0,1.0))).rgb;
     }
   }
   float sideLight=.985-.07*pow(abs(fract(vUv.x)-.5)*2.0,2.0);
   col*=shade*sideLight;
   gl_FragColor=vec4(min(col*1.04,vec3(1.0)),1.0);
 }`;
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try {program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(e){return {supported:false,error:String(e)};}
 gl.useProgram(program);
 const ap=gl.getAttribLocation(program,'p'),an=gl.getAttribLocation(program,'n'),au=gl.getAttribLocation(program,'uv');
 const yy=gl.getUniformLocation(program,'yaw'),aspect=gl.getUniformLocation(program,'aspect'),color=gl.getUniformLocation(program,'base'),textured=gl.getUniformLocation(program,'textured');
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'tex'),0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 const meshCache=new Map();
 function vertex(dst,pt,n,u=-1,v=-1){dst.push(pt[0],pt[1],pt[2],n[0],n[1],n[2],u,v);}
 function quad(dst,a,b,c,d,normal,uvs=[[-1,-1],[-1,-1],[-1,-1],[-1,-1]]){
  vertex(dst,a,normal,...uvs[0]);vertex(dst,b,normal,...uvs[1]);vertex(dst,c,normal,...uvs[2]);
  vertex(dst,a,normal,...uvs[0]);vertex(dst,c,normal,...uvs[2]);vertex(dst,d,normal,...uvs[3]);
 }
 function ring(dst,outer,inner,y,matNormal){
  const N=96;for(let i=0;i<N;i++){const a=(i/N)*2*Math.PI,b=((i+1)/N)*2*Math.PI;
   const p=(r,t)=>[Math.sin(t)*r,y,Math.cos(t)*r];quad(dst,p(outer,a),p(outer,b),p(inner,b),p(inner,a),matNormal);}
 }
 function cylinder(dst, rBottom,rTop,bottom,top,{inward=false,uv=false}={}){
  const N=220;
  for(let j=0;j<N;j++){
   const a=-Math.PI+j/N*Math.PI*2,b=-Math.PI+(j+1)/N*Math.PI*2;
   const rr=(phi,r,y)=>[Math.sin(phi)*r,y,Math.cos(phi)*r];
   const mid=(a+b)/2;
   const normal=[Math.sin(mid),.02,Math.cos(mid)].map(v=>v*(inward?-1:1));
   const uvFn=x=>uv?((x+Math.PI)/(Math.PI*2)):-1;
   quad(dst,rr(a,rBottom,bottom),rr(b,rBottom,bottom),rr(b,rTop,top),rr(a,rTop,top),normal,[[uvFn(a),0],[uvFn(b),0],[uvFn(b),1],[uvFn(a),1]]);
  }
 }
 function torusEllipse(dst,cx,cy,cz,rx,ry,tubeR){
  const loops=80,sides=20;
  for(let i=0;i<loops;i++){
    const t=i/loops*2*Math.PI,t2=(i+1)/loops*2*Math.PI;
    const c1=[cx+rx*Math.cos(t),cy+ry*Math.sin(t),cz];
    const c2=[cx+rx*Math.cos(t2),cy+ry*Math.sin(t2),cz];
    const radial1=[Math.cos(t),Math.sin(t),0], radial2=[Math.cos(t2),Math.sin(t2),0];
    const bin=[0,0,1];
    const point=(c,rad,ang)=>[
      c[0]+tubeR*(Math.cos(ang)*rad[0]+Math.sin(ang)*bin[0]),
      c[1]+tubeR*(Math.cos(ang)*rad[1]+Math.sin(ang)*bin[1]),
      c[2]+tubeR*(Math.cos(ang)*rad[2]+Math.sin(ang)*bin[2])
    ];
    const norm=(rad,ang)=>[
      Math.cos(ang)*rad[0]+Math.sin(ang)*bin[0],
      Math.cos(ang)*rad[1]+Math.sin(ang)*bin[1],
      Math.cos(ang)*rad[2]+Math.sin(ang)*bin[2]
    ];
    for(let k=0;k<sides;k++){
      const a=k/sides*2*Math.PI,b=(k+1)/sides*2*Math.PI;
      quad(dst,
        point(c1,radial1,a),point(c1,radial1,b),point(c2,radial2,b),point(c2,radial2,a),
        norm(radial1,(a+b)/2)
      );
    }
  }
 }
 function makeProduct(kind){
  const tall=kind==='chopp'?2.48:kind==='squeeze'?2.68:2.12;
  const radius=kind==='squeeze'?.82:kind==='chopp'?1.08:1.14;
  const up=tall/2,down=-tall/2;
  const bR=kind==='chopp'?radius*.83:radius*.965;
  let body=[],trim=[],inside=[],handle=[];
  cylinder(body,bR,radius,down+.05,up-.10,{uv:true});
  cylinder(inside,radius-.095,radius-.10,up-.53,up-.095,{inward:true});
  ring(trim,radius+.012,radius-.115,up-.09,[0,1,0]);
  ring(trim,bR+.01,bR-.045,down+.05,[0,-1,0]);
  if(kind!=='squeeze'){
    // Alça arredondada, com seção circular e curva suave.
    torusEllipse(handle,0,-0.02,-radius-0.10,0.48,0.72,0.11);
  }
  if(kind==='squeeze'){
    cylinder(trim,.40,.40,up-.09,up+.28);
    ring(trim,.43,.05,up+.28,[0,1,0]);
    cylinder(trim,.19,.19,up+.28,up+.40);
  }
  function upload(src){if(!src.length)return null;const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(src),gl.STATIC_DRAW);return {buffer:buf,count:src.length/8};}
  return {body:upload(body),trim:upload(trim),inside:upload(inside),handle:upload(handle)};
 }
 function draw(obj,hex,useTexture){if(!obj)return;gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);const stride=8*4;
  gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,stride,12);
  gl.enableVertexAttribArray(au);gl.vertexAttribPointer(au,2,gl.FLOAT,false,stride,24);
  gl.uniform1f(textured,useTexture?1:0);gl.uniform3f(color,...hex);gl.drawArrays(gl.TRIANGLES,0,obj.count);
 }
 let wasLost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();wasLost=true;});
 function render(kind,art,angle){if(wasLost)return;const config=meshCache.get(kind)||makeProduct(kind);meshCache.set(kind,config);
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  // Frente = alça atrás; esquerda = alça à esquerda; direita = alça à direita.
  const alignedYaw=(-angle)*Math.PI/180;
  gl.uniform1f(yy,alignedYaw);gl.uniform1f(aspect,canvas.width/canvas.height);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);
  draw(config.body,[1,1,1],true);
  draw(config.inside,[.73,.79,.84],false);
  draw(config.trim,kind==='squeeze'?[.22,.26,.30]:[.97,.98,1.0],false);
  draw(config.handle,[.97,.98,1.0],false);
  gl.flush();
 }
 return {supported:true,render};
}
window.createTioMock3D=createTioMock3D;
})();

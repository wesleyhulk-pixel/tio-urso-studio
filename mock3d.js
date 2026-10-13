/* Tio Urso Studio Alpha 0.5.2 — mockup 3D corrigido, com orientação lateral coerente e alça mais arredondada.
 * Geometria gerada no próprio aparelho, sem dependências externas. */
(() => {
'use strict';
function createTioMock3D(canvas){
 let gl;
 try {gl=canvas.getContext('webgl',{alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false});}catch(_){return{supported:false};}
 if(!gl) return {supported:false};
 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;
 uniform float yaw;uniform float aspect;varying vec2 vUv;varying float shade;
 void main(){float c=cos(yaw),s=sin(yaw);vec3 pos=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
 vec3 nor=normalize(vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z));
 float py=pos.y*.977-pos.z*.213;float pz=pos.z*.977+pos.y*.213;
 float depth=5.7-pz;float f=2.48;
 gl_Position=vec4(pos.x*f/aspect,py*f,(depth*1.003-.201),depth);
 shade=.82+.18*max(dot(nor,normalize(vec3(-.45,.75,1.0))),0.);
 vUv=uv;
 }`;
 const fs=`precision mediump float;varying vec2 vUv;varying float shade;
 uniform sampler2D tex;uniform vec3 base;uniform float textured;
 void main(){vec3 col=base;if(textured>.5 && vUv.x>=0. && vUv.x<=1. && vUv.y>=0. && vUv.y<=1.)col=texture2D(tex,vUv).rgb;
 float sideLight=.98-.10*pow(abs(vUv.x-.5)*2.,2.);col*=shade*sideLight;
 gl_FragColor=vec4(min(col*1.055,vec3(1.)),1.);
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
 function mesh(){return []}
 function vertex(dst,pt,n,u=-1,v=-1){dst.push(pt[0],pt[1],pt[2],n[0],n[1],n[2],u,v);}
 function quad(dst,a,b,c,d,normal,uvs=[[-1,-1],[-1,-1],[-1,-1],[-1,-1]]){
  vertex(dst,a,normal,...uvs[0]);vertex(dst,b,normal,...uvs[1]);vertex(dst,c,normal,...uvs[2]);
  vertex(dst,a,normal,...uvs[0]);vertex(dst,c,normal,...uvs[2]);vertex(dst,d,normal,...uvs[3]);
 }
 function ring(dst,outer,inner,y,matNormal){
  const N=80;for(let i=0;i<N;i++){const a=(i/N)*2*Math.PI,b=((i+1)/N)*2*Math.PI;
   const p=(r,t)=>[r*Math.sin(t),y,r*Math.cos(t)];quad(dst,p(outer,a),p(outer,b),p(inner,b),p(inner,a),matNormal);}
 }
 function cylinder(dst, rBottom,rTop,bottom,top,{inward=false,uv=false}={}){
  const N=170;for(let j=0;j<N;j++){
   const a=-Math.PI+j/N*Math.PI*2,b=-Math.PI+(j+1)/N*Math.PI*2;
   const rr=(phi,r,y)=>[Math.sin(phi)*r,y,Math.cos(phi)*r];
   const normal=[Math.sin((a+b)/2),.04,Math.cos((a+b)/2)].map(v=>v*(inward?-1:1));
   const uvFn=x=>uv?((x+Math.PI)/(Math.PI*2)):-1;
   quad(dst,rr(a,rBottom,bottom),rr(b,rBottom,bottom),rr(b,rTop,top),rr(a,rTop,top),normal,[[uvFn(a),0],[uvFn(b),0],[uvFn(b),1],[uvFn(a),1]]);
  }
 }
 function tube(dst,radius,height){
  const rings=76,sides=22;
  function center(t){const bulge=Math.sin(Math.PI*t);return [radius-.05+.69*Math.pow(bulge,.92),height*.25-height*.50*t,0]}
  for(let j=0;j<rings;j++){
   const t=j/rings,t2=(j+1)/rings;
   const p=center(t),q=center(t2),small=.165;
   const tA=center(Math.max(0,t-.001)),tB=center(Math.min(1,t+.001));
   const norm=(x,y)=>{const len=Math.hypot(x,y)||1;return [x/len,y/len]};
   let tangent=norm(tB[0]-tA[0],tB[1]-tA[1]),perp=[-tangent[1],tangent[0]];
   const qa=center(Math.max(0,t2-.001)),qb=center(Math.min(1,t2+.001));let tang2=norm(qb[0]-qa[0],qb[1]-qa[1]),perp2=[-tang2[1],tang2[0]];
   for(let k=0;k<sides;k++){
     const ang=k/sides*2*Math.PI,ang2=(k+1)/sides*2*Math.PI;
     const point=(center,pr,ang)=>[center[0]+small*Math.cos(ang)*pr[0],center[1]+small*Math.cos(ang)*pr[1],small*Math.sin(ang)];
     const a=point(p,perp,ang),b=point(p,perp,ang2),c=point(q,perp2,ang2),d=point(q,perp2,ang);
     const mid=ang+.5*(ang2-ang);quad(dst,a,b,c,d,[Math.cos(mid)*perp[0],Math.cos(mid)*perp[1],Math.sin(mid)]);
   }
  }
 }
 function makeProduct(kind){const tall=kind==='chopp'?2.50:kind==='squeeze'?2.65:2.10;
  const radius=kind==='squeeze'?.82:kind==='chopp'?1.1:1.14;
  const up=tall/2,down=-tall/2;
  const bR=kind==='chopp'?radius*.83:radius*.96;
  let body=mesh(),trim=mesh(),inside=mesh(),handle=mesh();
  cylinder(body,bR,radius,down+.05,up-.10,{uv:true});
  cylinder(inside,radius-.095,radius-.10,up-.53,up-.095,{inward:true});
  ring(trim,radius+.012,radius-.115,up-.09,[0,1,0]);
  ring(trim,bR+.01,bR-.045,down+.05,[0,-1,0]);
  if(kind!=='squeeze')tube(handle,radius,tall);
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
  const alignedYaw=(90-angle)*Math.PI/180;
  gl.uniform1f(yy,alignedYaw);gl.uniform1f(aspect,canvas.width/canvas.height);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);
  // Renderizador WebGL de malha 3D: o corpo e a alça giram juntos.
  // A orientação foi ajustada para que: frente = alça atrás,
  // lado esquerdo = alça à esquerda, lado direito = alça à direita.
  draw(config.body,[1,1,1],true);
  draw(config.inside,[.74,.79,.84],false);
  draw(config.trim,kind==='squeeze'?[.20,.24,.29]:[.96,.975,.99],false);
  draw(config.handle,[.975,.985,1],false);
  gl.flush();
 }
 return {supported:true,render};
}
window.createTioMock3D=createTioMock3D;
})();

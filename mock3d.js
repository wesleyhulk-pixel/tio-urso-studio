/* Tio Urso Studio Alpha 0.5.5 — modelos WebGL físicos independentes por produto.
 * Sem dependências externas, roda localmente no navegador do celular. */
(() => {
'use strict';
function createTioMock3D(canvas){
 let gl;
 try { gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false}); }
 catch(_){return {supported:false};}
 if(!gl)return {supported:false};
 const vert=`attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;
 uniform float uYaw;uniform float uAspect;uniform float uZoom;uniform float uYOffset;
 varying vec2 vUV;varying vec3 vNormal;varying vec3 vPosition;
 void main(){
  float c=cos(uYaw),s=sin(uYaw);
  vec3 p=vec3(c*aPos.x+s*aPos.z,aPos.y,-s*aPos.x+c*aPos.z);
  vec3 n=normalize(vec3(c*aNormal.x+s*aNormal.z,aNormal.y,-s*aNormal.x+c*aNormal.z));
  float py=p.y*.985-p.z*.174+uYOffset;
  float pz=p.z*.985+p.y*.174;
  float depth=6.6-pz;float f=uZoom;
  gl_Position=vec4(p.x*f/uAspect,py*f,depth*1.004-.201,depth);
  vUV=aUV;vNormal=n;vPosition=p;
 }`;
 const frag=`precision mediump float;
 varying vec2 vUV;varying vec3 vNormal;varying vec3 vPosition;
 uniform sampler2D uTex;uniform vec3 uColor;uniform float uMode;
 void main(){
  vec3 col=uColor;
  float alpha=1.0;
  if(uMode==1.0){
    // Área útil de impressão: 308 graus, folga simétrica na parte de trás da caneca.
    float start=0.072222;float end=1.0-start;
    if(vUV.x>=start && vUV.x<=end){
      float u=(vUV.x-start)/(end-start);
      col=texture2D(uTex,vec2(u,clamp(vUV.y,.0,1.0))).rgb;
    }
  }
  if(uMode==3.0){
    // vidro translúcido com estampa aplicada
    col=mix(col,vec3(.95,.98,1.0),.15);
    if(vUV.x>0.072222 && vUV.x<0.927778){
      col=mix(col,texture2D(uTex,vec2((vUV.x-.072222)/.855556,clamp(vUV.y,0.0,1.0))).rgb,.80);
    }
    alpha=.88;
  }
  vec3 N=normalize(vNormal);
  vec3 light=normalize(vec3(-.48,.66,1.0));
  float diff=max(dot(N,light),0.0);
  float ambient=.66+.32*diff;
  float rim=pow(max(dot(N,normalize(vec3(.5,.3,.85))),0.0),10.0);
  float spec=pow(max(dot(reflect(-light,N),normalize(vec3(.0,.0,1.0))),0.0),25.0);
  col=col*ambient+vec3(.11)*rim+vec3(.12)*spec;
  gl_FragColor=vec4(clamp(col,0.0,1.0),alpha);
 }`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try{
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 }catch(e){return {supported:false,error:e.message};}
 gl.useProgram(program);
 const at={pos:gl.getAttribLocation(program,'aPos'),normal:gl.getAttribLocation(program,'aNormal'),uv:gl.getAttribLocation(program,'aUV')};
 const un={yaw:gl.getUniformLocation(program,'uYaw'),aspect:gl.getUniformLocation(program,'uAspect'),zoom:gl.getUniformLocation(program,'uZoom'),offset:gl.getUniformLocation(program,'uYOffset'),mode:gl.getUniformLocation(program,'uMode'),color:gl.getUniformLocation(program,'uColor')};
 const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'uTex'),0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const cache=new Map();
 const v=(buf,p,n,uv=[-1,-1])=>buf.push(...p,...n,...uv);
 function tri(b,a,c,d,na,nc,nd,ua,uc,ud){v(b,a,na,ua);v(b,c,nc,uc);v(b,d,nd,ud);}
 function quad(b,p0,p1,p2,p3,n0,n1,n2,n3,uv0=[-1,-1],uv1=[-1,-1],uv2=[-1,-1],uv3=[-1,-1]){
  tri(b,p0,p1,p2,n0,n1,n2,uv0,uv1,uv2);
  tri(b,p0,p2,p3,n0,n2,n3,uv0,uv2,uv3);
 }
 function cylinder(buf,rb,rt,yb,yt,opt={}){
  const N=180, inward=!!opt.inward,texture=!!opt.texture;
  for(let i=0;i<N;i++){
   const a=-Math.PI+i*2*Math.PI/N,b=-Math.PI+(i+1)*2*Math.PI/N;
   const point=(t,r,y)=>[r*Math.sin(t),y,r*Math.cos(t)];
   const norm=t=>{const q=inward?-1:1;return [Math.sin(t)*q,0,Math.cos(t)*q];};
   const u=t=>texture?(t+Math.PI)/(2*Math.PI):-1;
   quad(buf,point(a,rb,yb),point(b,rb,yb),point(b,rt,yt),point(a,rt,yt),
        norm(a),norm(b),norm(b),norm(a),[u(a),0],[u(b),0],[u(b),1],[u(a),1]);
  }
 }
 function band(buf,ra,rb,y,nY){
  const N=100;
  for(let i=0;i<N;i++){
   const a=i*2*Math.PI/N,b=(i+1)*2*Math.PI/N;
   const p=(ang,r)=>[r*Math.sin(ang),y,r*Math.cos(ang)];
   quad(buf,p(a,ra),p(b,ra),p(b,rb),p(a,rb),[0,nY,0],[0,nY,0],[0,nY,0],[0,nY,0]);
  }
 }
 // Tubo curvo em D, fixado na parede traseira da caneca. Mantém o mesmo eixo de rotação.
 function ceramicHandle(buf,r,height,tubeRadius,bulge,angular=false){
  const ringCount=88,sides=20;
  const top=height*.32, bottom=-height*.32;
  function center(t){
    const y=top+(bottom-top)*t;
    const arc=Math.sin(Math.PI*t);
    const push=angular? Math.pow(Math.max(arc,0),.62):Math.pow(Math.max(arc,0),.88);
    return [0,y,-r+.05-bulge*push];
  }
  function frame(t){
    const small=.0005, p=center(Math.max(0,t-small)),q=center(Math.min(1,t+small));
    const dy=q[1]-p[1],dz=q[2]-p[2],l=Math.hypot(dy,dz)||1;
    return [0,-dz/l,dy/l]; // normal no plano YZ
  }
  function pt(c,fn,a){return [tubeRadius*Math.sin(a),c[1]+tubeRadius*Math.cos(a)*fn[1],c[2]+tubeRadius*Math.cos(a)*fn[2]];}
  function normal(fn,a){return [Math.sin(a),Math.cos(a)*fn[1],Math.cos(a)*fn[2]];}
  for(let i=0;i<ringCount;i++){
    const t=i/ringCount,t2=(i+1)/ringCount,p=center(t),q=center(t2),n=frame(t),m=frame(t2);
    for(let j=0;j<sides;j++){
      const a=j*2*Math.PI/sides,b=(j+1)*2*Math.PI/sides;
      quad(buf,pt(p,n,a),pt(p,n,b),pt(q,m,b),pt(q,m,a),normal(n,a),normal(n,b),normal(m,b),normal(m,a));
    }
  }
 }
 function sphereCap(buf,cx,cy,cz,r){
  const N=20,M=10;
  const point=(a,b)=>[cx+r*Math.sin(b)*Math.sin(a),cy+r*Math.cos(b),cz+r*Math.sin(b)*Math.cos(a)];
  const norm=(a,b)=>[Math.sin(b)*Math.sin(a),Math.cos(b),Math.sin(b)*Math.cos(a)];
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    const a=i*2*Math.PI/N,aa=(i+1)*2*Math.PI/N,b=j*Math.PI/M,bb=(j+1)*Math.PI/M;
    quad(buf,point(a,b),point(aa,b),point(aa,bb),point(a,bb),norm(a,b),norm(aa,b),norm(aa,bb),norm(a,bb));
  }
 }
 function upload(a){if(!a.length)return null;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);return {buffer,count:a.length/8};}
 function product(k){
  const isChopp=k==='chopp',isSqueeze=k==='squeeze';
  const h=isSqueeze?2.87:(isChopp?2.66:2.06);
  const r=isSqueeze?.78:(isChopp?1.08:1.13),down=-h/2,up=h/2;
  const baseR=isChopp?r*.78:r*.965;
  let body=[],rim=[],interior=[],handle=[],lid=[],details=[];
  cylinder(body,baseR,r,down+.025,up-.08,{texture:true});
  cylinder(interior,r-.09,r-.13,up-.38,up-.084,{inward:true});
  band(rim,r+.02,r-.12,up-.08,1);
  band(rim,baseR+.01,baseR-.06,down+.024,-1);
  if(!isSqueeze){
   ceramicHandle(handle,r,h,isChopp?.19:.145,isChopp?.86:.81,isChopp);
   sphereCap(handle,0,h*.32,-r+.05,isChopp?.18:.14);
   sphereCap(handle,0,-h*.32,-r+.05,isChopp?.18:.14);
  }else{
   cylinder(lid,.68,.72,up-.08,up+.31);
   band(details,.72,.16,up+.31,1);
   cylinder(details,.25,.25,up+.31,up+.54);
   band(details,.25,.06,up+.54,1);
   // bico esportivo do squeeze
   cylinder(details,.095,.095,up+.54,up+.70);
  }
  return {body:upload(body),rim:upload(rim),interior:upload(interior),handle:upload(handle),lid:upload(lid),details:upload(details)};
 }
 function draw(object,rgba,mode){
  if(!object)return;
  gl.bindBuffer(gl.ARRAY_BUFFER,object.buffer);
  gl.enableVertexAttribArray(at.pos);gl.vertexAttribPointer(at.pos,3,gl.FLOAT,false,32,0);
  gl.enableVertexAttribArray(at.normal);gl.vertexAttribPointer(at.normal,3,gl.FLOAT,false,32,12);
  gl.enableVertexAttribArray(at.uv);gl.vertexAttribPointer(at.uv,2,gl.FLOAT,false,32,24);
  gl.uniform3fv(un.color,rgba);gl.uniform1f(un.mode,mode);gl.drawArrays(gl.TRIANGLES,0,object.count);
 }
 let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;cache.clear();});
 function render(k,art,angle){
  if(lost)return;
  const mesh=cache.get(k)||product(k);cache.set(k,mesh);
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  // Angle +90 faz a alça girar do fundo para a DIREITA; -90 para ESQUERDA.
  gl.uniform1f(un.yaw,-angle*Math.PI/180);gl.uniform1f(un.aspect,canvas.width/canvas.height);
  gl.uniform1f(un.zoom,k==='squeeze'?3.35:(k==='chopp'?3.65:4.10));gl.uniform1f(un.offset,k==='squeeze'?.10:(k==='chopp'?.12:.06));
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art);
  const glass=k==='chopp',sports=k==='squeeze';
  draw(mesh.body,glass?[.86,.94,1]:[1,1,1],glass?3:1);
  draw(mesh.interior,glass?[.76,.84,.88]:[.74,.79,.82],0);
  draw(mesh.rim,glass?[.86,.95,1]:[.96,.98,1],0);
  draw(mesh.handle,glass?[.85,.94,1]:[1,1,1],0);
  draw(mesh.lid,sports?[.13,.17,.2]:[1,1,1],0);
  draw(mesh.details,sports?[.26,.31,.34]:[1,1,1],0);
  gl.flush();
 }
 return {supported:true,render,engine:'webgl'};
}

// Cenários 2D estáticos atrás do produto 3D, não fazem parte do giro.
function paintTioScene(canvas,mode='madeira'){
 const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 if(canvas.dataset.sceneMode===mode)return;canvas.dataset.sceneMode=mode;
 g.clearRect(0,0,W,H);
 if(mode==='limpo'){
  const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#edf6fa');bg.addColorStop(1,'#dbe9f2');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(60,91,113,.15)';g.beginPath();g.ellipse(W/2,578,245,24,0,0,2*Math.PI);g.fill();return;
 }
 let wall=g.createLinearGradient(0,0,W,H);wall.addColorStop(0,mode==='clara'?'#eef5f6':'#edf2ec');wall.addColorStop(1,mode==='clara'?'#dce9ef':'#d7e7dd');g.fillStyle=wall;g.fillRect(0,0,W,H);
 // folhas decorativas desfocadas no fundo
 g.save();g.globalAlpha=.16;g.filter='blur(17px)';
 for(let i=0;i<24;i++){
  const px=W*.19+Math.sin(i*2.2)*112,py=35+(i%10)*33;
  g.save();g.translate(px,py);g.rotate(Math.sin(i*1.9)*2.1);g.fillStyle=i%3?'#34866a':'#6da56b';
  g.beginPath();g.ellipse(0,0,18+(i%4)*4,72,0,0,Math.PI*2);g.fill();g.restore();
 }
 g.restore();
 const tableY=505;
 let wood=g.createLinearGradient(0,tableY,0,H);
 if(mode==='clara'){wood.addColorStop(0,'#f4e9dd');wood.addColorStop(1,'#d6bca2');}
 else {wood.addColorStop(0,'#936b4d');wood.addColorStop(.35,'#865b3e');wood.addColorStop(1,'#4a3024');}
 g.fillStyle=wood;g.fillRect(0,tableY,W,H-tableY);
 // frisos de madeira perspective
 g.strokeStyle=mode==='clara'?'rgba(126,93,69,.13)':'rgba(30,19,13,.35)';g.lineWidth=4;
 for(let i=-3;i<=8;i++){
  g.beginPath();g.moveTo(i*165,tableY);g.lineTo((i-2)*260,H);g.stroke();
 }
 g.strokeStyle=mode==='clara'?'rgba(255,255,255,.24)':'rgba(231,180,130,.22)';g.lineWidth=2;
 for(let i=0;i<11;i++){g.beginPath();g.moveTo(0,tableY+i*16);g.lineTo(W,tableY+i*20);g.stroke();}
 g.fillStyle='rgba(0,0,0,.22)';g.filter='blur(11px)';g.beginPath();g.ellipse(W/2,598,245,25,0,0,Math.PI*2);g.fill();g.filter='none';
}
window.createTioMock3D=createTioMock3D;
window.paintTioScene=paintTioScene;
})();

/* Tio Urso Studio Alpha 1.1.16 — correção do posicionamento das artes nos braços da camiseta e refinamentos anteriores.
 * Ajusta proporção do corpo, posição/forma da alça e mapeamento da arte. */
(() => {
'use strict';
function createTioMock3D(canvas){
 let gl;
 try { gl = canvas.getContext('webgl', {alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false}); }
 catch(_) { return {supported:false}; }
 if(!gl) return {supported:false};

 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;
 uniform float yaw;uniform float aspect;varying vec2 vUv;varying float shade;varying float fresnel;
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
   fresnel=pow(1.0-abs(dot(nor,normalize(vec3(0.0,0.28,1.0)))),2.3);
   vUv=uv;
 }`;
 const fs=`precision mediump float;varying vec2 vUv;varying float shade;varying float fresnel;
 uniform sampler2D tex;uniform vec3 base;uniform float textured;uniform float repeatU;uniform float materialOpacity;uniform float glassMaterial;uniform float decalOnly;
 void main(){
   if(decalOnly>.5 && (vUv.x<0. || vUv.x>1. || vUv.y<0. || vUv.y>1.)) discard;
   vec3 col=base;
   if(textured>.5 && (repeatU>.5 || (vUv.x>=0. && vUv.x<=1.)) && vUv.y>=0. && vUv.y<=1.) col=texture2D(tex,vUv).rgb;
   float sideLight=1.0;
   if(textured>.5 && vUv.x>=0. && vUv.x<=1.) sideLight=.992-.06*pow(abs(vUv.x-.5)*2.,2.);
   col*=shade*sideLight;
   float a=materialOpacity;
   if(glassMaterial>.5){
     float shine=clamp(fresnel,0.,1.);
     col=mix(vec3(.83,.87,.89),vec3(.98,.985,.99),.42+shine*.45);
     col*=.95+.065*shade;
     a=materialOpacity*(.96+.04*shine);
   }
   gl_FragColor=vec4(min(col*1.055,vec3(1.)),a);
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
 const materialOpacity=gl.getUniformLocation(program,'materialOpacity');
 const glassMaterial=gl.getUniformLocation(program,'glassMaterial');
 const decalOnly=gl.getUniformLocation(program,'decalOnly');

 const texture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'tex'),0);
 gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);


 // Camiseta real (Meshy) — renderizador independente, sem alterar a lógica das canecas.
 let shirtProgram=null, meshyShirt=null;
 const shirtZoneTextures={};
 const shirtTextureSources={};
 const shirtZones=['frente','costas','peito','manga_d','manga_e'];
 const shirtVS=`attribute vec3 aPos;attribute vec3 aNorm;
 uniform float yaw;uniform float aspect;varying vec3 posLocal;varying vec3 normalLocal;varying vec3 normalView;
 void main(){
   vec3 p=aPos*1.32;
   float c=cos(yaw),s=sin(yaw);
   vec3 wp=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
   vec3 wn=normalize(vec3(c*aNorm.x+s*aNorm.z,aNorm.y,-s*aNorm.x+c*aNorm.z));
   float py=wp.y*.958-wp.z*.286;
   float pz=wp.z*.958+wp.y*.286;
   float depth=5.7-pz;
   gl_Position=vec4(wp.x*2.48/aspect,py*2.48,(depth*1.003-.201),depth);
   posLocal=aPos;normalLocal=aNorm;normalView=wn;
 }`;
 const shirtFS=`precision mediump float;
 varying vec3 posLocal;varying vec3 normalLocal;varying vec3 normalView;
 uniform vec3 mainColor;uniform vec3 accentColor;uniform vec3 collarColor;
 uniform sampler2D artFront;uniform sampler2D artBack;uniform sampler2D artChest;uniform sampler2D artRight;uniform sampler2D artLeft;
 void main(){
   vec3 n=normalize(normalView);
   float diff=max(dot(n,normalize(vec3(-.45,.8,1.0))),0.0);
   float soft=max(dot(n,normalize(vec3(.6,.25,-.8))),0.0);
   // O Meshy tem decote 3D e forro interno: altura isolada nao e uma mascara de gola.
   // Separa cores do raglan ao longo do ombro, sem tingir faixas da barriga.
   float ax=abs(posLocal.x);
   float reach=smoothstep(.48,.945,posLocal.y);
   float seamX=mix(.47,.21,pow(reach,1.2));
   float sleeve=smoothstep(seamX-.004,seamX+.004,ax)*step(-.12,posLocal.y);

   // Perfil do decote MEDIDO na propria malha Meshy:
   // frente: y=0.785 no centro, subindo ate y~0.93 junto aos ombros.
   // A gola ganha acabamento curvo na frente e na borda traseira.
   vec3 nLocal=normalize(normalLocal);
   float frontRim=.785+.147*pow(clamp(ax/.208,0.0,1.0),3.25);
   float rimFront=(1.0-smoothstep(.019,.031,abs(posLocal.y-frontRim)))
       *(1.0-smoothstep(.208,.225,ax))
       *step(-.128,posLocal.z)*step(.05,nLocal.y)*step(.06,nLocal.z);
   float rimBack=(1.0-smoothstep(.013,.025,abs(posLocal.y-.94)))
       *(1.0-smoothstep(.19,.211,ax))
       *(1.0-step(-.11,posLocal.z));
   float collar=max(rimFront,rimBack);

   // Na abertura se ve a parte INTERNA da camiseta, que nao deve receber
   // a cor viva do peito. Usa sombra de forro, preservando profundidade.
   float inner=step(.785,posLocal.y)
       *(1.0-smoothstep(.195,.217,ax))
       *(1.0-step(-.17,posLocal.z))
       *step(.30,nLocal.z)
       *(1.0-step(.1,nLocal.y));
   vec3 fabric=mix(mainColor,accentColor,sleeve);
   fabric=mix(fabric,mainColor*.22+vec3(.098),inner);
   fabric=mix(fabric,collarColor,collar);
   // Valor ambiental suficiente para conservar cores escuras, mantendo
   // dobras, luz e volume naturais sobre o tecido.
   float illumination=.75+.19*diff+.04*soft;
   fabric*=illumination;
   // Reflexo mínimo, evita que o preto fique cinza ou pareça plástico.
   fabric+=vec3(.003)*pow(max(dot(n,vec3(0.0,0.4,1.0)),0.0),3.0);
   // Cinco artes independentes numa única camiseta. A área A4 frontal
   // não apaga a estampa do peito: o peito é composto por cima dela.
   float front=step(.05,posLocal.z);
   float back=step(.05,-posLocal.z);
   // Alpha 1.1.13 - centro REAL das mangas na malha Meshy:
   // Z=-0.06 e Y=0.33 na face lateral externa de cada manga.
   // O patch 9x9 usa uma janela quase quadrada (0.30 x 0.30):
   // evita encolher/deslocar a logo como no mapeamento 0.15 x 0.62.
   // O normal voltado PARA FORA evita copiar a arte na face de tras
   // ou no avesso e os sinais opostos de X separam os dois bracos.
   float rightSide=smoothstep(.49,.59,-posLocal.x) * smoothstep(.07,.30,-nLocal.x);
   float leftSide=smoothstep(.49,.59,posLocal.x) * smoothstep(.07,.30,nLocal.x);
   vec2 uvFront=vec2((posLocal.x+.31)/.62,(posLocal.y+.26)/.88);
   vec2 uvBack=vec2((-posLocal.x+.31)/.62,(posLocal.y+.26)/.88);
   vec2 uvChest=vec2((posLocal.x-.12)/.22,(posLocal.y-.27)/.22);
   // Alpha 1.1.16 — ajuste APENAS da escala horizontal das mangas.
   // A malha Meshy curva alarga visualmente letras e logos longas.
   // Reduz a largura projetada de 0.30 para 0.26 (cerca de 13%),
   // preservando o centro Z=-0.06, a altura Y=0.18..0.48 e o espelhamento correto.
   // Frente, costas, peito e os demais renderizadores ficam intocados.
   vec2 uvRight=vec2((posLocal.z+.19)/.26,(posLocal.y-.18)/.30);
   vec2 uvLeft=vec2((.07-posLocal.z)/.26,(posLocal.y-.18)/.30);
   if(front>.5 && uvFront.x>=0.0 && uvFront.x<=1.0 && uvFront.y>=0.0 && uvFront.y<=1.0){
      vec4 ink=texture2D(artFront,uvFront);
      fabric=mix(fabric,ink.rgb*illumination,ink.a);
   }
   if(back>.5 && uvBack.x>=0.0 && uvBack.x<=1.0 && uvBack.y>=0.0 && uvBack.y<=1.0){
      vec4 ink=texture2D(artBack,uvBack);
      fabric=mix(fabric,ink.rgb*illumination,ink.a);
   }
   if(front>.5 && uvChest.x>=0.0 && uvChest.x<=1.0 && uvChest.y>=0.0 && uvChest.y<=1.0){
      vec4 ink=texture2D(artChest,uvChest);
      fabric=mix(fabric,ink.rgb*illumination,ink.a);
   }
   if(rightSide>.001 && uvRight.x>=0.0 && uvRight.x<=1.0 && uvRight.y>=0.0 && uvRight.y<=1.0){
      vec4 ink=texture2D(artRight,uvRight);
      fabric=mix(fabric,ink.rgb*illumination,ink.a*rightSide);
   }
   if(leftSide>.001 && uvLeft.x>=0.0 && uvLeft.x<=1.0 && uvLeft.y>=0.0 && uvLeft.y<=1.0){
      vec4 ink=texture2D(artLeft,uvLeft);
      fabric=mix(fabric,ink.rgb*illumination,ink.a*leftSide);
   }
   gl_FragColor=vec4(clamp(fabric,0.0,1.0),1.0);
 }`;
 try{
   shirtProgram=gl.createProgram();
   gl.attachShader(shirtProgram,compile(gl.VERTEX_SHADER,shirtVS));
   gl.attachShader(shirtProgram,compile(gl.FRAGMENT_SHADER,shirtFS));
   gl.linkProgram(shirtProgram);
   if(!gl.getProgramParameter(shirtProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(shirtProgram));
 }catch(err){console.warn('Renderizador de camiseta Meshy:',err);shirtProgram=null;}
 async function loadMeshyShirt(){
   if(!shirtProgram)return;
   try{
     const response=await fetch('meshy-camiseta-webgl.bin?v=0970',{cache:'no-store'});
     if(!response.ok)throw new Error('Malha 3D indisponível '+response.status);
     const data=await response.arrayBuffer();
     const sig=String.fromCharCode(...new Uint8Array(data,0,4));
     if(sig!=='TUSH')throw new Error('Arquivo de camiseta incompatível');
     const vertices=new DataView(data).getUint32(4,true);
     if(vertices>800000||vertices<100||data.byteLength!==8+vertices*24)throw new Error('Geometria incompleta');
     const buffer=gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
     gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data,8),gl.STATIC_DRAW);
     meshyShirt={buffer,count:vertices};
     window.dispatchEvent(new Event('tio-meshy-ready'));
   }catch(err){console.warn('Camiseta Meshy:',err);window.dispatchEvent(new Event('tio-meshy-failed'));}
 }
 function renderShirt(art,angle,shirtOptions){
   if(!shirtProgram||!meshyShirt||wasLost)return false;
   const col=hex=>[1,3,5].map(i=>parseInt((/^#[0-9a-f]{6}$/i.test(hex)?hex:'#ffffff').slice(i,i+2),16)/255);
   const options=shirtOptions||{};
   const orientation=({frente:0,costas:180,peito:0,manga_d:65,manga_e:-65})[options.zone] ?? 0;
   const angles=Number.isFinite(angle) ? angle : orientation;
   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(shirtProgram);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
   gl.bindBuffer(gl.ARRAY_BUFFER,meshyShirt.buffer);
   const apS=gl.getAttribLocation(shirtProgram,'aPos');
   const anS=gl.getAttribLocation(shirtProgram,'aNorm');
   gl.enableVertexAttribArray(apS);gl.vertexAttribPointer(apS,3,gl.FLOAT,false,24,0);
   gl.enableVertexAttribArray(anS);gl.vertexAttribPointer(anS,3,gl.FLOAT,false,24,12);
   gl.uniform1f(gl.getUniformLocation(shirtProgram,'yaw'),angles*Math.PI/180);
   gl.uniform1f(gl.getUniformLocation(shirtProgram,'aspect'),canvas.width/canvas.height);
   gl.uniform3fv(gl.getUniformLocation(shirtProgram,'mainColor'),new Float32Array(col(options.bodyColor||'#ffffff')));
   gl.uniform3fv(gl.getUniformLocation(shirtProgram,'accentColor'),new Float32Array(col(options.trimColor||'#ffffff')));
   gl.uniform3fv(gl.getUniformLocation(shirtProgram,'collarColor'),new Float32Array(col(options.collarColor||options.trimColor||'#ffffff')));
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   // Um sampler WebGL por posição. Não altera a textura dos outros produtos.
   const names=['artFront','artBack','artChest','artRight','artLeft'];
   for(let i=0;i<shirtZones.length;i++){
     const zone=shirtZones[i];
     if(!shirtZoneTextures[zone])shirtZoneTextures[zone]=gl.createTexture();
     gl.activeTexture(gl.TEXTURE1+i);
     gl.bindTexture(gl.TEXTURE_2D,shirtZoneTextures[zone]);
     const source=options.artworks?.[zone]||art;
     if(shirtTextureSources[zone]!==source){
       gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
       shirtTextureSources[zone]=source;
     }
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     gl.uniform1i(gl.getUniformLocation(shirtProgram,names[i]),i+1);
   }
   gl.drawArrays(gl.TRIANGLES,0,meshyShirt.count);
   const e=gl.getError();
   // Restore the original shader; approved mug/squeeze/chopp use it unchanged.
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.useProgram(program);
   if(e!==gl.NO_ERROR){console.warn('Renderização camiseta WebGL',e);return false;}
   return true;
 }

 const meshCache=new Map();
 let meshyMug=null;
 let meshyError=null;
 let meshySqueeze=null;
 let meshyChopp=null;
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
   // Ajuste fino da área sublimável da caneca tradicional:
   // ampliamos a janela vertical útil sem deformar a arte no editor.
   // Assim o mockup ocupa melhor a altura do corpo cerâmico e reduz
   // as bordas brancas superior e inferior vistas no preview.
   const printBottom=bmin[1]+height*.010;
   const printHeight=height*.985;
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
         // A malha Meshy tem bordas ligeiramente onduladas: alguns vértices
         // ultrapassam a janela UV e apareciam brancos, formando "dentinhos"
         // irregulares na base e uma faixa sem tinta próxima da borda superior.
         // Reaproveita o último pixel vertical da própria arte nesses pontos,
         // sem alterar os vértices do produto ou redimensionar a arte do editor.
         // Somente o corpo da caneca tradicional (partIndex===0) é afetado.
         const v=(source[i+1]-printBottom)/printHeight;
         copy[i+7]=Math.max(0.001,Math.min(0.999,v));
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
     const normalized=normalizeMeshyGeometry(raw);
     // O Meshy possui uma malha de acabamento inferior separada que era
     // desenhada em branco por cima do corpo estampado. Em alguns ângulos,
     // ela aparecia como pequenos dentes brancos (falsa falha de sublimação).
     // Separamos SOMENTE a base; o aro superior e a geometria original
     // permanecem intocados. A base usa a cor da última linha da arte,
     // sem aumentar ou deformar a imagem inteira.
     const originalTrim=normalized[3], upperTrim=[], upperRimGlaze=[], outerRimPrinted=[], lowerTrim=[];
     const halfArc=Math.PI*.80;
     // Mesma janela vertical UV do corpo Meshy: continuidade da estampa
     // na parte de baixo, sem criar uma segunda faixa monocromática.
     let bodyMinY=Infinity,bodyMaxY=-Infinity;
     for(let k=1;k<raw[0].length;k+=8){
       bodyMinY=Math.min(bodyMinY,raw[0][k]);
       bodyMaxY=Math.max(bodyMaxY,raw[0][k]);
     }
     const bodyCenterY=(bodyMinY+bodyMaxY)*.5;
     const bottomUV=bodyMinY+(bodyMaxY-bodyMinY)*.010;
     const heightUV=(bodyMaxY-bodyMinY)*.985;
     for(let i=0;i<originalTrim.length;i+=24){
       const y=(originalTrim[i+1]+originalTrim[i+9]+originalTrim[i+17])/3;
       if(y>=-.94){
         // O friso superior da caneca Meshy é uma peça separada: no modelo
         // anterior ele era desenhado de branco sobre a estampa, criando
         // a faixa branca visível quando o interior recebe outra cor.
         // Pintar apenas sua face EXTERNA; deixar a superfície voltada
         // para a boca da caneca com a mesma cor escolhida para o interior.
         const px=(originalTrim[i]+originalTrim[i+8]+originalTrim[i+16])/3;
         const pz=(originalTrim[i+2]+originalTrim[i+10]+originalTrim[i+18])/3;
         const nx=(originalTrim[i+3]+originalTrim[i+11]+originalTrim[i+19])/3;
         const nz=(originalTrim[i+5]+originalTrim[i+13]+originalTrim[i+21])/3;
         const radial=Math.hypot(px,pz)||1;
         const norm=Math.hypot(nx,nz)||1;
         const outward=(px*nx+pz*nz)/(radial*norm);
         if(y>.98 && outward>.36){
           // UV idêntico ao corpo (última linha da arte, sem esticar)
           // e correção de continuidade na junção traseira da caneca.
           const theta=[];
           for(let j=0;j<3;j++){
             const off=i+j*8;
             theta.push(Math.atan2(originalTrim[off],originalTrim[off+2]));
           }
           const seam=Math.max(...theta)-Math.min(...theta)>Math.PI;
           for(let j=0;j<3;j++){
             const off=i+j*8;
             for(let k=0;k<8;k++)outerRimPrinted.push(originalTrim[off+k]);
             let a=theta[j];if(seam&&a<0)a+=Math.PI*2;
             outerRimPrinted[outerRimPrinted.length-2]=(a+halfArc)/(2*halfArc);
             const v=(originalTrim[off+1]+bodyCenterY-bottomUV)/heightUV;
             outerRimPrinted[outerRimPrinted.length-1]=Math.max(.001,Math.min(.999,v));
           }
         }else if(y>.98){
           // Face voltada para o interior: mesma cor do acabamento escolhido.
           for(let j=0;j<24;j++)upperRimGlaze.push(originalTrim[i+j]);
         }else{
           // Geometrias intermediárias não fazem parte do aro superior.
           // Mantemos a cor cerâmica original para evitar novas faixas.
           for(let j=0;j<24;j++)upperTrim.push(originalTrim[i+j]);
         }
         continue;
       }
       const theta=[];
       for(let j=0;j<3;j++){
         const off=i+j*8;
         theta.push(Math.atan2(originalTrim[off],originalTrim[off+2]));
       }
       const crossSeam=Math.max(...theta)-Math.min(...theta)>Math.PI;
       for(let j=0;j<3;j++){
         const off=i+j*8;
         let a=theta[j];
         if(crossSeam&&a<0)a+=Math.PI*2;
         for(let k=0;k<8;k++)lowerTrim.push(originalTrim[off+k]);
         // Mesma projeção horizontal do corpo cerâmico; a textura não
         // invade a região traseira, onde ficam a emenda e a alça.
         lowerTrim[lowerTrim.length-2]=(a+halfArc)/(2*halfArc);
         // Acompanha o UV do corpo, inclusive no rodapé. Isso evita
         // aquela banda de cor repetida na borda e não estica letras.
         const localY=originalTrim[off+1];
         const v=(localY+bodyCenterY-bottomUV)/heightUV;
         lowerTrim[lowerTrim.length-1]=Math.max(.001,Math.min(.999,v));
       }
     }
     // Alpha 1.1.6: removida a faixa cilíndrica artificial criada na
     // versão anterior. O raio fixo dessa faixa ultrapassava o corpo do
     // Meshy e aparecia como uma segunda base/"saia" sobreposta.
     // Usamos somente os triângulos originais de acabamento inferiores,
     // com UV preso à última linha da estampa, sem adicionar geometria.
     meshyMug={
       body:upload(normalized[0]),inside:upload(normalized[1]),handle:upload(normalized[2]),
       trim:upload(new Float32Array(upperTrim)),
       upperRimGlaze:upload(new Float32Array(upperRimGlaze)),
       outerRimPrinted:upload(new Float32Array(outerRimPrinted)),
       basePrinted:upload(new Float32Array(lowerTrim)),insideFloor:null
     };
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
     const resp=await fetch('meshy-squeeze.bin?v=0820',{cache:'no-store'});
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
       // Não alterar a posição dos vértices do Meshy: os deslocamentos
       // verticais anteriores criavam novas falhas na tampa e no rodapé.
       // A geometria original fica preservada nos arquivos binários.
       lists.push(upload(item)); off+=count*32;
     }
     // O corpo do Meshy apresenta bordas de impressão irregulares e uma
     // faixa branca na base. Uma manga cilíndrica regular corrige só a área
     // sublimável (emenda 360°), sem alterar a geometria da tampa.
     const sleeve=[];
     cylinder(sleeve,0.469,0.469,-1.369,0.647,{uvMode:'full'});
     // Colarinho separado cobre a junção irregular entre manga e tampa;
     // é uma superfície PRETA constante, nunca amostrada da imagem da arte.
     const collar=[];
     cylinder(collar,0.474,0.456,0.634,0.915,{uvMode:'full'});
     meshySqueeze={body:upload(sleeve),extras:lists[1],collar:upload(collar)};
     window.dispatchEvent(new Event('tio-meshy-ready'));
   }catch(err){console.warn('Squeeze Meshy:',err);}
 }
 async function loadMeshyChopp(){
   try{
     const resp=await fetch('meshy-chopp.bin?v=0840',{cache:'no-store'});
     if(!resp.ok)throw new Error('Não foi possível carregar a caneca de chopp Meshy');
     const data=await resp.arrayBuffer(),view=new DataView(data);
     if(String.fromCharCode(...new Uint8Array(data,0,4))!=='TUCH')throw new Error('Modelo de chopp inválido');
     let off=4,parts=[],bodyVertices=null;
     for(let i=0;i<2;i++){
       const count=view.getUint32(off,true);off+=4;
       if(count>350000 || off+count*32>data.byteLength)throw new Error('Modelo de chopp incompleto');
       const verts=new Float32Array(new Float32Array(data,off,count*8));off+=count*32;
       // GLB do Meshy: a alça está em +X. Reorientação para o eixo traseiro -Z.
       // Também estreitamos o corpo para aproximar da referência da caneca de chopp,
       // que é visualmente mais fina e menos “barriguda”.
       const xzScale=0.84;
       const yScale=1.00;
       for(let k=0;k<verts.length;k+=8){
         const x=verts[k]-.0083, z=verts[k+2]+.0047;
         verts[k]=z*xzScale;
         verts[k+1]*=yScale;
         verts[k+2]=-x*xzScale;
         const nx=verts[k+3], ny=verts[k+4], nz=verts[k+5];
         const nn=Math.hypot(nz/xzScale,ny,-nx/xzScale)||1;
         verts[k+3]=(nz/xzScale)/nn;
         verts[k+4]=ny/nn;
         verts[k+5]=(-nx/xzScale)/nn;
       }
       if(i===0)bodyVertices=verts;
       parts.push(upload(verts));
     }

     // A arte segue A SUPERFÍCIE EXTERNA REAL, sem outro cilindro solto.
     // Apenas faces voltadas para fora recebem a estampa (sem duplicar atrás).
     // O mapeamento projetado respeita a altura e uma janela angular mais contida,
     // evitando esticar a arte e preservando uma faixa traseira limpa sob a alça.
     const sticker=[];
     const halfArc=Math.PI*.70;
     const printBottom=-1.19, printTop=1.19;
     for(let k=0;k<bodyVertices.length;k+=24){
       let exterior=true;
       const angles=[];
       for(let j=0;j<3;j++){
         const t=k+j*8;
         const x=bodyVertices[t], y=bodyVertices[t+1], z=bodyVertices[t+2];
         const r=Math.hypot(x,z);
         const nr=(x*bodyVertices[t+3]+z*bodyVertices[t+5])/(r||1);
         // Sticker must use the ACTUAL post-scaled body radius.
         // r<.84 discarded much of the newly narrowed mug and made the artwork vanish.
         if(r<.655 || nr<.72 || y<-1.29 || y>1.29) exterior=false;
         angles.push(Math.atan2(x,z));
       }
       if(!exterior || Math.max(...angles)-Math.min(...angles)>Math.PI)continue;
       for(let j=0;j<3;j++){
         const t=k+j*8;
         const x=bodyVertices[t],y=bodyVertices[t+1],z=bodyVertices[t+2];
         const r=Math.hypot(x,z)||1;
         const u=(angles[j]+halfArc)/(2*halfArc);
         const v=(y-printBottom)/(printTop-printBottom);
         vertex(sticker,[x+x/r*.006,y,z+z/r*.006],
           [bodyVertices[t+3],bodyVertices[t+4],bodyVertices[t+5]],u,v);
       }
     }
     meshyChopp={body:parts[0],handle:parts[1],art:upload(sticker)};
     window.dispatchEvent(new Event('tio-meshy-ready'));
   }catch(err){console.warn('Chopp Meshy:',err);window.dispatchEvent(new Event('tio-meshy-failed'));}
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
   im.src='squeeze-material.jpg?v=0820';
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

 function draw(obj, rgb, useTexture, alpha=1, glass=false, decal=false){
   if(!obj) return;
   gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);
   const stride=8*4;
   gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap,3,gl.FLOAT,false,stride,0);
   gl.enableVertexAttribArray(an); gl.vertexAttribPointer(an,3,gl.FLOAT,false,stride,12);
   gl.enableVertexAttribArray(au); gl.vertexAttribPointer(au,2,gl.FLOAT,false,stride,24);
   gl.uniform1f(textured, useTexture?1:0);
   gl.uniform1f(materialOpacity,alpha);
   gl.uniform1f(glassMaterial,glass?1:0);
   gl.uniform1f(decalOnly,decal?1:0);
   gl.uniform3f(color, rgb[0], rgb[1], rgb[2]);
   gl.drawArrays(gl.TRIANGLES, 0, obj.count);
 }

 let wasLost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();wasLost=true;});

 function finishColor(hex){
   if(typeof hex!=='string'||!/^#[0-9a-fA-F]{6}$/.test(hex))return [1,1,1];
   return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 }
 function render(kind, art, angle, mugFinishColor='#ffffff',shirtOptions=null){
   if(kind==='camiseta')return renderShirt(art,angle,shirtOptions);
   if(wasLost) return false;
   if(kind==='caneca' && !meshyMug)return false;
   if(kind==='squeeze' && !meshySqueeze)return false;
   if(kind==='chopp' && !meshyChopp)return false;
   const config = kind==='caneca' ? meshyMug : kind==='squeeze' ? meshySqueeze : kind==='chopp' ? meshyChopp : (meshCache.get(kind) || makeProduct(kind));
   if(kind!=='caneca'&&kind!=='squeeze'&&kind!=='chopp') meshCache.set(kind,config);

   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform1f(yy, ((kind==='caneca'||kind==='chopp')?-angle:angle)*Math.PI/180);
   gl.uniform1f(aspect, canvas.width/canvas.height);
   gl.uniform1f(repeatU,kind==='squeeze'?1:0);
   gl.disable(gl.BLEND);gl.depthMask(true);
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
     // Renderizar após os detalhes: o colarinho mantém a faixa escura nítida,
     // sem "dentes" brancos gerados pela textura/UV original do Meshy.
     gl.bindTexture(gl.TEXTURE_2D,texture);
     draw(config.collar,[.12,.125,.13],false);
     gl.flush();
     const err=gl.getError();
     if(err!==gl.NO_ERROR)return false;
     const p=new Uint8Array(4);
     gl.readPixels(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);
     return p[3]>0;
   }

   if(kind==='chopp'){
     // Jateado, NÃO cristal: o vidro é fosco com transparência discreta.
     // Usamos profundidade para que a estampa do fundo não apareça na frente.
     gl.enable(gl.BLEND);
     gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.depthMask(true);
     draw(config.body,[.92,.95,.97],false,.95,true);
     // A alça é parte do GLB, girando solidária com a caneca no próprio eixo.
     draw(config.handle,[.93,.95,.97],false,.96,true);
     // A estampa é impressa sobre o exterior verdadeiro, não sobre um tubo extra.
     draw(config.art,[1,1,1],true,.992,false,true);
     gl.disable(gl.BLEND);
     gl.flush();
     if(gl.getError()!==gl.NO_ERROR)return false;
     const pix=new Uint8Array(4);
     gl.readPixels(canvas.width>>1,canvas.height>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pix);
     return pix[3]>0;
   }

   const isCoffee=kind==='caneca';
   const finish=isCoffee?finishColor(mugFinishColor):[1,1,1];
   draw(config.body,[1,1,1],true);
   if(kind!=='squeeze')draw(config.inside,isCoffee?finish:[.75,.80,.85],false);
   if(isCoffee)draw(config.insideFloor,finish,false);
   // Parte superior da caneca: acabamento da boca com a mesma cor
   // selecionada para o interior; nunca uma tira branca sobre a arte.
   draw(config.trim,[.965,.978,.992],false);
   if(isCoffee && config.upperRimGlaze)draw(config.upperRimGlaze,finish,false);
   // A face exterior do aro acompanha a borda de cima da estampa.
   // Sem qualquer cilindro ou camada nova sobreposta na caneca.
   if(isCoffee && config.outerRimPrinted)draw(config.outerRimPrinted,[1,1,1],true);
   // Caneca tradicional apenas: colore a borda inferior Meshy com o último
   // pixel da estampa para impedir a faixa branca irregular sobre a arte.
   if(isCoffee && config.basePrinted)draw(config.basePrinted,[1,1,1],true);
   draw(config.handle,isCoffee?finish:(kind==='chopp'?[.97,.98,1]:[.975,.985,1]),false);
   gl.flush();
   // Confirma que o renderizador desenhou algo; evita mockup vazio em falhas de WebGL.
   const glError = gl.getError();
   if(glError !== gl.NO_ERROR) return false;
   const centerPixel = new Uint8Array(4);
   gl.readPixels(Math.floor(canvas.width/2), Math.floor(canvas.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, centerPixel);
   return centerPixel[3] > 0;
 }

 loadMeshyShirt();
 loadMeshyMug();
 loadMeshySqueeze();
 loadMeshyChopp();
 loadSqueezeMaterial();
 return {supported:true,render,getMeshyStatus:()=>meshyMug?'ready':meshyError?'error':'loading'};
}
window.createTioMock3D=createTioMock3D;
})();

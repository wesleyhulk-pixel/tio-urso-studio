/* Tio Urso Studio Alpha 0.6.2 — foco na caneca tradicional, com cenário por imagem e refino visual. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const PRODUCTS = {
  caneca:{name:'Caneca tradicional',w:210,h:97},
  chopp:{name:'Caneca de chopp',w:205,h:145},
  squeeze:{name:'Squeeze 600 ml',w:240,h:150},
  camiseta:{name:'Camiseta (área de estampa)',w:280,h:350},
  azulejo20:{name:'Azulejo 20 × 20 cm',w:200,h:200},
  azulejo15:{name:'Azulejo 15 × 15 cm',w:150,h:150},
  azulejo10:{name:'Azulejo 10 × 10 cm',w:100,h:100}
};
const art = $('artCanvas'), ctx = art.getContext('2d');
const mock = $('mockCanvas'), mctx = mock.getContext('2d');
const mockSceneCanvas=$('mockSceneCanvas');
const sceneSelect=$('mockSceneChoice');
const sceneImagePicker=$('sceneImagePicker');
const mock3dCanvas=$('mock3dCanvas');
const mock3d=window.createTioMock3D ? window.createTioMock3D(mock3dCanvas) : null;
const rotaryProducts=new Set(['caneca','chopp','squeeze']);
let state = {product:'caneca',bg:'#ffffff',items:[],selected:null,customFonts:{},mugFinishColor:'#ffffff',mockSceneChoice:'madeira',mockSceneImage:null};
let customSceneImage=null;
const imageCache = new Map();
let drag = null, activeGuides = null, toastHandle = null, seq = 0, previewQueued=false;
const fontSelector=$('fontFamily');
const exportChoice=$('exportOrientation');
const exportPreview=$('exportPreview');
const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const mmtoPx = (mm,dpi=300) => Math.round(mm/25.4*dpi);
const product = () => PRODUCTS[state.product];
const artH = () => Math.round(1000 * product().h/product().w);
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>el.classList.remove('show'),3300);}
function updateMeasurements(){const p=product();$('dims').textContent=`${p.w} × ${p.h} mm`;$('exportSize').textContent=`${p.w} × ${p.h} mm`;$('exportPixels').textContent=`${mmtoPx(p.w)} × ${mmtoPx(p.h)} px`;}
function canvasFont(it){const family=String(it.font||'Arial').replace(/[\"\\]/g,'');return `bold ${it.fontSize||65}px \"${family}\"`;}
function itemDimensions(it){
 if(it.kind==='text'){const size=it.fontSize||65;ctx.save();ctx.font=canvasFont(it);const w=ctx.measureText(it.text||' ').width;ctx.restore();return {w:Math.max(w,20),h:size*1.18};}
 const img=imageCache.get(it.id);return {w:it.baseW||330,h:it.baseH||(img?330*img.naturalHeight/img.naturalWidth:200)};
}
function drawElement(g,it,selection=false){
 const {w,h}=itemDimensions(it);g.save();g.translate(it.x,it.y);g.rotate((it.rotation||0)*Math.PI/180);g.scale(it.scale||1,it.scale||1);
 if(it.kind==='text'){
  const size=it.fontSize||65;
  g.font=canvasFont(it);g.textBaseline='middle';g.textAlign='center';
  if(it.twoTone){const fill=g.createLinearGradient(0,-size*.6,0,size*.6);fill.addColorStop(0,it.color||'#123b62');fill.addColorStop(1,it.color2||'#00d3e7');g.fillStyle=fill;}
  else g.fillStyle=it.color||'#123b62';
  g.lineJoin='round';
  if((it.outlineSize||0)>0){g.strokeStyle=it.outlineColor||'#ffffff';g.lineWidth=(it.outlineSize||0)*2;g.strokeText(it.text||' ',0,0);}
  if((it.shadowBlur||0)>0){g.shadowColor=it.shadowColor||'#293f4b';g.shadowBlur=it.shadowBlur||0;g.shadowOffsetX=4;g.shadowOffsetY=4;}
  g.fillText(it.text||' ',0,0);
}
 else{const img=imageCache.get(it.id);if(img?.complete&&img.naturalWidth)g.drawImage(img,-w/2,-h/2,w,h);}
 if(selection){g.strokeStyle='#00a1b6';g.lineWidth=2/(it.scale||1);g.setLineDash([9,6]);g.strokeRect(-w/2-9,-h/2-9,w+18,h+18);g.setLineDash([]);g.fillStyle='#00a1b6';g.fillRect(w/2+1,h/2+1,14,14);}
 g.restore();
}
function paintSurface(target,selection=false){
 const H=artH();target.canvas.width=1000;target.canvas.height=H;
 target.fillStyle=state.bg;target.fillRect(0,0,1000,H);
 for(const it of state.items) drawElement(target,it,selection&&it.id===state.selected);
}
// Guias são pintadas somente no canvas do editor e NUNCA no mockup ou no PNG/PDF.
function drawGuideLine(type,coord,vertical){
 const H=artH(),color=type==='center'?'#00a8d6':'#e13e52';
 ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=6;ctx.setLineDash([]);
 ctx.beginPath();if(vertical){ctx.moveTo(coord,0);ctx.lineTo(coord,H);}else{ctx.moveTo(0,coord);ctx.lineTo(1000,coord);}ctx.stroke();
 ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash(type==='center'?[14,8]:[9,5]);ctx.stroke();ctx.setLineDash([]);
 const label=type==='center'?'CENTRO':'LIMITE';ctx.font='bold 19px Arial';ctx.textBaseline='middle';ctx.textAlign='left';
 const tx=vertical?Math.min(Math.max(coord+7,6),1000-106):11;
 const ty=vertical?34:Math.min(Math.max(coord-30,24),H-24);
 ctx.fillStyle=color;ctx.fillRect(tx,ty-12,100,27);ctx.fillStyle='#ffffff';ctx.fillText(label,tx+7,ty+1);
 ctx.restore();
}
function drawSmartGuides(){
 if(!drag||!activeGuides||!$('smartGuidesToggle').checked)return;
 if(activeGuides.x)drawGuideLine(activeGuides.x.type,activeGuides.x.line,true);
 if(activeGuides.y)drawGuideLine(activeGuides.y.type,activeGuides.y.line,false);
}
function render(){paintSurface(ctx,true);drawSmartGuides();updateControls();queueExportPreview();}
function selected(){return state.items.find(it=>it.id===state.selected);}
function updateControls(){
 const it=selected();$('selectionControls').hidden=!it;if(!it)return;
 $('textControls').hidden=it.kind!=='text';$('textEffects').hidden=it.kind!=='text';$('colorControl').hidden=it.kind!=='text';$('fontFamily').parentElement.hidden=it.kind!=='text';
 if(it.kind==='text'){$('textValue').value=it.text;$('textColor').value=it.color;$('fontFamily').value=it.font||'Arial';updateFontSample(it.font||'Arial');$('textColorSample').style.backgroundColor=it.color||'#123b62';$('fontSelectedName').textContent=state.customFonts[it.font]?.label||it.font||'Arial';$('fontSelectedName').style.fontFamily=`"${String(it.font||'Arial').replace(/["\\]/g,'')}",sans-serif`;}
 if(it.kind==='text'){
  $('twoToneToggle').checked=!!it.twoTone;$('textColor2').value=it.color2||'#00d3e7';
  $('outlineColor').value=it.outlineColor||'#ffffff';$('outlineSize').value=it.outlineSize||0;
  $('outlineSizeValue').textContent=it.outlineSize||0;
  $('textShadow').value=it.shadowBlur||0;$('textShadowValue').textContent=it.shadowBlur||0;
  $('shadowColor').value=it.shadowColor||'#293f4b';
 }
 $('elementScale').value=Math.round((it.scale||1)*100);$('scaleValue').textContent=Math.round((it.scale||1)*100)+'%';
 $('elementRotation').value=it.rotation||0;$('rotationValue').textContent=(it.rotation||0)+'°';
}
function createText(){const it={id:'e'+(++seq),kind:'text',text:'Seu texto aqui',color:'#123b62',font:'Arial',fontSize:64,x:500,y:artH()/2,scale:1,rotation:0};state.items.push(it);state.selected=it.id;render();$('textValue').focus();$('textValue').select();}
async function loadFileAsImage(file){
 if(!file||!file.type.startsWith('image/'))throw new Error('Selecione uma imagem PNG ou JPG.');
 if(file.size>25*1024*1024)throw new Error('Imagem muito grande. Escolha arquivo de até 25 MB.');
 const src=await new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=()=>reject(new Error('Falha na leitura da imagem.'));rd.readAsDataURL(file);});
 const img=await decodeImage(src);
 // Reduz uma imagem grande mantendo transparência PNG quando pertinente.
 const max=1700,ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
 if(ratio>=1)return src;
 const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*ratio);c.height=Math.round(img.naturalHeight*ratio);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
 return c.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.88);
}
function decodeImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Imagem inválida ou incompatível.'));img.src=src;});}
async function setCustomSceneFromFile(file){
 if(!file)return false;
 const src=await loadFileAsImage(file);
 const img=await decodeImage(src);
 state.mockSceneImage=src;
 customSceneImage=img;
 state.mockSceneChoice='imagem';
 sceneSelect.value='imagem';
 return true;
}
function openScenePicker(){
 if(!sceneImagePicker)return;
 try{
   if(typeof sceneImagePicker.showPicker==='function'){
     sceneImagePicker.showPicker();
     return;
   }
 }catch(_error){}
 sceneImagePicker.click();
}
async function addImage(file){if(!file)return;try{const src=await loadFileAsImage(file),img=await decodeImage(src);const w=Math.min(480,img.naturalWidth),h=w*img.naturalHeight/img.naturalWidth;const it={id:'e'+(++seq),kind:'image',src,baseW:w,baseH:h,x:500,y:artH()/2,scale:1,rotation:0};imageCache.set(it.id,img);state.items.push(it);state.selected=it.id;render();toast('Imagem adicionada! Arraste para mover.');}catch(e){toast(e.message);}}
function setProduct(key){if(!PRODUCTS[key])return;const oldH=artH();const prevRatio=state.items.map(it=>it.y/oldH);state.product=key;state.items.forEach((it,i)=>it.y=prevRatio[i]*artH());updateMeasurements();render();}
function pointerCoord(ev){const r=art.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*1000,y:(ev.clientY-r.top)/r.height*artH()};}
function itemAt(pt){for(let i=state.items.length-1;i>=0;i--){const it=state.items[i],{w,h}=itemDimensions(it),r=-(it.rotation||0)*Math.PI/180,dx=pt.x-it.x,dy=pt.y-it.y,s=it.scale||1;const lx=(dx*Math.cos(r)-dy*Math.sin(r))/s,ly=(dx*Math.sin(r)+dy*Math.cos(r))/s;if(Math.abs(lx)<=w/2+13&&Math.abs(ly)<=h/2+13)return it;}return null;}
// Referências do Canva: centro da página e as quatro bordas da arte.
// O cálculo usa o retângulo delimitador visível, inclusive quando a imagem está rotacionada.
function boundsHalfSize(it){
 const {w,h}=itemDimensions(it),r=(it.rotation||0)*Math.PI/180,s=it.scale||1;
 return {hx:(Math.abs(w*Math.cos(r))+Math.abs(h*Math.sin(r)))*s/2,
         hy:(Math.abs(w*Math.sin(r))+Math.abs(h*Math.cos(r)))*s/2};
}
function pickGuide(center,half,canvasSize,tolerance){
 const candidates=[{delta:canvasSize/2-center,line:canvasSize/2,type:'center'}];
 // Se o elemento é maior que a arte, não tentamos encaixá-lo nas duas bordas.
 if(half*2<=canvasSize){
  candidates.push({delta:half-center,line:0,type:'edge'});
  candidates.push({delta:canvasSize-half-center,line:canvasSize,type:'edge'});
 }
 const found=candidates.filter(c=>Math.abs(c.delta)<=tolerance).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0];
 return found||null;
}
function snapDraggedItem(it){
 activeGuides=null;if(!$('smartGuidesToggle').checked)return;
 const box=art.getBoundingClientRect(),{hx,hy}=boundsHalfSize(it);
 // Distância de encaixe ~9 pixels físicos da interface, adaptada ao zoom da prévia.
 const tx=9*1000/Math.max(box.width,1),ty=9*artH()/Math.max(box.height,1);
 const x=pickGuide(it.x,hx,1000,tx),y=pickGuide(it.y,hy,artH(),ty);
 if(x)it.x+=x.delta;
 if(y)it.y+=y.delta;
 activeGuides={x,y};
 // Fora da estampa: aviso vermelho sem bloquear o usuário (útil para sangria).
 if(!x && (it.x-hx<0||it.x+hx>1000))activeGuides.x={type:'edge',line:it.x<500?0:1000};
 if(!y && (it.y-hy<0||it.y+hy>artH()))activeGuides.y={type:'edge',line:it.y<artH()/2?0:artH()};
}
function endDrag(){if(!drag)return;drag=null;activeGuides=null;render();}
art.addEventListener('pointerdown',ev=>{
 ev.preventDefault();const pt=pointerCoord(ev),it=itemAt(pt);state.selected=it?.id||null;
 if(it){drag={id:it.id,pointerId:ev.pointerId,offX:pt.x-it.x,offY:pt.y-it.y};try{art.setPointerCapture(ev.pointerId);}catch(_){}}
 else drag=null;
 activeGuides=null;render();
});
art.addEventListener('pointermove',ev=>{
 if(!drag || drag.pointerId!==ev.pointerId)return;
 ev.preventDefault();const it=selected();if(!it||it.id!==drag.id)return;
 const pt=pointerCoord(ev);it.x=pt.x-drag.offX;it.y=pt.y-drag.offY;
 snapDraggedItem(it);render();
});
art.addEventListener('pointerup',ev=>{if(drag?.pointerId===ev.pointerId)endDrag();});
art.addEventListener('pointercancel',ev=>{if(drag?.pointerId===ev.pointerId)endDrag();});
art.addEventListener('lostpointercapture',endDrag);
$('smartGuidesToggle').addEventListener('change',()=>{activeGuides=null;render();});
function changeItem(fn){const it=selected();if(!it)return;fn(it);render();}
$('addText').addEventListener('click',createText);$('addImage').addEventListener('click',()=>$('imagePicker').click());
$('imagePicker').addEventListener('change',async ev=>{await addImage(ev.target.files[0]);ev.target.value='';});
$('removeSelected').addEventListener('click',()=>{if(!selected()){toast('Toque em um elemento para selecioná-lo.');return;}imageCache.delete(state.selected);state.items=state.items.filter(it=>it.id!==state.selected);state.selected=null;render();});
$('textValue').addEventListener('input',ev=>changeItem(it=>{it.text=ev.target.value;}));
$('textColor').addEventListener('input',ev=>changeItem(it=>{it.color=ev.target.value;}));
function updateFontSample(family){$('fontSample').style.fontFamily=`"${String(family).replace(/["\\]/g,'')}", sans-serif`;}
async function requestFontLoad(family){
 try{if(document.fonts&&family){await document.fonts.load(`bold 64px "${String(family).replace(/["\\]/g,'')}"`);render();}}catch(_){render();}
}
function refreshFontOptions(){
 for(const opt of [...fontSelector.options])if(opt.dataset.custom)opt.remove();
 for(const [family,info] of Object.entries(state.customFonts||{})){
  const opt=new Option('★ '+info.label,family);opt.dataset.custom='1';fontSelector.add(opt);
 }
}
async function readAsDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler a fonte.'));reader.readAsDataURL(file);});}
async function loadCustomFont(family,src){
 if(!('FontFace' in window))throw new Error('O navegador não suporta importação de fontes.');
 const fontFace=new FontFace(family,`url("${src}")`);
 await fontFace.load();document.fonts.add(fontFace);
}
$('importFont').addEventListener('click',()=>$('fontPicker').click());
$('fontPicker').addEventListener('change',async ev=>{
 const file=ev.target.files[0];ev.target.value='';if(!file)return;
 try{
  if(!/\.(ttf|otf)$/i.test(file.name))throw new Error('Escolha uma fonte TTF ou OTF.');
  if(file.size>2*1024*1024)throw new Error('A fonte deve ter até 2 MB.');
  const src=await readAsDataUrl(file),family='TUS_'+Date.now().toString(36);
  await loadCustomFont(family,src);
  state.customFonts[family]={label:file.name.replace(/\.(ttf|otf)$/i,''),src};
  refreshFontOptions();changeItem(it=>{it.font=family;});
  toast('Fonte importada. Salve o projeto para preservá-la.');
 }catch(err){toast('Falha na fonte: '+err.message);}
});
$('fontFamily').addEventListener('change',ev=>{
 const family=ev.target.value;changeItem(it=>{it.font=family;});
 updateFontSample(family);requestFontLoad(family);
});
$('twoToneToggle').addEventListener('change',ev=>changeItem(it=>{it.twoTone=ev.target.checked;}));
$('textColor2').addEventListener('input',ev=>changeItem(it=>{it.color2=ev.target.value;it.twoTone=true;}));
$('outlineColor').addEventListener('input',ev=>changeItem(it=>{it.outlineColor=ev.target.value;}));
$('outlineSize').addEventListener('input',ev=>changeItem(it=>{it.outlineSize=+ev.target.value;}));
$('textShadow').addEventListener('input',ev=>changeItem(it=>{it.shadowBlur=+ev.target.value;}));
$('shadowColor').addEventListener('input',ev=>changeItem(it=>{it.shadowColor=ev.target.value;}));
$('elementScale').addEventListener('input',ev=>changeItem(it=>{it.scale=+ev.target.value/100;}));
$('elementRotation').addEventListener('input',ev=>changeItem(it=>{it.rotation=+ev.target.value;}));
$('layerUp').addEventListener('click',()=>{const i=state.items.findIndex(it=>it.id===state.selected);if(i<0||i===state.items.length-1)return;[state.items[i],state.items[i+1]]=[state.items[i+1],state.items[i]];render();});
$('layerDown').addEventListener('click',()=>{const i=state.items.findIndex(it=>it.id===state.selected);if(i<=0)return;[state.items[i],state.items[i-1]]=[state.items[i-1],state.items[i]];render();});
$('backgroundColor').addEventListener('input',ev=>{state.bg=ev.target.value;$('bgColorSample').style.backgroundColor=state.bg;render();});
$('product').addEventListener('change',ev=>setProduct(ev.target.value));
function switchView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('selected',t.dataset.view===name);t.setAttribute('aria-current',t.dataset.view===name?'page':'false');});if(name==='mockup'){ $('mockControls').hidden=!rotaryProducts.has(state.product);renderMockup();}if(name==='preco')calculate();if(name==='export')updateOrientationUI();window.scrollTo({top:0,behavior:'instant'});}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
$('backToEditor').addEventListener('click',()=>switchView('editor'));
document.querySelectorAll('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.goto)));
document.querySelectorAll('[data-product]').forEach(btn=>btn.addEventListener('click',()=>{$('product').value=btn.dataset.product;setProduct(btn.dataset.product);switchView('editor');}));
function artworkCanvas(w,h,mirror=false){
 const off=document.createElement('canvas');off.width=w;off.height=h;const g=off.getContext('2d');
 g.save();if(mirror){g.translate(w,0);g.scale(-1,1);}g.scale(w/1000,h/artH());g.fillStyle=state.bg;g.fillRect(0,0,1000,artH());for(const it of state.items)drawElement(g,it,false);g.restore();return off;
}
// Simulação 2D de uma estampa em uma superfície cilíndrica, não geometria 3D real.
// Alpha 0.4: prévia 2D de canecas com curvatura por coluna e vista parcial ajustável.
let mockAngle=0;
function stageGradient(g){
 const wall=g.createLinearGradient(0,0,0,660);
 wall.addColorStop(0,'#eff6fa');wall.addColorStop(.58,'#edf4f8');wall.addColorStop(.78,'#e6eef4');wall.addColorStop(1,'#d7e4ec');
 g.fillStyle=wall;g.fillRect(0,0,1100,660);
 const table=g.createLinearGradient(0,455,0,660);
 table.addColorStop(0,'#d6c4ad');table.addColorStop(.18,'#cfb696');table.addColorStop(.55,'#b88f66');table.addColorStop(1,'#9a6f49');
 g.fillStyle=table;g.fillRect(0,468,1100,192);
 g.fillStyle='rgba(255,255,255,.22)';
 for(let i=0;i<7;i++){g.fillRect(0,484+i*22,1100,2);}
 const shine=g.createLinearGradient(0,438,0,500);shine.addColorStop(0,'rgba(255,255,255,.34)');shine.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=shine;g.fillRect(0,430,1100,74);
 g.fillStyle='rgba(78,58,40,.17)';g.beginPath();g.ellipse(550,532,325,26,0,0,Math.PI*2);g.fill();
 g.fillStyle='rgba(66,53,39,.08)';g.beginPath();g.ellipse(550,532,256,13,0,0,Math.PI*2);g.fill();
}
function drawWrappedTexture(g,source,left,right,top,bottom,angle){
 // Image width covers approx. 275° of cup circumference with an unprintable handle gap.
 // Clip and warp the source as if wrapped around an illustrated cylinder.
 const width=right-left,spread=275*Math.PI/180,shift=angle*Math.PI/180;
 const sxHalf=(source.width-1),cy=(top+bottom)/2;
 for(let x=Math.floor(left);x<right;x+=1){
   const u=Math.max(-.996,Math.min(.996, (x-left)/width*2-1));
   const theta=Math.asin(u);
   const printable=(theta+shift)/spread+.5;
   if(printable<0||printable>1)continue;
   const sx=Math.min(sxHalf,Math.max(0,Math.round(printable*sxHalf)));
   const curve=(1-Math.sqrt(Math.max(0,1-u*u)));
   const yt=top+curve*16;
   const yb=bottom-curve*11;
   g.drawImage(source,sx,0,1,source.height,x,yt,1.8,yb-yt);
 }
}

// Cenário atrás do modelo 3D, sem interferir na geometria nem na estampa.
if(!window.paintTioScene){
 window.paintTioScene = function(canvas, mode, customImg){
  const g=canvas.getContext('2d'), W=canvas.width,H=canvas.height;
  g.clearRect(0,0,W,H);
  if(mode==='imagem'){
   if(customImg?.complete&&customImg.naturalWidth){
    const iw=customImg.naturalWidth, ih=customImg.naturalHeight;
    const scale=Math.max(W/iw,H/ih), dw=iw*scale, dh=ih*scale;
    const dx=(W-dw)/2, dy=(H-dh)/2;
    g.drawImage(customImg,dx,dy,dw,dh);
    g.fillStyle='rgba(255,255,255,.10)';g.fillRect(0,0,W,H);
    return;
   }
   g.fillStyle='#edf4f8';g.fillRect(0,0,W,H);
   g.strokeStyle='rgba(33,78,104,.28)';g.lineWidth=3;g.setLineDash([12,9]);g.strokeRect(W*.13,H*.16,W*.74,H*.48);g.setLineDash([]);
   g.fillStyle='#537186';g.font='600 34px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('Escolha uma imagem para o cenário',W/2,H/2-8);
   g.font='500 22px Arial';g.fillStyle='#6b8797';g.fillText('Selecione “Escolher imagem” novamente para trocar depois.',W/2,H/2+32);
   return;
  }
  if(mode==='limpo'){
   g.fillStyle='#edf4f8';g.fillRect(0,0,W,H);return;
  }
  const light=mode==='clara';
  const wall=g.createLinearGradient(0,0,0,H*.68);
  wall.addColorStop(0,light?'#f5f7f9':'#eef5ef');wall.addColorStop(1,light?'#e2edf1':'#d9e7dc');
  g.fillStyle=wall;g.fillRect(0,0,W,H);
  const table=g.createLinearGradient(0,H*.72,0,H);
  table.addColorStop(0,light?'#f6f2ed':'#a9744c');
  table.addColorStop(1,light?'#e9ded0':'#71462e');
  g.fillStyle=table;g.fillRect(0,H*.72,W,H*.28);
  g.fillStyle=light?'rgba(182,157,141,.19)':'rgba(64,38,24,.25)';
  g.fillRect(0,H*.72,W,3);
  for(let k=0;k<10;k++){
   const y=H*.73+k*21;
   g.fillStyle=light?'rgba(171,153,141,.09)':'rgba(54,28,16,.13)';
   g.fillRect(0,y,W,1.4);
  }
 };
}

function renderMockup(){
 const finishControls=$('mugFinishControl');
 if(finishControls)finishControls.hidden=state.product!=='caneca';
 const three=rotaryProducts.has(state.product)&&mock3d?.supported;
 mock3dCanvas.hidden=!three;mock.hidden=three;mockSceneCanvas.hidden=!three;
 $('mockTypeTag').textContent=three?'3D BETA':'2D';
 if(three){
   let drawn=false;
   try{
     drawn=mock3d.render(state.product,artworkCanvas(1000,artH()),mockAngle,state.mugFinishColor)!==false;
   }catch(err){
     console.error('Falha no mockup 3D, usando prévia de segurança:',err);
   }
   if(drawn){window.paintTioScene?.(mockSceneCanvas,state.mockSceneChoice,customSceneImage);return;}
   // O modo 3D não deve esconder o produto se houver uma falha gráfica.
   mock3dCanvas.hidden=true;mockSceneCanvas.hidden=true;mock.hidden=false;
   $('mockTypeTag').textContent='PRÉVIA 2D';
 }

 const W=1100,H=660,g=mctx;
 g.clearRect(0,0,W,H);
 if(state.mockSceneChoice==='imagem'&&customSceneImage?.complete&&customSceneImage.naturalWidth){
   const iw=customSceneImage.naturalWidth, ih=customSceneImage.naturalHeight;
   const scale=Math.max(W/iw,H/ih), dw=iw*scale, dh=ih*scale;
   const dx=(W-dw)/2, dy=(H-dh)/2;
   g.drawImage(customSceneImage,dx,dy,dw,dh);
 }else stageGradient(g);
 const source=artworkCanvas(1000,artH());
 if(state.product==='camiseta'){
   // Camiseta ilustrativa independente da geometria cilíndrica.
   g.save();g.shadowBlur=22;g.shadowOffsetY=13;g.shadowColor='rgba(25,61,84,.22)';
   g.beginPath();g.moveTo(381,118);g.lineTo(466,86);g.quadraticCurveTo(551,129,629,86);g.lineTo(721,117);g.lineTo(851,234);g.lineTo(760,345);g.lineTo(713,300);g.lineTo(718,556);g.lineTo(378,556);g.lineTo(384,300);g.lineTo(340,345);g.lineTo(248,235);g.closePath();g.fillStyle='#fbfcfe';g.fill();g.restore();
   g.strokeStyle='#cad6e0';g.lineWidth=8;g.stroke();g.strokeStyle='#e0e6eb';g.lineWidth=15;g.beginPath();g.arc(548,102,54,0,Math.PI);g.stroke();
   g.save();roundPath(g,410,196,278,300,11);g.clip();g.drawImage(source,410,196,278,300);g.restore();
   g.strokeStyle='rgba(130,158,176,.18)';g.lineWidth=2;roundPath(g,410,196,278,300,11);g.stroke();return;
 }
 if(state.product.startsWith('azulejo')){
   // Peças planas: área integral da estampa, sem adaptação de caneca.
   g.save();g.shadowColor='rgba(25,52,69,.25)';g.shadowBlur=29;g.shadowOffsetY=19;
   g.fillStyle='#d7e2e9';roundPath(g,318,94,465,466,12);g.fill();g.restore();
   g.save();roundPath(g,327,102,445,446,6);g.clip();g.fillStyle='#fff';g.fillRect(327,102,445,446);g.drawImage(source,327,102,445,446);g.restore();
   g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=10;roundPath(g,327,102,445,446,6);g.stroke();return;
 }
 if(state.product==='squeeze'){
   // Squeeze: tampa atrás, corpo arredondado com iluminação lateral.
   g.save();g.fillStyle='#233846';roundPath(g,428,72,244,93,21);g.fill();g.fillStyle='#415563';roundPath(g,447,143,206,63,13);g.fill();g.restore();
   const metal=g.createLinearGradient(412,0,688,0);
   metal.addColorStop(0,'#93acba');metal.addColorStop(.19,'#f8fcff');metal.addColorStop(.55,'#fff');metal.addColorStop(.86,'#e7f1f4');metal.addColorStop(1,'#8ba4b5');
   g.fillStyle=metal;roundPath(g,411,192,278,350,30);g.fill();
   g.save();roundPath(g,419,207,262,323,18);g.clip();
   drawWrappedTexture(g,source,420,681,211,523,mockAngle);
   const shade=g.createLinearGradient(420,0,680,0);
   shade.addColorStop(0,'rgba(21,40,55,.33)');shade.addColorStop(.12,'rgba(24,42,51,.12)');shade.addColorStop(.33,'rgba(255,255,255,.13)');shade.addColorStop(.62,'rgba(255,255,255,.04)');shade.addColorStop(.9,'rgba(28,47,57,.09)');shade.addColorStop(1,'rgba(16,44,56,.4)');
   g.fillStyle=shade;g.fillRect(419,205,264,330);g.restore();
   g.strokeStyle='rgba(235,250,255,.8)';g.lineWidth=6;g.beginPath();g.moveTo(427,208);g.lineTo(427,530);g.stroke();
   return;
 }
 // Caneca (chopp/caneca tradicional): alça atrás do corpo e cilindro levemente afunilado.
 const isChopp=state.product==='chopp';
 const top=isChopp?138:173,bottom=isChopp?554:538;
 const radians=mockAngle*Math.PI/180;
 // Fallback sem WebGL: alça e estampa se movem em conjunto para indicar rotação.
 // Em aparelhos compatíveis, o modelo WebGL acima usa geometria 3D verdadeira.
 const handleX=546+195*Math.sin(radians);
 const frontHandle=Math.cos(radians)<-.25;
 function drawFallbackHandle(){
  const xr=Math.max(34,56+70*Math.abs(Math.sin(radians))),yc=362;
  g.save();g.shadowColor='rgba(25,57,83,.17)';g.shadowBlur=12;
  g.lineWidth=34;g.lineCap='round';g.strokeStyle='#95adbb';g.beginPath();g.ellipse(handleX,yc,xr,128,0,0,Math.PI*2);g.stroke();g.restore();
  g.strokeStyle='#fbfdff';g.lineWidth=24;g.lineCap='round';g.beginPath();g.ellipse(handleX,yc,xr*.82,111,0,0,Math.PI*2);g.stroke();
 }
 if(!frontHandle)drawFallbackHandle();
 const left=304,right=789;
 const bodyGrad=g.createLinearGradient(left,0,right,0);
 bodyGrad.addColorStop(0,'#b3c5d1');bodyGrad.addColorStop(.14,'#f7fcff');bodyGrad.addColorStop(.5,'#fff');bodyGrad.addColorStop(.84,'#f4f9fc');bodyGrad.addColorStop(1,'#95adbb');
 g.beginPath();g.moveTo(left,top+11);g.bezierCurveTo(430,top-12,670,top-15,right,top+12);
 g.lineTo(right-14,bottom-8);g.bezierCurveTo(672,bottom+28,422,bottom+28,left+14,bottom-8);g.closePath();
 g.fillStyle=bodyGrad;g.fill();
 g.save();g.clip();
 // Estampa dentro de área útil: sem cobrir bordas e sem inverter texto.
 const printTop=top+33,printBottom=bottom-12;
 drawWrappedTexture(g,source,left+14,right-14,printTop,printBottom,mockAngle);
 const shadow=g.createLinearGradient(left,0,right,0);
 shadow.addColorStop(0,'rgba(14,46,67,.46)');shadow.addColorStop(.08,'rgba(14,46,67,.20)');
 shadow.addColorStop(.26,'rgba(255,255,255,.05)');shadow.addColorStop(.49,'rgba(255,255,255,.15)');
 shadow.addColorStop(.72,'rgba(0,0,0,.01)');shadow.addColorStop(.91,'rgba(31,51,63,.17)');shadow.addColorStop(1,'rgba(18,46,64,.47)');
 g.fillStyle=shadow;g.fillRect(left,top-2,right-left,bottom-top+42);
 g.restore();
 // Glossy ceramic rim: opening and edges.
 g.strokeStyle='#d6e3ea';g.lineWidth=13;g.beginPath();g.ellipse(546,top+12,245,29,0,0,Math.PI*2);g.stroke();
 g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=6;g.beginPath();g.ellipse(546,top+10,238,24,0,Math.PI*.08,Math.PI*.88);g.stroke();
 g.strokeStyle='rgba(83,118,138,.15)';g.lineWidth=3;g.beginPath();g.moveTo(left+15,bottom-7);g.quadraticCurveTo(545,bottom+31,right-15,bottom-7);g.stroke();
 if(frontHandle)drawFallbackHandle();
}
function roundPath(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function safeFilename(ext,mode=''){return 'tio-urso-'+state.product+'-'+new Date().toISOString().slice(0,10)+(mode?'-'+mode:'')+'.'+ext;}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
function toBlob(canvas,type='image/png',q=.94){return new Promise((res,rej)=>canvas.toBlob(blob=>blob?res(blob):rej(new Error('Falha ao gerar imagem.')),type,q));}
// Adiciona chunk PNG pHYs declarando ~300 DPI (11811 px/m) antes do primeiro IDAT.
function u32(bytes,i){return ((bytes[i]*0x1000000)+(bytes[i+1]<<16)+(bytes[i+2]<<8)+bytes[i+3])>>>0;}
function writeU32(bytes,i,num){bytes[i]=(num>>>24)&255;bytes[i+1]=(num>>>16)&255;bytes[i+2]=(num>>>8)&255;bytes[i+3]=num&255;}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c&1)?(c>>>1)^0xedb88320:(c>>>1);}return(c^0xffffffff)>>>0;}
async function png300(blob){const raw=new Uint8Array(await blob.arrayBuffer());if(raw.length<33)return blob;
 // Sempre insere pHYs antes do primeiro IDAT, removendo chunk pHYs existente.
 const chunks=[raw.subarray(0,8)];let i=8,inserted=false;
 const payload=new Uint8Array(9);writeU32(payload,0,11811);writeU32(payload,4,11811);payload[8]=1;
 const chunk=new Uint8Array(4+4+9+4);writeU32(chunk,0,9);chunk.set([112,72,89,115],4);chunk.set(payload,8);writeU32(chunk,17,crc32(chunk.subarray(4,17)));
 while(i+12<=raw.length){const len=u32(raw,i),end=i+12+len;if(end>raw.length)break;const type=String.fromCharCode(...raw.subarray(i+4,i+8));if(!inserted&&type==='IDAT'){chunks.push(chunk);inserted=true;}if(type!=='pHYs')chunks.push(raw.subarray(i,end));i=end;}
 return new Blob(chunks,{type:'image/png'});
}
async function pngExport(){try{await ensureProjectFonts();const mode=exportChoice.value==='mirrored'?'espelhada':'normal';const c=artworkCanvas(mmtoPx(product().w),mmtoPx(product().h),mode==='espelhada');const blob=await png300(await toBlob(c));downloadBlob(blob,safeFilename('png',mode));toast('PNG '+mode+' gerado nas dimensões do produto.');}catch(e){toast('Falha ao exportar PNG: '+e.message);}}
// PDF simples: página do tamanho exato da estampa; sem biblioteca/CDN.
async function pdfExport(){try{
 await ensureProjectFonts();const mode=exportChoice.value==='mirrored'?'espelhada':'normal';
 const p=product(),c=artworkCanvas(mmtoPx(p.w),mmtoPx(p.h),mode==='espelhada');
 const jpeg=new Uint8Array(await (await toBlob(c,'image/jpeg',.96)).arrayBuffer());
 const enc=new TextEncoder(),sections=[];let bytes=0;
 function append(data){sections.push(data);bytes+=data.length;}
 function t(v){append(enc.encode(v));}
 t('%PDF-1.4\n');const offsets=[0];
 const obj=(id,fn)=>{offsets[id]=bytes;t(id+' 0 obj\n');fn();t('\nendobj\n');};
 const w=(p.w*72/25.4).toFixed(4),h=(p.h*72/25.4).toFixed(4);
 obj(1,()=>t('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>t('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
 obj(3,()=>t(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`));
 const commands=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);
 obj(4,()=>{t(`<< /Length ${commands.length} >>\nstream\n`);append(commands);t('endstream');});
 obj(5,()=>{t(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);append(jpeg);t('\nendstream');});
 const xref=bytes;t('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)t(String(offsets[i]).padStart(10,'0')+' 00000 n \n');t(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 downloadBlob(new Blob(sections,{type:'application/pdf'}),safeFilename('pdf',mode));toast('PDF '+mode+' criado em tamanho real.');
 }catch(e){toast('Falha ao exportar PDF: '+e.message);}}
$('downloadPng').addEventListener('click',pngExport);$('downloadPdf').addEventListener('click',pdfExport);
sceneSelect.addEventListener('change',()=>{
 state.mockSceneChoice=sceneSelect.value;
 if(sceneSelect.value==='imagem'){
   openScenePicker();
 }
 renderMockup();
});
['click','touchstart'].forEach(evt=>sceneSelect.addEventListener(evt,(ev)=>{
 if(sceneSelect.value==='imagem'){
   ev.preventDefault();
   openScenePicker();
 }
},{passive:false}));
sceneImagePicker?.addEventListener('change',async ev=>{
 const file=ev.target.files?.[0];
 try{
   if(file){await setCustomSceneFromFile(file);toast('Imagem de cenário carregada.');}
   else if(!state.mockSceneImage&&state.mockSceneChoice==='imagem'){state.mockSceneChoice='madeira';sceneSelect.value='madeira';}
 }catch(error){toast('Falha ao carregar cenário: '+error.message); if(!state.mockSceneImage){state.mockSceneChoice='madeira';sceneSelect.value='madeira';}}
 finally{ev.target.value='';renderMockup();}
});
const finishPicker=$('mugFinishColor');
const mugFinishChoices=document.querySelectorAll('[data-finish]');
function setMugFinish(hex,refresh=true){
 if(!/^#[0-9a-f]{6}$/i.test(String(hex)))hex='#ffffff';
 state.mugFinishColor=hex.toLowerCase();
 finishPicker.value=state.mugFinishColor;
 $('mugFinishSample').style.backgroundColor=state.mugFinishColor;
 mugFinishChoices.forEach(button=>button.classList.toggle('active',button.dataset.finish.toLowerCase()===state.mugFinishColor));
 if(refresh)renderMockup();
}
finishPicker.addEventListener('input',event=>setMugFinish(event.target.value));
mugFinishChoices.forEach(button=>button.addEventListener('click',()=>setMugFinish(button.dataset.finish)));
setMugFinish(state.mugFinishColor,false);

$('exportMockup').addEventListener('click',async()=>{try{renderMockup();let output=mock;if(!mock3dCanvas.hidden){output=document.createElement('canvas');output.width=1100;output.height=660;const g=output.getContext('2d');g.drawImage(mockSceneCanvas,0,0,1100,660);g.drawImage(mock3dCanvas,0,0,1100,660);}downloadBlob(await toBlob(output),safeFilename('mockup.png'));toast('Mockup exportado.');}catch(e){toast(e.message);}});
function calculate(){const c=['productCost','printingCost','extraCost'].reduce((a,id)=>a+Math.max(0,Number($(id).value)||0),0);const rate=Math.max(0,Number($('margin').value)||0);const lucro=c*rate/100;$('salePrice').textContent=money(c+lucro);$('priceExplanation').textContent=`Custo ${money(c)} · Lucro ${money(lucro)}`;return{c,lucro,price:c+lucro};}
['productCost','printingCost','extraCost','margin'].forEach(id=>$(id).addEventListener('input',calculate));
$('copyPrice').addEventListener('click',async()=>{const p=calculate();const msg=`Orçamento Tio Urso Studio\nProduto: ${product().name}\nPreço sugerido: ${money(p.price)}`;try{await navigator.clipboard.writeText(msg);toast('Orçamento copiado.');}catch(e){window.prompt('Copie seu orçamento:',msg);}});
$('saveProject').addEventListener('click',()=>{const backup={version:1,...state,selected:null};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});downloadBlob(blob,safeFilename('json'));toast('Projeto salvo em arquivo JSON.');});
$('openProject').addEventListener('click',()=>$('projectPicker').click());
$('projectPicker').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>30*1024*1024)throw new Error('Arquivo muito grande.');const data=JSON.parse(await file.text());if(data.version!==1||!PRODUCTS[data.product]||!Array.isArray(data.items)||data.items.length>150)throw new Error('Projeto incompatível.');const imgEntries=data.items.filter(it=>it.kind==='image');const pairs=await Promise.all(imgEntries.map(async it=>[it.id,await decodeImage(it.src)]));state={product:data.product,bg:/^#[0-9a-f]{6}$/i.test(data.bg)?data.bg:'#ffffff',items:data.items,selected:null,customFonts:{},mugFinishColor:/^#[0-9a-f]{6}$/i.test(data.mugFinishColor)?data.mugFinishColor:'#ffffff',mockSceneChoice:['madeira','clara','limpo','imagem'].includes(data.mockSceneChoice)?data.mockSceneChoice:'madeira',mockSceneImage:typeof data.mockSceneImage==='string'?data.mockSceneImage:null};
 customSceneImage=state.mockSceneImage?await decodeImage(state.mockSceneImage).catch(()=>null):null;
 sceneSelect.value=state.mockSceneChoice;
 setMugFinish(state.mugFinishColor,false);
 for(const [family,info] of Object.entries(data.customFonts||{})){
  if(!/^TUS_[a-z0-9]+$/i.test(family)||typeof info?.src!=='string'||info.src.length>4000000)continue;
  try{await loadCustomFont(family,info.src);state.customFonts[family]={label:String(info.label||'Fonte personalizada').slice(0,90),src:info.src};}catch(_){}
 }
 refreshFontOptions();imageCache.clear();for(const [id,img] of pairs)imageCache.set(id,img);seq=Date.now();$('product').value=state.product;$('backgroundColor').value=state.bg;$('bgColorSample').style.backgroundColor=state.bg;updateMeasurements();render();toast('Projeto carregado.');}catch(e){toast('Erro ao abrir projeto: '+e.message);}finally{ev.target.value='';}});
$('resetProject').addEventListener('click',()=>{if(!window.confirm('Começar nova arte? Salve o projeto atual antes de continuar.'))return;state.items=[];state.selected=null;state.bg='#ffffff';imageCache.clear();$('backgroundColor').value='#ffffff';$('bgColorSample').style.backgroundColor='#ffffff';render();toast('Nova arte em branco.');});
// Orientação explícita para a impressão e prévia fiel à exportação.
function renderExportPreview(){
 if(!exportPreview)return;
 const width=620,height=Math.max(1,Math.round(width*product().h/product().w));
 const p=artworkCanvas(width,height,exportChoice.value==='mirrored');
 exportPreview.width=width;exportPreview.height=height;
 const g=exportPreview.getContext('2d');g.drawImage(p,0,0);
}
function queueExportPreview(){
 if(previewQueued)return;previewQueued=true;
 requestAnimationFrame(()=>{previewQueued=false;renderExportPreview();});
}
function updateOrientationUI(){
 const mirrored=exportChoice.value==='mirrored',box=$('orientationHelp');
 $('orientationTitle').textContent=mirrored?'Exportação ESPELHADA':'Exportação NORMAL';
 $('orientationDescription').textContent=mirrored?'O arquivo será invertido horizontalmente para transferência. Use somente quando seu processo de impressão exigir; não espelhe duas vezes.':'O arquivo mantém o texto legível. Ideal para cliente, conferência e fluxos nos quais o espelhamento já é feito pela impressão.';
 box.classList.toggle('mirrored',mirrored);document.querySelectorAll('[data-orient]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.orient===exportChoice.value);btn.setAttribute('aria-pressed',btn.dataset.orient===exportChoice.value?'true':'false');});$('previewMode').textContent=mirrored?'ESPELHADA':'NORMAL';$('previewMode').classList.toggle('mirrored',mirrored);queueExportPreview();
}
exportChoice.addEventListener('change',updateOrientationUI);
document.querySelectorAll('[data-orient]').forEach(btn=>btn.addEventListener('click',()=>{exportChoice.value=btn.dataset.orient;updateOrientationUI();}));
// Fontes online podem demorar a carregar. Aguarda antes de salvar, para evitar troca de aparência no PNG/PDF.
async function ensureProjectFonts(){
 if(!document.fonts)return;
 const families=[...new Set(state.items.filter(it=>it.kind==='text').map(it=>it.font||'Arial'))];
 await Promise.race([Promise.all(families.map(f=>document.fonts.load(`bold 65px "${String(f).replace(/["\\]/g,'')}"`).catch(()=>[]))),new Promise(resolve=>setTimeout(resolve,6500))]);
}
document.fonts?.ready?.then(()=>{render();}).catch(()=>{});

// Alpha 0.4: galeria de fontes feita para toque, sem depender do seletor nativo Android.
const fontCategories = {
 'Arial':'Fortes','Georgia':'Elegantes','Verdana':'Fortes','Impact':'Fortes','Trebuchet MS':'Fortes',
 'Courier New':'Fortes','Times New Roman':'Elegantes','Anton':'Fortes','Bebas Neue':'Fortes',
 'Oswald':'Fortes','Montserrat':'Fortes','Poppins':'Divertidas','Righteous':'Divertidas',
 'Bangers':'Divertidas','Lobster':'Manuscritas','Pacifico':'Manuscritas','Dancing Script':'Manuscritas',
 'Great Vibes':'Elegantes','Permanent Marker':'Divertidas','Cinzel':'Elegantes',
 'Playfair Display':'Elegantes','Fredoka':'Divertidas','Satisfy':'Manuscritas',
 'Kalam':'Manuscritas','Abril Fatface':'Elegantes','Russo One':'Fortes','Caveat':'Manuscritas',
 'Indie Flower':'Manuscritas'
};
let fontCategory='Todas';
const overlays=['fontOverlay','colorOverlay'];
function closeSheet(){overlays.forEach(id=>$(id).hidden=true);document.body.style.overflow='';}
function openSheet(id){closeSheet();$(id).hidden=false;document.body.style.overflow='hidden';}
document.querySelectorAll('[data-close-sheet]').forEach(btn=>btn.addEventListener('click',closeSheet));
overlays.forEach(id=>$(id).addEventListener('click',event=>{if(event.target===$(id))closeSheet();}));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSheet();});
function fontList(){const query=$('fontSearch').value.trim().toLocaleLowerCase('pt-BR');return [...fontSelector.options].filter(opt=>(fontCategory==='Todas'||(fontCategories[opt.value]||'Divertidas')===fontCategory)&&opt.text.toLocaleLowerCase('pt-BR').includes(query));}
function fontGalleryRender(){
 const box=$('fontGallery');box.replaceChildren();const list=fontList();
 if(!list.length){const msg=document.createElement('p');msg.textContent='Nenhuma fonte encontrada.';box.append(msg);return;}
 for(const option of list){
   const name=option.value;
   const btn=document.createElement('button');btn.type='button';btn.className='font-option'+(selected()?.font===name?' active':'');
   const sample=document.createElement('span');sample.className='font-title';sample.textContent='Tio Urso';sample.style.fontFamily=`"${String(name).replace(/["\\]/g,'')}",sans-serif`;
   const label=document.createElement('span');label.className='font-caption';label.textContent=state.customFonts[name]?.label||name;
   btn.append(sample,label);btn.addEventListener('click',()=>{
     fontSelector.value=name;fontSelector.dispatchEvent(new Event('change',{bubbles:true}));closeSheet();toast('Fonte: '+label.textContent);
   });box.append(btn);
 }
}
$('chooseFont').addEventListener('click',()=>{if(!selected()||selected().kind!=='text'){toast('Selecione um texto primeiro.');return;}fontCategory='Todas';$('fontSearch').value='';document.querySelectorAll('.font-category').forEach(el=>el.classList.toggle('active',el.dataset.fontCategory===fontCategory));fontGalleryRender();openSheet('fontOverlay');});
$('fontSearch').addEventListener('input',fontGalleryRender);
document.querySelectorAll('.font-category').forEach(btn=>btn.addEventListener('click',()=>{fontCategory=btn.dataset.fontCategory;document.querySelectorAll('.font-category').forEach(b=>b.classList.toggle('active',b===btn));fontGalleryRender();}));
$('fontImportAction').addEventListener('click',()=>{$('fontPicker').click();});
$('fontPicker').addEventListener('change',()=>setTimeout(()=>{closeSheet();fontGalleryRender();},250));

// Paleta completa, recent colors, HEX e seletor avançado nativo opcional.
const predefinedColors = [
 '#FFFFFF','#F3F4F6','#C7CDD4','#808080','#374151','#000000','#7F1D1D','#AA1111',
 '#FF0000','#F43F5E','#FF7E8A','#FF9E00','#FFCF00','#FFF500','#A7E300','#51B749',
 '#00C853','#00BFA5','#00FFFF','#00A6BF','#0088EF','#0041FF','#13267D','#5420A6',
 '#9600D4','#ED00DB','#FC70C6','#CF7D44','#7B4B2B','#E9BE9B','#FEDFBA','#C6A5FF',
 '#FCE7F3','#E4F4FF','#BAE6FD','#A7F3D0','#FFEDD5','#FDF2B8','#123B62','#0B2136',
 '#EC4899','#BE185D','#14B8A6','#0E7490','#65A30D','#B45309','#9333EA','#1D4ED8'
];
let colorTarget='text', chosenColor='#ff0000';
let recentColors=[];try{const saved=JSON.parse(localStorage.getItem('tuStudioRecentColors')||'[]');if(Array.isArray(saved))recentColors=saved.filter(v=>/^#[0-9A-F]{6}$/i.test(v)).slice(0,8);}catch(_){}
const validHex=s=>/^#[0-9A-F]{6}$/i.test(s);
function makeSwatch(color,container){const btn=document.createElement('button');btn.type='button';btn.className='swatch'+(chosenColor.toLowerCase()===color.toLowerCase()?' active':'');btn.style.backgroundColor=color;btn.title=color;btn.setAttribute('aria-label','Cor '+color);btn.addEventListener('click',()=>{chosenColor=color.toUpperCase();syncColors();});container.append(btn);}
function swatchesRender(){const grid=$('colorSwatches'),recent=$('recentSwatches');grid.replaceChildren();recent.replaceChildren();predefinedColors.forEach(c=>makeSwatch(c,grid));(recentColors.length?recentColors:[chosenColor]).forEach(c=>makeSwatch(c,recent));}
function syncColors(){if(!validHex(chosenColor))return;chosenColor=chosenColor.toUpperCase();$('hexColor').value=chosenColor;$('nativeColor').value=chosenColor;$('selectedColorChip').style.backgroundColor=chosenColor;$('selectedColorLabel').textContent=chosenColor;swatchesRender();}
function showColor(target){colorTarget=target;chosenColor=(target==='text'?selected()?.color:state.bg)||'#ffffff';syncColors();openSheet('colorOverlay');}
$('chooseTextColor').addEventListener('click',()=>{if(selected()?.kind==='text')showColor('text');});
$('chooseBgColor').addEventListener('click',()=>showColor('background'));
$('hexColor').addEventListener('input',event=>{let value=event.target.value.trim();if(value&&!value.startsWith('#'))value='#'+value;if(validHex(value)){chosenColor=value;syncColors();}});
$('nativeColor').addEventListener('input',event=>{chosenColor=event.target.value;syncColors();});
$('applyColor').addEventListener('click',()=>{
 const hex=$('hexColor').value.trim();if(!validHex(hex)){toast('Informe um HEX válido, exemplo: #FF0000');return;}
 chosenColor=hex.toUpperCase();const target=colorTarget==='text'?'textColor':'backgroundColor';$(target).value=chosenColor;$(target).dispatchEvent(new Event('input',{bubbles:true}));
 if(colorTarget==='text')$('textColorSample').style.backgroundColor=chosenColor;
 recentColors=[chosenColor,...recentColors.filter(c=>c!==chosenColor)].slice(0,8);
 try{localStorage.setItem('tuStudioRecentColors',JSON.stringify(recentColors));}catch(_){}
 closeSheet();toast('Cor aplicada: '+chosenColor);
});


// Controle de orientação da estampa no mockup. Não altera a arte nem seu arquivo de impressão.
const mockAngleInput=$('mockAngle');
function updateMockAngle(angle){
 mockAngle=Math.round(Math.max(-180,Math.min(180,Number(angle)||0)));
 mockAngleInput.value=String(mockAngle);
 $('mockAngleLabel').textContent=Math.abs(mockAngle)>=150?'Trás • 180°':(mockAngle===0?'Frente • 0°':(mockAngle<0?'Esquerda':'Direita')+' • '+Math.abs(mockAngle)+'°');
 document.querySelectorAll('[data-mock-angle]').forEach(el=>el.classList.toggle('active',Number(el.dataset.mockAngle)===mockAngle));
 renderMockup();
}
mockAngleInput.addEventListener('input',e=>updateMockAngle(e.target.value));
let spinDrag=null;
mock3dCanvas.addEventListener('pointerdown',ev=>{if(mock3dCanvas.hidden)return;spinDrag={x:ev.clientX,angle:mockAngle,id:ev.pointerId};mock3dCanvas.setPointerCapture(ev.pointerId);});
mock3dCanvas.addEventListener('pointermove',ev=>{if(!spinDrag||spinDrag.id!==ev.pointerId)return;updateMockAngle(spinDrag.angle+(ev.clientX-spinDrag.x)*.7);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])mock3dCanvas.addEventListener(event,()=>{spinDrag=null;});
document.querySelectorAll('[data-mock-angle]').forEach(button=>button.addEventListener('click',()=>updateMockAngle(button.dataset.mockAngle)));

// Inicialização. Sem salvamento remoto nem coleta de dados.
updateMeasurements();$('bgColorSample').style.backgroundColor=state.bg;sceneSelect.value=state.mockSceneChoice;render();calculate();updateOrientationUI();
// O modo PWA completo será ativado quando os ícones, manifesto e SW estiverem publicados.
})();

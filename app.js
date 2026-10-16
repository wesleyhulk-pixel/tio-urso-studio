/* Tio Urso Studio Alpha 1.0.6 — novo projeto com escolha guiada de produto e variações. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const PRODUCTS = {
  caneca:{name:'Caneca tradicional',w:210,h:97},
  chopp:{name:'Caneca de chopp',w:205,h:145},
  squeeze:{name:'Squeeze 600 ml',w:240,h:150},
  camiseta:{name:'Camiseta',w:210,h:297},
  azulejo20:{name:'Azulejo 20 × 20 cm',w:200,h:200},
  azulejo15:{name:'Azulejo 15 × 15 cm',w:150,h:150},
  azulejo10:{name:'Azulejo 10 × 10 cm',w:100,h:100}
};
const SHIRT_AREAS = {
  frente:{name:'Camiseta · Frente',w:210,h:297,label:'Frente · A4'},
  costas:{name:'Camiseta · Costas',w:210,h:297,label:'Costas · A4'},
  peito:{name:'Camiseta · Peito',w:120,h:120,label:'Peito · 12 × 12 cm'},
  manga_d:{name:'Camiseta · Braço direito',w:90,h:90,label:'Braço direito · 9 × 9 cm'},
  manga_e:{name:'Camiseta · Braço esquerdo',w:90,h:90,label:'Braço esquerdo · 9 × 9 cm'}
};
const art = $('artCanvas'), ctx = art.getContext('2d');
const mock = $('mockCanvas'), mctx = mock.getContext('2d');
const mockSceneCanvas=$('mockSceneCanvas');
const sceneControl=$('sceneControl');
const sceneSelect=$('mockSceneChoice');
const sceneMenuTrigger=$('sceneMenuTrigger');
const sceneMenu=$('sceneMenu');
const sceneTriggerLabel=$('sceneTriggerLabel');
const sceneImagePicker=$('sceneImagePicker');
const mock3dCanvas=$('mock3dCanvas');
const mockStage=$('mockStage');
const mock3d=window.createTioMock3D ? window.createTioMock3D(mock3dCanvas) : null;
window.addEventListener('tio-meshy-ready',()=>{
 if(['caneca','camiseta'].includes(state.product))renderMockup();
});
window.addEventListener('tio-meshy-failed',()=>{
 console.warn('O modelo Meshy não carregou. Mantendo a prévia ilustrativa.');
});
const rotaryProducts=new Set(['caneca','chopp','squeeze','camiseta']);
let state = {product:'caneca',bg:'#ffffff',items:[],selected:null,customFonts:{},mugFinishColor:'#ffffff',mockSceneChoice:'madeira',mockSceneImage:null,mockTableStyle:'madeira',shirtZone:'frente',shirtColor:'#ffffff',shirtTrimColor:'#d9dee4',shirtCollarColor:'#d9dee4'};
let customSceneImage=null;
const imageCache = new Map();
// Histórico limitado; imagens mantêm a mesma referência de data URI (sem codificar de novo).
const MAX_HISTORY=70;
let history=[],historyCursor=-1,lastHistoryKey=null,lastHistoryAt=0;
let lastLayerSignature='';
function snapshotProject(){
 return {items:state.items.map(it=>({...it})),selected:state.selected,product:state.product,
 bg:state.bg,shirtZone:state.shirtZone,shirtColor:state.shirtColor,
 shirtTrimColor:state.shirtTrimColor,shirtCollarColor:state.shirtCollarColor};
}
function snapshotSignature(snapshot){
 // A fonte (src) da imagem é imutável. Basta o id para identificar essa imagem.
 const compact=snapshot.items.map(({src,...it})=>it);
 return JSON.stringify([snapshot.product,snapshot.bg,snapshot.shirtZone,snapshot.shirtColor,
 snapshot.shirtTrimColor,snapshot.shirtCollarColor,compact]);
}
function updateHistoryUI(){
 const previous=historyCursor>0,following=historyCursor>=0&&historyCursor<history.length-1;
 $('undoBtn').disabled=!previous;$('redoBtn').disabled=!following;
 $('historyStatus').textContent=previous||following
  ?`${historyCursor} para desfazer · ${history.length-1-historyCursor} para refazer`
  :'Tudo em ordem · sem alterações pendentes';
}
function resetHistory(){
 const shot=snapshotProject();history=[{shot,signature:snapshotSignature(shot)}];historyCursor=0;
 lastHistoryKey=null;lastHistoryAt=0;updateHistoryUI();
}
function recordHistory(key=null){
 if(historyCursor<0){resetHistory();return;}
 const shot=snapshotProject(),signature=snapshotSignature(shot);
 if(signature===history[historyCursor].signature)return;
 const now=performance.now();
 if(key&&lastHistoryKey===key&&now-lastHistoryAt<900&&historyCursor===history.length-1&&history.length>1){
  history[historyCursor]={shot,signature};
 }else{
  history=history.slice(0,historyCursor+1);history.push({shot,signature});
  if(history.length>MAX_HISTORY)history.shift();
  historyCursor=history.length-1;
 }
 lastHistoryKey=key;lastHistoryAt=now;updateHistoryUI();
}
function restoreHistory(){
 const shot=history[historyCursor]?.shot;if(!shot)return;
 state.items=shot.items.map(it=>({...it}));state.selected=shot.selected;
 state.product=shot.product;state.bg=shot.bg;state.shirtZone=shot.shirtZone;
 state.shirtColor=shot.shirtColor;state.shirtTrimColor=shot.shirtTrimColor;
 state.shirtCollarColor=shot.shirtCollarColor;
 if(!state.items.some(it=>it.id===state.selected))state.selected=null;
 for(const it of state.items){
  if(it.kind==='image'&&it.src&&!imageCache.has(it.id))decodeImage(it.src).then(img=>{imageCache.set(it.id,img);render();}).catch(()=>{});
 }
 drag=null;activeGuides=null;
 $('product').value=state.product;$('backgroundColor').value=state.bg;
 $('bgColorSample').style.backgroundColor=state.bg;
 updateMeasurements();lastLayerSignature='';render();
 if($('view-mockup').classList.contains('active'))renderMockup();
 updateHistoryUI();
}
function undo(){if(historyCursor<=0)return;historyCursor--;lastHistoryKey=null;restoreHistory();toast('Alteração desfeita.');}
function redo(){if(historyCursor>=history.length-1)return;historyCursor++;lastHistoryKey=null;restoreHistory();toast('Alteração refeita.');}
$('undoBtn').addEventListener('click',undo);
$('redoBtn').addEventListener('click',redo);
document.addEventListener('keydown',event=>{
 const editing=event.target.closest('input, textarea, select, [contenteditable="true"]');
 if(editing||!(event.ctrlKey||event.metaKey)||event.altKey)return;
 const k=event.key.toLowerCase();
 if(k==='z'){event.preventDefault();if(event.shiftKey)redo();else undo();}
 else if(k==='y'){event.preventDefault();redo();}
});

let drag = null, activeGuides = null, toastHandle = null, seq = 0, previewQueued=false;
const fontSelector=$('fontFamily');
const exportChoice=$('exportOrientation');
const exportPreview=$('exportPreview');
const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const mmtoPx = (mm,dpi=300) => Math.round(mm/25.4*dpi);
const shirtArea = () => SHIRT_AREAS[state.shirtZone] || SHIRT_AREAS.frente;
const product = () => state.product==='camiseta' ? shirtArea() : PRODUCTS[state.product];
const artH = () => Math.round(1000 * product().h/product().w);
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>el.classList.remove('show'),3300);}
function updateMeasurements(){const p=product();$('dims').textContent=`${p.w} × ${p.h} mm`;$('exportSize').textContent=`${p.w} × ${p.h} mm`;$('exportPixels').textContent=`${mmtoPx(p.w)} × ${mmtoPx(p.h)} px`;}
function updateProductSpecificUI(){
 const shirtCard=$('shirtOptionsCard');
 const isShirt=state.product==='camiseta';
 if(shirtCard)shirtCard.hidden=!isShirt;
 if(isShirt){
  $('shirtZone').value=state.shirtZone;
  $('shirtColor').value=state.shirtColor;
  $('shirtTrimColor').value=state.shirtTrimColor;
  $('shirtCollarColor').value=state.shirtCollarColor;
  ['shirtColor','shirtTrimColor','shirtCollarColor'].forEach(refreshColorTrigger);
 }
}
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
 for(const it of state.items)if(!it.hidden)drawElement(target,it,selection&&it.id===state.selected);
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
function render(){paintSurface(ctx,true);drawSmartGuides();updateControls();renderLayers();updateProductSpecificUI();queueExportPreview();}
function selected(){return state.items.find(it=>it.id===state.selected);}
function layerName(it){return it.label || (it.kind==='text'?(it.text?.trim()||'Texto sem conteúdo').slice(0,46):'Imagem '+it.id);}
function renderLayers(){
 const layers=$('layersList');if(!layers)return;
 const signature=state.items.map(it=>[it.id,it.kind,layerName(it),!!it.hidden,!!it.locked].join(':')).join('|')+'|'+state.selected;
 const current=selected(),idx=state.items.findIndex(it=>it.id===state.selected);
 $('layerTotal').textContent=state.items.length===1?'1 camada':state.items.length+' camadas';
 $('layerMoveUp').disabled=!current||idx===state.items.length-1;
 $('layerMoveDown').disabled=!current||idx<=0;
 $('layerDuplicate').disabled=!current||state.items.length>=150;
 $('layerDelete').disabled=!current;
 $('layerRename').disabled=!current;
 if(signature===lastLayerSignature)return;
 lastLayerSignature=signature;layers.replaceChildren();
 if(!state.items.length){const empty=document.createElement('p');empty.className='layers-empty';empty.textContent='Sua arte ainda está vazia. Adicione texto ou imagem para criar uma camada.';layers.append(empty);return;}
 for(let i=state.items.length-1;i>=0;i--){
  const it=state.items[i],row=document.createElement('div');row.className='layer-row';
  if(it.id===state.selected)row.classList.add('is-selected');
  if(it.hidden)row.classList.add('is-hidden');
  if(it.locked)row.classList.add('is-locked');
  const select=document.createElement('button');select.type='button';select.className='layer-select';
  select.dataset.layerAction='select';select.dataset.layerId=it.id;
  select.setAttribute('aria-pressed',String(it.id===state.selected));
  const mini=document.createElement('span');mini.className='layer-thumb';
  if(it.kind==='image'){
   const pic=document.createElement('img');pic.src=it.src;pic.alt='';pic.loading='lazy';mini.append(pic);
  }else mini.textContent='T';
  const description=document.createElement('span');description.className='layer-description';
  const title=document.createElement('strong');title.textContent=layerName(it);
  const sub=document.createElement('small');sub.textContent=[it.kind==='image'?'Imagem':'Texto',it.locked?'Bloqueada':null,it.hidden?'Oculta':null].filter(Boolean).join(' · ');
  description.append(title,sub);select.append(mini,description);
  const eye=document.createElement('button');eye.className='layer-icon';eye.type='button';
  eye.dataset.layerAction='visibility';eye.dataset.layerId=it.id;
  eye.textContent=it.hidden?'◌':'◉';eye.title=it.hidden?'Mostrar camada':'Ocultar camada';eye.setAttribute('aria-label',eye.title);eye.setAttribute('aria-pressed',String(!it.hidden));
  const lock=document.createElement('button');lock.className='layer-icon';lock.type='button';
  lock.dataset.layerAction='lock';lock.dataset.layerId=it.id;lock.textContent=it.locked?'🔒':'🔓';
  lock.title=it.locked?'Desbloquear camada':'Bloquear camada';lock.setAttribute('aria-label',lock.title);lock.setAttribute('aria-pressed',String(it.locked));
  row.append(select,eye,lock);layers.append(row);
 }
}
function reorderLayer(delta){
 const i=state.items.findIndex(it=>it.id===state.selected),j=i+delta;
 if(i<0||j<0||j>=state.items.length)return;
 [state.items[i],state.items[j]]=[state.items[j],state.items[i]];
 render();recordHistory();
}
function deleteLayer(){
 if(!selected()){toast('Selecione uma camada primeiro.');return;}
 state.items=state.items.filter(it=>it.id!==state.selected);state.selected=null;
 render();recordHistory();toast('Camada excluída.');
}
function duplicateLayer(){
 const it=selected();if(!it)return;
 if(state.items.length>=150){toast('Limite de 150 camadas atingido.');return;}
 const index=state.items.findIndex(item=>item.id===it.id);
 const copy={...it,id:'e'+(++seq),x:it.x+24,y:it.y+24,locked:false,hidden:false};
 if(it.label)copy.label=it.label+' (cópia)';
 state.items.splice(index+1,0,copy);
 if(copy.kind==='image'){
  const img=imageCache.get(it.id);
  if(img)imageCache.set(copy.id,img);
  else decodeImage(copy.src).then(loaded=>{imageCache.set(copy.id,loaded);render();}).catch(()=>{});
 }
 state.selected=copy.id;render();recordHistory();toast('Camada duplicada.');
}
$('layersList').addEventListener('click',ev=>{
 const target=ev.target.closest('[data-layer-action]');if(!target)return;
 const id=target.dataset.layerId,it=state.items.find(item=>item.id===id);if(!it)return;
 const action=target.dataset.layerAction;
 if(action==='select'){state.selected=id;render();return;}
 if(action==='visibility')it.hidden=!it.hidden;
 if(action==='lock')it.locked=!it.locked;
 render();recordHistory();
});
$('layerMoveUp').addEventListener('click',()=>reorderLayer(1));
$('layerMoveDown').addEventListener('click',()=>reorderLayer(-1));
$('layerDuplicate').addEventListener('click',duplicateLayer);
$('layerDelete').addEventListener('click',deleteLayer);
$('layerRename').addEventListener('click',()=>{
 const it=selected();if(!it)return;
 const label=window.prompt('Nome desta camada:',layerName(it));
 if(label===null)return;
 if(!label.trim()){toast('Informe um nome para a camada.');return;}
 it.label=label.trim().slice(0,70);render();recordHistory();
});

function updateControls(){
 const it=selected();$('selectionControls').hidden=!it||it.kind!=='text';if(!it)return;
 $('selectionControls').classList.toggle('layer-locked',!!it.locked);
 $('selectionControls').querySelectorAll('input,select,button').forEach(el=>{el.disabled=!!it.locked;});
 $('textControls').hidden=it.kind!=='text';$('textEffects').hidden=it.kind!=='text';$('colorControl').hidden=it.kind!=='text';$('fontFamily').parentElement.hidden=it.kind!=='text';
 if(it.kind==='text'){$('textValue').value=it.text;$('textColor').value=it.color;$('fontFamily').value=it.font||'Arial';updateFontSample(it.font||'Arial');$('textColorSample').style.backgroundColor=it.color||'#123b62';$('fontSelectedName').textContent=state.customFonts[it.font]?.label||it.font||'Arial';$('fontSelectedName').style.fontFamily=`"${String(it.font||'Arial').replace(/["\\]/g,'')}",sans-serif`;}
 if(it.kind==='text'){
  $('twoToneToggle').checked=!!it.twoTone;$('textColor2').value=it.color2||'#00d3e7';
  $('outlineColor').value=it.outlineColor||'#ffffff';$('outlineSize').value=it.outlineSize||0;
  $('outlineSizeValue').textContent=it.outlineSize||0;
  $('textShadow').value=it.shadowBlur||0;$('textShadowValue').textContent=it.shadowBlur||0;
  $('shadowColor').value=it.shadowColor||'#293f4b';
 }
}
function createText(){const it={id:'e'+(++seq),kind:'text',text:'Seu texto aqui',color:'#123b62',font:'Arial',fontSize:64,x:500,y:artH()/2,scale:1,rotation:0};state.items.push(it);state.selected=it.id;render();recordHistory();$('textValue').focus();$('textValue').select();}
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
 updateSceneMenuUI();
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
async function addImage(file){if(!file)return;try{const src=await loadFileAsImage(file),img=await decodeImage(src);const w=Math.min(480,img.naturalWidth),h=w*img.naturalHeight/img.naturalWidth;const it={id:'e'+(++seq),kind:'image',src,baseW:w,baseH:h,x:500,y:artH()/2,scale:1,rotation:0};imageCache.set(it.id,img);state.items.push(it);state.selected=it.id;render();recordHistory();toast('Imagem adicionada! Arraste para mover.');}catch(e){toast(e.message);}}
function setProduct(key){if(!PRODUCTS[key])return;if(key==='camiseta')mockAngle=({frente:0,costas:180,peito:0,manga_d:65,manga_e:-65})[state.shirtZone]??0;const oldH=artH();const prevRatio=state.items.map(it=>it.y/oldH);state.product=key;state.items.forEach((it,i)=>it.y=prevRatio[i]*artH());updateMeasurements();updateProductSpecificUI();render();recordHistory();if(document.getElementById('view-mockup')?.classList.contains('active'))renderMockup();}
function setShirtZone(zone){if(!SHIRT_AREAS[zone])return;mockAngle=({frente:0,costas:180,peito:0,manga_d:65,manga_e:-65})[zone]??0;const oldH=artH();const prevRatio=state.items.map(it=>it.y/oldH);state.shirtZone=zone;state.items.forEach((it,i)=>it.y=prevRatio[i]*artH());updateMeasurements();updateProductSpecificUI();render();recordHistory();if(document.getElementById('view-mockup')?.classList.contains('active'))renderMockup();}
function pointerCoord(ev){const r=art.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*1000,y:(ev.clientY-r.top)/r.height*artH()};}
function itemAt(pt){for(let i=state.items.length-1;i>=0;i--){const it=state.items[i];if(it.hidden||it.locked)continue;const {w,h}=itemDimensions(it),r=-(it.rotation||0)*Math.PI/180,dx=pt.x-it.x,dy=pt.y-it.y,s=it.scale||1;const lx=(dx*Math.cos(r)-dy*Math.sin(r))/s,ly=(dx*Math.sin(r)+dy*Math.cos(r))/s;if(Math.abs(lx)<=w/2+13&&Math.abs(ly)<=h/2+13)return it;}return null;}
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
// Alpha 1.0.1: gestos restritos ao canvas de edição. O mockup tem controles próprios.
// Mantém o histórico em UM passo ao final de cada movimento, inclusive pinças longas.
const artPointers=new Map();
let artGesture=null, artGestureChanged=false;
const gestureDistance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const gestureAngle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const gestureMidpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
function getFirstTwoArtPointers(){return [...artPointers.values()].slice(0,2);}
function startPinchOnArt(){
 const it=selected();
 if(!it||it.hidden||it.locked||artPointers.size<2){artGesture=null;drag=null;activeGuides=null;return;}
 const [a,b]=getFirstTwoArtPointers();
 artGesture={mode:'pinch',id:it.id,scale:it.scale||1,rotation:it.rotation||0,
   x:it.x,y:it.y,mid:gestureMidpoint(a,b),distance:Math.max(1,gestureDistance(a,b)),
   lastAngle:gestureAngle(a,b),totalAngle:0};
 drag=null;activeGuides=null;
}
function finishArtGesture(){
 if(artGestureChanged)recordHistory();
 artGestureChanged=false;artGesture=null;drag=null;activeGuides=null;
 render();
}
art.addEventListener('pointerdown',ev=>{
 if(ev.pointerType==='mouse'&&ev.button!==0)return;
 if(artPointers.size>=2)return;
 ev.preventDefault();
 const pt=pointerCoord(ev);
 artPointers.set(ev.pointerId,pt);
 try{art.setPointerCapture(ev.pointerId);}catch(_){}
 if(artPointers.size===1){
   artGestureChanged=false;
   const hit=itemAt(pt);
   if(hit)state.selected=hit.id;
   const it=selected();
   artGesture={mode:hit&&!hit.locked?'drag':'pending',id:it?.id||null,
     pointerId:ev.pointerId,startPt:pt,startX:it?.x||0,startY:it?.y||0,
     blankTap:!hit,moved:false};
 }else if(artPointers.size===2){
   // O segundo dedo pode começar em qualquer ponto do canvas, não fora dele.
   if(!selected()){
     const hit=itemAt(pt);if(hit)state.selected=hit.id;
   }
   startPinchOnArt();
 }
 activeGuides=null;render();
});
art.addEventListener('pointermove',ev=>{
 if(!artPointers.has(ev.pointerId))return;
 if(ev.pointerType==='mouse'&&ev.buttons===0)return;
 ev.preventDefault();
 const pt=pointerCoord(ev);artPointers.set(ev.pointerId,pt);
 const g=artGesture,it=selected();
 if(!g||!it||it.hidden||it.locked||it.id!==g.id)return;
 if(artPointers.size>=2 && g.mode==='pinch'){
   const [a,b]=getFirstTwoArtPointers();
   const dist=Math.max(1,gestureDistance(a,b));
   const angle=gestureAngle(a,b);
   // Acumula diferenças angulares curtas: girar além de 180° não causa salto.
   g.totalAngle+=Math.atan2(Math.sin(angle-g.lastAngle),Math.cos(angle-g.lastAngle));
   g.lastAngle=angle;
   const nextScale=Math.max(.1,Math.min(8,g.scale*(dist/g.distance)));
   const factor=nextScale/g.scale,mid=gestureMidpoint(a,b);
   const dx=g.x-g.mid.x,dy=g.y-g.mid.y;
   const c=Math.cos(g.totalAngle),s=Math.sin(g.totalAngle);
   // Mantém o ponto entre os dedos como âncora, incluindo deslocamento simultâneo.
   it.scale=nextScale;
   it.rotation=g.rotation+g.totalAngle*180/Math.PI;
   it.x=mid.x+factor*(c*dx-s*dy);
   it.y=mid.y+factor*(s*dx+c*dy);
   artGestureChanged=true;
   activeGuides=null;drag=null;render();return;
 }
 if(artPointers.size===1 && g.mode==='drag' && g.pointerId===ev.pointerId){
   const dx=pt.x-g.startPt.x,dy=pt.y-g.startPt.y;
   if(Math.hypot(dx,dy)<.3&&!g.moved)return;
   it.x=g.startX+dx;it.y=g.startY+dy;
   g.moved=true;artGestureChanged=true;
   drag={id:it.id,pointerId:ev.pointerId};
   snapDraggedItem(it);render();
 }
});
function releaseArtPointer(ev){
 if(!artPointers.has(ev.pointerId))return;
 ev.preventDefault();
 artPointers.delete(ev.pointerId);
 if(artPointers.size===1){
   const [remainingId,pt]=[...artPointers.entries()][0],it=selected();
   // Soltando um dos dedos, o outro pode continuar arrastando sem salto.
   artGesture=it&&!it.locked&&!it.hidden
     ?{mode:'drag',id:it.id,pointerId:remainingId,startPt:pt,startX:it.x,startY:it.y,blankTap:false,moved:false}
     :null;
   activeGuides=null;drag=null;render();
 }else if(artPointers.size===0){
   const deselect=artGesture?.blankTap&&!artGestureChanged;
   if(deselect)state.selected=null;
   finishArtGesture();
 }
}
art.addEventListener('pointerup',releaseArtPointer);
art.addEventListener('pointercancel',releaseArtPointer);
art.addEventListener('lostpointercapture',releaseArtPointer);
$('smartGuidesToggle').addEventListener('change',()=>{activeGuides=null;render();});
function changeItem(fn,key='item'){const it=selected();if(!it||it.locked)return;fn(it);render();recordHistory(key+':'+it.id);}
$('addText').addEventListener('click',createText);$('addImage').addEventListener('click',()=>$('imagePicker').click());
$('imagePicker').addEventListener('change',async ev=>{await addImage(ev.target.files[0]);ev.target.value='';});
$('removeSelected').addEventListener('click',deleteLayer);
$('textValue').addEventListener('input',ev=>changeItem(it=>{it.text=ev.target.value;},'text'));
$('textColor').addEventListener('input',ev=>changeItem(it=>{it.color=ev.target.value;},'textColor'));
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
  refreshFontOptions();changeItem(it=>{it.font=family;},'font');
  toast('Fonte importada. Salve o projeto para preservá-la.');
 }catch(err){toast('Falha na fonte: '+err.message);}
});
$('fontFamily').addEventListener('change',ev=>{
 const family=ev.target.value;changeItem(it=>{it.font=family;},'font');
 updateFontSample(family);requestFontLoad(family);
});
$('twoToneToggle').addEventListener('change',ev=>changeItem(it=>{it.twoTone=ev.target.checked;},'twoTone'));
$('textColor2').addEventListener('input',ev=>changeItem(it=>{it.color2=ev.target.value;it.twoTone=true;}));
$('outlineColor').addEventListener('input',ev=>changeItem(it=>{it.outlineColor=ev.target.value;},'outlineColor'));
$('outlineSize').addEventListener('input',ev=>changeItem(it=>{it.outlineSize=+ev.target.value;},'outlineSize'));
$('textShadow').addEventListener('input',ev=>changeItem(it=>{it.shadowBlur=+ev.target.value;},'shadowBlur'));
$('shadowColor').addEventListener('input',ev=>changeItem(it=>{it.shadowColor=ev.target.value;},'shadowColor'));
$('backgroundColor').addEventListener('input',ev=>{state.bg=ev.target.value;$('bgColorSample').style.backgroundColor=state.bg;render();recordHistory('background');});
$('product').addEventListener('change',ev=>setProduct(ev.target.value));
$('shirtZone')?.addEventListener('change',ev=>setShirtZone(ev.target.value));
$('shirtColor')?.addEventListener('input',ev=>{state.shirtColor=ev.target.value;refreshColorTrigger('shirtColor');renderMockup();recordHistory('shirtColor');});
$('shirtTrimColor')?.addEventListener('input',ev=>{state.shirtTrimColor=ev.target.value;refreshColorTrigger('shirtTrimColor');renderMockup();recordHistory('shirtTrimColor');});
$('shirtCollarColor')?.addEventListener('input',ev=>{state.shirtCollarColor=ev.target.value;refreshColorTrigger('shirtCollarColor');renderMockup();recordHistory('shirtCollarColor');});
function switchView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('selected',t.dataset.view===name);t.setAttribute('aria-current',t.dataset.view===name?'page':'false');});if(name==='mockup'){ $('mockControls').hidden=!rotaryProducts.has(state.product);renderMockup();}if(name==='preco')calculate();if(name==='export')updateOrientationUI();window.scrollTo({top:0,behavior:'instant'});}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
$('backToEditor').addEventListener('click',()=>switchView('editor'));
document.querySelectorAll('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.goto)));
document.querySelectorAll('[data-product]').forEach(btn=>btn.addEventListener('click',()=>{$('product').value=btn.dataset.product;setProduct(btn.dataset.product);switchView('editor');}));
function artworkCanvas(w,h,mirror=false,transparentBg=false){
 const off=document.createElement('canvas');off.width=w;off.height=h;const g=off.getContext('2d');
 g.save();
 if(mirror){g.translate(w,0);g.scale(-1,1);}
 g.scale(w/1000,h/artH());
 if(!transparentBg){g.fillStyle=state.bg;g.fillRect(0,0,1000,artH());}
 for(const it of state.items)if(!it.hidden)drawElement(g,it,false);
 g.restore();
 return off;
}
// Simulação 2D de uma estampa em uma superfície cilíndrica, não geometria 3D real.
// Alpha 0.4: prévia 2D de canecas com curvatura por coluna e vista parcial ajustável.
let mockAngle=0;
let mockZoom=100;
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
// Cenário 3D: a fotografia personalizada cobre somente a parede ao fundo.
// A superfície da mesa é uma camada independente, nunca retirada por "Escolher imagem".
if(!window.paintTioScene){
 window.paintTioScene = function(canvas, mode, customImg, tableStyle='madeira'){
  const g=canvas.getContext('2d'), W=canvas.width,H=canvas.height;
  const lineY=H*.72;
  g.clearRect(0,0,W,H);
  const custom=mode==='imagem'&&customImg?.complete&&customImg.naturalWidth>0;
  if(custom){
   const iw=customImg.naturalWidth,ih=customImg.naturalHeight;
   // Crop tipo "cover" SOMENTE na área da parede, sem substituir a mesa.
   const factor=Math.max(W/iw,lineY/ih),w=iw*factor,h=ih*factor;
   g.drawImage(customImg,(W-w)/2,(lineY-h)/2,w,h);
   g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,0,W,lineY);
  }else if(mode==='limpo'){
   g.fillStyle='#edf4f8';g.fillRect(0,0,W,H);return;
  }else{
   const light=mode==='clara'||(mode==='imagem'&&tableStyle==='clara');
   const wall=g.createLinearGradient(0,0,0,lineY);
   wall.addColorStop(0,light?'#f5f7f9':'#eef5ef');wall.addColorStop(1,light?'#e2edf1':'#d9e7dc');
   g.fillStyle=wall;g.fillRect(0,0,W,lineY);
  }
  // "Escolher imagem" conserva a última mesa escolhida (madeira ou clara).
  const light=mode==='clara'||(mode==='imagem'&&tableStyle==='clara');
  const table=g.createLinearGradient(0,lineY,0,H);
  table.addColorStop(0,light?'#f6f2ed':'#a9744c');
  table.addColorStop(1,light?'#e9ded0':'#71462e');
  g.fillStyle=table;g.fillRect(0,lineY,W,H-lineY);
  g.fillStyle=light?'rgba(182,157,141,.19)':'rgba(64,38,24,.25)';
  g.fillRect(0,lineY,W,3);
  for(let k=0;k<10;k++){
   const y=lineY+10+k*21;
   g.fillStyle=light?'rgba(171,153,141,.09)':'rgba(54,28,16,.13)';
   g.fillRect(0,y,W,1.4);
  }
 };
}


function shadeColor(hex,amount){
 const value=String(hex||'#ffffff').replace('#','');
 if(!/^[0-9a-fA-F]{6}$/.test(value))return hex;
 const clamp=v=>Math.max(0,Math.min(255,v));
 const num=parseInt(value,16);
 const r=clamp((num>>16)+amount),g=clamp(((num>>8)&255)+amount),b=clamp((num&255)+amount);
 return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function drawShirtSilhouette(g,backView=false){
 // Camiseta raglan ilustrativa, com volume, costuras e mangas arredondadas.
 // O modelo Meshy permanece no pacote como referência para evolução 3D.
 const shirt=state.shirtColor||'#ffffff';
 const trim=state.shirtTrimColor||'#d9dee4';
 const collar=state.shirtCollarColor||trim;
 const fabric=g.createLinearGradient(418,0,686,0);
 fabric.addColorStop(0,shadeColor(shirt,-25));
 fabric.addColorStop(.18,shadeColor(shirt,-8));
 fabric.addColorStop(.48,shadeColor(shirt,8));
 fabric.addColorStop(.8,shirt);
 fabric.addColorStop(1,shadeColor(shirt,-29));
 const sleeve=g.createLinearGradient(300,190,818,350);
 sleeve.addColorStop(0,shadeColor(trim,-24));
 sleeve.addColorStop(.24,shadeColor(trim,7));
 sleeve.addColorStop(.65,trim);
 sleeve.addColorStop(1,shadeColor(trim,-24));
 g.save();
 g.shadowColor='rgba(15,35,48,.26)';g.shadowBlur=21;g.shadowOffsetY=14;
 // Parte central arredondada, levemente trapezoidal.
 g.beginPath();
 g.moveTo(453,174);g.quadraticCurveTo(551,146,649,174);
 g.bezierCurveTo(682,218,679,270,678,331);
 g.lineTo(681,560);g.quadraticCurveTo(554,580,420,560);
 g.lineTo(422,331);g.bezierCurveTo(422,269,420,216,453,174);
 g.closePath();g.fillStyle=fabric;g.fill();
 // Mangas raglan: recorte curvo sem pontas retas artificiais.
 g.beginPath();
 g.moveTo(453,174);g.quadraticCurveTo(420,184,377,203);
 g.quadraticCurveTo(321,231,292,289);
 g.quadraticCurveTo(286,308,299,315);
 g.quadraticCurveTo(333,335,366,343);
 g.quadraticCurveTo(396,302,432,248);
 g.quadraticCurveTo(453,211,470,193);g.closePath();
 g.fillStyle=sleeve;g.fill();
 g.beginPath();
 g.moveTo(649,174);g.quadraticCurveTo(682,184,725,203);
 g.quadraticCurveTo(781,231,810,289);
 g.quadraticCurveTo(816,308,803,315);
 g.quadraticCurveTo(769,335,736,343);
 g.quadraticCurveTo(706,302,670,248);
 g.quadraticCurveTo(649,211,632,193);g.closePath();
 g.fillStyle=sleeve;g.fill();
 g.restore();
 // Gola fechada e curva: sem arco suspenso acima do tecido.
 g.save();
 g.fillStyle=shadeColor(collar,-10);
 g.beginPath();g.moveTo(492,166);g.quadraticCurveTo(551,215,610,166);
 g.quadraticCurveTo(594,151,580,148);g.quadraticCurveTo(551,168,523,148);
 g.quadraticCurveTo(505,152,492,166);g.fill();
 g.lineWidth=5;g.strokeStyle=shadeColor(collar,12);
 g.beginPath();g.moveTo(492,166);g.quadraticCurveTo(551,215,610,166);g.stroke();
 // Costuras: pouca opacidade para a textura não parecer um desenho rígido.
 g.strokeStyle='rgba(20,36,49,.22)';g.lineWidth=2.5;g.lineCap='round';
 g.beginPath();g.moveTo(454,174);g.bezierCurveTo(471,191,495,222,513,252);g.stroke();
 g.beginPath();g.moveTo(648,174);g.bezierCurveTo(631,191,607,222,589,252);g.stroke();
 g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=3;
 g.beginPath();g.moveTo(304,311);g.quadraticCurveTo(334,328,361,337);g.stroke();
 g.beginPath();g.moveTo(798,311);g.quadraticCurveTo(768,328,741,337);g.stroke();
 // Dobras suaves no corpo e bainha.
 const fold=g.createLinearGradient(436,260,476,260);
 fold.addColorStop(0,'rgba(0,0,0,.09)');fold.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=fold;g.fillRect(428,263,52,293);
 const foldR=g.createLinearGradient(626,250,677,250);
 foldR.addColorStop(0,'rgba(0,0,0,0)');foldR.addColorStop(1,'rgba(0,0,0,.12)');
 g.fillStyle=foldR;g.fillRect(626,263,52,293);
 g.lineWidth=2.4;g.strokeStyle='rgba(20,36,49,.2)';
 g.beginPath();g.moveTo(429,548);g.quadraticCurveTo(552,566,675,548);g.stroke();
 g.strokeStyle='rgba(255,255,255,.21)';
 g.beginPath();g.moveTo(432,554);g.quadraticCurveTo(552,571,673,554);g.stroke();
 if(backView){
  g.strokeStyle='rgba(20,36,49,.09)';g.lineWidth=1.5;
  g.beginPath();g.moveTo(551,210);g.lineTo(551,550);g.stroke();
 }
 g.restore();
}
function drawShirtArtwork(g,source,zone){
 // Dimensão de impressão em mm continua controlada pelo editor, aqui apenas
 // representamos cada tamanho físico em proporção reduzida à peça.
 const areas={
  frente:{x:483,y:225,w:136,h:192,back:false},
  costas:{x:483,y:215,w:136,h:192,back:true},
  peito:{x:576,y:246,w:65,h:65,back:false},
  manga_d:{x:322,y:247,w:49,h:49,back:false},
  manga_e:{x:731,y:247,w:49,h:49,back:false}
 };
 const cfg=areas[zone]||areas.frente;
 drawShirtSilhouette(g,cfg.back);
 g.save();
 // Sem quadrado branco: arte do canvas com alpha preservado e sem contorno.
 g.drawImage(source,cfg.x,cfg.y,cfg.w,cfg.h);
 g.restore();
}

function renderMockup(){
 const label=$('mockRotateLabel');if(label)label.textContent=state.product==='camiseta'?'Arraste a camiseta com o dedo ou use o controle para girar':'Arraste o produto com o dedo ou use o controle para girar';
 const finishControls=$('mugFinishControl');
 if(finishControls)finishControls.hidden=state.product!=='caneca';
 const three=rotaryProducts.has(state.product)&&mock3d?.supported;
 mock3dCanvas.hidden=!three;mock.hidden=three;mockSceneCanvas.hidden=!three;
 $('mockTypeTag').textContent=three?'3D MESHY BETA':'2D';
 if(three){
   let drawn=false;
   try{
     drawn=mock3d.render(state.product,artworkCanvas(1000,artH(),false,state.product==='camiseta'),mockAngle,state.mugFinishColor,state.product==='camiseta'?{zone:state.shirtZone,bodyColor:state.shirtColor,trimColor:state.shirtTrimColor,collarColor:state.shirtCollarColor}:null)!==false;
   }catch(err){
     console.error('Falha no mockup 3D, usando prévia de segurança:',err);
   }
   if(drawn){window.paintTioScene?.(mockSceneCanvas,state.mockSceneChoice,customSceneImage,state.mockTableStyle);return;}
   // O modo 3D não deve esconder o produto se houver uma falha gráfica.
   mock3dCanvas.hidden=true;mockSceneCanvas.hidden=true;mock.hidden=false;
   $('mockTypeTag').textContent='PRÉVIA 2D';
 }

 const W=1100,H=660,g=mctx;
 g.clearRect(0,0,W,H);
 // A prévia 2D usa a mesma parede + mesa da prévia WebGL.
 // A escolha de foto não elimina a mesa em aparelhos sem WebGL.
 if(window.paintTioScene)window.paintTioScene(mock,state.mockSceneChoice,customSceneImage,state.mockTableStyle);
 else stageGradient(g);
 const source=artworkCanvas(1000,artH(),false,state.product==='camiseta');
 if(state.product==='camiseta'){
   drawShirtArtwork(g,source,state.shirtZone);
   return;
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
const SCENE_NAMES={madeira:'Mesa de madeira',clara:'Mesa clara',limpo:'Fundo neutro',imagem:'Escolher imagem'};
function updateSceneMenuUI(){
 const mode=state.mockSceneChoice||'madeira';
 sceneSelect.value=mode;
 sceneTriggerLabel.textContent=SCENE_NAMES[mode]||SCENE_NAMES.madeira;
 sceneMenu.querySelectorAll('[data-scene-mode]').forEach(b=>b.classList.toggle('active',b.dataset.sceneMode===mode));
}
function closeSceneMenu(){
 sceneMenu.hidden=true;
 sceneMenuTrigger.setAttribute('aria-expanded','false');
}
sceneMenuTrigger.addEventListener('click',()=>{
 sceneMenu.hidden=!sceneMenu.hidden;
 sceneMenuTrigger.setAttribute('aria-expanded',String(!sceneMenu.hidden));
});
sceneMenu.querySelectorAll('[data-scene-mode]').forEach(b=>b.addEventListener('click',()=>{
 const mode=b.dataset.sceneMode;
 state.mockSceneChoice=mode;
 if(mode==='madeira'||mode==='clara')state.mockTableStyle=mode;
 updateSceneMenuUI();closeSceneMenu();renderMockup();
}));
// O label "Escolher imagem" abre o seletor de arquivos NATIVO no próprio toque.
// Evitamos o <select> nativo e chamadas atrasadas, que falhavam no Android.
sceneImagePicker.addEventListener('change',async ev=>{
 const file=ev.target.files?.[0];
 try{
   if(file){await setCustomSceneFromFile(file);toast('Imagem de fundo carregada! A mesa foi preservada.');}
 }catch(error){toast('Falha ao carregar o fundo: '+error.message);}
 finally{ev.target.value='';closeSceneMenu();updateSceneMenuUI();renderMockup();}
});
document.addEventListener('click',event=>{
 if(!sceneControl.contains(event.target))closeSceneMenu();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!sceneMenu.hidden){closeSceneMenu();sceneMenuTrigger.focus();}
});
updateSceneMenuUI();
const finishPicker=$('mugFinishColor');
const mugFinishChoices=document.querySelectorAll('[data-finish]');
function setMugFinish(hex,refresh=true){
 if(!/^#[0-9a-f]{6}$/i.test(String(hex)))hex='#ffffff';
 state.mugFinishColor=hex.toLowerCase();
 finishPicker.value=state.mugFinishColor;
 $('mugFinishSample').style.backgroundColor=state.mugFinishColor;
 mugFinishChoices.forEach(button=>button.classList.toggle('active',button.dataset.finish.toLowerCase()===state.mugFinishColor));
 refreshColorTrigger('mugFinishColor');
 if(refresh)renderMockup();
}
finishPicker.addEventListener('input',event=>setMugFinish(event.target.value));
mugFinishChoices.forEach(button=>button.addEventListener('click',()=>setMugFinish(button.dataset.finish)));
setMugFinish(state.mugFinishColor,false);

$('exportMockup').addEventListener('click',async()=>{try{renderMockup();updateMockZoom(mockZoom);const output=composePortraitMockupCanvas();downloadBlob(await toBlob(output),safeFilename('mockup.png'));toast('Mockup exportado em retrato.');}catch(e){toast(e.message);}});
function calculate(){const c=['productCost','printingCost','extraCost'].reduce((a,id)=>a+Math.max(0,Number($(id).value)||0),0);const rate=Math.max(0,Number($('margin').value)||0);const lucro=c*rate/100;$('salePrice').textContent=money(c+lucro);$('priceExplanation').textContent=`Custo ${money(c)} · Lucro ${money(lucro)}`;return{c,lucro,price:c+lucro};}
['productCost','printingCost','extraCost','margin'].forEach(id=>$(id).addEventListener('input',calculate));
$('copyPrice').addEventListener('click',async()=>{const p=calculate();const msg=`Orçamento Tio Urso Studio\nProduto: ${product().name}\nPreço sugerido: ${money(p.price)}`;try{await navigator.clipboard.writeText(msg);toast('Orçamento copiado.');}catch(e){window.prompt('Copie seu orçamento:',msg);}});
$('saveProject').addEventListener('click',()=>{const backup={version:1,...state,selected:null};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});downloadBlob(blob,safeFilename('json'));toast('Projeto salvo em arquivo JSON.');});
$('openProject').addEventListener('click',()=>$('projectPicker').click());
$('projectPicker').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>30*1024*1024)throw new Error('Arquivo muito grande.');const data=JSON.parse(await file.text());if(data.version!==1||!PRODUCTS[data.product]||!Array.isArray(data.items)||data.items.length>150)throw new Error('Projeto incompatível.');const imgEntries=data.items.filter(it=>it.kind==='image');const pairs=await Promise.all(imgEntries.map(async it=>[it.id,await decodeImage(it.src)]));state={product:data.product,bg:/^#[0-9a-f]{6}$/i.test(data.bg)?data.bg:'#ffffff',items:data.items,selected:null,customFonts:{},mugFinishColor:/^#[0-9a-f]{6}$/i.test(data.mugFinishColor)?data.mugFinishColor:'#ffffff',mockSceneChoice:['madeira','clara','limpo','imagem'].includes(data.mockSceneChoice)?data.mockSceneChoice:'madeira',mockSceneImage:typeof data.mockSceneImage==='string'?data.mockSceneImage:null,mockTableStyle:data.mockTableStyle==='clara'?'clara':'madeira',shirtZone:SHIRT_AREAS[data.shirtZone]?data.shirtZone:'frente',shirtColor:/^#[0-9a-f]{6}$/i.test(data.shirtColor)?data.shirtColor:'#ffffff',shirtTrimColor:/^#[0-9a-f]{6}$/i.test(data.shirtTrimColor)?data.shirtTrimColor:'#d9dee4',shirtCollarColor:/^#[0-9a-f]{6}$/i.test(data.shirtCollarColor)?data.shirtCollarColor:(/^#[0-9a-f]{6}$/i.test(data.shirtTrimColor)?data.shirtTrimColor:'#d9dee4')};
 customSceneImage=state.mockSceneImage?await decodeImage(state.mockSceneImage).catch(()=>null):null;
 updateSceneMenuUI();
 setMugFinish(state.mugFinishColor,false);
 for(const [family,info] of Object.entries(data.customFonts||{})){
  if(!/^TUS_[a-z0-9]+$/i.test(family)||typeof info?.src!=='string'||info.src.length>4000000)continue;
  try{await loadCustomFont(family,info.src);state.customFonts[family]={label:String(info.label||'Fonte personalizada').slice(0,90),src:info.src};}catch(_){}
 }
 refreshFontOptions();imageCache.clear();lastLayerSignature='';for(const [id,img] of pairs)imageCache.set(id,img);seq=Date.now();$('product').value=state.product;$('backgroundColor').value=state.bg;$('bgColorSample').style.backgroundColor=state.bg;updateMeasurements();render();resetHistory();toast('Projeto carregado.');}catch(e){toast('Erro ao abrir projeto: '+e.message);}finally{ev.target.value='';}});
// ALPHA 1.0.6 — Galeria real, local, por categoria. Não há projetos fictícios.
const GALLERY_CATEGORIES={caneca:'Caneca de café',chopp:'Caneca de chopp',camiseta:'Camiseta',squeeze:'Squeeze',azulejo:'Azulejo'};
let currentGalleryFilter='all';
let galleryDbPromise=null;
function galleryCategoryForProduct(key){return String(key||'').startsWith('azulejo')?'azulejo':key;}
function openGalleryDb(){
 if(galleryDbPromise)return galleryDbPromise;
 galleryDbPromise=new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Armazenamento do navegador indisponível.'));return;}
  const request=indexedDB.open('TioUrsoStudioGallery',1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Não foi possível acessar a galeria.'));
 });
 return galleryDbPromise.catch(error=>{galleryDbPromise=null;throw error;});
}
async function galleryPut(entry){
 const db=await openGalleryDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('projects','readwrite');
  tx.objectStore('projects').put(entry);
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||new Error('Não foi possível salvar na galeria.'));
  tx.onabort=()=>reject(tx.error||new Error('Falha ao gravar na galeria.'));
 });
}
async function galleryDelete(id){
 const db=await openGalleryDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('projects','readwrite');tx.objectStore('projects').delete(id);
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||new Error('Falha ao excluir projeto.'));
 });
}
async function galleryGetAll(){
 const db=await openGalleryDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('projects','readonly');const req=tx.objectStore('projects').getAll();
  req.onsuccess=()=>resolve(req.result.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)));
  req.onerror=()=>reject(req.error||new Error('Falha ao carregar projetos.'));
 });
}
function galleryCategoryLabel(productKey){return GALLERY_CATEGORIES[galleryCategoryForProduct(productKey)]||'Arte';}
async function gallerySaveCurrent(){
 try{
  if(!state.items.length&&!window.confirm('Sua arte ainda está em branco. Deseja guardá-la na galeria mesmo assim?'))return;
  const category=galleryCategoryForProduct(state.product);
  const thumb=artworkCanvas(380,Math.max(1,Math.round(380*product().h/product().w)),false,false).toDataURL('image/webp',.78);
  const now=Date.now();
  const id=window.crypto?.randomUUID?.()||`gallery-${now}-${Math.floor(Math.random()*99999)}`;
  const project={version:1,...state,selected:null,items:state.items.map(it=>({...it})),customFonts:{...state.customFonts}};
  await galleryPut({id,product:state.product,category,savedAt:now,thumbnail:thumb,project});
  toast(`${galleryCategoryLabel(state.product)} guardada na galeria!`);
  await refreshGallery();
 }catch(e){toast('Não foi possível guardar: '+e.message);}
}
async function galleryRestore(entry){
 if(hasCurrentProject()&&!window.confirm('Abrir esta arte da galeria? O projeto que está no Editor será substituído. Salve-o primeiro se desejar mantê-lo.'))return;
 try{
  const data=entry.project;
  if(data.version!==1||!PRODUCTS[data.product]||!Array.isArray(data.items))throw new Error('Projeto incompatível.');
  const imgEntries=data.items.filter(it=>it.kind==='image');
  const pairs=await Promise.all(imgEntries.map(async it=>[it.id,await decodeImage(it.src)]));
  state={product:data.product,bg:/^#[0-9a-f]{6}$/i.test(data.bg)?data.bg:'#ffffff',items:data.items.map(it=>({...it})),selected:null,customFonts:{},mugFinishColor:/^#[0-9a-f]{6}$/i.test(data.mugFinishColor)?data.mugFinishColor:'#ffffff',mockSceneChoice:['madeira','clara','limpo','imagem'].includes(data.mockSceneChoice)?data.mockSceneChoice:'madeira',mockSceneImage:typeof data.mockSceneImage==='string'?data.mockSceneImage:null,mockTableStyle:data.mockTableStyle==='clara'?'clara':'madeira',shirtZone:SHIRT_AREAS[data.shirtZone]?data.shirtZone:'frente',shirtColor:/^#[0-9a-f]{6}$/i.test(data.shirtColor)?data.shirtColor:'#ffffff',shirtTrimColor:/^#[0-9a-f]{6}$/i.test(data.shirtTrimColor)?data.shirtTrimColor:'#d9dee4',shirtCollarColor:/^#[0-9a-f]{6}$/i.test(data.shirtCollarColor)?data.shirtCollarColor:(/^#[0-9a-f]{6}$/i.test(data.shirtTrimColor)?data.shirtTrimColor:'#d9dee4')};
  customSceneImage=state.mockSceneImage?await decodeImage(state.mockSceneImage).catch(()=>null):null;
  updateSceneMenuUI();setMugFinish(state.mugFinishColor,false);
  for(const [family,info] of Object.entries(data.customFonts||{})){
   if(!/^TUS_[a-z0-9]+$/i.test(family)||typeof info?.src!=='string'||info.src.length>4000000)continue;
   try{await loadCustomFont(family,info.src);state.customFonts[family]={label:String(info.label||'Fonte personalizada').slice(0,90),src:info.src};}catch(_){}
  }
  refreshFontOptions();imageCache.clear();lastLayerSignature='';
  for(const [id,img] of pairs)imageCache.set(id,img);
  seq=Date.now();$('product').value=state.product;$('backgroundColor').value=state.bg;$('bgColorSample').style.backgroundColor=state.bg;
  updateMeasurements();render();resetHistory();switchView('editor');toast('Arte aberta da galeria.');
 }catch(e){toast('Falha ao abrir arte: '+e.message);}
}
function addGalleryCard(entry){
 const card=document.createElement('article');card.className='gallery-saved-card';
 const preview=document.createElement('button');preview.className='gallery-card-preview';preview.type='button';preview.setAttribute('aria-label','Abrir '+galleryCategoryLabel(entry.product));
 const img=document.createElement('img');img.alt='Miniatura de '+galleryCategoryLabel(entry.product);img.loading='lazy';img.src=entry.thumbnail||'';preview.appendChild(img);
 preview.addEventListener('click',()=>galleryRestore(entry));
 const footer=document.createElement('div');footer.className='gallery-card-footer';
 const label=document.createElement('strong');label.textContent=galleryCategoryLabel(entry.product);
 const actions=document.createElement('div');actions.className='gallery-card-actions';
 const open=document.createElement('button');open.type='button';open.textContent='Abrir';open.setAttribute('aria-label','Abrir '+label.textContent);open.addEventListener('click',()=>galleryRestore(entry));
 const remove=document.createElement('button');remove.type='button';remove.textContent='Excluir';remove.className='delete';remove.setAttribute('aria-label','Excluir '+label.textContent);
 remove.addEventListener('click',async()=>{
  if(!window.confirm('Excluir esta arte da galeria? Esta ação não pode ser desfeita.'))return;
  try{await galleryDelete(entry.id);await refreshGallery();toast('Arte excluída da galeria.');}catch(e){toast('Falha ao excluir: '+e.message);}
 });
 actions.append(open,remove);footer.append(label,actions);card.append(preview,footer);
 return card;
}
async function refreshGallery(){
 const grid=$('gallerySavedGrid');const empty=$('galleryEmpty');
 if(!grid||!empty)return;
 grid.textContent='';empty.hidden=true;
 document.querySelectorAll('[data-gallery-filter]').forEach(el=>el.classList.toggle('active',el.dataset.galleryFilter===currentGalleryFilter));
 try{
  const items=await galleryGetAll();
  const filtered=items.filter(item=>currentGalleryFilter==='all'||item.category===currentGalleryFilter);
  filtered.forEach(entry=>grid.appendChild(addGalleryCard(entry)));
  empty.hidden=filtered.length!==0;
 }catch(e){empty.hidden=false;empty.querySelector('p').textContent='O armazenamento do navegador não está disponível. Continue usando o botão Salvar projeto para baixar um arquivo JSON.';}
}
function showGallery(category='all'){
 currentGalleryFilter=category;
 switchView('gallery');
 refreshGallery();
}
$('saveGalleryProject').addEventListener('click',gallerySaveCurrent);
$('galleryShowAll').addEventListener('click',()=>showGallery());
$('galleryBackHome').addEventListener('click',()=>switchView('home'));
$('galleryGoEditor').addEventListener('click',()=>switchView('editor'));
document.querySelectorAll('[data-gallery-category]').forEach(button=>button.addEventListener('click',()=>showGallery(button.dataset.galleryCategory)));
document.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{currentGalleryFilter=button.dataset.galleryFilter;refreshGallery();}));
// Fim da galeria ALPHA 1.0.6.

// A navegação pelo rodapé "Início" não altera o projeto.
// O comando "Novo projeto" mantém a confirmação de segurança e, em seguida, abre o seletor visual do produto.
const newProjectOverlay=$('newProjectOverlay');
const newProjectDialog=newProjectOverlay.querySelector('.new-project-dialog');
const newProjectCancel=$('newProjectCancel');
const newProjectConfirm=$('newProjectConfirm');
const projectChoiceOverlay=$('projectChoiceOverlay');
const projectChoiceDialog=$('projectChoiceOverlay').querySelector('.project-choice-dialog');
const projectChoiceGrid=$('projectChoiceGrid');
const projectChoiceTitle=$('projectChoiceTitle');
const projectChoiceDescription=$('projectChoiceDescription');
const projectChoiceOverline=$('projectChoiceOverline');
const projectChoiceBack=$('projectChoiceBack');
const projectChoiceCancel=$('projectChoiceCancel');
let newProjectSource=null;
let projectChoiceStep='root';
let projectChoiceReturnView='home';
const PROJECT_CHOICE_STEPS={
 root:{title:'O que vamos criar hoje?',description:'Escolha o produto para abrir um projeto novo no Tio Urso Studio.',items:[
  {key:'caneca',label:'Caneca',detail:'Escolha entre tradicional ou chopp',icon:'☕',tone:'is-purple',arrow:'→'},
  {key:'camiseta',label:'Camiseta',detail:'Abra a base para frente, costas e mangas',icon:'👕',tone:'is-blue',arrow:'↗'},
  {key:'squeeze',label:'Squeeze',detail:'Modelo 600 ml para sublimação',icon:'⚗',tone:'is-orange',arrow:'↗'},
  {key:'azulejo',label:'Azulejo',detail:'Escolha 20×20, 15×15 ou 10×10',icon:'▦',tone:'is-green',arrow:'→'}
 ]},
 caneca:{title:'Qual caneca você quer criar?',description:'Escolha o modelo de caneca para montar a arte.',overline:'CANECAS',parent:'root',items:[
  {product:'caneca',label:'Caneca tradicional',detail:'Medida 21 × 9,7 cm',icon:'☕',tone:'is-purple',arrow:'✓'},
  {product:'chopp',label:'Caneca de chopp',detail:'Medida 20,5 × 14,5 cm',icon:'🍺',tone:'is-teal',arrow:'✓'}
 ]},
 azulejo:{title:'Qual tamanho de azulejo?',description:'Selecione a medida do azulejo para começar o layout.',overline:'AZULEJOS',parent:'root',items:[
  {product:'azulejo20',label:'20 × 20 cm',detail:'Área quadrada maior',icon:'▦',tone:'is-green',arrow:'✓'},
  {product:'azulejo15',label:'15 × 15 cm',detail:'Formato intermediário',icon:'▦',tone:'is-amber',arrow:'✓'},
  {product:'azulejo10',label:'10 × 10 cm',detail:'Compacto e prático',icon:'▦',tone:'is-red',arrow:'✓'}
 ]}
};
function activeViewKey(){return document.querySelector('.view.active')?.id?.replace('view-','')||'home';}
function hasCurrentProject(){
 return state.items.length>0 || state.product!=='caneca' || state.bg.toLowerCase()!=='#ffffff'
  || state.shirtZone!=='frente' || state.shirtColor.toLowerCase()!=='#ffffff'
  || state.shirtTrimColor.toLowerCase()!=='#d9dee4' || state.shirtCollarColor.toLowerCase()!=='#d9dee4'
  || state.mugFinishColor.toLowerCase()!=='#ffffff' || state.mockSceneChoice!=='madeira'
  || Boolean(state.mockSceneImage) || Object.keys(state.customFonts||{}).length>0;
}
function setBlankProject(productKey='caneca'){
 state.product=PRODUCTS[productKey]?productKey:'caneca';
 state.items=[];state.selected=null;state.bg='#ffffff';
 state.shirtZone='frente';state.shirtColor='#ffffff';state.shirtTrimColor='#d9dee4';state.shirtCollarColor='#d9dee4';
 state.mugFinishColor='#ffffff';state.mockSceneChoice='madeira';state.mockSceneImage=null;
 state.mockTableStyle='madeira';state.customFonts={};customSceneImage=null;
 imageCache.clear();drag=null;activeGuides=null;lastLayerSignature='';
 $('product').value=state.product;$('backgroundColor').value='#ffffff';
 $('bgColorSample').style.backgroundColor='#ffffff';
 setMugFinish('#ffffff',false);updateSceneMenuUI();updateMeasurements();updateProductSpecificUI();
 updateMockAngle(state.product==='camiseta'?0:0);updateMockZoom(100);
 render();resetHistory();
 if($('view-mockup').classList.contains('active'))renderMockup();
}
function startNewProject(productKey){
 closeProjectChoiceDialog(false);
 closeNewProjectDialog(false);
 setBlankProject(productKey);
 switchView('editor');
 toast(`Novo projeto: ${PRODUCTS[productKey]?.name||'Projeto'}.`);
}
function closeNewProjectDialog(restoreFocus=true){
 newProjectOverlay.hidden=true;
 document.body.classList.remove('new-project-dialog-open');
 if(restoreFocus&&newProjectSource?.isConnected)newProjectSource.focus();
}
// Cancelar nunca altera elementos, cores, histórico ou seleção: apenas retorna ao Editor.
function cancelNewProjectDialog(){
 closeNewProjectDialog(false);
 switchView('editor');
 document.querySelector('.tab[data-view="editor"]')?.focus({preventScroll:true});
}
function renderProjectChoiceStep(step='root'){
 const config=PROJECT_CHOICE_STEPS[step]||PROJECT_CHOICE_STEPS.root;
 projectChoiceStep=step;
 projectChoiceTitle.textContent=config.title;
 projectChoiceDescription.textContent=config.description;
 projectChoiceOverline.textContent=config.overline||'NOVO PROJETO';
 projectChoiceBack.hidden=!config.parent;
 projectChoiceGrid.innerHTML='';
 config.items.forEach(item=>{
  const btn=document.createElement('button');
  btn.type='button';
  btn.className=`project-choice-card ${item.tone||'is-slate'}`;
  btn.innerHTML=`<span class="choice-icon" aria-hidden="true">${item.icon||'✦'}</span><strong>${item.label}</strong><small>${item.detail||''}</small><span class="choice-arrow" aria-hidden="true">${item.arrow||'↗'}</span>`;
  btn.addEventListener('click',()=>{
   if(item.key==='caneca')renderProjectChoiceStep('caneca');
   else if(item.key==='azulejo')renderProjectChoiceStep('azulejo');
   else if(item.product)startNewProject(item.product);
   else if(item.key)startNewProject(item.key);
  });
  projectChoiceGrid.appendChild(btn);
 });
}
function openProjectChoiceDialog(step='root'){
 projectChoiceReturnView=activeViewKey();
 renderProjectChoiceStep(step);
 projectChoiceOverlay.hidden=false;
 document.body.classList.add('project-choice-open');
 projectChoiceDialog.focus();
}
function closeProjectChoiceDialog(restoreFocus=true){
 projectChoiceOverlay.hidden=true;
 document.body.classList.remove('project-choice-open');
 renderProjectChoiceStep('root');
 if(restoreFocus&&newProjectSource?.isConnected)newProjectSource.focus();
}
function cancelProjectChoiceDialog(){
 closeProjectChoiceDialog(false);
 switchView(projectChoiceReturnView||'home');
}
function askForNewProject(event){
 newProjectSource=event?.currentTarget || document.activeElement;
 projectChoiceReturnView=activeViewKey();
 if(!hasCurrentProject()){openProjectChoiceDialog('root');return;}
 newProjectOverlay.hidden=false;
 document.body.classList.add('new-project-dialog-open');
 newProjectCancel.focus();
}
$('newProjectHome').addEventListener('click',askForNewProject);
$('resetProject').addEventListener('click',askForNewProject);
newProjectCancel.addEventListener('click',cancelNewProjectDialog);
newProjectConfirm.addEventListener('click',()=>{closeNewProjectDialog(false);openProjectChoiceDialog('root');});
newProjectOverlay.addEventListener('click',event=>{if(event.target===newProjectOverlay)cancelNewProjectDialog();});
newProjectOverlay.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();cancelNewProjectDialog();return;}
 if(event.key==='Tab'){
  const first=newProjectCancel,last=newProjectConfirm;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
projectChoiceBack.addEventListener('click',()=>{const parent=PROJECT_CHOICE_STEPS[projectChoiceStep]?.parent||'root';renderProjectChoiceStep(parent);});
projectChoiceCancel.addEventListener('click',cancelProjectChoiceDialog);
projectChoiceOverlay.addEventListener('click',event=>{if(event.target===projectChoiceOverlay)cancelProjectChoiceDialog();});
projectChoiceOverlay.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();cancelProjectChoiceDialog();return;}
 if(event.key==='Tab'){
  const focusables=[projectChoiceBack.hidden?null:projectChoiceBack,...projectChoiceGrid.querySelectorAll('button'),projectChoiceCancel].filter(Boolean);
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
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

// Alpha 0.9.8 — seletor de cores próprio, consistente no Android e no desktop.
// Usa os mesmos inputs ocultos e eventos do projeto 0.9.7: não altera modelos 3D.
const predefinedColors = [
 '#FFFFFF','#F3F4F6','#C7CDD4','#808080','#374151','#000000','#7F1D1D','#AA1111',
 '#FF0000','#F43F5E','#FF7E8A','#FF9E00','#FFCF00','#FFF500','#A7E300','#51B749',
 '#00C853','#00BFA5','#00FFFF','#00A6BF','#0088EF','#0041FF','#13267D','#5420A6',
 '#9600D4','#ED00DB','#FC70C6','#CF7D44','#7B4B2B','#E9BE9B','#FEDFBA','#C6A5FF',
 '#FCE7F3','#E4F4FF','#BAE6FD','#A7F3D0','#FFEDD5','#FDF2B8','#123B62','#0B2136',
 '#EC4899','#BE185D','#14B8A6','#0E7490','#65A30D','#B45309','#9333EA','#1D4ED8'
];
let colorTarget='textColor', chosenColor='#FF0000', originalColor='#FF0000';
let hue=0, saturation=100, brightness=100;
const validHex=s=>/^#[0-9A-F]{6}$/i.test(s);
let recentColors=[];
try{const saved=JSON.parse(localStorage.getItem('tuStudioRecentColors')||'[]');if(Array.isArray(saved))recentColors=saved.filter(validHex).slice(0,12).map(s=>s.toUpperCase());}catch(_){}
const targetNames={textColor:'Cor do texto',backgroundColor:'Fundo da estampa',shirtColor:'Cor da camiseta',shirtTrimColor:'Cor das mangas',shirtCollarColor:'Cor da gola',mugFinishColor:'Alça e interior da caneca',textColor2:'Segunda cor do texto',outlineColor:'Cor do contorno',shadowColor:'Cor da sombra'};
function rgbFromHex(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();}
function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;let h=0;if(d){switch(hi){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;}return [(h+360)%360,hi===0?0:d/hi*100,hi*100];}
function hsvToRgb(h,s,v){s/=100;v/=100;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let a;if(h<60)a=[c,x,0];else if(h<120)a=[x,c,0];else if(h<180)a=[0,c,x];else if(h<240)a=[0,x,c];else if(h<300)a=[x,0,c];else a=[c,0,x];return a.map(n=>(n+m)*255);}
function refreshColorTrigger(id){
 const input=$(id);if(!input)return;
 const color=/^#[0-9a-f]{6}$/i.test(input.value)?input.value.toUpperCase():'#FFFFFF';
 document.querySelectorAll('[data-color-sample="'+id+'"],[data-color-code="'+id+'"]').forEach(el=>{
   if(el.hasAttribute('data-color-sample'))el.style.backgroundColor=color;
   else el.textContent=color;
 });
}
function refreshColorTriggers(){document.querySelectorAll('[data-color-target]').forEach(el=>refreshColorTrigger(el.dataset.colorTarget));}
function makeSwatch(color,container){
 const btn=document.createElement('button');btn.type='button';btn.className='swatch';btn.dataset.swatchColor=color.toUpperCase();btn.style.backgroundColor=color;
 btn.title=color;btn.setAttribute('aria-label','Escolher cor '+color);
 btn.addEventListener('click',()=>setChosenColor(color));container.append(btn);
}
function swatchesRender(){
 const grid=$('colorSwatches'),recent=$('recentSwatches');grid.replaceChildren();recent.replaceChildren();
 predefinedColors.forEach(c=>makeSwatch(c,grid));
 (recentColors.length?recentColors:[chosenColor]).forEach(c=>makeSwatch(c,recent));
 markSelectedSwatch();
}
function markSelectedSwatch(){document.querySelectorAll('#colorOverlay .swatch').forEach(el=>el.classList.toggle('active',el.dataset.swatchColor===chosenColor));}
function syncChosenColor(fromHex=false){
 chosenColor=rgbToHex(...hsvToRgb(hue,saturation,brightness));
 if(!fromHex)$('hexColor').value=chosenColor;
 const [r,g,b]=rgbFromHex(chosenColor);
 $('colorR').value=r;$('colorG').value=g;$('colorB').value=b;
 $('colorSvPlane').style.setProperty('--chosen-hue',`hsl(${Math.round(hue)},100%,50%)`);
 $('colorSvCursor').style.left=saturation+'%';$('colorSvCursor').style.top=(100-brightness)+'%';
 $('colorHue').value=String(Math.round(hue));$('colorHueValue').textContent=Math.round(hue)+'°';
 $('selectedColorChip').style.backgroundColor=chosenColor;$('selectedColorLabel').textContent=chosenColor;
 $('colorSvPlane').setAttribute('aria-label',`Saturação ${Math.round(saturation)}%, brilho ${Math.round(brightness)}%. Arraste ou use setas para ajustar`);
 markSelectedSwatch();
}
function setChosenColor(hex){
 if(!validHex(hex))return;
 const [h,s,v]=rgbToHsv(...rgbFromHex(hex));
 // Manter matiz previamente escolhida quando a cor é branca/cinza/preta.
 if(s>.05)hue=h;saturation=s;brightness=v;
 syncChosenColor();
}
function showColor(target){
 if(!(target in targetNames))return;
 if(target==='textColor' && selected()?.kind!=='text')return;
 colorTarget=target;
 chosenColor=($(target)?.value||'#FFFFFF').toUpperCase();originalColor=chosenColor;
 $('colorTargetLabel').textContent=targetNames[target];
 $('originalColorChip').style.backgroundColor=originalColor;
 setChosenColor(chosenColor);
 swatchesRender();openSheet('colorOverlay');
}
document.querySelectorAll('[data-color-target]').forEach(btn=>btn.addEventListener('click',()=>showColor(btn.dataset.colorTarget)));
$('chooseTextColor').addEventListener('click',()=>showColor('textColor'));
$('chooseBgColor').addEventListener('click',()=>showColor('backgroundColor'));
$('cancelColor').addEventListener('click',closeSheet);
$('colorHue').addEventListener('input',ev=>{hue=Number(ev.target.value);syncChosenColor();});
const svPlane=$('colorSvPlane');
function pickSV(event){
 const rect=svPlane.getBoundingClientRect();if(!rect.width||!rect.height)return;
 saturation=Math.round(Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))*1000)/10;
 brightness=Math.round((1-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)))*1000)/10;
 syncChosenColor();
}
svPlane.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;svPlane.setPointerCapture(event.pointerId);pickSV(event);event.preventDefault();});
svPlane.addEventListener('pointermove',event=>{if(svPlane.hasPointerCapture(event.pointerId)){pickSV(event);event.preventDefault();}});
svPlane.addEventListener('keydown',event=>{
 const step=event.shiftKey?10:2;
 if(event.key==='ArrowLeft')saturation=Math.max(0,saturation-step);
 else if(event.key==='ArrowRight')saturation=Math.min(100,saturation+step);
 else if(event.key==='ArrowUp')brightness=Math.min(100,brightness+step);
 else if(event.key==='ArrowDown')brightness=Math.max(0,brightness-step);
 else return;
 event.preventDefault();syncChosenColor();
});
$('hexColor').addEventListener('input',event=>{
 const entered=event.target.value.trim();const hex=(entered.startsWith('#')?entered:'#'+entered);
 if(validHex(hex))setChosenColor(hex);
});
for(const id of ['colorR','colorG','colorB'])$(id).addEventListener('input',()=>{
 const fields=['colorR','colorG','colorB'].map(key=>$(key));
 if(fields.some(el=>el.value.trim()===''||!Number.isFinite(Number(el.value))||Number(el.value)<0||Number(el.value)>255))return;
 setChosenColor(rgbToHex(...fields.map(el=>Number(el.value))));
});
$('applyColor').addEventListener('click',()=>{
 const value=$('hexColor').value.trim();const hex=(value.startsWith('#')?value:'#'+value).toUpperCase();
 if(!validHex(hex)){toast('Informe um HEX válido, como #0055FF');$('hexColor').focus();return;}
 const input=$(colorTarget);if(!input)return;
 chosenColor=hex;input.value=hex;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 refreshColorTrigger(colorTarget);
 recentColors=[hex,...recentColors.filter(c=>c!==hex)].slice(0,12);
 try{localStorage.setItem('tuStudioRecentColors',JSON.stringify(recentColors));}catch(_){}
 closeSheet();toast('Cor aplicada: '+hex);
});
// Atualiza os botões dos efeitos após a alteração das propriedades do texto.
['textColor2','outlineColor','shadowColor'].forEach(id=>$(id).addEventListener('input',()=>refreshColorTrigger(id)));
refreshColorTriggers();

// Alpha 0.9.9 — giro contínuo (sem batente) e zoom por pinça na prévia.
// O ângulo é normalizado apenas para manter precisão no WebGL após muitas voltas.
// A interação segue livre: ao completar 360°, a próxima volta começa imediatamente.
const mockAngleInput=$('mockAngle');
const MIN_MOCK_ZOOM=70;
const MAX_MOCK_ZOOM=300;
function normalizeMockAngle(angle){
 const n=Number(angle);
 if(!Number.isFinite(n))return 0;
 let normalized=((n+180)%360+360)%360-180;
 if(normalized===-180 && n>0)normalized=180;
 return normalized;
}
function updateMockAngle(angle){
 mockAngle=normalizeMockAngle(angle);
 const display=Math.round(mockAngle);
 mockAngleInput.value=String(display);
 $('mockAngleLabel').textContent=display===0?'Frente • 0°':Math.abs(display)===180?'Trás • 180°':(display<0?'Esquerda':'Direita')+' • '+Math.abs(display)+'°';
 document.querySelectorAll('[data-mock-angle]').forEach(el=>{
   const target=Number(el.dataset.mockAngle);
   el.classList.toggle('active',Math.abs(normalizeMockAngle(mockAngle-target))<.6);
 });
 renderMockup();
}
function updateMockZoom(value){
 const input=$('mockZoom'),label=$('mockZoomLabel');
 const n=Number(value);
 mockZoom=Math.max(MIN_MOCK_ZOOM,Math.min(MAX_MOCK_ZOOM,Number.isFinite(n)?n:100));
 if(input)input.value=String(Math.round(mockZoom));
 if(label)label.textContent=Math.round(mockZoom)+'%';
 if(mockStage)mockStage.style.setProperty('--mock-scale',String(mockZoom/100));
}
function drawStageCover(g, layer, outW, outH){
 if(!layer || layer.hidden) return;
 const zoom=mockZoom/100;
 const baseScale=Math.max(outW/layer.width, outH/layer.height);
 const scale=baseScale*zoom;
 const drawW=layer.width*scale;
 const drawH=layer.height*scale;
 const dx=(outW-drawW)/2;
 const dy=(outH-drawH)/2;
 g.drawImage(layer, dx, dy, drawW, drawH);
}
function composePortraitMockupCanvas(){
 const out=document.createElement('canvas');
 out.width=1080;
 out.height=1512;
 const g=out.getContext('2d');
 drawStageCover(g, mockSceneCanvas, out.width, out.height);
 if(!mock3dCanvas.hidden) drawStageCover(g, mock3dCanvas, out.width, out.height);
 else drawStageCover(g, mock, out.width, out.height);
 return out;
}
mockAngleInput.addEventListener('input',e=>updateMockAngle(e.target.value));
const mockZoomInput=$('mockZoom');
mockZoomInput?.addEventListener('input',e=>updateMockZoom(e.target.value));
document.querySelectorAll('[data-zoom-step]').forEach(button=>button.addEventListener('click',()=>updateMockZoom(mockZoom+Number(button.dataset.zoomStep||0))));
$('mockZoomReset')?.addEventListener('click',()=>updateMockZoom(100));
mockStage?.addEventListener('wheel',ev=>{
 if(!ev.ctrlKey && Math.abs(ev.deltaY)<1)return;
 ev.preventDefault();
 updateMockZoom(mockZoom+(ev.deltaY<0?10:-10));
},{passive:false});

// Um dedo/mouse: rotação livre de 360° quantas vezes desejar.
// Dois dedos: escala proporcional à distância entre as pontas dos dedos.
// A captura no palco, em vez de apenas no canvas WebGL, também funciona
// com a prévia ilustrativa quando o dispositivo não suporta WebGL.
const mockPointers=new Map();
let pinchOriginDistance=0;
let pinchOriginZoom=100;
function pointerDistance(){
 const points=[...mockPointers.values()];
 if(points.length<2)return 0;
 return Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
}
function beginPinch(){
 pinchOriginDistance=Math.max(1,pointerDistance());
 pinchOriginZoom=mockZoom;
}
mockStage?.addEventListener('pointerdown',ev=>{
 if(ev.pointerType==='mouse' && ev.button!==0)return;
 if(mockPointers.size>=2)return;
 ev.preventDefault();
 mockPointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
 try{mockStage.setPointerCapture(ev.pointerId);}catch(_){}
 if(mockPointers.size===2)beginPinch();
 mockStage.classList.add('is-gesturing');
});
mockStage?.addEventListener('pointermove',ev=>{
 const previous=mockPointers.get(ev.pointerId);
 if(!previous)return;
 ev.preventDefault();
 mockPointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
 if(mockPointers.size>=2){
   const distance=pointerDistance();
   if(distance>0)updateMockZoom(pinchOriginZoom*(distance/pinchOriginDistance));
 }else if(rotaryProducts.has(state.product)){
   updateMockAngle(mockAngle+(ev.clientX-previous.x)*.7);
 }
});
function finishMockPointer(ev){
 if(!mockPointers.has(ev.pointerId))return;
 mockPointers.delete(ev.pointerId);
 // Se um dedo continuar apoiado, o próximo movimento já poderá girar.
 if(mockPointers.size===0)mockStage.classList.remove('is-gesturing');
 if(mockPointers.size===2)beginPinch();
}
for(const type of ['pointerup','pointercancel','lostpointercapture']){
 mockStage?.addEventListener(type,finishMockPointer);
}
document.querySelectorAll('[data-mock-angle]').forEach(button=>button.addEventListener('click',()=>updateMockAngle(button.dataset.mockAngle)));
updateMockZoom(100);
// Inicialização. Sem salvamento remoto nem coleta de dados.
updateMeasurements();updateProductSpecificUI();$('bgColorSample').style.backgroundColor=state.bg;updateSceneMenuUI();render();calculate();updateOrientationUI();
// O modo PWA completo será ativado quando os ícones, manifesto e SW estiverem publicados.
resetHistory();

})();

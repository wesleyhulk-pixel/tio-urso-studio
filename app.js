/* Tio Urso Studio Alpha 0.1 — protótipo offline, sem libs ou serviços externos. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const PRODUCTS = {
  caneca:{name:'Caneca tradicional',w:210,h:97},
  chopp:{name:'Caneca de chopp',w:205,h:145},
  squeeze:{name:'Squeeze 600 ml',w:240,h:150},
  chaveiro:{name:'Chaveiro',w:50,h:50}
};
const art = $('artCanvas'), ctx = art.getContext('2d');
const mock = $('mockCanvas'), mctx = mock.getContext('2d');
let state = {product:'caneca',bg:'#ffffff',items:[],selected:null};
const imageCache = new Map();
let drag = null, toastHandle = null, seq = 0;
const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const mmtoPx = (mm,dpi=300) => Math.round(mm/25.4*dpi);
const product = () => PRODUCTS[state.product];
const artH = () => Math.round(1000 * product().h/product().w);
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>el.classList.remove('show'),3300);}
function updateMeasurements(){const p=product();$('dims').textContent=`${p.w} × ${p.h} mm`;$('exportSize').textContent=`${p.w} × ${p.h} mm`;$('exportPixels').textContent=`${mmtoPx(p.w)} × ${mmtoPx(p.h)} px`;}
function itemDimensions(it){
 if(it.kind==='text'){const size=it.fontSize||65;ctx.save();ctx.font=`bold ${size}px "${it.font||'Arial'}"`;const w=ctx.measureText(it.text||' ').width;ctx.restore();return {w:Math.max(w,20),h:size*1.18};}
 const img=imageCache.get(it.id);return {w:it.baseW||330,h:it.baseH||(img?330*img.naturalHeight/img.naturalWidth:200)};
}
function drawElement(g,it,selection=false){
 const {w,h}=itemDimensions(it);g.save();g.translate(it.x,it.y);g.rotate((it.rotation||0)*Math.PI/180);g.scale(it.scale||1,it.scale||1);
 if(it.kind==='text'){g.fillStyle=it.color||'#123b62';g.font=`bold ${it.fontSize||65}px "${it.font||'Arial'}"`;g.textBaseline='middle';g.textAlign='center';g.fillText(it.text||' ',0,0);}
 else{const img=imageCache.get(it.id);if(img?.complete&&img.naturalWidth)g.drawImage(img,-w/2,-h/2,w,h);}
 if(selection){g.strokeStyle='#00a1b6';g.lineWidth=2/(it.scale||1);g.setLineDash([9,6]);g.strokeRect(-w/2-9,-h/2-9,w+18,h+18);g.setLineDash([]);g.fillStyle='#00a1b6';g.fillRect(w/2+1,h/2+1,14,14);}
 g.restore();
}
function paintSurface(target,selection=false){
 const H=artH();target.canvas.width=1000;target.canvas.height=H;
 target.fillStyle=state.bg;target.fillRect(0,0,1000,H);
 for(const it of state.items) drawElement(target,it,selection&&it.id===state.selected);
}
function render(){paintSurface(ctx,true);updateControls();}
function selected(){return state.items.find(it=>it.id===state.selected);}
function updateControls(){
 const it=selected();$('selectionControls').hidden=!it;if(!it)return;
 $('textControls').hidden=it.kind!=='text';$('colorControl').hidden=it.kind!=='text';$('fontFamily').parentElement.hidden=it.kind!=='text';
 if(it.kind==='text'){$('textValue').value=it.text;$('textColor').value=it.color;$('fontFamily').value=it.font||'Arial';}
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
async function addImage(file){if(!file)return;try{const src=await loadFileAsImage(file),img=await decodeImage(src);const w=Math.min(480,img.naturalWidth),h=w*img.naturalHeight/img.naturalWidth;const it={id:'e'+(++seq),kind:'image',src,baseW:w,baseH:h,x:500,y:artH()/2,scale:1,rotation:0};imageCache.set(it.id,img);state.items.push(it);state.selected=it.id;render();toast('Imagem adicionada! Arraste para mover.');}catch(e){toast(e.message);}}
function setProduct(key){if(!PRODUCTS[key])return;const oldH=artH();const prevRatio=state.items.map(it=>it.y/oldH);state.product=key;state.items.forEach((it,i)=>it.y=prevRatio[i]*artH());updateMeasurements();render();}
function pointerCoord(ev){const r=art.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*1000,y:(ev.clientY-r.top)/r.height*artH()};}
function itemAt(pt){for(let i=state.items.length-1;i>=0;i--){const it=state.items[i],{w,h}=itemDimensions(it),r=-(it.rotation||0)*Math.PI/180,dx=pt.x-it.x,dy=pt.y-it.y,s=it.scale||1;const lx=(dx*Math.cos(r)-dy*Math.sin(r))/s,ly=(dx*Math.sin(r)+dy*Math.cos(r))/s;if(Math.abs(lx)<=w/2+13&&Math.abs(ly)<=h/2+13)return it;}return null;}
art.addEventListener('pointerdown',ev=>{ev.preventDefault();const pt=pointerCoord(ev),it=itemAt(pt);state.selected=it?.id||null;if(it){drag={id:it.id,offX:pt.x-it.x,offY:pt.y-it.y};try{art.setPointerCapture(ev.pointerId);}catch(_){}}else drag=null;render();});
art.addEventListener('pointermove',ev=>{if(!drag)return;ev.preventDefault();const it=selected();if(!it||it.id!==drag.id)return;const pt=pointerCoord(ev);it.x=pt.x-drag.offX;it.y=pt.y-drag.offY;render();});
art.addEventListener('pointerup',()=>{drag=null;});art.addEventListener('pointercancel',()=>{drag=null;});
function changeItem(fn){const it=selected();if(!it)return;fn(it);render();}
$('addText').addEventListener('click',createText);$('addImage').addEventListener('click',()=>$('imagePicker').click());
$('imagePicker').addEventListener('change',async ev=>{await addImage(ev.target.files[0]);ev.target.value='';});
$('removeSelected').addEventListener('click',()=>{if(!selected()){toast('Toque em um elemento para selecioná-lo.');return;}imageCache.delete(state.selected);state.items=state.items.filter(it=>it.id!==state.selected);state.selected=null;render();});
$('textValue').addEventListener('input',ev=>changeItem(it=>{it.text=ev.target.value;}));
$('textColor').addEventListener('input',ev=>changeItem(it=>{it.color=ev.target.value;}));
$('fontFamily').addEventListener('change',ev=>changeItem(it=>{it.font=ev.target.value;}));
$('elementScale').addEventListener('input',ev=>changeItem(it=>{it.scale=+ev.target.value/100;}));
$('elementRotation').addEventListener('input',ev=>changeItem(it=>{it.rotation=+ev.target.value;}));
$('layerUp').addEventListener('click',()=>{const i=state.items.findIndex(it=>it.id===state.selected);if(i<0||i===state.items.length-1)return;[state.items[i],state.items[i+1]]=[state.items[i+1],state.items[i]];render();});
$('layerDown').addEventListener('click',()=>{const i=state.items.findIndex(it=>it.id===state.selected);if(i<=0)return;[state.items[i],state.items[i-1]]=[state.items[i-1],state.items[i]];render();});
$('backgroundColor').addEventListener('input',ev=>{state.bg=ev.target.value;render();});
$('product').addEventListener('change',ev=>setProduct(ev.target.value));
function switchView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('selected',t.dataset.view===name));if(name==='mockup')renderMockup();if(name==='preco')calculate();}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
$('backToEditor').addEventListener('click',()=>switchView('editor'));
function artworkCanvas(w,h,mirror=false){
 const off=document.createElement('canvas');off.width=w;off.height=h;const g=off.getContext('2d');
 g.save();if(mirror){g.translate(w,0);g.scale(-1,1);}g.scale(w/1000,h/artH());g.fillStyle=state.bg;g.fillRect(0,0,1000,artH());for(const it of state.items)drawElement(g,it,false);g.restore();return off;
}
// Simulação 2D de uma estampa em uma superfície cilíndrica, não geometria 3D real.
function renderMockup(){
 const W=1100,H=660;mctx.clearRect(0,0,W,H);const g=mctx;
 g.fillStyle='#edf3f6';g.fillRect(0,0,W,H);
 g.save();g.fillStyle='#d6e2e9';g.beginPath();g.ellipse(550,574,310,35,0,0,Math.PI*2);g.fill();g.restore();
 const source=artworkCanvas(1000,artH());
 if(state.product==='chaveiro'){
  g.strokeStyle='#a5b1bd';g.lineWidth=20;g.beginPath();g.arc(550,135,63,0,2*Math.PI);g.stroke();
  g.fillStyle='#b8c4ca';g.fillRect(537,185,26,50);
  g.save();roundPath(g,360,214,380,340,28);g.clip();g.drawImage(source,360,214,380,340);g.restore();g.strokeStyle='#d7e1e5';g.lineWidth=12;roundPath(g,360,214,380,340,28);g.stroke();return;
 }
 if(state.product==='squeeze'){
  g.fillStyle='#202c38';roundPath(g,425,92,250,80,18);g.fill();g.fillStyle='#82919b';roundPath(g,464,170,172,40,9);g.fill();
  const grd=g.createLinearGradient(420,0,695,0);grd.addColorStop(0,'#c5d6dd');grd.addColorStop(.22,'white');grd.addColorStop(.78,'#f6fcff');grd.addColorStop(1,'#9aafbd');g.fillStyle=grd;roundPath(g,412,201,276,343,26);g.fill();
  g.save();roundPath(g,425,222,250,292,16);g.clip();for(let i=0;i<250;i+=2){const t=i/250;const width=2;const srcX=Math.floor((.08+t*.84)*source.width);g.drawImage(source,srcX,0,Math.max(1,Math.ceil(source.width*.84/125)),source.height,425+i,222,width+1,292);}const shade=g.createLinearGradient(425,0,675,0);shade.addColorStop(0,'rgba(0,0,0,.27)');shade.addColorStop(.23,'rgba(0,0,0,0)');shade.addColorStop(.75,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=shade;g.fillRect(425,222,250,292);g.restore();return;
 }
 // Caneca tradicional e caneca de chopp.
 g.strokeStyle='#aebdc8';g.lineWidth=35;g.beginPath();g.ellipse(743,367,110,132,-.05,-Math.PI/2,Math.PI/2);g.stroke();
 g.strokeStyle='#fdfefe';g.lineWidth=23;g.beginPath();g.ellipse(739,365,96,116,-.05,-Math.PI/2,Math.PI/2);g.stroke();
 g.save();g.beginPath();g.moveTo(295,188);g.bezierCurveTo(430,169,663,167,782,186);g.lineTo(764,519);g.bezierCurveTo(615,564,440,561,310,517);g.closePath();g.clip();
 g.fillStyle='#ffffff';g.fillRect(290,160,500,400);
 // Curvatura aplicada por colunas: visual ilustrativo 2D.
 const destX=315,destY=200,destW=449,destH=327;
 for(let i=0;i<destW;i+=2){const t=i/destW,frac=.09+t*.82;g.drawImage(source,Math.floor(frac*source.width),0,Math.max(1,Math.ceil(source.width*.82/(destW/2))),source.height,destX+i,destY,3,destH);}
 const shade=g.createLinearGradient(295,0,782,0);shade.addColorStop(0,'rgba(24,50,78,.38)');shade.addColorStop(.2,'rgba(0,0,0,.07)');shade.addColorStop(.52,'rgba(255,255,255,.12)');shade.addColorStop(.83,'rgba(0,0,0,.09)');shade.addColorStop(1,'rgba(0,0,0,.4)');g.fillStyle=shade;g.fillRect(295,180,490,370);g.restore();
 g.strokeStyle='#dde5ea';g.lineWidth=12;g.beginPath();g.ellipse(539,191,245,27,0,0,2*Math.PI);g.stroke();
 g.strokeStyle='rgba(58,90,115,.18)';g.lineWidth=4;g.beginPath();g.moveTo(311,520);g.quadraticCurveTo(548,574,765,520);g.stroke();
}
function roundPath(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function safeFilename(ext){return 'tio-urso-'+state.product+'-'+new Date().toISOString().slice(0,10)+'.'+ext;}
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
async function pngExport(){try{const c=artworkCanvas(mmtoPx(product().w),mmtoPx(product().h),$('mirrorImage').checked);const blob=await png300(await toBlob(c));downloadBlob(blob,safeFilename('png'));toast('PNG gerado nas dimensões do produto.');}catch(e){toast('Falha ao exportar PNG: '+e.message);}}
// PDF simples: página do tamanho exato da estampa; sem biblioteca/CDN.
async function pdfExport(){try{
 const p=product(),c=artworkCanvas(mmtoPx(p.w),mmtoPx(p.h),$('mirrorImage').checked);
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
 downloadBlob(new Blob(sections,{type:'application/pdf'}),safeFilename('pdf'));toast('PDF criado com página do tamanho real da estampa.');
 }catch(e){toast('Falha ao exportar PDF: '+e.message);}}
$('downloadPng').addEventListener('click',pngExport);$('downloadPdf').addEventListener('click',pdfExport);
$('exportMockup').addEventListener('click',async()=>{try{renderMockup();downloadBlob(await toBlob(mock),safeFilename('mockup.png'));toast('Mockup exportado.');}catch(e){toast(e.message);}});
function calculate(){const c=['productCost','printingCost','extraCost'].reduce((a,id)=>a+Math.max(0,Number($(id).value)||0),0);const rate=Math.max(0,Number($('margin').value)||0);const lucro=c*rate/100;$('salePrice').textContent=money(c+lucro);$('priceExplanation').textContent=`Custo ${money(c)} · Lucro ${money(lucro)}`;return{c,lucro,price:c+lucro};}
['productCost','printingCost','extraCost','margin'].forEach(id=>$(id).addEventListener('input',calculate));
$('copyPrice').addEventListener('click',async()=>{const p=calculate();const msg=`Orçamento Tio Urso Studio\nProduto: ${product().name}\nPreço sugerido: ${money(p.price)}`;try{await navigator.clipboard.writeText(msg);toast('Orçamento copiado.');}catch(e){window.prompt('Copie seu orçamento:',msg);}});
$('saveProject').addEventListener('click',()=>{const backup={version:1,...state,selected:null};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});downloadBlob(blob,safeFilename('json'));toast('Projeto salvo em arquivo JSON.');});
$('openProject').addEventListener('click',()=>$('projectPicker').click());
$('projectPicker').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>30*1024*1024)throw new Error('Arquivo muito grande.');const data=JSON.parse(await file.text());if(data.version!==1||!PRODUCTS[data.product]||!Array.isArray(data.items)||data.items.length>150)throw new Error('Projeto incompatível.');const imgEntries=data.items.filter(it=>it.kind==='image');const pairs=await Promise.all(imgEntries.map(async it=>[it.id,await decodeImage(it.src)]));state={product:data.product,bg:/^#[0-9a-f]{6}$/i.test(data.bg)?data.bg:'#ffffff',items:data.items,selected:null};imageCache.clear();for(const [id,img] of pairs)imageCache.set(id,img);seq=Date.now();$('product').value=state.product;$('backgroundColor').value=state.bg;updateMeasurements();render();toast('Projeto carregado.');}catch(e){toast('Erro ao abrir projeto: '+e.message);}finally{ev.target.value='';}});
$('resetProject').addEventListener('click',()=>{if(!window.confirm('Começar nova arte? Salve o projeto atual antes de continuar.'))return;state.items=[];state.selected=null;state.bg='#ffffff';imageCache.clear();$('backgroundColor').value='#ffffff';render();toast('Nova arte em branco.');});
// Inicialização. Sem salvamento remoto nem coleta de dados.
updateMeasurements();render();calculate();
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
})();

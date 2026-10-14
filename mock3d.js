/* Tio Urso Studio Alpha 0.5.4 — mockup 3D estável em canvas 2D.
 * Corrige corte lateral da arte e alça pontiaguda/"asa". */
(() => {
'use strict';

function createTioMock3D(canvas){
  const ctx = canvas.getContext('2d');
  if(!ctx) return { supported:false };

  const TAU = Math.PI * 2;
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  const wrap01 = v => ((v % 1) + 1) % 1;
  const deg = d => d * Math.PI / 180;

  function roundedRect(g,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    g.beginPath();
    g.moveTo(x+rr,y);
    g.arcTo(x+w,y,x+w,y+h,rr);
    g.arcTo(x+w,y+h,x,y+h,rr);
    g.arcTo(x,y+h,x,y,rr);
    g.arcTo(x,y,x+w,y,rr);
    g.closePath();
  }

  function makeBodyPath(g,cx,topY,bottomY,topW,bottomW,topRy,bottomRy){
    const yTop = topY + topRy;
    const yBottom = bottomY - bottomRy;
    const leftTop = cx - topW/2, rightTop = cx + topW/2;
    const leftBottom = cx - bottomW/2, rightBottom = cx + bottomW/2;

    g.beginPath();
    g.moveTo(leftTop, yTop);
    g.bezierCurveTo(leftTop-4, yTop + (yBottom-yTop)*0.28, leftBottom-4, yBottom - (yBottom-yTop)*0.28, leftBottom, yBottom);
    g.ellipse(cx, yBottom, bottomW/2, bottomRy, 0, Math.PI, 0, true);
    g.bezierCurveTo(rightBottom+4, yBottom - (yBottom-yTop)*0.28, rightTop+4, yTop + (yBottom-yTop)*0.28, rightTop, yTop);
    g.ellipse(cx, yTop, topW/2, topRy, 0, 0, Math.PI, true);
    g.closePath();
  }

  function drawTableScene(g, W, H, groundY){
    // mesa suave / cenário
    const backGrad = g.createLinearGradient(0,0,0,H);
    backGrad.addColorStop(0,'rgba(255,255,255,0.03)');
    backGrad.addColorStop(1,'rgba(20,40,55,0.04)');
    g.fillStyle = backGrad;
    g.fillRect(0,0,W,H);

    g.save();
    g.fillStyle='rgba(255,255,255,0.28)';
    roundedRect(g, 120, groundY+18, W-240, 54, 24);
    g.fill();
    g.restore();

    const tableGrad = g.createLinearGradient(0,groundY,0,groundY+60);
    tableGrad.addColorStop(0,'rgba(180,196,207,0.10)');
    tableGrad.addColorStop(1,'rgba(95,120,136,0.20)');
    g.fillStyle = tableGrad;
    g.beginPath();
    g.ellipse(W/2, groundY+35, 300, 36, 0, 0, TAU);
    g.fill();

    g.fillStyle='rgba(40,66,86,0.10)';
    g.beginPath();
    g.ellipse(W/2, groundY+18, 210, 18, 0, 0, TAU);
    g.fill();
  }

  function drawHandle(g, opts, angleDeg, frontLayer){
    const {cx, cy, bodyH, topW, kind} = opts;
    const h = deg(angleDeg + 180);
    const xNorm = -Math.sin(h);      // esquerda negativa, direita positiva
    const z = Math.cos(h);           // <0 atrás, >0 frente
    const shouldFront = z >= 0;
    if(frontLayer !== shouldFront) return;

    const showStrength = frontLayer ? Math.max(0.25, z) : Math.max(0.25, -z);
    const sideFactor = Math.max(0.15, Math.abs(xNorm));
    const centerX = cx + xNorm * (topW * 0.47);
    const centerY = cy + (kind==='chopp' ? 4 : 0);
    const rx = (kind==='chopp' ? 58 : 50) * (0.35 + sideFactor * 0.65);
    const ry = (kind==='chopp' ? 96 : 88) * (0.86 + sideFactor * 0.12);
    const lineW = kind==='chopp' ? 20 : 18;

    g.save();
    g.lineCap='round';
    g.lineJoin='round';
    g.strokeStyle = frontLayer ? `rgba(248,251,255,${0.95*showStrength})` : `rgba(185,197,208,${0.75*showStrength})`;
    g.lineWidth = lineW;
    g.beginPath();
    g.ellipse(centerX, centerY, rx, ry, 0, 0, TAU);
    g.stroke();

    g.strokeStyle = frontLayer ? `rgba(122,145,165,${0.22*showStrength})` : `rgba(55,75,96,${0.18*showStrength})`;
    g.lineWidth = Math.max(2, lineW*0.28);
    g.beginPath();
    g.ellipse(centerX, centerY, rx, ry, 0, 0, TAU);
    g.stroke();
    g.restore();
  }

  function drawMug(g, art, angleDeg, kind){
    const W = canvas.width, H = canvas.height;
    const chopp = kind === 'chopp';
    const cx = W/2;
    const cy = H/2 + (chopp ? 20 : 10);
    const topW = chopp ? 270 : 250;
    const bottomW = chopp ? 252 : 238;
    const bodyH = chopp ? 290 : 250;
    const topRy = chopp ? 18 : 16;
    const bottomRy = chopp ? 16 : 14;
    const topY = cy - bodyH/2;
    const bottomY = cy + bodyH/2;
    const bodyX = cx - topW/2;
    const bodyY = topY + topRy;
    const bodyInnerH = bottomY - bottomRy - bodyY;

    drawTableScene(g, W, H, bottomY + 48);

    // alça atrás do corpo quando necessário
    drawHandle(g, {cx, cy, bodyH, topW, kind}, angleDeg, false);

    // sombra principal
    g.save();
    g.fillStyle='rgba(48,74,92,0.16)';
    g.beginPath();
    g.ellipse(cx, bottomY + 32, topW*0.52, 20, 0, 0, TAU);
    g.fill();
    g.restore();

    // corpo base
    g.save();
    const porcelain = g.createLinearGradient(bodyX,0,bodyX+topW,0);
    porcelain.addColorStop(0,'#d3dde4');
    porcelain.addColorStop(0.09,'#fbfdff');
    porcelain.addColorStop(0.24,'#ffffff');
    porcelain.addColorStop(0.76,'#ffffff');
    porcelain.addColorStop(0.91,'#eef4f7');
    porcelain.addColorStop(1,'#c5d3db');
    g.fillStyle = porcelain;
    makeBodyPath(g,cx,topY,bottomY,topW,bottomW,topRy,bottomRy);
    g.fill();
    g.restore();

    // arte embrulhada na superfície — cobertura integral, sem "comer metade"
    const wrap = document.createElement('canvas');
    wrap.width = Math.max(32, Math.round(topW));
    wrap.height = Math.max(32, Math.round(bodyInnerH));
    const wg = wrap.getContext('2d');
    const srcW = art.width - 1;
    for(let x=0; x<wrap.width; x++){
      const u = (x/(wrap.width-1))*2 - 1;
      const phi = Math.asin(clamp(u,-1,1));
      const t = wrap01(0.5 + (phi/TAU) + angleDeg/360);
      const sx = Math.max(0, Math.min(srcW, Math.round(t * srcW)));
      wg.drawImage(art, sx, 0, 1, art.height, x, 0, 1.2, wrap.height);
    }

    // aplica arte recortada no corpo
    g.save();
    makeBodyPath(g,cx,topY,bottomY,topW,bottomW,topRy,bottomRy);
    g.clip();
    g.drawImage(wrap, bodyX, bodyY, topW, bodyInnerH);

    const shade = g.createLinearGradient(bodyX,0,bodyX+topW,0);
    shade.addColorStop(0,'rgba(15,26,38,0.38)');
    shade.addColorStop(0.10,'rgba(15,26,38,0.12)');
    shade.addColorStop(0.25,'rgba(255,255,255,0.11)');
    shade.addColorStop(0.50,'rgba(255,255,255,0.02)');
    shade.addColorStop(0.80,'rgba(255,255,255,0.10)');
    shade.addColorStop(0.92,'rgba(18,28,40,0.12)');
    shade.addColorStop(1,'rgba(15,26,38,0.28)');
    g.fillStyle = shade;
    g.fillRect(bodyX-2, topY, topW+4, bodyH);

    // brilho vertical
    g.fillStyle = 'rgba(255,255,255,0.22)';
    roundedRect(g, cx-topW*0.18, topY+18, topW*0.06, bodyH-40, 20);
    g.fill();
    g.restore();

    // interior / boca
    g.save();
    g.fillStyle='rgba(40,48,56,0.92)';
    g.beginPath();
    g.ellipse(cx, topY + topRy + 1, topW/2 - 10, topRy - 5, 0, 0, TAU);
    g.fill();
    g.fillStyle='rgba(255,255,255,0.28)';
    g.beginPath();
    g.ellipse(cx, topY + topRy + 3, topW/2 - 16, topRy - 9, 0, Math.PI, 0, true);
    g.fill();
    g.restore();

    // borda externa
    g.save();
    g.strokeStyle='rgba(238,245,250,0.95)';
    g.lineWidth=6;
    g.beginPath();
    g.ellipse(cx, topY + topRy, topW/2, topRy, 0, 0, TAU);
    g.stroke();
    g.strokeStyle='rgba(160,176,190,0.55)';
    g.lineWidth=2;
    g.beginPath();
    g.ellipse(cx, topY + topRy, topW/2, topRy, 0, 0, TAU);
    g.stroke();

    g.strokeStyle='rgba(210,220,229,0.9)';
    g.lineWidth=4;
    g.beginPath();
    g.ellipse(cx, bottomY - bottomRy, bottomW/2, bottomRy, 0, 0, Math.PI);
    g.stroke();
    g.restore();

    // alça na frente quando necessário
    drawHandle(g, {cx, cy, bodyH, topW, kind}, angleDeg, true);
  }

  function drawSqueeze(g, art, angleDeg){
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2 + 10;
    const bodyW = 200, bodyH = 330, r=28;
    const x = cx - bodyW/2, y = cy - bodyH/2;

    drawTableScene(g, W, H, y + bodyH + 44);

    g.save();
    g.fillStyle='#223746'; roundedRect(g, cx-84, y-90, 168, 68, 20); g.fill();
    g.fillStyle='#5f7485'; roundedRect(g, cx-56, y-32, 112, 36, 10); g.fill();

    const metal = g.createLinearGradient(x,0,x+bodyW,0);
    metal.addColorStop(0,'#94adbb'); metal.addColorStop(0.16,'#fafdff'); metal.addColorStop(0.50,'#ffffff'); metal.addColorStop(0.84,'#eef5f8'); metal.addColorStop(1,'#8ea7b6');
    g.fillStyle=metal; roundedRect(g,x,y,bodyW,bodyH,r); g.fill();

    const wrap = document.createElement('canvas');
    wrap.width = bodyW; wrap.height = bodyH-24;
    const wg = wrap.getContext('2d'); const srcW = art.width-1;
    for(let xx=0; xx<wrap.width; xx++){
      const u=(xx/(wrap.width-1))*2-1; const phi=Math.asin(clamp(u,-1,1));
      const t=wrap01(0.5 + (phi/TAU) + angleDeg/360); const sx=Math.max(0,Math.min(srcW,Math.round(t*srcW)));
      wg.drawImage(art,sx,0,1,art.height,xx,0,1.2,wrap.height);
    }
    roundedRect(g,x+7,y+10,bodyW-14,bodyH-20,20); g.clip(); g.drawImage(wrap,x,y+12,bodyW,bodyH-24);
    const shade=g.createLinearGradient(x,0,x+bodyW,0);
    shade.addColorStop(0,'rgba(15,26,38,.32)'); shade.addColorStop(.18,'rgba(255,255,255,.12)'); shade.addColorStop(.82,'rgba(255,255,255,.08)'); shade.addColorStop(1,'rgba(15,26,38,.28)');
    g.fillStyle=shade; g.fillRect(x,y,bodyW,bodyH);
    g.restore();

    g.strokeStyle='rgba(239,246,250,.88)'; g.lineWidth=4; roundedRect(g,x,y,bodyW,bodyH,r); g.stroke();
  }

  function render(kind, art, angle){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(kind === 'squeeze') drawSqueeze(ctx, art, angle||0);
    else drawMug(ctx, art, angle||0, kind === 'chopp' ? 'chopp' : 'caneca');
  }

  return { supported:true, render };
}

window.createTioMock3D = createTioMock3D;
})();

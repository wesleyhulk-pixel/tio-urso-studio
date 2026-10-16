/* Tio Urso Studio Alpha 1.1.17 - animacao de abertura independente do editor/WebGL. */
(() => {
  'use strict';
  if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(err => console.warn('PWA:',err));
    }, {once:true});
  }

  const intro=document.getElementById('pwaIntro');
  const canvas=document.getElementById('pwaIntroCanvas');
  const skip=document.getElementById('pwaIntroSkip');
  if(!intro || !canvas || !skip) return;
  const c=canvas.getContext('2d',{alpha:false});
  if(!c) {intro.remove();return;}
  const W=540,H=960;
  const reveal=document.createElement('canvas');
  reveal.width=W;reveal.height=H;
  const r=reveal.getContext('2d');
  let stopped=false, elapsed=0, last=0, ready=document.readyState==='complete';
  const img=new Image();
  img.decoding='async';
  img.src='pwa/splash.webp?v=1117';
  window.addEventListener('load',()=>{ready=true;},{once:true});
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  function finish(){
    if(stopped)return;
    stopped=true;
    intro.setAttribute('aria-hidden','true');
    skip.disabled=true;
    setTimeout(()=>intro.remove(),420);
  }
  skip.addEventListener('click',finish,{once:true});
  // Respeitar a configuracao do sistema para reduzir animacoes.
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    const noMotion=()=>{if(ready) finish(); else setTimeout(noMotion,120);};
    setTimeout(noMotion,320);
    return;
  }
  function clawPoints(i,amount){
    const x0=-135,y0=-190,dx=800,dy=1300;
    const sideX=-.852,sideY=.525;
    const shift=(i-1.5)*49;
    const pts=[];
    const count=48;
    for(let j=0;j<=count;j++){
      const t=j/count*amount;
      const grit=Math.sin(t*57+i*2.17)*2.7+Math.sin(t*111+i*3.4)*1.5;
      pts.push([x0+dx*t+sideX*(shift+grit),y0+dy*t+sideY*(shift+grit)]);
    }
    return pts;
  }
  function stroke(g,pts,width){
    g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
    for(let j=1;j<pts.length;j++)g.lineTo(pts[j][0],pts[j][1]);
    g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();
  }
  function splash(g){
    if(img.complete && img.naturalWidth){g.drawImage(img,0,0,W,H);return;}
    g.fillStyle='#071d37';g.fillRect(0,0,W,H);
    g.textAlign='center';g.fillStyle='#d5faff';g.font='bold 52px system-ui';g.fillText('TIO URSO',270,470);
    g.font='bold 26px system-ui';g.fillText('OFICIAL',270,514);
    g.font='24px system-ui';g.fillStyle='#20e2f0';g.fillText('S T U D I O',270,568);
  }
  function paint(sec){
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,W,H);
    const bg=c.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#01030a');bg.addColorStop(.65,'#06192c');bg.addColorStop(1,'#01050d');
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    const strike=clamp((sec-.33)/.78);
    const open=ease((sec-1.02)/.78);
    const full=ease((sec-1.62)/.36);
    if(sec>.33){
      c.save();
      if(sec<1.35){
        const shake=(1-ease((sec-.33)/1.02))*6;
        c.translate(Math.sin(sec*75)*shake,Math.cos(sec*85)*shake);
      }
      const width=24+open*1080;
      r.clearRect(0,0,W,H);
      r.globalCompositeOperation='source-over';r.strokeStyle='#fff';
      for(let i=0;i<4;i++)stroke(r,clawPoints(i,strike),width+((i%2)*5));
      r.globalCompositeOperation='source-in';splash(r);
      r.globalCompositeOperation='source-over';
      c.drawImage(reveal,0,0);
      if(full>0){c.globalAlpha=full;splash(c);c.globalAlpha=1;}
      if(sec<1.95){
        c.save();c.globalAlpha=(1-open)*(1-full);
        c.strokeStyle='#b5faff';c.shadowColor='#1ce7ff';c.shadowBlur=16;
        for(let i=0;i<4;i++)stroke(c,clawPoints(i,strike),3);
        c.restore();
      }
      if(sec>.44 && sec<1.22){
        const x=-135+800*strike,y=-190+1300*strike;
        c.save();c.globalAlpha=Math.sin(Math.PI*strike)*.86;
        c.translate(x,y);c.rotate(Math.atan2(1300,800));
        c.shadowColor='#00e6ff';c.shadowBlur=24;
        const shine=c.createLinearGradient(-34,-12,34,12);
        shine.addColorStop(0,'#00eaff00');shine.addColorStop(.5,'#e5ffff');shine.addColorStop(1,'#00eaff00');
        c.fillStyle=shine;
        for(let i=0;i<4;i++){
          c.beginPath();c.moveTo(-23,i*24-37);
          c.quadraticCurveTo(8,i*24-44,37,i*24-25);
          c.lineTo(6,i*24-19);c.closePath();c.fill();
        }
        c.restore();
      }
      c.restore();
    }
    if(sec>.5 && sec<.72){
      c.fillStyle=`rgba(160,241,255,${Math.sin(Math.PI*clamp((sec-.5)/.22))*.12})`;
      c.fillRect(0,0,W,H);
    }
    if(sec>2.05){
      const opacity=ease((sec-2.05)/.27);
      const phase=(sec*1.25)%1;
      c.save();c.globalAlpha=opacity;
      c.fillStyle='#021526dd';
      c.beginPath();c.roundRect(113,901,314,54,14);c.fill();
      c.textAlign='center';c.font='600 13px system-ui';c.fillStyle='#ddf9ff';
      c.fillText(ready && sec>3.08?'PRONTO PARA CRIAR!':'PREPARANDO SEU ESTÚDIO...',270,925);
      c.fillStyle='#164259';c.beginPath();c.roundRect(141,940,258,5,3);c.fill();
      c.fillStyle='#21edf0';c.shadowColor='#07dbff';c.shadowBlur=10;
      const span=74;
      c.beginPath();c.roundRect(141+phase*(258-span),940,span,5,3);c.fill();
      c.restore();
    }
  }
  function frame(now){
    if(stopped || !intro.isConnected)return;
    if(!last)last=now;
    elapsed+=Math.min(.08,Math.max(0,(now-last)/1000));
    last=now;
    paint(elapsed);
    if(elapsed>=3.38 && (ready || elapsed>5.6)){finish();return;}
    requestAnimationFrame(frame);
  }
  img.addEventListener('load',()=>paint(elapsed));
  requestAnimationFrame(frame);
})();

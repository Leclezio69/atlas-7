/* ATLAS observatory: native canvas, perspective-projected geometry.
   The visual receives only observed review states. No hidden case truth. */
(()=>{
 const TAU=Math.PI*2;
 const camera={yaw:.38,pitch:-.22,spread:0};
 let instance=null;
 const COLORS={idle:[143,151,139],review:[222,168,104],clear:[126,192,155],H:[238,112,98],M:[222,168,104],L:[137,180,190]};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const faces=[];
 for(let j=0;j<20;j++)for(let i=0;i<44;i++){
  const a=i/44*TAU,b=(i+.78)/44*TAU,p=-1.47+j/20*2.94,q=-1.47+(j+.91)/20*2.94;
  const point=(u,v)=>[Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u)];
  faces.push({v:[point(a,p),point(b,p),point(b,q),point(a,q)],normal:point((a+b)/2,(p+q)/2),sector:Math.floor(i/4),rib:i%2===0});
 }
 function mount(canvas,options={}){
  if(instance)instance();
  let ctx;try{ctx=canvas?.getContext?.('2d')}catch(_){}if(!ctx){if(canvas?.style)canvas.style.background="url('../assets/model-core.webp') center / cover";return()=>{}};
  let alive=true,raf=0,frame=0,last=0,width=0,height=0,drag=false,px=0,py=0,offsetYaw=0;
  const root=canvas.parentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion=options.motion!==false&&!reduce;
  if(!motion)camera.spread=Number(!!options.exploded);
  const states=options.states||Array(11).fill('idle');
  const selected=options.selected??-1;
  const dots=Array.from({length:75},(_,i)=>({x:((i*73.31)%97)/97,y:((i*31.13)%89)/89,r:i%7===0?1:.5}));
  const resize=()=>{const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(window.devicePixelRatio||1,1.75);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(0)};
  const rot=(v,yaw,pitch)=>{const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);return[x,v[1]*Math.cos(pitch)-z*Math.sin(pitch),v[1]*Math.sin(pitch)+z*Math.cos(pitch)]};
  function draw(time){
   if(!alive||!width||!height)return;
   ctx.clearRect(0,0,width,height);
   const cx=width/2,cy=height*.49,scale=Math.min(width*.21,height*.285),yaw=camera.yaw+offsetYaw+(motion?time*.000045:0),pitch=camera.pitch;
   camera.spread+=(Number(!!options.exploded)-camera.spread)*.065;
   const bg=ctx.createRadialGradient(cx,cy,5,cx,cy,width*.63);bg.addColorStop(0,'#262523');bg.addColorStop(.5,'#101110');bg.addColorStop(1,'#080908');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
   ctx.fillStyle='#d6d3b8';for(const d of dots){ctx.globalAlpha=.08+(d.r===1?.15:0);ctx.beginPath();ctx.arc(d.x*width,d.y*height,d.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
   // Calibrated reference rings and instrument graduations.
   ctx.save();ctx.translate(cx,cy);ctx.scale(1,.79);for(let r of [1.39,1.5,1.87]){ctx.strokeStyle=r===1.87?'#8fa08418':'#cfb98e24';ctx.lineWidth=.65;ctx.beginPath();ctx.arc(0,0,scale*r,0,TAU);ctx.stroke()}
   for(let k=0;k<100;k++){const a=k/100*TAU,r=scale*1.5;ctx.strokeStyle=k%5===0?'#d1c3a465':'#d1c3a429';ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+(k%5===0?7:3)),Math.sin(a)*(r+(k%5===0?7:3)));ctx.stroke()}ctx.restore();
   // Fine optical sweep, disabled with reduced motion.
   if(motion){ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.00011);const sweep=ctx.createLinearGradient(0,0,scale*1.5,0);sweep.addColorStop(0,'#dfbc8600');sweep.addColorStop(1,'#dfbc8638');ctx.strokeStyle=sweep;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(scale*1.48,0);ctx.stroke();ctx.restore()}
   const project=v=>{const p=rot(v,yaw,pitch),z=4.4/(4.4-p[2]);return{x:cx+p[0]*scale*z,y:cy+p[1]*scale*z,z:p[2],s:z}};
   const orbit=(rad,tilt,phase,front)=>{const pts=[];for(let i=0;i<=128;i++){const a=i/128*TAU+phase;const v=rot([Math.cos(a)*rad,Math.sin(a)*rad,0],tilt,.68);pts.push(project(v))}ctx.lineWidth=front?1.2:.7;ctx.strokeStyle=front?'#c7a37980':'#b9c4a92b';for(let i=1;i<pts.length;i++){if((pts[i].z>0)!==front)continue;ctx.beginPath();ctx.moveTo(pts[i-1].x,pts[i-1].y);ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke()}};
   orbit(1.36,.55,0,false);orbit(1.45,-.9,.8,false);
   const halo=ctx.createRadialGradient(cx,cy,scale*.15,cx,cy,scale*1.35);halo.addColorStop(0,'#f3be7950');halo.addColorStop(.55,'#bb8b3823');halo.addColorStop(1,'#bb8b3800');ctx.fillStyle=halo;ctx.fillRect(cx-scale*1.4,cy-scale*1.4,scale*2.8,scale*2.8);
   const mesh=faces.map(face=>{const amount=1+camera.spread*(.14+(face.sector%3)*.10);return{...face,n:rot(face.normal,yaw,pitch),points:face.v.map(v=>project(v.map(x=>x*amount)))}}).filter(f=>f.n[2]>-.24).sort((a,b)=>a.n[2]-b.n[2]);
   for(const f of mesh){
    const state=states[f.sector]||'idle',lit=Math.max(0,-f.n[0]*.45-f.n[1]*.65+f.n[2]*.35),spec=Math.pow(Math.max(0,f.n[0]*-.33+f.n[1]*-.33+f.n[2]*.88),22);
    const color=COLORS[state]||COLORS.idle,active=selected===f.sector;
    const mix=state==='idle'?.08:.40;const base=[104,112,99].map((x,i)=>x*(1-mix)+color[i]*mix);
    const shade=.22+lit*.63+(f.rib?.10:0);const rgb=base.map((c,i)=>Math.round(clamp(c*shade+spec*(i===2?120:160)+(active?18:0),0,255)));
    ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fill();
    ctx.strokeStyle=active?'#dfbc8670':`rgba(222,201,154,${.035+spec*.2})`;ctx.lineWidth=.45;ctx.stroke();
   }
   const inner=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*.49);inner.addColorStop(0,'#ffe4a8cc');inner.addColorStop(.12,'#e7bc7080');inner.addColorStop(.5,'#d69a3f20');inner.addColorStop(1,'#d69a3f00');ctx.globalCompositeOperation='screen';ctx.fillStyle=inner;ctx.fillRect(cx-scale*.5,cy-scale*.5,scale,scale);ctx.globalCompositeOperation='source-over';
   orbit(1.36,.55,0,true);orbit(1.45,-.9,.8,true);
   // Connect fixed, keyboard-accessible HTML component labels to the core.
   for(let i=0;i<11;i++){
    const a=(i/11-.25)*TAU,x=width*(.5+Math.cos(a)*.39),y=height*(.49+Math.sin(a)*.38),edge=project([Math.cos(a)*1.03,Math.sin(a)*1.03,.1]);const state=states[i]||'idle',c=COLORS[state]||COLORS.idle,isSelected=selected===i;
    ctx.strokeStyle=`rgba(${c.join(',')},${isSelected?.65:.19})`;ctx.lineWidth=isSelected?1.2:.65;ctx.setLineDash(state==='idle'?[2,4]:[]);ctx.beginPath();ctx.moveTo(edge.x,edge.y);ctx.lineTo(cx+(x-cx)*.81,cy+(y-cy)*.81);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    const pulse=isSelected&&motion?Math.sin(time*.002)*2:0;ctx.fillStyle=`rgba(${c.join(',')},.14)`;ctx.beginPath();ctx.arc(edge.x,edge.y,6+pulse,0,TAU);ctx.fill();ctx.fillStyle=`rgb(${c.join(',')})`;ctx.beginPath();ctx.arc(edge.x,edge.y,isSelected?2.8:1.7,0,TAU);ctx.fill();
   }
   // Thin equatorial ring conveys test coverage without disclosing defects.
   const completed=states.filter(x=>x!=='idle').length;
   ctx.strokeStyle='#d4b78b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,scale*1.88,scale*1.88*.79,0,-Math.PI/2,-Math.PI/2+TAU*completed/11);ctx.stroke();
  }
  const tick=t=>{if(!alive)return;if(t-last>40&&!document.hidden){draw(t);last=t}if(motion||drag||Math.abs(camera.spread-Number(!!options.exploded))>.005)raf=requestAnimationFrame(tick)};
  const start=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)};
  const down=e=>{if(e.button!==0)return;drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing';start()};
  const move=e=>{if(!drag)return;camera.yaw+=(e.clientX-px)*.007;camera.pitch=clamp(camera.pitch+(e.clientY-py)*.005,-.65,.65);px=e.clientX;py=e.clientY;if(!motion)draw(0)};
  const up=()=>{drag=false;canvas.style.cursor='grab'};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  let observer;if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(canvas)}else window.addEventListener('resize',resize);
  resize();start();
  instance=()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('resize',resize);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)};
  return instance;
 }
 window.AtlasCore={mount,destroy(){if(instance){instance();instance=null}}};
})();

// Original procedural Canvas artwork. No external images, fonts or runtime dependencies.
const W = 1200, H = 640;
const ink = '#222a2d';
const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

function line(c, points, color, width = 1) {
  c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function rect(c,x,y,w,h,color) { c.fillStyle=color; c.fillRect(x,y,w,h); }
function ellipse(c,x,y,rx,ry,color) {
  c.beginPath(); c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2); c.fillStyle=color; c.fill();
}
function label(c,text,x,y,size,color='#b1b3a6',font='sans-serif') {
  c.font=`${size}px ${font}`; c.fillStyle=color; c.fillText(text,x,y);
}

function building(c,x,y,w,h,seed,far=false) {
  const cols=Math.max(2,Math.floor(w/39)), rows=Math.floor(h/42);
  rect(c,x,y,w,h,far?'#69777a':'#576367');
  rect(c,x+5,y+4,w-10,7,far?'#748184':'#667174');
  rect(c,x+w-10,y+10,10,h-10,far?'#627174':'#465357');
  for(let r=0;r<rows;r++) {
    const yy=y+24+r*42;
    line(c,[[x,yy+28],[x+w,yy+28]],far?'#647276':'#48565a');
    for(let col=0;col<cols;col++) {
      const xx=x+13+col*(w-23)/cols, lit=noise(seed+r*11+col*3)>.72;
      rect(c,xx-2,yy-2,20,27,far?'#697779':'#738080');
      rect(c,xx,yy,16,23,lit?(far?'#a5aa93':'#c2b17f'):(far?'#4b5d63':'#303f44'));
      line(c,[[xx+8,yy],[xx+8,yy+23]],lit?'#827f68':'#59666a');
      line(c,[[xx,yy+11],[xx+16,yy+11]],lit?'#928c70':'#59666a');
      if(!far && noise(seed+r*17+col)>.79) {
        rect(c,xx-4,yy+18,25,11,'#697373');
        line(c,[[xx-4,yy+18],[xx+21,yy+18]],'#a2a79a',2);
        for(let b=0;b<5;b++) line(c,[[xx-2+b*5,yy+19],[xx-2+b*5,yy+29]],'#3c4b50');
      }
    }
  }
  if(!far) {
    for(let i=0;i<10;i++) {
      const xx=x+noise(seed+i*9)*w, yy=y+30+noise(seed+i*7)*(h-60);
      line(c,[[xx,yy],[xx-4,yy+9],[xx+3,yy+15],[xx-1,yy+27]],'#465356');
    }
    rect(c,x+7,y+h-70,w-20,70,'#465357');
    for(let i=0;i<3;i++) rect(c,x+20+i*37,y+h-43,22,30,'#303e43');
  }
}

function scenery(c,t,levelIndex=0) {
  const sky=c.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#73878d'); sky.addColorStop(.58,'#a1aaa0'); sky.addColorStop(1,'#4d6265');
  rect(c,0,0,W,H,sky);
  ellipse(c,975,98,62,62,'#b8bba5');
  const cloud=c.createLinearGradient(0,20,0,230); cloud.addColorStop(0,'#71858aee'); cloud.addColorStop(1,'#80939100');
  rect(c,0,0,W,230,cloud);
  [[-65,135,195,365],[125,183,145,317],[254,115,176,385],[430,170,152,330],[584,97,199,403],[794,158,160,342],[972,105,220,395]].forEach((a,i)=>building(c,...a,70+i*13,true));
  const fog=c.createLinearGradient(0,200,0,520); fog.addColorStop(0,'#a6b4ad00'); fog.addColorStop(1,'#a6b4ad99'); rect(c,0,160,W,360,fog);
  building(c,-30,245,222,355,10);
  building(c,219,282,169,318,47);
  building(c,829,229,199,371,100);
  building(c,1057,267,169,333,73);
  // The courtyard is visible between foreground apartment slabs.
  rect(c,389,420,438,165,'#697471');
  for(let i=0;i<31;i++) {
    const x=396+i*14;
    line(c,[[x,437],[x,555]],'#3f5153',3);
    line(c,[[x-5,452],[x+7,452]],'#89918a',2);
  }
  line(c,[[390,445],[828,445]],'#3c4e50',5);
  label(c,'СВЕТЛОЕ БУДУЩЕЕ',459,474,16,'#b1b4a4');
  label(c,'ВХОД СО ДВОРА',508,495,11,'#b8b6a1');
  // Bent downpipe, roof antennas and hanging wires.
  line(c,[[174,247],[174,469],[181,481],[181,577]],'#34474b',6);
  for(const [x,y] of [[52,240],[913,224],[1120,261]]) {
    line(c,[[x,y],[x,y-51]],'#384e54',3);
    line(c,[[x-25,y-35],[x+28,y-35]],'#384e54',2);
    line(c,[[x-19,y-46],[x+20,y-46]],'#384e54',2);
  }
  c.strokeStyle='#2a3e45'; c.lineWidth=2; c.beginPath(); c.moveTo(0,184); c.bezierCurveTo(260,258,601,247,1200,140); c.stroke();
  c.lineWidth=1; c.beginPath(); c.moveTo(0,202); c.bezierCurveTo(430,308,700,259,1200,165); c.stroke();
  // A weary streetlight casts a warm cone through the drizzle.
  line(c,[[749,573],[749,328],[733,309],[696,309]],'#35484b',6);
  ellipse(c,696,313,21,5,'#d6c590');
  const glow=c.createRadialGradient(696,322,3,696,375,110); glow.addColorStop(0,'#e3cf8c30'); glow.addColorStop(1,'#e3cf8c00');
  rect(c,595,305,210,230,glow);
  rect(c,40,447,121,37,'#3b4b4d'); label(c,'ЛИФТ НЕ РАБОТАЕТ',49,469,10,'#c3bba2');
  // Ground is an atmospheric backplane; actual solid platforms are drawn separately.
  const ground=c.createLinearGradient(0,530,0,H); ground.addColorStop(0,'#485b5c'); ground.addColorStop(1,'#263d43'); rect(c,0,555,W,85,ground);
  for(let i=0;i<44;i++) {
    const x=noise(i*5)*W, y=569+noise(i*19)*65;
    ellipse(c,x,y,8+noise(i*7)*41,1+noise(i*11)*4,i%3?'#768a8840':'#b7b59625');
  }
  // Each route keeps the same readable geometry while the shift grows darker.
  if(levelIndex>0) {
    rect(c,0,0,W,H,levelIndex>1?'#071b3c75':'#26334943');
    for(const [x,y] of [[22,312],[61,354],[100,396],[852,296],[891,338],[930,380],[1070,334],[1109,376]]) {
      rect(c,x,y,15,22,levelIndex>1?'#d5b465':'#d0b97e');
      rect(c,x+7,y,1,22,'#726d52');
      const light=c.createRadialGradient(x+7,y+11,2,x+7,y+11,28);
      light.addColorStop(0,'#d5b46520'); light.addColorStop(1,'#d5b46500');
      rect(c,x-21,y-17,56,56,light);
    }
  }
  if(levelIndex>1) {
    // An unfinished tower and idle crane turn the final delivery into a night shift.
    rect(c,430,258,124,162,'#293b47');
    for(let row=0;row<5;row++) {
      rect(c,429,266+row*32,127,5,'#445459');
      for(let col=0;col<4;col++) rect(c,439+col*28,274+row*32,18,20,'#182e3d');
    }
    line(c,[[582,420],[582,115],[609,115],[609,420]],'#374a52',5);
    for(let y=127;y<410;y+=31) line(c,[[582,y],[609,y+30],[582,y+30]],'#566365',1);
    line(c,[[459,117],[742,117],[659,97],[580,97],[459,117]],'#45575d',4);
    line(c,[[588,81],[459,117],[742,117],[588,81]],'#59696b',1);
    line(c,[[723,119],[723,227],[716,233]],'#667579',1.5);
    ellipse(c,596,97,3,3,'#d38e67');
    rect(c,631,397,143,23,'#a68f5d');
    label(c,'СДАЧА ДОМА: СКОРО',640,413,10,'#273d47');
  }
  // Text-only neighbourhood adverts: cultural references, not official branding.
  c.save(); c.translate(235,391); c.rotate(-.035);
  rect(c,-3,-3,128,61,'#364b50'); rect(c,0,0,122,55,'#d1b859');
  label(c,'Продукты 24',10,20,16,'#2d3a3b');
  label(c,'Хлеб. Молоко. Жизнь.',10,37,11,'#3f4840');
  label(c,'БЕЗ ПЕРЕРЫВА',8,49,6.5,'#615c42');
  c.restore();
  c.save(); c.translate(1069,441); c.rotate(.028);
  rect(c,-2,-2,120,55,'#2b4147'); rect(c,0,0,116,51,'#5a7968');
  label(c,'Дикие ягоды',7,19,15,'#d0d6ba');
  label(c,'ПУНКТ ВЫДАЧИ',8,33,8,'#c4cdb8');
  label(c,'С 9 ДО 21',8,44,8,'#c4cdb8');
  c.restore();
  rect(c,844,434,168,26,'#33474b');
  label(c,'Аптека',854,451,13,'#d0c7a0');
  // Rain streaks are deterministic and animated, without frame-random flickering.
  c.strokeStyle='#c6d9d440'; c.lineWidth=1;
  c.beginPath(); for(let i=0;i<105;i++) {
    const x=((noise(i*8+2)*W-t*26*(.6+noise(i)))%W+W)%W;
    const y=(noise(i*13)*H+t*(190+noise(i)*120))%H;
    c.moveTo(x,y); c.lineTo(x-4,y+12);
  } c.stroke();
}

function platform(c,p,i) {
  const {x,y,w,h}=p;
  rect(c,x,y,w,h,'#35474a');
  rect(c,x,y,w,7,'#a5aba0'); rect(c,x,y+7,w,4,'#58665f');
  rect(c,x+4,y+12,w-8,Math.max(0,h-12),'#4a5857');
  for(let j=0;j<Math.floor(w/25);j++) {
    const xx=x+9+j*25;
    line(c,[[xx,y+15],[xx+8,y+18],[xx+4,y+26]],'#293d41');
    rect(c,xx,y+2,10+noise(i+j)*8,2,'#c0bdaa');
  }
  if(h>35) {
    for(let j=0;j<Math.floor(w/40);j++) rect(c,x+j*40+6,y+h-12,19,3,'#3c4c45');
  }
  // Moss and chipped exposed aggregate retain a clear, flat collision edge.
  for(let j=0;j<Math.floor(w/30);j++) {
    const xx=x+noise(i*11+j*9)*w;
    rect(c,xx,y+8,4+noise(j)*8,3,'#758565');
  }
}

function parcel(c,item,t,i) {
  if(item.collected) return;
  const x=item.x+(item.w||22)/2, y=item.y+(item.h||22)/2;
  const bob=Math.sin(t*2.5+i)*2;
  const glow=c.createRadialGradient(x,y+bob,2,x,y+bob,31); glow.addColorStop(0,'#e9cc6a55'); glow.addColorStop(1,'#e9cc6a00');
  rect(c,x-32,y-32+bob,64,64,glow);
  c.save(); c.translate(x,y+bob); c.rotate(-.06);
  rect(c,-11,-11,23,23,'#352f26'); rect(c,-10,-12,21,21,'#c8a165');
  rect(c,-9,-11,19,5,'#d9b578'); rect(c,-2,-11,5,20,'#e7cd96');
  rect(c,5,0,4,4,'#756a4f'); line(c,[[-9,10],[11,10]],'#786548',2);
  c.restore();
}

function hazard(c,p,t) {
  rect(c,p.x,p.y,p.w,p.h,'#152e35');
  const wash=c.createLinearGradient(0,p.y,0,p.y+p.h); wash.addColorStop(0,'#5e7777'); wash.addColorStop(1,'#122a32'); rect(c,p.x,p.y,p.w,p.h,wash);
  for(let i=0;i<5;i++) {
    const x=p.x+p.w*(i+.5)/5;
    ellipse(c,x,p.y+5+Math.sin(t*3+i)*2,Math.min(14,p.w/8),1,'#a7b9ab80');
  }
  if(p.w>60) {
    c.save(); c.translate(p.x+10,p.y-23); c.rotate(-.12);
    rect(c,-2,0,4,28,'#3e4643'); rect(c,-14,-12,32,17,'#cbb169');
    label(c,'!',-1,1,14,'#343d39'); c.restore();
  }
}

function finish(c,f,open) {
  if(!f) return;
  const x=f.x,y=f.y,w=f.w||45,h=f.h||80;
  rect(c,x-10,y-11,w+20,h+12,'#78807a'); rect(c,x-4,y-4,w+8,h+5,'#293c40');
  rect(c,x,y,w,h,'#3b5150'); rect(c,x+6,y+7,w-12,h-12,'#314644');
  line(c,[[x+w*.52,y+8],[x+w*.52,y+h]],'#60736a'); rect(c,x+w-10,y+h*.5,3,10,'#b4ae87');
  rect(c,x-8,y-24,w+16,11,open?'#c8db8c':'#aaae94');
  const glow=c.createRadialGradient(x+w/2,y-17,0,x+w/2,y+8,63); glow.addColorStop(0,open?'#d7ee8550':'#ddd7a52b'); glow.addColorStop(1,'#d7ee8500'); rect(c,x-45,y-48,w+90,110,glow);
  label(c,'ПОДЪЕЗД 3',x-5,y-33,10,'#d8d4b7');
  rect(c,x+w+7,y+10,11,22,'#283a3b'); for(let i=0;i<4;i++) rect(c,x+w+10,y+14+i*4,3,2,'#a7ae9a');
}

function courier(c,p,t) {
  if(!p) return;
  const w=p.w||56,h=p.h||62, sx=w/68, sy=h/73;
  c.save(); c.translate(p.x+w/2,p.y+h); c.scale((p.facing||1)*sx,sy);
  ellipse(c,0,1,37,4,'#172b3455');
  const rotation=t*(p.vx||0)*.07;
  for(const x of [-22,23]) {
    ellipse(c,x,-14,14,14,'#1a2b32'); ellipse(c,x,-14,11,11,'#778481'); ellipse(c,x,-14,9.5,9.5,'#30464c');
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7+rotation;
      line(c,[[x,-14],[x+Math.cos(a)*10,-14+Math.sin(a)*10]],'#82918a',.85);
    }
    ellipse(c,x,-14,2.1,2.1,'#c7c3a5');
  }
  if(p.braking) {
    line(c,[[-42,-1],[-31,-1]],'#aabdb666',2);
    line(c,[[-38,-4],[-29,-4]],'#aabdb64d',1);
    ellipse(c,-30,-27,2.5,2.5,'#e3a582');
  }
  const phase=Math.abs(p.vx||0)>3 ? t*11 : .6;
  const pedalX=Math.cos(phase)*7, pedalY=Math.sin(phase)*6;
  line(c,[[-4,-35],[2,-25],[pedalX,-14+pedalY]],'#303538',7);
  line(c,[[-22,-14],[-11,-35],[4,-14],[-22,-14],[13,-36],[23,-14],[4,-14]],'#acb56d',3);
  line(c,[[13,-36],[18,-42],[24,-42]],'#b3b6a0',3);
  line(c,[[-15,-36],[-6,-36]],'#172a30',4);
  line(c,[[4,-14],[pedalX,-14+pedalY]],'#c0c6ae',2);
  line(c,[[pedalX-4,-12+pedalY],[pedalX+5,-12+pedalY]],'#26383d',3);
  // Backpack is the primary saturated accent in the otherwise desaturated yard.
  c.save(); c.translate(-16,-49); c.rotate(-.16);
  rect(c,-13,-13,23,26,'#242e2e'); rect(c,-12,-15,23,25,'#e0c64c');
  rect(c,-10,-12,19,3,'#f0dd83'); rect(c,-10,2,19,4,'#b29a39');
  line(c,[[-4,-7],[-4,-1],[3,-1]],'#6e622c',2); c.restore();
  line(c,[[-8,-43],[0,-27],[-pedalX,-14-pedalY]],'#242f37',8);
  line(c,[[-pedalX-4,-13-pedalY],[-pedalX+7,-13-pedalY]],'#182a31',4);
  line(c,[[-9,-42],[-4,-57],[8,-54]],'#3c5358',14);
  line(c,[[5,-53],[13,-45],[23,-42]],'#506b6c',6);
  ellipse(c,23,-42,3,3,'#b5a18b');
  ellipse(c,5,-65,8,9,'#273c45'); ellipse(c,9,-64,5,6,'#b8a28b');
  c.beginPath(); c.moveTo(-4,-64); c.quadraticCurveTo(-3,-77,7,-75); c.quadraticCurveTo(17,-73,15,-66); c.lineTo(4,-68); c.fillStyle='#536d70'; c.fill();
  line(c,[[12,-64],[16,-63]],'#b8a28b',2); line(c,[[9,-58],[13,-57]],'#2a3437',1);
  c.restore();
}

function tipCoin(c,coin,t,index) {
  if(coin.collected) return;
  const x=coin.x+(coin.w||22)/2, y=coin.y+(coin.h||22)/2+Math.sin(t*3+index)*2;
  const glow=c.createRadialGradient(x,y,3,x,y,23);
  glow.addColorStop(0,'#e1bd6040'); glow.addColorStop(1,'#e1bd6000');
  rect(c,x-24,y-24,48,48,glow);
  ellipse(c,x,y,10,10,'#5c543b'); ellipse(c,x,y-1,8.5,8.5,'#e4c575');
  ellipse(c,x,y-1,6.5,6.5,'#b9974b');
  c.save(); c.textAlign='center'; c.font='bold 13px sans-serif';
  c.fillStyle='#fff0b0'; c.fillText('₽',x,y+4); c.restore();
}

function strayDog(c,dog,t,player) {
  const w=dog.w||45,h=dog.h||30,x=dog.x,y=dog.y;
  const facing=dog.facing || (Math.cos((dog.phase||0)+t*(dog.speed||1))>=0?1:-1);
  const close=player && Math.abs(player.x+player.w/2-x-w/2)<105 && Math.abs(player.y-y)<100;
  c.save(); c.translate(x+w/2,y+h); c.scale(facing*w/45,h/30);
  ellipse(c,0,0,24,3,'#132d3555');
  const gait=Math.sin(t*9+(dog.phase||0))*3;
  line(c,[[-12,-10],[-15-gait,-1]],'#493d36',4);
  line(c,[[7,-10],[10+gait,-1]],'#493d36',4);
  ellipse(c,-3,-14,17,9,'#92785b');
  line(c,[[-15,-16],[-22,-20],[-23,-25]],'#92785b',4);
  line(c,[[-7,-10],[-5+gait,-1]],'#b39b76',4);
  line(c,[[10,-12],[14-gait,-1]],'#b39b76',4);
  ellipse(c,13,-20,8,8,'#a28a65');
  c.beginPath(); c.moveTo(8,-23); c.lineTo(7,-30); c.lineTo(16,-25); c.fillStyle='#604d3d'; c.fill();
  ellipse(c,20,-19,7,4,'#b7a07c'); ellipse(c,25,-20,2,2,'#29343a');
  ellipse(c,15,-23,1.5,1.5,close?'#e9cf87':'#25383d');
  line(c,[[11,-13],[19,-15]],'#9a4b3d',3);
  if(close) {
    line(c,[[19,-14],[22,-12]],'#d38e79',2);
    label(c,'!',15,-36,15,'#e0a47b');
  }
  c.restore();
}

function routeHints(c,level) {
  const dog=(level.dogs||[])[0];
  if(dog) {
    const x=Math.max(4,Math.min(W-148,(dog.baseX??dog.x)-75)),y=Math.max(35,dog.y-45);
    rect(c,x,y,145,20,'#243b41d9');
    label(c,'СОБАКА. ПЕРЕПРЫГНИ.',x+7,y+14,9,'#cdbb95');
  }
  const coin=(level.coins||[]).find(coin=>!coin.collected);
  if(coin) {
    const x=Math.max(4,Math.min(W-118,coin.x-38)),y=Math.max(30,coin.y-28);
    rect(c,x,y,115,17,'#243b41c9');
    label(c,'₽ — ЧАЕВЫЕ',x+8,y+12,9,'#dfc67f');
  }
}

export function render(ctx,game,time=0) {
  const t=!game.reducedMotion && Number.isFinite(time)?time:0, level=game.level||{};
  ctx.save(); ctx.clearRect(0,0,W,H); ctx.lineCap='round'; ctx.lineJoin='round';
  const variant=(game.levelIndex||0)%6;
  scenery(ctx,t,variant%3);
  if(variant>=3) {
    // A second circuit has colder fog; silhouettes and collision edges stay unchanged.
    const fog=ctx.createLinearGradient(0,230,0,540);
    fog.addColorStop(0,'#a4b2ab00'); fog.addColorStop(.7,'#a4b2ab20'); fog.addColorStop(1,'#a4b2ab00');
    rect(ctx,0,230,W,310,fog);
  }
  (level.hazards||[]).forEach(p=>hazard(ctx,p,t));
  (level.platforms||[]).forEach((p,i)=>platform(ctx,p,i));
  finish(ctx,level.finish,(level.items||[]).every(i=>i.collected));
  (level.items||[]).forEach((item,i)=>parcel(ctx,item,t,i));
  (level.coins||[]).forEach((coin,i)=>tipCoin(ctx,coin,t,i));
  (level.dogs||[]).forEach(dog=>strayDog(ctx,dog,t,game.player));
  routeHints(ctx,level);
  courier(ctx,game.player,t);
  // Restrained edge shade grounds the scene without obscuring the playable route.
  const vignette=ctx.createRadialGradient(W/2,H/2,230,W/2,H/2,720); vignette.addColorStop(0,'#10263200'); vignette.addColorStop(1,'#10263266'); rect(ctx,0,0,W,H,vignette);
  ctx.restore();
}


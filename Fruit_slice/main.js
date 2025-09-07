// Server-optimized Fruit Slice (WebView-ready)
// Responsive canvas, touchstart unlocking audio, touch + mouse support, bomb logic, and improved input handling.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

function setCanvasSize(){
  W = Math.max(320, window.innerWidth);
  H = Math.max(480, window.innerHeight);
  canvas.width = W;
  canvas.height = H;
  const dpr = window.devicePixelRatio || 1;
  if(dpr !== 1){
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else {
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(1,0,0,1,0,0);
  }
}

window.addEventListener('resize', ()=>{ setCanvasSize(); });

const FRUITS = ['apple','orange','watermelon','banana','kiwi'];
const IMG = {};
let assetsToLoad = FRUITS.length + 1;
FRUITS.forEach(n=>{ const i=new Image(); i.src = `assets/${n}.png`; i.onload = ()=>{ assetsToLoad--; }; IMG[n]=i; });
const bombImg = new Image(); bombImg.src='assets/bomb.png'; bombImg.onload = ()=>{ assetsToLoad--; };

const sndSlice = document.getElementById('snd-slice');
const sndPop = document.getElementById('snd-pop');
const sndExplosion = document.getElementById('snd-explosion');

let audioUnlocked = false;
function unlockAudio(){
  if(audioUnlocked) return;
  try{
    sndSlice.play().catch(()=>{}); sndSlice.pause(); sndSlice.currentTime = 0;
    sndPop.play().catch(()=>{}); sndPop.pause(); sndPop.currentTime = 0;
    sndExplosion.play().catch(()=>{}); sndExplosion.pause(); sndExplosion.currentTime = 0;
  }catch(e){}
  audioUnlocked = true;
}

let objects = [], trails = [], particles = [];
let score = 0, playing=false, spawnTimer=0, difficulty=1;

function rand(a,b){ return a + Math.random()*(b-a); }
function spawn(){
  const isBomb = Math.random() < Math.min(0.14, 0.04 + difficulty*0.01);
  const size = Math.round(rand(70,140) * (Math.min(W,H)/800));
  const x = rand(size, W - size);
  const y = H + size;
  const vx = rand(-4,4);
  const vy = rand(-18,-10);
  if(isBomb){
    objects.push({type:'bomb', img: bombImg, size, x, y, vx, vy, rot: rand(-0.08,0.08), angle: rand(-1,1)});
  } else {
    const name = FRUITS[Math.floor(Math.random()*FRUITS.length)];
    objects.push({type:'fruit', name, img: IMG[name], size, x, y, vx, vy, rot: rand(-0.06,0.06), angle: rand(-1,1), hit:false});
  }
}

function update(dt){
  spawnTimer -= dt;
  if(spawnTimer <= 0){ spawn(); spawnTimer = Math.max(0.45, 1.6 - difficulty*0.08); }
  for(let i = objects.length - 1; i >= 0; i--){
    const o = objects[i];
    o.vy += 0.7; o.x += o.vx; o.y += o.vy; o.angle += o.rot;
    if(o.y > H + 220) objects.splice(i,1);
  }
  for(let i = trails.length - 1; i >= 0; i--){ trails[i].life -= dt*2; if(trails[i].life <= 0) trails.splice(i,1); }
  for(let i = particles.length - 1; i >= 0; i--){ particles[i].vy += 0.9; particles[i].x += particles[i].vx; particles[i].y += particles[i].vy; particles[i].life -= dt; if(particles[i].life <= 0) particles.splice(i,1); }
}

function render(){
  ctx.clearRect(0,0,W,H);
  for(const o of objects){
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.angle);
    const drawSize = o.size;
    ctx.drawImage(o.img, -drawSize/2, -drawSize/2, drawSize, drawSize);
    ctx.restore();
  }
  for(const p of particles){
    ctx.globalAlpha = Math.max(0, p.life/1.2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(const t of trails){
    ctx.beginPath();
    ctx.lineWidth = t.width;
    ctx.globalAlpha = Math.max(0, t.life);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.moveTo(t.points[0].x, t.points[0].y);
    for(let i=1;i<t.points.length;i++) ctx.lineTo(t.points[i].x, t.points[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

let last = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now - last)/1000); last = now;
  if(playing) update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

let pointerDown = false; let path = [];
function getLocalPos(clientX, clientY){ const rect = canvas.getBoundingClientRect(); return { x: clientX - rect.left, y: clientY - rect.top }; }

canvas.addEventListener('pointerdown', (e)=>{ e.preventDefault(); unlockAudio(); pointerDown=true; path=[getLocalPos(e.clientX,e.clientY)]; });
canvas.addEventListener('pointermove', (e)=>{ if(!pointerDown) return; const p=getLocalPos(e.clientX,e.clientY); path.push(p); trails.push({points: path.slice(-10), life:1.0, width: Math.max(6, Math.random()*14)}); checkHits(p); });
canvas.addEventListener('pointerup', (e)=>{ pointerDown=false; path=[]; });

canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); unlockAudio(); pointerDown=true; const t = e.changedTouches[0]; path=[getLocalPos(t.clientX,t.clientY)]; }, {passive:false});
canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); if(!pointerDown) return; const t = e.changedTouches[0]; const p=getLocalPos(t.clientX,t.clientY); path.push(p); trails.push({points: path.slice(-10), life:1.0, width: Math.max(6, Math.random()*14)}); checkHits(p); }, {passive:false});
canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); pointerDown=false; path=[]; }, {passive:false});

canvas.addEventListener('mousedown', (e)=>{ unlockAudio(); pointerDown=true; path=[getLocalPos(e.clientX,e.clientY)]; });
canvas.addEventListener('mousemove', (e)=>{ if(!pointerDown) return; const p=getLocalPos(e.clientX,e.clientY); path.push(p); trails.push({points: path.slice(-10), life:1.0, width: Math.max(6, Math.random()*14)}); checkHits(p); });
canvas.addEventListener('mouseup', ()=>{ pointerDown=false; path=[]; });

function checkHits(p){ for(let i = objects.length - 1; i >= 0; i--){ const o = objects[i]; const dx = o.x - p.x; const dy = o.y - p.y; if(Math.sqrt(dx*dx + dy*dy) < o.size*0.45){ if(o.type === 'bomb'){ sndExplosion.currentTime = 0; sndExplosion.play(); gameOver(); return; } else if(o.type === 'fruit' && !o.hit){ o.hit = true; score += Math.ceil(o.size / 12); document.getElementById('scorev').textContent = score; sndSlice.currentTime = 0; sndSlice.play(); sndPop.currentTime = 0; sndPop.play(); for(let k=0;k<10;k++){ particles.push({x:o.x + rand(-8,8), y:o.y + rand(-8,8), vx: rand(-6,6), vy: rand(-6,2), size: rand(3,10), life: rand(0.6,1.2), color: `rgba(${Math.floor(rand(160,255))},${Math.floor(rand(40,220))},${Math.floor(rand(40,220))},1)`}); } for(let k=0;k<6;k++){ objects.push({type:'slice', img:o.img, size: o.size*0.34*(0.6+Math.random()*0.8), x: o.x + rand(-6,6), y: o.y + rand(-6,6), vx: rand(-6,6), vy: rand(-6,2), rot: rand(-0.6,0.6), angle: rand(-2,2)}); } objects.splice(i,1); } } } }

function gameOver(){ playing = false; document.getElementById('finalscore').textContent = score; document.getElementById('gameover').style.display = 'flex'; }

function startGame(){ unlockAudio(); score = 0; document.getElementById('scorev').textContent = score; objects = []; particles = []; trails = []; playing = true; difficulty = 1; spawnTimer = 0.4; document.getElementById('splash').style.display = 'none'; document.getElementById('gameover').style.display = 'none'; for(let i=0;i<3;i++){ setTimeout(spawn, i*300); } }

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('startBtn').addEventListener('touchstart', (e)=>{ e.preventDefault(); startGame(); }, {passive:false});
document.getElementById('retry').addEventListener('click', startGame);
document.getElementById('retry').addEventListener('touchstart', (e)=>{ e.preventDefault(); startGame(); }, {passive:false});

setCanvasSize();
window.addEventListener('load', ()=>{ setTimeout(setCanvasSize, 200); });
setInterval(()=>{ if(playing) difficulty += 0.03; }, 2000);
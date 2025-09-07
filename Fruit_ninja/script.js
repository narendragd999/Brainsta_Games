/* Shandar Fruit Slice - simplified Fruit Ninja style game
   - Responsive canvas fits screen, zoom locked (viewport)
   - Touch swipe detection with trail
   - Fruits spawn with physics (throw arcs), detect slice by intersection with swipe segments
   - WebAudio: slice/pop sound and whoosh
   - Score, lives, difficulty, endless spawn until lives=0
*/

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayScore = document.getElementById('overlay-score');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnRestart = document.getElementById('btn-restart');
const difficultySelect = document.getElementById('difficulty');

let width = 800, height = 600, scale = 1;
function fitCanvas(){
  const rect = canvas.getBoundingClientRect();
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio(){ if(!audioCtx) audioCtx = new AudioContext(); }
function sliceSound(){
  try{
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(900 + Math.random()*200, t);
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.18);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.2);
    // whoosh noise
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.03, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.exp(-i/data.length*3);
    const src = audioCtx.createBufferSource(); src.buffer = buffer; const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(0.03, t); ng.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    src.connect(ng); ng.connect(audioCtx.destination); src.start(t);
  }catch(e){}
}
function wrongSound(){
  try{
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(220,t);
    g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.28);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.28);
  }catch(e){}
}

// game objects
const FRUITS = [
  {id:'apple', color:'#ff6b6b', emoji:'🍎'},
  {id:'banana', color:'#ffd86b', emoji:'🍌'},
  {id:'pear', color:'#7bffb8', emoji:'🍐'},
  {id:'orange', color:'#ff9a59', emoji:'🍊'},
  {id:'kiwi', color:'#a0ff8f', emoji:'🥝'}
];

let fruits = [];
let particles = [];
let swipes = []; // recent swipe points
let isPlaying = false;
let score = 0;
let lives = 3;
let lastSpawn = 0;
let spawnInterval = 900;
let gravity = 1000; // px/s^2
let lastTime = performance.now();
let difficulty = 'normal';

function resetGame(){
  fruits = []; particles = []; swipes = [];
  score = 0; lives = 3; updateHUD();
  overlay.classList.add('hidden');
}

function updateHUD(){
  scoreEl.textContent = 'Score: ' + score;
  livesEl.textContent = 'Lives: ' + lives;
}

// spawn fruit with velocity from bottom (throw up)
function spawnFruit(){
  const fdef = FRUITS[Math.floor(Math.random()*FRUITS.length)];
  const radius = 28 + Math.random()*18;
  const x = 80 + Math.random()*(width-160);
  const y = height + 40;
  const vx = (Math.random()-0.5) * 400;
  const vy = - (600 + Math.random()*420);
  const rot = (Math.random()-0.5)*4;
  const fruit = { id: fdef.id, emoji: fdef.emoji, color: fdef.color, x, y, vx, vy, r: radius, rot, sliced:false };
  fruits.push(fruit);
}

// simple particle for slice gore/juice
function spawnParticles(x,y,color){
  for(let i=0;i<14;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = 60 + Math.random()*220;
    particles.push({
      x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 600 + Math.random()*400, color
    });
  }
}

// swipe handling (pointer events)
let pointerDown = false;
canvas.addEventListener('pointerdown', (e)=>{
  pointerDown = true;
  swipes.push({x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top, t: performance.now()});
  try{ ensureAudio(); if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
});
canvas.addEventListener('pointermove', (e)=>{
  if(!pointerDown) return;
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;
  swipes.push({x,y,t:performance.now()});
  // trim swipes length
  if(swipes.length > 30) swipes.shift();
});
window.addEventListener('pointerup', ()=>{ pointerDown = false; setTimeout(()=> swipes = [], 80); });

// detect intersection between segment and circle
function segmentIntersectsCircle(x1,y1,x2,y2,cx,cy,r){
  // project center onto segment
  const vx = x2-x1, vy = y2-y1;
  const wx = cx - x1, wy = cy - y1;
  const c1 = vx*wx + vy*wy;
  const c2 = vx*vx + vy*vy;
  const t = Math.max(0, Math.min(1, c1 / c2));
  const px = x1 + vx*t, py = y1 + vy*t;
  const dx = px - cx, dy = py - cy;
  return (dx*dx + dy*dy) <= (r*r);
}

// main loop
function gameLoop(now){
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  if(isPlaying){
    // spawn logic - adjust based on difficulty and elapsed time
    if(now - lastSpawn > spawnInterval){
      spawnFruit();
      lastSpawn = now;
      // slight randomness to spawn interval
      if(difficulty === 'easy') spawnInterval = 800 + Math.random()*700;
      else if(difficulty === 'normal') spawnInterval = 600 + Math.random()*700;
      else spawnInterval = 420 + Math.random()*560;
    }
    // update fruits
    for(let i=fruits.length-1;i>=0;i--){
      const f = fruits[i];
      f.vy += gravity * (dt/1000);
      f.x += f.vx * (dt/1000);
      f.y += f.vy * (dt/1000);
      f.rot += 0.02 * (dt/16) * (f.vx>0?1:-1);
      // go off bottom => missed
      if(f.y - f.r > height + 80){
        fruits.splice(i,1);
        if(!f.sliced){
          lives -= 1;
          wrongSound();
          updateHUD();
          if(lives <= 0) endGame();
        }
      }
    }
    // update particles
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.vy += 800 * (dt/1000);
      p.x += p.vx * (dt/1000);
      p.y += p.vy * (dt/1000);
      p.life -= dt;
      if(p.life <= 0) particles.splice(i,1);
    }
    // check slices - for each recent swipe segment, test fruits
    if(swipes.length >= 2){
      for(let s=0; s<swipes.length-1; s++){
        const a = swipes[s], b = swipes[s+1];
        for(let i=fruits.length-1;i>=0;i--){
          const f = fruits[i];
          if(f.sliced) continue;
          const hit = segmentIntersectsCircle(a.x,a.y,b.x,b.y,f.x,f.y,f.r);
          if(hit){
            // slice fruit
            f.sliced = true;
            // remove fruit and spawn particles
            spawnParticles(f.x, f.y, f.color);
            fruits.splice(i,1);
            score += 1;
            sliceSound();
            updateHUD();
            // small combo effect: create some fragments (visual-only)
          }
        }
      }
    }
  }
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// rendering
function render(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background gradient
  const g = ctx.createLinearGradient(0,0,width, height);
  g.addColorStop(0, '#042235'); g.addColorStop(1, '#021623');
  ctx.fillStyle = g; ctx.fillRect(0,0,width, height);
  // draw fruits
  for(const f of fruits){
    drawFruit(f);
  }
  // draw particles
  for(const p of particles){
    ctx.fillStyle = p.color || 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.globalAlpha = Math.max(0, p.life / 800);
    ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // draw swipe trail
  if(swipes.length){
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    for(let i=0;i<swipes.length;i++){
      const p = swipes[i];
      if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // bright head
    const last = swipes[swipes.length-1];
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(last.x, last.y, 6, 0, Math.PI*2); ctx.fill();
  }
  // HUD overlay could be drawn here for effects
}

// draw fruit as circle with emoji centered
function drawFruit(f){
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rot);
  // body
  ctx.beginPath();
  ctx.fillStyle = f.color;
  ctx.arc(0,0,f.r,0,Math.PI*2);
  ctx.fill();
  // rim/shine
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.ellipse(-f.r*0.3, -f.r*0.4, f.r*0.5, f.r*0.28, 0, 0, Math.PI*2); ctx.fill();
  // emoji
  ctx.font = Math.floor(f.r*1.1) + 'px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(f.emoji, 0, 0);
  ctx.restore();
}

// start/pause/end control
btnStart.addEventListener('click', ()=>{
  isPlaying = true; resetGame(); difficulty = difficultySelect.value;
  if(difficulty === 'easy'){ spawnInterval = 1000; gravity = 900; lives = 5; }
  else if(difficulty === 'normal'){ spawnInterval = 900; gravity = 1000; lives = 3; }
  else { spawnInterval = 600; gravity = 1120; lives = 2; }
  lastSpawn = performance.now() - 200;
  updateHUD();
});
btnPause.addEventListener('click', ()=>{
  isPlaying = !isPlaying;
  if(!isPlaying) overlay.classList.remove('hidden'); else overlay.classList.add('hidden');
});
btnRestart.addEventListener('click', ()=>{ resetGame(); isPlaying = true; overlay.classList.add('hidden'); lastSpawn = performance.now() - 200; });

function endGame(){
  isPlaying = false;
  overlay.classList.remove('hidden');
  overlayScore.textContent = 'Score: ' + score;
  document.getElementById('overlay-title').textContent = 'Game Over';
}

// unlock audio on first touch
window.addEventListener('pointerdown', ()=>{ try{ ensureAudio(); if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} }, { once: true });

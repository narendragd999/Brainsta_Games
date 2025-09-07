/* Funny Falling Puzzle - Endless (Drag & Drop)
   - 5 object types: egg, tomato, ball, pizza, emoji
   - Drag falling items into matching buckets
   - Endless spawn, increasing difficulty over time
   - Sounds via WebAudio (pop for correct, oops for wrong)
*/

const ITEMS = [
  {id: 'egg', icon: '🥚'},
  {id: 'tomato', icon: '🍅'},
  {id: 'ball', icon: '⚽'},
  {id: 'pizza', icon: '🍕'},
  {id: 'emoji', icon: '😂'}
];

const game = {
  container: document.getElementById('game-container'),
  itemLayer: document.getElementById('item-layer'),
  bucketsEl: document.getElementById('buckets'),
  scoreEl: document.getElementById('score'),
  timerEl: document.getElementById('timer'),
  startBtn: document.getElementById('btn-start'),
  pauseBtn: document.getElementById('btn-pause'),
  restartBtn: document.getElementById('btn-restart'),
  speedRange: document.getElementById('speed'),
  overlay: document.getElementById('overlay'),
  finalScore: document.getElementById('final-score')
};

let spawnInterval = null;
let spawnRate = parseInt(game.speedRange.value) || 1200; // ms
let gravity = 80; // pixel/sec base fall speed
let activeItems = [];
let score = 0;
let seconds = 0;
let timerInterval = null;
let running = false;
let audioCtx = null;

// setup buckets
function setupBuckets(){
  game.bucketsEl.innerHTML = '';
  for(const it of ITEMS){
    const b = document.createElement('div');
    b.className = 'bucket';
    b.dataset.type = it.id;
    b.innerHTML = `<div class="icon">${it.icon}</div><div class="label">${it.id.toUpperCase()}</div>`;
    game.bucketsEl.appendChild(b);
  }
}
setupBuckets();

// responsive spawn X positions based on play-area width
function spawnItem(){
  const itemInfo = ITEMS[Math.floor(Math.random()*ITEMS.length)];
  const el = document.createElement('div');
  el.className = 'item';
  el.dataset.type = itemInfo.id;
  el.innerHTML = `<span class="emoji">${itemInfo.icon}</span>`;
  // random horizontal pos within play area
  const areaRect = game.itemLayer.getBoundingClientRect();
  const padding = 24;
  const x = Math.floor(Math.random()*(areaRect.width - padding*2)) + padding;
  el.style.left = x + 'px';
  el.style.top = '-80px';
  game.itemLayer.appendChild(el);

  const spawnTime = performance.now();
  const obj = {
    el, type: itemInfo.id, x, y: -80, vy: gravity + Math.random()*40, spawnTime
  };
  activeItems.push(obj);

  // attach pointer events for drag & drop
  makeDraggable(obj);
}

// draggable behavior (pointer events) for each item
function makeDraggable(obj){
  const el = obj.el;
  let pointerId = null;
  let offsetX = 0, offsetY = 0;
  let dragging = false;
  const startPointer = (e)=>{
    e.preventDefault();
    pointerId = e.pointerId;
    el.setPointerCapture(pointerId);
    dragging = true;
    el.classList.add('dragging');
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    // bring to top
    el.style.zIndex = 9999;
  };
  const movePointer = (e)=>{
    if(!dragging || e.pointerId !== pointerId) return;
    e.preventDefault();
    const areaRect = game.itemLayer.getBoundingClientRect();
    // position relative to layer
    let nx = e.clientX - areaRect.left - offsetX + (el.offsetWidth/2);
    let ny = e.clientY - areaRect.top - offsetY + (el.offsetHeight/2);
    // clamp inside play area
    nx = Math.max(8, Math.min(areaRect.width - el.offsetWidth - 8, nx));
    ny = Math.max(-120, Math.min(areaRect.height - el.offsetHeight + 20, ny));
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
    // check hover bucket highlight
    highlightBucketAtPosition(e.clientX, e.clientY);
  };
  const endPointer = (e)=>{
    if(!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.classList.remove('dragging');
    try{ el.releasePointerCapture(pointerId);}catch(err){}
    el.style.zIndex = '';
    // check drop on buckets
    const dropped = checkDrop(e.clientX, e.clientY, obj);
    if(!dropped){
      // if not dropped, keep falling from current position by updating object's y
      const areaRect = game.itemLayer.getBoundingClientRect();
      obj.y = parseFloat(el.style.top) || obj.y;
      obj.x = parseFloat(el.style.left) || obj.x;
    }
    clearBucketHighlights();
  };

  el.addEventListener('pointerdown', startPointer);
  window.addEventListener('pointermove', movePointer);
  window.addEventListener('pointerup', endPointer);
  // for touchend outside window
  window.addEventListener('pointercancel', endPointer);
}

// highlight bucket under pointer
function highlightBucketAtPosition(clientX, clientY){
  const buckets = Array.from(document.querySelectorAll('.bucket'));
  let any = false;
  for(const b of buckets){
    const r = b.getBoundingClientRect();
    if(clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom){
      b.classList.add('match');
      any = true;
    } else b.classList.remove('match');
  }
  return any;
}
function clearBucketHighlights(){ document.querySelectorAll('.bucket').forEach(b=>b.classList.remove('match')); }

// check drop - returns true if dropped on a bucket
function checkDrop(clientX, clientY, obj){
  const buckets = Array.from(document.querySelectorAll('.bucket'));
  for(const b of buckets){
    const r = b.getBoundingClientRect();
    if(clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom){
      // dropped in this bucket
      const target = b.dataset.type;
      handleDrop(obj, target);
      return true;
    }
  }
  return false;
}

// handle drop logic
function handleDrop(obj, target){
  // remove element from activeItems and DOM
  const foundIdx = activeItems.indexOf(obj);
  if(foundIdx === -1) return;
  activeItems.splice(foundIdx,1);
  try{ obj.el.remove(); }catch(e){}
  if(target === obj.type){
    // correct
    score += 1;
    playCorrectSound();
    // small pop animation at bucket
    bucketPopEffect(target);
  } else {
    // wrong
    score = Math.max(0, score - 1);
    playWrongSound();
    bucketWrongEffect(target);
  }
  updateScore();
}

// bucket visual effects
function bucketPopEffect(type){
  const b = document.querySelector(`.bucket[data-type="${type}"]`);
  if(!b) return;
  b.animate([{ transform: 'translateY(0)'},{ transform: 'translateY(-8px)'},{ transform: 'translateY(0)'}], { duration:220, easing:'ease-out' });
}
function bucketWrongEffect(type){
  const b = document.querySelector(`.bucket[data-type="${type}"]`);
  if(!b) return;
  b.animate([{ transform: 'rotate(0deg)'},{ transform: 'rotate(-8deg)'},{ transform: 'rotate(6deg)'},{ transform: 'rotate(0deg)'}], { duration:340, easing:'ease-out' });
}

// play-area physics loop - moves items down and removes if out of area
function gameTick(dt){
  const areaRect = game.itemLayer.getBoundingClientRect();
  for(let i=activeItems.length-1;i>=0;i--){
    const obj = activeItems[i];
    // skip if being dragged (has class dragging)
    if(obj.el.classList.contains('dragging')) continue;
    // update position
    obj.y += obj.vy * (dt/1000); // vy pixels per sec
    obj.el.style.top = obj.y + 'px';
    obj.el.style.left = obj.x + 'px';
    // if reaches bottom beyond buckets area -> consider as missed (wrong)
    const bottom = areaRect.height - 80; // threshold before buckets
    if(obj.y > bottom){
      // remove item and count as miss (wrong bucket)
      activeItems.splice(i,1);
      try{ obj.el.remove(); }catch(e){}
      score = Math.max(0, score - 1);
      playWrongSound();
      updateScore();
    }
  }
}

// spawn loop and increasing difficulty
function startSpawning(){
  if(spawnInterval) clearInterval(spawnInterval);
  spawnInterval = setInterval(()=>{
    spawnItem();
    // slight difficulty ramp: every 12 spawns increase gravity a bit
    if(Math.random() < 0.15) gravity += 1.5;
    // clamp gravity
    gravity = Math.min(gravity, 240);
  }, spawnRate);
}

// stop spawning
function stopSpawning(){
  if(spawnInterval) clearInterval(spawnInterval);
  spawnInterval = null;
}

// timer handling
function startTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{ seconds++; updateTimer(); }, 1000);
}
function stopTimer(){ if(timerInterval) clearInterval(timerInterval); timerInterval = null; seconds = 0; updateTimer(); }

function updateTimer(){
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  game.timerEl.textContent = 'Time: ' + m + ':' + s;
}

function updateScore(){ game.scoreEl.textContent = 'Score: ' + score; game.finalScore && (game.finalScore.textContent = 'Score: ' + score); }

// audio: simple WebAudio pops and oops
function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playCorrectSound(){
  try{
    ensureAudio();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880 + Math.random()*120, now);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now+0.25);
    // small click
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.02, audioCtx.sampleRate);
    const d = buffer.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.exp(-i/d.length*6);
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.04, now); ng.connect(audioCtx.destination);
    noise.connect(ng); noise.start(now); noise.stop(now+0.06);
  }catch(e){}
}
function playWrongSound(){
  try{
    ensureAudio();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(260, now);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now+0.28);
  }catch(e){}
}

// game control functions
let lastTick = performance.now();
function gameLoop(now){
  const dt = now - lastTick;
  lastTick = now;
  if(running) gameTick(dt);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function startGame(){
  if(running) return;
  running = true;
  score = 0; seconds = 0; updateScore(); updateTimer();
  game.overlay.classList.add('hidden');
  spawnRate = parseInt(game.speedRange.value) || 1200;
  gravity = 80;
  startSpawning();
  startTimer();
}

function pauseGame(){
  running = false;
  stopSpawning();
  stopTimer();
  game.overlay.classList.remove('hidden');
  document.getElementById('final-score').textContent = 'Score: ' + score;
}

function restartGame(){
  // clear items
  for(const it of activeItems){ try{ it.el.remove(); }catch(e){} }
  activeItems = [];
  stopSpawning();
  spawnRate = parseInt(game.speedRange.value) || 1200;
  gravity = 80;
  score = 0; seconds = 0; updateScore(); updateTimer();
  game.overlay.classList.add('hidden');
  startGame();
}

// bind UI
game.startBtn.addEventListener('click', ()=> startGame());
game.pauseBtn.addEventListener('click', ()=> pauseGame());
game.restartBtn.addEventListener('click', ()=> restartGame());
game.speedRange.addEventListener('input', (e)=>{ spawnRate = parseInt(e.target.value); if(spawnInterval){ stopSpawning(); startSpawning(); } });

// restart button on overlay
document.getElementById('btn-restart').addEventListener('click', ()=> restartGame());

// unlock audio on first touch
window.addEventListener('pointerdown', ()=>{ try{ ensureAudio(); if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} }, { once: true });

// initial UI setup
updateScore();
updateTimer();

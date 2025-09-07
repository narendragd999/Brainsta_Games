const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const overlayRestart = document.getElementById('overlay-restart');
const pauseBtn = document.getElementById('btn-pause');
const restartBtn = document.getElementById('btn-restart');
const speedRange = document.getElementById('speed');

// responsive canvas sizing
function fitCanvas(){
  const containerWidth = Math.min(window.innerWidth - 24, 900);
  canvas.width = Math.floor(containerWidth);
  // choose grid size based on width
  tileSize = Math.floor(canvas.width / columns);
  canvas.height = tileSize * rows;
}
let rows = 20, columns = 20, tileSize = 20;

window.addEventListener('resize', fitCanvas);

// game state
let snake, dir, food, score, gameInterval, tickMs, running = true;

function reset(){
  rows = Math.max(12, Math.floor((window.innerHeight*0.4)/20));
  columns = Math.max(12, Math.floor((Math.min(window.innerWidth,900))/20));
  // ensure even grid
  tileSize = Math.floor(Math.min(window.innerWidth - 24, 900) / columns);
  canvas.width = columns * tileSize;
  canvas.height = rows * tileSize;

  snake = [{x:Math.floor(columns/2), y:Math.floor(rows/2)}];
  dir = {x:1,y:0}; // start moving right
  placeFood();
  score = 0;
  running = true;
  updateScore();
  overlay.classList.add('hidden');
  clearInterval(gameInterval);
  tickMs = 1000 / parseInt(speedRange.value);
  gameInterval = setInterval(tick, tickMs);
}

function placeFood(){
  while(true){
    const x = Math.floor(Math.random()*columns);
    const y = Math.floor(Math.random()*rows);
    if(!snake.some(s=>s.x===x && s.y===y)){
      food = {x,y};
      return;
    }
  }
}

function draw(){
  // background
  ctx.fillStyle = '#071226';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // grid (subtle)
  ctx.strokeStyle = '#081623';
  for(let i=0;i<=columns;i++){ ctx.beginPath(); ctx.moveTo(i*tileSize,0); ctx.lineTo(i*tileSize,canvas.height); ctx.stroke();}
  for(let j=0;j<=rows;j++){ ctx.beginPath(); ctx.moveTo(0,j*tileSize); ctx.lineTo(canvas.width,j*tileSize); ctx.stroke();}

  // food
  ctx.fillStyle = '#f59e0b';
  drawRect(food.x, food.y);

  // snake
  ctx.fillStyle = '#10b981';
  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    drawRect(s.x, s.y, i===0);
  }
}

function drawRect(x,y,head=false){
  const pad = Math.max(2, Math.floor(tileSize*0.12));
  const px = x*tileSize + pad;
  const py = y*tileSize + pad;
  const size = tileSize - pad*2;
  if(head){
    // rounded head
    roundRect(ctx, px, py, size, size, Math.max(4, pad));
  } else {
    roundRect(ctx, px, py, size, size, Math.max(3, pad/1.2));
  }
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fill();
}

function tick(){
  const head = {...snake[0], x: snake[0].x + dir.x, y: snake[0].y + dir.y};

  // wrap around
  if(head.x < 0) head.x = columns - 1;
  if(head.x >= columns) head.x = 0;
  if(head.y < 0) head.y = rows - 1;
  if(head.y >= rows) head.y = 0;

  // collision with self
  if(snake.some(s => s.x === head.x && s.y === head.y)){
    gameOver();
    return;
  }

  snake.unshift(head);
  if(head.x === food.x && head.y === food.y){
    score += 1;
    updateScore();
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

function updateScore(){ scoreEl.textContent = 'Score: ' + score; }

function gameOver(){
  clearInterval(gameInterval);
  running = false;
  overlayTitle.textContent = 'Game Over';
  overlayScore.textContent = 'Score: ' + score;
  overlay.classList.remove('hidden');
}

// input: keyboard
window.addEventListener('keydown', e=>{
  if(e.key === 'ArrowUp') setDir(0,-1);
  if(e.key === 'ArrowDown') setDir(0,1);
  if(e.key === 'ArrowLeft') setDir(-1,0);
  if(e.key === 'ArrowRight') setDir(1,0);
  if(e.key === ' ') togglePause();
});

// on-screen buttons
document.getElementById('btn-up').addEventListener('click', ()=>setDir(0,-1));
document.getElementById('btn-down').addEventListener('click', ()=>setDir(0,1));
document.getElementById('btn-left').addEventListener('click', ()=>setDir(-1,0));
document.getElementById('btn-right').addEventListener('click', ()=>setDir(1,0));
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', ()=>{ reset(); });
overlayRestart.addEventListener('click', ()=>{ reset(); });

// speed control
speedRange.addEventListener('input', ()=>{
  clearInterval(gameInterval);
  tickMs = 1000 / parseInt(speedRange.value);
  if(running) gameInterval = setInterval(tick, tickMs);
});

// touch controls: swipe detection
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
canvas.addEventListener('touchstart', (e)=>{
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
});
canvas.addEventListener('touchend', (e)=>{
  const t = (e.changedTouches && e.changedTouches[0]) || e.touches[0];
  if(!t) return;
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  const absX = Math.abs(dx), absY = Math.abs(dy);
  if(Math.max(absX, absY) < 20 || dt > 600) return; // not a decisive swipe
  if(absX > absY){
    if(dx > 0) setDir(1,0); else setDir(-1,0);
  } else {
    if(dy > 0) setDir(0,1); else setDir(0,-1);
  }
});

// helper to disallow reversing directly
function setDir(x,y){
  // prevent 180-degree reversal
  if(snake.length > 1 && snake[0].x + x === snake[1].x && snake[0].y + y === snake[1].y) return;
  dir = {x,y};
}

// pause toggle
function togglePause(){
  if(!running){
    running = true;
    overlay.classList.add('hidden');
    clearInterval(gameInterval);
    gameInterval = setInterval(tick, tickMs);
  } else {
    running = false;
    clearInterval(gameInterval);
    overlayTitle.textContent = 'Paused';
    overlayScore.textContent = 'Score: ' + score;
    overlay.classList.remove('hidden');
  }
}

// initialize
reset();
draw();

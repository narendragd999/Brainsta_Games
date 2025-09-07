/* Sliding Puzzle Game (touch & click)
   - Responsive canvas
   - Themes and image support (drag/drop or upload)
   - Animated tile movement
*/
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const sizeSelect = document.getElementById('size-select');
const themeSelect = document.getElementById('theme-select');
const shuffleBtn = document.getElementById('shuffle');
const restartBtn = document.getElementById('restart');
const movesStat = document.getElementById('moves');
const overlay = document.getElementById('overlay');
const winMoves = document.getElementById('win-moves');
const winRestart = document.getElementById('win-restart');
const imgUpload = document.getElementById('img-upload');

let gridSize = parseInt(sizeSelect.value) || 4;
let tiles = [];
let emptyIndex = 0;
let tileSizePx = 0;
let boardSizePx = 600;
let moves = 0;
let timer = null;
let seconds = 0;
let animating = false;
let baseImage = null;
let theme = 'gradient';

function fitCanvas(){
  const maxWidth = Math.min(window.innerWidth - 48, 720);
  boardSizePx = maxWidth;
  canvas.width = boardSizePx;
  canvas.height = boardSizePx;
  tileSizePx = Math.floor(boardSizePx / gridSize);
  draw();
}

window.addEventListener('resize', fitCanvas);

// initialize puzzle
function init(){
  gridSize = parseInt(sizeSelect.value);
  generateTiles();
  moves = 0;
  seconds = 0;
  updateStats();
  clearInterval(timer);
  timer = setInterval(()=>{ seconds++; updateTime(); }, 1000);
  overlay.classList.add('hidden');
  fitCanvas();
}

function generateTiles(){
  tiles = [];
  const total = gridSize*gridSize;
  for(let i=0;i<total;i++) tiles.push(i);
  emptyIndex = total -1;
  // make solvable randomized state
  shuffleTiles();
}

function shuffleTiles(){
  // Fisher-Yates with solvability check
  do {
    for(let i=tiles.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while(!isSolvable());
  moves = 0;
  updateStats();
  draw();
}

function isSolvable(){
  const arr = tiles.slice();
  const inv = arr.reduce((acc, val, idx)=> {
    if(val === tiles.length-1) return acc;
    for(let j=idx+1;j<arr.length;j++){
      if(arr[j] !== tiles.length-1 && arr[j] < val) acc++;
    }
    return acc;
  }, 0);
  if(gridSize % 2 === 1) return inv % 2 === 0;
  const emptyRowFromBottom = gridSize - Math.floor(tiles.indexOf(tiles.length-1) / gridSize);
  if(emptyRowFromBottom %2 === 0) return inv %2 ===1;
  return inv %2 ===0;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background theme
  if(theme === 'image' && baseImage){
    // draw image as board background
    ctx.drawImage(baseImage, 0,0,canvas.width,canvas.height);
  } else {
    // gradient fallback
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    if(theme === 'sunset'){ g.addColorStop(0,'#ff7a59'); g.addColorStop(1,'#ffb86b'); }
    else if(theme === 'forest'){ g.addColorStop(0,'#10b981'); g.addColorStop(1,'#2dd4bf'); }
    else { g.addColorStop(0,'#0ea5a4'); g.addColorStop(1,'#06b6d4'); }
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // draw tiles
  for(let i=0;i<tiles.length;i++){
    const val = tiles[i];
    if(val === tiles.length-1) continue; // empty
    const r = Math.floor(i / gridSize);
    const c = i % gridSize;
    const x = c * tileSizePx;
    const y = r * tileSizePx;

    // draw tile background (if using image, clip from image)
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x+6, y+6, tileSizePx-12, tileSizePx-12, 12);
    ctx.clip();

    if(theme === 'image' && baseImage){
      const sx = (val % gridSize) * (baseImage.width / gridSize);
      const sy = Math.floor(val / gridSize) * (baseImage.height / gridSize);
      const sw = baseImage.width / gridSize;
      const sh = baseImage.height / gridSize;
      ctx.drawImage(baseImage, sx, sy, sw, sh, x+6, y+6, tileSizePx-12, tileSizePx-12);
    } else {
      // colored tile - slightly darker overlay with number
      const g2 = ctx.createLinearGradient(x,y,x+tileSizePx,y+tileSizePx);
      if(theme==='sunset'){ g2.addColorStop(0,'#ff9a76'); g2.addColorStop(1,'#ffb86b'); }
      else if(theme==='forest'){ g2.addColorStop(0,'#34d399'); g2.addColorStop(1,'#2dd4bf'); }
      else { g2.addColorStop(0,'#7dd3c9'); g2.addColorStop(1,'#06b6d4'); }
      ctx.fillStyle = g2;
      ctx.fillRect(x+6, y+6, tileSizePx-12, tileSizePx-12);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x+6, y+tileSizePx/2, tileSizePx-12, tileSizePx/2-6);
      // number
      ctx.fillStyle = '#021827';
      ctx.font = Math.floor(tileSizePx*0.28) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((val+1).toString(), x + tileSizePx/2, y + tileSizePx/2);
    }
    ctx.restore();
  }

  // subtle grid lines
  ctx.strokeStyle = 'rgba(2,8,14,0.2)';
  for(let i=1;i<gridSize;i++){
    ctx.beginPath(); ctx.moveTo(i*tileSizePx,0); ctx.lineTo(i*tileSizePx,canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*tileSizePx); ctx.lineTo(canvas.width,i*tileSizePx); ctx.stroke();
  }
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

function indexFromRC(r,c){ return r*gridSize + c; }
function rcFromIndex(i){ return {r: Math.floor(i/gridSize), c: i%gridSize}; }

canvas.addEventListener('pointerdown', onPointerDown);

function onPointerDown(e){
  if(animating) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const c = Math.floor(x / tileSizePx);
  const r = Math.floor(y / tileSizePx);
  if(c<0||r<0||c>=gridSize||r>=gridSize) return;
  const idx = indexFromRC(r,c);
  attemptMove(idx);
}

function attemptMove(idx){
  const er = Math.floor(emptyIndex / gridSize);
  const ec = emptyIndex % gridSize;
  const tr = Math.floor(idx / gridSize);
  const tc = idx % gridSize;
  const dist = Math.abs(er - tr) + Math.abs(ec - tc);
  if(dist === 1){
    // swap with animation
    swapTiles(idx, emptyIndex, true);
    moves++;
    updateStats();
    if(isSolved()){
      showWin();
    }
  }
}

function swapTiles(i,j,animate){
  if(animate){
    animating = true;
    const from = rcFromIndex(i);
    const to = rcFromIndex(j);
    const sx = from.c * tileSizePx, sy = from.r * tileSizePx;
    const dx = (to.c - from.c)*tileSizePx, dy = (to.r - from.r)*tileSizePx;
    const duration = 160;
    const start = performance.now();
    const val = tiles[i];
    function step(t){
      const p = Math.min(1,(t-start)/duration);
      draw(); // draws base board
      // draw moving tile on top
      const curX = sx + dx * p;
      const curY = sy + dy * p;
      ctx.save();
      roundRect(ctx, curX+6, curY+6, tileSizePx-12, tileSizePx-12, 12);
      ctx.clip();
      if(theme==='image' && baseImage){
        const sx2 = (val % gridSize) * (baseImage.width / gridSize);
        const sy2 = Math.floor(val / gridSize) * (baseImage.height / gridSize);
        const sw = baseImage.width / gridSize;
        const sh = baseImage.height / gridSize;
        ctx.drawImage(baseImage, sx2, sy2, sw, sh, curX+6, curY+6, tileSizePx-12, tileSizePx-12);
      } else {
        const g2 = ctx.createLinearGradient(curX,curY,curX+tileSizePx,curY+tileSizePx);
        if(theme==='sunset'){ g2.addColorStop(0,'#ff9a76'); g2.addColorStop(1,'#ffb86b'); }
        else if(theme==='forest'){ g2.addColorStop(0,'#34d399'); g2.addColorStop(1,'#2dd4bf'); }
        else { g2.addColorStop(0,'#7dd3c9'); g2.addColorStop(1,'#06b6d4'); }
        ctx.fillStyle = g2;
        ctx.fillRect(curX+6, curY+6, tileSizePx-12, tileSizePx-12);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(curX+6, curY+tileSizePx/2, tileSizePx-12, tileSizePx/2-6);
        ctx.fillStyle = '#021827';
        ctx.font = Math.floor(tileSizePx*0.28) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((val+1).toString(), curX + tileSizePx/2, curY + tileSizePx/2);
      }
      ctx.restore();
      if(p<1) requestAnimationFrame(step); else {
        // finalize swap in data
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        emptyIndex = i;
        animating = false;
        draw();
      }
    }
    requestAnimationFrame(step);
  } else {
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    emptyIndex = i;
    draw();
  }
}

function isSolved(){
  for(let i=0;i<tiles.length;i++){
    if(tiles[i] !== i) return false;
  }
  return true;
}

function updateStats(){
  movesEl.textContent = moves;
  movesStat.textContent = moves;
}

function updateTime(){
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  timeEl.textContent = m + ':' + s;
}

function showWin(){
  clearInterval(timer);
  overlay.classList.remove('hidden');
  winMoves.textContent = 'Moves: ' + moves;
}

shuffleBtn.addEventListener('click', ()=>{ shuffleTiles(); seconds=0; clearInterval(timer); timer=setInterval(()=>{ seconds++; updateTime(); },1000); });
restartBtn.addEventListener('click', ()=>{ init(); });
winRestart.addEventListener('click', ()=>{ init(); });

sizeSelect.addEventListener('change', ()=>{ init(); });
themeSelect.addEventListener('change', (e)=>{
  theme = e.target.value;
  if(theme === 'image'){
    imgUpload.click();
  } else {
    baseImage = null;
    draw();
  }
});

imgUpload.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const img = new Image();
  img.onload = ()=>{ baseImage = img; draw(); };
  img.src = URL.createObjectURL(f);
});

// drag & drop on canvas for image
['dragenter','dragover','drop'].forEach(ev=>{
  canvas.addEventListener(ev, (e)=>{
    e.preventDefault(); e.stopPropagation();
  });
});
canvas.addEventListener('drop', (e)=>{
  const dt = e.dataTransfer;
  if(dt && dt.files && dt.files.length>0){
    const f = dt.files[0];
    const img = new Image();
    img.onload = ()=>{ baseImage = img; theme='image'; themeSelect.value='image'; draw(); };
    img.src = URL.createObjectURL(f);
  }
});

fitCanvas();
init();

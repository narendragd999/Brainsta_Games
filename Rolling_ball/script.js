const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score');
const livesEl=document.getElementById('lives');
const overlay=document.getElementById('overlay');
const overlayScore=document.getElementById('overlay-score');
const btnStart=document.getElementById('btn-start');
const btnPause=document.getElementById('btn-pause');
const btnRestart=document.getElementById('btn-restart');
const difficultySelect=document.getElementById('difficulty');

let width=800,height=600;
function fitCanvas(){ width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
window.addEventListener('resize',fitCanvas);
fitCanvas();

let ball={x:100,y:100,r:18,vx:0,vy:0};
let maze=[]; // array of rectangles {x,y,w,h}
let isPlaying=false,score=0,lives=3,lastTime=performance.now(),gravity=900;
let keys={left:false,right:false,up:false,down:false};
let difficulty='normal';

function resetGame(){ score=0;lives=3;ball.x=100;ball.y=100;ball.vx=0;ball.vy=0;maze=[];generateMaze();overlay.classList.add('hidden');updateHUD(); }

function updateHUD(){ scoreEl.textContent='Score: '+score;livesEl.textContent='Lives: '+lives; }

function generateMaze(){
  const rows=6,cols=8,cellW=width/cols,cellH=height/rows;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(Math.random()<0.3){maze.push({x:c*cellW,y:r*cellH,w:cellW,h:cellH})}
    }
  }
}

function checkCollision(){ for(const m of maze){ if(ball.x+ball.r>m.x && ball.x-ball.r<m.x+m.w && ball.y+ball.r>m.y && ball.y-ball.r<m.y+m.h){ball.vx=-ball.vx*0.4;ball.vy=-ball.vy*0.4;} } }

function gameLoop(now){
  const dt=Math.min(40,now-lastTime)/1000; lastTime=now;
  if(isPlaying){
    // movement via keys
    let speed=300;
    if(difficulty==='easy') speed=220; else if(difficulty==='normal') speed=300; else speed=400;
    if(keys.left) ball.vx-=speed*dt;
    if(keys.right) ball.vx+=speed*dt;
    if(keys.up) ball.vy-=speed*dt;
    if(keys.down) ball.vy+=speed*dt;
    ball.vy+=gravity*dt;
    ball.x+=ball.vx*dt; ball.y+=ball.vy*dt;
    // bounds
    if(ball.x<ball.r){ball.x=ball.r;ball.vx*=-0.5}
    if(ball.x>width-ball.r){ball.x=width-ball.r;ball.vx*=-0.5}
    if(ball.y<ball.r){ball.y=ball.r;ball.vy*=-0.5}
    if(ball.y>height-ball.r){ball.y=height-ball.r;ball.vy*=-0.5; lives-=1; updateHUD(); if(lives<=0) endGame();}
    checkCollision();
    score+=Math.floor(dt*10);
    updateHUD();
  }
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function render(){
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#001728'; ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0f4868';
  for(const m of maze){ ctx.fillRect(m.x,m.y,m.w,m.h); }
}

// input
window.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft') keys.left=true; if(e.key==='ArrowRight') keys.right=true; if(e.key==='ArrowUp') keys.up=true; if(e.key==='ArrowDown') keys.down=true; });
window.addEventListener('keyup',e=>{ if(e.key==='ArrowLeft') keys.left=false; if(e.key==='ArrowRight') keys.right=false; if(e.key==='ArrowUp') keys.up=false; if(e.key==='ArrowDown') keys.down=false; });

btnStart.addEventListener('click',()=>{ isPlaying=true; resetGame(); difficulty=difficultySelect.value; });
btnPause.addEventListener('click',()=>{ isPlaying=!isPlaying; if(!isPlaying) overlay.classList.remove('hidden'); else overlay.classList.add('hidden'); });
btnRestart.addEventListener('click',()=>{ resetGame(); isPlaying=true; overlay.classList.add('hidden'); });
function endGame(){ isPlaying=false; overlay.classList.remove('hidden'); overlayScore.textContent='Score: '+score; document.getElementById('overlay-title').textContent='Game Over'; }

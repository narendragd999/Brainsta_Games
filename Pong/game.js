const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;

function resize(){
  cw = window.innerWidth;
  ch = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  resetSizes();
}
window.addEventListener('resize', resize);

let leftScore = 0, rightScore = 0;
const scoreEl = document.getElementById('score');
const btnStart = document.getElementById('btnStart');
let running = false;

let ball = {x:0,y:0,r:10,vx:6,vy:3};
let leftPaddle = {x:20,y:0,w:12,h:100,vy:0};
let rightPaddle = {x:0,y:0,w:12,h:100,vy:0};
let serveLocked = true;

function resetSizes(){
  leftPaddle.h = ch*0.2;
  rightPaddle.h = leftPaddle.h;
  rightPaddle.x = cw - rightPaddle.w - 20;
  leftPaddle.x = 20;
  leftPaddle.y = (ch - leftPaddle.h)/2;
  rightPaddle.y = (ch - rightPaddle.h)/2;
  ball.r = Math.max(8, Math.min(20, cw*0.02));
  ball.x = cw/2; ball.y = ch/2;
  ball.vx = (Math.random()>0.5?1:-1)*6;
  ball.vy = (Math.random()*4-2);
  updateScore();
}

function updateScore(){ scoreEl.textContent = leftScore+" : "+rightScore; }

btnStart.addEventListener('click', ()=>{
  leftScore=0; rightScore=0; updateScore();
  running=true; serveLocked=true;
  btnStart.style.display='none';
  loop();
});

function serveBall(){
  ball.x=cw/2; ball.y=ch/2;
  ball.vx=(Math.random()>0.5?1:-1)*6;
  ball.vy=(Math.random()*4-2);
  serveLocked=false;
}

function resetAfterPoint(winner){
  if(winner==='left') leftScore++; else rightScore++;
  updateScore(); running=false; serveLocked=true;
  btnStart.style.display='inline-block';
}

function update(){
  if(serveLocked) return;
  ball.x+=ball.vx; ball.y+=ball.vy;
  if(ball.y-ball.r<0||ball.y+ball.r>ch) ball.vy*=-1;
  // Left paddle collision
  if(ball.x-ball.r<leftPaddle.x+leftPaddle.w){
    if(ball.y>leftPaddle.y && ball.y<leftPaddle.y+leftPaddle.h){
      ball.vx=Math.abs(ball.vx);
    } else resetAfterPoint('right');
  }
  // Right paddle collision
  if(ball.x+ball.r>rightPaddle.x){
    if(ball.y>rightPaddle.y && ball.y<rightPaddle.y+rightPaddle.h){
      ball.vx=-Math.abs(ball.vx);
    } else resetAfterPoint('left');
  }
  // AI
  let targetY=ball.y-rightPaddle.h/2;
  rightPaddle.y+= (targetY-rightPaddle.y)*0.1;
}

function draw(){
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cw,ch);
  ctx.fillStyle='#0f0'; ctx.fillRect(leftPaddle.x,leftPaddle.y,leftPaddle.w,leftPaddle.h);
  ctx.fillStyle='#f00'; ctx.fillRect(rightPaddle.x,rightPaddle.y,rightPaddle.w,rightPaddle.h);
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
}

function loop(){
  if(running){ update(); draw(); requestAnimationFrame(loop); }
}

// Controls
canvas.addEventListener('touchstart', e=>{
  if(serveLocked && running){ serveBall(); }
});
canvas.addEventListener('touchmove', e=>{
  const t=e.touches[0];
  leftPaddle.y=t.clientY-leftPaddle.h/2;
});

resize();
draw();

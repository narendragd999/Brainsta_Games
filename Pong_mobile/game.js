const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;

function resize(){
  canvas.width = Math.max(480, window.innerWidth * 0.96);
  canvas.height = Math.max(320, window.innerHeight * 0.7);
  cw = canvas.width; ch = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cw = canvas.clientWidth; ch = canvas.clientHeight;
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
let difficulty = 0.08;

function resetSizes(){
  leftPaddle.h = Math.max(60, ch * 0.22);
  rightPaddle.h = leftPaddle.h;
  rightPaddle.x = cw - rightPaddle.w - 20;
  leftPaddle.x = 20;
  leftPaddle.y = (ch - leftPaddle.h)/2;
  rightPaddle.y = (ch - rightPaddle.h)/2;
  ball.r = Math.max(8, Math.min(20, cw * 0.02));
  ball.x = cw/2; ball.y = ch/2;
  ball.vx = (Math.random() > 0.5 ? 1 : -1) * 6;
  ball.vy = (Math.random() * 4 - 2);
  updateScoreText();
}

function updateScoreText(){
  scoreEl.textContent = leftScore + " : " + rightScore;
}

btnStart.addEventListener('click', ()=>{
  leftScore = 0; rightScore = 0; updateScoreText();
  running = true;
  serveLocked = true;
  btnStart.style.display = 'none';
  loop();
});

function serveBall(direction){
  ball.x = cw/2; ball.y = ch/2;
  const speed = 6 + Math.min(6, (leftScore + rightScore) * 0.2);
  ball.vx = direction === 'left' ? -speed : speed;
  ball.vy = (Math.random() * 4 - 2);
  serveLocked = false;
}

function resetAfterPoint(winner){
  if(winner === 'left') leftScore++; else rightScore++;
  updateScoreText();
  serveLocked = true;
  ball.x = cw/2; ball.y = ch/2;
  ball.vx = 0; ball.vy = 0;
  setTimeout(()=>{
    if(leftScore+rightScore >= 10){
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * 8;
    }
  }, 200);
  btnStart.style.display = 'inline-block';
  running = false;
}

function update(){
  if(serveLocked) return;
  ball.x += ball.vx;
  ball.y += ball.vy;
  if(ball.y - ball.r < 0){ ball.y = ball.r; ball.vy *= -1; }
  if(ball.y + ball.r > ch){ ball.y = ch - ball.r; ball.vy *= -1; }
  if(ball.x - ball.r < leftPaddle.x + leftPaddle.w){
    if(ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.h){
      ball.x = leftPaddle.x + leftPaddle.w + ball.r;
      const hitPos = (ball.y - (leftPaddle.y + leftPaddle.h/2)) / (leftPaddle.h/2);
      ball.vx = Math.abs(ball.vx) + 0.5;
      ball.vy += hitPos * 4;
    } else {
      resetAfterPoint('right');
    }
  }
  if(ball.x + ball.r > rightPaddle.x){
    if(ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.h){
      ball.x = rightPaddle.x - ball.r;
      const hitPos = (ball.y - (rightPaddle.y + rightPaddle.h/2)) / (rightPaddle.h/2);
      ball.vx = -Math.abs(ball.vx) - 0.5;
      ball.vy += hitPos * 4;
    } else {
      resetAfterPoint('left');
    }
  }
  const maxSpeed = 18;
  const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
  if(speed > maxSpeed){
    ball.vx *= maxSpeed/speed;
    ball.vy *= maxSpeed/speed;
  }
  const targetY = ball.y - rightPaddle.h/2;
  const dy = targetY - rightPaddle.y;
  rightPaddle.y += dy * (difficulty + 0.02);
  leftPaddle.y = Math.max(0, Math.min(ch - leftPaddle.h, leftPaddle.y));
  rightPaddle.y = Math.max(0, Math.min(ch - rightPaddle.h, rightPaddle.y));
}

function draw(){
  ctx.clearRect(0,0,cw,ch);
  const g = ctx.createLinearGradient(0,0,0,ch);
  g.addColorStop(0,'#0f172a');
  g.addColorStop(1,'#04293a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,cw,ch);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8,12]);
  ctx.beginPath();
  ctx.moveTo(cw/2, 0);
  ctx.lineTo(cw/2, ch);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#10b981';
  roundRect(ctx, leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h, 6, true);
  ctx.fillStyle = '#ffb703';
  roundRect(ctx, rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h, 6, true);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, fill){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if(fill) ctx.fill(); else ctx.stroke();
}

function loop(){
  if(running){
    update();
    draw();
    requestAnimationFrame(loop);
  }
}

let touching = false;
let touchId = null;
canvas.addEventListener('touchstart', (e)=>{
  e.preventDefault();
  const t = e.changedTouches[0];
  touchId = t.identifier;
  touching = true;
  const rect = canvas.getBoundingClientRect();
  const tx = t.clientX - rect.left;
  const ty = t.clientY - rect.top;
  if(tx < cw/2){
    leftPaddle.y = ty - leftPaddle.h/2;
  }
  if(serveLocked && running){
    serveBall(tx < cw/2 ? 'right' : 'left');
  }
});
canvas.addEventListener('touchmove', (e)=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier === touchId){
      const rect = canvas.getBoundingClientRect();
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;
      if(tx < cw/2){
        leftPaddle.y = ty - leftPaddle.h/2;
      }
    }
  }
});
canvas.addEventListener('touchend', (e)=>{
  e.preventDefault();
  touching = false;
  touchId = null;
});

let mouseDown = false;
canvas.addEventListener('mousedown', (e)=>{
  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if(mx < cw/2) leftPaddle.y = my - leftPaddle.h/2;
  if(serveLocked && running) serveBall(mx < cw/2 ? 'right' : 'left');
});
window.addEventListener('mousemove', (e)=>{
  if(!mouseDown) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if(mx < cw/2) leftPaddle.y = my - leftPaddle.h/2;
});
window.addEventListener('mouseup', ()=>{ mouseDown = false; });

window.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowUp' || e.key === 'w') leftPaddle.y -= 20;
  if(e.key === 'ArrowDown' || e.key === 's') leftPaddle.y += 20;
  if(e.key === ' ' && serveLocked && running) serveBall('right');
});

document.addEventListener('gesturestart', (e)=>{ e.preventDefault(); });

resize();
draw();

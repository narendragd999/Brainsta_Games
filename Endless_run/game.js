const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cw = canvas.width;
  ch = canvas.height;

  // Responsive avatar size
  player.w = Math.max(50, cw * 0.12);
  player.h = Math.max(80, ch * 0.25);
  player.groundY = ch - 100;
  player.y = player.groundY - player.h;
}
window.addEventListener("resize", resizeCanvas);

let running=false, score=0, speed=6, gravity=0.9;
let player = {x:80,y:0,w:80,h:120,vy:0,groundY:0,jumping:false,canDouble:false,gliding:false};
let obstacles = [];
let spawnTimer=0, spawnInterval=90;

let avatarImg = new Image();
avatarImg.src = "avatar.png";

const scoreEl = document.getElementById('score');
const btnStart = document.getElementById('btnStart');

btnStart.addEventListener('click', startGame);

function startGame(){
  running=true;
  score=0;
  speed=6;
  obstacles=[];
  spawnTimer=0;
  player.y = player.groundY - player.h;
  player.vy=0; player.jumping=false; player.canDouble=true; player.gliding=false;
  btnStart.style.display='none';
  loop();
}

function endGame(){
  running=false;
  btnStart.style.display='inline-block';
  btnStart.textContent = 'Restart';
}

function spawnObstacle(){
  const h = 40 + Math.random()*80;
  const obstacle = {x:cw+50, y: player.groundY - h, w: 40, h: h};
  obstacles.push(obstacle);
}

function update(){
  if(player.gliding){
    player.vy += gravity*0.1;
  } else {
    player.vy += gravity;
  }
  player.y += player.vy;
  if(player.y > player.groundY - player.h){
    player.y = player.groundY - player.h;
    player.vy = 0;
    player.jumping = false;
    player.canDouble = true;
    player.gliding = false;
  }

  spawnTimer++;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnInterval = 60 + Math.floor(Math.random()*80);
    spawnObstacle();
  }

  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= speed;
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
    else if(rectIntersect(player, obstacles[i])) endGame();
    else if(!obstacles[i].scored && obstacles[i].x + obstacles[i].w < player.x){
      obstacles[i].scored = true;
      score += 10;
      if(score % 50 === 0) speed += 0.5;
    }
  }
}

function rectIntersect(a,b){
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

function draw(){
  ctx.clearRect(0,0,cw,ch);
  // background
  let g = ctx.createLinearGradient(0,0,0,ch);
  g.addColorStop(0,"#9fe8ff");
  g.addColorStop(1,"#d9f0ff");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,cw,ch);

  // ground
  ctx.fillStyle="#2d6a4f";
  ctx.fillRect(0, player.groundY, cw, ch - player.groundY);

  // player avatar
  if(avatarImg.complete) ctx.drawImage(avatarImg, player.x, player.y, player.w, player.h);
  else {
    ctx.fillStyle="#ffb703";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // obstacles
  ctx.fillStyle="#8b0000";
  for(const ob of obstacles){
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  ctx.fillStyle="#022";
  ctx.font="20px system-ui";
  ctx.fillText("Score: " + score, 12, 28);
}

function loop(){
  if(!running) return;
  update();
  draw();
  scoreEl.textContent = "Score: " + score;
  requestAnimationFrame(loop);
}

function doJump(){
  if(!running) return;
  if(!player.jumping){
    player.vy = -20;
    player.jumping = true;
    player.canDouble=true;
  } else if(player.canDouble){
    player.vy = -16;
    player.canDouble=false;
  }
}

function startGlide(){ if(player.jumping) player.gliding = true; }
function stopGlide(){ player.gliding = false; }

document.addEventListener('keydown', e=>{
  if(e.code === 'Space'){ e.preventDefault(); if(!running) startGame(); doJump(); }
  if(e.key==='g'||e.key==='G'){ startGlide(); }
});
document.addEventListener('keyup', e=>{
  if(e.code==='Space') stopGlide();
  if(e.key==='g'||e.key==='G') stopGlide();
});

canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  if(!running) startGame();
  doJump();
  setTimeout(()=>{ startGlide(); },300);
});
canvas.addEventListener('touchend', e=>{ e.preventDefault(); stopGlide(); });

resizeCanvas();
draw();

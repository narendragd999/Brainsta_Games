const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let cw = canvas.width, ch = canvas.height;

function resizeCanvas(){
  // keep internal resolution constant but scale via CSS handled automatically
}
resizeCanvas();

let running=false, score=0, speed=4, gravity=0.9;
let player = {x:80,y:0,w:40,h:40,vy:0,groundY: ch-80, jumping:false,canDouble:false,gliding:false};
player.y = player.groundY - player.h;

let obstacles = [];
let spawnTimer=0, spawnInterval=90;

const scoreEl = document.getElementById('score');
const btnStart = document.getElementById('btnStart');

btnStart.addEventListener('click', startGame);

function startGame(){
  running=true;
  score=0;
  speed=4;
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
  // random height obstacle
  const h = 30 + Math.random()*60;
  const obstacle = {x:cw+50, y: player.groundY - h, w: 30 + Math.random()*30, h: h};
  obstacles.push(obstacle);
}

function update(){
  // update player
  if(player.gliding){
    player.vy += gravity*0.08; // slower fall
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

  // spawn obstacles
  spawnTimer++;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnInterval = 60 + Math.floor(Math.random()*80);
    spawnObstacle();
  }

  // move obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= speed;
    // offscreen
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
    // collision
    if(rectIntersect(player, obstacles[i])){
      endGame();
    } else {
      // score when pass obstacle
      if(!obstacles[i].scored && obstacles[i].x + obstacles[i].w < player.x){
        obstacles[i].scored = true;
        score += 10;
        // increase difficulty slightly
        if(score % 50 === 0) speed += 0.5;
      }
    }
  }
}

function rectIntersect(a,b){
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

function draw(){
  // clear
  ctx.clearRect(0,0,cw,ch);

  // background sky gradient
  const g = ctx.createLinearGradient(0,0,0,ch);
  g.addColorStop(0,'#9fe8ff');
  g.addColorStop(1,'#d9f0ff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,cw,ch);

  // ground
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, player.groundY, cw, ch - player.groundY);

  // player
  ctx.save();
  ctx.fillStyle = '#ffb703';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // eye
  ctx.fillStyle = '#000';
  ctx.fillRect(player.x + player.w - 14, player.y + 12, 6, 6);
  ctx.restore();

  // obstacles
  ctx.fillStyle = '#8b0000';
  for(const ob of obstacles){
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // HUD
  ctx.fillStyle = '#022';
  ctx.font = '20px system-ui';
  ctx.fillText('Score: ' + score, 12, 28);
}

function loop(){
  if(!running) return;
  update();
  draw();
  scoreEl.textContent = 'Score: ' + score;
  requestAnimationFrame(loop);
}

// controls: space / touch to jump; long press to glide
let touchStartTime = 0;
let touching = false;

function doJump(){
  if(!running) return;
  if(!player.jumping){
    player.vy = -15;
    player.jumping = true;
    player.canDouble = true;
  } else if(player.canDouble){
    // small double jump
    player.vy = -12;
    player.canDouble = false;
  }
}

function startGlide(){
  if(player.jumping) player.gliding = true;
}

function stopGlide(){
  player.gliding = false;
}

document.addEventListener('keydown', e=>{
  if(e.code === 'Space'){
    e.preventDefault();
    if(!running) startGame();
    doJump();
  }
  if(e.key === 'g' || e.key === 'G'){
    startGlide();
  }
});
document.addEventListener('keyup', e=>{
  if(e.code === 'Space') stopGlide();
  if(e.key === 'g' || e.key === 'G') stopGlide();
});

// touch handling
canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  touching = true;
  touchStartTime = Date.now();
  if(!running) startGame();
  doJump();
  // start possible glide after 250ms if still touching
  setTimeout(()=>{
    if(touching) startGlide();
  }, 250);
});
canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  touching = false;
  stopGlide();
});

// mouse support for desktop testing
canvas.addEventListener('mousedown', e=>{
  e.preventDefault();
  touching = true;
  touchStartTime = Date.now();
  if(!running) startGame();
  doJump();
  setTimeout(()=>{ if(touching) startGlide(); }, 250);
});
window.addEventListener('mouseup', e=>{
  touching = false;
  stopGlide();
});

// initial draw
draw();

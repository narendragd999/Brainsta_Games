// Simple endless runner, mobile-friendly
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;
function resize(){
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
resize();

// load images
const images = {};
['bg.png','player.png','cone.png','excavator.png'].forEach(name=>{
  const img = new Image();
  img.src = name;
  images[name] = img;
});

const lanes = [0.25,0.5,0.75]; // relative x positions
let player = {lane:1,y:0,x:0,w:48,h:64};
let obstacles = [];
let speed = 220; // px per second
let last = performance.now();
let score = 0;
let spawnTimer = 0;

function spawnObstacle(){
  const lane = Math.floor(Math.random()*3);
  const type = Math.random() < 0.2 ? 'excavator' : 'cone';
  obstacles.push({
    x: lanes[lane]*canvas.width,
    lane,
    y: -120,
    w: type==='excavator'?140:48,
    h: type==='excavator'?80:48,
    type
  });
}

// touch controls: tap left/right to move lanes
canvas.addEventListener('touchstart', (e)=>{
  e.preventDefault();
  const t = e.touches[0];
  const x = t.clientX;
  if (x < window.innerWidth/2) {
    player.lane = Math.max(0, player.lane-1);
  } else {
    player.lane = Math.min(2, player.lane+1);
  }
});

canvas.addEventListener('mousedown', (e)=>{
  const x = e.clientX;
  if (x < window.innerWidth/2) player.lane = Math.max(0, player.lane-1);
  else player.lane = Math.min(2, player.lane+1);
});

function update(dt){
  // move obstacles down
  for(let o of obstacles){
    o.y += speed * dt;
  }
  // remove passed
  obstacles = obstacles.filter(o=>{
    if (o.y > canvas.height + 200) { score += 10; return false; }
    return true;
  });
  // spawn
  spawnTimer += dt;
  if (spawnTimer > 1.0){
    spawnTimer = 0;
    spawnObstacle();
  }
  // increase difficulty gradually
  speed += dt * 3;
  // check collision
  const px = lanes[player.lane]*canvas.width;
  const py = canvas.height - 160;
  for(let o of obstacles){
    const ox = o.x;
    const oy = o.y;
    const dx = Math.abs(ox - px);
    const dy = Math.abs(oy - py);
    if (dx < (o.w*0.5 + player.w*0.5) && dy < (o.h*0.5 + player.h*0.5)){
      // hit - reset game
      obstacles = [];
      speed = 200;
      score = 0;
      spawnTimer = 0;
      break;
    }
  }
}

function draw(){
  // background - repeat simple bg
  const bg = images['bg.png'];
  if (bg.complete) {
    const patternW = bg.width;
    const patternH = bg.height;
    // draw a scaled background
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height*0.45);
    // draw road area (simple)
    ctx.fillStyle = '#666';
    ctx.fillRect(0, canvas.height*0.45, canvas.width, canvas.height*0.55);
  } else {
    ctx.fillStyle = '#7ec0ee';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  // draw lanes markers
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 4;
  for (let i=1;i<3;i++){
    const x = lanes[i]*canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height*0.45);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // draw obstacles
  for(let o of obstacles){
    const img = images[o.type==='excavator' ? 'excavator.png' : 'cone.png'];
    const drawX = o.x - o.w*0.5;
    const drawY = o.y;
    if (img.complete) ctx.drawImage(img, drawX, drawY, o.w, o.h);
    else {
      ctx.fillStyle = 'orange';
      ctx.fillRect(drawX,drawY,o.w,o.h);
    }
  }

  // draw player
  const pimg = images['player.png'];
  const px = lanes[player.lane]*canvas.width - player.w*0.5;
  const py = canvas.height - 160;
  if (pimg.complete) ctx.drawImage(pimg, px, py, player.w, player.h);
  else {
    ctx.fillStyle = '#ffcc88';
    ctx.fillRect(px,py,player.w,player.h);
  }
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: '+score, 14, 28);
}

function loop(ts){
  const dt = Math.min(0.05, (ts - last)/1000);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

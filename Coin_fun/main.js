/*
Simple vertical jumper optimized for mobile screens.
Features:
- Fullscreen canvas scaled by devicePixelRatio
- Zoom locked via meta viewport and touch-action
- Character is an image (char.png); background (bg.png)
- Jump strength increases slightly with score (you go higher as you progress)
- Tap to jump; also supports Space/Click for desktop testing
- All files in root for easy zipping
*/
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

function resize(){
  DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(DPR,0,0,DPR,0,0); // scale drawing to CSS pixels
}
window.addEventListener('resize', resize);
resize();

// prevent pinch-zoom and double-tap zoom on some browsers
window.addEventListener('touchstart', function(e){
  if (e.touches.length > 1) e.preventDefault();
}, {passive:false});
window.addEventListener('gesturestart', function(e){ e.preventDefault(); });

// load images
const charImg = new Image();
charImg.src = 'char.png'; // included in zip
const bgImg = new Image();
bgImg.src = 'bg.png';

// game state
let score = 0;
let player = {
  x: window.innerWidth/2,
  y: window.innerHeight - 120,
  vy: 0,
  w: 48,
  h: 48,
  grounded: false
};
let platforms = [];
let scrollY = 0;
let running = true;

// create initial platforms
function makeInitialPlatforms(){
  platforms = [];
  const baseY = window.innerHeight - 40;
  platforms.push({x: window.innerWidth/2 - 60, y: baseY, w: 120, h: 14});
  for(let i=1;i<10;i++){
    platforms.push({x: Math.random()*(window.innerWidth-140)+20, y: baseY - i*120, w: 100, h: 12});
  }
}
makeInitialPlatforms();

function jump(strength){
  player.vy = -strength;
  player.grounded = false;
}

function spawnPlatform(y){
  platforms.push({x: Math.random()*(window.innerWidth-140)+20, y: y, w: 100 + Math.random()*60, h: 12});
}

// game loop
function update(dt){
  // gravity
  player.vy += 1200 * dt; // px/s^2
  player.y += player.vy * dt;

  // horizontal clamp (simple)
  if(player.x < 24) player.x = 24;
  if(player.x > window.innerWidth - 24) player.x = window.innerWidth - 24;

  // collision with platforms (only if falling)
  if(player.vy > 0){
    for(let p of platforms){
      if(player.x + player.w/2 > p.x && player.x - player.w/2 < p.x + p.w){
        if(player.y + player.h/2 > p.y && player.y + player.h/2 < p.y + p.h + 20){
          // land
          player.y = p.y - player.h/2;
          player.vy = 0;
          player.grounded = true;
        }
      }
    }
  }

  // if player goes above a threshold, scroll platforms down (player moves up visually)
  const threshold = window.innerHeight * 0.35;
  if(player.y < threshold){
    const dy = threshold - player.y;
    player.y = threshold;
    scrollY += dy;
    // move platforms down
    for(let p of platforms){
      p.y += dy;
    }
    // increase score based on scroll
    score += Math.floor(dy/10);
    // spawn new platforms above
    while(platforms.length < 12){
      const minY = Math.min(...platforms.map(p=>p.y));
      spawnPlatform(minY - 120);
    }
  }

  // if player falls below screen, game over and reset small to allow continuation
  if(player.y - player.h/2 > window.innerHeight){
    // reset
    if(score > 0) {
      // softer reset so user can continue; but keep score
      player.y = window.innerHeight - 120;
      player.vy = 0;
      makeInitialPlatforms();
    } else {
      player.y = window.innerHeight - 120;
      player.vy = 0;
      makeInitialPlatforms();
      score = 0;
    }
    scrollY = 0;
  }
}

function draw(){
  // clear
  // draw background image tiled vertically based on scrollY
  const patternH = bgImg.height;
  const count = Math.ceil(window.innerHeight / patternH) + 1;
  for(let i= -1; i<count; i++){
    ctx.drawImage(bgImg, 0, i*patternH + (-(scrollY%patternH)), window.innerWidth, patternH);
  }

  // draw platforms
  ctx.fillStyle = 'rgba(40,40,40,0.95)';
  for(let p of platforms){
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  // draw player (image centered)
  ctx.drawImage(charImg, player.x - player.w/2, player.y - player.h/2, player.w, player.h);

  // overlay text handled outside
  document.getElementById('score').textContent = 'Score: ' + Math.floor(score);
}

let lastTime = performance.now();
function loop(now){
  if(!running) return;
  const dt = Math.min(1/30, (now - lastTime)/1000);
  update(dt);
  draw();
  lastTime = now;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// input - tap to jump
function touchJump(){
  // Jump strength increases with score so you go higher as you progress.
  // base strength
  const base = 520;
  const bonus = Math.min(0.7, score/2000); // small scaling - avoids runaway
  const strength = base * (1 + bonus);
  jump(strength);
}
window.addEventListener('touchstart', function(e){
  e.preventDefault();
  touchJump();
}, {passive:false});
window.addEventListener('mousedown', function(e){ touchJump(); });
window.addEventListener('keydown', function(e){ if(e.code === 'Space') touchJump(); });

// simple tilt control (optional) - allow deviceorientation to move player
window.addEventListener('deviceorientation', function(e){
  if(e.gamma !== null){
    // gamma: left/right tilt in degrees, clamp roughly -45..45
    const max = 30;
    let gx = Math.max(-max, Math.min(max, e.gamma));
    // map to screen x
    const center = window.innerWidth/2;
    // small influence: smoother movement
    player.x += gx * 0.8;
  }
});

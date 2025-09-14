
/* Pulse Strike — lightweight action canvas game
   Single-file, no external libs. Designed for crisp visuals and fast gameplay.
*/
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 1280, H = 720;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // assets
  const playerImg = new Image();
  playerImg.src = "data:image/svg+xml;base64,CjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nMTI4JyBoZWlnaHQ9JzEyOCcgdmlld0JveD0nMCAwIDEyOCAxMjgnPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSdnMScgeDE9JzAnIHgyPScxJyB5MT0nMCcgeTI9JzEnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyM3ZmZmZDQnIC8+CiAgICAgIDxzdG9wIG9mZnNldD0nMScgc3RvcC1jb2xvcj0nIzAwYjRmZicgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSdmMScgeD0nLTUwJScgeT0nLTUwJScgd2lkdGg9JzIwMCUnIGhlaWdodD0nMjAwJSc+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249JzIuOCcgcmVzdWx0PSdiJy8+CiAgICAgIDxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj0nYicvPjxmZU1lcmdlTm9kZSBpbj0nU291cmNlR3JhcGhpYycvPjwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8ZyBmaWx0ZXI9J3VybCgjZjEpJz4KICAgIDxwYXRoIGQ9J002NCA4IEw4NCA0OCBMNjQgNDAgTDQ0IDQ4IFonIGZpbGw9J3VybCgjZzEpJyBzdHJva2U9JyNiZmYnIHN0cm9rZS13aWR0aD0nMicvPgogICAgPGNpcmNsZSBjeD0nNjQnIGN5PSc2NCcgcj0nMjInIGZpbGw9JyMwNDE4MjcnIG9wYWNpdHk9JzAuNicgLz4KICAgIDxwYXRoIGQ9J000NiA3MCBDNTQgODYsNzQgODYsODIgNzAnIHN0cm9rZT0nIzlmZicgc3Ryb2tlLXdpZHRoPSczJyBzdHJva2UtbGluZWNhcD0ncm91bmQnIGZpbGw9J25vbmUnLz4KICA8L2c+Cjwvc3ZnPgo=";
  const enemyImg = new Image();
  enemyImg.src = "data:image/svg+xml;base64,CjxzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB3aWR0aD0nMTI4JyBoZWlnaHQ9JzEyOCcgdmlld0JveD0nMCAwIDEyOCAxMjgnPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSdnMicgeDE9JzAnIHgyPScxJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyNmZjdiN2InLz48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyNmZjFmN2InLz48L2xpbmVhckdyYWRpZW50PgogICAgPGZpbHRlciBpZD0nZjInPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249JzEuNicgcmVzdWx0PSdiJy8+PGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPSdiJy8+PGZlTWVyZ2VOb2RlIGluPSdTb3VyY2VHcmFwaGljJy8+PC9mZU1lcmdlPjwvZmlsdGVyPgogIDwvZGVmcz4KICA8ZyBmaWx0ZXI9J3VybCgjZjIpJz4KICAgIDxjaXJjbGUgY3g9JzY0JyBjeT0nNDQnIHI9JzMwJyBmaWxsPSd1cmwoI2cyKScgc3Ryb2tlPScjZmZlMGViJyBzdHJva2Utd2lkdGg9JzInLz4KICAgIDxwYXRoIGQ9J00zMCA4NCBDNDQgMTEwLDg0IDExMCw5OCA4NCcgc3Ryb2tlPScjZmZiM2QxJyBzdHJva2Utd2lkdGg9JzQnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgZmlsbD0nbm9uZScvPgogICAgPGNpcmNsZSBjeD0nNTInIGN5PSc0MCcgcj0nNScgZmlsbD0nIzBiMDcxMCcvPgogICAgPGNpcmNsZSBjeD0nNzYnIGN5PSc0MCcgcj0nNScgZmlsbD0nIzBiMDcxMCcvPgogIDwvZz4KPC9zdmc+Cg==";

  // game state
  let running = false;
  let score = 0;
  let hp = 100;
  let keys = {}, mouse = {x:0,y:0,pressed:false};
  let bullets = [], enemies = [], particles = [], stars = [];
  let lastTime = 0, spawnTimer = 0, wave = 1, shake = 0;

  function resize() {
    // fit to window while preserving aspect ratio
    const maxW = Math.max(window.innerWidth-20, 480);
    const maxH = Math.max(window.innerHeight-20, 360);
    const targetRatio = 16/9;
    let w = maxW, h = Math.round(w/targetRatio);
    if (h > maxH) { h = maxH; w = Math.round(h*targetRatio); }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    // internal resolution
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    W = canvas.width; H = canvas.height;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function initStars() {
    stars = [];
    for (let i=0;i<120;i++) stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.6+0.3, speed: (0.2+Math.random()*0.6)});
  }

  const player = { x: 200, y: 200, r: 26, ang:0, speed: 260 };

  function spawnEnemy() {
    const edge = Math.floor(Math.random()*4);
    let x,y;
    if(edge===0) { x = -80; y = Math.random()*H; }
    else if(edge===1) { x = W+80; y = Math.random()*H; }
    else if(edge===2) { x = Math.random()*W; y = -80; }
    else { x = Math.random()*W; y = H+80; }
    const s = 0.6 + Math.random()*1.2 + Math.min(0.6, wave*0.06);
    const hp = Math.round(12 + wave*2 + Math.random()*12);
    enemies.push({x,y,vx:0,vy:0,speed:60*s, r:20*s, hp:hp, maxHp:hp});
  }

  function fireBullet(x,y,dx,dy) {
    bullets.push({x:x,y:y,vx:dx*820,vy:dy*820,ttl:1.6});
  }

  // inputs
  window.addEventListener('keydown', e => { keys[e.code]=true; if(e.code==='Enter'&&!running) startGame(); });
  window.addEventListener('keyup', e => { keys[e.code]=false; });
  canvas.addEventListener('mousemove', e => { const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width/rect.width; const scaleY = canvas.height/rect.height; mouse.x = (e.clientX - rect.left) * scaleX / DPR; mouse.y = (e.clientY - rect.top) * scaleY / DPR; });
  canvas.addEventListener('mousedown', e => { mouse.pressed=true; });
  canvas.addEventListener('mouseup', e => { mouse.pressed=false; });
  canvas.addEventListener('touchstart', e=>{ if(e.touches.length) { e.preventDefault(); const t=e.touches[0]; const rect=canvas.getBoundingClientRect(); const scaleX = canvas.width/rect.width; const scaleY = canvas.height/rect.height; mouse.x=(t.clientX-rect.left)*scaleX/DPR; mouse.y=(t.clientY-rect.top)*scaleY/DPR; mouse.pressed=true; } }, {passive:false});
  canvas.addEventListener('touchmove', e=>{ if(e.touches.length) { e.preventDefault(); const t=e.touches[0]; const rect=canvas.getBoundingClientRect(); const scaleX = canvas.width/rect.width; const scaleY = canvas.height/rect.height; mouse.x=(t.clientX-rect.left)*scaleX/DPR; mouse.y=(t.clientY-rect.top)*scaleY/DPR; } }, {passive:false});
  canvas.addEventListener('touchend', e=>{ mouse.pressed=false; }, {passive:false});

  // helpers
  function rand(min,max) { return min + Math.random()*(max-min); }
  function clamp(v,a,b) { return Math.max(a, Math.min(b, v)); }

  function update(dt) {
    // player movement
    let mx = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) my += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    // touchscreen: drag to move (if touching left half)
    if (mouse.pressed && mouse.x < W*0.5) { const tx = mouse.x, ty=mouse.y; const dirx = tx - player.x; const diry = ty - player.y; const dist = Math.hypot(dirx,diry); if(dist>6) { mx = dirx/dist; my = diry/dist; } }
    if (mx!==0 || my!==0) { const len = Math.hypot(mx,my); player.x += (mx/len) * player.speed * dt; player.y += (my/len) * player.speed * dt; }
    // clamp player
    player.x = clamp(player.x, 40, W-40);
    player.y = clamp(player.y, 40, H-40);

    // aim angle to mouse
    const ax = mouse.x - player.x, ay = mouse.y - player.y;
    player.ang = Math.atan2(ay,ax);

    // shooting (mouse or touch right half or keyboard)
    if ((mouse.pressed && mouse.x >= W*0.5) || keys['Space']) {
      // simple shot cooldown
      if (!player._cool) player._cool = 0;
      player._cool -= dt;
      if (player._cool <= 0) { 
        const nx = Math.cos(player.ang), ny = Math.sin(player.ang);
        fireBullet(player.x + nx*28, player.y + ny*28, nx, ny);
        player._cool = 0.12;
      }
    } else player._cool = 0;

    // bullets
    for (let i=bullets.length-1;i>=0;i--) {
      const b = bullets[i];
      b.ttl -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // trail particle
      particles.push({x:b.x - b.vx*dt*0.5, y:b.y - b.vy*dt*0.5, vx: -b.vx*0.02+rand(-8,8), vy: -b.vy*0.02+rand(-8,8), life:0.18+Math.random()*0.2, r:1.4});
      if (b.ttl <= 0 || b.x<-50 || b.x>W+50 || b.y<-50 || b.y>H+50) bullets.splice(i,1);
    }

    // enemies
    spawnTimer += dt;
    const spawnInterval = Math.max(0.6, 1.8 - Math.min(1.4, wave*0.06));
    if (spawnTimer > spawnInterval) { spawnTimer = 0; spawnEnemy(); if(Math.random()<0.3) spawnEnemy(); }

    for (let i=enemies.length-1;i>=0;i--) {
      const e = enemies[i];
      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx,dy) || 1;
      e.vx = dx/d * e.speed; e.vy = dy/d * e.speed;
      e.x += e.vx * dt; e.y += e.vy * dt;

      // collision with player
      if (Math.hypot(e.x-player.x,e.y-player.y) < e.r + player.r - 6) {
        // damage
        hp -= 12; shake = 12; createParticles(player.x,player.y,18,6);
        enemies.splice(i,1);
        if (hp <= 0) gameOver();
      }

      // bullet collisions
      for (let j=bullets.length-1;j>=0;j--) {
        const b = bullets[j];
        if (Math.hypot(b.x-e.x,b.y-e.y) < e.r+4) {
          bullets.splice(j,1);
          e.hp -= 10 + Math.floor(Math.random()*8);
          createParticles(b.x,b.y,6,4);
          if (e.hp <= 0) { 
            // enemy die
            score += 8 + Math.floor(Math.random()*8);
            createParticles(e.x,e.y,24,10);
            enemies.splice(i,1);
            // small chance drop heal
            if (Math.random() < 0.12) { hp = Math.min(100, hp+12); }
            break;
          }
        }
      }
    }

    // particles
    for (let i=particles.length-1;i>=0;i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i,1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.98; p.vy *= 0.98;
    }

    // background stars movement
    for (let s of stars) { s.x -= s.speed * dt*50; if (s.x < -6) s.x = W + 6; }

    // wave progression
    if (score > wave*60) { wave++; }
  }

  function createParticles(x,y,count,spread) {
    for (let i=0;i<count;i++) {
      const ang = Math.random()*Math.PI*2;
      const s = Math.random()*spread;
      particles.push({x:x + Math.cos(ang)*s*0.3, y:y + Math.sin(ang)*s*0.3, vx:Math.cos(ang)*rand(60,280), vy:Math.sin(ang)*rand(60,280), life:0.4+Math.random()*0.8, r:2+Math.random()*3});
    }
  }

  function drawRoundedRect(x,y,w,h,r) { ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function draw(dt) {
    // clear
    ctx.clearRect(0,0,W,DPR*H/DPR);
    // background gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#071122'); g.addColorStop(1,'#001018');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // parallax stars
    for (let i=0;i<stars.length;i++) {
      const s = stars[i]; const sx = s.x + (i%3)*0.2*player.x*0.001;
      ctx.beginPath(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.arc(sx, s.y, s.r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    }

    // optional screen shake
    ctx.save();
    if (shake > 0) { const shx = (Math.random()-0.5)*shake; const shy = (Math.random()-0.5)*shake; ctx.translate(shx, shy); shake = Math.max(0, shake - 40*dt); }

    // draw bullets with glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let b of bullets) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(180,255,255,0.85)';
      ctx.filter = 'blur(6px)';
      ctx.arc(b.x, b.y, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.beginPath();
      ctx.fillStyle = 'rgba(200,255,255,1)';
      ctx.arc(b.x, b.y, 2.6,0,Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // draw enemies (with shadow/glow)
    for (let e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(0);
      const s = (e.r/28);
      ctx.globalAlpha = 0.98;
      ctx.filter = 'drop-shadow(0 6px 10px rgba(255,60,100,0.12))';
      ctx.drawImage(enemyImg, -48*s, -48*s, 96*s, 96*s);
      ctx.filter = 'none';
      // hp bar
      ctx.beginPath();
      const bw = 46*s;
      drawRoundedRect(-bw/2, -e.r-18, bw, 6, 3); ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fill();
      ctx.beginPath(); drawRoundedRect(-bw/2, -e.r-18, bw*(e.hp/e.maxHp), 6, 3); ctx.fillStyle='rgba(255,120,140,0.95)'; ctx.fill();
      ctx.restore();
    }

    // draw particles (glowing)
    ctx.save();
    for (let p of particles) {
      const a = Math.max(0, p.life/1.2);
      ctx.beginPath();
      ctx.globalAlpha = Math.min(1,0.9*a);
      ctx.filter = 'blur(6px)';
      ctx.fillStyle = 'rgba(255,190,120,0.85)';
      ctx.arc(p.x, p.y, p.r*1.8, 0, Math.PI*2); ctx.fill();
      ctx.filter = 'none';
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.arc(p.x, p.y, Math.max(0.6,p.r*0.4), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // draw player (with core glow)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.ang);
    ctx.filter = 'drop-shadow(0 10px 18px rgba(0,200,255,0.12))';
    ctx.drawImage(playerImg, -36, -36, 72, 72);
    ctx.filter = 'none';
    // engine glow under player
    ctx.beginPath(); ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(0,200,255,0.12)'; ctx.arc(0,22,26,0,Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.restore();

    ctx.restore();

    // HUD update drawn in DOM by main loop
    document.getElementById('score-val').textContent = score;
    document.getElementById('hp-val').textContent = Math.max(0, Math.floor(hp));
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min(0.033, (ts - lastTime)/1000);
    lastTime = ts;
    if (running) update(dt);
    draw(dt);
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('subtitle').textContent = 'Game Over — Score: ' + score + ' — Press Enter to play again';
  }

  function startGame() {
    // reset state
    score = 0; hp = 100; wave = 1; bullets=[]; enemies=[]; particles=[]; spawnTimer=0; shake=0;
    player.x = W/2; player.y = H/2;
    running = true;
    document.getElementById('overlay').classList.add('hidden');
  }

  // initial setup
  resize();
  initStars();
  window.addEventListener('resize', () => { resize(); initStars(); });

  // hook overlay buttons
  document.getElementById('start').addEventListener('click', startGame);
  document.getElementById('download').addEventListener('click', () => { window.location.href = 'action_game.zip'; });

  // start animation loop
  requestAnimationFrame(loop);

  // expose for debug
  window.PulseStrike = { start: startGame, stop: () => running=false };
})();

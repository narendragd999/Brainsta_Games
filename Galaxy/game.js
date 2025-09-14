
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 1080, H = 608;

  // assets
  const ASSET_BASE = 'assets/';
  const bgImg = new Image(); bgImg.src = ASSET_BASE + 'background.png';
  const playerImg = new Image(); playerImg.src = ASSET_BASE + 'player.png';
  const enemyImg = new Image(); enemyImg.src = ASSET_BASE + 'enemy.png';

  const shotAudio = new Audio(ASSET_BASE + 'shot.wav');
  const hitAudio = new Audio(ASSET_BASE + 'hit.wav');
  const explAudio = new Audio(ASSET_BASE + 'explosion.wav');

  let running = false, lastTime = 0;
  let player = { x: 360, y: 304, r: 30, ang: 0, vx: 0, vy: 0, speed: 320 };
  let bullets = [], enemies = [], particles = [], stars = [];
  let spawnTimer = 0, wave = 1;
  let moveVector = { x: 0, y: 0 };
  let firing = false, fireCooldown = 0;

  // UI elements for joystick
  const joystickEl = document.getElementById('left-joystick');
  const stickEl = joystickEl.querySelector('.stick');
  const fireBtn = document.getElementById('fire-btn');
  const overlay = document.getElementById('overlay');

  function resize() {
    const w = Math.max(window.innerWidth, 360);
    const h = Math.max(window.innerHeight, 360);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    W = canvas.width; H = canvas.height;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function initStars() { stars = []; for (let i=0;i<140;i++) stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.6+0.4, speed: 0.3+Math.random()*1.2 }); }

  // pointer/joystick handling (pointer events give best compatibility)
  let pointerId = null;
  joystickEl.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    joystickEl.setPointerCapture(ev.pointerId);
    pointerId = ev.pointerId;
    updateStick(ev.clientX, ev.clientY);
  });
  window.addEventListener('pointermove', (ev) => {
    if (pointerId === ev.pointerId) {
      updateStick(ev.clientX, ev.clientY);
    }
  });
  window.addEventListener('pointerup', (ev) => {
    if (pointerId === ev.pointerId) {
      resetStick();
      try { joystickEl.releasePointerCapture(ev.pointerId); } catch(e) {}
      pointerId = null;
    }
  });

  // also support touchstart/touchmove for older browsers
  joystickEl.addEventListener('touchstart', (ev) => { ev.preventDefault(); const t = ev.changedTouches[0]; updateStick(t.clientX, t.clientY); }, {passive:false});
  joystickEl.addEventListener('touchmove', (ev) => { ev.preventDefault(); const t = ev.changedTouches[0]; updateStick(t.clientX, t.clientY); }, {passive:false});
  joystickEl.addEventListener('touchend', (ev) => { ev.preventDefault(); resetStick(); }, {passive:false});

  function updateStick(clientX, clientY) {
    const rect = joystickEl.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    const dx = clientX - centerX, dy = clientY - centerY;
    const dist = Math.hypot(dx,dy) || 1;
    const max = rect.width * 0.36;
    const nx = dx/dist, ny = dy/dist;
    const clamped = Math.min(dist, max);
    // move CSS stick (in px)
    stickEl.style.transform = `translate(${nx*clamped*0.5}px, ${ny*clamped*0.5}px)`;
    // compute normalized move vector (0..1)
    moveVector.x = (clamped/max) * nx;
    moveVector.y = (clamped/max) * ny;
  }

  function resetStick() {
    stickEl.style.transform = 'translate(0px, 0px)';
    moveVector.x = 0; moveVector.y = 0;
  }

  // fire button pointer events
  fireBtn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); startFiring(); });
  fireBtn.addEventListener('pointerup', (ev) => { ev.preventDefault(); stopFiring(); });
  fireBtn.addEventListener('touchstart', (ev) => { ev.preventDefault(); startFiring(); }, {passive:false});
  fireBtn.addEventListener('touchend', (ev) => { ev.preventDefault(); stopFiring(); }, {passive:false});

  // allow mouse click as fallback
  canvas.addEventListener('mousedown', (e) => { startFiring(); });
  canvas.addEventListener('mouseup', (e) => { stopFiring(); });

  function playShot() { try { shotAudio.currentTime = 0; shotAudio.play(); } catch(e){} }
  function playHit() { try { hitAudio.currentTime = 0; hitAudio.play(); } catch(e){} }
  function playExplosion() { try { explAudio.currentTime = 0; explAudio.play(); } catch(e){} }

  function fireBullet(x,y,dx,dy) { bullets.push({ x:x, y:y, vx:dx*920, vy:dy*920, ttl:1.6 }); playShot(); }

  function startFiring() { firing = true; }
  function stopFiring() { firing = false; }

  function spawnEnemy() {
    const edge = Math.floor(Math.random()*4);
    let x,y;
    if(edge===0){ x=-120; y=Math.random()*H; }
    else if(edge===1){ x=W+120; y=Math.random()*H; }
    else if(edge===2){ x=Math.random()*W; y=-120; }
    else { x=Math.random()*W; y=H+120; }
    const s = 0.8 + Math.random()*1.3 + Math.min(0.6, wave*0.06);
    const hpE = Math.round(14 + wave*2 + Math.random()*14);
    enemies.push({ x,y,vx:0,vy:0,speed:60*s,r:20*s,hp:hpE,maxHp:hpE, spawn:1 });
  }

  function createParticles(x,y,count,spread) {
    for (let i=0;i<count;i++){ const ang=Math.random()*Math.PI*2; const sp=Math.random()*spread; const speed=40+Math.random()*260; particles.push({ x:x+Math.cos(ang)*sp*0.2, y:y+Math.sin(ang)*sp*0.2, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:0.4+Math.random()*0.9, r:2+Math.random()*3 }); }
  }

  function update(dt) {
    // movement via moveVector (set by joystick)
    const tx = moveVector.x, ty = moveVector.y;
    const targetVx = tx * player.speed, targetVy = ty * player.speed;
    player.vx += (targetVx - player.vx) * Math.min(dt*10,1);
    player.vy += (targetVy - player.vy) * Math.min(dt*10,1);
    player.x += player.vx * dt; player.y += player.vy * dt;
    player.x = Math.max(48, Math.min(W-48, player.x)); player.y = Math.max(48, Math.min(H-48, player.y));

    // aim: if firing, aim toward right half center of screen; otherwise keep current angle (makes shooting intuitive)
    let aimX = player.x + 1, aimY = player.y;
    // pick active fire touch position from touch events if available
    // (we don't require it; aiming toward right-half center works well on mobile)
    aimX = Math.max(player.x + 1, W * 0.75);
    const ang = Math.atan2(aimY - player.y, aimX - player.x);
    player.ang = ang;

    // firing auto while held
    fireCooldown -= dt;
    if (firing && fireCooldown <= 0) {
      const nx = Math.cos(player.ang), ny = Math.sin(player.ang);
      fireBullet(player.x + nx*34, player.y + ny*34, nx, ny);
      fireCooldown = 0.12;
    }

    // bullets
    for (let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.ttl -= dt; b.x += b.vx*dt; b.y += b.vy*dt; if (b.ttl <= 0 || b.x < -60 || b.x > W+60 || b.y < -60 || b.y > H+60) bullets.splice(i,1); }

    // enemies spawn and update
    spawnTimer += dt;
    const spawnInterval = Math.max(0.6, 1.6 - Math.min(1.2, wave*0.06));
    if (spawnTimer > spawnInterval) { spawnTimer = 0; spawnEnemy(); if (Math.random() < 0.35) spawnEnemy(); }

    for (let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      if (e.spawn > 0) e.spawn = Math.max(0, e.spawn - dt*2.2);
      const dx = player.x - e.x, dy = player.y - e.y; const d = Math.hypot(dx,dy) || 1;
      const txv = dx/d * e.speed, tyv = dy/d * e.speed;
      e.vx += (txv - e.vx) * Math.min(dt*2.6, 1);
      e.vy += (tyv - e.vy) * Math.min(dt*2.6, 1);
      e.x += e.vx * dt; e.y += e.vy * dt;

      if (Math.hypot(e.x-player.x, e.y-player.y) < e.r + player.r - 8) {
        // hit player
        createParticles(player.x, player.y, 20, 10);
        enemies.splice(i,1);
        try { playHit(); } catch(e){}
        // no HP tracking to simplify - you can add hp logic here
        continue;
      }

      // bullet collisions
      for (let j=bullets.length-1;j>=0;j--){
        const b = bullets[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 6){
          bullets.splice(j,1);
          e.hp -= 12 + Math.floor(Math.random()*8);
          createParticles(b.x, b.y, 8, 6);
          if (e.hp <= 0){
            createParticles(e.x, e.y, 28, 14);
            enemies.splice(i,1);
            try { playExplosion(); } catch(e) {}
            if (Math.random() < 0.12) { /* heal logic omitted */ }
            break;
          } else {
            try { playHit(); } catch(e) {}
          }
        }
      }
    }

    // particles update
    for (let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i,1); continue; } p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= 0.992; p.vy *= 0.992; }

    // stars move
    for (let s of stars) { s.x -= s.speed * dt * 50; if (s.x < -6) s.x = W + 6; }

    if (/*score*/ false) { /* wave progression here if needed */ }
  }

  function draw() {
    // clear with background image for richer visuals
    if (bgImg.complete) {
      // draw scaled to cover
      const img = bgImg;
      const ratio = Math.max(W/img.width, H/img.height);
      const iw = img.width * ratio, ih = img.height * ratio;
      ctx.drawImage(img, (W - iw)/2, (H - ih)/2, iw, ih);
    } else {
      ctx.fillStyle = '#071427';
      ctx.fillRect(0,0,W,H);
    }

    // stars
    for (let s of stars) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill(); }

    // bullets glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let b of bullets) { ctx.beginPath(); ctx.arc(b.x,b.y,6,0,Math.PI*2); ctx.fillStyle='rgba(180,255,255,0.95)'; ctx.fill(); ctx.beginPath(); ctx.arc(b.x,b.y,2.6,0,Math.PI*2); ctx.fillStyle='white'; ctx.fill(); }
    ctx.restore();

    // enemies
    for (let e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const s = Math.max(0.1, 1 - e.spawn);
      ctx.drawImage(enemyImg, -48*s, -48*s, 96*s, 96*s);
      ctx.restore();
    }

    // particles
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*1.8, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,200,140,0.9)';
      ctx.fill();
    }
    ctx.restore();

    // player
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.ang); ctx.drawImage(playerImg, -48, -48, 96, 96); ctx.restore();
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min(0.033, (ts - lastTime)/1000);
    lastTime = ts;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    // hide overlay reliably
    overlay.classList.remove('overlay-visible');
    overlay.classList.add('overlay-hidden');
    overlay.style.display = 'none';
    // reset
    bullets = []; enemies = []; particles = []; stars = []; spawnTimer = 0; wave = 1;
    player.x = W/2; player.y = H/2; player.vx = 0; player.vy = 0;
    running = true;
    // ensure audio unlocked
    try { shotAudio.play().then(()=>{ shotAudio.pause(); shotAudio.currentTime = 0; }).catch(()=>{}); } catch(e) {}
  }

  function showOverlay(text) {
    const subtitle = document.getElementById('subtitle');
    if (subtitle) subtitle.textContent = text;
    overlay.style.display = 'flex';
    overlay.classList.add('overlay-visible');
    overlay.classList.remove('overlay-hidden');
  }

  function gameOver() {
    running = false;
    showOverlay('Game Over — Press Start to play again');
  }

  // bindings for start buttons
  document.getElementById('start').addEventListener('click', startGame);
  document.getElementById('start2').addEventListener('click', startGame);
  document.getElementById('download').addEventListener('click', ()=>{ window.location.href = 'action_game_mobile_v2.zip'; });
  document.getElementById('mute').addEventListener('click', ()=>{ try { if (!shotAudio.paused) { shotAudio.pause(); hitAudio.pause(); explAudio.pause(); } else { shotAudio.play().then(()=>shotAudio.pause()); } } catch(e){} });

  // unlock audio on first user tap anywhere
  document.addEventListener('pointerdown', function once() { try { shotAudio.play().then(()=>{ shotAudio.pause(); shotAudio.currentTime=0; }); } catch(e){} document.removeEventListener('pointerdown', once); });

  // init
  resize(); initStars();
  window.addEventListener('resize', () => { resize(); initStars(); });
  requestAnimationFrame(loop);

})();

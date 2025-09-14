
// Compact mobile-friendly game.js
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let DPR = Math.min(window.devicePixelRatio||1, 2);
  let W = 1080, H = 608;

  const playerImg = new Image(); playerImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMjgnIGhlaWdodD0nMTI4JyB2aWV3Qm94PScwIDAgMTI4IDEyOCc+PGNpcmNsZSBjeD0nNjQnIGN5PSc2NCcgcj0nNDAnIGZpbGw9JyMwMGI0ZmYnLz48L3N2Zz4=";
  const enemyImg = new Image(); enemyImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMjgnIGhlaWdodD0nMTI4JyB2aWV3Qm94PScwIDAgMTI4IDEyOCc+PGNpcmNsZSBjeD0nNjQnIGN5PSc0NCcgcj0nMzAnIGZpbGw9JyNmZjZiNmInLz48L3N2Zz4=";

  let running=false, lastTime=0;
  let player={x:360,y:304,r:30,ang:0,vx:0,vy:0,speed:320};
  let bullets=[], enemies=[], particles=[], stars=[];
  let moveVector={x:0,y:0};
  let firing=false, fireCooldown=0;

  function resize(){
    const w = Math.max(window.innerWidth,360);
    const h = Math.max(window.innerHeight,360);
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    canvas.width = Math.round(w*DPR); canvas.height = Math.round(h*DPR);
    W = canvas.width; H = canvas.height; ctx.setTransform(DPR,0,0,DPR,0,0);
    // joystick center computation (for visuals) happens in CSS-based approach
  }

  function initStars(){ stars=[]; for(let i=0;i<100;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3,speed:0.3+Math.random()*0.7}); }

  function getCanvasPosFromClient(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {x:(clientX-rect.left)*scaleX/DPR, y:(clientY-rect.top)*scaleY/DPR};
  }

  // Minimal touch joystick implementation: track touch on left half
  let activeTouches={}, joystickId=null, fireId=null;
  const joystickEl = document.getElementById('left-joystick');
  const stickEl = joystickEl.querySelector('.stick');
  function handleTouchStart(e){ e.preventDefault(); for(let t of Array.from(e.changedTouches)){ activeTouches[t.identifier] = {x:t.clientX,y:t.clientY}; const vw = window.innerWidth; if (t.clientX < vw*0.45 && joystickId===null){ joystickId = t.identifier; updateStickFromClient(t.clientX,t.clientY); } else if (t.clientX > vw*0.55 && fireId===null){ fireId = t.identifier; startFiring(); } } }
  function handleTouchMove(e){ e.preventDefault(); for(let t of Array.from(e.changedTouches)){ if(!activeTouches[t.identifier]) continue; activeTouches[t.identifier].x = t.clientX; activeTouches[t.identifier].y = t.clientY; if (t.identifier === joystickId) updateStickFromClient(t.clientX,t.clientY); } }
  function handleTouchEnd(e){ e.preventDefault(); for(let t of Array.from(e.changedTouches)){ if(activeTouches[t.identifier]){ if(t.identifier===joystickId){ resetStick(); joystickId=null; } if(t.identifier===fireId){ stopFiring(); fireId=null; } delete activeTouches[t.identifier]; } } }

  function updateStickFromClient(clientX, clientY){
    const pos = getCanvasPosFromClient(clientX, clientY);
    // compute joystick center by reading element rect
    const rect = joystickEl.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const centerX = (rect.left + rect.width/2)*scaleX/DPR;
    const centerY = (rect.top + rect.height/2)*scaleY/DPR;
    const dx = pos.x - centerX, dy = pos.y - centerY;
    const dist = Math.hypot(dx,dy) || 1;
    const max = Math.min(rect.width, rect.height)*0.34*(canvas.width/rect.width);
    const nx = dx/dist, ny = dy/dist;
    const clamped = Math.min(dist, max);
    moveVector.x = (clamped/max)*nx; moveVector.y = (clamped/max)*ny;
    // visual stick move (in CSS pixels)
    const visX = (nx * (clamped*0.6)) / (canvas.width/DPR) * (rect.width/(rect.width)); // simplified
    const visY = (ny * (clamped*0.6)) / (canvas.height/DPR) * (rect.height/(rect.height));
    stickEl.style.transform = `translate(${(nx*clamped*0.22)}px, ${(ny*clamped*0.22)}px)`;
  }
  function resetStick(){ moveVector.x=0; moveVector.y=0; stickEl.style.transform='translate(0px, 0px)'; }

  // firing controls
  function startFiring(){ firing=true; }
  function stopFiring(){ firing=false; }

  function fireBullet(x,y,dx,dy){ bullets.push({x:x,y:y,vx:dx*920,vy:dy*920,ttl:1.6}); playShot(); }

  // simple procedural sounds
  let audioCtx=null;
  function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  function playShot(){ try{ ensureAudio(); const t = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(240,t+0.12); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.18,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.12); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.14); }catch(e){} }
  function playHit(){ try{ ensureAudio(); const t = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(140,t+0.18); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.28,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.5); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.5); }catch(e){} }
  function playExplosion(){ try{ ensureAudio(); const t = audioCtx.currentTime; const bufferSize = audioCtx.sampleRate*0.28; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const data = buffer.getChannelData(0); for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1)*Math.pow(1 - i/bufferSize, 2); const src = audioCtx.createBufferSource(); src.buffer = buffer; const filt = audioCtx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.setValueAtTime(1400,t); filt.frequency.exponentialRampToValueAtTime(500,t+0.25); const g = audioCtx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.7,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.28); src.connect(filt); filt.connect(g); g.connect(audioCtx.destination); src.start(t); src.stop(t+0.32); }catch(e){} }

  // game logic
  function spawnEnemy(){ const edge = Math.floor(Math.random()*4); let x,y; if(edge===0){ x=-120; y=Math.random()*H; } else if(edge===1){ x=W+120; y=Math.random()*H; } else if(edge===2){ x=Math.random()*W; y=-120; } else { x=Math.random()*W; y=H+120; } enemies.push({x,y,vx:0,vy:0,speed:80,r:20,hp:20,maxHp:20}); }

  function update(dt){
    // movement
    const tx = moveVector.x, ty = moveVector.y;
    const targetVx = tx*player.speed, targetVy = ty*player.speed;
    player.vx += (targetVx - player.vx)*clamp(dt*10,0,1);
    player.vy += (targetVy - player.vy)*clamp(dt*10,0,1);
    player.x += player.vx*dt; player.y += player.vy*dt;
    player.x = clamp(player.x,48,W-48); player.y = clamp(player.y,48,H-48);

    // firing auto
    fireCooldown -= dt;
    if (firing && fireCooldown <= 0){ const nx=Math.cos(player.ang), ny=Math.sin(player.ang); fireBullet(player.x+nx*34, player.y+ny*34, nx, ny); fireCooldown = 0.12; }

    // bullets
    for (let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.ttl -= dt; b.x += b.vx*dt; b.y += b.vy*dt; if (b.ttl<=0) bullets.splice(i,1); }

    // spawn
    spawnTimer += dt;
    if (spawnTimer > 1.2){ spawnTimer = 0; spawnEnemy(); }

    // enemies update simple
    for (let i=enemies.length-1;i>=0;i--){ const e = enemies[i]; const dx = player.x - e.x, dy = player.y - e.y; const d = Math.hypot(dx,dy)||1; e.vx += ((dx/d)*e.speed - e.vx)*clamp(dt*3,0,1); e.vy += ((dy/d)*e.speed - e.vy)*clamp(dt*3,0,1); e.x += e.vx*dt; e.y += e.vy*dt;
      if (Math.hypot(e.x-player.x,e.y-player.y) < e.r+player.r-8){ hp -= 12; playHit(); enemies.splice(i,1); if (hp<=0) gameOver(); continue; }
      for (let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if (Math.hypot(b.x-e.x,b.y-e.y) < e.r+6){ bullets.splice(j,1); e.hp -= 12; if (e.hp<=0){ enemies.splice(i,1); playExplosion(); } else playHit(); break; } }
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#071427'); g.addColorStop(1,'#001018'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for (let s of stars){ ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill(); }
    for (let b of bullets){ ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fillStyle='rgba(180,255,255,0.95)'; ctx.fill(); }
    for (let e of enemies){ ctx.drawImage(enemyImg, e.x-36, e.y-36, 72,72); }
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.ang); ctx.drawImage(playerImg,-36,-36,72,72); ctx.restore();
  }

  function loop(ts){ if(!lastTime) lastTime=ts; const dt = Math.min(0.033,(ts-lastTime)/1000); lastTime=ts; if (running) update(dt); draw(); requestAnimationFrame(loop); }

  function gameOver(){ running=false; document.getElementById('overlay').classList.remove('hidden'); }
  function startGame(){ running=true; score=0; hp=100; bullets=[]; enemies=[]; particles=[]; spawnTimer=0; document.getElementById('overlay').classList.add('hidden'); ensureAudio(); }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // input bindings
  window.addEventListener('touchstart', handleTouchStart, {passive:false});
  window.addEventListener('touchmove', handleTouchMove, {passive:false});
  window.addEventListener('touchend', handleTouchEnd, {passive:false});
  window.addEventListener('touchcancel', handleTouchEnd, {passive:false});

  document.getElementById('start').addEventListener('click', startGame);
  document.getElementById('start2').addEventListener('click', startGame);
  document.getElementById('download').addEventListener('click', function(){ window.location.href='action_game_mobile.zip'; });
  document.getElementById('mute').addEventListener('click', function(){ try{ if (audioCtx && audioCtx.state!=='closed') audioCtx.suspend(); else if (audioCtx) audioCtx.resume(); else ensureAudio(); }catch(e){} });

  // fire button handlers for extra reliability on some devices
  const fireBtn = document.getElementById('fire-btn');
  fireBtn.addEventListener('touchstart', function(e){ e.preventDefault(); startFiring(); }, {passive:false});
  fireBtn.addEventListener('touchend', function(e){ e.preventDefault(); stopFiring(); }, {passive:false});

  // init
  resize(); initStars(); requestAnimationFrame(loop);
  window.addEventListener('resize', resize);
})();
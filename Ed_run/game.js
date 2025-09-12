/* Upgraded HD endless runner - uses generated assets in assets/ */
(() => {
  const canvas = document.getElementById('gameCanvas');
  const scoreDiv = document.getElementById('score');
  const coinsDiv = document.getElementById('coins');
  const restartBtn = document.getElementById('restartBtn');
  const instructions = document.getElementById('instructions');

  function fitCanvas(){
    const container = document.getElementById('gameContainer');
    const w = container.clientWidth || Math.min(window.innerWidth,1000);
    const h = container.clientHeight || Math.floor(w * 9/16) || 560;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  const ctx = canvas.getContext('2d');

  // Load images
  const assets = {
    bg1: 'assets/images/bg_layer1.png',
    bg2: 'assets/images/bg_layer2.png',
    bg3: 'assets/images/bg_layer3.png',
    runner: 'assets/images/runner_sprites.png',
    coin: 'assets/images/coin_sprites.png',
    obstacle: 'assets/images/obstacle.png'
  };
  const imgs = {};
  let toLoad = Object.keys(assets).length;
  for(const k in assets){
    const img = new Image();
    img.src = assets[k];
    img.onload = () => { imgs[k] = img; toLoad--; if(toLoad===0) init(); };
    img.onerror = () => { console.error('Failed to load', assets[k]); toLoad--; if(toLoad===0) init(); };
  }

  // Sounds
  const snd = {
    bg: new Audio('assets/sounds/bg_music.wav'),
    jump: new Audio('assets/sounds/jump.wav'),
    coin: new Audio('assets/sounds/coin.wav'),
    over: new Audio('assets/sounds/gameover.wav')
  };
  snd.bg.loop = true;
  snd.bg.volume = 0.45;
  snd.jump.volume = 0.9;
  snd.coin.volume = 0.9;
  snd.over.volume = 1.0;

  // Game state
  let player = { x:120, y:0, w:48, h:72, vy:0, onGround:true, sliding:false, slideTimer:0, frame:0, frameTimer:0 };
  let groundY, gw, gh, scale;
  let obstacles = [], coins = [];
  let obstacleTimer = 0, coinTimer = 0;
  let speed = 4, distance = 0, score = 0, coinCount = 0;
  let running = true, lastTime = 0;

  function init(){
    fitCanvas();
    gw = canvas.width; gh = canvas.height;
    scale = gw / 800;
    groundY = Math.floor(gh * 0.78);
    player.w = Math.max(40, Math.floor(48 * (gw/800)));
    player.h = Math.max(60, Math.floor(72 * (gw/800)));
    player.x = Math.floor(gw * 0.15);
    player.y = groundY - player.h;
    // start bg music
    try { snd.bg.play().catch(()=>{}); } catch(e){}
    resetGame();
    requestAnimationFrame(loop);
  }

  function resetGame(){
    obstacles = []; coins = [];
    obstacleTimer = 900;
    coinTimer = 600;
    speed = 4;
    distance = 0; score = 0; coinCount = 0;
    running = true;
    restartBtn.classList.add('hidden');
    instructions.style.display = 'block';
    lastTime = performance.now();
  }

  function spawnObstacle(){
    const h = 40 + Math.random()*80;
    const w = 40 + Math.random()*60;
    const y = groundY - h;
    obstacles.push({x: gw + 40, y, w, h, passed:false});
  }
  function spawnCoin(){
    const x = gw + 40;
    const y = groundY - 140 - Math.random()*120;
    coins.push({x,y,w:48,h:48,frame:0,frameTimer:0});
  }

  function update(dt){
    speed += 0.0006 * dt;
    // player physics
    if(!player.onGround){
      player.vy += 0.9 * scale;
      player.y += player.vy;
    } else player.vy = 0;
    if(player.y > groundY - player.h){ player.y = groundY - player.h; player.onGround = true; player.vy = 0; }
    else player.onGround = false;

    if(player.sliding){ player.slideTimer -= dt; if(player.slideTimer<=0) player.sliding=false; }

    obstacleTimer -= dt;
    if(obstacleTimer <= 0){ spawnObstacle(); obstacleTimer = 700 + Math.random()*900; }
    coinTimer -= dt;
    if(coinTimer <= 0){ spawnCoin(); coinTimer = 400 + Math.random()*800; }

    for(let i = obstacles.length-1; i>=0; i--){
      const ob = obstacles[i];
      ob.x -= speed * (dt/16);
      if(!ob.passed && ob.x + ob.w < player.x){ ob.passed = true; score += 15; }
      // collision
      const px = player.x; const py = player.y;
      const pw = player.w; const ph = player.sliding ? player.h*0.5 : player.h;
      const pyOff = player.sliding ? player.h*0.5 : 0;
      if(px < ob.x + ob.w && px + pw > ob.x && py + pyOff < ob.y + ob.h && py + pyOff + ph > ob.y){
        running = false;
        restartBtn.classList.remove('hidden');
        instructions.style.display = 'none';
        try { snd.over.play(); } catch(e){}
      }
      if(ob.x + ob.w < -50) obstacles.splice(i,1);
    }

    // coins
    for(let i = coins.length-1; i>=0; i--){
      const c = coins[i];
      c.x -= speed * (dt/16);
      c.frameTimer += dt;
      if(c.frameTimer > 80){ c.frame = (c.frame+1)%6; c.frameTimer = 0; }
      // collect
      if(player.x < c.x + c.w && player.x + player.w > c.x && player.y < c.y + c.h && player.y + player.h > c.y){
        coins.splice(i,1);
        coinCount++;
        try { snd.coin.currentTime = 0; snd.coin.play(); } catch(e){}
      } else if(c.x + c.w < -50) coins.splice(i,1);
    }

    distance += speed * (dt/16);
    score = Math.floor(distance/10) + score;
  }

  function render(){
    ctx.clearRect(0,0,gw,gh);

    // parallax backgrounds
    if(imgs.bg1){ ctx.drawImage(imgs.bg1, -((distance*0.02)%gw), 0, gw, gh); ctx.drawImage(imgs.bg1, gw - ((distance*0.02)%gw), 0, gw, gh); }
    if(imgs.bg2){ ctx.drawImage(imgs.bg2, -((distance*0.04)%gw), gh*0.05, gw, gh*0.6); ctx.drawImage(imgs.bg2, gw - ((distance*0.04)%gw), gh*0.05, gw, gh*0.6); }
    if(imgs.bg3){ ctx.drawImage(imgs.bg3, -((distance*0.08)%gw), gh*0.25, gw, gh*0.45); ctx.drawImage(imgs.bg3, gw - ((distance*0.08)%gw), gh*0.25, gw, gh*0.45); }

    // ground
    ctx.fillStyle = "#6c4d2f";
    ctx.fillRect(0, groundY, gw, gh-groundY);
    ctx.fillStyle = "#7a5a3a";
    ctx.fillRect(0, groundY-12, gw, 12);

    // player sprite
    const frameW = imgs.runner ? imgs.runner.width / 8 : 48;
    const frameH = imgs.runner ? imgs.runner.height : player.h;
    player.frameTimer += 1;
    if(player.frameTimer > 6){ player.frame = (player.frame+1)%8; player.frameTimer = 0; }
    if(imgs.runner){
      const sx = player.frame * frameW;
      ctx.drawImage(imgs.runner, sx, 0, frameW, frameH, player.x, player.y + (player.sliding? player.h*0.5:0), player.w, player.h*(player.sliding?0.5:1));
    } else {
      ctx.fillStyle = "#ff6f61";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // obstacles
    if(imgs.obstacle){
      for(const ob of obstacles) ctx.drawImage(imgs.obstacle, ob.x, ob.y, ob.w, ob.h);
    } else {
      ctx.fillStyle = "#23394d"; for(const ob of obstacles) ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }

    // coins
    if(imgs.coin){
      const cw = imgs.coin.width / 6;
      const ch = imgs.coin.height;
      for(const c of coins){
        const sx = c.frame * cw;
        ctx.drawImage(imgs.coin, sx, 0, cw, ch, c.x, c.y, c.w, c.h);
      }
    }

    // HUD on canvas
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `${16*scale}px Arial`;
    ctx.fillText("Score: " + Math.floor(score), 16*scale, 30*scale);
    ctx.fillText("Coins: " + coinCount, 16*scale, 50*scale);
  }

  function loop(timestamp){
    if(!lastTime) lastTime = timestamp;
    const dt = Math.min(40, timestamp - lastTime);
    lastTime = timestamp;
    if(running){ update(dt); render(); scoreDiv.textContent = "Score: " + Math.floor(score); coinsDiv.textContent = "Coins: " + coinCount; requestAnimationFrame(loop); }
    else { render(); scoreDiv.textContent = "Score: " + Math.floor(score) + "  (Game Over)"; }
  }

  // Controls
  function jump(){
    if(!running) return;
    if(player.onGround){
      player.vy = -14 * scale;
      player.onGround = false;
      try { snd.jump.currentTime = 0; snd.jump.play(); } catch(e) {}
      instructions.style.display = 'none';
    }
  }
  function slide(){
    if(!running) return;
    if(player.onGround && !player.sliding){ player.sliding = true; player.slideTimer = 450; }
  }

  // Touch handling
  let touchStartY = null, touchStartTime = 0;
  canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); const t = e.touches[0]; touchStartY = t.clientY; touchStartTime = performance.now(); }, {passive:false});
  canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); const dt = performance.now() - touchStartTime; if(touchStartY !== null){ const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : touchStartY; const dy = endY - touchStartY; if(dy > 60 && dt < 500){ slide(); } else { jump(); } } touchStartY = null; }, {passive:false});
  canvas.addEventListener('mousedown', ()=> jump());
  window.addEventListener('keydown', (e)=>{ if(e.code==='Space'||e.code==='ArrowUp') jump(); if(e.code==='ArrowDown') slide(); if(e.code==='KeyR') resetGame(); });

  restartBtn.addEventListener('click', ()=> resetGame());

})();

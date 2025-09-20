// Aliens Platformer 2D - simple mobile-first platformer (10 levels)
// Controls: touch buttons or keyboard. Best-effort clone of the Rosebud "Aliens Platformer 2D".
(() => {
  const canvas = document.getElementById('gameCanvas');
  const levelTxt = document.getElementById('level');
  const overlay = document.getElementById('overlay');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const jumpBtn = document.getElementById('jumpBtn');
  const restartBtn = document.getElementById('restartBtn');
  const nextBtn = document.getElementById('nextBtn');

  const ctx = canvas.getContext('2d');
  let W=360,H=600,dpr=Math.max(1,window.devicePixelRatio||1);
  function resize(){
    const rect = canvas.getBoundingClientRect();
    W = Math.max(300, rect.width);
    H = Math.max(300, rect.height);
    canvas.width = Math.floor(W*dpr);
    canvas.height = Math.floor(H*dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize(); window.addEventListener('resize', resize);

  const TOTAL = 10;
  let level = 1;
  let keys = {};
  let touchState = {left:false,right:false,jump:false};

  const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  function tone(freq, time=0.08, vol=0.06){
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type='sine'; o.frequency.value=freq; g.gain.value=vol;
    o.connect(g); g.connect(audioCtx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
    o.stop(audioCtx.currentTime + time + 0.02);
  }

  // Player and level
  let state = {
    player: {x:60,y:0,w:28,h:36,vx:0,vy:0,onGround:false,color:'#2ecc71'},
    platforms: [],
    enemies: [],
    goal: {x:0,y:0,w:28,h:28}
  };

  function makeLevel(n){
    state.platforms = [];
    state.enemies = [];
    state.player.x = 40; state.player.y = 40; state.player.vx = state.player.vy = 0;
    // ground
    state.platforms.push({x:0,y:H-48,w:W,h:48});
    // variable platforms
    const count = 3 + Math.min(6, n);
    for(let i=0;i<count;i++){
      const pw = 80 + Math.random()*120;
      const px = 40 + Math.random()*(W-120-pw);
      const py = 120 + i*(60 + Math.random()*40);
      state.platforms.push({x:px,y:py,w:pw,h:14});
      if(Math.random() > 0.6 && n>2){
        state.enemies.push({x:px+20,y:py-18,w:20,h:20,dir:Math.random()>0.5?1:-1,speed:30 + n*6});
      }
    }
    // goal at far right top-ish
    state.goal.x = W - 64; state.goal.y = 80; levelTxt.textContent = ''+level;
  }

  makeLevel(level);

  // Input handlers
  window.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });

  leftBtn.addEventListener('pointerdown', ()=>{ touchState.left=true; tone(520,0.06,0.04); });
  leftBtn.addEventListener('pointerup', ()=>{ touchState.left=false; });
  rightBtn.addEventListener('pointerdown', ()=>{ touchState.right=true; tone(520,0.06,0.04); });
  rightBtn.addEventListener('pointerup', ()=>{ touchState.right=false; });
  jumpBtn.addEventListener('pointerdown', ()=>{ touchState.jump=true; tone(720,0.06,0.06); setTimeout(()=>touchState.jump=false,160); });
  restartBtn.addEventListener('click', ()=>{ tone(440,0.06,0.06); makeLevel(level); });
  nextBtn.addEventListener('click', ()=>{ level = Math.min(TOTAL, level+1); tone(880,0.08,0.08); makeLevel(level); });

  // simple collision
  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt){
    const moveLeft = keys['a'] || keys['arrowleft'] || touchState.left;
    const moveRight = keys['d'] || keys['arrowright'] || touchState.right;
    const jumpKey = keys['w'] || keys[' '] || touchState.jump;

    // horizontal
    if(moveLeft) state.player.vx = -120;
    else if(moveRight) state.player.vx = 120;
    else state.player.vx *= 0.85;

    // gravity
    state.player.vy += 420 * dt;
    state.player.x += state.player.vx * dt;
    state.player.y += state.player.vy * dt;

    // simple ground & platform collisions
    state.player.onGround = false;
    for(const p of state.platforms){
      if(rectsOverlap({...state.player, y: state.player.y + state.player.vy*dt}, p)){
        // coming from above
        if(state.player.vy > 0 && state.player.y + state.player.h <= p.y + 10){
          state.player.y = p.y - state.player.h;
          state.player.vy = 0;
          state.player.onGround = true;
        } else {
          // hit side - push back
          if(state.player.x < p.x) state.player.x = p.x - state.player.w - 2;
          else state.player.x = p.x + p.w + 2;
          state.player.vx *= -0.2;
        }
      }
    }

    // jump
    if(jumpKey && state.player.onGround){
      state.player.vy = -250;
      state.player.onGround = false;
    }

    // bounds
    if(state.player.x < 8) state.player.x = 8;
    if(state.player.x + state.player.w > W - 8) state.player.x = W - 8 - state.player.w;
    if(state.player.y > H + 80){
      // fell -> restart level
      tone(220,0.12,0.08);
      setTimeout(()=> makeLevel(level), 350);
    }

    // enemies
    for(const e of state.enemies){
      e.x += e.dir * e.speed * dt;
      if(e.x < 8 || e.x + e.w > W - 8) e.dir *= -1;
      // collision with player
      if(rectsOverlap(state.player, e)){
        // if player is falling onto enemy, destroy enemy
        if(state.player.vy > 60){
          // stomp
          const idx = state.enemies.indexOf(e);
          if(idx>=0) state.enemies.splice(idx,1);
          state.player.vy = -160;
          tone(880,0.06,0.06);
        } else {
          // player hit -> restart
          tone(220,0.12,0.08);
          setTimeout(()=> makeLevel(level), 350);
        }
      }
    }

    // goal check
    if(rectsOverlap(state.player, state.goal)){
      // level complete
      tone(1040,0.18,0.12);
      overlay.classList.remove('hidden');
      setTimeout(()=>{
        overlay.classList.add('hidden');
        if(level < TOTAL){
          level++;
          makeLevel(level);
        } else {
          // finished all levels - reset to 1
          level = 1;
          makeLevel(level);
        }
      }, 600);
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // bg
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(255,255,255,0.02)');
    g.addColorStop(1,'rgba(255,255,255,0.06)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // platforms
    for(const p of state.platforms){
      ctx.fillStyle = '#444'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(p.x, p.y, Math.min(60,p.w), p.h);
    }

    // enemies
    for(const e of state.enemies){
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      // eye
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x + e.w/3, e.y + e.h/4, e.w/3, e.h/3);
    }

    // goal
    ctx.fillStyle = '#6a11cb';
    ctx.fillRect(state.goal.x, state.goal.y, state.goal.w, state.goal.h);

    // player
    ctx.fillStyle = state.player.color;
    ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
    // face
    ctx.fillStyle = '#fff'; ctx.fillRect(state.player.x + 6, state.player.y + 8, 6,6);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '12px system-ui, Arial';
    ctx.fillText('Aliens Platformer 2D', 10, 18);
  }

  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.035, (now - last)/1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  // initial resize after DOM settled
  setTimeout(()=>{ resize(); makeLevel(level); }, 120);
})();

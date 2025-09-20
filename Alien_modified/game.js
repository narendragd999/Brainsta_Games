// Themed Aliens Platformer 2D - 10 levels
// Features added per prompt:
// - Gradient background, blue primary & purple secondary buttons
// - White cards, loader overlay with spinner
// - Audio for movement/button presses
// - Drag-to-move support + buttons + keyboard
// - Compact controls, responsive text, optimized sizing
// - Simple flat-icons style (SVG symbols inline used in HTML when needed)

(() => {
  const canvas = document.getElementById('gameCanvas');
  const levelLabel = document.getElementById('level');
  const overlay = document.getElementById('overlay');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnJump = document.getElementById('btnJump');
  const btnRestart = document.getElementById('btnRestart');
  const btnHint = document.getElementById('btnHint');
  const btnSlow = document.getElementById('btnSlow');
  const btnNext = document.getElementById('btnNext');

  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 360, H = 640, dpr = Math.max(1, window.devicePixelRatio || 1);
  function resize(){ const rect = canvas.getBoundingClientRect(); W = Math.max(300, rect.width); H = Math.max(300, rect.height); canvas.width = Math.floor(W*dpr); canvas.height = Math.floor(H*dpr); canvas.style.width = rect.width+'px'; canvas.style.height = rect.height+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);

  // Audio: small UX sounds
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = new AudioCtx();
  function fx(freq=440, dur=0.08, vol=0.07, type='sine'){ const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur); o.stop(audio.currentTime + dur + 0.02); }

  // Game constants
  const TOTAL_LEVELS = 10;
  let level = 1;
  let running = true;
  let slow = false;

  // State
  const state = {
    player: { x:60, y:120, w:28, h:36, vx:0, vy:0, color:'#2ecc71', drag:false, dragOffset:{x:0,y:0} },
    platforms: [],
    enemies: [],
    goal: { x:0, y:0, w:34, h:34, color:'#6a11cb' },
    hintUsed: false
  };

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function makeLevel(n){
    state.platforms = [];
    state.enemies = [];
    state.player.x = 40; state.player.y = 40; state.player.vx = state.player.vy = 0;
    state.hintUsed = false;
    // ground
    state.platforms.push({x:0,y:H-50,w:W,h:50});
    // Platforms increase with level
    const count = 3 + Math.min(6, n);
    for(let i=0;i<count;i++){
      const pw = 80 + Math.random()*120;
      const px = 20 + Math.random()*(W-40-pw);
      const py = 110 + i*(50 + Math.random()*30);
      const moving = (n>3 && Math.random()>0.5);
      state.platforms.push({x:px,y:py,w:pw,h:14,moving,dir:Math.random()>0.5?1:-1,speed:20+ n*6,baseX:px});
      if(Math.random()>0.6 && n>2){
        state.enemies.push({x:px+10,y:py-22,w:22,h:22,dir:Math.random()>0.5?1:-1,speed:30 + n*8});
      }
    }
    state.goal.x = W - 64; state.goal.y = 80;
    levelLabel.textContent = ''+level;
  }

  makeLevel(level);

  // Input
  let keys = {};
  window.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });

  const touch = { left:false, right:false, jump:false };

  btnLeft.addEventListener('pointerdown', ()=>{ touch.left=true; fx(520,0.06,0.04); });
  btnLeft.addEventListener('pointerup', ()=>{ touch.left=false; });
  btnRight.addEventListener('pointerdown', ()=>{ touch.right=true; fx(520,0.06,0.04); });
  btnRight.addEventListener('pointerup', ()=>{ touch.right=false; });
  btnJump.addEventListener('pointerdown', ()=>{ touch.jump=true; fx(760,0.06,0.06); setTimeout(()=>touch.jump=false,160); });
  btnRestart.addEventListener('click', ()=>{ fx(660,0.06,0.06); makeLevel(level); });
  btnHint.addEventListener('click', ()=>{ if(state.hintUsed) return; state.hintUsed=true; fx(880,0.08,0.06); // nudge player toward goal
    const start = Date.now();
    const tInt = setInterval(()=>{ const t=(Date.now()-start)/700; state.player.x += (state.goal.x - state.player.x) * (0.06 + 0.06*t); state.player.y += (state.goal.y - state.player.y) * (0.06 + 0.06*t); if(t>1.2){ clearInterval(tInt); } }, 30);
  });
  btnSlow.addEventListener('click', ()=>{ slow = !slow; fx(slow?300:440,0.06,0.06); btnSlow.classList.toggle('active', slow); });
  btnNext.addEventListener('click', ()=>{ fx(980,0.08,0.09); level = Math.min(TOTAL_LEVELS, level+1); makeLevel(level); });

  // Drag-to-move on canvas
  function getPos(e){ const rect = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - rect.left), y: (t.clientY - rect.top) }; }
  canvas.addEventListener('pointerdown', (e)=>{
    const p = getPos(e);
    const dx = p.x - state.player.x, dy = p.y - state.player.y;
    if(Math.hypot(dx,dy) < Math.max(state.player.w,state.player.h)){
      state.player.drag = true;
      state.player.dragOffset.x = dx; state.player.dragOffset.y = dy;
      fx(920,0.06,0.05);
    }
  });
  window.addEventListener('pointermove', (e)=>{
    if(!state.player.drag) return;
    const p = getPos(e);
    state.player.x = Math.max(8, Math.min(W - state.player.w - 8, p.x - state.player.dragOffset.x));
    state.player.y = Math.max(8, Math.min(H - state.player.h - 8, p.y - state.player.dragOffset.y));
  });
  window.addEventListener('pointerup', (e)=>{
    if(state.player.drag){
      state.player.drag = false;
      // small release impulse
      state.player.vx = (Math.random()-0.5)*80;
      state.player.vy = (Math.random()-0.5)*40;
      fx(520,0.06,0.05);
    }
  });

  // Simple collision helpers
  function overlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update(dt){
    if(!running) return;
    if(slow) dt *= 0.45;

    // moving platforms
    for(const p of state.platforms){
      if(p.moving){
        p.x = p.baseX + Math.sin(Date.now()/700 + p.w) * 30;
      }
    }

    // input
    const left = keys['a'] || keys['arrowleft'] || touch.left;
    const right = keys['d'] || keys['arrowright'] || touch.right;
    const jumpKey = keys['w'] || keys[' '];

    if(left) state.player.vx = -120;
    else if(right) state.player.vx = 120;
    else state.player.vx *= 0.86;

    // gravity & movement, unless dragging
    if(!state.player.drag){
      state.player.vy += 420 * dt;
      state.player.x += state.player.vx * dt;
      state.player.y += state.player.vy * dt;
    } else {
      state.player.vx *= 0.9; state.player.vy *= 0.9;
    }

    // collisions with platforms
    state.player.onGround = false;
    for(const p of state.platforms){
      if(overlap({...state.player, y: state.player.y + state.player.vy*dt}, p)){
        if(state.player.vy > 0 && state.player.y + state.player.h <= p.y + 12){
          state.player.y = p.y - state.player.h;
          state.player.vy = 0;
          state.player.onGround = true;
        } else {
          if(state.player.x < p.x) state.player.x = p.x - state.player.w - 2;
          else state.player.x = p.x + p.w + 2;
          state.player.vx *= -0.2;
        }
      }
    }

    // jump (jump button handled via touch events; keyboard jump)
    if((keys['w'] || keys[' ']) && state.player.onGround){
      state.player.vy = -260;
      fx(780,0.06,0.06);
      state.player.onGround = false;
    }

    // enemies
    for(const e of state.enemies){
      e.x += e.dir * e.speed * dt;
      if(e.x < 8 || e.x + e.w > W - 8) e.dir *= -1;
      if(overlap(state.player, e)){
        if(state.player.vy > 80){
          // stomp
          const idx = state.enemies.indexOf(e); if(idx>=0) state.enemies.splice(idx,1);
          state.player.vy = -160;
          fx(980,0.06,0.06);
        } else {
          // hit -> restart level briefly
          fx(220,0.12,0.08);
          overlay.classList.remove('hidden');
          setTimeout(()=>{ overlay.classList.add('hidden'); makeLevel(level); }, 450);
        }
      }
    }

    // bounds
    if(state.player.x < 8) state.player.x = 8;
    if(state.player.x + state.player.w > W-8) state.player.x = W-8-state.player.w;
    if(state.player.y > H + 80){
      fx(220,0.12,0.08);
      setTimeout(()=> makeLevel(level), 350);
    }

    // goal
    if(overlap(state.player, state.goal)){
      // level complete
      running = false;
      overlay.classList.remove('hidden');
      fx(1200,0.18,0.12);
      setTimeout(()=>{
        overlay.classList.add('hidden');
        running = true;
        if(level < TOTAL_LEVELS) level++;
        else level = 1;
        makeLevel(level);
      }, 700);
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // subtle background
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(255,255,255,0.02)');
    g.addColorStop(1,'rgba(255,255,255,0.06)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // platforms
    for(const p of state.platforms){
      // base
      ctx.fillStyle = '#333';
      roundRect(ctx, p.x, p.y, p.w, p.h, 6, true, false);
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, p.x, p.y, Math.min(60,p.w), p.h, 6, true, false);
    }

    // enemies
    for(const e of state.enemies){
      ctx.fillStyle = '#e74c3c';
      roundRect(ctx, e.x, e.y, e.w, e.h, 6, true, false);
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x + e.w/3, e.y + e.h/4, e.w/3, e.h/3);
    }

    // goal (purple with glow)
    ctx.beginPath();
    ctx.fillStyle = state.goal.color;
    ctx.arc(state.goal.x + state.goal.w/2, state.goal.y + state.goal.h/2, state.goal.w/2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.arc(state.goal.x + state.goal.w/2, state.goal.y + state.goal.h/2, state.goal.w*0.3, 0, Math.PI*2);
    ctx.fill();

    // player with shadow and little face
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.ellipse(state.player.x + state.player.w/2 + 6, state.player.y + state.player.h + 8, state.player.w*0.9, state.player.h*0.4, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = state.player.color;
    roundRect(ctx, state.player.x, state.player.y, state.player.w, state.player.h, 6, true, false);

    // face
    ctx.fillStyle = '#fff';
    ctx.fillRect(state.player.x + 6, state.player.y + 8, 6,6);

    // HUD text
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '12px system-ui, Arial';
    ctx.fillText('Drag or use controls • Smooth animations', 10, 18);
  }

  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
  }

  // main loop
  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.035, (now - last)/1000);
    last = now;
    update(dt);
    draw();
    if(running) requestAnimationFrame(loop);
    else requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // initial resize and level start
  setTimeout(()=>{ resize(); makeLevel(level); }, 120);

  // expose for debug
  window.__game = { state, makeLevel };
})();

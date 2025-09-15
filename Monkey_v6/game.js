
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 1280, H = 720;
  const ASSET = 'assets/';
  const bg = new Image(); bg.src = ASSET + 'background.png';
  const monkeyImg = new Image(); monkeyImg.src = ASSET + 'monkey.png';
  const handleImg = new Image(); handleImg.src = ASSET + 'handle.png';
  const leafImg = new Image(); leafImg.src = ASSET + 'leaf.png';
  const coinImg = new Image(); coinImg.src = ASSET + 'coin.png';

  // sounds
  const sGrab = new Audio(ASSET + 'grab.wav');
  const sJump = new Audio(ASSET + 'jump.wav');
  const sThud = new Audio(ASSET + 'thud.wav');
  const sSqueak = new Audio(ASSET + 'squeak.wav');
  const sCoin = new Audio(ASSET + 'coin.wav');

  canvas.style.touchAction = 'none';

  let running = false;
  let score = 0;
  let coins = 0;
  let lastTime = 0;
  let particles = [];
  let stars = [];
  let overlay = document.getElementById('overlay');

  // Nodes (rope anchors)
  let nodes = [];

  // Snap zone radius: when monkey enters this circle around a node, auto-attach
  const SNAP_RADIUS = 140;

  // Cutting radius for pointer taps (you cut only the node you tapped near)
  const CUT_RADIUS = 48;

  // generate nodes with larger gaps and longer ropes, but snap zones make grabbing easy
  function generateNodes() {
    nodes = [];
    const gapMin = 300, gapMax = 460; // larger gaps per your request
    let x = 220;
    for (let i = 0; i < 140; i++) {
      const base = Math.max(140, Math.min(canvas.height - 220, 200 + Math.round(Math.sin(i*0.22)*70 + (Math.random()*160-80))));
      const length = 240 + Math.random()*140; // longer ropes
      const coinChance = Math.random() < 0.28;
      nodes.push({x: x, y: base, length: length, coin: coinChance, coinCollected: false, active: true});
      x += gapMin + Math.random()*(gapMax-gapMin);
    }

    // ensure first few nodes are close so player gets sensible start
    if (nodes.length > 8) {
      for (let i = 1; i <= 8; i++) {
        nodes[i].x = nodes[0].x + i * (220 + Math.random()*40);
        nodes[i].y = Math.max(120, Math.min(canvas.height - 180, nodes[i].y + (Math.random()*40-20)));
      }
    }
  }

  let cam = {x:0,y:0,shake:0};

  let monkey = {
    nodeIndex: 0,
    angle: -0.9,
    aVel: 0,
    length: 260,
    grabbed: true,
    x: 0, y: 0,
    radius: 52, // bigger monkey size
    vx: 0, vy: 0,
    handPhase: 0
  };

  function attachToNode(index) {
    if (!nodes || index < 0 || index >= nodes.length) return;
    if (!nodes[index].active) return;
    monkey.nodeIndex = index;
    monkey.length = nodes[index].length;
    monkey.angle = -0.9 + (Math.random()*0.4 - 0.2);
    monkey.aVel = 0;
    monkey.grabbed = true;
    const node = nodes[index];
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
    monkey.vx = 0; monkey.vy = 0;
    monkey.handPhase = 0;
    try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<8;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*18, y: monkey.y + (Math.random()-0.5)*18,
      vx: (Math.random()-0.5)*180, vy: -40 + Math.random()*80, life: 0.6 + Math.random()*0.6, r: 4 + Math.random()*6, img: 'leaf'
    });
  }

  const GRAV = 1200;
  const AIR = 0.999;

  function updatePendulum(dt) {
    if (!monkey.grabbed) return;
    const node = nodes[monkey.nodeIndex];
    if (!node || !node.active) { monkey.grabbed = false; return; }
    const aAcc = -(GRAV / monkey.length) * Math.sin(monkey.angle);
    monkey.aVel += aAcc * dt;
    // soft damping for smoother motion
    monkey.aVel *= Math.pow(AIR, dt*60) * 0.9995;
    monkey.angle += monkey.aVel * dt;
    monkey.angle += -0.0008 * (monkey.angle) * dt;
    // compute target position from pendulum
    const targetX = node.x + monkey.length * Math.sin(monkey.angle);
    const targetY = node.y + monkey.length * Math.cos(monkey.angle);
    // lerp current position towards target for smoothing
    monkey.x += (targetX - monkey.x) * Math.min(1, dt*10);
    monkey.y += (targetY - monkey.y) * Math.min(1, dt*10);
    monkey.handPhase += dt * 6;
    // small cute bob (scale) factor for drawing
    monkey.bob = Math.sin(monkey.handPhase*1.5) * 0.05;
    // if monkey enters snap zone of any forward node, auto-connect
    autoAttachForward();
  }

  // auto-attach forward: if monkey center enters the SNAP_RADIUS of a future active node, attach to it
  function autoAttachForward() {
    for (let i = monkey.nodeIndex + 1; i < Math.min(nodes.length, monkey.nodeIndex + 10); i++) {
      const n = nodes[i];
      if (!n.active) continue;
      const dx = monkey.x - n.x, dy = monkey.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d <= SNAP_RADIUS) {
        // attach to this node immediately (even if previous not cut)
        attachToNode(i);
        return;
      }
    }
  }

  function releaseByCut(nodeIndex) {
    // cutting the rope: mark node inactive and create visual/sound
    if (!nodes[nodeIndex] || !nodes[nodeIndex].active) return;
    nodes[nodeIndex].active = false;
    // if monkey was attached to this node, it will now freefall
    if (monkey.nodeIndex === nodeIndex && monkey.grabbed) {
      monkey.grabbed = false;
      // give a small impulse so freefall looks natural
      monkey.vx += (Math.random()-0.5)*40;
      monkey.vy += 20;
    }
    // particle + sound
    for (let j=0;j<18;j++) particles.push({
      x: nodes[nodeIndex].x + (Math.random()-0.5)*22, y: nodes[nodeIndex].y + (Math.random()-0.5)*6,
      vx: (Math.random()-0.5)*280, vy: -40 + Math.random()*140, life: 0.6 + Math.random()*0.8, r: 6 + Math.random()*8, img: 'leaf'
    });
    try { sSqueak.currentTime = 0; sSqueak.play().catch(()=>{}); } catch(e) {}
  }

  function releaseAndJump() {
    // deprecated: manually releasing removed. kept for internal uses
    if (!monkey.grabbed) return;
    monkey.grabbed = false;
    const tangential = monkey.length * monkey.aVel;
    const ang = monkey.angle + Math.PI/2;
    const baseVx = tangential * Math.cos(ang) * 1.05;
    const baseVy = tangential * Math.sin(ang) * 1.05 - 200;
    const boostDir = Math.sign(monkey.aVel || 1);
    const boost = Math.max(140, Math.abs(monkey.aVel) * monkey.length * 0.4);
    monkey.vx = baseVx + boostDir * boost * 0.6;
    monkey.vy = baseVy - Math.abs(boost) * 0.02;
    try { sJump.currentTime = 0; sJump.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<12;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*16, y: monkey.y + (Math.random()-0.5)*16,
      vx: (Math.random()-0.5)*320, vy: -160 + Math.random()*160, life: 0.6 + Math.random()*0.8, r: 6 + Math.random()*7, img: 'leaf'
    });
  }

  function checkLanding() {
    if (monkey.grabbed) return false;
    for (let i = monkey.nodeIndex + 1; i < Math.min(nodes.length, monkey.nodeIndex + 12); i++) {
      const n = nodes[i];
      if (!n.active) continue;
      const dx = monkey.x - n.x, dy = monkey.y - n.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        attachToNode(i);
        score += 1;
        if (n.coin && !n.coinCollected) {
          n.coinCollected = true;
          coins += 1;
          try { sCoin.currentTime = 0; sCoin.play().catch(()=>{}); } catch(e) {}
        }
        for (let j=0;j<18;j++) particles.push({
          x: monkey.x + (Math.random()-0.5)*22, y: monkey.y + (Math.random()-0.5)*22,
          vx: (Math.random()-0.5)*360, vy: -100 + Math.random()*220, life: 0.8 + Math.random()*0.8, r: 6 + Math.random()*8, img: 'leaf'
        });
        return true;
      }
    }
    return false;
  }

  function updateFreefall(dt) {
    if (monkey.grabbed) return;
    monkey.vy += GRAV * dt;
    monkey.vx *= Math.pow(0.995, dt*60);
    monkey.x += monkey.vx * dt;
    monkey.y += monkey.vy * dt;

    if (checkLanding()) {
      try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
      return;
    }

    if (monkey.y > canvas.height + 200) {
      try { sThud.currentTime = 0; sThud.play().catch(()=>{}); } catch(e) {}
      running = false;
      showGameOver();
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i,1); continue; }
      p.vy += 600 * dt;
      p.vx *= Math.pow(0.995, dt*60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function updateCamera(dt) {
    const tx = -monkey.x + canvas.width*0.45;
    const ty = -monkey.y + canvas.height*0.45;
    cam.x += (tx - cam.x) * Math.min(dt*6, 1);
    cam.y += (ty - cam.y) * Math.min(dt*6, 1);
  }

  function initStars() {
    stars = [];
    for (let i=0;i<160;i++) stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height*0.6, r: Math.random()*1.2+0.3, speed: 0.1+Math.random()*0.4});
  }

  function drawRope(nodeX, nodeY, mx, my, active=true) {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = active ? '#6b4a2c' : 'rgba(150,90,60,0.18)';
    ctx.beginPath();
    const cx = nodeX + (mx - nodeX) * 0.46;
    const cy = nodeY + (my - nodeY) * 0.28 + Math.min(40, Math.abs(monkey.aVel)*12);
    ctx.moveTo(nodeX, nodeY);
    ctx.quadraticCurveTo(cx, cy, mx, my);
    ctx.stroke();
    ctx.restore();
  }

  // preload helpers
  function loadImage(img) {
    return new Promise((resolve) => {
      if (img.complete && img.naturalWidth !== 0) return resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }
  function loadAudio(a) {
    return new Promise((resolve) => {
      a.oncanplaythrough = () => resolve();
      a.onerror = () => resolve();
      setTimeout(resolve, 700);
    });
  }
  async function preloadAssets() {
    await Promise.all([loadImage(bg), loadImage(monkeyImg), loadImage(handleImg), loadImage(leafImg), loadImage(coinImg)]);
    await Promise.all([loadAudio(sGrab), loadAudio(sJump), loadAudio(sThud), loadAudio(sSqueak), loadAudio(sCoin)]);
  }

  // convert client coords to world coords (account for DPR and camera)
  function clientToWorld(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (cx - rect.left) * scaleX - cam.x;
    const y = (cy - rect.top) * scaleY - cam.y;
    return {x, y};
  }

  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (bg.complete) {
      const img = bg;
      const ratio = Math.max(canvas.width/img.width, canvas.height/img.height);
      const iw = img.width * ratio, ih = img.height * ratio;
      ctx.drawImage(img, (canvas.width - iw)/2 + cam.x*0.05, (canvas.height - ih)/2 + cam.y*0.03, iw, ih);
    } else {
      ctx.fillStyle = '#88c080'; ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    ctx.save();
    ctx.translate(cam.x, cam.y);

    // nodes and handles (LOD: draw only near viewport)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.x < -400 - cam.x || n.x > canvas.width - cam.x + 800) continue;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(20,80,40,0.14)';
      ctx.ellipse(n.x, n.y - 20, 64, 38, 0, 0, Math.PI*2);
      ctx.fill();
      if (handleImg.complete) ctx.drawImage(handleImg, n.x - 18, n.y - 18, 36, 36);
      // draw coin
      if (n.coin && !n.coinCollected && coinImg.complete) {
        ctx.drawImage(coinImg, n.x - 22, n.y - 72, 44, 44);
      }
      // draw snap-zone circle (subtle)
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = n.active ? 'rgba(255,220,120,0.08)' : 'rgba(0,0,0,0.02)';
      ctx.arc(n.x, n.y, SNAP_RADIUS*0.8, 0, Math.PI*2);
      ctx.stroke();
    }

    // highlight the next node with pulsing indicator
    const nextIndex = monkey.nodeIndex + 1;
    if (nodes[nextIndex]) {
      const nx = nodes[nextIndex].x, ny = nodes[nextIndex].y;
      const t = (Date.now() % 1000) / 1000;
      const pulse = 1 + 0.2 * Math.sin(t * Math.PI * 2);
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,240,120,' + (0.5 + 0.4 * Math.sin(t * Math.PI * 2)) + ')';
      ctx.arc(nx, ny - 6, 40 * pulse, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // draw rope for current node and faded ropes for active nodes nearby
    // current node
    const node = nodes[monkey.nodeIndex] || {x:120, y:180};
    if (monkey.grabbed) drawRope(node.x, node.y, monkey.x, monkey.y, node.active);
    else drawRope(node.x, node.y, node.x + Math.sin(monkey.angle || 0)*monkey.length*0.28, node.y + Math.cos(monkey.angle || 0)*monkey.length*0.28, node.active);

    // draw monkey
    ctx.save();
    ctx.translate(monkey.x, monkey.y);
    const handOffset = Math.sin(monkey.handPhase) * 14 * (monkey.grabbed ? 1 : 0.5);
    const tilt = Math.max(-0.9, Math.min(0.9, (monkey.aVel || 0) * 0.085 + (monkey.vx || 0) * 0.0012));
    ctx.rotate(tilt);
    const baseScale = monkey.grabbed ? 1.05 : 0.95 - Math.min(0.28, Math.abs(monkey.vy || 0) / 1400);
    const bounce = monkey.grabbed ? (Math.sin(Date.now()/160 + monkey.handPhase) * 0.035 + (monkey.bob||0)*0.6) : (monkey.bob||0)*0.8;
    ctx.scale(baseScale + bounce, baseScale - bounce);
    if (monkeyImg.complete) ctx.drawImage(monkeyImg, -70 + handOffset, -92, 150, 150);
    // small eye sparkle to make monkey cuter
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(10, -50 + Math.sin(monkey.handPhase*2)*2, 3); ctx.fill();
    ctx.restore();

    // draw fallen ropes (inactive) as dashed lines and faded
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.active) continue;
      // skipped if too far
      if (n.x < -400 - cam.x || n.x > canvas.width - cam.x + 800) continue;
      // draw faded rope from anchor to where monkey would be if attached
      const mx = n.x + Math.sin(-0.9) * n.length;
      const my = n.y + Math.cos(-0.9) * n.length;
      ctx.save();
      ctx.strokeStyle = 'rgba(120,80,60,0.12)';
      ctx.setLineDash([6,6]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.restore();
    }

    // particles
    for (let p of particles) {
      if (p.img === 'leaf' && leafImg.complete) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.12, Math.min(1, p.life*1.2));
        ctx.translate(p.x, p.y);
        ctx.rotate((p.vx + p.vy) * 0.002);
        ctx.drawImage(leafImg, -p.r, -p.r/2, p.r*2, p.r);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,200,140,0.9)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();

    // HUD update
    const scoreEl = document.getElementById('score-val');
    const hudCoins = document.getElementById('instr');
    if (scoreEl) scoreEl.textContent = score + '  ♥ ' + coins;
    if (hudCoins) hudCoins.innerHTML = 'Tap a rope handle to <strong>cut</strong> it — Coins: ' + coins + '  Score: ' + score;
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min(0.033, (ts - lastTime) / 1000);
    lastTime = ts;
    if (running) {
      updatePendulum(dt);
      updateFreefall(dt);
      updateParticles(dt);
      updateCamera(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function showGameOver() {
    const inner = document.getElementById('overlay-inner');
    if (inner) {
      inner.querySelector('h1').textContent = 'OOPS — Monkey Fell!';
      const sub = inner.querySelector('.sub');
      if (sub) sub.textContent = 'Score: ' + score + '  Coins: ' + coins + ' — Tap to try again!';
    }
    overlay.style.display = 'flex';
    overlay.classList.remove('overlay-hidden');
    overlay.classList.add('overlay-visible');
  }

  // pointerdown now performs cut-at-location (if a node/handle is near the touch)
  canvas.addEventListener('pointerdown', (ev) => {
    if (!running) return;
    const pos = clientToWorld(ev.clientX, ev.clientY);
    // find nearest node within CUT_RADIUS (world coords)
    let nearest = -1;
    let ndist = 1e9;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!n.active) continue;
      const dx = pos.x - n.x, dy = pos.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < ndist) { ndist = d; nearest = i; }
    }
    if (nearest >= 0 && ndist <= CUT_RADIUS) {
      // Only cut if player tapped the handle monkey is currently attached to (swap at current position)
      if (monkey.grabbed && nearest === monkey.nodeIndex) {
        // cut that specific rope at its anchor point (swap)
        releaseByCut(nearest);
        // try to auto-attach to a forward node immediately to make swap smooth
        autoAttachForward();
      } else {
        // tapped near a non-active handle — ignore cut (swap only allowed at monkey's handle)
        // optional feedback
        for (let j=0;j<6;j++) particles.push({ x: pos.x + (Math.random()-0.5)*18, y: pos.y + (Math.random()-0.5)*18, vx: (Math.random()-0.5)*80, vy: -20 + Math.random()*40, life: 0.6 + Math.random()*0.3, img: 'leaf' });
      }
    } else {
      // tapped not near a handle: give a tiny nudge effect (optional)
      for (let j=0;j<6;j++) particles.push({
        x: pos.x + (Math.random()-0.5)*18, y: pos.y + (Math.random()-0.5)*18,
        vx: (Math.random()-0.5)*120, vy: (Math.random()-0.5)*120, life: 0.4 + Math.random()*0.6, r: 4 + Math.random()*4, img: 'leaf'
      });
    }
  });

  // start button: preload assets and generate nodes
  document.getElementById('start').addEventListener('click', async () => {
    const inner = document.getElementById('overlay-inner');
    if (inner) {
      inner.querySelector('h1').textContent = 'Loading...';
      inner.querySelector('.sub').textContent = 'Preparing the jungle — one second!';
    }
    await preloadAssets();
    resize();
    generateNodes();
    attachToNode(0);
    initStars();
    particles = [];
    score = 0; coins = 0;
    overlay.style.display = 'none';
    overlay.classList.remove('overlay-visible');
    overlay.classList.add('overlay-hidden');
    running = true; lastTime = performance.now();
  });

  function resize() {
    const w = Math.max(window.innerWidth, 360);
    const h = Math.max(window.innerHeight, 360);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    W = canvas.width; H = canvas.height;
    for (let n of nodes) n.y = Math.max(120, Math.min(canvas.height - 180, n.y));
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize,120));

  resize();
  initStars();
  requestAnimationFrame(loop);

  // helper: client to world coords using canvas bounding rect and DPR + camera
  function clientToWorld(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (cx - rect.left) * scaleX - cam.x;
    const y = (cy - rect.top) * scaleY - cam.y;
    return {x, y};
  }

})();

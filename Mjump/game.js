
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

  // generate nodes with reachable spacing and some coins on them
  function generateNodes() {
    nodes = [];
    const gapMin = 180, gapMax = 320; // smaller gap so monkey can reach
    let x = 220;
    for (let i = 0; i < 80; i++) {
      // ensure y based on canvas height for robustness
      const base = Math.max(140, Math.min(canvas.height - 220, 200 + Math.round(Math.sin(i*0.28)*70 + (Math.random()*160-80))));
      const length = 200 + Math.random()*80;
      const coinChance = Math.random() < 0.28; // 28% nodes have a coin
      nodes.push({x: x, y: base, length: length, coin: coinChance, coinCollected: false});
      x += gapMin + Math.random()*(gapMax-gapMin);
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
    radius: 46, // bigger monkey
    vx: 0, vy: 0,
    handPhase: 0 // for hand-switch animation
  };

  function attachToNode(index) {
    if (!nodes || index < 0 || index >= nodes.length) return;
    monkey.nodeIndex = index;
    monkey.length = nodes[index].length;
    monkey.angle = -0.9 + (Math.random()*0.4 - 0.2);
    monkey.aVel = 0;
    monkey.grabbed = true;
    const node = nodes[index];
    // compute position immediately
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
    monkey.vx = 0; monkey.vy = 0;
    // hand animation init
    monkey.handPhase = 0;
    // sound and small pop
    try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<8;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*18, y: monkey.y + (Math.random()-0.5)*18,
      vx: (Math.random()-0.5)*180, vy: -40 + Math.random()*80, life: 0.6 + Math.random()*0.6, r: 4 + Math.random()*6, img: 'leaf'
    });
  }

  const GRAV = 1200;
  const AIR = 0.996;

  function updatePendulum(dt) {
    if (!monkey.grabbed) return;
    const node = nodes[monkey.nodeIndex];
    const aAcc = -(GRAV / monkey.length) * Math.sin(monkey.angle);
    monkey.aVel += aAcc * dt;
    monkey.aVel *= Math.pow(AIR, dt*60);
    monkey.angle += monkey.aVel * dt;
    monkey.angle += -0.0008 * (monkey.angle) * dt;
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
    // subtle hand-phase oscillation to simulate switching reach
    monkey.handPhase += dt * 6;
  }

  function releaseAndJump() {
    if (!monkey.grabbed) return;
    monkey.grabbed = false;
    const tangential = monkey.length * monkey.aVel;
    const ang = monkey.angle + Math.PI/2;
    monkey.vx = tangential * Math.cos(ang) * 1.05;
    monkey.vy = tangential * Math.sin(ang) * 1.05 - 200;
    try { sJump.currentTime = 0; sJump.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<12;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*16, y: monkey.y + (Math.random()-0.5)*16,
      vx: (Math.random()-0.5)*320, vy: -160 + Math.random()*160, life: 0.6 + Math.random()*0.8, r: 6 + Math.random()*7, img: 'leaf'
    });
  }

  function checkLanding() {
    if (monkey.grabbed) return false;
    for (let i = monkey.nodeIndex + 1; i < Math.min(nodes.length, monkey.nodeIndex + 8); i++) {
      const n = nodes[i];
      const dx = monkey.x - n.x, dy = monkey.y - n.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 86) {
        attachToNode(i);
        score += 1;
        // collect coin if present
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

    if (monkey.y > canvas.height + 160) {
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

  function drawRope(nodeX, nodeY, mx, my) {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#6b4a2c';
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

    // nodes and handles
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(20,80,40,0.14)';
      ctx.ellipse(n.x, n.y - 20, 64, 38, 0, 0, Math.PI*2);
      ctx.fill();
      if (handleImg.complete) ctx.drawImage(handleImg, n.x - 18, n.y - 18, 36, 36);
      // draw coin if present and not collected
      if (n.coin && !n.coinCollected && coinImg.complete) {
        ctx.drawImage(coinImg, n.x - 22, n.y - 72, 44, 44);
      }
    }

    // draw rope and monkey
    const node = nodes[monkey.nodeIndex] || {x:120, y:180};
    if (monkey.grabbed) drawRope(node.x, node.y, monkey.x, monkey.y);
    else drawRope(node.x, node.y, node.x + Math.sin(monkey.angle || 0)*monkey.length*0.28, node.y + Math.cos(monkey.angle || 0)*monkey.length*0.28);

    // monkey with larger size and hand animation
    ctx.save();
    ctx.translate(monkey.x, monkey.y);
    // hand-switch tilt + slight translation to mimic grabbing with alternate hands
    const handOffset = Math.sin(monkey.handPhase) * 8 * (monkey.grabbed ? 1 : 0.25);
    const tilt = Math.max(-0.7, Math.min(0.7, (monkey.aVel || 0) * 0.07 + (monkey.vx || 0) * 0.0008));
    ctx.rotate(tilt);
    const baseScale = monkey.grabbed ? 1 : 1 - Math.min(0.28, Math.abs(monkey.vy || 0) / 1200);
    const bounce = monkey.grabbed ? (Math.sin(Date.now()/140) * 0.02) : 0;
    ctx.scale(baseScale + bounce, baseScale - bounce);
    if (monkeyImg.complete) ctx.drawImage(monkeyImg, -70 + handOffset, -88, 140, 140); // bigger monkey image
    ctx.restore();

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
    if (hudCoins) hudCoins.textContent = 'Tap to release & jump — Coins: ' + coins + '  Score: ' + score;
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

  // input
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    if (monkey.grabbed) releaseAndJump();
  });

  // start button: preload assets and ensure nodes/gaps are reachable
  document.getElementById('start').addEventListener('click', async () => {
    const inner = document.getElementById('overlay-inner');
    if (inner) {
      inner.querySelector('h1').textContent = 'Loading...';
      inner.querySelector('.sub').textContent = 'Preparing the jungle — one second!';
    }
    await preloadAssets();
    resize();
    generateNodes();
    // ensure first few nodes are close so first jumps are easy
    for (let i=1;i<6 && i<nodes.length;i++){ nodes[i].x = nodes[0].x + i * 220 + Math.random()*40; }
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
    // clamp node heights to visible area
    for (let n of nodes) n.y = Math.max(120, Math.min(canvas.height - 180, n.y));
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize,120));

  resize();
  initStars();
  requestAnimationFrame(loop);

})();

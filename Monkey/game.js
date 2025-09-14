
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // Adaptive resolution
  let W = 1280, H = 720;
  const ASSET = 'assets/';
  const bg = new Image(); bg.src = ASSET + 'background.png';
  const monkeyImg = new Image(); monkeyImg.src = ASSET + 'monkey.png';
  const handleImg = new Image(); handleImg.src = ASSET + 'handle.png';
  const leafImg = new Image(); leafImg.src = ASSET + 'leaf.png';

  const sGrab = new Audio(ASSET + 'grab.wav');
  const sJump = new Audio(ASSET + 'jump.wav');
  const sThud = new Audio(ASSET + 'thud.wav');
  const sSqueak = new Audio(ASSET + 'squeak.wav');

  // Ensure pointer events + touch-action set
  canvas.style.touchAction = 'none';

  // game state
  let running = false;
  let score = 0;
  let lastTime = 0;
  let particles = [];
  let stars = [];
  let overlay = document.getElementById('overlay');

  // nodes (rope anchors)
  let nodes = [];

  function generateNodes() {
    nodes = [];
    // use actual canvas height for node placement so nodes are on-screen correctly
    const gapMin = 240, gapMax = 420;
    let x = 220;
    for (let i = 0; i < 40; i++) {
      // base Y uses canvas height to be robust on mobile
      const y = 180 + Math.round( Math.sin(i*0.28) * 80 + (Math.random()*200-80) );
      const length = 200 + Math.random()*80;
      nodes.push({x: x, y: Math.max(120, Math.min(canvas.height - 180, y)), length: length});
      x += gapMin + Math.random()*(gapMax-gapMin);
    }
  }

  // camera
  let cam = {x:0,y:0,shake:0};

  // monkey state
  let monkey = {
    nodeIndex: 0,
    angle: -0.9,
    aVel: 0,
    length: 260,
    grabbed: true,
    x: 0, y: 0,
    radius: 34,
    vx: 0, vy: 0
  };

  // Attach: set angle/length and compute x/y immediately to avoid invisible monkey
  function attachToNode(index) {
    if (!nodes || index < 0 || index >= nodes.length) return;
    monkey.nodeIndex = index;
    monkey.length = nodes[index].length;
    monkey.angle = -0.9 + (Math.random()*0.4 - 0.2);
    monkey.aVel = 0;
    monkey.grabbed = true;
    // compute Cartesian immediately so render shows monkey right away
    const node = nodes[index];
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
    monkey.vx = 0; monkey.vy = 0;
    // sound & small pop particles
    try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<8;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*18, y: monkey.y + (Math.random()-0.5)*18,
      vx: (Math.random()-0.5)*180, vy: -40 + Math.random()*80, life: 0.6 + Math.random()*0.6, r: 4 + Math.random()*6, img: 'leaf'
    });
  }

  // physics tuning
  const GRAV = 1200; // gravity-like constant
  const AIR = 0.996; // damping

  function updatePendulum(dt) {
    if (!monkey.grabbed) return;
    const node = nodes[monkey.nodeIndex];
    // angular acceleration for pendulum; add small cohesion to align toward center
    const aAcc = -(GRAV / monkey.length) * Math.sin(monkey.angle);
    monkey.aVel += aAcc * dt;
    // soften velocity a bit for smoother feeling (less twitchy)
    monkey.aVel *= Math.pow(AIR, dt*60);
    monkey.angle += monkey.aVel * dt;
    // apply subtle corrective torque to reduce drift over long time
    monkey.angle += -0.0008 * (monkey.angle) * dt;
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
  }

  function releaseAndJump() {
    if (!monkey.grabbed) return;
    monkey.grabbed = false;
    // Tangential velocity from angular velocity
    const tangential = monkey.length * monkey.aVel;
    const ang = monkey.angle + Math.PI/2;
    monkey.vx = tangential * Math.cos(ang) * 1.05;
    monkey.vy = tangential * Math.sin(ang) * 1.05 - 200; // stronger jump boost for satisfying arc
    // play sound + little squawk
    try { sJump.currentTime = 0; sJump.play().catch(()=>{}); } catch(e) {}
    for (let j=0;j<10;j++) particles.push({
      x: monkey.x + (Math.random()-0.5)*16, y: monkey.y + (Math.random()-0.5)*16,
      vx: (Math.random()-0.5)*260, vy: -160 + Math.random()*120, life: 0.6 + Math.random()*0.8, r: 5 + Math.random()*7, img: 'leaf'
    });
  }

  function checkLanding() {
    if (monkey.grabbed) return false;
    for (let i = monkey.nodeIndex + 1; i < Math.min(nodes.length, monkey.nodeIndex + 6); i++) {
      const n = nodes[i];
      const dx = monkey.x - n.x, dy = monkey.y - n.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 72) {
        attachToNode(i);
        score += 1;
        // mini celebration
        for (let j=0;j<16;j++) particles.push({
          x: monkey.x + (Math.random()-0.5)*22, y: monkey.y + (Math.random()-0.5)*22,
          vx: (Math.random()-0.5)*300, vy: -100 + Math.random()*180, life: 0.8 + Math.random()*0.8, r: 6 + Math.random()*8, img: 'leaf'
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

    // gentle rotation for monkey during fall for fun effect
    // check landing while in air
    if (checkLanding()) {
      try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
      return;
    }

    // if falls below screen -> game over
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
    // nicer curve control point for smooth sag
    const cx = nodeX + (mx - nodeX) * 0.46;
    const cy = nodeY + (my - nodeY) * 0.28 + Math.min(40, Math.abs(monkey.aVel)*12);
    ctx.moveTo(nodeX, nodeY);
    ctx.quadraticCurveTo(cx, cy, mx, my);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Preloader: wait for images & audio to be ready on start ----
  function loadImage(img) {
    return new Promise((resolve) => {
      if (img.complete && img.naturalWidth !== 0) return resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }
  function loadAudio(a) {
    return new Promise((resolve) => {
      // some browsers won't fire oncanplaythrough until user gesture; we still resolve early
      a.oncanplaythrough = () => resolve();
      a.onerror = () => resolve();
      // time out resolve after short time to avoid blocking
      setTimeout(resolve, 700);
    });
  }
  async function preloadAssets() {
    await Promise.all([loadImage(bg), loadImage(monkeyImg), loadImage(handleImg), loadImage(leafImg)]);
    // try to prime audio but don't block long
    await Promise.all([loadAudio(sGrab), loadAudio(sJump), loadAudio(sThud), loadAudio(sSqueak)]);
  }

  // Draw loop and rendering
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background
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

    // stars / light specks
    for (let s of stars) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // draw nodes (handles)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(20,80,40,0.18)';
      ctx.ellipse(n.x, n.y - 20, 64, 38, 0, 0, Math.PI*2);
      ctx.fill();
      if (handleImg.complete) ctx.drawImage(handleImg, n.x - 18, n.y - 18, 36, 36);
      if (i % 5 === 0) {
        ctx.font = '18px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillText(i, n.x - 6, n.y - 30);
      }
    }

    // draw rope and monkey
    const node = nodes[monkey.nodeIndex] || {x:120, y:180};
    if (monkey.grabbed) drawRope(node.x, node.y, monkey.x, monkey.y);
    else drawRope(node.x, node.y, node.x + Math.sin(monkey.angle || 0)*monkey.length*0.28, node.y + Math.cos(monkey.angle || 0)*monkey.length*0.28);

    // monkey sprite (with squash/stretch during jump/fall)
    ctx.save();
    ctx.translate(monkey.x, monkey.y);
    const tilt = Math.max(-0.7, Math.min(0.7, (monkey.aVel || 0) * 0.07 + (monkey.vx || 0) * 0.0008));
    ctx.rotate(tilt);
    const scale = monkey.grabbed ? 1 : 1 - Math.min(0.28, Math.abs(monkey.vy || 0) / 1200);
    // apply a tiny bounce when grabbing for liveliness
    const bounce = monkey.grabbed ? (Math.sin(Date.now()/140) * 0.015) : 0;
    ctx.scale(scale + bounce, scale - bounce);
    if (monkeyImg.complete) ctx.drawImage(monkeyImg, -48, -64, 96, 96);
    ctx.restore();

    // particles (leaves)
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

    // update HUD score text in DOM
    const scoreEl = document.getElementById('score-val');
    if (scoreEl) scoreEl.textContent = score;
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
      if (sub) sub.textContent = 'Score: ' + score + ' — Tap to try again!';
    }
    overlay.style.display = 'flex';
    overlay.classList.remove('overlay-hidden');
    overlay.classList.add('overlay-visible');
  }

  // input: single tap to release while swinging
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    if (monkey.grabbed) releaseAndJump();
  });

  // START button: preload assets, resize, generate nodes, attach and start loop
  document.getElementById('start').addEventListener('click', async () => {
    // visual feedback
    const inner = document.getElementById('overlay-inner');
    if (inner) {
      inner.querySelector('h1').textContent = 'Loading...';
      inner.querySelector('.sub').textContent = 'Preparing the jungle — one second!';
    }
    // preload assets (but don't block too long)
    await preloadAssets();

    // re-enable proper canvas size before generating nodes
    resize();

    // create nodes using canvas.height so they lie within visible area
    generateNodes();

    // attach monkey to first node and ensure position computed
    attachToNode(0);

    // init stars and particles
    initStars();
    particles = [];
    score = 0;

    // hide overlay reliably
    overlay.style.display = 'none';
    overlay.classList.remove('overlay-visible');
    overlay.classList.add('overlay-hidden');

    // start running
    running = true;
    lastTime = performance.now();
  });

  // helper: resize to device & DPR — called on load and on orientation change
  function resize() {
    const w = Math.max(window.innerWidth, 360);
    const h = Math.max(window.innerHeight, 360);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    // set logical W/H for calculations
    W = canvas.width; H = canvas.height;
    // ensure existing nodes stay on-screen
    for (let n of nodes) n.y = Math.max(120, Math.min(canvas.height - 180, n.y));
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => { setTimeout(resize, 120); });

  // initialize minimal state and loop
  resize();
  initStars();
  requestAnimationFrame(loop);

})();

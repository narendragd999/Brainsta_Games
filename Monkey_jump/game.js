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
  const sGrab = new Audio(ASSET + 'grab.wav');
  const sJump = new Audio(ASSET + 'jump.wav');
  const sThud = new Audio(ASSET + 'thud.wav');
  const sSqueak = new Audio(ASSET + 'squeak.wav');
  let running = false; let score = 0; let lastTime = 0; let particles = []; let stars = []; let overlay = document.getElementById('overlay');
  let nodes = [];
  function generateNodes() {
    nodes = [];
    const gapMin = 240, gapMax = 420;
    let x = 220;
    for (let i = 0; i < 40; i++) {
      const y = 180 + Math.round( Math.sin(i*0.3) * 80 + (Math.random()*200-80) );
      const length = 220 + Math.random()*60;
      nodes.push({x: x, y: Math.max(120, Math.min(H-180, y)), length: length});
      x += gapMin + Math.random()*(gapMax-gapMin);
    }
  }
  let cam = {x:0,y:0,shake:0};
  let monkey = {nodeIndex:0, angle:-0.9, aVel:0, length:260, grabbed:true, x:0, y:0, radius:34, vx:0, vy:0};
  function attachToNode(index) {
    monkey.nodeIndex = index; monkey.length = nodes[index].length; monkey.angle = -0.9 + (Math.random()*0.4 - 0.2); monkey.aVel = 0; monkey.grabbed = true;
    try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
  }
  const GRAV = 1200; const AIR = 0.997;
  function updatePendulum(dt) {
    if (!monkey.grabbed) return;
    const node = nodes[monkey.nodeIndex];
    const aAcc = -(GRAV / monkey.length) * Math.sin(monkey.angle);
    monkey.aVel += aAcc * dt;
    monkey.aVel *= Math.pow(AIR, dt*60);
    monkey.angle += monkey.aVel * dt;
    monkey.x = node.x + monkey.length * Math.sin(monkey.angle);
    monkey.y = node.y + monkey.length * Math.cos(monkey.angle);
  }
  function releaseAndJump() {
    if (!monkey.grabbed) return;
    monkey.grabbed = false;
    const tangential = monkey.length * monkey.aVel;
    const ang = monkey.angle + Math.PI/2;
    monkey.vx = tangential * Math.cos(ang) * 1.05;
    monkey.vy = tangential * Math.sin(ang) * 1.05 - 180;
    try { sJump.currentTime = 0; sJump.play().catch(()=>{}); } catch(e) {}
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
        for (let j=0;j<14;j++) particles.push({ x: monkey.x + (Math.random()-0.5)*20, y: monkey.y + (Math.random()-0.5)*20, vx: (Math.random()-0.5)*260, vy: -80 + Math.random()*120, life: 0.8 + Math.random()*0.6, r: 6 + Math.random()*8, img: 'leaf' });
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
    if (monkey.y > H + 160) {
      try { sThud.currentTime = 0; sThud.play().catch(()=>{}); } catch(e) {}
      running = false;
      showGameOver();
    } else {
      if (checkLanding()) {
        try { sGrab.currentTime = 0; sGrab.play().catch(()=>{}); } catch(e) {}
      }
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
    const tx = -monkey.x + W*0.45;
    const ty = -monkey.y + H*0.45;
    cam.x += (tx - cam.x) * Math.min(dt*6, 1);
    cam.y += (ty - cam.y) * Math.min(dt*6, 1);
  }
  function initStars() { stars = []; for (let i=0;i<160;i++) stars.push({x: Math.random()*W, y: Math.random()*H*0.6, r: Math.random()*1.2+0.3, speed: 0.1+Math.random()*0.4}); }
  function drawRope(nodeX, nodeY, mx, my) {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#6b4a2c';
    ctx.beginPath();
    const cx = nodeX + (mx - nodeX) * 0.5;
    const cy = nodeY + (my - nodeY) * 0.3;
    ctx.moveTo(nodeX, nodeY);
    ctx.quadraticCurveTo(cx, cy, mx, my);
    ctx.stroke();
    ctx.restore();
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
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (bg.complete) {
      const img = bg;
      const ratio = Math.max(canvas.width/img.width, canvas.height/img.height);
      const iw = img.width * ratio, ih = img.height * ratio;
      ctx.drawImage(img, (canvas.width - iw)/2 + cam.x*0.05, (canvas.height - ih)/2 + cam.y*0.03, iw, ih);
    } else { ctx.fillStyle = '#88c080'; ctx.fillRect(0,0,canvas.width,canvas.height); }
    ctx.save();
    ctx.translate(cam.x, cam.y);
    for (let s of stars) { ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); }
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(20,80,40,0.18)';
      ctx.ellipse(n.x, n.y - 20, 64, 38, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.drawImage(handleImg, n.x - 18, n.y - 18, 36, 36);
      if (i % 5 === 0) { ctx.font = '18px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillText(i, n.x - 6, n.y - 30); }
    }
    const node = nodes[monkey.nodeIndex];
    if (monkey.grabbed) { drawRope(node.x, node.y, monkey.x, monkey.y); }
    else { drawRope(node.x, node.y, node.x + Math.sin(monkey.angle || 0)*monkey.length*0.3, node.y + Math.cos(monkey.angle || 0)*monkey.length*0.3); }
    ctx.save();
    ctx.translate(monkey.x, monkey.y);
    const tilt = Math.max(-0.6, Math.min(0.6, (monkey.aVel || 0) * 0.06 + (monkey.vx || 0) * 0.0006));
    ctx.rotate(tilt);
    const scale = monkey.grabbed ? 1 : 1 - Math.min(0.22, Math.abs(monkey.vy || 0) / 1400);
    ctx.scale(scale, scale);
    ctx.drawImage(monkeyImg, -48, -64, 96, 96);
    ctx.restore();
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
    document.getElementById('score-val').textContent = score;
  }
  function showGameOver() {
    const inner = document.getElementById('overlay-inner');
    inner.querySelector('h1').textContent = 'OOPS — Monkey Fell!';
    inner.querySelector('.sub').textContent = 'Score: ' + score + ' — Tap to try again!';
    overlay.style.display = 'flex';
    overlay.classList.remove('overlay-hidden');
    overlay.classList.add('overlay-visible');
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    if (monkey.grabbed) { releaseAndJump(); }
  });
  document.getElementById('start').addEventListener('click', () => {
    overlay.style.display = 'none';
    overlay.classList.remove('overlay-visible');
    overlay.classList.add('overlay-hidden');
    score = 0; generateNodes(); attachToNode(0); initStars(); particles = []; running = true; lastTime = 0; cam.x = 0; cam.y = 0;
  });
  function resize() {
    const w = Math.max(window.innerWidth, 360);
    const h = Math.max(window.innerHeight, 360);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    for (let n of nodes) { n.y = Math.max(120, Math.min(canvas.height-180, n.y)); }
  }
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
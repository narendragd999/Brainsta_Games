// Super Funny Pop — main.js (mobile-friendly)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let DPR = Math.min(window.devicePixelRatio || 1, 2);
function fit(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  draw();
}
addEventListener('resize', fit, {passive:true});
fit();

// UI
const startBtn = document.getElementById('startBtn');
const muteBtn = document.getElementById('muteBtn');
const shareBtn = document.getElementById('shareBtn');
const scoreEl = document.getElementById('score');
let muted = false;

// audio & sounds: attempt AudioContext, fallback to <audio>
let audioCtx = null;
let useAudioElem = false;
const audioElems = {};

const soundFiles = ['boing','fart','laugh','scream','crowd','bgm'];
function loadAudioElements(){
  soundFiles.forEach(s=>{
    const a = document.createElement('audio');
    a.src = s + '.mp3';
    a.preload = 'auto';
    audioElems[s] = a;
  });
  if(audioElems.bgm){ audioElems.bgm.loop = true; audioElems.bgm.volume = 0.4; }
}

async function unlockAudio(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') await audioCtx.resume();
    return true;
  }catch(e){
    useAudioElem = true;
    loadAudioElements();
    return false;
  }
}

function playSound(name){
  if(muted) return;
  if(useAudioElem && audioElems[name]){
    try{ audioElems[name].currentTime = 0; audioElems[name].play().catch(()=>{}); }catch(e){}
    return;
  }
  if(!audioCtx) return;
  // small fun presets
  const now = audioCtx.currentTime;
  const g = audioCtx.createGain(); g.gain.setValueAtTime(0.0001, now); g.connect(audioCtx.destination);
  const o = audioCtx.createOscillator();
  if(name==='boing'){ o.type='sine'; o.frequency.setValueAtTime(800, now); g.gain.exponentialRampToValueAtTime(0.25, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.35); }
  if(name==='fart'){ o.type='sawtooth'; o.frequency.setValueAtTime(180, now); g.gain.exponentialRampToValueAtTime(0.35, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.32); }
  if(name==='laugh'){ o.type='square'; o.frequency.setValueAtTime(520, now); g.gain.exponentialRampToValueAtTime(0.2, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.7); }
  if(name==='scream'){ o.type='triangle'; o.frequency.setValueAtTime(1200, now); g.gain.exponentialRampToValueAtTime(0.28, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.5); }
  if(name==='crowd'){ o.type='sine'; o.frequency.setValueAtTime(260, now); g.gain.exponentialRampToValueAtTime(0.2, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.8); }
  o.connect(g); o.start(now); o.stop(now + 1.2);
}

// fallback play bgm
function playBgmIfAvailable(){
  if(useAudioElem && audioElems.bgm && !audioElems.bgm.playing){ try{ audioElems.bgm.play().catch(()=>{}); }catch(e){} }
}

// character and game state
let pointer = {x:0,y:0,down:false};
canvas.addEventListener('pointerdown', (e)=>{ const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.down = true; fireAt(pointer.x, pointer.y); });
addEventListener('pointermove', (e)=>{ const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; });
addEventListener('pointerup', ()=>{ pointer.down = false; });

let char = { x: 0.5, y: 0.72, r: 72, vy:0, onGround:true, scale:1, bubble:'', anim:0 };
let particles = [];
let confettis = [];
let score = 0;

// funny lines
const lines = ["Uchhle re!", "Arre gir gaya!", "HaHa!", "Ohooo!", "Aye haye!", "Kya baat!","Bakwaas!","Wah bhai wah!","Oj!"];

function fireAt(px, py){
  // compute char center in canvas coords
  const cx = canvas.clientWidth * char.x;
  const cy = canvas.clientHeight * char.y;
  const d = Math.hypot(px - cx, py - cy);
  if(d < char.r * char.scale * 1.4){
    // hit char: big reaction
    char.vy = -12 - Math.random()*6;
    char.onGround = false;
    char.anim = 36;
    char.scale = 1.3;
    char.bubble = lines[Math.floor(Math.random()*lines.length)];
    spawnParticles(cx, cy-20, 22);
    spawnConfetti(cx, cy-40, 18);
    // play random funny sound
    const pick = ['boing','fart','laugh','scream','crowd'][Math.floor(Math.random()*5)];
    playSound(pick);
    // vibration if available
    try{ if(navigator.vibrate) navigator.vibrate(60); }catch(e){}
    score += 10;
    scoreEl.textContent = score;
  } else {
    // miss: small boop and tiny particles
    spawnParticles(px, py, 8);
    playSound('boing');
  }
}

function spawnParticles(x,y,n){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    const s = 2+Math.random()*5;
    particles.push({x,y,vx:Math.cos(a)*(2+Math.random()*6), vy:Math.sin(a)*(2+Math.random()*6), life:30+Math.random()*30, col:`hsl(${Math.random()*60+10},90%,60%)`});
  }
}
function spawnConfetti(x,y,n){
  for(let i=0;i<n;i++){
    confettis.push({x,y, vx:(Math.random()-0.5)*6, vy: -2 - Math.random()*6, rot:Math.random()*360, life:60+Math.random()*40, col:`hsl(${Math.random()*360},90%,50%)`});
  }
}

// game update/draw
function update(){
  // char physics
  if(!char.onGround){
    char.vy += 0.6;
    linearlyIncrement = 0;
    char.y += char.vy / canvas.clientHeight;
    if(char.y >= 0.72){ char.y = 0.72; char.vy = 0; char.onGround = true; char.scale = 1; }
  } else {
    char.scale += (1 - char.scale) * 0.08;
  }
  if(char.anim>0){ char.anim--; if(char.anim<6) char.bubble = (char.anim%2? char.bubble : ''); }

  // particles
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99; p.vy *= 0.995; p.life--; if(p.life<=0) particles.splice(i,1);
  }
  for(let i=confettis.length-1;i>=0;i--){
    const c = confettis[i]; c.x += c.vx; c.y += c.vy; c.vy += 0.25; c.rot += 8; c.life--; if(c.life<=0) confettis.splice(i,1);
  }
}

function draw(){
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  // bg
  ctx.fillStyle = '#fff8f2'; ctx.fillRect(0,0,w,h);
  // draw confetti behind
  for(const c of confettis){ ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot*Math.PI/180); ctx.fillStyle = c.col; ctx.fillRect(-4,-4,8,8); ctx.restore(); }
  // ground
  ctx.fillStyle = '#fff'; ctx.fillRect(0, h*0.78, w, h*0.22);
  // draw particles behind char
  for(const p of particles){ ctx.globalAlpha = Math.max(0, p.life/60); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); }
  ctx.globalAlpha = 1;
  // draw char
  const cx = w * char.x, cy = h * char.y;
  // shadow
  ctx.fillStyle = 'rgba(6,8,10,0.12)'; ctx.beginPath(); ctx.ellipse(cx, h*0.78 - 8, char.r*1.2*char.scale, 12, 0,0,Math.PI*2); ctx.fill();
  // body
  ctx.save(); ctx.translate(cx, cy); ctx.scale(char.scale, char.scale);
  ctx.fillStyle = '#ffd866'; ctx.beginPath(); ctx.ellipse(0, -6, char.r, char.r*0.9, 0,0,Math.PI*2); ctx.fill();
  // eyes
  ctx.fillStyle = '#001'; ctx.beginPath(); ctx.ellipse(-14, -14, 7, 9, 0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -14, 7, 9, 0,0,Math.PI*2); ctx.fill();
  // mouth
  ctx.fillStyle = '#a53'; ctx.beginPath(); ctx.ellipse(0, 4, 12, 6, 0,0,Math.PI); ctx.fill();
  ctx.restore();
  // bubble
  if(char.bubble){
    ctx.save();
    ctx.font = `${Math.max(14, Math.floor(w/28))}px system-ui`;
    const text = char.bubble;
    const padding = 12;
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const bx = cx - tw/2 - padding;
    const by = cy - char.r - 64;
    roundRect(ctx, bx, by, tw + padding*2, 40, 12, true, true);
    ctx.fillStyle = '#111'; ctx.fillText(text, bx + padding, by + 26);
    ctx.restore();
  }
  // hint
  ctx.fillStyle = '#444'; ctx.font = '14px system-ui'; ctx.fillText('Tap the character — it will pop, confetti & funny sounds!', 12, 22);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if(fill){ ctx.fillStyle = 'white'; ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; }
  if(stroke) ctx.stroke();
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();

// start/unlock handlers
startBtn.addEventListener('click', async ()=>{
  startBtn.style.display = 'none';
  const ok = await unlockAudio();
  if(!ok){ loadAudioElements(); }
  playBgmIfAvailable();
});

muteBtn.addEventListener('click', ()=>{ muted = !muted; muteBtn.textContent = muted ? 'Unmute' : 'Mute'; if(useAudioElem && audioElems.bgm){ try{ if(muted) audioElems.bgm.pause(); else audioElems.bgm.play(); }catch(e){} } });

shareBtn.addEventListener('click', ()=>{
  try{
    if(navigator.share) navigator.share({title:'Super Funny Pop', text:'Play this silly game and laugh!', url:location.href});
    else alert('Share is not available in this browser.');
  }catch(e){ alert('Share failed'); }
});

// preload audio elements to improve file:// compatibility
loadAudioElements();

// utility: optionally load webaudio from file buffers (not implemented here)
// Note: if opening via file:// some webviews block audio — hosting via HTTP is advised

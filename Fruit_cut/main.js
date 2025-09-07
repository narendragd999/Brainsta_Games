
// Fruit Slice - enhanced
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
function resizeCanvas(){
  W = Math.min(1400, window.innerWidth*0.96);
  H = Math.min(900, window.innerHeight*0.82);
  canvas.width = W; canvas.height = H;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const FRUITS = ['apple','orange','watermelon','banana','kiwi'];
const IMG = {};
let loaded = 0, total = FRUITS.length + 1;
FRUITS.forEach(n=>{ const i=new Image(); i.src=`assets/${n}.png`; i.onload=()=>{loaded++;}; IMG[n]=i; });
const bombImg = new Image(); bombImg.src='assets/bomb.png'; bombImg.onload=()=>{loaded++;};

const sndSlice = document.getElementById('snd-slice');
const sndPop = document.getElementById('snd-pop');
const sndExplosion = document.getElementById('snd-explosion');

let objects = [], trails = [], particles = [];
let score = 0, playing=false, spawnTimer=0, difficulty=1;

function rand(a,b){return a+Math.random()*(b-a);}
function spawn(){
  // sometimes spawn a bomb
  const isBomb = Math.random() < Math.min(0.12, 0.03 + difficulty*0.01);
  const size = rand(80,160);
  const x = rand(size, canvas.width - size);
  const y = canvas.height + size;
  const vx = rand(-4,4);
  const vy = rand(-18,-10);
  if(isBomb){
    objects.push({type:'bomb',img:bombImg,size,x,y,vx,vy,rot:rand(-0.08,0.08),angle:rand(-0.5,0.5),armed:true});
  } else {
    const name = FRUITS[Math.floor(Math.random()*FRUITS.length)];
    objects.push({type:'fruit',name, img:IMG[name], size, x,y,vx,vy,rot:rand(-0.08,0.08),angle:rand(-0.5,0.5),hit:false});
  }
}

function update(dt){
  spawnTimer -= dt;
  if(spawnTimer<=0){ spawn(); spawnTimer = Math.max(0.5, 1.6 - difficulty*0.08); }
  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i];
    o.vy += 0.68; o.x += o.vx; o.y += o.vy; o.angle += o.rot;
    if(o.y > canvas.height + 220) objects.splice(i,1);
  }
  for(let i=trails.length-1;i>=0;i--){ trails[i].life -= dt*2; if(trails[i].life<=0) trails.splice(i,1); }
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.vy += 0.9; p.x += p.vx; p.y += p.vy; p.life -= dt;
    if(p.life<=0) particles.splice(i,1);
  }
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // objects
  for(const o of objects){
    ctx.save();
    ctx.translate(o.x,o.y);
    ctx.rotate(o.angle);
    ctx.drawImage(o.img, -o.size/2, -o.size/2, o.size, o.size);
    // bomb glow
    if(o.type==='bomb'){
      ctx.beginPath();
      ctx.arc(0,0,o.size*0.55,0,Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fill();
    }
    ctx.restore();
  }
  // particles (juice)
  for(const p of particles){
    ctx.globalAlpha = Math.max(0, p.life/1.2);
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // trails
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(const t of trails){
    ctx.beginPath();
    ctx.lineWidth = t.width;
    ctx.globalAlpha = Math.max(0,t.life);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.moveTo(t.points[0].x, t.points[0].y);
    for(let i=1;i<t.points.length;i++) ctx.lineTo(t.points[i].x, t.points[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

let last = performance.now();
function loop(now){
  const dt = (now-last)/1000; last=now;
  if(playing) update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// input
let pointer = {down:false, path:[]};
canvas.addEventListener('pointerdown', (e)=>{ pointer.down=true; pointer.path=[getPos(e)]; });
canvas.addEventListener('pointermove', (e)=>{ if(!pointer.down) return; const p=getPos(e); pointer.path.push(p); trails.push({points: pointer.path.slice(-8), life:1.0, width: rand(8,18)}); checkHits(p); });
canvas.addEventListener('pointerup', ()=>{ pointer.down=false; pointer.path=[]; });

function getPos(e){ const rect = canvas.getBoundingClientRect(); return {x: e.clientX-rect.left, y: e.clientY-rect.top}; }

function checkHits(p){
  for(let i=objects.length-1;i>=0;i--){
    const o = objects[i];
    if(o.type==='fruit' && !o.hit){
      const dx = o.x - p.x; const dy = o.y - p.y;
      if(Math.sqrt(dx*dx+dy*dy) < o.size*0.45){ // sliced
        o.hit = true;
        score += Math.ceil(o.size/12);
        document.getElementById('scorev').textContent = score;
        sndSlice.currentTime=0; sndSlice.play();
        sndPop.currentTime=0; sndPop.play();
        // spawn juice particles
        for(let k=0;k<12;k++){
          particles.push({x:o.x+rand(-8,8), y:o.y+rand(-8,8), vx:rand(-6,6), vy:rand(-6,2), size: rand(3,10), life: rand(0.6,1.2), color: `rgba(${rand(160,255)},${rand(40,220)},${rand(40,220)},1)`});
        }
        // create slices as smaller objects
        for(let k=0;k<6;k++){
          objects.push({type:'slice', img:o.img, size:o.size*0.35*(0.6+Math.random()*0.8), x:o.x+rand(-6,6), y:o.y+rand(-6,6), vx:rand(-6,6), vy:rand(-6,2), rot:rand(-0.6,0.6), angle:rand(-2,2)});
        }
        objects.splice(i,1);
      }
    } else if(o.type==='bomb'){
      const dx=o.x - p.x; const dy=o.y - p.y;
      if(Math.sqrt(dx*dx+dy*dy) < o.size*0.45){
        // bomb hit -> explosion
        sndExplosion.currentTime=0; sndExplosion.play();
        gameOver();
        return;
      }
    }
  }
}

function gameOver(){
  playing=false;
  document.getElementById('finalscore').textContent = score;
  document.getElementById('gameover').style.display='flex';
}

document.getElementById('startBtn').addEventListener('click', ()=>{ startGame(); });
document.getElementById('retry').addEventListener('click', ()=>{ document.getElementById('gameover').style.display='none'; startGame(); });

function startGame(){
  score=0; document.getElementById('scorev').textContent=score;
  objects=[]; particles=[]; trails=[]; playing=true; difficulty=1; spawnTimer=0.4;
  document.getElementById('splash').style.display='none';
  // small warmup spawn
  for(let i=0;i<3;i++){ setTimeout(()=>spawn(), i*400); }
}

setInterval(()=>{ if(playing) difficulty += 0.03; }, 2000);


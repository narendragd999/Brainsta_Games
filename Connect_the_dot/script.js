const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
let w,h;const DPR=window.devicePixelRatio||1;
function resize(){w=Math.min(window.innerWidth-20,600);h=w;
canvas.style.width=w+'px';canvas.style.height=h+'px';
canvas.width=w*DPR;canvas.height=h*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
window.addEventListener('resize',resize);resize();

// circle boundary
const circle={x:w/2,y:h/2,r:w/2-10};

// ball state
let ball={x:circle.x,y:circle.y,vx:0,vy:0,r:10,color:'#4af'};

// trails
let trails=[];

// physics
function update(dt){
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;
  // friction
  ball.vx*=0.995;ball.vy*=0.995;
  // collision with circle boundary
  let dx=ball.x-circle.x,dy=ball.y-circle.y;
  let dist=Math.sqrt(dx*dx+dy*dy);
  if(dist+ball.r>circle.r){
    let nx=dx/dist,ny=dy/dist;
    let overlap=dist+ball.r-circle.r;
    ball.x-=nx*overlap;ball.y-=ny*overlap;
    let dot=ball.vx*nx+ball.vy*ny;
    ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;
  }
  // add trail
  trails.push({x:ball.x,y:ball.y,color:`hsl(${(Date.now()/10)%360},80%,60%)`,time:Date.now()});
  // keep trails only 2s
  const now=Date.now();
  trails=trails.filter(t=>now-t.time<2000);
}

function draw(){
  ctx.clearRect(0,0,w,h);
  // circle
  ctx.lineWidth=4;ctx.strokeStyle='#0f0';
  ctx.beginPath();ctx.arc(circle.x,circle.y,circle.r,0,Math.PI*2);ctx.stroke();
  // trails
  for(let t of trails){
    ctx.fillStyle=t.color;
    ctx.beginPath();ctx.arc(t.x,t.y,2,0,Math.PI*2);ctx.fill();
  }
  // ball
  ctx.fillStyle=ball.color;
  ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
}

let last=0;
function loop(ts){if(!last)last=ts;let dt=(ts-last)/16;last=ts;
update(dt);draw();requestAnimationFrame(loop);}loop();

// swipe handling
let startX=0,startY=0,startT=0;
canvas.addEventListener('pointerdown',e=>{
  startX=e.clientX;startY=e.clientY;startT=Date.now();
});
canvas.addEventListener('pointerup',e=>{
  let dx=e.clientX-startX,dy=e.clientY-startY;
  let dt=(Date.now()-startT)/1000;if(dt<0.3){
    ball.vx=dx*0.5;ball.vy=dy*0.5;
  }
});

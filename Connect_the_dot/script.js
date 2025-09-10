// Dot Lines Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const DPR = window.devicePixelRatio || 1;
let w = 640, h = 640;
const circlePadding = 12;
let lines = [];
let dotRel = {x:0.2, y:0.2}; // relative position inside canvas
const dotRadius = 12;

function resize() {
  // make square canvas, responsive
  const maxWidth = Math.min(window.innerWidth - 40, 720);
  w = maxWidth;
  h = maxWidth;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  drawAll();
}

window.addEventListener('resize', resize);
resize();

function getCircle() {
  const cx = w/2;
  const cy = h/2;
  const radius = Math.min(w,h)/2 - circlePadding;
  return {cx, cy, radius};
}

function drawAll() {
  // background
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0,0,w,h);

  // draw circle
  const c = getCircle();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#36ff66'; // bright green rim
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI*2);
  ctx.stroke();

  // draw existing lines
  for (const ln of lines) {
    ctx.beginPath();
    ctx.moveTo(ln.x1, ln.y1);
    ctx.lineTo(ln.x2, ln.y2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = ln.color;
    ctx.stroke();
  }

  // draw dot
  const dot = getDotPosition();
  ctx.beginPath();
  ctx.fillStyle = '#4860ff';
  ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI*2);
  ctx.fill();

  // small inner highlight
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.arc(dot.x - 4, dot.y - 3, 4, 0, Math.PI*2);
  ctx.fill();

  // small caption
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('the end...', c.cx, h - 18);
}

function getDotPosition() {
  // dotRel.x / y are relative [0..1] wrt canvas
  return {x: dotRel.x * w, y: dotRel.y * h};
}

function pointInCircle(px, py, circle) {
  const dx = px - circle.cx, dy = py - circle.cy;
  return (dx*dx + dy*dy) <= (circle.radius * circle.radius);
}

function randColor() {
  // generate a nice bright color
  const hue = Math.floor(Math.random()*360);
  return `hsl(${hue} 80% 60%)`;
}

function addLineTo(x, y) {
  const dot = getDotPosition();
  const c = getCircle();
  if (!pointInCircle(x, y, c)) return; // only add if touched inside circle
  lines.push({x1: dot.x, y1: dot.y, x2: x, y2: y, color: randColor()});
  drawAll();
}

// handle touch / mouse
function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches.length) {
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  const x = (clientX - rect.left);
  const y = (clientY - rect.top);
  return {x, y};
}

canvas.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  const p = getEventPos(ev);
  addLineTo(p.x, p.y);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  lines = [];
  drawAll();
});

document.getElementById('dotPos').addEventListener('change', (ev) => {
  const v = ev.target.value.split(',');
  dotRel.x = parseFloat(v[0]);
  dotRel.y = parseFloat(v[1]);
  drawAll();
});

// initial draw
drawAll();

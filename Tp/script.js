const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player, obstacles, coins, score, distance, time, gameOver, speed, gameInterval, timerInterval;

// Player settings
const playerSize = 40;
const lanes = [80, 180, 280]; // x positions for 3 lanes

function initGame() {
  player = { x: lanes[1], y: 500, lane: 1 };
  obstacles = [];
  coins = [];
  score = 0;
  distance = 0;
  time = 0;
  speed = 4;
  gameOver = false;

  clearInterval(gameInterval);
  clearInterval(timerInterval);

  gameInterval = setInterval(updateGame, 30);
  timerInterval = setInterval(() => {
    time++;
    document.getElementById("timer").innerText = `⏱ Time: ${time}s`;
  }, 1000);

  document.getElementById("score").innerText = "💰 Score: 0";
  document.getElementById("distance").innerText = "📏 Distance: 0";
}

function updateGame() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, playerSize, playerSize);

  // Spawn obstacles & coins
  if (Math.random() < 0.03) {
    obstacles.push({ x: lanes[Math.floor(Math.random()*3)], y: -40 });
  }
  if (Math.random() < 0.02) {
    coins.push({ x: lanes[Math.floor(Math.random()*3)], y: -20 });
  }

  // Update obstacles
  ctx.fillStyle = "red";
  obstacles.forEach((o, i) => {
    o.y += speed;
    ctx.fillRect(o.x, o.y, playerSize, playerSize);
    if (o.y > canvas.height) obstacles.splice(i, 1);
    if (collision(player, o)) endGame();
  });

  // Update coins
  ctx.fillStyle = "gold";
  coins.forEach((c, i) => {
    c.y += speed;
    ctx.beginPath();
    ctx.arc(c.x + 20, c.y + 20, 15, 0, Math.PI*2);
    ctx.fill();
    if (c.y > canvas.height) coins.splice(i, 1);
    if (collision(player, c)) {
      score += 10;
      coins.splice(i, 1);
      document.getElementById("score").innerText = `💰 Score: ${score}`;
    }
  });

  // Increase difficulty
  distance++;
  if (distance % 200 === 0) speed += 0.5;
  document.getElementById("distance").innerText = `📏 Distance: ${distance}`;
}

function collision(a, b) {
  return (
    a.x < b.x + playerSize &&
    a.x + playerSize > b.x &&
    a.y < b.y + playerSize &&
    a.y + playerSize > b.y
  );
}

function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  document.getElementById("finalStats").innerText =
    `Score: ${score}, Distance: ${distance}, Time: ${time}s`;
  document.getElementById("gameOverModal").style.display = "flex";
}

// Controls
document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "ArrowLeft" && player.lane > 0) {
    player.lane--;
    player.x = lanes[player.lane];
  } else if (e.key === "ArrowRight" && player.lane < 2) {
    player.lane++;
    player.x = lanes[player.lane];
  }
});

// Mobile swipe support
let touchStartX = 0;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});
canvas.addEventListener("touchend", e => {
  let touchEndX = e.changedTouches[0].screenX;
  if (touchEndX < touchStartX - 50 && player.lane > 0) {
    player.lane--;
    player.x = lanes[player.lane];
  } else if (touchEndX > touchStartX + 50 && player.lane < 2) {
    player.lane++;
    player.x = lanes[player.lane];
  }
});

// Restart button
document.getElementById("restartBtn").addEventListener("click", initGame);

// Instructions modal
document.getElementById("instructionsBtn").addEventListener("click", () => {
  document.getElementById("instructionsModal").style.display = "flex";
});
function closeInstructions() {
  document.getElementById("instructionsModal").style.display = "none";
}

// Game over modal close
function closeGameOver() {
  document.getElementById("gameOverModal").style.display = "none";
  initGame();
}

// Start game first time
initGame();
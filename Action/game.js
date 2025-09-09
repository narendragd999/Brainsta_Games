// Simple action shooter - responsive for webview on phones.
// Touch controls: left half = move left, right half = move right, tap top = shoot.
// The game assets are SVGs in /assets.

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  backgroundColor: '#0b1020',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
const game = new Phaser.Game(config);

let player, cursors, bullets, lastFired = 0, enemies, score = 0, scoreText, music;

function preload() {
  this.load.svg('bg', 'assets/bg.svg');
  this.load.svg('player', 'assets/player.svg');
  this.load.svg('enemy', 'assets/enemy.svg');
  this.load.svg('bullet', 'assets/bullet.svg');
  this.load.audio('music', ['assets/music.wav']);
}

function create() {
  // Background - stretched nicely
  this.add.image(640, 360, 'bg').setDisplaySize(1280,720);

  // Player
  player = this.physics.add.sprite(640, 600, 'player').setCollideWorldBounds(true);
  player.setScale(0.9);

  // Bullets group
  bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 30
  });

  // Enemies
  enemies = this.physics.add.group();
  spawnWave(this);

  // Collisions
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.overlap(player, enemies, playerHit, null, this);

  // Score text
  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '28px', fill: '#fff' }).setScrollFactor(0);

  // Input
  cursors = this.input.keyboard.createCursorKeys();
  this.input.on('pointerdown', (pointer) => {
    handleTouch(pointer, this);
  });

  // Music
  music = this.sound.add('music', { loop: true, volume: 0.5 });
  music.play();

  // Responsive scaling: adjust display size on resize events
  this.scale.on('resize', (gameSize) => {
    const width = gameSize.width;
    const height = gameSize.height;
    this.cameras.resize(width, height);
  });

  // Make some visual "shandar" animation for player
  this.tweens.add({
    targets: player,
    y: '+=6',
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

let waveTimer = 0;
function update(time, delta) {
  // Keyboard controls for desktop testing
  const speed = 350;
  player.body.setVelocityX(0);

  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Auto-fire on hold or every 200ms when touching
  if (this.input.activePointer.isDown) {
    if (time > lastFired + 160) {
      fireBullet(this);
      lastFired = time;
    }
  }

  // Simple enemy movement
  enemies.children.iterate((e) => {
    if (!e) return;
    e.x += Math.sin((time + e.spawnOffset)/500) * 0.6;
    e.y += 0.02 * delta; // slow drop
    if (e.y > 820) {
      e.destroy();
      // small penalty
      score = Math.max(0, score - 5);
      scoreText.setText('Score: ' + score);
    }
  });

  // Spawn more waves
  waveTimer += delta;
  if (waveTimer > 3000) {
    spawnWave(this);
    waveTimer = 0;
  }
}

function handleTouch(pointer, scene) {
  // If touch is upper half -> shoot
  if (pointer.y < scene.scale.height * 0.4) {
    fireBullet(scene);
    return;
  }
  // Otherwise move player to touch x with tween
  scene.tweens.add({
    targets: player,
    x: pointer.x * (1280/scene.scale.width),
    duration: 200,
    ease: 'Power2'
  });
}

function fireBullet(scene) {
  const b = bullets.get();
  if (b) {
    b.setActive(true);
    b.setVisible(true);
    b.body.reset(player.x, player.y - 30);
    b.setScale(0.6);
    b.body.setVelocityY(-700);
    scene.time.delayedCall(2500, () => { if (b) b.destroy(); });
  }
}

function spawnWave(scene) {
  const count = Phaser.Math.Between(3, 7);
  const startX = 120;
  const gap = (1040) / Math.max(1, count-1);
  for (let i=0;i<count;i++) {
    const x = startX + i*gap + Phaser.Math.Between(-30,30);
    const y = Phaser.Math.Between(-120, -40);
    const e = scene.physics.add.sprite(x, y, 'enemy');
    e.setScale(0.9);
    e.spawnOffset = Phaser.Math.Between(0,1000);
    enemies.add(e);
    e.setCircle(28);
  }
}

function hitEnemy(bullet, enemy) {
  bullet.destroy();
  enemy.destroy();
  score += 10;
  scoreText.setText('Score: ' + score);
  // small explosion tween
  const s = enemy.scene;
  const ex = s.add.rectangle(enemy.x, enemy.y, 12,12, 0xffcc33).setDepth(10);
  s.tweens.add({
    targets: ex,
    alpha: 0,
    scale: 6,
    duration: 300,
    onComplete: ()=> ex.destroy()
  });
}

function playerHit(p, enemy) {
  enemy.destroy();
  // camera shake for action
  p.scene.cameras.main.shake(250, 0.02);
  score = Math.max(0, score - 30);
  scoreText.setText('Score: ' + score);
}

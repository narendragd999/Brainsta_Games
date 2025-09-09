// Upgraded action shooter — uses higher-res assets and longer music to increase package size.
// Controls: touch/keyboard. Added animations, particle explosions, and improved enemy behavior.
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  backgroundColor: '#050611',
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

let player, cursors, bullets, lastFired = 0, enemies, score = 0, scoreText, bg, music, sfxShoot, sfxExplode, particles;

function preload() {
  this.load.image('bg', 'assets/bg_720.bmp'); // big background
  this.load.spritesheet('player', 'assets/player_sheet.png', { frameWidth: 256, frameHeight: 256 });
  this.load.spritesheet('enemy', 'assets/enemy_sheet.png', { frameWidth: 128, frameHeight: 128 });
  this.load.spritesheet('explosion', 'assets/explosion_sheet.png', { frameWidth: 128, frameHeight: 128 });
  this.load.image('bullet', 'assets/bullet_high.png');
  // longer music files
  this.load.audio('music1', ['assets/music_long1.wav']);
  this.load.audio('music2', ['assets/music_long2.wav']);
  this.load.audio('sfx_shot', ['assets/sfx_shot.wav']);
  this.load.audio('sfx_explode', ['assets/sfx_explode.wav']);
}

function create() {
  bg = this.add.image(640,360,'bg').setDisplaySize(1280,720);

  // Player sprite with animation
  player = this.physics.add.sprite(640, 600, 'player').setCollideWorldBounds(true).setScale(0.7);
  this.anims.create({
    key: 'player_fly',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  player.play('player_fly');

  bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 50 });

  enemies = this.physics.add.group();
  spawnWave(this);

  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.overlap(player, enemies, playerHit, null, this);

  scoreText = this.add.text(20,20,'Score: 0', { fontSize: '28px', fill:'#fff' });

  cursors = this.input.keyboard.createCursorKeys();
  this.input.on('pointerdown', (p) => { handleTouch(p, this); });

  // Music and SFX
  music = this.sound.add('music1', { loop: true, volume: 0.6 });
  music.play();
  // background alternate music after some time
  this.time.delayedCall(35000, ()=> {
    if (this.sound.get('music2')) {
      this.sound.add('music2', { loop: true, volume: 0.4 }).play();
    }
  });

  sfxShoot = this.sound.add('sfx_shot', { volume: 0.6 });
  sfxExplode = this.sound.add('sfx_explode', { volume: 0.8 });

  // particles for explosions
  particles = this.add.particles('bullet');

  this.tweens.add({ targets: player, y: '+=6', duration:600, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

  // camera shake pointer demo: tap with two fingers
  this.input.on('pointerdown', (p)=>{
    if (p.getDistance() > 80) this.cameras.main.shake(200, 0.02);
  });
}

let waveTimer = 0;
function update(time, delta) {
  const speed = 420;
  player.body.setVelocityX(0);

  if (cursors.left.isDown) player.body.setVelocityX(-speed);
  else if (cursors.right.isDown) player.body.setVelocityX(speed);

  if (this.input.activePointer.isDown) {
    if (time > lastFired + 140) {
      fireBullet(this);
      lastFired = time;
    }
  }

  enemies.children.iterate((e) => {
    if (!e) return;
    e.x += Math.cos((time + e.spawnOffset)/400) * 0.9;
    e.y += 0.035 * delta;
    if (e.y > 820) { e.destroy(); score = Math.max(0, score - 3); scoreText.setText('Score: ' + score); }
  });

  waveTimer += delta;
  if (waveTimer > 2200) { spawnWave(this); waveTimer = 0; }
}

function handleTouch(pointer, scene) {
  if (pointer.y < scene.scale.height * 0.45) { fireBullet(scene); return; }
  scene.tweens.add({ targets: player, x: pointer.x * (1280/scene.scale.width), duration: 180, ease: 'Power2' });
}

function fireBullet(scene) {
  const b = bullets.get();
  if (b) {
    b.setActive(true); b.setVisible(true);
    b.body.reset(player.x, player.y - 40);
    b.setScale(0.9);
    b.body.setVelocityY(-900);
    sfxShoot.play();
    scene.time.delayedCall(2200, ()=> { if (b) b.destroy(); });
  }
}

function spawnWave(scene) {
  const count = Phaser.Math.Between(4, 9);
  const startX = 120;
  const gap = (1040) / Math.max(1, count-1);
  for (let i=0;i<count;i++) {
    const x = startX + i*gap + Phaser.Math.Between(-40,40);
    const y = Phaser.Math.Between(-220, -40);
    const e = scene.physics.add.sprite(x, y, 'enemy').setScale(0.9);
    e.spawnOffset = Phaser.Math.Between(0,1200);
    scene.anims.create({
      key: 'enemy_move_' + i,
      frames: scene.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    e.play('enemy_move_' + i);
    enemies.add(e);
    e.setCircle(44);
  }
}

function hitEnemy(b, enemy) {
  b.destroy(); enemy.destroy();
  score += 12; scoreText.setText('Score: ' + score);
  const s = enemy.scene;
  // explosion sprite
  const ex = s.add.sprite(enemy.x, enemy.y, 'explosion').setScale(1.0);
  ex.play({ key: 'boom', repeat: 0 });
  sfxExplode.play();
  // particles burst
  particles.createEmitter({ x: enemy.x, y: enemy.y, speed: { min: -200, max: 200 }, lifespan: 400, quantity: 16, scale: { start: 0.8, end: 0 }, blendMode: 'ADD' }).explode(24, enemy.x, enemy.y);
  s.time.delayedCall(600, ()=> ex.destroy());
}

function playerHit(p, enemy) {
  enemy.destroy();
  p.scene.cameras.main.shake(300, 0.03);
  score = Math.max(0, score - 40);
  scoreText.setText('Score: ' + score);
}

// create explosion animation after load
Phaser.Scene.create = (function(orig) {
  return function() {
    if (orig) orig.apply(this, arguments);
    if (this.anims && !this.anims.get('boom')) {
      this.anims.create({ key:'boom', frames: this.anims.generateFrameNumbers('explosion', {start:0, end:7}), frameRate: 16, repeat: 0 });
    }
  }
})(Phaser.Scene.create);

let player, cursors, bullets, enemies, lastFired=0;
let tiltX=0;
const config={type:Phaser.AUTO,width:800,height:600,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:{preload,create,update}};
const game=new Phaser.Game(config);
function preload(){
this.load.image('bg1','assets/bg1.png');
this.load.image('bg2','assets/bg2.png');
this.load.image('bg3','assets/bg3.png');
this.load.image('player','assets/player.png');
this.load.image('enemy','assets/enemy.png');
this.load.image('bullet','assets/bullet.png');
}
function create(){
this.add.image(400,300,'bg1'); this.add.image(400,300,'bg2').setAlpha(0.3); this.add.image(400,300,'bg3').setAlpha(0.2);
player=this.physics.add.sprite(400,500,'player').setCollideWorldBounds(true);
bullets=this.physics.add.group(); enemies=this.physics.add.group();
cursors=this.input.keyboard.createCursorKeys();
if(window.DeviceOrientationEvent){window.addEventListener('deviceorientation',function(event){tiltX=event.gamma;},true);}
this.time.addEvent({delay:1000,loop:true,callback:()=>{let x=Phaser.Math.Between(50,750); let e=enemies.create(x,0,'enemy'); e.setVelocityY(100);}});
this.physics.add.overlap(bullets,enemies,(b,e)=>{e.destroy();b.destroy();});}
function update(time){player.setVelocityX(0);if(cursors.left.isDown){player.setVelocityX(-200);}else if(cursors.right.isDown){player.setVelocityX(200);}if(Math.abs(tiltX)>5){player.setVelocityX(tiltX*5);}if(cursors.space.isDown&&time>lastFired){let bullet=bullets.create(player.x,player.y-20,'bullet');bullet.setVelocityY(-300);lastFired=time+300;}}
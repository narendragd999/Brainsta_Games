// Ha Ha Master - Upgraded Game
(() => {
  const playArea = document.getElementById('playArea');
  const tpl = document.getElementById('charTpl');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const scoreVal = document.getElementById('scoreVal');
  const bestVal = document.getElementById('bestVal');
  const comboVal = document.getElementById('comboVal');
  const multVal = document.getElementById('multVal');
  const centerMsg = document.getElementById('centerMsg');

  const areAudio = document.getElementById('arePagal');
  const popAudio = document.getElementById('popSound');
  const powerAudio = document.getElementById('powerSound');

  let running = false, score = 0, best = 0, combo = 0, multiplier = 1;
  let spawnInterval = null, difficulty = 1200; // spawn every X ms
  let timeSinceLast = 0;

  const lines = [
    "अरे पागल!", "हा हा!", "क्या बात है!", "बढ़िया!", "कमाल है!", "चलो हँसते हैं!",
    "और दिखाओ!", "वााह!", "मस्त!", "हाहाहा!"
  ];

  function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
  function playSound(audio){
    if(!audio) return;
    try{ audio.currentTime=0; audio.play(); }catch(e){}
    if(navigator.vibrate) navigator.vibrate(30);
  }

  function createCharacter(){
    const node = tpl.content.firstElementChild.cloneNode(true);
    const face = node.querySelector('.face');
    const bubble = node.querySelector('.bubble');
    bubble.textContent = lines[randomInt(0,lines.length-1)];
    const rect = playArea.getBoundingClientRect();
    const padding = Math.min(rect.width, rect.height) * 0.12;
    const x = randomInt(padding, rect.width - padding);
    const y = randomInt(padding, rect.height - padding);
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.classList.add('pop');
    // larger ones when difficulty high
    playArea.appendChild(node);

    const onTap = (e) => {
      e.stopPropagation();
      if(!running) return;
      node.classList.add('laugh');
      // score calculation with combo and multiplier
      combo += 1;
      if(combo % 5 === 0){ multiplier += 1; multVal.textContent = multiplier; showFloatingText(node, "मल्टी +" + multiplier); playPowerup(); }
      const gained = 1 * multiplier;
      score += gained;
      scoreVal.textContent = score;
      comboVal.textContent = combo;
      // visual feedback and sound
      node.querySelector('.bubble').textContent = "हाहा! +" + gained;
      playSound(popAudio);
      // remove node quickly
      setTimeout(()=> { if(node && node.remove) node.remove(); }, 520);

      // small confetti burst
      spawnConfettiAt(node.offsetLeft + 20, node.offsetTop + 20);

      // reset combo decay timer
      resetComboTimeout();
      node.removeEventListener('pointerdown', onTap);
    };

    node.addEventListener('pointerdown', onTap);
    // auto remove after some time, penalize combo reset
    setTimeout(()=> { if(node && node.remove) node.remove(); }, randomInt(2000,3800));
  }

  let comboTimeout = null;
  function resetComboTimeout(){
    if(comboTimeout) clearTimeout(comboTimeout);
    comboTimeout = setTimeout(()=>{ combo = 0; multiplier = 1; comboVal.textContent = 0; multVal.textContent = 1; }, 3500);
  }

  // power-up
  function spawnPowerup(){
    const p = document.createElement('div');
    p.className = 'character powerup';
    p.innerHTML = '<div class="face">⭐</div><div class="bubble">पावरअप</div>';
    const rect = playArea.getBoundingClientRect();
    const x = randomInt(60, rect.width-60);
    const y = randomInt(60, rect.height-60);
    p.style.left = x + 'px'; p.style.top = y + 'px';
    playArea.appendChild(p);
    p.addEventListener('pointerdown', ()=>{
      // grant random bonus: +50 points or instant combo boost or slow time
      const what = randomInt(1,3);
      if(what===1){ score += 50; showCenterText("+50 बोनस!"); }
      else if(what===2){ combo += 3; showCenterText("कॉम्बो बूस्ट!"); }
      else { // slow spawn by increasing difficulty value temporarily
        difficulty += 600; setTimeout(()=>{ difficulty -= 600; }, 4000); showCenterText("धीमा हुआ (साहेब)!"); }
      scoreVal.textContent = score;
      playSound(powerAudio);
      p.remove();
      spawnConfettiAt(x,y,15);
    });
    setTimeout(()=> { if(p && p.remove) p.remove(); }, 5000);
  }

  function showCenterText(text){
    centerMsg.textContent = text;
    centerMsg.style.opacity = 1;
    setTimeout(()=>{ centerMsg.textContent = ""; }, 900);
  }

  function showFloatingText(node, txt){
    const f = document.createElement('div');
    f.textContent = txt;
    f.style.position = 'absolute';
    f.style.left = (node.offsetLeft + 20) + 'px';
    f.style.top = (node.offsetTop - 20) + 'px';
    f.style.fontWeight = '800';
    f.style.color = '#ff4d6d';
    playArea.appendChild(f);
    f.animate([{opacity:1, transform:'translateY(0)'},{opacity:0, transform:'translateY(-40px)'}], {duration:800}).onfinish = ()=> f.remove();
  }

  // confetti
  function spawnConfettiAt(x,y,count=8){
    for(let i=0;i<count;i++){
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.background = ['#ff6b6b','#ffd166','#8ac6d1','#6ee7b7'][randomInt(0,3)];
      playArea.appendChild(c);
      const dx = randomInt(-120,120), dy = randomInt(-220,-40), rot = randomInt(0,360);
      c.animate([{transform:`translate(0px,0px) rotate(${rot}deg)`, opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${rot+360}deg)`, opacity:0}], {duration:900 + randomInt(0,500), easing:'cubic-bezier(.2,.7,.2,1)'}).onfinish = ()=> c.remove();
    }
  }

  // difficulty loop
  function startSpawning(){
    if(spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(()=>{
      // spawn 1-3 characters; chance for powerup increases with score
      const n = randomInt(1, Math.max(1, Math.min(4, Math.floor(3000/difficulty)+1)));
      for(let i=0;i<n;i++) createCharacter();
      if(Math.random() < Math.min(0.12, score/4000)) spawnPowerup();
      // slowly increase difficulty (faster spawns)
      difficulty = Math.max(420, difficulty - 8);
    }, difficulty);
  }

  function stopSpawning(){ if(spawnInterval) clearInterval(spawnInterval); spawnInterval=null; }

  // achievements check
  function checkAchievements(){
    let achieved = [];
    if(score >= 100 && !localStorage.getItem('ach_100')){ localStorage.setItem('ach_100','1'); achieved.push('100 स्कोर!'); }
    if(score >= 500 && !localStorage.getItem('ach_500')){ localStorage.setItem('ach_500','1'); achieved.push('500 स्कोर!'); }
    if(combo >= 10 && !localStorage.getItem('ach_combo')){ localStorage.setItem('ach_combo','1'); achieved.push('कॉम्बो मास्टर!'); }
    if(achieved.length) showCenterText(achieved.join(' · '));
  }

  // main controls
  function startGame(){
    if(running) return;
    running = true; score = 0; combo = 0; multiplier = 1; difficulty = 1200;
    scoreVal.textContent = score; comboVal.textContent = combo; multVal.textContent = multiplier;
    centerMsg.textContent = "खेल आरंभ हुआ!";
    startSpawning();
    playArea.focus();
    // periodic checks
    window.gameTicker = setInterval(()=>{
      checkAchievements();
      // update best
      best = Math.max(best, score);
      bestVal.textContent = best;
      localStorage.setItem('hahabest', best);
    }, 800);
  }

  function stopGame(){
    running = false;
    stopSpawning();
    if(window.gameTicker) clearInterval(window.gameTicker);
    showCenterText("खेल रुका! बेस्ट: " + best);
  }

  // reset scores
  function resetAll(){
    localStorage.removeItem('hahabest');
    localStorage.removeItem('ach_100');
    localStorage.removeItem('ach_500');
    localStorage.removeItem('ach_combo');
    best = 0;
    bestVal.textContent = 0;
    showCenterText("स्कोर रीसेट हुआ।");
  }

  // load best from storage
  function loadBest(){ best = parseInt(localStorage.getItem('hahabest')||'0'); bestVal.textContent = best; }

  // powerup sound helper
  function playPowerup(){ playSound(powerAudio); }

  // start/stop handlers
  startBtn.addEventListener('click', ()=> { if(!running) startGame(); else stopGame(); startBtn.textContent = running ? 'रोकें' : 'शुरू करें'; });
  resetBtn.addEventListener('click', ()=>{ resetAll(); });

  // tap on playArea starts game if not running
  playArea.addEventListener('pointerdown', (e)=>{ if(!running) startGame(); });

  // initial load
  loadBest();
  centerMsg.textContent = "टैप करके शुरू करें — मज़ा बढ़ेगा हर लेवल पर!";

  // expose for debugging
  window.__hhm = { start:startGame, stop:stopGame };

})();
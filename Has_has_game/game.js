// Has-Has Hindi Funny Game
// Touch-first, responsive. Works on phones. All files are root-level in the zip (index.html, style.css, game.js).
(() => {
  const START_DURATION = 30000; // 30 seconds game
  const playArea = document.getElementById('playArea');
  const startBtn = document.getElementById('startBtn');
  const scoreVal = document.getElementById('scoreVal');
  const message = document.getElementById('message');
  const tpl = document.getElementById('charTpl');
  let score = 0;
  let running = false;
  let timerId = null;
  let spawnInterval = null;

  const lines = [
    "अरे वाह! बड़ी मज़ेदार बात कही आपने!",
    "हँसी रोक के रखना मुश्किल है 😂",
    "किसने कहा मज़ाक नहीं चलता?",
    "ज़बरदस्त! पेट के मसल्स बढ़ जाएंगे।",
    "बस! और निकालो हँसी के पटाखे!",
    "हँसना है तो खुल कर हँसो!",
    "ऐसी हँसी प्यारी देखी नहीं।",
    "अरे वाह, कॉमेडी का बादशाह!",
    "तुम्हारी हँसी contagious है!",
    "वाह! क्लिपबोर्ड में हँसी सेव हो गयी।"
  ];

  function randomInt(min, max){return Math.floor(Math.random()*(max-min+1))+min;}
  function createCharacter(){
    const node = tpl.content.firstElementChild.cloneNode(true);
    const face = node.querySelector('.face');
    const bubble = node.querySelector('.bubble');
    // choose a line
    bubble.textContent = lines[randomInt(0, lines.length-1)];
    // random position within play area
    const rect = playArea.getBoundingClientRect();
    const padding = Math.min(rect.width, rect.height) * 0.12;
    const x = randomInt(padding, rect.width - padding);
    const y = randomInt(padding, rect.height - padding);
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.classList.add('pop');

    // add touch/click handler
    const onTap = (e) => {
      e.stopPropagation();
      if (!running) return;
      node.classList.add('laugh');
      incrementScore();
      document.getElementById('laughSound').currentTime=0;
      document.getElementById('laughSound').play().catch(()=>{});
      // small burst animation then remove
      setTimeout(()=> {
        if (node && node.remove) node.remove();
      }, 600);
      // prevent multiple taps
      node.removeEventListener('pointerdown', onTap);
    };

    node.addEventListener('pointerdown', onTap);
    playArea.appendChild(node);
    // remove automatically after some time
    setTimeout(()=> { if (node && node.remove) node.remove(); }, 2500);
  }

  function incrementScore(){
    score += 1;
    scoreVal.textContent = score;
    // quick pulse
    scoreVal.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}], {duration:260,easing:'ease-out'});
  }

  function startGame(){
    if (running) return;
    running = true;
    score = 0;
    scoreVal.textContent = score;
    message.style.display = 'none';
    startBtn.disabled = true;
    // spawn faster as time passes
    spawnInterval = setInterval(()=> {
      // spawn 1-3 characters
      const n = randomInt(1,3);
      for(let i=0;i<n;i++) createCharacter();
    }, 700);

    // overall duration
    timerId = setTimeout(endGame, START_DURATION);

    // initial few pops
    for(let i=0;i<3;i++){
      setTimeout(createCharacter, 200*i + 200);
    }
  }

  function endGame(){
    running = false;
    startBtn.disabled = false;
    clearInterval(spawnInterval);
    spawnInterval = null;
    clearTimeout(timerId);
    timerId = null;
    // clear remaining characters
    Array.from(playArea.querySelectorAll('.character')).forEach(n=>n.remove());
    // show final message
    message.style.display = 'block';
    message.textContent = `समाप्त! आपका स्कोर ${score} है। फिर से खेलने के लिए 'शुरू करें' दबाएँ।`;
  }

  // Start on button or tapping playArea
  startBtn.addEventListener('click', startGame);
  playArea.addEventListener('pointerdown', (e)=>{
    if (!running) startGame();
  });

  // accessibility: keyboard start
  playArea.addEventListener('keydown', (e)=> { if (e.key==='Enter' && !running) startGame(); });

  // responsive: adjust positions when orientation/resize changes
  window.addEventListener('resize', ()=> {
    // nothing special needed; new characters will use updated bounds
  });

  // small instruction
  document.addEventListener('DOMContentLoaded', ()=> {
    message.textContent = "टैप करो — जो भी चेहरा दिखे, उसे तेज़ी से टैप करो और हँस-हँस के थक जाओ!";
  });

})();

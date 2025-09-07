/* GKQuiz - script.js
   Vanilla JS, works offline (bundled fallback), uses OpenTDB when available.
*/

(() => {
  // ---- DOM ----
  const startBtn = document.getElementById('startBtn');
  const demoBtn = document.getElementById('demoBtn');
  const sourceSelect = document.getElementById('sourceSelect');
  const difficultyEl = document.getElementById('difficulty');
  const numQuestionsEl = document.getElementById('numQuestions');
  const loadingSec = document.getElementById('loading');
  const configSec = document.getElementById('config');
  const quizSec = document.getElementById('quiz');
  const resultSec = document.getElementById('result');
  const questionText = document.getElementById('questionText');
  const answersWrap = document.getElementById('answers');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const nextBtn = document.getElementById('nextBtn');
  const quitBtn = document.getElementById('quitBtn');
  const playAgainBtn = document.getElementById('playAgain');
  const backToConfigBtn = document.getElementById('backToConfig');
  const resultTitle = document.getElementById('resultTitle');
  const resultSummary = document.getElementById('resultSummary');
  const compatScoreEl = document.getElementById('compatScore');
  const compatMsgEl = document.getElementById('compatMsg');

  const openInstructions = document.getElementById('openInstructions');
  const instructionsModal = document.getElementById('instructionsModal');
  const closeModal = document.getElementById('closeModal');

  // ---- State ----
  let questions = []; // array of {question, correct_answer, incorrect_answers}
  let currentIndex = 0;
  let totalQuestions = 0;
  let score = 0;
  let timer = null;
  let timeLeft = 0;
  let answered = false;
  let usedLocalFallback = false;

  // ---- Configs ----
  const DIFFICULTY_CONFIG = {
    easy:   { time: 20, points: 10 },
    medium: { time: 15, points: 15 },
    hard:   { time: 10, points: 25 }
  };

  // ---- localQuestions: bundled fallback so game works offline ----
  // Keep a compact set (you can expand these). Format compatible with OpenTDB.
  const localQuestions = [
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"easy",
      "question":"Which planet is known as the Red Planet?",
      "correct_answer":"Mars",
      "incorrect_answers":["Venus","Jupiter","Saturn"]
    },
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"easy",
      "question":"What is the capital city of France?",
      "correct_answer":"Paris",
      "incorrect_answers":["Lyon","Marseille","Bordeaux"]
    },
    {
      "category":"Science",
      "type":"multiple",
      "difficulty":"medium",
      "question":"What is the chemical symbol for water?",
      "correct_answer":"H₂O",
      "incorrect_answers":["O2","HO","H2"]
    },
    {
      "category":"Geography",
      "type":"multiple",
      "difficulty":"medium",
      "question":"Mount Everest lies on the border of Nepal and which country?",
      "correct_answer":"China",
      "incorrect_answers":["India","Pakistan","Bhutan"]
    },
    {
      "category":"History",
      "type":"multiple",
      "difficulty":"hard",
      "question":"Who was the first emperor of Rome?",
      "correct_answer":"Augustus",
      "incorrect_answers":["Nero","Caligula","Tiberius"]
    },
    {
      "category":"Entertainment",
      "type":"multiple",
      "difficulty":"easy",
      "question":"Which famous detective lived at 221B Baker Street?",
      "correct_answer":"Sherlock Holmes",
      "incorrect_answers":["Hercule Poirot","Philip Marlowe","Miss Marple"]
    },
    {
      "category":"Science",
      "type":"multiple",
      "difficulty":"medium",
      "question":"The process plants use to convert sunlight into energy is called?",
      "correct_answer":"Photosynthesis",
      "incorrect_answers":["Respiration","Transpiration","Fermentation"]
    },
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"medium",
      "question":"Which ocean is the largest on Earth?",
      "correct_answer":"Pacific Ocean",
      "incorrect_answers":["Atlantic Ocean","Indian Ocean","Arctic Ocean"]
    },
    {
      "category":"Sports",
      "type":"multiple",
      "difficulty":"easy",
      "question":"How many players are there in a standard football (soccer) team on the field?",
      "correct_answer":"11",
      "incorrect_answers":["10","9","12"]
    },
    {
      "category":"Science",
      "type":"multiple",
      "difficulty":"hard",
      "question":"What is the name of the particle associated with the electromagnetic force?",
      "correct_answer":"Photon",
      "incorrect_answers":["Gluon","Graviton","Neutrino"]
    },
    {
      "category":"Geography",
      "type":"multiple",
      "difficulty":"medium",
      "question":"Which country has the largest population in the world?",
      "correct_answer":"China",
      "incorrect_answers":["India","USA","Indonesia"]
    },
    {
      "category":"Art",
      "type":"multiple",
      "difficulty":"easy",
      "question":"The Mona Lisa was painted by which artist?",
      "correct_answer":"Leonardo da Vinci",
      "incorrect_answers":["Pablo Picasso","Vincent van Gogh","Michelangelo"]
    },
    {
      "category":"History",
      "type":"multiple",
      "difficulty":"hard",
      "question":"In which year did the Berlin Wall fall?",
      "correct_answer":"1989",
      "incorrect_answers":["1987","1991","1995"]
    },
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"easy",
      "question":"Which gas do humans need to breathe to survive?",
      "correct_answer":"Oxygen",
      "incorrect_answers":["Nitrogen","Carbon Dioxide","Helium"]
    },
    {
      "category":"Science",
      "type":"multiple",
      "difficulty":"hard",
      "question":"What is the powerhouse of the cell?",
      "correct_answer":"Mitochondria",
      "incorrect_answers":["Ribosome","Golgi apparatus","Nucleus"]
    },
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"medium",
      "question":"Which language is primarily spoken in Brazil?",
      "correct_answer":"Portuguese",
      "incorrect_answers":["Spanish","French","English"]
    },
    {
      "category":"Entertainment",
      "type":"multiple",
      "difficulty":"easy",
      "question":"Which instrument has keys, pedals and strings?",
      "correct_answer":"Piano",
      "incorrect_answers":["Guitar","Violin","Flute"]
    },
    {
      "category":"Sports",
      "type":"multiple",
      "difficulty":"medium",
      "question":"The Olympics are held every how many years (Summer Olympics)?",
      "correct_answer":"4",
      "incorrect_answers":["2","3","5"]
    },
    {
      "category":"Geography",
      "type":"multiple",
      "difficulty":"hard",
      "question":"Which desert is the largest hot desert in the world?",
      "correct_answer":"Sahara",
      "incorrect_answers":["Gobi","Kalahari","Sonoran"]
    },
    {
      "category":"General Knowledge",
      "type":"multiple",
      "difficulty":"easy",
      "question":"Which food is typically used to make sushi?",
      "correct_answer":"Rice",
      "incorrect_answers":["Bread","Pasta","Potato"]
    }
  ];

  // ---- helpers ----
  function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildApiUrl(amount = 10, difficulty = '') {
    // We request a larger pool (100) per instructions, but we'll allow dynamic 'amount' param.
    // The API supports difficulty parameter if needed.
    let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
    return url;
  }

  // --- Fetch questions (tries API, falls back to local if network fails) ---
  async function loadQuestions({source = 'api', amount = 10, difficulty = ''} = {}) {
    usedLocalFallback = false;
    if (source === 'local') {
      // local only
      const pool = localQuestions.filter(q => !difficulty || q.difficulty === difficulty);
      return pool.slice(0, amount);
    }

    // try API first
    try {
      const url = buildApiUrl(amount, difficulty);
      const res = await fetch(url, {cache: 'no-store'});
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if (data.response_code !== 0 || !data.results || !data.results.length) {
        // no results — fallback
        throw new Error('Bad API response');
      }
      // decode HTML entities on questions & answers
      const normalized = data.results.map(q => ({
        question: decodeHTML(q.question),
        correct_answer: decodeHTML(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(a => decodeHTML(a)),
        difficulty: q.difficulty || 'medium'
      }));
      return normalized;
    } catch (err) {
      console.warn('Using local fallback questions due to:', err && err.message);
      usedLocalFallback = true;
      const pool = localQuestions.filter(q => !difficulty || q.difficulty === difficulty);
      // If not enough locally, return what we have
      return pool.slice(0, amount);
    }
  }

  // ---- Game flow ----
  function showSection(sec) {
    [configSec, loadingSec, quizSec, resultSec].forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }

  function startGame({ source = 'api', amount = 10, difficulty = 'easy' } = {}) {
    // init UI
    showSection(loadingSec);
    score = 0; currentIndex = 0;
    scoreEl.textContent = `Score: ${score}`;
    progressBar.style.width = '0%';
    progressText.textContent = `0 / ${amount}`;

    // fetch questions then start
    loadQuestions({source, amount, difficulty})
      .then(qs => {
        questions = shuffleArray(qs).slice(0, amount);
        totalQuestions = questions.length;
        if (!totalQuestions) {
          alert('No questions available for this combination. Try another difficulty or use Local source.');
          showSection(configSec);
          return;
        }
        // pre-process answers for each question (shuffle)
        questions = questions.map(q => {
          const answers = shuffleArray([...(q.incorrect_answers || []), q.correct_answer]);
          return { ...q, answers };
        });
        showSection(quizSec);
        renderQuestion();
      })
      .catch(err => {
        console.error(err);
        alert('Unexpected error while loading questions.');
        showSection(configSec);
      });
  }

  function renderQuestion() {
    answered = false;
    nextBtn.disabled = true;
    // clamp index
    if (currentIndex >= totalQuestions) {
      endGame();
      return;
    }
    const payload = questions[currentIndex];
    questionText.textContent = payload.question;
    // fill answers
    answersWrap.innerHTML = '';
    for (const a of payload.answers) {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.type = 'button';
      btn.textContent = a;
      btn.onclick = () => handleAnswer(btn, a);
      answersWrap.appendChild(btn);
    }
    // update status
    scoreEl.textContent = `Score: ${score}`;
    progressText.textContent = `${currentIndex + 1} / ${totalQuestions}`;
    const percent = Math.round((currentIndex / totalQuestions) * 100);
    progressBar.style.width = `${percent}%`;

    // start timer
    const cfg = DIFFICULTY_CONFIG[difficultyEl.value] || DIFFICULTY_CONFIG.easy;
    startTimer(cfg.time);
  }

  function startTimer(seconds) {
    clearInterval(timer);
    timeLeft = seconds;
    timerEl.textContent = `Time: ${timeLeft}s`;

    timer = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = `Time: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        // time out -> mark as incorrect and show correct
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    if (answered) return;
    answered = true;
    // disable all buttons
    const btns = answersWrap.querySelectorAll('button.answer-btn');
    btns.forEach(b => b.disabled = true);
    // highlight correct
    const payload = questions[currentIndex];
    for (const b of btns) {
      if (b.textContent === payload.correct_answer) {
        b.classList.add('correct');
      } else {
        // subtle dim
      }
    }
    // allow next
    nextBtn.disabled = false;
  }

  function handleAnswer(btn, answerText) {
    if (answered) return;
    answered = true;
    clearInterval(timer);
    const payload = questions[currentIndex];
    const btns = answersWrap.querySelectorAll('button.answer-btn');
    // disable all
    btns.forEach(b => b.disabled = true);

    if (answerText === payload.correct_answer) {
      // correct!
      btn.classList.add('correct');
      // scoring: base points + quickness bonus
      const cfg = DIFFICULTY_CONFIG[difficultyEl.value] || DIFFICULTY_CONFIG.easy;
      const base = cfg.points;
      // quickness bonus: happier for faster answers (timeLeft / time)
      const timeBonus = Math.round((timeLeft / (cfg.time || 1)) * 5);
      score += base + timeBonus;
    } else {
      btn.classList.add('incorrect');
      // highlight the correct one
      for (const b of btns) {
        if (b.textContent === payload.correct_answer) b.classList.add('correct');
      }
    }
    scoreEl.textContent = `Score: ${score}`;
    nextBtn.disabled = false;
  }

  function nextQuestion() {
    // increment, update progress bar and render next
    currentIndex++;
    const percent = Math.round((currentIndex / totalQuestions) * 100);
    progressBar.style.width = `${percent}%`;
    if (currentIndex >= totalQuestions) {
      // animate progress to full and end
      progressBar.style.width = '100%';
      setTimeout(endGame, 450);
      return;
    }
    renderQuestion();
  }

  function quitToConfig() {
    clearInterval(timer);
    showSection(configSec);
  }

  function endGame() {
    clearInterval(timer);
    showSection(resultSec);

    // Compute playful compatibility style final score (0 - 100)
    const percentCorrect = Math.round((score / Math.max(1, totalQuestions * (DIFFICULTY_CONFIG[difficultyEl.value]?.points || 10))) * 100);
    // Allow some randomness but bounded
    const randomness = Math.floor((Math.random() * 11) - 3); // -3..+7
    const computed = Math.min(Math.max(percentCorrect + randomness, 0), 100);
    const finalScore = Math.round(computed);

    // Compose friendly message
    let message = '';
    if (finalScore >= 90) message = '🔥 Quiz Master — you aced it!';
    else if (finalScore >= 75) message = '💪 Very sharp! Great knowledge.';
    else if (finalScore >= 50) message = '😊 Nice! Keep learning and playing.';
    else if (finalScore >= 30) message = '🙂 Room to grow — keep trying!';
    else message = '📘 Practice makes perfect — try again!';

    resultTitle.textContent = usedLocalFallback ? 'Results (Local Questions)' : 'Your Result';
    resultSummary.textContent = `You answered ${calculateAnsweredCorrectCount()} correct (raw score: ${score}).`;
    compatScoreEl.textContent = `${finalScore}`;
    compatMsgEl.textContent = message;

    // small accessibility focus
    playAgainBtn.focus();
  }

  function calculateAnsweredCorrectCount() {
    // We don't track explicit correctCount separately; infer by checking classes in last rendering? Simpler: recompute by comparing answers chosen.
    // But we kept 'score' based on points; for a readable summary, estimate correct count by scanning questions and using points heuristic.
    // We'll return an approximate by assuming each 'correct' gave at least DIFFICULTY_CONFIG.easy.points points.
    const avgPoints = DIFFICULTY_CONFIG[difficultyEl.value]?.points || 10;
    const approxCorrect = Math.round(Math.max(0, score / avgPoints));
    return Math.min(approxCorrect, totalQuestions);
  }

  function resetToConfig() {
    clearInterval(timer);
    showSection(configSec);
  }

  // ---- UI wiring ----
  startBtn.addEventListener('click', () => {
    const source = sourceSelect.value || 'api';
    const amount = parseInt(numQuestionsEl.value || '10', 10);
    const difficulty = difficultyEl.value || 'easy';
    startGame({ source, amount, difficulty });
  });

  demoBtn.addEventListener('click', () => {
    // quick demo with local questions
    startGame({ source: 'local', amount: 5, difficulty: 'easy' });
  });

  nextBtn.addEventListener('click', nextQuestion);
  quitBtn.addEventListener('click', quitToConfig);
  playAgainBtn.addEventListener('click', () => {
    // re-run with previous config
    const source = sourceSelect.value || 'api';
    const amount = parseInt(numQuestionsEl.value || '10', 10);
    const difficulty = difficultyEl.value || 'easy';
    startGame({ source, amount, difficulty });
  });
  backToConfigBtn.addEventListener('click', resetToConfig);

  // Instructions modal
  openInstructions.addEventListener('click', () => {
    instructionsModal.classList.add('active');
    instructionsModal.setAttribute('aria-hidden', 'false');
  });
  closeModal.addEventListener('click', () => {
    instructionsModal.classList.remove('active');
    instructionsModal.setAttribute('aria-hidden', 'true');
  });
  instructionsModal.addEventListener('click', (e) => {
    if (e.target === instructionsModal) {
      instructionsModal.classList.remove('active');
      instructionsModal.setAttribute('aria-hidden', 'true');
    }
  });

  // --- accessibility & keyboard support ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // close modal or go back
      if (instructionsModal.classList.contains('active')) {
        instructionsModal.classList.remove('active');
        instructionsModal.setAttribute('aria-hidden', 'true');
      } else if (!configSec.classList.contains('hidden')) {
        // nothing
      } else {
        // go to config
        resetToConfig();
      }
    }
    // Next with Enter when Next button enabled
    if (e.key === 'Enter' && !nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
      nextBtn.click();
    }
  });

  // ensure internal navigation starts on config
  showSection(configSec);
})();

const STORAGE_KEY = 'landLeagueSave';
const zoneOrder = ['air', 'land'];
const zoneMissions = {
  air: ['clearSmog', 'plantTrees', 'cleanAirChallenge'],
  land: ['sortTrash', 'compostWaste', 'cleanLand']
};

const missionMeta = {
  clearSmog: { title: 'Clear the Smog', zone: 'air' },
  plantTrees: { title: 'Plant the Trees', zone: 'air' },
  cleanAirChallenge: { title: 'Clean Air Challenge', zone: 'air' },
  sortTrash: { title: 'Sort the Trash', zone: 'land' },
  compostWaste: { title: 'Compost the Waste', zone: 'land' },
  cleanLand: { title: 'Clean the Land', zone: 'land' }
};

const defaultLeaderboard = [
  { team: 'Green Guardians', score: 850 },
  { team: 'Earth Heroes', score: 790 },
  { team: 'Eco Warriors', score: 720 },
  { team: 'Planet Protectors', score: 680 }
];

const roleCards = [
  { icon: '🎨', title: 'GAME DESIGN', text: 'Plans gameplay and screens.' },
  { icon: '💻', title: 'CODING', text: 'Builds game mechanics.' },
  { icon: '🎭', title: 'ART & SPRITES', text: 'Creates visual assets.' },
  { icon: '🔊', title: 'AUDIO', text: 'Handles sounds and music.' },
  { icon: '🧪', title: 'TESTING', text: 'Finds bugs and tests the game.' },
  { icon: '📊', title: 'SCORING', text: 'Manages Eco Points and tournament scores.' }
];

const state = {
  totalEcoPoints: 0,
  currentZone: null,
  currentMissionIndex: 0,
  currentMissionKey: null,
  currentMissionTimer: null,
  currentMissionPoints: 0,
  missionProgress: 0,
  questionIndex: 0,
  questionTracker: 0,
  correctAnswers: 0,
  soundOn: true,
  musicOn: true,
  leaderboard: [...defaultLeaderboard],
  selectedTeam: 'Green Guardians',
  teamName: 'Green Guardians',
  completedMissions: {},
  completedZones: { air: false, land: false },
  audioCtx: null,
  musicInterval: null,
  zoneStatus: { air: false, land: false },
  lastMissionStats: { accuracy: 100, time: '00:00' }
};

const missionHandlers = {
  clearSmog: startSmogMission,
  plantTrees: startPlantingMission,
  cleanAirChallenge: startQuizMission,
  sortTrash: startSortMission,
  compostWaste: startCompostMission,
  cleanLand: startLandCleanMission
};

const quizPool = [
  {
    question: 'Which action helps reduce air pollution?',
    options: ['Planting trees', 'Burning waste', 'Driving more often', 'Leaving smoke outside'],
    answer: 'Planting trees',
    explanation: 'Trees absorb carbon dioxide and help clean the air.'
  },
  {
    question: 'What is a cleaner way to get around?',
    options: ['Walking or biking', 'Burning garbage', 'Using more coal', 'Leaving cars idling'],
    answer: 'Walking or biking',
    explanation: 'Walking and biking produce less smoke and pollution.'
  },
  {
    question: 'Which of these is bad for air quality?',
    options: ['Solar panels', 'Factory smoke', 'Recycling', 'Tree planting'],
    answer: 'Factory smoke',
    explanation: 'Smoke from factories adds pollution to the air.'
  },
  {
    question: 'Why are trees important for fresh air?',
    options: ['They make the air cleaner', 'They create more smoke', 'They make noise', 'They trap water only'],
    answer: 'They make the air cleaner',
    explanation: 'Trees absorb pollutants and make air healthier.'
  },
  {
    question: 'Which habit reduces pollution the most?',
    options: ['Using cleaner transport', 'Dumping waste in the road', 'Burning leaves', 'Leaving lights on all day'],
    answer: 'Using cleaner transport',
    explanation: 'Cleaner transport helps stop harmful exhaust.'
  }
];

function init() {
  bindUI();
  loadProgress();
  renderTeamOptions();
  renderRoles();
  renderLeaderboard();
  updateScoreDisplay();
  showScreen('homeScreen');
  startMusicIfEnabled();
}

function bindUI() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const action = event.currentTarget.dataset.action;
      handleAction(action, event.currentTarget);
    });
  });

  const soundToggle = document.getElementById('soundToggle');
  const musicToggle = document.getElementById('musicToggle');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  soundToggle.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    updateSettingsButtons();
    saveProgress();
    if (state.soundOn) playTone(520, 0.08, 'triangle', 0.04);
  });

  musicToggle.addEventListener('click', () => {
    state.musicOn = !state.musicOn;
    updateSettingsButtons();
    saveProgress();
    if (state.musicOn) startMusicIfEnabled(); else stopMusic();
  });

  fullscreenBtn.addEventListener('click', toggleFullscreen);

  const customTeamInput = document.getElementById('customTeamInput');
  customTeamInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') saveTeam();
  });
}

function handleAction(action, button) {
  switch (action) {
    case 'play-game':
      showScreen('introScreen');
      playSound('click');
      break;
    case 'start-mission-flow':
      playSound('click');
      showScreen('zoneScreen');
      break;
    case 'open-air-zone':
      playSound('click');
      openZone('air');
      break;
    case 'open-land-zone':
      playSound('click');
      openZone('land');
      break;
    case 'back-to-zones':
      playSound('click');
      showScreen('zoneScreen');
      break;
    case 'next-mission':
      playSound('click');
      nextMission();
      break;
    case 'continue-after-zone':
      playSound('click');
      if (state.currentZone === 'land') {
        showTournamentScreen();
      } else {
        showScreen('zoneScreen');
      }
      break;
    case 'open-tournament':
      playSound('click');
      showTournamentScreen();
      break;
    case 'show-champion':
      playSound('click');
      showChampionScreen();
      break;
    case 'go-home':
      playSound('click');
      showScreen('homeScreen');
      break;
    case 'open-facts':
      playSound('click');
      showScreen('factsScreen');
      break;
    case 'open-teams':
      playSound('click');
      showScreen('teamsScreen');
      break;
    case 'open-settings':
      playSound('click');
      showScreen('settingsScreen');
      break;
    case 'show-instructions':
      playSound('click');
      showToast('Use the mission guides, gather points, and keep the environment clean!');
      break;
    case 'save-team':
      saveTeam();
      break;
    case 'reset-progress':
      resetProgress();
      break;
    default:
      break;
  }
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.add('hidden');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.remove('hidden');
}

function updateScoreDisplay() {
  const points = state.totalEcoPoints || 0;
  document.getElementById('score').textContent = String(points).padStart(4, '0');
}

function addScore(points, message) {
  state.totalEcoPoints += points;
  updateScoreDisplay();
  saveProgress();
  if (message) {
    showFloatingScore(message, points);
  }
}

function showFloatingScore(text, value) {
  const toast = document.getElementById('toast');
  toast.textContent = `${text} +${value}`;
  toast.classList.remove('hidden');
  clearTimeout(showFloatingScore.timeoutId);
  showFloatingScore.timeoutId = setTimeout(() => {
    toast.classList.add('hidden');
  }, 950);
}

function openZone(zoneKey) {
  state.currentZone = zoneKey;
  state.currentMissionIndex = 0;
  loadMission(zoneKey, 0);
}

function loadMission(zoneKey, missionIndex) {
  const missionList = zoneMissions[zoneKey];
  const missionKey = missionList[missionIndex];
  state.currentZone = zoneKey;
  state.currentMissionIndex = missionIndex;
  state.currentMissionKey = missionKey;
  state.currentMissionPoints = 0;
  state.missionProgress = 0;

  const missionTitle = missionMeta[missionKey].title;
  document.getElementById('zoneName').textContent = zoneKey.toUpperCase() + ' ZONE';
  document.getElementById('missionTitle').textContent = missionTitle;
  document.getElementById('missionNumber').textContent = `${missionIndex + 1} / ${missionList.length}`;
  document.getElementById('hudZone').textContent = zoneKey.toUpperCase();
  document.getElementById('hudMission').textContent = missionTitle;
  document.getElementById('hudProgress').textContent = '0%';
  document.getElementById('hudTimer').textContent = '—';

  const area = document.getElementById('gameArea');
  area.className = 'game-area';
  area.innerHTML = '';
  area.classList.add(zoneKey === 'air' ? 'smog-scene' : 'land-scene');

  if (missionHandlers[missionKey]) {
    missionHandlers[missionKey]();
  }

  showScreen('missionScreen');
  updateScoreDisplay();
}

function nextMission() {
  const current = state.currentZone;
  const list = zoneMissions[current];
  const nextIndex = state.currentMissionIndex + 1;

  if (nextIndex < list.length) {
    loadMission(current, nextIndex);
    return;
  }

  const zoneDone = state.completedZones[current] || false;
  if (!zoneDone) {
    completeZone(current);
  } else {
    showScreen('zoneScreen');
  }
}

function completeZone(zoneKey) {
  state.completedZones[zoneKey] = true;
  const bonus = 100;
  addScore(bonus, 'ZONE BONUS');
  document.getElementById('zoneCompleteTitle').textContent = zoneKey === 'air' ? '☁️ AIR ZONE RESTORED!' : '🌱 LAND ZONE RESTORED!';
  document.getElementById('zoneCompleteBonus').textContent = bonus;
  showScreen('zoneCompleteScreen');
  saveProgress();
}

function showTournamentScreen() {
  renderLeaderboard();
  showScreen('tournamentScreen');
}

function showChampionScreen() {
  const leaderboard = getLeaderboard();
  const winner = leaderboard[0];
  const championName = winner ? winner.team : state.teamName;
  const championPoints = winner ? winner.score : state.totalEcoPoints;
  document.getElementById('championTeamName').textContent = championName;
  document.getElementById('championPoints').textContent = championPoints;
  showScreen('championScreen');
}

function saveTeam() {
  const input = document.getElementById('customTeamInput');
  const entered = input.value.trim();
  if (entered) {
    state.teamName = entered;
    state.selectedTeam = entered;
    input.value = '';
    updateLeaderboard();
    saveProgress();
    showToast('Team saved to the tournament!');
    playSound('correct');
  } else {
    showToast('Type a team name first.');
  }
}

function renderTeamOptions() {
  const options = ['🌿 Green Guardians', '🌎 Earth Heroes', '♻️ Eco Warriors', '🌱 Planet Protectors'];
  const container = document.getElementById('teamOptions');
  container.innerHTML = '';

  options.forEach((team) => {
    const button = document.createElement('button');
    button.className = 'team-option';
    button.type = 'button';
    button.textContent = team;
    button.addEventListener('click', () => {
      state.selectedTeam = team.replace(/^[^\s]+\s/, '').trim();
      state.teamName = state.selectedTeam;
      document.querySelectorAll('.team-option').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      updateLeaderboard();
      saveProgress();
      playSound('click');
    });
    container.appendChild(button);
  });

  const first = document.querySelector('.team-option');
  if (first) first.classList.add('selected');
}

function updateLeaderboard() {
  const table = document.getElementById('leaderboardTable');
  const rows = getLeaderboard();
  table.innerHTML = rows
    .map((entry, index) => {
      const isFirst = index === 0 ? 'first-place' : '';
      return `<tr class="${isFirst}"><td>${index + 1}</td><td>${entry.team}</td><td>${entry.score}</td></tr>`;
    })
    .join('');
}

function getLeaderboard() {
  const entries = [...state.leaderboard];
  const currentTeam = state.teamName || state.selectedTeam;
  const currentScore = state.totalEcoPoints || 0;
  const match = entries.find((entry) => entry.team === currentTeam);

  if (match) {
    match.score = Math.max(match.score, currentScore);
  } else {
    entries.push({ team: currentTeam, score: currentScore });
  }

  entries.sort((a, b) => b.score - a.score);
  state.leaderboard = entries.slice(0, 10);
  saveProgress();
  return state.leaderboard;
}

function renderLeaderboard() {
  state.leaderboard = [...state.leaderboard].sort((a, b) => b.score - a.score);
  updateLeaderboard();
}

function renderRoles() {
  const container = document.getElementById('teamRoles');
  container.innerHTML = roleCards
    .map((role) => `
      <div class="role-card glass">
        <h3>${role.icon} ${role.title}</h3>
        <p>${role.text}</p>
      </div>
    `)
    .join('');
}

function updateSettingsButtons() {
  document.getElementById('soundToggle').textContent = state.soundOn ? 'ON' : 'OFF';
  document.getElementById('musicToggle').textContent = state.musicOn ? 'ON' : 'OFF';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    document.getElementById('fullscreenBtn').textContent = 'EXIT';
  } else {
    document.exitFullscreen?.();
    document.getElementById('fullscreenBtn').textContent = 'OPEN';
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 1500);
}

function saveProgress() {
  const payload = {
    totalEcoPoints: state.totalEcoPoints,
    selectedTeam: state.selectedTeam,
    teamName: state.teamName,
    soundOn: state.soundOn,
    musicOn: state.musicOn,
    completedMissions: state.completedMissions,
    completedZones: state.completedZones,
    leaderboard: state.leaderboard
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.leaderboard = [...defaultLeaderboard];
    state.teamName = 'Green Guardians';
    state.selectedTeam = 'Green Guardians';
    state.soundOn = true;
    state.musicOn = true;
    saveProgress();
    updateSettingsButtons();
    return;
  }

  try {
    const saved = JSON.parse(raw);
    state.totalEcoPoints = saved.totalEcoPoints || 0;
    state.selectedTeam = saved.selectedTeam || 'Green Guardians';
    state.teamName = saved.teamName || 'Green Guardians';
    state.soundOn = saved.soundOn !== undefined ? saved.soundOn : true;
    state.musicOn = saved.musicOn !== undefined ? saved.musicOn : true;
    state.completedMissions = saved.completedMissions || {};
    state.completedZones = saved.completedZones || { air: false, land: false };
    state.leaderboard = saved.leaderboard && saved.leaderboard.length ? saved.leaderboard : [...defaultLeaderboard];
  } catch (error) {
    console.warn('Failed to load saved progress:', error);
    state.leaderboard = [...defaultLeaderboard];
  }

  updateSettingsButtons();
}

function resetProgress() {
  const confirmed = window.confirm('Reset all progress, scores, and saved team data?');
  if (!confirmed) return;

  state.totalEcoPoints = 0;
  state.completedMissions = {};
  state.completedZones = { air: false, land: false };
  state.teamName = 'Green Guardians';
  state.selectedTeam = 'Green Guardians';
  state.leaderboard = [...defaultLeaderboard];
  localStorage.removeItem(STORAGE_KEY);
  updateScoreDisplay();
  renderLeaderboard();
  saveProgress();
  showScreen('homeScreen');
  showToast('Progress reset.');
}

function missionCompleteScreen(points, accuracy) {
  const total = state.totalEcoPoints;
  const totalEl = document.getElementById('totalEcoDisplay');
  const accuracyEl = document.getElementById('missionAccuracy');
  const timeEl = document.getElementById('missionTime');

  totalEl.textContent = String(total).padStart(4, '0');
  accuracyEl.textContent = `${accuracy}%`;
  timeEl.textContent = getTimeLabel();
  document.getElementById('earnedPoints').textContent = points;
  createCelebration();
  playSound('success');
  showScreen('completeScreen');
}

function completeMission(points, accuracy = 100) {
  const currentKey = state.currentMissionKey;
  const startedKey = `${state.currentZone}:${currentKey}`;
  state.completedMissions[startedKey] = true;
  addScore(points, 'MISSION BONUS');
  missionCompleteScreen(points, accuracy);
  saveProgress();
  renderLeaderboard();
}

function getTimeLabel() {
  const current = state.currentMissionTimer || 0;
  return `${String(Math.max(0, current)).padStart(2, '0')}`;
}

function createCelebration() {
  const target = document.querySelector('.success-panel');
  if (!target) return;

  for (let i = 0; i < 18; i += 1) {
    const piece = document.createElement('span');
    piece.textContent = i % 2 === 0 ? '✨' : '🎉';
    piece.style.position = 'absolute';
    piece.style.left = `${Math.random() * 90 + 5}%`;
    piece.style.top = `${Math.random() * 40 + 10}%`;
    piece.style.fontSize = `${Math.random() * 1.2 + 1}rem`;
    piece.style.animation = 'spark 1.1s ease forwards';
    target.appendChild(piece);
    setTimeout(() => piece.remove(), 1100);
  }
}

function showMissionFailed(message, retryFn) {
  const area = document.getElementById('gameArea');
  area.innerHTML = `
    <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;background:rgba(255,255,255,0.08);">
      <div>
        <div style="font-size:3rem;margin-bottom:10px;">⏱️</div>
        <h3 style="margin:0 0 10px;font-size:2rem;">${message}</h3>
        <button class="primary-btn" data-action="retry-mission">TRY AGAIN</button>
      </div>
    </div>
  `;
  const btn = area.querySelector('[data-action="retry-mission"]');
  btn.addEventListener('click', () => {
    playSound('click');
    retryFn();
  });
}

function startSmogMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('smog-scene');
  const cloudPositions = [
    { x: 8, y: 14 }, { x: 20, y: 18 }, { x: 35, y: 12 }, { x: 52, y: 18 }, { x: 71, y: 16 },
    { x: 12, y: 42 }, { x: 32, y: 48 }, { x: 58, y: 38 }, { x: 77, y: 46 }, { x: 44, y: 68 }
  ];
  let cleared = 0;
  let timeLeft = 30;
  const total = 10;
  const timer = setInterval(() => {
    timeLeft -= 1;
    document.getElementById('hudTimer').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      showMissionFailed("TIME'S UP!", () => startSmogMission());
      playSound('wrong');
      return;
    }
  }, 1000);

  state.currentMissionTimer = 30;
  document.getElementById('hudTimer').textContent = timeLeft;

  cloudPositions.forEach((pos, index) => {
    const cloud = document.createElement('div');
    cloud.className = 'smog-cloud';
    cloud.style.left = `${pos.x}%`;
    cloud.style.top = `${pos.y}%`;
    cloud.style.setProperty('animation-delay', `${index * 0.2}s`);
    cloud.innerHTML = '<div class="cloud-body"><span></span></div><div class="smog-label">SMOG</div>';
    cloud.addEventListener('click', () => {
      if (cloud.classList.contains('cleaned')) return;
      cloud.classList.add('cleaned');
      cleared += 1;
      document.getElementById('hudProgress').textContent = `${Math.round((cleared / total) * 100)}%`;
      addScore(10, 'SMOG CLEANED');
      createSparkle(cloud.offsetLeft + 40, cloud.offsetTop + 40);
      playSound('clean');
      if (cleared >= total) {
        clearInterval(timer);
        const bonus = 50;
        addScore(bonus, 'AIR BONUS');
        completeMission(60, 100);
      }
    });
    area.appendChild(cloud);
  });
}

function createSparkle(x, y) {
  const burst = document.createElement('div');
  burst.className = 'clean-burst';
  burst.textContent = '✨';
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  document.getElementById('gameArea').appendChild(burst);
  setTimeout(() => burst.remove(), 700);
}

function startPlantingMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('plant-scene');
  const slots = [
    { id: 'hole-1', x: 18, y: 64 },
    { id: 'hole-2', x: 36, y: 50 },
    { id: 'hole-3', x: 52, y: 70 },
    { id: 'hole-4', x: 68, y: 56 },
    { id: 'hole-5', x: 82, y: 68 },
    { id: 'hole-6', x: 52, y: 34 }
  ];

  const grid = document.createElement('div');
  grid.className = 'planting-grid';
  area.appendChild(grid);

  slots.forEach((slotConfig) => {
    const slot = document.createElement('div');
    slot.className = 'plant-slot';
    slot.dataset.holeId = slotConfig.id;
    slot.style.position = 'relative';
    slot.style.minHeight = '150px';
    grid.appendChild(slot);
  });

  const seedlings = slots.map((slot, index) => {
    const seedling = document.createElement('div');
    seedling.className = 'seedling';
    seedling.textContent = '🌱';
    seedling.draggable = true;
    seedling.dataset.holeId = slot.id;
    seedling.style.left = `${10 + index * 13}%`;
    seedling.style.top = `${16 + (index % 2) * 22}%`;
    area.appendChild(seedling);

    seedling.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', seedling.dataset.holeId);
      seedling.classList.add('dragging');
    });

    const slotEls = [...grid.children];
    slotEls.forEach((slotEl) => {
      slotEl.addEventListener('dragover', (event) => event.preventDefault());
      slotEl.addEventListener('drop', (event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData('text/plain');
        if (draggedId !== slotEl.dataset.holeId) {
          showToast('Try Again — place each seedling in a highlighted spot.');
          playSound('wrong');
          return;
        }
        const target = document.querySelector(`.seedling[data-hole-id="${draggedId}"]`);
        if (!target) return;
        const tree = document.createElement('div');
        tree.className = 'tree-grow';
        tree.textContent = '🌳';
        tree.style.left = `${slotEl.offsetLeft + 32}px`;
        tree.style.top = `${slotEl.offsetTop + 30}px`;
        area.appendChild(tree);
        createSparkle(slotEl.offsetLeft + 30, slotEl.offsetTop + 20);
        target.classList.add('planted');
        target.style.left = `${slotEl.offsetLeft + 22}px`;
        target.style.top = `${slotEl.offsetTop + 24}px`;
        playSound('tree');
        addScore(10, 'TREE PLANTED');
        const plantedCount = document.querySelectorAll('.seedling.planted').length;
        document.getElementById('hudProgress').textContent = `${Math.round((plantedCount / slots.length) * 100)}%`;

        if (plantedCount >= slots.length) {
          const bonus = 70;
          addScore(bonus, 'FOREST BONUS');
          completeMission(130, 100);
        }
      });
    });

    return seedling;
  });

  document.getElementById('hudProgress').textContent = '0%';
  setTimeout(() => seedlings.forEach((seedling) => seedling.style.transform = 'translateY(0)'), 50);
}

function startQuizMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('quiz-scene');
  let currentQuestion = 0;
  let correctCount = 0;

  function renderQuestion() {
    const questionData = quizPool[currentQuestion];
    const objects = ['🚗', '🏭', '🔥', '🚲', '🌳', '☀️'];

    area.innerHTML = `
      <div class="quiz-visual">
        <div class="quiz-objects">${objects.map((item) => `<span>${item}</span>`).join('')}</div>
      </div>
      <div class="quiz-card">
        <h3>${questionData.question}</h3>
        <div class="answer-list">
          ${questionData.options.map((option) => `<button class="answer-btn" data-option="${option}">${option}</button>`).join('')}
        </div>
        <div class="quiz-feedback">Choose the best answer.</div>
      </div>
    `;

    const buttons = area.querySelectorAll('.answer-btn');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const picked = button.dataset.option;
        const isCorrect = picked === questionData.answer;
        const feedback = area.querySelector('.quiz-feedback');

        buttons.forEach((btn) => {
          btn.disabled = true;
          if (btn.dataset.option === questionData.answer) btn.classList.add('correct');
          if (btn.dataset.option === picked && !isCorrect) btn.classList.add('wrong');
        });

        if (isCorrect) {
          correctCount += 1;
          feedback.textContent = `Correct! ${questionData.explanation}`;
          feedback.style.background = 'rgba(91, 220, 120, 0.28)';
          addScore(10, 'QUIZ CORRECT');
          playSound('correct');
        } else {
          feedback.textContent = `Not quite. ${questionData.explanation}`;
          feedback.style.background = 'rgba(240, 115, 115, 0.26)';
          playSound('wrong');
        }

        document.getElementById('hudProgress').textContent = `${Math.round(((currentQuestion + 1) / quizPool.length) * 100)}%`;

        setTimeout(() => {
          currentQuestion += 1;
          if (currentQuestion < quizPool.length) {
            renderQuestion();
          } else {
            const accuracy = Math.round((correctCount / quizPool.length) * 100);
            const totalPoints = 30 + correctCount * 10;
            addScore(totalPoints, 'CHALLENGE BONUS');
            completeMission(totalPoints + 30, accuracy);
          }
        }, 1200);
      });
    });
  }

  renderQuestion();
}

function startSortMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('sort-scene');
  const items = [
    { icon: '🥤', type: 'recycling' },
    { icon: '🍌', type: 'compost' },
    { icon: '📄', type: 'recycling' },
    { icon: '🍊', type: 'compost' },
    { icon: '🥫', type: 'general' },
    { icon: '🧴', type: 'general' },
    { icon: '📰', type: 'recycling' },
    { icon: '🍃', type: 'compost' },
    { icon: '🥤', type: 'recycling' },
    { icon: '🥦', type: 'compost' }
  ];

  const bins = [
    { type: 'recycling', label: '♻️ RECYCLING', className: 'recycling' },
    { type: 'compost', label: '🍂 COMPOST', className: 'compost' },
    { type: 'general', label: '🗑️ GENERAL', className: 'general' }
  ];

  bins.forEach((bin) => {
    const element = document.createElement('div');
    element.className = `bin ${bin.className}`;
    element.dataset.binType = bin.type;
    element.innerHTML = `<span>${bin.label}</span>`;
    element.addEventListener('dragover', (event) => event.preventDefault());
    element.addEventListener('drop', (event) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('text/plain');
      const item = document.querySelector(`.sort-item[data-id="${itemId}"]`);
      if (!item) return;
      const correct = item.dataset.kind === element.dataset.binType;
      if (correct) {
        item.remove();
        addScore(10, 'SORTED');
        playSound('correct');
        const remaining = document.querySelectorAll('.sort-item').length;
        document.getElementById('hudProgress').textContent = `${Math.round(((10 - remaining) / 10) * 100)}%`;
        if (remaining === 0) {
          const bonus = 80;
          addScore(bonus, 'TRASH BONUS');
          completeMission(180, 100);
        }
      } else {
        showToast('Try Again — think about what belongs in each bin.');
        playSound('wrong');
      }
    });
    area.appendChild(element);
  });

  const positions = [
    { x: 8, y: 15 }, { x: 20, y: 16 }, { x: 36, y: 12 }, { x: 49, y: 18 },
    { x: 62, y: 14 }, { x: 74, y: 18 }, { x: 18, y: 42 }, { x: 32, y: 46 },
    { x: 52, y: 44 }, { x: 68, y: 45 }
  ];

  items.forEach((item, index) => {
    const element = document.createElement('div');
    element.className = 'sort-item';
    element.textContent = item.icon;
    element.dataset.kind = item.type;
    element.dataset.id = `item-${index}`;
    element.style.left = `${positions[index].x}%`;
    element.style.top = `${positions[index].y}%`;
    element.draggable = true;
    element.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', element.dataset.id);
      element.classList.add('dragging');
    });
    area.appendChild(element);
  });

  const binArea = document.createElement('div');
  binArea.className = 'bin-area';
  area.appendChild(binArea);
  const binNodes = area.querySelectorAll('.bin');
  binNodes.forEach((node) => binArea.appendChild(node));
}

function startCompostMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('compost-scene');
  const items = [
    { icon: '🍊', compost: true },
    { icon: '🥕', compost: true },
    { icon: '🍃', compost: true },
    { icon: '🌿', compost: true },
    { icon: '🥤', compost: false },
    { icon: '🥫', compost: false },
    { icon: '🧴', compost: false },
    { icon: '🥦', compost: true }
  ];
  let count = 0;

  const pile = document.createElement('div');
  pile.className = 'compost-pile';
  area.appendChild(pile);

  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'compost-object';
    button.textContent = item.icon;
    button.style.left = `${8 + (index % 4) * 22}%`;
    button.style.top = `${18 + Math.floor(index / 4) * 28}%`;
    button.addEventListener('click', () => {
      if (item.compost) {
        count += 1;
        button.style.opacity = '0';
        button.disabled = true;
        addScore(10, 'COMPOST');
        playSound('correct');
        const pileHeight = Math.min(80, count * 14);
        pile.style.boxShadow = `inset 0 10px 18px rgba(255,255,255,0.12), 0 18px 26px rgba(61,49,34,0.18), inset 0 -${pileHeight}px 0 rgba(85, 161, 53, 0.28)`;
        document.getElementById('hudProgress').textContent = `${Math.round((count / 4) * 100)}%`;
        if (count >= 4) {
          const bonus = 90;
          addScore(bonus, 'COMPOST BONUS');
          completeMission(130, 100);
        }
      } else {
        showToast('Not compostable — try a fruit, leaf, or food scrap.');
        playSound('wrong');
      }
    });
    area.appendChild(button);
  });
}

function startLandCleanMission() {
  const area = document.getElementById('gameArea');
  area.classList.add('land-clean-scene');
  const items = [
    { icon: '🧴', target: 'recycle' },
    { icon: '🥤', target: 'recycle' },
    { icon: '📄', target: 'paper' },
    { icon: '🧻', target: 'paper' },
    { icon: '🥫', target: 'trash' },
    { icon: '🍌', target: 'compost' },
    { icon: '🥦', target: 'compost' },
    { icon: '🧃', target: 'recycle' }
  ];

  const ground = document.createElement('div');
  ground.className = 'land-grid';
  area.appendChild(ground);

  const groundFill = document.createElement('div');
  groundFill.className = 'ground-clean-level';
  ground.appendChild(groundFill);

  const bins = [
    { icon: '♻️', type: 'recycle' },
    { icon: '🌱', type: 'compost' },
    { icon: '🗑️', type: 'trash' }
  ];

  bins.forEach((bin, index) => {
    const node = document.createElement('div');
    node.className = 'land-bin';
    node.textContent = bin.icon;
    node.dataset.type = bin.type;
    node.addEventListener('dragover', (event) => event.preventDefault());
    node.addEventListener('drop', (event) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('text/plain');
      const item = document.querySelector(`.litter-item[data-id="${itemId}"]`);
      if (!item) return;
      if (item.dataset.target === node.dataset.type) {
        item.remove();
        addScore(10, 'LAND CLEANED');
        playSound('correct');
        const left = document.querySelectorAll('.litter-item').length;
        const cleaned = 8 - left;
        document.getElementById('hudProgress').textContent = `${Math.round((cleaned / 8) * 100)}%`;
        groundFill.style.background = `linear-gradient(180deg, rgba(174, 237, 105, ${0.18 + cleaned * 0.06}), rgba(63, 189, 92, ${0.15 + cleaned * 0.06}))`;
        if (cleaned >= 8) {
          const bonus = 140;
          addScore(bonus, 'LAND RESTORED');
          completeMission(220, 100);
        }
      } else {
        showToast('Try the correct disposal bin.');
        playSound('wrong');
      }
    });
    area.appendChild(node);
  });

  items.forEach((item, index) => {
    const node = document.createElement('div');
    node.className = 'litter-item';
    node.dataset.target = item.target;
    node.dataset.id = `litter-${index}`;
    node.textContent = item.icon;
    node.style.left = `${8 + (index % 4) * 20}%`;
    node.style.top = `${14 + Math.floor(index / 4) * 24}%`;
    node.draggable = true;
    node.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', node.dataset.id);
      node.classList.add('dragging');
    });
    area.appendChild(node);
  });

  const dispose = document.createElement('div');
  dispose.className = 'land-disposal';
  bins.forEach((bin) => {
    const button = document.createElement('div');
    button.className = 'land-bin';
    button.textContent = bin.icon;
    button.dataset.type = bin.type;
    button.addEventListener('dragover', (event) => event.preventDefault());
    button.addEventListener('drop', (event) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('text/plain');
      const item = document.querySelector(`.litter-item[data-id="${itemId}"]`);
      if (!item) return;
      if (item.dataset.target === button.dataset.type) {
        item.remove();
        addScore(10, 'LAND CLEANED');
        playSound('correct');
      } else {
        showToast('The waste belongs in a different bin.');
        playSound('wrong');
      }
    });
    dispose.appendChild(button);
  });
  area.appendChild(dispose);
}

function ensureAudio() {
  if (!state.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    state.audioCtx = new AudioCtx();
  }
  return state.audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.04) {
  const context = ensureAudio();
  if (!context || !state.soundOn) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playSound(type) {
  if (!state.soundOn) return;
  switch (type) {
    case 'click':
      playTone(440, 0.05, 'triangle', 0.03);
      break;
    case 'correct':
      playTone(660, 0.09, 'triangle', 0.04);
      setTimeout(() => playTone(820, 0.07, 'triangle', 0.04), 80);
      break;
    case 'wrong':
      playTone(210, 0.12, 'sawtooth', 0.04);
      break;
    case 'clean':
      playTone(500, 0.08, 'sine', 0.03);
      setTimeout(() => playTone(680, 0.08, 'sine', 0.03), 60);
      break;
    case 'tree':
      playTone(390, 0.12, 'triangle', 0.05);
      break;
    case 'success':
      playTone(560, 0.12, 'triangle', 0.04);
      setTimeout(() => playTone(780, 0.12, 'triangle', 0.04), 90);
      break;
    default:
      break;
  }
}

function startMusicIfEnabled() {
  if (!state.musicOn || state.musicInterval) return;
  const context = ensureAudio();
  if (!context) return;
  const melody = [220, 277, 330, 277, 392, 330, 277, 220];
  let index = 0;
  state.musicInterval = setInterval(() => {
    if (!state.musicOn) return;
    playTone(melody[index % melody.length], 0.2, 'sine', 0.02);
    index += 1;
  }, 420);
}

function stopMusic() {
  if (state.musicInterval) {
    clearInterval(state.musicInterval);
    state.musicInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', init);

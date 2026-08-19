import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  House,
  Leaf,
  Play,
  Recycle,
  RotateCcw,
  Sparkles,
  Sprout,
  TimerReset,
  Trophy,
  Wind,
} from 'lucide-react';
import './App.css';

const factTicker = [
  'Planting trees helps clean the air and cool the planet.',
  'Recycling reduces waste and saves natural resources.',
  'Composting turns food scraps into healthy soil.',
  'Cleaner transport helps reduce smoke and pollution.',
  'Every eco action can make a big difference for Earth.'
];

const zoneInfo = {
  air: {
    name: 'Air Zone',
    description: 'Clean the air and restore nature.',
    accent: 'from-sky-400 to-cyan-300',
    badge: '☁️',
  },
  land: {
    name: 'Land Zone',
    description: 'Sort waste and renew the soil.',
    accent: 'from-emerald-400 to-lime-300',
    badge: '🌱',
  },
};

const LEADERBOARD_KEY = 'land-league-leaderboard';

const createClouds = () => [
  { id: 1, x: 10, y: 12 },
  { id: 2, x: 28, y: 18 },
  { id: 3, x: 47, y: 10 },
  { id: 4, x: 62, y: 25 },
  { id: 5, x: 80, y: 14 },
  { id: 6, x: 22, y: 48 },
  { id: 7, x: 55, y: 52 },
  { id: 8, x: 72, y: 44 },
];

const createSeedlings = () => [
  { id: 'seed-1', emoji: '🌱' },
  { id: 'seed-2', emoji: '🌱' },
  { id: 'seed-3', emoji: '🌱' },
];

const createWasteItems = () => [
  { id: 'bottle', emoji: '🥤', type: 'recycle' },
  { id: 'banana', emoji: '🍌', type: 'compost' },
  { id: 'paper', emoji: '📄', type: 'recycle' },
  { id: 'can', emoji: '🥫', type: 'trash' },
  { id: 'leaf', emoji: '🍃', type: 'compost' },
  { id: 'jar', emoji: '🧃', type: 'recycle' },
];

const bins = [
  { type: 'recycle', label: 'Recycle', emoji: '♻️' },
  { type: 'compost', label: 'Compost', emoji: '🍂' },
  { type: 'trash', label: 'Trash', emoji: '🗑️' },
];

const defaultLeaderboard = [
  { team: 'Air Rangers', total: 240 },
  { team: 'Green Squad', total: 180 },
  { team: 'Eco Heroes', total: 160 },
];

function App() {
  const audioContextRef = useRef(null);

  const [screen, setScreen] = useState('menu');
  const [selectedZone, setSelectedZone] = useState('air');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [smogClouds, setSmogClouds] = useState(createClouds());
  const [seedlings, setSeedlings] = useState(createSeedlings());
  const [plantedSlots, setPlantedSlots] = useState(Array(3).fill(null));
  const [landItems, setLandItems] = useState(createWasteItems());
  const [dragSource, setDragSource] = useState(null);
  const [status, setStatus] = useState('Ready for a new eco mission!');
  const [gameSummary, setGameSummary] = useState(null);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [tournamentMode, setTournamentMode] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [leaderboard, setLeaderboard] = useState(() => {
    if (typeof window === 'undefined') return defaultLeaderboard;

    try {
      const stored = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || 'null');
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {
      return defaultLeaderboard;
    }

    return defaultLeaderboard;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    }
  }, [leaderboard]);

  useEffect(() => {
    if (screen !== 'game') return undefined;

    if (timeLeft <= 0) {
      setScreen('gameOver');
      setStatus('Time is up!');
      setGameSummary({ title: 'Round Complete', message: 'The planet needs another eco hero!', score });
      if (tournamentMode && teamName.trim()) {
        awardTournamentPoints(score);
      }
      playSound('victory');
      launchConfetti();
      return undefined;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, timeLeft, score, tournamentMode, teamName]);

  useEffect(() => {
    if (screen !== 'gameOver') return;
    launchConfetti();
  }, [screen]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }

    return audioContextRef.current;
  };

  const playTone = ({ frequency = 440, duration = 0.18, type = 'sine', volume = 0.04, slideTo = null, delay = 0 }) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startAt = ctx.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), startAt + duration);
    }

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  };

  const playSound = (kind) => {
    if (isMuted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    ctx.resume();

    if (kind === 'start') {
      playTone({ frequency: 420, duration: 0.12, type: 'triangle', volume: 0.04, slideTo: 620 });
      setTimeout(() => playTone({ frequency: 620, duration: 0.16, type: 'sine', volume: 0.035, slideTo: 760 }), 70);
      return;
    }

    if (kind === 'pop') {
      playTone({ frequency: 1500, duration: 0.08, type: 'triangle', volume: 0.035, slideTo: 980 });
      setTimeout(() => playTone({ frequency: 1850, duration: 0.05, type: 'sine', volume: 0.03, slideTo: 1200 }), 32);
      return;
    }

    if (kind === 'success') {
      playTone({ frequency: 520, duration: 0.14, type: 'triangle', volume: 0.04, slideTo: 700 });
      setTimeout(() => playTone({ frequency: 780, duration: 0.18, type: 'sine', volume: 0.035, slideTo: 900 }), 90);
      return;
    }

    if (kind === 'error') {
      playTone({ frequency: 170, duration: 0.1, type: 'sawtooth', volume: 0.03, slideTo: 70 });
      setTimeout(() => playTone({ frequency: 120, duration: 0.12, type: 'square', volume: 0.025, slideTo: 80 }), 80);
      return;
    }

    if (kind === 'victory') {
      playTone({ frequency: 560, duration: 0.18, type: 'triangle', volume: 0.05, slideTo: 780 });
      setTimeout(() => playTone({ frequency: 740, duration: 0.2, type: 'sine', volume: 0.045, slideTo: 960 }), 120);
      setTimeout(() => playTone({ frequency: 920, duration: 0.22, type: 'triangle', volume: 0.04, slideTo: 1100 }), 220);
    }
  };

  const launchConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const awardTournamentPoints = (points) => {
    const cleanedTeam = teamName.trim();
    if (!tournamentMode || !cleanedTeam) return;

    setLeaderboard((prev) => {
      const current = [...prev];
      const targetIndex = current.findIndex((entry) => entry.team.toLowerCase() === cleanedTeam.toLowerCase());
      if (targetIndex >= 0) {
        current[targetIndex] = {
          ...current[targetIndex],
          total: current[targetIndex].total + points,
        };
      } else {
        current.push({ team: cleanedTeam, total: points });
      }

      return current.sort((a, b) => b.total - a.total).slice(0, 8);
    });
  };

  const resetRoundState = () => {
    setTimeLeft(30);
    setScore(0);
    setSmogClouds(createClouds());
    setSeedlings(createSeedlings());
    setPlantedSlots(Array(3).fill(null));
    setLandItems(createWasteItems());
    setDragSource(null);
    setGameSummary(null);
  };

  const beginZone = (zoneKey, modeValue = tournamentMode) => {
    const cleanedTeam = teamName.trim();
    setSelectedZone(zoneKey);
    setScreen('game');
    resetRoundState();
    setStatus(zoneKey === 'air' ? 'Pop the smog and plant forest helpers!' : 'Sort the waste before time runs out!');
    setTournamentMode(Boolean(cleanedTeam && modeValue));
    playSound('start');
  };

  const addScore = (points, message) => {
    setScore((prev) => prev + points);
    setStatus(message);
  };

  const finishRound = ({ title, message, finalBonus = 0 }) => {
    const finalScore = score + finalBonus;
    setGameSummary({ title, message, score: finalScore });
    setStatus(message);
    setScreen('gameOver');
    if (tournamentMode && teamName.trim()) {
      awardTournamentPoints(finalScore);
    }
    playSound('victory');
    launchConfetti();
  };

  const handleSmogClick = (cloudId) => {
    if (screen !== 'game' || selectedZone !== 'air') return;

    setSmogClouds((prev) => {
      const next = prev.filter((cloud) => cloud.id !== cloudId);

      if (next.length === 0) {
        setTimeout(() => {
          finishRound({
            title: 'Air Zone Saved!',
            message: 'Clean air helps people, wildlife, and the planet.',
            finalBonus: 50,
          });
        }, 180);
      }

      return next;
    });

    addScore(10, '+10 Eco Points! Smog cleared!');
    playSound('pop');
    launchConfetti();
  };

  const handleSeedDrop = (slotIndex) => {
    if (screen !== 'game' || selectedZone !== 'air' || !dragSource) return;

    const nextSlots = [...plantedSlots];
    if (nextSlots[slotIndex]) return;

    nextSlots[slotIndex] = dragSource;
    setPlantedSlots(nextSlots);
    setSeedlings((prev) => prev.filter((seed) => seed.id !== dragSource));
    setDragSource(null);
    addScore(15, 'Tree planted! The forest is growing.');
    playSound('success');

    if (nextSlots.every(Boolean)) {
      setTimeout(() => {
        finishRound({
          title: 'Forest Restored!',
          message: 'Trees help absorb pollution and create shade.',
          finalBonus: 45,
        });
      }, 200);
    }
  };

  const handleWasteDrop = (itemId, binType) => {
    if (screen !== 'game' || selectedZone !== 'land') return;

    const item = landItems.find((entry) => entry.id === itemId);
    if (!item) return;

    if (item.type === binType) {
      setLandItems((prev) => prev.filter((entry) => entry.id !== itemId));
      addScore(15, 'Correct sorting! Great recycling choice.');
      playSound('success');

      if (landItems.length === 1) {
        setTimeout(() => {
          finishRound({
            title: 'Land Zone Saved!',
            message: 'Healthy land means healthier communities and wildlife.',
            finalBonus: 60,
          });
        }, 220);
      }
    } else {
      setStatus('Try again! Check the bin labels before sorting.');
      playSound('error');
    }
  };

  const openTournament = () => {
    setTournamentOpen(true);
    setScreen('menu');
    playSound('start');
  };

  const startTournamentRound = (zoneKey) => {
    const cleanedTeam = teamName.trim();
    if (!cleanedTeam) {
      setStatus('Choose a team name before starting the tournament.');
      return;
    }

    setTournamentOpen(false);
    beginZone(zoneKey, true);
  };

  const handleMenuPlay = () => {
    setTournamentMode(false);
    setTournamentOpen(false);
    setScreen('zoneSelect');
    playSound('start');
  };

  return (
    <div className="app-shell min-h-screen w-full bg-gradient-to-br from-emerald-50 via-sky-50 to-teal-50 px-4 py-6 text-slate-800">
      <div className="eco-scene" aria-hidden="true">
        <div className="float-item leaf leaf-one">🍃</div>
        <div className="float-item leaf leaf-two">🍃</div>
        <div className="float-item glow glow-one">💡</div>
        <div className="float-item glow glow-two">💡</div>
        <div className="float-item cloud cloud-one">☁️</div>
        <div className="float-item cloud cloud-two">☁️</div>
        <div className="float-item turbine turbine-one">🌬️</div>
        <div className="float-item turbine turbine-two">🌬️</div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-orb orb-four" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="glass-shell">
          <header className="glass-header">
            <div className="flex items-center gap-3">
              <div className="glass-brand">
                🌍
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">Land League</p>
                <h1 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">Save The Planet</h1>
              </div>
            </div>

            <div className="glass-score">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/90">Eco Points</div>
              <div className="text-2xl font-black text-white">{score}</div>
            </div>
          </header>

          <div className="glass-hud">
            <div className="hud-pill">
              <Wind className="h-4 w-4 text-cyan-600" />
              <span className="hud-label">Zone</span>
              <span className="hud-value">{selectedZone ? zoneInfo[selectedZone].name : 'Main Menu'}</span>
            </div>

            <div className="hud-pill">
              <TimerReset className="h-4 w-4 text-amber-600" />
              <span className="hud-label">Timer</span>
              <span className="hud-value">{timeLeft}s</span>
            </div>

            <button
              type="button"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              onClick={() => setIsMuted((prev) => !prev)}
              className="mute-toggle"
            >
              <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
            </button>

            <div className="hud-pill hud-pill-wide">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="hud-label">Status</span>
              <span className="hud-value">{status}</span>
            </div>
          </div>

          <main className="relative p-4 sm:p-8">
            <AnimatePresence mode="wait">
              {screen === 'menu' && (
                <motion.section
                  key="menu"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="hero-card glass-card">
                    <div className="flex flex-col items-center justify-center gap-6 text-center">
                      <div className="earth-scene flex items-center justify-center text-7xl sm:text-8xl">🌍</div>
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-600">Code • Clean • Protect</p>
                        <h2 className="text-4xl font-black tracking-tight text-slate-800 sm:text-5xl">Join the League. Save the Planet.</h2>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleMenuPlay}
                          className="glass-button primary"
                        >
                          <span className="inline-flex items-center gap-2"><Play className="h-5 w-5" /> Play Game</span>
                        </button>

                        <button
                          type="button"
                          onClick={openTournament}
                          className="glass-button secondary"
                        >
                          <span className="inline-flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Tournament</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTournamentMode(false);
                        beginZone('air', false);
                      }}
                      className="glass-card zone-card zone-air"
                    >
                      <div className="mb-3 text-4xl">☁️</div>
                      <h3 className="text-xl font-black text-slate-800">Air Zone</h3>
                      <p className="mt-2 text-slate-600">Clear the smog and plant more trees.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTournamentMode(false);
                        beginZone('land', false);
                      }}
                      className="glass-card zone-card zone-land"
                    >
                      <div className="mb-3 text-4xl">🌱</div>
                      <h3 className="text-xl font-black text-slate-800">Land Zone</h3>
                      <p className="mt-2 text-slate-600">Sort waste and bring new life to the land.</p>
                    </button>

                    <button
                      type="button"
                      onClick={openTournament}
                      className="glass-card zone-card zone-league"
                    >
                      <div className="mb-3 text-4xl">🏆</div>
                      <h3 className="text-xl font-black text-slate-800">League</h3>
                      <p className="mt-2 text-slate-600">Earn eco points and become a champion.</p>
                    </button>
                  </div>
                </motion.section>
              )}

              {screen === 'zoneSelect' && (
                <motion.section
                  key="zones"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-card bg-white/35 px-5 py-4 backdrop-blur-md sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Choose your mission</p>
                        <h2 className="text-3xl font-black text-slate-800">Restore the planet</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScreen('menu')}
                        className="rounded-xl border border-white/60 bg-white/40 px-4 py-2 font-bold text-slate-700 shadow-lg shadow-slate-200/40 transition hover:scale-[1.02]"
                      >
                        Back
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => beginZone('air')}
                      className="glass-card zone-select-panel zone-air-panel"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-5xl">☁️</div>
                        <div className="rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-sky-700">3 Missions</div>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800">Air Zone</h3>
                      <p className="mt-3 text-slate-600">Clean the air, reduce pollution, and plant trees.</p>
                      <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
                        <li>• Clear the smog</li>
                        <li>• Plant the trees</li>
                        <li>• Clean air challenge</li>
                      </ul>
                    </button>

                    <button
                      type="button"
                      onClick={() => beginZone('land')}
                      className="glass-card zone-select-panel zone-land-panel"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-5xl">🌱</div>
                        <div className="rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">3 Missions</div>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800">Land Zone</h3>
                      <p className="mt-3 text-slate-600">Fix waste problems and restore healthy land.</p>
                      <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
                        <li>• Sort the trash</li>
                        <li>• Compost the waste</li>
                        <li>• Clean the land</li>
                      </ul>
                    </button>
                  </div>
                </motion.section>
              )}

              {screen === 'game' && (
                <motion.section
                  key={selectedZone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  <div className="glass-card bg-white/35 px-4 py-4 backdrop-blur-md sm:px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Mission</p>
                        <h3 className="text-2xl font-black text-slate-800">
                          {selectedZone === 'air' ? 'Clear the Smog & Plant Trees' : 'Sort the Waste'}
                        </h3>
                      </div>
                      <div className="glass-count-pill">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-white/90">Round</div>
                        <div className="text-xl font-black text-white">30s</div>
                      </div>
                    </div>
                  </div>

                  {selectedZone === 'air' ? (
                    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                      <div className="game-panel glass-panel glow-sky">
                        <div className="mission-chip">Smog</div>
                        <div className="relative h-[420px] overflow-hidden rounded-[24px] border border-white/30 bg-gradient-to-b from-sky-200/80 to-emerald-50/80">
                          {smogClouds.map((cloud, index) => (
                            <motion.button
                              key={cloud.id}
                              type="button"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              className="cloud-button absolute"
                              style={{ left: `${cloud.x}%`, top: `${cloud.y}%`, animationDelay: `${index * 0.2}s` }}
                              onClick={() => handleSmogClick(cloud.id)}
                            >
                              <span className="cloud-inner">
                                <span className="cloud-bump cloud-bump-1" />
                                <span className="cloud-bump cloud-bump-2" />
                                <span className="cloud-bump cloud-bump-3" />
                              </span>
                              <span className="cloud-label">SMOG</span>
                            </motion.button>
                          ))}

                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-400/80 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                            {Array.from({ length: 3 }).map((_, slotIndex) => (
                              <div
                                key={slotIndex}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => handleSeedDrop(slotIndex)}
                                className="drop-slot flex h-28 w-28 items-center justify-center rounded-[24px] border-2 border-dashed border-emerald-500/60 bg-white/25 text-4xl shadow-inner shadow-white/30"
                              >
                                {plantedSlots[slotIndex] ? '🌳' : '🌱'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="glass-card bg-white/35 p-5 backdrop-blur-md">
                          <div className="mb-3 flex items-center gap-2 text-emerald-700">
                            <Sprout className="h-5 w-5" />
                            <h4 className="text-lg font-black text-slate-800">Planting Mission</h4>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {seedlings.map((seedling) => (
                              <motion.div
                                key={seedling.id}
                                draggable
                                onDragStart={() => setDragSource(seedling.id)}
                                whileDrag={{ scale: 1.08 }}
                                className="tree-seedling flex h-14 w-14 cursor-grab items-center justify-center rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-200 to-lime-100 text-3xl shadow-lg shadow-emerald-200/50"
                              >
                                {seedling.emoji}
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="glass-card bg-white/35 p-5 backdrop-blur-md">
                          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-sky-700">Mission Tip</p>
                          <p className="text-sm font-semibold text-slate-700">
                            Clean the sky, then drag each seedling into a highlighted slot to restore the forest.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                      <div className="game-panel glass-panel glow-emerald">
                        <div className="mission-chip mission-chip-alt">Waste Sort</div>
                        <div className="relative h-[420px] overflow-hidden rounded-[24px] border border-white/30 bg-gradient-to-b from-emerald-50/80 to-lime-100/80">
                          {landItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              draggable
                              onDragStart={() => setDragSource(item.id)}
                              whileDrag={{ scale: 1.1, rotate: 4 }}
                              className="waste-item absolute flex items-center justify-center rounded-[16px] border border-white/60 bg-white/60 text-4xl shadow-lg shadow-slate-100/50"
                              style={{ left: `${10 + (index % 3) * 28}%`, top: `${18 + Math.floor(index / 3) * 30}%` }}
                            >
                              {item.emoji}
                            </motion.div>
                          ))}

                          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-4">
                            {bins.map((bin) => (
                              <div
                                key={bin.type}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                  if (dragSource) {
                                    handleWasteDrop(dragSource, bin.type);
                                    setDragSource(null);
                                  }
                                }}
                                className="bin-slot flex h-24 flex-col items-center justify-center rounded-[22px] border border-white/40 text-white shadow-lg shadow-slate-300/30"
                              >
                                <span className="text-3xl">{bin.emoji}</span>
                                <span className="text-xs font-black uppercase tracking-[0.18em]">{bin.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="glass-card bg-white/35 p-5 backdrop-blur-md">
                          <div className="mb-3 flex items-center gap-2 text-amber-700">
                            <Recycle className="h-5 w-5" />
                            <h4 className="text-lg font-black text-slate-800">Waste Sorting</h4>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            Sort each item into the right bin: recycling, compost, or general trash.
                          </p>
                        </div>

                        <div className="glass-card bg-white/35 p-5 backdrop-blur-md">
                          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Quick Tips</p>
                          <ul className="space-y-2 text-sm font-semibold text-slate-700">
                            <li>• Plastic and paper go to recycling.</li>
                            <li>• Fruit and leaves become compost.</li>
                            <li>• Metal and food tins belong in trash.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              {screen === 'gameOver' && (
                <motion.section
                  key="game-over"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  className="flex items-center justify-center"
                >
                  <div className="glass-card bg-white/35 w-full max-w-2xl p-8 text-center backdrop-blur-md">
                    <div className="mb-4 text-6xl">🏆</div>
                    <h2 className="text-4xl font-black text-slate-800">Mission Complete!</h2>
                    <p className="mt-3 text-lg font-semibold text-slate-600">
                      {gameSummary?.message || 'Every eco action helps protect our world.'}
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-slate-200/40">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Score</div>
                        <div className="mt-2 text-3xl font-black text-emerald-600">{gameSummary?.score ?? score}</div>
                      </div>
                      <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-slate-200/40">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Mode</div>
                        <div className="mt-2 text-lg font-black text-sky-600">{tournamentMode ? (teamName || 'Team') : zoneInfo[selectedZone].name}</div>
                      </div>
                      <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-lg shadow-slate-200/40">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Timer</div>
                        <div className="mt-2 text-xl font-black text-amber-600">{timeLeft}s</div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (tournamentMode && teamName.trim()) {
                            startTournamentRound(selectedZone);
                          } else {
                            beginZone(selectedZone);
                          }
                        }}
                        className="glass-button primary"
                      >
                        <span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Play Again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScreen('menu')}
                        className="glass-button secondary"
                      >
                        <span className="inline-flex items-center gap-2"><House className="h-4 w-4" /> Back to Menu</span>
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </main>

          <div className="ticker-shell glass-card bg-white/35 px-4 py-3 backdrop-blur-md">
            <div className="ticker-track">
              {[...factTicker, ...factTicker].map((fact, index) => (
                <span key={`${fact}-${index}`} className="ticker-item">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tournamentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 18 }}
              className="glass-modal"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">Tournament</p>
                  <h3 className="text-3xl font-black text-slate-800">Multi-team Leaderboard</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTournamentOpen(false)}
                  className="rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm font-bold text-slate-700 shadow-md shadow-slate-200/40 transition hover:scale-[1.02]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-600">Team name</span>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="e.g. Air Rangers"
                    className="w-full rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-lg font-semibold text-slate-700 shadow-inner shadow-white/50 outline-none transition focus:border-emerald-400 focus:bg-white/70"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => startTournamentRound('air')}
                    className="glass-button primary"
                  >
                    Start Air Zone
                  </button>
                  <button
                    type="button"
                    onClick={() => startTournamentRound('land')}
                    className="glass-button success"
                  >
                    Start Land Zone
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white/70 p-4 shadow-lg shadow-amber-100/40">
                <div className="mb-3 flex items-center gap-2 text-amber-700">
                  <Trophy className="h-5 w-5" />
                  <h4 className="text-lg font-black text-slate-800">Leaderboard</h4>
                </div>

                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={`${entry.team}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-3 py-2 shadow-sm shadow-slate-200/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-300 text-sm font-black text-slate-800">
                          #{index + 1}
                        </span>
                        <span className="font-black text-slate-700">{entry.team}</span>
                      </div>
                      <span className="text-lg font-black text-emerald-600">{entry.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

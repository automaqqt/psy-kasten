// components/tests/bart/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/BartTest.module.css';
import BartResults from '../../results/bart';
import BartSettings from '../../settings/bart';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, BALLOON_TYPES, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

const COLORS = ['blue', 'yellow', 'orange'];

// Build a balloon sequence: first `mixed` balloons are a random mix of colors,
// remaining balloons are presented in blocks of one color (Lejuez et al. 2002).
// Each balloon's break point is drawn as a random integer in [1, maxPumps];
// the participant pops the balloon if pumps reach the break point.
function buildSequence(total, mixed) {
  const seq = [];
  // Mixed phase
  const mixedPool = [];
  const perColor = Math.ceil(mixed / 3);
  COLORS.forEach(c => { for (let i = 0; i < perColor; i++) mixedPool.push(c); });
  // shuffle
  for (let i = mixedPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixedPool[i], mixedPool[j]] = [mixedPool[j], mixedPool[i]];
  }
  for (let i = 0; i < mixed && i < total; i++) {
    seq.push(mixedPool[i % mixedPool.length]);
  }
  // Blocked phase: split remaining evenly across colors, randomize block order
  const remaining = Math.max(0, total - mixed);
  if (remaining > 0) {
    const blockSize = Math.floor(remaining / 3);
    const leftover = remaining - blockSize * 3;
    const blockColors = [...COLORS].sort(() => Math.random() - 0.5);
    blockColors.forEach((c, idx) => {
      const size = blockSize + (idx < leftover ? 1 : 0);
      for (let i = 0; i < size; i++) seq.push(c);
    });
  }
  return seq.slice(0, total).map(color => ({
    color,
    breakPoint: Math.floor(Math.random() * BALLOON_TYPES[color].maxPumps) + 1,
  }));
}

// Visual size of the balloon as a function of pumps (capped so it stays on-screen)
function balloonSize(pumps) {
  const base = 80;
  const grow = Math.min(pumps * 4, 320);
  return base + grow;
}

export default function BartTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, results

  const [isPractice, setIsPractice] = useState(false);
  const [sequence, setSequence] = useState([]);
  const [balloonIndex, setBalloonIndex] = useState(0);
  const [pumps, setPumps] = useState(0);
  const [totalEarnedCents, setTotalEarnedCents] = useState(0);
  const [lastBalloonCents, setLastBalloonCents] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);

  // Demo state
  const [demoStep, setDemoStep] = useState(0);
  const [demoPumps, setDemoPumps] = useState(0);

  const audioCtxRef = useRef(null);
  const advanceTimerRef = useRef(null);

  // ─── Sound effects (synth via WebAudio so we don't need asset files) ───
  const playSound = useCallback((kind) => {
    if (!settings.enableSounds) return;
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      if (kind === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (kind === 'collect') {
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.0001, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.18);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.2);
        });
      } else if (kind === 'pump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(420, now + 0.07);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (e) {
      // ignore audio errors
    }
  }, [settings.enableSounds]);

  // ─── Demo animation: pump → pump → collect → pump → pop ───
  useEffect(() => {
    if (gameState !== 'demo') return;
    let timer;
    if (demoStep === 0) {
      setDemoPumps(0);
      timer = setTimeout(() => setDemoStep(1), 2200);
    } else if (demoStep === 1) {
      setDemoPumps(3);
      timer = setTimeout(() => setDemoStep(2), 1800);
    } else if (demoStep === 2) {
      setDemoPumps(8);
      timer = setTimeout(() => setDemoStep(3), 1800);
    } else if (demoStep === 3) {
      setDemoPumps(0);
      timer = setTimeout(() => setDemoStep(4), 1800);
    } else if (demoStep === 4) {
      setDemoPumps(12);
      timer = setTimeout(() => setDemoStep(5), 2000);
    }
    return () => timer && clearTimeout(timer);
  }, [gameState, demoStep]);

  // ─── Lifecycle ───
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const resetRunState = (active) => {
    setSequence(buildSequence(active.totalBalloons, active.mixedTrials));
    setBalloonIndex(0);
    setPumps(0);
    setTotalEarnedCents(0);
    setLastBalloonCents(0);
    setExploded(false);
  };

  const startPractice = async () => {
    clearAllTimers();
    setIsPractice(true);
    setPracticeTrials([]);
    resetRunState(PRACTICE_SETTINGS);
    await requestFullscreen();
    setGameState('countdown');
    startCountdown(() => setGameState('playing'));
  };

  const startTest = async () => {
    clearAllTimers();
    setIsPractice(false);
    setTrials([]);
    resetRunState(settings);
    await requestFullscreen();
    setGameState('countdown');
    startCountdown(() => setGameState('playing'));
  };

  const finishPractice = useCallback(() => {
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('practiceComplete');
  }, [clearAllTimers, isFullscreen, exitFullscreen]);

  const finishTest = useCallback((finalTrials, finalEarnedCents) => {
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    showOverlayMessage('feedback_test_complete', 1500);
    setTimeout(() => {
      setGameState('results');
      if (!isStandalone && onComplete) {
        onComplete({
          trials: finalTrials,
          totalEarnedCents: finalEarnedCents,
          summary: summarize(finalTrials),
        });
      }
    }, 1500);
  }, [clearAllTimers, isFullscreen, exitFullscreen, showOverlayMessage, isStandalone, onComplete]);

  // ─── Core gameplay ───
  const recordTrial = (trial) => {
    if (isPractice) setPracticeTrials(prev => [...prev, trial]);
    else setTrials(prev => [...prev, trial]);
  };

  const advanceBalloon = useCallback((completedTrial) => {
    const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
    const nextIdx = balloonIndex + 1;
    const allTrials = isPractice
      ? [...practiceTrials, completedTrial]
      : [...trials, completedTrial];

    if (nextIdx >= activeSettings.totalBalloons) {
      // End of run
      if (isPractice) {
        finishPractice();
      } else {
        const earnedCents = allTrials.reduce((sum, t) => sum + (t.exploded ? 0 : t.pumps * activeSettings.pumpValueCents), 0);
        finishTest(allTrials, earnedCents);
      }
      return;
    }

    setBalloonIndex(nextIdx);
    setPumps(0);
    setExploded(false);
  }, [isPractice, settings, balloonIndex, practiceTrials, trials, finishPractice, finishTest]);

  const handlePump = () => {
    if (gameState !== 'playing' || exploded) return;
    const balloon = sequence[balloonIndex];
    if (!balloon) return;
    const nextPumps = pumps + 1;

    if (nextPumps >= balloon.breakPoint) {
      // Pop!
      playSound('pop');
      setExploded(true);
      setLastBalloonCents(0);
      const trial = {
        trialNumber: balloonIndex + 1,
        color: balloon.color,
        breakPoint: balloon.breakPoint,
        pumps: nextPumps,
        exploded: true,
        earningsCents: 0,
      };
      recordTrial(trial);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => advanceBalloon(trial), 1100);
    } else {
      playSound('pump');
      setPumps(nextPumps);
    }
  };

  const handleCollect = () => {
    if (gameState !== 'playing' || exploded || pumps === 0) return;
    const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
    const balloon = sequence[balloonIndex];
    if (!balloon) return;
    const earningsCents = pumps * activeSettings.pumpValueCents;
    playSound('collect');
    setTotalEarnedCents(prev => prev + earningsCents);
    setLastBalloonCents(earningsCents);
    const trial = {
      trialNumber: balloonIndex + 1,
      color: balloon.color,
      breakPoint: balloon.breakPoint,
      pumps,
      exploded: false,
      earningsCents,
    };
    recordTrial(trial);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => advanceBalloon(trial), 700);
  };

  const stopTest = () => {
    if (gameState === 'welcome' || gameState === 'results') return;
    clearAllTimers();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (isPractice) {
      finishPractice();
    } else {
      finishTest(trials, totalEarnedCents);
    }
  };

  const resetTest = () => {
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setSequence([]);
    setBalloonIndex(0);
    setPumps(0);
    setTotalEarnedCents(0);
    setLastBalloonCents(0);
    setExploded(false);
    setIsPractice(false);
  };

  // ─── Helpers ───
  const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

  const calculatePracticeStats = () => {
    const collected = practiceTrials.filter(t => !t.exploded);
    const explosions = practiceTrials.filter(t => t.exploded).length;
    const adjPumps = collected.length
      ? collected.reduce((s, t) => s + t.pumps, 0) / collected.length
      : 0;
    const earnedCents = collected.reduce((s, t) => s + t.earningsCents, 0);
    return { adjPumps, explosions, collected: collected.length, earnedCents };
  };

  const currentBalloon = sequence[balloonIndex];
  const balloonColor = currentBalloon ? BALLOON_TYPES[currentBalloon.color].color : '#cccccc';
  const sizePx = balloonSize(pumps);
  const demoSizePx = balloonSize(demoPumps);

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {gameState === 'playing' && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('balloon_label')}: <span className={styles.metricValue}>{balloonIndex + 1} / {sequence.length}</span>
              </div>
              {settings.showEarnings && !isPractice && (
                <div className={styles.trialIndicator}>
                  {translate('total_earned')}: <span className={styles.metricValue}>{formatMoney(totalEarnedCents)}</span>
                </div>
              )}
              <button
                className={styles.iconButton}
                onClick={stopTest}
                title={translate('stop_test')}
                aria-label={translate('stop_test')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            </div>
          )}
        </TestHeader>

        <div className={styles.gameArea} ref={gameAreaRef}>
          {/* Welcome */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('welcome_title')}</h2>
              <p>{translate('welcome_p1')}</p>
              <p>{translate('welcome_p2')}</p>
              <p>{translate('welcome_p3', { count: settings.totalBalloons })}</p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('start_button')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setShowSettings(true)}>
                  {translate('common:settings')}
                </button>
              </div>
              <div className={styles.linkContainer}>
                {isStandalone && (
                  <Link href="/">
                    <div className={styles.link}>{translate('common:back_to_home')}</div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Tutorial */}
          {gameState === 'tutorial' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('tutorial_title')}</h2>
              <div className={styles.tutorialContent}>
                {[1, 2, 3, 4].map(n => (
                  <div className={styles.tutorialStep} key={n}>
                    <div className={styles.stepNumber}>{n}</div>
                    <div className={styles.stepText}>
                      <h3>{translate(`tutorial_step${n}_title`)}</h3>
                      <p>{translate(`tutorial_step${n}_text`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('demo'); }}>
                  {translate('see_demo')}
                </button>
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('start_practice')}
                </button>
                <button className={styles.tertiaryButton} onClick={() => setGameState('welcome')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Demo */}
          {gameState === 'demo' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p className={styles.demoIntro}>{translate('demo_intro')}</p>

              <div className={styles.demoStepText}>
                {demoStep === 0 && <p>{translate('demo_step1')}</p>}
                {demoStep === 1 && <p>{translate('demo_step2')}</p>}
                {demoStep === 2 && <p>{translate('demo_step3')}</p>}
                {demoStep === 3 && <p>{translate('demo_step4')}</p>}
                {demoStep === 4 && <p>{translate('demo_step5')}</p>}
                {demoStep === 5 && <p>{translate('demo_step6')}</p>}
              </div>

              <div className={styles.demoBalloonStage}>
                <div
                  className={styles.balloon}
                  style={{
                    width: `${demoSizePx}px`,
                    height: `${demoSizePx * 1.15}px`,
                    backgroundColor: '#3b82f6',
                    opacity: demoStep === 5 ? 0 : 1,
                  }}
                >
                  <span className={styles.balloonPumps}>{demoPumps}</span>
                </div>
                {demoStep === 5 && <div className={styles.popText}>POP!</div>}
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 5}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Practice complete */}
          {gameState === 'practiceComplete' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('practice_complete_title')}</h2>
              <p>{translate('practice_complete_text1')}</p>
              <p>{translate('practice_complete_text2')}</p>

              <div className={styles.practiceStats}>
                <h3>{translate('practice_stats_title')}</h3>
                {(() => {
                  const stats = calculatePracticeStats();
                  return (
                    <>
                      <div className={styles.statRow}>
                        <span>{translate('practice_collected')}:</span>
                        <span className={styles.statValue}>{stats.collected}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_explosions')}:</span>
                        <span className={styles.statValue}>{stats.explosions}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_adj_pumps')}:</span>
                        <span className={styles.statValue}>{stats.adjPumps.toFixed(1)}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_earned')}:</span>
                        <span className={styles.statValue}>{formatMoney(stats.earnedCents)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
                  {translate('start_real_test')}
                </button>
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {/* Countdown */}
          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} translate={translate} />
          )}

          {/* Playing */}
          {gameState === 'playing' && currentBalloon && (
            <div className={styles.bartStage}>
              <div className={styles.earningsPanel}>
                <div className={styles.earningsBox}>
                  <div className={styles.earningsLabel}>{translate('total_earned')}</div>
                  <div className={styles.earningsValue}>{formatMoney(totalEarnedCents)}</div>
                </div>
                <div className={styles.earningsBox}>
                  <div className={styles.earningsLabel}>{translate('last_balloon')}</div>
                  <div className={styles.earningsValue}>{formatMoney(lastBalloonCents)}</div>
                </div>
                <div className={styles.earningsBox}>
                  <div className={styles.earningsLabel}>{translate('balloon_label')}</div>
                  <div className={styles.earningsValue}>{balloonIndex + 1} / {sequence.length}</div>
                </div>
              </div>

              <div className={styles.balloonStage}>
                <div
                  className={styles.balloon}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx * 1.15}px`,
                    backgroundColor: balloonColor,
                    opacity: exploded ? 0 : 1,
                  }}
                >
                  <span className={styles.balloonPumps}>{pumps}</span>
                </div>
                {exploded && <div className={styles.popText}>POP!</div>}
              </div>

              <div className={styles.bartButtons}>
                <button
                  className={styles.pumpButton}
                  onClick={handlePump}
                  disabled={exploded}
                >
                  {translate('pump_button')}
                </button>
                <button
                  className={styles.collectButton}
                  onClick={handleCollect}
                  disabled={exploded || pumps === 0}
                >
                  {translate('collect_button')}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <BartResults
              trials={trials}
              totalEarnedCents={totalEarnedCents}
              onRestart={resetTest}
              t={translate}
            />
          )}

          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {showSettings && (
          <BartSettings
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
            t={translate}
          />
        )}
      </div>
    </div>
  );
}

// Adjusted pumps = average pumps on balloons that did NOT explode (Lejuez et al. 2002)
export function summarize(trials) {
  const byColor = { blue: [], yellow: [], orange: [] };
  trials.forEach(t => {
    if (!t.exploded && byColor[t.color]) byColor[t.color].push(t.pumps);
  });
  const adj = (arr) => arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
  const explosions = trials.filter(t => t.exploded).length;
  const earned = trials.reduce((s, t) => s + (t.exploded ? 0 : t.earningsCents), 0);
  return {
    adjBlue: adj(byColor.blue),
    adjYellow: adj(byColor.yellow),
    adjOrange: adj(byColor.orange),
    explosions,
    totalBalloons: trials.length,
    totalEarnedCents: earned,
  };
}

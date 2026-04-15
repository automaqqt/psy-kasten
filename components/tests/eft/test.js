// components/tests/eft/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/EftTest.module.css';
import EftResults from '../../results/eft';
import EftSettings from '../../settings/eft';
import {
  DEFAULT_SETTINGS,
  PRACTICE_SETTINGS,
  LEFT_TARGETS,
  RIGHT_TARGETS,
  NEUTRAL_FLANKERS,
  CONDITIONS,
  LEFT_KEY,
  RIGHT_KEY,
} from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// ── Trial generation ──────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function targetResponse(letter) {
  if (LEFT_TARGETS.includes(letter)) return 'left';
  if (RIGHT_TARGETS.includes(letter)) return 'right';
  return null;
}

function buildTrial(trialNumber, condition, flankersPerSide) {
  // Pick target (random from the full target pool)
  const allTargets = [...LEFT_TARGETS, ...RIGHT_TARGETS];
  const target = pickRandom(allTargets);
  const correct = targetResponse(target);

  // Pick flanker letter according to condition
  let flanker;
  if (condition === CONDITIONS.CONGRUENT) {
    // Same response set, different letter (e.g. target H → flanker K)
    const sameSet = LEFT_TARGETS.includes(target) ? LEFT_TARGETS : RIGHT_TARGETS;
    const others = sameSet.filter(l => l !== target);
    flanker = others.length > 0 ? pickRandom(others) : target;
  } else if (condition === CONDITIONS.INCONGRUENT) {
    // Opposite response set
    const otherSet = LEFT_TARGETS.includes(target) ? RIGHT_TARGETS : LEFT_TARGETS;
    flanker = pickRandom(otherSet);
  } else {
    // Neutral: letter that is not in either target set
    flanker = pickRandom(NEUTRAL_FLANKERS);
  }

  // Build display: N flankers, target, N flankers
  const leftFlankers = Array(flankersPerSide).fill(flanker);
  const rightFlankers = Array(flankersPerSide).fill(flanker);
  const display = [...leftFlankers, target, ...rightFlankers];

  return {
    trialNumber,
    condition,
    target,
    flanker,
    correct,
    display,
    response: null,
    correctResponse: null,
    reactionTime: null,
    timedOut: false,
  };
}

function generateTrialList(settings) {
  const { totalTrials, flankersPerSide, congruentRatio, incongruentRatio } = settings;
  const nCong = Math.round(totalTrials * congruentRatio);
  const nIncong = Math.round(totalTrials * incongruentRatio);
  const nNeutral = Math.max(0, totalTrials - nCong - nIncong);

  const conditions = [
    ...Array(nCong).fill(CONDITIONS.CONGRUENT),
    ...Array(nIncong).fill(CONDITIONS.INCONGRUENT),
    ...Array(nNeutral).fill(CONDITIONS.NEUTRAL),
  ];

  // Shuffle
  for (let i = conditions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [conditions[i], conditions[j]] = [conditions[j], conditions[i]];
  }

  return conditions.map((cond, idx) => buildTrial(idx + 1, cond, flankersPerSide));
}

// ── Component ─────────────────────────────────────────────

export default function EftTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, fixation, stimulus, feedback, results
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [pendingTrials, setPendingTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const [isPractice, setIsPractice] = useState(false);

  // Refs for timers and avoiding stale closures
  const fixationTimerRef = useRef(null);
  const stimulusTimerRef = useRef(null);
  const itiTimerRef = useRef(null);
  const stimulusStartRef = useRef(0);
  const responseLockRef = useRef(true);
  const currentTrialRef = useRef(null);
  const pendingTrialsRef = useRef([]);
  const isPracticeRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { currentTrialRef.current = currentTrial; }, [currentTrial]);
  useEffect(() => { pendingTrialsRef.current = pendingTrials; }, [pendingTrials]);
  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);

  // Clean up timers
  const clearLocalTimers = useCallback(() => {
    if (fixationTimerRef.current) { clearTimeout(fixationTimerRef.current); fixationTimerRef.current = null; }
    if (stimulusTimerRef.current) { clearTimeout(stimulusTimerRef.current); stimulusTimerRef.current = null; }
    if (itiTimerRef.current) { clearTimeout(itiTimerRef.current); itiTimerRef.current = null; }
  }, []);

  // ── Demo animation ────────────────────────────────────
  // Cycle through: fixation → congruent trial → incongruent trial → neutral trial
  useEffect(() => {
    if (gameState !== 'demo') return;
    const durations = [1500, 2500, 1500, 2500, 1500, 2500, 2000];
    const duration = durations[demoStep] || 2000;
    if (demoStep >= 6) return;
    const timer = setTimeout(() => setDemoStep(demoStep + 1), duration);
    return () => clearTimeout(timer);
  }, [gameState, demoStep]);

  // Demo display for each step
  const getDemoTrial = () => {
    const flankersPerSide = 3;
    if (demoStep === 1) return buildTrial(1, CONDITIONS.CONGRUENT, flankersPerSide);
    if (demoStep === 3) return buildTrial(2, CONDITIONS.INCONGRUENT, flankersPerSide);
    if (demoStep === 5) return buildTrial(3, CONDITIONS.NEUTRAL, flankersPerSide);
    return null;
  };

  // ── Trial flow ────────────────────────────────────────

  const finishSession = useCallback(() => {
    clearLocalTimers();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    const completedTrials = isPracticeRef.current ? practiceTrials : trials;

    if (isPracticeRef.current) {
      setGameState('practiceComplete');
      return;
    }

    showOverlayMessage('feedback_test_complete', 1500);
    setTimeout(() => {
      setGameState('results');
      if (!isStandalone && onComplete) {
        onComplete(buildResultPayload(completedTrials));
      }
    }, 1500);
  }, [clearLocalTimers, clearAllTimers, isFullscreen, exitFullscreen, practiceTrials, trials, showOverlayMessage, isStandalone, onComplete]);

  const advanceToNextTrial = useCallback(() => {
    const remaining = pendingTrialsRef.current;
    if (!remaining || remaining.length === 0) {
      finishSession();
      return;
    }
    const [next, ...rest] = remaining;
    setPendingTrials(rest);
    pendingTrialsRef.current = rest;
    setCurrentTrial(next);
    currentTrialRef.current = next;

    // Fixation phase
    setGameState('fixation');
    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    fixationTimerRef.current = setTimeout(() => {
      // Stimulus phase
      setGameState('stimulus');
      stimulusStartRef.current = Date.now();
      responseLockRef.current = false;

      // Timeout if no response within responseWindow
      stimulusTimerRef.current = setTimeout(() => {
        if (responseLockRef.current) return;
        responseLockRef.current = true;
        const trial = currentTrialRef.current;
        const completed = { ...trial, response: null, correctResponse: false, reactionTime: null, timedOut: true };
        recordTrial(completed);
        setGameState('feedback');
        showOverlayMessage('feedback_too_slow', 800);
        itiTimerRef.current = setTimeout(() => advanceToNextTrial(), activeSettings.interTrialInterval);
      }, activeSettings.responseWindow);
    }, activeSettings.fixationDuration);
  }, [settings, finishSession, showOverlayMessage]);

  const recordTrial = useCallback((completed) => {
    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, completed]);
    } else {
      setTrials(prev => [...prev, completed]);
    }
  }, []);

  const handleResponse = useCallback((response) => {
    if (gameState !== 'stimulus' || responseLockRef.current) return;
    responseLockRef.current = true;

    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
      stimulusTimerRef.current = null;
    }

    const rt = Date.now() - stimulusStartRef.current;
    const trial = currentTrialRef.current;
    const correct = response === trial.correct;
    const completed = {
      ...trial,
      response,
      correctResponse: correct,
      reactionTime: rt,
      timedOut: false,
    };

    recordTrial(completed);
    setGameState('feedback');

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    if (isPracticeRef.current) {
      showOverlayMessage(correct ? 'feedback_correct' : 'feedback_incorrect', 700, correct ? 'correct' : 'error');
    }
    itiTimerRef.current = setTimeout(() => advanceToNextTrial(), activeSettings.interTrialInterval);
  }, [gameState, settings, showOverlayMessage, advanceToNextTrial, recordTrial]);

  // ── Key handling ──────────────────────────────────────
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'stimulus') return;
      const key = e.key.toLowerCase();
      if (key === LEFT_KEY) { e.preventDefault(); handleResponse('left'); }
      else if (key === RIGHT_KEY) { e.preventDefault(); handleResponse('right'); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, handleResponse]);

  // ── Session starters ──────────────────────────────────

  const startPractice = async () => {
    clearLocalTimers();
    clearAllTimers();
    setIsPractice(true);
    isPracticeRef.current = true;
    await requestFullscreen();
    setPracticeTrials([]);
    const list = generateTrialList(PRACTICE_SETTINGS);
    setPendingTrials(list);
    pendingTrialsRef.current = list;
    setGameState('countdown');
    startCountdown(() => {
      advanceToNextTrial();
    });
  };

  const startTest = async () => {
    clearLocalTimers();
    clearAllTimers();
    setIsPractice(false);
    isPracticeRef.current = false;
    await requestFullscreen();
    setTrials([]);
    const list = generateTrialList(settings);
    setPendingTrials(list);
    pendingTrialsRef.current = list;
    setGameState('countdown');
    startCountdown(() => {
      advanceToNextTrial();
    });
  };

  const stopTest = () => {
    if (gameState === 'welcome' || gameState === 'results') return;
    clearLocalTimers();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    if (isPracticeRef.current) {
      setGameState('practiceComplete');
    } else {
      setGameState('results');
      if (!isStandalone && onComplete) {
        onComplete(buildResultPayload(trials));
      }
    }
  };

  const resetTest = () => {
    clearLocalTimers();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setPendingTrials([]);
    setCurrentTrial(null);
    setIsPractice(false);
    isPracticeRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { clearLocalTimers(); clearAllTimers(); };
  }, [clearLocalTimers, clearAllTimers]);

  // ── Practice stats ────────────────────────────────────
  const calculatePracticeStats = () => {
    const valid = practiceTrials.filter(t => t.reactionTime != null);
    const correctTrials = valid.filter(t => t.correctResponse);
    if (valid.length === 0) {
      return { meanRT: 0, accuracy: 0, total: 0, timeouts: practiceTrials.filter(t => t.timedOut).length };
    }
    const meanRT = correctTrials.length > 0
      ? correctTrials.reduce((s, t) => s + t.reactionTime, 0) / correctTrials.length
      : 0;
    return {
      meanRT,
      accuracy: (correctTrials.length / practiceTrials.length) * 100,
      total: practiceTrials.length,
      timeouts: practiceTrials.filter(t => t.timedOut).length,
    };
  };

  const totalTrialsForSession = isPractice ? PRACTICE_SETTINGS.totalTrials : settings.totalTrials;
  const trialsCompleted = (isPractice ? practiceTrials : trials).length;

  // ── Render helpers ────────────────────────────────────

  const renderFlankerDisplay = (trial) => {
    if (!trial) return null;
    const targetIdx = Math.floor(trial.display.length / 2);
    return (
      <div className={styles.flankerRow}>
        {trial.display.map((letter, idx) => (
          <span
            key={idx}
            className={idx === targetIdx ? styles.flankerTarget : styles.flankerLetter}
            style={{ color: settings.stimulusColor }}
          >
            {letter}
          </span>
        ))}
      </div>
    );
  };

  const demoTrial = gameState === 'demo' ? getDemoTrial() : null;

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'fixation' || gameState === 'stimulus' || gameState === 'feedback') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trials_completed')}: <span className={styles.metricValue}>{trialsCompleted}/{totalTrialsForSession}</span>
              </div>
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
              <p>{translate('welcome_p3', { trials: settings.totalTrials })}</p>
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
                  <div key={n} className={styles.tutorialStep}>
                    <div className={styles.stepNumber}>{n}</div>
                    <div className={styles.stepText}>
                      <h3>{translate(`tutorial_step${n}_title`)}</h3>
                      <p>{translate(`tutorial_step${n}_text`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.keyLegend}>
                <div className={styles.keyBox}><kbd>F</kbd> → H, K</div>
                <div className={styles.keyBox}><kbd>J</kbd> → S, C</div>
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
                {demoStep >= 6 && <p>{translate('demo_step7')}</p>}
              </div>

              <div className={styles.demoContainer}>
                <div className={styles.stimulusBox}>
                  {(demoStep === 0 || demoStep === 2 || demoStep === 4) && (
                    <div className={styles.fixationCross}>+</div>
                  )}
                  {demoTrial && renderFlankerDisplay(demoTrial)}
                  {demoStep >= 6 && <div className={styles.fixationCross}>✓</div>}
                </div>
              </div>

              <div className={styles.keyLegend}>
                <div className={styles.keyBox}><kbd>F</kbd> → H, K</div>
                <div className={styles.keyBox}><kbd>J</kbd> → S, C</div>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 6}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Practice Complete */}
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
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{stats.accuracy.toFixed(0)}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_total_trials')}:</span>
                        <span className={styles.statValue}>{stats.total}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_timeouts')}:</span>
                        <span className={styles.statValue}>{stats.timeouts}</span>
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

          {/* Trial display (fixation + stimulus + feedback share the layout) */}
          {(gameState === 'fixation' || gameState === 'stimulus' || gameState === 'feedback') && (
            <div className={styles.stimulusContainer} aria-label="EFT Stimulus Area">
              <div
                className={styles.stimulusBox}
                style={{ backgroundColor: settings.backgroundColor }}
              >
                {gameState === 'fixation' && <div className={styles.fixationCross}>+</div>}
                {gameState === 'stimulus' && currentTrial && renderFlankerDisplay(currentTrial)}
                {gameState === 'feedback' && <div className={styles.fixationCross} />}
              </div>
              <div className={styles.bottomInstructions}>
                <div className={styles.keyLegend}>
                  <div className={styles.keyBox}><kbd>F</kbd> → H, K</div>
                  <div className={styles.keyBox}><kbd>J</kbd> → S, C</div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <EftResults
              trials={trials}
              onRestart={resetTest}
              t={translate}
            />
          )}

          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {showSettings && (
          <EftSettings
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

// Build the result payload saved to the database
function buildResultPayload(trials) {
  const valid = trials.filter(t => t.reactionTime != null && !t.timedOut);
  const correctTrials = valid.filter(t => t.correctResponse);

  const byCondition = { congruent: [], incongruent: [], neutral: [] };
  correctTrials.forEach(t => { byCondition[t.condition]?.push(t.reactionTime); });

  const meanOf = (arr) => arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;

  const meanCong = meanOf(byCondition.congruent);
  const meanIncong = meanOf(byCondition.incongruent);
  const meanNeutral = meanOf(byCondition.neutral);

  const accuracyOf = (cond) => {
    const condTrials = trials.filter(t => t.condition === cond);
    if (condTrials.length === 0) return 0;
    return condTrials.filter(t => t.correctResponse).length / condTrials.length;
  };

  return {
    trials,
    totalTrials: trials.length,
    validTrials: valid.length,
    overallAccuracy: trials.length ? correctTrials.length / trials.length : 0,
    meanRT: meanOf(correctTrials.map(t => t.reactionTime)),
    meanRTCongruent: meanCong,
    meanRTIncongruent: meanIncong,
    meanRTNeutral: meanNeutral,
    flankerEffect: meanIncong - meanCong,
    accuracyCongruent: accuracyOf('congruent'),
    accuracyIncongruent: accuracyOf('incongruent'),
    accuracyNeutral: accuracyOf('neutral'),
    timeouts: trials.filter(t => t.timedOut).length,
  };
}

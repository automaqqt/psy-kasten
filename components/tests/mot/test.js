// components/tests/mot/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/MotTest.module.css';
import MotResults from '../../results/mot';
import MotSettings from '../../settings/mot';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR, OBJECT_SIZE, AREA_PADDING, MIN_DISTANCE } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// --- Helpers ---

function createObjects(numObjects, numTargets, areaW, areaH) {
  const objects = [];
  const usableW = areaW - AREA_PADDING * 2;
  const usableH = areaH - AREA_PADDING * 2;

  for (let i = 0; i < numObjects; i++) {
    let x, y, valid, attempts = 0;
    do {
      valid = true;
      x = AREA_PADDING + OBJECT_SIZE / 2 + Math.random() * (usableW - OBJECT_SIZE);
      y = AREA_PADDING + OBJECT_SIZE / 2 + Math.random() * (usableH - OBJECT_SIZE);
      for (const obj of objects) {
        const dx = x - obj.x;
        const dy = y - obj.y;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) {
          valid = false;
          break;
        }
      }
      attempts++;
    } while (!valid && attempts < 200);

    const angle = Math.random() * Math.PI * 2;
    objects.push({ id: i, x, y, vx: Math.cos(angle), vy: Math.sin(angle), isTarget: false });
  }

  // Randomly assign targets
  const indices = objects.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  for (let i = 0; i < numTargets; i++) {
    objects[indices[i]].isTarget = true;
  }

  return objects;
}

function stepObjects(objs, speed, areaW, areaH) {
  const half = OBJECT_SIZE / 2;
  return objs.map(obj => {
    let nx = obj.x + obj.vx * speed;
    let ny = obj.y + obj.vy * speed;
    let nvx = obj.vx;
    let nvy = obj.vy;

    if (nx < AREA_PADDING + half) { nvx = Math.abs(nvx); nx = AREA_PADDING + half; }
    if (nx > areaW - AREA_PADDING - half) { nvx = -Math.abs(nvx); nx = areaW - AREA_PADDING - half; }
    if (ny < AREA_PADDING + half) { nvy = Math.abs(nvy); ny = AREA_PADDING + half; }
    if (ny > areaH - AREA_PADDING - half) { nvy = -Math.abs(nvy); ny = areaH - AREA_PADDING - half; }

    return { ...obj, x: nx, y: ny, vx: nvx, vy: nvy };
  });
}

// --- Component ---

export default function MotTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, results
  const [trialPhase, setTrialPhase] = useState(null);
  // Trial phases: identifying, tracking, responding, feedback
  const [objects, setObjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [currentTrialNum, setCurrentTrialNum] = useState(0);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [trackingProgress, setTrackingProgress] = useState(0); // 0-1
  const [areaSize, setAreaSize] = useState({ w: 600, h: 480 });
  const [trialKey, setTrialKey] = useState(0); // force remount on new trial

  const animationRef = useRef(null);
  const objectsRef = useRef([]);
  const phaseTimerRef = useRef(null);
  const responseStartRef = useRef(null);
  const isPracticeRef = useRef(false);
  const currentTrialNumRef = useRef(0);
  const trialsRef = useRef([]);
  const practiceTrialsRef = useRef([]);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const trackingStartRef = useRef(null);
  const areaRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { currentTrialNumRef.current = currentTrialNum; }, [currentTrialNum]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { practiceTrialsRef.current = practiceTrials; }, [practiceTrials]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Measure tracking area size
  useEffect(() => {
    if (!areaRef.current) return;
    const measure = () => {
      const rect = areaRef.current.getBoundingClientRect();
      const w = Math.min(rect.width, 700);
      const h = Math.min(rect.height, 560);
      if (w > 100 && h > 100) setAreaSize({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [gameState]);

  const getActiveSettings = useCallback(() => {
    return isPracticeRef.current ? PRACTICE_SETTINGS : settingsRef.current;
  }, []);

  // --- Demo animation ---
  useEffect(() => {
    if (gameState !== 'demo') return;
    const demoW = 300, demoH = 240;

    if (demoStep === 0) {
      // Show objects with targets highlighted
      const objs = createObjects(6, 3, demoW, demoH);
      setObjects(objs);
      objectsRef.current = objs;
      const timer = setTimeout(() => setDemoStep(1), 3000);
      return () => clearTimeout(timer);
    } else if (demoStep === 1) {
      // Targets become same color — "remember which were targets"
      const timer = setTimeout(() => setDemoStep(2), 2000);
      return () => clearTimeout(timer);
    } else if (demoStep === 2) {
      // Objects start moving
      const speed = 2;
      const demoW2 = 300, demoH2 = 240;
      const animate = () => {
        objectsRef.current = stepObjects(objectsRef.current, speed, demoW2, demoH2);
        setObjects([...objectsRef.current]);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      const timer = setTimeout(() => {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        setObjects([...objectsRef.current]);
        setDemoStep(3);
      }, 4000);
      return () => {
        clearTimeout(timer);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    } else if (demoStep === 3) {
      // Objects stopped — "click targets"
      const timer = setTimeout(() => setDemoStep(4), 3000);
      return () => clearTimeout(timer);
    } else if (demoStep === 4) {
      // Show feedback — targets revealed
      const timer = setTimeout(() => setDemoStep(5), 3000);
      return () => clearTimeout(timer);
    }
    // Step 5 = done, user can click to practice
  }, [gameState, demoStep]);

  // --- Trial management ---

  const startTrial = useCallback((trialNum, practice) => {
    const s = practice ? PRACTICE_SETTINGS : settingsRef.current;
    const objs = createObjects(s.numObjects, s.numTargets, areaSize.w, areaSize.h);
    objectsRef.current = objs;
    setObjects(objs);
    setSelectedIds([]);
    setTrialKey(k => k + 1);
    setCurrentTrialNum(trialNum);
    setTrialPhase('identifying');
    setTrackingProgress(0);

    // After identification → start tracking
    phaseTimerRef.current = addTimer(setTimeout(() => {
      setTrialPhase('tracking');
      trackingStartRef.current = Date.now();

      // Animate objects
      const animate = () => {
        const elapsed = Date.now() - trackingStartRef.current;
        const progress = Math.min(1, elapsed / s.trackingDuration);
        setTrackingProgress(progress);

        objectsRef.current = stepObjects(objectsRef.current, s.movementSpeed, areaSize.w, areaSize.h);
        setObjects([...objectsRef.current]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Tracking done → response phase
          animationRef.current = null;
          setObjects([...objectsRef.current]);
          setTrialPhase('responding');
          responseStartRef.current = Date.now();
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }, s.identificationDuration));
  }, [areaSize, addTimer]);

  const stopMovement = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // --- Start practice / test ---

  const startPractice = useCallback(async () => {
    stopMovement();
    clearAllTimers();
    setIsPractice(true);
    isPracticeRef.current = true;
    await requestFullscreen();
    setPracticeTrials([]);
    practiceTrialsRef.current = [];
    setGameState('countdown');

    startCountdown(() => {
      setGameState('playing');
      startTrial(1, true);
    });
  }, [stopMovement, clearAllTimers, requestFullscreen, startCountdown, startTrial]);

  const startTest = useCallback(async () => {
    stopMovement();
    clearAllTimers();
    setIsPractice(false);
    isPracticeRef.current = false;
    await requestFullscreen();
    setTrials([]);
    trialsRef.current = [];
    setGameState('countdown');

    startCountdown(() => {
      setGameState('playing');
      startTrial(1, false);
    });
  }, [stopMovement, clearAllTimers, requestFullscreen, startCountdown, startTrial]);

  // --- Response handling ---

  const handleObjectClick = useCallback((objId) => {
    if (trialPhase !== 'responding') return;
    const s = getActiveSettings();
    setSelectedIds(prev => {
      if (prev.includes(objId)) {
        return prev.filter(id => id !== objId);
      } else if (prev.length < s.numTargets) {
        return [...prev, objId];
      }
      return prev;
    });
  }, [trialPhase, getActiveSettings]);

  const submitResponse = useCallback(() => {
    if (trialPhase !== 'responding') return;
    const s = getActiveSettings();
    const responseTime = Date.now() - responseStartRef.current;
    const curObjects = objectsRef.current;
    const targetIds = curObjects.filter(o => o.isTarget).map(o => o.id);
    const selected = [...selectedIds];

    const correctSelections = selected.filter(id => targetIds.includes(id)).length;
    const incorrectSelections = selected.filter(id => !targetIds.includes(id)).length;
    const missedTargets = s.numTargets - correctSelections;
    const accuracy = s.numTargets > 0 ? correctSelections / s.numTargets : 0;

    const trialData = {
      trialNumber: currentTrialNumRef.current,
      numObjects: s.numObjects,
      numTargets: s.numTargets,
      targetIds,
      selectedIds: selected,
      correctSelections,
      incorrectSelections,
      missedTargets,
      accuracy,
      responseTime,
      trackingDuration: s.trackingDuration,
    };

    const practice = isPracticeRef.current;
    if (practice) {
      setPracticeTrials(prev => [...prev, trialData]);
    } else {
      setTrials(prev => [...prev, trialData]);
    }

    // Show feedback phase
    setTrialPhase('feedback');
    phaseTimerRef.current = addTimer(setTimeout(() => {
      const trialNum = currentTrialNumRef.current;
      const total = practice ? PRACTICE_SETTINGS.totalTrials : settingsRef.current.totalTrials;
      if (trialNum >= total) {
        if (practice) finishPractice();
        else finishTest();
      } else {
        startTrial(trialNum + 1, practice);
      }
    }, s.feedbackDuration));
  }, [trialPhase, selectedIds, getActiveSettings, addTimer, startTrial]);

  // --- Finish ---

  const finishPractice = useCallback(() => {
    stopMovement();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setTrialPhase(null);
    setGameState('practiceComplete');
  }, [stopMovement, clearAllTimers, isFullscreen, exitFullscreen]);

  const finishTest = useCallback(() => {
    stopMovement();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setTrialPhase(null);

    showOverlayMessage('feedback_test_complete', 1500);
    addTimer(setTimeout(() => {
      setGameState('results');
      if (!isStandalone && onComplete) {
        const allTrials = trialsRef.current;
        const totalCorrect = allTrials.reduce((sum, t) => sum + t.correctSelections, 0);
        const totalPossible = allTrials.reduce((sum, t) => sum + t.numTargets, 0);
        const meanAccuracy = totalPossible > 0 ? totalCorrect / totalPossible : 0;
        const meanRT = allTrials.length > 0
          ? allTrials.reduce((sum, t) => sum + t.responseTime, 0) / allTrials.length : 0;

        onComplete({
          trials: allTrials,
          summary: {
            totalTrials: allTrials.length,
            meanAccuracy: Math.round(meanAccuracy * 1000) / 1000,
            totalCorrect,
            totalPossible,
            meanResponseTime: Math.round(meanRT),
          },
        });
      }
    }, 1500));
  }, [stopMovement, clearAllTimers, isFullscreen, exitFullscreen, showOverlayMessage, addTimer, isStandalone, onComplete]);

  const stopTest = useCallback(() => {
    if (gameState === 'playing') {
      stopMovement();
      clearAllTimers();
      if (isPracticeRef.current) finishPractice();
      else finishTest();
    }
  }, [gameState, stopMovement, clearAllTimers, finishPractice, finishTest]);

  const resetTest = useCallback(() => {
    stopMovement();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrialPhase(null);
    setTrials([]);
    setPracticeTrials([]);
    setIsPractice(false);
    setObjects([]);
    setSelectedIds([]);
    setCurrentTrialNum(0);
  }, [stopMovement, clearAllTimers, isFullscreen, exitFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // --- Practice stats ---
  const calculatePracticeStats = () => {
    const t = practiceTrials;
    if (t.length === 0) return { meanAccuracy: 0, totalCorrect: 0, totalTrials: 0, meanRT: 0 };
    const totalCorrect = t.reduce((s, tr) => s + tr.correctSelections, 0);
    const totalPossible = t.reduce((s, tr) => s + tr.numTargets, 0);
    const meanAccuracy = totalPossible > 0 ? totalCorrect / totalPossible : 0;
    const meanRT = t.reduce((s, tr) => s + tr.responseTime, 0) / t.length;
    return { meanAccuracy, totalCorrect, totalTrials: t.length, meanRT };
  };

  // --- Object color logic ---
  const getObjectStyle = (obj) => {
    const base = {
      position: 'absolute',
      left: obj.x - OBJECT_SIZE / 2,
      top: obj.y - OBJECT_SIZE / 2,
      width: OBJECT_SIZE,
      height: OBJECT_SIZE,
      borderRadius: '50%',
      transition: trialPhase === 'tracking' ? 'none' : 'background-color 0.3s, border-color 0.3s',
      cursor: trialPhase === 'responding' ? 'pointer' : 'default',
      border: '3px solid transparent',
      boxSizing: 'border-box',
    };

    const isSelected = selectedIds.includes(obj.id);

    if (trialPhase === 'identifying' || (gameState === 'demo' && demoStep === 0)) {
      base.backgroundColor = obj.isTarget ? '#e53935' : '#78909c';
      if (obj.isTarget) base.boxShadow = '0 0 12px rgba(229, 57, 53, 0.6)';
    } else if (trialPhase === 'tracking' || (gameState === 'demo' && (demoStep === 1 || demoStep === 2))) {
      base.backgroundColor = '#78909c';
    } else if (trialPhase === 'responding' || (gameState === 'demo' && demoStep === 3)) {
      base.backgroundColor = '#78909c';
      if (isSelected) {
        base.borderColor = '#1e88e5';
        base.boxShadow = '0 0 10px rgba(30, 136, 229, 0.5)';
      }
    } else if (trialPhase === 'feedback' || (gameState === 'demo' && demoStep >= 4)) {
      if (obj.isTarget && isSelected) {
        base.backgroundColor = '#43a047';
        base.boxShadow = '0 0 10px rgba(67, 160, 71, 0.5)';
      } else if (obj.isTarget && !isSelected) {
        base.backgroundColor = '#e53935';
        base.boxShadow = '0 0 10px rgba(229, 57, 53, 0.5)';
      } else if (!obj.isTarget && isSelected) {
        base.backgroundColor = '#fb8c00';
        base.boxShadow = '0 0 10px rgba(251, 140, 0, 0.5)';
      } else {
        base.backgroundColor = '#78909c';
        base.opacity = 0.4;
      }
    } else {
      base.backgroundColor = '#78909c';
    }

    return base;
  };

  // --- Render ---
  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {gameState === 'playing' && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_progress')}: <span className={styles.metricValue}>
                  {currentTrialNum} / {isPractice ? PRACTICE_SETTINGS.totalTrials : settings.totalTrials}
                </span>
              </div>
              {trialPhase === 'tracking' && (
                <div className={styles.timeIndicator}>
                  {translate('tracking')}
                </div>
              )}
              {trialPhase === 'responding' && (
                <div className={styles.timeIndicator}>
                  {translate('select_targets')}
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
                <div className={styles.tutorialStep}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepText}>
                    <h3>{translate('tutorial_step1_title')}</h3>
                    <p>{translate('tutorial_step1_text')}</p>
                  </div>
                </div>
                <div className={styles.tutorialStep}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepText}>
                    <h3>{translate('tutorial_step2_title')}</h3>
                    <p>{translate('tutorial_step2_text')}</p>
                  </div>
                </div>
                <div className={styles.tutorialStep}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepText}>
                    <h3>{translate('tutorial_step3_title')}</h3>
                    <p>{translate('tutorial_step3_text')}</p>
                  </div>
                </div>
                <div className={styles.tutorialStep}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepText}>
                    <h3>{translate('tutorial_step4_title')}</h3>
                    <p>{translate('tutorial_step4_text')}</p>
                  </div>
                </div>
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

              <div className={styles.demoContainer}>
                <div className={styles.trackingArea} style={{ width: 300, height: 240, position: 'relative' }}>
                  {objects.map(obj => (
                    <div key={obj.id} style={getObjectStyle(obj)} />
                  ))}
                </div>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 5}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => {
                  stopMovement();
                  setGameState('tutorial');
                }}>
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
                        <span className={styles.statValue}>{(stats.meanAccuracy * 100).toFixed(0)}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_correct')}:</span>
                        <span className={styles.statValue}>{stats.totalCorrect} / {stats.totalTrials * (PRACTICE_SETTINGS.numTargets)}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_trials')}:</span>
                        <span className={styles.statValue}>{stats.totalTrials}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{(stats.meanRT / 1000).toFixed(1)}s</span>
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

          {/* Playing — tracking area */}
          {gameState === 'playing' && (
            <div className={styles.playingContainer}>
              {/* Phase indicator */}
              <div className={styles.phaseBar}>
                {trialPhase === 'identifying' && (
                  <div className={styles.phaseLabel} style={{ color: '#e53935' }}>
                    {translate('phase_identifying')}
                  </div>
                )}
                {trialPhase === 'tracking' && (
                  <>
                    <div className={styles.phaseLabel}>{translate('phase_tracking')}</div>
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBar} style={{ width: `${trackingProgress * 100}%` }} />
                    </div>
                  </>
                )}
                {trialPhase === 'responding' && (
                  <div className={styles.phaseLabel} style={{ color: '#1e88e5' }}>
                    {translate('phase_responding', { selected: selectedIds.length, total: getActiveSettings().numTargets })}
                  </div>
                )}
                {trialPhase === 'feedback' && (
                  <div className={styles.phaseLabel} style={{ color: '#43a047' }}>
                    {translate('phase_feedback')}
                  </div>
                )}
              </div>

              {/* Tracking area */}
              <div
                ref={areaRef}
                className={styles.trackingArea}
                style={{ width: '100%', maxWidth: 700, aspectRatio: '7/5.6' }}
              >
                {objects.map(obj => (
                  <div
                    key={`${trialKey}-${obj.id}`}
                    style={getObjectStyle(obj)}
                    onClick={() => handleObjectClick(obj.id)}
                    role={trialPhase === 'responding' ? 'button' : undefined}
                    tabIndex={trialPhase === 'responding' ? 0 : undefined}
                    aria-label={trialPhase === 'responding' ? `Object ${obj.id + 1}` : undefined}
                  />
                ))}
              </div>

              {/* Submit button in response phase */}
              {trialPhase === 'responding' && (
                <button
                  className={styles.submitButton}
                  onClick={submitResponse}
                  disabled={selectedIds.length !== getActiveSettings().numTargets}
                >
                  {translate('submit_response')} ({selectedIds.length}/{getActiveSettings().numTargets})
                </button>
              )}

              {/* Feedback legend */}
              {trialPhase === 'feedback' && (
                <div className={styles.feedbackLegend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#43a047' }} />
                    {translate('legend_correct')}
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#e53935' }} />
                    {translate('legend_missed')}
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#fb8c00' }} />
                    {translate('legend_wrong')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <MotResults
              trials={trials}
              settings={settings}
              onRestart={resetTest}
              t={translate}
            />
          )}

          {/* Message overlay */}
          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {/* Settings panel */}
        {showSettings && (
          <MotSettings
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

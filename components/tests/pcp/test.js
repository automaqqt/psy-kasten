// components/tests/pcp/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/PcpTest.module.css';
import PcpResults from '../../results/pcp';
import PcpSettings from '../../settings/pcp';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// Phases within a single trial
const PHASE_FIXATION = 'fixation';
const PHASE_CUE = 'cue';
const PHASE_CTI = 'cti';
const PHASE_TARGET = 'target';
const PHASE_FEEDBACK = 'feedback';

function buildTrialSequence(settings) {
  const { totalTrials, cueTargetIntervals, validityRatio, noTargetRatio } = settings;
  const trials = [];
  for (let i = 0; i < totalTrials; i++) {
    const cueSide = Math.random() < 0.5 ? 'left' : 'right';
    const cti = cueTargetIntervals[i % cueTargetIntervals.length];
    const hasTarget = Math.random() >= noTargetRatio;
    const valid = Math.random() < validityRatio;
    const targetSide = hasTarget ? (valid ? cueSide : (cueSide === 'left' ? 'right' : 'left')) : null;
    trials.push({
      trialNumber: i + 1,
      cueSide,
      cti,
      hasTarget,
      targetSide,
      validity: hasTarget ? (valid ? 'valid' : 'invalid') : 'no-target',
    });
  }
  // Simple shuffle of CTIs so they are interleaved
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
    trials[i].trialNumber = i + 1;
    trials[j].trialNumber = j + 1;
  }
  return trials;
}

export default function PcpTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, results
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trialPlan, setTrialPlan] = useState([]);
  const [phase, setPhase] = useState(null);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [cueOnSide, setCueOnSide] = useState(null);
  const [targetOnSide, setTargetOnSide] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const [isPractice, setIsPractice] = useState(false);

  const phaseTimerRef = useRef(null);
  const targetOnsetRef = useRef(null);
  const respondedRef = useRef(false);
  const isPracticeRef = useRef(false);

  // Demo animation — cycles through fixation, cue, target, response
  useEffect(() => {
    if (gameState !== 'demo') return;
    const timings = [2200, 1800, 1800, 2200, 2500, 2500];
    if (demoStep >= timings.length) return;
    const timer = setTimeout(() => setDemoStep(demoStep + 1), timings[demoStep]);
    return () => clearTimeout(timer);
  }, [gameState, demoStep]);

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  const endTest = useCallback((collectedTrials) => {
    clearPhaseTimer();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    showOverlayMessage('feedback_test_complete', 1500);

    const valid = collectedTrials.filter(x => x.validity === 'valid' && x.correct && x.reactionTime != null);
    const invalid = collectedTrials.filter(x => x.validity === 'invalid' && x.correct && x.reactionTime != null);
    const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const meanRTValid = mean(valid.map(x => x.reactionTime));
    const meanRTInvalid = mean(invalid.map(x => x.reactionTime));
    const cueingEffect = meanRTInvalid - meanRTValid;

    const targetTrials = collectedTrials.filter(x => x.hasTarget);
    const noTargetTrials = collectedTrials.filter(x => !x.hasTarget);
    const correctCount = targetTrials.filter(x => x.correct).length;
    const accuracy = targetTrials.length ? correctCount / targetTrials.length : 0;
    const anticipatory = collectedTrials.filter(x => x.anticipatory).length;
    const late = collectedTrials.filter(x => x.late).length;
    const falseAlarms = noTargetTrials.filter(x => x.falseAlarm).length;

    setTimeout(() => {
      setGameState('results');
      if (!isPracticeRef.current && !isStandalone && onComplete) {
        onComplete({
          trials: collectedTrials,
          meanRTValid,
          meanRTInvalid,
          cueingEffect,
          accuracy,
          anticipatory,
          late,
          falseAlarms,
          totalTrials: collectedTrials.length,
        });
      }
    }, 1500);
  }, [clearAllTimers, clearPhaseTimer, exitFullscreen, isFullscreen, isStandalone, onComplete, showOverlayMessage]);

  const runTrial = useCallback((index, plan, collected) => {
    if (index >= plan.length) {
      if (isPracticeRef.current) {
        setPracticeTrials(collected);
        clearPhaseTimer();
        clearAllTimers();
        if (isFullscreen) exitFullscreen();
        setGameState('practiceComplete');
      } else {
        setTrials(collected);
        endTest(collected);
      }
      return;
    }

    const trial = plan[index];
    setCurrentTrial(trial);
    setTrialIndex(index);
    respondedRef.current = false;
    setCueOnSide(null);
    setTargetOnSide(null);

    // Phase 1: fixation
    setPhase(PHASE_FIXATION);
    phaseTimerRef.current = setTimeout(() => {
      // Phase 2: cue
      setCueOnSide(trial.cueSide);
      setPhase(PHASE_CUE);
      phaseTimerRef.current = setTimeout(() => {
        // Phase 3: CTI (cue off)
        setCueOnSide(null);
        setPhase(PHASE_CTI);
        phaseTimerRef.current = setTimeout(() => {
          // Phase 4: target (or no-target)
          if (trial.hasTarget) {
            setTargetOnSide(trial.targetSide);
            setPhase(PHASE_TARGET);
            targetOnsetRef.current = Date.now();
            phaseTimerRef.current = setTimeout(() => {
              if (!respondedRef.current) {
                // timeout — no response
                respondedRef.current = true;
                const completed = {
                  ...trial,
                  reactionTime: null,
                  correct: false,
                  timedOut: true,
                  anticipatory: false,
                  late: false,
                  falseAlarm: false,
                };
                const next = [...collected, completed];
                advanceAfter(index, plan, next, 300);
              }
            }, settings.targetTimeout);
          } else {
            // No-target catch trial — wait the target window and see if any false alarm
            setPhase(PHASE_TARGET); // keep same state but no target rendered
            targetOnsetRef.current = Date.now();
            phaseTimerRef.current = setTimeout(() => {
              if (!respondedRef.current) {
                respondedRef.current = true;
                const completed = {
                  ...trial,
                  reactionTime: null,
                  correct: true,
                  timedOut: false,
                  anticipatory: false,
                  late: false,
                  falseAlarm: false,
                };
                advanceAfter(index, plan, [...collected, completed], 200);
              }
            }, settings.targetTimeout);
          }
        }, trial.cti);
      }, settings.cueDuration);
    }, settings.fixationDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.fixationDuration, settings.cueDuration, settings.targetTimeout, clearAllTimers, clearPhaseTimer, endTest, exitFullscreen, isFullscreen]);

  // Helper: schedule next trial after ITI
  const advanceAfter = useCallback((index, plan, collected, feedbackDelay = 200) => {
    clearPhaseTimer();
    setPhase(PHASE_FEEDBACK);
    phaseTimerRef.current = setTimeout(() => {
      runTrial(index + 1, plan, collected);
    }, (settings.intertrialInterval || 500) + feedbackDelay);
  }, [clearPhaseTimer, runTrial, settings.intertrialInterval]);

  // Key handling
  const handleKeyResponse = useCallback(() => {
    if (respondedRef.current) return;
    const trial = currentTrial;
    if (!trial) return;

    const now = Date.now();

    // Before target onset → anticipatory or false-alarm (if no-target catch or pre-target window)
    if (phase === PHASE_FIXATION || phase === PHASE_CUE || phase === PHASE_CTI) {
      respondedRef.current = true;
      const completed = {
        ...trial,
        reactionTime: null,
        correct: false,
        anticipatory: true,
        late: false,
        timedOut: false,
        falseAlarm: false,
      };
      const collection = isPracticeRef.current ? practiceTrials : trials;
      const next = [...collection, completed];
      if (isPracticeRef.current) setPracticeTrials(next); else setTrials(next);
      showOverlayMessage('feedback_too_early', 700);
      advanceAfter(trialIndex, trialPlan, next, 500);
      return;
    }

    if (phase === PHASE_TARGET) {
      respondedRef.current = true;
      const rt = now - targetOnsetRef.current;

      if (!trial.hasTarget) {
        // false alarm on catch trial
        const completed = {
          ...trial,
          reactionTime: rt,
          correct: false,
          anticipatory: false,
          late: false,
          timedOut: false,
          falseAlarm: true,
        };
        const collection = isPracticeRef.current ? practiceTrials : trials;
        const next = [...collection, completed];
        if (isPracticeRef.current) setPracticeTrials(next); else setTrials(next);
        showOverlayMessage('feedback_false_alarm', 700);
        advanceAfter(trialIndex, trialPlan, next, 400);
        return;
      }

      const anticipatory = rt < settings.anticipatoryThreshold;
      const late = rt > settings.lateThreshold;
      const completed = {
        ...trial,
        reactionTime: rt,
        correct: !anticipatory && !late,
        anticipatory,
        late,
        timedOut: false,
        falseAlarm: false,
      };
      const collection = isPracticeRef.current ? practiceTrials : trials;
      const next = [...collection, completed];
      if (isPracticeRef.current) setPracticeTrials(next); else setTrials(next);

      if (isPracticeRef.current) {
        if (anticipatory) showOverlayMessage('feedback_too_early', 600);
        else if (late) showOverlayMessage('feedback_too_slow', 600);
        else showOverlayMessage(translate('feedback_reaction_time', { rt }), 600);
      }
      advanceAfter(trialIndex, trialPlan, next, 200);
    }
  }, [phase, currentTrial, trialIndex, trialPlan, practiceTrials, trials, settings.anticipatoryThreshold, settings.lateThreshold, showOverlayMessage, translate, advanceAfter]);

  useEffect(() => {
    const handler = (e) => {
      if (gameState !== 'playing') return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleKeyResponse();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, handleKeyResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const startPractice = async () => {
    clearPhaseTimer();
    clearAllTimers();
    isPracticeRef.current = true;
    setIsPractice(true);
    await requestFullscreen();
    setPracticeTrials([]);
    const plan = buildTrialSequence(PRACTICE_SETTINGS);
    setTrialPlan(plan);
    setGameState('countdown');
    startCountdown(() => {
      setGameState('playing');
      setTimeout(() => runTrial(0, plan, []), 500);
    });
  };

  const startTest = async () => {
    clearPhaseTimer();
    clearAllTimers();
    isPracticeRef.current = false;
    setIsPractice(false);
    await requestFullscreen();
    setTrials([]);
    const plan = buildTrialSequence(settings);
    setTrialPlan(plan);
    setGameState('countdown');
    startCountdown(() => {
      setGameState('playing');
      setTimeout(() => runTrial(0, plan, []), 500);
    });
  };

  const stopTest = () => {
    if (gameState === 'playing') {
      clearPhaseTimer();
      clearAllTimers();
      const collected = isPracticeRef.current ? practiceTrials : trials;
      if (isPracticeRef.current) {
        if (isFullscreen) exitFullscreen();
        setGameState('practiceComplete');
      } else {
        endTest(collected);
      }
    }
  };

  const resetTest = () => {
    clearPhaseTimer();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setTrialIndex(0);
    setPhase(null);
    setCueOnSide(null);
    setTargetOnSide(null);
    isPracticeRef.current = false;
    setIsPractice(false);
  };

  // Derived demo visuals
  const demoCueSide = (demoStep === 1) ? 'right' : null;
  const demoTargetSide = (demoStep === 2 || demoStep === 3) ? 'right' : null;
  const demoShowFixation = demoStep < 6;

  const calculatePracticeStats = () => {
    const valid = practiceTrials.filter(t => t.correct && t.reactionTime != null);
    const rts = valid.map(t => t.reactionTime);
    const meanRT = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const sorted = [...rts].sort((a, b) => a - b);
    const medianRT = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const accuracy = practiceTrials.length
      ? practiceTrials.filter(t => t.correct).length / practiceTrials.length
      : 0;
    const anticipatory = practiceTrials.filter(t => t.anticipatory).length;
    return { meanRT, medianRT, validTrials: valid.length, accuracy, anticipatory };
  };

  const renderTrialScreen = () => {
    const showCue = cueOnSide !== null;
    const showTarget = targetOnSide !== null;

    return (
      <div className={styles.stimulusContainer} aria-label="PCP Stimulus Area">
        <div className={styles.posnerRow}>
          {/* Left placeholder */}
          <div className={`${styles.placeholder} ${showCue && cueOnSide === 'left' ? styles.placeholderCued : ''}`}>
            {showTarget && targetOnSide === 'left' && <span className={styles.targetLetter}>X</span>}
          </div>
          {/* Fixation */}
          <div className={styles.fixation}>+</div>
          {/* Right placeholder */}
          <div className={`${styles.placeholder} ${showCue && cueOnSide === 'right' ? styles.placeholderCued : ''}`}>
            {showTarget && targetOnSide === 'right' && <span className={styles.targetLetter}>X</span>}
          </div>
        </div>
        <div className={styles.bottomInstructions}>
          <p>{translate('bottom_instruction')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {gameState === 'playing' && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trials_completed')}: <span className={styles.metricValue}>
                  {(isPractice ? practiceTrials.length : trials.length)} / {trialPlan.length}
                </span>
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
                {demoStep >= 6 && <p>{translate('demo_step6')}</p>}
              </div>
              <div className={styles.demoContainer}>
                <div className={styles.posnerRow}>
                  <div className={`${styles.placeholder} ${styles.demoPlaceholder} ${demoCueSide === 'left' ? styles.placeholderCued : ''}`}>
                    {demoTargetSide === 'left' && <span className={styles.targetLetter}>X</span>}
                  </div>
                  <div className={styles.fixation}>{demoShowFixation ? '+' : ''}</div>
                  <div className={`${styles.placeholder} ${styles.demoPlaceholder} ${demoCueSide === 'right' ? styles.placeholderCued : ''}`}>
                    {demoTargetSide === 'right' && <span className={styles.targetLetter}>X</span>}
                  </div>
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
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

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
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_median_rt')}:</span>
                        <span className={styles.statValue}>{stats.medianRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{(stats.accuracy * 100).toFixed(0)}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_anticipatory')}:</span>
                        <span className={styles.statValue}>{stats.anticipatory}</span>
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

          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} translate={translate} />
          )}

          {gameState === 'playing' && renderTrialScreen()}

          {gameState === 'results' && (
            <PcpResults
              trials={trials}
              onRestart={resetTest}
              t={translate}
            />
          )}

          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {showSettings && (
          <PcpSettings
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

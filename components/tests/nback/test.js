// components/tests/nback/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/NbackTest.module.css';
import NbackResults from '../../results/nback';
import NbackSettings from '../../settings/nback';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, LETTERS, MATCH_KEY, NON_MATCH_KEY, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

/**
 * Generate a sequence of letters for the N-Back task.
 * Returns an array of { letter, isTarget, isLure } objects.
 */
function generateSequence(settings) {
  const { nLevel, trialsPerBlock, targetPercentage, lurePercentage } = settings;
  const totalTrials = trialsPerBlock + nLevel; // first N trials can't be scored
  const scorableCount = trialsPerBlock;

  const targetCount = Math.round(scorableCount * targetPercentage);
  const lureCount = Math.round(scorableCount * lurePercentage);

  // Decide which scorable positions (indices nLevel..totalTrials-1) are targets or lures
  const scorableIndices = [];
  for (let i = nLevel; i < totalTrials; i++) scorableIndices.push(i);

  // Shuffle and pick target positions
  const shuffled = [...scorableIndices].sort(() => Math.random() - 0.5);
  const targetPositions = new Set(shuffled.slice(0, targetCount));
  const lurePositions = new Set(shuffled.slice(targetCount, targetCount + lureCount));

  const sequence = [];

  for (let i = 0; i < totalTrials; i++) {
    if (i < nLevel) {
      // Initial non-scorable trials - just pick random letters
      sequence.push({
        letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
        isTarget: false,
        isLure: false,
        isScorable: false,
      });
    } else if (targetPositions.has(i)) {
      // Target: must match the letter N positions back
      sequence.push({
        letter: sequence[i - nLevel].letter,
        isTarget: true,
        isLure: false,
        isScorable: true,
      });
    } else if (lurePositions.has(i) && nLevel > 1) {
      // Lure: matches at wrong distance (n-1 back instead of n back)
      const lureDistance = nLevel - 1 || 1;
      const lureLetter = sequence[i - lureDistance]?.letter;
      // Make sure lure doesn't accidentally match the real n-back
      if (lureLetter && lureLetter !== sequence[i - nLevel].letter) {
        sequence.push({
          letter: lureLetter,
          isTarget: false,
          isLure: true,
          isScorable: true,
        });
      } else {
        // Fall back to a non-matching letter
        const avoid = new Set([sequence[i - nLevel].letter]);
        const available = LETTERS.filter(l => !avoid.has(l));
        sequence.push({
          letter: available[Math.floor(Math.random() * available.length)],
          isTarget: false,
          isLure: false,
          isScorable: true,
        });
      }
    } else {
      // Non-target: pick a letter that does NOT match N positions back
      const avoid = new Set([sequence[i - nLevel].letter]);
      // Also avoid matching at other n-distances to prevent accidental lures
      if (i - nLevel + 1 >= 0 && sequence[i - nLevel + 1]) {
        avoid.add(sequence[i - nLevel + 1].letter);
      }
      if (i - nLevel - 1 >= 0 && sequence[i - nLevel - 1]) {
        avoid.add(sequence[i - nLevel - 1].letter);
      }
      const available = LETTERS.filter(l => !avoid.has(l));
      sequence.push({
        letter: available[Math.floor(Math.random() * available.length)],
        isTarget: false,
        isLure: false,
        isScorable: true,
      });
    }
  }

  return sequence;
}

export default function NbackTest({ assignmentId, onComplete, isStandalone, t }) {
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
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [responded, setResponded] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLetter, setDemoLetter] = useState(null);
  const [isPractice, setIsPractice] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  // Refs
  const stimulusTimerRef = useRef(null);
  const isiTimerRef = useRef(null);
  const responseDeadlineRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const respondedRef = useRef(false);
  const currentIndexRef = useRef(0);
  const sequenceRef = useRef([]);
  const isPracticeRef = useRef(false);
  const gameStateRef = useRef('welcome');

  // Keep refs in sync
  useEffect(() => { respondedRef.current = responded; }, [responded]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;
    const demoSequence = ['B', 'G', 'B', 'T', 'K', 'T']; // 2-back: B matches at pos 2, T matches at pos 5

    if (demoStep === 0) {
      setDemoLetter(null);
      const timer = setTimeout(() => setDemoStep(1), 2000);
      return () => clearTimeout(timer);
    } else if (demoStep === 1) {
      setDemoLetter(demoSequence[0]); // B
      const timer = setTimeout(() => setDemoStep(2), 2500);
      return () => clearTimeout(timer);
    } else if (demoStep === 2) {
      setDemoLetter(demoSequence[1]); // G
      const timer = setTimeout(() => setDemoStep(3), 2500);
      return () => clearTimeout(timer);
    } else if (demoStep === 3) {
      setDemoLetter(demoSequence[2]); // B - TARGET
      const timer = setTimeout(() => setDemoStep(4), 3000);
      return () => clearTimeout(timer);
    } else if (demoStep === 4) {
      setDemoLetter(demoSequence[3]); // T
      const timer = setTimeout(() => setDemoStep(5), 2500);
      return () => clearTimeout(timer);
    } else if (demoStep === 5) {
      setDemoLetter(null);
      // done
    }
  }, [gameState, demoStep]);

  const clearTimers = useCallback(() => {
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
    if (responseDeadlineRef.current) clearTimeout(responseDeadlineRef.current);
    stimulusTimerRef.current = null;
    isiTimerRef.current = null;
    responseDeadlineRef.current = null;
  }, []);

  // Present a single trial
  const presentTrial = useCallback((seq, index, activeSettings, practice) => {
    if (index >= seq.length) {
      // Block finished
      if (practice) {
        if (isFullscreen) exitFullscreen();
        setGameState('practiceComplete');
      } else {
        finishTest();
      }
      return;
    }

    const trialInfo = seq[index];
    setCurrentLetter(trialInfo.letter);
    setShowStimulus(true);
    setResponded(false);
    respondedRef.current = false;
    trialStartTimeRef.current = performance.now();
    setFeedbackText('');
    setFeedbackType('');

    // Hide stimulus after duration
    stimulusTimerRef.current = setTimeout(() => {
      setShowStimulus(false);
    }, activeSettings.stimulusDuration);

    // Response deadline
    responseDeadlineRef.current = setTimeout(() => {
      if (!respondedRef.current) {
        // No response given — record as miss if it was scorable
        const trialResult = {
          trialNumber: index + 1,
          letter: trialInfo.letter,
          isTarget: trialInfo.isTarget,
          isLure: trialInfo.isLure,
          isScorable: trialInfo.isScorable,
          response: null, // no response
          correct: trialInfo.isScorable ? !trialInfo.isTarget : null, // correct only if non-target (withholding)
          reactionTime: null,
          nLevel: activeSettings.nLevel,
        };

        if (trialInfo.isScorable) {
          if (trialInfo.isTarget) {
            trialResult.correct = false; // missed a target
            trialResult.outcomeType = 'miss';
            if (practice) {
              setFeedbackText(translate('feedback_miss'));
              setFeedbackType('incorrect');
            }
          } else {
            trialResult.correct = true; // correctly withheld on non-target
            trialResult.outcomeType = 'correctRejection';
          }
        }

        if (practice) {
          setPracticeTrials(prev => [...prev, trialResult]);
        } else {
          setTrials(prev => [...prev, trialResult]);
        }

        // Move to next trial after ISI
        setShowStimulus(false);
        respondedRef.current = true;
        const nextIdx = index + 1;
        isiTimerRef.current = setTimeout(() => {
          setCurrentIndex(nextIdx);
          presentTrial(seq, nextIdx, activeSettings, practice);
        }, practice && trialInfo.isScorable && trialInfo.isTarget ? 1200 : activeSettings.interStimulusInterval);
      }
    }, activeSettings.responseWindow);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate]);

  // Handle participant response
  const handleResponse = useCallback((isMatchResponse) => {
    if (respondedRef.current) return;
    if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'practice') return;

    respondedRef.current = true;
    setResponded(true);
    const rt = performance.now() - trialStartTimeRef.current;
    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    const seq = sequenceRef.current;
    const index = currentIndexRef.current;
    const trialInfo = seq[index];

    // Clear response deadline
    if (responseDeadlineRef.current) {
      clearTimeout(responseDeadlineRef.current);
      responseDeadlineRef.current = null;
    }

    let correct = null;
    let outcomeType = '';

    if (trialInfo.isScorable) {
      if (trialInfo.isTarget && isMatchResponse) {
        correct = true;
        outcomeType = 'hit';
      } else if (trialInfo.isTarget && !isMatchResponse) {
        correct = false;
        outcomeType = 'miss';
      } else if (!trialInfo.isTarget && !isMatchResponse) {
        correct = true;
        outcomeType = 'correctRejection';
      } else if (!trialInfo.isTarget && isMatchResponse) {
        correct = false;
        outcomeType = 'falseAlarm';
      }
    }

    const trialResult = {
      trialNumber: index + 1,
      letter: trialInfo.letter,
      isTarget: trialInfo.isTarget,
      isLure: trialInfo.isLure,
      isScorable: trialInfo.isScorable,
      response: isMatchResponse ? 'match' : 'nonMatch',
      correct,
      outcomeType,
      reactionTime: Math.round(rt),
      nLevel: activeSettings.nLevel,
    };

    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, trialResult]);
      // Show feedback in practice
      if (trialInfo.isScorable) {
        if (correct) {
          setFeedbackText(translate('feedback_correct'));
          setFeedbackType('correct');
        } else if (outcomeType === 'falseAlarm') {
          setFeedbackText(translate('feedback_false_alarm'));
          setFeedbackType('incorrect');
        } else {
          setFeedbackText(translate('feedback_wrong'));
          setFeedbackType('incorrect');
        }
      }
    } else {
      setTrials(prev => [...prev, trialResult]);
    }

    // Move to next trial after ISI
    const nextIdx = index + 1;
    isiTimerRef.current = setTimeout(() => {
      setCurrentIndex(nextIdx);
      presentTrial(seq, nextIdx, activeSettings, isPracticeRef.current);
    }, activeSettings.interStimulusInterval);
  }, [settings, presentTrial, translate]);

  // Start practice
  const startPractice = async () => {
    clearTimers();
    clearAllTimers();
    setIsPractice(true);
    isPracticeRef.current = true;
    await requestFullscreen();
    setPracticeTrials([]);
    const seq = generateSequence(PRACTICE_SETTINGS);
    setSequence(seq);
    sequenceRef.current = seq;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setGameState('countdown');

    startCountdown(() => {
      setGameState('practice');
      gameStateRef.current = 'practice';
      presentTrial(seq, 0, PRACTICE_SETTINGS, true);
    });
  };

  // Start real test
  const startTest = async () => {
    clearTimers();
    clearAllTimers();
    setIsPractice(false);
    isPracticeRef.current = false;
    await requestFullscreen();
    setTrials([]);
    const seq = generateSequence(settings);
    setSequence(seq);
    sequenceRef.current = seq;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setGameState('countdown');

    startCountdown(() => {
      setGameState('playing');
      gameStateRef.current = 'playing';
      presentTrial(seq, 0, settings, false);
    });
  };

  // Finish test
  const finishTest = useCallback(() => {
    clearTimers();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();

    setTimeout(() => {
      setGameState('results');
      gameStateRef.current = 'results';
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers, clearAllTimers, isFullscreen, exitFullscreen]);

  // Submit results when entering results state
  useEffect(() => {
    if (gameState === 'results' && trials.length > 0 && !isStandalone && onComplete) {
      const scorableTrials = trials.filter(t => t.isScorable);
      const hits = scorableTrials.filter(t => t.outcomeType === 'hit').length;
      const misses = scorableTrials.filter(t => t.outcomeType === 'miss').length;
      const falseAlarms = scorableTrials.filter(t => t.outcomeType === 'falseAlarm').length;
      const correctRejections = scorableTrials.filter(t => t.outcomeType === 'correctRejection').length;
      const totalTargets = scorableTrials.filter(t => t.isTarget).length;
      const totalNonTargets = scorableTrials.filter(t => !t.isTarget).length;
      const accuracy = scorableTrials.length > 0
        ? scorableTrials.filter(t => t.correct).length / scorableTrials.length
        : 0;
      const validRTs = scorableTrials.filter(t => t.reactionTime !== null).map(t => t.reactionTime);
      const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;

      // d-prime calculation
      let hitRate = totalTargets > 0 ? hits / totalTargets : 0;
      let faRate = totalNonTargets > 0 ? falseAlarms / totalNonTargets : 0;
      // Adjust extreme rates to avoid infinite z-scores
      if (hitRate === 0) hitRate = 0.5 / totalTargets;
      if (hitRate === 1) hitRate = 1 - 0.5 / totalTargets;
      if (faRate === 0) faRate = 0.5 / totalNonTargets;
      if (faRate === 1) faRate = 1 - 0.5 / totalNonTargets;
      const zHit = jstatNormInv(hitRate);
      const zFA = jstatNormInv(faRate);
      const dPrime = zHit - zFA;

      onComplete({
        trials,
        nLevel: settings.nLevel,
        accuracy,
        meanRT: Math.round(meanRT),
        hits,
        misses,
        falseAlarms,
        correctRejections,
        dPrime: parseFloat(dPrime.toFixed(2)),
        totalTrials: scorableTrials.length,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Reset test
  const resetTest = () => {
    clearTimers();
    clearAllTimers();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    gameStateRef.current = 'welcome';
    setTrials([]);
    setPracticeTrials([]);
    setSequence([]);
    setCurrentIndex(0);
    setCurrentLetter(null);
    setShowStimulus(false);
    setResponded(false);
    setIsPractice(false);
    setFeedbackText('');
    setFeedbackType('');
  };

  // Stop test early
  const stopTest = () => {
    if (gameState === 'playing' || gameState === 'practice') {
      clearTimers();
      if (isPractice) {
        if (isFullscreen) exitFullscreen();
        setGameState('practiceComplete');
      } else {
        finishTest();
      }
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = gameStateRef.current;
      if (state !== 'playing' && state !== 'practice') return;

      if (e.key.toLowerCase() === MATCH_KEY) {
        e.preventDefault();
        handleResponse(true);
      } else if (e.key.toLowerCase() === NON_MATCH_KEY) {
        e.preventDefault();
        handleResponse(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      clearAllTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate practice stats
  const calculatePracticeStats = () => {
    const scorable = practiceTrials.filter(t => t.isScorable);
    const correct = scorable.filter(t => t.correct).length;
    const accuracy = scorable.length > 0 ? ((correct / scorable.length) * 100).toFixed(0) : 0;
    const hits = scorable.filter(t => t.outcomeType === 'hit').length;
    const targets = scorable.filter(t => t.isTarget).length;
    const falseAlarms = scorable.filter(t => t.outcomeType === 'falseAlarm').length;
    const validRTs = scorable.filter(t => t.reactionTime !== null).map(t => t.reactionTime);
    const meanRT = validRTs.length > 0 ? (validRTs.reduce((a, b) => a + b, 0) / validRTs.length).toFixed(0) : 0;

    return { accuracy, hits, targets, falseAlarms, meanRT, total: scorable.length };
  };

  // Format n-level display
  const nLevelDisplay = (isPractice ? PRACTICE_SETTINGS : settings).nLevel;

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'playing' || gameState === 'practice') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_progress')}: <span className={styles.metricValue}>
                  {currentIndex + 1} / {sequence.length}
                </span>
              </div>
              <div className={styles.trialIndicator}>
                {nLevelDisplay}-Back
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
          {/* Welcome screen */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('welcome_title')}</h2>
              <p>{translate('welcome_p1')}</p>
              <p>{translate('welcome_p2')}</p>
              <p>{translate('welcome_p3', { nLevel: settings.nLevel })}</p>
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

          {/* Tutorial screen */}
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
                    <p>{translate('tutorial_step2_text', { nLevel: settings.nLevel })}</p>
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

          {/* Demo screen */}
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
                <div className={styles.letterDisplay}>
                  {demoLetter && (
                    <span className={styles.letter}>{demoLetter}</span>
                  )}
                  {!demoLetter && demoStep === 0 && (
                    <span className={styles.letterPlaceholder}>+</span>
                  )}
                  {!demoLetter && demoStep === 5 && (
                    <span className={styles.letterPlaceholder}>+</span>
                  )}
                </div>
                {demoStep > 0 && demoStep <= 4 && (
                  <div className={styles.demoHistory}>
                    {['B', 'G', 'B', 'T'].slice(0, demoStep).map((l, i) => (
                      <span key={i} className={styles.historyLetter}>{l}</span>
                    ))}
                  </div>
                )}
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

          {/* Practice Complete screen */}
          {gameState === 'practiceComplete' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('practice_complete_title')}</h2>
              <p>{translate('practice_complete_text1')}</p>
              <p>{translate('practice_complete_text2', { nLevel: settings.nLevel })}</p>

              <div className={styles.practiceStats}>
                <h3>{translate('practice_stats_title')}</h3>
                {(() => {
                  const stats = calculatePracticeStats();
                  return (
                    <>
                      <div className={styles.statRow}>
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{stats.accuracy}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_hits')}:</span>
                        <span className={styles.statValue}>{stats.hits}/{stats.targets}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_false_alarms')}:</span>
                        <span className={styles.statValue}>{stats.falseAlarms}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT} ms</span>
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

          {/* Test area — N-Back stimulus display */}
          {(gameState === 'playing' || gameState === 'practice') && (
            <div className={styles.stimulusContainer}>
              <div className={styles.nbackInfo}>
                <span className={styles.nbackLabel}>{nLevelDisplay}-Back</span>
              </div>

              <div className={styles.letterDisplay}>
                {showStimulus && currentLetter ? (
                  <span className={styles.letter}>{currentLetter}</span>
                ) : (
                  <span className={styles.letterPlaceholder}>+</span>
                )}
              </div>

              {feedbackText && isPractice && (
                <div className={`${styles.feedback} ${styles[feedbackType]}`}>
                  {feedbackText}
                </div>
              )}

              <div className={styles.responseButtons}>
                <button
                  className={`${styles.responseButton} ${styles.matchButton}`}
                  onClick={() => handleResponse(true)}
                  disabled={responded}
                >
                  <span className={styles.keyHint}>F</span>
                  {translate('button_match')}
                </button>
                <button
                  className={`${styles.responseButton} ${styles.noMatchButton}`}
                  onClick={() => handleResponse(false)}
                  disabled={responded}
                >
                  <span className={styles.keyHint}>J</span>
                  {translate('button_no_match')}
                </button>
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('bottom_instruction')}</p>
              </div>
            </div>
          )}

          {/* Results screen */}
          {gameState === 'results' && (
            <NbackResults
              trials={trials}
              nLevel={settings.nLevel}
              onRestart={resetTest}
              t={translate}
            />
          )}

          {/* Message overlay */}
          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {/* Settings panel */}
        {showSettings && (
          <NbackSettings
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

// Approximate inverse normal CDF (probit) for d-prime calculation
function jstatNormInv(p) {
  // Rational approximation (Abramowitz and Stegun)
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
     4.374664141464968e+00, 2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

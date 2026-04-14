// components/tests/stb/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/StbTest.module.css';
import StbResults from '../../results/stb';
import StbSettings from '../../settings/stb';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, CONSONANTS, KEY_IN_SET, KEY_NOT_IN_SET, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick n unique random items from array
function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

// Generate a single trial's letter sequence
function generateTrial(trialNumber, ignoreCount, settings) {
  const memorizeCount = settings.lettersPerTrial - ignoreCount;
  const letters = pickRandom(CONSONANTS, settings.lettersPerTrial);
  const memorizeLetters = letters.slice(0, memorizeCount);
  const ignoreLetters = letters.slice(memorizeCount);

  // Build sequence with type tags, then shuffle order
  const sequence = [
    ...memorizeLetters.map(l => ({ letter: l, type: 'memorize' })),
    ...ignoreLetters.map(l => ({ letter: l, type: 'ignore' })),
  ];
  const shuffledSequence = shuffle(sequence);

  // Decide probe
  const probeInSet = Math.random() < settings.probeInSetRatio;
  let probeLetter;
  if (probeInSet && memorizeLetters.length > 0) {
    probeLetter = memorizeLetters[Math.floor(Math.random() * memorizeLetters.length)];
  } else {
    // Pick a letter NOT in the full trial set
    const usedLetters = new Set(letters);
    const available = CONSONANTS.filter(l => !usedLetters.has(l));
    probeLetter = available[Math.floor(Math.random() * available.length)];
  }

  const maintenanceDuration = settings.maintenanceMin +
    Math.random() * (settings.maintenanceMax - settings.maintenanceMin);

  return {
    trialNumber,
    ignoreCount,
    memorizeCount,
    memorizeLetters,
    ignoreLetters,
    sequence: shuffledSequence,
    probeLetter,
    probeInSet,
    maintenanceDuration: Math.round(maintenanceDuration),
  };
}

// Generate all trials for a session
function generateTrialList(settings) {
  const ignoreConditions = [1, 3, 5];
  const trialsPerCondition = Math.ceil(settings.totalTrials / ignoreConditions.length);
  const trials = [];
  let trialNum = 1;

  for (const ignoreCount of ignoreConditions) {
    for (let i = 0; i < trialsPerCondition; i++) {
      trials.push(generateTrial(trialNum++, ignoreCount, settings));
    }
  }

  return shuffle(trials.slice(0, settings.totalTrials)).map((t, i) => ({
    ...t,
    trialNumber: i + 1,
  }));
}

export default function StbTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown,
  //   fixation, encoding, maintenance, probe, feedback, results
  const [trialList, setTrialList] = useState([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [letterIndex, setLetterIndex] = useState(-1);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [showLetter, setShowLetter] = useState(false);
  const [probeStartTime, setProbeStartTime] = useState(null);
  const [trialResults, setTrialResults] = useState([]);
  const [practiceResults, setPracticeResults] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Refs for timer cleanup
  const timerRef = useRef(null);
  const responseAllowedRef = useRef(false);

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;

    const timings = {
      0: 2500,  // Show fixation cross
      1: 2000,  // Show a black memorize letter
      2: 2000,  // Show a green ignore letter
      3: 2000,  // Show maintenance dash
      4: 2500,  // Show red probe letter
      5: 2500,  // Show response feedback
    };

    if (timings[demoStep] !== undefined) {
      const timer = setTimeout(() => setDemoStep(demoStep + 1), timings[demoStep]);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  // Start a trial sequence: fixation → encoding → maintenance → probe
  const runTrial = useCallback((trial, activeSettings) => {
    setCurrentTrial(trial);
    setLetterIndex(-1);
    setCurrentLetter(null);
    setShowLetter(false);
    responseAllowedRef.current = false;

    // Phase 1: Fixation
    setGameState('fixation');
    timerRef.current = setTimeout(() => {
      // Phase 2: Start encoding letters
      presentLetter(trial, 0, activeSettings);
    }, activeSettings.fixationDuration);
  }, []);

  // Present letter at index
  const presentLetter = useCallback((trial, idx, activeSettings) => {
    if (idx >= trial.sequence.length) {
      // All letters shown → maintenance
      setShowLetter(false);
      setCurrentLetter(null);
      setGameState('maintenance');
      timerRef.current = setTimeout(() => {
        // Phase 4: Show probe
        setGameState('probe');
        setProbeStartTime(Date.now());
        responseAllowedRef.current = true;

        // Response timeout
        timerRef.current = setTimeout(() => {
          if (responseAllowedRef.current) {
            responseAllowedRef.current = false;
            recordResponse(trial, null, true);
          }
        }, activeSettings.responseWindow);
      }, trial.maintenanceDuration);
      return;
    }

    setGameState('encoding');
    setLetterIndex(idx);
    setCurrentLetter(trial.sequence[idx]);
    setShowLetter(true);

    // Show letter for letterDuration, then blank for ISI
    timerRef.current = setTimeout(() => {
      setShowLetter(false);
      timerRef.current = setTimeout(() => {
        presentLetter(trial, idx + 1, activeSettings);
      }, activeSettings.letterISI);
    }, activeSettings.letterDuration);
  }, []);

  // Record response and advance
  const recordResponse = useCallback((trial, responseKey, timedOut) => {
    const rt = timedOut ? null : Date.now() - probeStartTime;
    const respondedInSet = responseKey === KEY_IN_SET;
    const correct = timedOut ? false : (respondedInSet === trial.probeInSet);

    const result = {
      trialNumber: trial.trialNumber,
      ignoreCount: trial.ignoreCount,
      memorizeCount: trial.memorizeCount,
      setSize: trial.memorizeCount,
      memorizeLetters: trial.memorizeLetters,
      ignoreLetters: trial.ignoreLetters,
      probeLetter: trial.probeLetter,
      probeInSet: trial.probeInSet,
      response: timedOut ? 'timeout' : (respondedInSet ? 'in' : 'out'),
      correct,
      reactionTime: rt,
      maintenanceDuration: trial.maintenanceDuration,
    };

    if (isPractice) {
      setPracticeResults(prev => [...prev, result]);
    } else {
      setTrialResults(prev => [...prev, result]);
    }

    // Show feedback during practice
    const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
    if (activeSettings.showFeedback && isPractice) {
      if (timedOut) {
        setFeedbackText(translate('feedback_timeout'));
      } else if (correct) {
        setFeedbackText(translate('feedback_correct'));
      } else {
        setFeedbackText(translate('feedback_incorrect'));
      }
      setGameState('feedback');
      timerRef.current = setTimeout(() => advanceToNextTrial(), 1200);
    } else {
      advanceToNextTrial();
    }
  }, [probeStartTime, isPractice, settings, translate]);

  // Advance to next trial or finish
  const advanceToNextTrial = useCallback(() => {
    setTrialIndex(prev => {
      const next = prev + 1;
      return next;
    });
  }, []);

  // Effect: when trialIndex changes, run the next trial or finish
  useEffect(() => {
    if (gameState !== 'fixation' && gameState !== 'encoding' && gameState !== 'maintenance' &&
        gameState !== 'probe' && gameState !== 'feedback' &&
        gameState !== 'fixation') return;

    // This only fires on subsequent trials (trialIndex > 0)
    // First trial is kicked off by startPractice/startTest
  }, [trialIndex]);

  // Watch trialIndex to run next trial
  const trialIndexRef = useRef(0);
  useEffect(() => {
    trialIndexRef.current = trialIndex;
  }, [trialIndex]);

  useEffect(() => {
    if (trialIndex === 0) return; // First trial is started manually

    if (trialIndex >= trialList.length) {
      if (isPractice) {
        finishPractice();
      } else {
        finishTest();
      }
      return;
    }

    const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
    runTrial(trialList[trialIndex], activeSettings);
  }, [trialIndex, trialList, isPractice, settings, runTrial]);

  // Start practice
  const startPractice = async () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPractice(true);
    await requestFullscreen();
    const trials = generateTrialList(PRACTICE_SETTINGS);
    setTrialList(trials);
    setTrialIndex(0);
    setPracticeResults([]);
    setGameState('countdown');

    startCountdown(() => {
      runTrial(trials[0], PRACTICE_SETTINGS);
    });
  };

  // Start real test
  const startTest = async () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPractice(false);
    await requestFullscreen();
    const trials = generateTrialList(settings);
    setTrialList(trials);
    setTrialIndex(0);
    setTrialResults([]);
    setGameState('countdown');

    startCountdown(() => {
      runTrial(trials[0], settings);
    });
  };

  // Finish practice
  const finishPractice = () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    responseAllowedRef.current = false;
    if (isFullscreen) exitFullscreen();
    setGameState('practiceComplete');
  };

  // Finish test
  const finishTest = () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    responseAllowedRef.current = false;
    if (isFullscreen) exitFullscreen();

    setGameState('results');

    if (!isStandalone && onComplete) {
      onComplete(trialResults);
    }
  };

  // Stop test early
  const stopTest = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearAllTimers();
    responseAllowedRef.current = false;
    if (isPractice) finishPractice();
    else finishTest();
  };

  // Reset
  const resetTest = () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    responseAllowedRef.current = false;
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrialResults([]);
    setPracticeResults([]);
    setTrialList([]);
    setTrialIndex(0);
    setIsPractice(false);
  };

  // Handle keyboard response during probe phase
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      if ((key === KEY_IN_SET || key === KEY_NOT_IN_SET) && responseAllowedRef.current && gameState === 'probe') {
        e.preventDefault();
        responseAllowedRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        recordResponse(currentTrial, key, false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, currentTrial, recordResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clearAllTimers]);

  // Practice stats
  const calculatePracticeStats = () => {
    const total = practiceResults.length;
    const correctTrials = practiceResults.filter(r => r.correct);
    const accuracy = total > 0 ? ((correctTrials.length / total) * 100).toFixed(0) : 0;
    const validRTs = practiceResults.filter(r => r.reactionTime !== null).map(r => r.reactionTime);
    const meanRT = validRTs.length > 0
      ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length)
      : 0;
    const timeouts = practiceResults.filter(r => r.response === 'timeout').length;

    return { total, correct: correctTrials.length, accuracy, meanRT, timeouts };
  };

  const isPlaying = ['fixation', 'encoding', 'maintenance', 'probe', 'feedback'].includes(gameState);

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {isPlaying && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_progress')}: <span className={styles.metricValue}>{(trialIndex + 1)} / {trialList.length}</span>
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
                {demoStep >= 6 && <p>{translate('demo_step7')}</p>}
              </div>

              <div className={styles.demoContainer}>
                <div className={styles.demoLetterDisplay}>
                  {demoStep === 0 && (
                    <span className={styles.fixationCross}>+</span>
                  )}
                  {demoStep === 1 && (
                    <span className={styles.demoLetter} style={{ color: '#000' }}>B</span>
                  )}
                  {demoStep === 2 && (
                    <span className={styles.demoLetter} style={{ color: '#4caf50' }}>G</span>
                  )}
                  {demoStep === 3 && (
                    <span className={styles.maintenanceDash}>&mdash;</span>
                  )}
                  {demoStep === 4 && (
                    <span className={styles.demoLetter} style={{ color: '#f44336' }}>B</span>
                  )}
                  {demoStep === 5 && (
                    <div className={styles.demoFeedback}>
                      <span className={styles.demoLetter} style={{ color: '#4caf50' }}>F = {translate('key_in_set')}</span>
                    </div>
                  )}
                  {demoStep >= 6 && (
                    <span className={styles.demoReady}>&#10003;</span>
                  )}
                </div>
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

          {/* Practice Complete screen */}
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
                        <span className={styles.statValue}>{stats.accuracy}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_correct')}:</span>
                        <span className={styles.statValue}>{stats.correct} / {stats.total}</span>
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

          {/* Playing area */}
          {isPlaying && (
            <div className={styles.stimulusContainer} aria-label="STB Stimulus Area">
              <div className={styles.letterDisplay}>
                {/* Fixation cross */}
                {gameState === 'fixation' && (
                  <span className={styles.fixationCross}>+</span>
                )}

                {/* Letter encoding */}
                {gameState === 'encoding' && showLetter && currentLetter && (
                  <span
                    className={styles.letter}
                    style={{
                      color: currentLetter.type === 'ignore' ? '#4caf50' : 'var(--text-primary, #000)',
                    }}
                  >
                    {currentLetter.letter}
                  </span>
                )}

                {/* Blank between letters */}
                {gameState === 'encoding' && !showLetter && (
                  <span className={styles.blankSpace}>&nbsp;</span>
                )}

                {/* Maintenance period */}
                {gameState === 'maintenance' && (
                  <span className={styles.maintenanceDash}>&mdash;</span>
                )}

                {/* Probe letter */}
                {gameState === 'probe' && currentTrial && (
                  <span className={styles.letter} style={{ color: '#f44336' }}>
                    {currentTrial.probeLetter}
                  </span>
                )}

                {/* Feedback */}
                {gameState === 'feedback' && (
                  <span className={styles.feedbackMessage}>{feedbackText}</span>
                )}
              </div>

              {/* Response key hints */}
              {gameState === 'probe' && (
                <div className={styles.responseHints}>
                  <div className={styles.responseKey}>
                    <kbd>F</kbd> = {translate('key_in_set')}
                  </div>
                  <div className={styles.responseKey}>
                    <kbd>J</kbd> = {translate('key_not_in_set')}
                  </div>
                </div>
              )}

              {/* Phase indicator */}
              <div className={styles.bottomInstructions}>
                {gameState === 'fixation' && <p>{translate('phase_fixation')}</p>}
                {gameState === 'encoding' && <p>{translate('phase_encoding', { current: letterIndex + 1, total: currentTrial?.sequence?.length || 0 })}</p>}
                {gameState === 'maintenance' && <p>{translate('phase_maintenance')}</p>}
                {gameState === 'probe' && <p>{translate('phase_probe')}</p>}
              </div>
            </div>
          )}

          {/* Results screen */}
          {gameState === 'results' && (
            <StbResults
              trials={trialResults}
              onRestart={resetTest}
              t={translate}
            />
          )}

          {/* Message overlay */}
          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {/* Settings panel */}
        {showSettings && (
          <StbSettings
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

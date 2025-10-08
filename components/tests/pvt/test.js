// components/tests/pvt/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/PVT.module.css';
import PVTResults from '../../results/pvt';
import PVTSettings from '../../settings/pvt';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, RESPONSE_KEY, THEME_COLOR } from './data';
import { useFullscreen } from '../../../hooks/useFullscreen';

export default function PVTTest({ assignmentId, onComplete, isStandalone, t }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // welcome, tutorial, demo, practice, practiceComplete, countdown, waiting, stimulus, falseStart, results
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [practiceFalseStarts, setPracticeFalseStarts] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [stimulusShown, setStimulusShown] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [demoStep, setDemoStep] = useState(0);
  const [isPractice, setIsPractice] = useState(false);

  // Translation function with fallback
  const translate = t || ((key, params) => {
    if (params && key.includes('{{')) {
      let result = key;
      Object.keys(params).forEach(param => {
        result = result.replace(`{{${param}}}`, params[param]);
      });
      return result;
    }
    return key;
  });

  // Fullscreen functionality
  const gameArea = useRef(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

  // Refs for timers and state tracking
  const intervalRef = useRef(null);
  const testTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const stimulusRef = useRef(null);
  const testTimeRemainingRef = useRef(0); // Track current time without closure issues

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'demo') {
      if (demoStep === 0) {
        setStimulusShown(false);
        const timer = setTimeout(() => setDemoStep(1), 2500);
        return () => clearTimeout(timer);
      } else if (demoStep === 1) {
        const timer = setTimeout(() => setDemoStep(2), 2500);
        return () => clearTimeout(timer);
      } else if (demoStep === 2) {
        // Show red stimulus
        setStimulusShown(true);
        const timer = setTimeout(() => setDemoStep(3), 2000);
        return () => clearTimeout(timer);
      } else if (demoStep === 3) {
        // Hide stimulus, show feedback
        setStimulusShown(false);
        const timer = setTimeout(() => setDemoStep(4), 2000);
        return () => clearTimeout(timer);
      } else if (demoStep === 4) {
        const timer = setTimeout(() => setDemoStep(5), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, demoStep]);

  // Keep ref in sync with state for non-stale closure access
  useEffect(() => {
    testTimeRemainingRef.current = testTimeRemaining;
  }, [testTimeRemaining]);

  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((text, duration = 1500) => {
    setMessage(text);
    setShowMessage(true);

    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  }, []);

  // Clear all timers utility
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (testTimerRef.current) {
      clearInterval(testTimerRef.current);
      testTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  // Schedule a stimulus to appear after a random interval
  const scheduleNextStimulus = useCallback(() => {
    const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;

    // Clear any existing timers
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    // Check if test is still running (use ref to avoid stale closure)
    if (testTimeRemainingRef.current <= 0) {
      return;
    }

    // Generate random interval between min and max
    const randomInterval =
      Math.floor(Math.random() * (activeSettings.maxInterval - activeSettings.minInterval)) +
      activeSettings.minInterval;

    // Set the game state to waiting (for stimulus)
    setGameState('waiting');
    setStimulusShown(false);

    // Create new trial object
    const trialList = isPractice ? practiceTrials : trials;
    const newTrial = {
      trialNumber: trialList.length + 1,
      intervalTime: randomInterval,
      startTime: Date.now(),
      reactionTime: null,
      falseStart: false
    };

    setCurrentTrial(newTrial);

    // Schedule the stimulus to appear
    intervalRef.current = setTimeout(() => {
      intervalRef.current = null;

      // Check again if test is still running (use ref to avoid stale closure)
      if (testTimeRemainingRef.current <= 0) {
        return;
      }

      // Show stimulus and record start time
      setGameState('stimulus');
      setStimulusShown(true);
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0);

      // Start elapsed time counter for RT feedback
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }

      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - now);
      }, 10);
    }, randomInterval);
  }, [settings, trials, practiceTrials, isPractice]);

  // Start practice
  const startPractice = async () => {
    // Clear any existing timers first to prevent multiple intervals
    clearAllTimers();

    setIsPractice(true);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    setPracticeTrials([]);
    setPracticeFalseStarts(0);
    setTestTimeRemaining(PRACTICE_SETTINGS.testDuration);
    setCountdown(settings.countdownTimer);
    setGameState('countdown');

    // Countdown then start practice
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setGameState('waiting');
            const now = Date.now();
            setTestStartTime(now);

            showOverlayMessage(translate('feedback_wait'), 1500);

            // Start test timer
            testTimerRef.current = setInterval(() => {
              setTestTimeRemaining(prev => {
                const remaining = Math.max(0, prev - 1);
                if (remaining <= 0) {
                  clearInterval(testTimerRef.current);
                  finishPractice();
                }
                return remaining;
              });
            }, 1000);

            // Schedule first stimulus after message
            setTimeout(() => {
              scheduleNextStimulus();
            }, 1500);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start real test
  const startTest = async () => {
    // Clear any existing timers first to prevent multiple intervals
    clearAllTimers();

    setIsPractice(false);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    setTrials([]);
    setFalseStarts(0);
    setTestTimeRemaining(settings.testDuration);
    setCountdown(settings.countdownTimer);
    setGameState('countdown');

    // Countdown then start test
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setGameState('waiting');
            const now = Date.now();
            setTestStartTime(now);

            showOverlayMessage(translate('feedback_wait'), 1500);

            // Start test timer
            testTimerRef.current = setInterval(() => {
              setTestTimeRemaining(prev => {
                const remaining = Math.max(0, prev - 1);
                if (remaining <= 0) {
                  clearInterval(testTimerRef.current);
                  finishTest();
                }
                return remaining;
              });
            }, 1000);

            // Schedule first stimulus after message
            setTimeout(() => {
              scheduleNextStimulus();
            }, 1500);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Finish practice
  const finishPractice = () => {
    clearAllTimers();
    if (isFullscreen) {
      exitFullscreen();
    }
    setGameState('practiceComplete');
  };

  // Finish test
  const finishTest = () => {
    clearAllTimers();
    if (isFullscreen) {
      exitFullscreen();
    }
    showOverlayMessage(translate('feedback_test_complete'), 1500);

    setTimeout(() => {
      setGameState('results');

      // Submit results if not standalone
      if (!isStandalone && onComplete) {
        onComplete(trials);
      }
    }, 1500);
  };

  // Stop test early
  const stopTest = () => {
    if (gameState !== 'welcome' && gameState !== 'results') {
      clearAllTimers();
      showOverlayMessage(translate('feedback_test_complete'), 1000);
      setTimeout(() => {
        if (isPractice) {
          finishPractice();
        } else {
          finishTest();
        }
      }, 1000);
    }
  };

  // Reset test
  const resetTest = () => {
    clearAllTimers();
    if (isFullscreen) {
      exitFullscreen();
    }
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setFalseStarts(0);
    setPracticeFalseStarts(0);
    setIsPractice(false);
  };

  // Handle user response to stimulus
  const handleResponse = useCallback(() => {
    // Stop the elapsed time timer
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    // Only process response if stimulus is showing
    if (gameState === 'stimulus' && stimulusShown) {
      // Calculate reaction time
      const endTime = Date.now();
      const reactionTime = endTime - startTime;

      // Update current trial with reaction time
      const completedTrial = {
        ...currentTrial,
        reactionTime,
        endTime
      };

      // Add to trials array
      if (isPractice) {
        setPracticeTrials(prevTrials => [...prevTrials, completedTrial]);
      } else {
        setTrials(prevTrials => [...prevTrials, completedTrial]);
      }

      // Provide feedback
      showOverlayMessage(translate('feedback_reaction_time', { rt: reactionTime }), 800);

      // Reset and schedule next stimulus
      setStimulusShown(false);

      // Ensure next stimulus is scheduled
      setTimeout(() => {
        if (!intervalRef.current && testTimeRemainingRef.current > 0) {
          scheduleNextStimulus();
        }
      }, 800);

    } else if (gameState === 'waiting') {
      // Record false start
      if (isPractice) {
        setPracticeFalseStarts(prev => prev + 1);
      } else {
        setFalseStarts(prev => prev + 1);
      }

      // Add false start to trials
      const falseStartTrial = {
        trialNumber: (isPractice ? practiceTrials.length : trials.length) + 1,
        falseStart: true,
        startTime: Date.now()
      };

      if (isPractice) {
        setPracticeTrials(prevTrials => [...prevTrials, falseStartTrial]);
      } else {
        setTrials(prevTrials => [...prevTrials, falseStartTrial]);
      }

      // Show feedback briefly
      setGameState('falseStart');
      showOverlayMessage(translate('feedback_false_start'), 1000);

      // Clear any existing scheduled stimulus
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }

      // Schedule next stimulus after false start feedback
      setTimeout(() => {
        if (testTimeRemainingRef.current > 0) {
          scheduleNextStimulus();
        }
      }, 1000);
    }
  }, [gameState, scheduleNextStimulus, startTime, stimulusShown, currentTrial, trials.length, practiceTrials.length, showOverlayMessage, isPractice, translate]);

  // Handle key presses for response
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((gameState === 'stimulus' || gameState === 'waiting') &&
        (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState, handleResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Format time as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate practice stats
  const calculatePracticeStats = () => {
    const validTrials = practiceTrials.filter(t => t.reactionTime && !t.falseStart);

    if (validTrials.length === 0) {
      return {
        meanRT: 0,
        medianRT: 0,
        validTrials: 0,
        falseStarts: practiceFalseStarts
      };
    }

    const reactionTimes = validTrials.map(t => t.reactionTime);
    const meanRT = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;

    // Sort for median
    const sortedRTs = [...reactionTimes].sort((a, b) => a - b);
    const medianRT = sortedRTs[Math.floor(sortedRTs.length / 2)];

    return {
      meanRT,
      medianRT,
      validTrials: validTrials.length,
      falseStarts: practiceFalseStarts
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <Link href="/" passHref>
            <div className={styles.logoLink}>
              <Image
                src="/logo.png"
                alt={'psykasten Logo'}
                width={50}
                height={50}
              />
            </div>
          </Link>

          {(gameState === 'waiting' || gameState === 'stimulus' || gameState === 'falseStart') && (
            <div className={styles.gameMetrics}>
              <div className={styles.timeIndicator}>
                {translate('time_remaining')}: <span className={styles.metricValue}>{formatTime(testTimeRemaining)}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('trials_completed')}: <span className={styles.metricValue}>{isPractice ? practiceTrials.length : trials.length}</span>
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
        </div>

        <div className={styles.gameArea} ref={gameArea}>
          {/* Welcome screen */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('welcome_title')}</h2>
              <p>{translate('welcome_p1')}</p>
              <p>{translate('welcome_p2')}</p>
              <p>{translate('welcome_p3', { duration: settings.testDuration / 60 })}</p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('start_button')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setShowSettings(true)}
                >
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
                <button
                  className={styles.tertiaryButton}
                  onClick={() => setGameState('welcome')}
                >
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

              {/* Demo stimulus display */}
              <div className={styles.demoContainer}>
                <div
                  className={`${styles.stimulus} ${styles.demoStimulus}`}
                  style={{
                    backgroundColor: stimulusShown ? settings.stimulusColor : settings.backgroundColor
                  }}
                >
                  {!stimulusShown && <p className={styles.instructions}>{translate('waiting_instruction')}</p>}
                  {stimulusShown && <p className={styles.instructions}>{translate('stimulus_instruction')}</p>}
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
                <button
                  className={styles.secondaryButton}
                  onClick={() => setGameState('tutorial')}
                >
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
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_median_rt')}:</span>
                        <span className={styles.statValue}>{stats.medianRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_valid_trials')}:</span>
                        <span className={styles.statValue}>{stats.validTrials}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_false_starts')}:</span>
                        <span className={styles.statValue}>{stats.falseStarts}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
                  {translate('start_real_test')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={startPractice}
                >
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {/* Countdown */}
          {gameState === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownContent}>
                <h2>{translate('get_ready')}</h2>
                <div className={styles.countdownNumber}>{countdown > 0 ? countdown : 'GO!'}</div>
                <p>{translate('countdown_instruction')}</p>
              </div>
            </div>
          )}

          {/* Test area (stimulus display) */}
          {(gameState === 'waiting' || gameState === 'stimulus' || gameState === 'falseStart') && (
            <div
              className={styles.stimulusContainer}
              aria-label="PVT Stimulus Area"
            >
              <div
                className={styles.stimulus}
                ref={stimulusRef}
                onClick={handleResponse}
                style={{
                  backgroundColor: gameState === 'stimulus' ? settings.stimulusColor :
                    gameState === 'falseStart' ? '#ffcc00' : settings.backgroundColor
                }}
                role="button"
                tabIndex={0}
              >
                {gameState === 'waiting' && (
                  <p className={styles.instructions}>{translate('waiting_instruction')}</p>
                )}
                {gameState === 'stimulus' && (
                  <p className={styles.instructions}>{translate('stimulus_instruction')}</p>
                )}
                {gameState === 'falseStart' && (
                  <p className={styles.instructions}>{translate('false_start_instruction')}</p>
                )}

                {gameState === 'stimulus' && (
                  <div className={styles.elapsedTime}>
                    {elapsedTime}ms
                  </div>
                )}
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('bottom_instruction')}</p>
              </div>
            </div>
          )}

          {/* Results screen */}
          {gameState === 'results' && (
            <PVTResults
              trials={trials}
              falseStarts={falseStarts}
              onRestart={resetTest}
              t={translate}
            />
          )}

          {/* Message overlay */}
          {showMessage && (
            <div className={styles.messageOverlay}>
              <div className={styles.message}>{message}</div>
            </div>
          )}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <PVTSettings
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
            t={translate}
          />
        )}

        <footer className={styles.footer}>
          <p>{translate('footer_description')}</p>
        </footer>
      </div>
    </div>
  );
}

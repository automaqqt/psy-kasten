// components/tests/prlt/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/PrltTest.module.css';
import PrltResults from '../../results/prlt';
import PrltSettings from '../../settings/prlt';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, OPTION_COLORS, OPTION_LABELS, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

export default function PrltTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, feedback, results
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // PRLT-specific state
  const [highProbSide, setHighProbSide] = useState('left'); // which side is currently "good"
  const [reversalsCompleted, setReversalsCompleted] = useState(0);
  const [trialNumber, setTrialNumber] = useState(0);
  const [canRespond, setCanRespond] = useState(false);
  const [feedbackInfo, setFeedbackInfo] = useState(null); // { chosenSide, rewarded }
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [demoHighSide, setDemoHighSide] = useState('left');

  // Refs for timer cleanup and avoiding stale closures
  const feedbackTimerRef = useRef(null);
  const itiTimerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const isPracticeRef = useRef(false);
  const trialsRef = useRef([]);
  const practiceTrialsRef = useRef([]);
  const highProbSideRef = useRef('left');
  const reversalsCompletedRef = useRef(0);
  const trialNumberRef = useRef(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  // Keep refs in sync
  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { practiceTrialsRef.current = practiceTrials; }, [practiceTrials]);
  useEffect(() => { highProbSideRef.current = highProbSide; }, [highProbSide]);
  useEffect(() => { reversalsCompletedRef.current = reversalsCompleted; }, [reversalsCompleted]);
  useEffect(() => { trialNumberRef.current = trialNumber; }, [trialNumber]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;
    const timings = [2500, 2500, 2500, 2500, 2500, 2500];
    if (demoStep < timings.length) {
      const timer = setTimeout(() => setDemoStep(prev => prev + 1), timings[demoStep]);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  // Demo visual state
  useEffect(() => {
    if (gameState === 'demo') {
      if (demoStep === 0) {
        setDemoFeedback(null);
        setDemoHighSide('left');
      } else if (demoStep === 1) {
        // Show choosing left (the good one) and getting rewarded
        setDemoFeedback({ chosenSide: 'left', rewarded: true });
      } else if (demoStep === 2) {
        // Show choosing right (the bad one) and not getting rewarded
        setDemoFeedback({ chosenSide: 'right', rewarded: false });
      } else if (demoStep === 3) {
        // Show choosing left again and reward
        setDemoFeedback({ chosenSide: 'left', rewarded: true });
      } else if (demoStep === 4) {
        // Show reversal — now right is good, left fails
        setDemoHighSide('right');
        setDemoFeedback({ chosenSide: 'left', rewarded: false });
      } else if (demoStep === 5) {
        // Participant adapts — chooses right and wins
        setDemoFeedback({ chosenSide: 'right', rewarded: true });
      } else {
        setDemoFeedback(null);
      }
    }
  }, [gameState, demoStep]);

  // Check if reversal criterion is met
  const checkReversal = useCallback((trialList, activeSettings) => {
    const window = activeSettings.reversalWindow;
    const criterion = activeSettings.reversalCriterion;
    if (trialList.length < window) return false;

    const recentTrials = trialList.slice(-window);
    const highProbChoices = recentTrials.filter(t => t.choseHighProb).length;
    return highProbChoices >= criterion;
  }, []);

  // Present next trial
  const presentTrial = useCallback(() => {
    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settingsRef.current;
    const currentTrialNum = trialNumberRef.current;

    if (currentTrialNum >= activeSettings.totalTrials) {
      if (isPracticeRef.current) {
        finishPractice();
      } else {
        finishTest();
      }
      return;
    }

    setFeedbackInfo(null);
    setCanRespond(true);
    setGameState('playing');
    trialStartTimeRef.current = Date.now();

    // Response timeout
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    responseTimerRef.current = setTimeout(() => {
      handleTimeout();
    }, activeSettings.responseWindow);
  }, [settings]);

  // Handle option click
  const handleOptionClick = useCallback((chosenSide) => {
    if (!canRespond) return;
    setCanRespond(false);

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settingsRef.current;
    const rt = Date.now() - trialStartTimeRef.current;
    const currentHighSide = highProbSideRef.current;
    const choseHighProb = chosenSide === currentHighSide;

    // Determine reward probabilistically
    const prob = choseHighProb ? activeSettings.highProbability : activeSettings.lowProbability;
    const rewarded = Math.random() < prob;

    // Get previous trial for win-stay / lose-shift calculation
    const trialList = isPracticeRef.current ? practiceTrialsRef.current : trialsRef.current;
    const prevTrial = trialList.length > 0 ? trialList[trialList.length - 1] : null;

    let isWinStay = null;
    let isLoseShift = null;
    if (prevTrial && !prevTrial.tooSlow) {
      if (prevTrial.rewarded) {
        isWinStay = chosenSide === prevTrial.chosenSide;
      } else {
        isLoseShift = chosenSide !== prevTrial.chosenSide;
      }
    }

    const trialResult = {
      trialNumber: trialNumberRef.current + 1,
      highProbSide: currentHighSide,
      chosenSide,
      choseHighProb,
      rewarded,
      reactionTime: rt,
      reversalNumber: reversalsCompletedRef.current,
      isWinStay,
      isLoseShift,
      tooSlow: false,
    };

    // Store trial
    const newTrialList = [...trialList, trialResult];
    if (isPracticeRef.current) {
      setPracticeTrials(newTrialList);
    } else {
      setTrials(newTrialList);
    }

    const newTrialNumber = trialNumberRef.current + 1;
    setTrialNumber(newTrialNumber);

    // Show feedback
    setFeedbackInfo({ chosenSide, rewarded });
    setGameState('feedback');

    // Check for reversal after updating trials
    if (checkReversal(newTrialList, activeSettings)) {
      const newSide = currentHighSide === 'left' ? 'right' : 'left';
      setHighProbSide(newSide);
      setReversalsCompleted(prev => prev + 1);
    }

    // After feedback, ITI, then next trial
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackInfo(null);

      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      itiTimerRef.current = setTimeout(() => {
        presentTrial();
      }, activeSettings.itiDuration);
    }, activeSettings.feedbackDuration);
  }, [canRespond, settings, checkReversal, presentTrial]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (!canRespond) return;
    setCanRespond(false);

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settingsRef.current;
    const trialList = isPracticeRef.current ? practiceTrialsRef.current : trialsRef.current;

    const trialResult = {
      trialNumber: trialNumberRef.current + 1,
      highProbSide: highProbSideRef.current,
      chosenSide: null,
      choseHighProb: false,
      rewarded: false,
      reactionTime: activeSettings.responseWindow,
      reversalNumber: reversalsCompletedRef.current,
      isWinStay: null,
      isLoseShift: null,
      tooSlow: true,
    };

    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, trialResult]);
    } else {
      setTrials(prev => [...prev, trialResult]);
    }

    setTrialNumber(trialNumberRef.current + 1);
    setFeedbackInfo({ chosenSide: null, rewarded: false });
    setGameState('feedback');

    showOverlayMessage('feedback_too_slow', 800);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackInfo(null);

      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      itiTimerRef.current = setTimeout(() => {
        presentTrial();
      }, activeSettings.itiDuration);
    }, activeSettings.feedbackDuration);
  }, [canRespond, settings, presentTrial, showOverlayMessage]);

  // Start practice
  const startPractice = async () => {
    clearAllTimers();
    setIsPractice(true);
    await requestFullscreen();
    setPracticeTrials([]);
    setTrialNumber(0);
    setReversalsCompleted(0);
    setHighProbSide(Math.random() < 0.5 ? 'left' : 'right');
    setFeedbackInfo(null);
    setCanRespond(false);
    setGameState('countdown');

    startCountdown(() => {
      setGameState('playing');
      setTimeout(() => presentTrial(), 500);
    });
  };

  // Start real test
  const startTest = async () => {
    clearAllTimers();
    setIsPractice(false);
    await requestFullscreen();
    setTrials([]);
    setTrialNumber(0);
    setReversalsCompleted(0);
    setHighProbSide(Math.random() < 0.5 ? 'left' : 'right');
    setFeedbackInfo(null);
    setCanRespond(false);
    setGameState('countdown');

    startCountdown(() => {
      setGameState('playing');
      setTimeout(() => presentTrial(), 500);
    });
  };

  // Finish practice
  const finishPractice = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);
    setGameState('practiceComplete');
  };

  // Finish test
  const finishTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);

    setTimeout(() => {
      setGameState('results');

      if (!isStandalone && onComplete) {
        const finalTrials = trialsRef.current;
        const validTrials = finalTrials.filter(t => !t.tooSlow);
        const correctChoices = validTrials.filter(t => t.choseHighProb).length;
        const accuracy = validTrials.length > 0 ? correctChoices / validTrials.length : 0;

        const wsTrials = finalTrials.filter(t => t.isWinStay !== null);
        const winStayRate = wsTrials.length > 0
          ? wsTrials.filter(t => t.isWinStay).length / wsTrials.length : 0;

        const lsTrials = finalTrials.filter(t => t.isLoseShift !== null);
        const loseShiftRate = lsTrials.length > 0
          ? lsTrials.filter(t => t.isLoseShift).length / lsTrials.length : 0;

        onComplete({
          trials: finalTrials,
          totalTrials: finalTrials.length,
          reversalsCompleted: reversalsCompletedRef.current,
          accuracy,
          winStayRate,
          loseShiftRate,
          settingsUsed: settings,
        });
      }
    }, 500);
  };

  // Stop test early
  const stopTest = () => {
    if (gameState === 'playing' || gameState === 'feedback') {
      if (isPractice) finishPractice();
      else finishTest();
    }
  };

  // Reset
  const resetTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setFeedbackInfo(null);
    setCanRespond(false);
    setIsPractice(false);
    setTrialNumber(0);
    setReversalsCompleted(0);
    setHighProbSide('left');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    };
  }, [clearAllTimers]);

  // Practice stats
  const calculatePracticeStats = () => {
    const validTrials = practiceTrials.filter(t => !t.tooSlow);
    const total = practiceTrials.length;
    const correctChoices = validTrials.filter(t => t.choseHighProb).length;
    const accuracy = validTrials.length > 0 ? ((correctChoices / validTrials.length) * 100) : 0;
    const validRTs = validTrials.map(t => t.reactionTime);
    const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;
    const timeouts = practiceTrials.filter(t => t.tooSlow).length;

    return { total, accuracy, meanRT, reversalsCompleted, timeouts };
  };

  // Render an option card
  const renderOption = (side, clickable, feedback) => {
    const colorIdx = side === 'left' ? 0 : 1;
    const isChosen = feedback && feedback.chosenSide === side;
    const showReward = isChosen && feedback.rewarded;
    const showNoReward = isChosen && !feedback.rewarded;

    return (
      <div
        className={`${styles.optionCard} ${clickable ? styles.optionClickable : ''} ${isChosen ? (showReward ? styles.optionReward : styles.optionNoReward) : ''}`}
        onClick={() => clickable && handleOptionClick(side)}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : -1}
        onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleOptionClick(side); } }}
        aria-label={`${translate('option')} ${OPTION_LABELS[colorIdx]}`}
      >
        <div className={styles.optionIcon} style={{ backgroundColor: OPTION_COLORS[colorIdx] }}>
          {OPTION_LABELS[colorIdx]}
        </div>
        {isChosen && (
          <div className={styles.feedbackBadge}>
            {showReward ? (
              <span className={styles.rewardIcon}>+</span>
            ) : (
              <span className={styles.noRewardIcon}>&minus;</span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render demo option card (non-interactive)
  const renderDemoOption = (side) => {
    const colorIdx = side === 'left' ? 0 : 1;
    const fb = demoFeedback;
    const isChosen = fb && fb.chosenSide === side;
    const showReward = isChosen && fb.rewarded;
    const showNoReward = isChosen && !fb.rewarded;

    return (
      <div className={`${styles.optionCard} ${isChosen ? (showReward ? styles.optionReward : styles.optionNoReward) : ''}`}>
        <div className={styles.optionIcon} style={{ backgroundColor: OPTION_COLORS[colorIdx] }}>
          {OPTION_LABELS[colorIdx]}
        </div>
        {isChosen && (
          <div className={styles.feedbackBadge}>
            {showReward ? (
              <span className={styles.rewardIcon}>+</span>
            ) : (
              <span className={styles.noRewardIcon}>&minus;</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_counter', {
                  current: trialNumber,
                  max: activeSettings.totalTrials
                })}
              </div>
              <div className={styles.trialIndicator}>
                {translate('reversals_label')}: <span className={styles.metricValue}>{reversalsCompleted}</span>
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
                {demoStep >= 6 && <p>{translate('demo_step7')}</p>}
              </div>

              <div className={styles.demoContainer}>
                <div className={styles.optionRow}>
                  {renderDemoOption('left')}
                  {renderDemoOption('right')}
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
                        <span>{translate('practice_total_trials')}:</span>
                        <span className={styles.statValue}>{stats.total}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{stats.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT.toFixed(0)} ms</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_reversals')}:</span>
                        <span className={styles.statValue}>{stats.reversalsCompleted}</span>
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

          {/* Playing / Feedback area */}
          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className={styles.playingArea}>
              <div className={styles.promptText}>
                {gameState === 'playing' && translate('choose_prompt')}
                {gameState === 'feedback' && feedbackInfo && !feedbackInfo.tooSlow && (
                  feedbackInfo.rewarded ? translate('feedback_reward') : translate('feedback_no_reward')
                )}
              </div>

              <div className={styles.optionRow}>
                {renderOption('left', canRespond, feedbackInfo)}
                {renderOption('right', canRespond, feedbackInfo)}
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('bottom_instruction')}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <PrltResults
              trials={trials}
              reversalsCompleted={reversalsCompleted}
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
          <PrltSettings
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

// components/tests/wcst/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/WcstTest.module.css';
import WcstResults from '../../results/wcst';
import WcstSettings from '../../settings/wcst';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR, REFERENCE_CARDS, RULES, SHAPES, COLORS, COLOR_NAMES, COUNTS } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// Generate a random stimulus card
function generateStimulusCard() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const colorIdx = Math.floor(Math.random() * COLORS.length);
  const count = COUNTS[Math.floor(Math.random() * COUNTS.length)];
  return { shape, color: COLORS[colorIdx], colorName: COLOR_NAMES[colorIdx], count };
}

// Determine which reference card matches the stimulus for a given rule
function getCorrectCardIndex(stimulus, rule) {
  for (let i = 0; i < REFERENCE_CARDS.length; i++) {
    const ref = REFERENCE_CARDS[i];
    if (rule === 'color' && ref.colorName === stimulus.colorName) return i;
    if (rule === 'shape' && ref.shape === stimulus.shape) return i;
    if (rule === 'number' && ref.count === stimulus.count) return i;
  }
  return 0;
}

// Render shapes inside a card
function CardShapes({ shape, color, count, size = 32 }) {
  const shapeClass = shape === 'circle' ? styles.shapeCircle
    : shape === 'star' ? styles.shapeStar
    : shape === 'cross' ? styles.shapeCross
    : styles.shapeTriangle;

  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${styles.shape} ${shapeClass}`}
      style={{ width: size, height: size, backgroundColor: color }}
    />
  ));
}

export default function WcstTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // WCST-specific state
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [categoriesCompleted, setCategoriesCompleted] = useState(0);
  const [trialNumber, setTrialNumber] = useState(0);
  const [feedback, setFeedback] = useState(null); // { correct: bool, cardIndex: int }
  const [canRespond, setCanRespond] = useState(false);
  const [previousRule, setPreviousRule] = useState(null);

  // Refs
  const trialStartTimeRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const currentRuleRef = useRef(0);
  const consecutiveCorrectRef = useRef(0);
  const categoriesCompletedRef = useRef(0);
  const trialNumberRef = useRef(0);
  const previousRuleRef = useRef(null);
  const isPracticeRef = useRef(false);
  const trialsRef = useRef([]);
  const practiceTrialsRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { currentRuleRef.current = currentRuleIndex; }, [currentRuleIndex]);
  useEffect(() => { consecutiveCorrectRef.current = consecutiveCorrect; }, [consecutiveCorrect]);
  useEffect(() => { categoriesCompletedRef.current = categoriesCompleted; }, [categoriesCompleted]);
  useEffect(() => { trialNumberRef.current = trialNumber; }, [trialNumber]);
  useEffect(() => { previousRuleRef.current = previousRule; }, [previousRule]);
  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { practiceTrialsRef.current = practiceTrials; }, [practiceTrials]);

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;
    const timings = [2500, 2000, 2500, 2000, 2500, 2500];
    if (demoStep < timings.length) {
      const timer = setTimeout(() => setDemoStep(prev => prev + 1), timings[demoStep]);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  // Set demo stimulus based on step
  useEffect(() => {
    if (gameState === 'demo') {
      if (demoStep === 0 || demoStep === 2) {
        setCurrentStimulus({ shape: 'triangle', color: '#1e88e5', colorName: 'blue', count: 3 });
        setFeedback(null);
      } else if (demoStep === 1) {
        setFeedback({ correct: true, cardIndex: 3 }); // blue = card 4
      } else if (demoStep === 3) {
        setFeedback({ correct: false, cardIndex: 1 }); // wrong choice
      } else if (demoStep === 4) {
        setCurrentStimulus({ shape: 'star', color: '#e53935', colorName: 'red', count: 2 });
        setFeedback(null);
      } else if (demoStep === 5) {
        setFeedback({ correct: true, cardIndex: 0 }); // red = card 1
      } else {
        setCurrentStimulus(null);
        setFeedback(null);
      }
    }
  }, [gameState, demoStep]);

  // Present next trial
  const presentTrial = useCallback(() => {
    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;

    // Check end conditions
    if (categoriesCompletedRef.current >= activeSettings.totalCategories ||
        trialNumberRef.current >= activeSettings.maxTrials) {
      if (isPracticeRef.current) {
        finishPractice();
      } else {
        finishTest();
      }
      return;
    }

    const stimulus = generateStimulusCard();
    setCurrentStimulus(stimulus);
    setFeedback(null);
    setCanRespond(true);
    trialStartTimeRef.current = Date.now();

    // Response timeout
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    responseTimerRef.current = setTimeout(() => {
      handleTimeout();
    }, activeSettings.responseWindow);
  }, [settings]);

  // Handle card click
  const handleCardClick = useCallback((cardIndex) => {
    if (!canRespond || !currentStimulus) return;
    setCanRespond(false);

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    const rt = Date.now() - trialStartTimeRef.current;
    const currentRule = RULES[currentRuleRef.current];
    const correctIndex = getCorrectCardIndex(currentStimulus, currentRule);
    const isCorrect = cardIndex === correctIndex;

    // Determine perseveration
    let isPerseveration = false;
    if (!isCorrect && previousRuleRef.current !== null) {
      const prevCorrectIndex = getCorrectCardIndex(currentStimulus, previousRuleRef.current);
      isPerseveration = cardIndex === prevCorrectIndex;
    }

    const trialResult = {
      trialNumber: trialNumberRef.current + 1,
      rule: currentRule,
      ruleIndex: currentRuleRef.current,
      stimulus: { ...currentStimulus },
      selectedCard: cardIndex,
      correctCard: correctIndex,
      correct: isCorrect,
      reactionTime: rt,
      isPerseveration,
      isNonPerseverationError: !isCorrect && !isPerseveration,
      categoryNumber: categoriesCompletedRef.current + 1,
      trialInCategory: consecutiveCorrectRef.current + 1,
      tooSlow: false,
    };

    // Store trial
    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, trialResult]);
    } else {
      setTrials(prev => [...prev, trialResult]);
    }

    // Show feedback
    setFeedback({ correct: isCorrect, cardIndex });

    // Update consecutive correct and check category completion
    const newTrialNumber = trialNumberRef.current + 1;
    setTrialNumber(newTrialNumber);

    if (isCorrect) {
      const newConsecutive = consecutiveCorrectRef.current + 1;
      setConsecutiveCorrect(newConsecutive);

      if (newConsecutive >= activeSettings.trialsPerCategory) {
        // Category completed — switch rule
        const newCategoriesCompleted = categoriesCompletedRef.current + 1;
        setCategoriesCompleted(newCategoriesCompleted);
        setPreviousRule(RULES[currentRuleRef.current]);
        setCurrentRuleIndex((currentRuleRef.current + 1) % RULES.length);
        setConsecutiveCorrect(0);
      }
    } else {
      setConsecutiveCorrect(0);
    }

    // Next trial after feedback
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      presentTrial();
    }, activeSettings.feedbackDuration);
  }, [canRespond, currentStimulus, settings, presentTrial]);

  // Handle timeout (no response)
  const handleTimeout = useCallback(() => {
    if (!canRespond) return;
    setCanRespond(false);

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    const currentRule = RULES[currentRuleRef.current];
    const correctIndex = currentStimulus ? getCorrectCardIndex(currentStimulus, currentRule) : 0;

    const trialResult = {
      trialNumber: trialNumberRef.current + 1,
      rule: currentRule,
      ruleIndex: currentRuleRef.current,
      stimulus: currentStimulus ? { ...currentStimulus } : null,
      selectedCard: null,
      correctCard: correctIndex,
      correct: false,
      reactionTime: activeSettings.responseWindow,
      isPerseveration: false,
      isNonPerseverationError: true,
      categoryNumber: categoriesCompletedRef.current + 1,
      trialInCategory: consecutiveCorrectRef.current + 1,
      tooSlow: true,
    };

    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, trialResult]);
    } else {
      setTrials(prev => [...prev, trialResult]);
    }

    setFeedback({ correct: false, cardIndex: -1 });
    setConsecutiveCorrect(0);
    setTrialNumber(trialNumberRef.current + 1);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      presentTrial();
    }, activeSettings.feedbackDuration);
  }, [canRespond, currentStimulus, settings, presentTrial]);

  // Start practice
  const startPractice = async () => {
    clearAllTimers();
    setIsPractice(true);
    await requestFullscreen();
    setPracticeTrials([]);
    setCurrentRuleIndex(0);
    setConsecutiveCorrect(0);
    setCategoriesCompleted(0);
    setTrialNumber(0);
    setPreviousRule(null);
    setFeedback(null);
    setCurrentStimulus(null);
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
    setCurrentRuleIndex(0);
    setConsecutiveCorrect(0);
    setCategoriesCompleted(0);
    setTrialNumber(0);
    setPreviousRule(null);
    setFeedback(null);
    setCurrentStimulus(null);
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
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);
    setGameState('practiceComplete');
  };

  // Finish test
  const finishTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);

    setTimeout(() => {
      setGameState('results');

      if (!isStandalone && onComplete) {
        const finalTrials = trialsRef.current;
        const totalErrors = finalTrials.filter(t => !t.correct).length;
        const perseverationErrors = finalTrials.filter(t => t.isPerseveration).length;
        const nonPerseverationErrors = finalTrials.filter(t => t.isNonPerseverationError).length;

        onComplete({
          trials: finalTrials,
          totalTrials: finalTrials.length,
          totalErrors,
          perseverationErrors,
          nonPerseverationErrors,
          categoriesCompleted: categoriesCompletedRef.current,
          accuracy: finalTrials.length > 0 ? ((finalTrials.length - totalErrors) / finalTrials.length * 100) : 0,
          settingsUsed: settings,
        });
      }
    }, 500);
  };

  // Stop test early
  const stopTest = () => {
    if (gameState === 'playing') {
      if (isPractice) finishPractice();
      else finishTest();
    }
  };

  // Reset
  const resetTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setCurrentStimulus(null);
    setFeedback(null);
    setCanRespond(false);
    setIsPractice(false);
    setTrialNumber(0);
    setCategoriesCompleted(0);
    setConsecutiveCorrect(0);
    setCurrentRuleIndex(0);
    setPreviousRule(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    };
  }, [clearAllTimers]);

  // Practice stats
  const calculatePracticeStats = () => {
    const total = practiceTrials.length;
    const errors = practiceTrials.filter(t => !t.correct).length;
    const correct = total - errors;
    const perseverations = practiceTrials.filter(t => t.isPerseveration).length;
    const validRTs = practiceTrials.filter(t => t.correct && !t.tooSlow).map(t => t.reactionTime);
    const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;

    return { total, correct, errors, perseverations, meanRT, categoriesCompleted };
  };

  // Card size for shapes
  const getShapeSize = (count) => {
    if (count <= 1) return 40;
    if (count <= 2) return 32;
    return 26;
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {gameState === 'playing' && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_counter', {
                  current: trialNumber,
                  max: isPractice ? PRACTICE_SETTINGS.maxTrials : settings.maxTrials
                })}
              </div>
              <div className={styles.trialIndicator}>
                {translate('categories_completed')}: <span className={styles.metricValue}>{categoriesCompleted}</span>
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
              <p>{translate('welcome_p3')}</p>
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
                {/* Show reference cards in demo */}
                <div className={styles.referenceCards}>
                  {REFERENCE_CARDS.map((card, i) => (
                    <div
                      key={i}
                      className={`${styles.card} ${styles.cardDisabled} ${
                        feedback && feedback.cardIndex === i
                          ? (feedback.correct ? styles.cardCorrect : styles.cardIncorrect)
                          : ''
                      }`}
                    >
                      <CardShapes shape={card.shape} color={card.color} count={card.count} size={getShapeSize(card.count)} />
                    </div>
                  ))}
                </div>
                {currentStimulus && (
                  <div className={styles.stimulusSection}>
                    <div className={styles.stimulusLabel}>{translate('sort_this_card')}</div>
                    <div className={styles.stimulusCard}>
                      <CardShapes shape={currentStimulus.shape} color={currentStimulus.color} count={currentStimulus.count} size={getShapeSize(currentStimulus.count)} />
                    </div>
                  </div>
                )}
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
                        <span>{translate('practice_correct')}:</span>
                        <span className={styles.statValue}>{stats.correct}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_errors')}:</span>
                        <span className={styles.statValue}>{stats.errors}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_perseverations')}:</span>
                        <span className={styles.statValue}>{stats.perseverations}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{stats.meanRT.toFixed(0)} ms</span>
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
          {gameState === 'playing' && (
            <div className={styles.sortingArea}>
              {/* Reference cards */}
              <div>
                <div className={styles.referenceLabel}>{translate('reference_cards_label')}</div>
                <div className={styles.referenceCards}>
                  {REFERENCE_CARDS.map((card, i) => (
                    <div
                      key={i}
                      className={`${styles.card} ${
                        !canRespond ? styles.cardDisabled : ''
                      } ${
                        feedback && feedback.cardIndex === i
                          ? (feedback.correct ? styles.cardCorrect : styles.cardIncorrect)
                          : ''
                      }`}
                      onClick={() => handleCardClick(i)}
                      role="button"
                      tabIndex={canRespond ? 0 : -1}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(i); } }}
                      aria-label={translate('card_label', { shape: card.shape, color: card.colorName, count: card.count })}
                    >
                      <CardShapes shape={card.shape} color={card.color} count={card.count} size={getShapeSize(card.count)} />
                      {feedback && feedback.cardIndex === i && (
                        <div className={`${styles.feedbackOverlay} ${feedback.correct ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
                          <span className={`${styles.feedbackIcon} ${feedback.correct ? styles.feedbackIconCorrect : styles.feedbackIconIncorrect}`}>
                            {feedback.correct ? '\u2713' : '\u2717'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stimulus card */}
              {currentStimulus && (
                <div className={styles.stimulusSection}>
                  <div className={styles.stimulusLabel}>{translate('sort_this_card')}</div>
                  <div className={styles.stimulusCard}>
                    <CardShapes shape={currentStimulus.shape} color={currentStimulus.color} count={currentStimulus.count} size={getShapeSize(currentStimulus.count)} />
                  </div>
                </div>
              )}

              {/* Feedback text */}
              <div className={`${styles.feedbackMessage} ${
                feedback === null ? styles.feedbackMessageEmpty
                  : feedback.correct ? styles.feedbackMessageCorrect
                  : styles.feedbackMessageIncorrect
              }`}>
                {feedback !== null && (
                  feedback.correct ? translate('feedback_correct') : (
                    feedback.cardIndex === -1 ? translate('feedback_too_slow') : translate('feedback_incorrect')
                  )
                )}
                {feedback === null && '\u00A0'}
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('bottom_instruction')}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <WcstResults
              trials={trials}
              categoriesCompleted={categoriesCompleted}
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
          <WcstSettings
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

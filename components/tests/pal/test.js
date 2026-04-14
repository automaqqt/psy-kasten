// components/tests/pal/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/PalTest.module.css';
import PalResults from '../../results/pal';
import PalSettings from '../../settings/pal';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR, PATTERNS, PATTERN_COLORS } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// Number of boxes arranged in a circle
const NUM_BOXES = 8;

// Render a pattern as a small 4x4 grid
function PatternIcon({ patternIndex, size = 60 }) {
  const pattern = PATTERNS[patternIndex];
  const color = PATTERN_COLORS[patternIndex % PATTERN_COLORS.length];
  const cellSize = size / 4;
  return (
    <div style={{ width: size, height: size, display: 'grid', gridTemplateColumns: `repeat(4, ${cellSize}px)`, gridTemplateRows: `repeat(4, ${cellSize}px)`, gap: 0 }}>
      {pattern.flat().map((cell, i) => (
        <div key={i} style={{ width: cellSize, height: cellSize, backgroundColor: cell ? color : 'transparent', borderRadius: 2 }} />
      ))}
    </div>
  );
}

// Pick N unique random indices from [0, max)
function pickRandom(max, n) {
  const indices = Array.from({ length: max }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n);
}

// Shuffle array in place (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PalTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          addTimer, clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown,
  // presenting, recalling, levelComplete, results
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Level / attempt tracking
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  // Pattern placement: which pattern is behind which box
  // placements[i] = patternIndex or null (empty box)
  const [placements, setPlacements] = useState(Array(NUM_BOXES).fill(null));

  // Presentation phase state
  const [presentingBoxIndex, setPresentingBoxIndex] = useState(-1); // which box is currently open (-1 = none)
  const [presentationOrder, setPresentationOrder] = useState([]); // order to open boxes

  // Recall phase state
  const [recallPatternIndex, setRecallPatternIndex] = useState(0); // which pattern we're asking about
  const [recallPatterns, setRecallPatterns] = useState([]); // order of patterns to recall
  const [selectedBox, setSelectedBox] = useState(-1); // box user clicked
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'incorrect' | null
  const [correctBox, setCorrectBox] = useState(-1); // show correct box on error

  // Results data
  const [levelResults, setLevelResults] = useState([]);
  const [practiceLevelResults, setPracticeLevelResults] = useState([]);

  // Refs for timers
  const timerRef = useRef(null);
  const presentIndexRef = useRef(0);

  // Compute active settings
  const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
  const activeLevels = activeSettings.levels;
  const currentNumPatterns = activeLevels[currentLevelIndex] || 2;

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;
    let timer;
    if (demoStep < 6) {
      const delays = [2500, 2500, 2500, 2500, 2500, 2500];
      timer = setTimeout(() => setDemoStep(prev => prev + 1), delays[demoStep] || 2500);
    }
    return () => clearTimeout(timer);
  }, [gameState, demoStep]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clearAllTimers]);

  // --- Level setup ---
  const setupLevel = useCallback((levelIdx, attempt) => {
    const numPatterns = (isPractice ? PRACTICE_SETTINGS : settings).levels[levelIdx] || 2;
    // Pick which boxes get patterns
    const boxIndices = pickRandom(NUM_BOXES, numPatterns);
    // Pick which patterns to use
    const patternIndices = pickRandom(PATTERNS.length, numPatterns);

    const newPlacements = Array(NUM_BOXES).fill(null);
    boxIndices.forEach((boxIdx, i) => {
      newPlacements[boxIdx] = patternIndices[i];
    });

    setPlacements(newPlacements);
    setCurrentAttempt(attempt);
    setRecallPatternIndex(0);
    setSelectedBox(-1);
    setFeedbackState(null);
    setCorrectBox(-1);

    // Create presentation order: all boxes in random order
    const order = shuffle(Array.from({ length: NUM_BOXES }, (_, i) => i));
    setPresentationOrder(order);

    // Create recall order (shuffled pattern order)
    const patternsToRecall = [];
    newPlacements.forEach((p, boxIdx) => {
      if (p !== null) patternsToRecall.push({ patternIndex: p, correctBoxIndex: boxIdx });
    });
    setRecallPatterns(shuffle(patternsToRecall));

    // Start presenting
    setPresentingBoxIndex(-1);
    presentIndexRef.current = 0;
    setGameState('presenting');
  }, [isPractice, settings]);

  // --- Presentation animation: open boxes one by one ---
  useEffect(() => {
    if (gameState !== 'presenting') return;
    const { boxOpenDuration, interBoxDelay } = isPractice ? PRACTICE_SETTINGS : settings;

    const idx = presentIndexRef.current;
    if (idx >= presentationOrder.length) {
      // All boxes shown — move to recall
      timerRef.current = setTimeout(() => {
        setPresentingBoxIndex(-1);
        setGameState('recalling');
      }, 500);
      return () => clearTimeout(timerRef.current);
    }

    // Open current box
    const boxIdx = presentationOrder[idx];
    timerRef.current = setTimeout(() => {
      setPresentingBoxIndex(boxIdx);
      // After showing, close and move to next
      timerRef.current = setTimeout(() => {
        setPresentingBoxIndex(-1);
        presentIndexRef.current = idx + 1;
        // Trigger re-render to process next box
        setPresentationOrder(prev => [...prev]);
      }, boxOpenDuration);
    }, interBoxDelay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gameState, presentationOrder, settings, isPractice]);

  // --- Handle box click during recall ---
  const handleBoxClick = useCallback((boxIndex) => {
    if (gameState !== 'recalling' || feedbackState !== null) return;

    const current = recallPatterns[recallPatternIndex];
    if (!current) return;

    const isCorrect = boxIndex === current.correctBoxIndex;
    setSelectedBox(boxIndex);

    if (isCorrect) {
      setFeedbackState('correct');
      showOverlayMessage('feedback_correct', 600);
    } else {
      setFeedbackState('incorrect');
      setCorrectBox(current.correctBoxIndex);
      showOverlayMessage('feedback_incorrect', 600);
    }

    // Record this response
    const responseData = {
      levelIndex: currentLevelIndex,
      numPatterns: currentNumPatterns,
      attempt: currentAttempt,
      patternIndex: current.patternIndex,
      correctBoxIndex: current.correctBoxIndex,
      selectedBoxIndex: boxIndex,
      correct: isCorrect,
      recallOrder: recallPatternIndex,
      timestamp: Date.now(),
    };

    const resultSetter = isPractice ? setPracticeLevelResults : setLevelResults;
    resultSetter(prev => [...prev, responseData]);

    const feedbackDur = (isPractice ? PRACTICE_SETTINGS : settings).feedbackDuration;

    timerRef.current = setTimeout(() => {
      setFeedbackState(null);
      setSelectedBox(-1);
      setCorrectBox(-1);

      const nextRecallIdx = recallPatternIndex + 1;
      if (nextRecallIdx >= recallPatterns.length) {
        // All patterns recalled for this attempt — check results
        evaluateAttempt(responseData.correct);
      } else {
        setRecallPatternIndex(nextRecallIdx);
      }
    }, feedbackDur);
  }, [gameState, feedbackState, recallPatterns, recallPatternIndex, currentLevelIndex,
      currentNumPatterns, currentAttempt, isPractice, settings, showOverlayMessage]);

  // --- Evaluate attempt after all patterns recalled ---
  const evaluateAttempt = useCallback((lastCorrect) => {
    // Check if ALL patterns in this attempt were correct
    const resultSetter = isPractice ? setPracticeLevelResults : setLevelResults;

    // We need to check the results we just accumulated
    // Get all responses for this level + attempt
    setTimeout(() => {
      const getter = isPractice ? practiceLevelResults : levelResults;
      // Filter results for current level and attempt — include the ones just added
      // Since state may not have updated yet, we check from the accumulated data
      const currentResults = [...getter].filter(
        r => r.levelIndex === currentLevelIndex && r.attempt === currentAttempt
      );

      const allCorrect = currentResults.length === currentNumPatterns &&
        currentResults.every(r => r.correct);

      if (allCorrect) {
        // Level passed — advance
        showOverlayMessage('feedback_level_complete', 1200);
        timerRef.current = setTimeout(() => {
          const nextLevelIdx = currentLevelIndex + 1;
          if (nextLevelIdx >= activeLevels.length) {
            // All levels done
            if (isPractice) finishPractice();
            else finishTest();
          } else {
            setCurrentLevelIndex(nextLevelIdx);
            setupLevel(nextLevelIdx, 0);
          }
        }, 1300);
      } else {
        // Failed — retry or end
        const maxAttempts = (isPractice ? PRACTICE_SETTINGS : settings).maxAttempts;
        const nextAttempt = currentAttempt + 1;
        if (nextAttempt >= maxAttempts) {
          // Max attempts reached — test ends
          showOverlayMessage('feedback_max_attempts', 1200);
          timerRef.current = setTimeout(() => {
            if (isPractice) finishPractice();
            else finishTest();
          }, 1300);
        } else {
          showOverlayMessage('feedback_try_again', 1000);
          timerRef.current = setTimeout(() => {
            setupLevel(currentLevelIndex, nextAttempt);
          }, 1100);
        }
      }
    }, 50); // Small delay to let state settle
  }, [isPractice, practiceLevelResults, levelResults, currentLevelIndex, currentAttempt,
      currentNumPatterns, activeLevels, settings, setupLevel, showOverlayMessage]);

  // --- Start practice ---
  const startPractice = async () => {
    clearAllTimers();
    setIsPractice(true);
    setPracticeLevelResults([]);
    setCurrentLevelIndex(0);
    await requestFullscreen();
    setGameState('countdown');

    startCountdown(() => {
      setupLevel(0, 0);
    });
  };

  // --- Start real test ---
  const startTest = async () => {
    clearAllTimers();
    setIsPractice(false);
    setLevelResults([]);
    setCurrentLevelIndex(0);
    await requestFullscreen();
    setGameState('countdown');

    startCountdown(() => {
      setupLevel(0, 0);
    });
  };

  // --- Finish practice ---
  const finishPractice = useCallback(() => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('practiceComplete');
  }, [clearAllTimers, isFullscreen, exitFullscreen]);

  // --- Finish test ---
  const finishTest = useCallback(() => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isFullscreen) exitFullscreen();
    showOverlayMessage('feedback_test_complete', 1500);

    setTimeout(() => {
      setGameState('results');

      if (!isStandalone && onComplete) {
        // Compute summary scores
        const fams = computeFAMS(levelResults);
        const tea = computeTotalErrorsAdjusted(levelResults, settings.levels);
        onComplete({
          responses: levelResults,
          firstAttemptMemoryScore: fams,
          totalErrorsAdjusted: tea,
          levelsCompleted: computeLevelsCompleted(levelResults, settings.levels),
          settings: settings,
        });
      }
    }, 1500);
  }, [clearAllTimers, isFullscreen, exitFullscreen, showOverlayMessage, isStandalone, onComplete, levelResults, settings]);

  // --- Stop test early ---
  const stopTest = () => {
    if (gameState !== 'welcome' && gameState !== 'results') {
      clearAllTimers();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isPractice) finishPractice();
      else finishTest();
    }
  };

  // --- Reset ---
  const resetTest = () => {
    clearAllTimers();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setLevelResults([]);
    setPracticeLevelResults([]);
    setIsPractice(false);
    setCurrentLevelIndex(0);
    setCurrentAttempt(0);
  };

  // --- Scoring helpers ---
  function computeFAMS(results) {
    // First Attempt Memory Score: correct responses on attempt 0
    return results.filter(r => r.attempt === 0 && r.correct).length;
  }

  function computeTotalErrorsAdjusted(results, levels) {
    // Total errors across all levels, adjusted for levels not reached
    const totalErrors = results.filter(r => !r.correct).length;
    // Determine highest level completed
    const levelsAttempted = new Set(results.map(r => r.levelIndex));
    const levelsNotReached = levels.length - levelsAttempted.size;
    // For levels not reached, add maxAttempts * numPatterns as adjusted errors
    const adjustedErrors = levelsNotReached > 0
      ? totalErrors + levelsNotReached * settings.maxAttempts * (levels[levels.length - 1] || 8)
      : totalErrors;
    return adjustedErrors;
  }

  function computeLevelsCompleted(results, levels) {
    let completed = 0;
    for (let li = 0; li < levels.length; li++) {
      const levelResponses = results.filter(r => r.levelIndex === li && r.attempt === 0);
      if (levelResponses.length === levels[li] && levelResponses.every(r => r.correct)) {
        completed++;
      } else {
        // Check any attempt that was all correct
        const attempts = new Set(results.filter(r => r.levelIndex === li).map(r => r.attempt));
        let passed = false;
        for (const att of attempts) {
          const attResponses = results.filter(r => r.levelIndex === li && r.attempt === att);
          if (attResponses.length === levels[li] && attResponses.every(r => r.correct)) {
            passed = true;
            break;
          }
        }
        if (passed) completed++;
        else break;
      }
    }
    return completed;
  }

  // --- Practice stats ---
  const calculatePracticeStats = () => {
    const total = practiceLevelResults.length;
    const correct = practiceLevelResults.filter(r => r.correct).length;
    const accuracy = total > 0 ? (correct / total * 100).toFixed(0) : 0;
    const attempts = new Set(practiceLevelResults.map(r => r.attempt)).size;
    return { total, correct, accuracy, attempts };
  };

  // --- Render box grid in a circle ---
  const renderBoxes = (interactive = false) => {
    const boxSize = 70;
    const radius = 130;
    const centerX = 160;
    const centerY = 160;

    return (
      <div className={styles.boxCircle} style={{ width: centerX * 2, height: centerY * 2, position: 'relative' }}>
        {Array.from({ length: NUM_BOXES }, (_, i) => {
          const angle = (i / NUM_BOXES) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle) - boxSize / 2;
          const y = centerY + radius * Math.sin(angle) - boxSize / 2;

          const isOpen = presentingBoxIndex === i;
          const hasPattern = placements[i] !== null;
          const isSelected = selectedBox === i;
          const isCorrectHighlight = correctBox === i;
          const isFeedbackCorrect = isSelected && feedbackState === 'correct';
          const isFeedbackIncorrect = isSelected && feedbackState === 'incorrect';

          let boxClass = styles.box;
          if (isOpen) boxClass += ` ${styles.boxOpen}`;
          if (isFeedbackCorrect) boxClass += ` ${styles.boxCorrect}`;
          if (isFeedbackIncorrect) boxClass += ` ${styles.boxIncorrect}`;
          if (isCorrectHighlight && feedbackState === 'incorrect') boxClass += ` ${styles.boxCorrectHighlight}`;
          if (interactive && gameState === 'recalling' && !feedbackState) boxClass += ` ${styles.boxClickable}`;

          return (
            <div
              key={i}
              className={boxClass}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: boxSize,
                height: boxSize,
              }}
              onClick={() => interactive && handleBoxClick(i)}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`Box ${i + 1}`}
            >
              {/* Show pattern when box is open during presentation */}
              {isOpen && hasPattern && (
                <PatternIcon patternIndex={placements[i]} size={50} />
              )}
              {/* Show pattern for correct highlight during feedback */}
              {isCorrectHighlight && feedbackState === 'incorrect' && hasPattern && (
                <PatternIcon patternIndex={placements[i]} size={50} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --- Render the current pattern to recall (shown in center) ---
  const renderRecallPrompt = () => {
    if (gameState !== 'recalling' || recallPatternIndex >= recallPatterns.length) return null;
    const current = recallPatterns[recallPatternIndex];
    return (
      <div className={styles.recallPrompt}>
        <p className={styles.recallLabel}>
          {translate('recall_prompt', { current: recallPatternIndex + 1, total: recallPatterns.length })}
        </p>
        <PatternIcon patternIndex={current.patternIndex} size={80} />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'presenting' || gameState === 'recalling') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('level_label')}: <span className={styles.metricValue}>{currentNumPatterns}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('attempt_label')}: <span className={styles.metricValue}>{currentAttempt + 1}/{activeSettings.maxAttempts}</span>
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
                {demoStep >= 5 && <p>{translate('demo_step6')}</p>}
              </div>

              <div className={styles.demoContainer}>
                {/* Static demo illustration */}
                <div className={styles.demoBoxGrid}>
                  {[0,1,2,3,4,5].map(i => {
                    const showPattern = (demoStep === 1 && i === 1) || (demoStep === 2 && i === 4);
                    const highlightCorrect = demoStep === 4 && i === 1;
                    let cls = styles.demoBox;
                    if (showPattern) cls += ` ${styles.demoBoxOpen}`;
                    if (highlightCorrect) cls += ` ${styles.boxCorrect}`;
                    return (
                      <div key={i} className={cls}>
                        {(showPattern || highlightCorrect) && <PatternIcon patternIndex={i} size={36} />}
                      </div>
                    );
                  })}
                </div>
                {/* Show recall prompt in demo */}
                {demoStep === 3 && (
                  <div className={styles.recallPrompt}>
                    <p className={styles.recallLabel}>{translate('demo_recall_prompt')}</p>
                    <PatternIcon patternIndex={1} size={60} />
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
              <p>{translate('practice_complete_text2')}</p>

              <div className={styles.practiceStats}>
                <h3>{translate('practice_stats_title')}</h3>
                {(() => {
                  const stats = calculatePracticeStats();
                  return (
                    <>
                      <div className={styles.statRow}>
                        <span>{translate('practice_total_responses')}:</span>
                        <span className={styles.statValue}>{stats.total}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_correct')}:</span>
                        <span className={styles.statValue}>{stats.correct}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{stats.accuracy}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_attempts_used')}:</span>
                        <span className={styles.statValue}>{stats.attempts}</span>
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

          {/* Presenting phase — showing boxes one by one */}
          {gameState === 'presenting' && (
            <div className={styles.stimulusContainer}>
              <p className={styles.phaseLabel}>{translate('phase_presenting')}</p>
              {renderBoxes(false)}
              <p className={styles.bottomInstructionsText}>{translate('presenting_instruction')}</p>
            </div>
          )}

          {/* Recalling phase — user clicks boxes */}
          {gameState === 'recalling' && (
            <div className={styles.stimulusContainer}>
              <p className={styles.phaseLabel}>{translate('phase_recalling')}</p>
              {renderRecallPrompt()}
              {renderBoxes(true)}
              <p className={styles.bottomInstructionsText}>{translate('recalling_instruction')}</p>
            </div>
          )}

          {/* Results screen */}
          {gameState === 'results' && (
            <PalResults
              responses={levelResults}
              levels={settings.levels}
              maxAttempts={settings.maxAttempts}
              onRestart={resetTest}
              t={translate}
            />
          )}

          {/* Message overlay */}
          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {/* Settings panel */}
        {showSettings && (
          <PalSettings
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

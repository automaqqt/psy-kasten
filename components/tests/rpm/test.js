// components/tests/rpm/test.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/RPMTest.module.css';
import RPMResults from '../../results/rpm';
import RPMSettings from '../../settings/rpm';
import Footer from '../../ui/footer';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { PROBLEMS } from './data';

export default function RPMTest({ assignmentId, onComplete, isStandalone, t }) {
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, results
  const [gameState, setGameState] = useState('welcome');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    isTimed: false,
    testDurationMinutes: 40,
  });
  const [timeLeft, setTimeLeft] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [demoStep, setDemoStep] = useState(0);
  const [practiceAttempts, setPracticeAttempts] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isPractice, setIsPractice] = useState(false);

  const gameArea = useRef(null);
  const translate = t || ((key) => key);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

  // Get practice problem
  function getPracticeProblem() {
    // Use the first problem from the data as a practice problem
    return PROBLEMS[0];
  }

  const currentProblem = isPractice ? getPracticeProblem() : PROBLEMS[currentProblemIndex];

  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((textKey, duration = 1500, type = 'info') => {
    setMessage(translate(textKey));
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, [translate]);

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'demo') {
      if (demoStep === 0) {
        const timer = setTimeout(() => setDemoStep(1), 1500);
        return () => clearTimeout(timer);
      } else if (demoStep === 1) {
        const timer = setTimeout(() => setDemoStep(2), 3000);
        return () => clearTimeout(timer);
      } else if (demoStep === 2) {
        const timer = setTimeout(() => setDemoStep(3), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, demoStep]);

  // Timer Logic
  useEffect(() => {
    let timerInterval;
    if (gameState === 'playing' && settings.isTimed && startTime && !endTime) {
      const durationSeconds = settings.testDurationMinutes * 60;
      setTimeLeft(durationSeconds - Math.floor((Date.now() - startTime) / 1000));

      timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remaining = durationSeconds - elapsedSeconds;
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerInterval);
          finishTest(); // Auto-finish when time runs out
        }
      }, 1000);
    } else {
      setTimeLeft(null); // Clear time left if not playing or not timed
    }

    // Cleanup interval on component unmount or state change
    return () => clearInterval(timerInterval);
  }, [gameState, settings.isTimed, settings.testDurationMinutes, startTime, endTime]); // Added endTime dependency

  // Start practice trial
  const startPractice = useCallback(async () => {
    setIsPractice(true);
    setPracticeAttempts(0);
    setUserAnswers({});
    setSelectedOptionId(null);

    // Enter fullscreen
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }

    // Countdown
    setGameState('countdown');
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      setGameState('playing');
      clearInterval(countdownInterval);
    }, 3000);
  }, [isFullscreen, enterFullscreen]);

  const startTest = async () => {
    setIsPractice(false);
    setCurrentProblemIndex(0);
    setUserAnswers({});
    setSelectedOptionId(null);
    setEndTime(null);

    // Enter fullscreen
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }

    // Countdown
    setGameState('countdown');
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      setStartTime(Date.now());
      setGameState('playing');
      clearInterval(countdownInterval);
    }, 3000);
  };

  const handleOptionSelect = (optionId) => {
    setSelectedOptionId(optionId);

    // Handle practice mode separately
    if (isPractice) {
      const isCorrect = optionId === currentProblem.correctOptionId;

      if (isCorrect) {
        showOverlayMessage('practice_correct', 2000, 'success');
        setTimeout(() => {
          if (isFullscreen) {
            exitFullscreen();
          }
          setGameState('practiceComplete');
        }, 2200);
      } else {
        setPracticeAttempts(prev => prev + 1);
        showOverlayMessage('practice_incorrect_retry', 2000, 'error');
        setTimeout(() => {
          setSelectedOptionId(null);
        }, 2200);
      }
      return;
    }

    // Store the answer immediately
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [currentProblem.id]: optionId,
    }));

    // Automatically move to next question after a short delay for visual feedback
    setTimeout(() => {
      nextProblem();
    }, 300);
  };

  const nextProblem = () => {
     setSelectedOptionId(null); // Clear selection for the new problem
    if (currentProblemIndex < PROBLEMS.length - 1) {
      setCurrentProblemIndex(prevIndex => prevIndex + 1);
    } else {
      finishTest(); // Last problem answered
    }
  };

  const finishTest = () => {
    setEndTime(Date.now());

    // Exit fullscreen
    if (isFullscreen) {
      exitFullscreen();
    }

    if (assignmentId && !isStandalone) {
      // Calculate results
      const correctCount = Object.keys(userAnswers).filter(
        problemId => {
          const problem = PROBLEMS.find(p => p.id === problemId);
          return problem && userAnswers[problemId] === problem.correctOptionId;
        }
      ).length;

      const testData = {
        userAnswers,
        correctCount,
        totalProblems: PROBLEMS.length,
        accuracy: (correctCount / PROBLEMS.length) * 100,
        startTime,
        endTime: Date.now(),
        timeTaken: Date.now() - startTime,
        settingsUsed: { ...settings },
      };

      onComplete(testData);
    }

    setGameState('results');
  };

  const resetGame = () => {
    setGameState('welcome');
    setCurrentProblemIndex(0);
    setUserAnswers({});
    setSelectedOptionId(null);
    setStartTime(null);
    setEndTime(null);
    setTimeLeft(null);
  };

  // Format time remaining
  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <Link href="/" passHref>
            <div className={styles.logoLink}>
              <Image
                src="/logo.png"
                alt={translate('common:logo_alt_text')}
                width={50}
                height={50}
              />
            </div>
          </Link>
          <h1 className={styles.title}>{translate('welcome_title')}</h1>
          {gameState === 'playing' && settings.isTimed && timeLeft !== null && (
            <div className={styles.timer}>{translate('time_left')}: {formatTime(timeLeft)}</div>
          )}
          {gameState === 'playing' && !isPractice && (
            <div className={styles.progressIndicator}>
              {translate('item_progress', { current: currentProblemIndex + 1, total: PROBLEMS.length })}
              ({translate('set_label', { set: currentProblem?.set })})
            </div>
          )}
        </div>

        <div className={`${styles.gameArea} ${isFullscreen ? styles.fullscreenMode : ''}`} ref={gameArea}>
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('welcome_title')}</h2>
              <p>{translate('welcome_p1')}</p>
              <p>{translate('welcome_p2')}</p>
              <p>{translate('welcome_p3')}</p>
              {settings.isTimed && (
                <p><strong>{translate('timed_session_info', { minutes: settings.testDurationMinutes })}</strong></p>
              )}
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
              </div>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('demo'); }}>
                  {translate('see_demo')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setGameState('welcome')}
                >
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'demo' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p>{translate('demo_intro')}</p>
              <div className={styles.demoContainer}>
                <div className={styles.demoMatrixExample}>
                  {/* Show a simple visual example */}
                  <div dangerouslySetInnerHTML={{ __html: PROBLEMS[0].matrixSVG }} style={{ maxWidth: '300px' }} />
                </div>

                {/* Show the options */}
                <div className={styles.demoOptionsContainer}>
                  {PROBLEMS[0].options.map((option) => (
                    <div
                      key={option.id}
                      className={`${styles.demoOptionButton} ${
                        demoStep >= 2 && option.id === PROBLEMS[0].correctOptionId ? styles.demoCorrectOption : ''
                      }`}
                    >
                      <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: option.svg }} />
                      <span className={styles.optionLabel}>{option.id}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.demoText}>
                  {demoStep === 0 && <p>{translate('demo_step1')}</p>}
                  {demoStep === 1 && <p className={styles.highlight}>{translate('demo_step2')}</p>}
                  {demoStep >= 2 && <p className={styles.success}>{translate('demo_step3')}</p>}
                </div>
              </div>
              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 2}
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
              <p>{translate('practice_complete_text')}</p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
                  {translate('start_real_test')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => startPractice()}
                >
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownContent}>
                <h2>{translate('get_ready')}</h2>
                <div className={styles.countdownNumber}>{countdown}</div>
                <p>{translate('test_begins_soon')}</p>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentProblem && (
            <div className={styles.playingArea}>
              <div className={styles.matrixContainer} aria-label={`Problem Matrix ${currentProblem.id}`}>
                {/* ** Render generated SVG ** */}
                <div dangerouslySetInnerHTML={{ __html: currentProblem.matrixSVG }} />
              </div>

              <div className={styles.optionsContainer} role="radiogroup" aria-label="Answer Options">
                {currentProblem.options.map((option) => (
                  <button
                    key={option.id}
                    className={`${styles.optionButton} ${selectedOptionId === option.id ? styles.selected : ''}`}
                    onClick={() => handleOptionSelect(option.id)}
                    aria-label={`Option ${option.id}`}
                    role="radio"
                    aria-checked={selectedOptionId === option.id}
                  >
                    {/* ** Replace with actual Image component ** */}
                    <div className={styles.svgWrapper} /* Optional wrapper for styling */
                        dangerouslySetInnerHTML={{ __html: option.svg }} />
                    <span className={styles.optionLabel}>{option.id}</span>
                    
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'results' && (
             <RPMResults
               userAnswers={userAnswers}
               problems={PROBLEMS}
               startTime={startTime}
               endTime={endTime}
               settings={settings}
               onRestart={resetGame}
             />
          )}

          {/* Message Overlay */}
          {showMessage && (
            <div className={styles.messageOverlay}>
              <div className={`${styles.message} ${styles[messageType]}`}>{message}</div>
            </div>
          )}
        </div>


        {/* Settings Modal */}
        {showSettings && (
          <RPMSettings
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
// components/tests/rpm/RPMTest.js
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/RPMTest.module.css'; // Create this CSS file
import RPMResults from '../../results/rpm'; // Create this Results component
import RPMSettings from '../../settings/rpm'; // Create this Settings component
import { PROBLEMS, RPM_SETS, ITEMS_PER_SET } from './data';

export default function RPMTest() {
  const [gameState, setGameState] = useState('welcome'); // welcome, instructions, playing, results
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Store answers keyed by problem id: { "A1": 3, "A2": 5, ... }
  const [selectedOptionId, setSelectedOptionId] = useState(null); // Track selection for the current problem
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    isTimed: false,
    testDurationMinutes: 40, // Default duration if timed
  });
  const [timeLeft, setTimeLeft] = useState(null); // In seconds

  const currentProblem = PROBLEMS[currentProblemIndex];

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

  const startTest = () => {
    setCurrentProblemIndex(0);
    setUserAnswers({});
    setSelectedOptionId(null);
    setEndTime(null); // Reset end time
    setStartTime(Date.now()); // Record start time
    setGameState('playing');
  };

  const handleOptionSelect = (optionId) => {
    setSelectedOptionId(optionId); // Visually indicate selection

    // Store the answer immediately
     setUserAnswers(prevAnswers => ({
       ...prevAnswers,
       [currentProblem.id]: optionId,
     }));

     // Automatically move to next question after a short delay for visual feedback
     setTimeout(() => {
        nextProblem();
     }, 300); // 300ms delay
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
          <h1 className={styles.title}>Raven's Progressive Matrices</h1>
           {gameState === 'playing' && settings.isTimed && timeLeft !== null && (
             <div className={styles.timer}>Time Left: {formatTime(timeLeft)}</div>
           )}
          {gameState === 'playing' && (
             <div className={styles.progressIndicator}>
                Item {currentProblemIndex + 1} of {PROBLEMS.length} (Set {currentProblem?.set})
             </div>
          )}
        </div>

        <div className={styles.gameArea}>
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>Raven's Standard Progressive Matrices (SPM)</h2>
              <p>This test assesses observation skills and clear thinking ability.</p>
              <p>For each pattern shown, a piece is missing. Look at the pieces below and select the one that correctly completes the pattern.</p>
              <p>The problems start simple and become more difficult. Work carefully at your own pace.</p>
              {settings.isTimed && <p><strong>This session is timed: {settings.testDurationMinutes} minutes.</strong></p>}
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
                  Start Test
                </button>
                <button 
                  className={styles.secondaryButton} 
                  onClick={() => setShowSettings(true)}
                >
                  Adjust Settings
                </button>
              </div>
              <div className={styles.linkContainer}>
                <Link href="/">
                  <div className={styles.link}>Back to Home</div>
                </Link>
              </div>
              {/* <p className={styles.copyrightNotice}>
                ** IMPORTANT: Raven's Progressive Matrices are copyrighted. This implementation uses placeholders. Licensed images are required for actual use. **
              </p> */}
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
        </div>

         {/* Settings Modal */}
         {showSettings && (
           <RPMSettings
             settings={settings}
             setSettings={setSettings}
             onClose={() => setShowSettings(false)}
           />
         )}

        <footer className={styles.footer}>
          <p>Raven's Standard Progressive Matrices (SPM). Based on J.C. Raven's work.</p>
        </footer>
      </div>
    </div>
  );
}
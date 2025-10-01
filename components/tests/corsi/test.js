// components/CorsiTest.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/CorsiTest.module.css';
import SettingsPanel from '../../settings/corsi';
import DetailedResults from '../../results/corsi';
import Footer from '../../ui/footer';
import { useFullscreen } from '../../../hooks/useFullscreen';

// Predefined sequences for each level
const PREDEFINED_SEQUENCES = [
  // 3er Gruppe
  [
    [4, 7, 9],
    [3, 1, 9],
    [4, 2, 5],
    [5, 8, 6]
  ],
  // 4er Gruppe
  [
    [3, 4, 1, 7],
    [6, 1, 5, 8],
    [5, 8, 3, 2],
    [6, 4, 3, 9]
  ],
  // 5er Gruppe
  [
    [5, 2, 1, 8, 6],
    [4, 2, 7, 3, 1],
    [9, 7, 5, 8, 3],
    [6, 9, 1, 5, 4]
  ],
  // 6er Gruppe
  [
    [3, 9, 2, 4, 8, 7],
    [3, 7, 8, 2, 9, 4],
    [9, 2, 7, 6, 1, 0],
    [3, 8, 9, 1, 7, 6, 4]
  ],
  // 7er Gruppe
  [
    [5, 9, 1, 7, 4, 2, 8],
    [5, 7, 9, 2, 8, 4, 6],
    [1, 9, 6, 2, 7, 8, 9, 1],
    [9, 8, 5, 2, 1, 6, 3]
  ],
  // 8er Gruppe
  [
    [5, 8, 1, 9, 2, 6, 4, 7],
    [5, 9, 3, 6, 7, 2, 4, 3],
    [3, 6, 5, 1, 9, 1, 2, 7],
    [2, 9, 7, 6, 3, 1, 5, 4]
  ]
];

export default function CorsiTest({ assignmentId, onComplete, isStandalone, t }) {
  const [blocks, setBlocks] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [gameState, setGameState] = useState('welcome'); // welcome, tutorial, demo, practice, countdown, showing, input, results
  const [isPractice, setIsPractice] = useState(false);
  const [level, setLevel] = useState(3); // Start with 3-length sequences
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [demoStep, setDemoStep] = useState(0);
  const [demoHighlightIndex, setDemoHighlightIndex] = useState(-1);

  // State for tracking failures and retries per category
  const [failuresPerLevel, setFailuresPerLevel] = useState({}); // Track failures per category (level)
  const [usedSequencesPerLevel, setUsedSequencesPerLevel] = useState({}); // Track used sequences per level
  const [settings, setSettings] = useState({
    blockHighlightDuration: 700,
    intervalBetweenBlocks: 300,
    blockBlinkIntensity: 100, // 0-100 for highlight intensity
    blockContrast: 70, // 0-100 for contrast between normal and highlighted
  });
  const [roundData, setRoundData] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [clickTimes, setClickTimes] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'
  const boardRef = useRef(null);
  const gameArea = useRef(null)
  const canvasSize = useRef(null);
  const translate = t || ((key) => key);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);
  // Calculate optimal canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Use 80% of the smaller dimension to maintain square aspect ratio
      const size = Math.min(vw * 0.8, vh * 0.8);
      canvasSize.current = size;
      
      // Update board style if ref exists
      if (boardRef.current) {
        boardRef.current.style.width = `${size}px`;
        boardRef.current.style.height = `${size}px`;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  // Initialize blocks with fixed positions (standard Corsi layout)
  useEffect(() => {
    // Fixed positions for 9 blocks in a standardized Corsi block layout
    const fixedPositions = [
      // Values calculated from the image's pixel coordinates
      { id: 1, x: '51%', y: '11%' },
      { id: 2, x: '12%', y: '16%' },
      { id: 3, x: '71%', y: '28%' },
      { id: 4, x: '27%', y: '33%' },
      { id: 5, x: '55%', y: '43%' },
      { id: 6, x: '76%', y: '58%' },
      { id: 7, x: '6%',  y: '63%' },
      { id: 8, x: '29%', y: '77%' },
      { id: 9, x: '53%', y: '72%' }
];

    const initialBlocks = fixedPositions.map(position => ({
      ...position,
      active: false,
      clicked: false,
    }));

    setBlocks(initialBlocks);
  }, []);

  useEffect(() => {
    // Apply contrast and blink settings
    document.documentElement.style.setProperty('--block-color', '#000000');
    document.documentElement.style.setProperty('--highlight-color', `hsl(48, 100%, ${30 + settings.blockBlinkIntensity * 0.5}%)`);
  }, [settings.blockContrast, settings.blockBlinkIntensity]);

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'demo') {
      const demoSequence = [0, 2, 1]; // Simple 3-block demo sequence

      if (demoStep === 0) {
        // Step 0: Initial display
        const timer = setTimeout(() => setDemoStep(1), 1000);
        return () => clearTimeout(timer);
      } else if (demoStep === 1) {
        // Step 1: Show sequence
        let highlightIndex = 0;
        const showNextBlock = () => {
          if (highlightIndex < demoSequence.length) {
            setDemoHighlightIndex(demoSequence[highlightIndex]);
            setTimeout(() => {
              setDemoHighlightIndex(-1);
              setTimeout(() => {
                highlightIndex++;
                if (highlightIndex < demoSequence.length) {
                  showNextBlock();
                } else {
                  setTimeout(() => setDemoStep(2), 500);
                }
              }, 300);
            }, 700);
          }
        };
        showNextBlock();
      } else if (demoStep === 2) {
        // Step 2: Show clicking sequence
        const timer = setTimeout(() => setDemoStep(3), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, demoStep]);

  // Generate a new sequence from predefined sequences for the current level
  const generateSequence = useCallback((targetLevel = null) => {
    const currentLevel = targetLevel || level;
    console.log(`🎮 generateSequence called for level: ${currentLevel}`);
    console.log(`🔍 PREDEFINED_SEQUENCES length: ${PREDEFINED_SEQUENCES.length}`);
    console.log(`🔍 PREDEFINED_SEQUENCES:`, PREDEFINED_SEQUENCES);
    const levelIndex = currentLevel - 3; // Convert level (3-8) to array index (0-5)
    console.log(`🔍 Calculated levelIndex: ${levelIndex} for level: ${currentLevel}`);

    if (levelIndex < 0 || levelIndex >= PREDEFINED_SEQUENCES.length) {
      console.warn(`Invalid level: ${currentLevel}. Using level 3.`);
      return PREDEFINED_SEQUENCES[0][0]; // Fallback to first sequence of level 3
    }

    const levelSequences = PREDEFINED_SEQUENCES[levelIndex];

    // Safety check - ensure levelSequences exists and is an array
    if (!levelSequences || !Array.isArray(levelSequences) || levelSequences.length === 0) {
      console.error(`No sequences found for level ${currentLevel} (index ${levelIndex}). Using level 3.`);
      return PREDEFINED_SEQUENCES[0][0]; // Fallback to first sequence of level 3
    }

    const usedForLevel = usedSequencesPerLevel[currentLevel] || [];

    console.log(`📝 Level ${currentLevel} sequences:`, levelSequences);
    console.log(`🚫 Used sequences for level ${currentLevel}:`, usedForLevel);

    // Filter out already used sequences for this level
    const availableSequences = levelSequences.filter((_, index) => !usedForLevel.includes(index));

    if (availableSequences.length === 0) {
      console.warn(`No more sequences available for level ${currentLevel}`);
      // Reset used sequences for this level and pick first available
      setUsedSequencesPerLevel(prev => ({ ...prev, [currentLevel]: [] }));
      return levelSequences[0];
    }

    // Pick a random sequence from available ones
    const randomIndex = Math.floor(Math.random() * availableSequences.length);
    const selectedSequence = availableSequences[randomIndex];

    console.log(`✅ Selected sequence for level ${currentLevel}:`, selectedSequence);

    // Find the original index in the level sequences array
    const originalIndex = levelSequences.findIndex(seq =>
      seq.length === selectedSequence.length &&
      seq.every((val, i) => val === selectedSequence[i])
    );

    // Mark this sequence as used for this level
    setUsedSequencesPerLevel(prev => ({
      ...prev,
      [currentLevel]: [...(prev[currentLevel] || []), originalIndex]
    }));

    return selectedSequence;
  }, [level, usedSequencesPerLevel]);

  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((textKey, duration = 1500, type = 'info') => {
    setMessage(translate(textKey)); // Use translation key
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, [translate]);

  // Show the sequence to the user
  const displaySequence = useCallback(async (seq) => {
    setShowingSequence(true);
    
    // Show brief message
    showOverlayMessage('watch_carefully', 1000);
    
    // Create a promise that resolves after showing the full sequence
    return new Promise((resolve) => {
      const showBlock = async (index) => {
        if (index >= seq.length) {
          setTimeout(() => {
            setShowingSequence(false);
            setGameState('input');
            setRoundStartTime(Date.now()); // Start timing for user input
            setClickTimes([]);
            showOverlayMessage('your_turn', 800);
            resolve();
          }, 500);
          return;
        }
        
        setBlocks(prevBlocks => 
          prevBlocks.map(block => ({
            ...block,
            active: block.id === seq[index]
          }))
        );
        
        setTimeout(() => {
          setBlocks(prevBlocks => 
            prevBlocks.map(block => ({
              ...block,
              active: false
            }))
          );
          
          setTimeout(() => {
            showBlock(index + 1);
          }, settings.intervalBetweenBlocks);
        }, settings.blockHighlightDuration);
      };
      
      showBlock(0);
    });
  }, [settings.blockHighlightDuration, settings.intervalBetweenBlocks, showOverlayMessage, translate]);

  // Start practice trial with a simple 2-block sequence
  const startPractice = useCallback(async () => {
    setIsPractice(true);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    setUserSequence([]);
    setFeedback('');
    setBlocks(prevBlocks =>
      prevBlocks.map(block => ({
        ...block,
        active: false,
        clicked: false
      }))
    );

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
      // Simple 2-block sequence for practice
      const practiceSequence = [2, 5];
      setSequence(practiceSequence);
      setGameState('showing');
      displaySequence(practiceSequence);
      clearInterval(countdownInterval);
    }, 3000);
  }, [displaySequence, enterFullscreen, isFullscreen]);

  // Start a new round
  const startGame = useCallback(async (targetLevel = null) => {
    const currentLevel = targetLevel || level;
    setIsPractice(false);
    // Reset game state
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    setUserSequence([]);
    setFeedback('');
    setBlocks(prevBlocks =>
      prevBlocks.map(block => ({
        ...block,
        active: false,
        clicked: false
      }))
    );

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
      // Generate and show the sequence
      const newSequence = generateSequence(currentLevel);
      setSequence(newSequence);
      setGameState('showing');
      displaySequence(newSequence);
      clearInterval(countdownInterval);
    }, 3000);
  }, [displaySequence, generateSequence, enterFullscreen, isFullscreen, level]);

  // Handle user clicking a block
  const handleBlockClick = (blockId) => {
    if (gameState !== 'input' || showingSequence) return;
    
    // Record click time
    const clickTime = Date.now();
    setClickTimes(prev => [...prev, {
      blockId,
      time: clickTime,
      timeFromStart: clickTime - roundStartTime,
      sequencePosition: userSequence.length
    }]);
    
    // Update user sequence
    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);
    
    // Highlight the clicked block
    setBlocks(prevBlocks => 
      prevBlocks.map(block => ({
        ...block,
        active: block.id === blockId,
        clicked: block.id === blockId ? true : block.clicked
      }))
    );
    
    // Remove highlight after a short delay
    setTimeout(() => {
      setBlocks(prevBlocks => 
        prevBlocks.map(block => ({
          ...block,
          active: false
        }))
      );
      
      // Check if user has completed their sequence
      if (newUserSequence.length === sequence.length) {
        const totalResponseTime = Date.now() - roundStartTime;
        checkResult(newUserSequence, totalResponseTime);
      }
    }, 300);
  };

  // Check if the user's sequence matches the target sequence
  const checkResult = (userSeq, totalResponseTime) => {
    const isCorrect = userSeq.every((blockId, index) => blockId === sequence[index]);

    // Handle practice mode separately
    if (isPractice) {
      if (isCorrect) {
        showOverlayMessage('practice_correct', 2000, 'success');
        setTimeout(() => {
          if (isFullscreen) {
            exitFullscreen();
          }
          setGameState('practiceComplete');
        }, 2200);
      } else {
        showOverlayMessage('practice_incorrect_retry', 2000, 'error');
        setTimeout(() => {
          startPractice(); // Retry practice
        }, 2200);
      }
      return;
    }

    // Calculate metrics
    const clickIntervals = clickTimes.map((click, i) => {
      if (i === 0) return 0;
      return click.time - clickTimes[i-1].time;
    }).slice(1); // Remove first interval which is always 0

    const avgClickInterval = clickIntervals.length ?
      clickIntervals.reduce((sum, interval) => sum + interval, 0) / clickIntervals.length : 0;

    const roundResults = {
      level,
      success: isCorrect,
      totalResponseTime,
      avgClickInterval,
      clickTimes: clickTimes,
      sequence: [...sequence],
      userSequence: [...userSeq],
      timestamp: new Date().toISOString()
    };

    // Add this round's data to round history
    const updatedRoundData = [...roundData, roundResults];
    setRoundData(updatedRoundData);


    if (isCorrect) {
      // Success - move to next level
      setFeedback(translate('correct_feedback'));
      setScore(prevScore => prevScore + level);
      showOverlayMessage('correct_feedback', 1500, 'success');
      setResults(prev => [...prev, { level, success: true, responseTime: totalResponseTime }]);

      // Reset failures for this level since they succeeded
      setFailuresPerLevel(prev => ({ ...prev, [level]: 0 }));

      setTimeout(() => {
        // Check if we've reached the maximum level (8)
        if (level >= 8) {
          // Test completed successfully at max level
          console.log(`🎉 Test completed at max level ${level}`);
          finishTest(updatedRoundData, true);
        } else {
          const nextLevel = level + 1;
          console.log(`⬆️ Success! Moving from level ${level} to level ${nextLevel}`);
          setLevel(nextLevel);
          startGame(nextLevel);
        }
      }, 1700);
    } else {
      // Failure - check category retry logic
      const currentCategoryFailures = failuresPerLevel[level] || 0;
      const newCategoryFailures = currentCategoryFailures + 1;

      setFailuresPerLevel(prev => ({ ...prev, [level]: newCategoryFailures }));
      setResults(prev => [...prev, { level, success: false, responseTime: totalResponseTime }]);

      if (newCategoryFailures >= 3) {
        // Third failure in this category - test ends
        const failureMessage = `${translate('incorrect_feedback')} ${translate('test_finished')}`;
        showOverlayMessage('test_failed_category', 2500, 'error');
        setFeedback(failureMessage);
        finishTest(updatedRoundData, false);
      } else {
        // Allow retries
        const retryMessage = translate('incorrect_feedback_retry') ||
                            `${translate('incorrect_feedback')} ${translate('try_again_same_category')}`;
        showOverlayMessage('incorrect_retry', 2000, 'error');
        setFeedback(retryMessage);

        setTimeout(() => {
          startGame(); // Retry same category with different sequence
        }, 2200);
      }
    }
  };

  // Helper function to finish the test
  const finishTest = (updatedRoundData, completedSuccessfully = false) => {
    if (isFullscreen) {
      exitFullscreen();
    }

    const finishMessage = completedSuccessfully ?
      translate('test_completed_successfully') || translate('test_finished') :
      `${translate('incorrect_feedback')} ${translate('test_finished')}`;

    const overlayMsg = isStandalone ?
      `${finishMessage} (${translate('common:results_not_saved_standalone')})` :
      `${finishMessage} (${translate('common:submitting')})`;

    showOverlayMessage(overlayMsg, 2000);
    setFeedback(finishMessage);

    if (assignmentId) {
      console.log("Test finished, attempting submission.");
      const finalTestData = {
        corsiSpan: calculateCorsiSpan(updatedRoundData),
        totalScore: score,
        rounds: updatedRoundData,
        settingsUsed: { ...settings },
        completedSuccessfully,
        failuresPerLevel: failuresPerLevel
      };
      onComplete(finalTestData);
    } else {
      console.log("Test finished (Standalone), showing results locally.");
    }

    setTimeout(() => {
      setGameState('results');
    }, 1500);
  };

  // Calculate Corsi span (highest level completed successfully)
  const calculateCorsiSpan = () => {
    // Find the highest level where success is true
    const successfulLevels = results.filter(r => r.success).map(r => r.level);
    return successfulLevels.length ? Math.max(...successfulLevels) : 0;
  };

  // Reset the game
  const resetGame = () => {
    setLevel(3); // Start with 3-length sequences
    setScore(0);
    setResults([]);
    setRoundData([]);
    setGameState('welcome');
    // Reset failure tracking
    setFailuresPerLevel({});
    setUsedSequencesPerLevel({});
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
      <div className={styles.header}>
      <Link href="/" passHref>
                          <div className={styles.logoLink}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={'psykasten Logo'} // Add alt text key
                                    width={50}     // Specify width (adjust as needed)
                                    height={50}    // Specify height (adjust aspect ratio)
                                />
                            </div>
                        </Link>
           {(gameState === 'showing' || gameState === 'input') && (
               <div className={styles.gameMetrics}>
                   <div className={styles.levelIndicator}>{translate('level')}: <span className={styles.metricValue}>{level}</span></div>
                   <div className={styles.scoreIndicator}>{translate('score')}: <span className={styles.metricValue}>{score}</span></div>
               </div>
           )}
        </div>
        
        <div className={styles.gameArea} ref={gameArea}>
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
                  <div className={styles.demoBoard}>
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const isHighlighted = demoHighlightIndex === index;
                      const isClicked = demoStep >= 3;
                      const demoSequence = [0, 2, 1];
                      const clickOrder = demoSequence.indexOf(index);

                      return (
                        <div
                          key={index}
                          className={`${styles.demoBlock} ${
                            isHighlighted ? styles.demoHighlighted : ''
                          } ${
                            isClicked && clickOrder >= 0 ? styles.demoClicked : ''
                          }`}
                        >
                          {isClicked && clickOrder >= 0 && (
                            <span className={styles.clickNumber}>{clickOrder + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.demoText}>
                    {demoStep === 0 && <p>{translate('demo_step0')}</p>}
                    {demoStep === 1 && <p className={styles.highlight}>{translate('demo_step1')}</p>}
                    {demoStep === 2 && <p className={styles.highlight}>{translate('demo_step2')}</p>}
                    {demoStep >= 3 && <p className={styles.success}>{translate('demo_step3')}</p>}
                  </div>
                </div>
                <div className={styles.buttonContainer}>
                  <button
                    className={styles.primaryButton}
                    onClick={startPractice}
                    disabled={demoStep < 3}
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
                    <button className={styles.primaryButton} onClick={startGame}>
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
                        <p>{translate('watch_sequence')}</p>
                    </div>
                </div>
            )}
          
          {/* Game board (visible during 'showing' and 'input' states) */}
          {(gameState === 'showing' || gameState === 'input') && (
            <div 
            className={`${styles.gameArea} ${isFullscreen ? styles.fullscreenMode : ''}`}
            
          >
            <div 
              className={styles.boardContainer}
              aria-label="Corsi Block Test Board"
            >
              <div 
                className={styles.board}
                ref={boardRef}
                style={{ pointerEvents: showingSequence ? 'none' : 'auto' }}
              >
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => handleBlockClick(block.id)}
                    className={`${styles.block} ${block.active ? styles.active : ''} ${block.clicked && gameState === 'input' ? styles.clicked : ''}`}
                    style={{
                      left: block.x,
                      top: block.y,
                      cursor: showingSequence ? 'default' : 'pointer',
                    }}
                    aria-label={`Block ${block.id + 1}`}
                    role="button"
                    tabIndex={showingSequence ? -1 : 0}
                  />
                ))}
              </div>
              </div>
              
              {/* Progress indicator */}
              <div className={styles.progressIndicator}>
                {userSequence.length} / {sequence.length}
              </div>
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && isStandalone && roundData && (
                <DetailedResults
                    roundData={roundData}
                    corsiSpan={calculateCorsiSpan}
                    isStandalone={isStandalone}
                    t={t} // Pass translation function down to Results
                />
           )}

            {/* Message Overlay uses state `message` which is already translated */}
            {showMessage && (
                <div className={styles.messageOverlay}>
                   <div className={`${styles.message} ${styles[messageType]}`}>{message}</div>
                </div>
            )}
        </div>

         <Footer />
        
        {/* Settings panel */}
        {showSettings && (
          <SettingsPanel 
            settings={settings} 
            setSettings={setSettings} 
            onClose={() => setShowSettings(false)}
          />
        )}
        
      </div>
    </div>
  );
}
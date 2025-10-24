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
    [9, 2, 7, 6, 1, 9],
    [3, 8, 9, 1, 7, 4]
  ],
  // 7er Gruppe
  [
    [5, 9, 1, 7, 4, 2, 8],
    [5, 7, 9, 2, 8, 4, 6],
    [1, 9, 6, 2, 7, 9, 1],
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

  // State for tracking sequence progression and failures
  const [sequenceIndexInLevel, setSequenceIndexInLevel] = useState(0); // Track which of 4 sequences (0-3) we're on at current level
  const [isReplacementTrial, setIsReplacementTrial] = useState(false); // Flag for replacement trial mode
  const [replacementSequence, setReplacementSequence] = useState([]); // Store reversed sequence for replacement trial
  const [consecutiveFailures, setConsecutiveFailures] = useState(0); // Count consecutive failures (resets on success)
  const [successesPerLevel, setSuccessesPerLevel] = useState({}); // Track number of successes at each level {3: 2, 4: 3, ...}
  const [skipUsedPerLevel, setSkipUsedPerLevel] = useState({}); // Track if first skip used per level (for replacement trial eligibility)
  const [errorCountF1, setErrorCountF1] = useState(0); // Count of F1 errors (sequencing errors - correct blocks, wrong order)
  const [errorCountF2, setErrorCountF2] = useState(0); // Count of F2 errors (wrong or missing blocks)
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
    document.documentElement.style.setProperty('--highlight-color', `#f6d44c`);
  }, [settings.blockContrast, settings.blockBlinkIntensity]);

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'demo') {
      const demoSequence = [0, 2, 1]; // Simple 3-block demo sequence

      if (demoStep === 0) {
        // Step 0: Initial display
        const timer = setTimeout(() => setDemoStep(1), 3000);
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
                  setTimeout(() => setDemoStep(2), 2500);
                }
              }, 300);
            }, 2700);
          }
        };
        showNextBlock();
      } else if (demoStep === 2) {
        // Step 2: Show clicking sequence
        const timer = setTimeout(() => setDemoStep(3), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, demoStep]);

  // Generate a new sequence from predefined sequences for the current level and sequence index
  const generateSequence = useCallback((targetLevel = null, seqIndex = null) => {
    const currentLevel = targetLevel || level;
    const currentSeqIndex = seqIndex !== null ? seqIndex : sequenceIndexInLevel;
    console.log(`🎮 generateSequence called for level: ${currentLevel}, sequence index: ${currentSeqIndex}`);
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

    // Use the provided sequence index (0-3 for the 4 sequences per level)
    const safeSeqIndex = Math.max(0, Math.min(currentSeqIndex, levelSequences.length - 1));

    console.log(`📝 Level ${currentLevel} - Using sequence ${safeSeqIndex + 1} of ${levelSequences.length}`);

    // Get the sequence at the specified index
    const selectedSequence = levelSequences[safeSeqIndex];

    console.log(`✅ Selected sequence for level ${currentLevel}:`, selectedSequence);

    return selectedSequence;
  }, [level, sequenceIndexInLevel]);

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


    // Create a promise that resolves after showing the full sequence
    return new Promise((resolve) => {
      const showBlock = async (index) => {
        if (index >= seq.length) {
          setTimeout(() => {
            setShowingSequence(false);
            setGameState('input');
            setRoundStartTime(Date.now()); // Start timing for user input
            setClickTimes([]);
            showOverlayMessage('your_turn', 2000);
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
      const practiceSequence = [3, 1, 2];
      setSequence(practiceSequence);
      setGameState('showing');
      displaySequence(practiceSequence);
      clearInterval(countdownInterval);
    }, 3000);
  }, [displaySequence, enterFullscreen, isFullscreen]);

  // Start a new round
  const startGame = useCallback(async (targetLevel = null, seqIndex = null) => {
    const currentLevel = targetLevel || level;
    const currentSeqIndex = seqIndex !== null ? seqIndex : sequenceIndexInLevel;

    console.log(`🎮 Starting game: Level ${currentLevel}, Sequence ${currentSeqIndex + 1}/4`);

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
      const newSequence = generateSequence(currentLevel, currentSeqIndex);
      setSequence(newSequence);
      setGameState('showing');
      displaySequence(newSequence);
      clearInterval(countdownInterval);
    }, 3000);
  }, [displaySequence, generateSequence, enterFullscreen, isFullscreen, level, sequenceIndexInLevel]);

  // Handle user clicking a block
  const handleBlockClick = (blockId) => {
    if (gameState !== 'input' || showingSequence) return;

    // Prevent selecting the same block twice
    if (userSequence.includes(blockId)) {
      return;
    }

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

  // Handle skip button click
  const handleSkip = () => {
    if (gameState !== 'input' || showingSequence || isPractice) return;

    const hasFirstSkipBeenUsed = skipUsedPerLevel[level] || false;
    const hasClickedBlocks = userSequence.length > 0;
    const totalResponseTime = Date.now() - roundStartTime;

    // Check if eligible for replacement trial
    const isEligibleForReplacement = !hasFirstSkipBeenUsed && !hasClickedBlocks;

    if (isEligibleForReplacement) {
      // First skip at level with no blocks clicked - offer replacement trial
      console.log('🔄 Offering replacement trial - reversing sequence');

      // Mark that first skip has been used for this level
      setSkipUsedPerLevel(prev => ({ ...prev, [level]: true }));

      // Create reversed sequence
      const reversed = [...sequence].reverse();
      setReplacementSequence(reversed);
      setIsReplacementTrial(true);

      // Record the skip
      const roundResults = {
        level,
        success: false,
        skipped: true,
        isReplacementTrigger: true,
        totalResponseTime,
        avgClickInterval: 0,
        clickTimes: [],
        sequence: [...sequence],
        userSequence: [],
        timestamp: new Date().toISOString()
      };
      setRoundData(prev => [...prev, roundResults]);

      // Show replacement trial with reversed sequence
      showOverlayMessage('replacement_trial', 3000, 'info');

      setTimeout(() => {
        setUserSequence([]);
        setBlocks(prevBlocks =>
          prevBlocks.map(block => ({
            ...block,
            active: false,
            clicked: false
          }))
        );
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
          setSequence(reversed);
          setGameState('showing');
          displaySequence(reversed);
          clearInterval(countdownInterval);
        }, 3000);
      }, 3200);
    } else {
      // Not eligible for replacement - count as regular failure
      console.log('❌ Skip counts as failure - consecutive failures:', consecutiveFailures + 1);

      const newConsecutiveFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newConsecutiveFailures);

      // Record the failure
      const roundResults = {
        level,
        success: false,
        skipped: true,
        totalResponseTime,
        avgClickInterval: 0,
        clickTimes: [],
        sequence: [...sequence],
        userSequence: [...userSequence],
        timestamp: new Date().toISOString()
      };
      setRoundData(prev => [...prev, roundResults]);
      setResults(prev => [...prev, { level, success: false, responseTime: totalResponseTime, skipped: true }]);

      // Check if 3 consecutive failures
      if (newConsecutiveFailures >= 3) {
        showOverlayMessage('three_consecutive_failures', 3000, 'error');
        setTimeout(() => {
          finishTest([...roundData, roundResults], false);
        }, 3200);
      } else {
        // Move to next sequence in level or next level
        const nextSeqIndex = sequenceIndexInLevel + 1;

        if (nextSeqIndex >= 4) {
          // Completed all 4 sequences at this level - move to next level
          showOverlayMessage('level_completed', 3000, 'info');
          setTimeout(() => {
            setLevel(prev => prev + 1);
            setSequenceIndexInLevel(0);
            startGame(level + 1, 0);
          }, 3200);
        } else {
          // Continue with next sequence at same level
          showOverlayMessage('incorrect_retry', 3000, 'error');
          setTimeout(() => {
            setSequenceIndexInLevel(nextSeqIndex);
            startGame(level, nextSeqIndex);
          }, 3200);
        }
      }
    }
  };

  // Classify error type for failed rounds
  const classifyError = (sequence, userSequence) => {
    // If different lengths, it's F2 (missing or extra blocks)
    if (userSequence.length !== sequence.length) {
      return 'F2';
    }

    // Check if user clicked all correct blocks but in wrong order
    const sequenceSet = new Set(sequence);
    const userSet = new Set(userSequence);

    // If same set of unique blocks (all correct blocks clicked)
    if (sequenceSet.size === userSet.size && [...sequenceSet].every(block => userSet.has(block))) {
      // Same blocks but since we're here it's wrong order = F1 (sequencing error)
      return 'F1';
    }

    // Different set of blocks = F2 (wrong blocks clicked)
    return 'F2';
  };

  // Check if the user's sequence matches the target sequence
  const checkResult = (userSeq, totalResponseTime) => {
    const isCorrect = userSeq.every((blockId, index) => blockId === sequence[index]);

    // Handle practice mode separately
    if (isPractice) {
      if (isCorrect) {
        showOverlayMessage('practice_correct', 4000, 'success');
        setTimeout(() => {
          if (isFullscreen) {
            exitFullscreen();
          }
          setGameState('practiceComplete');
        }, 4200);
      } else {
        showOverlayMessage('practice_incorrect_retry', 4000, 'error');
        setTimeout(() => {
          startPractice(); // Retry practice
        }, 4200);
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

    // Classify error type if incorrect
    const errorType = isCorrect ? null : classifyError(sequence, userSeq);

    const roundResults = {
      level,
      success: isCorrect,
      isReplacementTrial,
      sequenceIndex: sequenceIndexInLevel,
      errorType, // F1, F2, or null if success
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
    setResults(prev => [...prev, { level, success: isCorrect, responseTime: totalResponseTime, isReplacementTrial }]);

    if (isCorrect) {
      // Success - reset consecutive failures counter
      console.log(`✅ Success! Resetting consecutive failures counter. Level ${level}, Sequence ${sequenceIndexInLevel + 1}/4`);
      setConsecutiveFailures(0);
      setScore(prevScore => prevScore + level);

      // Track success for this level
      setSuccessesPerLevel(prev => ({
        ...prev,
        [level]: (prev[level] || 0) + 1
      }));

      // If replacement trial, clear the flag
      if (isReplacementTrial) {
        setIsReplacementTrial(false);
      }

      showOverlayMessage('correct_feedback', 3000, 'success');

      // Move to next sequence or next level
      const nextSeqIndex = sequenceIndexInLevel + 1;

      setTimeout(() => {
        if (nextSeqIndex >= 4) {
          // Completed all 4 sequences at this level - move to next level
          const successCount = (successesPerLevel[level] || 0) + 1;
          console.log(`📊 Level ${level} completed with ${successCount}/4 successes`);

          if (level >= 8) {
            // Reached maximum level
            console.log(`🎉 Test completed at max level ${level}`);
            finishTest(updatedRoundData, true);
          } else {
            showOverlayMessage('level_completed', 3000, 'success');
            setTimeout(() => {
              setLevel(prev => prev + 1);
              setSequenceIndexInLevel(0);
              startGame(level + 1, 0);
            }, 3200);
          }
        } else {
          // Continue with next sequence at same level
          setSequenceIndexInLevel(nextSeqIndex);
          startGame(level, nextSeqIndex);
        }
      }, 3200);
    } else {
      // Failure - increment error counters and consecutive failures
      const newConsecutiveFailures = consecutiveFailures + 1;
      console.log(`❌ Failure! Type: ${errorType}, Consecutive failures: ${newConsecutiveFailures}/3`);

      // Increment appropriate error counter
      if (errorType === 'F1') {
        setErrorCountF1(prev => prev + 1);
      } else if (errorType === 'F2') {
        setErrorCountF2(prev => prev + 1);
      }

      setConsecutiveFailures(newConsecutiveFailures);

      // If replacement trial, clear the flag
      if (isReplacementTrial) {
        setIsReplacementTrial(false);
      }

      // Check if 3 consecutive failures
      if (newConsecutiveFailures >= 3) {
        showOverlayMessage('three_consecutive_failures', 3000, 'error');
        setTimeout(() => {
          finishTest(updatedRoundData, false);
        }, 3200);
      } else {
        // Move to next sequence in level or next level
        const nextSeqIndex = sequenceIndexInLevel + 1;

        if (nextSeqIndex >= 4) {
          // Completed all 4 sequences at this level - move to next level
          const successCount = successesPerLevel[level] || 0;
          console.log(`📊 Level ${level} completed with ${successCount}/4 successes`);

          showOverlayMessage('level_completed', 3000, 'info');
          setTimeout(() => {
            setLevel(prev => prev + 1);
            setSequenceIndexInLevel(0);
            startGame(level + 1, 0);
          }, 3200);
        } else {
          // Continue with next sequence at same level
          showOverlayMessage('incorrect_retry', 3000, 'error');
          setTimeout(() => {
            setSequenceIndexInLevel(nextSeqIndex);
            startGame(level, nextSeqIndex);
          }, 3200);
        }
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

    showOverlayMessage(overlayMsg, 4000);
    setFeedback(finishMessage);

    if (assignmentId) {
      console.log("Test finished, attempting submission.");
      const ubs = calculateCorsiSpan(); // UBS = Corsi Span
      const finalTestData = {
        corsiSpan: ubs,
        ubs, // UBS (same value as corsiSpan)
        totalScore: score,
        errorCountF1, // Sequencing errors
        errorCountF2, // Wrong/missing blocks
        rounds: updatedRoundData,
        settingsUsed: { ...settings },
        completedSuccessfully,
        consecutiveFailures,
        successesPerLevel
      };
      onComplete(finalTestData);
    } else {
      console.log("Test finished (Standalone), showing results locally.");
    }

    setTimeout(() => {
      setGameState('results');
    }, 4200);
  };

  // Calculate Corsi span (highest level with 2+ successes out of 4)
  const calculateCorsiSpan = () => {
    // Find the highest level where we got 2 or more successes
    const levelsWithSuccess = Object.entries(successesPerLevel)
      .filter(([_, successCount]) => successCount >= 2)
      .map(([levelStr, _]) => parseInt(levelStr, 10));

    return levelsWithSuccess.length ? Math.max(...levelsWithSuccess) : 0;
  };

  // Reset the game
  const resetGame = () => {
    setLevel(3); // Start with 3-length sequences
    setScore(0);
    setResults([]);
    setRoundData([]);
    setGameState('welcome');
    // Reset sequence tracking
    setSequenceIndexInLevel(0);
    setIsReplacementTrial(false);
    setReplacementSequence([]);
    setConsecutiveFailures(0);
    setSuccessesPerLevel({});
    setSkipUsedPerLevel({});
    setErrorCountF1(0);
    setErrorCountF2(0);
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
                    <button className={styles.primaryButton} onClick={() => {
                      // Reset all tracking variables before starting real test
                      setLevel(3);
                      setSequenceIndexInLevel(0);
                      setConsecutiveFailures(0);
                      setSuccessesPerLevel({});
                      setSkipUsedPerLevel({});
                      setErrorCountF1(0);
                      setErrorCountF2(0);
                      setScore(0);
                      setResults([]);
                      setRoundData([]);
                      startGame(3, 0);
                    }}>
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

              {/* Skip button (only during input phase, not during practice) */}
              {gameState === 'input' && !isPractice && (
                <button
                  className={styles.skipButton}
                  onClick={handleSkip}
                  aria-label={translate('skip_button')}
                >
                  {translate('skip_button')}
                </button>
              )}
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && isStandalone && roundData && (
                <DetailedResults
                    roundData={roundData}
                    corsiSpan={calculateCorsiSpan}
                    ubs={calculateCorsiSpan()} // UBS (same as corsiSpan)
                    errorCountF1={errorCountF1}
                    errorCountF2={errorCountF2}
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
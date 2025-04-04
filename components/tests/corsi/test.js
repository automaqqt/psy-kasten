// components/CorsiTest.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from '../../../styles/CorsiTest.module.css';
import SettingsPanel from '../../settings/corsi';
import DetailedResults from '../../results/corsi';

export default function CorsiTest({ assignmentId, onComplete, isStandalone }) {
  const [blocks, setBlocks] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [gameState, setGameState] = useState('welcome'); // welcome, settings, showing, input, results
  const [level, setLevel] = useState(2);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(3);
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
  const boardRef = useRef(null);
  const canvasSize = useRef(null);
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
  
  // Initialize blocks with more spacing and randomness
  useEffect(() => {
    const initialBlocks = [];
    
    // Create a grid with more space between blocks
    const gridDivisions = 4; // 4x4 grid to place 9 blocks
    const padding = 5; // Padding from edges in percentage
    
    for (let i = 0; i < 9; i++) {
      // More random positioning within grid cells
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      // Calculate base position with more spacing
      const baseX = col * (100 - 2 * padding) / (gridDivisions - 1) + padding;
      const baseY = row * (100 - 2 * padding) / (gridDivisions - 1) + padding;
      
      // Add randomness within the cell
      const randomX = (Math.random() - 0.5) * 15;
      const randomY = (Math.random() - 0.5) * 15;
      
      initialBlocks.push({
        id: i,
        x: `${Math.max(padding, Math.min(100 - padding - 15, baseX + randomX))}%`,
        y: `${Math.max(padding, Math.min(100 - padding - 15, baseY + randomY))}%`,
        active: false,
        clicked: false,
      });
    }
    setBlocks(initialBlocks);
  }, []);

  useEffect(() => {
    // Apply contrast and blink settings
    document.documentElement.style.setProperty('--block-color', `hsl(214, 40%, ${30 + settings.blockContrast * 0.2}%)`);
    document.documentElement.style.setProperty('--highlight-color', `hsl(48, 100%, ${30 + settings.blockBlinkIntensity * 0.5}%)`);
  }, [settings.blockContrast, settings.blockBlinkIntensity]);

  // Generate a new sequence for the current level
  const generateSequence = useCallback(() => {
    const newSequence = [];
    for (let i = 0; i < level; i++) {
      let nextBlock;
      do {
        nextBlock = Math.floor(Math.random() * 9);
      } while (newSequence.includes(nextBlock));
      
      newSequence.push(nextBlock);
    }
    return newSequence;
  }, [level]);

  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((text, duration = 1500) => {
    setMessage(text);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  }, []);

  // Show the sequence to the user
  const displaySequence = useCallback(async (seq) => {
    setShowingSequence(true);
    
    // Show brief message
    showOverlayMessage('Watch carefully...', 1000);
    
    // Create a promise that resolves after showing the full sequence
    return new Promise((resolve) => {
      const showBlock = async (index) => {
        if (index >= seq.length) {
          setTimeout(() => {
            setShowingSequence(false);
            setGameState('input');
            setRoundStartTime(Date.now()); // Start timing for user input
            setClickTimes([]);
            showOverlayMessage('Your turn!', 800);
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
  }, [settings.blockHighlightDuration, settings.intervalBetweenBlocks, showOverlayMessage]);

  // Start a new round
  const startGame = useCallback(async () => {
    // Reset game state
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
      const newSequence = generateSequence();
      setSequence(newSequence);
      setGameState('showing');
      displaySequence(newSequence);
      clearInterval(countdownInterval);
    }, 3000);
  }, [displaySequence, generateSequence]);

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
      showOverlayMessage('Correct! Level up!', 1200);
      setFeedback('Correct! Moving to next level.');
      setScore(prevScore => prevScore + level);
      setResults(prev => [...prev, { level, success: true, responseTime: totalResponseTime }]);
      
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        startGame();
      }, 1500);
    } else {
      showOverlayMessage('Incorrect sequence. Game over.', 1500);
      setFeedback('Incorrect sequence. Game over.');
      if (assignmentId) {
        console.log("Test finished, attempting submission.");
        const finalTestData = {
          corsiSpan: calculateCorsiSpan(updatedRoundData),
          totalScore: score, // Final score *before* the failed attempt
          rounds: updatedRoundData,
          settingsUsed: { ...settings },
          // Add any other summary info
      };
        onComplete(finalTestData);
        // Don't immediately set gameState to finished here, wait for parent ack?
        // Or assume parent shows loading/completion state.
        // For simplicity, we can set internal state now, parent handles overlay msgs
      } else {
          console.log("Test finished (Standalone), showing results locally.");
      }
      

      setResults(prev => [...prev, { level, success: false, responseTime: totalResponseTime }]);
      
      setTimeout(() => {
        setGameState('results');
      }, 1500);
    }
  };

  // Calculate Corsi span (highest level completed successfully)
  const calculateCorsiSpan = () => {
    // Find the highest level where success is true
    const successfulLevels = results.filter(r => r.success).map(r => r.level);
    return successfulLevels.length ? Math.max(...successfulLevels) : 0;
  };

  // Reset the game
  const resetGame = () => {
    setLevel(2);
    setScore(0);
    setResults([]);
    setRoundData([]);
    setGameState('welcome');
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Corsi Block-Tapping Test</h1>
          
          {(gameState === 'showing' || gameState === 'input') && (
            <div className={styles.gameMetrics}>
              <div className={styles.levelIndicator}>
                Level: <span className={styles.metricValue}>{level}</span>
              </div>
              <div className={styles.scoreIndicator}>
                Score: <span className={styles.metricValue}>{score}</span>
              </div>
              <button 
                className={styles.iconButton}
                onClick={() => {
                  if (gameState === 'input' && !showingSequence) {
                    setShowSettings(true);
                  }
                }}
                disabled={gameState === 'showing' || showingSequence}
                title="Adjust settings"
                aria-label="Settings"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.gameArea}>
          {/* Welcome screen */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>Welcome to the Corsi Block-Tapping Test</h2>
              <p>
                This test assesses your visuo-spatial short-term working memory. You will be shown a sequence of blocks that light up, and you'll need to repeat the sequence by clicking on the blocks in the same order.
              </p>
              <p>
                The test starts with a sequence of 2 blocks and gets progressively harder. Your Corsi Span is the longest sequence you can correctly remember.
              </p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startGame}>
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
            </div>
          )}
          
          {/* Countdown */}
          {gameState === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownContent}>
                <h2>Get Ready</h2>
                <div className={styles.countdownNumber}>{countdown}</div>
                <p>Watch the sequence carefully</p>
              </div>
            </div>
          )}
          
          {/* Game board (visible during 'showing' and 'input' states) */}
          {(gameState === 'showing' || gameState === 'input') && (
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
              
              {/* Progress indicator */}
              <div className={styles.progressIndicator}>
                {userSequence.length} / {sequence.length}
              </div>
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && (
            <div className={styles.resultsCard}>
              <h2>Test Results</h2>
              <div className={styles.resultsSummary}>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Your Corsi Span</div>
                  <div className={styles.statValue}>{calculateCorsiSpan()}</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Total Score</div>
                  <div className={styles.statValue}>{score}</div>
                </div>
              </div>
              
              <DetailedResults 
                roundData={roundData} 
                calculateCorsiSpan={calculateCorsiSpan} 
              />
              
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={resetGame}>
                  Try Again
                </button>
                
                <Link href="/">
                  <div className={styles.secondaryButton}>
                    Back to Home
                  </div>
                </Link>
              </div>
            </div>
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
          <SettingsPanel 
            settings={settings} 
            setSettings={setSettings} 
            onClose={() => setShowSettings(false)}
          />
        )}
        
        <footer className={styles.footer}>
          <p>
            The Corsi block-tapping test was developed in the early 1970s to assess visuo-spatial short term working memory.
            
          </p>
        </footer>
      </div>
    </div>
  );
}
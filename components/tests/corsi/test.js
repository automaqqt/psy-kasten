// components/CorsiTest.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/CorsiTest.module.css';
import SettingsPanel from '../../settings/corsi';
import DetailedResults from '../../results/corsi';
import Footer from '../../ui/footer';

export default function CorsiTest({ assignmentId, onComplete, isStandalone, t }) {
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
  const translate = t || ((key) => key);
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
  const showOverlayMessage = useCallback((textKey, duration = 1500) => {
    setMessage(translate(textKey)); // Use translation key
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
      setFeedback(translate('correct_feedback'));
      setScore(prevScore => prevScore + level);
      showOverlayMessage('correct_feedback', 1200);
      setResults(prev => [...prev, { level, success: true, responseTime: totalResponseTime }]);
      
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        startGame();
      }, 1500);
    } else {
      const finishMessage = `${translate('incorrect_feedback')} ${translate('test_finished')}`;
       // Construct message for overlay
       const overlayMsg = isStandalone ? `${finishMessage} (${translate('common:results_not_saved_standalone')})` : `${finishMessage} (${translate('common:submitting')})`;
      showOverlayMessage(overlayMsg, 2000); // Show combined message
      setFeedback(finishMessage); // Set feedback state
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
        
        <div className={styles.gameArea}>
           {gameState === 'welcome' && (
              <div className={styles.welcomeCard}>
                 <h2>{translate('welcome_title')}</h2>
                 <p>{translate('welcome_p1')}</p>
                 <p>{translate('welcome_p2')}</p>
                 <p>{translate('welcome_p3')}</p>
                 <div className={styles.buttonContainer}>
                    <button className={styles.primaryButton} onClick={startGame}>
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
                   <div className={styles.message}>{message}</div>
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
// components/PVTTest.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../styles/PVT.module.css';
import SettingsPanel from '../settings/corsi';
import DetailedResults from '../results/pvt';

export default function PVTTest() {
  // Main state management
  const [gameState, setGameState] = useState('welcome'); // welcome, countdown, waiting, stimulus, falseStart, results
  const [settings, setSettings] = useState({
    testDuration: 300, // seconds
    minInterval: 2000, // milliseconds
    maxInterval: 10000, // milliseconds
    countdownTimer: 3, // seconds
    stimulusColor: '#ff0000', // red
    backgroundColor: '#ffffff', // white
  });
  
  // Test state
  const [trials, setTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [stimulusShown, setStimulusShown] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  
  // Refs for timers
  const intervalRef = useRef(null);
  const testTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const stimulusRef = useRef(null);
  
  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((text, duration = 1500) => {
    setMessage(text);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  }, []);
  
  // Initialize test based on settings
  const startTest = useCallback(() => {
    // Reset state for new test
    setTrials([]);
    setFalseStarts(0);
    setGameState('countdown');
    setCountdown(settings.countdownTimer);
    
    // Clear any existing timers
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState('waiting');
          const now = Date.now();
          setTestStartTime(now);
          setTestTimeRemaining(settings.testDuration);
          
          showOverlayMessage('Wait for the red stimulus...', 1500);
          
          // Start test timer
          testTimerRef.current = setInterval(() => {
            setTestTimeRemaining(prev => {
              const remaining = Math.max(0, prev - 1);
              if (remaining <= 0) {
                clearInterval(testTimerRef.current);
                endTest();
              }
              return remaining;
            });
          }, 1000);
          
          // Ensure we schedule first stimulus
          setTimeout(() => {
            if (gameState === 'waiting' && !intervalRef.current) {
              console.log('Ensuring first stimulus is scheduled');
              scheduleNextStimulus();
            }
          }, 1500); // After the overlay message disappears
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings, showOverlayMessage, gameState]);
  
  // Schedule a stimulus to appear after a random interval
  const scheduleNextStimulus = useCallback(() => {
    // Clear any existing timers
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    
    // Check if test is still running
    if (testTimeRemaining <= 0) {
      return;
    }
    
    // Generate random interval between min and max
    const randomInterval = 
      Math.floor(Math.random() * (settings.maxInterval - settings.minInterval)) + settings.minInterval;
    
    console.log(`Scheduling stimulus to appear in ${randomInterval}ms`);
    
    // Set the game state to waiting (for stimulus)
    setGameState('waiting');
    setStimulusShown(false);
    
    // Create new trial object
    const newTrial = {
      trialNumber: trials.length + 1,
      intervalTime: randomInterval,
      startTime: Date.now(),
      reactionTime: null,
      falseStart: false
    };
    
    setCurrentTrial(newTrial);
    
    // Schedule the stimulus to appear
    intervalRef.current = setTimeout(() => {
      // Ensure that only one setTimeout is running and active
      intervalRef.current = null;
      
      // Check again if test is still running
      if (testTimeRemaining <= 0) {
        return;
      }
      
      // Show stimulus and record start time
      console.log('Showing stimulus now');
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
        setElapsedTime(prev => Date.now() - now);
      }, 10);
    }, randomInterval);
  }, [settings.maxInterval, settings.minInterval, testTimeRemaining, trials.length]);
  
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
      setTrials(prevTrials => [...prevTrials, completedTrial]);
      
      // Provide feedback
      showOverlayMessage(`Reaction time: ${reactionTime}ms`, 800);
      
      // Reset and schedule next stimulus
      setStimulusShown(false);
      
      // Ensure next stimulus is scheduled
      setTimeout(() => {
        if (!intervalRef.current && testTimeRemaining > 0) {
          console.log('Scheduling next stimulus after response');
          scheduleNextStimulus();
        }
      }, 800); // After feedback message disappears
      
    } else if (gameState === 'waiting') {
      // Record false start
      setFalseStarts(prev => prev + 1);
      
      // Add false start to trials
      const falseStartTrial = {
        trialNumber: trials.length + 1,
        falseStart: true,
        startTime: Date.now()
      };
      
      setTrials(prevTrials => [...prevTrials, falseStartTrial]);
      
      // Show feedback briefly
      setGameState('falseStart');
      showOverlayMessage('Too early! Wait for the red stimulus.', 1000);
      
      // Clear any existing scheduled stimulus
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Schedule next stimulus after false start feedback
      setTimeout(() => {
        if (testTimeRemaining > 0) {
          console.log('Scheduling stimulus after false start');
          scheduleNextStimulus();
        }
      }, 1000);
    }
  }, [gameState, scheduleNextStimulus, startTime, stimulusShown, currentTrial, trials.length, showOverlayMessage, testTimeRemaining]);
  
  // Handle key presses for response
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((gameState === 'stimulus' || gameState === 'waiting') && 
          (e.code === 'Space' || e.key === ' ')) {
        handleResponse();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState, handleResponse]);
  
  // End the test
  const endTest = useCallback(() => {
    // Clear all timers
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
    
    showOverlayMessage('Test complete!', 1500);
    
    setTimeout(() => {
      setGameState('results');
    }, 1500);
  }, [showOverlayMessage]);
  
  // Stop the test early
  const stopTest = () => {
    if (gameState !== 'welcome' && gameState !== 'results') {
      // Clear any existing timers
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
      
      showOverlayMessage('Test stopped', 1000);
      setTimeout(() => {
        endTest();
      }, 1000);
    }
  };
  
  // Reset the test
  const resetTest = () => {
    // Clear all timers
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
    
    setGameState('welcome');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    };
  }, []);
  
  // Debug effect to ensure stimulus is always scheduled in waiting state
  useEffect(() => {
    if (gameState === 'waiting' && !intervalRef.current && testTimeRemaining > 0) {
      console.log('Safety check: Stimulus not scheduled in waiting state - scheduling now');
      scheduleNextStimulus();
    }
  }, [gameState, testTimeRemaining, scheduleNextStimulus]);
  
  // Format time as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate summary statistics for display
  const calculateStats = () => {
    const validTrials = trials.filter(t => t.reactionTime && !t.falseStart);
    
    if (validTrials.length === 0) {
      return {
        meanRT: 0,
        medianRT: 0,
        fastestRT: 0,
        slowestRT: 0,
        totalTrials: trials.length,
        validTrials: 0,
        falseStarts: falseStarts
      };
    }
    
    const reactionTimes = validTrials.map(t => t.reactionTime);
    const meanRT = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;
    
    // Sort for median and min/max
    const sortedRTs = [...reactionTimes].sort((a, b) => a - b);
    const medianRT = sortedRTs[Math.floor(sortedRTs.length / 2)];
    const fastestRT = sortedRTs[0];
    const slowestRT = sortedRTs[sortedRTs.length - 1];
    
    return {
      meanRT,
      medianRT,
      fastestRT,
      slowestRT,
      totalTrials: trials.length,
      validTrials: validTrials.length,
      falseStarts
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Psychomotor Vigilance Test (PVT)</h1>
          
          {(gameState === 'waiting' || gameState === 'stimulus' || gameState === 'falseStart') && (
            <div className={styles.gameMetrics}>
              <div className={styles.timeIndicator}>
                Time: <span className={styles.metricValue}>{formatTime(testTimeRemaining)}</span>
              </div>
              <div className={styles.trialIndicator}>
                Trials: <span className={styles.metricValue}>{trials.length}</span>
              </div>
              <button 
                className={styles.iconButton}
                onClick={stopTest}
                title="Stop test"
                aria-label="Stop test"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.gameArea}>
          {/* Welcome screen */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>Welcome to the Psychomotor Vigilance Test</h2>
              <p>
                This test measures your reaction time and sustained attention. You'll need to respond as quickly as possible when a visual stimulus appears on screen.
              </p>
              <p>
                Press the SPACE BAR or click the screen as soon as you see the red stimulus appear. Try to avoid responding before the stimulus appears (false starts).
              </p>
              <p>
                The test will take approximately {settings.testDuration / 60} minutes to complete.
              </p>
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
                  <a className={styles.link}>Back to home</a>
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
                <p>Press SPACE BAR or click when you see the red stimulus</p>
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
                  <p className={styles.instructions}>Wait for the red color...</p>
                )}
                {gameState === 'stimulus' && (
                  <p className={styles.instructions}>PRESS SPACE NOW!</p>
                )}
                {gameState === 'falseStart' && (
                  <p className={styles.instructions}>Too early! Wait for the signal.</p>
                )}
                
                {gameState === 'stimulus' && (
                  <div className={styles.elapsedTime}>
                    {elapsedTime}ms
                  </div>
                )}
              </div>
              
              <div className={styles.instructions}>
                <p>Press SPACE BAR or click when the box turns red</p>
              </div>
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && (
            <div className={styles.resultsCard}>
              <h2>PVT Results</h2>
              
              <div className={styles.resultsSummary}>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Mean Reaction Time</div>
                  <div className={styles.statValue}>{Math.round(calculateStats().meanRT)} ms</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Median Reaction Time</div>
                  <div className={styles.statValue}>{Math.round(calculateStats().medianRT)} ms</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Fastest Response</div>
                  <div className={styles.statValue}>{Math.round(calculateStats().fastestRT)} ms</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Slowest Response</div>
                  <div className={styles.statValue}>{Math.round(calculateStats().slowestRT)} ms</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Valid Trials</div>
                  <div className={styles.statValue}>{calculateStats().validTrials}</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>False Starts</div>
                  <div className={styles.statValue}>{calculateStats().falseStarts}</div>
                </div>
              </div>
              
              <DetailedResults 
                trials={trials}
                falseStarts={falseStarts}
              />
              
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={resetTest}>
                  Try Again
                </button>
                
                <Link href="/">
                  <a className={styles.secondaryButton}>
                    Back to Home
                  </a>
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
            isPVT={true}
          />
        )}
        
        <footer className={styles.footer}>
          <p>
            The Psychomotor Vigilance Test (PVT) is used to measure sustained attention and reaction time.
          </p>
        </footer>
      </div>
    </div>
  );
}
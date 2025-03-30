// pages/pvt.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import SettingsPanel from '../components/SettingsPanel';
import PVTResults from '../components/PVTResults';

export default function PVT() {
  // State management
  const [gameState, setGameState] = useState('welcome'); // welcome, settings, ready, stimulus, waiting, results
  const [settings, setSettings] = useState({
    testDuration: 300, // seconds
    minInterval: 2000, // milliseconds
    maxInterval: 10000, // milliseconds
    countdownTimer: 3, // seconds
    stimulusColor: '#ff0000', // red
    backgroundColor: '#ffffff', // white
  });
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stimulusShown, setStimulusShown] = useState(false);
  const [falseStarts, setFalseStarts] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  
  const stimulusRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const testTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  
  // Initialize test based on settings
  const startTest = useCallback(() => {
    // Reset state for new test
    setTrials([]);
    setFalseStarts(0);
    setGameState('countdown');
    setCountdown(settings.countdownTimer);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState('waiting');
          const now = Date.now();
          setTestStartTime(now);
          setTestTimeRemaining(settings.testDuration);
          
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
          
          // Schedule first stimulus
          scheduleNextStimulus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings]);
  
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
    console.log(`Scheduling stimulus to appear in ${randomInterval}ms`);
    intervalRef.current = setTimeout(() => {
      // Show stimulus and record start time
      if (testTimeRemaining > 0) {
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
          setElapsedTime(Date.now() - now);
        }, 10);
      }
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
      
      console.log(`Response received with RT: ${reactionTime}ms`);
      
      // Update current trial with reaction time
      const completedTrial = {
        ...currentTrial,
        reactionTime,
        endTime
      };
      
      // Add to trials array
      setTrials(prevTrials => [...prevTrials, completedTrial]);
      
      // Reset and schedule next stimulus
      setStimulusShown(false);
      scheduleNextStimulus();
    } else if (gameState === 'waiting') {
      // Record false start
      console.log('False start detected');
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
      setTimeout(() => {
        scheduleNextStimulus();
      }, 1000);
    }
  }, [gameState, scheduleNextStimulus, startTime, stimulusShown, currentTrial, trials.length]);
  
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
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    
    setGameState('results');
  }, []);
  
  // Stop the test early
  const stopTest = () => {
    if (gameState !== 'welcome' && gameState !== 'results') {
      endTest();
    }
  };
  
  // Reset the test
  const resetTest = () => {
    // Clear all timers
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    
    setGameState('welcome');
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (testTimerRef.current) clearInterval(testTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);
  
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
  
  // Debug logging
  useEffect(() => {
    console.log(`Current game state: ${gameState}`);
    console.log(`Stimulus shown: ${stimulusShown}`);
    if (currentTrial) {
      console.log(`Current trial: `, currentTrial);
    }
  }, [gameState, stimulusShown, currentTrial]);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Psychomotor Vigilance Test (PVT)</title>
        <meta name="description" content="A digital implementation of the Psychomotor Vigilance Test (PVT)" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Psychomotor Vigilance Test (PVT)
        </h1>
        
        {gameState === 'welcome' && (
          <div className={styles.card}>
            <h2>Welcome to the Psychomotor Vigilance Test</h2>
            <p>
              This test measures your reaction time and sustained attention. You'll need to respond as quickly as possible when a visual stimulus appears on screen.
            </p>
            <p>
              Press the SPACE BAR as soon as you see the red stimulus appear. Try to avoid responding before the stimulus appears (false starts).
            </p>
            <p>
              The test will take approximately {settings.testDuration / 60} minutes to complete.
            </p>
            <div className={styles.buttonContainer}>
              <button className={styles.button} onClick={startTest}>
                Start Test
              </button>
              <button 
                className={`${styles.button} ${styles.secondaryButton}`} 
                onClick={() => setShowSettings(true)}
              >
                Adjust Settings
              </button>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link href="/">
                <a className={styles.link}>Try Corsi Block Test</a>
              </Link>
              <Link href="/cpt">
                <a className={styles.link} style={{ marginLeft: '1rem' }}>Try CPT Test</a>
              </Link>
            </div>
          </div>
        )}
        
        {showSettings && (
          <div className={styles.modalOverlay}>
            <SettingsPanel 
              settings={settings} 
              setSettings={setSettings} 
              onClose={() => setShowSettings(false)}
              isPVT={true}
            />
          </div>
        )}
        
        {gameState === 'countdown' && (
          <div className={styles.countdown}>
            <h2>Get Ready</h2>
            <div className={styles.countdownNumber}>{countdown}</div>
            <p>Press SPACE BAR when you see the red stimulus</p>
          </div>
        )}
        
        {(gameState === 'waiting' || gameState === 'stimulus' || gameState === 'falseStart') && (
          <div className={styles.pvtContainer}>
            <div className={styles.pvtHeader}>
              <div className={styles.pvtTimer}>
                Time Remaining: {formatTime(testTimeRemaining)}
              </div>
              <div className={styles.pvtTrials}>
                Trials: {trials.length}
              </div>
              <button 
                className={`${styles.iconButton} ${styles.stopButton}`}
                onClick={stopTest}
                title="Stop test"
              >
                ⏹️
              </button>
            </div>
            
            <div 
              className={styles.pvtStimulus}
              ref={stimulusRef}
              onClick={handleResponse}
              style={{ 
                backgroundColor: gameState === 'stimulus' ? settings.stimulusColor : 
                                 gameState === 'falseStart' ? '#ffcc00' : settings.backgroundColor,
                cursor: 'pointer'
              }}
            >
              {gameState === 'waiting' && <p className={styles.pvtInstructions}>Wait for the red color...</p>}
              {gameState === 'stimulus' && <p className={styles.pvtInstructions}>PRESS SPACE NOW!</p>}
              {gameState === 'falseStart' && <p className={styles.pvtInstructions}>Too early! Wait for the signal.</p>}
            </div>
            
            <div className={styles.pvtFooter}>
              <p>Press SPACE BAR or click the box when it turns red</p>
              {gameState === 'stimulus' && (
                <p className={styles.pvtElapsed}>
                  Elapsed: {elapsedTime}ms
                </p>
              )}
            </div>
          </div>
        )}
        
        {gameState === 'results' && (
          <div className={styles.resultsCard}>
            <h2>PVT Results</h2>
            
            <div className={styles.pvtSummary}>
              <div className={styles.pvtStat}>
                <h3>Mean Reaction Time</h3>
                <p>{Math.round(calculateStats().meanRT)} ms</p>
              </div>
              <div className={styles.pvtStat}>
                <h3>Median Reaction Time</h3>
                <p>{Math.round(calculateStats().medianRT)} ms</p>
              </div>
              <div className={styles.pvtStat}>
                <h3>Fastest Response</h3>
                <p>{Math.round(calculateStats().fastestRT)} ms</p>
              </div>
              <div className={styles.pvtStat}>
                <h3>Slowest Response</h3>
                <p>{Math.round(calculateStats().slowestRT)} ms</p>
              </div>
              <div className={styles.pvtStat}>
                <h3>Total Trials</h3>
                <p>{calculateStats().validTrials}</p>
              </div>
              <div className={styles.pvtStat}>
                <h3>False Starts</h3>
                <p>{calculateStats().falseStarts}</p>
              </div>
            </div>
            
            <PVTResults 
              trials={trials}
              falseStarts={falseStarts}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
              <button className={styles.button} onClick={resetTest}>
                Try Again
              </button>
              
              <div className={styles.buttonContainer} style={{ marginTop: '0.5rem' }}>
                <Link href="/">
                  <a className={`${styles.button} ${styles.secondaryButton}`} style={{ width: '48%' }}>
                    Corsi Block Test
                  </a>
                </Link>
                <Link href="/cpt">
                  <a className={`${styles.button} ${styles.secondaryButton}`} style={{ width: '48%' }}>
                    CPT Test
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          The Psychomotor Vigilance Test (PVT) is used to measure sustained attention and reaction time.
          <Link href="/about-pvt">
            <a className={styles.link} style={{ marginLeft: '0.5rem' }}>Learn more</a>
          </Link>
        </p>
      </footer>
    </div>
  );
}
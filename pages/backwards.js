// pages/backward.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function BackwardCorsi() {
  const [blocks, setBlocks] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [gameState, setGameState] = useState('welcome'); // welcome, showing, input, results
  const [level, setLevel] = useState(2);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const boardRef = useRef(null);
  
  // Initialize blocks
  useEffect(() => {
    const initialBlocks = [];
    for (let i = 0; i < 9; i++) {
      // Generate semi-random positions that don't overlap
      const x = (i % 3) * 33 + Math.random() * 10;
      const y = Math.floor(i / 3) * 33 + Math.random() * 10;
      
      initialBlocks.push({
        id: i,
        x: `${x}%`,
        y: `${y}%`,
        active: false,
        clicked: false,
      });
    }
    setBlocks(initialBlocks);
  }, []);

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
          }, 300);
        }, 700);
      };
      
      showBlock(0);
    });
  }, []);

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
        checkResult(newUserSequence);
      }
    }, 300);
  };

  // Check if the user's sequence matches the target sequence (in reverse order)
  const checkResult = (userSeq) => {
    // Create a reversed copy of the sequence for backward Corsi
    const reversedSequence = [...sequence].reverse();
    
    const isCorrect = userSeq.every((blockId, index) => blockId === reversedSequence[index]);
    
    if (isCorrect) {
      setFeedback('Correct! Moving to next level.');
      setScore(prevScore => prevScore + level);
      setResults(prev => [...prev, { level, success: true }]);
      
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        startGame();
      }, 1500);
    } else {
      setFeedback('Incorrect sequence. Game over.');
      setResults(prev => [...prev, { level, success: false }]);
      setGameState('results');
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
    setGameState('welcome');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Backward Corsi Block-Tapping Test</title>
        <meta name="description" content="A digital implementation of the Backward Corsi Block-Tapping Test" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Backward Corsi Block-Tapping Test
        </h1>
        
        {gameState === 'welcome' && (
          <div className={styles.card}>
            <h2>Welcome to the Backward Corsi Block-Tapping Test</h2>
            <p>
              This test assesses your visuo-spatial short-term working memory. You will be shown a sequence of blocks that light up, and you'll need to repeat the sequence in <strong>reverse order</strong> by clicking on the blocks.
            </p>
            <p>
              The test starts with a sequence of 2 blocks and gets progressively harder. Your Backward Corsi Span is the longest sequence you can correctly remember in reverse.
            </p>
            <button className={styles.button} onClick={startGame}>
              Start Test
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link href="/">
                <a className={styles.link}>Try Forward Version</a>
              </Link>
            </div>
          </div>
        )}
        
        {gameState === 'countdown' && (
          <div className={styles.countdown}>
            <h2>Get Ready</h2>
            <div className={styles.countdownNumber}>{countdown}</div>
            <p>Watch the sequence carefully</p>
          </div>
        )}
        
        {(gameState === 'showing' || gameState === 'input') && (
          <>
            <div className={styles.gameInfo}>
              <div className={styles.levelIndicator}>
                Level: {level} 
                <span className={styles.smallText}> (Sequence length)</span>
              </div>
              <div className={styles.scoreIndicator}>
                Score: {score}
              </div>
            </div>
            
            <div className={styles.instructions}>
              {showingSequence 
                ? "Watch the sequence..." 
                : gameState === 'showing' 
                  ? "Preparing sequence..." 
                  : "Now repeat the sequence in REVERSE order by clicking the blocks"}
            </div>
            
            <div 
              className={styles.board}
              ref={boardRef}
              style={{ position: 'relative', pointerEvents: showingSequence ? 'none' : 'auto' }}
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
                />
              ))}
            </div>
            
            {feedback && <div className={styles.feedback}>{feedback}</div>}
            
            <div className={styles.progress}>
              {userSequence.length} / {sequence.length}
            </div>
          </>
        )}
        
        {gameState === 'results' && (
          <div className={styles.resultsCard}>
            <h2>Test Results</h2>
            <p className={styles.resultsScore}>Your Backward Corsi Span: {calculateCorsiSpan()}</p>
            <p>Total Score: {score}</p>
            
            <div className={styles.resultsList}>
              <h3>Level Progress:</h3>
              {results.map((result, index) => (
                <div key={index} className={styles.resultItem}>
                  <span>Level {result.level}: </span>
                  <span className={result.success ? styles.success : styles.failure}>
                    {result.success ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
            
            <p className={styles.infoText}>
              The backward Corsi block test measures your ability to hold and manipulate spatial information in working memory.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className={styles.button} onClick={resetGame}>
                Try Again
              </button>
              
              <Link href="/">
                <a className={`${styles.button} ${styles.secondaryButton}`}>
                  Forward Corsi Test
                </a>
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Unlike the digit span task, the backward Corsi test is not significantly harder than the forward version for typical adults.
          <Link href="/about">
            <a className={styles.link} style={{ marginLeft: '0.5rem' }}>Learn more</a>
          </Link>
        </p>
      </footer>
    </div>
  );
}
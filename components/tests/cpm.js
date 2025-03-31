// components/PatternMatrixTest.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from '../../styles/PatternMatrixTest.module.css';
import SettingsPanel from '../settings/corsi';

export default function PatternMatrixTest() {
  const [gameState, setGameState] = useState('welcome'); // welcome, settings, test, results
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [currentProblem, setCurrentProblem] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [problems, setProblems] = useState([]);
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [settings, setSettings] = useState({
    totalProblems: 12,
    timeLimit: 45, // seconds per problem
    difficulty: 'medium', // easy, medium, hard
    colorMode: 'colored', // colored, monochrome
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timerRef = useRef(null);
  const canvasSize = useRef(null);
  
  // Calculate optimal canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Use 80% of the smaller dimension to maintain square aspect ratio
      const size = Math.min(vw * 0.8, vh * 0.8);
      canvasSize.current = size;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  // Generate pattern problems based on settings
  const generateProblems = useCallback(() => {
    const difficultyLevels = {
      easy: { patternTypes: ['rotation', 'progression', 'addition'], maxMatrixSize: 2 },
      medium: { patternTypes: ['rotation', 'progression', 'addition', 'subtraction'], maxMatrixSize: 3 },
      hard: { patternTypes: ['rotation', 'progression', 'addition', 'subtraction', 'combination'], maxMatrixSize: 3 }
    };
    
    const { patternTypes, maxMatrixSize } = difficultyLevels[settings.difficulty];
    const colorMode = settings.colorMode;
    
    // Define colors for the patterns
    const colors = colorMode === 'colored' 
      ? ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA'] 
      : ['#333333', '#666666', '#999999', '#CCCCCC', '#EEEEEE'];
      
    // Define shapes
    const shapes = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];
    
    // Generate a set of problems
    const newProblems = [];
    
    for (let i = 0; i < settings.totalProblems; i++) {
      // Determine the matrix size for this problem (2x2 or 3x3)
      const matrixSize = Math.min(maxMatrixSize, Math.floor(i / 3) + 2);
      
      // Choose a random pattern type from the allowed types for this difficulty
      const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
      
      // Choose random shape and color for this problem
      const shapeIndex = Math.floor(Math.random() * shapes.length);
      const colorIndex = Math.floor(Math.random() * colors.length);
      
      // Generate all cells for the matrix
      const cells = [];
      const matrixLength = matrixSize * matrixSize;
      
      for (let j = 0; j < matrixLength - 1; j++) {
        cells.push(generateCell(j, patternType, matrixSize, shapeIndex, colorIndex, colors, shapes));
      }
      
      // Generate the answer (the missing cell)
      const answerCell = generateAnswer(patternType, matrixSize, shapeIndex, colorIndex, colors, shapes);
      
      // Generate options (including the correct answer)
      const { options, correctOptionIndex } = generateOptions(answerCell, patternType, colors, shapes);
      
      newProblems.push({
        id: i + 1,
        matrixSize,
        patternType,
        cells,
        answerCell,
        options,
        correctOptionIndex, // This now has the actual index of the correct option
      });
    }
    
    // Shuffle problems to mix difficulty
    return shuffleArray(newProblems);
  }, [settings.difficulty, settings.colorMode, settings.totalProblems]);
  
  // Generate a single cell for the matrix based on pattern type and position
  const generateCell = (index, patternType, matrixSize, shapeIndex, colorIndex, colors, shapes) => {
    const row = Math.floor(index / matrixSize);
    const col = index % matrixSize;
    
    // Helper function to determine cell properties based on pattern type
    switch (patternType) {
      case 'rotation':
        // Rotate shape based on position
        const rotationAngle = (90 * ((row + col) % 4));
        return {
          shape: shapes[shapeIndex],
          color: colors[colorIndex],
          rotation: rotationAngle,
          size: 1
        };
        
      case 'progression':
        // Progressively change size based on position
        const sizeMultiplier = 0.6 + ((row * matrixSize + col) / (matrixSize * matrixSize - 1)) * 0.8;
        return {
          shape: shapes[shapeIndex],
          color: colors[colorIndex],
          rotation: 0,
          size: sizeMultiplier
        };
        
      case 'addition':
        // Add elements based on position
        const elements = ((row + col) % 3) + 1;
        return {
          shape: shapes[shapeIndex],
          color: colors[colorIndex],
          rotation: 0,
          size: 1,
          elements
        };
        
      case 'subtraction':
        // Create "subtractive" pattern
        const opacity = 1 - ((row * matrixSize + col) / (matrixSize * matrixSize * 2));
        return {
          shape: shapes[shapeIndex],
          color: colors[colorIndex],
          rotation: 0,
          size: 1,
          opacity: Math.max(0.3, opacity)
        };
        
      case 'combination':
        // Combine multiple pattern types
        const combinedRotation = (90 * ((row + col) % 4));
        const combinedSize = 0.7 + ((row * matrixSize + col) / (matrixSize * matrixSize * 2));
        return {
          shape: shapes[(shapeIndex + row) % shapes.length],
          color: colors[(colorIndex + col) % colors.length],
          rotation: combinedRotation,
          size: combinedSize
        };
        
      default:
        return {
          shape: shapes[shapeIndex],
          color: colors[colorIndex],
          rotation: 0,
          size: 1
        };
    }
  };
  
  // Generate the answer cell for the given pattern
  const generateAnswer = (patternType, matrixSize, shapeIndex, colorIndex, colors, shapes) => {
    // Generate the cell that should be in the last position (bottom right)
    const lastIndex = matrixSize * matrixSize - 1;
    return generateCell(lastIndex, patternType, matrixSize, shapeIndex, colorIndex, colors, shapes);
  };
  
  // Generate options (including the correct answer and distractors)
  const generateOptions = (correctAnswer, patternType, colors, shapes) => {
    // Start with the correct answer
    const options = [{ ...correctAnswer }];
    
    // Create 5 distractors by modifying the correct answer
    for (let i = 0; i < 5; i++) {
      let distractor = { ...correctAnswer };
      
      switch (i % 3) {
        case 0:
          // Change the shape
          const shapeTypes = {
            'circle': ['circle'], // Regular shapes
            'square': ['square', 'diamond'], // Angular shapes
            'triangle': ['triangle'], // Triangular shapes
            'diamond': ['diamond', 'square'], // Angular shapes
            'hexagon': ['hexagon'] // Complex shapes
          };
          
          // Get possible shape alternatives from the same category
          const sameTypeShapes = shapeTypes[correctAnswer.shape] || [correctAnswer.shape];
          // Filter out the current shape
          const alternativeShapes = sameTypeShapes.filter(s => s !== correctAnswer.shape);
          
          if (alternativeShapes.length > 0) {
            // Pick from same category if possible
            distractor.shape = alternativeShapes[Math.floor(Math.random() * alternativeShapes.length)];
          } else {
            // If no alternatives in same category, keep the same shape but modify another property
            distractor.size = Math.max(0.7, correctAnswer.size * 0.8);
          }
          break;
        case 1:
          // Change the color
          distractor.color = colors[(colors.indexOf(correctAnswer.color) + 2 + i) % colors.length];
          break;
        case 2:
          // Change the rotation or size
          if (patternType === 'rotation') {
            distractor.rotation = (correctAnswer.rotation + 90) % 360;
          } else if (patternType === 'progression') {
            distractor.size = Math.max(0.5, correctAnswer.size - 0.3);
          } else if (patternType === 'addition') {
            distractor.elements = ((correctAnswer.elements || 1) + 1) % 4 || 1;
          }
          break;
      }
      
      options.push(distractor);
    }
    
    // Shuffle options
    const shuffledOptions = shuffleArray(options);

    // Add this line to track where the correct answer ended up
    const correctOptionIndex = shuffledOptions.findIndex(option => 
    JSON.stringify(option) === JSON.stringify(correctAnswer)
    );

    // Return both the options and the correct index
    return {
    options: shuffledOptions,
    correctOptionIndex
    };
  };
  
  // Helper to shuffle an array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Show a message overlay with fade in/out
  const showOverlayMessage = useCallback((text, duration = 1500) => {
    setMessage(text);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  }, []);
  
  // Start a new test
  const startTest = useCallback(() => {
    // Generate problems
    const newProblems = generateProblems();
    setProblems(newProblems);
    setResults([]);
    setScore(0);
    setLevel(1);
    
    // Countdown
    setGameState('countdown');
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Start first problem
          setCurrentProblem(newProblems[0]);
          setTimeRemaining(settings.timeLimit);
          setGameState('test');
          startTimer();
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateProblems, settings.timeLimit]);
  
  // Start timer for problem
  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start new countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up, move to next problem
          clearInterval(timerRef.current);
          handleNoAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  // Handle when time runs out without an answer
  const handleNoAnswer = useCallback(() => {
    // Add a "no answer" result
    setResults(prev => [...prev, {
      problemId: currentProblem.id,
      selectedOption: null,
      correct: false,
      timeSpent: settings.timeLimit
    }]);
    
    // Show message and move to next problem
    showOverlayMessage('Time expired!', 1200);
    moveToNextProblem();
  }, [currentProblem, settings.timeLimit, showOverlayMessage]);
  
  // Check the selected answer
  const checkAnswer = useCallback((optionIndex) => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Determine if answer is correct
    const correct = optionIndex === currentProblem.correctOptionIndex;
    
    // Calculate time spent
    const timeSpent = settings.timeLimit - timeRemaining;
    
    // Add result
    setResults(prev => [...prev, {
      problemId: currentProblem.id,
      selectedOption: optionIndex,
      correct,
      timeSpent
    }]);
    
    // Update score
    if (correct) {
      setScore(prev => prev + 1);
      showOverlayMessage('Correct!', 800);
    } else {
      showOverlayMessage('Incorrect', 800);
    }
    
    // Move to next problem
    setTimeout(() => {
      moveToNextProblem();
    }, 800);
  }, [currentProblem, settings.timeLimit, timeRemaining, showOverlayMessage]);
  
  // Move to the next problem or end the test
  const moveToNextProblem = useCallback(() => {
    const nextLevel = level + 1;
    
    if (nextLevel <= problems.length) {
      // Move to next problem
      setLevel(nextLevel);
      setCurrentProblem(problems[nextLevel - 1]);
      setSelectedOption(null);
      setTimeRemaining(settings.timeLimit);
      startTimer();
    } else {
      // End of test
      endTest();
    }
  }, [level, problems, settings.timeLimit, startTimer]);
  
  // End the test and show results
  const endTest = useCallback(() => {
    // Clear any remaining timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Calculate final score
    const finalScore = results.filter(r => r.correct).length;
    setScore(finalScore);
    
    // Show results
    setGameState('results');
  }, [results]);
  
  // Reset the test
  const resetTest = () => {
    setGameState('welcome');
    setLevel(1);
    setScore(0);
    setResults([]);
    setSelectedOption(null);
    
    // Clear any remaining timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Render a shape based on its properties
  const renderShape = (shapeData, size = 1, isOption = false) => {
    if (!shapeData) return null;
    
    const baseSize = isOption ? 40 : 50;
    const actualSize = baseSize * shapeData.size * size;
    const shapeStyle = {
      width: `${actualSize}px`,
      height: `${actualSize}px`,
      backgroundColor: shapeData.color,
      transform: `rotate(${shapeData.rotation}deg)`,
      opacity: shapeData.opacity || 1,
    };
    
    // Create multiple elements if specified
    const elements = shapeData.elements || 1;
    const shapeArray = [];
    
    for (let i = 0; i < elements; i++) {
    // In the renderShape function, update the positioning for multiple elements
    const positionStyle = elements > 1 ? {
        position: 'absolute',
        // Replace the existing positioning with this more precise grid
        top: i < 2 ? '25%' : '75%',
        left: i % 2 === 0 ? '25%' : '75%',
        transform: `translate(-50%, -50%) rotate(${shapeData.rotation}deg)`,
    } : {};
      
      let shape;
      switch (shapeData.shape) {
        case 'circle':
          shape = <div key={i} className={styles.circle} style={{ ...shapeStyle, ...positionStyle }} />;
          break;
        case 'square':
          shape = <div key={i} className={styles.square} style={{ ...shapeStyle, ...positionStyle }} />;
          break;
        case 'triangle':
          shape = <div key={i} className={styles.triangle} style={{ ...shapeStyle, ...positionStyle }} />;
          break;
        case 'diamond':
          shape = <div key={i} className={styles.diamond} style={{ ...shapeStyle, ...positionStyle }} />;
          break;
        case 'hexagon':
          shape = <div key={i} className={styles.hexagon} style={{ ...shapeStyle, ...positionStyle }} />;
          break;
        default:
          shape = <div key={i} className={styles.circle} style={{ ...shapeStyle, ...positionStyle }} />;
      }
      
      shapeArray.push(shape);
    }
    
    return (
        <div className={styles.shapeContainer} style={elements > 1 ? { 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)'
          } : {}}>
            {shapeArray}
          </div>
    );
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Pattern Matrix Test</h1>
          
          {gameState === 'test' && (
            <div className={styles.gameMetrics}>
              <div className={styles.levelIndicator}>
                Problem: <span className={styles.metricValue}>{level}/{problems.length}</span>
              </div>
              <div className={styles.scoreIndicator}>
                Score: <span className={styles.metricValue}>{score}</span>
              </div>
              <div className={styles.timerIndicator}>
                Time: <span className={`${styles.metricValue} ${timeRemaining < 10 ? styles.timeWarning : ''}`}>
                  {timeRemaining}s
                </span>
              </div>
              <button 
                className={styles.iconButton}
                onClick={() => setShowSettings(true)}
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
              <h2>Welcome to the Pattern Matrix Test</h2>
              <p>
                This test measures your abstract reasoning ability through pattern recognition tasks.
                You'll be shown a matrix with a missing piece and need to choose the option that best completes the pattern.
              </p>
              <p>
                The test starts with easier patterns and gets progressively harder.
                Try to solve each problem within the time limit.
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
                  <a className={styles.link}>Back to Home</a>
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
                <p>Look for patterns in each matrix</p>
              </div>
            </div>
          )}
          
          {/* Test screen */}
          {gameState === 'test' && currentProblem && (
            <div className={styles.testBoard}>
              {/* Matrix grid */}
              <div 
                className={`${styles.matrixGrid} ${styles[`matrix${currentProblem.matrixSize}`]}`}
                aria-label="Pattern Matrix"
              >
                {currentProblem.cells.map((cell, index) => (
                  <div key={index} className={styles.matrixCell}>
                    {renderShape(cell)}
                  </div>
                ))}
                <div className={styles.matrixCell}>
                  <div className={styles.missingCell}>?</div>
                </div>
              </div>
              
              {/* Options grid */}
              <div className={styles.optionsGrid}>
                <p className={styles.optionsLabel}>Select the missing piece:</p>
                <div className={styles.options}>
                  {currentProblem.options.map((option, index) => (
                    <button
                      key={index}
                      className={`${styles.optionButton} ${selectedOption === index ? styles.selectedOption : ''}`}
                      onClick={() => {
                        setSelectedOption(index);
                        checkAnswer(index);
                      }}
                      aria-label={`Option ${index + 1}`}
                    >
                      {renderShape(option, 0.9, true)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && (
            <div className={styles.resultsCard}>
              <h2>Test Results</h2>
              <div className={styles.resultsSummary}>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Score</div>
                  <div className={styles.statValue}>{score}</div>
                  <div className={styles.statDetail}>out of {problems.length}</div>
                </div>
                <div className={styles.resultStat}>
                  <div className={styles.statLabel}>Accuracy</div>
                  <div className={styles.statValue}>
                    {Math.round((score / problems.length) * 100)}%
                  </div>
                </div>
              </div>
              
              {/* Detailed results */}
              <div className={styles.detailedResults}>
                <h3>Performance Details</h3>
                <div className={styles.resultsList}>
                  {results.map((result, index) => (
                    <div key={index} className={`${styles.resultItem} ${result.correct ? styles.correctResult : styles.incorrectResult}`}>
                      <div className={styles.resultProblem}>
                        Problem {index + 1}
                      </div>
                      <div className={styles.resultStatus}>
                        {result.correct ? 'Correct' : result.selectedOption === null ? 'Time Expired' : 'Incorrect'}
                      </div>
                      <div className={styles.resultTime}>
                        {result.timeSpent}s
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Performance interpretation */}
                <div className={styles.interpretation}>
                  <h3>Interpretation</h3>
                  <p>
                    {score > problems.length * 0.8 
                      ? 'Excellent pattern recognition ability! You effectively identified complex visual patterns.'
                      : score > problems.length * 0.6
                        ? 'Good pattern recognition skills. You demonstrated solid abstract reasoning abilities.'
                        : score > problems.length * 0.4
                          ? 'Average pattern recognition. With practice, you can improve your abstract reasoning skills.'
                          : 'This test indicates you may benefit from practicing visual pattern recognition tasks.'}
                  </p>
                </div>
              </div>
              
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
            isPatternMatrix={true}
          />
        )}
        
        <footer className={styles.footer}>
          <p>
            The Pattern Matrix Test measures abstract reasoning and fluid intelligence through visual pattern recognition.
          </p>
        </footer>
      </div>
    </div>
  );
}
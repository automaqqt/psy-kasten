// components/tests/tol/TOLTest.js
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/TOLTest.module.css';
import TOLResults from '../../results/tol';
import TOLSettings from '../../settings/tol';
// Import PROBLEMS which now includes 'start' states
import { PROBLEMS, PEG_CAPACITIES, BALL_COLORS, TRIAL_SCORES } from './tolData';

// statesAreEqual helper function remains the same...
const statesAreEqual = (state1, state2) => {
  // ... (implementation from previous version)
  if (!state1 || !state2) return false; // Add null check
  if (state1.length !== state2.length) return false;
  for (let i = 0; i < state1.length; i++) {
    if (!state1[i] || !state2[i] || state1[i].length !== state2[i].length) return false;
    for (let j = 0; j < state1[i].length; j++) {
      if (state1[i][j] !== state2[i][j]) return false;
    }
  }
  return true;
};


export default function TOLTest() {
  const [gameState, setGameState] = useState('welcome');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(1);
  // Initialize pegState with the start state of the *first* problem
  const [pegState, setPegState] = useState(null); // Initialize as null, set in useEffect or startTest
  const [heldBall, setHeldBall] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [problemResults, setProblemResults] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({});

  // Derived state - memoize if performance becomes an issue
  const currentProblem = PROBLEMS[currentProblemIndex];
  const maxScore = PROBLEMS.length * TRIAL_SCORES[0];

  // --- Game Logic ---

  // NEW: Function to set up the board for a given problem index
  const setupProblemBoard = useCallback((problemIdx) => {
    if (problemIdx >= 0 && problemIdx < PROBLEMS.length) {
      // Deep copy the specific start state for this problem
      setPegState(JSON.parse(JSON.stringify(PROBLEMS[problemIdx].start)));
      setHeldBall(null);
      setMoveHistory([]);
    } else {
       console.error("Invalid problem index for setup:", problemIdx);
       // Handle error state if necessary, e.g., reset to welcome
       setGameState('welcome');
    }
  }, []); // Dependencies removed as PROBLEMS is stable top-level const


  // Initialize board on component mount or when game state requires it
  useEffect(() => {
    if ((gameState === 'playing' || gameState === 'instructions') && !pegState) {
       setupProblemBoard(currentProblemIndex);
    }
     // Reset pegState if going back to welcome
     if (gameState === 'welcome') {
        setPegState(null);
     }
  }, [gameState, currentProblemIndex, pegState, setupProblemBoard]);


  const startTest = () => {
    setCurrentProblemIndex(0);
    setCurrentTrial(1);
    setTotalScore(0);
    setProblemResults([]);
    setupProblemBoard(0); // Setup board for the first problem
    // Ensure feedback uses the correct minMoves for the first problem
    setFeedback(`Problem 1 of ${PROBLEMS.length}. Try to solve in ${PROBLEMS[0].minMoves} moves.`);
    setGameState('playing');
  };


   // handleBallClick remains the same...
   const handleBallClick = (pegIndex, ballIndex) => {
       // ... (implementation from previous version)
       if (gameState !== 'playing' || heldBall || !pegState) return;

       const peg = pegState[pegIndex];
       if (ballIndex === peg.length - 1) {
         const ball = peg[peg.length - 1];
         setHeldBall({ ball, fromPegIndex: pegIndex });
         const newState = JSON.parse(JSON.stringify(pegState));
         newState[pegIndex].pop();
         setPegState(newState);
       }
   };

   // handlePegClick remains mostly the same, but uses currentProblem.goal
   const handlePegClick = (toPegIndex) => {
    if (gameState !== 'playing' || !heldBall || !pegState) return;

    const { ball, fromPegIndex } = heldBall;

    // Return ball if clicking same peg
    if (fromPegIndex === toPegIndex) {
      const newState = JSON.parse(JSON.stringify(pegState));
      newState[fromPegIndex].push(ball);
      setPegState(newState);
      setHeldBall(null);
      return;
    }

    // Check validity: Peg capacity
    if (pegState[toPegIndex].length >= PEG_CAPACITIES[toPegIndex]) {
      setFeedback('Invalid move: Peg is full.');
      const newState = JSON.parse(JSON.stringify(pegState));
      newState[fromPegIndex].push(ball);
      setPegState(newState);
      setHeldBall(null);
      return;
    }

    // Valid move
    const newState = JSON.parse(JSON.stringify(pegState));
    newState[toPegIndex].push(ball);
    setPegState(newState); // Apply the move
    const currentMoveNumber = moveHistory.length + 1;
    setMoveHistory(prev => [...prev, { ball, from: fromPegIndex, to: toPegIndex }]);
    setHeldBall(null); // Ball is placed
    setFeedback(`Move ${currentMoveNumber}`);


    // --- Check for Solution ---
    // Use currentProblem.goal for comparison
    if (currentProblem && statesAreEqual(newState, currentProblem.goal)) {
       // Solved
       handleTrialSuccess(currentMoveNumber); // Pass move number

    } else if (currentProblem && currentMoveNumber >= currentProblem.minMoves) {
       // Min moves reached or exceeded without solving
       // Optional: Could automatically fail the trial here, or let user continue
       setFeedback(`Move ${currentMoveNumber}. Goal not reached yet.`);
    }
  };

 // Pass move number to success handler
 const handleTrialSuccess = (movesTaken) => {
    const scoreForTrial = TRIAL_SCORES[currentTrial - 1];
    setTotalScore(prev => prev + scoreForTrial);

    const attemptData = { trial: currentTrial, success: true, moves: movesTaken };
    updateProblemResult(attemptData);

    setFeedback(`Correct! Problem ${currentProblemIndex + 1} solved in ${movesTaken} moves. Score +${scoreForTrial}`);
    // Delay slightly before moving to next to show feedback
    setTimeout(goToNextProblem, 1200); // 1.2 second delay
  };

  // handleTrialFailure remains mostly the same
  const handleTrialFailure = (message = 'Incorrect solution or too many moves.') => {
     const attemptData = {
         trial: currentTrial,
         success: false,
         // Calculate moves accurately even if failing mid-move attempt
         moves: moveHistory.length + (heldBall ? 0 : 1) // Count placed moves + potentially the one triggering failure
     };
     updateProblemResult(attemptData);


    if (currentTrial < 3) {
      setCurrentTrial(prev => prev + 1);
      // Reset board TO THE START STATE OF THE *CURRENT* PROBLEM
      setupProblemBoard(currentProblemIndex);
      setFeedback(`${message} Try again (Trial ${currentTrial + 1} of 3). Aim for ${currentProblem.minMoves} moves.`);
    } else {
      // Failed all 3 trials for this problem
      setFeedback(`Problem ${currentProblemIndex + 1} failed after 3 trials. Score +0`);
      // Delay slightly before moving to next
      setTimeout(goToNextProblem, 1200); // 1.2 second delay
    }
  };

  // updateProblemResult remains the same...
   const updateProblemResult = (attemptData) => {
     // ... (implementation from previous version)
        setProblemResults(prev => {
          const existingEntryIndex = prev.findIndex(p => p.problemIndex === currentProblemIndex);
          if (existingEntryIndex > -1) {
            const updatedResults = [...prev];
            // Avoid adding duplicate trial attempts if logic error occurs
            if (!updatedResults[existingEntryIndex].attempts.find(a => a.trial === attemptData.trial)) {
                 updatedResults[existingEntryIndex].attempts.push(attemptData);
            }
            if (attemptData.success) {
               updatedResults[existingEntryIndex].score = Math.max(
                 updatedResults[existingEntryIndex].score || 0,
                 TRIAL_SCORES[attemptData.trial - 1]
               );
            }
            return updatedResults;
          } else {
            return [
              ...prev,
              {
                problemIndex: currentProblemIndex,
                // Store start/goal for results display/export if needed
                startState: JSON.parse(JSON.stringify(currentProblem.start)),
                goalState: JSON.parse(JSON.stringify(currentProblem.goal)),
                score: attemptData.success ? TRIAL_SCORES[attemptData.trial - 1] : 0,
                minMoves: currentProblem.minMoves,
                attempts: [attemptData]
              }
            ];
          }
        });
   };

  // goToNextProblem needs to use setupProblemBoard
  const goToNextProblem = () => {
    setHeldBall(null);
    if (currentProblemIndex < PROBLEMS.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIndex);
      setCurrentTrial(1);
      // Setup board FOR THE NEXT PROBLEM'S specific start state
      setupProblemBoard(nextIndex);
      // Delay feedback update slightly to ensure state is set
       setTimeout(() => {
         // Check if PROBLEMS[nextIndex] exists before accessing minMoves
         if (PROBLEMS[nextIndex]) {
             setFeedback(`Problem ${nextIndex + 1} of ${PROBLEMS.length}. Try to solve in ${PROBLEMS[nextIndex].minMoves} moves.`);
         }
       }, 100);
    } else {
      // Test finished
      setGameState('results');
    }
  };

  // resetGame resets to the very beginning (Problem 0)
  const resetGame = () => {
    setGameState('welcome');
    setCurrentProblemIndex(0);
    setCurrentTrial(1);
    setPegState(null); // Clear peg state, will be set by useEffect/startTest
    setHeldBall(null);
    setMoveHistory([]);
    setTotalScore(0);
    setProblemResults([]);
    setFeedback('');
  };


  // --- Render Logic ---
  // renderBalls remains the same...
   const renderBalls = (pegIndex) => {
        // ... (implementation from previous version) - check for null pegState
        if (!pegState || !pegState[pegIndex]) return null; // Guard against null state
        return (
          <div className={styles.pegBalls}>
            {pegState[pegIndex].map((ball, ballIndex) => (
              <div
                key={`${pegIndex}-${ballIndex}`}
                className={`${styles.ball} ${heldBall?.fromPegIndex === pegIndex && heldBall?.ball === ball ? styles.held : ''}`}
                style={{ backgroundColor: BALL_COLORS[ball] }}
                onClick={() => handleBallClick(pegIndex, ballIndex)}
                role="button"
                aria-label={`Pick up ${ball} ball from peg ${pegIndex + 1}`}
                tabIndex={gameState === 'playing' && !heldBall ? 0 : -1} // Only top ball focusable when not holding
              >
              </div>
            ))}
          </div>
        );
   };

  // renderGoal remains the same...
  const renderGoal = (problem) => {
       // ... (implementation from previous version) - add null check
       if (!problem || !problem.goal) return null;
        return (
          <div className={styles.goalContainer}>
             {/* ... rest of goal rendering ... */}
             <h4>Target Configuration ({problem.minMoves} moves)</h4>
             <div className={styles.goalBoard}>
               {problem.goal.map((pegBalls, pegIndex) => (
                 <div key={`goal-peg-${pegIndex}`} className={styles.goalPeg}>
                   <div className={styles.goalPegBalls}>
                     {pegBalls.map((ball, ballIndex) => (
                       <div
                         key={`goal-ball-${pegIndex}-${ballIndex}`}
                         className={styles.goalBall}
                         style={{ backgroundColor: BALL_COLORS[ball] }}
                       />
                     ))}
                   </div>
                    <div className={`${styles.pegPost} ${styles[`pegPost${pegIndex + 1}`]}`} />
                 </div>
               ))}
             </div>
          </div>
        );
  };

  // --- Main Return ---
  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
         {/* Header remains similar, ensure currentProblem exists */}
         <div className={styles.header}>
           <h1 className={styles.title}>Tower of London Test</h1>
           {gameState === 'playing' && currentProblem && (
             <div className={styles.gameInfo}>
               <span>Problem: {currentProblemIndex + 1}/{PROBLEMS.length}</span>
               <span>Trial: {currentTrial}/3</span>
               <span>Moves: {moveHistory.length}/{currentProblem.minMoves}</span>
               <span>Score: {totalScore}</span>
             </div>
           )}
         </div>

        <div className={styles.gameArea}>
          {/* Welcome screen remains the same */}
          {gameState === 'welcome' && (
              <div className={styles.welcomeCard}>
              <h2>Welcome to the Tower of London</h2>
              <p>
                This test assesses your combination capabilities.
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
                  <div className={styles.link}>Back to Home</div>
                </Link>
              </div>
            </div>
          )}

          {/* Playing Area - Ensure currentProblem and pegState are loaded */}
          {gameState === 'playing' && currentProblem && pegState && (
            <div className={styles.playingArea}>
              {/* Board rendering uses pegState */}
              <div className={styles.board}>
                 {pegState.map((_, pegIndex) => (
                   <div
                     key={pegIndex}
                     className={`${styles.peg} ${styles[`peg${pegIndex + 1}`]}`}
                     onClick={() => handlePegClick(pegIndex)}
                      role="button"
                      aria-label={heldBall ? `Place ball on peg ${pegIndex + 1}` : `Peg ${pegIndex + 1}`}
                      tabIndex={gameState === 'playing' && heldBall ? 0 : -1}
                   >
                      {renderBalls(pegIndex)}
                     <div className={`${styles.pegPost} ${styles[`pegPost${pegIndex + 1}`]}`} />
                   </div>
                 ))}
                  {heldBall && ( <div className={styles.heldBallFloating} style={{ backgroundColor: BALL_COLORS[heldBall.ball] }} /> )}
              </div>

              {/* Goal rendering uses currentProblem */}
              {renderGoal(currentProblem)}

              <div className={styles.feedbackArea}>
                <p className={styles.feedbackText}>{feedback}</p>
                 {/* Optional Button to fail trial */}
                 {/* <button onClick={() => handleTrialFailure("Skipped Trial")} className={styles.secondaryButton} style={{marginTop: '0.5rem'}}>Give Up Trial</button> */}
              </div>
            </div>
          )}

          {/* Results screen remains the same */}
          {gameState === 'results' && (
             <TOLResults
               testData={problemResults}
               totalScore={totalScore}
               maxScore={maxScore}
               onRestart={resetGame}
               // Pass true if using custom starts, results might want to show start/goal
               usesCustomStarts={true}
             />
          )}

        </div>

         {/* Settings panel remains the same */}
         {showSettings && ( <TOLSettings settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} /> )}

         {/* Footer remains the same */}
         <footer className={styles.footer}>
           <p>Tower of London Test - Planning Assessment.</p>
         </footer>
      </div>
    </div>
  );
}
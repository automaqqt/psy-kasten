// components/tests/tol/TOLTest.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/TOLTest.module.css';
import TOLResults from '../../results/tol';
import TOLSettings from '../../settings/tol';
// Import PROBLEMS which now includes 'start' states
import { PROBLEMS, PEG_CAPACITIES, BALL_COLORS, TRIAL_SCORES } from './tolData';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { FaStopCircle } from 'react-icons/fa';

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


export default function TOLTest({ assignmentId, onComplete, isStandalone, t }) {
  const [gameState, setGameState] = useState('welcome'); // welcome, tutorial, demo, practice, practiceComplete, playing, results
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
  const [isPractice, setIsPractice] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState(null);
  const [firstMoveTime, setFirstMoveTime] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const [demoPegState, setDemoPegState] = useState(null);
  const [demoHeldBall, setDemoHeldBall] = useState(null);

  // Translation function with fallback
  const translate = t || ((key) => key);

  // Fullscreen functionality
  const gameArea = useRef(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

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
    if (gameState === 'playing' && !pegState) {
       setupProblemBoard(currentProblemIndex);
    }
     // Reset pegState if going back to welcome
     if (gameState === 'welcome') {
        setPegState(null);
     }
  }, [gameState, currentProblemIndex, pegState, setupProblemBoard]);

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'demo') {
      if (demoStep === 0) {
        // Initialize demo board: [['R'], ['G'], ['B']]
        setDemoPegState([['R'], ['G'], ['B']]);
        setDemoHeldBall(null);
        const timer = setTimeout(() => setDemoStep(1), 3500);
        return () => clearTimeout(timer);
      } else if (demoStep === 1) {
        const timer = setTimeout(() => setDemoStep(2), 4000);
        return () => clearTimeout(timer);
      } else if (demoStep === 2) {
        // Pick up blue ball
        setDemoPegState([['R'], ['G'], []]);
        setDemoHeldBall({ ball: 'B', fromPegIndex: 2 });
        const timer = setTimeout(() => setDemoStep(3), 3500);
        return () => clearTimeout(timer);
      } else if (demoStep === 3) {
        // Place blue ball on middle peg
        setDemoPegState([['R'], ['G', 'B'], []]);
        setDemoHeldBall(null);
        const timer = setTimeout(() => setDemoStep(4), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, demoStep]);


  const startPractice = async () => {
    setIsPractice(true);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    // Practice problem: simple 2-move problem
    // Start: [['R'], ['G'], ['B']], Goal: [[], ['G', 'B'], ['R']]
    setPegState([['R'], ['G'], ['B']]);
    setHeldBall(null);
    setMoveHistory([]);
    // Reset timing variables
    setFirstMoveTime(null);
    setLastMoveTime(null);
    setTrialStartTime(Date.now());
    setFeedback(translate('practice_feedback'));
    setGameState('practice');
  };

  const startTest = async () => {
    setIsPractice(false);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    setCurrentProblemIndex(0);
    setCurrentTrial(1);
    setTotalScore(0);
    setProblemResults([]);
    // Reset timing variables BEFORE starting
    setFirstMoveTime(null);
    setLastMoveTime(null);
    setTrialStartTime(Date.now()); // Set BEFORE changing game state
    setupProblemBoard(0); // Setup board for the first problem
    // Ensure feedback uses the correct minMoves for the first problem
    setFeedback(`${translate('problem_of', { current: 1, total: PROBLEMS.length })}. ${translate('try_to_solve', { moves: PROBLEMS[0].minMoves })}`);
    setGameState('playing');
  };


   // handleBallClick - counts turn as soon as ball is picked up
   const handleBallClick = (pegIndex, ballIndex) => {
       if ((gameState !== 'playing' && gameState !== 'practice') || heldBall || !pegState) return;

       const peg = pegState[pegIndex];
       if (ballIndex === peg.length - 1) {
         const ball = peg[peg.length - 1];
         if (!firstMoveTime) {
          setFirstMoveTime(Date.now());
        }
        setLastMoveTime(Date.now());
         setHeldBall({ ball, fromPegIndex: pegIndex });
         const newState = JSON.parse(JSON.stringify(pegState));
         newState[pegIndex].pop();
         setPegState(newState);

         // Count the turn immediately when ball is picked up
         const currentMoveNumber = moveHistory.length + 1;
         // Only calculate pause if this is NOT the first move of the current problem
         const pauseTime = (moveHistory.length > 0 && lastMoveTime) ? Date.now() - lastMoveTime : 0;
         setMoveHistory(prev => [...prev, { ball, from: pegIndex, to: null, pauseTime }]);
         setFeedback(translate('move_number', { number: currentMoveNumber }));
       }
   };

   // handlePegClick - completes the move that was started when ball was picked up
   const handlePegClick = (toPegIndex) => {
    if ((gameState !== 'playing' && gameState !== 'practice') || !heldBall || !pegState) return;

    const { ball, fromPegIndex } = heldBall;

    // Return ball if clicking same peg (still counts as a move since ball was picked up)
    if (fromPegIndex === toPegIndex) {
      const newState = JSON.parse(JSON.stringify(pegState));
      newState[fromPegIndex].push(ball);
      setPegState(newState);
      setHeldBall(null);
      // Update the last move in history with the destination (same as source)
      setMoveHistory(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].to = toPegIndex;
        }
        return updated;
      });
      setLastMoveTime(Date.now());
      return;
    }

    // Check validity: Peg capacity
    if (pegState[toPegIndex].length >= PEG_CAPACITIES[toPegIndex]) {
      setFeedback(translate('invalid_move'));
      const newState = JSON.parse(JSON.stringify(pegState));
      newState[fromPegIndex].push(ball);
      setPegState(newState);
      setHeldBall(null);
      // Update the last move in history with the destination (returned to source due to invalid)
      setMoveHistory(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].to = fromPegIndex;
        }
        return updated;
      });
      setLastMoveTime(Date.now());
      return;
    }

    // Valid move - complete it
    const newState = JSON.parse(JSON.stringify(pegState));
    newState[toPegIndex].push(ball);
    setPegState(newState); // Apply the move
    // Update the last move in history with the destination
    setMoveHistory(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].to = toPegIndex;
      }
      return updated;
    });
    setLastMoveTime(Date.now());
    setHeldBall(null); // Ball is placed


    // --- Check for Solution ---
    if (isPractice) {
      // Practice goal: [[], ['G', 'B'], ['R']]
      const practiceGoal = [[], ['G', 'B'], ['R']];
      if (statesAreEqual(newState, practiceGoal)) {
        setFeedback(translate('practice_correct'));
        setTimeout(() => {
          if (isFullscreen) {
            exitFullscreen();
          }
          setGameState('practiceComplete');
        }, 1500);
      }
    } else {
      // Use currentProblem.goal for comparison
      if (currentProblem && statesAreEqual(newState, currentProblem.goal)) {
         // Solved - use moveHistory.length since move was already counted
         handleTrialSuccess(moveHistory.length);

      } else if (currentProblem && moveHistory.length >= currentProblem.minMoves) {
         // Min moves reached or exceeded without solving
         // Optional: Could automatically fail the trial here, or let user continue
         setFeedback(translate('goal_not_reached', { number: moveHistory.length }));
      }
    }
  };

 // Pass move number to success handler
 const handleTrialSuccess = (movesTaken) => {
    const scoreForTrial = TRIAL_SCORES[currentTrial - 1];
    setTotalScore(prev => prev + scoreForTrial);

    const planningTime = firstMoveTime ? firstMoveTime - trialStartTime : 0;
    const executionTime = firstMoveTime ? Date.now() - firstMoveTime : Date.now() - trialStartTime;

    const attemptData = { trial: currentTrial, success: true, moves: movesTaken, planningTime, executionTime };
    updateProblemResult(attemptData);

    setFeedback(translate('correct_solved', { number: currentProblemIndex + 1, moves: movesTaken, score: scoreForTrial }));
    // Delay slightly before moving to next to show feedback
    setTimeout(goToNextProblem, 1200); // 1.2 second delay
  };

  // handleTrialFailure remains mostly the same
  const handleTrialFailure = (message = null) => {
    const defaultMessage = translate('incorrect_solution');
    const displayMessage = message || defaultMessage;
    const planningTime = firstMoveTime ? firstMoveTime - trialStartTime : Date.now() - trialStartTime;
    const executionTime = firstMoveTime ? Date.now() - firstMoveTime : 0;

     const attemptData = {
         trial: currentTrial,
         success: false,
         // Moves are counted when picked up, so moveHistory.length is accurate
         moves: moveHistory.length,
         planningTime,
         executionTime
     };
     updateProblemResult(attemptData);


    if (currentTrial < 3) {
      const nextTrial = currentTrial + 1;
      const triesRemaining = 3 - currentTrial;
      setCurrentTrial(prev => prev + 1);
      // Reset board TO THE START STATE OF THE *CURRENT* PROBLEM
      setupProblemBoard(currentProblemIndex);
      setTrialStartTime(Date.now());
      setFirstMoveTime(null);
      setLastMoveTime(null);
      const triesWord = triesRemaining === 1 ? translate('try') : translate('tries');
      setFeedback(`${displayMessage} ${translate('tries_remaining', { count: triesRemaining, tries: triesWord })} ${translate('trial_number', { number: nextTrial })} ${translate('aim_for_moves', { moves: currentProblem.minMoves })}`);
    } else {
      // Failed all 3 trials for this problem
      setFeedback(translate('problem_failed', { number: currentProblemIndex + 1 }));
      // Delay slightly before moving to next
      setTimeout(goToNextProblem, 1200); // 1.2 second delay
    }
  };

  const skipProblem = () => {
    const planningTime = firstMoveTime ? firstMoveTime - trialStartTime : Date.now() - trialStartTime;
    const executionTime = firstMoveTime ? Date.now() - firstMoveTime : 0;

    const attemptData = {
        trial: currentTrial,
        success: false,
        moves: moveHistory.length,
        planningTime,
        executionTime,
        skipped: true
    };
    updateProblemResult(attemptData);
    goToNextProblem();
  };

  // updateProblemResult remains the same...
   const updateProblemResult = (attemptData) => {
    const pauses = moveHistory.map(move => move.pauseTime).filter(pt => pt !== undefined);
    const attemptDataWithPauses = { ...attemptData, pauses };

     // ... (implementation from previous version)
        setProblemResults(prev => {
          const existingEntryIndex = prev.findIndex(p => p.problemIndex === currentProblemIndex);
          if (existingEntryIndex > -1) {
            const updatedResults = [...prev];
            // Avoid adding duplicate trial attempts if logic error occurs
            if (!updatedResults[existingEntryIndex].attempts.find(a => a.trial === attemptData.trial)) {
                 updatedResults[existingEntryIndex].attempts.push(attemptDataWithPauses);
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
                attempts: [attemptDataWithPauses]
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
      setTrialStartTime(Date.now());
      setFirstMoveTime(null);
      setLastMoveTime(null);
      // Delay feedback update slightly to ensure state is set
       setTimeout(() => {
         // Check if PROBLEMS[nextIndex] exists before accessing minMoves
         if (PROBLEMS[nextIndex]) {
             setFeedback(`${translate('problem_of', { current: nextIndex + 1, total: PROBLEMS.length })}. ${translate('try_to_solve', { moves: PROBLEMS[nextIndex].minMoves })}`);
         }
       }, 100);
    } else {
      // Test finished - exit fullscreen
      if (isFullscreen) {
        exitFullscreen();
      }
      setGameState('results');
    }
  };

  // resetGame resets to the very beginning (Problem 0)
  const resetGame = () => {
    if (isFullscreen) {
      exitFullscreen();
    }
    setGameState('welcome');
    setCurrentProblemIndex(0);
    setCurrentTrial(1);
    setPegState(null); // Clear peg state, will be set by useEffect/startTest
    setHeldBall(null);
    setMoveHistory([]);
    setTotalScore(0);
    setProblemResults([]);
    setFeedback('');
    setTrialStartTime(null);
    setFirstMoveTime(null);
    setLastMoveTime(null);
  };

  const endTestEarly = () => {
    if (isFullscreen) {
      exitFullscreen();
    }
    setGameState('results');
  };


  // --- Render Logic ---
  // Helper to render demo balls
  const renderDemoBalls = (pegIndex) => {
    if (!demoPegState || !demoPegState[pegIndex]) return null;
    return (
      <div className={styles.pegBalls}>
        {demoPegState[pegIndex].map((ball, ballIndex) => (
          <div
            key={`demo-${pegIndex}-${ballIndex}`}
            className={`${styles.ball} ${demoHeldBall?.fromPegIndex === pegIndex && demoHeldBall?.ball === ball ? styles.held : ''}`}
            style={{ backgroundColor: BALL_COLORS[ball] }}
          />
        ))}
      </div>
    );
  };

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
             <h4>{translate('target_config', { moves: problem.minMoves })}</h4>
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
           <Link href="/" passHref>
             <div className={styles.logoLink}>
               <Image
                 src="/logo.png"
                 alt={'psykasten Logo'}
                 width={50}
                 height={50}
               />
             </div>
           </Link>
           {gameState === 'playing' && currentProblem && (
             <div className={styles.gameInfo}>
               <span>{translate('problem_of', { current: currentProblemIndex + 1, total: PROBLEMS.length })}</span>
               <span>{translate('moves')}: {moveHistory.length}/{currentProblem.minMoves}</span>
               <span>{translate('score')}: {totalScore}</span>
                <button onClick={endTestEarly} className={styles.stopButton}>
                  <FaStopCircle />
                </button>
             </div>
           )}
         </div>

        <div className={styles.gameArea} ref={gameArea}>
          {/* Welcome screen */}
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

          {/* Tutorial screen */}
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
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('start_practice')}
                </button>
                <button
                  className={styles.tertiaryButton}
                  onClick={() => setGameState('welcome')}
                >
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Demo screen */}
          {gameState === 'demo' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p className={styles.demoIntro}>{translate('demo_intro')}</p>

              <div className={styles.demoStepText}>
                {demoStep === 0 && <p>{translate('demo_step1')}</p>}
                {demoStep === 1 && <p>{translate('demo_step2')}</p>}
                {demoStep === 2 && <p>{translate('demo_step3')}</p>}
                {demoStep === 3 && <p>{translate('demo_step4')}</p>}
                {demoStep === 4 && <p>{translate('demo_step5')}</p>}
              </div>

              {/* Demo Board */}
              {demoPegState && (
                <div className={styles.demoBoard}>
                  <div className={styles.board}>
                    {demoPegState.map((_, pegIndex) => (
                      <div
                        key={`demo-peg-${pegIndex}`}
                        className={`${styles.peg} ${styles[`peg${pegIndex + 1}`]}`}
                      >
                        {renderDemoBalls(pegIndex)}
                        <div className={`${styles.pegPost} ${styles[`pegPost${pegIndex + 1}`]}`} />
                      </div>
                    ))}
                    {demoHeldBall && (
                      <div
                        className={styles.heldBallFloatingDemo}
                        style={{ backgroundColor: BALL_COLORS[demoHeldBall.ball] }}
                      />
                    )}
                  </div>

                  {/* Demo Goal */}
                  <div className={styles.goalContainer}>
                    <h4>{translate('target_config', { moves: 1 })}</h4>
                    <div className={styles.goalBoard}>
                      {[['R'], ['G', 'B'], []].map((pegBalls, pegIndex) => (
                        <div key={`demo-goal-peg-${pegIndex}`} className={styles.goalPeg}>
                          <div className={styles.goalPegBalls}>
                            {pegBalls.map((ball, ballIndex) => (
                              <div
                                key={`demo-goal-ball-${pegIndex}-${ballIndex}`}
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
                </div>
              )}

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 4}
                >
                  {translate('start_practice')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setGameState('tutorial')}
                >
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Practice Complete screen */}
          {gameState === 'practiceComplete' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('practice_complete_title')}</h2>
              <p>{translate('practice_complete_text1')}</p>
              <p>{translate('practice_complete_text2')}</p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
                  {translate('start_real_test')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={startPractice}
                >
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {/* Playing Area - Ensure currentProblem and pegState are loaded */}
          {(gameState === 'playing' || gameState === 'practice') && pegState && (
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
                      tabIndex={(gameState === 'playing' || gameState === 'practice') && heldBall ? 0 : -1}
                   >
                      {renderBalls(pegIndex)}
                     <div className={`${styles.pegPost} ${styles[`pegPost${pegIndex + 1}`]}`} />
                   </div>
                 ))}
                  {heldBall && ( <div className={styles.heldBallFloating} style={{ backgroundColor: BALL_COLORS[heldBall.ball] }} /> )}
              </div>

              {/* Goal rendering */}
              {gameState === 'practice' ? (
                <div className={styles.goalContainer}>
                  <h4>{translate('target_config', { moves: 2 })}</h4>
                  <div className={styles.goalBoard}>
                    {[[], ['G', 'B'], ['R']].map((pegBalls, pegIndex) => (
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
              ) : (
                renderGoal(currentProblem)
              )}

              <div className={styles.feedbackArea}>
                <p className={styles.feedbackText}>{feedback}</p>
                {currentProblem && moveHistory.length >= currentProblem.minMoves + 2 && (
                  <button 
                    className={styles.skipButton} 
                    onClick={skipProblem}>
                    Weiter
                  </button>
                )}
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
           <p>{translate('footer_description')}</p>
         </footer>
      </div>
    </div>
  );
}
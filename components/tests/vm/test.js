// components/tests/vm/test.js
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/VMTest.module.css'; // You'll need to create this CSS file
import SettingsPanel from '../../settings/vm';
import DetailedResults from '../../results/vm';
import Footer from '../../ui/footer';
import { useFullscreen } from '../../../hooks/useFullscreen'; // We'll create this hook

export default function VMTest({ assignmentId, onComplete, isStandalone, t }) {
  const gameAreaRef = useRef(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameAreaRef);
  
  // Test images - would normally be loaded dynamically
  const [testImages, setTestImages] = useState([
    { id: 1, src: '/images/vm/apple.png', name: 'Apple' },
    { id: 2, src: '/images/vm/computer.png', name: 'Computer' },
    { id: 3, src: '/images/vm/lawnmower.png', name: 'Lawn Mower' },
    { id: 4, src: '/images/vm/sheep.png', name: 'Sheep' },
    { id: 5, src: '/images/vm/pretzel.png', name: 'Pretzel' },
    { id: 6, src: '/images/vm/mobile.png', name: 'Mobile Phone' },
    { id: 7, src: '/images/vm/butterfly.png', name: 'Butterfly' },
    { id: 8, src: '/images/vm/sausage.png', name: 'Sausage' },
    { id: 9, src: '/images/vm/apple_slice.png', name: 'Apple Slice' },
    { id: 10, src: '/images/vm/radio.png', name: 'Radio' },
    { id: 11, src: '/images/vm/paperclips.png', name: 'Paperclips' },
    { id: 12, src: '/images/vm/beetle.png', name: 'Beetle' },
    { id: 13, src: '/images/vm/bananas.png', name: 'Bananas' },
    { id: 14, src: '/images/vm/screw.png', name: 'Screw' },
    { id: 15, src: '/images/vm/cake.png', name: 'Cake' },
    { id: 16, src: '/images/vm/dog.png', name: 'Dog' },
    { id: 17, src: '/images/vm/umbrella.png', name: 'Umbrella' },
    { id: 18, src: '/images/vm/grapes.png', name: 'Grapes' },
    { id: 19, src: '/images/vm/hamburger.png', name: 'Hamburger' },
    { id: 20, src: '/images/vm/coffee.png', name: 'Coffee Machine' },
    { id: 21, src: '/images/vm/strawberry.png', name: 'Strawberry' },
  ]);

  // State variables
  const [gameState, setGameState] = useState('welcome'); // welcome, settings, viewing, recalling, results
  const [level, setLevel] = useState(2); // Start with 2 images
  const [trial, setTrial] = useState(1); // Track which trial within the level (1-3)
  const [countdown, setCountdown] = useState(3);
  const [currentImages, setCurrentImages] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [roundData, setRoundData] = useState([]);
  const [viewStartTime, setViewStartTime] = useState(null);
  const [recallStartTime, setRecallStartTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    viewingTimeLevel2: 5000, // milliseconds
    viewingTimeLevel3to6: 13000,
    viewingTimeLevel7to9: 21000,
    imagesPerRow: 5,
    selectionMode: 'multiple', // 'multiple' or 'sequence'
    useDistractors: true // Show additional images during recall phase
  });
  
  const translate = t || ((key) => key);
  const boardRef = useRef(null);

  // Initialize with randomized image sets for each level
  useEffect(() => {
    // Create shuffled copy of test images
    const shuffled = [...testImages].sort(() => 0.5 - Math.random());
    setAllImages(shuffled);
  }, [testImages]);

  // Generate a test set for the current level
  const generateTestSet = useCallback(() => {
    // Determine how many images to show based on level
    const numImagesToShow = level;
    
    // Get random images from the pool
    const shuffled = [...allImages].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numImagesToShow);
    
    // Set the current images
    setCurrentImages(selected);
    
    // Reset selection
    setSelectedImages([]);
    
    return selected;
  }, [level, allImages]);

  // Calculate viewing time based on level and settings
  const getViewingTime = useCallback(() => {
    if (level <= 2) return settings.viewingTimeLevel2;
    if (level <= 6) return settings.viewingTimeLevel3to6;
    return settings.viewingTimeLevel7to9;
  }, [level, settings]);

  // Show overlay message with fade in/out
  const showOverlayMessage = useCallback((textKey, duration = 1500) => {
    setMessage(translate(textKey));
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, [translate]);

  // Start a new round
  const startRound = useCallback(async () => {
    // Reset game state
    setGameState('countdown');
    setCountdown(3);
    
    // Enter fullscreen mode
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start viewing phase after countdown
    setTimeout(() => {
      clearInterval(countdownInterval);
      const testSet = generateTestSet();
      setGameState('viewing');
      setViewStartTime(Date.now());
      
      // Automatically move to recall phase after viewing time
      const viewingTime = getViewingTime();
      showOverlayMessage('look_carefully', Math.min(1200, viewingTime - 200));
      
      setTimeout(() => {
        setGameState('recalling');
        setRecallStartTime(Date.now());
        showOverlayMessage('select_remembered_images', 1500);
      }, viewingTime);
    }, 3000);
  }, [generateTestSet, getViewingTime, showOverlayMessage, enterFullscreen, isFullscreen]);

  // Handle image selection during recall
  const handleImageSelect = (image) => {
    if (gameState !== 'recalling') return;
    
    // Toggle selection
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id);
      if (isSelected) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  // Check if the user's selection matches the target images
  const checkResult = () => {
    const viewingTime = Date.now() - viewStartTime;
    const recallTime = Date.now() - recallStartTime;
    
    // Check if all current images were selected (and no incorrect ones)
    const correctSelections = selectedImages.filter(selected => 
      currentImages.some(current => current.id === selected.id)
    );
    
    const incorrectSelections = selectedImages.filter(selected => 
      !currentImages.some(current => current.id === selected.id)
    );
    
    const missedImages = currentImages.filter(current => 
      !selectedImages.some(selected => selected.id === current.id)
    );
    
    // Determine success - all images correctly selected and no incorrect selections
    const isCorrect = correctSelections.length === currentImages.length && incorrectSelections.length === 0;
    
    // Create round result data
    const roundResult = {
      level,
      trial,
      success: isCorrect,
      viewingTime,
      recallTime,
      targetImages: [...currentImages],
      selectedImages: [...selectedImages],
      correctSelections: correctSelections.length,
      incorrectSelections: incorrectSelections.length,
      missedImages: missedImages.length,
      timestamp: new Date().toISOString()
    };
    
    // Add to round data history
    const updatedRoundData = [...roundData, roundResult];
    setRoundData(updatedRoundData);
    
    if (isCorrect) {
      // Success feedback
      showOverlayMessage('correct_feedback', 1500);
      
      if (trial < 3) {
        // Move to next trial in current level
        setTrial(trial + 1);
        setTimeout(() => {
          startRound();
        }, 2000);
      } else {
        // Move to next level, reset trial counter
        setLevel(prevLevel => prevLevel + 1);
        setTrial(1);
        setTimeout(() => {
          startRound();
        }, 2000);
      }
    } else {
      // Check if this is the third failed attempt at this level
      const failedAttemptsAtCurrentLevel = updatedRoundData
        .filter(data => data.level === level && !data.success)
        .length;
      
      if (failedAttemptsAtCurrentLevel >= 3 || trial >= 3) {
        // Test finished - three failed attempts at the same level
        const finishMessage = `${translate('test_finished')}`;
        const overlayMsg = isStandalone 
          ? `${finishMessage} (${translate('common:results_not_saved_standalone')})` 
          : `${finishMessage} (${translate('common:submitting')})`;
        
        showOverlayMessage(overlayMsg, 2000);
        
        // Exit fullscreen
        if (isFullscreen) {
          exitFullscreen();
        }
        
        if (assignmentId) {
          // Submit results
          const finalTestData = {
            vmSpan: calculateVMSpan(updatedRoundData),
            totalCorrect: updatedRoundData.filter(r => r.success).length,
            roundData: updatedRoundData,
            settingsUsed: { ...settings },
          };
          onComplete(finalTestData);
        }
        
        setTimeout(() => {
          setGameState('results');
        }, 2000);
      } else {
        // Still have more attempts at this level
        showOverlayMessage('incorrect_feedback', 1500);
        setTrial(prevTrial => prevTrial + 1);
        setTimeout(() => {
          startRound();
        }, 2000);
      }
    }
  };

  // Calculate VM span (highest level completed successfully)
  const calculateVMSpan = (data) => {
    // Group by level and check if any trial was successful
    const successByLevel = {};
    data.forEach(round => {
      if (!successByLevel[round.level]) {
        successByLevel[round.level] = false;
      }
      if (round.success) {
        successByLevel[round.level] = true;
      }
    });
    
    // Find highest successful level
    let maxLevel = 0;
    Object.entries(successByLevel).forEach(([level, success]) => {
      if (success && parseInt(level) > maxLevel) {
        maxLevel = parseInt(level);
      }
    });
    
    return maxLevel;
  };

  // Reset game
  const resetGame = () => {
    setLevel(2);
    setTrial(1);
    setRoundData([]);
    setGameState('welcome');
    
    // Ensure we exit fullscreen
    if (isFullscreen) {
      exitFullscreen();
    }
  };

  // Generate recall options (include distractors if enabled)
  const getRecallOptions = useCallback(() => {
    if (!settings.useDistractors) {
      // Just shuffle the original images if no distractors
      return [...allImages].sort(() => 0.5 - Math.random()).slice(0, 20);
    }
    
    // Otherwise, include the target images plus distractors
    const distractors = allImages
      .filter(img => !currentImages.some(current => current.id === img.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(20 - currentImages.length, allImages.length - currentImages.length));
    
    return [...currentImages, ...distractors].sort(() => 0.5 - Math.random());
  }, [allImages, currentImages, settings.useDistractors]);

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <div className={styles.header}>
          <Link href="/" passHref>
            <div className={styles.logoLink}>
              <Image
                  src="/logo.png" // Path relative to the public folder
                  alt={translate('logo_alt')}
                  width={50}
                  height={50}
              />
            </div>
          </Link>
          
          {(gameState === 'viewing' || gameState === 'recalling') && (
            <div className={styles.gameMetrics}>
              <div className={styles.levelIndicator}>
                {translate('vm:level')}: <span className={styles.metricValue}>{level}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('vm:trial')}: <span className={styles.metricValue}>{trial}/3</span>
              </div>
            </div>
          )}
        </div>
        
        <div ref={gameAreaRef} className={`${styles.gameArea} ${isFullscreen ? styles.fullscreenMode : ''}`}>
          {/* Welcome screen */}
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('vm:welcome_title')}</h2>
              <p>{translate('vm:welcome_p1')}</p>
              <p>{translate('vm:welcome_p2')}</p>
              <p>{translate('vm:welcome_p3')}</p>
              
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startRound}>
                  {translate('vm:start_button')}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setShowSettings(true)}
                >
                  {translate('common:settings')}
                </button>
              </div>
              <div className={styles.fullscreenInfo}>
                <p>{translate('vm:fullscreen_notice')}</p>
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

          {/* Countdown overlay */}
          {gameState === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownContent}>
                <h2>{translate('vm:get_ready')}</h2>
                <div className={styles.countdownNumber}>{countdown}</div>
                <p>{translate('vm:watch_images')}</p>
              </div>
            </div>
          )}
          
          {/* Image viewing screen */}
          {gameState === 'viewing' && (
            <div className={styles.viewingContainer} ref={boardRef}>
              <div className={styles.imageGrid}>
                {currentImages.map((image) => (
                  <div key={image.id} className={styles.imageItem}>
                    <div className={styles.imageFrame}>
                      <Image
                        src={image.src}
                        alt={image.name}
                        width={100}
                        height={100}
                        layout="responsive"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Image recall screen */}
          {gameState === 'recalling' && (
            <div className={styles.recallContainer}>
              <div className={styles.instructions}>
                {translate('vm:recall_instructions')}
              </div>
              
              <div className={styles.imageGrid}>
                {getRecallOptions().map((image) => (
                  <div 
                    key={image.id} 
                    className={`${styles.imageItem} ${
                      selectedImages.some(img => img.id === image.id) ? styles.selected : ''
                    }`}
                    onClick={() => handleImageSelect(image)}
                  >
                    <div className={styles.imageFrame}>
                      <Image
                        src={image.src}
                        alt={image.name}
                        width={100}
                        height={100}
                        layout="responsive"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.submitContainer}>
                <button 
                  className={styles.submitButton}
                  onClick={checkResult}
                  disabled={selectedImages.length === 0}
                >
                  {translate('vm:confirm_selection')}
                </button>
              </div>
            </div>
          )}
          
          {/* Results screen */}
          {gameState === 'results' && (
            <DetailedResults
              roundData={roundData}
              vmSpan={calculateVMSpan(roundData)}
              isStandalone={isStandalone}
              t={t}
              onReset={resetGame}
            />
          )}

          {/* Message overlay */}
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
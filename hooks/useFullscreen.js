// hooks/useFullscreen.js
import { useState, useEffect, useCallback } from 'react';

export function useFullscreen(elementRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen status when it changes
  const handleFullscreenChange = useCallback(() => {
    if (document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    // Add event listeners for fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Clean up
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // Function to enter fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!elementRef.current) return;
    
    try {
      if (elementRef.current.requestFullscreen) {
        await elementRef.current.requestFullscreen();
      } else if (elementRef.current.mozRequestFullScreen) { // Firefox
        await elementRef.current.mozRequestFullScreen();
      } else if (elementRef.current.webkitRequestFullscreen) { // Chrome, Safari & Opera
        await elementRef.current.webkitRequestFullscreen();
      } else if (elementRef.current.msRequestFullscreen) { // IE/Edge
        await elementRef.current.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen mode:', error);
    }
  }, [elementRef]);

  // Function to exit fullscreen
  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari & Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen mode:', error);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
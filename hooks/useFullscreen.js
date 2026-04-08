// hooks/useFullscreen.js
import { useState, useEffect, useCallback } from 'react';

export function useFullscreen(elementRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect if the Fullscreen API is available (not supported on iOS Safari)
  const isFullscreenSupported = typeof document !== 'undefined' && !!(
    document.fullscreenEnabled ??
    document.webkitFullscreenEnabled ??
    document.mozFullScreenEnabled ??
    document.msFullscreenEnabled
  );

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

    // On unsupported devices (e.g. iOS), simulate fullscreen via CSS
    if (!isFullscreenSupported) {
      setIsFullscreen(true);
      return;
    }

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
  }, [elementRef, isFullscreenSupported]);

  // Function to exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (!isFullscreenSupported) {
      setIsFullscreen(false);
      return;
    }

    try {
      const promise = document.exitFullscreen?.()
        || document.mozCancelFullScreen?.()
        || document.webkitExitFullscreen?.()
        || document.msExitFullscreen?.();
      if (promise && promise.catch) {
        promise.catch(() => {});
      }
    } catch (error) {
      // Ignore — document may not be active
    }
  }, [isFullscreenSupported]);

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
    isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
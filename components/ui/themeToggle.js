import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import styles from '../../styles/ThemeToggle.module.css'; // Create styles for the button

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();

  // Ensure component is mounted before rendering UI that depends on theme
  // Prevents hydration mismatch errors
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render nothing or a placeholder on the server/before mount
    return <button className={styles.iconButton} disabled aria-label="Loading Theme"></button>;
  }

  // Determine the current effective theme (handling 'system' preference)
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={styles.iconButton} // Use same style as other icon buttons
      title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Dark/Light Mode"
    >
      {currentTheme === 'dark' ? <IoSunnyOutline /> : <IoMoonOutline />}
    </button>
  );
};
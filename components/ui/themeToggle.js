import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-i18next';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import styles from '../../styles/ThemeToggle.module.css';

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const { t } = useTranslation('common');

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <button className={styles.iconButton} disabled aria-label={t('switch_to_dark_mode', 'Switch to Dark Mode')}></button>;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={styles.iconButton}
      aria-label={currentTheme === 'dark'
        ? t('switch_to_light_mode', 'Switch to Light Mode')
        : t('switch_to_dark_mode', 'Switch to Dark Mode')}
    >
      {currentTheme === 'dark' ? <IoSunnyOutline aria-hidden="true" /> : <IoMoonOutline aria-hidden="true" />}
    </button>
  );
};

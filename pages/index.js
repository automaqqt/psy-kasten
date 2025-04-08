import { useState, useEffect, useRef } from 'react'; // Import useRef
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/ui/footer';
import styles from '../styles/Landing.module.css';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { TEST_TYPES } from '../lib/testConfig';
import { useSession } from 'next-auth/react';
import { IoLanguage, IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { ThemeToggle } from '../components/ui/themeToggle';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default function Home() {
  const { t } = useTranslation('common');
    const { data: session, status } = useSession();
    const isLoadingSession = status === "loading";
    const router = useRouter(); // Get router instance
    const { locales, locale: currentLocale, pathname, query, asPath } = router; // Get available locales and current one

    // --- State ---
    const [isScrolled, setIsScrolled] = useState(false);
    const [theme, setTheme] = useState('light'); // Default theme
    const [isLocaleDropdownOpen, setIsLocaleDropdownOpen] = useState(false);
    const localeDropdownRef = useRef(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isMobileTagsExpanded, setIsMobileTagsExpanded] = useState(false);

  const testsSectionRef = useRef(null); // Create a ref for the tests section

  // --- Translate and prepare test data ---
  const allCognitiveTests = TEST_TYPES.map(test => ({
    ...test,
    title: t(test.titleKey),
    description: t(test.descriptionKey),
    originalTags: test.tags,
    translatedTags: test.tags.map(tagKey => t(tagKey))
  }));
  const allAvailableTags = [...new Set(allCognitiveTests.flatMap(test => test.translatedTags))].sort();

  // --- Filtering Logic ---
  const filteredTests = allCognitiveTests.filter(test => {
    const matchesSearch = searchTerm.trim() === '' ||
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(selectedTag => test.translatedTags.includes(selectedTag));
    return matchesSearch && matchesTags;
  });

  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past a certain point (e.g., 50 pixels)
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Check localStorage
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme); // Apply theme to root element
    // Or toggle a class: document.body.classList.toggle('dark-mode', savedTheme === 'dark');
}, []);

// Effect for closing locale dropdown on outside click
useEffect(() => {
    const handleClickOutside = (event) => {
        if (localeDropdownRef.current && !localeDropdownRef.current.contains(event.target)) {
            setIsLocaleDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme); // Save preference
  document.documentElement.setAttribute('data-theme', newTheme);
  // Or toggle a class: document.body.classList.toggle('dark-mode', newTheme === 'dark');
};

// Locale Dropdown Toggle
const toggleLocaleDropdown = () => setIsLocaleDropdownOpen(!isLocaleDropdownOpen);

// Locale Change Handler
const changeLocale = (newLocale) => {
  if (newLocale !== currentLocale) {
      router.push({ pathname, query }, asPath, { locale: newLocale });
  }
  setIsLocaleDropdownOpen(false); // Close dropdown after selection
};

  // --- Event Handlers ---
  const handleCardHover = (id) => { setHoveredCard(id); };
  const handleCardLeave = () => { setHoveredCard(null); };
  const handleTagClick = (tag) => {
    setSelectedTags(prevTags =>
      prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]
    );
  };

  // --- Scroll Handler ---
  const scrollToTests = (e) => {
      e.preventDefault(); // Prevent default anchor behavior if using <a>
      testsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMobileTags = () => setIsMobileTagsExpanded(!isMobileTagsExpanded); // <-- New Handler

  return (
    <div className={styles.container}>
      <Head>
        {/* ... (Head content using t() function) ... */}
         <title>{t('landing_page_title', 'Cognitive Assessment Suite')}</title>
         <meta name="description" content={t('landing_page_description', 'A suite of cognitive assessment tools...')} />
         <link rel="icon" href="/favicon.ico" />
      </Head>

        {/* --- Top Bar with Login/Dashboard Button --- */}
        <div className={`${styles.topBar} ${isScrolled ? styles.topBarScrolled : ''}`}>
            <div className={styles.topBarContent}>
            <div className={styles.logoContainer}> {/* Added container for layout */}
                        <Link href="/" passHref>
                          <div className={styles.logoLink}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={t('logo_alt_text', 'CogniSuite Logo')} // Add alt text key
                                    width={50}     // Specify width (adjust as needed)
                                    height={50}    // Specify height (adjust aspect ratio)
                                />
                            </div>
                        </Link>
                    </div>
                    <div className={styles.topBarControls}>
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Locale Switcher */}
                        <div className={styles.localeSwitcherContainer} ref={localeDropdownRef}>
                            <button onClick={toggleLocaleDropdown} className={styles.iconButton} title="Change Language">
                                <IoLanguage />
                            </button>
                            {isLocaleDropdownOpen && (
                                <ul className={styles.localeDropdown}>
                                    {locales?.map((loc) => (
                                        <li key={loc}>
                                            <button
                                                onClick={() => changeLocale(loc)}
                                                className={loc === currentLocale ? styles.activeLocale : ''}
                                            >
                                                {/* Display full language name - requires mapping or another translation file */}
                                                {loc.toUpperCase()} {/* Simple display */}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                         {/* Login/Dashboard Button */}
                        {!isLoadingSession && (
                             session ? (
                                 <Link href="/dashboard"><div className={styles.dashboardButton}>{t('go_to_dashboard')}</div></Link>
                             ) : (
                                 <Link href="/auth/signin"><div className={styles.loginButton}>{t('login_button')}</div></Link>
                             )
                         )}
                        {isLoadingSession && <div className={styles.loadingSpinner}></div>}
                    </div>
            </div>
        </div>
        {/* --- End Top Bar --- */}


      <main className={styles.main}>
        {/* --- Hero Section --- */}
        <section className={styles.heroSection}>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>psyKasten</h1>
                <p className={styles.heroDescription}>
                    {t('landing_hero_intro', 'Explore standardized neuropsychological tests for measuring memory, attention, and executive functions. Designed for researchers and educational purposes.')}
                </p>
                 <div className={styles.heroActions}>
                     <button onClick={scrollToTests} className={styles.heroButtonPrimary}>
                         {t('explore_tests_button', 'Explore Tests')}
                     </button>
                      {/* Show Login or Dashboard based on session */}
                       {!isLoadingSession && (
                           session ? (
                               <Link href="/dashboard">
                                    <div className={styles.heroButtonSecondary}>{t('go_to_dashboard', 'Researcher Dashboard')}</div>
                               </Link>
                           ) : (
                               <Link href="/auth/signin">
                                   <div className={styles.heroButtonSecondary}>{t('login_button', 'Researcher Login')}</div>
                               </Link>
                           )
                       )}
                 </div>
            </div>
            {/* Optional: Add a background image or graphic here */}
            <div className={styles.floatingElementsContainer}>
                        {/* Example: Add multiple items with different styles/delays */}
                        <div className={`${styles.floatingElement} ${styles.pencil1}`}>✏️</div>
                        <div className={`${styles.floatingElement} ${styles.questionnaire1}`}>📝</div>
                        <div className={`${styles.floatingElement} ${styles.pencil2}`}>✏️</div>
                        <div className={`${styles.floatingElement} ${styles.pencil2}`}>✏️</div>
                        <div className={`${styles.floatingElement} ${styles.questionnaire2}`}>📋</div>
                         <div className={`${styles.floatingElement} ${styles.pencil3}`}>✏️</div>
                         {/* Add more as needed */}
                    </div>
        </section>
        {/* --- End Hero Section --- */}


         {/* --- Tests Overview Section --- */}
         {/* Add ref={testsSectionRef} and an id for potential direct linking */}
         <section id="tests-overview" ref={testsSectionRef} className={styles.testsOverviewSection}>

            {/* --- Filters Section --- */}
            <div className={styles.filtersContainer}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder={t('search_tests_placeholder', 'Search tests...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.tagFilter}>
                    <div className={styles.tagFilterHeader}> {/* New wrapper for label and toggle */}
                        <span className={styles.filterLabel}>{t('filter_by_tag', 'Filter by Tag:')}</span>
                        {/* Mobile Toggle Button */}
                        <button onClick={toggleMobileTags} className={styles.mobileTagToggle}>
                            {isMobileTagsExpanded ? t('hide_tags', 'Hide') : t('show_tags', 'Show')}
                             {/* Optional: Add Icon like ▼ or ▲ */}
                             <span className={isMobileTagsExpanded ? styles.arrowUp : styles.arrowDown}></span>
                        </button>
                    </div>
                     {/* Apply conditional class for collapsing */}
                    <div className={`${styles.tagListWrapper} ${isMobileTagsExpanded ? styles.tagListWrapperExpanded : ''}`}>
                        <div className={styles.tagList}>
                        {allAvailableTags.map(tag => (
                            <button key={tag} onClick={() => handleTagClick(tag)} className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.tagButtonActive : ''}`}>
                                {tag}
                            </button>
                        ))}
                         {selectedTags.length > 0 && (
                            <button onClick={() => setSelectedTags([])} className={styles.clearTagsButton}>
                                {t('clear_tags', 'Clear')}
                            </button>
                        )}
                    </div>
                </div>
                </div>
            </div>
            {/* --- End Filters Section --- */}


            {/* --- Tests Grid --- */}
            <section className={styles.testsGrid}>
          {/* Map over the *filtered* tests */}
          {filteredTests.length > 0 ? (
             filteredTests.map((test) => (
                <Link href={test.route} key={test.id}>
                  <div className={styles.testLink}>
                    <div
                      className={`${styles.testCard} ${hoveredCard === test.id ? styles.wiggle : ''}`}
                      style={{ '--card-color': test.color, '--card-color-light': `${test.color}22` }}
                      onMouseEnter={() => handleCardHover(test.id)}
                      onMouseLeave={handleCardLeave}
                    >
                      <div className={styles.cardIconContainer}>
                        <span className={styles.cardIcon}>{test.icon}</span>
                      </div>
                      <h2 className={styles.cardTitle}>{test.title}</h2>
                      <p className={styles.cardDescription}>{test.description}</p>
                      <div className={styles.cardTags}>
                        {/* Display translated tags */}
                        {test.translatedTags.map((tag, index) => (
                          <span key={index} className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagHighlight : ''}`}>{tag}</span>
                        ))}
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.startTest}>{t('start_test_button', 'Start Test')}</span>
                        <span className={styles.arrowIcon}>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
          ) : (
              <p className={styles.noResults}>{t('no_tests_found', 'No tests found matching your criteria.')}</p>
          )}
        </section>
            {/* --- End Tests Grid --- */}

        </section>
        {/* --- End Tests Overview Section --- */}

        <section className={styles.ctaSection}>
                <div className={styles.ctaContent}>
                    <h2 className={styles.ctaTitle}>
                        {t('cta_missing_test_title', 'Missing a Test?')}
                    </h2>
                    <p className={styles.ctaText}>
                        {t('cta_add_own_text', 'Contribute to the suite! Researchers can sign up to add and manage their own cognitive tests within this platform.')}
                    </p>
                    {/* Conditional Button: Show Signup if not logged in, different message/link if logged in */}
                    {!session && status !== "loading" && (
                        <Link href="/auth/signup">
                            <div className={styles.ctaButton}>{t('cta_signup_button', 'Sign Up to Contribute')}</div>
                        </Link>
                    )}
                     {session && (
                          // Optionally link to where they would add tests in their dashboard
                         <Link href="/dashboard/studies">
                            <div className={styles.ctaButton}>{t('cta_manage_tests_button', 'Manage Your Tests')}</div>
                         </Link>
                     )}
                </div>
           </section>
      </main>

      <Footer />
    </div>
  );
}
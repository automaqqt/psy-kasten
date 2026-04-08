import { useState, useEffect, useRef } from 'react'; // Import useRef
import Link from 'next/link';
import Footer from '../components/ui/footer';
import styles from '../styles/Landing.module.css';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { TEST_TYPES } from '../lib/testConfig';
import { useSession } from 'next-auth/react';
import { IoLanguage } from 'react-icons/io5';
import { ThemeToggle } from '../components/ui/themeToggle';
import SeoHead from '../components/SeoHead';

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

  const toggleMobileTags = () => setIsMobileTagsExpanded(!isMobileTagsExpanded);

  // Keyboard navigation for locale dropdown
  const handleLocaleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsLocaleDropdownOpen(false);
      localeDropdownRef.current?.querySelector('button')?.focus();
      return;
    }
    if (!isLocaleDropdownOpen) return;

    const items = localeDropdownRef.current?.querySelectorAll('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const currentIndex = Array.from(items).indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex].focus();
    }
  };

  // Focus active locale item when dropdown opens
  useEffect(() => {
    if (isLocaleDropdownOpen && localeDropdownRef.current) {
      const activeItem = localeDropdownRef.current.querySelector(`.${styles.activeLocale}`)
        || localeDropdownRef.current.querySelector('[role="menuitem"]');
      activeItem?.focus();
    }
  }, [isLocaleDropdownOpen]);

  return (
    <div className={styles.container}>
      <SeoHead
        title={t('seo_landing_title', 'psyKasten | Cognitive Assessment Suite')}
        description={t('seo_landing_description', t('landing_page_description'))}
        keywords={t('seo_landing_keywords', '')}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'psyKasten',
              url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de'),
              description: t('seo_landing_description', t('landing_page_description')),
              inLanguage: ['de', 'en', 'es'],
            },
            {
              '@type': 'Organization',
              name: 'psyKasten',
              url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de'),
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de'}/logo.png`,
            },
            {
              '@type': 'ItemList',
              name: t('all_tests_section_title', 'All Tests'),
              numberOfItems: allCognitiveTests.length,
              itemListElement: allCognitiveTests.map((test, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: test.title,
                description: test.description,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de'}${test.route}`,
              })),
            },
          ],
        }}
      />

        {/* --- Top Bar with Login/Dashboard Button --- */}
        <header className={`${styles.topBar} ${isScrolled ? styles.topBarScrolled : ''}`}>
            <nav className={styles.topBarContent} aria-label={t('main_navigation', 'Main navigation')}>
            <div className={styles.logoContainer}> {/* Added container for layout */}
                        <Link href="/" passHref>
                          <div className={`${styles.logoLink} ${isScrolled ? styles.logoLinkScrolled : ''}`}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={t('logo_alt_text', 'psyKasten Logo')}
                                    fill
                                    sizes="(max-width: 768px) 30vw, (max-width: 1200px) 23vw, 10vw"
                                />
                            </div>
                        </Link>
                    </div>
                    <div className={styles.topBarControls}>
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Locale Switcher */}
                        <div className={styles.localeSwitcherContainer} ref={localeDropdownRef} onKeyDown={handleLocaleKeyDown}>
                            <button
                              onClick={toggleLocaleDropdown}
                              className={styles.iconButton}
                              aria-label={t('change_language', 'Change Language')}
                              aria-haspopup="true"
                              aria-expanded={isLocaleDropdownOpen}
                            >
                                <IoLanguage aria-hidden="true" />
                            </button>
                            {isLocaleDropdownOpen && (
                                <ul className={styles.localeDropdown} role="menu">
                                    {locales?.map((loc) => (
                                        <li key={loc} role="none">
                                            <button
                                                role="menuitem"
                                                onClick={() => changeLocale(loc)}
                                                className={loc === currentLocale ? styles.activeLocale : ''}
                                            >
                                                {loc.toUpperCase()}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                         {/* Login/Dashboard Button */}
                        {!isLoadingSession && (
                             session ? (
                                 <Link href="/dashboard" className={styles.dashboardButton}>{t('go_to_dashboard')}</Link>
                             ) : (
                                 <Link href="/auth/signin" className={styles.loginButton}>{t('login_button')}</Link>
                             )
                         )}
                        {isLoadingSession && <div className={styles.loadingSpinner} role="status" aria-label="Loading"></div>}
                    </div>
            </nav>
        </header>
        {/* --- End Top Bar --- */}


      <main className={styles.main} id="main-content">
        {/* --- Hero Section --- */}
        <section className={styles.heroSection}>
            <div className={styles.heroInner}>
                <div className={styles.heroTextColumn}>
                    <h1 className={styles.heroTitle}>psyKasten</h1>
                    <p className={styles.heroDescription}>
                        {t('landing_page_description', 'Explore standardized neuropsychological tests for measuring memory, attention, and executive functions. Designed for researchers and educational purposes.')}
                    </p>
                    <div className={styles.heroActions}>
                        <button onClick={scrollToTests} className={styles.heroButtonPrimary}>
                            {t('explore_tests_button', 'Explore Tests')}
                        </button>
                        {!isLoadingSession && (
                            session ? (
                                <Link href="/dashboard" className={styles.heroButtonSecondary}>
                                    {t('go_to_dashboard', 'Researcher Dashboard')}
                                </Link>
                            ) : (
                                <Link href="/info" className={styles.heroButtonSecondary}>
                                    {t('hero_learn_more', 'Learn More')}
                                </Link>
                            )
                        )}
                    </div>
                </div>
                <div className={styles.heroTestsColumn}>
                    {allCognitiveTests.map((test) => (
                        <Link href={test.route} key={test.id} className={styles.miniCard} style={{ '--mini-card-color': test.color }}>
                            <div className={styles.miniCardIcon}>
                                <span>{test.icon}</span>
                            </div>
                            <span className={styles.miniCardTitle}>{test.title}</span>
                        </Link>
                    ))}
                </div>
                <div className={styles.heroIconStrip}>
                    {allCognitiveTests.map((test) => (
                        <Link href={test.route} key={test.id} className={styles.iconBubble} style={{ '--bubble-color': test.color }}>
                            <span>{test.icon}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
        {/* --- End Hero Section --- */}


         {/* --- Tests Overview Section --- */}
         <section id="tests-overview" ref={testsSectionRef} className={styles.testsOverviewSection}>
            <h2 className={styles.allTestsTitle}>{t('all_tests_section_title', 'All Tests')}</h2>

            {/* --- Filters Section --- */}
            <div className={styles.filtersContainer}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder={t('search_tests_placeholder', 'Search tests...')}
                        aria-label={t('search_tests_placeholder', 'Search tests...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.tagFilter}>
                    <div className={styles.tagFilterHeader}>
                        <span className={styles.filterLabel} id="filter-by-tag-label">{t('filter_by_tag', 'Filter by Tag:')}</span>
                        {/* Mobile Toggle Button */}
                        <button
                          onClick={toggleMobileTags}
                          className={styles.mobileTagToggle}
                          aria-expanded={isMobileTagsExpanded}
                          aria-controls="tag-list-wrapper"
                        >
                            {isMobileTagsExpanded ? t('hide_tags', 'Hide') : t('show_tags', 'Show')}
                             <span className={isMobileTagsExpanded ? styles.arrowUp : styles.arrowDown} aria-hidden="true"></span>
                        </button>
                    </div>
                    <div id="tag-list-wrapper" className={`${styles.tagListWrapper} ${isMobileTagsExpanded ? styles.tagListWrapperExpanded : ''}`}>
                        <div className={styles.tagList} role="group" aria-labelledby="filter-by-tag-label">
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
                <Link href={test.route} key={test.id} className={styles.testCardLink}>
                    <div
                      className={`${styles.testCard} ${hoveredCard === test.id ? styles.wiggle : ''}`}
                      style={{ '--card-color': test.color, '--card-color-light': `${test.color}22` }}
                      onMouseEnter={() => handleCardHover(test.id)}
                      onMouseLeave={handleCardLeave}
                      onFocus={() => handleCardHover(test.id)}
                      onBlur={handleCardLeave}
                    >
                      <div className={styles.cardIconContainer}>
                        <span className={styles.cardIcon}>{test.icon}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{test.title}</h3>
                      <p className={styles.cardDescription}>{test.description}</p>
                      <div className={styles.cardTags}>
                        {test.translatedTags.map((tag, index) => (
                          <span key={index} className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagHighlight : ''}`}>{tag}</span>
                        ))}
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.startTest}>{t('start_test_button', 'Start Test')}</span>
                        <span className={styles.arrowIcon} aria-hidden="true">→</span>
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

        {/* --- Researcher CTA Banner --- */}
        <section className={styles.researcherBanner}>
            <div className={styles.researcherBannerInner}>
                <div className={styles.researcherBannerText}>
                    <h2>{t('res_banner_title', 'Built for Researchers')}</h2>
                    <p>{t('res_banner_text', 'Create studies, assign tests to participants, and export structured data — all from one dashboard.')}</p>
                </div>
                <Link href="/info" className={styles.researcherBannerBtn}>
                    {t('res_banner_btn', 'Learn More')}
                </Link>
            </div>
        </section>

        <section className={styles.ctaSection}>
                <div className={styles.ctaContent}>
                    <h2 className={styles.ctaTitle}>
                        {t('cta_missing_test_title', 'Missing a Test?')}
                    </h2>
                    <p className={styles.ctaText}>
                        {t('cta_add_own_text', 'Contribute to the suite! Researchers can sign up to add and manage their own cognitive tests within this platform.')}
                    </p>
                    {!session && status !== "loading" && (
                        <Link href="/auth/signup" className={styles.ctaButton}>
                            {t('cta_signup_button', 'Sign Up to Contribute')}
                        </Link>
                    )}
                     {session && (
                         <Link href="/dashboard/proposals/new" className={styles.ctaButton}>
                            {t('cta_manage_tests_button', 'Manage Your Tests')}
                         </Link>
                     )}
                </div>
           </section>

           <section className={styles.contactSection}>
              <p className={styles.contactText}>
                {t('contact_cta_text', 'Questions, ideas, or collaboration? Reach out to us.')}
              </p>
              <a href="mailto:kontakt@psykasten.de" className={styles.contactButton}>
                kontakt@psykasten.de
              </a>
           </section>
      </main>

      <Footer />
    </div>
  );
}
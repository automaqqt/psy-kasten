// components/TestPageWrapper.js
import { useRouter } from 'next/router';
import { submitResults } from '../lib/submitResults';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/TestTakePage.module.css';
import SeoHead from './SeoHead';
import LandscapeHint from './ui/LandscapeHint';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de';

/**
 * Shared wrapper for all test pages.
 *
 * Handles: assignment detection, result submission, loading/completion states, SEO, error display.
 *
 * Props:
 *  - TestComponent: the test's main React component
 *  - testId:        testConfig id (e.g. 'pvt', 'gng-sst')
 *  - namespace:     i18n namespace (e.g. 'pvt', 'gng')
 *  - route:         URL path (e.g. '/pvt', '/gng')
 *  - landscapeHint: show LandscapeHint component (default false)
 */
export default function TestPageWrapper({ TestComponent, testId, namespace, route, landscapeHint }) {
  const router = useRouter();
  const { t } = useTranslation([namespace, 'common']);
  const [assignmentId, setAssignmentId] = useState(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isCompletedAndSubmitted, setIsCompletedAndSubmitted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const idFromQuery = router.query.assignmentId;
      if (idFromQuery && typeof idFromQuery === 'string') {
        setAssignmentId(idFromQuery);
        setIsStandalone(false);
      } else {
        setIsStandalone(true);
      }
      setInitialCheckDone(true);
    }
  }, [router.query]);

  const handleSubmissionAttempt = async (testData) => {
    if (isStandalone || !assignmentId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await submitResults(assignmentId, testData);
    setIsSubmitting(false);
    if (result.success) {
      setIsCompletedAndSubmitted(true);
    } else {
      let displayError = result.message || t('common:failed_to_submit');
      if (result.message && result.message.includes('already submitted')) {
        setIsCompletedAndSubmitted(true);
        displayError = null;
      }
      setSubmitError(displayError);
    }
  };

  // Derive SEO keys from testId
  const idUnderscore = testId.replace(/-/g, '_');

  if (!initialCheckDone) {
    return <div className={styles.container}><p className={styles.loading}>{t('common:loading')}</p></div>;
  }

  if (isCompletedAndSubmitted && !isStandalone) {
    return (
      <div className={styles.container}>
        <div className={styles.completionMessage}>
          <h1>{t('common:thank_you')}</h1>
          <p>{t('common:results_submitted')}</p>
          <p>{t('common:close_window')}</p>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return <div className={styles.container}><p className={styles.loading}>{t('common:submitting')}</p></div>;
  }

  return (
    <>
      <SeoHead
        title={t(`common:seo_${testId}_title`, t('test_title_standalone'))}
        description={t(`common:seo_${testId}_description`, t('welcome_p1'))}
        keywords={t(`common:seo_${testId}_keywords`, '')}
        path={route}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: t(`common:${idUnderscore}_title`),
          description: t(`common:${idUnderscore}_description`),
          url: `${SITE_URL}${route}`,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          author: { '@type': 'Organization', name: 'psyKasten' },
        }}
      />

      {landscapeHint && <LandscapeHint />}

      <TestComponent
        key={assignmentId || 'standalone'}
        assignmentId={assignmentId}
        isStandalone={isStandalone}
        onComplete={handleSubmissionAttempt}
        t={t}
      />

      {submitError && (
        <div className={styles.submitErrorContainer}>
          <p className={styles.submitError}>{t('common:submission_error')}: {submitError}</p>
        </div>
      )}
    </>
  );
}


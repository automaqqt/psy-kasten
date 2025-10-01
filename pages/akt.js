import Head from 'next/head';
import { useRouter } from 'next/router';
import AktTest from '../components/tests/AktTest';
import { submitResults } from '../lib/submitResults';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../styles/TestTakePage.module.css';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'akt'])),
    },
  };
}

export default function AktPage(props) {
  const router = useRouter();
  const { t } = useTranslation(['akt', 'common']);
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
      <Head>
        <title>{isStandalone ? 'AKT Test (Standalone)' : 'AKT Test'}</title>
        <meta name="description" content="Alters-Konzentrations-Test (AKT)" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AktTest
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

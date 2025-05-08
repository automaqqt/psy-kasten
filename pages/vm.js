// pages/vm.js
"use client"
import Head from 'next/head';
import { useRouter } from 'next/router';
import VMTest from '../components/tests/vm/test';
import { submitResults } from '../lib/submitResults';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next'; // Using a library like next-i18next is common
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../styles/TestTakePage.module.css'; // Optional common styling

export async function getStaticProps({ locale }) {
    console.log(locale);
    return {
      props: {
        // Pass the translations for the current locale to the page
        // Requires 'common' and 'vm' namespaces (JSON files)
        ...(await serverSideTranslations(locale, ['common', 'vm'])),
      },
    };
  }

export default function VMPage(props) {
    const router = useRouter();
    const { t } = useTranslation(['vm', 'common']);
    const [assignmentId, setAssignmentId] = useState(null);
    const [isStandalone, setIsStandalone] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isCompletedAndSubmitted, setIsCompletedAndSubmitted] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    
    useEffect(() => {
      if (router.isReady) {
         const idFromQuery = router.query.assignmentId;
         console.log(idFromQuery)
         if (idFromQuery && typeof idFromQuery === 'string') {
              setAssignmentId(idFromQuery);
              setIsStandalone(false);
              console.log(isStandalone, assignmentId)
         } else {
             setIsStandalone(true);
         }
         setInitialCheckDone(true);
      }
    }, [router.query]);
  
    // Submission handler - ONLY called by VMTest if NOT standalone
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
                 setIsCompletedAndSubmitted(true); // Treat as complete
                 displayError = null; // Don't show error if already submitted
                 console.log("Results were already submitted.");
             }
            setSubmitError(displayError);
        }
    };
  
    // --- Render Logic ---
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

    // --- Default Render: Show the Test ---
    return (
        <>
          <Head>
            {/* Use translation for title */}
            <title>{isStandalone ? t('vm:test_title_standalone') : t('vm:test_title')}</title>
            <meta name="description" content={t('vm:welcome_p1')} /> {/* Example meta description */}
            <link rel="icon" href="/favicon.ico" />
          </Head>

          {/* Pass t function and potentially specific strings to child if needed */}
          <VMTest
             key={assignmentId || 'standalone'}
             assignmentId={assignmentId}
             isStandalone={isStandalone}
             onComplete={handleSubmissionAttempt}
             t={t} // Pass translation function
          />

          {submitError && (
              <div className={styles.submitErrorContainer}>
                {/* Use translation for error message header */}
                <p className={styles.submitError}>{t('common:submission_error')}: {submitError}</p>
              </div>
          )}
        </>
    );
}
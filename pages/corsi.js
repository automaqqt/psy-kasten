// pages/corsi.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import CorsiTest from '../components/tests/corsi/test';
import { submitResults } from '../lib/submitResults';
import { useState, useEffect } from 'react';
import styles from '../styles/TestTakePage.module.css'; // Optional common styling

export default function CorsiPage() {
    const router = useRouter();
    const [assignmentId, setAssignmentId] = useState(null);
    const [isStandalone, setIsStandalone] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isCompletedAndSubmitted, setIsCompletedAndSubmitted] = useState(false); // NEW: Track successful *submission*
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
    }, [ router.query]);
  
  
    // Submission handler - ONLY called by CorsiTest if NOT standalone
    const handleSubmissionAttempt = async (testData) => {
      // This should only be called if assignmentId is valid, but double-check
      if (isStandalone || !assignmentId) {
          console.warn("handleSubmissionAttempt called unexpectedly in standalone mode or without assignmentId.");
          return;
      }
  
      setIsSubmitting(true);
      setSubmitError(null);
      console.log(`Attempting to submit results for assignment: ${assignmentId}`);
  
      const result = await submitResults(assignmentId, testData);
  
      setIsSubmitting(false);
      if (result.success) {
          console.log("Submission successful.");
          setIsCompletedAndSubmitted(true); // Set flag for final "Thank You" message
      } else {
          console.error("Submission failed:", result.message);
          setSubmitError(result.message || "Failed to submit results.");
          // Handle specific errors like already submitted
          if (result.message && result.message.includes('already submitted')) {
               setIsCompletedAndSubmitted(true); // Treat as completed, show message
               setSubmitError(null);
          }
      }
    };
  
    // --- Render Logic ---
    if (!initialCheckDone) {
       return <div className={styles.container}><p className={styles.loading}>Loading...</p></div>;
    }
  
    // Show final "Thank You" page only after successful submission (not in standalone)
    if (isCompletedAndSubmitted && !isStandalone) {
       return (
         <div className={styles.container}>
           <div className={styles.completionMessage}>
               <h1>Thank You!</h1>
               <p>Your test results have been recorded.</p>
               <p>You may now close this window.</p>
           </div>
         </div>
       );
     }
  
     // Show submission loading state
     if (isSubmitting) {
        return <div className={styles.container}><p className={styles.loading}>Submitting results...</p></div>;
     }

   // --- Default Render: Show the Test ---
  return (
    <>
      <Head>
        <title>Corsi Block-Tapping Test {isStandalone ? '(Standalone)' : ''}</title>
        <meta name="description" content="Complete the Corsi Block-Tapping Test" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Pass assignmentId (which might be null) and completion handler */}
      {initialCheckDone && <CorsiTest
         key={assignmentId || 'standalone'} // Force re-mount if assignmentId changes (unlikely here, but good practice)
         assignmentId={assignmentId}
         onComplete={handleSubmissionAttempt}
         isStandalone={isStandalone} // Pass mode to test component if needed
      />}

      {submitError && (
          <div className={styles.submitErrorContainer}>
            <p className={styles.submitError}>Submission Error: {submitError}</p>
            {/* Optionally add a retry button */}
            {/* <button onClick={() => handleTestComplete(LAST_TEST_DATA)}>Retry Submission</button> */}
          </div>
      )}
    </>
  );
}
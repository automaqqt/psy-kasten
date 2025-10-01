// pages/tol.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import TOLTest from '../components/tests/tol/test';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tol'])),
    },
  };
}

export default function TOLPage() {
  const router = useRouter();
  const { t } = useTranslation(['tol', 'common']);
  const [assignmentId, setAssignmentId] = useState(null);
  const [isStandalone, setIsStandalone] = useState(true);
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
  }, [router.query, router.isReady]);

  if (!initialCheckDone) {
    return <div><p>{t('common:loading')}</p></div>;
  }

  return (
    <>
      <Head>
        <title>{isStandalone ? t('test_title_standalone') : t('test_title')}</title>
        <meta name="description" content={t('welcome_p1')} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TOLTest
        key={assignmentId || 'standalone'}
        assignmentId={assignmentId}
        isStandalone={isStandalone}
        t={t}
      />
    </>
  );
}
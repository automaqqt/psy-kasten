import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import WtbTest from '../components/tests/WtbTest';

export default function WtbPage() {
  const { t } = useTranslation(['wtb', 'common']);

  return (
    <>
      <Head>
        <title>{t('test_title_standalone')} - psyKasten</title>
        <meta name="description" content={t('welcome_p1')} />
      </Head>
      <WtbTest
        isStandalone={true}
        t={t}
      />
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['wtb', 'common'])),
    },
  };
}
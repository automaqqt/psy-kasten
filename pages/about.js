import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Footer from '../components/ui/footer';
import SeoHead from '../components/SeoHead';
import styles from '../styles/Landing.module.css';
import aboutStyles from '../styles/About.module.css';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default function About() {
  const { t } = useTranslation('common');

  return (
    <>
      <SeoHead title={`${t('about_page_title')} | psyKasten`} description={t('about_page_subtitle')} />
      <div className={styles.container}>
        <main id="main-content" className={aboutStyles.main}>
          <Link href="/" className={aboutStyles.backLink}>
            &larr; {t('privacy_back', 'Home')}
          </Link>

          <h1 className={aboutStyles.title}>{t('about_page_title')}</h1>
          <p className={aboutStyles.subtitle}>{t('about_page_subtitle')}</p>

          <section className={aboutStyles.section}>
            <h2>{t('about_why_title')}</h2>
            <p>{t('about_why_p1')}</p>
            <p>{t('about_why_p2')}</p>
          </section>

          <section className={aboutStyles.section}>
            <h2>{t('about_researchers_title')}</h2>
            <ul className={aboutStyles.benefitList}>
              <li>
                <strong>{t('about_researchers_1_label')}</strong> &mdash; {t('about_researchers_1_text')}
              </li>
              <li>
                <strong>{t('about_researchers_2_label')}</strong> &mdash; {t('about_researchers_2_text')}
              </li>
              <li>
                <strong>{t('about_researchers_3_label')}</strong> &mdash; {t('about_researchers_3_text')}
              </li>
              <li>
                <strong>{t('about_researchers_4_label')}</strong> &mdash; {t('about_researchers_4_text')}
              </li>
            </ul>
          </section>

          <section className={aboutStyles.section}>
            <h2>{t('about_participants_title')}</h2>
            <ul className={aboutStyles.benefitList}>
              <li>
                <strong>{t('about_participants_1_label')}</strong> &mdash; {t('about_participants_1_text')}
              </li>
              <li>
                <strong>{t('about_participants_2_label')}</strong> &mdash; {t('about_participants_2_text')}
              </li>
              <li>
                <strong>{t('about_participants_3_label')}</strong> &mdash; {t('about_participants_3_text')}
              </li>
              <li>
                <strong>{t('about_participants_4_label')}</strong> &mdash; {t('about_participants_4_text')}
              </li>
            </ul>
          </section>

          <section className={aboutStyles.section}>
            <h2>{t('about_tests_title')}</h2>
            <p>{t('about_tests_p1')}</p>
            <p>
              {t('about_tests_p2_prefix')}{' '}
              <Link href="/dashboard/proposals/new" style={{ color: 'var(--link-color)' }}>
                {t('about_tests_p2_link')}
              </Link>{' '}
              {t('about_tests_p2_suffix')}
            </p>
          </section>

          <section className={aboutStyles.section}>
            <h2>{t('about_who_title')}</h2>
            <p>{t('about_who_p1')}</p>
            <p>{t('about_who_p2')}</p>
          </section>

          <section className={aboutStyles.section}>
            <h2>{t('about_contact_title')}</h2>
            <p>{t('about_contact_text')}</p>
          </section>

          <div className={aboutStyles.ctaRow}>
            <a href="mailto:kontakt@psykasten.de" className={aboutStyles.ctaButton}>
              kontakt@psykasten.de
            </a>
            <Link href="/" className={aboutStyles.ctaButtonSecondary}>
              {t('about_explore_tests')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

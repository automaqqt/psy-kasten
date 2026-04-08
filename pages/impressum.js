import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Footer from '../components/ui/footer';
import SeoHead from '../components/SeoHead';
import styles from '../styles/Landing.module.css';
import s from '../styles/Researchers.module.css';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default function ImpressumPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <SeoHead
        title={`${t('impressum_page_title')} | psyKasten`}
        description={t('impressum_page_title')}
      />
      <div className={styles.container}>
        <main id="main-content" className={s.main}>
          <Link href="/" className={s.backLink}>
            &larr; {t('privacy_back', 'Home')}
          </Link>

          <h1 className={s.title}>{t('impressum_page_title')}</h1>
          <p className={s.subtitle}>{t('impressum_date')}</p>

          <section className={s.section}>
            <h2>{t('impressum_responsible_title')}</h2>
            <p>
              {t('impressum_name')}<br />
              {t('impressum_address')}<br />
              {t('impressum_city')}
            </p>
          </section>

          <section className={s.section}>
            <h2>{t('impressum_contact_title')}</h2>
            <p>
              {t('impressum_email_label')}: <a href="mailto:kontakt@psykasten.de" style={{ color: 'var(--link-color)' }}>kontakt@psykasten.de</a>
            </p>
          </section>

          <section className={s.section}>
            <h2>{t('impressum_responsible_content_title')}</h2>
            <p>{t('impressum_responsible_content_text')}</p>
            <p>
              {t('impressum_name')}<br />
              {t('impressum_address')}<br />
              {t('impressum_city')}
            </p>
          </section>

          <section className={s.section}>
            <h2>{t('impressum_disclaimer_title')}</h2>
            <p>{t('impressum_disclaimer_text')}</p>
          </section>

          <section className={s.section}>
            <h2>{t('impressum_links_title')}</h2>
            <p>{t('impressum_links_text')}</p>
          </section>

          <section className={s.section}>
            <h2>{t('impressum_copyright_title')}</h2>
            <p>{t('impressum_copyright_text')}</p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

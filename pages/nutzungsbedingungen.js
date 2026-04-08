import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Footer from '../components/ui/footer';
import SeoHead from '../components/SeoHead';
import styles from '../styles/Landing.module.css';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default function Nutzungsbedingungen() {
  const { t } = useTranslation('common');

  return (
    <>
      <SeoHead title={`${t('terms_page_title')} | psyKasten`} description={t('terms_page_title')} />
      <div className={styles.container}>
        <main id="main-content" style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <Link href="/" style={{ color: 'var(--link-color)', textDecoration: 'none', fontSize: '0.95rem' }}>
            &larr; {t('terms_back')}
          </Link>

          <h1 style={{ margin: '1.5rem 0 0.5rem' }}>{t('terms_page_title')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {t('terms_date')}
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_1_title')}</h2>
            <p>{t('terms_1_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_2_title')}</h2>
            <p>{t('terms_2_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_3_title')}</h2>
            <p>{t('terms_3_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_4_title')}</h2>
            <p>{t('terms_4_intro')}</p>
            <ul>
              <li>{t('terms_4_item_1')}</li>
              <li>{t('terms_4_item_2')}</li>
              <li>{t('terms_4_item_3')}</li>
              <li>{t('terms_4_item_4')}</li>
              <li>{t('terms_4_item_5')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_5_title')}</h2>
            <p>{t('terms_5_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_6_title')}</h2>
            <p>{t('terms_6_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_7_title')}</h2>
            <p>
              {t('terms_7_text_prefix')}{' '}
              <Link href="/datenschutz" style={{ color: 'var(--link-color)' }}>
                {t('terms_7_text_link')}
              </Link>
              {t('terms_7_text_suffix')}
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_8_title')}</h2>
            <p>{t('terms_8_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_9_title')}</h2>
            <p>{t('terms_9_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('terms_10_title')}</h2>
            <p>{t('terms_10_text')}</p>
            <div style={{ marginTop: '1rem' }}>
              <a
                href="mailto:kontakt@psykasten.de"
                style={{
                  display: 'inline-block',
                  padding: '0.7rem 1.5rem',
                  background: 'var(--link-color, #3b82f6)',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                }}
              >
                kontakt@psykasten.de
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

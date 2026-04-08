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

export default function Datenschutz() {
  const { t } = useTranslation('common');

  return (
    <>
      <SeoHead title={`${t('privacy_page_title')} | psyKasten`} description={t('privacy_page_title')} />
      <div className={styles.container}>
        <main id="main-content" style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <Link href="/" style={{ color: 'var(--link-color)', textDecoration: 'none', fontSize: '0.95rem' }}>
            &larr; {t('privacy_back')}
          </Link>

          <h1 style={{ margin: '1.5rem 0 0.5rem' }}>{t('privacy_page_title')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {t('privacy_date')}
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_1_title')}</h2>
            <p>
              {t('privacy_1_text_name')}<br />
              {t('privacy_1_text_address')}<br />
              E-Mail:{' '}
              <a href="mailto:kontakt@psykasten.de" style={{ color: 'var(--link-color)' }}>
                kontakt@psykasten.de
              </a>
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_2_title')}</h2>
            <p>{t('privacy_2_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_3_title')}</h2>
            <p>{t('privacy_3_text')}</p>
            <ul>
              <li>{t('privacy_3_item_ip')}</li>
              <li>{t('privacy_3_item_date')}</li>
              <li>{t('privacy_3_item_url')}</li>
              <li>{t('privacy_3_item_browser')}</li>
              <li>{t('privacy_3_item_referrer')}</li>
            </ul>
            <p>{t('privacy_3_text2')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_4_title')}</h2>
            <p>{t('privacy_4_intro')}</p>
            <ul>
              <li>
                <strong>{t('privacy_4_session_label')}</strong> {t('privacy_4_session_text')}
              </li>
              <li>
                <strong>{t('privacy_4_csrf_label')}</strong> {t('privacy_4_csrf_text')}
              </li>
              <li>
                <strong>{t('privacy_4_locale_label')}</strong> {t('privacy_4_locale_text')}
              </li>
            </ul>
            <p>{t('privacy_4_theme')}</p>
            <p>{t('privacy_4_no_tracking')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_4a_title')}</h2>
            <p>{t('privacy_4a_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_5_title')}</h2>
            <p>{t('privacy_5_intro')}</p>
            <ul>
              <li>{t('privacy_5_item_name')}</li>
              <li>{t('privacy_5_item_password')}</li>
              <li>{t('privacy_5_item_google')}</li>
            </ul>
            <p>{t('privacy_5_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_6_title')}</h2>
            <p>{t('privacy_6_intro')}</p>
            <ul>
              <li>{t('privacy_6_item_id')}</li>
              <li>{t('privacy_6_item_meta')}</li>
              <li>{t('privacy_6_item_results')}</li>
              <li>{t('privacy_6_item_time')}</li>
            </ul>
            <p>{t('privacy_6_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_7_title')}</h2>
            <p>{t('privacy_7_p1')}</p>
            <p>
              {t('privacy_7_p2_prefix')}{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--link-color)' }}
              >
                {t('privacy_7_p2_link')}
              </a>.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_8_title')}</h2>
            <p>{t('privacy_8_intro')}</p>
            <ul>
              <li><strong>{t('privacy_8_access')}</strong> {t('privacy_8_access_text')}</li>
              <li><strong>{t('privacy_8_rectification')}</strong> {t('privacy_8_rectification_text')}</li>
              <li><strong>{t('privacy_8_erasure')}</strong> {t('privacy_8_erasure_text')}</li>
              <li><strong>{t('privacy_8_restriction')}</strong> {t('privacy_8_restriction_text')}</li>
              <li><strong>{t('privacy_8_portability')}</strong> {t('privacy_8_portability_text')}</li>
              <li><strong>{t('privacy_8_objection')}</strong> {t('privacy_8_objection_text')}</li>
            </ul>
            <p>
              {t('privacy_8_contact_prefix')}{' '}
              <a href="mailto:kontakt@psykasten.de" style={{ color: 'var(--link-color)' }}>
                kontakt@psykasten.de
              </a>.{' '}
              {t('privacy_8_complaint')}
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_9_title')}</h2>
            <p>{t('privacy_9_text')}</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_10_title')}</h2>
            <p>{t('privacy_10_text')}</p>
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

          <section style={{ marginBottom: '2rem' }}>
            <h2>{t('privacy_11_title')}</h2>
            <p>{t('privacy_11_text')}</p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

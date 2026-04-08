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

export default function InfoPage() {
  const { t } = useTranslation('common');

  const faqItems = [
    { q: 'faq_free_q', a: 'faq_free_a' },
    { q: 'faq_account_q', a: 'faq_account_a' },
    { q: 'faq_tests_q', a: 'faq_tests_a' },
    { q: 'faq_data_q', a: 'faq_data_a' },
    { q: 'faq_export_q', a: 'faq_export_a' },
    { q: 'faq_participants_q', a: 'faq_participants_a' },
    { q: 'faq_language_q', a: 'faq_language_a' },
    { q: 'faq_own_test_q', a: 'faq_own_test_a' },
    { q: 'faq_devices_q', a: 'faq_devices_a' },
    { q: 'faq_contact_q', a: 'faq_contact_a' },
  ];

  const steps = [
    { num: '1', key: 'step_signup' },
    { num: '2', key: 'step_create_study' },
    { num: '3', key: 'step_add_participants' },
    { num: '4', key: 'step_share_links' },
    { num: '5', key: 'step_collect_results' },
    { num: '6', key: 'step_export' },
  ];

  const features = [
    { icon: '📋', titleKey: 'feat_study_mgmt_title', textKey: 'feat_study_mgmt_text' },
    { icon: '👥', titleKey: 'feat_participants_title', textKey: 'feat_participants_text' },
    { icon: '🔗', titleKey: 'feat_links_title', textKey: 'feat_links_text' },
    { icon: '📊', titleKey: 'feat_analytics_title', textKey: 'feat_analytics_text' },
    { icon: '📥', titleKey: 'feat_export_title', textKey: 'feat_export_text' },
    { icon: '🌐', titleKey: 'feat_i18n_title', textKey: 'feat_i18n_text' },
  ];

  return (
    <>
      <SeoHead
        title={`${t('res_page_title')} | psyKasten`}
        description={t('res_page_subtitle')}
      />
      <div className={styles.container}>
        <main id="main-content" className={s.main}>
          <Link href="/" className={s.backLink}>
            &larr; {t('privacy_back', 'Home')}
          </Link>

          <h1 className={s.title}>{t('res_page_title')}</h1>
          <p className={s.subtitle}>{t('res_page_subtitle')}</p>

          {/* --- How it works --- */}
          <section className={s.section}>
            <h2>{t('res_how_it_works')}</h2>
            <p>{t('res_how_intro')}</p>
            <ol className={s.stepList}>
              {steps.map((step) => (
                <li key={step.num} className={s.stepItem}>
                  <span className={s.stepNum}>{step.num}</span>
                  <div>
                    <strong>{t(`res_${step.key}_title`)}</strong>
                    <p>{t(`res_${step.key}_text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* --- Features grid --- */}
          <section className={s.section}>
            <h2>{t('res_features_title')}</h2>
            <div className={s.featureGrid}>
              {features.map((feat) => (
                <div key={feat.titleKey} className={s.featureCard}>
                  <span className={s.featureIcon}>{feat.icon}</span>
                  <h3>{t(`res_${feat.titleKey}`)}</h3>
                  <p>{t(`res_${feat.textKey}`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* --- Test flow --- */}
          <section className={s.section}>
            <h2>{t('res_test_flow_title')}</h2>
            <p>{t('res_test_flow_intro')}</p>
            <div className={s.flowSteps}>
              {['welcome', 'tutorial', 'demo', 'practice', 'countdown', 'test', 'results'].map((phase, i, arr) => (
                <span key={phase} className={s.flowBadge}>
                  {t(`res_phase_${phase}`)}
                  {i < arr.length - 1 && <span className={s.flowArrow} aria-hidden="true">&rarr;</span>}
                </span>
              ))}
            </div>
            <p className={s.flowNote}>{t('res_test_flow_note')}</p>
          </section>

          {/* --- Data & privacy --- */}
          <section className={s.section}>
            <h2>{t('res_data_title')}</h2>
            <p>{t('res_data_text')}</p>
            <ul className={s.checkList}>
              <li>{t('res_data_no_ip')}</li>
              <li>{t('res_data_no_tracking')}</li>
              <li>{t('res_data_pseudonym')}</li>
              <li>{t('res_data_encrypted')}</li>
              <li>{t('res_data_eu_hosted')}</li>
            </ul>
            <p>
              {t('res_data_details_prefix')}{' '}
              <Link href="/datenschutz" style={{ color: 'var(--link-color)' }}>
                {t('res_data_details_link')}
              </Link>.
            </p>
          </section>

          {/* --- Available tests hint --- */}
          <section className={s.section}>
            <h2>{t('res_tests_title')}</h2>
            <p>{t('res_tests_text')}</p>
            <p>
              {t('res_propose_prefix')}{' '}
              <Link href="/dashboard/proposals/new" style={{ color: 'var(--link-color)' }}>
                {t('res_propose_link')}
              </Link>{' '}
              {t('res_propose_suffix')}
            </p>
          </section>

          {/* --- FAQ --- */}
          <section className={s.section}>
            <h2>{t('res_faq_title')}</h2>
            <div className={s.faqList}>
              {faqItems.map((item) => (
                <details key={item.q} className={s.faqItem}>
                  <summary className={s.faqQuestion}>{t(`res_${item.q}`)}</summary>
                  <p className={s.faqAnswer}>{t(`res_${item.a}`)}</p>
                </details>
              ))}
            </div>
          </section>

          {/* --- CTA --- */}
          <section className={s.ctaSection}>
            <h2>{t('res_cta_title')}</h2>
            <p>{t('res_cta_text')}</p>
            <div className={s.ctaRow}>
              <Link href="/auth/signin" className={s.ctaPrimary}>
                {t('res_cta_login')}
              </Link>
              <a href="mailto:kontakt@psykasten.de" className={s.ctaSecondary}>
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

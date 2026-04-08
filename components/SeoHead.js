import Head from 'next/head';
import { useRouter } from 'next/router';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de';

const LOCALE_MAP = {
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
};

export default function SeoHead({ title, description, keywords, path, jsonLd }) {
  const { locale, locales, asPath } = useRouter();
  const cleanPath = path || asPath.split('?')[0];
  const canonicalUrl = `${SITE_URL}${locale === 'de' ? '' : `/${locale}`}${cleanPath === '/' ? '' : cleanPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang alternates */}
      {locales.map((loc) => {
        const href = `${SITE_URL}${loc === 'de' ? '' : `/${loc}`}${cleanPath === '/' ? '' : cleanPath}`;
        return <link key={loc} rel="alternate" hrefLang={loc} href={href} />;
      })}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="psyKasten" />
      <meta property="og:locale" content={LOCALE_MAP[locale] || 'de_DE'} />
      {locales
        .filter((loc) => loc !== locale)
        .map((loc) => (
          <meta key={loc} property="og:locale:alternate" content={LOCALE_MAP[loc]} />
        ))}
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="psyKasten - Cognitive Assessment Suite" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}

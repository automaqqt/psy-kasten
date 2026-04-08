import { TEST_TYPES } from '../lib/testConfig';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://psykasten.de';

const locales = ['de', 'en', 'es'];
const defaultLocale = 'de';

// All public pages that should be indexed
const publicPaths = [
  '/',
  ...TEST_TYPES.map((t) => t.route),
];

function generateSitemap() {
  const urls = publicPaths.map((path) => {
    const cleanPath = path === '/' ? '' : path;
    const loc = `${SITE_URL}${cleanPath}`;

    const hreflangs = locales
      .map((locale) => {
        const prefix = locale === defaultLocale ? '' : `/${locale}`;
        return `      <xhtml:link rel="alternate" hreflang="${locale}" href="${SITE_URL}${prefix}${cleanPath}" />`;
      })
      .join('\n');

    const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${cleanPath}" />`;

    return `  <url>
    <loc>${loc}</loc>
${hreflangs}
${xDefault}
    <changefreq>${path === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSitemap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}

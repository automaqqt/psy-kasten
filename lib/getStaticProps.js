import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

/**
 * Helper to create getStaticProps for test pages.
 * Usage: export const getStaticProps = createGetStaticProps('pvt');
 */
export function createGetStaticProps(namespace) {
  return async function getStaticProps({ locale }) {
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', namespace])),
      },
    };
  };
}

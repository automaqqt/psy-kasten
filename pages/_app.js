import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from 'next-themes'; // Import ThemeProvider
import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      {/* Wrap with ThemeProvider */}
      {/* attribute="class" is common for Tailwind, data-theme for CSS vars */}
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp);
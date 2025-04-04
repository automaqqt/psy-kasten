import { SessionProvider } from "next-auth/react";
import '../styles/globals.css'; // Your global styles

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    // Provide the session to all components
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
// next-i18next.config.js
const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'de',
    locales: ['en', 'es', 'de'], // Must match next.config.js
  },
  // Optional: Specify path to locale files if not using default './public/locales'
  localePath: path.resolve('./locales'),
  // Optional: Reload translations in development on change
  // reloadOnPrerender: process.env.NODE_ENV === 'development',
};
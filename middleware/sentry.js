// middleware/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://3c0c49d6c1a8430052637b227182e28d@o4509011678593024.ingest.us.sentry.io/4509011684229120', // Замените на ваш DSN, полученный из Sentry
  tracesSampleRate: 1.0,  // Настройте по необходимости (1.0 означает 100% трассировки)
});

module.exports = Sentry;

// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Создаем лимитер запросов для всех API маршрутов (например, 100 запросов за 15 минут)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут в миллисекундах
  max: 100, // ограничение — 100 запросов с одного IP за окно
  message: {
    error: 'Слишком много запросов, пожалуйста, попробуйте снова позже.'
  },
  standardHeaders: true, // Возвращать информацию о лимите в заголовках RateLimit-*
  legacyHeaders: false,  // Отключить заголовок X-RateLimit-*
});

module.exports = apiLimiter;

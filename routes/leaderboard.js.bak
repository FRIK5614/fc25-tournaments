// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your_super_secret_key';

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// GET /leaderboard
// Возвращает топ-10 игроков, отсортированных по рейтингу (по убыванию)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // По умолчанию возвращаем 10 лучших игроков, можно добавить параметр page или limit
    const topPlayers = await User.find()
      .sort({ rating: -1 })
      .limit(10)
      .select('username email rating gamertag'); // выбираем необходимые поля, пароль исключаем
    res.status(200).json(topPlayers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

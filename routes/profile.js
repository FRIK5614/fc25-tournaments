// routes/profile.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

const JWT_SECRET = 'your_super_secret_key';

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// GET /profile — возвращает профиль текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /profile — обновление профиля текущего пользователя
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { username, phone, country, platform, gamertag } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, phone, country, platform, gamertag },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /profile/stats — возвращает статистику турниров для текущего пользователя
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const tournamentsPlayed = await Tournament.countDocuments({ 'players.userId': req.user.id });
    // Здесь можно добавить дополнительные вычисления статистики (например, победы, поражения и т.д.)
    res.json({ tournamentsPlayed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

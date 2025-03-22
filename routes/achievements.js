// routes/achievements.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Achievement = require('../models/Achievement');
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

// Middleware для проверки роли администратора
async function isAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// GET /achievements — получение достижений текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user.id }).sort({ dateAwarded: -1 });
    res.status(200).json(achievements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /achievements — добавление достижения (только для администраторов)
// Ожидается тело запроса: { "userId": "ID_пользователя", "title": "Название", "description": "Описание" }
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, title, description } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId и title обязательны' });
    }
    const newAchievement = new Achievement({ userId, title, description });
    await newAchievement.save();
    res.status(201).json({ message: 'Достижение добавлено', achievement: newAchievement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Опционально: GET /achievements/all — получение всех достижений (только для администраторов)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ dateAwarded: -1 }).populate('userId', 'username email');
    res.status(200).json(achievements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

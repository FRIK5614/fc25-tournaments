// routes/audit.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');
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
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// POST /audit – ручное добавление записи аудита (обычно записи создаются автоматически в нужных местах кода)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Поле "action" обязательно' });
    }
    const newLog = new AuditLog({
      userId: req.user.id,
      action,
      details: details || {}
    });
    await newLog.save();
    res.status(201).json({ message: 'Запись аудита создана', auditLog: newLog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /audit – получение всех записей аудита (доступно только для администраторов)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).populate('userId', 'email username');
    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

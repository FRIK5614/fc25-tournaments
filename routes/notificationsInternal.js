// routes/notificationsInternal.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

const JWT_SECRET = 'your_super_secret_key'; // Используйте переменную окружения в продакшене

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

// GET /notifications/internal — получение уведомлений для текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notifications/internal — создание уведомления (например, для тестирования или администрирования)
// В теле запроса ожидается: { "userId": "ID_пользователя", "type": "tournament", "message": "Тестовое уведомление" }
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type, and message are required' });
    }
    const newNotification = new Notification({ userId, type, message });
    await newNotification.save();
    res.status(201).json({ message: 'Notification created', notification: newNotification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /notifications/internal/:id — пометка уведомления как прочитанного
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { status: 'read' },
      { new: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json({ message: 'Notification marked as read', notification: updatedNotification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate'); // Предполагается, что такой middleware уже существует

// GET /notifications — возвращает уведомления для текущего пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /notifications/:id/read — отмечает уведомление как прочитанное
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Уведомление не найдено' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

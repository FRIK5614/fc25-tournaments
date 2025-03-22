// routes/friends.js
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

// GET /friends – получение списка друзей текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'username email gamertag rating');
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.status(200).json({ friends: user.friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /friends/add – добавление друга по friendId или email
// Ожидается в теле запроса: { "friendId": "ID_пользователя" } или { "email": "friend@example.com" }
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { friendId, email } = req.body;
    let friend;
    if (friendId) {
      friend = await User.findById(friendId);
    } else if (email) {
      friend = await User.findOne({ email });
    } else {
      return res.status(400).json({ error: 'friendId или email обязательны' });
    }
    if (!friend) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    // Запрещаем добавление самого себя
    if (friend._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Нельзя добавить себя в друзья' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    // Проверяем, что такого друга еще нет
    if (user.friends && user.friends.includes(friend._id)) {
      return res.status(400).json({ error: 'Пользователь уже в друзьях' });
    }
    user.friends.push(friend._id);
    await user.save();
    res.status(200).json({ message: 'Пользователь добавлен в друзья', friend });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /friends/:id – удаление друга по friendId
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const friendId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const index = user.friends.indexOf(friendId);
    if (index === -1) {
      return res.status(400).json({ error: 'Пользователь не найден в списке друзей' });
    }
    user.friends.splice(index, 1);
    await user.save();
    res.status(200).json({ message: 'Пользователь удалён из друзей' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

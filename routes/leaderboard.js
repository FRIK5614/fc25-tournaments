const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /leaderboard
 * Возвращает список пользователей, отсортированных по рейтингу (от высокого к низкому)
 */
router.get('/', async (req, res) => {
  try {
    // Выбираем только необходимые поля
    const users = await User.find().sort({ rating: -1 }).select('username rating email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

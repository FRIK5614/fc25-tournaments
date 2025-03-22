// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /leaderboard — публичный топ‑10 игроков по рейтингу
router.get('/', async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ rating: -1 })
      .limit(10)
      .select('username platform rating');
    res.status(200).json(topPlayers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения лидеров' });
  }
});

module.exports = router;

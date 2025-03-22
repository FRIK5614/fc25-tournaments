// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /leaderboard — возвращает топ‑10 игроков по рейтингу
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, rating FROM users ORDER BY rating DESC LIMIT 10'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении лидеров' });
  }
});

module.exports = router;



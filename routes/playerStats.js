// routes/playerStats.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Tournament = require('../models/Tournament');

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

// GET /playerStats
// Возвращает статистику для текущего пользователя: общее количество турниров, завершённых турниров и количество побед (если он занял 1-е место в финальной таблице)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Находим турниры, в которых участвует текущий пользователь
    const tournaments = await Tournament.find({ "players.userId": userId });
    
    const totalParticipated = tournaments.length;
    let finishedCount = 0;
    let wins = 0;
    
    tournaments.forEach(tournament => {
      if (tournament.status === 'finished' && tournament.finalRanking && tournament.finalRanking.length > 0) {
        finishedCount++;
        // Если пользователь на первом месте, считаем как победу
        if (tournament.finalRanking[0] === userId) {
          wins++;
        }
      }
    });
    
    res.status(200).json({
      totalParticipated,
      finishedTournaments: finishedCount,
      wins
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

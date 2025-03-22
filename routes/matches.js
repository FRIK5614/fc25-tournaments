// routes/matches.js
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

// GET /matches/:tournamentId
// Возвращает расписание матчей для турнира по заданному tournamentId
router.get('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    if (!tournament.matches || tournament.matches.length === 0) {
      return res.status(200).json({ message: 'No matches scheduled yet', matches: [] });
    }
    res.status(200).json({ matches: tournament.matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /matches/:tournamentId
// Обновляет данные конкретного матча в турнире
// Ожидаемые поля в теле запроса:
// {
//   "matchIndex": <номер матча в массиве matches>,
//   "status": "scheduled" | "in-progress" | "finished",
//   "scoreA": <число>,  // опционально
//   "scoreB": <число>   // опционально
// }
router.put('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const { matchIndex, status, scoreA, scoreB } = req.body;
    if (matchIndex === undefined || !status) {
      return res.status(400).json({ error: 'matchIndex and status are required' });
    }
    
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    if (!tournament.matches || tournament.matches.length <= matchIndex) {
      return res.status(400).json({ error: 'Invalid matchIndex' });
    }
    
    // Обновляем данные матча
    tournament.matches[matchIndex].status = status;
    if (scoreA !== undefined) tournament.matches[matchIndex].scoreA = scoreA;
    if (scoreB !== undefined) tournament.matches[matchIndex].scoreB = scoreB;
    
    await tournament.save();
    
    // Если объект Socket.IO доступен через app.locals, отправляем уведомление
    const io = req.app.locals.io;
    if (io) {
      io.emit('matchUpdated', { tournamentId, matchIndex, match: tournament.matches[matchIndex] });
    }
    
    res.status(200).json({ message: 'Match updated', match: tournament.matches[matchIndex] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

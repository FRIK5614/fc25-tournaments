const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const authenticate = require('../middleware/authenticate');

// GET /playerStats — возвращает статистику участника (текущего пользователя)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    // Находим все турниры, где пользователь участвовал
    const tournaments = await Tournament.find({ players: userId });
    
    let totalTournaments = tournaments.length;
    let totalMatches = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    tournaments.forEach(tournament => {
      tournament.matches.forEach(match => {
        if (match.status === 'confirmed') {
          // Если пользователь участвует в матче
          if (match.playerA.toString() === userId || match.playerB.toString() === userId) {
            totalMatches++;
            if (match.playerA.toString() === userId) {
              goalsFor += match.scoreA;
              goalsAgainst += match.scoreB;
              if (match.scoreA > match.scoreB) {
                wins++;
              } else if (match.scoreA === match.scoreB) {
                draws++;
              } else {
                losses++;
              }
            } else if (match.playerB.toString() === userId) {
              goalsFor += match.scoreB;
              goalsAgainst += match.scoreA;
              if (match.scoreB > match.scoreA) {
                wins++;
              } else if (match.scoreB === match.scoreA) {
                draws++;
              } else {
                losses++;
              }
            }
          }
        }
      });
    });

    res.status(200).json({
      totalTournaments,
      totalMatches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

module.exports = router;

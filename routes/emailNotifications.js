// routes/emailNotifications.js
const express = require('express');
const router = express.Router();
const { sendMail } = require('../services/emailService');
const Tournament = require('../models/Tournament');

router.post('/tournament-created', async (req, res) => {
  const { tournamentId } = req.body;
  const t = await Tournament.findById(tournamentId).populate('players.userId','email');
  if (!t) return res.status(404).json({ error: 'Tournament not found' });

  for (const p of t.players) {
    await sendMail(p.userId.email, 'Новый турнир создан', `Турнир ${tournamentId} создан!`);
  }
  res.json({ message: 'Emails sent' });
});

router.post('/match-confirmed', async (req, res) => {
  const { tournamentId, matchId } = req.body;
  res.json({ message: 'Match confirmation emails sent' });
});

router.post('/tournament-finished', async (req, res) => {
  const { tournamentId } = req.body;
  res.json({ message: 'Tournament completion emails sent' });
});

module.exports = router;

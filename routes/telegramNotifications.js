// routes/telegramNotifications.js
const express = require('express');
const router = express.Router();
const TelegramBot = require('../services/telegramBot');
const Tournament = require('../models/Tournament');

router.post('/tournament-created', async (req, res) => {
  try {
    const { tournamentId } = req.body;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const participants = tournament.players.map(p => p.userId).join(', ');
    await TelegramBot.sendMessage(`🏆 Турнир создан! ID: ${tournamentId}. Участники: ${participants}`);
    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Telegram notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.post('/match-confirmed', async (req, res) => {
  try {
    const { tournamentId, matchId } = req.body;
    await TelegramBot.sendMessage(`✅ Матч ${matchId} турнира ${tournamentId} подтверждён`);
    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Telegram notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.post('/tournament-finished', async (req, res) => {
  try {
    const { tournamentId } = req.body;
    await TelegramBot.sendMessage(`🎉 Турнир ${tournamentId} завершён!`);
    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Telegram notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;

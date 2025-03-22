// routes/export.js
const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const Tournament = require('../models/Tournament');
const User = require('../models/User');

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  next();
}

router.get('/tournaments/:id/csv', authenticateToken, async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).lean();
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const stats = {};
  tournament.players.forEach(p => stats[p.userId] = { points: 0, diff: 0 });
  tournament.matches.forEach(m => {
    if (m.status !== 'confirmed') return;
    const a = m.playerA.toString(), b = m.playerB.toString();
    stats[a].diff += m.scoreA - m.scoreB;
    stats[b].diff += m.scoreB - m.scoreA;
    if (m.scoreA > m.scoreB) stats[a].points += 3;
    else if (m.scoreB > m.scoreA) stats[b].points += 3;
    else { stats[a].points++; stats[b].points++; }
  });

  const users = await User.find({ _id: { $in: Object.keys(stats) } });
  const data = Object.entries(stats).map(([id, s]) => {
    const user = users.find(u => u._id.toString() === id);
    return { Username: user.username, Rating: user.rating, Points: s.points, GoalDifference: s.diff };
  });

  const csv = new Parser({ fields: ['Username','Rating','Points','GoalDifference'] }).parse(data);
  res.header('Content-Type','text/csv');
  res.attachment(`tournament-${req.params.id}-standings.csv`);
  res.send(csv);
});

module.exports = router;

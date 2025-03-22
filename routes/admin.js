// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware проверки роли «admin»
async function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.role !== 'admin') return res.sendStatus(403);
    req.user = user;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// GET /admin/users — список всех пользователей с фильтрами
router.get('/users', authenticateAdmin, async (req, res) => {
  const { role, country, platform } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (country) filter.country = country;
  if (platform) filter.platform = platform;
  const users = await User.find(filter).select('-password');
  res.json(users);
});

// PATCH /admin/users/:id — изменить роль или заблокировать
router.patch('/users/:id', authenticateAdmin, async (req, res) => {
  const updates = {};
  if (req.body.role) updates.role = req.body.role;
  if (req.body.blocked !== undefined) updates.blocked = req.body.blocked;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  res.json(user);
});

// GET /admin/tournaments — фильтрация по статусу
router.get('/tournaments', authenticateAdmin, async (req, res) => {
  const tournaments = await Tournament.find({ status: req.query.status }).populate('players.userId');
  res.json(tournaments);
});

// PATCH /admin/tournaments/:id — принудительно изменить статус или результат
router.patch('/tournaments/:id', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(tournament);
});

module.exports = router;

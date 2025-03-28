// routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// POST /complaints — создать новую жалобу
router.post('/', async (req, res) => {
  try {
    const { tournamentId, matchId, description, complainant } = req.body;
    if (!tournamentId || !description) {
      return res.status(400).json({ error: 'tournamentId и description обязательны' });
    }
    const complaint = await Complaint.create({ tournamentId, matchId, description, complainant });
    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось создать жалобу' });
  }
});

// GET /complaints — получить все жалобы (только для админов)
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.headers['x-user-id']);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const complaints = await Complaint.find()
      .populate('complainant', 'username')
      .populate('tournamentId', 'name');
    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения жалоб' });
  }
});

// PUT /complaints/:id — обновить статус жалобы (только для админов)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','reviewed','resolved'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }
    const user = await User.findById(req.headers['x-user-id']);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!complaint) return res.status(404).json({ error: 'Жалоба не найдена' });
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось обновить жалобу' });
  }
});

module.exports = router;

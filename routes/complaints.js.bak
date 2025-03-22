// routes/complaints.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

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

// Маршрут для подачи жалобы (доступен для любого авторизованного пользователя)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, description } = req.body;
    if (!tournamentId || !description) {
      return res.status(400).json({ error: 'tournamentId и description обязательны' });
    }
    
    // Создаем новую жалобу
    const newComplaint = new Complaint({
      tournamentId,
      complainant: req.user.id,
      description
    });
    
    await newComplaint.save();
    return res.status(201).json({ message: 'Жалоба успешно подана', complaint: newComplaint });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Маршрут для получения всех жалоб (доступен только для администраторов)
// Здесь для простоты используем проверку, что роль пользователя admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Получаем данные пользователя
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
    }
    
    const complaints = await Complaint.find().populate('tournamentId').populate('complainant');
    return res.status(200).json(complaints);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Маршрут для обновления статуса жалобы (только для администраторов)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status } = req.body;
    if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Укажите корректный статус: pending, reviewed, или resolved' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
    }
    
    const complaint = await Complaint.findByIdAndUpdate(complaintId, { status }, { new: true });
    if (!complaint) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }
    
    return res.status(200).json({ message: 'Статус жалобы обновлен', complaint });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

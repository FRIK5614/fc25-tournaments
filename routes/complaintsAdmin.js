const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const authenticate = require('../middleware/authenticate'); // проверяет JWT и заполняет req.user

// Middleware для проверки прав администратора
function authenticateAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Доступ запрещён. Только администратор может выполнять данное действие.' });
  }
}

// GET /complaintsAdmin — получение списка всех жалоб (только для администратора)
router.get('/', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения жалоб' });
  }
});

// PUT /complaintsAdmin/:id/resolve — разрешение жалобы (обновление статуса и добавление решения)
router.put('/:id/resolve', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    // Например, status можно задать как 'resolved'
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: status || 'resolved', resolution: resolution || '' },
      { new: true }
    );
    if (!updatedComplaint) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }
    res.status(200).json({ message: 'Жалоба обновлена', complaint: updatedComplaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления жалобы' });
  }
});

// DELETE /complaintsAdmin/:id — удаление жалобы (только для администратора)
router.delete('/:id', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const deletedComplaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!deletedComplaint) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }
    res.status(200).json({ message: 'Жалоба удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления жалобы' });
  }
});

module.exports = router;

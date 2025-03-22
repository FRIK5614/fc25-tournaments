// routes/reports.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Tournament = require('../models/Tournament');
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

// Middleware для проверки роли администратора
async function isAdmin(req, res, next) {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// GET /reports/overview — предоставляет сводные данные о турнирах и рейтингах
router.get('/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Подсчитаем общее количество турниров
    const totalTournaments = await Tournament.countDocuments();

    // Найдем завершенные турниры
    const finishedTournaments = await Tournament.find({ status: 'finished' });
    
    // Рассчитаем общее изменение рейтингов и среднее изменение для участников из завершенных турниров
    let totalDelta = 0;
    let countDeltas = 0;
    
    // Проходим по каждому завершенному турниру, если у него были рассчитаны обновления рейтингов,
    // предполагаем, что в каждом турнире в поле updatedRatings (если такое сохраняется) содержится информация об изменениях.
    // Если вы сохраняете их в каждом турнире при завершении, то можно агрегировать эти данные.
    // Здесь для примера будем обходить каждый турнир и суммировать изменения на основе сохраненного массива updatedRatings.
    finishedTournaments.forEach(tournament => {
      if (tournament.updatedRatings && tournament.updatedRatings.length) {
        tournament.updatedRatings.forEach(ur => {
          totalDelta += ur.delta;
          countDeltas++;
        });
      }
    });
    
    const avgRatingChange = countDeltas ? totalDelta / countDeltas : 0;

    // Также можно собрать статистику по количеству активных турниров
    const activeTournaments = await Tournament.countDocuments({ status: { $ne: 'finished' } });

    // Формируем ответ
    const report = {
      totalTournaments,
      activeTournaments,
      finishedTournaments: finishedTournaments.length,
      avgRatingChange: avgRatingChange.toFixed(2)
    };

    return res.status(200).json(report);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

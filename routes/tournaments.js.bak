const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const emailService = require('../services/emailService');
const telegramBot = require('../services/telegramBot');

/**
 * Функция calculateStandings собирает результаты участников по подтверждённым матчам.
 * Здесь используется простая логика подсчёта очков: 3 за победу, 1 за ничью.
 */
async function calculateStandings(tournament) {
  const standingsMap = {};
  for (const playerId of tournament.players) {
    standingsMap[playerId.toString()] = { points: 0, goalDifference: 0 };
  }
  tournament.matches.forEach(match => {
    if (match.status === 'confirmed') {
      const diff = match.scoreA - match.scoreB;
      if (diff > 0) {
        standingsMap[match.playerA.toString()].points += 3;
      } else if (diff < 0) {
        standingsMap[match.playerB.toString()].points += 3;
      } else {
        standingsMap[match.playerA.toString()].points += 1;
        standingsMap[match.playerB.toString()].points += 1;
      }
      standingsMap[match.playerA.toString()].goalDifference += diff;
      standingsMap[match.playerB.toString()].goalDifference -= diff;
    }
  });
  const standings = [];
  for (const userId in standingsMap) {
    standings.push({
      userId,
      ...standingsMap[userId]
    });
  }
  // Сортировка: первично по очкам, вторично по разнице мячей (от лучшего к худшему)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });
  return standings;
}

/**
 * Функция tryFinalize вызывается после подтверждения результата каждого матча.
 * Если все матчи турнира подтверждены, то:
 *
 * 1. Получаем всех участников турнира (предполагается, что их ровно 4).
 * 2. Вычисляем средний рейтинг (R_avg) всех участников.
 * 3. Определяем итоговую таблицу (standings) и сопоставляем каждому участнику его текущий рейтинг (R_old).
 * 4. Для каждого участника определяем фактический результат S (1 для 1-го места, 0.66 для 2-го, 0.33 для 3-го, 0 для 4-го).
 * 5. Вычисляем ожидаемый результат E по формуле:
 *      E = 1 / (1 + 10^((R_avg - R_old)/400))
 * 6. Определяем коэффициент K: 40, если tournament.isCalibration === true, иначе 25.
 * 7. Вычисляем изменение рейтинга: delta = K × (S - E), и обновляем рейтинг пользователя.
 * 8. После перерасчёта обновляем статус турнира на "finished", сохраняем победителя и дату завершения.
 * 9. Отправляем уведомления пользователям (email и Telegram), если указаны.
 */
async function tryFinalize(tournament) {
  const allConfirmed = tournament.matches.every(match => match.status === 'confirmed');
  if (!allConfirmed) return;

  if (tournament.players.length !== 4) {
    console.error('Функция tryFinalize рассчитана на турниры из 4 участников');
    return;
  }
  
  // Получаем участников турнира
  const players = await User.find({ _id: { $in: tournament.players } });
  const ratings = players.map(p => p.rating);
  const R_avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  // Получаем турнирную таблицу по очкам
  const standings = await calculateStandings(tournament);
  standings.forEach(entry => {
    const player = players.find(p => p._id.toString() === entry.userId);
    entry.rating = player.rating;
  });
  
  // Фактический результат S для каждой позиции:
  // 1-е место: 1, 2-е: 0.66, 3-е: 0.33, 4-е: 0
  const S_values = [1, 0.66, 0.33, 0];
  
  // Пересчитываем рейтинги для каждого участника
  for (let i = 0; i < standings.length; i++) {
    const entry = standings[i];
    const R_old = entry.rating;
    const S = S_values[i] || 0;
    const E = 1 / (1 + Math.pow(10, ((R_avg - R_old) / 400)));
    const K = tournament.isCalibration ? 40 : 25;
    const delta = K * (S - E);
    
    await User.findByIdAndUpdate(entry.userId, { $inc: { rating: delta } });
    console.log(`Пользователь ${entry.userId}: R_old=${R_old}, S=${S}, E=${E.toFixed(2)}, delta=${delta.toFixed(2)}`);
  }
  
  // Обновляем статус турнира, сохраняем победителя и дату завершения
  tournament.status = 'finished';
  tournament.winner = standings[0].userId;
  tournament.finishedAt = new Date();
  await tournament.save();
  console.log(`Турнир ${tournament._id} завершён. Победитель: ${tournament.winner}`);
}

// GET /tournaments/:id — получение данных турнира
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('players')
      .populate('matches.playerA')
      .populate('matches.playerB');
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /tournaments/:id/standings — получение турнирной таблицы
router.get('/:id/standings', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    const standings = await calculateStandings(tournament);
    res.json(standings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /tournaments/:id/matches/:matchId/result — отправка результата матча
router.post('/:id/matches/:matchId/result', async (req, res) => {
  try {
    const { scoreA, scoreB } = req.body;
    if (scoreA === undefined || scoreB === undefined) {
      return res.status(400).json({ message: "Оба счёта должны быть указаны" });
    }
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    
    const match = tournament.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Матч не найден" });
    
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    await tournament.save();
    res.status(200).json({ message: "Результат матча отправлен. Ожидается подтверждение." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /tournaments/:id/matches/:matchId/confirm — подтверждение результата матча
router.post('/:id/matches/:matchId/confirm', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    
    const match = tournament.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Матч не найден" });
    
    // Предполагается, что req.userId установлен через middleware
    if (req.userId !== match.playerA.toString() && req.userId !== match.playerB.toString()) {
      return res.status(403).json({ message: "Вы не участвуете в этом матче" });
    }
    
    if (!match.confirmedBy) match.confirmedBy = [];
    if (match.confirmedBy.includes(req.userId)) {
      return res.status(400).json({ message: "Вы уже подтвердили результат" });
    }
    
    match.confirmedBy.push(req.userId);
    if (match.confirmedBy.length >= 2) {
      match.status = 'confirmed';
    }
    
    await tournament.save();
    await tryFinalize(tournament);
    
    res.status(200).json({ message: "Результат матча подтверждён" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /tournaments/:id/matches/:matchId/dispute — создание спора по результату матча
router.post('/:id/matches/:matchId/dispute', async (req, res) => {
  try {
    const { reason } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    
    const match = tournament.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Матч не найден" });
    
    if (req.userId !== match.playerA.toString() && req.userId !== match.playerB.toString()) {
      return res.status(403).json({ message: "Вы не участвуете в этом матче" });
    }
    
    match.status = 'disputed';
    match.dispute = {
      filedBy: req.userId,
      reason: reason,
      createdAt: new Date()
    };
    
    await tournament.save();
    res.status(200).json({ message: "Спор создан — ожидается решение администратора" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /tournaments/:id/matches/:matchId/resolve — решение спора (администратор)
router.post('/:id/matches/:matchId/resolve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Только администратор может решать споры" });
    }
    
    const { action, scoreA, scoreB } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });
    
    const match = tournament.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Матч не найден" });
    
    if (action === 'approve') {
      if (scoreA !== undefined && scoreB !== undefined) {
        match.scoreA = scoreA;
        match.scoreB = scoreB;
      }
      match.status = 'confirmed';
      match.confirmedBy = [match.playerA, match.playerB];
      match.dispute = undefined;
    } else if (action === 'reject') {
      match.scoreA = 0;
      match.scoreB = 0;
      match.status = 'pending';
      match.confirmedBy = [];
      match.dispute = undefined;
    } else {
      return res.status(400).json({ message: "Недопустимое действие" });
    }
    
    await tournament.save();
    await tryFinalize(tournament);
    
    res.status(200).json({
      message: action === 'approve'
        ? "Спор одобрен и результат подтверждён"
        : "Спор отклонён — результат сброшен"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

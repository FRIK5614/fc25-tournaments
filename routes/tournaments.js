const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');

/**
 * Функция calculateStandings собирает результаты участников по подтверждённым матчам.
 * Здесь используется простая логика для сортировки участников по набранным очкам.
 */
async function calculateStandings(tournament) {
  const standingsMap = {};
  for (const playerId of tournament.players) {
    standingsMap[playerId.toString()] = { points: 0 };
  }
  tournament.matches.forEach(match => {
    if (match.status === 'confirmed') {
      if (match.scoreA > match.scoreB) {
        standingsMap[match.playerA.toString()].points += 3;
      } else if (match.scoreA < match.scoreB) {
        standingsMap[match.playerB.toString()].points += 3;
      } else {
        standingsMap[match.playerA.toString()].points += 1;
        standingsMap[match.playerB.toString()].points += 1;
      }
    }
  });
  const standings = [];
  for (const userId in standingsMap) {
    standings.push({
      userId,
      points: standingsMap[userId].points
    });
  }
  standings.sort((a, b) => b.points - a.points);
  return standings;
}

/**
 * Функция tryFinalize вызывается после подтверждения матча.
 * Если все матчи турнира подтверждены, то:
 * 1. Получаем участников турнира (предполагается, что их ровно 4).
 * 2. Вычисляем средний рейтинг всех участников (R_avg).
 * 3. На основе результатов (standings) определяем позиции участников.
 * 4. Для каждого участника рассчитываем новый рейтинг по формуле Elo:
 *
 *    R_new = R_old + K × (S - E)
 *
 * где:
 *   - S: фактический результат (1 для 1-го, 0.66 для 2-го, 0.33 для 3-го, 0 для 4-го);
 *   - E: ожидаемый результат = 1 / (1 + 10^((R_avg - R_old) / 400));
 *   - K: коэффициент турнира (40, если tournament.isCalibration, иначе 25).
 *
 * 5. Обновляем рейтинг для каждого участника, переводим турнир в статус "finished",
 *    сохраняем победителя (участник с 1-м местом) и дату завершения.
 */
async function tryFinalize(tournament) {
  const allConfirmed = tournament.matches.every(match => match.status === 'confirmed');
  if (!allConfirmed) return;

  if (tournament.players.length !== 4) {
    console.error('Функция tryFinalize рассчитана на турниры из 4 участников');
    return;
  }
  // Получаем всех участников турнира
  const players = await User.find({ _id: { $in: tournament.players } });
  const ratings = players.map(p => p.rating);
  const R_avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  // Получаем турнирную таблицу по очкам
  const standings = await calculateStandings(tournament);
  standings.forEach(entry => {
    const player = players.find(p => p._id.toString() === entry.userId);
    entry.rating = player.rating;
  });

  // Фактический результат S для каждой позиции
  const S_values = [1, 0.66, 0.33, 0];

  // Пересчитываем рейтинги
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

  tournament.status = 'finished';
  tournament.winner = standings[0].userId;
  tournament.finishedAt = new Date();
  await tournament.save();
  console.log(`Турнир ${tournament._id} завершён. Победитель: ${tournament.winner}`);
}

// Эндпоинты турниров

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

    // Проверяем, что текущий пользователь участвует в матче (предполагается, что req.userId установлен)
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

module.exports = router;

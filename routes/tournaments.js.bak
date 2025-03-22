const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const emailService = require('../services/emailService');
const telegramBot = require('../services/telegramBot');

/**
 * Функция для расчёта итоговой статистики участников турнира.
 * Для каждого игрока собираются:
 *  - Очки (3 за победу, 1 за ничью)
 *  - Суммарная разница мячей
 *  - Количество сыгранных матчей
 *  - Массив рейтингов соперников, с которыми игрок встречался
 */
async function calculateStandings(tournament) {
  const standingsMap = {};
  // Инициализируем данные для каждого участника турнира
  for (const playerId of tournament.players) {
    standingsMap[playerId.toString()] = {
      points: 0,
      goalDifference: 0,
      matchesCount: 0,
      opponentsRatings: [] // сюда будем складывать рейтинги соперников
    };
  }

  // Проходим по каждому матчу, учитывая только подтверждённые
  for (const match of tournament.matches) {
    if (match.status === 'confirmed') {
      // Увеличиваем счетчик матчей для обоих игроков
      standingsMap[match.playerA.toString()].matchesCount++;
      standingsMap[match.playerB.toString()].matchesCount++;

      // Получаем рейтинги соперников
      const playerARating = (await User.findById(match.playerA)).rating;
      const playerBRating = (await User.findById(match.playerB)).rating;

      standingsMap[match.playerA.toString()].opponentsRatings.push(playerBRating);
      standingsMap[match.playerB.toString()].opponentsRatings.push(playerARating);

      // Подсчет очков и разницы мячей
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
  }

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
 * Функция tryFinalize – вызывается после подтверждения результата каждого матча.
 * Если все матчи турнира имеют статус 'confirmed', то:
 * 1. Вычисляется итоговая таблица.
 * 2. Определяется победитель (участник, занявший 1-е место).
 * 3. Турнир переводится в статус 'finished', в поле winner сохраняется ID победителя, устанавливается finishedAt.
 * 4. Для каждого участника рассчитывается изменение рейтинга по формуле:
 *
 *    S = (N - rank) / (N - 1)
 *    Δ_strength = (AvgOpp - R_i) / 100
 *    Δ_goal = (goalDifference / matchesCount)
 *
 *    P = a * S + b * Δ_strength + c * Δ_goal
 *    ΔR = K * P
 *
 * где a, b, c – весовые коэффициенты, K – базовая константа.
 *
 * 5. После обновления рейтинга отправляются уведомления по email и через Telegram (если доступны).
 */
async function tryFinalize(tournament) {
  const allConfirmed = tournament.matches.every(match => match.status === 'confirmed');
  if (!allConfirmed) return;

  const standings = await calculateStandings(tournament);
  if (standings.length === 0) return;

  const winnerData = standings[0];
  tournament.status = 'finished';
  tournament.winner = winnerData.userId;
  tournament.finishedAt = new Date();
  await tournament.save();

  // Задаем весовые коэффициенты и базовую константу
  const a = 40, b = 20, c = 10;
  const K = 10;
  const N = standings.length;

  for (const [index, standing] of standings.entries()) {
    try {
      const user = await User.findById(standing.userId);
      if (!user) continue;

      // Определяем итоговое место (rank = index + 1)
      const rank = index + 1;
      const S = (N - rank) / (N - 1);

      // Рассчитываем средний рейтинг соперников
      const opponents = standing.opponentsRatings;
      const avgOpp = opponents.length > 0 ? opponents.reduce((sum, r) => sum + r, 0) / opponents.length : user.rating;
      const deltaStrength = (avgOpp - user.rating) / 100;

      // Средняя разница мячей за матч
      const deltaGoal = standing.matchesCount > 0 ? standing.goalDifference / standing.matchesCount : 0;

      // Итоговый показатель выступления
      const P = a * S + b * deltaStrength + c * deltaGoal;
      const deltaR = K * P;

      // Обновляем рейтинг игрока
      user.rating = user.rating + deltaR;
      await user.save();

      // Отправляем уведомления (если email и telegramId заданы)
      if (user.email) {
        await emailService.sendEmail(user.email, "Турнир завершён", `Ваш новый рейтинг: ${user.rating}`);
      }
      if (user.telegramId) {
        await telegramBot.sendMessage(user.telegramId, `Турнир завершён. Ваш новый рейтинг: ${user.rating}`);
      }

      console.log(`Пользователь ${user._id} (место ${rank}): S=${S.toFixed(2)}, Δ_strength=${deltaStrength.toFixed(2)}, Δ_goal=${deltaGoal.toFixed(2)}, ΔR=${deltaR.toFixed(2)}`);
    } catch (err) {
      console.error("Ошибка обновления рейтинга для пользователя", standing.userId, err);
    }
  }
  console.log(`Турнир ${tournament._id} завершён. Победитель: ${winnerData.userId}`);
}

// Эндпоинт: Получить данные турнира
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

// Эндпоинт: Получить турнирную таблицу
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

// Эндпоинт: Отправить результат матча
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

    // Проверка: текущий пользователь (req.userId) должен быть участником матча
    if (req.userId !== match.playerA.toString() && req.userId !== match.playerB.toString()) {
      return res.status(403).json({ message: "Вы не участвуете в этом матче" });
    }

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    // Статус остается 'pending' до подтверждения обоими игроками
    await tournament.save();
    res.status(200).json({ message: "Результат матча отправлен. Ожидается подтверждение." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Эндпоинт: Подтвердить результат матча
router.post('/:id/matches/:matchId/confirm', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Турнир не найден" });

    const match = tournament.matches.id(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Матч не найден" });

    // Проверяем, что текущий пользователь является участником матча
    if (req.userId !== match.playerA.toString() && req.userId !== match.playerB.toString()) {
      return res.status(403).json({ message: "Вы не участвуете в этом матче" });
    }

    if (match.confirmedBy.includes(req.userId)) {
      return res.status(400).json({ message: "Вы уже подтвердили результат" });
    }

    match.confirmedBy.push(req.userId);
    // Если подтвердили оба игрока, меняем статус матча
    if (match.confirmedBy.length >= 2) {
      match.status = 'confirmed';
    }

    await tournament.save();

    // Пытаемся завершить турнир, если все матчи подтверждены
    await tryFinalize(tournament);

    res.status(200).json({ message: "Результат матча подтверждён" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Эндпоинт: Создать спор по результату матча
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

// Эндпоинт: Решить спор (только для администратора)
router.post('/:id/matches/:matchId/resolve', async (req, res) => {
  try {
    // Проверка: только администратор может решать споры
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
      // При отклонении спора сбрасываем результат матча
      match.scoreA = 0;
      match.scoreB = 0;
      match.status = 'pending';
      match.confirmedBy = [];
      match.dispute = undefined;
    } else {
      return res.status(400).json({ message: "Недопустимое действие" });
    }

    await tournament.save();

    // Пытаемся завершить турнир, если все матчи подтверждены
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

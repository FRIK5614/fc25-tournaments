// routes/referrals.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

// GET /referrals — возвращает реферальный код текущего пользователя и список приведённых друзей
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('referredUsers', 'username email rating');
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.status(200).json({ referralCode: user.referralCode, referredUsers: user.referredUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /referrals/redeem — позволяет текущему пользователю использовать реферальный код другого пользователя
// Ожидается тело запроса: { "referralCode": "КОД" }
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ error: 'Referral code is required' });
    }
    
    // Находим пользователя-реферера, исключая самого себя
    const referrer = await User.findOne({ referralCode, _id: { $ne: req.user.id } });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    // Находим текущего пользователя
    const currentUser = await User.findById(req.user.id);
    // Проверяем, что текущий пользователь еще не был приглашен
    if (currentUser.referredBy) {
      return res.status(400).json({ error: 'You have already redeemed a referral code' });
    }
    
    // Устанавливаем, что текущего пользователя пригласил referrer
    currentUser.referredBy = referrer._id;
    await currentUser.save();
    
    // Добавляем текущего пользователя в список приведённых у referrer, если его там еще нет
    if (!referrer.referredUsers.includes(currentUser._id)) {
      referrer.referredUsers.push(currentUser._id);
      // Опционально: добавить бонусные очки рейтинга для реферера
      referrer.rating += 50;
      await referrer.save();
    }
    
    res.status(200).json({ message: 'Referral code redeemed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

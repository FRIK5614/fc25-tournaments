const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // изменено с bcryptjs на bcrypt
const User = require('../models/User');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const RESET_PASSWORD_EXPIRES = '1h'; // токен действителен 1 час

// POST /passwordReset/request — запрос на сброс пароля
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email обязателен' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    // Генерируем токен для сброса пароля
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: RESET_PASSWORD_EXPIRES });
    // Ссылка для сброса (используйте FRONTEND_URL из переменных окружения)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    // Отправляем email с ссылкой для сброса пароля
    await emailService.sendEmail(user.email, 'Сброс пароля', `Перейдите по ссылке для сброса пароля: ${resetLink}`);

    res.status(200).json({ message: 'Ссылка для сброса пароля отправлена на ваш email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /passwordReset/reset/:token — сброс пароля по токену
router.post('/reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'Новый пароль обязателен' });

    // Верификация токена
    jwt.verify(token, JWT_SECRET, async (err, payload) => {
      if (err) return res.status(400).json({ message: 'Неверный или просроченный токен' });

      const user = await User.findById(payload.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      // Хэшируем новый пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: 'Пароль успешно обновлён' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;

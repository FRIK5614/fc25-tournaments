const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Регистрация
router.post('/register', async (req, res) => {
  const { username, email, phone, country, platform, gamertag, password } = req.body;
  if (!username || !email || !phone || !country || !platform || !gamertag || !password) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email уже зарегистрирован' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ username, email, phone, country, platform, gamertag, password: hashed });
  const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1d' });
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify/${token}`;
  await emailService.sendEmail(email, 'Подтвердите email', `Перейдите по ссылке для подтверждения: ${link}`);
  res.status(201).json({ message: 'Проверьте почту для подтверждения аккаунта' });
});

// Подтверждение email
router.get('/verify/:token', async (req, res) => {
  try {
    const { id } = jwt.verify(req.params.token, JWT_SECRET);
    await User.findByIdAndUpdate(id, { isVerified: true });
    res.status(200).json({ message: 'Email успешно подтверждён' });
  } catch {
    res.status(400).json({ error: 'Неверный или просроченный токен' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  if (!user.isVerified) {
    return res.status(403).json({ error: 'Подтвердите email перед входом' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ message: 'Вход выполнен', token });
});

module.exports = router;

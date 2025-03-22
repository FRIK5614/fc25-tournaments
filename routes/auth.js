const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token';

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, country, platform, gamertag, password } = req.body;
    if (!username || !email || !phone || !country || !platform || !gamertag || !password) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email уже зарегистрирован' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, phone, country, platform, gamertag, password: hashed });
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1d' });
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify/${token}`;
    await emailService.sendEmail(email, 'Подтвердите email', `Перейдите по ссылке для подтверждения: ${link}`);
    return res.status(201).json({ message: 'Проверьте почту для подтверждения аккаунта' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Подтверждение email
router.get('/verify/:token', async (req, res) => {
  try {
    const { id } = jwt.verify(req.params.token, JWT_SECRET);
    await User.findByIdAndUpdate(id, { isVerified: true });
    return res.status(200).json({ message: 'Email успешно подтверждён' });
  } catch {
    return res.status(400).json({ error: 'Неверный или просроченный токен' });
  }
});

// Авторизация через email и пароль
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    // if (!user.isVerified) {
    //   return res.status(403).json({ error: 'Подтвердите email перед входом' });
    // }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Вход выполнен успешно', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Telegram авторизация
router.post('/telegramAuth', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id || !data.auth_date || !data.hash) {
      return res.status(400).json({ error: 'Неверные данные Telegram' });
    }
    const checkParams = Object.keys(data).filter(k => k !== 'hash').sort().map(k => `${k}=${data[k]}`);
    const dataCheckString = checkParams.join('\n');
    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (hash !== data.hash) return res.status(403).json({ error: 'Неверная подпись данных Telegram' });

    let user = await User.findOne({ telegramId: data.id });
    if (!user) {
      user = await User.create({
        username: data.username || data.first_name,
        email: `${data.id}@telegram.com`,
        phone: 'Не указан',
        country: 'Не указан',
        platform: 'Telegram',
        gamertag: data.username || data.first_name,
        password: await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10),
        telegramId: data.id,
        isVerified: true
      });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Авторизация через Telegram выполнена', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// VK авторизация
router.get('/vkAuth', (req, res) => {
  const clientId = process.env.VK_CLIENT_ID;
  const redirectUri = process.env.VK_REDIRECT_URI || 'http://localhost:3000/auth/vk/callback';
  const scope = 'email';
  const vkAuthUrl = `https://oauth.vk.com/authorize?client_id=${clientId}&display=page&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&v=5.131`;
  res.redirect(vkAuthUrl);
});

router.get('/vk/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Код авторизации отсутствует' });
    const { access_token, user_id, email } = (await axios.get('https://oauth.vk.com/access_token', {
      params: { client_id: process.env.VK_CLIENT_ID, client_secret: process.env.VK_CLIENT_SECRET, redirect_uri: process.env.VK_REDIRECT_URI, code }
    })).data;
    const vkUser = (await axios.get('https://api.vk.com/method/users.get', {
      params: { user_ids: user_id, fields: 'photo_100', access_token, v: '5.131' }
    })).data.response[0];

    let user = await User.findOne({ vkId: user_id });
    if (!user) {
      user = await User.create({
        username: vkUser.first_name,
        email: email || `${user_id}@vk.com`,
        phone: 'Не указан',
        country: 'Не указан',
        platform: 'VK',
        gamertag: vkUser.first_name,
        password: await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10),
        vkId: user_id,
        isVerified: true
      });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Авторизация через VK выполнена', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

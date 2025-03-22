const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Подключаем модель

const JWT_SECRET = 'your_super_secret_key';

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, country, platform, gamertag, password } = req.body;
    if (!username || !email || !phone || !country || !platform || !gamertag || !password) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Проверка, есть ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      email,
      phone,
      country,
      platform,
      gamertag,
      password: hashedPassword
    });

    await newUser.save();
    return res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Вход выполнен успешно', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

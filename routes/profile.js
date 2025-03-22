const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer  = require('multer');
const path = require('path');
const authenticate = require('../middleware/authenticate');

// Настройка multer для загрузки аватара
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'avatar_' + req.user.id + '_' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

/**
 * GET /profile
 * Возвращает данные текущего пользователя.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * PUT /profile
 * Обновление данных профиля текущего пользователя.
 * Можно обновлять поля: username, phone, country, platform, gamertag.
 */
router.put('/', authenticate, async (req, res) => {
  try {
    const { username, phone, country, platform, gamertag } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, phone, country, platform, gamertag },
      { new: true, runValidators: true }
    ).select('-password');
    res.status(200).json({ message: 'Профиль обновлен', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /profile/avatar
 * Загрузка аватара пользователя.
 * Используется multer для обработки файла.
 */
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    // Сохраняем путь к аватару в профиле пользователя
    const avatarPath = req.file.path;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.status(200).json({ message: 'Аватар обновлен', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

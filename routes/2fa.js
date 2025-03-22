const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate'); // Middleware для проверки JWT

/**
 * GET /2fa/setup
 * Генерирует секрет для 2FA и возвращает QR-код, который пользователь может отсканировать в Google Authenticator.
 */
router.get('/setup', authenticate, async (req, res) => {
  try {
    // Генерируем секрет
    const secret = speakeasy.generateSecret({ length: 20 });
    // Сохраняем секрет в профиле пользователя (но не активируем 2FA пока)
    await User.findByIdAndUpdate(req.user.id, { twoFactorSecret: secret.base32 });
    
    // Генерируем QR-код с информацией для Google Authenticator
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: encodeURIComponent(req.user.email),
      issuer: 'FC25-Tournaments',
      encoding: 'base32'
    });
    
    qrcode.toDataURL(otpAuthUrl, (err, data_url) => {
      if (err) return res.status(500).json({ error: 'Ошибка генерации QR-кода' });
      res.json({ 
        message: 'Сканируйте QR-код для настройки 2FA', 
        qrCode: data_url,
        secret: secret.base32 // Можно не отправлять секрет, если не нужно
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /2fa/verify
 * Проверяет код, введённый пользователем, на основе сохранённого секрета.
 * Ожидается тело запроса: { code: "введённый код" }
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Код обязателен' });
    
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Секрет для 2FA не найден. Сначала настройте 2FA.' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    
    if (verified) {
      return res.status(200).json({ message: 'Код подтверждён' });
    } else {
      return res.status(400).json({ error: 'Неверный код' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /2fa/enable
 * Включает двухфакторную аутентификацию для пользователя, если код верен.
 * Ожидается тело запроса: { code: "код для подтверждения" }
 */
router.post('/enable', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Код обязателен' });
    
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Секрет для 2FA не найден. Сначала настройте 2FA.' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    
    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
      return res.status(200).json({ message: 'Двухфакторная аутентификация включена' });
    } else {
      return res.status(400).json({ error: 'Неверный код' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * POST /2fa/disable
 * Отключает двухфакторную аутентификацию для пользователя.
 * Ожидается тело запроса: { code: "код для подтверждения" } – для верификации.
 */
router.post('/disable', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Код обязателен' });
    
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Секрет для 2FA не найден.' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });
    
    if (verified) {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      await user.save();
      return res.status(200).json({ message: 'Двухфакторная аутентификация отключена' });
    } else {
      return res.status(400).json({ error: 'Неверный код' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;

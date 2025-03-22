const express = require('express');
const router = express.Router();
const User = require('../models/User');
const telegramBot = require('../services/telegramBot'); // сервис для отправки сообщений

// Этот роут обрабатывает входящие обновления от Telegram
router.post('/', async (req, res) => {
  try {
    const update = req.body;
    // Если получили сообщение с контактом
    if (update.message && update.message.contact) {
      const contact = update.message.contact;
      const telegramUserId = update.message.from.id; // ID пользователя, который отправил контакт
      const receivedPhone = contact.phone_number;

      // Находим пользователя по telegramId
      const user = await User.findOne({ telegramId: telegramUserId });
      if (!user) {
        await telegramBot.sendMessage(telegramUserId, 'Пользователь с вашим Telegram не найден в системе.');
        return res.sendStatus(200);
      }
      // Сравниваем номер из контакта с номером, указанным в профиле
      if (user.phone === receivedPhone) {
        user.isPhoneVerified = true;
        await user.save();
        await telegramBot.sendMessage(telegramUserId, 'Номер телефона успешно подтверждён!');
      } else {
        await telegramBot.sendMessage(telegramUserId, 'Номер телефона не совпадает с указанным в вашем профиле.');
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;

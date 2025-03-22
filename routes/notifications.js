const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Настройка транспортера для nodemailer
// Здесь используется пример с Gmail. Если у вас другой SMTP-сервер, измените настройки.
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'maxim5614@gmail.com',        // замените на ваш email
    pass: 'nhqe eiyu mshe gpsg'                   // замените на ваш пароль или app password для Gmail
  }
});

// Маршрут для отправки тестового уведомления
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'to, subject and text fields are required' });
    }
    
    let mailOptions = {
      from: 'your.email@gmail.com',   // отправитель (тот же, что в транспортере)
      to: to,                         // получатель
      subject: subject,
      text: text
    };
    
    // Отправка письма
    let info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent', info });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error sending email' });
  }
});

module.exports = router;

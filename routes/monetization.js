// routes/monetization.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Конфигурация YooMoney
const shopId = 'YOUR_SHOP_ID';
const secretKey = 'YOUR_SECRET_KEY';

// Функция для создания базовой авторизации для YooMoney (Basic Auth)
function getBasicAuth() {
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

// Эндпоинт для создания платежной сессии
router.post('/create-checkout-session', async (req, res) => {
  try {
    // В теле запроса можно передавать сумму и описание платежа, например:
    const { amount, description } = req.body;
    const data = {
      amount: {
        value: amount || "10.00",
        currency: "RUB"
      },
      confirmation: {
        type: "redirect",
        return_url: "http://localhost:3000/success"
      },
      capture: true,
      description: description || "Оплата за подписку"
    };

    const response = await axios.post('https://api.yookassa.ru/v3/payments', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getBasicAuth()
      }
    });

    // Отправляем URL для перенаправления (confirmation_url)
    res.json({ confirmationUrl: response.data.confirmation.confirmation_url });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

module.exports = router;

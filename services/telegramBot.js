// services/telegramBot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log('Telegram token:', token ? '✅ loaded' : '❌ missing');
console.log('Telegram chatId:', chatId ? chatId : '❌ missing');

if (!token || !chatId) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env');
}

const bot = new TelegramBot(token, { polling: false });

async function sendMessage(text) {
  try {
    await bot.sendMessage(chatId, text);
  } catch (err) {
    console.error('Telegram sendMessage error:', err.response?.body || err.message);
    throw err;
  }
}

module.exports = { sendMessage };

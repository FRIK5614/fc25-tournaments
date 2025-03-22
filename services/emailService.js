require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendMail(to, subject, text) {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('⚠️ Email send failed:', err.message);
    // Не выбрасываем ошибку дальше — регистрация продолжит работать
  }
}

module.exports = {
  sendMail,
  sendEmail: sendMail
};

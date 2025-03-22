require('dotenv').config();
require('./db');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', require('./routes/auth'));
app.use('/tournaments', require('./routes/tournaments'));
app.use('/admin', require('./routes/admin'));
app.use('/telegram', require('./routes/telegramNotifications'));
app.use('/profile', require('./routes/profile'));
app.use('/email', require('./routes/emailNotifications'));
app.use('/complaints', require('./routes/complaints'));
app.use('/monetization', require('./routes/monetization'));
app.use('/notifications/internal', require('./routes/notificationsInternal'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reports', require('./routes/reports'));
app.use('/playerStats', require('./routes/playerStats'));
app.use('/audit', require('./routes/audit'));
app.use('/friends', require('./routes/friends'));
app.use('/achievements', require('./routes/achievements'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/referrals', require('./routes/referrals'));
app.use('/export/users', require('./routes/exportUsers'));
app.use('/passwordReset', require('./routes/passwordReset'));
app.use('/telegramWebhook', require('./routes/telegramWebhook')); // добавлен новый маршрут
app.use('/complaintsAdmin', require('./routes/complaintsAdmin'));


const { swaggerUi, swaggerSpec } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => res.send('Добро пожаловать на платформу FC25 турниров!'));

module.exports = app;

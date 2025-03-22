const express = require('express');
const router = express.Router();
const db = require('../db'); // ваш модуль подключения к БД

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, email, country, platform, rating FROM users');
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');

    const header = 'ID,Username,Email,Country,Platform,Rating\n';
    const csv = rows.map(u => `${u.id},${u.username},${u.email},${u.country},${u.platform},${u.rating}`).join('\n');
    res.send(header + csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при экспорте пользователей' });
  }
});

module.exports = router;

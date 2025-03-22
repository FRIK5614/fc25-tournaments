// tournamentScheduler.js
const cron = require('node-cron');
const Tournament = require('./models/Tournament');

// Задаем порог времени ожидания (в минутах)
const pendingThresholdMinutes = 10;

// Запускаем задачу, которая выполняется каждую минуту
cron.schedule('* * * * *', async () => {
  console.log('Scheduler: Проверка турнирных заявок в статусе pending...');
  try {
    // Вычисляем дату, раньше которой турнир считается устаревшим
    const thresholdDate = new Date(Date.now() - pendingThresholdMinutes * 60 * 1000);
    // Находим турниры в статусе pending, созданные раньше thresholdDate
    const tournaments = await Tournament.find({
      status: 'pending',
      createdAt: { $lt: thresholdDate }
    });
    
    if (tournaments.length > 0) {
      console.log(`Scheduler: Найдено ${tournaments.length} турниров, ожидающих более ${pendingThresholdMinutes} минут.`);
      // Меняем статус найденных турниров на cancelled
      for (const tournament of tournaments) {
        tournament.status = 'cancelled';
        await tournament.save();
        console.log(`Scheduler: Турнир ${tournament._id} отменен из-за превышения времени ожидания.`);
        // Если требуется, можно добавить отправку уведомления через Socket.IO,
        // например, используя app.locals.io.emit('tournamentCancelled', { tournamentId: tournament._id });
      }
    }
  } catch (error) {
    console.error('Scheduler: Ошибка при проверке турниров:', error);
  }
});

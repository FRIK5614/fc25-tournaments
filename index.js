// index.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./middleware/logger'); // если используете Winston
const port = process.env.PORT || 3000;

// Создаем HTTP-сервер и интегрируем Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.locals.io = io;

io.on('connection', (socket) => {
  logger.info('Новый пользователь подключился через Socket.IO');
  socket.on('chat message', (msg) => {
    logger.info('Сообщение: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    logger.info('Пользователь отключился');
  });
});

server.listen(port, () => {
  logger.info(`Сервер запущен на http://localhost:${port}`);
});

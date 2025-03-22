const io = require("socket.io-client");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Подключено к серверу");
  socket.emit("chat message", "Привет, это сообщение из Node.js клиента!");
});

socket.on("chat message", (msg) => {
  console.log("Получено сообщение: " + msg);
});

socket.on("disconnect", () => {
  console.log("Отключено от сервера");
});

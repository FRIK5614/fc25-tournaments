FROM node:16-slim

WORKDIR /app

# Установим системные зависимости
RUN apt-get update && apt-get install -y python3 make gcc g++ && rm -rf /var/lib/apt/lists/*

# Скопируем только манифесты сначала — это ускорит кеширование слоёв
COPY package.json package-lock.json ./

# Установим все зависимости (включая dotenv)
RUN npm install

# Скопируем остальной код приложения
COPY . .

# Экспонируем порт
EXPOSE 3000

# Запуск сервера
CMD ["npm", "start"]

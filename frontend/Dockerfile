# Этап сборки
FROM node:14-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Этап сервировки
FROM nginx:stable-alpine
# Удаляем стандартный конфиг nginx (опционально) и копируем наш
# Если нужен кастомный конфиг, создайте файл nginx.conf и скопируйте его ниже.
# COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

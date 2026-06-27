# syntax=docker/dockerfile:1

# --- Сборка фронтенда (Vite) ---
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Husky не нужен в CI/образе и падает без .git — отключаем.
ENV HUSKY=0

COPY package*.json .npmrc ./
RUN npm ci

COPY . .

# В production-сборке фронтенд ходит на относительный /api/v1,
# который nginx проксирует на сервис api. Vite автоматически читает
# .env.production в режиме build.
RUN printf 'VITE_API_URL=/api/v1\n' > .env.production \
  && npm run build

# --- Раздача статики через непривилегированный nginx ---
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# syntax=docker/dockerfile:1

# --- Стадия установки зависимостей ---
# Нативные модули (bcrypt, sqlite3) требуют тулчейн для сборки/проверки
# prebuilt-бинарей. Тулчейн остаётся только в этой стадии и не попадает в финал.
FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# --- Финальный образ ---
FROM node:20-bookworm-slim

# ffmpeg нужен для fluent-ffmpeg; ca-certificates — для исходящего TLS.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Непривилегированный пользователь с фиксированным UID/GID
# (совпадает с user: "10001:10001" в docker-compose.yml).
RUN groupadd -g 10001 appgroup \
  && useradd -u 10001 -g appgroup -s /usr/sbin/nologin appuser

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Каталоги, в которые приложение пишет во время работы. uploads монтируется
# как volume — права наследуются из образа при первом создании тома.
RUN mkdir -p /app/uploads \
  && chown -R appuser:appgroup /app/uploads

ENV NODE_ENV=production
ENV PORT=5000

USER appuser

EXPOSE 5000

CMD ["node", "./bin/www"]

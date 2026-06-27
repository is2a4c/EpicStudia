# Deployment Guide (единый Docker-стек)

Фронтенд и API теперь живут в одном репозитории (фронт в корне, API в `server/`)
и поднимаются одной командой через Docker Compose.

## Архитектура

```
            ┌─────────────────────── Docker network (internal) ───────────────────────┐
 Интернет → │  web (nginx :8080)  →  api (Express :5000)  →  db (MariaDB :3306)         │
   :80      │   • отдаёт dist/        • /api/v1/*               • volume db_data         │
            │   • proxy /api/, /health • volume api_uploads                              │
            └────────────────────────────────────────────────────────────────────────┘
```

Наружу публикуется только `web` (порт `WEB_PORT`, по умолчанию 80). `api` и `db`
доступны исключительно внутри Docker-сети.

## Запуск

```bash
cp .env.example .env            # затем сменить JWT_SECRET и пароли БД
docker compose up -d --build
docker compose ps
docker compose logs -f
```

Остановка: `docker compose down` (данные сохраняются в volume `db_data` и `api_uploads`).

## Переменные окружения

См. `.env.example`. Обязательны: `JWT_SECRET`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
`DB_ROOT_PASSWORD`. Порт сайта меняется через `WEB_PORT`.

## Безопасность контейнеров

- Контейнеры `web` и `api` запускаются не от root (`api` — UID/GID `10001`,
  `web` — образ `nginx-unprivileged`).
- `cap_drop: [ALL]`, `security_opt: no-new-privileges:true`, `read_only: true`
  для `web` и `api`; запись только в volume и `tmpfs`.
- Нет `privileged`, нет монтирования `docker.sock`, нет проброса порта API наружу.
- Секреты только в `.env` (в git не коммитится).

## HTTPS (production)

Куки авторизации выставляются с флагом `secure` (`server/routes/users.js`),
поэтому в реальном продакшене сайт нужно открывать по HTTPS. Терминируйте TLS
на внешнем reverse proxy / балансировщике (или добавьте отдельный nginx/Traefik
перед сервисом `web`) и проксируйте на `web:8080`. Для локальной проверки по
`http://localhost` инфраструктура (proxy + API + БД) работает, но браузер не
сохранит `secure`-куку при входе по обычному http.

## Обновление

```bash
git pull
docker compose up -d --build      # пересборка изменённых образов
```

## Continuous deployment

На проде настроен автодеплой: при push в `main` GitHub отправляет webhook на
сервер, небольшой слушатель проверяет HMAC-подпись и выполняет
`git reset --hard origin/main` + последовательную пересборку
(`docker compose build api && build web && up -d`). Образы собираются по одному —
сервер ограничен по памяти, параллельная сборка его кладёт. Секрет вебхука и
эндпоинт хранятся вне репозитория.

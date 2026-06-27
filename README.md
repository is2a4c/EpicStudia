# ЭпикСтудия

[![CI/CD](https://github.com/PashaBritva/EpicStudia/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/PashaBritva/EpicStudia/actions/workflows/ci-cd.yml)
[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)

Веб-приложение для просмотра фильмов, добавления комментариев и взаимодействия с пользователями.

## 📋 Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Быстрый старт](#быстрый-старт)
- [Разработка](#разработка)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [Вклад в проект](#вклад-в-проект)
- [Лицензия](#лицензия)

## ✨ Возможности

- 🎬 Просмотр фильмов в различных качествах (360p, 720p, 1080p)
- 💬 Комментарии к фильмам
- ⭐ Система рейтингов
- 🔍 Поиск по хэштегам
- 👤 Профиль пользователя
- 🔐 Авторизация и регистрация
- 🛡️ Админ-панель для управления пользователями
- 📱 Адаптивный дизайн

## 🛠 Технологии

**Frontend:**
- **Vite + React 18** — сборка и основной фреймворк
- **React Router v7** — маршрутизация
- **Material UI v6** — UI компоненты
- **Axios** — HTTP-клиент

**Backend:**
- **Node.js + Express** — сервер
- **MariaDB / MySQL** — база данных (клиент `mysql2`)
- **JWT** — аутентификация
- **Multer** — загрузка файлов
- **FFmpeg** — обработка видео

Фронтенд и бэкенд живут в одном репозитории: фронт в корне, API — в каталоге `server/`.

## 🚀 Быстрый старт (Docker, рекомендуется)

Весь проект (фронтенд + API + база данных) поднимается одной командой.

### Требования
- Docker 24+ и Docker Compose v2

### Запуск
```bash
cp .env.example .env          # создать конфиг (при необходимости поменять секреты)
docker compose up -d --build  # собрать и запустить всё
docker compose ps             # статус контейнеров
docker compose logs -f        # логи в реальном времени
docker compose down           # остановить
```

После старта сайт доступен на **http://localhost** (порт меняется через `WEB_PORT` в `.env`).

### Что внутри
| Сервис | Назначение | Наружный порт |
|--------|------------|---------------|
| `web`  | Сборка фронта (Vite) + nginx reverse proxy | `80` (только он) |
| `api`  | Node.js/Express API (`server/`) | нет, только внутри сети |
| `db`   | MariaDB | нет, только внутри сети |

Запросы фронта идут на относительный `/api/v1`, nginx проксирует их на `api:5000`.
Наружу торчит только `web`; `api` и `db` доступны исключительно внутри Docker-сети.

### Где хранятся данные
Данные переживают пересоздание контейнеров благодаря именованным volume:
| Volume | Содержимое | Точка монтирования |
|--------|------------|--------------------|
| `db_data` | База данных MariaDB | `db:/var/lib/mysql` |
| `api_uploads` | Загруженные видео/медиа | `api:/app/uploads` |

### Обязательные переменные окружения (`.env`)
| Переменная | Назначение |
|------------|------------|
| `WEB_PORT` | Внешний порт сайта (по умолчанию `80`) |
| `PORT` | Внутренний порт API (по умолчанию `5000`) |
| `JWT_SECRET` | Длинный случайный секрет для JWT (`openssl rand -hex 48`) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Параметры подключения к БД |
| `DB_ROOT_PASSWORD` | Root-пароль MariaDB |

### Проверка после запуска
```bash
curl -I http://localhost            # 200 — фронтенд отдаётся nginx
curl http://localhost/health        # {"status":"ok"} — API жив через прокси
curl -i http://localhost/api/v1/    # 202 + {"VERSION":...} — публичный эндпоинт API
curl -i http://localhost/api/v1/movies   # 401 — эндпоинт защищён, но прокси+API работают
```

Полезные команды диагностики:
```bash
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose config            # валидация compose-файла
```

## 🧑‍💻 Локальная разработка без Docker

### Требования
- Node.js 18+, npm 9+
- Запущенная MariaDB/MySQL (задайте `DB_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` в окружении API)

```bash
npm run install:all   # зависимости фронта + API (server/)
cp .env.example .env

npm run dev:all       # фронт (:3000) + API (:5000) одновременно
npm run dev           # только фронт
npm run api           # только API (server/bin/www)
```

## 👨‍💻 Разработка

### Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск фронтенда (Vite) |
| `npm run dev:all` | Запуск фронтенда и API |
| `npm run api` | Запуск только API |
| `npm run build` | Сборка проекта |
| `npm run lint` | Проверка кода ESLint |
| `npm run preview` | Предпросмотр сборки |
| `npm run install:all` | Установка всех зависимостей |

### Ветвление

Мы используем [GitHub Flow](https://guides.github.com/introduction/flow/):

```bash
# Создать ветку для новой функции
git checkout -b feature/your-feature-name

# Создать ветку для исправления
git checkout -b fix/bug-description
```

### Коммиты

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: добавить новую функцию
fix: исправить ошибку
docs: обновить документацию
style: форматирование кода
refactor: рефакторинг
test: добавить тесты
chore: изменения в сборке
```

## 📁 Структура проекта

```
EpicStudia/
├── src/                       # Фронтенд (React + Vite)
│   ├── components/            # React компоненты
│   ├── pages/                 # Страницы
│   ├── services/api.js        # HTTP-клиент (baseURL = VITE_API_URL || /api/v1)
│   ├── theme/                 # Тема Material UI
│   ├── App.jsx                # Главный компонент
│   └── main.jsx               # Точка входа
├── public/                    # Статика фронта
├── server/                    # Бэкенд (Node.js/Express API)
│   ├── bin/www                # Точка входа API
│   ├── bin/db.js              # Подключение к БД и схема
│   ├── routes/                # API-маршруты (movies, user, live, search)
│   ├── services/streaming.js  # Стриминг видео (Range-запросы)
│   ├── app.js                 # Express-приложение (+ /health)
│   ├── Dockerfile             # Образ API
│   └── package.json           # Зависимости API
├── docker/
│   ├── nginx/default.conf     # Reverse proxy + SPA
│   └── web.Dockerfile         # Сборка фронта + nginx
├── docker-compose.yml         # Оркестрация web + api + db
├── .env.example               # Пример окружения (скопировать в .env)
├── .dockerignore              # Исключения для образа web
├── package.json               # Зависимости и скрипты фронта
└── vite.config.js             # Конфигурация Vite
```

## 📡 API

Базовый URL: `/api/v1`

### Эндпоинты

#### Фильмы
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/movies` | Получить список фильмов |
| GET | `/movies/:id` | Получить фильм по ID |
| GET | `/movies/:id/stream` | Стриминг видео |
| POST | `/movies/upload` | Загрузить фильм |
| GET | `/movies/search` | Поиск по хэштегам |
| POST | `/movies/:id/rating` | Оценить фильм |
| POST | `/movies/:id/comment` | Добавить комментарий |
| GET | `/movies/:id/comments` | Получить комментарии |

#### Пользователи
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/user/register` | Регистрация |
| POST | `/user/login` | Вход |
| GET | `/user/profile` | Получить профиль |
| GET | `/user/all` | Все пользователи (admin) |
| POST | `/user/:id/block` | Заблокировать (admin) |
| POST | `/user/:id/role` | Изменить роль (admin) |

## 🤝 Вклад в проект

Приветствуется любой вклад в проект! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](CONTRIBUTING.md) перед началом работы.

### Как внести вклад

1. Создайте Issue с описанием проблемы или предложения
2. Форкните репозиторий
3. Создайте ветку (`git checkout -b feature/amazing-feature`)
4. Внесите изменения
5. Закоммитьте (`git commit -m 'feat: amazing feature'`)
6. Отправьте (`git push origin feature/amazing-feature`)
7. Создайте Pull Request

## 📄 Лицензия

Copyright (C) 2025 ISAAC

Это программное обеспечение является собственностью. Несанкционированное копирование, распространение, модификация или использование этого программного обеспечения, полностью или частично, строго запрещено.

Программное обеспечение предоставляется "как есть", без каких-либо гарантий. Владелец оставляет за собой все права, явно не предоставленные.

По вопросам лицензирования обращайтесь: `pashamarshak@ya.ru`

---

**Сделано с ❤️ для любителей кино**

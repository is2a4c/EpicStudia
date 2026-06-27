#!/bin/bash

# Скрипт инициализации проекта EpicStudia
set -e

echo "🎬 Инициализация проекта EpicStudia..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Пожалуйста, установите Node.js 18+"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден."
    exit 1
fi

echo "✅ npm: $(npm --version)"

# Установка зависимостей фронтенда
echo "📦 Установка зависимостей фронтенда..."
npm install

# Установка зависимостей API (server/ внутри этого же репозитория)
echo "📦 Установка зависимостей API..."
cd server
npm install
cd ..

# Копирование .env.example если .env не существует
if [ ! -f ".env" ]; then
    echo "📝 Создание .env файла..."
    cp .env.example .env
fi

echo ""
echo "✅ Инициализация завершена!"
echo ""
echo "📚 Доступные команды:"
echo "   npm run dev        - Запуск только фронтенда"
echo "   npm run dev:all    - Запуск фронтенда и API одновременно"
echo "   npm run build      - Сборка проекта"
echo "   npm run lint       - Проверка кода линтером"
echo ""
echo "🚀 Для запуска проекта выполните:"
echo "   npm run dev:all"

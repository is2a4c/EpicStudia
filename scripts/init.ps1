# Скрипт инициализации проекта EpicStudia для PowerShell
$ErrorActionPreference = "Stop"

Write-Host "🎬 Инициализация проекта EpicStudia..." -ForegroundColor Cyan

# Проверка наличия Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден. Пожалуйста, установите Node.js 18+" -ForegroundColor Red
    exit 1
}

# Проверка наличия npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm не найден." -ForegroundColor Red
    exit 1
}

# Установка зависимостей фронтенда
Write-Host "📦 Установка зависимостей фронтенда..." -ForegroundColor Yellow
npm install

# Установка зависимостей API (server/ внутри этого же репозитория)
Write-Host "📦 Установка зависимостей API..." -ForegroundColor Yellow
Push-Location server
npm install
Pop-Location

# Копирование .env.example если .env не существует
if (-not (Test-Path ".env")) {
    Write-Host "📝 Создание .env файла..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host ""
Write-Host "✅ Инициализация завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Доступные команды:" -ForegroundColor Cyan
Write-Host "   npm run dev        - Запуск только фронтенда"
Write-Host "   npm run dev:all    - Запуск фронтенда и API одновременно"
Write-Host "   npm run build      - Сборка проекта"
Write-Host "   npm run lint       - Проверка кода линтером"
Write-Host ""
Write-Host "🚀 Для запуска проекта выполните:" -ForegroundColor Cyan
Write-Host "   npm run dev:all" -ForegroundColor Yellow

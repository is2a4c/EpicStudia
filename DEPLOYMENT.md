# Deployment Guide (Frontend + API in separate repos)

Этот проект и API находятся в разных репозиториях, поэтому лучший вариант: **раздельный деплой**.

## Recommended architecture

- `EpicStudia` (frontend): сборка Vite (`dist`) и выкладка в директорию nginx.
- `EpicStudiaApi` (backend): отдельный deploy-пайплайн и отдельный процесс (pm2/systemd/docker).
- Сервер:
  - `https://your-domain` -> frontend (static files from `dist`)
  - `https://your-domain/api/v1` -> proxy на API (`localhost:5000`)

## Frontend deploy (this repo)

В репозитории уже добавлен workflow:

- `.github/workflows/deploy-frontend.yml`

Он делает:
1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. rsync `dist/` на сервер по SSH

### Required GitHub Secrets (EpicStudia)

- `VITE_API_URL` (example: `https://your-domain/api/v1`)
- `DEPLOY_SSH_KEY` (private key)
- `DEPLOY_HOST` (example: `1.2.3.4`)
- `DEPLOY_USER` (example: `deploy`)
- `DEPLOY_PORT` (example: `22`)
- `FRONTEND_DEPLOY_PATH` (example: `/var/www/epicstudia`)

## API deploy (EpicStudiaApi repo)

Ниже рекомендуемый workflow-шаблон для API-репозитория:

```yaml
name: Deploy API

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

concurrency:
  group: deploy-api-production
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Deploy API source to server
        uses: easingthemes/ssh-deploy@v5.1.0
        with:
          SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          REMOTE_HOST: ${{ secrets.DEPLOY_HOST }}
          REMOTE_USER: ${{ secrets.DEPLOY_USER }}
          REMOTE_PORT: ${{ secrets.DEPLOY_PORT }}
          SOURCE: ./
          TARGET: ${{ secrets.API_DEPLOY_PATH }}
          ARGS: "-rlgoDzvc --delete --exclude .git --exclude node_modules"

      - name: Restart API on server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          port: ${{ secrets.DEPLOY_PORT }}
          script: |
            cd ${{ secrets.API_DEPLOY_PATH }}
            npm ci --omit=dev
            pm2 restart epicstudia-api || pm2 start app.js --name epicstudia-api
```

### Required GitHub Secrets (EpicStudiaApi)

- `DEPLOY_SSH_KEY`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PORT`
- `API_DEPLOY_PATH` (example: `/opt/epicstudia-api`)

## Nginx example

```nginx
server {
    listen 80;
    server_name your-domain;

    root /var/www/epicstudia;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Why separate deploy pipelines

- Репозитории независимы -> релизы независимы.
- Ошибка фронта не блокирует релиз API и наоборот.
- Проще rollback каждой части отдельно.

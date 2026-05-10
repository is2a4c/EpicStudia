# AGENTS.md — EpicStudia

## Repo structure

Frontend-only repo. The API backend lives in a **separate repo** (`PashaBritva/EpicStudiaApi`) expected at `../EpicStudiaApi` as a sibling directory. `npm run api` and `npm run api:install` both `cd` there.

## Quick start

```sh
git clone https://github.com/PashaBritva/EpicStudia.git
# API must be cloned manually or via scripts/init.sh:
gh repo clone PashaBritva/EpicStudiaApi ../EpicStudiaApi

cp .env.example .env
npm run install:all    # installs both frontend + API deps
npm run dev:all        # runs both frontend (:3000) + API (:5000)
```

## Key commands

| Command | What |
|---|---|
| `npm run dev` | Vite frontend on `0.0.0.0:3000` |
| `npm run dev:all` | Frontend + API concurrently |
| `npm run api` | Starts API from `../EpicStudiaApi` |
| `npm run build` | Production build (`vite build`) |
| `npm run lint` | ESLint (flat config `eslint.config.js`) |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run preview` | Preview production build on `0.0.0.0:3000` |
| `npm run install:all` | Install both frontend + API deps |

No test suite exists (`npm test` is a placeholder).

## Husky hooks (automated)

- **pre-commit**: `npx lint-staged` — auto-fixes staged `.js,.jsx` files with ESLint.
- **commit-msg**: enforces [Conventional Commits](https://www.conventionalcommits.org/) (`feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert`).
- **check-types**: runs `npx tsc --noEmit` — no `tsconfig.json` in this repo, so this is effectively a no-op for the JSX source. Do not add `.ts` files without creating a tsconfig.

## Environment

- `.env` with `VITE_API_URL` (default in `src/services/api.js`: `http://localhost:5002/api/v1`, CI default: `http://localhost:5000/api/v1`).
- `.npmrc` sets `legacy-peer-deps=true`.

## Stack

Vite 6 + React 18 + React Router v7 + Material UI v6 + Axios + HLS.js. Dark theme only (`src/theme/theme.jsx`). All source is `.jsx`/`.js` (no TypeScript).

## Entry point

`index.html` → `src/main.jsx` → `src/App.jsx`

Routes: `/` (HomePage), `/movie/:id` (MoviePage), `/user` (UserPage), `/user/upload` (CreateMoviePage), `/movie/search/:hashtag` (SearchPage).

## Code style notes

- ESLint flat config: `@eslint/js` recommended + `eslint-plugin-react` recommended + `react-refresh/only-export-components` (warn).
- 4-space indentation, single quotes, semicolons per CONTRIBUTING.md (not enforced by ESLint — be consistent with existing code).
- Component files: `PascalCase.jsx`, utility files: `camelCase.js`.

## CI/CD

- `lint → build → deploy` (main/master only, `VITE_API_URL` from secrets).
- Tags `v*` trigger a GitHub Release via release.yml.

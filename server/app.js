const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const moviesRouter = require('./routes/movies');
const usersRouter = require('./routes/users').router;
const searchRouter = require('./routes/search');
const liveRouter = require('./routes/live');

const app = express();
const api = '/api/v1';

// const ALLOWED_ORIGIN = process.env.HOST || 'https://epicstudia.duckdns.org';
//
// app.use(cors({
//   origin: ALLOWED_ORIGIN,
//   credentials: true,
// }));
//
// app.use((req, res, next) => {
//   const origin = req.get('origin') || '';
//   const referer = req.get('referer') || '';
//
//   if (
//       origin.startsWith(ALLOWED_ORIGIN) ||
//       referer.startsWith(ALLOWED_ORIGIN)
//   ) {
//     return next();
//   }
//
//   return res.status(403).json({ error: 'Доступ запрещён' });
// });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// cookie-parser нужен глобально: authenticateToken читает req.cookies.token,
// а маршруты movies/live/search своего парсера не подключают.
app.use(cookieParser());

// Liveness-проба для Docker healthcheck и reverse proxy.
// Не зависит от БД, чтобы отражать готовность процесса.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(`${api}/`, indexRouter);
app.use(`${api}/movies`, moviesRouter);
app.use(`${api}/search`, searchRouter);
app.use(`${api}/user`, usersRouter);
app.use(`${api}/live`, liveRouter);

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500).json({ error: res.locals.message });
});

module.exports = app;

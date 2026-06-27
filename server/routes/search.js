const express = require('express');
const cookieParser = require('cookie-parser');
const { db } = require('../bin/db');
const{ authenticateToken } = require('./users')
require('dotenv').config();

const router = express.Router();
router.use(cookieParser());
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

router.get('/', authenticateToken, (req, res) => {
    try {
        const hashtags = req.query.hashtags;

        if (!hashtags || hashtags.trim() === '') {
            return res.status(400).json({ error: 'Укажите хештеги для поиска' });
        }

        const hashtagArray = hashtags.split(/[,\s]+/)
            .map(h => h.trim().replace(/[^\wа-яё]/gi, ''))
            .filter(h => h.length > 0);

        if (hashtagArray.length === 0) {
            return res.status(400).json({ error: 'Некорректные хештеги' });
        }

        const conditions = hashtagArray.map(() => 'hashtags LIKE ?').join(' AND ');
        const params = hashtagArray.map(h => `%${h}%`);

        db.query(
            `SELECT id, title, description, hashtags, rating 
            FROM movies 
            WHERE ${conditions}`,
            params,
            (err, results) => {
                if (err) {
                    console.error('Ошибка поиска:', err);
                    return res.status(500).json({ error: 'Ошибка базы данных' });
                }

                const processedResults = results.map(movie => ({
                    ...movie,
                    hashtags: movie.hashtags,
                }));

                res.status(200).json(processedResults);
            }
        );

    } catch (error) {
        console.error('Ошибка сервера:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
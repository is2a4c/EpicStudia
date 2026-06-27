var express = require('express');
const cors = require('cors');
const multer = require('multer');
const { db } = require('../bin/db');
const path = require('path');
const { streamVideoFile } = require('../services/streaming');
const { authenticateToken, checkAdmin } = require('./users')
require('dotenv').config();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

let router = express.Router();
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.get('/:id/stream', authenticateToken, (req, res) => {
    const movieId = req.params.id;
    const filePath = path.join(__dirname, '..', `uploads/${movieId}/${movieId}.mp4`);
    streamVideoFile(filePath, req, res);
});

router.post('/upload', authenticateToken, checkAdmin, upload.single('fullMovie'), (req, res) => {
    const { title, description, hashtags } = req.body;
    if (!req.file || !title || !description || !hashtags) return res.status(400).send('Недостаточно данных');

    let parsedHashtags = JSON.parse(hashtags);
    if (!Array.isArray(parsedHashtags)) return res.status(400).send('Хештеги должны быть массивом');

    db.query('INSERT INTO movies (title, description, hashtags, fullMovieUrl) VALUES (?, ?, ?, ?)',
        [title, description, parsedHashtags.join(','), req.file.path],
        (err, results) => {
            if (err) return res.status(500).send('Ошибка при добавлении фильма');
            res.status(201).json({ message: 'Фильм успешно загружен', filePath: req.file.path });
        }
    );
});

router.get('/', authenticateToken, (req, res) => {
    db.query('SELECT id, title, description, hashtags, ROUND(rating, 1) as rating FROM movies',
        (err, results) => {
            if (err) return res.status(500).send('Ошибка при получении фильмов');
            res.status(200).json(results);
        }
    );
});

router.get('/:id', authenticateToken, (req, res) => {
    db.query('SELECT id, title, description, hashtags FROM movies WHERE id = ?', [req.params.id],
        (err, results) => {
            if (err) return res.status(500).send('Ошибка при получении фильма');
            if (results.length === 0) return res.status(404).send('Фильм не найден');
            res.status(200).json(results[0]);
        }
    );
});

router.post('/:id/comment', authenticateToken, (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).send('Некорректные данные');

    db.query('INSERT INTO comments (movieId, user, text) VALUES (?, ?, ?)',
        [req.params.id, user, text],
        (err) => {
            if (err) return res.status(500).send('Ошибка при добавлении комментария');
            res.status(201).send('Комментарий добавлен');
        }
    );
});

router.get('/:id/comments', authenticateToken, (req, res) => {
    db.query('SELECT user, text FROM comments WHERE movieId = ?', [req.params.id],
        (err, results) => {
            if (err) return res.status(500).send('Ошибка при получении комментариев');
            res.status(200).json(results);
        }
    );
});

router.get('/:id/ratings', authenticateToken, (req, res) => {
    db.query('SELECT rating FROM ratings WHERE movieId = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).send(`Ошибка получения рейтинга: ${err}`)
        return res.status(200).json(results);
    });
})

router.post('/:id/ratings', authenticateToken, (req, res) => {
    const { userId, rating } = req.body;

    if (!userId || !rating || rating < 0 || rating > 5) {
        return res.status(400).send('Некорректные данные');
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).send('Ошибка транзакции');

        db.query(
            `INSERT INTO ratings (movieId, userId, rating) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = ?`,
            [req.params.id, userId, rating, rating],
            (err) => {
                if (err) return db.rollback(() => res.status(500).send('Ошибка оценки'));

                db.query(
                    `UPDATE movies m
                    SET m.rating = (
                        SELECT AVG(r.rating) 
                        FROM ratings r 
                        WHERE r.movieId = ?
                    )
                    WHERE m.id = ?`,
                    [req.params.id, req.params.id],
                    (err) => {
                        if (err) return db.rollback(() => res.status(500).send('Ошибка обновления'));
                        res.status(201).json({ message: 'Рейтинг обновлен' });
                    }
                );
            }
        );
    });
});

module.exports = router;

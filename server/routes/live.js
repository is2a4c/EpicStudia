const express = require('express');
const { db } = require('../bin/db');
const { authenticateToken, checkStreamer } = require('./users');
require('dotenv').config();

const router = express.Router();
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
router.use(express.json());

router.get('/', authenticateToken, (req, res) => {
    db.query(
        'SELECT id, title, description, streamer, status, viewerCount FROM livestreams ORDER BY createdAt DESC',
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Ошибка при получении трансляций' });
            res.status(200).json(results);
        }
    );
});

router.get('/:id', authenticateToken, (req, res) => {
    db.query(
        'SELECT id, title, description, streamer, status, viewerCount FROM livestreams WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Ошибка при получении трансляции' });
            if (results.length === 0) return res.status(404).json({ message: 'Трансляция не найдена' });
            res.status(200).json(results[0]);
        }
    );
});

router.post('/', authenticateToken, checkStreamer, (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Недостаточно данных' });

    db.query(
        'INSERT INTO livestreams (title, description, streamer, status) VALUES (?, ?, ?, ?)',
        [title, description || '', req.user.username, 'upcoming'],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Ошибка при создании трансляции' });
            res.status(201).json({ message: 'Трансляция создана', id: results.insertId });
        }
    );
});

router.patch('/:id/status', authenticateToken, checkStreamer, (req, res) => {
    const { status } = req.body;
    if (!status || !['live', 'upcoming', 'ended'].includes(status)) {
        return res.status(400).json({ message: 'Некорректный статус' });
    }

    db.query(
        'SELECT streamer FROM livestreams WHERE id = ?',
        [req.params.id],
        (selectErr, results) => {
            if (selectErr) return res.status(500).json({ message: 'Ошибка при получении трансляции' });
            if (results.length === 0) return res.status(404).json({ message: 'Трансляция не найдена' });

            const isAdminLike = ['admin', 'owner'].includes(req.user.role);
            const isOwnerStream = results[0].streamer === req.user.username;
            if (!isAdminLike && !isOwnerStream) {
                return res.status(403).json({ message: 'Можно управлять только своими трансляциями' });
            }

            db.query(
                'UPDATE livestreams SET status = ? WHERE id = ?',
                [status, req.params.id],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: 'Ошибка при обновлении статуса' });
                    res.status(200).json({ message: 'Статус обновлён' });
                }
            );
        }
    );
});

router.get('/:id/stream', authenticateToken, (req, res) => {
    db.query(
        'SELECT status FROM livestreams WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Ошибка при проверке трансляции' });
            if (results.length === 0) return res.status(404).json({ message: 'Трансляция не найдена' });
            if (results[0].status !== 'live') {
                return res.status(403).json({ message: 'Трансляция недоступна' });
            }
            res.status(200).json({ url: `${process.env.STREAM_URL || 'rtmp://localhost/live'}/${req.params.id}` });
        }
    );
});

module.exports = router;

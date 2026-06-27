const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { db } = require('../bin/db');
require('dotenv').config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'sdkhf9TSAA*TG*ASGFGASF*&GWe4gffigsef7G)&*T)&t#&@!@(_#@$#@#&)(&&#$)&)#W(&FH)(&HF)#HF^#F@*62r0273tr27rf92';
const SALT_ROUNDS = 10;

router.use(cookieParser());
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Заполните все поля');
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await db.promise().query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        await loginToken(req, res);
    } catch (err) {
        res.status(400).send('Пользователь уже существует');
    }
});

router.post('/login', async (req, res) => {
    await loginToken(req, res);
});

async function loginToken(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Заполните все поля');
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (!rows.length) return res.status(400).send('Неверный логин или пароль');
        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).send('Неверный логин или пароль');
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.status(200).json({ message: 'Успешный вход' });
    } catch (err) {
        return res.status(500).send(`Ошибка сервера: ${err}`);
    }
}

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id, username, role, blocked FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).send('Пользователь не найден');
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`);
    }
});

router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Пользователь не найден');
        await db.promise().execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.status(200).send('Пользователь удалён');
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`);
    }
});

router.get('/all', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id, username, role, blocked FROM users');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`);
    }
});

router.post('/:id/block', authenticateToken, checkAdmin, async (req, res) => {
    try {
        await db.promise().query('UPDATE users SET blocked = ? WHERE id = ?', [req.body.blocked, req.params.id]);
        res.status(200).send('Пользователь заблокирован');
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`);
    }
});

router.post('/:id/role', authenticateToken, checkAdmin, async (req, res) => {
    try {
        await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
        res.status(200).send('Роль пользователя обновлена');
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`);
    }
});

router.post('/logout', async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(201).send('Выход успешно выполнен')
    } catch (err) {
        res.status(500).send(`Ошибка сервера: ${err}`)
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies.token || bearerToken;

    if (!token) return res.status(401).json({ message: 'Доступ запрещён' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Недействительный токен' });
        req.user = user;
        next();
    });
}

function checkAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') return res.status(403).json({ message: 'Недостаточно прав' });
    next();
}

function checkStreamer(req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Не авторизован' });
    if (!['streamer', 'admin', 'owner'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Доступ только для стримеров' });
    }
    next();
}

module.exports = {router, authenticateToken, checkAdmin, checkStreamer};

import { useState, useEffect } from 'react';
import { Typography, Box, Button, CircularProgress, TextField, Alert, Paper, useMediaQuery, Chip } from '@mui/material';
import {
    blockedUser,
    createLivestream,
    getLivestreamObsConfig,
    getLivestreams,
    getUserById,
    getUserProfile,
    getUsers,
    LoginOrRegisterUser,
    setRole,
    updateLivestreamStatus
} from "../services/api.js";
import CreateMoviePage from "./CreatMoviePage.jsx";

function UserPage() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ username: '', password: '' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [search, setSearch] = useState('');
    const [streamForm, setStreamForm] = useState({ title: '', description: '' });
    const [streams, setStreams] = useState([]);
    const [streamError, setStreamError] = useState('');
    const [streamSuccess, setStreamSuccess] = useState('');
    const [streamLoading, setStreamLoading] = useState(false);
    const [obsConfig, setObsConfig] = useState(null);

    const token = localStorage.getItem('token');

    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await getUserProfile(token);
                setUser(response);
                if (response.role === 'admin') {
                    const usersResponse = await getUsers(token);
                    setUsers(usersResponse);
                }

                if (response.role === 'admin' || response.role === 'streamer') {
                    const livestreams = await getLivestreams();
                    setStreams(Array.isArray(livestreams) ? livestreams : []);
                }
            } catch {
                setError('Не удалось загрузить профиль. Пожалуйста, войдите.');
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRegisterOrLogin = async () => {
        const endpoint = isRegistering ? 'register' : 'login';
        try {
            const response = await LoginOrRegisterUser(endpoint, form.username, form.password);
            localStorage.setItem('token', response.token);
            window.location.reload();
        } catch {
            setError('Ошибка входа');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.reload();
    };

    const handleBlocked = async (id, blocked) => {
        await blockedUser(token, id, blocked);
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === id ? { ...user, blocked } : user
            )
        );
    };

    const handleAdmin = async (id) => {
        const usser = await getUserById(token, id);
        if (usser.role === 'admin') {
            let role = 'user';
            await setRole(token, id, role);
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === id ? { ...user, role } : user
                )
            );
        } else {
            let role = 'admin';
            await setRole(token, id, role);
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === id ? { ...user, role } : user
                )
            );
        }
    }

    const filteredUsers = users
        .filter((u) => u.id.toString().includes(search) || u.username.includes(search))

    const myStreams = user
        ? streams.filter((stream) => stream.streamer === user.username)
        : [];

    const currentStream = myStreams.find((stream) => stream.status === 'live')
        || myStreams.find((stream) => stream.status === 'upcoming')
        || null;

    const handleStreamInputChange = (e) => {
        const { name, value } = e.target;
        setStreamForm((prev) => ({ ...prev, [name]: value }));
    };

    const refreshStreams = async () => {
        const livestreams = await getLivestreams();
        setStreams(Array.isArray(livestreams) ? livestreams : []);
    };

    const handleCreateStream = async () => {
        if (!streamForm.title.trim()) {
            setStreamError('Введите название трансляции');
            return;
        }

        setStreamLoading(true);
        setStreamError('');
        setStreamSuccess('');
        setObsConfig(null);

        try {
            await createLivestream({
                title: streamForm.title.trim(),
                description: streamForm.description.trim(),
                streamer: user.username,
            }, token);

            await refreshStreams();
            setStreamForm({ title: '', description: '' });
            setStreamSuccess('Трансляция создана. Запустите её, чтобы получить данные для OBS.');
        } catch {
            setStreamError('Не удалось создать трансляцию');
        } finally {
            setStreamLoading(false);
        }
    };

    const handleChangeStreamStatus = async (status) => {
        if (!currentStream?.id) {
            setStreamError('Сначала создайте трансляцию');
            return;
        }

        setStreamLoading(true);
        setStreamError('');
        setStreamSuccess('');
        setObsConfig(null);

        try {
            await updateLivestreamStatus(currentStream.id, status, token);
            await refreshStreams();

            if (status === 'live') {
                const config = await getLivestreamObsConfig(currentStream.id, token);
                const publishUrl = config?.url || '';
                const slashIndex = publishUrl.lastIndexOf('/');
                const serverUrl = slashIndex > 0 ? publishUrl.slice(0, slashIndex) : publishUrl;
                const streamKey = slashIndex > 0 ? publishUrl.slice(slashIndex + 1) : currentStream.id.toString();

                setObsConfig({
                    serverUrl,
                    streamKey,
                    fullUrl: publishUrl,
                });
                setStreamSuccess('Трансляция запущена. Подключите OBS по данным ниже.');
            } else if (status === 'ended') {
                setStreamSuccess('Трансляция завершена.');
            } else {
                setStreamSuccess('Статус трансляции обновлён.');
            }
        } catch {
            setStreamError('Не удалось обновить статус трансляции');
        } finally {
            setStreamLoading(false);
        }
    };

    const renderStreamerPanel = () => (
        <Box sx={{ display: 'flex', width: isMobile ? '90%' : '80%', marginTop: 4 }}>
            <Paper sx={{ padding: 3, borderRadius: 3, backgroundColor: '#1e1e1e', width: '100%', overflowY: 'auto' }}>
                <Typography variant={isMobile ? 'h4' : 'h3'} align='center' sx={{ marginBottom: 2 }}>
                    Стример-панель
                </Typography>

                {currentStream && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}>
                        <Typography variant="h6">Текущий стрим: {currentStream.title}</Typography>
                        <Chip
                            label={currentStream.status === 'live' ? 'LIVE' : currentStream.status === 'upcoming' ? 'Запланирован' : 'Завершён'}
                            color={currentStream.status === 'live' ? 'error' : currentStream.status === 'upcoming' ? 'warning' : 'default'}
                        />
                    </Box>
                )}

                {streamError && <Alert severity="error" sx={{ marginBottom: 2 }}>{streamError}</Alert>}
                {streamSuccess && <Alert severity="success" sx={{ marginBottom: 2 }}>{streamSuccess}</Alert>}

                <TextField
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    label="Название стрима"
                    name="title"
                    value={streamForm.title}
                    onChange={handleStreamInputChange}
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    sx={{ input: { color: '#fff' } }}
                />
                <TextField
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    label="Описание стрима"
                    name="description"
                    value={streamForm.description}
                    onChange={handleStreamInputChange}
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    sx={{ input: { color: '#fff' } }}
                />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginTop: 2 }}>
                    <Button variant="contained" onClick={handleCreateStream} disabled={streamLoading}>
                        Создать стрим
                    </Button>
                    <Button variant="contained" color="error" onClick={() => handleChangeStreamStatus('live')} disabled={streamLoading || !currentStream}>
                        В эфир
                    </Button>
                    <Button variant="contained" color="warning" onClick={() => handleChangeStreamStatus('upcoming')} disabled={streamLoading || !currentStream}>
                        На паузу
                    </Button>
                    <Button variant="contained" color="inherit" onClick={() => handleChangeStreamStatus('ended')} disabled={streamLoading || !currentStream}>
                        Завершить
                    </Button>
                </Box>

                {streamLoading && <CircularProgress sx={{ marginTop: 2, color: '#1976d2' }} />}

                {obsConfig && (
                    <Box sx={{ marginTop: 3, backgroundColor: '#121212', borderRadius: 2, padding: 2 }}>
                        <Typography variant="h6" sx={{ marginBottom: 1 }}>Настройка OBS</Typography>
                        <Typography variant="body1"><strong>Server:</strong> {obsConfig.serverUrl}</Typography>
                        <Typography variant="body1"><strong>Stream Key:</strong> {obsConfig.streamKey}</Typography>
                        <Typography variant="body2" sx={{ marginTop: 1, color: '#bdbdbd' }}>
                            Полный URL: {obsConfig.fullUrl}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );

    if (loading) return <CircularProgress sx={{ color: '#1976d2' }} />;
    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' }}>
                <Paper sx={{ padding: 4, borderRadius: 3, maxWidth: isMobile ? '90%' : 500, backgroundColor: '#1e1e1e', color: '#fff' }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        {isRegistering ? 'Регистрация' : 'Вход'}
                    </Typography>
                    {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}
                    <TextField fullWidth margin="dense" variant="outlined" label="Имя пользователя" name="username" value={form.username} onChange={handleInputChange} InputLabelProps={{ style: { color: '#aaa' } }} sx={{ input: { color: '#fff' } }} />
                    <TextField fullWidth margin="dense" variant="outlined" label="Пароль" name="password" type="password" value={form.password} onChange={handleInputChange} InputLabelProps={{ style: { color: '#aaa' } }} sx={{ input: { color: '#fff' } }} />
                    <Button fullWidth variant="contained" onClick={handleRegisterOrLogin} sx={{ bgcolor: '#1976d2', mt: 2 }}>
                        {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                    </Button>
                    <Button fullWidth variant="text" onClick={() => setIsRegistering(!isRegistering)} sx={{ color: '#1976d2', mt: 1 }}>
                        {isRegistering ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (user.role === 'admin') {
        return (
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', minHeight: 'auto', backgroundColor: '#121212', color: '#fff', gap: isMobile ? 2 : 4, padding: isMobile ? 2 : 4 }}>
                <Box sx={{
                    margin: '0 0 10px 0',
                }}>
                    <Typography variant="h2" gutterBottom >
                        Профиль пользователя
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h3">Имя пользователя: {user.username}</Typography>
                            <Button sx={{margin: '15px 0 0 0'}} variant="contained" color="error" onClick={handleLogout}>
                                Выйти
                            </Button>
                        </Box>
                    )}
                </Box>
                <Box sx={{
                    width: isMobile ? '90%' : 400,
                    zIndex: 1001,
                    boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
                }}>
                    <Paper sx={{ padding: 3, borderRadius: 3, backgroundColor: '#1e1e1e', width: '100%', height: 435, overflowY: 'auto' }}>
                        <TextField
                            fullWidth
                            margin="dense"
                            variant="outlined"
                            label="Поиск пользователей"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputLabelProps={{ style: { color: '#aaa' } }}
                            sx={{ input: { color: '#fff' } }}
                        />
                        <Box >
                            {filteredUsers.map((u) => (
                                <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="h6">ID: {u.id} | {u.username}</Typography>
                                    <Button
                                        variant="contained"
                                        color={u.blocked ? 'success' : 'error'}
                                        onClick={() => handleBlocked(u.id, !u.blocked)}
                                    >
                                        {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                                    </Button>
                                    <Button
                                        sx={{ margin: '10px' }}
                                        variant="contained"
                                        color={u.role !== 'admin' ? 'success' : 'error'}
                                        onClick={() => handleAdmin(u.id)}
                                    >
                                        {u.role !== 'admin' ? 'Повысить' : 'Понизить'}
                                    </Button>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>
                <Box sx={{ width: isMobile ? '90%' : 400, zIndex: 1000, boxShadow: '0px 4px 10px rgba(0,0,0,0.3)', marginTop: isMobile ? 2 : 0 }}>
                    <CreateMoviePage />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'top', minHeight: 'auto', backgroundColor: '#121212', color: '#fff', padding: isMobile ? 2 : 4 }}>
            <Typography variant={isMobile ? 'h3' : 'h2'} align="center" gutterBottom>
                Профиль пользователя
            </Typography>
            {user && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant={isMobile ? 'h4' : 'h3'}>Имя пользователя: {user.username}</Typography>
                    <Button sx={{ margin: '15px 0 0 0' }} variant="contained" color="error" onClick={handleLogout}>
                        Выйти
                    </Button>
                </Box>
            )}
            <Box sx={{ display: 'flex', width: isMobile ? '90%' : '80%', marginTop: 4 }}>
                <Paper sx={{ padding: 3, borderRadius: 3, backgroundColor: '#1e1e1e', width: '100%', overflowY: 'auto' }}>
                    <Typography variant={isMobile ? 'h4' : 'h3'} align='center'>История просмотра</Typography>
                    <Typography variant={isMobile ? 'h5' : 'h4'} align='center' sx={{ marginTop: 3 }}>В разработке</Typography>
                </Paper>
            </Box>
            {user.role === 'streamer' && renderStreamerPanel()}
        </Box>
    );
}

export default UserPage;

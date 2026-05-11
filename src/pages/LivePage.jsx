import { useState, useEffect } from 'react';
import LiveStreamCard from '../components/LiveStreamCard.jsx';
import { getLivestreams } from '../services/api';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';

function LivePage() {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    const token = localStorage.getItem('token');

    useEffect(() => {
        getLivestreams(token)
            .then((data) => {
                setStreams(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Ошибка при загрузке трансляций:', err);
                setError('Не удалось загрузить трансляции');
                setLoading(false);
            });
    }, [token]);

    const liveStreams = streams.filter((s) => s.status === 'live');
    const upcomingStreams = streams.filter((s) => s.status === 'upcoming');
    const endedStreams = streams.filter((s) => s.status === 'ended');

    const filteredStreams =
        tab === 0 ? liveStreams : tab === 1 ? upcomingStreams : endedStreams;

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#121212',
                    color: '#ffffff',
                }}
            >
                <CircularProgress sx={{ color: '#ffffff' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#121212',
                    color: '#ffffff',
                }}
            >
                <Typography variant="h5" color="error">
                    {error}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                backgroundColor: '#121212',
                minHeight: 'auto',
                color: '#ffffff',
            }}
        >
            <Typography variant="h4" sx={{ marginBottom: '10px' }}>
                Трансляции
            </Typography>
            <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                sx={{
                    marginBottom: '20px',
                    '& .MuiTab-root': { color: '#bdbdbd' },
                    '& .Mui-selected': { color: '#fff' },
                    '& .MuiTabs-indicator': { backgroundColor: '#d50000' },
                }}
            >
                <Tab label={`В эфире (${liveStreams.length})`} />
                <Tab label={`Запланировано (${upcomingStreams.length})`} />
                <Tab label={`Прошедшие (${endedStreams.length})`} />
            </Tabs>
            {filteredStreams.length === 0 ? (
                <Typography variant="h6" color="text.secondary">
                    {tab === 0
                        ? 'Сейчас нет активных трансляций'
                        : tab === 1
                        ? 'Нет запланированных трансляций'
                        : 'Нет прошедших трансляций'}
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(345px, 1fr))',
                        gap: '20px',
                        width: '100%',
                        maxWidth: '1200px',
                    }}
                >
                    {filteredStreams.map((stream) => (
                        <LiveStreamCard key={stream.id} stream={stream} />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default LivePage;

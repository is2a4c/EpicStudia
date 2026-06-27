import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getLivestreamById } from '../services/api';
import { initVideoStream, destroyVideoStream } from '../services/streaming';
import {
    Box,
    Typography,
    Chip,
    CircularProgress,
    Avatar,
    IconButton,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

function LiveStreamPage() {
    const { id } = useParams();
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        getLivestreamById(id, token)
            .then((data) => {
                setStream(data);
                setLoading(false);
                setTimeout(() => initHLS(), 100);
            })
            .catch(() => {
                setError('Трансляция не найдена');
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    const initHLS = () => {
        const video = videoRef.current;
        if (!video) return;

        // HLS-плейлист от медиасервера (MediaMTX), проксируется web-nginx на /hls/.
        // OBS публикует rtmp://<host>/live/<id> → путь MediaMTX live/<id>.
        const streamUrl = `/hls/live/${id}/index.m3u8`;

        initVideoStream({
            video,
            streamUrl,
            hlsRef,
            onError: (data) => console.error('HLS error:', data),
        });
    };

    useEffect(() => {
        return () => {
            destroyVideoStream(hlsRef);
        };
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        setIsMuted(!isMuted);
        video.muted = !video.muted;
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#121212',
                }}
            >
                <CircularProgress sx={{ color: '#ffffff' }} />
            </Box>
        );
    }

    if (error || !stream) {
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
                    {error || 'Трансляция не найдена'}
                </Typography>
            </Box>
        );
    }

    const videoContainerStyles = isFullscreen
        ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#000',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
          }
        : {
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '20px',
              backgroundColor: '#000',
          };

    const videoStyles = isFullscreen
        ? { width: '100%', height: '100%', objectFit: 'contain' }
        : { width: '100%', borderRadius: '10px' };

    const isLive = stream.status === 'live';

    return (
        <Box
            sx={{
                maxWidth: '800px',
                margin: '70px auto',
                padding: '20px',
                backgroundColor: '#212121',
                color: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.8)',
                '@media (max-width: 600px)': {
                    maxWidth: '100%',
                    margin: '10px',
                    padding: '15px',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: '16px' }}>
                <Typography variant="h4">{stream.title}</Typography>
                {isLive && (
                    <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 14, color: '#ff1744' }} />}
                        label="LIVE"
                        sx={{
                            backgroundColor: '#d50000',
                            color: '#fff',
                            fontWeight: 'bold',
                        }}
                    />
                )}
            </Box>

            {stream.streamer && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '20px' }}>
                    <Avatar sx={{ bgcolor: '#3f51b5' }}>
                        {stream.streamer[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ color: '#bdbdbd' }}>
                        {stream.streamer}
                    </Typography>
                </Box>
            )}

            {stream.description && (
                <Typography variant="body1" sx={{ marginBottom: '20px', color: '#bdbdbd' }}>
                    {stream.description}
                </Typography>
            )}

            {isLive ? (
                <Box sx={videoContainerStyles}>
                    <video
                        ref={videoRef}
                        style={videoStyles}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <IconButton onClick={togglePlay} sx={{ color: '#fff' }}>
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <IconButton onClick={toggleMute} sx={{ color: '#fff' }}>
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <IconButton onClick={toggleFullscreen} sx={{ color: '#fff' }}>
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        height: 400,
                        backgroundColor: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        marginBottom: '20px',
                    }}
                >
                    <Typography variant="h5" sx={{ color: '#424242' }}>
                        {stream.status === 'upcoming'
                            ? 'Трансляция скоро начнётся'
                            : 'Трансляция завершена'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default LiveStreamPage;

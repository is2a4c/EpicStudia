import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box, Chip, Avatar } from '@mui/material';
import PropTypes from 'prop-types';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';

LiveStreamCard.propTypes = {
    stream: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        streamer: PropTypes.string,
        status: PropTypes.string,
        viewerCount: PropTypes.number,
    }).isRequired,
};

function LiveStreamCard({ stream }) {
    const isLive = stream.status === 'live';

    return (
        <Card
            sx={{
                maxWidth: 345,
                width: '100%',
                backgroundColor: '#212121',
                color: '#ffffff',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.8)',
                borderRadius: '15px',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    height: 180,
                    backgroundColor: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {isLive && (
                    <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 14, color: '#ff1744' }} />}
                        label="LIVE"
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            backgroundColor: '#d50000',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                        }}
                    />
                )}
                {stream.viewerCount > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            borderRadius: 1,
                            padding: '2px 8px',
                        }}
                    >
                        <VisibilityIcon sx={{ fontSize: 16, color: '#fff' }} />
                        <Typography variant="caption" sx={{ color: '#fff' }}>
                            {stream.viewerCount}
                        </Typography>
                    </Box>
                )}
                <Typography variant="h3" sx={{ color: '#424242', userSelect: 'none' }}>
                    📺
                </Typography>
            </Box>
            <CardContent sx={{ padding: '16px' }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '4px' }}
                >
                    {stream.title}
                </Typography>
                {stream.streamer && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '8px' }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 14, bgcolor: '#3f51b5' }}>
                            {stream.streamer[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                            {stream.streamer}
                        </Typography>
                    </Box>
                )}
                {stream.description && (
                    <Typography
                        variant="body2"
                        sx={{ color: '#bdbdbd', fontSize: '0.9rem', marginBottom: '16px' }}
                    >
                        {stream.description}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        component={Link}
                        to={`/live/${stream.id}`}
                        fullWidth
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.9rem',
                            backgroundColor: '#d50000',
                            '&:hover': { backgroundColor: '#b71c1c' },
                        }}
                    >
                        {isLive ? 'Смотреть' : 'Запланировано'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

export default LiveStreamCard;

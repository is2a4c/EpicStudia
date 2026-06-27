import { Link } from 'react-router-dom';
import { Card, CardMedia, CardContent, Typography, Chip, Button, Box, LinearProgress, Rating } from '@mui/material';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { API_URL, setMovieRating } from '../services/api';

MovieCard.propTypes = {
    movie: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        fullMovieUrl: PropTypes.string,
        hashtags: PropTypes.string.isRequired,
        rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }).isRequired,
};

function MovieCard({ movie }) {
    const [isHovered, setIsHovered] = useState(false);
    const [progress, setProgress] = useState(0);
    const [rating, setRating] = useState(parseFloat(movie.rating) || 0);
    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const token = localStorage.getItem('token');

    const handleRatingChange = async (event, newValue) => {
        if (!newValue) return;
        setRating(newValue);
        
        try {
            await setMovieRating(movie.id, newValue, token);
        } catch (err) {
            console.error('Failed to set rating:', err);
            setRating(movie.rating || 0);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
        setProgress(0);

        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.play().catch((err) => {
                console.warn('Video play interrupted:', err);
            });
        }

        timerRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timerRef.current);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setProgress(100);

        const video = videoRef.current;
        if (video) {
            video.pause();
            video.currentTime = 0;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '100fr', // Для мобильных устройств (xs = extra small)
                    sm: '200fr', // Для планшетов (sm = small)
                    md: '500fr', // Для десктопов (md = medium)
                },
                padding: 2,
            }}
        >
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
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                        position: 'relative',
                    }}
                >
                    <CardMedia
                        component="video"
                        ref={videoRef}
                        src={`${API_URL}/movies/${movie.id}/stream`}
                        muted
                        loop={false}
                        sx={{
                            height: 250,
                            objectFit: 'cover',
                            filter: isHovered ? 'brightness(100%)' : 'brightness(60%)',
                            transition: 'filter 0.3s ease-in-out',
                            borderRadius: '15px 15px 0 0',
                        }}
                    />
                    {isHovered && (
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '4px',
                                backgroundColor: '#424242',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#3f51b5',
                                },
                            }}
                        />
                    )}
                </Box>
                <CardContent
                    sx={{
                        padding: '16px',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '1.25rem',
                            marginBottom: '8px',
                        }}
                    >
                        {movie.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#bdbdbd',
                            fontSize: '0.9rem',
                            marginBottom: '16px',
                        }}
                    >
                        {movie.description}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '5px',
                            marginBottom: '16px',
                        }}
                    >
                        {movie.hashtags.split(',').map((hashtag, index) => (
                            <Chip
                                key={index}
                                label={hashtag.trim()}
                                component={Link}
                                to={`/movie/search/${hashtag.trim().replace('#', '')}`}
                                clickable
                                sx={{
                                    backgroundColor: '#424242',
                                    color: '#ffffff',
                                    '&:hover': {
                                        backgroundColor: '#616161',
                                    },
                                    fontSize: '0.8rem',
                                }}
                            />
                        ))}
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: '10px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            variant="contained"
                            component={Link}
                            to={`/movie/${movie.id}`}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                backgroundColor: '#3f51b5',
                                '&:hover': {
                                    backgroundColor: '#303f9f',
                                },
                                gridColumn: 0,
                            }}
                        >
                            Смотреть
                        </Button>
                        <Box sx={{ textAlign: 'right', gridColumn: 2 }}>
                            <Rating
                                name="movie-rating"
                                value={rating}
                                precision={0.5}
                                onChange={token ? handleRatingChange : null}
                                readOnly={!token}
                                sx={{
                                    color: '#ffd700',
                                    gridColumn: 2,
                                }}
                            />
                            {!token && (
                                <Typography variant="caption" sx={{ color: '#bdbdbd' }}>
                                    Войдите чтобы оценить
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

export default MovieCard;

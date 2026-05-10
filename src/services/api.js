import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const getMovies = async () => {
    const response = await api.get('/movies');
    return response.data;
};

export const getMovieById = async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
};

export const addMovie = async (movie, token) => {
    const formData = new FormData();
    formData.append('fullMovie', movie.video);
    formData.append('title', movie.title);
    formData.append('description', movie.description);
    formData.append('hashtags', JSON.stringify(movie.hashtags.split(',').map(tag => tag.trim())));

    const response = await api.post('/movies/upload', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.data;
};


export const addComment = async (movieId, text, user) => {
    if (user === null) {
        user = 'guest';
    }

    await api.post(`/movies/${movieId}/comment`, { user, text });
};

export const getCommentByMovieId = async (movieId) => {
    const response = await api.get(`/movies/${movieId}/comments`);
    return response.data;
};

export const LoginOrRegisterUser = async (endpoint, username, password) => {
    const response = await api.post(`/user/${endpoint}`, { username, password });
    return response.data;
};

export const getUserProfile = async (token) => {
    const response = await api.get('/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const getUsers = async (token) => {
    const response = await api.get('/user/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const getUserById = async (token, id) => {
    const response = await api.get(`/user/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
}

export const blockedUser = async (token, id, blocked) => {
    await api.post(`/user/${id}/block`, { blocked }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const setRole = async (token, id, role) => {
    await api.post(`/user/${id}/role`, { role }, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
};

export const getMoviesByHashtags = async (hashtags) => {
    const response = await api.get('/movies/search', {
        params: { hashtags },
    });

    if (response.status !== 200) {
        throw new Error('Ошибка при поиске фильмов');
    }

    return response.data;
};

export const setMovieRating = async (movieId, rating, token) => {
    const response = await api.post(`/movies/${movieId}/ratings`, { rating }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const getLivestreams = async () => {
    const response = await api.get('/live');
    return response.data;
};

export const getLivestreamById = async (id) => {
    const response = await api.get(`/live/${id}`);
    return response.data;
};

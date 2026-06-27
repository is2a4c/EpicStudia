import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const getErrorMessage = (error) => {
    const responseData = error?.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (responseData?.message) {
        return responseData.message;
    }

    return error?.message || 'Что-то пошло не так';
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers?.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message = getErrorMessage(error);

        if (status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/user') {
                window.location.assign('/user');
            }
        }

        return Promise.reject(new ApiError(message, status));
    }
);

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
    const response = await api.get('/user/profile', token ? {
        headers: { 'Authorization': `Bearer ${token}` }
    } : undefined);
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
    const response = await api.get('/search', {
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

export const getLivestreams = async (token) => {
    const response = await api.get('/live', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    return response.data;
};

export const getLivestreamById = async (id, token) => {
    const response = await api.get(`/live/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    return response.data;
};

export const createLivestream = async ({ title, description, streamer }, token) => {
    const response = await api.post('/live', { title, description, streamer }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    return response.data;
};

export const updateLivestreamStatus = async (id, status, token) => {
    const response = await api.patch(`/live/${id}/status`, { status }, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

export const getLivestreamObsConfig = async (id, token) => {
    const response = await api.get(`/live/${id}/stream`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data;
};

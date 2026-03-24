import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add token and tenantId
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
    }

    return config;
});

export default client;

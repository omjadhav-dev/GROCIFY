import axios from 'axios';

// Base URL - all API calls go through this
const API = axios.create({
  baseURL: '/api',
});

// Interceptor: automatically attach JWT token to every request
API.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('grocifyUser');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export default API;

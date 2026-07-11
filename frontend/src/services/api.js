// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// "Interceptor": Justo antes de que salga la petición al backend, hacemos esto...
api.interceptors.request.use((config) => {
  // 1. Buscamos el token en el bolsillo del navegador
  const token = localStorage.getItem('token');
  
  // 2. Si hay un token, lo pegamos en la cabecera (Header) de la petición
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
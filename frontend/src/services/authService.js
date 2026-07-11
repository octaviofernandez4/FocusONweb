import api from './api';

// Función que manda los datos del registro al backend
export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

// Función que manda los datos del login al backend
export const loginUser = async (userData) => {
  const response = await api.post('/login', userData);
  return response.data;
};
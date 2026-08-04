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

export const forgotPassword = async (email) => {
  const response = await api.post('/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post(`/reset-password/${token}`, { newPassword });
  return response.data;
};
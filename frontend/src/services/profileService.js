import api from './api';

export const getProfile = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/me', profileData);
  return response.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.put('/me/password', { currentPassword, newPassword });
  return response.data;
};

export const dismissNotification = async (taskId) => {
  const response = await api.patch('/me/notifications/dismiss', { taskId });
  return response.data;
};

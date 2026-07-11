import api from './api';

export const getTasks = async (projectId) => {
  const response = await api.get('/tasks', { params: projectId ? { project: projectId } : undefined });
  return response.data;
};

export const getTaskStats = async () => {
  const response = await api.get('/tasks/stats');
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// Función para actualizar una tarea (marcar como completada, cambiar proyecto/prioridad, etc.)
export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const restoreAllTasks = async () => {
  const response = await api.patch('/tasks/restore-all');
  return response.data;
};

export const clearAllCompletedTasks = async () => {
  const response = await api.delete('/tasks/clear-all');
  return response.data;
};

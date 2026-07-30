import api from './api';

// Sube un archivo (PNG/JPG/PDF) a Cloudinary vía el backend y devuelve
// su metadata ({ name, url, size, type }) para adjuntarlo a una tarea.
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/uploads', formData);
  return response.data;
};

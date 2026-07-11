import api from './api';

export const getCurrentOrg = async () => {
  const response = await api.get('/orgs/me');
  return response.data;
};

export const updateOrg = async (orgData) => {
  const response = await api.put('/orgs/me', orgData);
  return response.data;
};

export const listMembers = async () => {
  const response = await api.get('/orgs/me/members');
  return response.data;
};

export const generateInvite = async () => {
  const response = await api.post('/orgs/me/invite');
  return response.data;
};

export const joinOrg = async (token) => {
  const response = await api.post(`/orgs/join/${token}`);
  return response.data;
};

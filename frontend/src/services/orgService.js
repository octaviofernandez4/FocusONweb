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

export const removeMember = async (userId) => {
  const response = await api.delete(`/orgs/me/members/${userId}`);
  return response.data;
};

export const generateInvite = async (email) => {
  const response = await api.post('/orgs/me/invite', email ? { email } : undefined);
  return response.data;
};

export const joinOrg = async (token) => {
  const response = await api.post(`/orgs/join/${token}`);
  return response.data;
};

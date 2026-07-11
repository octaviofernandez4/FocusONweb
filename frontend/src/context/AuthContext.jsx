import { useState, useEffect, useCallback } from 'react';
import { getProfile } from '../services/profileService';
import { AuthContext } from './authContextObject';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const cargarPerfil = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const perfil = await getProfile();
      setUser(perfil);
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPerfil();
  }, [cargarPerfil]);

  const login = async (token) => {
    localStorage.setItem('token', token);
    await cargarPerfil();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    refreshProfile: cargarPerfil
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

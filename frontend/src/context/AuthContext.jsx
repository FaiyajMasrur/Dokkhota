// Auth context for Dokkhota that stores the logged-in user and JWT access token in memory
import { createContext, useContext, useEffect, useState } from 'react';
import authService, { api } from '../services/authService.js';

const AuthContext = createContext(null);

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    id: userData.id || userData._id || userData._id?.toString(),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshResponse = await authService.refreshToken();
        const token = refreshResponse.data?.accessToken;
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const meResponse = await authService.getMe();
          if (meResponse.data?.success) {
            setUser(normalizeUser(meResponse.data.user));
            setAccessToken(token);
          }
        }
      } catch (error) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData, token) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(normalizeUser(userData));
    setAccessToken(token);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore logout failures
    }
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setAccessToken(null);
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setAccessToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

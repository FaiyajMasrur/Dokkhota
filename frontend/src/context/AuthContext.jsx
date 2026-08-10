// Auth context for Dokkhota that stores the logged-in user and JWT access token
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
        const storedToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (storedToken) {
          api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        }
        const refreshResponse = await authService.refreshToken();
        const token = refreshResponse.data?.accessToken || storedToken;
        if (token) {
          localStorage.setItem('token', token);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const meResponse = await authService.getMe();
          if (meResponse.data?.success) {
            setUser(normalizeUser(meResponse.data.user));
            setAccessToken(token);
          }
        }
      } catch (error) {
        // If refresh fails but we have a stored token, try getMe() directly
        const storedToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (storedToken) {
          try {
            api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
            const meResponse = await authService.getMe();
            if (meResponse.data?.success) {
              setUser(normalizeUser(meResponse.data.user));
              setAccessToken(storedToken);
            }
          } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            setUser(null);
            setAccessToken(null);
          }
        } else {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);
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
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
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

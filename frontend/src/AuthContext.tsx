import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api'
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response, 
      (error) => {
        if (error.response && error.response.status === 401) {
          logout(); 
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token && !user) {
        try {
          const response = await apiClient.get('/profile');
          setUser(response.data);
        } catch (error) {
          console.error("Gagal mengambil profil:", error);
          logout();
        }
      }
    };

    fetchProfile();
  }, [token, user]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userResponse = await apiClient.get('/profile', {
         headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userResponse.data);

      return true; 
    } catch (error) {
      console.error('Login failed:', error);
      return false; 
    }
  };

  const register = async (nama, email, password) => {
    try {
      await apiClient.post('/register', { nama, email, password });
      return true; 
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; 
    }
  };

  const updateProfile = async (formData) => {
    try {
        const response = await apiClient.put('/profile', formData);
        
        if (response.data.user) {
            setUser(response.data.user);
        }
        
        return { success: true, message: response.data.message };
    } catch (error) {
        console.error('Update failed:', error);
        return { 
            success: false, 
            message: error.response?.data?.error || 'Gagal memperbarui profil.' 
        };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        token, 
        login, 
        logout, 
        register, 
        updateProfile,
        apiClient 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
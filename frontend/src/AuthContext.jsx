import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

// Buat 'instance' axios
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api'
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Otomatis tambahkan token ke setiap request jika ada
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setToken(access_token);
      setUser(user);
      return true; // Sukses
    } catch (error) {
      console.error('Login failed:', error);
      return false; // Gagal
    }
  };

  const register = async (nama, email, password) => {
    try {
      await apiClient.post('/register', { nama, email, password });
      return true; // Sukses
    } catch (error) {
      console.error('Registration failed:', error);
      return false; // Gagal
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, apiClient }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook kustom untuk mempermudah penggunaan context
export const useAuth = () => {
  return useContext(AuthContext);
};
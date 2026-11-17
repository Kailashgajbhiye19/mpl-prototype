
import React, { useState } from 'react';
import { AuthContext } from './AuthContextValue';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });

  //  Login Function 
  const login = async (username, password) => {
    try {
      // Backend Route: /api/admin/login
      const response = await api.post('/admin/login', { username, password });
      
      const { token, user } = response.data;

      if (token && user) {
        // Save to LocalStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      console.error("Login Failed:", error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || "Invalid Username or Password" 
      };
    }
    return { success: false, message: "Login failed" };
  };

  // 3. Logout Function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = `${import.meta.env.BASE_URL}login`;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

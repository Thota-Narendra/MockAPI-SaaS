import { useState, useEffect } from 'react';
import api from '../api'; // This import needs to work

const TOKEN_KEY = 'mockapi-token';

export const useAuth = () => {
  const [token, setToken] = useState(null);

  // On app load, check if a token is already in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      // This is the line that fails if 'api' is undefined
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  const login = async (email, password) => {
    // 1. FastAPI's token endpoint expects 'x-www-form-urlencoded' data
    const params = new URLSearchParams();
    params.append('username', email); // FastAPI uses 'username' for the email
    params.append('password', password);

    // 2. Make the API call
    const response = await api.post('/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // 3. If successful, get the token
    const newToke = response.data.access_token;

    // 4. Save the token
    localStorage.setItem(TOKEN_KEY, newToke);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToke}`;
    setToken(newToke);
  };

  const logout = () => {
    // 1. Remove the token
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
  };

  return { token, login, logout };
};
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth'; // Import the hook we just made

// Create the context
const AuthContext = createContext(null);

// Create a "Provider" component
// This component will wrap our app and provide the auth value
export const AuthProvider = ({ children }) => {
  const auth = useAuth(); // This holds { token, login, logout }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a simple hook to USE the context
export const useAuthContext = () => {
  return useContext(AuthContext);
};
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useAuthContext(); // Get the token from our context

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If there is a token, show the "child" route (e.g., the Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;
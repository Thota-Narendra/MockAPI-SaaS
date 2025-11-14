import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import OrganizationPage from './pages/OrganizationPage';
import ProjectPage from './pages/ProjectPage'; // <-- IMPORT NEW PAGE

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- PROTECTED ROUTES --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/org/:orgId" element={<OrganizationPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} /> {/* <-- ADD THIS LINE */}
        </Route>

      </Routes>
    </div>
  );
}

export default App;
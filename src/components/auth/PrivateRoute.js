import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Make sure AuthContext is imported correctly

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Session...</div>;
  }

  return user ? children : <Navigate to="/role-selection" />;
}
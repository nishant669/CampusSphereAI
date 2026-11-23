import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Verifying session..." />;

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    let target = '/student/dashboard';
    if (user?.role === 'ADMIN') target = '/admin/dashboard';
    else if (user?.role === 'PROFESSOR') target = '/professor/dashboard';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleGuard({ allowedRoles }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="p-4">Checking permissions...</div>;
  }

  // 1. If not logged in, send to login
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in BUT role is not allowed, kick them out
  if (!allowedRoles.includes(profile.role)) {
    console.warn(`Unauthorized access attempt. Role: ${profile.role}, Required: ${allowedRoles}`);
    // Redirecting to "/" will trigger the AppLayout logic to send them to their correct dashboard
    return <Navigate to="/" replace />;
  }

  // 3. If allowed, render the page
  return <Outlet />;
}
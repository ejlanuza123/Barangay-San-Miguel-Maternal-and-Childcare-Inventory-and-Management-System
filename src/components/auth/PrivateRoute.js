import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const termsAccepted = sessionStorage.getItem("termsAccepted") === "true";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // 1. If terms are not accepted, redirect them immediately.
  if (!termsAccepted) {
    return <Navigate to="/terms-and-conditions" />;
  }

  // 2. If terms are accepted but the user is not logged in, send them to role selection.
  if (!user) {
    return <Navigate to="/role-selection" />;
  }

  // 3. If both conditions are met, show the app.
  return children;
}

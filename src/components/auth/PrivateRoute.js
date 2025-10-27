import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  // --- MODIFIED: We now get the 'profile' as well ---
  const { user, profile, loading } = useAuth();
  const termsAccepted = sessionStorage.getItem("termsAccepted") === "true";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading User Data...
      </div>
    );
  }

  // --- MODIFIED: Swapped the order ---

  // 1. If loading is done and there is NO user, send to role selection.
  if (!user) {
    return <Navigate to="/role-selection" />;
  }

  // 2. If there IS a user, check their role for the terms.
  //    Only "USER/MOTHER/GUARDIAN" needs to accept terms.
  //    Admin, BHW, and BNS can skip this check.
  if (profile && profile.role === "USER/MOTHER/GUARDIAN" && !termsAccepted) {
    return <Navigate to="/terms-and-conditions" />;
  }

  // 3. If the user is logged in AND they are not a "USER" (so they are Admin/BHW/BNS)
  //    OR if they are a "USER" and have accepted the terms, show the app.
  return children;
}

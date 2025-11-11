import React, { useEffect, useState } from "react"; // Added useState
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- NEW: State is "lifted" to here ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState("My Profile");

  // --- NEW: Function to open the modal and (optionally) set a tab ---
  const openSettings = (tab = "My Profile") => {
    setInitialSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // --- NEW: Function to close the modal ---
  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (!loading && profile) {
      const isBasePath =
        location.pathname === "/" || location.pathname === "/dashboard";
      if (isBasePath) {
        switch (profile.role) {
          case "Admin":
            navigate("/admin/dashboard", { replace: true });
            break;
          case "BHW":
            navigate("/bhw/dashboard", { replace: true });
            break;
          case "BNS":
            navigate("/bns/dashboard", { replace: true });
            break;
          default:
            navigate("/login", { replace: true });
        }
      }
    }
  }, [profile, loading, navigate, location.pathname]);

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading User Profile...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar fixed */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm z-10">
        {/* --- UPDATED: Pass openSettings prop to Sidebar --- */}
        <Sidebar role={profile.role} openSettings={openSettings} />
      </aside>

      {/* Header fixed */}
      <header className="fixed top-0 left-64 right-0 h-16 border-b bg-white shadow-sm z-20">
        {/* --- UPDATED: Pass all settings props to Header --- */}
        <Header
          role={profile.role}
          openSettings={openSettings}
          isSettingsOpen={isSettingsOpen}
          closeSettings={closeSettings}
          initialSettingsTab={initialSettingsTab}
        />
      </header>

      {/* Scrollable content area */}
      <main className="absolute top-16 left-64 right-0 bottom-0 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

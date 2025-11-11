import React, { useState, useEffect, useRef } from "react";
import SettingsModal from "./SettingsModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

// --- (Your Icons: SearchIcon, BellIcon, etc.) ---
const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {" "}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>{" "}
  </svg>
);
const BellIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {" "}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    ></path>{" "}
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {" "}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>{" "}
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {" "}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>{" "}
  </svg>
);

const ProfileDropdown = ({ profile, user }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/role-selection", { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-30"
    >
      <div className="p-4 border-b flex items-center space-x-4">
        <img
          src={
            profile?.avatar_url ||
            `https://ui-avatars.com/api/?name=${
              profile?.first_name || "U"
            }&background=random`
          }
          alt="User Avatar"
          className="w-16 h-16 rounded-full border-2 border-blue-200"
        />
        <div>
          <h3 className="font-bold text-gray-800">{`${
            profile?.first_name || ""
          } ${profile?.last_name || ""}`}</h3>
          <p className="text-sm text-gray-500">{profile?.role}</p>
          <p className="text-xs text-gray-400 truncate" title={user?.email}>
            {user?.email}
          </p>
        </div>
      </div>

      <div className="p-4 text-sm text-gray-700 space-y-3">
        <div className="flex justify-between">
          <span className="font-semibold">Assigned Purok:</span>
          <span>{profile?.assigned_purok || "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Birthday:</span>
          <span>{formatDate(profile?.birth_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Contact No:</span>
          <span>{profile?.contact_no || "N/A"}</span>
        </div>
      </div>

      <div className="p-2 border-t">
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};

// --- UPDATED: Now receives props from AppLayout ---
export default function Header({
  openSettings,
  isSettingsOpen,
  closeSettings,
  initialSettingsTab,
}) {
  const { profile, user, signOut } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const prevUnreadCount = useRef(0);
  const isInitialLoad = useRef(true);
  const { addNotification } = useNotification();

  // --- isSettingsOpen state is REMOVED from here ---

  const handleMarkOneRead = async (e, notificationId) => {
    /* ... */
  };
  const handleDeleteOne = async (e, notificationId) => {
    /* ... */
  };
  const handleDeleteAll = async () => {
    /* ... */
  };
  const handleMarkAllRead = async () => {
    /* ... */
  };
  const handleNotificationClick = (notification) => {
    /* ... */
  };

  useEffect(() => {
    // ... (Your existing notification logic) ...
  }, [user, profile, addNotification]);

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const getTitle = () => {
    if (!profile) return "Loading...";
    switch (profile.role) {
      case "BHW":
        return "Barangay Health Worker";
      case "BNS":
        return "Barangay Nutrition Scholar";
      case "Admin":
        return "Administrator";
      case "USER/MOTHER/GUARDIAN":
        return "My Health Portal";
      default:
        return "Dashboard";
    }
  };

  return (
    <>
      {/* --- UPDATED: Uses props to render SettingsModal --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            onClose={closeSettings}
            initialTab={initialSettingsTab}
          />
        )}
      </AnimatePresence>

      <header className="bg-white px-4 py-3 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <BellIcon />
              {profile?.preferences?.in_app_notifications &&
                unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
            </button>
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                // ... (your notification dropdown) ...
                >
                  {/* ... (notification content) ... */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Button */}
          <button
            // --- UPDATED: Calls prop function with "My Profile" tab ---
            onClick={() => openSettings("My Profile")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {/* --- NOTE: This is the Profile Icon from your other screenshot --- */}
            {/* You can replace this with your SettingsIcon if you prefer */}
            <img
              src={
                profile?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  profile?.first_name || "U"
                }&background=random`
              }
              alt="User Avatar"
              className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-blue-400 transition-colors"
            />
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2"
            >
              {/* This was removed from the button above, but you can add it back if you like */}
              {/* <span className="hidden md:block text-sm font-semibold">{profile?.first_name}</span> */}
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <ProfileDropdown
                  profile={profile}
                  user={user}
                  signOut={signOut}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}

import React, { useState, useEffect, useRef } from "react"; // Add useRef
import SettingsModal from "./SettingsModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

// --- SVG Icons ---
const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);
const BellIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);
const SettingsIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>
  </svg>
);

const ProfileDropdown = ({ profile, user }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate(); // <-- 1. Get the navigate function

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- 2. Create a handler that signs out AND navigates ---
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
        {/* --- 3. Update the onClick handler --- */}
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

export default function Header() {
  const { profile, user, signOut } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const prevUnreadCount = useRef(0);
  const isInitialLoad = useRef(true);
  const { addNotification } = useNotification();
  const handleMarkOneRead = async (e, notificationId) => {
    e.stopPropagation(); // Prevent navigation when clicking the button

    // Optimistically update the UI for a fast response
    setNotifications((current) =>
      current.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

    // Update the database in the background
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  };

  const handleDeleteOne = async (e, notificationId) => {
    e.stopPropagation(); // Prevent navigation

    // Optimistically update the UI
    setNotifications((current) =>
      current.filter((n) => n.id !== notificationId)
    );

    // Delete from the database in the background
    await supabase.from("notifications").delete().eq("id", notificationId);
  };

  const handleDeleteAll = async () => {
    // Optimistically update the UI for a fast response
    setNotifications([]);
    setUnreadCount(0);
    setIsNotifOpen(false); // Close dropdown after action

    // Delete all of the user's notifications from the database in the background
    await supabase.from("notifications").delete().eq("user_id", user.id);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistically update the UI
    setNotifications((current) =>
      current.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
    setIsNotifOpen(false); // Close dropdown after action

    // Update the database in the background
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  };

  const handleNotificationClick = (notification) => {
    // --- NEW: Logic for Admin's user request notifications ---
    if (profile.role === "Admin" && notification.type === "user_request") {
      navigate("/admin/requestions");
    } else {
      // Original logic for other notification types
      const rolePath = profile.role.toLowerCase().split("/")[0];
      let path = "";
      switch (notification.type) {
        case "inventory_alert":
          path = `/${rolePath}/inventory`;
          break;
        case "appointment_reminder":
          path = `/${rolePath}/appointment`;
          break;
        case "patient_followup":
          if (rolePath === "bhw") {
            path = "/bhw/maternity-management";
          } else if (rolePath === "bns") {
            path = "/bns/child-records";
          }
          break;
        default:
          break;
      }
      if (path) navigate(path);
    }
    setIsNotifOpen(false);
  };

  useEffect(() => {
    if (!user || !profile) return;

    let channel;

    if (profile.role === "Admin") {
      const fetchRequestionsAsNotifications = async () => {
        const { data, error, count } = await supabase
          .from("requestions")
          .select("*, profiles:worker_id(first_name, last_name)", {
            count: "exact",
          })
          .eq("status", "Pending");
        if (error) {
          console.error("Error fetching requestions:", error);
          return;
        }
        const formattedNotifications = (data || []).map((req) => ({
          id: req.id,
          type: "user_request",
          message: `${
            req.profiles?.first_name || "A user"
          } submitted a new request for ${req.request_type}.`,
          created_at: req.created_at,
          is_read: false,
        }));
        setNotifications(formattedNotifications);
        setUnreadCount(data?.length || 0); // Use data.length for reliability
      };

      fetchRequestionsAsNotifications();

      channel = supabase
        .channel("requestions-for-admin")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "requestions" },
          (payload) => {
            // This will update the bell icon count
            fetchRequestionsAsNotifications();

            // --- NEW: This block shows the floating notification on a new request ---
            if (payload.eventType === "INSERT") {
              addNotification(
                "New user request submitted for approval.",
                "warning"
              );
            }
          }
        )
        .subscribe();
    } else {
      // BHW/BNS logic remains the same
      const fetchStandardNotifications = async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }
        const newUnreadCount = (data || []).filter((n) => !n.is_read).length;
        if (
          !isInitialLoad.current &&
          newUnreadCount > prevUnreadCount.current
        ) {
          const audio = new Audio("/notification.mp3");
          audio.play().catch((e) => console.error("Audio play failed:", e));
        }
        setNotifications(data || []);
        setUnreadCount(newUnreadCount);
        prevUnreadCount.current = newUnreadCount;
        isInitialLoad.current = false;
      };

      fetchStandardNotifications();

      channel = supabase
        .channel("notifications-for-user")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            if (payload.new.user_id === user.id) {
              fetchStandardNotifications();
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>

      <header className="bg-white px-4 py-3 flex justify-between items-center border-b">
        {/* Left: Role Title */}
        <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>

        {/* Right: Controls */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <BellIcon />
              {profile?.preferences?.in_app_notifications &&
                unreadCount > 0 && (
                  // --- THIS IS THE CORRECTED LINE ---
                  // Removed fixed width (w-5), added min-width and horizontal padding (px-1)
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
            </button>
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20"
                >
                  <div className="p-4 font-bold border-b">Notifications</div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`group relative p-2 border-b hover:bg-gray-100 cursor-pointer ${
                            !notif.is_read ? "bg-blue-50" : ""
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-800">
                            {notif.type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-600">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>

                          {/* --- MODIFIED: Action buttons only show for non-admins --- */}
                          {profile.role !== "Admin" && (
                            <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.is_read && (
                                <button
                                  onClick={(e) =>
                                    handleMarkOneRead(e, notif.id)
                                  }
                                  className="p-1 rounded-full text-gray-400 hover:bg-green-100 hover:text-green-600"
                                  title="Mark as Read"
                                >
                                  <CheckCircleIcon />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteOne(e, notif.id)}
                                className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"
                                title="Delete Notification"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-4 text-center">
                        No notifications.
                      </p>
                    )}
                  </div>
                  {/* --- NEW DROPDOWN FOOTER --- */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t bg-gray-50 flex justify-center items-center space-x-4">
                      {/* Mark all as read button */}
                      <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="text-xs font-semibold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        Mark all as read
                      </button>

                      {/* Divider */}
                      <div className="border-l h-4"></div>

                      {/* Delete all button */}
                      <button
                        onClick={handleDeleteAll}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete All
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <SettingsIcon />
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2"
            >
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

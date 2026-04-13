// src/components/layout/SettingsModal.js

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import PrivacyPolicy from "../auth/PrivacyPolicy";
import {
  disablePushSubscription,
  isPushNotificationSupported,
  requestAndStorePushSubscription,
} from "../../services/pushNotificationService";
// --- 1. IMPORT HELPSECTION ---
import HelpSection from "./HelpSection";

// --- ICONS ---
const BackIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    ></path>
  </svg>
);
const ProfileIcon = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    ></path>
  </svg>
);
const BellIcon = () => (
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
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    ></path>
  </svg>
);
const HelpIcon = () => (
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
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);
const LockIcon = () => (
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
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    ></path>
  </svg>
);
const InfoIcon = () => (
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
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);
const ProfilePlaceholderIcon = () => (
  <svg
    className="w-12 h-12 text-gray-400"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);
const CameraIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
);
// --- REUSABLE TOGGLE SWITCH ---
const ToggleSwitch = ({ label, description, isEnabled, onToggle, disabled = false }) => (
  <div className="flex justify-between items-center py-2">
    <div>
      <h4 className="font-semibold text-gray-800">{label}</h4>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isEnabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          isEnabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

// --- Sub-Components for each settings tab ---

const MyProfile = ({ profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        middle_initial: profile.middle_initial || "",
        birth_date: profile.birth_date || "",
        contact_no: profile.contact_no || "",
        assigned_purok: profile.assigned_purok || "",
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: "", text: "" });
      if (!event.target.files || event.target.files.length === 0)
        throw new Error("You must select an image to upload.");

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      setAvatarUrl(newAvatarUrl);
      await handleUpdate(null, { avatar_url: newAvatarUrl });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e, additionalData = {}) => {
    if (e) e.preventDefault();
    setMessage({ type: "", text: "" });

    const fullName = `${formData.first_name || ""} ${formData.last_name || ""}`
      .trim()
      .replace(/\s+/g, " ");

    const updates = {
      id: user.id,
      role: profile.role,
      ...formData,
      full_name: fullName,
      ...additionalData,
      updated_at: new Date(),
    };

    if (updates.birth_date === "") {
      updates.birth_date = null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(updates)
      .select()
      .single();

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      onProfileUpdate(data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 p-5">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-600 mt-1">Manage your profile details</p>
      </div>

      <form
        onSubmit={handleUpdate}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-700 block mb-3">
            Profile Picture
          </label>
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ProfilePlaceholderIcon />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 bg-sky-600 text-white p-2 rounded-full border-2 border-white shadow-md hover:bg-sky-700 transition-colors"
              aria-label="Upload new profile picture"
            >
              <CameraIcon />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadAvatar}
              disabled={uploading}
              style={{ display: "none" }}
              accept="image/*"
            />
          </div>
          {uploading && (
            <p className="text-sm text-slate-500 mt-2">Uploading...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-semibold text-slate-700">
              Middle Initial
            </label>
            <input
              type="text"
              name="middle_initial"
              maxLength="2"
              value={formData.middle_initial}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Birth Date
          </label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className="w-full sm:w-1/2 p-3 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Contact No.
            </label>
            <input
              type="text"
              name="contact_no"
              value={formData.contact_no}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
            />
          </div>
          {(profile?.role === "BHW" || profile?.role === "BNS") && (
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Assigned Purok
              </label>
              <select
                name="assigned_purok"
                value={formData.assigned_purok}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              >
                <option value="">Select Purok</option>
                <option value="Purok Bagong Silang Zone 1">
                  Purok Bagong Silang Zone 1
                </option>
                <option value="Purok Bagong Silang Zone 2">
                  Purok Bagong Silang Zone 2
                </option>
                <option value="Purok Masigla Zone 1">
                  Purok Masigla Zone 1
                </option>
                <option value="Purok Masigla Zone 2">
                  Purok Masigla Zone 2
                </option>
                <option value="Purok Masaya">Purok Masaya</option>
                <option value="Purok Bagong Lipunan">
                  Purok Bagong Lipunan
                </option>
                <option value="Purok Dagomboy">Purok Dagomboy</option>
                <option value="Purok Katarungan Zone 1">
                  Purok Katarungan Zone 1
                </option>
                <option value="Purok Katarungan Zone 2">
                  Purok Katarungan Zone 2
                </option>
                <option value="Purok Pagkakaisa">Purok Pagkakaisa</option>
                <option value="Purok Kilos-Agad">Purok Kilos-Agad</option>
                <option value="Purok Balikatan">Purok Balikatan</option>
                <option value="Purok Bayanihan">Purok Bayanihan</option>
                <option value="Purok Magkakapitbahay">
                  Purok Magkakapitbahay
                </option>
                <option value="Purok Magara Zone 2">Purok Magara Zone 2</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            value={user?.email}
            disabled
            className="w-full p-3 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg mt-2 cursor-not-allowed"
          />
        </div>

        {message.text && (
          <p
            className={`text-sm font-semibold ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-2.5 px-8 rounded-xl shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
};
const NotificationSettings = ({ initialPrefs, onUpdate }) => {
  const [prefs, setPrefs] = useState(
    () => {
      const defaultPrefs = {
        follow_up_visits: true,
        inventory_alerts: true,
        in_app_notifications: true,
        push_notifications: false,
        email_notifications: false,
      };

      const mergedPrefs = {
        ...defaultPrefs,
        ...(initialPrefs || {}),
      };

      // Backward compatibility for older saved key name.
      if (
        typeof mergedPrefs.follow_up_visits === "undefined" &&
        typeof initialPrefs?.appointment_reminders !== "undefined"
      ) {
        mergedPrefs.follow_up_visits = initialPrefs.appointment_reminders;
      }

      return mergedPrefs;
    }
  );
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isPushPending, setIsPushPending] = useState(false);

  const pushSupported = isPushNotificationSupported();

  const handleToggle = async (key) => {
    setMessage({ type: "", text: "" });

    if (key === "push_notifications") {
      if (!pushSupported) {
        setMessage({
          type: "error",
          text: "Push notifications are not supported in this browser.",
        });
        return;
      }

      setIsPushPending(true);

      if (!prefs.push_notifications) {
        try {
          await requestAndStorePushSubscription();
          const newPrefs = { ...prefs, push_notifications: true };
          setPrefs(newPrefs);
          await onUpdate(newPrefs);
          setMessage({
            type: "success",
            text: "Push notifications enabled for this browser.",
          });
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Failed to enable push notifications.",
          });
        } finally {
          setIsPushPending(false);
        }
        return;
      }

      try {
        await disablePushSubscription();
      } catch (error) {
        console.error("Failed to unsubscribe push:", error);
      } finally {
        const newPrefs = { ...prefs, push_notifications: false };
        setPrefs(newPrefs);
        await onUpdate(newPrefs);
        setMessage({
          type: "success",
          text: "Push notifications disabled for this browser.",
        });
        setIsPushPending(false);
      }
      return;
    }

    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    await onUpdate(newPrefs);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Notification Settings
      </h2>
      <p className="text-gray-500 mb-8">
        Manage how you receive important reminders and updates about
        follow-up visits, inventory, and announcements. Choose your preferred
        channels and customize your notification experience.
      </p>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Notification Types
          </h3>
          <div className="space-y-3">
            <ToggleSwitch
              label="Follow-up Visits"
              description="Notify when your dedicated follow-up visit is due today or tomorrow."
              isEnabled={prefs.follow_up_visits}
              onToggle={() => handleToggle("follow_up_visits")}
            />
            <ToggleSwitch
              label="Inventory Alerts"
              description="Notifications about low stock or expiring medical supplies."
              isEnabled={prefs.inventory_alerts}
              onToggle={() => handleToggle("inventory_alerts")}
            />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Notification Channels
          </h3>
          <div className="space-y-3">
            <ToggleSwitch
              label="In-app Notifications"
              description="Real-time alerts within the web and mobile apps."
              isEnabled={prefs.in_app_notifications}
              onToggle={() => handleToggle("in_app_notifications")}
            />
            <ToggleSwitch
              label="Push Notifications"
              description={
                pushSupported
                  ? "Browser alerts while using the web app in this browser."
                  : "Push notifications are not supported on this browser."
              }
              isEnabled={prefs.push_notifications}
              onToggle={() => handleToggle("push_notifications")}
              disabled={isPushPending || !pushSupported}
            />
            <ToggleSwitch
              label="Email Notifications"
              description="Optional email updates for those who prefer email."
              isEnabled={prefs.email_notifications}
              onToggle={() => handleToggle("email_notifications")}
            />
          </div>
        </div>
      </div>
      {message.text && (
        <p
          className={`mt-5 text-sm font-semibold ${
            message.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

const AboutSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800">About Us</h2>
    <p className="text-gray-500 mb-6">Who are we</p>
    <div className="space-y-6 text-gray-700 leading-relaxed prose max-w-none">
      <p>{`The Barangay San Miguel Maternity and Childcare Inventory System is a digital platform designed to modernize and streamline maternal and child healthcare services at the community level. Developed as both a web and Android application, the system integrates patient management, inventory tracking, appointment scheduling, automated notifications, and data analytics into a unified, secure environment. It empowers Barangay Health Workers, Barangay Nutrition Scholars, barangay officials, mothers, and guardians to efficiently manage health records, monitor the availability of essential medical supplies, and coordinate appointments and follow-ups, all while ensuring data privacy and compliance with the Philippine Data Privacy Act. By providing real-time access to accurate information and supporting offline data entry with automatic synchronization, the system addresses the long-standing challenges of manual record-keeping, inventory shortages, and fragmented communication that have traditionally hindered effective healthcare delivery in Barangay San Miguel.`}</p>
      <div>
        <h3 className="text-xl font-bold text-blue-600 mb-2">Our Mission</h3>
        <p>{`The mission of the Barangay San Miguel Maternity and Childcare Inventory System is to enhance the quality, efficiency, and accessibility of maternal and child-healthcare services in Barangay San Miguel by equipping healthcare providers and families with innovative digital tools that facilitate accurate data management, timely resource allocation, and proactive patient engagement. The system is committed to supporting healthcare workers in delivering personalized, evidence-based care, reducing administrative burdens, and ensuring that mothers and children receive the right services at the right time.`}</p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-blue-600 mb-2">Our Vision</h3>
        <p>{`The vision of the Barangay San Miguel Maternity and Childcare Inventory System is to become a model of community-driven digital healthcare transformation, where every mother and child in Barangay San Miguel benefits from seamless, equitable, and secure access to essential health services. The system aspires to foster a healthier, more empowered community through technology-enabled collaboration, continuous improvement, and a steadfast commitment to data privacy, ethical standards, and inclusive care for all.`}</p>
      </div>
    </div>
  </div>
);

// --- 2. UPDATED: Accepts 'initialTab' prop ---
export default function SettingsModal({ onClose, initialTab = "My Profile" }) {
  const { profile, setProfile } = useAuth();

  // --- 3. UPDATED: Uses 'initialTab' to set default state ---
  const [activeTab, setActiveTab] = useState(initialTab);

  // --- 4. NEW: Guard clause for loading ---
  if (!profile) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center font-sans">
        <p className="text-lg text-gray-600">Loading settings...</p>
      </div>
    );
  }

  const navItems = [
    { name: "My Profile", icon: <ProfileIcon /> },
    { name: "Notification Setting", icon: <BellIcon /> },
    { name: "Help", icon: <HelpIcon /> },
    { name: "Privacy Policy", icon: <LockIcon /> },
    { name: "About", icon: <InfoIcon /> },
  ];

  const handleUpdatePreferences = async (newPrefs) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({ preferences: newPrefs })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) console.error("Error updating preferences:", error);
    else setProfile(data);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "My Profile":
        return (
          <MyProfile profile={profile} onProfileUpdate={handleProfileUpdate} />
        );
      case "Notification Setting":
        return (
          <NotificationSettings
            initialPrefs={profile?.preferences}
            onUpdate={handleUpdatePreferences}
          />
        );
      case "Help":
        return <HelpSection />; // Renders your imported component
      case "Privacy Policy":
        return <PrivacyPolicy />;
      case "About":
        return <AboutSection />;
      default:
        return (
          <div className="text-center p-8 text-gray-500">
            {activeTab} section coming soon.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex font-sans">
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        className="w-full md:w-80 bg-gray-50 p-6 border-r flex-col hidden md:flex"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <BackIcon />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Setting</h1>
        </div>
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center space-x-3 p-3 rounded-lg text-left font-semibold text-base transition-colors w-full ${
                activeTab === item.name
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
      <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {/* Back button for mobile view */}
        <div className="md:hidden flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <BackIcon />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Setting</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

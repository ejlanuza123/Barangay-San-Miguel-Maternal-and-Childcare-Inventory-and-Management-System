import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import PrivacyPolicy from "../auth/PrivacyPolicy";

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
const ToggleSwitch = ({ label, description, isEnabled, onToggle }) => (
  <div className="flex justify-between items-center py-2">
    <div>
      <h4 className="font-semibold text-gray-800">{label}</h4>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
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

    const updates = {
      id: user.id,
      role: profile.role,
      ...formData,
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
    <div>
      <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
      <p className="text-gray-500 mb-8">Manage your profile details</p>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Profile Picture
          </label>
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
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
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-md hover:bg-blue-700 transition-colors"
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
            <p className="text-sm text-gray-500 mt-2">Uploading...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {/* --- FIX: Increased margin-top from mt-1 to mt-2 for consistency --- */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-3 border bg-gray-50 rounded-md mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-3 border bg-gray-50 rounded-md mt-2"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">
              Middle Initial
            </label>
            <input
              type="text"
              name="middle_initial"
              maxLength="2"
              value={formData.middle_initial}
              onChange={handleChange}
              className="w-full p-3 border bg-gray-50 rounded-md mt-2"
            />
          </div>
        </div>

        {/* --- FIX: Increased margin-top from mt-1 to mt-2 --- */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Birth Date
          </label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className="w-full sm:w-1/2 p-3 border bg-gray-50 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* --- FIX: Increased margin-top from mt-1 to mt-2 for consistency --- */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact No.
            </label>
            <input
              type="text"
              name="contact_no"
              value={formData.contact_no}
              onChange={handleChange}
              className="w-full p-3 border bg-gray-50 rounded-md mt-2"
            />
          </div>
          {(profile?.role === "BHW" || profile?.role === "BNS") && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Assigned Purok
              </label>
              <input
                type="text"
                name="assigned_purok"
                value={formData.assigned_purok}
                onChange={handleChange}
                className="w-full p-3 border bg-gray-50 rounded-md mt-2"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email}
            disabled
            className="w-full p-3 border bg-gray-100 rounded-md mt-2 cursor-not-allowed"
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

        <div className="pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-sm hover:bg-blue-700"
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
    initialPrefs || {
      appointment_reminders: true,
      inventory_alerts: true,
      patient_followups: true,
      in_app_notifications: true,
      sms_notifications: true,
      email_notifications: false,
    }
  );

  const handleToggle = (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    onUpdate(newPrefs);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Notification Settings
      </h2>
      <p className="text-gray-500 mb-8">
        Manage how you receive important reminders and updates about
        appointments, inventory, and announcements. Choose your preferred
        channels and customize your notification experience.
      </p>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Notification Types
          </h3>
          <div className="space-y-3">
            <ToggleSwitch
              label="Appointment Reminders"
              description="Alerts for upcoming prenatal check-ups, postnatal visits, and child immunizations."
              isEnabled={prefs.appointment_reminders}
              onToggle={() => handleToggle("appointment_reminders")}
            />
            <ToggleSwitch
              label="Inventory Alerts"
              description="Notifications about low stock or expiring medical supplies."
              isEnabled={prefs.inventory_alerts}
              onToggle={() => handleToggle("inventory_alerts")}
            />
            <ToggleSwitch
              label="Patient Follow-ups"
              description="Reminders for overdue check-ups, missed appointments, or follow-up actions."
              isEnabled={prefs.patient_followups}
              onToggle={() => handleToggle("patient_followups")}
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
              label="SMS Notifications"
              description="Text message reminders for users with limited internet access."
              isEnabled={prefs.sms_notifications}
              onToggle={() => handleToggle("sms_notifications")}
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

export default function SettingsModal({ onClose }) {
  const { profile, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("My Profile");

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

  const tabs = [
    "My Profile",
    "Notification Setting",
    "Privacy Policy",
    "About",
  ];

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

// src/components/layout/HelpSection.js

import React, { useState } from "react";

// --- ICONS ---
const TroubleshootingIcon = () => (
  <svg
    className="w-8 h-8 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
);

const BhwIcon = () => (
  <svg
    className="w-8 h-8 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.184-1.268-.5-1.857M12 12a3 3 0 100-6 3 3 0 000 6zM6 16.732V16c0-1.657 1.343-3 3-3h3m-3 3v-2c0-.653.184-1.268.5-1.857M6 16.732A8.01 8.01 0 014 16c-1.105 0-2 .895-2 2s.895 2 2 2h2m0-4v2"
    ></path>
  </svg>
);

const ContactIcon = () => (
  <svg
    className="w-8 h-8 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    ></path>
  </svg>
);

const BackIcon = () => (
  <svg
    className="w-5 h-5 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    ></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    ></path>
  </svg>
);

// --- Data Structure with IMPROVED Level 3 Content ---
const helpData = {
  common: {
    title: "Common Basic Troubleshooting",
    description: "Find answers to common questions and login issues.",
    icon: <TroubleshootingIcon />,
    subTopics: [
      {
        id: "login_issues",
        title: "Login Issues",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">
              What to do if you can't log in
            </p>
            <p>
              It's frustrating to be locked out! Let's try these steps to get
              you back in.
            </p>
            <ol className="list-decimal list-outside pl-6 space-y-3">
              <li>
                <strong>Check your Login Type:</strong> Are you on the right
                page?
                <ul className="list-disc list-inside pl-4 mt-1">
                  <li>
                    If you are a <strong>BHW or BNS</strong>, use the "Employee
                    Login".
                  </li>
                  <li>
                    If you are an <strong>Admin</strong>, use the "Admin Login".
                  </li>
                </ul>
              </li>
              <li>
                <strong>Check your Email & Password:</strong> Passwords are
                case-sensitive, so make sure your <strong>Caps Lock</strong> is
                off.
              </li>
              <li>
                <strong>Check your Internet:</strong> The system needs a stable
                internet connection. Try visiting another website to be sure
                you're online.
              </li>
              <li>
                <strong>Reset your Password:</strong> If you've forgotten it,
                click the <strong>“Forgot Password?”</strong> link on the login
                page. We'll send a reset link to your registered email.
              </li>
              <li>
                <strong>Clear your Cache:</strong> Sometimes your browser holds
                on to old data. A "hard refresh" can fix this. Press{" "}
                <strong>Ctrl+Shift+R</strong> .
              </li>
              <li>
                <strong>Contact Support:</strong> If you're still stuck after
                all these steps, please contact your system administrator for
                help.
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: "data_sync",
        title: "Data Sync Problems",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">
              Why does my data look old or not updated?
            </p>
            <p>
              This can happen if your device isn't fully synced with our server.
              Here’s what to do:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>
                <strong>Check Your Connection:</strong> A stable internet
                connection is required for real-time updates.
              </li>
              <li>
                <strong>Are you offline?</strong> If you're using the system in
                offline mode, remember to sync your data as soon as you
                reconnect to Wi-Fi or mobile data.
              </li>
              <li>
                <strong>Refresh the Page:</strong> The simplest fix is often to
                restart the app or refresh your browser.
              </li>
              <li>
                <strong>Report the Issue:</strong> If the problem keeps
                happening, please let your system administrator know.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "notification_issues",
        title: "Notification Issues",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">
              Not receiving notifications?
            </p>
            <p>Let's check a few places to find out why:</p>
            <ol className="list-decimal list-outside pl-6 space-y-3">
              <li>
                <strong>Check System Settings:</strong> Go to{" "}
                <strong>Settings &gt; Notification Setting</strong>. Are "In-app
                Notifications" and "SMS Notifications" enabled?
              </li>
              <li>
                <strong>Check Your Email:</strong> Is it possible the email
                reminders are in your <strong>Spam or Junk folder</strong>?
              </li>
              <li>
                <strong>Check Your Profile:</strong> Is your mobile number and
                email address correct in{" "}
                <strong>Settings &gt; My Profile</strong>?
              </li>
              <li>
                <strong>Contact Support:</strong> If all your settings are
                correct and you're still not getting alerts, please contact
                support.
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: "system_performance",
        title: "System Performance",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">Is the system running slow?</p>
            <p>
              A slow system can be caused by your device or the network. Here
              are a few things to try:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>
                <strong>Close Other Apps:</strong> Free up your device's memory
                by closing other apps or browser tabs.
              </li>
              <li>
                <strong>Use Recommended Browsers:</strong> For the best
                experience, use a modern browser like Chrome, Firefox, or
                Safari.
              </li>
              <li>
                <strong>Report It:</strong> If the system is slow for everyone
                (not just you), please report it to technical support so they
                can investigate.
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  bhw_specific: {
    title: "Officer Specific Help",
    description: "Guides on managing patients, inventory, and appointments.",
    icon: <BhwIcon />,
    subTopics: [
      {
        id: "patient_management",
        title: "Patient Record Management",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">Tips for Patient Management</p>
            <p>
              Keep your patient records clean and up-to-date with these tips:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>
                <strong>Use QR Codes:</strong> Scan a patient's QR code for
                instant access to their file. Make sure your device's camera or
                scanner is working.
              </li>
              <li>
                <strong>Search Before Creating:</strong> To prevent duplicates,
                always use the <strong>search bar</strong> to see if a patient
                already exists before creating a new profile.
              </li>
              <li>
                <strong>Update Immediately:</strong> To avoid losing data or
                forgetting details, update a patient's record (like check-ups or
                given vitamins) <strong>immediately after</strong> their
                consultation.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "inventory_problems",
        title: "Inventory management Problems",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">
              Best Practices for Inventory
            </p>
            <p>
              An accurate inventory count is critical. Here's how to ensure it:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>
                <strong>Record All Movements:</strong> Log any added stock or
                distributed items (vitamins, vaccines){" "}
                <strong>as soon as it happens</strong> to keep the count
                accurate.
              </li>
              <li>
                <strong>Set Your Alerts:</strong> Go to the "Inventory" page and
                verify that your <strong>stock thresholds</strong> (the "low
                stock" level) are set correctly. This is what triggers the
                low-stock alerts.
              </li>
              <li>
                <strong>Report Discrepancies:</strong> If your physical count
                doesn't match the system count (and you can't find the error),
                report the discrepancy to the barangay officials or your admin.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "appointment_issues",
        title: "Appointment Scheduling Issues",
        content: (
          <div className="space-y-4 text-gray-700">
            <p className="font-semibold text-lg">Handling Appointments</p>
            <p>
              Help patients and staff stay on the same page with scheduling.
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>
                <strong>Double-Check Details:</strong> Before you hit "Save" on
                a new appointment, confirm the{" "}
                <strong>date, time, and service type</strong> (e.g., Prenatal,
                Vaccination) are all correct.
              </li>
              <li>
                <strong>Reduce No-Shows:</strong> The system's automatic
                reminder feature is your best tool. Make sure notifications are
                enabled for patients.
              </li>
              <li>
                <strong>Notifications Not Sending?</strong> If you get reports
                that patients aren't receiving their SMS or email reminders,
                please contact support immediately.
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  contact: {
    title: "Contact Support",
    description: "Get in touch with the system administrator.",
    icon: <ContactIcon />,
    subTopics: [
      {
        id: "main",
        title: "Contact Support",
        content: (
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="text-lg">
                If your issue is not listed here, please contact your system
                administrator or the Barangay San Miguel Health Center office
                for further assistance.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-lg">
                <strong>Email:</strong> support@brgy-sanmiguel.ph (example)
              </p>
              <p className="text-lg mt-2">
                <strong>Phone:</strong> (02) 8123-4567 (example)
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
};

// --- Card Component (for Level 1) ---
const CategoryCard = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-200 text-left flex items-start space-x-4"
    >
      <div className="flex-shrink-0 pt-1">{icon}</div>
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </button>
  );
};

// --- Sub-Topic Item (for Level 2) ---
const SubTopicItem = ({ title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-150"
    >
      <span className="font-medium text-gray-800">{title}</span>
      <ChevronRightIcon />
    </button>
  );
};

// --- Main Help Section Component ---
const HelpSection = () => {
  const [selectedCategory, setSelectedCategory] = useState(null); // 'common', 'bhw_specific', etc.
  const [selectedSubTopic, setSelectedSubTopic] = useState(null); // 'login_issues', 'patient_management', etc.

  // --- Navigation Logic ---
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);

    // If the category is 'contact', skip Level 2 and go straight to content
    if (categoryId === "contact") {
      setSelectedSubTopic("main");
    }
  };

  const handleSubTopicClick = (subTopicId) => {
    setSelectedSubTopic(subTopicId);
  };

  const handleBack = () => {
    // If on Level 3 (sub-topic content is showing)
    if (selectedSubTopic) {
      // And the category is NOT 'contact' (meaning it has a Level 2)
      if (selectedCategory !== "contact") {
        setSelectedSubTopic(null); // Go back to Level 2 (sub-topic list)
      } else {
        // If it IS 'contact', go all the way back to Level 1
        setSelectedCategory(null);
        setSelectedSubTopic(null);
      }
    }
    // If on Level 2 (sub-topic list is showing)
    else if (selectedCategory) {
      setSelectedCategory(null); // Go back to Level 1 (category cards)
    }
  };

  // --- Data for Rendering ---
  const categoryData = selectedCategory ? helpData[selectedCategory] : null;
  const subTopicData =
    categoryData && selectedSubTopic
      ? categoryData.subTopics.find((t) => t.id === selectedSubTopic)
      : null;

  // --- Render Logic ---
  const renderContent = () => {
    // --- LEVEL 3: Show final content ---
    if (subTopicData) {
      return (
        <div>
          <button
            onClick={handleBack}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
          >
            <BackIcon />
            Back
          </button>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {subTopicData.title}
          </h3>
          <div>{subTopicData.content}</div>
        </div>
      );
    }

    // --- LEVEL 2: Show sub-topics list ---
    if (categoryData) {
      return (
        <div>
          <button
            onClick={handleBack}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
          >
            <BackIcon />
            Back to categories
          </button>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {categoryData.title}
          </h3>
          <div className="space-y-3">
            {categoryData.subTopics.map((subTopic) => (
              <SubTopicItem
                key={subTopic.id}
                title={subTopic.title}
                onClick={() => handleSubTopicClick(subTopic.id)}
              />
            ))}
          </div>
        </div>
      );
    }

    // --- LEVEL 1: Show main category cards ---
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(helpData).map(([key, cat]) => (
            <CategoryCard
              key={key}
              title={cat.title}
              description={cat.description}
              icon={cat.icon}
              onClick={() => handleCategoryClick(key)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Help Center</h2>
      <p className="text-gray-500 mb-8">
        The Help section offers clear guidance, troubleshooting, and FAQs
        tailored to Barangay Nutrition Scholars, Health Workers, and Admins,
        enabling them to efficiently use the system and resolve common issues
        independently.
      </p>
      {renderContent()}
    </div>
  );
};

export default HelpSection;

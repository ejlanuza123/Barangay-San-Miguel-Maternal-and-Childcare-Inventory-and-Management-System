import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import logo from "../../assets/logo.jpg";
import illustration from "../../assets/illustration.png";
import backgroundImage from "../../assets/background.png";

// --- UPDATED Admin Login Modal ---
const AdminLoginModal = ({ onClose }) => {
  const [username, setUsername] = useState(""); // Changed from email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Assuming admin logs in with email, but the field is labeled "Username"
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile.role !== "Admin") {
        setError("Invalid administrator credentials.");
        await supabase.auth.signOut();
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 text-center">
          Admin Login Required
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-4 text-center">
          Please enter your administrator username and password to continue.
          This area is restricted to authorized personnel only.
        </p>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input
            type="text" // Changed from email to text
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- SVG Icons based on the provided image ---
const BhwIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 23C28.4183 23 32 19.4183 32 15C32 10.5817 28.4183 7 24 7C19.5817 7 16 10.5817 16 15C16 19.4183 19.5817 23 24 23Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34 30H38L36 25L34 30Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 30H10L12 25L14 30Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M30 41H18C17.4696 41 16.9609 40.7893 16.5858 40.4142C16.2107 40.0391 16 39.5304 16 39V31C16 28.7909 17.7909 27 20 27H28C30.2091 27 32 28.7909 32 31V39C32 39.5304 31.7893 40.0391 31.4142 40.4142C31.0391 40.7893 30.5304 41 30 41Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const BnsIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M31 4H17C16.4696 4 15.9609 4.21071 15.5858 4.58579C15.2107 4.96086 15 5.46957 15 6V42C15 42.5304 15.2107 43.0391 15.5858 43.4142C15.9609 43.7893 16.4696 44 17 44H31C31.5304 44 32.0391 43.7893 32.4142 43.4142C32.7893 43.0391 33 42.5304 33 42V6C33 5.46957 32.7893 4.96086 32.4142 4.58579C32.0391 4.21071 31.5304 4 31 4Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 32C26.2091 32 28 30.2091 28 28C28 25.7909 26.2091 24 24 24C21.7909 24 20 25.7909 20 28C20 30.2091 21.7909 32 24 32Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 24V14C24 12.9391 24.4214 11.9217 25.1716 11.1716C25.9217 10.4214 26.9391 10 28 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const AdminIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 28C29.5228 28 34 23.5228 34 18C34 12.4772 29.5228 8 24 8C18.4772 8 14 12.4772 14 18C14 23.5228 18.4772 28 24 28Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M38 42V38C38 35.7909 36.2091 34 34 34H14C11.7909 34 10 35.7909 10 38V42"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function RoleSelection() {
  const navigate = useNavigate();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const handleRoleSelect = (role) => {
    if (role === "Admin") {
      setIsAdminModalOpen(true);
    } else {
      navigate("/login", { state: { role: role } });
    }
  };

  const roles = [
    {
      value: "BHW",
      label: (
        <div>
          <span className="whitespace-nowrap">Barangay Health</span> Worker
        </div>
      ),
      icon: <BhwIcon />,
      description:
        "Para sa mga BHW na nag-aasikaso ng mga pasyente at prenatal care.",
      color: "blue",
    },
    {
      value: "BNS",
      label: (
        <div>
          <span className="whitespace-nowrap">Barangay Nutrition</span> Scholar
        </div>
      ),
      icon: <BnsIcon />,
      description: "Para sa mga BNS na nagmomonitor ng nutrisyon ng mga bata.",
      color: "green",
    },
    {
      value: "Admin",
      label: "Admin",
      icon: <AdminIcon />,
      description: "Para sa system administrator.",
      color: "yellow",
    },
  ];

  const getButtonColorClasses = (color) => {
    switch (color) {
      case "blue":
        return "border-blue-500 text-blue-800 hover:bg-blue-50";
      case "green":
        return "border-green-500 text-green-800 hover:bg-green-50";
      case "yellow":
        return "border-yellow-400 text-yellow-800 hover:bg-yellow-50";
      default:
        return "border-gray-300 text-gray-800 hover:bg-gray-50";
    }
  };

  const getIconBgColor = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-400";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isAdminModalOpen && (
          <AdminLoginModal onClose={() => setIsAdminModalOpen(false)} />
        )}
      </AnimatePresence>

      <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Left Panel */}
          <div
            className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-start text-white relative bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-green-500 opacity-75"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div>
                <div className="flex items-center space-x-4 mb-8">
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-24 h-24 rounded-full border-2 border-green-300 shadow-xl"
                  />
                  <div>
                    <h1 className="text-2xl font-bold drop-shadow-lg">
                      Barangay San Miguel
                    </h1>
                    <h2 className="text-2xl font-bold drop-shadow-lg">
                      Health Center
                    </h2>
                    <p className="text-xs text-black font-semibold drop-shadow-md">
                      Maternity and Infant Care Inventory Management
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-grow flex flex-col justify-around items-center text-center">
                <h2 className="text-5xl font-bold drop-shadow-2xl">
                  Welcome Back!
                </h2>
                <img
                  src={illustration}
                  alt="Healthcare Illustration"
                  className="w-full max-w-sm h-auto rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 text-center">
                  Please select your role.
                </h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.slice(0, 2).map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRoleSelect(r.value)}
                      className={`p-6 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2 bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 ${getButtonColorClasses(
                        r.color
                      )}`}
                    >
                      <div
                        className={`p-3 rounded-full ${getIconBgColor(
                          r.color
                        )} text-white`}
                      >
                        {r.icon}
                      </div>
                      <span className="font-semibold text-base">{r.label}</span>
                      <span className="text-xs text-gray-500 px-2">
                        {r.description}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  {roles.slice(2, 3).map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRoleSelect(r.value)}
                      className={`sm:w-1/2 p-6 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2 bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 ${getButtonColorClasses(
                        r.color
                      )}`}
                    >
                      <div
                        className={`p-3 rounded-full ${getIconBgColor(
                          r.color
                        )} text-white`}
                      >
                        {r.icon}
                      </div>
                      <span className="font-semibold text-base">{r.label}</span>
                      <span className="text-xs text-gray-500 px-2">
                        {r.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../../services/supabase";
import logo from "../../assets/logo.jpg";
import illustration from "../../assets/illustration.png";
import backgroundImage from "../../assets/background.png";

// --- SVG Icons for the form ---
const MailIcon = () => (
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
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    ></path>
  </svg>
);

const SuccessModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-sm p-8 m-4 text-center">
      <h3 className="text-xl font-bold mb-4 text-green-600">Success</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-green-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-green-600 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-sm p-8 m-4 text-center">
      <h3 className="text-xl font-bold mb-4 text-red-600">Error</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="bg-red-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-600 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Password reset link has been sent to your email.");
    }
    setLoading(false);
  };

  return (
    <>
      {successMessage && (
        <SuccessModal
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}
      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      )}
      <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
                  Reset Password
                </h2>
                <img
                  src={illustration}
                  alt="Healthcare Illustration"
                  className="w-full max-w-sm h-auto rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Panel (Form) */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50">
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-gray-200">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  Forgot Password
                </h2>
                <p className="text-gray-500 mt-2">
                  Enter your email to receive a reset link.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    className="pl-10 mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 disabled:bg-gray-400"
                >
                  {loading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 font-semibold p-2 rounded-full border-2 border-gray-300 hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
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
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

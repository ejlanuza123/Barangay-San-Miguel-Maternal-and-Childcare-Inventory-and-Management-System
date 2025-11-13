// src/components/auth/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../../services/supabase";
import logo from "../../assets/logo.jpg";
import illustration from "../../assets/illustration.png";
import backgroundImage from "../../assets/background.png";


// --- SVG Icons for the form ---
const LockIcon = () => (
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
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    ></path>
  </svg>
);
const EyeIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
        Proceed to Login
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

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing session on component mount
  useEffect(() => {
    checkSession();
    
    // Also set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session);
        } else if (event === 'SIGNED_IN') {
          setSession(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session) {
        setErrorMessage("Invalid or expired reset link. Please request a new password reset.");
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setErrorMessage("Error verifying reset link.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!session) {
      setErrorMessage("Invalid or expired reset link. Please request a new password reset.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Your password has been reset successfully! You can now log in with your new password.");
      
      // Sign out after successful password reset
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMessage(error.message || "An error occurred while resetting your password.");
    }

    setLoading(false);
  };

  const closeSuccessModal = () => {
    setSuccessMessage("");
    navigate("/login");
  };

  const closeErrorModal = () => {
    setErrorMessage("");
    // Optionally redirect to forgot password page
    // navigate("/forgot-password");
  };

  // Show loading while checking session
  if (loading && !session) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {successMessage && (
        <SuccessModal message={successMessage} onClose={closeSuccessModal} />
      )}
      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          onClose={closeErrorModal}
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
                  Create New Password
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
                  Set New Password
                </h2>
                <p className="text-gray-500 mt-2">
                  {session 
                    ? "Please enter and confirm your new password."
                    : "Verifying your reset link..."
                  }
                </p>
              </div>

              {session ? (
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <LockIcon />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="New Password"
                      className="pl-10 mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <EyeIcon />
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <LockIcon />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm New Password"
                      className="pl-10 mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Verifying reset link...</p>
                  <Link 
                    to="/forgot-password" 
                    className="text-blue-500 hover:text-blue-600 mt-4 inline-block"
                  >
                    Request new reset link
                  </Link>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
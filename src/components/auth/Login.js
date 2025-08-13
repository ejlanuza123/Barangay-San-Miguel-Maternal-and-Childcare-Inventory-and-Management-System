import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.jpg'; 
import illustration from '../../assets/illustration.png';
import backgroundImage from '../../assets/background.png';

// --- SVG Icons for the form ---
const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);
const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);
const EyeIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
);


const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-sm p-8 m-4 text-center">
      <h3 className="text-xl font-bold mb-4 text-red-600">Login Error</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <button onClick={onClose} className="bg-red-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-600 transition-colors">
        Close
      </button>
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const role = location.state?.role;

  if (!role) {
    return <Navigate to="/role-selection" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setErrorMessage(loginError.message);
      setLoading(false);
      return;
    }

    if (loginData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        setErrorMessage("Could not find a user profile. Please contact an administrator.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.role === role) {
        navigate('/');
      } else {
        setErrorMessage("This is not the role you registered with. Please select the correct role.");
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <>
      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />}
      <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div 
            className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-start text-white relative bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
              <div className="absolute inset-0 bg-green-500 opacity-75"></div>
              <div className="relative z-10 flex flex-col h-full">
                  <div>
                      <div className="flex items-center space-x-4 mb-8">
                        <img src={logo} alt="Logo" className="w-24 h-24 rounded-full border-2 border-green-300 shadow-xl" />
                        <div>
                          <h1 className="text-2xl font-bold drop-shadow-lg">Barangay San Miguel</h1>
                          <h2 className="text-2xl font-bold drop-shadow-lg">Health Center</h2>
                          <p className="text-xs text-black font-semibold drop-shadow-md">Maternity and Infant Care Inventory Management</p>
                        </div>
                      </div>
                  </div>
                  <div className="flex-grow flex flex-col justify-around items-center text-center">
                      <h2 className="text-5xl font-bold drop-shadow-2xl">Welcome Back!</h2>
                      <img src={illustration} alt="Healthcare Illustration" className="w-full max-w-sm h-auto rounded-lg" />
                  </div>
              </div>
          </div>

          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50">
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-gray-200">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Login</h2>
                <p className="text-gray-500 mt-2">Please login to your account.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon />
                  </span>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="User ID No."
                    className="pl-10 mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm" 
                  />
                </div>
                <div className="relative">
                   <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    placeholder="Password"
                    className="pl-10 mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <EyeIcon />
                  </button>
                </div>
                
                <div className="text-right">
                    <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Forgot password
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 disabled:bg-gray-400">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="mt-6 flex justify-center">
                <button onClick={() => navigate('/role-selection')} className="text-gray-500 hover:text-gray-700 font-semibold p-2 rounded-full border-2 border-gray-300 hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

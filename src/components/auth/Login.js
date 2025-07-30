import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.jpg';

// This is a new, reusable modal component for displaying error messages
const ErrorModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-sm p-8 m-4 text-center">
        <h3 className="text-xl font-bold mb-4 text-red-600">Login Error</h3>
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
};


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New state for controlling the error modal
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  
  const role = location.state?.role;

  if (!role) {
    return <Navigate to="/role-selection" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(''); // Clear previous errors

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

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
        // Set the error message to show the modal
        setErrorMessage("This is not the role you registered with. Please select the correct role.");
        await supabase.auth.signOut();
      }
    }
    
    setLoading(false);
  };

  return (
    <>
      {/* The modal will only be displayed when there is an error message */}
      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />}
      
      <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans">
        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
           <div className="w-full md:w-1/2 bg-teal-500 p-12 flex flex-col justify-center items-center text-white relative">
              <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" alt="Healthcare" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
              <div className="relative z-10 text-center">
                  <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
                  <p className="text-lg text-teal-100">Sign in to continue to your dashboard.</p>
              </div>
          </div>
          <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
            <button onClick={() => navigate('/role-selection')} className="text-teal-500 hover:text-teal-700 font-semibold mb-6 self-start">
              &larr; Back to role selection
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Login</h2>
            <p className="text-gray-600 mb-6">Accessing as: <span className="font-bold text-teal-600">{role}</span></p>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID / Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors duration-300 disabled:bg-gray-400">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {role === 'USER/MOTHER/GUARDIAN' && (
              <p className="text-center text-sm text-gray-600 mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-teal-600 hover:text-teal-800">
                  Register here
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

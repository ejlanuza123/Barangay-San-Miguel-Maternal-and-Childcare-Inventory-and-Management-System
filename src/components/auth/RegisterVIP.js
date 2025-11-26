import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.jpg';

// --- 1. Developer Authentication Modal ---
const DevAccessModal = ({ onVerify }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hardcoded check for developer access (You can change 'dev123' to any secret you want)
    if (code === 'dev123') {
      onVerify(true);
    } else {
      setError('Invalid Developer Code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Developer Access</h2>
        <p className="text-gray-500 text-sm mb-6">This page is restricted for testing purposes only.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            placeholder="Enter Access Code" 
            className="w-full px-4 py-2 border rounded-lg text-center tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          
          <button 
            type="submit" 
            className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-black transition-colors"
          >
            Access System
          </button>
        </form>

        <div className="mt-6 pt-4 border-t">
          <Link to="/" className="text-blue-600 hover:underline text-sm">
            &larr; Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default function RegisterVIP() {
  // --- 2. State for Dev Auth ---
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BHW');
  const [assignedPurok, setAssignedPurok] = useState('');
  const [userIdNo, setUserIdNo] = useState('Generating...');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const generateNextUserId = useCallback(async () => {
    // Don't run logic if not authenticated yet
    if (!isDevAuthenticated) return;

    setUserIdNo('Generating...'); 
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const pattern = `${year}${month}%`;

    const { count, error } = await supabase
      .from('profiles')
      .select('user_id_no', { count: 'exact', head: true })
      .like('user_id_no', pattern);

    if (error) {
      console.error("Error fetching user count:", error);
      setUserIdNo('Error generating ID');
      return;
    }

    const sequenceNumber = (count + 1).toString().padStart(3, '0');
    setUserIdNo(`${year}${month}${sequenceNumber}`);
  }, [isDevAuthenticated]); // Dependency added

  useEffect(() => {
    if (isDevAuthenticated) {
      generateNextUserId();
    }
  }, [generateNextUserId, isDevAuthenticated]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (userIdNo === 'Generating...' || userIdNo === 'Error generating ID') {
      setMessage('User ID is not ready. Please wait or refresh.');
      return;
    }
    setLoading(true);
    setMessage('');

    const userMetaData = {
      full_name: fullName,
      role: role,
    };

    if (role === 'BHW' || role === 'BNS') {
      userMetaData.assigned_purok = assignedPurok;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: userMetaData }
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_id_no: userIdNo })
        .eq('id', data.user.id);

      if (profileError) {
        setMessage(`User created, but failed to set User ID: ${profileError.message}`);
      } else {
        setMessage(`Successfully registered ${role}: ${fullName}. Verify your Email first then log in with User ID: ${userIdNo}.`);
        setFullName('');
        setEmail('');
        setPassword('');
        setAssignedPurok('');
        generateNextUserId();
      }
    }
    setLoading(false);
  };

  // --- 3. Render Modal if not authenticated ---
  if (!isDevAuthenticated) {
    return <DevAccessModal onVerify={setIsDevAuthenticated} />;
  }

  // --- 4. Render Main Form only if authenticated ---
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="w-full md:w-1/2 bg-teal-500 p-12 flex flex-col justify-center items-center text-white">
          <img src={logo} alt="Logo" className="w-24 h-24 mb-4 rounded-full border-4 border-teal-300" />
          <h1 className="text-3xl font-bold mb-2 text-center">Barangay San Miguel</h1>
          <p className="text-lg text-teal-100 text-center">Maternal and Childcare Inventory System</p>
        </div>

        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">VIP Registration</h2>
              <p className="text-gray-500">Create Admin, BHW, or BNS Accounts</p>
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-2 font-semibold">
                Developer Mode Active
              </span>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID No.</label>
              <input 
                type="text" 
                value={userIdNo} 
                readOnly
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                <option value="BHW">BHW (Barangay Health Worker)</option>
                <option value="BNS">BNS (Barangay Nutrition Scholar)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            {(role === 'BHW' || role === 'BNS') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Purok Assigned</label>
                <input type="text" value={assignedPurok} onChange={e => setAssignedPurok(e.target.value)} required placeholder="e.g., Purok 1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
              </div>
            )}
            
            {message && <p className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-gray-400">
              {loading ? 'Creating Account...' : 'Create VIP Account'}
            </button>
          </form>
           <p className="text-center text-sm text-gray-600 mt-8">
            <Link to="/" className="font-medium text-teal-600 hover:text-teal-800">
              &larr; Back to Main Site
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
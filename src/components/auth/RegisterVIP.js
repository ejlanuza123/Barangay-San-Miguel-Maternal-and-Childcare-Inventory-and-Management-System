import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.jpg'; // Import the logo

// Make sure to export the component as default
export default function RegisterVIP() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BHW'); // Default role is now BHW
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Successfully registered ${role}: ${fullName}. They can now log in.`);
      setFullName('');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Left Panel - Design from the proposal */}
        <div className="w-full md:w-1/2 bg-teal-500 p-12 flex flex-col justify-center items-center text-white">
          <img src={logo} alt="Logo" className="w-24 h-24 mb-4 rounded-full border-4 border-teal-300" />
          <h1 className="text-3xl font-bold mb-2 text-center">Barangay San Miguel</h1>
          <p className="text-lg text-teal-100 text-center">Maternal and Childcare Inventory System</p>
        </div>

        {/* Right Panel - The VIP Registration Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">VIP Registration</h2>
              <p className="text-gray-500">Create Admin, BHW, or BNS Accounts</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              >
                <option value="BHW">BHW (Barangay Health Worker)</option>
                <option value="BNS">BNS (Barangay Nutrition Scholar)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            {message && <p className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-gray-400"
            >
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

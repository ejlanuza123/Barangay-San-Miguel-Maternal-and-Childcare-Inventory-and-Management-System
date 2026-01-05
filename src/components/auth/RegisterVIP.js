import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.jpg';

// --- 1. Developer Authentication Modal ---
const DevAccessModal = ({ onVerify }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === 'dev123') {
      onVerify(true);
    } else {
      setError('Invalid Developer Code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center my-8"
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
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('BHW');
  const [assignedPurok, setAssignedPurok] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [userIdNo, setUserIdNo] = useState('Generating...');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const navigate = useNavigate();

  // --- Purok List ---
  const purokOptions = [
    "Purok Bagong Silang Zone 1", "Purok Bagong Silang Zone 2",
    "Purok Masigla Zone 1", "Purok Masigla Zone 2",
    "Purok Masaya", "Purok Bagong Lipunan",
    "Purok Dagomboy",
    "Purok Katarungan Zone 1", "Purok Katarungan Zone 2",
    "Purok Pagkakaisa", "Purok Kilos-Agad",
    "Purok Balikatan", "Purok Bayanihan",
    "Purok Magkakapitbahay", "Purok Magara Zone 2"
  ];

  // --- Generate User ID Function ---
  const generateNextUserId = useCallback(async () => {
    setUserIdNo("Generating...");
    
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const pattern = `${year}${month}%`;
      
      // Get all user_id_no values that match the pattern
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id_no")
        .not("user_id_no", "is", null)
        .like("user_id_no", pattern);
      
      if (error) {
        console.error("Error fetching user IDs:", error);
        setUserIdNo("Error");
        setMessage("Error generating User ID.");
        setMessageType('error');
        return;
      }
      
      // Extract sequence numbers from existing user IDs
      const existingSequences = data
        .map(profile => {
          const id = profile.user_id_no;
          if (id && id.startsWith(`${year}${month}`)) {
            const sequencePart = id.slice(6);
            return parseInt(sequencePart) || 0;
          }
          return 0;
        })
        .filter(seq => seq > 0);
      
      // Find the highest sequence number
      const maxSequence = existingSequences.length > 0 
        ? Math.max(...existingSequences) 
        : 0;
      
      // Generate next sequence number
      const sequenceNumber = (maxSequence + 1).toString().padStart(3, '0');
      const newUserId = `${year}${month}${sequenceNumber}`;
      
      setUserIdNo(newUserId);
      
    } catch (error) {
      console.error("Unexpected error in generateNextUserId:", error);
      setUserIdNo("Error");
      setMessage("Unexpected error generating User ID.");
      setMessageType('error');
    }
  }, []);

  useEffect(() => {
    if (isDevAuthenticated) {
      generateNextUserId();
    }
  }, [generateNextUserId, isDevAuthenticated]);

  // --- FIXED: Handle Registration with better profile handling ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType('error');
      return;
    }

    // Validate User ID is ready
    if (userIdNo === "Generating..." || userIdNo === "Error") {
      setMessage("User ID is still generating. Please wait.");
      setMessageType('error');
      return;
    }

    // Validate required fields
    if (!fullName || !email || !password) {
      setMessage("Please fill in all required fields.");
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('info');

    try {
      // Split full name for first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Step 1: Create auth user with ALL metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            user_id_no: userIdNo,
            assigned_purok: (role === 'BHW' || role === 'BNS' || role === 'Midwife') ? assignedPurok : null,
            contact_no: contactNo,
            birth_date: birthDate,
            first_name: firstName,
            last_name: lastName,
            is_vip: true,
            created_by_dev: true
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        console.log("VIP Auth user created:", data.user.id);
        
        // Step 2: Wait longer for automatic profile creation (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle(); // Use maybeSingle to handle null case

        if (checkError) {
          console.error("Error checking profile:", checkError);
          // Continue anyway, we'll try to insert/update
        }

        // Step 4: INSERT or UPDATE profile based on whether it exists
        let profileError = null;
        
        if (existingProfile) {
          // Profile exists, UPDATE it
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              role: role,
              user_id_no: userIdNo,
              assigned_purok: (role === 'BHW' || role === 'BNS' || role === 'Midwife') ? assignedPurok : null,
              contact_no: contactNo,
              birth_date: birthDate,
              first_name: firstName,
              last_name: lastName,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          profileError = updateError;
          console.log("Updated existing profile");
        } else {
          // Profile doesn't exist, INSERT it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              role: role,
              user_id_no: userIdNo,
              assigned_purok: (role === 'BHW' || role === 'BNS' || role === 'Midwife') ? assignedPurok : null,
              contact_no: contactNo,
              birth_date: birthDate,
              first_name: firstName,
              last_name: lastName,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            });

          profileError = insertError;
          console.log("Inserted new profile");
        }

        if (profileError) {
          console.error("Profile operation error:", profileError);
          // Try one more approach - use upsert
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: fullName,
              role: role,
              user_id_no: userIdNo,
              assigned_purok: (role === 'BHW' || role === 'BNS' || role === 'Midwife') ? assignedPurok : null,
              contact_no: contactNo,
              birth_date: birthDate,
              first_name: firstName,
              last_name: lastName,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error("Upsert also failed:", upsertError);
            throw new Error(`Failed to save profile: ${upsertError.message}`);
          } else {
            console.log("Profile saved via upsert");
          }
        }

        // Step 5: Double-check the profile was saved
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: finalCheck } = await supabase
          .from('profiles')
          .select('user_id_no, role')
          .eq('id', data.user.id)
          .single();

        console.log("Final profile check:", finalCheck);

        // Show success message
        setMessage(`
          ✅ VIP Account Successfully Created!
          
          Role: ${role}
          Name: ${fullName}
          Email: ${email}
          User ID: ${userIdNo}
          ${(role === 'BHW' || role === 'BNS' || role === 'Midwife') ? `Purok: ${assignedPurok || 'Not assigned'}` : ''}
          
          The user can now log in with their email and password.
          ${data.user.confirmed_at ? '✅ Email already confirmed' : '⚠️ Please check email for confirmation link'}
          
          ${finalCheck ? `✅ Profile saved: ${finalCheck.user_id_no} (${finalCheck.role})` : '⚠️ Profile may not have saved correctly'}
        `);
        setMessageType('success');
        
        // Reset form for next registration
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setContactNo('');
        setBirthDate('');
        setAssignedPurok('');
        setRole('BHW');
        
        // Generate next ID for subsequent registrations
        await generateNextUserId();
        
      } else {
        setMessage("Registration failed. No user created.");
        setMessageType('error');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isDevAuthenticated) {
    return <DevAccessModal onVerify={setIsDevAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-y-auto">
      <div className="min-h-screen flex flex-col justify-center items-start py-4 px-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 bg-teal-500 p-8 md:p-12 flex flex-col justify-center items-center text-white">
              <img src={logo} alt="Logo" className="w-20 h-20 md:w-24 md:h-24 mb-4 rounded-full border-4 border-teal-300" />
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Barangay San Miguel</h1>
              <p className="text-base md:text-lg text-teal-100 text-center">Maternal and Childcare Inventory System</p>
              <div className="mt-6 text-center">
                <p className="text-teal-200 text-sm">VIP ACCOUNT REGISTRATION</p>
                <p className="text-teal-300 text-xs mt-2">For Admin, Midwife, BHW, BNS</p>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 overflow-y-auto max-h-[calc(100vh-4rem)]">
              <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">VIP Registration</h2>
                  <p className="text-gray-500 text-sm md:text-base">Create Admin, Midwife, BHW, or BNS Accounts</p>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-2 font-semibold">
                    Developer Mode Active
                  </span>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                {/* User ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID No.</label>
                  <input 
                    type="text" 
                    value={userIdNo} 
                    readOnly
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed font-mono text-sm" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYYMM + sequence (e.g., 202411001)</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" 
                    placeholder="First and Last Name"
                  />
                </div>

                {/* Contact and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact No.</label>
                    <input 
                      type="tel" 
                      value={contactNo} 
                      onChange={e => setContactNo(e.target.value)} 
                      className="w-full px-3 py-2 border rounded-md shadow-sm text-sm" 
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input 
                      type="date" 
                      value={birthDate} 
                      onChange={e => setBirthDate(e.target.value)} 
                      className="w-full px-3 py-2 border rounded-md shadow-sm text-sm" 
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" 
                    placeholder="user@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength="6"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" 
                    placeholder="Minimum 6 characters"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" 
                    placeholder="Re-enter password"
                  />
                </div>

                {/* Role Selection - INCLUDING MIDWIFE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select 
                    value={role} 
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (!['BHW', 'BNS', 'Midwife'].includes(e.target.value)) {
                        setAssignedPurok('');
                      }
                    }} 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="BHW">BHW (Barangay Health Worker)</option>
                    <option value="BNS">BNS (Barangay Nutrition Scholar)</option>
                    <option value="Midwife">Midwife</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Purok Assignment for BHW, BNS, and Midwife */}
                {(role === 'BHW' || role === 'BNS' || role === 'Midwife') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purok Assigned *</label>
                    <select 
                      value={assignedPurok} 
                      onChange={e => setAssignedPurok(e.target.value)} 
                      required 
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
                    >
                      <option value="">Select Purok</option>
                      {purokOptions.map((purok) => (
                        <option key={purok} value={purok}>{purok}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Message Display */}
                {message && (
                  <div className={`p-4 rounded-md border ${
                    messageType === 'error' ? 'bg-red-50 text-red-600 border-red-200' :
                    messageType === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    <pre className="text-sm whitespace-pre-line font-sans">{message}</pre>
                  </div>
                )}
                
                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating VIP Account...
                    </>
                  ) : 'Create VIP Account'}
                </button>
              </form>
              
              <div className="mt-6 md:mt-8 space-y-3">
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Important:</strong> Users will receive an email confirmation link unless email confirmations are disabled in Supabase.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-800 text-center sm:text-left">
                    Login Portal →
                  </Link>
                  <Link to="/" className="text-sm font-medium text-teal-600 hover:text-teal-800 text-center sm:text-left">
                    ← Back to Main Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path>
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
  </svg>
);

const RoleBadge = ({ role }) => {
  const roleColors = {
    BHW: "bg-blue-100 text-blue-800 border border-blue-200",
    BNS: "bg-green-100 text-green-800 border border-green-200",
    Midwife: "bg-purple-100 text-purple-800 border border-purple-200",
    Admin: "bg-red-100 text-red-800 border border-red-200",
  };
  const roleLabels = {
    BHW: "BHW",
    BNS: "BNS",
    Midwife: "Midwife",
    Admin: "Admin",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[role] || "bg-gray-100 text-gray-800"}`}>
      {roleLabels[role] || role}
    </span>
  );
};

// --- HELPER & WIDGET COMPONENTS ---

const Pagination = ({ currentPage, totalPages, totalRecords, onPageChange }) => {
  const getPaginationItems = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    
    const pages = [];
    if (currentPage > 2) pages.push(1);
    if (currentPage > 3) pages.push("...");
    
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) pages.push("...");
    if (currentPage < totalPages - 1) pages.push(totalPages);
    
    return pages;
  };

  return (
    <nav className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-xl shadow-sm border">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-semibold">{(currentPage - 1) * 10 + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(currentPage * 10, totalRecords)}</span> of{" "}
            <span className="font-semibold">{totalRecords}</span> employees
          </p>
        </div>
        <div>
          <ul className="flex space-x-2">
            <li>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                &larr;
              </button>
            </li>
            {getPaginationItems().map((page, index) => (
              <li key={index}>
                {page === "..." ? (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600 font-semibold"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </li>
            ))}
            <li>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                &rarr;
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

const EmployeeCard = ({ employee, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
  >
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={
              employee.avatar_url ||
              `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random&size=128&bold=true`
            }
            alt={`${employee.first_name} ${employee.last_name}`}
            className="w-16 h-16 rounded-full border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
            <div className={`w-2 h-2 rounded-full ${
              employee.role === 'BHW' ? 'bg-blue-500' :
              employee.role === 'BNS' ? 'bg-green-500' :
              employee.role === 'Midwife' ? 'bg-purple-500' :
              'bg-red-500'
            }`}></div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-lg truncate">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-sm text-gray-500 truncate">{employee.email}</p>
          <div className="mt-2">
            <RoleBadge role={employee.role} />
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">USER ID</span>
          <span className="text-sm font-mono bg-gray-50 px-3 py-1.5 rounded-lg border">{employee.user_id_no || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ASSIGNED PUROK</span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{employee.assigned_purok || "Not assigned"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">JOINED DATE</span>
          <span className="text-sm text-gray-700">
            {employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : "N/A"}
          </span>
        </div>
      </div>

      <button
        onClick={() => onView(employee)}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
        <span>View Account</span>
      </button>
    </div>
  </motion.div>
);

// --- STATS WIDGET ---
const StatsWidget = ({ employees }) => {
  const stats = useMemo(() => {
    const total = employees.length;
    const bhwCount = employees.filter(e => e.role === 'BHW').length;
    const bnsCount = employees.filter(e => e.role === 'BNS').length;
    const midwifeCount = employees.filter(e => e.role === 'Midwife').length;
    const adminCount = employees.filter(e => e.role === 'Admin').length;
    
    return { total, bhwCount, bnsCount, midwifeCount, adminCount };
  }, [employees]);

  const StatCard = ({ title, value, color, icon }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg overflow-hidden relative`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="text-xs opacity-80">
            {title === 'Total Employees' ? 'All registered accounts' : 
             title === 'BHW' ? 'Barangay Health Workers' :
             title === 'BNS' ? 'Barangay Nutrition Scholars' :
             title === 'Midwives' ? 'Healthcare professionals' : 'System administrators'}
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-4"></div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Total Employees" 
        value={stats.total} 
        color="from-blue-500 to-blue-600"
        icon={<UserIcon className="w-6 h-6" />}
      />
      
      <StatCard 
        title="BHW" 
        value={stats.bhwCount} 
        color="from-sky-500 to-sky-600"
        icon={<span className="text-lg font-bold">BHW</span>}
      />
      
      <StatCard 
        title="BNS" 
        value={stats.bnsCount} 
        color="from-green-500 to-green-600"
        icon={<span className="text-lg font-bold">BNS</span>}
      />
      
      <StatCard 
        title="Midwives" 
        value={stats.midwifeCount} 
        color="from-pink-500 to-pink-600"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        }
      />
    </div>
  );
};

// --- MODAL COMPONENTS ---

const AddEmployeeModal = ({ onClose, onSave }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [assignedPurok, setAssignedPurok] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [role, setRole] = useState("BHW");
  const [userIdNo, setUserIdNo] = useState("Generating...");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addNotification } = useNotification();

  const generateNextUserId = useCallback(async () => {
    setUserIdNo("Generating...");
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id_no")
        .not("user_id_no", "is", null)
        .like("user_id_no", `${year}${month}%`);
      
      if (error) throw error;
      
      const existingSequences = data
        .map(profile => {
          const id = profile.user_id_no;
          if (id && id.startsWith(`${year}${month}`)) {
            return parseInt(id.slice(6)) || 0;
          }
          return 0;
        })
        .filter(seq => seq > 0);
      
      const maxSequence = existingSequences.length > 0 
        ? Math.max(...existingSequences) 
        : 0;
      
      const sequenceNumber = (maxSequence + 1).toString().padStart(3, '0');
      const newUserId = `${year}${month}${sequenceNumber}`;
      setUserIdNo(newUserId);
    } catch (error) {
      console.error("Error generating User ID:", error);
      setUserIdNo("Error");
      addNotification("Error generating User ID.", "error");
    }
  }, [addNotification]);

  useEffect(() => {
    generateNextUserId();
  }, [generateNextUserId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      addNotification("Passwords do not match.", "error");
      return;
    }

    if (userIdNo === "Generating..." || userIdNo === "Error") {
      addNotification("User ID is still generating. Please wait.", "error");
      return;
    }

    setLoading(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            user_id_no: userIdNo,
            assigned_purok: assignedPurok,
            contact_no: contactNo,
            birth_date: birthDate,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            role: role,
            user_id_no: userIdNo,
            assigned_purok: assignedPurok,
            contact_no: contactNo,
            birth_date: birthDate,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);

        if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

        addNotification("Employee successfully registered!", "success");
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Registration error:", error);
      addNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-xl font-bold">Add New Employee</h2>
          <p className="text-sm opacity-90 mt-1">Register a new team member</p>
        </div>
        
        <form
          id="add-employee-form"
          onSubmit={handleRegister}
          className="p-6 space-y-4 text-sm overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">User ID No.</label>
              <input
                type="text"
                value={userIdNo}
                readOnly
                className="w-full p-3 border rounded-lg bg-gray-50 font-mono text-center font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="BHW">Barangay Health Worker</option>
                <option value="BNS">Barangay Nutrition Scholar</option>
                <option value="Midwife">Midwife</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Contact No.</label>
              <input
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="0912 345 6789"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              placeholder="employee@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <EyeIcon />
                </button>
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <EyeIcon />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Purok Assigned</label>
            <select
              value={assignedPurok}
              onChange={(e) => setAssignedPurok(e.target.value)}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select Purok</option>
              <option value="Purok Bagong Silang Zone 1">Purok Bagong Silang Zone 1</option>
              <option value="Purok Bagong Silang Zone 2">Purok Bagong Silang Zone 2</option>
              <option value="Purok Masigla Zone 1">Purok Masigla Zone 1</option>
              <option value="Purok Masigla Zone 2">Purok Masigla Zone 2</option>
              <option value="Purok Masaya">Purok Masaya</option>
              <option value="Purok Bagong Lipunan">Purok Bagong Lipunan</option>
              <option value="Purok Dagomboy">Purok Dagomboy</option>
              <option value="Purok Katarungan Zone 1">Purok Katarungan Zone 1</option>
              <option value="Purok Katarungan Zone 2">Purok Katarungan Zone 2</option>
              <option value="Purok Pagkakaisa">Purok Pagkakaisa</option>
              <option value="Purok Kilos-Agad">Purok Kilos-Agad</option>
              <option value="Purok Balikatan">Purok Balikatan</option>
              <option value="Purok Bayanihan">Purok Bayanihan</option>
              <option value="Purok Magkakapitbahay">Purok Magkakapitbahay</option>
              <option value="Purok Magara Zone 2">Purok Magara Zone 2</option>
            </select>
          </div>
        </form>
        
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-employee-form"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UpdatePasswordModal = ({ employee, onClose, addNotification }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addNotification("New passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      addNotification("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc("update_user_password", {
      user_id: employee.id,
      new_password: newPassword,
    });
    if (error) {
      addNotification(`Error updating password: ${error.message}`, "error");
    } else {
      addNotification("Password updated successfully!", "success");
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[51] p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Update Password</h2>
          <p className="text-sm text-gray-500 mt-1">
            For {employee.first_name} {employee.last_name}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
                required
                minLength="6"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
                required
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </span>
              ) : "Update"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DeleteEmployeeModal = ({ employee, onClose, onSave, addNotification }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const { user: adminUser } = useAuth();

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: password,
    });

    if (signInError) {
      setError("Incorrect password. Please try again.");
    } else {
      setIsVerified(true);
      await supabase.auth.refreshSession();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    
    try {
      const { error: adminError } = await supabase.auth.admin.deleteUser(
        employee.id
      );
      
      if (adminError) throw adminError;
      
      addNotification("Employee has been deleted successfully.", "success");
      onSave();
      onClose();
    } catch (error) {
      addNotification(`Error deleting user: ${error.message}`, "error");
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[51] p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {!isVerified ? (
          <form onSubmit={handleVerifyPassword} className="p-6">
            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center">Admin Password Required</h2>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Please enter your password to confirm account deletion.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-700 block mb-2">Your Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                required
                placeholder="Enter your admin password"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </span>
                ) : "Continue"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete the account for{" "}
              <span className="font-semibold text-red-600">
                {employee.first_name} {employee.last_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </span>
                ) : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AllActivitiesModal = ({ employee, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAllActivities = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", employee.id)
        .order("created_at", { ascending: false });
      if (!error) setActivities(data || []);
      setLoading(false);
    };
    fetchAllActivities();
  }, [employee.id]);

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[51] p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-xl font-bold">Activity Log</h2>
          <p className="text-sm opacity-90 mt-1">
            All activities for {employee.first_name} {employee.last_name}
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((act) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{act.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{act.details}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(act.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      act.action.includes('Login') ? 'bg-green-100 text-green-800' :
                      act.action.includes('Create') ? 'bg-blue-100 text-blue-800' :
                      act.action.includes('Update') ? 'bg-yellow-100 text-yellow-800' :
                      act.action.includes('Delete') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {act.action.split(' ')[0]}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p className="text-gray-500">No activities found for this user.</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ViewAccountModal = ({ employee, onClose, onSave }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const { user: adminUser } = useAuth();
  const { addNotification } = useNotification();

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: password,
    });

    if (signInError) {
      setError("Incorrect password. Please try again.");
    } else {
      setIsAuthenticated(true);
      await supabase.auth.refreshSession();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchActivities = async () => {
        const { data } = await supabase
          .from("activity_log")
          .select("*")
          .eq("user_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setActivities(data || []);
      };
      fetchActivities();
    }
  }, [isAuthenticated, employee.id]);

  const InfoField = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-medium text-gray-800">{value || "Not provided"}</p>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isUpdateModalOpen && (
          <UpdatePasswordModal
            employee={employee}
            onClose={() => setIsUpdateModalOpen(false)}
            addNotification={addNotification}
          />
        )}
        {isDeleteModalOpen && (
          <DeleteEmployeeModal
            employee={employee}
            onClose={() => setIsDeleteModalOpen(false)}
            onSave={onSave}
            addNotification={addNotification}
          />
        )}
        {isActivityModalOpen && (
          <AllActivitiesModal
            employee={employee}
            onClose={() => setIsActivityModalOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {!isAuthenticated ? (
            <form onSubmit={handleVerifyPassword} className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Admin Authentication</h2>
                <p className="text-gray-600 mt-2">
                  Please enter your <span className="font-semibold">admin password</span> to view this account
                </p>
              </div>
              
              <div className="mb-6">
                <label className="font-semibold text-gray-700 block mb-2">Admin Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter your admin password"
                  required
                />
              </div>
              
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </span>
                  ) : "Continue"}
                </button>
              </div>
            </form>
          ) : (
            <div className="max-h-[80vh] flex flex-col">
              <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      employee.avatar_url ||
                      `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=white&color=0ea5e9&size=128&bold=true`
                    }
                    alt="avatar"
                    className="w-16 h-16 rounded-full border-4 border-white/30"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
                    <p className="opacity-90">
                      <RoleBadge role={employee.role} /> • {employee.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-700 mb-4 text-lg">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoField label="User ID" value={employee.user_id_no} />
                      <InfoField label="Role" value={employee.role} />
                      <InfoField 
                        label="Joining Date" 
                        value={employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : "N/A"}
                      />
                      <InfoField label="Assigned Purok" value={employee.assigned_purok} />
                      <InfoField label="Contact Number" value={employee.contact_no} />
                      <InfoField label="Date of Birth" value={employee.birth_date} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-4 text-lg">Account Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-semibold py-3 px-4 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        <span>Update Password</span>
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 font-semibold py-3 px-4 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-700 text-lg">Recent Activity</h3>
                      <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <span>View All</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {activities.length > 0 ? (
                        activities.map((act) => (
                          <div key={act.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-semibold text-gray-800">{act.action}</p>
                            <p className="text-sm text-gray-600 mt-1">{act.details}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(act.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No recent activity found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EmployeesPage() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;
  const { addNotification } = useNotification();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    
    try {
      // Query all profiles (including Midwife, BHW, BNS, Admin)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("role", "USER/MOTHER/GUARDIAN")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched employees:", data);
      setAllEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      addNotification("Error loading employees: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees based on search term and role filter
  const filteredEmployees = useMemo(() => {
    let filtered = allEmployees;
    
    // Apply role filter
    if (roleFilter !== "All") {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.first_name && emp.first_name.toLowerCase().includes(term)) ||
          (emp.last_name && emp.last_name.toLowerCase().includes(term)) ||
          (emp.email && emp.email.toLowerCase().includes(term)) ||
          (emp.user_id_no && emp.user_id_no.toLowerCase().includes(term)) ||
          (emp.assigned_purok && emp.assigned_purok.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [allEmployees, searchTerm, roleFilter]);

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    return filteredEmployees.slice(from, to);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const totalRecords = filteredEmployees.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  return (
    <>
      <AnimatePresence>
        {isAddModalOpen && (
          <AddEmployeeModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={fetchEmployees}
          />
        )}
        {selectedEmployee && (
          <ViewAccountModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onSave={() => {
              setSelectedEmployee(null);
              fetchEmployees();
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Employee Management</h1>
              <p className="text-gray-600 mt-2">Manage all employee accounts and permissions</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Add New Member</span>
            </motion.button>
          </div>

          <StatsWidget employees={allEmployees} />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search by name, email, ID, or purok..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 transition-all duration-300"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-300 w-full md:w-auto"
              >
                <FilterIcon />
                <span>Filter by Role</span>
                {roleFilter !== "All" && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {roleFilter}
                  </span>
                )}
                <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-20 border border-gray-200"
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Filter by Role
                      </div>
                      {["All", "BHW", "BNS", "Midwife", "Admin"].map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setRoleFilter(role);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-200 my-1 ${
                            roleFilter === role
                              ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{role}</span>
                            {role !== "All" && <RoleBadge role={role} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-800">{paginatedEmployees.length}</span> of{" "}
            <span className="font-semibold text-gray-800">{filteredEmployees.length}</span> employees
            {roleFilter !== "All" && (
              <span className="ml-2">
                (<RoleBadge role={roleFilter} />)
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Loading employees...</p>
          </div>
        ) : (
          <>
            {/* Employee Grid */}
            {paginatedEmployees.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                  {paginatedEmployees.map((emp) => (
                    <EmployeeCard
                      key={emp.id}
                      employee={emp}
                      onView={setSelectedEmployee}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {searchTerm || roleFilter !== "All" ? "No employees found" : "No employees yet"}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || roleFilter !== "All"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first team member to the system"}
                </p>
                {(searchTerm || roleFilter !== "All") ? (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("All");
                    }}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Add First Employee
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
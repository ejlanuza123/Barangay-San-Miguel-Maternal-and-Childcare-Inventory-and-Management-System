import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS ---
const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>
  </svg>
);
const ProfilePlaceholderIcon = () => (
  <svg
    className="w-12 h-12 text-gray-400"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);

// --- HELPER & WIDGET COMPONENTS ---

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-md border hover:bg-gray-50 disabled:opacity-50"
      >
        &larr; Previous
      </button>
      <div className="flex items-center space-x-2 text-sm">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded-md ${
              currentPage === number
                ? "bg-blue-600 text-white font-bold"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {number}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-md border hover:bg-gray-50 disabled:opacity-50"
      >
        Next &rarr;
      </button>
    </nav>
  );
};

const EmployeeCard = ({ employee, onView }) => (
  <div className="bg-white p-4 rounded-lg shadow border flex flex-col items-center text-center">
    <img
      src={
        employee.avatar_url ||
        `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`
      }
      alt="avatar"
      className="w-20 h-20 rounded-full mb-3 border-2"
    />
    <h3 className="font-bold text-gray-800">
      {employee.first_name} {employee.last_name}
    </h3>
    <p className="text-sm text-gray-500 mb-3">{employee.role}</p>

    <div className="text-xs text-left space-y-1 w-full bg-gray-50 p-2 rounded">
      <p>
        <span className="font-semibold">User Code:</span>{" "}
        {employee.user_id_no || "N/A"}
      </p>
      <p>
        <span className="font-semibold">Pass Code:</span> ********
      </p>
      {/* --- MODIFIED: Safely checks for a valid date before displaying --- */}
      <p>
        <span className="font-semibold">Joining Date:</span>{" "}
        {employee.created_at
          ? new Date(employee.created_at).toLocaleDateString()
          : "N/A"}
      </p>
    </div>

    <button
      onClick={() => onView(employee)}
      className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
    >
      View Account
    </button>
  </div>
);

// --- MODAL COMPONENTS ---

const AddEmployeeModal = ({ onClose, onSave }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [assignedPurok, setAssignedPurok] = useState("");
  // --- NEW STATE for new fields ---
  const [contactNo, setContactNo] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [role, setRole] = useState("BHW");
  const [userIdNo, setUserIdNo] = useState("Generating...");
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const generateNextUserId = useCallback(async () => {
    setUserIdNo("Generating...");
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const pattern = `${year}${month}%`;
    const { count, error } = await supabase
      .from("profiles")
      .select("user_id_no", { count: "exact", head: true })
      .like("user_id_no", pattern);
    if (error) {
      setUserIdNo("Error");
      addNotification("Error generating User ID.", "error");
      return;
    }
    const sequenceNumber = (count + 1).toString().padStart(3, "0");
    setUserIdNo(`${year}${month}${sequenceNumber}`);
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
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (signUpError) {
      addNotification(signUpError.message, "error");
      setLoading(false);
      return;
    }
    if (data.user) {
      // --- MODIFIED: Added new fields to the profile update ---
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          user_id_no: userIdNo,
          assigned_purok: assignedPurok,
          contact_no: contactNo,
          birth_date: birthDate,
        })
        .eq("id", data.user.id);

      if (profileError) {
        addNotification(
          `User created, but failed to save profile details: ${profileError.message}`,
          "warning"
        );
      } else {
        addNotification("Employee successfully registered.", "success");
        onSave();
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Add New Member</h2>
        </div>
        <form
          id="add-employee-form"
          onSubmit={handleRegister}
          className="p-6 space-y-4 text-sm overflow-y-auto"
        >
          <div>
            <label className="font-semibold text-gray-600 block">
              User ID No.
            </label>
            <input
              type="text"
              value={userIdNo}
              readOnly
              className="w-full mt-1 p-2 border rounded bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-600 block">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              required
            />
          </div>

          {/* --- NEW: Contact No & Birth Date Fields --- */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-gray-600 block">
                Contact No.
              </label>
              <input
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-gray-600 block">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-600 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-gray-600 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              required
              minLength="6"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-600 block">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-gray-600 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 p-2 border rounded bg-gray-50"
            >
              <option value="BHW">Barangay Health Worker</option>
              <option value="BNS">Barangay Nutrition Scholar</option>
            </select>
          </div>

          {/* --- THIS IS THE MODIFIED PUROK DROPDOWN --- */}
          <div>
            <label className="font-semibold text-gray-600 block">
              Purok Assigned
            </label>
            <select
              value={assignedPurok}
              onChange={(e) => setAssignedPurok(e.target.value)}
              // --- STYLE CHANGE: Removed bg-gray-50 to match other fields ---
              className="w-full mt-1 p-2 border rounded"
              required
            >
              <option value="">Select Purok</option>
              <option value="Purok Bagong Silang Zone 1">
                Purok Bagong Silang Zone 1
              </option>
              <option value="Purok Bagong Silang Zone 2">
                Purok Bagong Silang Zone 2
              </option>
              <option value="Purok Masigla Zone 1">Purok Masigla Zone 1</option>
              <option value="Purok Masigla Zone 2">Purok Masigla Zone 2</option>
              <option value="Purok Masaya">Purok Masaya</option>
              <option value="Purok Bagong Lipunan">Purok Bagong Lipunan</option>
              <option value="Purok Dagomboy">Purok Dagomboy</option>
              <option value="Purok Katarungan Zone 1">
                Purok Katarungan Zone 1
              </option>
              <option value="Purok Katarungan Zone 2">
                Purok Katarungan Zone 2
              </option>
              <option value="Purok Pagkakaisa">Purok Pagkakaisa</option>
              <option value="Purok Kilos-Agad">Purok Kilos-Agad</option>
              <option value="Purok Balikatan">Purok Balikatan</option>
              <option value="Purok Bayanihan">Purok Bayanihan</option>
              <option value="Purok Magkakapitbahay">
                Purok Magkakapitbahay
              </option>
              <option value="Purok Magara Zone 2">Purok Magara Zone 2</option>
            </select>
          </div>
          {/* --- END OF MODIFIED PUROK DROPDOWN --- */}
        </form>
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-employee-form"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Add Member"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const EyeIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
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

const UpdatePasswordModal = ({ employee, onClose, addNotification }) => {
  const [newPassword, setNewPassword] = useState("");
  // --- NEW STATE for password confirmation and visibility ---
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- NEW: Password confirmation check ---
    if (newPassword !== confirmPassword) {
      addNotification("New passwords do not match.", "error");
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
      addNotification("Password updated successfully.", "success");
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[51] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-bold">Update Password</h2>
        <p className="text-sm text-gray-500 mb-4">
          for {employee.first_name} {employee.last_name}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- MODIFIED: New Password field with eye icon --- */}
          <div className="relative">
            <label className="text-sm font-semibold">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 pr-10"
              required
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
            >
              <EyeIcon />
            </button>
          </div>

          {/* --- NEW: Confirm Password field with eye icon --- */}
          <div className="relative">
            <label className="text-sm font-semibold">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
            >
              <EyeIcon />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DeleteEmployeeModal = ({
  employee,
  onClose,
  onSave,
  addNotification,
}) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false); // Controls the password check step
  const { user: adminUser } = useAuth();

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: password,
    });

    if (error) {
      setError("Incorrect password. Please try again.");
    } else {
      setIsVerified(true); // Password is correct, proceed to confirmation
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("delete_employee_by_id", {
      user_id: employee.id,
    });
    if (error) {
      addNotification(`Error deleting user: ${error.message}`, "error");
    } else {
      addNotification("Employee has been deleted.", "success");
      onSave(); // Refresh the employee list
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[51] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm"
      >
        {!isVerified ? (
          <form onSubmit={handleVerifyPassword} className="p-6">
            <h2 className="text-lg font-bold text-gray-800">
              Admin Password Required
            </h2>
            <p className="text-sm text-gray-600 my-4">
              Please enter your password to confirm account deletion.
            </p>
            <div>
              <label className="text-xs font-semibold">Your Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400"
              >
                {loading ? "Verifying..." : "Confirm"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center">
            <h2 className="text-lg font-bold">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 my-4">
              Are you sure you want to permanently delete the account for{" "}
              <span className="font-semibold">
                {employee.first_name} {employee.last_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[51] p-4">
      {" "}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col"
      >
        {" "}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">
            All Activity for {employee.first_name}
          </h2>
        </div>{" "}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {" "}
          {loading ? (
            <p>Loading activities...</p>
          ) : (
            <div className="space-y-4">
              {" "}
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="text-sm pb-2 border-b last:border-none"
                  >
                    {" "}
                    <p className="font-semibold text-gray-800">
                      {act.action}
                    </p>{" "}
                    <p className="text-gray-600">{act.details}</p>{" "}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(act.created_at).toLocaleString()}
                    </p>{" "}
                  </div>
                ))
              ) : (
                <p>No activities found.</p>
              )}{" "}
            </div>
          )}{" "}
        </div>{" "}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          {" "}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Close
          </button>{" "}
        </div>{" "}
      </motion.div>{" "}
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
    const { error } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: password,
    });
    if (error) {
      setError("Incorrect password. Please try again.");
    } else {
      setIsAuthenticated(true);
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

  // Helper component for displaying fields
  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value || "N/A"}</p>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
        >
          {!isAuthenticated ? (
            <form onSubmit={handleVerifyPassword} className="p-6">
              {" "}
              <h2 className="text-xl font-bold text-gray-800">
                Admin Authentication Required
              </h2>{" "}
              <p className="text-sm text-gray-600 mt-2 mb-4">
                Please enter your password to view or manage this account.
              </p>{" "}
              <div>
                {" "}
                <label className="font-semibold text-gray-600 block text-sm">
                  Your Password
                </label>{" "}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                  required
                />{" "}
              </div>{" "}
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}{" "}
              <div className="flex justify-end gap-3 pt-4 mt-2">
                {" "}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>{" "}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
                >
                  {loading ? "Verifying..." : "Continue"}
                </button>{" "}
              </div>{" "}
            </form>
          ) : (
            <div>
              <div className="p-6 border-b flex items-center space-x-4">
                <img
                  src={
                    employee.avatar_url ||
                    `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`
                  }
                  alt="avatar"
                  className="w-16 h-16 rounded-full border-2"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {employee.first_name} {employee.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{employee.role}</p>
                </div>
              </div>
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* --- NEW: Full Information Section --- */}
                  <div>
                    <h3 className="font-bold text-gray-700 mb-3">
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <InfoField label="User ID" value={employee.user_id_no} />
                      <InfoField label="Role" value={employee.role} />
                      {/* --- MODIFIED: Safely checks for a valid date --- */}
                      <InfoField
                        label="Joining Date"
                        value={
                          employee.created_at
                            ? new Date(employee.created_at).toLocaleDateString()
                            : "N/A"
                        }
                      />
                      <InfoField
                        label="Assigned Purok"
                        value={employee.assigned_purok}
                      />

                      {/* --- NEW: Added Contact No. and Birth Date fields --- */}
                      <InfoField
                        label="Contact No."
                        value={employee.contact_no}
                      />
                      <InfoField
                        label="Date of Birth"
                        value={employee.birth_date}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-3">
                      Manage Account
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="flex-1 text-sm bg-blue-50 text-blue-700 font-semibold py-2 rounded-md hover:bg-blue-100"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex-1 text-sm bg-red-50 text-red-700 font-semibold py-2 rounded-md hover:bg-red-100"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-700">
                        Recent Activity
                      </h3>
                      <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {activities.length > 0 ? (
                        activities.map((act) => (
                          <div key={act.id} className="text-sm">
                            {" "}
                            <p className="font-semibold text-gray-800">
                              {act.action}
                            </p>{" "}
                            <p className="text-gray-600">{act.details}</p>{" "}
                            <p className="text-xs text-gray-400">
                              {new Date(act.created_at).toLocaleString()}
                            </p>{" "}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No recent activity found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded-md"
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
  const [allEmployees, setAllEmployees] = useState([]); // Store all fetched employees
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);

    // --- FINAL FIX: Use an RPC call to run our new SQL function ---
    const { data, error } = await supabase.rpc("get_all_employees");

    console.log("FETCHED EMPLOYEES VIA RPC:", { data, error });

    if (!error) {
      setAllEmployees(data || []);
    } else {
      console.error("Error fetching employees via RPC:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- NEW: Client-side filtering and pagination ---
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) {
      return allEmployees;
    }
    return allEmployees.filter(
      (p) =>
        (p.first_name &&
          p.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.last_name &&
          p.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allEmployees, searchTerm]);

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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Employees ({totalRecords})
            </h1>
            <p className="text-gray-500">
              All the employees of the company are listed here
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700"
          >
            + Add New Member
          </button>
        </div>

        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search employees by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">
            Loading Employees...
          </div>
        ) : paginatedEmployees.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {paginatedEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  onView={setSelectedEmployee}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center p-8 text-gray-500">
            No employees found.
          </div>
        )}
      </div>
    </>
  );
}

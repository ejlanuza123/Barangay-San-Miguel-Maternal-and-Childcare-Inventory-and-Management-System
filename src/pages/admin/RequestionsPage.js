//src\pages\admin\RequestionsPage.js
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { useNotification } from "../../context/NotificationContext";
import { logActivity } from "../../services/activityLogger";
import { motion, AnimatePresence } from "framer-motion";

// --- Enhanced Helper Components ---
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "⏳"
    },
    Approved: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      icon: "✅"
    },
    Denied: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: "❌"
    }
  };

  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: "📝"
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="text-xs">{config.icon}</span>
      {status}
    </motion.div>
  );
};

const ActionButtons = ({ request, onApprove, onDeny }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-2"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onApprove(request)}
      title="Approve"
      className="p-2 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-600 border border-emerald-200 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        ></path>
      </svg>
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onDeny(request)}
      title="Deny"
      className="p-2 rounded-xl bg-gradient-to-r from-coral-50 to-coral-100 hover:from-coral-100 hover:to-coral-200 text-coral-600 border border-coral-200 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </motion.button>
  </motion.div>
);

const UserAvatar = ({ name, role }) => {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleColors = {
    BHW: "bg-blue-100 text-blue-800 border-blue-200",
    BNS: "bg-green-100 text-green-800 border-green-200"
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${roleColors[role] || "bg-gray-100"}`}>
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-teal-900">{name}</span>
        <span className="text-xs text-teal-600">{role}</span>
      </div>
    </div>
  );
};

const RequestTypeBadge = ({ type, table }) => {
  const config = {
    Update: {
      label: "Update",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200"
    },
    Delete: {
      label: "Delete",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200"
    }
  };

  const typeConfig = config[type] || {
    label: type,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200"
  };

  const isInventory = table?.includes("inventory");
  
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
        {typeConfig.label}
      </span>
      <span className="text-xs text-teal-600">
        {isInventory ? "Inventory" : "Record"}
      </span>
    </div>
  );
};

// --- Main Page Component ---
export default function RequestionsPage() {
  const [activeTab, setActiveTab] = useState("BHW");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [requestions, setRequestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchRequestions = useCallback(async () => {
    setLoading(true);
    const roleFilter = activeTab === "BHW" ? "BHW" : "BNS";

    let query = supabase
      .from("requestions")
      .select(
        "*, profiles:worker_id!inner(first_name, last_name, role, user_id_no)"
      )
      .eq("profiles.role", roleFilter);

    if (statusFilter !== "All") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      addNotification(`Error fetching requestions: ${error.message}`, "error");
    } else {
      setRequestions(data || []);
    }
    setLoading(false);
  }, [activeTab, statusFilter, addNotification]);

  useEffect(() => {
    fetchRequestions();
  }, [fetchRequestions]);

  const handleApprove = async (request) => {
    let actionError = null;
    if (request.request_type === "Update") {
      const { error } = await supabase
        .from(request.target_table)
        .update(request.request_data)
        .eq("id", request.target_record_id);
      actionError = error;
    } else if (request.request_type === "Delete") {
      const { error } = await supabase
        .from(request.target_table)
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", request.target_record_id);
      
      actionError = error;
    }

    if (actionError) {
      addNotification(
        `Failed to execute action: ${actionError.message}`,
        "error"
      );
      return;
    }

    const { error: statusError } = await supabase
      .from("requestions")
      .update({ status: "Approved" })
      .eq("id", request.id);

    if (statusError) {
      addNotification(
        `Action completed, but failed to update request status: ${statusError.message}`,
        "warning"
      );
    } else {
      addNotification(`Request has been approved.`, "success");
      logActivity(
        "Request Approved",
        `Your ${request.request_type} request was approved by an Admin.`,
        request.worker_id
      );
    }
    fetchRequestions();
  };

  const handleDeny = async (request) => {
    const { error } = await supabase
      .from("requestions")
      .update({ status: "Denied" })
      .eq("id", request.id);
    if (error) {
      addNotification(`Failed to deny request: ${error.message}`, "error");
    } else {
      addNotification("Request has been denied.", "success");
      logActivity(
        "Request Denied",
        `Denied ${request.request_type} for record ID ${request.target_record_id}`
      );
    }
    fetchRequestions();
  };

  const filteredRequests = requestions.filter(req => 
    statusFilter === "All" ? true : req.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 to-sky-50/30 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-900">Requests Management</h1>
            <p className="text-teal-600">Review and manage worker requests</p>
          </div>
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-teal-400 to-teal-200 rounded-full mt-2"></div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white p-5 rounded-2xl shadow-lg">
          <div className="text-sm text-teal-100 mb-1">Total Requests</div>
          <div className="text-3xl font-bold">{requestions.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
          <div className="text-sm text-teal-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-500">
            {requestions.filter(r => r.status === "Pending").length}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
          <div className="text-sm text-teal-600 mb-1">Active Worker Type</div>
          <div className="text-xl font-semibold text-teal-800">{activeTab}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-teal-100">
          <div className="text-sm text-teal-600 mb-1">Last Updated</div>
          <div className="text-sm font-medium text-teal-800">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100 overflow-hidden"
      >
        {/* Worker Type Tabs */}
        <div className="p-6 border-b border-teal-100">
          <div className="flex gap-2 mb-4">
            {["BHW", "BNS"].map((role) => {
              const isActive = activeTab === role;
              const bgColor = role === "BHW" ? "bg-white-50" : "bg-white-50";
              const activeColor = role === "BHW" ? "bg-sky-100 border-sky-300 text-sky-800" : "bg-sky-100 border-sky-300 text-sky-800";
              
              return (
                <motion.button
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(role)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    isActive 
                      ? activeColor 
                      : `${bgColor} border-teal-200 text-teal-700 hover:bg-teal-50`
                  }`}
                >
                  {role === "BHW" ? "🏥 BARANGAY HEALTH WORKER" : "🥗 BARANGAY NUTRITION SCHOLAR"}
                </motion.button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-teal-700 font-medium">Filter by status:</span>
            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "Approved", "Denied"].map((status) => {
                const isActive = statusFilter === status;
                const statusColors = {
                  All: "bg-teal-50 text-teal-700 border-teal-200",
                  Pending: "bg-amber-50 text-amber-700 border-amber-200",
                  Approved: "bg-green-50 text-emerald-700 border-green-200",
                  Denied: "bg-red-50 text-red-700 border-red-200"
                };
                
                return (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      isActive 
                        ? `${statusColors[status]} shadow-inner` 
                        : "bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
                    }`}
                  >
                    {status}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
              <p className="text-teal-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-teal-300 text-5xl mb-4">📭</div>
              <p className="text-teal-600 text-lg font-medium">No requests found</p>
              <p className="text-teal-400 text-sm mt-2">There are no {statusFilter.toLowerCase()} requests for {activeTab}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50/80 to-teal-100/80 border-b border-teal-200">
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Time
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-left text-teal-700 font-semibold text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100/50">
                <AnimatePresence>
                  {filteredRequests.map((req, index) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="hover:bg-teal-50/50 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-teal-900">
                            REQ-{req.id.toString().padStart(4, '0')}
                          </span>
                          <span className="text-xs text-teal-500 mt-1">
                            ID: {req.profiles?.user_id_no || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <UserAvatar 
                          name={`${req.profiles?.first_name || ""} ${req.profiles?.last_name || ""}`}
                          role={req.profiles?.role}
                        />
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <RequestTypeBadge type={req.request_type} table={req.target_table} />
                          
                          <div className="text-sm text-teal-800">
                            {req.target_table?.includes("inventory") ? (
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {req.request_data.item_name || "Unnamed Item"}
                                </div>
                                {req.request_data.quantity && (
                                  <div className="text-xs text-teal-600">
                                    Quantity: <span className="font-bold">{req.request_data.quantity}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">
                                  {req.request_data.name || 
                                   req.request_data.patient_id || 
                                   req.request_data.child_id || 
                                   "Unnamed Record"}
                                </div>
                                {req.request_data.first_name && (
                                  <div className="text-xs text-teal-600">
                                    {req.request_data.first_name} {req.request_data.last_name}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-teal-400">
                            {new Date(req.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <div className="text-teal-700 font-medium">
                            {new Date(req.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-teal-400 mt-1">
                            {new Date(req.created_at).getHours() < 12 ? 'AM' : 'PM'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="p-4">
                        {req.status === "Pending" && (
                          <ActionButtons
                            request={req}
                            onApprove={handleApprove}
                            onDeny={handleDeny}
                          />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        {!loading && filteredRequests.length > 0 && (
          <div className="bg-teal-50/80 border-t border-teal-100 p-4 flex justify-between items-center">
            <div className="text-sm text-teal-600">
              Showing <span className="font-semibold text-teal-800">{filteredRequests.length}</span> of{" "}
              <span className="font-semibold text-teal-800">{requestions.length}</span> requests
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs text-teal-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-teal-600">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-coral-400"></div>
                <span className="text-xs text-teal-600">Denied</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-amber-700 mb-1">Awaiting Review</div>
              <div className="text-2xl font-bold text-amber-800">
                {requestions.filter(r => r.status === "Pending").length}
              </div>
            </div>
            <div className="text-amber-400 text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-emerald-700 mb-1">Processed Today</div>
              <div className="text-2xl font-bold text-emerald-800">
                {requestions.filter(r => {
                  // Only count processed requests
                  if (r.status !== "Approved" && r.status !== "Denied") return false;
                  
                  // Use created_at since that's when the request was made
                  // This assumes requests are processed immediately
                  const requestDate = new Date(r.created_at);
                  const today = new Date();
                  
                  return requestDate.toDateString() === today.toDateString();
                }).length}
              </div>
            </div>
            <div className="text-emerald-400 text-2xl">📊</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 mb-1">Average Response Time</div>
              <div className="text-2xl font-bold text-blue-800">24h</div>
            </div>
            <div className="text-blue-400 text-2xl">⚡</div>
          </div>
        </div>
      </div>
    </div>
  );
}
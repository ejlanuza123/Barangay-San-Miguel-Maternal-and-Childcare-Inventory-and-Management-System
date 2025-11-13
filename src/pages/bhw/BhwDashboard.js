import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

// --- WIDGETS & SUB-COMPONENTS ---
const getDotColor = (role) => {
  switch (role) {
    case "BNS":
      return "bg-green-500"; // Green for BNS
    case "Admin":
      return "bg-orange-500"; // Orange for Admin
    case "BHW":
    default:
      return "bg-blue-500"; // Blue for BHW and others
  }
};
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const changeMonth = (amount) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const generateDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dates.push(<div key={`pad-start-${i}`} className="p-2"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.toDateString() === new Date().toDateString();
      dates.push(
        <div
          key={i}
          className={`p-2 rounded-full text-center text-sm cursor-pointer ${
            isToday ? "bg-blue-500 text-white font-bold" : "hover:bg-gray-100"
          }`}
        >
          {i}
        </div>
      );
    }
    return dates;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          &lt;
        </button>
        <h3 className="font-bold text-gray-700 text-base">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">{generateDates()}</div>
    </div>
  );
};

const QuickAccess = () => (
  <div className="bg-white p-4 rounded-lg shadow border flex flex-col space-y-3 h-full justify-center">
    <h3 className="font-bold text-gray-700 text-base text-center mb-2">
      Quick Access
    </h3>
    <Link
      to="/bhw/maternity-management"
      className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-blue-700 text-sm"
    >
      + Add New Patient
    </Link>
    <Link
      to="/bhw/reports"
      className="w-full text-center bg-orange-400 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-orange-500 text-sm"
    >
      Generate Reports
    </Link>
  </div>
);

const RecentActivity = ({ activities, onViewAll }) => (
  <div className="bg-white p-4 rounded-lg shadow border h-full">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-bold text-gray-700 text-base">Recent Activity</h3>
      <button
        onClick={onViewAll}
        className="text-xs font-semibold text-blue-600 hover:underline"
      >
        View All &gt;
      </button>
    </div>
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-start space-x-2">
            {/* MODIFIED: Now uses the shared getDotColor function */}
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotColor(
                item.profiles?.role
              )}`}
            ></div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">
                <span className="font-bold">
                  {item.profiles?.role || "System"}{" "}
                  {item.profiles?.last_name || ""}
                </span>{" "}
                {item.action}
              </p>
              <p className="text-xs text-gray-500">{item.details}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No recent activity.</p>
      )}
    </div>
  </div>
);

const UpcomingAppointments = ({ appointments }) => {
  const getStatusClass = (status) => {
    const styles = {
      Scheduled: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-500",
      Missed: "bg-orange-100 text-orange-500",
    };
    return styles[status] || styles.Cancelled;
  };
  const formatSchedulerName = (profile) => {
    if (!profile?.first_name || !profile?.last_name) {
      return "N/A";
    }
    const firstInitial = profile.first_name.charAt(0).toUpperCase();
    return `${firstInitial}. ${profile.last_name}`;
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-700 text-base">
          Upcoming Appointments
        </h3>
        <Link
          to="/bhw/appointment"
          className="bg-green-500 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-green-600 text-sm"
        >
          Scheduled Check-up
        </Link>
      </div>

      {/* --- UPDATED: Added a container with fixed height and scrolling --- */}
      <div className="overflow-y-auto h-48">
        {" "}
        {/* You can adjust the h-48 (192px) to your preferred height */}
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-gray-500">
              <th className="px-2 py-2 font-semibold">Patient Name</th>
              <th className="px-2 py-2 font-semibold">Date</th>
              <th className="px-2 py-2 font-semibold">Time</th>
              <th className="px-2 py-2 font-semibold">Reason</th>
              <th className="px-2 py-2 font-semibold">BHW</th>
              <th className="px-2 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* --- UPDATED: Removed .slice(0, 3) to show all appointments --- */}
            {appointments.length > 0 ? (
              appointments.map((app) => (
                <tr key={app.id} className="text-gray-600">
                  <td className="px-2 py-2 font-semibold text-gray-700">
                    {app.patient_name}
                  </td>
                  <td className="px-2 py-2">
                    {new Date(app.date).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2">{app.time}</td>
                  <td className="px-2 py-2">{app.reason}</td>
                  <td className="px-2 py-2">
                    {formatSchedulerName(app.profiles)}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-0.5 font-bold rounded-full ${getStatusClass(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No upcoming appointments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ViewAllActivityModal = ({ activities, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
    <motion.div
      className="bg-white rounded-lg shadow-2xl w-full max-w-2xl"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
    >
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          All Recent Activity
        </h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
          {activities.length > 0 ? (
            activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 pb-3 border-b last:border-b-0"
              >
                {/* MODIFIED: Dot color is now dynamic */}
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotColor(
                    item.profiles?.role
                  )} flex-shrink-0`}
                ></div>
                <div className="flex-grow">
                  {/* MODIFIED: Added user's role and name */}
                  <p className="font-semibold text-gray-700 text-sm">
                    <span className="font-bold">
                      {item.profiles?.role || "System"}{" "}
                      {item.profiles?.last_name || ""}
                    </span>{" "}
                    {item.action}
                  </p>
                  <p className="text-xs text-gray-500">{item.details}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No activity to show.
            </p>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const AppointmentRequests = ({ requests, onApprove, onDeny }) => (
  // MODIFIED: Added a fixed height and scrollbar to prevent layout shifts
  <div className="bg-white p-4 rounded-lg shadow border flex flex-col h-full">
    <h3 className="font-bold text-gray-700 text-base mb-3 flex-shrink-0">
      Appointment Requests
    </h3>
    <div className="overflow-y-auto flex-grow">
      {requests.length > 0 ? (
        requests.map((req) => (
          <div
            key={req.id}
            className="flex justify-between items-center py-2 border-b last:border-b-0"
          >
            <div>
              <p className="font-semibold text-sm">{req.patient_name}</p>
              <p className="text-xs text-gray-500">
                {req.reason} on {new Date(req.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onApprove(req.id)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
              >
                Approve
              </button>
              <button
                onClick={() => onDeny(req.id)}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Deny
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 mt-2">No pending requests.</p>
      )}
    </div>
  </div>
);

// --- Main BHW Dashboard Component ---
export default function BhwDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const { user, profile } = useAuth();
  const { addNotification } = useNotification();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return; // Wait until the user object is available

    setLoading(true);

    const [appointmentsRes, activityRes] = await Promise.all([
      // MODIFIED: This query now filters appointments by the logged-in user's ID
      supabase
        .from("appointments")
        .select("*, profiles(first_name, last_name)")
        .eq("created_by", user.id) // Only get appointments created by the current user
        .order("created_at", { ascending: false })
        .limit(10),

      // This query for activity remains the same, as the feed shows all activities
      supabase
        .from("activity_log")
        .select("*, profiles(role, last_name)")
        .order("created_at", { ascending: false }),
    ]);

    if (appointmentsRes.error) {
      addNotification(
        `Error fetching appointments: ${appointmentsRes.error.message}`,
        "error"
      );
    } else {
      setUpcomingAppointments(appointmentsRes.data || []);
    }

    if (activityRes.error) {
      addNotification(
        `Error fetching activity: ${activityRes.error.message}`,
        "error"
      );
    } else {
      setRecentActivities(activityRes.data || []);
    }

    const { data: requestsData } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "Pending");
    setPendingRequests(requestsData || []);

    setLoading(false);
  }, [user, addNotification]);

  const handleApprove = async (appointmentId) => {
    // --- MODIFICATION: Call fetchDashboardData() after the await ---
    await supabase.rpc("approve_appointment_and_notify_user", {
      appointment_id_param: appointmentId,
      approver_name_param: profile.full_name, // Send the BHW's name
    });
    // This will refresh the list of pending requests and other dashboard data
    fetchDashboardData();
    // --- END MODIFICATION ---
  };

  // You would create a similar RPC for denying/cancelling
  const handleDeny = async (appointmentId) => {
    await supabase
      .from("appointments")
      .update({ status: "Cancelled" })
      .eq("id", appointmentId);
    fetchDashboardData(); // Refresh list
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isActivityModalOpen && (
          <ViewAllActivityModal
            activities={recentActivities}
            onClose={() => setIsActivityModalOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className="space-y-4">
        {/* --- RESTRUCTURED LAYOUT: A balanced 2x2 grid for widgets --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <AppointmentRequests
              requests={pendingRequests}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity
              activities={recentActivities}
              onViewAll={() => setIsActivityModalOpen(true)}
            />
          </div>
          <div className="lg:col-span-1">
            <QuickAccess />
          </div>
        </div>

        {/* --- The calendar and appointments table are now below the main grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={upcomingAppointments} />
          </div>
          <div className="lg:col-span-1">
            <Calendar />
          </div>
        </div>
      </div>
    </>
  );
}

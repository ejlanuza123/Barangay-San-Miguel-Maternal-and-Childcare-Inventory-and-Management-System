import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

// --- WIDGETS & SUB-COMPONENTS ---
const AnalyticsOverview = ({ analytics }) => (
  <div className="bg-white p-4 rounded-lg shadow border h-full">
    <h3 className="font-bold text-gray-700 text-base mb-4">Analytics Overview</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-600 font-semibold">Total Patients</p>
        <p className="text-xl font-bold text-blue-700">{analytics.totalPatients}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
        <p className="text-xs text-green-600 font-semibold">This Month</p>
        <p className="text-xl font-bold text-green-700">{analytics.monthlyAppointments}</p>
      </div>
      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
        <p className="text-xs text-orange-600 font-semibold">High Risk</p>
        <p className="text-xl font-bold text-orange-700">{analytics.highRiskPatients}</p>
      </div>
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-600 font-semibold">Completion Rate</p>
        <p className="text-xl font-bold text-purple-700">{analytics.completionRate}%</p>
      </div>
    </div>
  </div>
);

const RiskLevelChart = ({ riskLevels }) => {
  const total = Object.values(riskLevels).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Risk Level Distribution</h3>
      <div className="space-y-3">
        {Object.entries(riskLevels).map(([risk, count]) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          const getColor = (risk) => {
            switch(risk) {
              case 'High': return 'bg-red-500';
              case 'Medium': return 'bg-orange-500';
              case 'Low': return 'bg-green-500';
              default: return 'bg-gray-500';
            }
          };
          
          return (
            <div key={risk} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700">{risk} Risk</span>
                <span className="text-gray-500">{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColor(risk)}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthlyTrends = ({ monthlyData }) => (
  <div className="bg-white p-4 rounded-lg shadow border h-full">
    <h3 className="font-bold text-gray-700 text-base mb-4">Monthly Appointments</h3>
    <div className="space-y-2">
      {monthlyData.map((month, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">{month.month}</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(month.count / Math.max(...monthlyData.map(m => m.count))) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700 w-8">{month.count}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AppointmentStatusChart = ({ statusData }) => {
  const total = Object.values(statusData).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Appointment Status</h3>
      <div className="space-y-3">
        {Object.entries(statusData).map(([status, count]) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          const getStatusColor = (status) => {
            switch(status) {
              case 'Scheduled': return 'bg-blue-500';
              case 'Completed': return 'bg-green-500';
              case 'Cancelled': return 'bg-red-500';
              case 'Missed': return 'bg-orange-500';
              default: return 'bg-gray-500';
            }
          };
          
          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                <span className="text-sm font-medium text-gray-700">{status}</span>
              </div>
              <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- EXISTING WIDGETS & SUB-COMPONENTS (unchanged) ---
const getDotColor = (role) => {
  switch (role) {
    case "BNS":
      return "bg-green-500";
    case "Admin":
      return "bg-orange-500";
    case "BHW":
    default:
      return "bg-blue-500";
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


export default function BhwDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    monthlyAppointments: 0,
    highRiskPatients: 0,
    completionRate: 0,
    riskLevels: {},
    monthlyTrends: [],
    appointmentStatus: {}
  });

  const { user, profile } = useAuth();
  const { addNotification } = useNotification();

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch patient statistics
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('risk_level, created_at');

      if (patientsError) throw patientsError;

      // Fetch appointment statistics
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('status, date, created_at')
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

      if (appointmentsError) throw appointmentsError;

      // Calculate analytics
      const totalPatients = patientsData?.length || 0;
      
      const monthlyAppointments = appointmentsData?.filter(apt => 
        apt.date?.startsWith(currentMonth)
      ).length || 0;

      const highRiskPatients = patientsData?.filter(
        patient => patient.risk_level === 'High'
      ).length || 0;

      const completedAppointments = appointmentsData?.filter(
        apt => apt.status === 'Completed'
      ).length || 0;
      
      const totalAppointments = appointmentsData?.length || 0;
      const completionRate = totalAppointments > 0 ? 
        Math.round((completedAppointments / totalAppointments) * 100) : 0;

      // Risk level distribution
      const riskLevels = patientsData?.reduce((acc, patient) => {
        const risk = patient.risk_level || 'Unknown';
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      }, {});

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const monthStr = date.toISOString().slice(0, 7);
        
        const count = appointmentsData?.filter(apt => 
          apt.date?.startsWith(monthStr)
        ).length || 0;
        
        monthlyTrends.push({ month: monthYear, count });
      }

      // Appointment status distribution
      const appointmentStatus = appointmentsData?.reduce((acc, apt) => {
        const status = apt.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setAnalytics({
        totalPatients,
        monthlyAppointments,
        highRiskPatients,
        completionRate,
        riskLevels: riskLevels || {},
        monthlyTrends,
        appointmentStatus: appointmentStatus || {}
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      addNotification(`Error loading analytics: ${error.message}`, 'error');
    }
  }, [user, addNotification]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      await fetchAnalyticsData();

      const [appointmentsRes, activityRes, requestsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, profiles(first_name, last_name)")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("activity_log")
          .select("*, profiles(role, last_name)")
          .order("created_at", { ascending: false }),

        supabase
          .from("appointments")
          .select("*")
          .eq("status", "Pending")
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (activityRes.error) throw activityRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setUpcomingAppointments(appointmentsRes.data || []);
      setRecentActivities(activityRes.data || []);
      setPendingRequests(requestsRes.data || []);

    } catch (error) {
      addNotification(`Error fetching dashboard data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addNotification, fetchAnalyticsData]);

  const handleApprove = async (appointmentId) => {
    await supabase.rpc("approve_appointment_and_notify_user", {
      appointment_id_param: appointmentId,
      approver_name_param: profile.full_name,
    });
    fetchDashboardData();
  };

  const handleDeny = async (appointmentId) => {
    await supabase
      .from("appointments")
      .update({ status: "Cancelled" })
      .eq("id", appointmentId);
    fetchDashboardData();
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
        {/* --- ANALYTICS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <AnalyticsOverview analytics={analytics} />
          </div>
          <div className="lg:col-span-1">
            <RiskLevelChart riskLevels={analytics.riskLevels} />
          </div>
          <div className="lg:col-span-1">
            <AppointmentStatusChart statusData={analytics.appointmentStatus} />
          </div>
        </div>

        {/* --- MAIN DASHBOARD CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <MonthlyTrends monthlyData={analytics.monthlyTrends} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity
              activities={recentActivities}
              onViewAll={() => setIsActivityModalOpen(true)}
            />
          </div>
          <div className="lg:col-span-1">
            <QuickAccess />
          </div>
        </div>

        {/* --- BOTTOM SECTION --- */}
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

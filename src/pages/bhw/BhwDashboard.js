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
        <p className="text-xs text-green-600 font-semibold">Recent Visits</p>
        <p className="text-xl font-bold text-green-700">{analytics.recentVisits}</p>
      </div>
      <div className="bg-red-50 p-3 rounded-lg border border-red-100">
        <p className="text-xs text-red-600 font-semibold">High Risk</p>
        <p className="text-xl font-bold text-red-700">{analytics.highRiskPatients}</p>
      </div>
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-600 font-semibold">Active Records</p>
        <p className="text-xl font-bold text-purple-700">{analytics.totalPatients}</p>
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
            const r = risk.toUpperCase(); // Normalize case
            if (r.includes('HIGH')) return 'bg-red-500';
            if (r.includes('MID') || r.includes('MEDIUM')) return 'bg-yellow-500'; // Changed to yellow for better visibility
            if (r.includes('NORMAL') || r.includes('LOW')) return 'bg-green-500';
            return 'bg-gray-500';
          };
          
          return (
            <div key={risk} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700 capitalize">{risk.toLowerCase()}</span>
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
        {total === 0 && <p className="text-xs text-gray-400 text-center">No patient data available.</p>}
      </div>
    </div>
  );
};

const MonthlyTrends = ({ monthlyData }) => (
  <div className="bg-white p-4 rounded-lg shadow border min-h-[280px]">
    <h3 className="font-bold text-gray-700 text-base mb-4">Monthly Patient Registrations</h3>
    <div className="space-y-2">
      {monthlyData.map((month, index) => {
         const maxVal = Math.max(...monthlyData.map(m => m.count)) || 1;
         return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium w-10">{month.month}</span>
              <div className="flex items-center space-x-2 flex-1 ml-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(month.count / maxVal) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 w-6 text-right">{month.count}</span>
              </div>
            </div>
         );
      })}
    </div>
  </div>
);

const AppointmentStatusChart = ({ statusData }) => {
  const total = Object.values(statusData).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Appointment Status</h3>
      <div className="space-y-3">
        {Object.keys(statusData).length > 0 ? Object.entries(statusData).map(([status, count]) => {
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
        }) : <p className="text-xs text-gray-400 text-center">No appointment data available.</p>}
      </div>
    </div>
  );
};

// --- EXISTING WIDGETS & SUB-COMPONENTS ---
const getDotColor = (role) => {
  switch (role) {
    case "BNS":
      return "bg-green-500";
    case "Admin":
      return "bg-orange-500";
    case "Midwife": 
      return "bg-purple-500";
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
    // Changed h-full to h-auto to wrap content tightly. 
    // Added min-h to ensure consistency if needed.
    <div className="bg-white p-4 rounded-lg shadow border h-auto min-h-[300px]">
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
        <h3 className="font-bold text-gray-700 text-base">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">
        {daysOfWeek.map((day) => <div key={day}>{day}</div>)}
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
      + New Mother Record
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

const UpcomingVisits = ({ visits }) => {
    // Helper to get next Wednesday date
    const getNextWednesday = () => {
        const d = new Date();
        const diff = (3 + 7 - d.getDay()) % 7; 
        d.setDate(d.getDate() + diff);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const nextDate = getNextWednesday();

    return (
        <div className="bg-white p-4 rounded-lg shadow border h-full">
            <h3 className="font-bold text-gray-700 text-base mb-3">Upcoming Follow-up Visits</h3>
            <p className="text-xs text-gray-500 mb-2">Next Visit Day: <span className="font-bold text-blue-600">{nextDate}</span> (Wednesday)</p>
            <div className="space-y-2 overflow-y-auto max-h-80">
                {visits.length > 0 ? visits.map(patient => (
                    <div key={patient.id} className="flex justify-between items-center p-3 bg-blue-50 rounded border hover:bg-blue-100 transition-colors">
                        <div>
                            <p className="font-semibold text-sm text-gray-800">{patient.last_name}, {patient.first_name}</p>
                            <p className="text-xs text-gray-500">Purok: {patient.purok}</p>
                        </div>
                        <div className="text-right">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Walk-in Expected</span>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No active patients found.</p>}
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
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotColor(
                    item.profiles?.role
                  )} flex-shrink-0`}
                ></div>
                <div className="flex-grow">
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
  const [loading, setLoading] = useState(true);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [riskData, setRiskData] = useState([]);
  
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    recentVisits: 0,
    highRiskPatients: 0,
    riskLevels: { Normal: 0, Medium: 0, High: 0 },
    monthlyTrends: []
  });

  const { user } = useAuth();
  const { addNotification } = useNotification();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Patients & Activity
      const [patientsRes, activityRes] = await Promise.all([
        supabase.from('patients')
            .select('id, first_name, last_name, purok, risk_level, created_at, last_visit, is_deleted')
            .eq('is_deleted', false)
            .order('last_name', { ascending: true }),
        
        supabase.from("activity_log")
            .select("*, profiles(role, last_name)")
            .eq('user_id', user.id)
            .order("created_at", { ascending: false })
            .limit(10)
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (activityRes.error) throw activityRes.error;

      const patients = patientsRes.data || [];
      
      // Upcoming Visits: Just take the first 10 active patients as "Expected" for the dashboard preview
      setUpcomingVisits(patients.slice(0, 10));
      setRecentActivities(activityRes.data || []);

      // 2. Calculate Analytics
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const totalPatients = patients.length;
      
      // Count "Recent Visits" (patients with last_visit in current month)
      const recentVisits = patients.filter(p => p.last_visit && p.last_visit.startsWith(currentMonth)).length;

      // Robust High Risk Calculation
      const highRiskPatients = patients.filter(p => {
          const risk = (p.risk_level || '').toUpperCase();
          return risk.includes('HIGH');
      }).length;

      // Risk Levels Distribution
      const riskLevels = patients.reduce((acc, p) => {
        const risk = (p.risk_level || '').toUpperCase();
        let key = 'Normal';
        if (risk.includes('HIGH')) key = 'High';
        else if (risk.includes('MID') || risk.includes('MEDIUM')) key = 'Medium';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { Normal: 0, Medium: 0, High: 0 });

      setRiskData([
        { name: 'Normal', value: riskLevels['Normal'] },
        { name: 'Mid Risk', value: riskLevels['Medium'] },
        { name: 'High Risk', value: riskLevels['High'] }
      ]);

      // Monthly Trends (Registrations Last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        const monthStr = date.toISOString().slice(0, 7);
        const count = patients.filter(p => p.created_at?.startsWith(monthStr)).length;
        monthlyTrends.push({ month: monthLabel, count });
      }

      setAnalytics({
        totalPatients,
        recentVisits,
        highRiskPatients,
        riskLevels,
        monthlyTrends
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      addNotification(`Error loading dashboard: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Dashboard...</div>;

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

      <div className="space-y-6">
        
        {/* --- TOP ROW: Analytics & Quick Stats --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <AnalyticsOverview analytics={analytics} />
          </div>
          <div className="lg:col-span-1">
            <RiskLevelChart riskLevels={analytics.riskLevels} />
          </div>
          <div className="lg:col-span-1">
             <QuickAccess />
          </div>
        </div>

        {/* --- BOTTOM ROW: Widgets Grid (4 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* 1. Trends */}
           <div className="lg:col-span-1">
              <MonthlyTrends monthlyData={analytics.monthlyTrends} />
           </div>
           
           {/* 2. Visits List */}
           <div className="lg:col-span-1">
             <UpcomingVisits visits={upcomingVisits} />
           </div>

           {/* 3. Activity Feed */}
           <div className="lg:col-span-1">
              <RecentActivity 
                activities={recentActivities} 
                onViewAll={() => setIsActivityModalOpen(true)} 
              />
           </div>

           {/* 4. Calendar (Fixed Size) */}
           <div className="lg:col-span-1">
              <Calendar />
           </div>
        </div>
      </div>
    </>
  );
}
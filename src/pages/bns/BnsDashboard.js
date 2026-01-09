import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Helper function to calculate age from DOB
const calculateAgeInYears = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to calculate age group
const getAgeGroup = (age) => {
  if (age < 1) return '0-1 years';
  if (age < 3) return '1-3 years';
  if (age < 5) return '3-5 years';
  return '5+ years';
};

// Helper function to normalize nutrition status
const normalizeNutritionStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusStr = String(status).toUpperCase().trim();
  
  switch(statusStr) {
    case 'H':
    case 'HEALTHY':
    case 'NORMAL':
      return 'Healthy';
    case 'UW':
    case 'UNDERWEIGHT':
    case 'SEVERELY UNDERWEIGHT':
      return 'Underweight';
    case 'OW':
    case 'OVERWEIGHT':
      return 'Overweight';
    case 'O':
    case 'OBESE':
      return 'Obese';
    default:
      return 'Unknown';
  }
};

// --- ANALYTICS COMPONENTS ---
const AnalyticsOverview = ({ analytics }) => (
  <div className="bg-white p-4 rounded-lg shadow border h-full">
    <h3 className="font-bold text-gray-700 text-base mb-4">Nutrition Overview</h3>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-600 font-semibold">Total Children</p>
        <p className="text-xl font-bold text-blue-700">{analytics.totalChildren}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
        <p className="text-xs text-green-600 font-semibold">Healthy</p>
        <p className="text-xl font-bold text-green-700">{analytics.healthyCount}</p>
      </div>
      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
        <p className="text-xs text-orange-600 font-semibold">Underweight</p>
        <p className="text-xl font-bold text-orange-700">{analytics.underweightCount}</p>
      </div>
      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
        <p className="text-xs text-yellow-600 font-semibold">Overweight</p>
        <p className="text-xl font-bold text-yellow-700">{analytics.overweightCount}</p>
      </div>
      <div className="bg-red-50 p-3 rounded-lg border border-red-100">
        <p className="text-xs text-red-600 font-semibold">Obese</p>
        <p className="text-xl font-bold text-red-700">{analytics.obeseCount}</p>
      </div>
    </div>
  </div>
);

const NutritionChart = ({ nutritionData }) => {
  const total = Object.values(nutritionData || {}).reduce((sum, count) => sum + count, 0);
  
  // Define display order
  const displayOrder = ['Healthy', 'Underweight', 'Overweight', 'Obese'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Nutrition Status</h3>
      <div className="space-y-3">
        {displayOrder.map((status) => {
          const count = nutritionData[status] || 0;
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          
          const getColor = (status) => {
            switch(status) {
              case 'Healthy': return 'bg-green-500';
              case 'Underweight': return 'bg-orange-500';
              case 'Overweight': return 'bg-yellow-500';
              case 'Obese': return 'bg-red-500';
              default: return 'bg-gray-500';
            }
          };
          
          return (
            <div key={status} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700">{status}</span>
                <span className="text-gray-500">{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColor(status)}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        {total === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No nutrition data available</p>
        )}
      </div>
    </div>
  );
};

const MonthlyTrends = ({ monthlyData }) => (
  <div className="bg-white p-4 rounded-lg shadow border min-h-[280px]"> {/* Changed from h-full to min-h-[280px] */}
    <h3 className="font-bold text-gray-700 text-base mb-4">Monthly Registrations</h3>
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

// --- EXISTING WIDGETS & SUB-COMPONENTS ---
const getDotColor = (role) => {
    switch (role) {
        case 'BNS':
            return 'bg-green-500';
        case 'Admin':
            return 'bg-orange-500';
        case "Midwife": 
            return "bg-purple-500";
        case 'BHW':
        default:
            return 'bg-blue-500';
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
            isToday ? "bg-green-500 text-white font-bold" : "hover:bg-gray-100"
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
        <h3 className="font-bold text-gray-700 text-base text-center mb-2">Quick Access</h3>
        <Link to="/bns/child-records" className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-blue-700 text-sm">
            + New Child Record
        </Link>
        <Link to="/bns/reports" className="w-full text-center bg-orange-400 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-orange-500 text-sm">
            Generate Reports
        </Link>
    </div>
);

const RecentActivity = ({ activities, onViewAll }) => (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700 text-base">Recent Activity</h3>
            <button onClick={onViewAll} className="text-xs font-semibold text-blue-600 hover:underline">View All &gt;</button>
        </div>
        <div className="space-y-3">
            {activities.length > 0 ? activities.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotColor(item.profiles?.role)}`}></div>
                    <div>
                        <p className="font-semibold text-gray-700 text-sm">
                            <span className="font-bold">{item.profiles?.role || 'System'} {item.profiles?.last_name || ''}</span> {item.action}
                        </p>
                        <p className="text-xs text-gray-500">{item.details}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>
            )) : <p className="text-sm text-gray-500">No recent activity.</p>}
        </div>
    </div>
);

const UpcomingVisits = ({ visits }) => {
    // Helper to get next Thursday
    const getNextThursday = () => {
        const d = new Date();
        const diff = (4 + 7 - d.getDay()) % 7; 
        d.setDate(d.getDate() + diff);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const nextDate = getNextThursday();

    return (
        <div className="bg-white p-4 rounded-lg shadow border min-h-[380px]"> {/* Changed from h-full to min-h-[280px] */}
            <h3 className="font-bold text-gray-700 text-base mb-3">Upcoming Follow-up Visits</h3>
            <p className="text-xs text-gray-500 mb-2">Next Visit Day: <span className="font-bold text-green-600">{nextDate}</span> (Thursday)</p>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '300px' }}> {/* Reduced max-height */}
                {visits.length > 0 ? visits.map(child => (
                    <div key={child.id} className="flex justify-between items-center p-3 bg-green-50 rounded border hover:bg-green-100 transition-colors">
                        <div>
                            <p className="font-semibold text-sm text-gray-800">{child.last_name}, {child.first_name}</p>
                            <p className="text-xs text-gray-500">ID: {child.child_id}</p>
                            <p className="text-xs text-gray-500">Nutrition: {normalizeNutritionStatus(child.nutrition_status)}</p>
                        </div>
                        <div className="text-right">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Walk-in Expected</span>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No active records found.</p>}
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">All Recent Activity</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
                    {activities.length > 0 ? activities.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${getDotColor(item.profiles?.role)} flex-shrink-0`}></div>
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-700 text-sm">
                                    <span className="font-bold">{item.profiles?.role || 'System'} {item.profiles?.last_name || ''}</span> {item.action}
                                </p>
                                <p className="text-xs text-gray-500">{item.details}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(item.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )) : <p className="text-sm text-gray-500 text-center py-8">No activity to show.</p>}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </div>
        </motion.div>
    </div>
);

// --- Main BNS Dashboard Component ---
export default function BnsDashboard() {
  const [loading, setLoading] = useState(true);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  
  const [analytics, setAnalytics] = useState({
    totalChildren: 0,
    healthyCount: 0,
    underweightCount: 0,
    overweightCount: 0,
    obeseCount: 0,
    monthlyTrends: []
  });

  const [nutritionData, setNutritionData] = useState({});

  const { user } = useAuth();
  const { addNotification } = useNotification();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Children & Activity
      const [childrenRes, activityRes] = await Promise.all([
        supabase.from('child_records')
            .select('id, child_id, first_name, last_name, dob, nutrition_status, created_at, last_checkup, is_deleted')
            .eq('is_deleted', false)
            .order('last_name', { ascending: true }),
        
        supabase.from("activity_log")
            .select("*, profiles(role, last_name)")
            .eq('user_id', user.id)
            .order("created_at", { ascending: false })
            .limit(10)
      ]);

      if (childrenRes.error) throw childrenRes.error;
      if (activityRes.error) throw activityRes.error;

      const children = childrenRes.data || [];
      
      // Upcoming Visits: Get children who need follow-up (last checkup was more than 1 month ago or never)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const visits = children.filter(child => {
        if (!child.last_checkup) return true; // Never had checkup
        const lastCheckupDate = new Date(child.last_checkup);
        return lastCheckupDate < oneMonthAgo;
      }).slice(0, 10);
      
      setUpcomingVisits(visits);
      setRecentActivities(activityRes.data || []);

      // 2. Calculate Nutrition Statistics
      const nutritionCounts = {
        'Healthy': 0,
        'Underweight': 0,
        'Overweight': 0,
        'Obese': 0
      };

      children.forEach(child => {
        // Nutrition status counting
        const normalizedStatus = normalizeNutritionStatus(child.nutrition_status);
        if (nutritionCounts[normalizedStatus] !== undefined) {
          nutritionCounts[normalizedStatus]++;
        }
      });

      setNutritionData(nutritionCounts);

      // Monthly Trends (Registrations Last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        const monthStr = date.toISOString().slice(0, 7);
        const count = children.filter(c => {
          if (!c.created_at) return false;
          return c.created_at.startsWith(monthStr);
        }).length;
        monthlyTrends.push({ month: monthLabel, count });
      }

      setAnalytics({
        totalChildren: children.length,
        healthyCount: nutritionCounts['Healthy'],
        underweightCount: nutritionCounts['Underweight'],
        overweightCount: nutritionCounts['Overweight'],
        obeseCount: nutritionCounts['Obese'],
        monthlyTrends
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      addNotification(`Error loading dashboard: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => { 
    fetchDashboardData(); 
  }, [fetchDashboardData]);

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
            <NutritionChart nutritionData={nutritionData} />
          </div>
          <div className="lg:col-span-1">
             <QuickAccess />
          </div>
        </div>

        {/* --- BOTTOM ROW: Widgets Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="lg:col-span-1">
              <MonthlyTrends monthlyData={analytics.monthlyTrends} />
           </div>
           
           <div className="lg:col-span-1">
             <UpcomingVisits visits={upcomingVisits} />
           </div>

           <div className="lg:col-span-1">
              <RecentActivity 
                activities={recentActivities} 
                onViewAll={() => setIsActivityModalOpen(true)} 
              />
           </div>

           <div className="lg:col-span-1">
              <Calendar />
           </div>
        </div>
      </div>
    </>
  );
}
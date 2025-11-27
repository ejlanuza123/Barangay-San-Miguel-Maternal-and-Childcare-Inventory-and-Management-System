import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

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

const NutritionStatusChart = ({ nutritionData }) => {
  const data = nutritionData || {};
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Nutrition Status</h3>
      <div className="space-y-3">
        {Object.entries(data).length > 0 ? Object.entries(data).map(([status, count]) => {
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
        }) : (
          <p className="text-sm text-gray-500 text-center py-4">No nutrition data available</p>
        )}
      </div>
    </div>
  );
};

const MonthlyTrends = ({ monthlyData }) => (
  <div className="bg-white p-4 rounded-lg shadow border h-full">
    <h3 className="font-bold text-gray-700 text-base mb-4">Monthly Checkups</h3>
    <div className="space-y-2">
      {monthlyData && monthlyData.length > 0 ? monthlyData.map((month, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">{month.month}</span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(month.count / Math.max(...monthlyData.map(m => m.count || 1)) * 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700 w-8">{month.count}</span>
          </div>
        </div>
      )) : (
        <p className="text-sm text-gray-500 text-center py-4">No monthly data available</p>
      )}
    </div>
  </div>
);

const AgeDistributionChart = ({ ageData }) => {
  // FIX: Handle undefined/null ageData
  const data = ageData || {};
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
      <h3 className="font-bold text-gray-700 text-base mb-4">Age Distribution</h3>
      <div className="space-y-3">
        {Object.entries(data).length > 0 ? Object.entries(data).map(([ageGroup, count]) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          
          return (
            <div key={ageGroup} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">{ageGroup}</span>
              </div>
              <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
            </div>
          );
        }) : (
          <p className="text-sm text-gray-500 text-center py-4">No age data available</p>
        )}
      </div>
    </div>
  );
};

// --- EXISTING WIDGETS & SUB-COMPONENTS ---
const getDotColor = (role) => {
    switch (role) {
        case 'BNS':
            return 'bg-green-500';
        case 'Admin':
            return 'bg-orange-500';
        case 'BHW':
        default:
            return 'bg-blue-500';
    }
};

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    
    const changeMonth = (amount) => {
        setCurrentDate(prevDate => {
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
                <div key={i} className={`p-2 rounded-full text-center text-sm cursor-pointer ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100'}`}>
                    {i}
                </div>
            );
        }
        return dates;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border h-full">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="font-bold text-gray-700 text-base">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {generateDates()}
            </div>
        </div>
    );
};

const QuickAccess = () => (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col space-y-3 h-full justify-center">
        <h3 className="font-bold text-gray-700 text-base text-center mb-2">Quick Access</h3>
        <Link to="/bns/child-records" className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-blue-700 text-sm">
            + Add New Patient
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

const UpcomingAppointments = ({ appointments }) => {
    const getStatusClass = (status) => {
        const styles = {
            Scheduled: 'bg-blue-100 text-blue-700',
            Completed: 'bg-green-100 text-green-700',
            Cancelled: 'bg-red-100 text-red-700',
            Missed: 'bg-orange-100 text-orange-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const formatSchedulerName = (profile) => {
        if (!profile?.first_name || !profile?.last_name) return 'N/A';
        const firstInitial = profile.first_name.charAt(0).toUpperCase();
        return `${firstInitial}. ${profile.last_name}`;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700 text-base">Upcoming Appointments</h3>
                <Link to="/bns/appointment" className="bg-green-500 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-green-600 text-sm">
                    Scheduled Check-up
                </Link>
            </div>
            <div className="overflow-y-auto h-48">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white">
                        <tr className="text-left text-gray-500">
                            <th className="px-2 py-2 font-semibold">Patient Name</th>
                            <th className="px-2 py-2 font-semibold">Date</th>
                            <th className="px-2 py-2 font-semibold">Time</th>
                            <th className="px-2 py-2 font-semibold">Reason</th>
                            <th className="px-2 py-2 font-semibold">BNS</th>
                            <th className="px-2 py-2 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {appointments.length > 0 ? appointments.map((app) => (
                            <tr key={app.id} className="text-gray-600">
                                <td className="px-2 py-2 font-semibold text-gray-700">{app.patient_name}</td>
                                <td className="px-2 py-2">{new Date(app.date).toLocaleDateString()}</td>
                                <td className="px-2 py-2">{app.time}</td>
                                <td className="px-2 py-2">{app.reason}</td>
                                <td className="px-2 py-2">{formatSchedulerName(app.profiles)}</td>
                                <td className="px-2 py-2">
                                    <span className={`px-2 py-0.5 font-bold rounded-full ${getStatusClass(app.status)}`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" className="p-4 text-center text-gray-500">No upcoming appointments.</td></tr>
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
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [analytics, setAnalytics] = useState({
        totalChildren: 0,
        healthyCount: 0,
        underweightCount: 0,
        overweightCount: 0,
        obeseCount: 0,
        nutritionData: {},
        monthlyTrends: [],
        ageData: {}
    });

    const { user } = useAuth();
    const { addNotification } = useNotification();

    const fetchAnalyticsData = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch child records statistics
            const { data: childrenData, error: childrenError } = await supabase
                .from('child_records')
                .select('nutrition_status, weight_kg, height_cm, dob, last_checkup, bmi');

            if (childrenError) throw childrenError;

            // Fetch appointment statistics for BNS
            const currentMonth = new Date().toISOString().slice(0, 7);
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select('date, created_at')
                .eq('created_by', user.id)
                .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

            if (appointmentsError) throw appointmentsError;

            console.log('Raw children data:', childrenData); // Debug log

            // Calculate analytics for BNS
            const totalChildren = childrenData?.length || 0;

            // FIRST: Check what nutrition_status values actually exist in your database
            const nutritionStatuses = childrenData?.map(child => child.nutrition_status) || [];
            console.log('All nutrition_status values:', nutritionStatuses); // Debug log

            // Count nutrition status - check what values actually exist
            const healthyCount = childrenData?.filter(
                child => child.nutrition_status === 'Normal' || 
                        child.nutrition_status === 'Healthy' ||
                        child.nutrition_status === 'H'
            ).length || 0;

            const underweightCount = childrenData?.filter(
                child => child.nutrition_status === 'Underweight' || 
                        child.nutrition_status === 'Severely Underweight' ||
                        child.nutrition_status === 'UW'
            ).length || 0;

            const overweightCount = childrenData?.filter(
                child => child.nutrition_status === 'Overweight' || 
                        child.nutrition_status === 'OW'
            ).length || 0;

            const obeseCount = childrenData?.filter(
                child => child.nutrition_status === 'Obese' || 
                        child.nutrition_status === 'O'
            ).length || 0;

            console.log('Counts - Healthy:', healthyCount, 'UW:', underweightCount, 'OW:', overweightCount, 'Obese:', obeseCount); // Debug log

            // Nutrition status distribution - map all possible values to standard categories
            const nutritionData = childrenData?.reduce((acc, child) => {
                let status = child.nutrition_status || 'Unknown';
                
                // Map all possible values to standard categories
                if (status === 'Normal' || status === 'Healthy' || status === 'H') {
                    status = 'Healthy';
                } else if (status === 'Underweight' || status === 'Severely Underweight' || status === 'UW') {
                    status = 'Underweight';
                } else if (status === 'Overweight' || status === 'OW') {
                    status = 'Overweight';
                } else if (status === 'Obese' || status === 'O') {
                    status = 'Obese';
                }
                // If it doesn't match any, leave as is
                
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            console.log('Processed nutrition data:', nutritionData);

            // ADDED: Monthly trends calculation
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

            // ADDED: Age distribution calculation
            const ageData = childrenData?.reduce((acc, child) => {
                if (!child.dob) return acc;
                
                const birthDate = new Date(child.dob);
                const today = new Date();
                const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                                (today.getMonth() - birthDate.getMonth());
                
                let ageGroup;
                if (ageInMonths <= 12) ageGroup = '0-1 years';
                else if (ageInMonths <= 36) ageGroup = '1-3 years';
                else if (ageInMonths <= 60) ageGroup = '3-5 years';
                else ageGroup = '5+ years';
                
                acc[ageGroup] = (acc[ageGroup] || 0) + 1;
                return acc;
            }, {});

            setAnalytics({
                totalChildren,
                healthyCount,
                underweightCount,
                overweightCount,
                obeseCount,
                nutritionData: nutritionData || {},
                monthlyTrends: monthlyTrends || [],
                ageData: ageData || {}
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

            const [appointmentsRes, activityRes] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('*, profiles(first_name, last_name)')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10),

                supabase
                    .from('activity_log')
                    .select('*, profiles(role, last_name)')
                    .order('created_at', { ascending: false })
            ]);

            if (appointmentsRes.error) throw appointmentsRes.error;
            if (activityRes.error) throw activityRes.error;

            setUpcomingAppointments(appointmentsRes.data || []);
            setRecentActivities(activityRes.data || []);

        } catch (error) {
            addNotification(`Error fetching dashboard data: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [user, addNotification, fetchAnalyticsData]);

    useEffect(() => {
        fetchDashboardData();

        const channel = supabase.channel('activity-log-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_log' },
                (payload) => {
                    fetchDashboardData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchDashboardData]);

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>;
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
                        <NutritionStatusChart nutritionData={analytics.nutritionData} />
                    </div>
                    <div className="lg:col-span-1">
                        <AgeDistributionChart ageData={analytics.ageData} />
                    </div>
                </div>

                {/* --- MAIN DASHBOARD CONTENT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                        <MonthlyTrends monthlyData={analytics.monthlyTrends} />
                    </div>
                    <div className="lg:col-span-2">
                        <RecentActivity activities={recentActivities} onViewAll={() => setIsActivityModalOpen(true)} />
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
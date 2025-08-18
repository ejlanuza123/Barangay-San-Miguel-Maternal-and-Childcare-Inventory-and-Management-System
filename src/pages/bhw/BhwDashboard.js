import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// --- WIDGETS & SUB-COMPONENTS (WITH ADJUSTED SIZES) ---

const StatCard = ({ title, value, change }) => (
    // UPDATED: Reduced padding and font sizes for a smaller card
    <div className="bg-white p-3 rounded-lg shadow border">
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {change && <p className="text-xs text-green-500">{change}</p>}
    </div>
);

const PregnancyProgressChart = () => (
    // UPDATED: Reduced padding, title size, and height
    <div className="bg-white p-4 rounded-lg shadow border h-56">
        <h3 className="font-bold text-gray-700 text-base mb-2">Pregnancy Progress Overview</h3>
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <p>Bar Chart Placeholder</p>
        </div>
    </div>
);

const InventoryStatusChart = () => (
    // UPDATED: Reduced padding, title size, and height
    <div className="bg-white p-4 rounded-lg shadow border h-56">
        <h3 className="font-bold text-gray-700 text-base mb-2">Inventory Status</h3>
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <p>Doughnut Chart Placeholder</p>
        </div>
    </div>
);

const QuickAccess = () => (
    // UPDATED: Reduced padding, spacing, and button sizes
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col space-y-3">
        <h3 className="font-bold text-gray-700 text-base text-center">Quick Access</h3>
        <Link to="/bhw/maternity-management" className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-blue-700 text-sm">
            + Add New Patient
        </Link>
        <Link to="/bhw/appointment" className="w-full text-center bg-green-500 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-green-600 text-sm">
            Scheduled Check-up
        </Link>
        <Link to="/bhw/reports" className="w-full text-center bg-orange-400 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-orange-500 text-sm">
            Generate Reports
        </Link>
    </div>
);

const RecentActivity = ({ activities }) => {
    return (
        // UPDATED: Reduced padding, title size, and text sizes
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700 text-base">Recent Activity</h3>
                <a href="#" className="text-xs font-semibold text-blue-600">View All &gt;</a>
            </div>
            <div className="space-y-3">
                {activities.length > 0 ? activities.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-500`}></div>
                        <div>
                            <p className="font-semibold text-gray-700 text-sm">{item.action}</p>
                            <p className="text-xs text-gray-500">{item.details}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500">No recent activity.</p>}
            </div>
        </div>
    );
};

const UpcomingAppointments = ({ appointments }) => {
    const getStatusClass = (status) => {
        switch(status) {
            case "Completed": return "bg-green-100 text-green-700";
            case "Scheduled": return "bg-yellow-100 text-yellow-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        // UPDATED: Reduced padding, title size, and table cell sizes
        <div className="bg-white p-4 rounded-lg shadow border col-span-1 lg:col-span-3">
            <h3 className="font-bold text-gray-700 text-base mb-3">Upcoming Appointments</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="px-2 py-2 font-semibold">Patient Name</th>
                            <th className="px-2 py-2 font-semibold">Date</th>
                            <th className="px-2 py-2 font-semibold">Time</th>
                            <th className="px-2 py-2 font-semibold">Reason</th>
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
                                <td className="px-2 py-2">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusClass(app.status)}`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-gray-500">No upcoming appointments.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main BHW Dashboard Component ---
export default function BhwDashboard() {
    const [stats, setStats] = useState({ totalPatients: 0, activePregnancies: 0, todayVisits: 0 });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
            const { data: appointmentsData, error: appointmentsError } = await supabase.from('appointments').select('*').order('date', { ascending: true }).limit(5);
            const { data: activityData, error: activityError } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(4);

            setStats(prev => ({ ...prev, totalPatients: patientCount || 0 }));
            setUpcomingAppointments(appointmentsData || []);
            setRecentActivities(activityData || []);
            
            if (appointmentsError || activityError) console.error("Error fetching dashboard data:", appointmentsError || activityError);
            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>;
    }

    return (
        // UPDATED: Reduced main vertical spacing
        <div className="space-y-4">
            {/* UPDATED: Reduced gap between stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Patients" value={stats.totalPatients} change="+5 this month" />
                <StatCard title="Active Pregnancies" value="42" />
                <StatCard title="Today's Visits" value="8" />
                <StatCard title="Pending Reports" value="3" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <PregnancyProgressChart />
                </div>
                <div className="lg:col-span-1">
                    <InventoryStatusChart />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <RecentActivity activities={recentActivities} />
                </div>
                <div className="lg:col-span-1">
                    <QuickAccess />
                </div>
            </div>

            <UpcomingAppointments appointments={upcomingAppointments} />
        </div>
    );
}
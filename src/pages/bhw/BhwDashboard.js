import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// --- WIDGETS & SUB-COMPONENTS ---

// --- NEW: Real-time Calendar Component ---
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
        // Add padding for days from the previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            dates.push(<div key={`pad-start-${i}`} className="p-2"></div>);
        }
        // Add days of the current month
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
        <Link to="/bhw/maternity-management" className="w-full text-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-blue-700 text-sm">
            + Add New Patient
        </Link>
        <Link to="/bhw/reports" className="w-full text-center bg-orange-400 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-orange-500 text-sm">
            Generate Reports
        </Link>
    </div>
);

const RecentActivity = ({ activities }) => (
    <div className="bg-white p-4 rounded-lg shadow border h-full">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700 text-base">Recent Activity</h3>
            <a href="#" className="text-xs font-semibold text-blue-600">View All &gt;</a>
        </div>
        <div className="space-y-3">
            {activities.length > 0 ? activities.slice(0, 4).map((item) => ( // Show only top 4
                <div key={item.id} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-500"></div>
                    <div>
                        <p className="font-semibold text-gray-700 text-sm">{item.action}</p>
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
        return status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700 text-base">Upcoming Appointments</h3>
                <Link to="/bhw/appointment" className="bg-green-500 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-green-600 text-sm">
                    Scheduled Check-up
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
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
                        {appointments.length > 0 ? appointments.slice(0, 3).map((app) => ( // show top 3
                            <tr key={app.id} className="text-gray-600">
                                <td className="px-2 py-2 font-semibold text-gray-700">{app.patient_name}</td>
                                <td className="px-2 py-2">{new Date(app.date).toLocaleDateString()}</td>
                                <td className="px-2 py-2">{app.time}</td>
                                <td className="px-2 py-2">{app.reason}</td>
                                <td className="px-2 py-2">{app.assigned_to}</td>
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


// --- Main BHW Dashboard Component ---
export default function BhwDashboard() {
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const { data: appointmentsData } = await supabase.from('appointments').select('*').order('date', { ascending: true }).limit(5);
            const { data: activityData } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(4);

            setUpcomingAppointments(appointmentsData || []);
            setRecentActivities(activityData || []);
            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-4">
            {/* --- UPDATED: New layout to match the image --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="lg:col-span-1">
                    <RecentActivity activities={recentActivities} />
                </div>
                {/* Calendar */}
                <div className="lg:col-span-1">
                    <Calendar />
                </div>
                {/* Quick Access */}
                <div className="lg:col-span-1">
                    <QuickAccess />
                </div>
            </div>
            
            {/* Upcoming Appointments Table */}
            <div>
                <UpcomingAppointments appointments={upcomingAppointments} />
            </div>
        </div>
    );
}
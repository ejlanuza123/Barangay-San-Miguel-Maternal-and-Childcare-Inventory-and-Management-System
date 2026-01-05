import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
// Reuse components from Admin as they share functionality
// Note: In a real refactor, these should be in src/components/widgets
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';

// --- ICONS ---
const MaternityIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const InfantIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

const StatCard = ({ icon, count, label, color }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>{icon}</div>
        <div><p className="text-2xl font-bold text-gray-800">{count}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
);

const AnalyticsChart = ({ data }) => (
    <div className="bg-white p-4 rounded-lg shadow border h-80 flex flex-col">
        <h3 className="font-bold text-gray-700 mb-4">Monthly Registration Trends</h3>
        <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }} itemStyle={{ fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                    <Bar dataKey="Maternity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Children" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const RequestionsWidget = ({ requestions }) => (
    <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">Recent Requests</h3>
            <Link to="/midwife/requestions" className="text-xs font-semibold text-blue-600 hover:underline">See All</Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-500 font-semibold border-b">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Requester</th>
                        <th className="pb-2">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {requestions.map(req => (
                        <tr key={req.id}>
                            <td className="py-2 text-xs font-medium">{req.request_type}</td>
                            <td className="py-2 text-xs">{req.profiles?.first_name} ({req.profiles?.role})</td>
                            <td className="py-2 text-xs"><span className={`px-2 py-0.5 rounded-full ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{req.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default function MidwifeDashboard() {
    const [stats, setStats] = useState({ newMaternity: 0, newInfant: 0 });
    const [requestions, setRequestions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

        const [requestionsRes, newMaternityCountRes, newInfantCountRes, allMaternityRes, allChildRes] = await Promise.all([
            supabase.from('requestions').select('*, profiles:worker_id!inner(first_name, last_name, role)').order('created_at', { ascending: false }).limit(5),
            supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth).lt('created_at', firstDayOfNextMonth),
            supabase.from('child_records').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth).lt('created_at', firstDayOfNextMonth),
            supabase.from('patients').select('created_at'),
            supabase.from('child_records').select('created_at')
        ]);
        
        setStats({ newMaternity: newMaternityCountRes.count || 0, newInfant: newInfantCountRes.count || 0 });

        // Chart Data (Last 6 Months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({ month: months[d.getMonth()], monthIndex: d.getMonth(), year: d.getFullYear(), Maternity: 0, Children: 0 });
        }
        allMaternityRes.data?.forEach(p => {
            const d = new Date(p.created_at);
            const bucket = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
            if (bucket) bucket.Maternity++;
        });
        allChildRes.data?.forEach(c => {
            const d = new Date(c.created_at);
            const bucket = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
            if (bucket) bucket.Children++;
        });
        setChartData(last6Months);
        if (requestionsRes.data) setRequestions(requestionsRes.data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    if (loading) return <div className="p-6 text-center">Loading Midwife Dashboard...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Midwife Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<MaternityIcon />} count={stats.newMaternity} label="New Maternity (This Month)" color="blue" />
                <StatCard icon={<InfantIcon />} count={stats.newInfant} label="New Infants (This Month)" color="green" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><AnalyticsChart data={chartData} /></div>
                <div className="lg:col-span-1"><RequestionsWidget requestions={requestions} /></div>
            </div>
        </div>
    );
}
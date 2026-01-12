import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

// --- MODERN ICONS ---
const MaternityIcon = () => (
  <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfantIcon = () => (
  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5a6 6 0 01-9 0" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FollowUpIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// --- Helper Functions for Dates ---
const formatDate = (date, formatType = 'full') => {
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  switch(formatType) {
    case 'full':
      return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    case 'month':
      return months[d.getMonth()];
    case 'shortMonth':
      return shortMonths[d.getMonth()];
    case 'weekday':
      return days[d.getDay()];
    case 'date':
      return d.getDate();
    default:
      return d.toLocaleDateString();
  }
};

const getNextWednesday = (fromDate = new Date()) => {
  const d = new Date(fromDate);
  // 3 is Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  const daysUntilWednesday = (3 + 7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilWednesday);
  return d;
};

const getNextThursday = (fromDate = new Date()) => {
  const d = new Date(fromDate);
  // 4 is Thursday
  const daysUntilThursday = (4 + 7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilThursday);
  return d;
};

const isWednesday = (date) => {
  return new Date(date).getDay() === 3;
};

const isThursday = (date) => {
  return new Date(date).getDay() === 4;
};

const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

// --- COMPONENTS ---

const StatCard = ({ icon, count, label, trend, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-md`}>
            {icon}
          </div>
        </div>
        <p className="text-4xl font-bold text-gray-900 mb-1">{count}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      {trend && (
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last month</span>
        <span className="font-semibold text-gray-700">{Math.round(count * 0.8)}</span>
      </div>
    </div>
  </motion.div>
);

const AnalyticsChart = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Registration Trends</h3>
        <p className="text-sm text-gray-500">Monthly maternity and children registrations</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Maternity</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-gray-600">Children</span>
        </div>
      </div>
    </div>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMaternity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorChildren" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="Maternity" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#colorMaternity)"
            fillOpacity={1}
          />
          <Area 
            type="monotone" 
            dataKey="Children" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#colorChildren)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FollowUpVisitsWidget = () => {
  const today = new Date();
  const isWed = isWednesday(today);
  const isThu = isThursday(today);
  
  const nextWed = getNextWednesday(today);
  const nextThu = getNextThursday(today);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <FollowUpIcon />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Follow-up Visits</h3>
            <p className="text-sm text-gray-500">Weekly schedule for checkups</p>
          </div>
        </div>
        <div className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Today
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Maternal Follow-up (Wednesdays) */}
        <div className={`p-4 rounded-xl border transition-all ${isWed ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h4 className="font-semibold text-gray-900">Maternal Follow-up</h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">Every Wednesday</p>
              <p className={`text-lg font-bold ${isWed ? 'text-blue-700' : 'text-gray-700'}`}>
                {isWed ? "Today" : formatDate(nextWed, 'weekday') + ', ' + formatDate(nextWed, 'shortMonth') + ' ' + formatDate(nextWed, 'date')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                First Come, First Serve basis for all maternity patients
              </p>
            </div>
            <Link 
              to="/midwife/maternity-records" 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isWed 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isWed ? 'View Records →' : 'View Records'}
            </Link>
          </div>
        </div>

        {/* Child Health Follow-up (Thursdays) */}
        <div className={`p-4 rounded-xl border transition-all ${isThu ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h4 className="font-semibold text-gray-900">Child Health Follow-up</h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">Every Thursday</p>
              <p className={`text-lg font-bold ${isThu ? 'text-emerald-700' : 'text-gray-700'}`}>
                {isThu ? "Today" : formatDate(nextThu, 'weekday') + ', ' + formatDate(nextThu, 'shortMonth') + ' ' + formatDate(nextThu, 'date')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Walk-in basis for all child health checkups
              </p>
            </div>
            <Link 
              to="/midwife/child-records" 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isThu 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {isThu ? 'View Records →' : 'View Records'}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Maternal Wednesdays</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Child Thursdays</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestionsWidget = ({ requestions }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
          <ActivityIcon />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Recent Requests</h3>
          <p className="text-sm text-gray-500">Latest inventory and data requests</p>
        </div>
      </div>
      <Link to="/midwife/requestions" className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline">
        View All →
      </Link>
    </div>
    
    <div className="space-y-3">
      {requestions.map((req, index) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  req.request_type === 'Add' 
                    ? 'bg-green-100 text-green-700'
                    : req.request_type === 'Update'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {req.request_type}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {req.target_table}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">{req.request_data?.item_name || 'Data Request'}</p>
              <p className="text-xs text-gray-500 mt-1">by {req.profiles?.first_name} ({req.profiles?.role})</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                req.status === 'Approved' 
                  ? 'bg-green-100 text-green-700'
                  : req.status === 'Rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {req.status}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {formatDate(new Date(req.created_at), 'shortMonth')} {formatDate(new Date(req.created_at), 'date')}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
      
      {requestions.length === 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <ActivityIcon />
          </div>
          <p className="text-gray-500">No pending requests</p>
          <p className="text-sm text-gray-400 mt-1">All requests have been processed</p>
        </div>
      )}
    </div>
  </div>
);

const QuickActions = () => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg">
    <h3 className="text-white font-bold text-lg mb-6">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-3">
      <Link 
        to="/midwife/maternity-records" 
        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-white transition-all transform hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-white/20 rounded-lg mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Maternity Records</span>
        </div>
      </Link>
      
      <Link 
        to="/midwife/child-records" 
        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-white transition-all transform hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-white/20 rounded-lg mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5a6 6 0 01-9 0" />
            </svg>
          </div>
          <span className="text-sm font-medium">Child Records</span>
        </div>
      </Link>
      
      <Link 
        to="/midwife/inventory" 
        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-white transition-all transform hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-white/20 rounded-lg mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-medium">Inventory</span>
        </div>
      </Link>
      
      <Link 
        to="/midwife/item-issuance" 
        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-white transition-all transform hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-white/20 rounded-lg mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Item Issuance</span>
        </div>
      </Link>
    </div>
  </div>
);

const WeeklyScheduleWidget = () => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-rose-50 rounded-lg">
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-gray-900">Weekly Schedule</h3>
        <p className="text-sm text-gray-500">Regular follow-up visit days</p>
      </div>
    </div>
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="font-semibold text-gray-900">Wednesdays</span>
            </div>
            <p className="text-sm text-gray-600">Maternal Follow-up Visits</p>
            <p className="text-xs text-gray-500 mt-1">All maternity patients, walk-in basis</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            BHW Station
          </span>
        </div>
      </div>
      <div className="p-4 bg-emerald-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="font-semibold text-gray-900">Thursdays</span>
            </div>
            <p className="text-sm text-gray-600">Child Health Follow-up</p>
            <p className="text-xs text-gray-500 mt-1">All child patients, walk-in basis</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
            BNS Station
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default function MidwifeDashboard() {
  const [stats, setStats] = useState({ 
    newMaternity: 0, 
    newInfant: 0, 
    totalPatients: 0, 
    totalChildren: 0 
  });
  const [requestions, setRequestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const firstDayOfMonth = getStartOfMonth(today);
    const firstDayOfNextMonth = getStartOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
    
    const formatForSupabase = (date) => date.toISOString().split('T')[0];

    try {
      const [
        requestionsRes, 
        newMaternityCountRes, 
        newInfantCountRes,
        totalPatientsRes,
        totalChildrenRes,
        allMaternityRes, 
        allChildRes
      ] = await Promise.all([
        supabase
          .from('requestions')
          .select('*, profiles:worker_id!inner(first_name, last_name, role)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', formatForSupabase(firstDayOfMonth))
          .lt('created_at', formatForSupabase(firstDayOfNextMonth)),
        supabase
          .from('child_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', formatForSupabase(firstDayOfMonth))
          .lt('created_at', formatForSupabase(firstDayOfNextMonth)),
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false),
        supabase
          .from('child_records')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false),
        supabase
          .from('patients')
          .select('created_at')
          .eq('is_deleted', false),
        supabase
          .from('child_records')
          .select('created_at')
          .eq('is_deleted', false)
      ]);
      
      setStats({
        newMaternity: newMaternityCountRes.count || 0,
        newInfant: newInfantCountRes.count || 0,
        totalPatients: totalPatientsRes.count || 0,
        totalChildren: totalChildrenRes.count || 0
      });

      // Chart Data (Last 6 Months)
      const chartData = [];
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthKey = shortMonths[monthDate.getMonth()];
        const monthStart = getStartOfMonth(monthDate);
        const monthEnd = getEndOfMonth(monthDate);
        
        const maternityCount = allMaternityRes.data?.filter(p => {
          const created = new Date(p.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length || 0;

        const childrenCount = allChildRes.data?.filter(c => {
          const created = new Date(c.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length || 0;

        chartData.push({
          month: monthKey,
          monthDate,
          Maternity: maternityCount,
          Children: childrenCount
        });
      }

      setChartData(chartData);
      if (requestionsRes.data) setRequestions(requestionsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchDashboardData(); 
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-7xl w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Midwife Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarIcon />
            <span>{formatDate(new Date(), 'full')}</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<MaternityIcon />}
            count={stats.newMaternity}
            label="New Maternity Cases (This Month)"
            trend={12}
            color="from-blue-50 to-blue-100"
            delay={0.1}
          />
          <StatCard 
            icon={<InfantIcon />}
            count={stats.newInfant}
            label="New Children Records (This Month)"
            trend={8}
            color="from-emerald-50 to-emerald-100"
            delay={0.2}
          />
          <StatCard 
            icon={<UsersIcon />}
            count={stats.totalPatients}
            label="Total Patients"
            trend={5}
            color="from-purple-50 to-purple-100"
            delay={0.3}
          />
          <StatCard 
            icon={<UsersIcon />}
            count={stats.totalChildren}
            label="Total Children"
            trend={15}
            color="from-amber-50 to-amber-100"
            delay={0.4}
          />
        </div>

        {/* Main Content Grid - Takes full width */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsChart data={chartData} />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <FollowUpVisitsWidget />
          </div>
        </div>

        {/* Bottom Row - Takes full width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RequestionsWidget requestions={requestions} />
          <WeeklyScheduleWidget />
        </div>

        {/* Optional: Recent Activity Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Recent System Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Registrations</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.newMaternity + stats.newInfant}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Follow-up Visits</p>
                  <p className="text-2xl font-bold text-gray-800">{isWednesday(new Date()) || isThursday(new Date()) ? "Today" : "Scheduled"}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-800">{requestions.filter(r => r.status === 'Pending').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
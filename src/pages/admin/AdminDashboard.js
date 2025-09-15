import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
const MaternityIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const InfantIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;

// --- WIDGET COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        High: 'bg-green-100 text-green-700',
        Moderate: 'bg-yellow-100 text-yellow-700',
        Low: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const ViewAllStockModal = ({ items, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => 
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Complete Stock Inventory</h2>
                </div>
                <div className="p-4">
                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Search item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr className="text-left text-gray-600">
                                <th className="p-3 font-semibold">Item Name</th>
                                <th className="p-3 font-semibold">Total Quantity</th>
                                <th className="p-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredItems.map(item => (
                                <tr key={item.item_name}>
                                    <td className="p-3 font-semibold text-gray-700">{item.item_name}</td>
                                    <td className="p-3 text-gray-600">{item.quantity} units</td>
                                    <td className="p-3"><StatusBadge status={item.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};


const StatCard = ({ icon, count, label, color }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </div>
);

const StockWidget = ({ items, onSeeAll }) => {
    const getBarColor = (status) => {
        switch (status) {
            case 'Low': return 'bg-red-500';
            case 'Moderate': return 'bg-yellow-400';
            case 'High': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };
    const getBarWidth = (quantity) => {
        if (quantity >= 100) return '100%';
        if (quantity <= 0) return '2%';
        return `${quantity}%`;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700">Stock</h3>
                <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>Low</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></div>Moderate</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>High</span>
                </div>
                <button onClick={onSeeAll} className="text-xs font-semibold text-blue-600 hover:underline">See All</button>
            </div>
            <div className="space-y-3">
                {items.slice(0, 5).map(item => (
                    <div key={item.item_name}>
                        <p className="text-sm font-semibold text-gray-600">{item.item_name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className={`${getBarColor(item.status)} h-2.5 rounded-full`} style={{ width: getBarWidth(item.quantity) }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickAccessWidget = () => ( <div className="bg-white p-4 rounded-lg shadow border flex flex-col space-y-3"> <h3 className="font-bold text-gray-700">Quick Access</h3> <Link to="/admin/employees" className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-blue-700">+ Add New Member</Link> <Link to="/admin/reports" className="w-full text-center bg-orange-500 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-orange-600">Generate Reports</Link> <Link to="/admin/appointments" className="w-full text-center bg-green-500 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-green-600">Scheduled Check-up</Link> </div> );
const RequestionsWidget = ({ requestions }) => ( <div className="bg-white p-4 rounded-lg shadow border"> <div className="flex justify-between items-center mb-3"> <h3 className="font-bold text-gray-700">Requestions</h3> <Link to="/admin/requestions" className="text-xs font-semibold text-blue-600 hover:underline">See All</Link> </div> <div className="overflow-x-auto"> <table className="w-full text-sm"> <thead> <tr className="text-left text-gray-500 font-semibold"> {['BRGY Worker ID', 'Lastname', 'Firstname', 'Role', 'Mobile No.', 'Action'].map(h => <th key={h} className="px-2 py-2">{h}</th>)} </tr> </thead> <tbody className="divide-y"> {requestions.map(req => ( <tr key={req.id} className="text-gray-600"> <td className="px-2 py-2">{req.worker_id}</td> <td className="px-2 py-2">{req.profiles?.last_name || 'N/A'}</td> <td className="px-2 py-2">{req.profiles?.first_name || 'N/A'}</td> <td className="px-2 py-2">{req.profiles?.role || 'N/A'}</td> <td className="px-2 py-2">{req.profiles?.contact_no || 'N/A'}</td> <td className="px-2 py-2"><button className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-md hover:bg-blue-200">Request Details</button></td> </tr> ))} </tbody> </table> </div> </div> );
const CalendarWidget = () => { const [currentDate, setCurrentDate] = useState(new Date()); const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; const changeMonth = (amount) => { setCurrentDate(prevDate => { const newDate = new Date(prevDate); newDate.setMonth(newDate.getMonth() + amount); return newDate; }); }; const generateDates = () => { const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const dates = []; for (let i = 0; i < firstDayOfMonth; i++) { dates.push(<div key={`pad-start-${i}`} className="w-8 h-8"></div>); } for (let i = 1; i <= daysInMonth; i++) { const date = new Date(year, month, i); const isToday = date.toDateString() === new Date().toDateString(); dates.push( <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer ${isToday ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}`}> {i} </div> ); } return dates; }; return ( <div className="bg-white p-4 rounded-lg shadow border"> <div className="flex justify-between items-center mb-3"> <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button> <h3 className="font-bold text-gray-700"> {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} </h3> <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button> </div> <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-semibold"> {daysOfWeek.map(day => <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>)} </div> <div className="grid grid-cols-7 mt-1 gap-y-1 justify-items-center"> {generateDates()} </div> </div> ); };

// --- MAIN ADMIN DASHBOARD COMPONENT ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({ newMaternity: 0, newInfant: 0 }); // Default to 0
    const [stockItems, setStockItems] = useState([]);
    const [requestions, setRequestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);

        // --- NEW: Date logic to get the start and end of the current month ---
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

        const [
            bhwInventoryRes, 
            bnsInventoryRes, 
            requestionsRes,
            // --- NEW: Queries to count new patients this month ---
            newMaternityCountRes,
            newInfantCountRes
        ] = await Promise.all([
            supabase.from('inventory').select('item_name, quantity'),
            supabase.from('bns_inventory').select('item_name, quantity'),
            supabase.from('requestions').select('*, profiles(first_name, last_name, role, contact_no)').limit(5),
            // Query for new maternity patients
            supabase.from('patients').select('*', { count: 'exact', head: true })
                .gte('created_at', firstDayOfMonth)
                .lt('created_at', firstDayOfNextMonth),
            // Query for new infant patients
            supabase.from('child_records').select('*', { count: 'exact', head: true })
                .gte('created_at', firstDayOfMonth)
                .lt('created_at', firstDayOfNextMonth),
        ]);
        
        // --- NEW: Update stats with live data ---
        setStats({
            newMaternity: newMaternityCountRes.count || 0,
            newInfant: newInfantCountRes.count || 0,
        });

        const aggregatedStock = {};
        if (bhwInventoryRes.data) {
            bhwInventoryRes.data.forEach(item => {
                aggregatedStock[item.item_name] = (aggregatedStock[item.item_name] || 0) + item.quantity;
            });
        }
        if (bnsInventoryRes.data) {
            bnsInventoryRes.data.forEach(item => {
                aggregatedStock[item.item_name] = (aggregatedStock[item.item_name] || 0) + item.quantity;
            });
        }
        
        const HIGH_THRESHOLD = 50;
        const MODERATE_THRESHOLD = 20;

        const finalStockList = Object.keys(aggregatedStock).map(name => {
            const quantity = aggregatedStock[name];
            let status = 'Low';
            if (quantity > HIGH_THRESHOLD) {
                status = 'High';
            } else if (quantity > MODERATE_THRESHOLD) {
                status = 'Moderate';
            }
            return { item_name: name, quantity, status };
        }).sort((a, b) => a.quantity - b.quantity);

        setStockItems(finalStockList);

        if (requestionsRes.data) {
            setRequestions(requestionsRes.data);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return <div className="p-6">Loading Admin Dashboard...</div>;
    }

    return (
        <>
            <AnimatePresence>
                {isStockModalOpen && (
                    <ViewAllStockModal 
                        items={stockItems}
                        onClose={() => setIsStockModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                <StockWidget items={stockItems} onSeeAll={() => setIsStockModalOpen(true)} />
                            </div>
                            {/* --- MODIFIED: The 'count' prop now uses the dynamic state --- */}
                            <StatCard icon={<MaternityIcon />} count={stats.newMaternity} label="New Maternity Patient" color="blue" />
                            <StatCard icon={<InfantIcon />} count={stats.newInfant} label="New Infant Patient" color="green" />
                        </div>
                        <RequestionsWidget requestions={requestions} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <QuickAccessWidget />
                        <CalendarWidget />
                    </div>
                </div>
            </div>
        </>
    );
}
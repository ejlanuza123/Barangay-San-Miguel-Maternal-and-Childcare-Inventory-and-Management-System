import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUsageAnalytics } from '../../services/inventoryService';

const UsageAnalytics = () => {
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [daysBack, setDaysBack] = useState(90);
    const [sortBy, setSortBy] = useState('totalDispensed');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', 'Medicines', 'Vaccines', 'Equipment', 'Medical Supplies', 'Nutrition & Feeding', 'Child Hygiene & Care'];

    useEffect(() => {
        fetchAnalytics();
    }, [daysBack]);

    const fetchAnalytics = async () => {
        setLoading(true);
        const data = await getUsageAnalytics(daysBack);
        setAnalytics(data);
        setLoading(false);
    };

    const filteredAnalytics = analytics
        .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
        .sort((a, b) => {
            if (sortBy === 'totalDispensed') return b.totalDispensed - a.totalDispensed;
            if (sortBy === 'timesDispensed') return b.timesDispensed - a.timesDispensed;
            if (sortBy === 'wastageCount') return b.wastageCount - a.wastageCount;
            return 0;
        });

    const topUsed = filteredAnalytics.slice(0, 5);
    const totalDispensedSum = filteredAnalytics.reduce((sum, item) => sum + item.totalDispensed, 0);
    const totalWastageSum = filteredAnalytics.reduce((sum, item) => sum + item.wastageCount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
        >
            {/* Header with Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Usage Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Time Period</label>
                        <select 
                            value={daysBack} 
                            onChange={(e) => setDaysBack(parseInt(e.target.value))}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value={30}>Last 30 days</option>
                            <option value={60}>Last 60 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={180}>Last 6 months</option>
                            <option value={365}>Last year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Sort By</label>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="totalDispensed">Total Quantity</option>
                            <option value="timesDispensed">Times Dispensed</option>
                            <option value="wastageCount">Wastage Count</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Total Items Used</p>
                        <p className="text-2xl font-bold text-blue-600">{filteredAnalytics.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Total Quantity Dispensed</p>
                        <p className="text-2xl font-bold text-green-600">{totalDispensedSum}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Avg Dispense/Item</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {filteredAnalytics.length > 0 ? (totalDispensedSum / filteredAnalytics.length).toFixed(1) : 0}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-xs text-gray-600 font-semibold mb-1">Total Waste Events</p>
                        <p className="text-2xl font-bold text-red-600">{totalWastageSum}</p>
                    </div>
                </div>
            </div>

            {/* Top 5 Used Items */}
            {topUsed.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 5 Most Used Items</h3>
                    <div className="space-y-3">
                        {topUsed.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border"
                            >
                                <div className="text-2xl font-bold text-blue-600 min-w-[40px]">#{index + 1}</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{item.itemName}</p>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">{item.totalDispensed} {item.unit}</p>
                                    <p className="text-xs text-gray-500">{item.timesDispensed} times dispensed</p>
                                </div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.totalDispensed / (topUsed[0]?.totalDispensed || 1)) * 100}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="h-full bg-green-500"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Complete Usage Report</h3>
                {loading ? (
                    <p className="text-center text-gray-500 py-6">Loading analytics...</p>
                ) : filteredAnalytics.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">No usage data found for the selected period.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    <th className="p-3 font-semibold">Item Name</th>
                                    <th className="p-3 font-semibold">Category</th>
                                    <th className="p-3 font-semibold">Current Stock</th>
                                    <th className="p-3 font-semibold text-right">Total Dispensed</th>
                                    <th className="p-3 font-semibold text-right">Times Used</th>
                                    <th className="p-3 font-semibold text-right">Avg/Use</th>
                                    <th className="p-3 font-semibold text-right">Wastage Events</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredAnalytics.map(item => (
                                    <tr key={item.id} className="text-gray-700 hover:bg-gray-50">
                                        <td className="p-3 font-semibold">{item.itemName}</td>
                                        <td className="p-3">{item.category}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                item.currentStock <= 5 ? 'bg-red-100 text-red-700' :
                                                item.currentStock <= 20 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {item.currentStock} {item.unit}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-green-600">{item.totalDispensed}</td>
                                        <td className="p-3 text-right">{item.timesDispensed}</td>
                                        <td className="p-3 text-right">{item.averageUsePerDispense}</td>
                                        <td className="p-3 text-right">
                                            {item.wastageCount > 0 && <span className="text-red-600 font-bold">{item.wastageCount}</span>}
                                            {item.wastageCount === 0 && <span className="text-gray-400">-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default UsageAnalytics;

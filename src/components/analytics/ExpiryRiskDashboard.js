import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExpiryRiskDashboard } from '../../services/inventoryService';

const PriorityBadge = ({ level }) => {
    const styles = {
        critical: 'bg-red-100 text-red-700 border-red-300',
        high: 'bg-orange-100 text-orange-700 border-orange-300',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        low: 'bg-blue-100 text-blue-700 border-blue-300',
        safe: 'bg-green-100 text-green-700 border-green-300'
    };
    return <span className={`px-2 py-1 text-xs font-bold rounded border ${styles[level]}`}>{level.toUpperCase()}</span>;
};

const ExpiryRiskDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState('expiringSoon');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        const data = await getExpiryRiskDashboard();
        setDashboard(data);
        setLoading(false);
    };

    if (loading) {
        return <div className="text-center py-12">Loading expiry risk data...</div>;
    }

    if (!dashboard) {
        return <div className="text-center py-12 text-gray-500">Failed to load data</div>;
    }

    const sections = [
        {
            id: 'expired',
            title: '🔴 EXPIRED',
            items: dashboard.expired,
            priority: 'critical',
            color: 'red',
            icon: '⚠️',
            message: 'Expired items must be quarantined immediately'
        },
        {
            id: 'expiringSoon',
            title: '🟠 EXPIRING SOON (0-7 days)',
            items: dashboard.expiringSoon,
            priority: 'critical',
            color: 'orange',
            icon: '⏰',
            message: 'Use or dispose of these items first (FIFO)'
        },
        {
            id: 'expiringShortTerm',
            title: '🟡 SHORT-TERM (8-30 days)',
            items: dashboard.expiringShortTerm,
            priority: 'high',
            color: 'yellow',
            icon: '📌',
            message: 'Plan usage within next month'
        },
        {
            id: 'expiringMediumTerm',
            title: '🔵 MEDIUM-TERM (31-90 days)',
            items: dashboard.expiringMediumTerm,
            priority: 'medium',
            color: 'blue',
            icon: '📋',
            message: 'Monitor these items'
        },
        {
            id: 'expiringLongTerm',
            title: '✓ SAFE (91+ days)',
            items: dashboard.expiringLongTerm,
            priority: 'low',
            color: 'green',
            icon: '✅',
            message: 'No immediate action needed'
        },
        {
            id: 'noExpiryDate',
            title: '❓ NO EXPIRY DATE',
            items: dashboard.noExpiryDate,
            priority: 'medium',
            color: 'gray',
            icon: '❓',
            message: 'Add expiry dates for proper tracking'
        }
    ];

    const criticalCount = dashboard.expired.length + dashboard.expiringSoon.length;
    const totalItems = Object.values(dashboard).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Expiry Risk Dashboard</h2>
                
                {/* Risk Summary */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-red-50 p-4 rounded-lg border-2 border-red-300 cursor-pointer hover:shadow-lg"
                        onClick={() => setExpandedSection('expired')}
                    >
                        <p className="text-xs text-gray-600 font-semibold mb-1">🔴 Expired</p>
                        <p className="text-3xl font-bold text-red-600">{dashboard.expired.length}</p>
                        <p className="text-[10px] text-red-500 mt-1">Immediate action</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300 cursor-pointer hover:shadow-lg"
                        onClick={() => setExpandedSection('expiringSoon')}
                    >
                        <p className="text-xs text-gray-600 font-semibold mb-1">🟠 1-7 Days</p>
                        <p className="text-3xl font-bold text-orange-600">{dashboard.expiringSoon.length}</p>
                        <p className="text-[10px] text-orange-500 mt-1">This week</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 cursor-pointer hover:shadow-lg"
                        onClick={() => setExpandedSection('expiringShortTerm')}
                    >
                        <p className="text-xs text-gray-600 font-semibold mb-1">🟡 8-30 Days</p>
                        <p className="text-3xl font-bold text-yellow-600">{dashboard.expiringShortTerm.length}</p>
                        <p className="text-[10px] text-yellow-500 mt-1">Next month</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 cursor-pointer hover:shadow-lg"
                        onClick={() => setExpandedSection('expiringMediumTerm')}
                    >
                        <p className="text-xs text-gray-600 font-semibold mb-1">🔵 31-90 Days</p>
                        <p className="text-3xl font-bold text-blue-600">{dashboard.expiringMediumTerm.length}</p>
                        <p className="text-[10px] text-blue-500 mt-1">Monitor</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-green-50 p-4 rounded-lg border-2 border-green-300 cursor-pointer hover:shadow-lg"
                        onClick={() => setExpandedSection('expiringLongTerm')}
                    >
                        <p className="text-xs text-gray-600 font-semibold mb-1">✓ Safe</p>
                        <p className="text-3xl font-bold text-green-600">{dashboard.expiringLongTerm.length}</p>
                        <p className="text-[10px] text-green-500 mt-1">91+ days</p>
                    </motion.div>
                </div>

                {/* Alert Banner */}
                {criticalCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-100 border-2 border-red-300 rounded-lg p-4"
                    >
                        <p className="text-red-700 font-bold">⚠️ CRITICAL: {criticalCount} item(s) require immediate attention</p>
                        <p className="text-red-600 text-sm mt-1">Please review expired and soon-to-expire items below.</p>
                    </motion.div>
                )}
            </div>

            {/* Expandable Sections */}
            <AnimatePresence>
                {sections.map((section) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-lg shadow-sm border overflow-hidden"
                    >
                        <motion.button
                            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            className={`w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors ${
                                ['red', 'orange'].includes(section.color) ? 'bg-red-50' :
                                section.color === 'yellow' ? 'bg-yellow-50' :
                                section.color === 'blue' ? 'bg-blue-50' :
                                'bg-green-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{section.icon}</span>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-800">{section.title}</h3>
                                    <p className="text-xs text-gray-600">{section.message}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-2xl font-bold ${
                                    section.color === 'red' ? 'text-red-600' :
                                    section.color === 'orange' ? 'text-orange-600' :
                                    section.color === 'yellow' ? 'text-yellow-600' :
                                    section.color === 'blue' ? 'text-blue-600' :
                                    'text-green-600'
                                }`}>
                                    {section.items.length}
                                </span>
                                <motion.div
                                    animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    ∨
                                </motion.div>
                            </div>
                        </motion.button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {expandedSection === section.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t"
                                >
                                    {section.items.length === 0 ? (
                                        <p className="p-6 text-center text-gray-500">No items in this category.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50">
                                                    <tr className="text-left text-gray-600">
                                                        <th className="p-3 font-semibold">Item Name</th>
                                                        <th className="p-3 font-semibold">Category</th>
                                                        <th className="p-3 font-semibold">Batch No</th>
                                                        <th className="p-3 font-semibold">Stock</th>
                                                        <th className="p-3 font-semibold">Expiry Date</th>
                                                        {section.id === 'expired' && <th className="p-3 font-semibold text-right">Days Overdue</th>}
                                                        {section.id !== 'noExpiryDate' && section.id !== 'expired' && <th className="p-3 font-semibold text-right">Days Remaining</th>}
                                                        <th className="p-3 font-semibold">Supplier</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {section.items.map((item) => (
                                                        <motion.tr
                                                            key={item.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <td className="p-3 font-semibold">{item.item_name}</td>
                                                            <td className="p-3 text-xs">{item.category}</td>
                                                            <td className="p-3 text-xs">{item.batch_no || '-'}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                                    item.quantity <= 5 ? 'bg-red-100 text-red-700' :
                                                                    item.quantity <= 20 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {item.quantity} {item.unit || 'pc'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">{item.expiry_date || '-'}</td>
                                                            {section.id === 'expired' && (
                                                                <td className="p-3 text-right">
                                                                    <span className="text-red-600 font-bold">{item.daysOverdue} days</span>
                                                                </td>
                                                            )}
                                                            {section.id !== 'noExpiryDate' && section.id !== 'expired' && (
                                                                <td className="p-3 text-right">
                                                                    <span className={`font-bold ${
                                                                        item.daysRemaining <= 7 ? 'text-red-600' :
                                                                        item.daysRemaining <= 30 ? 'text-orange-600' :
                                                                        'text-blue-600'
                                                                    }`}>
                                                                        {item.daysRemaining} days
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td className="p-3 text-xs">{item.supply_source || '-'}</td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* FIFO Recommendations */}
            {(dashboard.expired.length > 0 || dashboard.expiringSoon.length > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg"
                >
                    <h3 className="font-bold text-blue-900 mb-3">💡 FIFO (First-In-First-Out) Recommendations</h3>
                    <ul className="space-y-2 text-sm text-blue-900">
                        <li>• <strong>Prioritize usage:</strong> Dispense expired and soon-to-expire items first</li>
                        <li>• <strong>Bulk dispose:</strong> Group expired items for safe disposal procedures</li>
                        <li>• <strong>Notification:</strong> Alert healthcare providers of upcoming shortages</li>
                        <li>• <strong>Reorder:</strong> Plan restocking for items nearing expiry</li>
                    </ul>
                </motion.div>
            )}
        </motion.div>
    );
};

export default ExpiryRiskDashboard;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// --- ICONS ---
const MaternityIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const InfantIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const StockIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>;
const ReportIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const UserAddIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>;

// --- HELPER FUNCTIONS ---
const getQuarterMonths = (q) => {
    return [
        [0, 1, 2],    // Q1: Jan, Feb, Mar
        [3, 4, 5],    // Q2: Apr, May, Jun
        [6, 7, 8],    // Q3: Jul, Aug, Sep
        [9, 10, 11]   // Q4: Oct, Nov, Dec
    ][q - 1];
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StatusBadge = ({ status }) => {
    const styles = {
        High: 'bg-green-100 text-green-700 border-green-200',
        Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Low: 'bg-red-100 text-red-700 border-red-200',
        Normal: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const Status = ({ status }) => {
    const styles = {
        Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Approved: 'bg-green-100 text-green-700 border-green-200',
        Denied: 'bg-red-100 text-red-700 border-red-200',
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

// --- WIDGET COMPONENTS ---

const RequestDetailsModal = ({ request, onClose }) => {
    const formatKey = (key) => {
        return key.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Request Details <span className="text-blue-600">(REQ-{request.id})</span>
                            </h2>
                            <p className="text-gray-600">View and manage request information</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Requester Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2 text-lg">Requester Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                                    {request.profiles?.first_name?.[0]}{request.profiles?.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {request.profiles?.first_name} {request.profiles?.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">{request.profiles?.role}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">User ID:</span>
                                    <span className="font-semibold text-gray-800">{request.profiles?.user_id_no || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Contact No:</span>
                                    <span className="font-semibold text-gray-800">{request.profiles?.contact_no || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Request Date:</span>
                                    <span className="font-semibold text-gray-800">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Request Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2 text-lg">Request Information</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Request Type</p>
                                    <p className="font-semibold text-gray-800">{request.request_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Target Table</p>
                                    <p className="font-semibold text-gray-800">{request.target_table}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Target Record ID</p>
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded-lg">{request.target_record_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Status</p>
                                <div className="mt-1">
                                    <Status status={request.status} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Request Data Section */}
                    {request.request_type === 'Update' && request.request_data && (
                        <div className="md:col-span-2">
                            <h3 className="font-bold text-gray-700 border-b pb-2 text-lg mb-4">Proposed Changes</h3>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(request.request_data).map(([key, value]) => {
                                        if (typeof value === 'object' || !value) return null;
                                        return (
                                            <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-500 mb-1">{formatKey(key)}</p>
                                                <p className="font-semibold text-gray-800">{String(value)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const StatCard = ({ icon, count, label, color }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300"
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 mb-1">{label}</p>
                <p className="text-3xl font-bold text-gray-800">{count}</p>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                {icon}
            </div>
        </div>
    </motion.div>
);

const StockWidget = ({ items, onSeeAll }) => {
    const getBarColor = (status) => {
        switch (status) {
            case 'Low': return 'bg-red-500';
            case 'Moderate': return 'bg-yellow-400';
            case 'High': return 'bg-green-500';
            case 'Normal': return 'bg-blue-500';
            default: return 'bg-gray-300';
        }
    };

    const getBarWidth = (quantity) => {
        if (quantity >= 100) return '100%';
        if (quantity <= 0) return '2%';
        return `${Math.min(quantity, 100)}%`;
    };

    const getStatusCounts = () => {
        const counts = { High: 0, Moderate: 0, Low: 0, Normal: 0 };
        items.forEach(item => {
            if (counts[item.status] !== undefined) {
                counts[item.status]++;
            }
        });
        return counts;
    };

    const statusCounts = getStatusCounts();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <StockIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Stock Inventory</h3>
                </div>
                <button 
                    onClick={onSeeAll}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                    View All →
                </button>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full mb-1 ${getBarColor(status)}`}></div>
                        <span className="text-xs text-gray-600">{status}</span>
                        <span className="text-sm font-bold text-gray-800">{count}</span>
                    </div>
                ))}
            </div>

            {/* Top Items */}
            <div className="space-y-3">
                {items.slice(0, 4).map(item => (
                    <div key={item.id || item.item_name} className="group">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-gray-700 truncate">{item.item_name}</span>
                            <span className="text-xs font-bold text-gray-800">{item.quantity} {item.unit || 'pcs'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className={`${getBarColor(item.status)} h-1.5 rounded-full transition-all duration-500`}
                                style={{ width: getBarWidth(item.quantity) }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">{item.category}</span>
                            <StatusBadge status={item.status} />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const QuickAccessWidget = ({ onReportsClick }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
    >
        <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Access</h3>
        <div className="space-y-3">
            <Link to="/admin/employees" className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm hover:shadow-md">
                <UserAddIcon />
                <span>Add New Member</span>
            </Link>
            <button onClick={onReportsClick} className="w-full flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold p-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-sm hover:shadow-md">
                <ReportIcon />
                <span>Generate Reports</span>
            </button>
        </div>
    </motion.div>
);

const RequestionsWidget = ({ requestions, onViewDetails }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
    >
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Pending Requests</h3>
            </div>
            <Link to="/admin/requestions" className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All →
            </Link>
        </div>
        
        <div className="space-y-3">
            {requestions.slice(0, 3).map(req => (
                <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl transition-colors duration-200"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-800">
                                    {req.profiles?.first_name} {req.profiles?.last_name}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                                    {req.profiles?.role}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>ID: {req.profiles?.user_id_no || 'N/A'}</span>
                                <span>•</span>
                                <span>{req.request_type} Request</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Status status={req.status} />
                            <button 
                                onClick={() => onViewDetails(req)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

// --- MODAL COMPONENTS ---

const ViewAllStockModal = ({ items, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];
    
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            
            return matchesSearch && matchesCategory && matchesStatus;
        }).sort((a, b) => b.quantity - a.quantity);
    }, [items, searchTerm, categoryFilter, statusFilter]);

    const getStockStats = () => {
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStock = items.filter(item => item.status === 'Low').length;
        
        return { totalItems, totalQuantity, lowStock };
    };

    const stats = getStockStats();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Complete Stock Inventory</h2>
                            <p className="text-gray-600">Real-time stock levels and monitoring</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-700 mb-1">Total Items</p>
                                    <p className="text-2xl font-bold text-blue-800">{stats.totalItems}</p>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-700 mb-1">Total Quantity</p>
                                    <p className="text-2xl font-bold text-green-800">{stats.totalQuantity} pcs</p>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-700 mb-1">Low Stock Items</p>
                                    <p className="text-2xl font-bold text-red-800">{stats.lowStock}</p>
                                </div>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by item name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                        </div>
                        
                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full md:w-auto px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full md:w-auto px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                {['All', 'High', 'Moderate', 'Low', 'Normal'].map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr className="text-left text-gray-600 font-semibold">
                                {['Item Name', 'Category', 'SKU/Batch', 'Quantity', 'Unit', 'Status', 'Supplier', 'Expiry'].map(h => (
                                    <th key={h} className="p-3 border-b border-gray-200">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => (
                                    <motion.tr 
                                        key={item.id || item.item_name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-800">{item.item_name}</div>
                                        </td>
                                        <td className="p-3 text-gray-600">{item.category || 'Uncategorized'}</td>
                                        <td className="p-3">
                                            <div className="space-y-1">
                                                <div className="font-mono text-xs text-gray-500">{item.sku || 'No SKU'}</div>
                                                {item.batch_no && <div className="text-xs text-gray-400">Batch: {item.batch_no}</div>}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-gray-800">{item.quantity || 0}</div>
                                        </td>
                                        <td className="p-3 text-gray-600">{item.unit || 'pcs'}</td>
                                        <td className="p-3">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="p-3 text-gray-600">{item.supplier || 'N/A'}</td>
                                        <td className="p-3 text-gray-600">
                                            {item.expiration_date || item.expiry_date || 'No expiry'}
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                            </svg>
                                            <p>No items found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{filteredItems.length}</span> of <span className="font-semibold">{items.length}</span> items
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const GenerateReportsModal = ({ onClose }) => {
    const [reportType, setReportType] = useState(null);
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const { addNotification } = useNotification();

    const fetchAllData = useCallback(async (type) => {
        setLoading(true);
        try {
            if (type === 'BHW') {
                const [patientsRes, inventoryRes] = await Promise.all([
                    supabase.from('patients').select('*').eq('is_deleted', false),
                    supabase.from('inventory').select('*').eq('is_deleted', false)
                ]);
                setAllData({
                    main: patientsRes.data || [],
                    inventory: inventoryRes.data || []
                });
            } else if (type === 'BNS') {
                const [childrenRes, inventoryRes] = await Promise.all([
                    supabase.from('child_records').select('*').eq('is_deleted', false),
                    supabase.from('bns_inventory').select('*').eq('is_deleted', false)
                ]);
                setAllData({
                    main: childrenRes.data || [],
                    inventory: inventoryRes.data || []
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            addNotification('Error loading report data', 'error');
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (reportType) {
            fetchAllData(reportType);
        }
    }, [reportType, fetchAllData]);

    const quarterlyReports = useMemo(() => {
        if (!allData) return [];
        
        const currentYearData = {
            main: allData.main.filter(item => 
                new Date(item.created_at).getFullYear() === currentYear
            ),
            inventory: allData.inventory.filter(item => 
                new Date(item.created_at).getFullYear() === currentYear
            )
        };

        return [1, 2, 3, 4].map(q => {
            const months = getQuarterMonths(q);
            
            const quarterMain = currentYearData.main.filter(item => 
                months.includes(new Date(item.created_at).getMonth())
            ).length;
            
            const quarterInventory = currentYearData.inventory.filter(item => 
                months.includes(new Date(item.created_at).getMonth())
            ).length;

            const quarterData = [
                ...currentYearData.main.filter(item => 
                    months.includes(new Date(item.created_at).getMonth())
                ),
                ...currentYearData.inventory.filter(item => 
                    months.includes(new Date(item.created_at).getMonth())
                )
            ];

            return { 
                id: q, 
                name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`, 
                year: currentYear, 
                reportType: reportType,
                size: formatBytes(JSON.stringify(quarterData).length),
                stats: `${quarterMain} ${reportType === 'BHW' ? 'Patients' : 'Children'}, ${quarterInventory} Inventory Items`
            };
        });
    }, [allData, reportType, currentYear]);

    const generateQuarterReport = async (quarter) => {
        setIsGenerating(true);
        
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const months = getQuarterMonths(quarter.id);
            
            // Filter data for the quarter
            const quarterData = {
                main: allData.main.filter(item => {
                    const date = new Date(item.created_at);
                    return months.includes(date.getMonth()) && date.getFullYear() === currentYear;
                }),
                inventory: allData.inventory.filter(item => {
                    const date = new Date(item.created_at);
                    return months.includes(date.getMonth()) && date.getFullYear() === currentYear;
                })
            };

            // Header
            doc.setFontSize(16).setFont(undefined, 'bold').text(
                `${reportType} ${reportType === 'BHW' ? 'Maternal Health' : 'Child Nutrition'} Report`,
                pageWidth / 2, 20, { align: "center" }
            );
            doc.setFontSize(12).setFont(undefined, 'normal').text(
                `${quarter.name} ${quarter.year}`,
                pageWidth / 2, 28, { align: "center" }
            );
            doc.setFontSize(10).text(
                `Generated on: ${new Date().toLocaleDateString()}`,
                pageWidth / 2, 35, { align: "center" }
            );

            // Analytics Section
            doc.setFontSize(12).setTextColor(41, 128, 185).text("Analytics Summary", 15, 50);
            doc.setTextColor(0, 0, 0);
            
            const stats = [
                [`Total ${reportType === 'BHW' ? 'Patients' : 'Children'}`, quarterData.main.length],
                ['Total Inventory Items', quarterData.inventory.length]
            ];

            autoTable(doc, {
                startY: 55,
                theme: 'grid',
                head: [['Metric', 'Count']],
                body: stats,
                styles: { fontSize: 10, cellPadding: 6 },
                headStyles: { fillColor: [41, 128, 185] }
            });

            // Main Data Table
            let currentY = doc.lastAutoTable.finalY + 15;
            
            if (reportType === 'BHW') {
                doc.setFontSize(12).setTextColor(41, 128, 185).text("Maternal Patient Records", 15, currentY);
                
                const patientRows = quarterData.main.map(p => [
                    p.patient_id,
                    `${p.last_name}, ${p.first_name}`,
                    p.age,
                    p.purok,
                    p.risk_level,
                    new Date(p.created_at).toLocaleDateString()
                ]);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['ID', 'Name', 'Age', 'Purok', 'Risk Level', 'Registration Date']],
                    body: patientRows,
                    theme: 'striped',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [41, 128, 185] }
                });
            } else {
                doc.setFontSize(12).setTextColor(39, 174, 96).text("Child Health Records", 15, currentY);
                
                const childRows = quarterData.main.map(c => [
                    c.child_id,
                    `${c.last_name}, ${c.first_name}`,
                    c.sex,
                    c.weight_kg || 'N/A',
                    c.nutrition_status || 'N/A',
                    new Date(c.created_at).toLocaleDateString()
                ]);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['ID', 'Name', 'Sex', 'Weight', 'Status', 'Registration Date']],
                    body: childRows,
                    theme: 'striped',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [39, 174, 96] }
                });
            }

            // Inventory Table
            currentY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(12).setTextColor(230, 126, 34).text("Inventory Records", 15, currentY);
            
            const inventoryRows = quarterData.inventory.map(i => [
                i.item_name,
                i.category || 'Uncategorized',
                i.quantity,
                i.unit || 'pcs',
                i.status || 'Normal',
                i.supplier || 'N/A'
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Item Name', 'Category', 'Quantity', 'Unit', 'Status', 'Supplier']],
                body: inventoryRows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [230, 126, 34] }
            });

            // Footer
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            doc.save(`${reportType}_Report_${quarter.name}_${quarter.year}.pdf`);
            addNotification('PDF report generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating report:', error);
            addNotification('Error generating report', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToExcel = async (quarter) => {
        setIsGenerating(true);
        
        try {
            const months = getQuarterMonths(quarter.id);
            
            const quarterData = {
                main: allData.main.filter(item => {
                    const date = new Date(item.created_at);
                    return months.includes(date.getMonth()) && date.getFullYear() === currentYear;
                }),
                inventory: allData.inventory.filter(item => {
                    const date = new Date(item.created_at);
                    return months.includes(date.getMonth()) && date.getFullYear() === currentYear;
                })
            };

            // Create workbook with multiple sheets
            const wb = XLSX.utils.book_new();
            
            // Main data sheet
            const mainWs = XLSX.utils.json_to_sheet(quarterData.main);
            XLSX.utils.book_append_sheet(wb, mainWs, reportType === 'BHW' ? 'Patients' : 'Children');
            
            // Inventory sheet
            const inventoryWs = XLSX.utils.json_to_sheet(quarterData.inventory);
            XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory');
            
            // Summary sheet
            const summaryData = [[
                'Report Type',
                'Period',
                'Year',
                'Total Records',
                'Inventory Items'
            ], [
                reportType,
                quarter.name,
                quarter.year,
                quarterData.main.length,
                quarterData.inventory.length
            ]];
            
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            // Write file
            XLSX.writeFile(wb, `${reportType}_Report_${quarter.name}_${quarter.year}.xlsx`);
            addNotification('Excel report exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            addNotification('Error exporting report', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            {isGenerating && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60]">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="font-semibold text-gray-800">Generating Report...</p>
                        <p className="text-sm text-gray-500">Please wait</p>
                    </div>
                </div>
            )}
            
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Generate Reports</h2>
                                <p className="text-gray-600">Create comprehensive reports for BHW and BNS</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Report Type Selection */}
                        {!reportType ? (
                            <div className="mt-6 text-center">
                                <p className="text-gray-600 mb-4">Select which type of report you would like to generate:</p>
                                <div className="flex flex-col md:flex-row gap-4 justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setReportType('BHW')}
                                        className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        <span>BHW Reports (Maternal Health)</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setReportType('BNS')}
                                        className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-sm hover:shadow-md"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                                        </svg>
                                        <span>BNS Reports (Child Nutrition)</span>
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setReportType(null);
                                            setAllData(null);
                                        }}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                        </svg>
                                        Back to Selection
                                    </button>
                                    <span className="text-gray-400">/</span>
                                    <span className="font-semibold text-gray-800">
                                        {reportType} Reports - {currentYear}
                                    </span>
                                </div>
                                
                                {/* Year Selector */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-2">
                                    <button
                                        onClick={() => setCurrentYear(y => y - 1)}
                                        className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>
                                    <span className="px-2 font-bold text-gray-700">{currentYear}</span>
                                    <button
                                        onClick={() => setCurrentYear(y => y + 1)}
                                        className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        {!reportType ? null : loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-500">Loading report data...</p>
                            </div>
                        ) : quarterlyReports.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <p className="text-gray-500">No data available for {currentYear}</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 font-semibold">
                                        <th className="p-3 border-b border-gray-200">Quarter</th>
                                        <th className="p-3 border-b border-gray-200">Year</th>
                                        <th className="p-3 border-b border-gray-200">Report Type</th>
                                        <th className="p-3 border-b border-gray-200">Data Summary</th>
                                        <th className="p-3 border-b border-gray-200">File Size</th>
                                        <th className="p-3 border-b border-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quarterlyReports.map(report => (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <div className="font-semibold text-gray-800">{report.name}</div>
                                            </td>
                                            <td className="p-3 text-gray-700 font-medium">{report.year}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    report.reportType === 'BHW' 
                                                        ? 'bg-blue-100 text-blue-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {report.reportType}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">{report.stats}</td>
                                            <td className="p-3 text-gray-500">{report.size}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => generateQuarterReport(report)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                                        </svg>
                                                        PDF
                                                    </button>
                                                    <button
                                                        onClick={() => exportToExcel(report)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors"
                                                        title="Download Excel"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                        Excel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

// Keep RequestDetailsModal component (same as before)...

// --- MAIN ADMIN DASHBOARD COMPONENT ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({ 
        newMaternity: 0, 
        newInfant: 0,
        totalRequests: 0,
        processedToday: 0
    });
    const [stockItems, setStockItems] = useState([]);
    const [requestions, setRequestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const { addNotification } = useNotification();

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        try {
            const [
                bhwInventoryRes, 
                bnsInventoryRes, 
                requestionsRes,
                newMaternityCountRes,
                newInfantCountRes,
                processedTodayRes
            ] = await Promise.all([
                supabase.from('inventory').select('*').eq('is_deleted', false),
                supabase.from('bns_inventory').select('*').eq('is_deleted', false),
                supabase.from('requestions')
                    .select('*, profiles:worker_id!inner(first_name, last_name, role, user_id_no, contact_no)')
                    .eq('status', 'Pending')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('patients').select('*', { count: 'exact', head: true })
                    .eq('is_deleted', false)
                    .gte('created_at', firstDayOfMonth)
                    .lt('created_at', firstDayOfNextMonth),
                supabase.from('child_records').select('*', { count: 'exact', head: true })
                    .eq('is_deleted', false)
                    .gte('created_at', firstDayOfMonth)
                    .lt('created_at', firstDayOfNextMonth),
                supabase.from('requestions')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['Approved', 'Denied'])
                    .gte('created_at', todayStart)
                    .lt('created_at', todayEnd)
            ]);

            // Combine inventory from both tables and calculate accurate status
            const allInventory = [
                ...(bhwInventoryRes.data || []).map(item => ({
                    ...item,
                    type: 'BHW',
                    status: calculateInventoryStatus(item.quantity)
                })),
                ...(bnsInventoryRes.data || []).map(item => ({
                    ...item,
                    type: 'BNS',
                    status: calculateInventoryStatus(item.quantity)
                }))
            ];

            // Sort by quantity (lowest first for critical items)
            allInventory.sort((a, b) => a.quantity - b.quantity);

            setStats({
                newMaternity: newMaternityCountRes.count || 0,
                newInfant: newInfantCountRes.count || 0,
                totalRequests: requestionsRes.data?.length || 0,
                processedToday: processedTodayRes.count || 0
            });

            setStockItems(allInventory);

            if (requestionsRes.data) {
                setRequestions(requestionsRes.data);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            addNotification('Error loading dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    const calculateInventoryStatus = (quantity) => {
        if (!quantity && quantity !== 0) return 'Normal';
        if (quantity === 0) return 'Low';
        if (quantity < 10) return 'Low';
        if (quantity < 30) return 'Moderate';
        if (quantity < 50) return 'Normal';
        return 'High';
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
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
                {selectedRequest && <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
                {isReportsModalOpen && <GenerateReportsModal onClose={() => setIsReportsModalOpen(false)} />}
            </AnimatePresence>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                            <p className="text-gray-600">System overview and management</p>
                        </div>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-blue-200 rounded-full mt-2"></div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard 
                        icon={<MaternityIcon />}
                        count={stats.newMaternity}
                        label="New Maternity Patients (This Month)"
                        color="text-blue-500"
                    />
                    <StatCard 
                        icon={<InfantIcon />}
                        count={stats.newInfant}
                        label="New Child Patients (This Month)"
                        color="text-green-500"
                    />
                    <StatCard 
                        icon={
                            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        }
                        count={stats.totalRequests}
                        label="Pending Requests"
                        color="text-purple-500"
                    />
                    <StatCard 
                        icon={
                            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        }
                        count={stats.processedToday}
                        label="Requests Processed Today"
                        color="text-orange-500"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <StockWidget 
                            items={stockItems} 
                            onSeeAll={() => setIsStockModalOpen(true)} 
                        />
                        <RequestionsWidget 
                            requestions={requestions}
                            onViewDetails={setSelectedRequest}
                        />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <QuickAccessWidget 
                            onReportsClick={() => setIsReportsModalOpen(true)}
                        />
                        
                        {/* System Status Widget */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
                        >
                            <h3 className="font-bold text-gray-800 text-lg mb-4">System Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Database</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        Online
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">API Services</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Users Online</span>
                                    <span className="text-sm font-bold text-gray-800">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Last Backup</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
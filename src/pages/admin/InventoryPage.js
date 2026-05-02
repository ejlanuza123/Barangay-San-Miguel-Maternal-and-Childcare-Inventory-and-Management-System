import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; 
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';
import { getExpiryStatus, needsReordering, getInventoryMovements, getUsageAnalytics, getInventoryStockStatus } from '../../services/inventoryService';
import AddInventoryModal from '../bhw/AddInventoryModal'; 
import AddBnsInventoryModal from '../bns/AddBnsInventoryModal'; 
import { useAuth } from '../../context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import UsageAnalytics from '../../components/analytics/UsageAnalytics';
import ExpiryRiskDashboard from '../../components/analytics/ExpiryRiskDashboard';
import EnhancedRefillModal from '../../components/reusables/EnhancedRefillModal';

// --- Import your logo images ---
import leftLogo from '../../assets/leftLogo.png';
import rightLogo from '../../assets/logo.png';
import barangayLogo from '../../assets/logo.png';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const RefillIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReportIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        Normal: 'bg-green-100 text-green-700',
        Low: 'bg-yellow-100 text-yellow-700',
        Critical: 'bg-red-100 text-red-700',
    };
    const normalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Normal';
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${styles[normalizedStatus] || 'bg-gray-100'}`}>{normalizedStatus}</span>;
};

const QuantityCell = ({ quantity, unit, status }) => {
    const getStatusInfo = () => {
        const s = (status || '').toLowerCase();
        if (s === 'critical') return { label: 'Critical', color: 'bg-red-500', width: Math.min(quantity, 100) };
        if (s === 'low') return { label: 'Low', color: 'bg-yellow-400', width: Math.min(quantity, 100) };
        return { label: 'Normal', color: 'bg-green-500', width: Math.min(quantity, 100) };
    };

    const { label, color, width } = getStatusInfo();

    return (
        <div className="text-xs w-32">
            <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-800">{quantity} {unit}</span>
                <span className={`px-1.5 rounded-full text-[10px] font-semibold text-white ${label === 'Normal' ? 'bg-green-500' : label === 'Low' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {label}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${width}%` }}></div>
            </div>
        </div>
    );
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border h-fit">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
        <div className="space-y-2 text-sm">
            <div className="border-b pb-2 mb-2">
                <p className="font-semibold text-gray-700 text-xs">Stock Status</p>
            </div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full mr-2 bg-green-500"></div><span>Normal Stock</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full mr-2 bg-yellow-400"></div><span>Low Stock</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full mr-2 bg-red-500"></div><span>Critical Stock</span></div>

            <div className="border-b pb-2 my-2"></div>
            <div className="border-b pb-2 mb-2">
                <p className="font-semibold text-gray-700 text-xs">Expiry Alerts</p>
            </div>
            <div className="flex items-center"><span className="mr-2">🔴</span><span>Expired</span></div>
            <div className="flex items-center"><span className="mr-2">🟠</span><span>Expiring Soon (7 days)</span></div>
            <div className="flex items-center"><span className="mr-2">🟡</span><span>Expiring in 30 days</span></div>

            <div className="border-b pb-2 my-2"></div>
            <div className="border-b pb-2 mb-2">
                <p className="font-semibold text-gray-700 text-xs">Inventory Alerts</p>
            </div>
            <div className="flex items-center"><span className="mr-2">⛔</span><span>Critical Stock (≤5)</span></div>
            <div className="flex items-center"><span className="mr-2">⚠️</span><span>Low Stock / Reorder</span></div>
        </div>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPaginationItems = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

        const delta = 1;
        const left = currentPage - delta;
        const right = currentPage + delta;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                range.push(i);
            }
        }

        for (const i of range) {
            if (l) {
                if (i - l === 2) rangeWithDots.push(l + 1);
                else if (i - l !== 1) rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    const paginationItems = getPaginationItems();

    return (
        <nav className="mt-4 overflow-x-auto">
            <div className="flex min-w-max items-center justify-center space-x-1 text-xs px-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&lt;</button>
            {paginationItems.map((item, index) =>
                item === '...' ? (
                    <span key={`dots-${index}`} className="px-2 py-1 text-gray-500">...</span>
                ) : (
                    <button key={`page-${item}`} onClick={() => onPageChange(item)} className={`px-3 py-1 rounded ${currentPage === item ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}`}>
                        {item}
                    </button>
                )
            )}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&gt;</button>
            </div>
        </nav>
    );
};



const ViewItemDetailsModal = ({ item, onClose }) => {
    const [movements, setMovements] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchMovements = async () => {
            if(!item) return;
            
            // Try to get inventory movements first
            const { data: movementsData, error: movementsError } = await supabase
                .from('inventory_movements')
                .select('*, profiles(full_name, role)')
                .eq('inventory_id', item.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if(!movementsError && movementsData) {
                setMovements(movementsData);
            } else {
                // Fallback to activity log if no movements
                const { data: activityData } = await supabase
                    .from('activity_log')
                    .select('*, profiles(first_name, last_name, role)')
                    .ilike('details', `%${item.item_name}%`)
                    .order('created_at', { ascending: false });
                
                setMovements(activityData || []);
            }
            
            setLoadingHistory(false);
        };
        fetchMovements();
    }, [item]);

    const getMovementColor = (type) => {
        switch(type) {
            case 'IN': return 'bg-green-50 border-green-200';
            case 'OUT': return 'bg-blue-50 border-blue-200';
            case 'ADJUSTMENT': return 'bg-yellow-50 border-yellow-200';
            case 'WASTE': return 'bg-red-50 border-red-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getMovementIcon = (type) => {
        switch(type) {
            case 'IN': return '📥';
            case 'OUT': return '📤';
            case 'ADJUSTMENT': return '⚙️';
            case 'WASTE': return '🗑️';
            default: return '📋';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <div className="border-b pb-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-800">{item.item_name}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                        <p><span className="font-semibold">SKU:</span> {item.sku || 'N/A'}</p>
                        <p><span className="font-semibold">Category:</span> {item.category}</p>
                        <p><span className="font-semibold">Current Stock:</span> {item.quantity} {item.unit}</p>
                        <p><span className="font-semibold">Batch No:</span> {item.batch_no || 'N/A'}</p>
                        <p><span className="font-semibold">Expiry:</span> {item.expiry_date || 'N/A'}</p>
                        <p><span className="font-semibold">Supply Source:</span> {item.supply_source || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md p-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 sticky top-0">Stock Movement History</p>
                    {loadingHistory ? (
                        <p className="text-xs text-center text-gray-500 py-4">Loading history...</p>
                    ) : movements.length === 0 ? (
                        <p className="text-xs text-center text-gray-500 py-4">No movement history found.</p>
                    ) : (
                        movements.map(movement => (
                            <div key={movement.id} className={`text-xs bg-white p-3 rounded border ${getMovementColor(movement.movement_type || 'default')}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getMovementIcon(movement.movement_type)}</span>
                                        <span className="font-bold text-gray-800">{movement.movement_type || movement.action || 'Activity'}</span>
                                        {movement.quantity_change && (
                                            <span className={`font-semibold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gray-400">{new Date(movement.created_at).toLocaleDateString()}</span>
                                </div>
                                {movement.reason && (
                                    <p className="text-gray-700 mb-1"><strong>Reason:</strong> {movement.reason}</p>
                                )}
                                {movement.details && (
                                    <p className="text-gray-700 mb-1">{movement.details}</p>
                                )}
                                {movement.quantity_before !== undefined && (
                                    <p className="text-gray-600"><strong>Before:</strong> {movement.quantity_before} → <strong>After:</strong> {movement.quantity_after}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
}

// --- NEW: Inventory Report Section with PDF Generation ---


export default function AdminInventoryPage() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'Admin';
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const { addNotification } = useNotification();
    const [showReport, setShowReport] = useState(false);

    const fetchInventories = useCallback(async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('item_name', { ascending: true });
        
        // Fetch usage analytics
        const usageAnalytics = await getUsageAnalytics(90);
        const usageMap = Object.fromEntries((usageAnalytics || []).map((item) => [item.id, item]));
        
        if (error) {
            console.error('Error fetching inventory:', error);
            addNotification('Error loading inventory', 'error');
        } else {
            // Add usage data to items
            const itemsWithUsage = (data || []).map(item => ({
                ...item,
                averageDailyUsage: usageMap[item.id]?.averageUsePerDispense || 0
            }));
            setAllItems(itemsWithUsage);
        }
        
        setLoading(false);
    }, [addNotification]);

    useEffect(() => {
        fetchInventories();
    }, [fetchInventories]);

    const handleEdit = (item) => {
        setSelectedItem(item);
        // Check owner_role
        setModalMode(item.owner_role === 'BNS' ? 'edit-bns' : 'edit-bhw');
    };

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = 
                item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [allItems, searchTerm, activeCategory]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        return filteredItems.slice(from, to);
    }, [filteredItems, currentPage, itemsPerPage]);

    const handleExport = () => {
        const exportData = filteredItems.map(item => ({
            SKU: item.sku || 'N/A',
            'Item Name': item.item_name,
            Category: item.category,
            Quantity: item.quantity,
            Unit: item.unit || 'pc',
            'Batch No': item.batch_no || 'N/A',
            'Expiry Date': item.expiry_date || 'N/A',
            'Supply Source': item.supply_source || 'N/A',
            Source: item.owner_role || 'BHW'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
        XLSX.writeFile(workbook, "Admin_Master_Inventory.xlsx");
    };

    return (
        <>
            <AnimatePresence>
                {modalMode === 'view' && selectedItem && (
                    <ViewItemDetailsModal item={selectedItem} onClose={() => { setSelectedItem(null); setModalMode(null); }} />
                )}
                {modalMode === 'refill' && selectedItem && (
                    <EnhancedRefillModal 
                        initialItem={selectedItem} 
                        onClose={() => { setSelectedItem(null); setModalMode(null); }} 
                        onSave={fetchInventories}
                        submitAsRequest={isAdmin}
                        requesterId={profile?.id}
                    />
                )}
                {(modalMode === 'edit-bhw') && selectedItem && (
                    <AddInventoryModal
                        mode="edit"
                        initialData={selectedItem}
                        onClose={() => { setSelectedItem(null); setModalMode(null); }}
                        onSave={fetchInventories}
                        submitAsRequest={isAdmin}
                        requesterId={profile?.id}
                    />
                )}
                {(modalMode === 'edit-bns') && selectedItem && (
                    <AddBnsInventoryModal
                        mode="edit"
                        initialData={selectedItem}
                        onClose={() => { setSelectedItem(null); setModalMode(null); }}
                        onSave={fetchInventories}
                        submitAsRequest={isAdmin}
                        requesterId={profile?.id}
                    />
                )}
                {modalMode === 'add' && (
                    <AddInventoryModal
                        mode="add"
                        onClose={() => setModalMode(null)}
                        onSave={fetchInventories}
                        submitAsRequest={isAdmin}
                        requesterId={profile?.id}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-8xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 mb-6 border-b bg-white p-4 rounded-t-lg">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-2 font-semibold text-sm transition-colors ${
                                activeTab === 'inventory'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            📦 Master Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('usage')}
                            className={`px-6 py-2 font-semibold text-sm transition-colors ${
                                activeTab === 'usage'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            📊 Usage Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('expiry')}
                            className={`px-6 py-2 font-semibold text-sm transition-colors ${
                                activeTab === 'expiry'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            📅 Expiry Risk
                        </button>
                    </div>

                    {/* Inventory Tab Content */}
                    {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                                <div className="relative w-full md:w-auto flex-grow">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                                    <input
                                        type="text"
                                        placeholder="Search by Item Name or SKU..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><FilterIcon /> Filter</button>
                                        <AnimatePresence>
                                            {isFilterOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 border"
                                                >
                                                    <div className="p-2 text-xs font-semibold text-gray-600 border-b">Filter by Category</div>
                                                    <div className="p-2">
                                                        {['All', 'Medicines', 'Vaccines', 'Equipment', 'Medical Supplies', 'Nutrition & Feeding', 'Child Hygiene & Care'].map(cat => (
                                                            <label key={cat} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="category_filter"
                                                                    value={cat}
                                                                    checked={activeCategory === cat}
                                                                    onChange={() => { setActiveCategory(cat); setCurrentPage(1); setIsFilterOpen(false); }}
                                                                />
                                                                <span className="text-sm">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><ExportIcon /> Export</button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-gray-600">
                                            <th className="p-3 font-semibold">SKU</th>
                                            <th className="p-3 font-semibold">Item Name</th>
                                            <th className="p-3 font-semibold">Category</th>
                                            <th className="p-3 font-semibold">Batch No.</th>
                                            <th className="p-3 font-semibold">Stock Level</th>
                                            <th className="p-3 font-semibold">Expiry Status</th>
                                            <th className="p-3 font-semibold">Alert</th>
                                            <th className="p-3 font-semibold">Supplier</th>
                                            <th className="p-3 font-semibold">Source</th>
                                            <th className="p-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {loading ? (
                                            <tr><td colSpan="10" className="text-center p-6">Loading inventory...</td></tr>
                                        ) : paginatedItems.length === 0 ? (
                                            <tr><td colSpan="10" className="text-center p-6 text-gray-500">No items found.</td></tr>
                                        ) : paginatedItems.map((item) => {
                                            const expiryStatus = getExpiryStatus(item.expiry_date);
                                            const stockStatus = getInventoryStockStatus(item.quantity, item.min_stock_level, item.averageDailyUsage || 0);
                                            const needsReorder = needsReordering(item.quantity, item.min_stock_level, item.averageDailyUsage || 0);
                                            
                                            return (
                                                <tr 
                                                    key={`${item.id}-${item.owner_role}`} 
                                                    className="text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => { setSelectedItem(item); setModalMode('view'); }}
                                                >
                                                    <td className="p-3 font-mono text-gray-500">{item.sku || '-'}</td>
                                                    <td className="p-3 font-semibold">{item.item_name}</td>
                                                    <td className="p-3">{item.category}</td>
                                                    <td className="p-3">{item.batch_no || 'N/A'}</td>
                                                    <td className="p-3">
                                                        <QuantityCell quantity={item.quantity} unit={item.unit || 'pc'} status={item.status} />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            {expiryStatus.status === 'expired' && <span title="Expired">🔴</span>}
                                                            {expiryStatus.status === 'expiring-soon' && <span title={`Expiring in ${expiryStatus.daysRemaining} days`}>🟠</span>}
                                                            {expiryStatus.status === 'expiring' && <span title={`Expiring in ${expiryStatus.daysRemaining} days`}>🟡</span>}
                                                            {expiryStatus.status === 'ok' && <span title="Not expiring soon" className="text-green-600">✓</span>}
                                                            <span className="text-[10px] text-gray-500">{item.expiry_date || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            {stockStatus.status === 'Critical' && <span title={`Critical Stock (≤${stockStatus.criticalThreshold})`}>⛔</span>}
                                                            {stockStatus.status === 'Low' && <span title={`Low Stock (≤${stockStatus.lowThreshold})`}>⚠️</span>}
                                                            {stockStatus.status === 'Normal' && <span className="text-green-600">✓</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span>{item.supply_source || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.owner_role === 'BHW' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                            {item.owner_role || 'BHW'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalMode('view'); }} 
                                                                className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-md border border-blue-200" 
                                                                title="View History"
                                                            >
                                                                <HistoryIcon />
                                                            </button>
                                                            {profile?.role === 'Midwife' && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalMode('refill'); }} 
                                                                    className="text-orange-600 hover:text-orange-800 bg-orange-50 p-1.5 rounded-md border border-orange-200" 
                                                                    title="Refill Stock"
                                                                >
                                                                    <RefillIcon />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                                                                className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-md border border-green-200"
                                                                title="Edit"
                                                            >
                                                                <UpdateIcon />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <button onClick={() => setModalMode('add')} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">+ Add New Item</button>
                            <StatusLegend />
                        </div>
                    </div>
                    )}

                    {/* Usage Analytics Tab Content */}
                    {activeTab === 'usage' && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <UsageAnalytics />
                        </div>
                    )}

                    {/* Expiry Risk Tab Content */}
                    {activeTab === 'expiry' && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <ExpiryRiskDashboard />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
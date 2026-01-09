import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; 

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        Normal: 'bg-green-100 text-green-700',
        Low: 'bg-yellow-100 text-yellow-700',
        Critical: 'bg-red-100 text-red-700',
    };
    // Normalize status case
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
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div><span>Normal Stock</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-yellow-400"></div><span>Low Stock</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-red-500"></div><span>Critical Stock</span></div>
        </div>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    if (totalPages <= 1) return null;
    return (
        <nav className="flex items-center justify-center space-x-1 text-xs mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&lt;</button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded ${currentPage === number ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}`}>
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&gt;</button>
        </nav>
    );
};

// --- NEW: VIEW ITEM DETAILS MODAL ---
const ViewItemDetailsModal = ({ item, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!item) return;
            // Fetch logs from activity_log where details contain the item name
            const { data, error } = await supabase
                .from('activity_log')
                .select('*, profiles(first_name, last_name, role)')
                .ilike('details', `%${item.item_name}%`)
                .order('created_at', { ascending: false });

            if (!error) setHistory(data || []);
            setLoadingHistory(false);
        };
        fetchHistory();
    }, [item]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{item.item_name}</h2>
                <div className="space-y-2 text-sm border-b pb-4 mb-4">
                    <p><span className="font-semibold">SKU:</span> {item.sku || 'N/A'}</p>
                    <p><span className="font-semibold">Category:</span> {item.category}</p>
                    <p><span className="font-semibold">Stock:</span> {item.quantity} {item.unit || 'units'}</p>
                    <p><span className="font-semibold">Status:</span> <StatusBadge status={item.status} /></p>
                    <p><span className="font-semibold">Batch No:</span> {item.batch_no || 'N/A'}</p>
                    <p><span className="font-semibold">Expiry Date:</span> {item.expiry_date || 'N/A'}</p>
                    <div className="mt-2 pt-2 border-t border-dashed">
                        <p><span className="font-semibold">Supplier:</span> {item.supplier || 'N/A'}</p>
                        <p><span className="font-semibold">Source:</span> {item.supply_source || 'N/A'}</p>
                        <p><span className="font-semibold">Inventory Type:</span> {item.source}</p>
                    </div>
                </div>

                <h3 className="font-bold text-gray-700 text-sm mb-2">Item History (Issuance & Updates)</h3>
                <div className="bg-gray-50 rounded-md p-2 h-48 overflow-y-auto space-y-2">
                    {loadingHistory ? <p className="text-xs text-center">Loading history...</p> : 
                     history.length === 0 ? <p className="text-xs text-center text-gray-500">No recorded history found.</p> :
                     history.map(log => (
                        <div key={log.id} className="text-xs border-b pb-1 last:border-0">
                            <p className="font-semibold">{log.action}</p>
                            <p className="text-gray-600">{log.details}</p>
                            <div className="flex justify-between mt-1 text-gray-400">
                                <span>by {log.profiles?.first_name} ({log.profiles?.role})</span>
                                <span>{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                     ))
                    }
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

export default function AdminInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchInventories = useCallback(async () => {
        setLoading(true);
        const [bhwRes, bnsRes] = await Promise.all([
            supabase.from('inventory').select('*'),
            supabase.from('bns_inventory').select('*')
        ]);
        
        const combined = [
            ...(bhwRes.data || []).map(item => ({...item, source: 'BHW'})),
            ...(bnsRes.data || []).map(item => ({...item, source: 'BNS'}))
        ];
        
        setAllItems(combined.sort((a, b) => a.item_name.localeCompare(b.item_name)));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventories();
    }, [fetchInventories]);

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
            Supplier: item.supplier || 'N/A',
            'Supply Source': item.supply_source || 'N/A',
            Source: item.source
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
        XLSX.writeFile(workbook, "Admin_Master_Inventory.xlsx");
    };

    return (
        <>
            <AnimatePresence>
                {selectedItem && (
                    <ViewItemDetailsModal 
                        item={selectedItem} 
                        onClose={() => setSelectedItem(null)} 
                    />
                )}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-8xl mx-auto">
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
                                            <th className="p-3 font-semibold">Expiry</th>
                                            <th className="p-3 font-semibold">Supplier</th>
                                            <th className="p-3 font-semibold">Inventory Type</th>
                                            <th className="p-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {loading ? (
                                            <tr><td colSpan="9" className="text-center p-6">Loading inventory...</td></tr>
                                        ) : paginatedItems.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center p-6 text-gray-500">No items found.</td></tr>
                                        ) : paginatedItems.map((item) => (
                                            <tr
                                            >
                                                <td className="p-3 font-mono text-gray-500">{item.sku || '-'}</td>
                                                <td className="p-3 font-semibold">{item.item_name}</td>
                                                <td className="p-3">{item.category}</td>
                                                <td className="p-3">{item.batch_no || 'N/A'}</td>
                                                <td className="p-3">
                                                    <QuantityCell quantity={item.quantity} unit={item.unit || 'pc'} status={item.status} />
                                                </td>
                                                <td className="p-3">{item.expiry_date || 'N/A'}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <span>{item.supplier || 'N/A'}</span>
                                                        <span className="text-[10px] text-gray-400">{item.supply_source || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.source === 'BHW' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.source}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItem(item);
                                                        }} 
                                                        className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                                                    >
                                                        <ViewIcon /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>

                        <div className="lg:col-span-1">
                            <StatusLegend />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
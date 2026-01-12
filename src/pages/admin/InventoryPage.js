import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; 
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';
import AddInventoryModal from '../bhw/AddInventoryModal'; 
import AddBnsInventoryModal from '../bns/AddBnsInventoryModal'; 
import { useAuth } from '../../context/AuthContext';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
// Refill Icon
const RefillIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

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

const RefillItemModal = ({ item, onClose, onSave }) => {
    const [addQty, setAddQty] = useState('');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleRefill = async (e) => {
        e.preventDefault();
        setLoading(true);
        const qtyToAdd = parseInt(addQty);

        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            addNotification("Please enter a valid quantity.", "error");
            setLoading(false);
            return;
        }

        const newQuantity = (item.quantity || 0) + qtyToAdd;
        const table = item.source === 'BNS' ? 'bns_inventory' : 'inventory';

        // Update Status based on new quantity
        let newStatus = 'Normal';
        if (newQuantity <= 10) newStatus = 'Critical';
        else if (newQuantity <= 20) newStatus = 'Low';

        const { error } = await supabase
            .from(table)
            .update({ quantity: newQuantity, status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', item.id);

        if (error) {
            addNotification(`Error refilling item: ${error.message}`, "error");
        } else {
            await logActivity('Stock Refill', `Added ${qtyToAdd} units to ${item.item_name}. Remarks: ${remarks}`);
            addNotification(`${item.item_name} refilled successfully.`, "success");
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Refill Stock</h2>
                <div className="mb-4 text-sm">
                    <p className="text-gray-500">Item: <span className="font-semibold text-gray-800">{item.item_name}</span></p>
                    <p className="text-gray-500">Current Stock: <span className="font-semibold text-gray-800">{item.quantity} {item.unit}</span></p>
                </div>
                <form onSubmit={handleRefill} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quantity to Add</label>
                        <input type="number" min="1" value={addQty} onChange={e => setAddQty(e.target.value)} className="w-full border rounded p-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Remarks (Optional)</label>
                        <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="e.g. New delivery" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm font-semibold">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400">
                            {loading ? "Refilling..." : "Confirm Refill"}
                        </button>
                    </div>
                </form>
             </motion.div>
        </div>
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
                    <p><span className="font-semibold">Expiry Date:</span> {item.expiry_date || item.expiration_date || 'N/A'}</p>
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
    const { profile } = useAuth(); // 1. Get profile to check role
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'view', 'edit', 'add', 'refill'
    const { addNotification } = useNotification();

    const fetchInventories = useCallback(async () => {
        setLoading(true);
        const [bhwRes, bnsRes] = await Promise.all([
            supabase.from('inventory').select('*').eq('is_deleted', false),
            supabase.from('bns_inventory').select('*').eq('is_deleted', false)
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

    const handleEdit = (item) => {
        setSelectedItem(item);
        setModalMode(item.source === 'BNS' ? 'edit-bns' : 'edit-bhw');
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Are you sure you want to delete ${item.item_name}?`)) return;
        const table = item.source === 'BNS' ? 'bns_inventory' : 'inventory';
        const { error } = await supabase.from(table).update({ is_deleted: true, deleted_at: new Date() }).eq('id', item.id);
        
        if (error) addNotification("Error deleting item.", "error");
        else {
            addNotification("Item moved to Recycle Bin.", "success");
            logActivity('Item Deleted', `Deleted ${item.item_name}`);
            fetchInventories();
        }
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
                {modalMode === 'view' && selectedItem && (
                    <ViewItemDetailsModal item={selectedItem} onClose={() => { setSelectedItem(null); setModalMode(null); }} />
                )}
                {modalMode === 'refill' && selectedItem && (
                    <RefillItemModal item={selectedItem} onClose={() => { setSelectedItem(null); setModalMode(null); }} onSave={fetchInventories} />
                )}
                {(modalMode === 'edit-bhw') && selectedItem && (
                    <AddInventoryModal mode="edit" initialData={selectedItem} onClose={() => { setSelectedItem(null); setModalMode(null); }} onSave={fetchInventories} />
                )}
                {(modalMode === 'edit-bns') && selectedItem && (
                    <AddBnsInventoryModal mode="edit" initialData={selectedItem} onClose={() => { setSelectedItem(null); setModalMode(null); }} onSave={fetchInventories} />
                )}
                {modalMode === 'add' && (
                    <AddInventoryModal mode="add" onClose={() => setModalMode(null)} onSave={fetchInventories} />
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
                                            <th className="p-3 font-semibold">Source</th>
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
                                                key={`${item.id}-${item.source}`} 
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
                                                    <div className="flex items-center gap-1">
                                                        {/* --- 2. CONDITIONAL REFILL BUTTON FOR MIDWIFE --- */}
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
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
                                                            className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 rounded-md border border-red-200"
                                                            title="Delete"
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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
                </div>
            </div>
        </>
    );
}
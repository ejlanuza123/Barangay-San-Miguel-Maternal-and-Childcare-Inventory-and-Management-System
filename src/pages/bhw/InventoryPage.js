import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddInventoryModal from '../../pages/bhw/AddInventoryModal';
import { motion,AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext'; 
import { useAuth } from '../../context/AuthContext';


// --- ICONS ---
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const HistoryIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> );


// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const styles = {
        normal: 'bg-green-100 text-green-700',
        low: 'bg-yellow-100 text-yellow-700',
        critical: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend of Stock</h3>
        <div className="space-y-2 text-sm">
            {/* UPDATED: Changed checkbox to a colored div to match the badge styles */}
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-green-300 border border-green-400"></div>
                <span className="text-gray-600">Normal</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-yellow-300 border border-yellow-400"></div>
                <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-red-300 border border-red-400"></div>
                <span className="text-gray-600">Critical</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex items-center space-x-2 text-gray-700"><ViewIcon /><span>View</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><UpdateIcon /><span>Update</span></div>
        <div className="flex items-center space-x-2 text-gray-700"><HistoryIcon /><span>Log/History</span></div>
        </div>
    </div>
);

const DeleteConfirmationModal = ({ itemName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
            className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 my-4">Are you sure you want to delete <span className="font-semibold">{itemName}</span>? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm">Yes, Delete</button>
            </div>
        </motion.div>
    </div>
);

const ViewItemModal = ({ item, onClose }) => {
    // Add null check at the beginning
    if (!item) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <motion.div
                    className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Error Loading Item</h2>
                    <p className="text-sm text-gray-600 mb-4">Item data could not be loaded. Please try again.</p>
                    <div className="flex justify-end mt-6">
                        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Close</button>
                    </div>
                </motion.div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{item.item_name}</h2>
                <div className="space-y-3 text-sm">
                    <p><span className="font-semibold text-gray-600">SKU:</span> {item.sku || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-600">Category:</span> {item.category}</p>
                    <p><span className="font-semibold text-gray-600">Stock Level:</span> <span className="font-bold">{item.quantity} {item.unit}</span></p>
                    <p><span className="font-semibold text-gray-600">Status:</span> <StatusBadge status={item.status} /></p>
                    <p><span className="font-semibold text-gray-600">Batch/Lot No:</span> {item.batch_no || 'N/A'}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <p><span className="font-semibold text-gray-600">Manufacture Date:</span><br/>{item.manufacture_date || 'N/A'}</p>
                        <p><span className="font-semibold text-gray-600">Expiration Date:</span><br/>{item.expiry_date || 'N/A'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed">
                        <p><span className="font-semibold text-gray-600">Supplier:</span> {item.supplier || 'N/A'}</p>
                        <p><span className="font-semibold text-gray-600">Source:</span> {item.supply_source || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- NEW: DEDICATED HISTORY MODAL ---
const ItemHistoryModal = ({ item, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if(!item) return;
            const { data, error } = await supabase
                .from('activity_log')
                .select('*, profiles(first_name, last_name, role)')
                .ilike('details', `%${item.item_name}%`)
                .order('created_at', { ascending: false });
            
            if(!error) setHistory(data || []);
            setLoadingHistory(false);
        };
        fetchHistory();
    }, [item]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <div className="border-b pb-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-800">Activity Log</h2>
                    <p className="text-xs text-gray-500">History for: <span className="font-semibold">{item.item_name}</span></p>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md p-3 space-y-3">
                    {loadingHistory ? (
                        <p className="text-xs text-center text-gray-500 py-4">Loading history...</p>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-center text-gray-500 py-4">No recorded history found.</p>
                    ) : (
                        history.map(log => (
                            <div key={log.id} className="text-xs bg-white p-3 rounded border shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-blue-700">{log.action}</span>
                                    <span className="text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 mb-2">{log.details}</p>
                                <div className="text-[10px] text-gray-400 border-t pt-1 flex justify-between">
                                    <span>User: {log.profiles?.first_name} {log.profiles?.last_name}</span>
                                    <span>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end mt-4 pt-3 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const EditInventoryModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        item_name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        status: item.status,
        manufacture_date: item.manufacture_date || '',
        expiry_date: item.expiry_date || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('inventory')
            .update({
                item_name: formData.item_name,
                category: formData.category,
                quantity: formData.quantity,
                status: formData.status,
                manufacture_date: formData.manufacture_date,
                expiry_date: formData.expiry_date,
            })
            .eq('id', item.id);

        if (error) {
            alert(`Error updating item: ${error.message}`);
        } else {
            await logActivity("Inventory Item Updated", `Updated item: ${formData.item_name}`);
            await onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Item</h2>
                <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                    <div>
                        <label className="block font-semibold">Item Name</label>
                        <input
                            type="text"
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option>Medicines</option>
                            <option>Equipment</option>
                            <option>Supplies</option>
                            <option>Vaccines</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold">Quantity</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold">Manufacture Date</label>
                        <input
                            type="date"
                            name="manufacture_date"
                            value={formData.manufacture_date}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold">Expiry Date</label>
                        <input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const Notification = ({ message, onClear }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 5000); // Auto-dismiss after 5 seconds
        return () => clearTimeout(timer);
    }, [onClear]);

    return (
        <motion.div
            className="fixed bottom-5 right-5 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
        >
            <p className="font-bold">Low Stock Warning</p>
            <p>{message}</p>
        </motion.div>
    );
};


// --- NEW: Pagination Component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className="flex items-center justify-center space-x-1 text-xs">
            <button 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
                &lt;
            </button>
            {pageNumbers.map(number => (
                <button 
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-2 py-1 rounded ${currentPage === number ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-200'}`}
                >
                    {number}
                </button>
            ))}
            <button 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
                &gt;
            </button>
        </nav>
    );
};

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ category: 'All' });
    const { user } = useAuth();

    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const { addNotification } = useNotification(); 



    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); 
    const [totalItems, setTotalItems] = useState(0);

    const [notifications, setNotifications] = useState([]);

    const CRITICAL_THRESHOLD = 10;
    const LOW_THRESHOLD = 20;

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            // Search filter
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());

            // Category filter
            const matchesCategory = filters.category === "All" || item.category === filters.category;

            return matchesSearch && matchesCategory;
        });
    }, [inventory, searchTerm, filters]);

    // Update total items count based on filtered data
    useEffect(() => {
        setTotalItems(filteredInventory.length);
    }, [filteredInventory]);

    const handleViewHistory = (item) => {
        setSelectedItem(item);
        setModalMode('history'); // Set mode to 'history'
    };


    const fetchInventory = useCallback(async () => {
        setLoading(true);
        
        // ADD is_deleted filter here
        let query = supabase
            .from('inventory')
            .select('*')
            .eq('is_deleted', false) // ADD THIS LINE
            .eq('owner_role', 'BHW')
            .order('created_at', { ascending: false });


        // Apply search filter if exists
        if (searchTerm) {
            query = query.ilike('item_name', `%${searchTerm}%`);
        }

        // Apply category filter if not 'All'
        if (filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching inventory:", error);
            addNotification(`Error fetching inventory: ${error.message}`, 'error');
        } else if (data) {
            const updatePromises = [];
            const newNotifications = [];

            data.forEach(item => {
                let newStatus = item.status;
                if (item.quantity <= CRITICAL_THRESHOLD) {
                    newStatus = 'Critical';
                } else if (item.quantity <= LOW_THRESHOLD) {
                    newStatus = 'Low';
                } else {
                    newStatus = 'Normal';
                }

                if (item.status !== newStatus) {
                    updatePromises.push(
                        supabase.from('inventory').update({ status: newStatus }).eq('id', item.id)
                    );
                    newNotifications.push(`'${item.item_name}' stock is low (${item.quantity} units). Status updated to ${newStatus}.`);
                    item.status = newStatus;
                }
            });

            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
                setNotifications(prev => [...prev, ...newNotifications]);
            }

            setInventory(data);
            setTotalItems(data.length);
        }
        setLoading(false);
    }, [searchTerm, filters.category]); // Add dependencies

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setModalMode('edit');
    };

    const handleDelete = async () => {
        if (!itemToDelete || !user) return;
        
        // Submit a request instead of deleting directly
        const { error } = await supabase.from('requestions').insert([{
            worker_id: user.id,
            request_type: 'Delete',
            target_table: 'inventory', // Targeted table for BHW inventory
            target_record_id: itemToDelete.id,
            request_data: { 
                item_name: itemToDelete.item_name,
                quantity: itemToDelete.quantity,
                category: itemToDelete.category
            },
            status: 'Pending'
        }]);
        
        if (error) {
            addNotification(`Error submitting delete request: ${error.message}`, 'error');
        } else {
            addNotification('Delete request submitted for approval.', 'success');
            logActivity('Inventory Delete Request', `Submitted request for ${itemToDelete.item_name}`);
            // Note: We don't refetch inventory here because the item isn't deleted yet
        }
        setItemToDelete(null);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <>
            <AnimatePresence>
                {(modalMode === 'add' || modalMode === 'edit') && (
                    <AddInventoryModal
                        mode={modalMode}
                        initialData={selectedItem}
                        onClose={() => setModalMode(null)}
                        onSave={() => {
                            setModalMode(null);
                            fetchInventory();
                        }}
                    />
                )}
                {itemToDelete && (
                    <DeleteConfirmationModal
                        itemName={itemToDelete.item_name}
                        onConfirm={handleDelete}
                        onCancel={() => setItemToDelete(null)}
                    />
                )}
                {/* View Details Only */}
                {modalMode === 'view' && (
                    <ViewItemModal
                        item={selectedItem}
                        onClose={() => setModalMode(null)}
                    />
                )}

                {/* View History Only */}
                {modalMode === 'history' && (
                    <ItemHistoryModal
                        item={selectedItem}
                        onClose={() => setModalMode(null)}
                    />
                )}
            </AnimatePresence>
            <div className="fixed top-5 right-5 z-50">
                <AnimatePresence>
                    {notifications.map((msg, index) => (
                        <Notification key={index} message={msg} onClear={() => setNotifications(current => current.filter(m => m !== msg))} />
                    ))}
                </AnimatePresence>
            </div>
            {/* --- END OF BLOCK --- */}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6"></div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <div className="relative w-full md:w-auto flex-grow">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input
                                type="text"
                                placeholder="Search Items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><FilterIcon /> Filter</button>
                                {isFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                        <div className="p-2 text-sm font-semibold border-b">Filter by Category</div>
                                        <div className="p-2">
                                            {['All', 'Medicines', 'Equipment', 'Supplies','Vaccines'].map(cat => (
                                                 <label key={cat} className="flex items-center space-x-2 text-sm">
                                                    <input type="radio" name="category" value={cat} checked={filters.category === cat} onChange={(e) => setFilters({...filters, category: e.target.value})} />
                                                    <span>{cat}</span>
                                                 </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['Item Name', 'Category', 'Stock', 'Status', 'Expiry Date', 'Actions'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
                                ) : (
                                    filteredInventory
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) // ✅ show only 10 items
                                        .map(item => (
                                            <tr key={item.id} className="text-gray-700">
                                                <td className="p-3 font-semibold">{item.item_name}</td>
                                                <td className="p-3">{item.category}</td>
                                                <td className="p-3">{item.quantity} units</td>
                                                <td className="p-3"><StatusBadge status={item.status.toLowerCase()} /></td>
                                                <td className="p-3">{item.expiry_date || '---'}</td>
                                                <td className="p-3">
                                                    <div className="flex space-x-1">
                                                        <button onClick={() => { setSelectedItem(item); setModalMode('view'); }} className="text-gray-400 hover:text-blue-600 p-1"><ViewIcon /></button>
                                                        <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-green-600 p-1"><UpdateIcon /></button>
                                                        <button onClick={() => handleViewHistory(item)} className="text-gray-400 hover:text-orange-600 p-1" title="View History"><HistoryIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}

                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <button onClick={() => { setSelectedItem(null); setModalMode('add'); }} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">+ Add New Item</button>
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}
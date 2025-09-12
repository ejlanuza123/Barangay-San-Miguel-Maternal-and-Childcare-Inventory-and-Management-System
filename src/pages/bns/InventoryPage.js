import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import AddBnsInventoryModal from './AddBnsInventoryModal';
import { logActivity } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';
 


// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;


// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const styles = {
        Normal: 'bg-green-100 text-green-700',
        Low: 'bg-yellow-100 text-yellow-700',
        Critical: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend of Stock</h3>
        <div className="space-y-2 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-green-300 border border-green-400"></div><span>Normal</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-yellow-300 border border-yellow-400"></div><span>Low</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-red-300 border border-red-400"></div><span>Critical</span></div>
            <div className="border-t my-2"></div>
            <div className="flex items-center space-x-2 text-gray-700"><ViewIcon /><span>View</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><UpdateIcon /><span>Update</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><DeleteIcon /><span>Delete</span></div>
        </div>
    </div>
);

const ViewItemModal = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{item.item_name}</h2>
            <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Category:</span> {item.category}</p>
                <p><span className="font-semibold">Stock:</span> {item.quantity} {item.unit}</p>
                <p><span className="font-semibold">Status:</span> <StatusBadge status={item.status} /></p>
                <p><span className="font-semibold">Expiration Date:</span> {item.expiration_date || 'N/A'}</p>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold text-sm">Close</button>
            </div>
        </motion.div>
    </div>
);


const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPaginationItems = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
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
        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    const paginationItems = getPaginationItems();

    return (
        <nav className="flex items-center justify-center space-x-1 text-xs mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&lt;</button>
            {paginationItems.map((item, index) => {
                if (item === '...') {
                    return <span key={index} className="px-2 py-1">...</span>;
                }
                return (
                    <button 
                        key={index}
                        onClick={() => onPageChange(item)}
                        className={`px-3 py-1 rounded ${currentPage === item ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}`}
                    >
                        {item}
                    </button>
                );
            })}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&gt;</button>
        </nav>
    );
};
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

// NEW: Notification component specifically for stock alerts
const Notification = ({ message, onClear }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 3000); // Auto-dismiss after 5 seconds
        return () => clearTimeout(timer);
    }, [onClear]);

    return (
        <motion.div
            // MODIFIED: Removed fixed positioning to let the parent container control it
            className="w-80 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-lg mb-4"
            layout // Added for smooth animation when items are removed
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
        >
            <p className="font-bold">Low Stock Warning</p>
            <p>{message}</p>
        </motion.div>
    );
};

export default function BnsInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalMode, setModalMode] = useState(null);
    const [itemToManage, setItemToManage] = useState(null);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [stockNotifications, setStockNotifications] = useState([]);
    
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const { user } = useAuth();


    const fetchPageData = useCallback(async () => {
        setLoading(true);
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error, count } = await supabase
            .from('bns_inventory')
            .select('*', { count: 'exact' })
            .order('item_name', { ascending: true })
            .range(from, to);
        
        if (error) {
            addNotification(`Error fetching inventory: ${error.message}`, 'error');
        } else if (data) {
            const CRITICAL_THRESHOLD = 10;
            const LOW_THRESHOLD = 20;
            const updatePromises = [];
            const headerNotificationPromises = []; // For the bell icon in the header
            const popUpNotificationMessages = []; // For the pop-up on the page

            data.forEach(item => {
                let newStatus = 'Normal';
                if (item.quantity <= CRITICAL_THRESHOLD) {
                    newStatus = 'Critical';
                } else if (item.quantity <= LOW_THRESHOLD) {
                    newStatus = 'Low';
                }
                
                if (item.status !== newStatus) {
                    updatePromises.push(
                        supabase.from('bns_inventory').update({ status: newStatus }).eq('id', item.id)
                    );
                    item.status = newStatus; 

                    if ((newStatus === 'Low' || newStatus === 'Critical') && user) {
                        const message = `${item.item_name} stock is ${newStatus.toLowerCase()} (${item.quantity} units left).`;

                        // ✅ 1. Always insert into Supabase (for the bell)
                        headerNotificationPromises.push(
                            supabase.from('notifications').insert([{
                                type: 'inventory_alert',
                                message,
                                user_id: user.id
                            }])
                        );

                        // ✅ 2. Only push to pop-up if not already showing
                        setStockNotifications(prev => {
                            if (!prev.some(n => n.message === message)) {
                                return [...prev, { id: item.id + Date.now(), message }];
                            }
                            return prev; // avoid duplicate pop-ups
                        });
                    }
                }
            });

            if (updatePromises.length > 0) await Promise.all(updatePromises);
            if (headerNotificationPromises.length > 0) await Promise.all(headerNotificationPromises);
            if (popUpNotificationMessages.length > 0) {
                setStockNotifications(prev => [...prev, ...popUpNotificationMessages]);
            }
            
            setInventory(data);
            setTotalRecords(count || 0);
        }
        setLoading(false);
    }, [addNotification, currentPage, itemsPerPage, user]);

    // This is now the ONLY useEffect for fetching data
    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleDelete = async () => {
        if (!itemToDelete) return;

        const { error } = await supabase.from('bns_inventory').delete().eq('id', itemToDelete.id);
        
        if (error) {
            addNotification(`Error deleting item: ${error.message}`, 'error');
        } else {
            addNotification(`${itemToDelete.item_name} was deleted successfully.`, 'success');
            await logActivity('BNS Item Deleted', `Deleted item: ${itemToDelete.item_name}`);
            fetchPageData(); // Refresh the list
        }
        setItemToDelete(null); // Close the modal
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [inventory, searchTerm, activeCategory]);


    const totalPages = Math.ceil(totalRecords / itemsPerPage);

    return (
        <>
            <AnimatePresence>
                {(modalMode === 'add' || modalMode === 'edit') && ( <AddBnsInventoryModal mode={modalMode} initialData={itemToManage} onClose={() => setModalMode(null)} onSave={() => { setModalMode(null); fetchPageData(); }} /> )}
                {modalMode === 'view' && ( <ViewItemModal item={itemToManage} onClose={() => setModalMode(null)} /> )}
                                {itemToDelete && (
                    <DeleteConfirmationModal
                        itemName={itemToDelete.item_name}
                        onConfirm={handleDelete}
                        onCancel={() => setItemToDelete(null)}
                    />
                )}
            </AnimatePresence>
            <div className="fixed top-5 right-5 z-50">
                <AnimatePresence>
                    {stockNotifications.map(notif => (
                        <Notification 
                            key={notif.id} 
                            message={notif.message} 
                            onClear={() => setStockNotifications(current => current.filter(n => n.id !== notif.id))} 
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="xl:col-span-3 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <h2 className="text-xl font-bold text-gray-700">Inventory List</h2>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2"><SearchIcon /></span>
                                <input type="text" placeholder="Search Items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50"/>
                            </div>
                            
                            {/* MODIFIED: Functional Filter Button with Dropdown */}
                            <div className="relative">
                                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50">
                                    <FilterIcon /> <span>Filter</span>
                                </button>
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border"
                                        >
                                            <div className="p-2 text-xs font-semibold text-gray-600 border-b">Filter by Category</div>
                                            <div className="p-2">
                                                {['All', 'Medicines', 'Vaccines', 'Medical Supplies', 'Equipment', 'Nutrition & Feeding', 'Child Hygiene & Care'].map(category => (
                                                    <label key={category} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="category_filter"
                                                            value={category}
                                                            checked={activeCategory === category}
                                                            onChange={() => {
                                                                setActiveCategory(category);
                                                                setCurrentPage(1); // Reset to first page
                                                                setIsFilterOpen(false);
                                                            }}
                                                        />
                                                        <span className="text-sm">{category}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <button onClick={() => { setItemToManage(null); setModalMode('add'); }} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm whitespace-nowrap">+ Add Item</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-500 font-semibold">
                                    {['Item Name', 'Category', 'Quantity', 'Unit', 'Expiration Date', 'Status', 'Actions'].map(h => <th key={h} className="px-2 py-2">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? ( <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr> ) : (
                                    filteredInventory.map(item => (
                                        <tr key={item.id} className="text-gray-600 hover:bg-gray-50">
                                            <td className="px-2 py-2 font-medium">{item.item_name}</td>
                                            <td className="px-2 py-2">{item.category}</td>
                                            <td className="px-2 py-2">{item.quantity}</td>
                                            <td className="px-2 py-2">{item.unit}</td>
                                            <td className="px-2 py-2">{item.expiration_date}</td>
                                            <td className="px-2 py-2"><StatusBadge status={item.status} /></td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => { setItemToManage(item); setModalMode('view'); }} className="text-gray-400 hover:text-blue-600 p-1" title="View"><ViewIcon /></button>
                                                    <button onClick={() => { setItemToManage(item); setModalMode('edit'); }} className="text-gray-400 hover:text-green-600 p-1" title="Edit"><UpdateIcon /></button>
                                                    <button onClick={() => setItemToDelete(item)} className="text-gray-400 hover:text-red-600 p-1" title="Delete"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
                
                {/* Right Sidebar Area */}
                <div className="xl:col-span-1 space-y-4">
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}
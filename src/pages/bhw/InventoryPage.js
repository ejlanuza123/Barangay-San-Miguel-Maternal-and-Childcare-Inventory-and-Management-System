import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddInventoryModal from '../../pages/bhw/AddInventoryModal';
import { motion,AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';

// --- ICONS ---
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;


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

const ViewItemModal = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
        >
            <h2 className="text-xl font-bold text-gray-800 mb-4">{item.item_name}</h2>
            <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Category:</span> {item.category}</p>
                <p><span className="font-semibold">Stock:</span> {item.quantity} units</p>
                <p><span className="font-semibold">Status:</span> <StatusBadge status={item.status.toLowerCase()} /></p>
                <p><span className="font-semibold">Manufacture Date:</span> {item.manufacture_date || 'N/A'}</p>
                <p><span className="font-semibold">Expiry Date:</span> {item.expiry_date || 'N/A'}</p>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Close</button>
            </div>
        </motion.div>
    </div>
);

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
                        <label className="block font-semibold">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="Normal">Normal</option>
                            <option value="Low">Low</option>
                            <option value="Critical">Critical</option>
                        </select>
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


export default function InventoryPage() {
    const [allInventory, setAllInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null); // null, 'add', 'edit', 'view'
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // --- ADDED: State for search and filter ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
    });

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching inventory:", error);
        else setAllInventory(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setModalMode('edit');
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        
        const { error } = await supabase.from('inventory').delete().eq('id', itemToDelete.id);
        
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            await logActivity('Inventory Item Deleted', `Deleted item: ${itemToDelete.item_name}`);
            await fetchInventory();
        }
        setItemToDelete(null);
    };

    // --- ADDED: Logic to filter inventory for display ---
    const filteredInventory = useMemo(() => {
        return allInventory
            .filter(item => {
                // Filter by category
                if (filters.category === 'All') return true;
                return item.category === filters.category;
            })
            .filter(item => {
                // Filter by search term (case-insensitive)
                if (!searchTerm) return true;
                return item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allInventory, searchTerm, filters]);

    return (
        <>
            <AnimatePresence>
                {isModalOpen && <AddInventoryModal onClose={() => setIsModalOpen(false)} onSave={fetchInventory} />}
                {itemToDelete && (
                    <DeleteConfirmationModal
                        itemName={itemToDelete.item_name}
                        onConfirm={handleDelete}
                        onCancel={() => setItemToDelete(null)}
                    />
                )}
                {modalMode === 'view' && (
                    <ViewItemModal
                        item={selectedItem}
                        onClose={() => setModalMode(null)}
                    />
                )}
                {modalMode === 'edit' && selectedItem && (
                    <EditInventoryModal
                        item={selectedItem}
                        onClose={() => setModalMode(null)}
                        onSave={fetchInventory}
                    />
                )}

            </AnimatePresence>

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
                                            {['All', 'Medicines', 'Equipment', 'Supplies'].map(cat => (
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
                                {loading && ( <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr> )}
                                {!loading && filteredInventory.map(item => (
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
                                                <button onClick={() => setItemToDelete(item)} className="text-gray-400 hover:text-red-600 p-1"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <button onClick={() => setIsModalOpen(true)} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">+ Add New Item</button>
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}

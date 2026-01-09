import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';

// Icons
const RestoreIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EmptyIcon = () => <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// --- NEW: Delete Confirmation Modal Component ---
const DeleteConfirmationModal = ({ itemName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
            className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Permanently Delete?</h3>
            <p className="text-sm text-gray-600 my-4">
                Are you sure you want to permanently delete <span className="font-semibold text-gray-800">"{itemName}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 mt-6">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold text-sm transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm transition-colors"
                >
                    Delete Forever
                </button>
            </div>
        </motion.div>
    </div>
);

export default function RecycleBinPage() {
    // Tabs: 'maternal' | 'child' | 'inventory' | 'bns_inventory'
    const [activeTab, setActiveTab] = useState('maternal'); 
    const [deletedRecords, setDeletedRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemToDelete, setItemToDelete] = useState(null); // New state for modal
    const { addNotification } = useNotification();

    const fetchDeleted = useCallback(async () => {
        setLoading(true);
        let table = '';
        
        switch (activeTab) {
            case 'maternal': table = 'patients'; break;
            case 'child': table = 'child_records'; break;
            case 'inventory': table = 'inventory'; break;
            case 'bns_inventory': table = 'bns_inventory'; break;
            default: table = 'patients';
        }
        
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('is_deleted', true)
            .order('deleted_at', { ascending: false });

        if (error) {
            console.error("Error fetching trash:", error);
        } else {
            setDeletedRecords(data || []);
        }
        setLoading(false);
    }, [activeTab]);

    useEffect(() => {
        fetchDeleted();
    }, [fetchDeleted]);

    // Helper to get display name based on tab
    const getDisplayName = (record) => {
        if (activeTab === 'inventory' || activeTab === 'bns_inventory') {
            return record.item_name;
        }
        return `${record.first_name} ${record.last_name}`;
    };

    // Helper to get ID display
    const getDisplayID = (record) => {
        if (activeTab === 'inventory' || activeTab === 'bns_inventory') {
            return record.sku || 'No SKU';
        }
        return activeTab === 'maternal' ? record.patient_id : record.child_id;
    };

    const handleRestore = async (id, name) => {
        let table = '';
        switch (activeTab) {
            case 'maternal': table = 'patients'; break;
            case 'child': table = 'child_records'; break;
            case 'inventory': table = 'inventory'; break;
            case 'bns_inventory': table = 'bns_inventory'; break;
            default: table = 'patients';
        }
        
        const { error } = await supabase
            .from(table)
            .update({ is_deleted: false, deleted_at: null })
            .eq('id', id);

        if (error) {
            addNotification(`Error restoring: ${error.message}`, 'error');
        } else {
            addNotification(`${name} restored successfully.`, 'success');
            logActivity('Record Restored', `Restored ${name} from trash.`);
            fetchDeleted();
        }
    };

    // Renamed to executePermanentDelete to be called by modal
    const executePermanentDelete = async () => {
        if (!itemToDelete) return;
        const { id } = itemToDelete;
        const name = getDisplayName(itemToDelete);

        let table = '';
        switch (activeTab) {
            case 'maternal': table = 'patients'; break;
            case 'child': table = 'child_records'; break;
            case 'inventory': table = 'inventory'; break;
            case 'bns_inventory': table = 'bns_inventory'; break;
            default: table = 'patients';
        }
        
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            addNotification(`Error deleting: ${error.message}`, 'error');
        } else {
            addNotification(`${name} permanently deleted.`, 'success');
            logActivity('Record Permanently Deleted', `Permanently deleted ${name}.`);
            fetchDeleted();
        }
        setItemToDelete(null); // Close modal
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <AnimatePresence>
                {itemToDelete && (
                    <DeleteConfirmationModal 
                        itemName={getDisplayName(itemToDelete)} 
                        onConfirm={executePermanentDelete} 
                        onCancel={() => setItemToDelete(null)} 
                    />
                )}
            </AnimatePresence>

            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrashIcon /> Recycle Bin
            </h1>

            <div className="flex flex-wrap gap-2 mb-6 border-b bg-white rounded-t-lg shadow-sm px-4 pt-4">
                <button
                    onClick={() => setActiveTab('maternal')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors duration-200 text-sm ${activeTab === 'maternal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-500'}`}
                >
                    Maternal Records
                </button>
                <button
                    onClick={() => setActiveTab('child')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors duration-200 text-sm ${activeTab === 'child' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-green-500'}`}
                >
                    Child Records
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors duration-200 text-sm ${activeTab === 'inventory' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-purple-500'}`}
                >
                    Inventory (Maternal)
                </button>
                <button
                    onClick={() => setActiveTab('bns_inventory')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors duration-200 text-sm ${activeTab === 'bns_inventory' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-orange-500'}`}
                >
                    Inventory (Child)
                </button>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm border p-4">
                {loading ? (
                    <div className="text-center p-8 text-gray-500">Loading deleted items...</div>
                ) : deletedRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <EmptyIcon />
                        <p className="mt-4">Trash is empty.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-3 text-left">Deleted Date</th>
                                    <th className="p-3 text-left">ID / SKU</th>
                                    <th className="p-3 text-left">Name / Item</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {deletedRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">
                                            {record.deleted_at ? new Date(record.deleted_at).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-3 font-medium font-mono text-xs">
                                            {getDisplayID(record)}
                                        </td>
                                        <td className="p-3 font-semibold text-gray-700">
                                            {getDisplayName(record)}
                                        </td>
                                        <td className="p-3 flex justify-center gap-3">
                                            <button 
                                                onClick={() => handleRestore(record.id, getDisplayName(record))}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-semibold text-xs transition-colors"
                                            >
                                                <RestoreIcon /> Restore
                                            </button>
                                            <button 
                                                onClick={() => setItemToDelete(record)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-semibold text-xs transition-colors"
                                            >
                                                <TrashIcon /> Delete Forever
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
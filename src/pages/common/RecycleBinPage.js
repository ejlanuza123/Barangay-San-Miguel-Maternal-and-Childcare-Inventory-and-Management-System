import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';

// Icons
const RestoreIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EmptyIcon = () => <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function RecycleBinPage() {
    const [activeTab, setActiveTab] = useState('maternal'); // 'maternal' or 'child'
    const [deletedRecords, setDeletedRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    const fetchDeleted = useCallback(async () => {
        setLoading(true);
        const table = activeTab === 'maternal' ? 'patients' : 'child_records';
        
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

    const handleRestore = async (id, name) => {
        const table = activeTab === 'maternal' ? 'patients' : 'child_records';
        
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

    const handlePermanentDelete = async (id, name) => {
        if(!window.confirm("Are you sure? This action CANNOT be undone.")) return;

        const table = activeTab === 'maternal' ? 'patients' : 'child_records';
        
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
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrashIcon /> Recycle Bin
            </h1>

            <div className="flex mb-6 border-b bg-white rounded-t-lg shadow-sm px-4 pt-4">
                <button
                    onClick={() => setActiveTab('maternal')}
                    className={`py-2 px-6 font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'maternal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-500'}`}
                >
                    Maternal Records
                </button>
                <button
                    onClick={() => setActiveTab('child')}
                    className={`py-2 px-6 font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'child' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-green-500'}`}
                >
                    Child Records
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
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {deletedRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">
                                            {record.deleted_at ? new Date(record.deleted_at).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {activeTab === 'maternal' ? record.patient_id : record.child_id}
                                        </td>
                                        <td className="p-3 font-semibold text-gray-700">
                                            {record.first_name} {record.last_name}
                                        </td>
                                        <td className="p-3 flex justify-center gap-3">
                                            <button 
                                                onClick={() => handleRestore(record.id, `${record.first_name} ${record.last_name}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-semibold text-xs"
                                            >
                                                <RestoreIcon /> Restore
                                            </button>
                                            <button 
                                                onClick={() => handlePermanentDelete(record.id, `${record.first_name} ${record.last_name}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-semibold text-xs"
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
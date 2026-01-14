import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion } from 'framer-motion';

export default function HistoryModal({ title, queryTerm, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            // Search activity_log for the specific name or ID
            const { data, error } = await supabase
                .from('activity_log')
                .select('*, profiles(first_name, last_name, role)')
                .ilike('details', `%${queryTerm}%`) // Basic string matching
                .order('created_at', { ascending: false });

            if (!error) {
                setHistory(data || []);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [queryTerm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="font-bold text-gray-700">History: {title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500">Loading history...</p>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-sm">No history records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((log) => (
                                <div key={log.id} className="border-l-2 border-blue-500 pl-3 py-1">
                                    <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                                    <p className="text-xs text-gray-600">{log.details}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                            {log.profiles ? `${log.profiles.first_name} (${log.profiles.role})` : 'System'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
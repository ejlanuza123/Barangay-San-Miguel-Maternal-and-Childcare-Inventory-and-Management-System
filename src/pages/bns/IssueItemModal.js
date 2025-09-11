import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';

export default function IssueItemModal({ item, onClose, onSave }) {
    const [quantityToIssue, setQuantityToIssue] = useState(1);
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleIssue = async (e) => {
            e.preventDefault();
            setLoading(true);
            const newQuantity = item.quantity - quantityToIssue;

            if (newQuantity < 0) {
                addNotification("Cannot issue more items than are in stock.", "error");
                setLoading(false);
                return;
            }

            // MODIFIED: Points to 'bns_inventory'
            const { error } = await supabase.from('bns_inventory').update({ quantity: newQuantity }).eq('id', item.id);
            
            if (error) {
                addNotification(`Error: ${error.message}`, 'error');
            } else {
                addNotification(`${quantityToIssue} unit(s) of ${item.item_name} issued successfully.`, 'success');
                logActivity('BNS Item Issued', `${quantityToIssue} unit(s) of ${item.item_name} issued. New stock: ${newQuantity}.`);
                onSave();
                onClose();
            }
            setLoading(false);
        };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold mb-2">Issue Item</h2>
                <p className="text-sm text-gray-600 mb-4">Item: <span className="font-semibold">{item.item_name}</span><br/>Current Stock: {item.quantity}</p>
                <form onSubmit={handleIssue} className="space-y-4">
                    <div>
                        <label className="font-semibold text-sm">Quantity to Issue</label>
                        <input 
                            type="number" 
                            value={quantityToIssue} 
                            onChange={(e) => setQuantityToIssue(parseInt(e.target.value, 10))}
                            min="1"
                            max={item.quantity}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">{loading ? 'Issuing...' : 'Issue'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
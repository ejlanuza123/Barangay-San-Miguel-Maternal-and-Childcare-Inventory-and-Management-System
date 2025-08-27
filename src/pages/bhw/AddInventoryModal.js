import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';

const SuccessIcon = () => (
    <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export default function AddInventoryModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error: insertError } = await supabase.from('inventory').insert([
            {
                item_name: formData.item_name,
                category: formData.category,
                quantity: formData.stock_units,
                manufacture_date: formData.manufacture_date || null,
                expiry_date: formData.expiry_date || null,
            }
        ]);
        if (insertError) {
            setError(insertError.message);
        } else {
            await logActivity(
            "Inventory Item Added",
            `Added new item: ${formData.item_name}, Category: ${formData.category}, Quantity: ${formData.stock_units}`
            );
            setShowSuccess(true); // Show success message instead of closing immediately
        }
        setLoading(false);
    };

    const handleDone = () => {
        onSave(); // Refresh the list on the parent page
        onClose(); // Close the modal
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <AnimatePresence>
                {!showSuccess ? (
                    <motion.div key="form" variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                        className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Item</h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div><label className="text-sm font-semibold text-gray-600">Item Name</label><input type="text" name="item_name" placeholder="Enter item name" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required /></div>
                                <div><label className="text-sm font-semibold text-gray-600">Category</label><select name="category" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50"><option value="">Select category</option><option value="Medicines">Medicines</option><option value="Equipment">Equipment</option><option value="Supplies">Other Supplies</option></select></div>
                                <div><label className="text-sm font-semibold text-gray-600">Stock Units</label><input type="number" name="stock_units" placeholder="Enter stock quantity" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required /></div>
                                <div><label className="text-sm font-semibold text-gray-600">Manufacture Date</label><input type="date" name="manufacture_date" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" /></div>
                                <div><label className="text-sm font-semibold text-gray-600">Expiry Date</label><input type="date" name="expiry_date" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" /></div>
                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                                <div className="flex justify-end items-center space-x-3 pt-4">
                                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm">{loading ? 'Adding...' : 'Add Item'}</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="success" variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                        className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8 flex flex-col items-center">
                        <SuccessIcon />
                        <h2 className="text-2xl font-bold text-gray-800 mt-4">Success!</h2>
                        <p className="text-gray-500 mt-2">Your item has been added to inventory.</p>
                        <button onClick={handleDone} className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm">Done</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

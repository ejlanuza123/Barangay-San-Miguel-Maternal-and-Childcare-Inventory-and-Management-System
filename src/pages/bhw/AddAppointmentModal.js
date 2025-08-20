import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddAppointmentModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.patient_name || !formData.date || !formData.time || !formData.appointment_type) {
            setError('Please fill out all required fields.');
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase.from('appointments').insert([
            {
                patient_display_id: formData.patient_id,
                patient_name: formData.patient_name,
                reason: formData.appointment_type,
                date: formData.date,
                time: formData.time,
                notes: formData.notes,
                status: 'Scheduled'
            }
        ]);

        if (insertError) {
            setError(insertError.message);
            console.error("Error creating appointment:", insertError);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <motion.div
                    className="bg-white rounded-lg shadow-2xl w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Appointment</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Patient ID</label>
                                <input type="text" name="patient_id" placeholder="Enter patient ID" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Patient Name</label>
                                <input type="text" name="patient_name" placeholder="Enter patient name" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Appointment Type</label>
                                <select name="appointment_type" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" required>
                                    <option value="">Select appointment type</option>
                                    <option value="Prenatal Check-up">Prenatal Check-up</option>
                                    <option value="Vaccination">Vaccination</option>
                                    <option value="Nutrition Counseling">Nutrition Counseling</option>
                                    <option value="Postnatal Visit">Postnatal Visit</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Date</label>
                                    <input type="date" name="date" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Time</label>
                                    <input type="time" name="time" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Notes</label>
                                <textarea name="notes" rows="3" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm"></textarea>
                            </div>
                            
                            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                            <div className="flex justify-end items-center space-x-3 pt-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm">
                                    {loading ? 'Creating...' : 'Create Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
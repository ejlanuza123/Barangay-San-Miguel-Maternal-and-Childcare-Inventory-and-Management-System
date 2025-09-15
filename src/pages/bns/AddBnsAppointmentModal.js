import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';

import CalendarPickerModal from '../bns/CalendarPickerModal'; 

const CalendarIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;

export default function AddBnsAppointmentModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({ patient_id: '', patient_name: '', reason: '', date: '', time: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allChildren, setAllChildren] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { addNotification } = useNotification();

    // Fetch children from the child_records table
    useEffect(() => {
        const fetchAllChildren = async () => {
            const { data, error } = await supabase.from('child_records').select('id, child_id, first_name, last_name');
            if (error) console.error("Error fetching children:", error);
            else setAllChildren(data || []);
        };
        fetchAllChildren();
    }, []);

    const searchResults = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return [];
        return allChildren.filter(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
            return fullName.includes(query) || (p.child_id || '').toLowerCase().includes(query);
        });
    }, [searchQuery, allChildren]);

    const handlePatientSelect = (child) => {
        const fullName = `${child.first_name} ${child.last_name}`;
        setFormData(prev => ({ ...prev, patient_id: child.child_id, patient_name: fullName }));
        setSearchQuery(fullName);
        setIsSearching(false);
    };
    
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.patient_id) {
            setError('You must select a child from the search list.');
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const { error: insertError } = await supabase.from('appointments').insert([{
            patient_display_id: formData.patient_id,
            patient_name: formData.patient_name,
            reason: formData.reason,
            date: formData.date,
            time: formData.time,
            notes: formData.notes,
            status: 'Scheduled',
            created_by: user?.id
        }]);

        if (insertError) {
            addNotification(`Error: ${insertError.message}`, 'error');
        } else {
            // --- THIS IS THE FIX ---
            // Create a notification for the user who scheduled the appointment
            await supabase.from('notifications').insert([{
                type: 'appointment_reminder',
                message: `You scheduled an appointment for ${formData.patient_name} on ${formData.date}.`,
                user_id: user.id
            }]);
            
            logActivity('New Appointment Scheduled', `Appointment for ${formData.patient_name} on ${formData.date}`);
            addNotification('New appointment scheduled successfully.', 'success');
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <>
            <AnimatePresence>
                {isCalendarOpen && (
                    <CalendarPickerModal 
                        onClose={() => setIsCalendarOpen(false)}
                        onDateSelect={(date) => setFormData(prev => ({ ...prev, date: date }))}
                    />
                )}
            </AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <motion.div
                    className="bg-white rounded-lg shadow-2xl w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                >
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Child Appointment</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                           <div className="relative">
                                <label className="text-sm font-semibold text-gray-600">Child's Name</label>
                                <input
                                    type="text"
                                    placeholder="Type to search for a child..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsSearching(true);
                                    }}
                                    className="w-full mt-1 p-2 border rounded-md text-sm"
                                    required autoComplete="off"
                                />
                                {isSearching && searchResults.length > 0 && (
                                    <div onMouseLeave={() => setIsSearching(false)} className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                        {searchResults.map(child => (
                                            <div key={child.id} onClick={() => handlePatientSelect(child)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                {child.first_name} {child.last_name} ({child.child_id})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                             <div>
                                <label className="text-sm font-semibold text-gray-600">Appointment Type</label>
                                <select name="reason" value={formData.reason || ''} onChange={(e) => setFormData(prev => ({...prev, reason: e.target.value}))} className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" required>
                                    <option value="">Select type...</option>
                                    <option value="Child Checkup">Child Checkup</option>
                                    <option value="Immunization">Immunization</option>
                                    <option value="Nutrition Counseling">Nutrition Counseling</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Date</label>
                                    <div onClick={() => setIsCalendarOpen(true)} className="w-full mt-1 p-2 border rounded-md text-sm flex justify-between items-center cursor-pointer bg-white">
                                        <span>{formData.date || 'Select a date'}</span>
                                        <CalendarIcon />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Time</label>
                                    <input type="time" name="time" value={formData.time || ''} onChange={(e) => setFormData(prev => ({...prev, time: e.target.value}))} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                                </div>
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
        </>
    );
}
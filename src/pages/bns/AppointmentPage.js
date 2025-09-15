import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddBnsAppointmentModal from './AddBnsAppointmentModal'; // Use the new BNS modal
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get the current user
import CalendarPickerModal from '../bns/CalendarPickerModal'; 

const CalendarIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;

// Re-paste the necessary helper components (or import from a shared file)
const ClockIcon = () => <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
// --- WIDGETS & HELPER COMPONENTS ---

const Calendar = ({ selectedDate, onDateSelect, appointments }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(new Date(selectedDate));
        }
    }, [selectedDate]);

    const changeMonth = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const appointmentsOnDate = useMemo(() => {
        const dateStrings = appointments.map(a => new Date(a.date).toDateString());
        return new Set(dateStrings);
    }, [appointments]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = [];
        let day = 1;
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < firstDay) || day > daysInMonth) {
                    week.push({ day: null });
                } else {
                    const fullDate = new Date(year, month, day);
                    const isWeekend = fullDate.getDay() === 0 || fullDate.getDay() === 6;
                    week.push({
                        day: day,
                        hasAppointment: appointmentsOnDate.has(fullDate.toDateString()),
                        isWeekend: isWeekend
                    });
                    day++;
                }
            }
            grid.push(week);
            if (day > daysInMonth) break;
        }
        return grid;
    }, [currentDate, appointmentsOnDate]);

    return (
        <div className="bg-white p-3 rounded-lg w-full shadow-sm border">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 font-bold">&lt;</button>
                <h3 className="font-bold text-gray-700 text-sm">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 font-bold">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-semibold">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 mt-1">
                {calendarGrid.flat().map((dayObj, index) => {
                    if (!dayObj || !dayObj.day) return <div key={index} className="w-8 h-8"></div>;
                    const day = dayObj.day;
                    const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isSelected = selectedDate && (fullDate.toDateString() === selectedDate.toDateString());
                    const isToday = fullDate.toDateString() === new Date().toDateString();
                    return (
                        <div key={index} onClick={!dayObj.isWeekend ? () => onDateSelect(fullDate) : null}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs relative ${dayObj.isWeekend ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'} ${isSelected ? 'bg-blue-600 text-white font-bold' : ''} ${!isSelected && isToday ? 'border-2 border-blue-500 text-blue-600 font-semibold' : ''}`}
                        >
                            {day}
                            {dayObj.hasAppointment && !isSelected && !dayObj.isWeekend && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Scheduled: 'bg-blue-100 text-blue-700',
        Completed: 'bg-green-100 text-green-700',
        Cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const QuickStats = ({ appointments }) => {
    const stats = useMemo(() => {
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'Completed').length;
        const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
        return { total, completed, cancelled };
    }, [appointments]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-bold text-gray-700 text-sm mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-white bg-blue-500 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-bold text-white bg-green-500 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-bold text-white bg-red-400 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.cancelled}</span>
                </div>
            </div>
        </div>
    );
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
        <div className="space-y-2 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-blue-100 mr-2 border border-blue-400"></div><span>Scheduled</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-green-100 mr-2 border border-green-400"></div><span>Completed</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-red-100 mr-2 border border-red-400"></div><span>Cancelled</span></div>
        </div>
    </div>
);

const EditAppointmentModal = ({ appointment, onClose, onSave, addNotification }) => {
    const [formData, setFormData] = useState({});
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { user } = useAuth(); // <-- MOVED HOOK HERE, TO THE TOP LEVEL

    useEffect(() => {
        if (appointment) {
            setFormData({
                patient_name: appointment.patient_name || '',
                reason: appointment.reason || "",
                date: appointment.date || '',
                time: appointment.time || '',
            });
        }
    }, [appointment]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("appointments")
            .update({ reason: formData.reason, date: formData.date, time: formData.time })
            .eq("id", appointment.id);

        if (!error) {
            await logActivity("Appointment Rescheduled", `Rescheduled for ${appointment.patient_name}`);
            await supabase.from('notifications').insert([{
                type: 'appointment_reminder',
                message: `Appointment for ${appointment.patient_name} was rescheduled to ${formData.date}.`,
                user_id: user.id
            }]);
            addNotification('Appointment updated successfully.', 'success');
            onSave();
            onClose();
        } else {
            addNotification(`Error: ${error.message}`, 'error');
        }
    };


    return (
        <>
            <AnimatePresence>
                {isCalendarOpen && ( <CalendarPickerModal onClose={() => setIsCalendarOpen(false)} onDateSelect={(date) => setFormData(prev => ({ ...prev, date: date }))} /> )}
            </AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[51] p-4">
                <motion.div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <h2 className="text-lg font-bold mb-6 border-b pb-2">✏️ Edit Appointment</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Patient Name</label>
                            <input type="text" value={appointment.patient_name} disabled className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Appointment Type</label>
                            <select name="reason" value={formData.reason} onChange={handleChange} className="w-full p-2 border rounded-lg">
                                <option value="">Select Type</option>
                                <option value="Child Checkup">Child Checkup</option>
                                <option value="Immunization">Immunization</option>
                                <option value="Nutrition Counseling">Nutrition Counseling</option>
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Date</label>
                                <div onClick={() => setIsCalendarOpen(true)} className="w-full p-2 border rounded-lg flex justify-between items-center cursor-pointer bg-white">
                                    <span>{formData.date || 'Select a date'}</span>
                                    <CalendarIcon />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Time</label>
                                <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save Changes</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </>
    );
};

const DeleteAppointmentModal = ({ appointment, onClose, onDelete, addNotification }) => {
    const { user } = useAuth(); // Get current user

    const handleDelete = async () => {
        const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
        if (!error) {
            // --- THIS IS THE FIX ---
            await logActivity("Appointment Deleted", `Deleted appointment for ${appointment.patient_name}`);
            await supabase.from('notifications').insert([{
                type: 'appointment_reminder', // or a new 'alert' type
                message: `The appointment for ${appointment.patient_name} on ${appointment.date} was deleted.`,
                user_id: user.id
            }]);
            // --- END FIX ---
            addNotification('Appointment deleted successfully.', 'success');
            onDelete();
            onClose();
        } else {
            addNotification(`Error: ${error.message}`, 'error');
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
                <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete the appointment for <span className="font-semibold">{appointment.patient_name}</span>?</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Cancel</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
            </motion.div>
        </div>
    );
};

const UpdateStatusModal = ({ appointment, onClose, onUpdate, addNotification }) => {
    const { user } = useAuth(); // Get current user

    const handleStatusChange = async (newStatus) => {
        const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", appointment.id);
        if (!error) {
            // --- THIS IS THE FIX ---
            await logActivity(`Appointment ${newStatus}`, `Marked appointment for ${appointment.patient_name} as ${newStatus}`);
            await supabase.from('notifications').insert([{
                type: 'appointment_reminder',
                message: `Appointment for ${appointment.patient_name} was marked as ${newStatus}.`,
                user_id: user.id
            }]);
            // --- END FIX ---
            addNotification(`Appointment marked as ${newStatus}.`, 'success');
            onUpdate();
            onClose();
        } else {
            addNotification(`Error: ${error.message}`, 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <h2 className="text-lg font-bold mb-4">Update Status</h2>
                <p className="text-sm text-gray-600 mb-6">Change status for <span className="font-semibold">{appointment.patient_name}</span>?</p>
                <div className="flex justify-center gap-3">
                    <button onClick={() => handleStatusChange("Completed")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Mark Completed</button>
                    <button onClick={() => handleStatusChange("Cancelled")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Mark Cancelled</button>
                </div>
                <button onClick={onClose} className="mt-4 text-sm text-gray-600 hover:underline">Close</button>
            </motion.div>
        </div>
    );
};

export default function BnsAppointmentPage() {
    const { user } = useAuth(); // Get the currently authenticated user
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeTab, setActiveTab] = useState('All Appointment');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const { addNotification } = useNotification();

    const fetchAppointments = useCallback(async () => {
        if (!user) return; // Don't fetch if user is not loaded yet

        setLoading(true);
        
        // MODIFIED: Added .eq('created_by', user.id) to the query
        // This is the key change to only show appointments created by the logged-in BNS
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('created_by', user.id) // Only fetch records created by this user
            .order('time', { ascending: true });

        if (error) {
            addNotification(`Error fetching appointments: ${error.message}`, 'error');
        } else {
            setAllAppointments(data || []);
        }
        setLoading(false);
    }, [user, addNotification]); // Add user and addNotification to dependency array

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const appointmentsForDisplay = useMemo(() => {
        let baseList = allAppointments;

        if (searchTerm) {
            baseList = baseList.filter(app => app.patient_name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (activeTab === 'Today') {
            return baseList.filter(app => new Date(app.date).toDateString() === new Date().toDateString());
        }
        if (activeTab === 'Cancelled') {
            return baseList.filter(app => app.status === 'Cancelled');
        }
        if (activeTab === 'All Appointment') {
            if (selectedDate) {
                return baseList.filter(app => new Date(app.date).toDateString() === selectedDate.toDateString());
            }
            return baseList;
        }
        return baseList;
    }, [allAppointments, activeTab, searchTerm, selectedDate]);
    
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSelectedDate(null);
    };

    return (
        <>
            <AnimatePresence>
                {isModalOpen && <AddBnsAppointmentModal onClose={() => setIsModalOpen(false)} onSave={fetchAppointments} />}
                {isEditModalOpen && selectedAppointment && ( <EditAppointmentModal appointment={selectedAppointment} onClose={() => setIsEditModalOpen(false)} onSave={fetchAppointments} addNotification={addNotification} /> )}
                {isDeleteModalOpen && selectedAppointment && ( <DeleteAppointmentModal appointment={selectedAppointment} onClose={() => setIsDeleteModalOpen(false)} onDelete={fetchAppointments} addNotification={addNotification} /> )}
                {isStatusModalOpen && selectedAppointment && ( <UpdateStatusModal appointment={selectedAppointment} onClose={() => setIsStatusModalOpen(false)} onUpdate={fetchAppointments} addNotification={addNotification} /> )}
            </AnimatePresence>

            {/* MODIFIED: This is the full layout structure that was missing */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content Column */}
                <div className="xl:col-span-3 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm whitespace-nowrap">+ Add Appointment</button>
                        <div className="w-full md:w-auto flex-1 flex justify-center items-center gap-4 text-sm font-semibold">
                            {['All Appointment', 'Today', 'Cancelled'].map(tab => (
                                <button key={tab} onClick={() => handleTabClick(tab)} className={`whitespace-nowrap px-1 py-1 ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative mb-4">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input type="text" placeholder="Search Appointment by Patient Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-gray-50 focus:bg-white" />
                    </div>

                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="w-full xl:w-72 flex-shrink-0">
                            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} appointments={allAppointments} />
                        </div>
                        <div className="flex-1 space-y-2 h-[450px] overflow-y-auto pr-2">
                            {loading && <div className="text-center p-8">Loading...</div>}
                            {!loading && appointmentsForDisplay.map(app => (
                                <div
                                    key={app.id}
                                    className="p-3 rounded-lg border hover:shadow-md cursor-pointer"
                                    onClick={() => { setSelectedAppointment(app); setIsStatusModalOpen(true); }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800">{app.patient_name} <span className="font-normal text-gray-500">({app.patient_display_id || 'N/A'})</span></p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                <ClockIcon />
                                                <span>{app.time} - {app.reason}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 ml-4"><StatusBadge status={app.status} /></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-400">{new Date(app.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</p>
                                        <div className="flex space-x-3 text-xs font-semibold">
                                            <button className="text-blue-600 hover:underline" onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsEditModalOpen(true); }}>Edit</button>
                                            <button className="text-red-600 hover:underline" onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsDeleteModalOpen(true); }}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && appointmentsForDisplay.length === 0 && <div className="text-center text-sm text-gray-500 p-8 h-full flex items-center justify-center">No appointments found.</div>}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar Column */}
                <div className="xl:col-span-1 space-y-4">
                    <QuickStats appointments={appointmentsForDisplay} />
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}

// NOTE: You will need to copy/paste the helper components from your BHW AppointmentPage.js
// into this file for it to work (Calendar, StatusBadge, QuickStats, etc.)
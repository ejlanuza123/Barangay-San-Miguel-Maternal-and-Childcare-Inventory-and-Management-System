import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddAppointmentModal from './AddAppointmentModal';
import { AnimatePresence } from 'framer-motion';

// --- ICONS ---
const ClockIcon = () => <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;

// --- Helper & Widget Components ---

const Calendar = ({ selectedDate, onDateSelect, appointments }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

    useEffect(() => {
        // When selectedDate changes, update the calendar's view to that month
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
                    week.push({
                        day: day,
                        hasAppointment: appointmentsOnDate.has(fullDate.toDateString())
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
                        <div key={index} onClick={() => onDateSelect(fullDate)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer relative 
                                ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
                                ${!isSelected && isToday ? 'border-2 border-blue-500 text-blue-600 font-semibold' : ''}
                                ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                            `}>
                            {day}
                            {dayObj.hasAppointment && !isSelected && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>}
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
        Cancelled: 'bg-gray-100 text-gray-700',
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
                    <span className="text-gray-600">Total Today</span>
                    <span className="font-bold text-white bg-blue-500 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-bold text-white bg-green-500 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-bold text-white bg-gray-400 rounded-md w-6 h-6 flex items-center justify-center text-xs">{stats.cancelled}</span>
                </div>
            </div>
        </div>
    );
};
const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
        <div className="space-y-2 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-blue-200 mr-2 border border-blue-300"></div><span>Scheduled</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-green-200 mr-2 border border-green-300"></div><span>Completed</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded bg-gray-200 mr-2 border border-gray-300"></div><span>Cancelled</span></div>
        </div>
    </div>
);


export default function AppointmentPage() {
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeTab, setActiveTab] = useState('All Appointment');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('appointments').select('*').order('time', { ascending: true });
        if (error) console.error("Error fetching appointments:", error);
        else setAllAppointments(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const appointmentsForDisplay = useMemo(() => {
        let baseList = allAppointments;

        if (searchTerm) {
            baseList = baseList.filter(app =>
                app.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
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
                {isModalOpen && <AddAppointmentModal onClose={() => setIsModalOpen(false)} onSave={fetchAppointments} />}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
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
                        <input type="text" placeholder="Search Appointment" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-gray-50 focus:bg-white" />
                    </div>

                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="w-full xl:w-72 flex-shrink-0">
                            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} appointments={allAppointments} />
                        </div>
                        <div className="flex-1 space-y-2 h-[450px] overflow-y-auto pr-2">
                            {loading && <div className="text-center p-8">Loading...</div>}
                            {!loading && appointmentsForDisplay.map(app => (
                                <div key={app.id} className="p-3 rounded-lg border hover:shadow-md">
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
                                            <button className="text-blue-600 hover:underline">Edit</button>
                                            <button className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && appointmentsForDisplay.length === 0 && <div className="text-center text-sm text-gray-500 p-8 h-full flex items-center justify-center">No appointments found.</div>}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-4">
                    <QuickStats appointments={appointmentsForDisplay} />
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}
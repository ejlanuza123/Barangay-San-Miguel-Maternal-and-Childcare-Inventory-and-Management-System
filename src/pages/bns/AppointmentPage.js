import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext'; 

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const ChevronLeftIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;

// --- HELPER FUNCTION: Get Next Thursday ---
const getNextThursday = () => {
    const d = new Date();
    // 4 is Thursday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu)
    // If today is Thursday (4), we return today.
    const diff = (4 + 7 - d.getDay()) % 7; 
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// --- CALENDAR WIDGET ---
const CalendarWidget = ({ selectedDate, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const changeMonth = (amount) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateDates = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const dates = [];

        for (let i = 0; i < firstDay; i++) {
            dates.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const isThursday = date.getDay() === 4; // 4 is Thursday

            dates.push(
                <button
                    key={day}
                    onClick={() => onDateSelect(date)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors
                        ${isSelected ? 'bg-green-600 text-white font-bold shadow-md' : 'hover:bg-green-50 text-gray-700'}
                        ${!isSelected && isToday ? 'border border-green-400 font-semibold' : ''}
                        ${!isSelected && isThursday ? 'bg-green-50 text-green-600 font-medium' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }
        return dates;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 text-sm">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                        <ChevronLeftIcon />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {daysOfWeek.map(day => (
                    <span key={day} className="text-[10px] font-bold text-gray-400">{day}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 justify-items-center">
                {generateDates()}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-center space-x-4 text-[10px] text-gray-500">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div> Selected</div>
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-50 mr-1 border border-green-200"></div> Regular Visit</div>
            </div>
        </div>
    );
};

export default function BnsAppointmentPage() {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const { addNotification } = useNotification();
    
    // Calculate the next upcoming Thursday relative to today
    const nextVisitDate = useMemo(() => getNextThursday(), []);

    const fetchChildren = useCallback(async () => {
        setLoading(true);
        // Fetch ALL active children
        const { data, error } = await supabase
            .from('child_records')
            .select('*')
            .eq('is_deleted', false)
            .order('last_name', { ascending: true });

        if (error) {
            console.error("Error fetching children:", error);
            addNotification("Error loading child list.", "error");
        } else {
            setChildren(data || []);
        }
        setLoading(false);
    }, [addNotification]);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    const filteredChildren = useMemo(() => {
        if (!searchTerm) return children;
        return children.filter(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.child_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [children, searchTerm]);

    const isThursday = selectedDate.getDay() === 4;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* --- LEFT COLUMN: LIST --- */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <CalendarIcon />
                                Child Health Follow-up Visits
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Viewing list for: <span className="font-bold text-green-600">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                        </div>
                        {!isThursday && (
                            <div className="mt-4 md:mt-0 px-4 py-2 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200">
                                Note: Selected day is not a regular Thursday visit day.
                            </div>
                        )}
                    </div>

                    {/* Children List Table */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-semibold text-gray-700">
                                {isThursday ? "Expected Children (First Come, First Serve)" : "All Active Records"}
                            </h2>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                                <input 
                                    type="text" 
                                    placeholder="Search Child..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="pl-10 pr-4 py-2 text-sm border rounded-md focus:ring-green-500 focus:border-green-500 w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Child ID</th>
                                        <th className="px-6 py-3 font-medium">Child's Name</th>
                                        <th className="px-6 py-3 font-medium">Parent/Guardian</th>
                                        <th className="px-6 py-3 text-center font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading list...</td></tr>
                                    ) : filteredChildren.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No children found.</td></tr>
                                    ) : (
                                        filteredChildren.map(child => (
                                            <tr key={child.id} className="hover:bg-green-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{child.child_id}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-700">{child.last_name}, {child.first_name}</td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    <span className="block text-gray-900">{child.mother_name || child.guardian_name}</span>
                                                    <span className="text-xs">Parent/Guardian</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isThursday ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Walk-in Expected
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            Active Record
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t text-center text-xs text-gray-400 bg-gray-50 rounded-b-lg">
                            Total Records: {filteredChildren.length}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: CALENDAR & INFO --- */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Next Scheduled Visit Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-green-200 bg-gradient-to-br from-white to-green-50">
                        <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-1">Next Regular Visit</p>
                        <p className="text-xl font-extrabold text-green-800">{nextVisitDate}</p>
                        <p className="text-xs text-green-400 mt-2">Every Thursday</p>
                    </div>

                    {/* Calendar Widget */}
                    <CalendarWidget 
                        selectedDate={selectedDate} 
                        onDateSelect={setSelectedDate} 
                    />
                </div>

            </div>
        </div>
    );
}
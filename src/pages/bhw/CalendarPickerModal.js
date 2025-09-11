import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// This is the interactive calendar component, designed to be used inside a modal.
const Calendar = ({ onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const calendarGrid = useMemo(() => {
        // This logic builds the visual grid for the calendar month.
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
                    week.push({ day: day, fullDate: fullDate });
                    day++;
                }
            }
            grid.push(week);
            if (day > daysInMonth) break;
        }
        return grid;
    }, [currentDate]);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-3 px-2">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 font-bold">&lt;</button>
                <h3 className="font-bold text-gray-700 text-sm">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 font-bold">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-semibold">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="w-10 h-10 flex items-center justify-center">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 mt-1">
                {calendarGrid.flat().map((dayObj, index) => {
                    if (!dayObj || !dayObj.day) return <div key={index} className="w-10 h-10"></div>;
                    
                    const { day, fullDate } = dayObj;
                    const dayOfWeek = fullDate.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isToday = fullDate.toDateString() === new Date().toDateString();

                    return (
                        <div key={index} className="flex justify-center items-center">
                            <button
                                type="button"
                                onClick={() => onDateSelect(fullDate)}
                                disabled={isWeekend}
                                className={`w-9 h-9 flex items-center justify-center rounded-full text-xs 
                                    ${isWeekend ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-100 cursor-pointer'}
                                    ${isToday ? 'border-2 border-blue-500 text-blue-600 font-semibold' : ''}
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// This is the main modal component that wraps the Calendar.
export default function CalendarPickerModal({ onClose, onDateSelect }) {
    const handleDateSelection = (date) => {
        // --- FIX FOR TIMEZONE ISSUE ---
        // Manually build the YYYY-MM-DD string from local date components
        // to avoid the automatic conversion to UTC that .toISOString() causes.
        
        const year = date.getFullYear();
        // .getMonth() is 0-indexed (0=Jan), so we add 1. padStart ensures it's two digits (e.g., 09).
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const day = String(date.getDate()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        // --- END FIX ---
        
        onDateSelect(formattedDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100] p-4">
            <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <Calendar onDateSelect={handleDateSelection} />
                <div className="flex justify-end mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                </div>
            </motion.div>
        </div>
    );
}
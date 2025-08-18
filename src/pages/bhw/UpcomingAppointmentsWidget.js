import React from 'react';

const CalendarIcon = () => <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;

export default function UpcomingAppointmentsWidget() {
    const appointments = [
        { name: "Maria Santos", type: "Prenatal Check-up", time: "09:30 AM" },
        { name: "Ana Chang", type: "Vaccination", time: "10:00 AM" },
        { name: "Marites Lanuza", type: "Regular Check-up", time: "10:00 AM" }
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-4">Upcoming Appointment</h3>
            <div className="space-y-4">
                {appointments.map(app => (
                    <div key={app.name} className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <CalendarIcon />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700 text-sm">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.type}</p>
                            <p className="text-xs font-bold text-gray-600">{app.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
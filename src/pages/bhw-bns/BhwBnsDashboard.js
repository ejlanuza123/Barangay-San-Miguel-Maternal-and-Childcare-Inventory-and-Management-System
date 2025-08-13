import React from 'react';

// --- Reusable Components for the Dashboard ---

const RecentActivity = () => {
    const activities = [
        { action: "BHW Cruz Created new patient record", details: "Dela Cruz, Maria - initial consultation completed", time: "2 mins ago", color: "blue" },
        { action: "BHW Reyes Scheduled appointment", details: "Santos, Ana - Prenatal checkup on July 28", time: "15 mins ago", color: "green" },
        { action: "Admin Santos Updated inventory", details: "Prenatal Vitamins - Added 100 bottles to stock", time: "45 mins ago", color: "yellow" },
        { action: "BHW Cruz Recorded vital signs", details: "Reyes, Isabella - BP 140/90, Weight: 65kg", time: "1 hour ago", color: "red" },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Recent Activity</h3>
                <a href="#" className="text-sm font-semibold text-blue-600">View All &gt;</a>
            </div>
            <div className="space-y-4">
                {activities.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 bg-${item.color}-500`}></div>
                        <div>
                            <p className="font-semibold text-gray-700">{item.action}</p>
                            <p className="text-sm text-gray-500">{item.details}</p>
                            <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Calendar = () => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dates = Array.from({ length: 35 }, (_, i) => i - 1); // Sample dates for June 2025

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button className="text-gray-600">&lt;</button>
                <h3 className="font-bold text-gray-800">June 2025</h3>
                <button className="text-gray-600">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {days.map(day => <div key={day} className="font-bold text-gray-500">{day}</div>)}
                {dates.map((date, index) => (
                    <div key={index} className={`p-2 rounded-full ${date < 1 ? 'text-gray-300' : ''} ${date === 26 ? 'bg-blue-500 text-white' : ''}`}>
                        {date > 0 ? date : ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickAccess = () => (
    <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Quick Access</h3>
        <button className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700">
            + Add New Patient
        </button>
        <button className="w-full bg-orange-400 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-orange-500">
            Generate Reports
        </button>
    </div>
);

const UpcomingAppointments = () => {
    const appointments = [
        { name: "Dela Cruz, Maria", date: "2024-07-28", time: "09:00 AM", reason: "Prenatal Checkup", bns: "Cruz", status: "Completed" },
        { name: "Reyes, Juan", date: "2024-07-29", time: "10:30 AM", reason: "Immunization", bns: "Santos", status: "Scheduled" },
        { name: "Santos, Ana", date: "2024-07-30", time: "02:00 PM", reason: "Nutrition Counseling", bns: "Reyes", status: "Scheduled" },
    ];
    const getStatusClass = (status) => {
        switch(status) {
            case "Completed": return "bg-green-100 text-green-700";
            case "Scheduled": return "bg-yellow-100 text-yellow-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Upcoming Appointments</h3>
                <button className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-600">
                    Scheduled Check-up
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="p-2">Patient Name</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Time</th>
                            <th className="p-2">Reason</th>
                            <th className="p-2">BNS</th>
                            <th className="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((app, index) => (
                            <tr key={index} className="border-t">
                                <td className="p-2 font-semibold">{app.name}</td>
                                <td className="p-2">{app.date}</td>
                                <td className="p-2">{app.time}</td>
                                <td className="p-2">{app.reason}</td>
                                <td className="p-2">{app.bns}</td>
                                <td className="p-2">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClass(app.status)}`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main BHW Dashboard Component ---
export default function BhwBnsDashboard() {
  return (
    // The <header> section has been removed from this file.
    // The main content grid now starts at the top level.
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecentActivity />
                <Calendar />
            </div>
        </div>
        <div className="lg:col-span-1">
            <QuickAccess />
        </div>
        <UpcomingAppointments />
    </div>
  );
}

import React from 'react';

export default function QuickStats() {
    const stats = [
        { label: "Total Patients", value: "1,324" },
        { label: "Active Patients", value: "28" },
        { label: "Today's Visits", value: "15" }
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
                {stats.map(stat => (
                    <div key={stat.label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{stat.label}</span>
                        <span className="font-bold text-gray-800">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
import React from 'react';

const ViewIcon = () => <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;

export default function StatusLegend() {
    const actions = [
        { label: "View", icon: <ViewIcon /> },
        { label: "Update", icon: <UpdateIcon /> },
        { label: "Delete", icon: <DeleteIcon /> }
    ];

    const risks = [
        { label: "NORMAL", color: "bg-green-500" },
        { label: "MID RISK", color: "bg-yellow-500" },
        { label: "HIGH RISK", color: "bg-red-500" }
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-4">Status Legend</h3>
            <div className="space-y-4">
                <div>
                    {actions.map(action => (
                        <div key={action.label} className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                            {action.icon}
                            <span>{action.label}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4">
                    {risks.map(risk => (
                        <div key={risk.label} className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                            <span className={`w-4 h-4 rounded-sm ${risk.color}`}></span>
                            <span>{risk.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
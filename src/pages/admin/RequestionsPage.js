import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const styles = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Approved: 'bg-green-100 text-green-700',
        Denied: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 text-xs font-bold rounded-md ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const ActionButtons = ({ request, onApprove, onDeny }) => (
    <div className="flex items-center space-x-2">
        <button onClick={() => onApprove(request)} title="Approve" className="p-1 rounded-md text-green-500 hover:bg-green-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </button>
        <button onClick={() => onDeny(request)} title="Deny" className="p-1 rounded-md text-red-500 hover:bg-red-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        {/* You can add a View modal button here if needed */}
    </div>
);

// --- Main Page Component ---
export default function RequestionsPage() {
    const [activeTab, setActiveTab] = useState('BHW');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [requestions, setRequestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    // src/pages/admin/RequestionsPage.js

    const fetchRequestions = useCallback(async () => {
        setLoading(true);
        const roleFilter = activeTab === 'BHW' ? 'BHW' : 'BNS';
        
        // --- THIS IS THE CORRECTED LINE ---
        // By adding "!inner", we are forcing the query to only return requests
        // that have a matching profile with the correct role.
        let query = supabase.from('requestions')
            .select('*, profiles:worker_id!inner(first_name, last_name, role, user_id_no)')
            .eq('profiles.role', roleFilter);

        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            addNotification(`Error fetching requestions: ${error.message}`, 'error');
        } else {
            setRequestions(data || []);
        }
        setLoading(false);
    }, [activeTab, statusFilter, addNotification]);

    useEffect(() => {
        fetchRequestions();
    }, [fetchRequestions]);

    // This function is called when the green checkmark is clicked
    const handleApprove = async (request) => {
        let actionError = null;
        if (request.request_type === 'Update') {
            const { error } = await supabase.from(request.target_table).update(request.request_data).eq('id', request.target_record_id);
            actionError = error;
        } else if (request.request_type === 'Delete') {
            const { error } = await supabase.from(request.target_table).delete().eq('id', request.target_record_id);
            actionError = error;
        }

        if (actionError) {
            addNotification(`Failed to execute action: ${actionError.message}`, 'error');
            return;
        }

        const { error: statusError } = await supabase.from('requestions').update({ status: 'Approved' }).eq('id', request.id);
        
        if (statusError) {
            addNotification(`Action completed, but failed to update request status: ${statusError.message}`, 'warning');
        } else {
            addNotification(`Request has been approved.`, 'success');
            // --- MODIFIED: Pass the original worker's ID to the logger ---
            logActivity(
                'Request Approved', 
                `Your ${request.request_type} request was approved by an Admin.`,
                request.worker_id 
            );
        }
        fetchRequestions();
    };

    // This function is called when the red 'X' is clicked
    const handleDeny = async (request) => {
        // This simply updates the request's status to 'Denied'
        const { error } = await supabase.from('requestions').update({ status: 'Denied' }).eq('id', request.id);
        if (error) {
            addNotification(`Failed to deny request: ${error.message}`, 'error');
        } else {
            addNotification('Request has been denied.', 'success');
            logActivity('Request Denied', `Denied ${request.request_type} for record ID ${request.target_record_id}`);
        }
        fetchRequestions(); // Refresh the list to show the change
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Barangay Workers Requests</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex border-b mb-4">
                    <button onClick={() => setActiveTab('BHW')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'BHW' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>BARANGAY HEALTH WORKER</button>
                    <button onClick={() => setActiveTab('BNS')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'BNS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>BARANGAY NUTRITION SCHOLAR</button>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                    {['All', 'Pending', 'Approved', 'Denied'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-xs font-bold rounded-full ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{status}</button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500 font-semibold">
                                {['ID NO. REQUEST', 'NAME/ID/ROLE', 'TYPE/REQUEST DATE', 'TIME', 'STATUS', 'ACTION'].map(h => <th key={h} className="px-3 py-3">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-6">Loading requests...</td></tr>
                            ) : requestions.map(req => (
                                <tr key={req.id}>
                                    <td className="px-3 py-3 font-medium text-gray-700">{`REQ - ${req.id}`}</td>
                                    <td className="px-3 py-3">
                                        <div className="font-semibold">{req.profiles?.first_name} {req.profiles?.last_name}</div>
                                        <div className="text-gray-500">{req.profiles?.user_id_no} - {req.profiles?.role}</div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="font-semibold">{req.request_type} Patient Record</div>
                                        <div className="text-gray-500">Patient ID: {req.request_data.patient_id || req.request_data.child_id}</div>
                                        <div className="text-gray-500">{new Date(req.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                                    <td className="px-3 py-3">
                                        {req.status === 'Pending' && <ActionButtons request={req} onApprove={handleApprove} onDeny={handleDeny} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
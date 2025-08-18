import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
export default function ViewRecords() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('patients').select('*');
            if (error) console.error('Error fetching patients:', error);
            else setPatients(data);
            setLoading(false);
        };
        fetchPatients();
    }, []);

    if (loading) return <div>Loading records...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Maternity Management</h2>
                <button className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">Add New Patient</button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {/* Table UI from previous example */}
            </div>
        </div>
    );
}

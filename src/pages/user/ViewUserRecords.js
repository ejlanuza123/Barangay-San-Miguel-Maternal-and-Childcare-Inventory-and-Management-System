import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
export default function ViewUserRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndRecords = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase.from('patients').select('*').eq('guardian_id', user.id);
                if (error) console.error("Error fetching patient records:", error);
                else setRecords(data);
            }
            setLoading(false);
        };
        fetchUserAndRecords();
    }, []);

    if (loading) return <div>Loading your records...</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My and My Child's Records</h2>
            <div className="bg-white rounded-lg shadow space-y-4 p-6">
                {/* UI to display records from previous example */}
            </div>
        </div>
    );
}
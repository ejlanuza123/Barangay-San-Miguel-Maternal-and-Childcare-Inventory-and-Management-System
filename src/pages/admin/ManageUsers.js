import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) console.error('Error fetching users:', error);
            else setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    if (loading) return <div>Loading user list...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Manage Users</h2>
                <button className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">Create New User</button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {/* Table UI from previous example */}
            </div>
        </div>
    );
}
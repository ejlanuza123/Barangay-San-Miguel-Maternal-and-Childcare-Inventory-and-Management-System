import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
export default function ScheduleAppointment() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase.from('appointments').select('*').eq('user_id', user.id);
                if (error) console.error("Error fetching appointments:", error);
                else setAppointments(data);
            }
            setLoading(false);
        };
        fetchAppointments();
    }, []);

    if (loading) return <div>Loading your appointments...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">My Appointments</h2>
                <button className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">Request New Appointment</button>
            </div>
            <div className="bg-white rounded-lg shadow space-y-4 p-6">
                {/* UI to display appointments from previous example */}
            </div>
        </div>
    );
}
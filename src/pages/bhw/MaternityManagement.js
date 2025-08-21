import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddPatientModal from '../../pages/bhw/AddPatientModal';
import { AnimatePresence } from 'framer-motion';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;


const RiskLevelBadge = ({ level }) => {
    const levelStyles = {
        'NORMAL': 'bg-green-100 text-green-700',
        'MID RISK': 'bg-yellow-100 text-yellow-700',
        'HIGH RISK': 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${levelStyles[level] || 'bg-gray-100 text-gray-800'}`}>{level}</span>;
};

const QuickStats = ({ stats }) => (
    <div className="bg-white p-3 rounded-lg shadow border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Quick Stats</h3>
        <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center"><span className="text-gray-600">Total Patients</span><span className="font-bold text-gray-800">{stats.total}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Active Patients</span><span className="font-bold text-gray-800">{stats.active}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Today's Visits</span><span className="font-bold text-gray-800">{stats.today}</span></div>
        </div>
    </div>
);

const UpcomingAppointmentsWidget = ({ appointments }) => (
    <div className="bg-white p-3 rounded-lg shadow border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Upcoming Appointment</h3>
        <div className="space-y-3">
            {appointments.length > 0 ? appointments.map(app => (
                 <div key={app.id} className="flex items-center space-x-2">
                    <div className="bg-blue-100 p-1 rounded"><CalendarIcon /></div>
                    <div>
                        <p className="font-semibold text-gray-700 text-xs">{app.patient_name}</p>
                        <p className="text-xs text-gray-500">{app.reason}</p>
                    </div>
                </div>
            )) : <p className="text-xs text-gray-500">No upcoming appointments.</p>}
        </div>
    </div>
);

const StatusLegend = () => (
    <div className="bg-white p-3 rounded-lg shadow border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
        <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-700"><ViewIcon /><span>View</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><UpdateIcon /><span>Update</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><DeleteIcon /><span>Delete</span></div>
            <div className="border-t my-2"></div>
            <div className="flex items-center space-x-2 font-semibold text-gray-700"><span className="w-3 h-3 rounded-sm bg-green-500"></span><span>NORMAL</span></div>
            <div className="flex items-center space-x-2 font-semibold text-gray-700"><span className="w-3 h-3 rounded-sm bg-yellow-500"></span><span>MID RISK</span></div>
            <div className="flex items-center space-x-2 font-semibold text-gray-700"><span className="w-3 h-3 rounded-sm bg-red-500"></span><span>HIGH RISK</span></div>
        </div>
    </div>
);


export default function MaternityManagement() {
    const [allPatients, setAllPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ risk_level: 'All' });

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        const [patientResponse, appointmentsResponse, patientCountResponse] = await Promise.all([
            supabase.from('patients').select('*').order('created_at', { ascending: false }),
            supabase.from('appointments').select('*').order('date', { ascending: true }).limit(3),
            supabase.from('patients').select('*', { count: 'exact', head: true })
        ]);

        if (patientResponse.data) setAllPatients(patientResponse.data);
        if (appointmentsResponse.data) setUpcomingAppointments(appointmentsResponse.data);
        setStats({ total: patientCountResponse.count || 0, active: 28, today: 15 });

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const filteredPatients = useMemo(() => {
        return allPatients
            .filter(patient => {
                // Filter by risk level
                if (filters.risk_level === 'All') return true;
                return patient.risk_level === filters.risk_level;
            })
            .filter(patient => {
                // Filter by search term (name or patient_id)
                if (!searchTerm) return true;
                const fullName = `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
                return fullName.includes(searchTerm.toLowerCase()) || 
                       patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allPatients, searchTerm, filters]);


    if (loading) return <div className="p-4">Loading patient records...</div>;

    return (
        <>
            <AnimatePresence>
                {isModalOpen && <AddPatientModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={fetchPageData}
                />}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-3">
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <h2 className="text-2xl font-bold text-gray-700">Patient List</h2>
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2"> <SearchIcon /> </span>
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or ID..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50 focus:bg-white" 
                                    />
                                </div>
                                <div className="relative">
                                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50">
                                        <FilterIcon /> <span>Filter</span>
                                    </button>
                                    {isFilterOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                            <div className="p-2 text-sm font-semibold border-b">Filter by Risk Level</div>
                                            <div className="p-2">
                                                {['All', 'NORMAL', 'MID RISK', 'HIGH RISK'].map(level => (
                                                     <label key={level} className="flex items-center space-x-2 text-sm">
                                                        <input type="radio" name="risk_level" value={level} checked={filters.risk_level === level} onChange={(e) => setFilters({...filters, risk_level: e.target.value})} />
                                                        <span>{level}</span>
                                                     </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-500 font-semibold">
                                        {['ID', 'Full Name', 'Age', 'Contact', 'Weeks', 'Last Visit', 'Risk', 'Actions'].map(header => (
                                            <th key={header} className="px-2 py-2">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredPatients.map(p => (
                                        <tr key={p.id} className="text-gray-600">
                                            <td className="px-2 py-2 font-medium">{p.patient_id}</td>
                                            <td className="px-2 py-2">{`${p.first_name} ${p.middle_name || ''} ${p.last_name}`}</td>
                                            <td className="px-2 py-2">{p.age}</td>
                                            <td className="px-2 py-2">{p.contact_no}</td>
                                            <td className="px-2 py-2">{p.weeks}</td>
                                            <td className="px-2 py-2">{p.last_visit}</td>
                                            <td className="px-2 py-2"><RiskLevelBadge level={p.risk_level} /></td>
                                            <td className="px-2 py-2">
                                                <div className="flex space-x-1">
                                                    <button className="text-gray-400 hover:text-blue-600 p-1"><ViewIcon /></button>
                                                    <button className="text-gray-400 hover:text-green-600 p-1"><UpdateIcon /></button>
                                                    <button className="text-gray-400 hover:text-red-600 p-1"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex justify-center mt-4">
                             <nav className="flex items-center space-x-1 text-xs">
                                 <button className="px-2 py-1 rounded hover:bg-gray-200">&lt;</button>
                                 <button className="px-2 py-1 rounded bg-blue-500 text-white font-semibold">1</button>
                                 <button className="px-2 py-1 rounded hover:bg-gray-200">2</button>
                                 <button className="px-2 py-1 rounded hover:bg-gray-200">3</button>
                                 <span>...</span>
                                 <button className="px-2 py-1 rounded hover:bg-gray-200">45</button>
                                 <button className="px-2 py-1 rounded hover:bg-gray-200">&gt;</button>
                            </nav>
                        </div>
                    </div> 
                </div>

                <div className="xl:col-span-1">
                    <div className="space-y-4">
                        <button onClick={() => setIsModalOpen(true)} className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">
                            + Add New Patient
                        </button>
                        <QuickStats stats={stats} />
                        <UpcomingAppointmentsWidget appointments={upcomingAppointments} />
                        <StatusLegend />
                    </div>
                </div>
            </div>
        </>
    );
}
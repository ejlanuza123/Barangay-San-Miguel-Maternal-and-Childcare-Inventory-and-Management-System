import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddPatientModal from '../../pages/bhw/AddPatientModal';
import { AnimatePresence, motion } from 'framer-motion';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;

// --- Helper Components ---
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

// --- NEW/UPDATED MODALS ---
const DeleteConfirmationModal = ({ patientName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
            className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 my-4">Are you sure you want to delete the record for <span className="font-semibold">{patientName}</span>? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm">Yes, Delete</button>
            </div>
        </motion.div>
    </div>
);

// --- UPDATED ViewPatientModal Component ---
const ViewPatientModal = ({ patient, onClose }) => {
    const history = patient.medical_history || {};
    
    // Helper function to render section headers
    const SectionHeader = ({ title }) => (
        <div className="bg-gray-100 p-2 rounded-md mb-3">
            <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        </div>
    );

    // Helper function to render field rows
    const FieldRow = ({ label, value, cols = 2 }) => (
        <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4 mb-3`}>
            <div className="font-semibold text-gray-700 text-sm">{label}:</div>
            <div className="text-gray-600 text-sm">{value || 'N/A'}</div>
        </div>
    );

    // Helper function to render checkbox fields
    const CheckboxField = ({ label, checked }) => (
        <div className="flex items-center mb-2">
            <div className={`w-4 h-4 border rounded mr-2 ${checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                {checked && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                )}
            </div>
            <span className="text-sm text-gray-600">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">PATIENT TREATMENT RECORD</h2>
                        <button onClick={onClose} className="text-white hover:text-gray-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="font-semibold">Patient ID:</span> {patient.patient_id}</div>
                        <div><span className="font-semibold">Name:</span> {`${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`}</div>
                        <div><span className="font-semibold">Age:</span> {patient.age}</div>
                        <div><span className="font-semibold">Contact:</span> {patient.contact_no || 'N/A'}</div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* Personal Information */}
                    <SectionHeader title="PERSONAL INFORMATION" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FieldRow label="Patient ID" value={patient.patient_id} />
                        <FieldRow label="Last Name" value={patient.last_name} />
                        <FieldRow label="First Name" value={patient.first_name} />
                        <FieldRow label="Middle Name" value={patient.middle_name} />
                        <FieldRow label="Age" value={patient.age} />
                        <FieldRow label="Contact No." value={patient.contact_no} />
                        <FieldRow label="Weeks of Pregnancy" value={patient.weeks} />
                        <FieldRow label="Last Visit" value={patient.last_visit} />
                        <FieldRow label="Risk Level" value={patient.risk_level} />
                        <FieldRow label="Date of Birth" value={history.dob} />
                        <FieldRow label="Blood Type" value={history.blood_type} />
                        <FieldRow label="NHTS No." value={history.nhts_no} />
                        <FieldRow label="PhilHealth No." value={history.philhealth_no} />
                        <FieldRow label="Family Folder No." value={history.family_folder_no} />
                        <FieldRow label="Purok" value={history.purok} />
                        <FieldRow label="Street" value={history.street} />
                    </div>

                    {/* Obstetrical Score */}
                    <SectionHeader title="OBSTETRICAL SCORE" />
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <FieldRow label="G" value={history.g_score} cols={1} />
                        <FieldRow label="P" value={history.p_score} cols={1} />
                        <FieldRow label="Term" value={history.term} cols={1} />
                        <FieldRow label="Preterm" value={history.preterm} cols={1} />
                        <FieldRow label="Abortion" value={history.abortion} cols={1} />
                        <FieldRow label="Living Children" value={history.living_children} cols={1} />
                    </div>

                    {/* Pregnancy History */}
                    <SectionHeader title="PREGNANCY HISTORY" />
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm border">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Gravida', 'Outcome', 'Sex', 'NSD/CS', 'Delivered At'].map(h => 
                                        <th key={h} className="p-2 border font-medium text-xs">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(g => (
                                    <tr key={g}>
                                        <td className="p-2 border text-center font-semibold text-gray-600">G{g}</td>
                                        <td className="p-2 border">{history[`g${g}_outcome`] || '-'}</td>
                                        <td className="p-2 border">{history[`g${g}_sex`] || '-'}</td>
                                        <td className="p-2 border">{history[`g${g}_delivery_type`] || '-'}</td>
                                        <td className="p-2 border">{history[`g${g}_delivered_at`] || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Menstrual Period & OB History */}
                    <SectionHeader title="MENSTRUAL PERIOD & OB HISTORY" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FieldRow label="Last Menstrual Period (LMP)" value={history.lmp} />
                        <FieldRow label="Risk Code" value={history.risk_code} />
                        <FieldRow label="Expected Date of Confinement (EDC)" value={history.edc} />
                        <FieldRow label="Age of First Period" value={history.age_first_period} />
                        <FieldRow label="Age of Menarche" value={history.age_of_menarche} />
                        <FieldRow label="Amount of Bleeding" value={history.bleeding_amount} />
                        <FieldRow label="Duration of Menstruation (days)" value={history.menstruation_duration} />
                    </div>

                    {/* Vaccination Record */}
                    <SectionHeader title="VACCINATION RECORD" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {['TT1', 'TT2', 'TT3', 'TT4', 'TT5', 'FIM'].map(vaccine => (
                            <FieldRow 
                                key={vaccine} 
                                label={`${vaccine} Date`} 
                                value={history[`vaccine_${vaccine.toLowerCase()}`]} 
                            />
                        ))}
                    </div>

                    {/* Medical History */}
                    <SectionHeader title="MEDICAL HISTORY" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Personal History */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Personal History</h4>
                            {['Diabetes Mellitus (DM)', 'Asthma', 'Cardiovascular Disease (CVD)', 'Heart Disease', 'Goiter'].map(condition => (
                                <CheckboxField 
                                    key={condition}
                                    label={condition} 
                                    checked={history[`ph_${condition}`]} 
                                />
                            ))}
                        </div>

                        {/* Hereditary Disease History */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Hereditary Disease History</h4>
                            {['Hypertension (HPN)', 'Asthma', 'Heart Disease', 'Diabetes Mellitus', 'Goiter'].map(condition => (
                                <CheckboxField 
                                    key={condition}
                                    label={condition} 
                                    checked={history[`hdh_${condition}`]} 
                                />
                            ))}
                        </div>

                        {/* Social History */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Social History</h4>
                            {['Smoker', 'Ex-smoker', 'Second-hand Smoker', 'Alcohol Drinker', 'Substance Abuse'].map(habit => (
                                <CheckboxField 
                                    key={habit}
                                    label={habit} 
                                    checked={history[`sh_${habit}`]} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Allergy and Family Planning History */}
                    <SectionHeader title="ADDITIONAL INFORMATION" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">History of Allergy and Drugs</h4>
                            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 min-h-[80px]">
                                {history.allergy_history || 'No allergies recorded'}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Family Planning History</h4>
                            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 min-h-[80px]">
                                {history.family_planning_history || 'No family planning history recorded'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-100 p-4 border-t">
                    <div className="flex justify-end">
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default function MaternityManagement() {
    const [allPatients, setAllPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ risk_level: 'All', search_type: 'name' });


    const [modalMode, setModalMode] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientToDelete, setPatientToDelete] = useState(null);

    const fetchPageData = useCallback(async () => {
        const [patientResponse, appointmentsResponse, patientCountResponse] = await Promise.all([
            supabase.from('patients').select('*').order('patient_id', { ascending: true }),
            supabase.from('appointments').select('*').order('date', { ascending: true }).limit(3),
            supabase.from('patients').select('*', { count: 'exact', head: true })
        ]);

        if (patientResponse.data) setAllPatients(patientResponse.data);
        if (appointmentsResponse.data) setUpcomingAppointments(appointmentsResponse.data);
        setStats({ total: patientCountResponse.count || 0, active: patientResponse.data?.length || 0, today: 0 });
        setLoading(false);
    }, []);


    useEffect(() => {
        setLoading(true);
        fetchPageData();
    }, [fetchPageData]);
    
    // --- CRUD Handlers ---
    const handleView = (patient) => {
        setSelectedPatient(patient);
        setModalMode('view');
    };

    const handleEdit = (patient) => {
        setSelectedPatient(patient);
        setModalMode('edit');
    };

    const handleDelete = async () => {
        if (!patientToDelete) return;
        
        const { error } = await supabase.from('patients').delete().eq('id', patientToDelete.id);
        
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            // After deleting, refetch all data to update the list
            await fetchPageData();
        }
        setPatientToDelete(null); // Close confirmation modal
    };
    
    const filteredPatients = useMemo(() => {
        let patients = allPatients
            .filter(patient => {
                if (filters.risk_level === 'All') return true;
                return patient.risk_level === filters.risk_level;
            })
            .filter(patient => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();

                if (filters.search_type === 'id') {
                    return patient.patient_id?.toLowerCase().includes(term);
                } else {
                    const fullName = `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.toLowerCase();
                    return fullName.includes(term);
                }
            });

        // --- Sorting ---
        if (filters.search_type === 'id') {
            patients.sort((a, b) => (a.patient_id || '').localeCompare(b.patient_id || ''));
        } else {
            patients.sort((a, b) => {
                const nameA = `${a.first_name || ''} ${a.middle_name || ''} ${a.last_name || ''}`.toLowerCase();
                const nameB = `${b.first_name || ''} ${b.middle_name || ''} ${b.last_name || ''}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }

        return patients;
    }, [allPatients, searchTerm, filters]);



    if (loading) return <div className="p-4">Loading patient records...</div>;

    return (
        <>
            <AnimatePresence>
                {(modalMode === 'add' || modalMode === 'edit') && (
                    <AddPatientModal 
                        mode={modalMode}
                        initialData={selectedPatient}
                        onClose={() => setModalMode(null)} 
                        onSave={() => {
                            setModalMode(null);
                            fetchPageData();
                        }}
                    />
                )}
                {patientToDelete && (
                    <DeleteConfirmationModal
                        patientName={`${patientToDelete.first_name} ${patientToDelete.last_name}`}
                        onConfirm={handleDelete}
                        onCancel={() => setPatientToDelete(null)}
                    />
                )}
                {modalMode === 'view' && (
                    <ViewPatientModal
                        patient={selectedPatient}
                        onClose={() => setModalMode(null)}
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-3">
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <h2 className="text-2xl font-bold text-gray-700">Patient List</h2>
                             <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2"> <SearchIcon /> </span>
                                    <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50 focus:bg-white" />
                                </div>
                                <div className="relative">
                                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50">
                                        <FilterIcon /> <span>Filter</span>
                                    </button>
                                    {isFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-20 border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-2 text-sm font-semibold text-gray-600 border-b bg-gray-50">Filter by Risk Level</div>
                                        <div className="p-3 space-y-2">
                                        {['All', 'NORMAL', 'MID RISK', 'HIGH RISK'].map(level => (
                                            <label key={level} className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md">
                                            <input
                                                type="radio"
                                                name="risk_level"
                                                value={level}
                                                checked={filters.risk_level === level}
                                                onChange={(e) => {
                                                setFilters({ ...filters, risk_level: e.target.value });
                                                setIsFilterOpen(false);
                                                }}
                                            />
                                            <span className="text-sm">{level}</span>
                                            </label>
                                        ))}
                                        </div>

                                        <div className="px-4 py-2 text-sm font-semibold text-gray-600 border-t bg-gray-50">Search By</div>
                                        <div className="p-3 space-y-2">
                                        {[
                                        { label: 'Name', value: 'name' },
                                        { label: 'Patient ID', value: 'id' }
                                        ].map(type => (
                                        <label key={type.value} className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md">
                                            <input
                                            type="radio"
                                            name="search_type"
                                            value={type.value}
                                            checked={filters.search_type === type.value}
                                            onChange={(e) => {
                                                setFilters({ ...filters, search_type: e.target.value });
                                                setIsFilterOpen(false);
                                            }}
                                            />
                                            <span className="text-sm">{type.label}</span>
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
                                                    <button onClick={() => handleView(p)} className="text-gray-400 hover:text-blue-600 p-1"><ViewIcon /></button>
                                                    <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-green-600 p-1"><UpdateIcon /></button>
                                                    <button onClick={() => setPatientToDelete(p)} className="text-gray-400 hover:text-red-600 p-1"><DeleteIcon /></button>
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
                        <button onClick={() => { setSelectedPatient(null); setModalMode('add'); }} className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">
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
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddChildModal from './AddChildModal';
import { AnimatePresence, motion } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const UpdateIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;


// --- WIDGETS & HELPER COMPONENTS ---

// MODIFIED: Status Badge to match mockup (using 'H' for Healthy)
const StatusBadge = ({ status }) => {
    const styles = {
        'H': 'bg-green-100 text-green-700',
        'UW': 'bg-yellow-100 text-yellow-700',
        'OW': 'bg-orange-100 text-orange-700',
        'O': 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

// NEW: Status Legend Widget based on mockup
const StatusLegend = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
        <div className="space-y-2 text-xs">
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-yellow-400"></div><span className="font-semibold">UW</span> - Underweight</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-green-400"></div><span className="font-semibold">H</span> - Healthy</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-orange-400"></div><span className="font-semibold">OW</span> - Overweight</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2 bg-red-400"></div><span className="font-semibold">O</span> - Obese</div>
            <div className="border-t my-2"></div>
            <div className="flex items-center space-x-2 text-gray-700"><ViewIcon /><span>View</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><UpdateIcon /><span>Update</span></div>
            <div className="flex items-center space-x-2 text-gray-700"><DeleteIcon /><span>Delete</span></div>

        </div>
    </div>
);

// NEW: Upcoming Appointments Widget based on mockup
const UpcomingAppointmentsWidget = ({ appointments }) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Upcoming Appointment</h3>
        <div className="space-y-3">
            {appointments.length > 0 ? appointments.slice(0, 3).map(app => (
                <div key={app.id} className="flex items-center space-x-2">
                    <div className="bg-blue-100 p-1 rounded"><CalendarIcon /></div>
                    <div>
                        <p className="font-semibold text-gray-700 text-xs">{app.patient_name}</p>
                        <p className="text-xs text-blue-600 font-semibold">{app.reason}</p>
                    </div>
                </div>
            )) : <p className="text-xs text-gray-500">No upcoming appointments.</p>}
        </div>
    </div>
);

// MODIFIED: Pagination component with numbered pages
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // This logic creates the array of page numbers to display (e.g., [1, '...', 4, 5, 6, '...', 10])
    const getPaginationItems = () => {
        if (totalPages <= 7) {
            // If 7 or fewer pages, show all numbers
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const delta = 1;
        const left = currentPage - delta;
        const right = currentPage + delta;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    const paginationItems = getPaginationItems();

    return (
        <nav className="flex items-center justify-center space-x-1 text-xs mt-4">
            <button 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                &lt;
            </button>
            {paginationItems.map((item, index) => {
                if (item === '...') {
                    return <span key={index} className="px-2 py-1">...</span>;
                }
                return (
                    <button 
                        key={index}
                        onClick={() => onPageChange(item)}
                        className={`px-3 py-1 rounded ${currentPage === item ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}`}
                    >
                        {item}
                    </button>
                );
            })}
            <button 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                &gt;
            </button>
        </nav>
    );
};


// MODIFIED: ViewChildModal updated to show all health details including measurements
const ViewChildModal = ({ child, onClose }) => {
    // Safely get the detailed records, or an empty object if it's null
    const details = child.health_details || {};

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        
        // --- PDF Header based on template ---
        doc.setFontSize(10);
        doc.text("Republic of the Philippines", 105, 10, { align: 'center' });
        doc.text("CITY HEALTH DEPARTMENT", 105, 15, { align: 'center' });
        doc.text("Nursing Services Division", 105, 20, { align: 'center' });
        doc.text("City of Puerto Princesa", 105, 25, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("EXPANDED PROGRAM ON IMMUNIZATION", 105, 35, { align: 'center' });
        doc.text("INDIVIDUAL TREATMENT RECORD (ITR)", 105, 40, { align: 'center' });

        // --- Child Details Table ---
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        autoTable(doc, {
            startY: 45,
            theme: 'plain',
            body: [
                [`Name of BHS: ${details.bhs_name || 'San Miguel'}`, `NHTS No.: ${details.nhts_no || 'N/A'}`],
                [`Name of Child: ${child.first_name} ${child.last_name}`, `PhilHealth No.: ${details.philhealth_no || 'N/A'}`],
                [`Date of Birth: ${child.dob || 'N/A'}`, `Sex: ${child.sex || 'N/A'}`],
                [`Place of Birth: ${details.place_of_birth || 'N/A'}`, `Birth Weight: ${child.weight_kg || 'N/A'} kg`],
                [`Name of Mother: ${child.mother_name || 'N/A'}`, `Name of Father: ${details.father_name || 'N/A'}`],
                [`Name of Guardian: ${child.guardian_name || 'N/A'}`, `Relationship: ${details.guardian_relationship || 'N/A'}`],
            ],
            styles: { fontSize: 9, cellPadding: 0.5 },
        });
        
        // --- Mother's Immunization Status Table ---
        doc.setFontSize(10).setFont(undefined, 'bold').text("MOTHER'S IMMUNIZATION STATUS", 14, doc.lastAutoTable.finalY + 10);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 12,
            theme: 'grid',
            head: [['Antigen', 'Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM']],
            body: [[
                'Date Given',
                details.mother_immunization_Td1 || '',
                details.mother_immunization_Td2 || '',
                details.mother_immunization_Td3 || '',
                details.mother_immunization_Td4 || '',
                details.mother_immunization_Td5 || '',
                details.mother_immunization_FIM || ''
            ]],
            styles: { fontSize: 8, halign: 'center' }
        });

        // --- Main Immunization Table ---
        // NOTE: The data for this table is not yet collected in your AddChildModal form.
        // I have created the structure, but the cells will be empty.
        const immunizationRows = [
            'BCG', 'Hepa B w/In 24 hrs', 'Pentavalent 1', 'Pentavalent 2', 'Pentavalent 3',
            'OPV1', 'OPV2', 'OPV3', 'IPV 1', 'IPV 2', 'PCV 1', 'PCV 2', 'PCV 3',
            'MCV 1', 'MCV 2', 'FIC', 'OTHERS'
        ].map(vaccine => [
            '', // Time
            vaccine, // Type of Immunization
            '', '', '', '', '', '', '', '' // Empty cells for other data
        ]);
        doc.setFontSize(10).setFont(undefined, 'bold').text("IMMUNIZATION", 14, doc.lastAutoTable.finalY + 10);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 12,
            head: [['Time', 'Type of Immunization', 'Age', 'Weight', 'Height', 'Nutritional Status', 'Admitted by', 'Immunized by', 'Next Visit', 'Remarks']],
            body: immunizationRows,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1 }
        });

        // --- Exclusive Breastfeeding Table ---
        const breastfeedingBody = [['', '', '', '', '', '', '']];
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 5,
            head: [['Exclusive Breastfeeding:', '1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', 'Date/Time']],
            body: breastfeedingBody,
            theme: 'grid', styles: { fontSize: 8, halign: 'center' }
        });

        doc.save(`ITR_${child.last_name}_${child.first_name}.pdf`);
        logActivity("Downloaded PDF Record", `Generated PDF for child: ${child.child_id}`);
    };

    // Helper components for styling the document view
    const SectionHeader = ({ title }) => (
        <h3 className="font-bold text-gray-700 text-sm mt-6 mb-2 pb-1 border-b">{title}</h3>
    );
    const Field = ({ label, value }) => (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    );
    const CheckboxDisplay = ({ label, isChecked }) => (
        <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 border-2 rounded ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {isChecked && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                {/* Header Section */}
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Child Immunization Record</h2>
                    <p className="text-sm text-gray-600">Viewing record for <span className="font-semibold">{child.first_name} {child.last_name}</span> (ID: {child.child_id})</p>
                </div>

                {/* Main Content Body with Scrolling */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <SectionHeader title="Personal & Family Information" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <Field label="Date of Birth" value={child.dob} />
                        <Field label="Sex" value={child.sex} />
                        <Field label="Place of Birth" value={details.place_of_birth} />
                        <Field label="Mother's Name" value={child.mother_name} />
                        <Field label="Father's Name" value={details.father_name} />
                        <Field label="Guardian's Name" value={child.guardian_name} />
                    </div>

                    {/* --- NEW: Nutritional Measurements Section --- */}
                    <SectionHeader title="Nutritional Measurements" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm items-center">
                        <Field label="Weight" value={`${child.weight_kg || 'N/A'} kg`} />
                        <Field label="Height" value={`${child.height_cm || 'N/A'} cm`} />
                        <Field label="Body Mass Index (BMI)" value={child.bmi} />
                        <div>
                            <p className="text-xs text-gray-500">Nutrition Status</p>
                            <div className="mt-1"><StatusBadge status={child.nutrition_status} /></div>
                        </div>
                    </div>

                    <SectionHeader title="ID Numbers" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <Field label="NHTS No." value={details.nhts_no} />
                        <Field label="PhilHealth No." value={details.philhealth_no} />
                    </div>

                    <SectionHeader title="Mother's Immunization Status" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs border">
                            <thead className="bg-gray-100 font-semibold">
                                <tr>
                                    {['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].map(antigen => <th key={antigen} className="p-2 border">{antigen}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].map(antigen => (
                                        <td key={antigen} className="p-2 border">{details[`mother_immunization_${antigen}`] || '-'}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <SectionHeader title="Additional Health Records" />
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Exclusive Breastfeeding</p>
                            <div className="flex flex-wrap gap-4">
                                {['1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', '6th Month'].map(month => (
                                    <CheckboxDisplay key={month} label={month} isChecked={details[`breastfeeding_${month.replace(' ', '_')}`]} />
                                ))}
                            </div>
                        </div>
                        <Field label="Vitamin A (Date Given)" value={details.vitamin_a_date} />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-sm">Close</button>
                    {/* --- NEW DOWNLOAD BUTTON --- */}
                    <button onClick={handleDownloadPdf} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm">Download as PDF</button>
                </div>
            </motion.div>
        </div>
    );
};

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

export default function ChildHealthRecords() {
    const [childRecords, setChildRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalMode, setModalMode] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [patientToDelete, setPatientToDelete] = useState(null);
    
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const { user } = useAuth();
    const { addNotification } = useNotification();

    // Updated fetch logic for pagination
    const fetchPageData = useCallback(async () => {
        if (!user) return; // Don't run if the user hasn't been loaded yet

        setLoading(true);
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // Fetch child records (this part is unchanged)
        const { data: recordsData, error: recordsError, count: recordsCount } = await supabase
            .from('child_records')
            .select('*', { count: 'exact' })
            .order('child_id', { ascending: true })
            .range(from, to);
        
        if (recordsError) {
            addNotification(`Error fetching records: ${recordsError.message}`, 'error');
        } else {
            setChildRecords(recordsData || []);
            setTotalRecords(recordsCount || 0);
        }

        // --- MODIFIED: This query now filters appointments by the logged-in user's ID ---
        const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('created_by', user.id) // Only get appointments created by the current BNS
            .order('date', { ascending: true })
            .limit(3);

        if (!appointmentsError) {
            setUpcomingAppointments(appointmentsData || []);
        }

        setLoading(false);
    }, [addNotification, currentPage, itemsPerPage, user]); // <-- Add 'user' as a dependency

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]); // <-- useEffect will now re-run when the user object is loaded

    const calculateAge = (dob) => {
        if (!dob) return '';
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        // This is a simplified age calculation
        return age > 0 ? age : '< 1';
    };

    const handleDelete = async () => {
        if (!patientToDelete || !user) return;

        const { error } = await supabase.from('requestions').insert([{
            worker_id: user.id,
            request_type: 'Delete',
            target_table: 'child_records',
            target_record_id: patientToDelete.id,
            request_data: { child_id: patientToDelete.child_id, name: `${patientToDelete.first_name} ${patientToDelete.last_name}` },
            status: 'Pending'
        }]);
        
        if (error) {
            addNotification(`Error submitting delete request: ${error.message}`, 'error');
        } else {
            addNotification('Delete request submitted for approval.', 'success');
            logActivity('Child Record Delete Request', `Submitted request for ${patientToDelete.first_name} ${patientToDelete.last_name}`);
        }
        setPatientToDelete(null);
    };

    const filteredRecords = useMemo(() => {
        return childRecords.filter(record => {
            const fullName = `${record.first_name || ''} ${record.last_name || ''}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        });
    }, [childRecords, searchTerm]);

    const totalPages = Math.ceil(totalRecords / itemsPerPage);

    return (
        <>
            <AnimatePresence>
                {(modalMode === 'add' || modalMode === 'edit') && (
                    <AddChildModal 
                        mode={modalMode}
                        initialData={selectedChild}
                        onClose={() => setModalMode(null)} 
                        onSave={() => { setModalMode(null); fetchPageData(); }}
                    />
                )}
                {modalMode === 'view' && (
                    <ViewChildModal child={selectedChild} onClose={() => setModalMode(null)} />
                )}
                                {/* --- THIS BLOCK RENDERS THE DELETE MODAL --- */}
                {patientToDelete && (
                    <DeleteConfirmationModal
                        patientName={`${patientToDelete.first_name} ${patientToDelete.last_name}`}
                        onConfirm={handleDelete}
                        onCancel={() => setPatientToDelete(null)}
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="xl:col-span-3">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <h2 className="text-xl font-bold text-gray-700">Patient List</h2>
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2"><SearchIcon /></span>
                                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50 focus:bg-white" />
                                </div>
                                
                                {/* MODIFIED: Functional Filter Button with Dropdown */}
                                <div className="relative">
                                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50">
                                        <FilterIcon /> <span>Filter</span>
                                    </button>
                                    <AnimatePresence>
                                        {isFilterOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border"
                                            >
                                                <div className="p-2 text-xs font-semibold text-gray-600 border-b">Filter by Status</div>
                                                <div className="p-2">
                                                    {['All', 'H', 'UW', 'OW', 'O'].map(status => (
                                                        <label key={status} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="status_filter"
                                                                value={status}
                                                                checked={activeFilter === status}
                                                                onChange={() => {
                                                                    setActiveFilter(status);
                                                                    setCurrentPage(1); // Reset to first page on filter change
                                                                    setIsFilterOpen(false);
                                                                }}
                                                            />
                                                            <span className="text-sm">{status}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedChild(null); setModalMode('add'); }} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm whitespace-nowrap">+ Add New Patient</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-500 font-semibold">
                                        {['Child ID', 'Last Name', 'First Name', 'Age', 'Weight(kg)', 'Height(cm)', 'BMI', 'Nutrition Status', 'Last Check up', 'Actions'].map(h => 
                                             <th key={h} className="px-2 py-2">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan="10" className="text-center p-4">Loading records...</td></tr>
                                    ) : (
                                        filteredRecords.map(record => (
                                            <tr key={record.id} className="text-gray-600 hover:bg-gray-50">
                                                <td className="px-2 py-2 font-medium">{record.child_id}</td>
                                                <td className="px-2 py-2">{record.last_name}</td>
                                                <td className="px-2 py-2">{record.first_name}</td>
                                                <td className="px-2 py-2">{calculateAge(record.dob)}</td>
                                                <td className="px-2 py-2">{record.weight_kg}</td>
                                                <td className="px-2 py-2">{record.height_cm}</td>
                                                <td className="px-2 py-2">{record.bmi}</td>
                                                <td className="px-2 py-2"><StatusBadge status={record.nutrition_status} /></td>
                                                <td className="px-2 py-2">{record.last_checkup}</td>
                                                <td className="px-2 py-2">
                                                    <div className="flex space-x-1">
                                                        <button onClick={() => { setSelectedChild(record); setModalMode('view'); }} className="text-gray-400 hover:text-blue-600 p-1" title="View"><ViewIcon /></button>
                                                        <button onClick={() => { setSelectedChild(record); setModalMode('edit'); }} className="text-gray-400 hover:text-green-600 p-1" title="Edit"><UpdateIcon /></button>
                                                        <button onClick={() => setPatientToDelete(record)} className="text-gray-400 hover:text-red-600 p-1" title="Delete"><DeleteIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div> 
                </div>

                {/* Right Sidebar Area */}
                <div className="xl:col-span-1 space-y-4">
                    <StatusLegend />
                    <UpcomingAppointmentsWidget appointments={upcomingAppointments} />
                </div>
            </div>
        </>
    );
}
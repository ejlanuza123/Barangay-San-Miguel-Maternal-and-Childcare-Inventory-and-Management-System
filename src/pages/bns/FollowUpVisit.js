import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const CalendarIcon = () => <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const ChevronLeftIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const HistoryIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ListIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const PDFIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ExcelIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// --- HELPER FUNCTIONS ---
const getNextThursday = () => {
    const d = new Date();
    const diff = (4 + 7 - d.getDay()) % 7; 
    d.setDate(d.getDate() + diff);
    return d;
};

const isThursday = (date) => {
    return date.getDay() === 4;
};

const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
};

const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
};

const canConfirmVisit = (date) => {
    // Can only confirm on current day (today) AND it must be Thursday
    return isToday(date) && isThursday(date);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

// --- CHILD HISTORY MODAL ---
const ChildHistoryModal = ({ child, onClose }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVisits = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('follow_up_visit')
                .select('*')
                .eq('patient_display_id', child.child_id)
                .eq('visit_type', 'child')
                .order('date', { ascending: false });

            if (!error) {
                setVisits(data || []);
            }
            setLoading(false);
        };
        fetchVisits();
    }, [child]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
                <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <UserIcon />
                            {child.last_name}, {child.first_name}
                        </h2>
                        <p className="text-sm opacity-90">Child ID: {child.child_id}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-green-700 rounded-full transition-colors">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading visit history...</p>
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-300 text-5xl mb-4">📋</div>
                            <p className="text-gray-500">No visit history found for this child.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visits.map((visit, index) => (
                                <motion.div
                                    key={visit.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-bold text-green-600">
                                                    {formatDate(visit.date)}
                                                </span>
                                                {visit.time && (
                                                    <span className="text-sm text-gray-500">{visit.time}</span>
                                                )}
                                            </div>
                                            {visit.notes && (
                                                <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <CalendarIcon />
                                                    Child Health Visit
                                                </span>
                                                {visit.confirmed_by && (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckIcon />
                                                        Confirmed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(visit.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- CONFIRMED VISITS LIST MODAL (with export) ---
const ConfirmedVisitsListModal = ({ date, onClose }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const { addNotification } = useNotification();

    const fetchVisits = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, '0'),
              String(date.getDate()).padStart(2, '0')
            ].join('-');
            
            const { data: visitsData, error: visitsError } = await supabase
                .from('follow_up_visit')
                .select('*')
                .eq('date', dateStr)
                .eq('visit_type', 'child')
                .order('created_at', { ascending: false });

            if (visitsError) throw visitsError;

            if (visitsData && visitsData.length > 0) {
                const visitsWithChildren = await Promise.all(
                    visitsData.map(async (visit) => {
                        const { data: childData, error: childError } = await supabase
                            .from('child_records')
                            .select('first_name, last_name, address, contact_no, dob, mother_name')
                            .eq('child_id', visit.patient_display_id)
                            .single();

                        if (childError) {
                            return {
                                ...visit,
                                child_records: {
                                    first_name: 'Unknown',
                                    last_name: 'Child',
                                    address: null,
                                    contact_no: null,
                                    mother_name: null
                                }
                            };
                        }

                        return {
                            ...visit,
                            child_records: childData
                        };
                    })
                );

                setVisits(visitsWithChildren);
            } else {
                setVisits([]);
            }
        } catch (error) {
            console.error("Error fetching visits:", error);
            addNotification("Error loading visits", "error");
        } finally {
            setLoading(false);
        }
    }, [date, addNotification]);

    useEffect(() => {
        fetchVisits();
    }, [fetchVisits]);

    const exportToPDF = () => {
        try {
            setExporting(true);
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(16);
            doc.text('Barangay San Miguel Health Center', 105, 15, { align: 'center' });
            doc.setFontSize(14);
            doc.text('Child Health Follow-up Visits Report', 105, 25, { align: 'center' });
            doc.setFontSize(12);
            doc.text(formatDate(date), 105, 35, { align: 'center' });
            
            // Table data
            const tableData = visits.map((visit, index) => [
                (index + 1).toString(),
                visit.patient_display_id || 'N/A',
                `${visit.child_records?.last_name || ''}, ${visit.child_records?.first_name || ''}`,
                visit.child_records?.mother_name || 'N/A',
                visit.child_records?.address || 'N/A',
                visit.child_records?.contact_no || 'N/A',
                visit.time || 'N/A',
                visit.notes || ''
            ]);

            autoTable(doc, {
                startY: 45,
                head: [['#', 'Child ID', 'Name', 'Mother', 'Address', 'Contact', 'Time', 'Notes']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [34, 197, 94] }, // Green
                styles: { fontSize: 7 },
                columnStyles: {
                    0: { cellWidth: 8 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 15 },
                    7: { cellWidth: 40 }
                }
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleString()}`,
                    105,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            doc.save(`child-visits-${date.toISOString().split('T')[0]}.pdf`);
            addNotification('PDF exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            addNotification('Error exporting to PDF', 'error');
        } finally {
            setExporting(false);
        }
    };

    const exportToExcel = () => {
        try {
            setExporting(true);
            
            const worksheetData = [
                ['No.', 'Child ID', 'Last Name', 'First Name', 'Mother\'s Name', 'Address', 'Contact No.', 'Visit Time', 'Notes', 'Confirmed At']
            ];

            visits.forEach((visit, index) => {
                worksheetData.push([
                    (index + 1).toString(),
                    visit.patient_display_id || 'N/A',
                    visit.child_records?.last_name || 'Unknown',
                    visit.child_records?.first_name || 'Unknown',
                    visit.child_records?.mother_name || 'N/A',
                    visit.child_records?.address || 'N/A',
                    visit.child_records?.contact_no || 'N/A',
                    visit.time || 'N/A',
                    visit.notes || '',
                    new Date(visit.created_at).toLocaleString()
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const colWidths = [
                { wch: 5 },   // No.
                { wch: 12 },  // Child ID
                { wch: 15 },  // Last Name
                { wch: 15 },  // First Name
                { wch: 20 },  // Mother's Name
                { wch: 25 },  // Address
                { wch: 15 },  // Contact No.
                { wch: 10 },  // Visit Time
                { wch: 30 },  // Notes
                { wch: 20 }   // Confirmed At
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Child Visits');
            
            const fileName = `child-visits-${date.toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            addNotification('Excel file exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            addNotification('Error exporting to Excel', 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
            >
                <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ListIcon />
                            Confirmed Child Visits - {formatDate(date)}
                        </h2>
                        <p className="text-sm opacity-90">
                            Total confirmed: {visits.length} child{visits.length !== 1 ? 'ren' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToPDF}
                            disabled={exporting || visits.length === 0}
                            className="px-3 py-1.5 bg-white text-green-700 rounded-md text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <PDFIcon />
                            PDF
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={exporting || visits.length === 0}
                            className="px-3 py-1.5 bg-white text-green-700 rounded-md text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ExcelIcon />
                            Excel
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 hover:bg-green-800 rounded-full transition-colors"
                        >
                            <XIcon />
                        </button>
                    </div>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading confirmed visits...</p>
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-300 text-5xl mb-4">📋</div>
                            <p className="text-gray-500 text-lg">No confirmed visits for this day.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-600">
                                        <th className="px-4 py-3 font-semibold">#</th>
                                        <th className="px-4 py-3 font-semibold">Child ID</th>
                                        <th className="px-4 py-3 font-semibold">Last Name</th>
                                        <th className="px-4 py-3 font-semibold">First Name</th>
                                        <th className="px-4 py-3 font-semibold">Mother's Name</th>
                                        <th className="px-4 py-3 font-semibold">Address</th>
                                        <th className="px-4 py-3 font-semibold">Contact</th>
                                        <th className="px-4 py-3 font-semibold">Time</th>
                                        <th className="px-4 py-3 font-semibold">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {visits.map((visit, index) => (
                                        <motion.tr
                                            key={visit.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-green-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 font-mono text-sm">{visit.patient_display_id}</td>
                                            <td className="px-4 py-3 font-medium">{visit.child_records?.last_name || 'Unknown'}</td>
                                            <td className="px-4 py-3">{visit.child_records?.first_name || 'Unknown'}</td>
                                            <td className="px-4 py-3">{visit.child_records?.mother_name || 'N/A'}</td>
                                            <td className="px-4 py-3">{visit.child_records?.address || 'N/A'}</td>
                                            <td className="px-4 py-3">{visit.child_records?.contact_no || 'N/A'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{visit.time || 'N/A'}</td>
                                            <td className="px-4 py-3 max-w-xs truncate" title={visit.notes}>
                                                {visit.notes || '-'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {!loading && visits.length > 0 && (
                            <span>Showing <span className="font-bold">{visits.length}</span> confirmed {visits.length === 1 ? 'visit' : 'visits'}</span>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- DAILY VISIT LOG MODAL (Preview) ---
const DailyVisitLogModal = ({ date, onClose, onViewFullList }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVisits = async () => {
            setLoading(true);
            try {
                const dateStr = [
                  date.getFullYear(),
                  String(date.getMonth() + 1).padStart(2, '0'),
                  String(date.getDate()).padStart(2, '0')
                ].join('-');
                
                const { data: visitsData, error: visitsError } = await supabase
                    .from('follow_up_visit')
                    .select('*')
                    .eq('date', dateStr)
                    .eq('visit_type', 'child')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (visitsError) throw visitsError;

                if (visitsData && visitsData.length > 0) {
                    const visitsWithChildren = await Promise.all(
                        visitsData.map(async (visit) => {
                            const { data: childData } = await supabase
                                .from('child_records')
                                .select('first_name, last_name, address, mother_name')
                                .eq('child_id', visit.patient_display_id)
                                .single();

                            return {
                                ...visit,
                                child_records: childData || { first_name: 'Unknown', last_name: 'Child', address: null, mother_name: null }
                            };
                        })
                    );

                    setVisits(visitsWithChildren);
                } else {
                    setVisits([]);
                }
            } catch (error) {
                console.error("Error fetching visit log:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchVisits();
    }, [date]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col"
            >
                <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon />
                            Quick View
                        </h2>
                        <p className="text-xs opacity-90">{formatDate(date)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-green-700 rounded-full transition-colors">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-4 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No visits recorded.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visits.map((visit) => (
                                <div key={visit.id} className="border rounded p-3 bg-gray-50">
                                    <p className="font-semibold text-sm">
                                        {visit.child_records?.last_name}, {visit.child_records?.first_name}
                                    </p>
                                    <p className="text-xs text-gray-500">ID: {visit.patient_display_id}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-400">{visit.time}</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            Confirmed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={onViewFullList}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <ListIcon />
                        View Full List
                    </button>
                    <button onClick={onClose} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- CALENDAR WIDGET (Updated with visit dots) ---
const CalendarWidget = ({ selectedDate, onDateSelect, onDateClick }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [visitCounts, setVisitCounts] = useState({});
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    useEffect(() => {
        const fetchVisitCounts = async () => {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            
            // Create local date strings for start and end of month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const { data, error } = await supabase
                .from('follow_up_visit')
                .select('date')
                .eq('visit_type', 'child')
                .gte('date', startDate)
                .lte('date', endDate);

            if (!error && data) {
                const counts = {};
                data.forEach(visit => {
                    counts[visit.date] = (counts[visit.date] || 0) + 1;
                });
                setVisitCounts(counts);
            }
        };
        fetchVisitCounts();
    }, [currentMonth]);

    const changeMonth = (amount) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateDates = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const dates = [];

        for (let i = 0; i < firstDay; i++) {
            dates.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            // Create local date string manually
            const dateStr = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')
            ].join('-');
            
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const isThurs = isThursday(date);
            const hasVisits = visitCounts[dateStr] > 0;

            dates.push(
                <div key={day} className="relative">
                    <button
                        onClick={() => {
                            onDateSelect(date);
                            if (hasVisits) {
                                onDateClick(date);
                            }
                        }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors relative
                            ${isSelected ? 'bg-green-600 text-white font-bold shadow-md' : 'hover:bg-green-50 text-gray-700'}
                            ${!isSelected && isToday ? 'border border-green-400 font-semibold' : ''}
                            ${!isSelected && isThurs ? 'bg-green-50 text-green-600 font-medium' : ''}
                        `}
                    >
                        {day}
                    </button>
                    {hasVisits && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
                    )}
                </div>
            );
        }
        return dates;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 text-sm">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                        <ChevronLeftIcon />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {daysOfWeek.map(day => (
                    <span key={day} className="text-[10px] font-bold text-gray-400">{day}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 justify-items-center">
                {generateDates()}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-center space-x-4 text-[10px] text-gray-500">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div> Selected</div>
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div> Has Visits</div>
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-50 mr-1 border border-green-200"></div> Regular Visit Day</div>
            </div>
        </div>
    );
};

// --- MAIN APPOINTMENT PAGE ---
export default function BnsAppointmentPage() {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedChild, setSelectedChild] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showVisitLogModal, setShowVisitLogModal] = useState(false);
    const [showFullListModal, setShowFullListModal] = useState(false);
    const [selectedLogDate, setSelectedLogDate] = useState(null);
    const [confirmingChild, setConfirmingChild] = useState(null);
    const [visitNotes, setVisitNotes] = useState('');
    const [confirmedToday, setConfirmedToday] = useState({});
    const { addNotification } = useNotification();
    
    const nextVisitDate = useMemo(() => getNextThursday().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }), []);

    const fetchChildren = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('child_records')
            .select('*')
            .eq('is_deleted', false)
            .order('last_name', { ascending: true });

        if (error) {
            console.error("Error fetching children:", error);
            addNotification("Error loading child list.", "error");
        } else {
            setChildren(data || []);
            
            if (data) {
                const dateStr = [
                  selectedDate.getFullYear(),
                  String(selectedDate.getMonth() + 1).padStart(2, '0'),
                  String(selectedDate.getDate()).padStart(2, '0')
                ].join('-');
                const { data: confirmedData } = await supabase
                    .from('follow_up_visit')
                    .select('patient_display_id')
                    .eq('date', dateStr)
                    .eq('visit_type', 'child');

                if (confirmedData) {
                    const confirmedMap = {};
                    confirmedData.forEach(visit => {
                        confirmedMap[visit.patient_display_id] = true;
                    });
                    setConfirmedToday(confirmedMap);
                }
            }
        }
        setLoading(false);
    }, [addNotification, selectedDate]);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren, selectedDate]);

    const handleChildClick = (child) => {
        setSelectedChild(child);
        setShowHistoryModal(true);
    };

    const handleDateClick = (date) => {
        setSelectedLogDate(date);
        setShowVisitLogModal(true);
    };

    const handleViewFullList = () => {
        setShowVisitLogModal(false);
        setShowFullListModal(true);
    };

    const handleConfirmVisit = async (child) => {
        // Use selectedDate for validation, not a new today date
        if (!canConfirmVisit(selectedDate)) {
            addNotification('Visits can only be confirmed on the current day (today) and only on Thursdays.', 'warning');
            return;
        }

        // Format selectedDate to YYYY-MM-DD in local timezone
        const dateStr = [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, '0'),
            String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');
        
        const { data: existing } = await supabase
            .from('follow_up_visit')
            .select('id')
            .eq('patient_display_id', child.child_id)
            .eq('date', dateStr)
            .eq('visit_type', 'child');

        if (existing && existing.length > 0) {
            addNotification(`${child.first_name} ${child.last_name} has already been confirmed today.`, 'warning');
            return;
        }

        setConfirmingChild(child);
        setVisitNotes('');
    };

    const submitVisitConfirmation = async () => {
        if (!confirmingChild) return;

        const { data: { user } } = await supabase.auth.getUser();
        // Use selectedDate, not a new today date
        const dateStr = [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, '0'),
            String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');
        
        try {
            const { error: visitError } = await supabase
                .from('follow_up_visit')
                .insert([{
                    patient_display_id: confirmingChild.child_id,
                    date: dateStr,  // ✅ Use selectedDate
                    time: new Date().toLocaleTimeString(),
                    notes: visitNotes,
                    status: 'Completed',
                    visit_type: 'child',
                    confirmed_by: user?.id,
                    created_at: new Date().toISOString()
                }]);

            if (visitError) {
                addNotification(`Error confirming visit: ${visitError.message}`, 'error');
                return;
            }

            const { error: updateError } = await supabase
                .from('child_records')
                .update({ 
                    last_checkup: dateStr  // ✅ Use selectedDate
                })
                .eq('id', confirmingChild.id);

            if (updateError) {
                console.error('Error updating last_checkup:', updateError);
                addNotification(`Visit confirmed but failed to update last checkup date: ${updateError.message}`, 'warning');
            } else {
                addNotification(`${confirmingChild.first_name} ${confirmingChild.last_name}'s visit confirmed and last checkup updated!`, 'success');
            }
            
            setConfirmedToday(prev => ({
                ...prev,
                [confirmingChild.child_id]: true
            }));
            
            setConfirmingChild(null);
            fetchChildren();
        } catch (error) {
            console.error('Error in submitVisitConfirmation:', error);
            addNotification(`Unexpected error: ${error.message}`, 'error');
        }
    };

    const filteredChildren = useMemo(() => {
        if (!searchTerm) return children;
        const term = searchTerm.toLowerCase();
        return children.filter(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(term) ||
            c.child_id.toLowerCase().includes(term) ||
            (c.mother_name && c.mother_name.toLowerCase().includes(term))
        );
    }, [children, searchTerm]);

    const canConfirm = canConfirmVisit(selectedDate);
    const isRegularVisitDay = isThursday(selectedDate);
    const isPast = isPastDate(selectedDate);
    const isFuture = isFutureDate(selectedDate);
    const todayConfirmedCount = Object.keys(confirmedToday).length;

    const getDateStatusMessage = () => {
        if (isPast) {
            return "You cannot confirm visits for past dates.";
        }
        if (isFuture) {
            return "You cannot confirm visits for future dates.";
        }
        if (!isRegularVisitDay) {
            return "Visits can only be confirmed on Thursdays (regular visit days).";
        }
        return null;
    };

    return (
        <>
            <AnimatePresence>
                {showHistoryModal && selectedChild && (
                    <ChildHistoryModal 
                        child={selectedChild} 
                        onClose={() => setShowHistoryModal(false)} 
                    />
                )}
                {showVisitLogModal && selectedLogDate && (
                    <DailyVisitLogModal 
                        date={selectedLogDate} 
                        onClose={() => setShowVisitLogModal(false)}
                        onViewFullList={handleViewFullList}
                    />
                )}
                {showFullListModal && selectedLogDate && (
                    <ConfirmedVisitsListModal 
                        date={selectedLogDate} 
                        onClose={() => setShowFullListModal(false)} 
                    />
                )}
                {confirmingChild && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
                        >
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Visit</h2>
                            <p className="text-gray-600 mb-4">
                                Confirm visit for <span className="font-semibold">{confirmingChild.first_name} {confirmingChild.last_name}</span>
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    rows="3"
                                    className="w-full border rounded-md p-2 text-sm"
                                    placeholder="Add any notes about this visit..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmingChild(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitVisitConfirmation}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-sm flex items-center gap-2"
                                >
                                    <CheckIcon />
                                    Confirm Visit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* --- LEFT COLUMN: CHILD LIST --- */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <CalendarIcon />
                                    Child Health Follow-up Visits
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    Viewing list for: <span className="font-bold text-green-600">{formatDate(selectedDate)}</span>
                                </p>
                            </div>
                            {!canConfirm && (
                                <div className="mt-4 md:mt-0 px-4 py-2 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200 flex items-center gap-2">
                                    <LockIcon />
                                    {getDateStatusMessage()}
                                </div>
                            )}
                        </div>

                        {/* Children List Table */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h2 className="font-semibold text-gray-700">
                                    {isRegularVisitDay ? "Expected Children" : "All Active Records"}
                                </h2>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                                    <input 
                                        type="text" 
                                        placeholder="Search by name, ID, or mother..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        className="pl-10 pr-4 py-2 text-sm border rounded-md focus:ring-green-500 focus:border-green-500 w-80"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-gray-500 border-b">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Child ID</th>
                                            <th className="px-6 py-3 font-medium">Child's Name</th>
                                            <th className="px-6 py-3 font-medium">Mother's Name</th>
                                            <th className="px-6 py-3 font-medium">Address</th>
                                            <th className="px-6 py-3 text-center font-medium">Status</th>
                                            <th className="px-6 py-3 text-center font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading list...</td></tr>
                                        ) : filteredChildren.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No children found.</td></tr>
                                        ) : (
                                            filteredChildren.map(child => {
                                                const isConfirmed = confirmedToday[child.child_id];
                                                return (
                                                    <tr key={child.id} className="hover:bg-green-50 transition-colors group">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{child.child_id}</td>
                                                        <td className="px-6 py-4 font-semibold text-gray-700">{child.last_name}, {child.first_name}</td>
                                                        <td className="px-6 py-4 text-gray-500">{child.mother_name || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-gray-500">{child.address || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            {isConfirmed ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <CheckCircleIcon />
                                                                    Confirmed
                                                                </span>
                                                            ) : isRegularVisitDay && !isPast && !isFuture ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {canConfirm && !isConfirmed && (
                                                                    <button
                                                                        onClick={() => handleConfirmVisit(child)}
                                                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold hover:bg-green-200 transition-colors flex items-center gap-1"
                                                                    >
                                                                        <CheckIcon />
                                                                        Confirm
                                                                    </button>
                                                                )}
                                                                {canConfirm && isConfirmed && (
                                                                    <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-md text-xs font-semibold cursor-not-allowed flex items-center gap-1">
                                                                        <CheckIcon />
                                                                        Confirmed
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleChildClick(child)}
                                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1"
                                                                >
                                                                    <HistoryIcon />
                                                                    History
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t text-center text-xs text-gray-400 bg-gray-50 rounded-b-lg flex justify-between items-center">
                                <span>Total Records: {filteredChildren.length}</span>
                                <span className="text-green-600">● Click date dots on calendar to view daily visit logs</span>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: CALENDAR & INFO --- */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Next Scheduled Visit Card */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-green-200 bg-gradient-to-br from-white to-green-50">
                            <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-1">Next Regular Visit</p>
                            <p className="text-xl font-extrabold text-green-800">{nextVisitDate}</p>
                            <p className="text-xs text-green-400 mt-2">Every Thursday</p>
                        </div>

                        {/* Calendar Widget */}
                        <CalendarWidget 
                            selectedDate={selectedDate} 
                            onDateSelect={setSelectedDate} 
                            onDateClick={handleDateClick}
                        />

                        {/* Quick Stats */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h3 className="font-bold text-gray-700 text-sm mb-3">Today's Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Children:</span>
                                    <span className="font-bold text-green-600">{filteredChildren.length}</span>
                                </div>
                                {isRegularVisitDay && !isPast && !isFuture && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Confirmed Today:</span>
                                            <span className="font-bold text-green-600">{todayConfirmedCount}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pending:</span>
                                            <span className="font-bold text-yellow-600">{filteredChildren.length - todayConfirmedCount}</span>
                                        </div>
                                    </>
                                )}
                                <div className="pt-2 border-t text-xs text-gray-500">
                                    <p>✅ Confirmations only available on current day (today) and on Thursdays.</p>
                                    <p className="mt-1">📅 Click on a date with a green dot to view daily visits.</p>
                                    <button
                                        onClick={() => {
                                            setSelectedLogDate(selectedDate);
                                            setShowFullListModal(true);
                                        }}
                                        className="mt-3 w-full bg-green-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ListIcon />
                                        View Confirmed List ({todayConfirmedCount})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
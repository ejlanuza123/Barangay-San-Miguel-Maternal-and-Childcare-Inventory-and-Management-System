import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// --- ICONS ---
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;

// --- HELPER FUNCTIONS ---
const getQuarterMonths = (q) => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]][q - 1];
const formatBytes = (bytes) => (bytes === 0 ? '0 Bytes' : `${parseFloat((bytes / 1024).toFixed(2))} KB`);

// --- HELPER COMPONENTS ---
const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const changeMonth = (amount) => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + amount); return d; });
    const generateDates = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dates = [];
        for (let i = 0; i < firstDay; i++) dates.push(<div key={`pad-${i}`} className="p-2"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = new Date(year, month, i).toDateString() === new Date().toDateString();
            dates.push(<div key={i} className={`p-2 rounded-full text-center text-sm cursor-pointer ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100'}`}>{i}</div>);
        }
        return dates;
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="font-bold text-gray-700">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">{daysOfWeek.map(day => <div key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 mt-2">{generateDates()}</div>
        </div>
    );
};

const ViewQuarterModal = ({ quarter, onClose, allData, addNotification }) => {
    const [loading, setLoading] = useState(false);

    const handleMonthlyDownload = async (report) => {
        if (!report.hasData) {
            addNotification(`No data available for ${report.name} in ${report.date}.`, 'error');
            return;
        }
        setLoading(true);
        let dataToExport = allData[report.table].filter(item => 
            new Date(item.created_at).getMonth() === report.month
        );
        if (report.status) {
            dataToExport = dataToExport.filter(item => item.status === report.status);
        }
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
        XLSX.writeFile(workbook, `${report.name.replace(/ /g, '_')}_${report.date.replace(' ', '_')}.xlsx`);
        logActivity('Report Downloaded', `Generated Excel file for ${report.name} - ${report.date}`);
        setLoading(false);
    };

    const generateMonthlyReports = (q) => {
        const year = quarter.year;
        const months = getQuarterMonths(q);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return months.flatMap(monthIndex => {
            const monthName = monthNames[monthIndex];
            // MODIFIED: Added appointment report types
            const reports = [
                { id: `C${q}01-${monthIndex}`, name: "Child Health Records", type: "Child Record", table: "children", month: monthIndex },
                { id: `I${q}02-${monthIndex}`, name: "BNS Inventory Records", type: "Inventory Record", table: "inventory", month: monthIndex },
                { id: `A${q}03-${monthIndex}`, name: "Completed Appointments", type: "Appointment Record", table: "appointments", month: monthIndex, status: 'Completed' },
                { id: `A${q}04-${monthIndex}`, name: "Cancelled Appointments", type: "Appointment Record", table: "appointments", month: monthIndex, status: 'Cancelled' },
            ];
            return reports.map(r => {
                let data = allData[r.table].filter(item => new Date(item.created_at).getMonth() === monthIndex);
                if (r.status) {
                    data = data.filter(item => item.status === r.status);
                }
                return { ...r, date: `${monthName} ${year}`, size: formatBytes(JSON.stringify(data).length), hasData: data.length > 0 };
            });
        });
    };
    const monthlyReports = generateMonthlyReports(quarter.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{quarter.name} - {quarter.year} Detailed Reports</h2>
                    <div className="overflow-y-auto max-h-[60vh]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50"><tr className="text-left text-gray-600">{['ID Report', 'Report Name', 'Month', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
                            <tbody className="divide-y">
                                {monthlyReports.map(report => (
                                    <tr key={report.id} className="text-gray-700">
                                        <td className="p-3">{report.id}</td>
                                        <td className="p-3 font-semibold">{report.name}</td>
                                        <td className="p-3">{report.date}</td>
                                        <td className="p-3">{report.type}</td>
                                        <td className="p-3">{report.size}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleMonthlyDownload(report)} disabled={!report.hasData || loading} className="text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Download Monthly Report"><DownloadIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 border-t"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Close</button></div>
            </motion.div>
        </div>
    );
};
const GeneratingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <motion.div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-4 text-gray-700 font-semibold">Generating Report...</p>
        </motion.div>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function BnsReportsPage() {
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [allData, setAllData] = useState({ children: [], inventory: [], appointments: [] });
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const { addNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        // MODIFIED: Fetch appointments in addition to other data
        const [childrenRes, inventoryRes, appointmentsRes] = await Promise.all([
            supabase.from('child_records').select('*'),
            supabase.from('bns_inventory').select('*'),
            supabase.from('appointments').select('*') // Fetches all appointments
        ]);
        setAllData({
            children: childrenRes.data || [],
            inventory: inventoryRes.data || [],
            appointments: appointmentsRes.data || [] // Store appointments in state
        });
        setLoading(false);
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleQuarterDownload = async (quarter) => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const zip = new JSZip();
        const months = getQuarterMonths(quarter.id);
        
        const childData = allData.children.filter(c => months.includes(new Date(c.created_at).getMonth()));
        const inventoryData = allData.inventory.filter(i => months.includes(new Date(i.created_at).getMonth()));
        // MODIFIED: Filter appointments for the quarter
        const completedAppointments = allData.appointments.filter(a => months.includes(new Date(a.created_at).getMonth()) && a.status === 'Completed');
        const cancelledAppointments = allData.appointments.filter(a => months.includes(new Date(a.created_at).getMonth()) && a.status === 'Cancelled');
        
        if (childData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(childData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Child Records");
            zip.file(`Child_Health_Report_${quarter.name}.xlsx`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
        }
        
        if (inventoryData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(inventoryData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory Records");
            zip.file(`BNS_Inventory_Report_${quarter.name}.xlsx`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
        }

        // MODIFIED: Add appointment reports to the ZIP file
        if (completedAppointments.length > 0) {
            const ws = XLSX.utils.json_to_sheet(completedAppointments);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Completed Appointments");
            zip.file(`Completed_Appointments_${quarter.name}.xlsx`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
        }

        if (cancelledAppointments.length > 0) {
            const ws = XLSX.utils.json_to_sheet(cancelledAppointments);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Cancelled Appointments");
            zip.file(`Cancelled_Appointments_${quarter.name}.xlsx`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
        }

        if (Object.keys(zip.files).length === 0) {
            addNotification('No data available for this quarter to export.', 'error');
            setIsGenerating(false);
            return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `BNS_Report_${quarter.name}_${quarter.year}.zip`);
        setIsGenerating(false);
        addNotification('Report has been downloaded.', 'success');
        logActivity('BNS Report Downloaded', `Generated ZIP file for ${quarter.name}`);
    };

    const quarterlyReports = useMemo(() => {
        const year = new Date().getFullYear();
        return [1, 2, 3, 4].map(q => {
            const months = getQuarterMonths(q);
            const childData = allData.children.filter(c => months.includes(new Date(c.created_at).getMonth()));
            const inventoryData = allData.inventory.filter(i => months.includes(new Date(i.created_at).getMonth()));
            const totalSize = JSON.stringify(childData).length + JSON.stringify(inventoryData).length;
            
            return {
                id: q,
                name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`,
                year,
                type: "BNS Records",
                size: formatBytes(totalSize)
            };
        });
    }, [allData]);

    const filteredQuarterlyReports = useMemo(() => {
        if (!searchTerm) {
            return quarterlyReports; // If search is empty, return all reports
        }
        return quarterlyReports.filter(report =>
            report.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, quarterlyReports]);

    return (
        <>
            <AnimatePresence>
                {/* MODIFIED: Pass the addNotification function as a prop */}
                {selectedQuarter && <ViewQuarterModal quarter={selectedQuarter} onClose={() => setSelectedQuarter(null)} allData={allData} addNotification={addNotification} />}
                {isGenerating && <GeneratingModal />}
            </AnimatePresence>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                        <div className="relative w-full md:w-auto">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            {/* MODIFIED: This input is now connected to the searchTerm state */}
                            <input
                                type="text"
                                placeholder="Search Report..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm"
                            />
                        </div>
                    </div>
                    {loading ? <div className="text-center p-8">Loading...</div> : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50"><tr className="text-left text-gray-600">{['ID Report', 'Report Name', 'Year', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
                            <tbody className="divide-y">
                                {/* MODIFIED: This now maps over the filtered list */}
                                {filteredQuarterlyReports.map(report => (
                                    <tr key={report.id} className="text-gray-700">
                                        <td className="p-3">Q00{report.id}</td>
                                        <td className="p-3 font-semibold">{report.name}</td>
                                        <td className="p-3">{report.year}</td>
                                        <td className="p-3">{report.type}</td>
                                        <td className="p-3">{report.size}</td>
                                        <td className="p-3 flex items-center space-x-2">
                                            <button onClick={() => handleQuarterDownload(report)} className="text-gray-500 hover:text-blue-600" title="Download ZIP"><DownloadIcon /></button>
                                            <button onClick={() => setSelectedQuarter(report)} className="text-gray-500 hover:text-blue-600" title="View Details"><ViewIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <Calendar />
                </div>
            </div>
        </>
    );
}
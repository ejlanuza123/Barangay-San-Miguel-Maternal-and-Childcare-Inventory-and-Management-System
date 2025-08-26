import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';

// --- ICONS ---
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;

// --- Helper Functions ---
const getQuarterMonths = (q) => {
    return [
        [0, 1, 2],    // Q1: Jan, Feb, Mar
        [3, 4, 5],    // Q2: Apr, May, Jun
        [6, 7, 8],    // Q3: Jul, Aug, Sep
        [9, 10, 11]  // Q4: Oct, Nov, Dec
    ][q - 1];
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- Helper Components ---
const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const changeMonth = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    const generateDates = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dates = [];
        for (let i = 0; i < firstDay; i++) { dates.push(<div key={`pad-${i}`}></div>); }
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = new Date(year, month, i).toDateString() === new Date().toDateString();
            dates.push(<div key={i} className={`p-2 rounded-full text-center text-sm cursor-pointer ${isToday ? 'bg-blue-500 text-white' : ''}`}>{i}</div>);
        }
        return dates;
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)}>&lt;</button>
                <h3 className="font-bold text-gray-700">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)}>&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">{daysOfWeek.map(day => <div key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 mt-2">{generateDates()}</div>
        </div>
    );
};

const ViewQuarterModal = ({ quarter, onClose, allData }) => {
    const [loading, setLoading] = useState(false);

    const generateMonthlyReports = (q) => {
        const year = new Date().getFullYear();
        const months = getQuarterMonths(q);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return months.flatMap(monthIndex => {
            const monthName = monthNames[monthIndex];
            const baseReport = { date: `${monthName} ${year}`, month: monthIndex, year: year };
            
            const reports = [
                { id: `M${q}01-${monthIndex}`, name: "Maternity Patient Record", type: "Maternal Record", table: "patients" },
                { id: `M${q}02-${monthIndex}`, name: "Inventory Stock Record", type: "Inventory Record", table: "inventory" },
                { id: `M${q}03-${monthIndex}`, name: "Completed Appointment Record", type: "Appointment Record", table: "appointments", status: 'Completed' },
                { id: `M${q}04-${monthIndex}`, name: "Cancelled Appointment Record", type: "Appointment Record", table: "appointments", status: 'Cancelled' },
            ];

            return reports.map(r => {
                const data = allData[r.table].filter(item => {
                    const itemDate = new Date(item.updated_at || item.created_at);
                    if (itemDate.getMonth() !== monthIndex) return false;
                    if (r.status) return item.status === r.status;
                    return true;
                });
                const size = new TextEncoder().encode(JSON.stringify(data)).length;
                return { ...r, ...baseReport, size: formatBytes(size), hasData: data.length > 0 };
            });
        });
    };

    const monthlyReports = generateMonthlyReports(quarter.id);

    const handleDownload = async (report) => {
        if (!report.hasData) {
            alert(`No data available for ${report.name} in ${report.date}.`);
            return;
        }
        setLoading(true);
        const sourceData = allData[report.table] || [];

        const dataToExport = sourceData.filter(item => {
            const itemDate = new Date(item.updated_at || item.created_at);
            if (itemDate.getMonth() !== report.month) return false;
            if (report.status) return item.status === report.status;
            return true;
        });

        const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        window.XLSX.writeFile(workbook, `${report.name} - ${report.date}.xlsx`);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{quarter.name} - {quarter.year}</h2>
                    <div className="overflow-y-auto max-h-[60vh]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['ID Report', 'Report Name', 'Date', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {monthlyReports.map(report => (
                                    <tr key={report.id} className="text-gray-700">
                                        <td className="p-3">{report.id}</td>
                                        <td className="p-3 font-semibold">{report.name}</td>
                                        <td className="p-3">{report.date}</td>
                                        <td className="p-3">{report.type}</td>
                                        <td className="p-3">{report.size}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleDownload(report)} disabled={loading || !report.hasData} className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <DownloadIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const GeneratingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <motion.div
            className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-700 font-semibold">Generating Report...</p>
        </motion.div>
    </div>
);


export default function ReportsPage() {
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [allData, setAllData] = useState({ patients: [], inventory: [], appointments: [] });
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNoDataPop, setShowNoDataPop] = useState(false);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [patientsRes, inventoryRes, appointmentsRes] = await Promise.all([
            supabase.from('patients').select('*'),
            supabase.from('inventory').select('*'),
            supabase.from('appointments').select('*')
        ]);
        setAllData({
            patients: patientsRes.data || [],
            inventory: inventoryRes.data || [],
            appointments: appointmentsRes.data || []
        });
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleQuarterDownload = async (quarter) => {
        const months = getQuarterMonths(quarter.id);
        const hasDataForQuarter = allData.patients.some(p => months.includes(new Date(p.updated_at || p.created_at).getMonth())) ||
                                allData.inventory.some(i => months.includes(new Date(i.updated_at || i.created_at).getMonth())) ||
                                allData.appointments.some(a => months.includes(new Date(a.updated_at || a.created_at).getMonth()));

        if (!hasDataForQuarter) {
            setShowNoDataPop(true);
            setTimeout(() => setShowNoDataPop(false), 2000); // hide after 2s
            return;
        }

        

        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const zip = new window.JSZip();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        for (const monthIndex of months) {
            const monthName = monthNames[monthIndex];
            const generateSheet = (data, fileName) => {
                if (data.length > 0) {
                    const ws = window.XLSX.utils.json_to_sheet(data);
                    const wb = window.XLSX.utils.book_new();
                    window.XLSX.utils.book_append_sheet(wb, ws, "Data");
                    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    zip.file(`${fileName}-${monthName}.xlsx`, wbout);
                }
            };

            const patientsData = allData.patients.filter(p => new Date(p.updated_at || p.created_at).getMonth() === monthIndex);
            const inventoryData = allData.inventory.filter(i => new Date(i.updated_at || i.created_at).getMonth() === monthIndex);
            const completedAppointments = allData.appointments.filter(a => new Date(a.updated_at || a.created_at).getMonth() === monthIndex && a.status === 'Completed');
            const cancelledAppointments = allData.appointments.filter(a => new Date(a.updated_at || a.created_at).getMonth() === monthIndex && a.status === 'Cancelled');

            generateSheet(patientsData, "Maternity-Records");
            generateSheet(inventoryData, "Inventory-Records");
            generateSheet(completedAppointments, "Completed-Appointments");
            generateSheet(cancelledAppointments, "Cancelled-Appointments");
        }

        zip.generateAsync({ type: "blob" }).then(content => {
            window.saveAs(content, `${quarter.name}_${quarter.year}_Report.zip`);
            setIsGenerating(false);
            logActivity('Report Downloaded', `Generated ZIP file for ${quarter.name} ${quarter.year}`);
        });
    };

    const quarterlyReports = useMemo(() => {
        const year = new Date().getFullYear();
        return [1, 2, 3, 4].map(q => {
            const months = getQuarterMonths(q);
            let totalSize = 0;
            const patientsData = allData.patients.filter(p => months.includes(new Date(p.updated_at || p.created_at).getMonth()));
            const inventoryData = allData.inventory.filter(i => months.includes(new Date(i.updated_at || i.created_at).getMonth()));
            const appointmentsData = allData.appointments.filter(a => months.includes(new Date(a.updated_at || a.created_at).getMonth()));
            
            totalSize += new TextEncoder().encode(JSON.stringify(patientsData)).length;
            totalSize += new TextEncoder().encode(JSON.stringify(inventoryData)).length;
            totalSize += new TextEncoder().encode(JSON.stringify(appointmentsData)).length;

            return { id: q, name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`, year, type: "Maternal Record", size: formatBytes(totalSize) };
        });
    }, [allData]);

    const filteredQuarterlyReports = useMemo(() => {
        if (!searchTerm) return quarterlyReports;
        return quarterlyReports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, quarterlyReports]);

    return (
        <>
            <AnimatePresence>
                {selectedQuarter && <ViewQuarterModal quarter={selectedQuarter} onClose={() => setSelectedQuarter(null)} allData={allData} />}
                {isGenerating && <GeneratingModal />}
                {showNoDataPop && (
                    <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold z-50"
                    >
                    ❌ No data available for this quarter
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                        <div className="relative w-full md:w-auto">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input
                                type="text"
                                placeholder="Search Report..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['ID Report', 'Report Name', 'Year', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? ( <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr> ) : (
                                    filteredQuarterlyReports.map(report => (
                                        <tr key={report.id} className="text-gray-700">
                                            <td className="p-3">Q00{report.id}</td>
                                            <td className="p-3 font-semibold">{report.name}</td>
                                            <td className="p-3">{report.year}</td>
                                            <td className="p-3">{report.type}</td>
                                            <td className="p-3">{report.size}</td>
                                            <td className="p-3 flex items-center space-x-2">
                                                <button onClick={() => handleQuarterDownload(report)} className="text-gray-500 hover:text-blue-600"><DownloadIcon /></button>
                                                <button onClick={() => setSelectedQuarter(report)} className="text-gray-500 hover:text-blue-600"><ViewIcon /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <Calendar />
                </div>
            </div>
        </>
    );
}

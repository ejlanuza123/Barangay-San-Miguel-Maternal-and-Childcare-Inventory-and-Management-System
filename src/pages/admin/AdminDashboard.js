import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// --- NEW HELPER ICONS (add with other icons) ---
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const ViewActionIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;

// --- ICONS ---
const MaternityIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const InfantIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;

// --- WIDGET COMPONENTS ---

const StatusBadge = ({ status }) => {
    const styles = {
        High: 'bg-green-100 text-green-700',
        Moderate: 'bg-yellow-100 text-yellow-700',
        Low: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const Status = ({ status }) => {
    const styles = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Approved: 'bg-green-100 text-green-700',
        Denied: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 text-xs font-bold rounded-md ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const MonthlyReportModal = ({ quarter, allData, onClose, addNotification }) => {
    const getQuarterMonths = (q) => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]][q - 1];
    const formatBytes = (bytes) => (bytes === 0 ? '0 Bytes' : `${parseFloat((bytes / 1024).toFixed(2))} KB`);

    const monthlyReports = useMemo(() => {
        const year = quarter.year;
        const months = getQuarterMonths(quarter.id);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        return months.flatMap(monthIndex => {
            const monthName = monthNames[monthIndex];
            const reportTables = {
                main: quarter.reportType === 'BHW' ? 'Maternity Patient Record' : 'Child Health Record',
                inventory: 'Inventory Stock Record',
                appointments_completed: 'Completed Appointment Record',
                appointments_cancelled: 'Cancelled Appointment Record'
            };

            return Object.entries(reportTables).map(([tableKey, name]) => {
                let data = (allData[tableKey === 'main' ? 'main' : tableKey.split('_')[0]] || [])
                    .filter(item => new Date(item.created_at).getMonth() === monthIndex);
                if (tableKey.includes('_')) {
                    const status = tableKey.split('_')[1]; // completed or cancelled
                    data = data.filter(item => item.status && item.status.toLowerCase() === status.toLowerCase());
                }
                return {
                    id: `M${quarter.id}${monthIndex}${Math.random()}`, name, date: `${monthName} ${year}`,
                    type: name.includes('Patient') || name.includes('Child') ? 'Patient Record' : name.includes('Inventory') ? 'Inventory Record' : 'Appointment Record',
                    size: formatBytes(JSON.stringify(data).length), hasData: data.length > 0, data
                };
            });
        });
    }, [quarter, allData]);

    const handleMonthlyDownload = (report) => {
        if (!report.hasData) {
            addNotification('No data available to download for this report.', 'error');
            return;
        };
        const worksheet = XLSX.utils.json_to_sheet(report.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${report.name}_${report.date}.xlsx`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[51] p-4">
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Monthly Breakdown for {quarter.name}</h2>
                </div>
                <div className="p-4 overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50"><tr className="text-left text-gray-500 font-semibold">{['ID Report', 'Report Name', 'Date', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
                        <tbody className="divide-y">
                            {monthlyReports.map(report => (
                                <tr key={report.id}>
                                    <td className="p-2 font-medium">{report.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="p-2 font-semibold">{report.name}</td>
                                    <td className="p-2">{report.date}</td>
                                    <td className="p-2">{report.type}</td>
                                    <td className="p-2">{report.size}</td>
                                    <td className="p-2">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleMonthlyDownload(report)} disabled={!report.hasData} className="text-gray-500 hover:text-blue-600 disabled:opacity-50"><DownloadIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const AllCheckupsModal = ({ onClose }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- NEW: Icons for different appointment types ---
    const getReasonIcon = (reason) => {
        if (reason?.toLowerCase().includes('prenatal')) return '🤰';
        if (reason?.toLowerCase().includes('vaccination') || reason?.toLowerCase().includes('immunization')) return '💉';
        if (reason?.toLowerCase().includes('nutrition')) return '🍎';
        return '🩺'; // Default check-up icon
    };

    useEffect(() => {
        const fetchCheckups = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('appointments')
                .select('*, profiles:created_by(first_name, last_name, role)')
                .gte('date', today)
                .order('date', { ascending: true })
                .order('time', { ascending: true });
            
            if (error) {
                console.error("Error fetching upcoming checkups:", error);
            } else {
                setAppointments(data || []);
            }
            setLoading(false);
        };
        fetchCheckups();
    }, []);

    // --- NEW: Logic to group appointments by date ---
    const groupedAppointments = useMemo(() => {
        return appointments.reduce((acc, app) => {
            const date = app.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(app);
            return acc;
        }, {});
    }, [appointments]);

    const formatDateHeader = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-800">All Upcoming Check-ups</h2>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-gray-500">Loading appointments...</p>
                    ) : Object.keys(groupedAppointments).length > 0 ? (
                        Object.entries(groupedAppointments).map(([date, appsOnDate]) => (
                            <div key={date} className="mb-6 last:mb-0">
                                <h3 className="font-bold text-blue-600 border-b-2 border-blue-200 pb-2 mb-3">{formatDateHeader(date)}</h3>
                                <div className="space-y-3">
                                    {appsOnDate.map(app => (
                                        <div key={app.id} className={`p-3 rounded-lg border-l-4 ${app.profiles?.role === 'BHW' ? 'border-blue-500' : 'border-green-500'} bg-gray-50 flex items-center justify-between`}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{getReasonIcon(app.reason)}</span>
                                                <div>
                                                    <p className="font-bold text-gray-800">{app.patient_name}</p>
                                                    <p className="text-sm text-gray-600">{app.reason}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-800">{app.time}</p>
                                                <p className="text-xs text-gray-500">by {app.profiles?.first_name} ({app.profiles?.role})</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">No upcoming appointments found.</p>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const GenerateReportsModal = ({ onClose }) => {
    const [reportType, setReportType] = useState(null); // 'BHW' or 'BNS'
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false); // For download feedback
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const { addNotification } = useNotification();

    useEffect(() => {
        const fetchAllDataForReport = async () => {
            if (!reportType) return;
            setLoading(true);
            let dataPayload = {};
            if (reportType === 'BHW') {
                const [patientsRes, inventoryRes, appointmentsRes] = await Promise.all([
                    supabase.from('patients').select('*'),
                    supabase.from('inventory').select('*'),
                    supabase.from('appointments').select('*')
                ]);
                dataPayload = { main: patientsRes.data || [], inventory: inventoryRes.data || [], appointments: appointmentsRes.data || [] };
            } else if (reportType === 'BNS') {
                const [childrenRes, inventoryRes, appointmentsRes] = await Promise.all([
                    supabase.from('child_records').select('*'),
                    supabase.from('bns_inventory').select('*'),
                    supabase.from('appointments').select('*')
                ]);
                dataPayload = { main: childrenRes.data || [], inventory: inventoryRes.data || [], appointments: appointmentsRes.data || [] };
            }
            setAllData(dataPayload);
            setLoading(false);
        };
        fetchAllDataForReport();
    }, [reportType]);
    
    const getQuarterMonths = (q) => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]][q - 1];
    const formatBytes = (bytes) => (bytes === 0 ? '0 Bytes' : `${parseFloat((bytes / 1024).toFixed(2))} KB`);

    const quarterlyReports = useMemo(() => {
        if (!allData) return [];
        const year = new Date().getFullYear();
        return [1, 2, 3, 4].map(q => {
            const months = getQuarterMonths(q);
            const quarterData = Object.values(allData).flat().filter(d => d.created_at && months.includes(new Date(d.created_at).getMonth()));
            return { id: q, name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`, year, type: `${reportType} Records`, size: formatBytes(JSON.stringify(quarterData).length) };
        });
    }, [allData, reportType]);

    // --- MODIFIED: Full ZIP download logic ---
    const handleQuarterDownload = async (quarter) => {
        setIsGenerating(true);
        addNotification(`Generating ZIP for ${quarter.name}...`, 'success');
        
        const zip = new JSZip();
        const months = getQuarterMonths(quarter.id);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let filesAdded = 0;

        for (const monthIndex of months) {
            const monthName = monthNames[monthIndex];
            const reportConfigs = [
                { key: 'main', name: reportType === 'BHW' ? 'Patient_Records' : 'Child_Records' },
                { key: 'inventory', name: 'Inventory_Records' },
                { key: 'appointments', name: 'Appointment_Records' }
            ];

            reportConfigs.forEach(config => {
                const monthData = allData[config.key].filter(item => item.created_at && new Date(item.created_at).getMonth() === monthIndex);
                if (monthData.length > 0) {
                    const worksheet = XLSX.utils.json_to_sheet(monthData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
                    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    zip.file(`${monthName}_${config.name}.xlsx`, wbout);
                    filesAdded++;
                }
            });
        }
        
        if (filesAdded === 0) {
            addNotification('No data available to export for this quarter.', 'error');
            setIsGenerating(false);
            return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${reportType}_Report_${quarter.name}_${quarter.year}.zip`);
        setIsGenerating(false);
    };

    return (
        <>
            {isGenerating && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[52]">
                    <div className="bg-white rounded-lg p-6 flex items-center gap-4">
                        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="font-semibold">Generating Report...</span>
                    </div>
                </div>
            )}
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Generate Reports</h2>
                        {reportType && <button onClick={() => { setReportType(null); setAllData(null); }} className="text-sm font-semibold text-blue-600 hover:underline">&larr; Back to selection</button>}
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {!reportType ? (
                            <div className="space-y-4 text-center">
                                <p className="text-gray-600">Please select which type of report you would like to generate.</p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button onClick={() => setReportType('BHW')} className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700">BHW Reports</button>
                                    <button onClick={() => setReportType('BNS')} className="bg-green-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-green-700">BNS Reports</button>
                                </div>
                            </div>
                        ) : loading ? (
                            <p className="text-center text-gray-500">Loading report data...</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 font-semibold">
                                        {['ID Report', 'Report Name', 'Year', 'Type', 'Size', 'Action'].map(h => <th key={h} className="p-2">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quarterlyReports.map(report => (
                                        <tr key={report.id}>
                                            <td className="p-2 font-medium">Q00{report.id}</td>
                                            <td className="p-2 font-semibold">{report.name}</td>
                                            <td className="p-2">{report.year}</td>
                                            <td className="p-2">{report.type}</td>
                                            <td className="p-2">{report.size}</td>
                                            <td className="p-2">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => handleQuarterDownload(report)} className="text-gray-500 hover:text-blue-600" title="Download Quarterly ZIP"><DownloadIcon /></button>
                                                    <button onClick={() => setSelectedQuarter({ ...report, reportType })} className="text-gray-500 hover:text-blue-600" title="View Monthly Breakdown"><ViewActionIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                     <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                    </div>
                </motion.div>
            </div>
            <AnimatePresence>
                {selectedQuarter && <MonthlyReportModal quarter={selectedQuarter} allData={allData} onClose={() => setSelectedQuarter(null)} addNotification={addNotification} />}
            </AnimatePresence>
        </>
    );
};


const ViewAllStockModal = ({ items, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => 
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
            >
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Complete Stock Inventory</h2>
                </div>
                <div className="p-4">
                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Search item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr className="text-left text-gray-600">
                                <th className="p-3 font-semibold">Item Name</th>
                                <th className="p-3 font-semibold">Total Quantity</th>
                                <th className="p-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredItems.map(item => (
                                <tr key={item.item_name}>
                                    <td className="p-3 font-semibold text-gray-700">{item.item_name}</td>
                                    <td className="p-3 text-gray-600">{item.quantity} units</td>
                                    <td className="p-3"><StatusBadge status={item.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};


const StatCard = ({ icon, count, label, color }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </div>
);

const StockWidget = ({ items, onSeeAll }) => {
    const getBarColor = (status) => {
        switch (status) {
            case 'Low': return 'bg-red-500';
            case 'Moderate': return 'bg-yellow-400';
            case 'High': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };
    const getBarWidth = (quantity) => {
        if (quantity >= 100) return '100%';
        if (quantity <= 0) return '2%';
        return `${quantity}%`;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700">Stock</h3>
                <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>Low</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></div>Moderate</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>High</span>
                </div>
                <button onClick={onSeeAll} className="text-xs font-semibold text-blue-600 hover:underline">See All</button>
            </div>
            <div className="space-y-3">
                {items.slice(0, 5).map(item => (
                    <div key={item.item_name}>
                        <p className="text-sm font-semibold text-gray-600">{item.item_name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className={`${getBarColor(item.status)} h-2.5 rounded-full`} style={{ width: getBarWidth(item.quantity) }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickAccessWidget = ({ onScheduleClick, onReportsClick }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col space-y-3">
        <h3 className="font-bold text-gray-700">Quick Access</h3>
        <Link to="/admin/employees" className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-blue-700">+ Add New Member</Link>
        <button onClick={onReportsClick} className="w-full text-center bg-orange-500 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-orange-600">Generate Reports</button>
        <button onClick={onScheduleClick} className="w-full text-center bg-green-500 text-white font-semibold py-2.5 px-3 rounded-md shadow hover:bg-green-600">Scheduled Check-up</button>
    </div>
);
const RequestionsWidget = ({ requestions, onViewDetails }) => (
    <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">Requestions</h3>
            <Link to="/admin/requestions" className="text-xs font-semibold text-blue-600 hover:underline">See All</Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-500 font-semibold">
                        {['BRGY Worker ID', 'Lastname', 'Firstname', 'Role', 'Mobile No.', 'Action'].map(h => <th key={h} className="px-2 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {requestions.map(req => (
                        <tr key={req.id} className="text-gray-600">
                            <td className="px-2 py-2">{req.profiles?.user_id_no || 'N/A'}</td>
                            <td className="px-2 py-2">{req.profiles?.last_name || 'N/A'}</td>
                            <td className="px-2 py-2">{req.profiles?.first_name || 'N/A'}</td>
                            <td className="px-2 py-2">{req.profiles?.role || 'N/A'}</td>
                            <td className="px-2 py-2">{req.profiles?.contact_no || 'N/A'}</td>
                            {/* --- MODIFIED: This button now opens the details modal --- */}
                            <td className="px-2 py-2">
                                <button onClick={() => onViewDetails(req)} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-md hover:bg-blue-200">
                                    Request Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
const CalendarWidget = () => { const [currentDate, setCurrentDate] = useState(new Date()); const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; const changeMonth = (amount) => { setCurrentDate(prevDate => { const newDate = new Date(prevDate); newDate.setMonth(newDate.getMonth() + amount); return newDate; }); }; const generateDates = () => { const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const dates = []; for (let i = 0; i < firstDayOfMonth; i++) { dates.push(<div key={`pad-start-${i}`} className="w-8 h-8"></div>); } for (let i = 1; i <= daysInMonth; i++) { const date = new Date(year, month, i); const isToday = date.toDateString() === new Date().toDateString(); dates.push( <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer ${isToday ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}`}> {i} </div> ); } return dates; }; return ( <div className="bg-white p-4 rounded-lg shadow border"> <div className="flex justify-between items-center mb-3"> <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button> <h3 className="font-bold text-gray-700"> {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} </h3> <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button> </div> <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-semibold"> {daysOfWeek.map(day => <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>)} </div> <div className="grid grid-cols-7 mt-1 gap-y-1 justify-items-center"> {generateDates()} </div> </div> ); };

const RequestDetailsModal = ({ request, onClose }) => {
    const formatKey = (key) => {
        return key.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Request Details (REQ - {request.id})</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Requester Info */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700 border-b pb-2">Requester Information</h3>
                        <div className="text-sm"><strong>Name:</strong> {request.profiles?.first_name} {request.profiles?.last_name}</div>
                        <div className="text-sm"><strong>Role:</strong> {request.profiles?.role}</div>
                        <div className="text-sm"><strong>User ID:</strong> {request.profiles?.user_id_no}</div>
                    </div>
                    {/* Request Info */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700 border-b pb-2">Request Information</h3>
                        <div className="text-sm"><strong>Type:</strong> {request.request_type}</div>
                        <div className="text-sm"><strong>Target:</strong> {request.request_data.patient_id || request.request_data.child_id}</div>
                        <div className="text-sm"><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</div>
                        {/* --- MODIFIED: This now uses the StatusBadge component --- */}
                        <div className="text-sm flex items-center gap-2"><strong>Status:</strong> <Status status={request.status} /></div>
                    </div>
                    {/* Request Data Section */}
                    {request.request_type === 'Update' && (
                        <div className="md:col-span-2">
                            <h3 className="font-bold text-gray-700 border-b pb-2">Proposed Changes</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 mt-2 text-xs bg-gray-50 p-3 rounded">
                                {Object.entries(request.request_data).map(([key, value]) => {
                                    if (typeof value === 'object' || !value) return null;
                                    return (
                                        <div key={key}>
                                            <p className="text-gray-500">{formatKey(key)}</p>
                                            <p className="font-semibold text-gray-800">{String(value)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};
// --- MAIN ADMIN DASHBOARD COMPONENT ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({ newMaternity: 0, newInfant: 0 }); // Default to 0
    const [stockItems, setStockItems] = useState([]);
    const [requestions, setRequestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

        const [
            bhwInventoryRes, 
            bnsInventoryRes, 
            requestionsRes,
            newMaternityCountRes,
            newInfantCountRes
        ] = await Promise.all([
            supabase.from('inventory').select('item_name, quantity'),
            supabase.from('bns_inventory').select('item_name, quantity'),
            
            // --- THIS IS THE CORRECTED QUERY ---
            // It now correctly joins using "!inner" and selects the "user_id_no"
            supabase.from('requestions')
                .select('*, profiles:worker_id!inner(first_name, last_name, role, user_id_no, contact_no)')
                .order('created_at', { ascending: false })
                .limit(5),

            supabase.from('patients').select('*', { count: 'exact', head: true })
                .gte('created_at', firstDayOfMonth)
                .lt('created_at', firstDayOfNextMonth),
            supabase.from('child_records').select('*', { count: 'exact', head: true })
                .gte('created_at', firstDayOfMonth)
                .lt('created_at', firstDayOfNextMonth),
        ]);
        
        setStats({
            newMaternity: newMaternityCountRes.count || 0,
            newInfant: newInfantCountRes.count || 0,
        });

        const aggregatedStock = {};
        if (bhwInventoryRes.data) {
            bhwInventoryRes.data.forEach(item => {
                aggregatedStock[item.item_name] = (aggregatedStock[item.item_name] || 0) + item.quantity;
            });
        }
        if (bnsInventoryRes.data) {
            bnsInventoryRes.data.forEach(item => {
                aggregatedStock[item.item_name] = (aggregatedStock[item.item_name] || 0) + item.quantity;
            });
        }
        
        const HIGH_THRESHOLD = 50;
        const MODERATE_THRESHOLD = 20;

        const finalStockList = Object.keys(aggregatedStock).map(name => {
            const quantity = aggregatedStock[name];
            let status = 'Low';
            if (quantity > HIGH_THRESHOLD) {
                status = 'High';
            } else if (quantity > MODERATE_THRESHOLD) {
                status = 'Moderate';
            }
            return { item_name: name, quantity, status };
        }).sort((a, b) => a.quantity - b.quantity);

        setStockItems(finalStockList);

        if (requestionsRes.data) {
            setRequestions(requestionsRes.data);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return <div className="p-6">Loading Admin Dashboard...</div>;
    }

    return (
        <>
            <AnimatePresence>
                {isStockModalOpen && (
                    <ViewAllStockModal 
                        items={stockItems}
                        onClose={() => setIsStockModalOpen(false)}
                    />
                )}
                {selectedRequest && <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
                {isCheckupModalOpen && <AllCheckupsModal onClose={() => setIsCheckupModalOpen(false)} />}
                {isReportsModalOpen && <GenerateReportsModal onClose={() => setIsReportsModalOpen(false)} />}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                <StockWidget items={stockItems} onSeeAll={() => setIsStockModalOpen(true)} />
                            </div>
                            {/* --- MODIFIED: The 'count' prop now uses the dynamic state --- */}
                            <StatCard icon={<MaternityIcon />} count={stats.newMaternity} label="New Maternity Patient" color="blue" />
                            <StatCard icon={<InfantIcon />} count={stats.newInfant} label="New Infant Patient" color="green" />
                        </div>
                        <RequestionsWidget requestions={requestions} onViewDetails={setSelectedRequest} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <QuickAccessWidget 
                            onScheduleClick={() => setIsCheckupModalOpen(true)}
                            onReportsClick={() => setIsReportsModalOpen(true)}
                        />
                        <CalendarWidget />
                    </div>
                </div>
            </div>
        </>
    );
}
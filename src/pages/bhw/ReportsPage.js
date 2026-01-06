import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo.jpg'; // Uncomment if you have the logo

// --- ICONS ---
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const ChevronLeftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;

// --- HELPER FUNCTIONS ---
const getQuarterMonths = (q) => {
    return [
        [0, 1, 2],    // Q1: Jan, Feb, Mar
        [3, 4, 5],    // Q2: Apr, May, Jun
        [6, 7, 8],    // Q3: Jul, Aug, Sep
        [9, 10, 11]   // Q4: Oct, Nov, Dec
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

// --- WIDGETS ---
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
        for (let i = 0; i < firstDay; i++) { dates.push(<div key={`pad-${i}`} className="p-2"></div>); }
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = new Date(year, month, i).toDateString() === new Date().toDateString();
            dates.push(<div key={i} className={`p-2 rounded-full text-center text-sm cursor-pointer ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100'}`}>{i}</div>);
        }
        return dates;
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full">&lt;</button>
                <h3 className="font-bold text-gray-700">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">{daysOfWeek.map(day => <div key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 mt-2">{generateDates()}</div>
        </div>
    );
};

const ViewQuarterModal = ({ quarter, onClose, allData, onDownloadMonth }) => {
    const months = getQuarterMonths(quarter.id);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const year = quarter.year;
    
    // 1. New Patients Registered
    const newPatients = allData.patients.filter(p => {
        const d = new Date(p.created_at);
        return months.includes(d.getMonth()) && d.getFullYear() === year;
    });

    // 2. Patients Visited (Based on last_visit)
    const visitedPatients = allData.patients.filter(p => {
        if (!p.last_visit) return false;
        const d = new Date(p.last_visit);
        return months.includes(d.getMonth()) && d.getFullYear() === year;
    });

    const inventory = allData.inventory.filter(i => {
        const d = new Date(i.updated_at || i.created_at);
        return months.includes(d.getMonth()) && d.getFullYear() === year;
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, y: -30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 30 }}
            >
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Quarterly Summary: {quarter.name}</h2>
                    <p className="text-sm text-gray-500">Year: {quarter.year}</p>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">{newPatients.length}</p>
                            <p className="text-xs text-gray-600 uppercase font-semibold">New Patients</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{visitedPatients.length}</p>
                            <p className="text-xs text-gray-600 uppercase font-semibold">Active Visits</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-yellow-600">{inventory.length}</p>
                            <p className="text-xs text-gray-600 uppercase font-semibold">Items Updated</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-600">{newPatients.filter(p => p.risk_level === 'HIGH RISK').length}</p>
                            <p className="text-xs text-gray-600 uppercase font-semibold">High Risk (New)</p>
                        </div>
                    </div>
                    
                    {/* Monthly Breakdown List */}
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3 text-sm border-b pb-2">Monthly Breakdown</h4>
                        <div className="space-y-3">
                            {months.map(m => {
                                const mName = monthNames[m];
                                // Count visits in this month
                                const mVisits = allData.patients.filter(p => {
                                    if(!p.last_visit) return false;
                                    const d = new Date(p.last_visit);
                                    return d.getMonth() === m && d.getFullYear() === year;
                                }).length;

                                return (
                                    <div key={m} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{mName}</p>
                                            <p className="text-xs text-gray-500">{mVisits} Patient Visits Recorded</p>
                                        </div>
                                        <button
                                            onClick={() => onDownloadMonth(m, quarter.year)}
                                            className="flex items-center space-x-2 text-xs bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                                        >
                                            <DownloadIcon />
                                            <span>Download PDF</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Close</button>
                </div>
            </motion.div>
        </div>
    );
};

const GeneratingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <motion.div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-4 text-gray-700 font-semibold">Generating PDF Report...</p>
            <p className="text-xs text-gray-500 mt-1">Analyzing data & compiling analytics...</p>
        </motion.div>
    </div>
);

// --- MAIN COMPONENT ---
export default function ReportsPage() {
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [allData, setAllData] = useState({ patients: [], inventory: [], appointments: [] });
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNoDataPop, setShowNoDataPop] = useState(false);
    // --- NEW: State for Year Selection ---
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const { addNotification } = useNotification();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        // Note: We fetch ALL data here and filter client-side for flexibility
        // In a production app with huge data, you'd filter by year in the SQL query
        const [patientsRes, inventoryRes, appointmentsRes] = await Promise.all([
            supabase.from('patients').select('*'),
            supabase.from('inventory').select('*'),
            supabase.from('appointments').select('*, profiles(first_name, last_name)')
        ]);
        setAllData({
            patients: patientsRes.data || [],
            inventory: inventoryRes.data || [],
            appointments: appointmentsRes.data || []
        });
        setLoading(false);
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // --- REUSABLE PDF GENERATOR ---
    const generateReport = async (fileName, periodLabel, targetMonths, year) => {
        // 1. Filter Data for target months AND YEAR
        
        // Patients who REGISTERED in this period
        const newPatients = allData.patients.filter(p => {
            const d = new Date(p.created_at);
            return targetMonths.includes(d.getMonth()) && d.getFullYear() === year;
        });

        // Patients who VISITED in this period (Active Activity)
        const visitedPatients = allData.patients.filter(p => {
            if (!p.last_visit) return false;
            const d = new Date(p.last_visit);
            return targetMonths.includes(d.getMonth()) && d.getFullYear() === year;
        });

        const inventory = allData.inventory.filter(i => {
            const d = new Date(i.updated_at || i.created_at);
            return targetMonths.includes(d.getMonth()) && d.getFullYear() === year;
        });

        if (newPatients.length === 0 && visitedPatients.length === 0 && inventory.length === 0) {
            setShowNoDataPop(true);
            setTimeout(() => setShowNoDataPop(false), 2000);
            return;
        }

        setIsGenerating(true);
        
        // 2. Analytics Calculations
        const totalNew = newPatients.length;
        const totalVisited = visitedPatients.length;
        
        const riskDist = { Normal: 0, Mid: 0, High: 0 };
        // Calculate risk dist based on ALL active patients (new + visited unique)
        const uniqueActive = [...new Set([...newPatients, ...visitedPatients])];
        uniqueActive.forEach(p => {
            const r = p.risk_level?.toUpperCase() || 'NORMAL';
            if (r.includes('HIGH')) riskDist.High++;
            else if (r.includes('MID')) riskDist.Mid++;
            else riskDist.Normal++;
        });

        const lowStockItems = inventory.filter(i => i.quantity <= 20).length;

        // 3. Initialize PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // --- HEADER ---
        doc.setFontSize(14).setFont(undefined, 'bold').text("Barangay San Miguel Health Center", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10).setFont(undefined, 'normal').text("Maternal Health Activity Report", pageWidth / 2, 26, { align: "center" });
        doc.line(15, 32, pageWidth - 15, 32);

        // --- REPORT INFO ---
        doc.setFontSize(11).setFont(undefined, 'bold');
        doc.text(`Period: ${periodLabel}`, 15, 42);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 42, { align: "right" });

        // --- SECTION 1: ANALYTICS SUMMARY ---
        doc.setFontSize(12).setTextColor(41, 128, 185).text("1. Executive Summary & Analytics", 15, 55);
        doc.setTextColor(0, 0, 0);

        const statsY = 62;
        doc.setFontSize(10);
        
        // Box 1: New Registrations
        doc.setDrawColor(200); doc.setFillColor(245, 247, 250); doc.rect(15, statsY, 55, 25, 'F'); doc.rect(15, statsY, 55, 25, 'S');
        doc.setFont(undefined, 'bold').text(`${totalNew}`, 25, statsY + 10);
        doc.setFont(undefined, 'normal').text("New Patients Registered", 25, statsY + 18);

        // Box 2: Active Visits
        doc.setFillColor(240, 253, 244); doc.rect(75, statsY, 55, 25, 'F'); doc.rect(75, statsY, 55, 25, 'S');
        doc.setFont(undefined, 'bold').text(`${totalVisited}`, 85, statsY + 10);
        doc.setFont(undefined, 'normal').text("Patient Visits Recorded", 85, statsY + 18);

        // Box 3: Inventory
        doc.setFillColor(255, 247, 237); doc.rect(135, statsY, 55, 25, 'F'); doc.rect(135, statsY, 55, 25, 'S');
        doc.setFont(undefined, 'bold').text(`${inventory.length}`, 145, statsY + 10);
        doc.setFont(undefined, 'normal').text("Items Updated/Added", 145, statsY + 18);

        // Analytics Text
        doc.text("Activity Risk Overview (Unique Patients):", 15, statsY + 35);
        doc.setFontSize(9).setTextColor(100);
        doc.text(`- High Risk Patients Seen: ${riskDist.High}`, 20, statsY + 42);
        doc.text(`- Mid Risk Patients Seen: ${riskDist.Mid}`, 20, statsY + 48);
        doc.text(`- Normal Risk Patients Seen: ${riskDist.Normal}`, 20, statsY + 54);
        doc.setTextColor(0);

        // --- SECTION 2: NEW PATIENT REGISTRY ---
        let currentY = statsY + 65;
        doc.setFontSize(12).setTextColor(41, 128, 185).text("2. New Patient Registry", 15, currentY);
        
        const patientRows = newPatients.map(p => [
            p.patient_id,
            `${p.last_name}, ${p.first_name}`,
            p.age,
            p.purok,
            p.risk_level,
            new Date(p.created_at).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['ID', 'Name', 'Age', 'Purok', 'Risk Level', 'Reg. Date']],
            body: patientRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 },
        });

        // --- SECTION 3: VISIT LOG ---
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        
        doc.setFontSize(12).setTextColor(41, 128, 185).text("3. Patient Visit Activity", 15, currentY);
        
        const visitRows = visitedPatients.map(p => [
            p.last_visit ? new Date(p.last_visit).toLocaleDateString() : 'N/A',
            `${p.last_name}, ${p.first_name}`,
            p.patient_id,
            p.purok,
            p.risk_level
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Visit Date', 'Patient Name', 'ID', 'Purok', 'Risk Status']],
            body: visitRows,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] }, 
            styles: { fontSize: 8 },
        });

        // --- SECTION 4: INVENTORY ---
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }

        doc.setFontSize(12).setTextColor(41, 128, 185).text("4. Inventory Activity", 15, currentY);

        const inventoryRows = inventory.map(i => [
            i.item_name,
            i.category,
            `${i.quantity} ${i.unit || 'units'}`,
            i.status,
            new Date(i.updated_at || i.created_at).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Item Name', 'Category', 'Stock Level', 'Status', 'Date Updated']],
            body: inventoryRows,
            theme: 'grid',
            headStyles: { fillColor: [230, 126, 34] },
            styles: { fontSize: 8 },
        });

        doc.save(`${fileName}.pdf`);
        
        setIsGenerating(false);
        logActivity('Report Generated', `Created PDF report for ${periodLabel}`);
        addNotification('PDF Report generated successfully.', 'success');
    };

    // Handler for Quarterly Button
    const handleQuarterDownload = (quarter) => {
        const months = getQuarterMonths(quarter.id);
        generateReport(
            `BHW_Quarterly_Report_${quarter.name}_${quarter.year}`,
            `${quarter.name} ${quarter.year}`,
            months,
            quarter.year // Pass the correct year
        );
    };

    // Handler for Monthly Button
    const handleMonthlyDownload = (monthIndex, year) => {
        const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
        generateReport(
            `BHW_Monthly_Report_${monthName}_${year}`,
            `${monthName} ${year}`,
            [monthIndex], // Pass single month as array
            year // Pass the correct year
        );
    };

    // --- REFACTORED: Dependent on 'currentYear' state ---
    const quarterlyReports = useMemo(() => {
        return [1, 2, 3, 4].map(q => {
            const months = getQuarterMonths(q);
            
            // FILTER BY CURRENT YEAR & ACTIVITY
            const newCount = allData.patients.filter(p => {
                const d = new Date(p.created_at);
                return months.includes(d.getMonth()) && d.getFullYear() === currentYear;
            }).length;
            
            const visitCount = allData.patients.filter(p => {
                if (!p.last_visit) return false;
                const d = new Date(p.last_visit);
                return months.includes(d.getMonth()) && d.getFullYear() === currentYear;
            }).length;
            
            return { 
                id: q, 
                name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`, 
                year: currentYear, 
                type: "Analytics PDF", 
                size: `${newCount} New / ${visitCount} Visits`
            };
        });
    }, [allData, currentYear]);

    const filteredReports = useMemo(() => {
        if (!searchTerm) return quarterlyReports;
        return quarterlyReports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, quarterlyReports]);

    return (
        <>
            <AnimatePresence>
                {selectedQuarter && (
                    <ViewQuarterModal 
                        quarter={selectedQuarter} 
                        onClose={() => setSelectedQuarter(null)} 
                        allData={allData}
                        onDownloadMonth={handleMonthlyDownload}
                    />
                )}
                {isGenerating && <GeneratingModal />}
                {showNoDataPop && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold z-50">
                        ❌ No data available for this period
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                            
                            {/* --- NEW: YEAR SELECTOR --- */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-2">
                                <button onClick={() => setCurrentYear(y => y - 1)} className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-blue-600 transition-colors">
                                    <ChevronLeftIcon />
                                </button>
                                <span className="px-2 font-bold text-gray-700 select-none">{currentYear}</span>
                                <button onClick={() => setCurrentYear(y => y + 1)} className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-blue-600 transition-colors">
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full md:w-auto">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input type="text" placeholder="Search Quarter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['Report ID', 'Report Name', 'Year', 'Format', 'Data Volume', 'Actions'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr> : filteredReports.map(report => (
                                    <tr key={report.id} className="text-gray-700 hover:bg-gray-50 transition-colors">
                                        <td className="p-3">RPT-Q{report.id}</td>
                                        <td className="p-3 font-semibold text-gray-800">{report.name}</td>
                                        <td className="p-3 font-bold text-blue-600">{report.year}</td>
                                        <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">PDF</span></td>
                                        <td className="p-3">{report.size}</td>
                                        <td className="p-3 flex items-center space-x-2">
                                            <button onClick={() => handleQuarterDownload(report)} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors" title="Download Quarterly Report"><DownloadIcon /></button>
                                            <button onClick={() => setSelectedQuarter(report)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors" title="View & Monthly Downloads"><ViewIcon /></button>
                                        </td>
                                    </tr>
                                ))}
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
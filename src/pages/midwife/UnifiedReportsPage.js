// src/pages/midwife/UnifiedReportsPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import leftLogoIcon from '../../assets/leftLogo.png';
import rightLogoIcon from '../../assets/rightLogo.png';

// --- ICONS ---
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const ViewIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const ChevronLeftIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;

// --- HELPER FUNCTIONS ---
const loadImage = (src) => new Promise((resolve) => { 
    const img = new Image(); 
    img.src = src; 
    img.onload = () => resolve(img); 
    img.onerror = () => resolve(null); 
});

const getQuarterMonths = (q) => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]][q - 1];

const formatDate = (date) => !date ? 'N/A' : new Date(date).toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
});

const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) { years--; months += 12; }
    return years === 0 ? `${months} months` : `${years} yrs ${months} mo`;
};

// Extract medical notes from JSON
const extractMedicalNotes = (medicalHistory) => {
    if (!medicalHistory) return '';
    
    try {
        const history = typeof medicalHistory === 'string' 
            ? JSON.parse(medicalHistory) 
            : medicalHistory;
        
        if (Array.isArray(history)) {
            return history.slice(0, 3).join(', ');
        } else if (typeof history === 'object') {
            return Object.values(history).slice(0, 3).join(', ');
        }
        return String(history).substring(0, 100) + '...';
    } catch (e) {
        return String(medicalHistory).substring(0, 100) + '...';
    }
};

// --- ENHANCED DATA CALCULATION FUNCTIONS ---
const calculateMaternalSummary = (patients, startDate, endDate) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Filter patients by period
    const periodPatients = patients.filter(patient => {
        const patientDate = new Date(patient.created_at);
        return patientDate >= startDate && patientDate <= endDate;
    });

    // Calculate summary statistics
    const totalRegistered = patients.length;
    const newRegistrations = periodPatients.length;
    
    // Active mothers (with visits in the period)
    const activeMothers = patients.filter(patient => {
        if (!patient.last_visit) return false;
        const lastVisit = new Date(patient.last_visit);
        return lastVisit >= startDate && lastVisit <= endDate;
    }).length;
    
    // High-risk pregnancies
    const highRiskPregnancies = patients.filter(p => 
        p.risk_level && p.risk_level.toUpperCase() === 'HIGH'
    ).length;
    
    // Low-risk pregnancies
    const lowRiskPregnancies = patients.filter(p => 
        p.risk_level && p.risk_level.toUpperCase() === 'LOW'
    ).length;
    
    // Mothers with no recent visit (30 days)
    const mothersNoRecentVisit = patients.filter(patient => {
        if (!patient.last_visit) return true;
        const lastVisit = new Date(patient.last_visit);
        return lastVisit < thirtyDaysAgo;
    }).length;

    // Mothers with no visit for 60+ days
    const mothersInactive60Days = patients.filter(patient => {
        if (!patient.last_visit) return true;
        const lastVisit = new Date(patient.last_visit);
        return lastVisit < sixtyDaysAgo;
    });

    return {
        totalRegistered,
        newRegistrations,
        activeMothers,
        highRiskPregnancies,
        lowRiskPregnancies,
        mothersNoRecentVisit,
        mothersInactive60Days
    };
};

const calculateChildHealthSummary = (children, startDate, endDate) => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let summary = {
        totalChildren: children.length,
        // Age groups
        age0to11: 0,
        age1to4: 0,
        age5plus: 0,
        // Nutrition status
        underweight: 0,
        stunted: 0,
        normal: 0,
        overweight: 0,
        obese: 0,
        severelyUnderweight: 0,
        wasted: 0,
        // New registrations
        newRegistrations: 0,
        // Checkup status
        withRecentCheckup: 0,
        withoutRecentCheckup: 0
    };

    children.forEach(child => {
        // Age calculation
        if (child.dob) {
            const birthDate = new Date(child.dob);
            const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
            
            if (ageInMonths < 12) {
                summary.age0to11++;
            } else if (ageInMonths <= 48) {
                summary.age1to4++;
            } else {
                summary.age5plus++;
            }
        }

        // Nutrition status
        const nutritionStatus = child.nutrition_status || 'Normal';
        if (nutritionStatus.includes('Underweight') || nutritionStatus === 'Underweight') {
            summary.underweight++;
        } else if (nutritionStatus.includes('Severely') || nutritionStatus === 'Severely Underweight') {
            summary.severelyUnderweight++;
        } else if (nutritionStatus === 'Stunted') {
            summary.stunted++;
        } else if (nutritionStatus === 'Normal') {
            summary.normal++;
        } else if (nutritionStatus === 'Overweight') {
            summary.overweight++;
        } else if (nutritionStatus === 'Obese') {
            summary.obese++;
        } else if (nutritionStatus === 'Wasted') {
            summary.wasted++;
        }

        // New registrations in period
        if (child.created_at) {
            const createdDate = new Date(child.created_at);
            if (createdDate >= startDate && createdDate <= endDate) {
                summary.newRegistrations++;
            }
        }

        // Checkup status
        if (child.last_checkup) {
            const lastCheckup = new Date(child.last_checkup);
            if (lastCheckup >= sixMonthsAgo) {
                summary.withRecentCheckup++;
            } else {
                summary.withoutRecentCheckup++;
            }
        } else {
            summary.withoutRecentCheckup++;
        }
    });

    return summary;
};

const calculateInventorySummary = (inventoryData) => {
    const today = new Date();
    const nearExpiryThreshold = 30; // days
    
    let summary = {
        totalItems: inventoryData.length,
        totalQuantity: 0,
        normalCount: 0,
        lowCount: 0,
        criticalCount: 0,
        expiredCount: 0,
        nearExpiryCount: 0,
        byCategory: {},
        bySource: {},
        byOwnerRole: {}
    };

    inventoryData.forEach(item => {
        // Quantity summary
        summary.totalQuantity += item.quantity || 0;
        
        // Status counts
        const status = item.status?.toLowerCase();
        if (status === 'normal') summary.normalCount++;
        if (status === 'low') summary.lowCount++;
        if (status === 'critical') summary.criticalCount++;

        // Expiry analysis
        if (item.expiry_date) {
            const expiryDate = new Date(item.expiry_date);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                summary.expiredCount++;
            } else if (diffDays <= nearExpiryThreshold) {
                summary.nearExpiryCount++;
            }
        }

        // Group by category
        summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + 1;
        
        // Group by source
        const source = item.supply_source || 'Unknown';
        summary.bySource[source] = (summary.bySource[source] || 0) + 1;
        
        // Group by owner role
        const ownerRole = item.owner_role || 'Unknown';
        summary.byOwnerRole[ownerRole] = (summary.byOwnerRole[ownerRole] || 0) + 1;
    });

    return summary;
};

// --- MODAL COMPONENTS ---
const ViewReportModal = ({ reportItem, onClose, onDownload }) => {
    const { name, year, type, data } = reportItem;
    
    let summaryStats = [];
    if (type === 'inventory') {
        const s = data.summary;
        summaryStats = [
            { label: 'Total Items', value: s.totalItems, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Quantity', value: s.totalQuantity, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Low Stock', value: s.lowCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Critical', value: s.criticalCount, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Expired', value: s.expiredCount, color: 'text-red-700', bg: 'bg-red-100' },
            { label: 'Near Expiry', value: s.nearExpiryCount, color: 'text-orange-600', bg: 'bg-orange-50' }
        ];
    } else if (type === 'mother') {
        const s = data.summary;
        summaryStats = [
            { label: 'Total Mothers', value: s.totalRegistered, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'New Registrations', value: s.newRegistrations, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Mothers', value: s.activeMothers, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'High-Risk', value: s.highRiskPregnancies, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Low-Risk', value: s.lowRiskPregnancies, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Needs Follow-up', value: s.mothersNoRecentVisit, color: 'text-orange-600', bg: 'bg-orange-50' }
        ];
    } else {
        const s = data.summary;
        summaryStats = [
            { label: 'Total Children', value: s.totalChildren, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            { label: 'New Registrations', value: s.newRegistrations, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Age 0-11 months', value: s.age0to11, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Age 1-4 years', value: s.age1to4, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Underweight', value: s.underweight, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Normal Nutrition', value: s.normal, color: 'text-green-600', bg: 'bg-green-50' }
        ];
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
            <motion.div 
                initial={{ opacity: 0, y: -30 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Report Summary: {name}</h2>
                    <p className="text-sm text-gray-500">
                        Year: {year} | Type: {type === 'inventory' ? 'Inventory Report' : 
                        type === 'mother' ? 'Maternal Health Report' : 'Child Health Report'}
                    </p>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {summaryStats.map((s, i) => (
                            <div key={i} className={`${s.bg} p-4 rounded-lg text-center`}>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Additional Info */}
                    <div className={`p-4 rounded-lg border ${
                        type === 'mother' ? 'bg-purple-50 border-purple-200' :
                        type === 'children' ? 'bg-cyan-50 border-cyan-200' :
                        'bg-blue-50 border-blue-200'
                    }`}>
                        <h3 className="font-bold text-gray-700 mb-2">
                            {type === 'mother' ? 'Maternal Health Overview:' :
                             type === 'children' ? 'Child Health Overview:' :
                             'Inventory Overview:'}
                        </h3>
                        <div className="text-sm text-gray-600">
                            {type === 'mother' ? (
                                <>
                                    <p>• Comprehensive maternal health report for BHW monitoring</p>
                                    <p>• Includes high-risk pregnancy tracking and follow-up compliance</p>
                                    <p>• Identifies mothers needing immediate outreach and follow-up</p>
                                </>
                            ) : type === 'children' ? (
                                <>
                                    <p>• Comprehensive child health and nutrition report</p>
                                    <p>• Tracks growth monitoring and nutrition status</p>
                                    <p>• Identifies at-risk children for intervention</p>
                                </>
                            ) : (
                                <>
                                    <p>• Complete inventory status and expiry tracking</p>
                                    <p>• Stock level monitoring and reorder recommendations</p>
                                    <p>• Owner-based inventory analysis (BHW/BNS)</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border text-center border-blue-200">
                        <p className="text-sm text-blue-600 mb-4 font-semibold">
                            Click below to generate the full PDF report with detailed tables, analytics, and official signatures.
                        </p>
                        <button
                            onClick={() => onDownload(reportItem)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors"
                        >
                            <DownloadIcon /> Download Full PDF Report
                        </button>
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
        <motion.div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
        >
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-700 font-semibold">Generating Comprehensive PDF Report...</p>
            <p className="text-xs text-gray-500 mt-1">Compiling analytics, tables, and summary data...</p>
        </motion.div>
    </div>
);

// --- MAIN COMPONENT ---
export default function UnifiedReportsPage() {
    const [allData, setAllData] = useState({ 
        patients: [], 
        child_records: [], 
        inventory: [], 
        profiles: [],
        appointments: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [reportCategory, setReportCategory] = useState('mother'); // 'mother', 'children', 'inventory'
    const [frequency, setFrequency] = useState('quarterly');
    const [filterOwner, setFilterOwner] = useState('All'); // 'All', 'BHW', 'BNS'
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showNoDataPop, setShowNoDataPop] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const { user } = useAuth();
    const { addNotification } = useNotification();

    // Fetch ALL Data
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [pat, child, inv, prof, appt, userProfileRes] = await Promise.all([
                supabase.from('patients').select('*').eq('is_deleted', false),
                supabase.from('child_records').select('*').eq('is_deleted', false),
                supabase.from('inventory').select('*').eq('is_deleted', false),
                supabase.from('profiles').select('*'),
                supabase.from('appointments').select('*').eq('status', 'Completed'),
                supabase.from('profiles').select('*').eq('id', user?.id).single()
            ]);
            
            setAllData({ 
                patients: pat.data || [], 
                child_records: child.data || [], 
                inventory: inv.data || [], 
                profiles: prof.data || [],
                appointments: appt.data || []
            });
            
            if (userProfileRes.data) {
                setCurrentUserProfile(userProfileRes.data);
            }
        } catch (e) { 
            addNotification(e.message, 'error'); 
        }
        setLoading(false);
    }, [addNotification, user?.id]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // Get unique categories and statuses for inventory filters
    const uniqueCategories = useMemo(() => {
        const categories = [...new Set(allData.inventory.map(item => item.category).filter(Boolean))];
        return ['All', ...categories.sort()];
    }, [allData.inventory]);

    const uniqueStatuses = useMemo(() => {
        const statuses = [...new Set(allData.inventory.map(item => item.status).filter(Boolean))];
        return ['All', ...statuses.sort()];
    }, [allData.inventory]);

    // Generate List of Available Reports
    const reportList = useMemo(() => {
        const list = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        
        const loopCount = frequency === 'quarterly' ? 4 : 12;
        
        for (let i = 0; i < loopCount; i++) {
            let name, months, startDate, endDate;
            if (frequency === 'quarterly') {
                const q = i + 1;
                name = `Q${q} (${q===1?'1st':q===2?'2nd':q===3?'3rd':'4th'} Quarter)`;
                months = getQuarterMonths(q);
                startDate = new Date(currentYear, months[0], 1);
                endDate = new Date(currentYear, months[2] + 1, 0);
            } else {
                name = monthNames[i];
                months = [i];
                startDate = new Date(currentYear, i, 1);
                endDate = new Date(currentYear, i + 1, 0);
            }

            let dataPackage = {};
            let size = '0';
            let summary = {};

            if (reportCategory === 'mother') {
                summary = calculateMaternalSummary(allData.patients, startDate, endDate);
                dataPackage = { 
                    patients: allData.patients, 
                    summary, 
                    startDate, 
                    endDate 
                };
                size = `${summary.newRegistrations} New / ${summary.totalRegistered} Total`;
            } else if (reportCategory === 'children') {
                summary = calculateChildHealthSummary(allData.child_records, startDate, endDate);
                dataPackage = { 
                    children: allData.child_records, 
                    summary, 
                    startDate, 
                    endDate 
                };
                size = `${summary.newRegistrations} New / ${summary.totalChildren} Total`;
            } else {
                // Inventory Filter Logic
                let filteredInv = allData.inventory.filter(item => {
                    const d = new Date(item.updated_at || item.created_at);
                    const timeMatch = months.includes(d.getMonth()) && d.getFullYear() === currentYear;
                    const ownerMatch = filterOwner === 'All' || item.owner_role === filterOwner;
                    const categoryMatch = filterCategory === 'All' || item.category === filterCategory;
                    const statusMatch = filterStatus === 'All' || 
                                       (item.status && item.status.toLowerCase() === filterStatus.toLowerCase());
                    return timeMatch && ownerMatch && categoryMatch && statusMatch;
                });
                
                summary = calculateInventorySummary(filteredInv);
                dataPackage = { 
                    inventory: filteredInv, 
                    summary 
                };
                size = `${summary.totalItems} Items (${summary.criticalCount} Crit)`;
            }

            list.push({ 
                id: `${frequency}_${i}_${reportCategory}_${filterOwner}_${filterCategory}_${filterStatus}`,
                name, 
                year: currentYear, 
                type: reportCategory, 
                data: dataPackage, 
                size,
                summary,
                months,
                startDate,
                endDate
            });
        }
        return list;
    }, [allData, currentYear, reportCategory, frequency, filterOwner, filterCategory, filterStatus]);

    const filteredReports = useMemo(() => {
        if (!searchTerm) return reportList;
        return reportList.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, reportList]);

    // --- COMPREHENSIVE PDF GENERATORS ---
    const generateMaternalReport = async (item) => {
        if (!item.data.patients || item.data.patients.length === 0) {
            setShowNoDataPop(true);
            setTimeout(() => setShowNoDataPop(false), 2000);
            addNotification('No maternal data available for this period.', 'warning');
            return;
        }

        setIsGenerating(true);
        const leftLogo = await loadImage(leftLogoIcon);
        const rightLogo = await loadImage(rightLogoIcon);
        
        const doc = new jsPDF('portrait');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // --- HEADER SECTION ---
        if (leftLogo) doc.addImage(leftLogo, 'PNG', 15, 10, 25, 25);
        if (rightLogo) doc.addImage(rightLogo, 'PNG', pageWidth - 40, 10, 25, 25);
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("BARANGAY SAN MIGUEL HEALTH CENTER", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("MATERNAL HEALTH RECORDS REPORT", pageWidth / 2, 28, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Report Period: ${item.name} ${item.year}`, 15, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 40, { align: "right" });
        
        if (currentUserProfile) {
            doc.text(`Generated By: ${currentUserProfile.first_name} ${currentUserProfile.last_name} (${currentUserProfile.role})`, 15, 45);
        }

        doc.line(15, 50, pageWidth - 15, 50);

        let currentY = 60;

        // --- 1. MATERNAL SUMMARY ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(142, 68, 173);
        doc.text("1. MATERNAL SUMMARY (OVERVIEW)", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const summary = item.data.summary;
        const col1 = 15;
        const col2 = 90;
        
        doc.text(`Total Registered Mothers: ${summary.totalRegistered}`, col1, currentY + 8);
        doc.text(`New Registrations: ${summary.newRegistrations}`, col1, currentY + 14);
        doc.text(`Active Mothers (with visits): ${summary.activeMothers}`, col1, currentY + 20);
        
        doc.text(`High-Risk Pregnancies: ${summary.highRiskPregnancies}`, col2, currentY + 8);
        doc.text(`Low-Risk Pregnancies: ${summary.lowRiskPregnancies}`, col2, currentY + 14);
        doc.text(`Mothers with no recent visit: ${summary.mothersNoRecentVisit}`, col2, currentY + 20);

        currentY += 35;

        // --- 2. NEW REGISTRATIONS ---
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("2. NEW MATERNAL REGISTRATIONS", 15, currentY);
        
        const newRegistrations = item.data.patients
            .filter(p => new Date(p.created_at) >= item.startDate && new Date(p.created_at) <= item.endDate)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const registrationRows = newRegistrations.map(patient => [
            patient.patient_id || '-',
            `${patient.first_name} ${patient.last_name}`,
            patient.age || '-',
            `${patient.purok || ''} ${patient.street || ''}`.substring(0, 30),
            patient.weeks ? `${patient.weeks} weeks` : '-',
            patient.risk_level || 'Not specified',
            formatDate(patient.created_at)
        ]);

        if (registrationRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Patient ID', 'Full Name', 'Age', 'Address', 'Weeks', 'Risk Level', 'Reg. Date']],
                body: registrationRows,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- 3. HIGH-RISK PREGNANCY MONITORING ---
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(192, 57, 43);
        doc.text("3. HIGH-RISK PREGNANCY MONITORING", 15, currentY);
        
        const highRiskPatients = item.data.patients
            .filter(p => p.risk_level && p.risk_level.toUpperCase() === 'HIGH')
            .sort((a, b) => {
                if (!a.last_visit) return 1;
                if (!b.last_visit) return -1;
                return new Date(b.last_visit) - new Date(a.last_visit);
            });
        
        const highRiskRows = highRiskPatients.map(patient => {
            const medicalNotes = extractMedicalNotes(patient.medical_history);
            
            return [
                `${patient.first_name} ${patient.last_name}`.substring(0, 25),
                patient.age || '-',
                patient.weeks ? `${patient.weeks} weeks` : '-',
                patient.risk_level || 'HIGH',
                formatDate(patient.last_visit),
                medicalNotes.substring(0, 40) + (medicalNotes.length > 40 ? '...' : '')
            ];
        });

        if (highRiskRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Patient Name', 'Age', 'Weeks', 'Risk Level', 'Last Visit', 'Medical Notes']],
                body: highRiskRows,
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- 4. SIGNATURES ---
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("PREPARED BY:", 15, currentY);
        doc.line(15, currentY + 5, 70, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        if (currentUserProfile) {
            doc.text(`${currentUserProfile.first_name} ${currentUserProfile.last_name}`, 15, currentY + 10);
            doc.text(`(${currentUserProfile.role})`, 15, currentY + 15);
        }
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, currentY + 20);

        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL - Barangay Health Center Internal Document", pageWidth/2, pageHeight - 10, { align: "center" });

        const fileName = `Maternal_Health_Report_${item.name.replace(/ /g, '_')}_${item.year}.pdf`;
        doc.save(fileName);
        setIsGenerating(false);
        
        await logActivity('Maternal Health Report Generated', 
            `Generated comprehensive maternal health report: ${item.name} ${item.year} with ${item.data.patients.length} patients`);
        addNotification(`Maternal health report "${fileName}" generated successfully.`, 'success');
    };

    const generateChildHealthReport = async (item) => {
        if (!item.data.children || item.data.children.length === 0) {
            setShowNoDataPop(true);
            setTimeout(() => setShowNoDataPop(false), 2000);
            addNotification('No child data available for this period.', 'warning');
            return;
        }

        setIsGenerating(true);
        const leftLogo = await loadImage(leftLogoIcon);
        const rightLogo = await loadImage(rightLogoIcon);
        
        const doc = new jsPDF('portrait');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // --- HEADER SECTION ---
        if (leftLogo) doc.addImage(leftLogo, 'PNG', 15, 10, 25, 25);
        if (rightLogo) doc.addImage(rightLogo, 'PNG', pageWidth - 40, 10, 25, 25);
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("BARANGAY SAN MIGUEL HEALTH CENTER", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("CHILD HEALTH & NUTRITION RECORDS REPORT", pageWidth / 2, 28, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Report Period: ${item.name} ${item.year}`, 15, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 40, { align: "right" });
        
        if (currentUserProfile) {
            doc.text(`Generated By: ${currentUserProfile.first_name} ${currentUserProfile.last_name} (${currentUserProfile.role})`, 15, 45);
        }

        doc.line(15, 50, pageWidth - 15, 50);

        let currentY = 60;

        // --- 1. CHILD POPULATION SUMMARY ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("1. CHILD POPULATION SUMMARY", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const summary = item.data.summary;
        const col1 = 15;
        const col2 = 90;
        
        doc.text(`Total Registered Children: ${summary.totalChildren}`, col1, currentY + 8);
        doc.text(`New Child Registrations: ${summary.newRegistrations}`, col1, currentY + 14);
        doc.text(`Children aged 0-11 months: ${summary.age0to11}`, col1, currentY + 20);
        doc.text(`Children aged 1-4 years: ${summary.age1to4}`, col1, currentY + 26);
        
        doc.text(`Underweight Children: ${summary.underweight}`, col2, currentY + 8);
        doc.text(`Stunted Children: ${summary.stunted}`, col2, currentY + 14);
        doc.text(`Normal Nutrition Status: ${summary.normal}`, col2, currentY + 20);
        doc.text(`Children 5+ years: ${summary.age5plus}`, col2, currentY + 26);

        currentY += 40;

        // --- 2. CHILD REGISTRY ---
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(39, 174, 96);
        doc.text("2. CHILD REGISTRY (MASTER LIST)", 15, currentY);
        
        const allChildren = item.data.children.sort((a, b) => {
            const nameA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase();
            const nameB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        const registryRows = allChildren.slice(0, 20).map(child => [
            child.child_id || '-',
            child.child_name || `${child.first_name || ''} ${child.last_name || ''}`,
            child.sex || '-',
            child.dob ? formatDate(child.dob) : '-',
            calculateAge(child.dob),
            child.address || '-',
            child.guardian_name || '-',
            child.family_number || '-'
        ]);

        if (registryRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Child ID', 'Child Name', 'Sex', 'Date of Birth', 'Age', 'Address', 'Guardian', 'Family No.']],
                body: registryRows,
                theme: 'striped',
                headStyles: { fillColor: [39, 174, 96] },
                styles: { fontSize: 7 },
                margin: { left: 15, right: 15 },
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- 3. NUTRITION & GROWTH MONITORING ---
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(192, 57, 43);
        doc.text("3. NUTRITION & GROWTH MONITORING", 15, currentY);
        
        const nutritionRows = item.data.children
            .filter(child => child.weight_kg || child.height_cm || child.nutrition_status)
            .slice(0, 20)
            .map(child => [
                child.child_name || `${child.first_name || ''} ${child.last_name || ''}`,
                calculateAge(child.dob),
                child.weight_kg ? `${child.weight_kg} kg` : '-',
                child.height_cm ? `${child.height_cm} cm` : '-',
                child.bmi ? child.bmi.toFixed(1) : '-',
                child.nutrition_status || '-'
            ]);

        if (nutritionRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Child Name', 'Age', 'Weight', 'Height', 'BMI', 'Nutrition Status']],
                body: nutritionRows,
                theme: 'grid',
                headStyles: { fillColor: [192, 57, 43] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- 4. SIGNATURES ---
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("PREPARED BY:", 15, currentY);
        doc.line(15, currentY + 5, 70, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        if (currentUserProfile) {
            doc.text(`${currentUserProfile.first_name} ${currentUserProfile.last_name}`, 15, currentY + 10);
            doc.text(`(${currentUserProfile.role})`, 15, currentY + 15);
        }
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, currentY + 20);

        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL - Barangay Health Center Internal Document", pageWidth/2, pageHeight - 10, { align: "center" });

        const fileName = `Child_Health_Report_${item.name.replace(/ /g, '_')}_${item.year}.pdf`;
        doc.save(fileName);
        setIsGenerating(false);
        
        await logActivity('Child Health Report Generated', 
            `Generated comprehensive child health report: ${item.name} ${item.year} with ${item.data.children.length} children`);
        addNotification(`Child health report "${fileName}" generated successfully.`, 'success');
    };

    const generateInventoryReport = async (item) => {
        if (!item.data.inventory || item.data.inventory.length === 0) {
            setShowNoDataPop(true);
            setTimeout(() => setShowNoDataPop(false), 2000);
            addNotification('No inventory data available for this period.', 'warning');
            return;
        }

        setIsGenerating(true);
        const leftLogo = await loadImage(leftLogoIcon);
        const rightLogo = await loadImage(rightLogoIcon);
        
        const doc = new jsPDF('portrait');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // --- HEADER SECTION ---
        if (leftLogo) doc.addImage(leftLogo, 'PNG', 15, 10, 25, 25);
        if (rightLogo) doc.addImage(rightLogo, 'PNG', pageWidth - 40, 10, 25, 25);
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("BARANGAY SAN MIGUEL HEALTH CENTER", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text(`INVENTORY REPORT (${filterOwner === 'All' ? 'COMPREHENSIVE' : filterOwner})`, pageWidth / 2, 28, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Report: ${item.name} ${item.year}`, 15, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 40, { align: "right" });
        
        if (currentUserProfile) {
            doc.text(`Generated By: ${currentUserProfile.first_name} ${currentUserProfile.last_name} (${currentUserProfile.role})`, 15, 45);
        }

        doc.line(15, 50, pageWidth - 15, 50);

        let currentY = 60;

        // --- 1. INVENTORY SUMMARY ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("1. INVENTORY SUMMARY", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const summary = item.data.summary;
        const summaryCol1 = 15;
        const summaryCol2 = 80;
        const summaryCol3 = 130;
        
        doc.text(`Total Items: ${summary.totalItems}`, summaryCol1, currentY + 8);
        doc.text(`Total Quantity: ${summary.totalQuantity} units`, summaryCol1, currentY + 14);
        
        doc.text(`Normal Stock: ${summary.normalCount}`, summaryCol2, currentY + 8);
        doc.text(`Low Stock: ${summary.lowCount}`, summaryCol2, currentY + 14);
        doc.text(`Critical Stock: ${summary.criticalCount}`, summaryCol2, currentY + 20);
        
        doc.text(`Expired Items: ${summary.expiredCount}`, summaryCol3, currentY + 8);
        doc.text(`Near Expiry (30 days): ${summary.nearExpiryCount}`, summaryCol3, currentY + 14);

        currentY += 30;

        // --- 2. DETAILED INVENTORY LIST ---
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("2. DETAILED INVENTORY LIST", 15, currentY);
        
        const detailedRows = item.data.inventory.map(item => [
            item.item_name || '-',
            item.category || '-',
            `${item.quantity || 0} ${item.unit || ''}`,
            item.status || '-',
            item.owner_role || '-',
            item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-',
            item.supplier || '-'
        ]);

        if (detailedRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Item Name', 'Category', 'Quantity', 'Status', 'Owner', 'Expiry Date', 'Supplier']],
                body: detailedRows,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- 3. DISTRIBUTION BY CATEGORY ---
        if (Object.keys(summary.byCategory).length > 0) {
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(39, 174, 96);
            doc.text("3. DISTRIBUTION BY CATEGORY", 15, currentY);
            
            const catRows = Object.entries(summary.byCategory).map(([cat, count]) => [cat, count.toString()]);
            autoTable(doc, {
                startY: currentY + 5,
                head: [['Category', 'Number of Items']],
                body: catRows,
                theme: 'striped',
                headStyles: { fillColor: [39, 174, 96] },
                margin: { left: 15 }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        }

        // --- 4. SIGNATURES ---
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("PREPARED BY:", 15, currentY);
        doc.line(15, currentY + 5, 70, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        if (currentUserProfile) {
            doc.text(`${currentUserProfile.first_name} ${currentUserProfile.last_name}`, 15, currentY + 10);
            doc.text(`(${currentUserProfile.role})`, 15, currentY + 15);
        }
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, currentY + 20);

        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL - Barangay Health Center Internal Document", pageWidth/2, pageHeight - 10, { align: "center" });

        const fileName = `Inventory_Report_${item.name.replace(/ /g, '_')}_${item.year}.pdf`;
        doc.save(fileName);
        setIsGenerating(false);
        
        await logActivity('Inventory Report Generated', 
            `Generated comprehensive inventory report: ${item.name} ${item.year} with ${item.data.inventory.length} items`);
        addNotification(`Inventory report "${fileName}" generated successfully.`, 'success');
    };

    const generateReport = async (item) => {
        if (item.type === 'mother') {
            await generateMaternalReport(item);
        } else if (item.type === 'children') {
            await generateChildHealthReport(item);
        } else {
            await generateInventoryReport(item);
        }
    };

    // Get summary data for sidebar
    const maternalSummary = useMemo(() => {
        return calculateMaternalSummary(
            allData.patients,
            new Date(currentYear, 0, 1),
            new Date(currentYear, 11, 31)
        );
    }, [allData.patients, currentYear]);

    const childHealthSummary = useMemo(() => {
        return calculateChildHealthSummary(
            allData.child_records,
            new Date(currentYear, 0, 1),
            new Date(currentYear, 11, 31)
        );
    }, [allData.child_records, currentYear]);

    const inventorySummary = useMemo(() => {
        return calculateInventorySummary(allData.inventory);
    }, [allData.inventory]);

    return (
        <>
            <AnimatePresence>
                {selectedReport && (
                    <ViewReportModal 
                        reportItem={selectedReport} 
                        onClose={() => setSelectedReport(null)} 
                        onDownload={generateReport}
                    />
                )}
                {isGenerating && <GeneratingModal />}
                {showNoDataPop && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.8 }} 
                        className="fixed bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold z-50"
                    >
                        ❌ No data available for this period/filters
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    
                    {/* --- CONTROLS HEADER --- */}
                    <div className="flex flex-col space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">System Reports Dashboard</h2>
                                <p className="text-sm text-gray-500">
                                    Unified dashboard for BHW and BNS records 
                                    {currentUserProfile?.role === 'Midwife' ? ' (Midwife View)' : 
                                    currentUserProfile?.role === 'Admin' ? ' (Administrator View)' : 
                                    ' (System View)'}
                                </p>
                            </div>
                            
                            {/* Year Selector - keep as is */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-2">
                                <button 
                                    onClick={() => setCurrentYear(y => y - 1)} 
                                    className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <span className="px-2 font-bold text-gray-700 select-none min-w-[3rem] text-center">
                                    {currentYear}
                                </span>
                                <button 
                                    onClick={() => setCurrentYear(y => y + 1)} 
                                    className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors"
                                >
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>

                        {/* Report Type & Frequency Toggles */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setReportCategory('mother')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportCategory === 'mother' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Maternal Health (BHW)
                                </button>
                                <button 
                                    onClick={() => setReportCategory('children')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportCategory === 'children' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Child Health (BNS)
                                </button>
                                <button 
                                    onClick={() => setReportCategory('inventory')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportCategory === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Inventory (All)
                                </button>
                            </div>

                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setFrequency('quarterly')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${frequency === 'quarterly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Quarterly
                                </button>
                                <button 
                                    onClick={() => setFrequency('monthly')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${frequency === 'monthly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>

                        {/* Additional Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                            {reportCategory === 'inventory' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Filter by Owner</label>
                                        <select 
                                            value={filterOwner}
                                            onChange={(e) => setFilterOwner(e.target.value)}
                                            className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                                        >
                                            <option value="All">All Owners</option>
                                            <option value="BHW">BHW Only</option>
                                            <option value="BNS">BNS Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Filter by Category</label>
                                        <select 
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                                        >
                                            {uniqueCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Filter by Status</label>
                                        <select 
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full text-sm border rounded-md px-3 py-2 bg-white"
                                        >
                                            {uniqueStatuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Search Reports</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon />
                                    </span>
                                    <input 
                                        type="text" 
                                        placeholder="Search reports..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    <th className="p-3 font-semibold">Report Name</th>
                                    <th className="p-3 font-semibold">Period</th>
                                    <th className="p-3 font-semibold">Type</th>
                                    <th className="p-3 font-semibold">Data Volume</th>
                                    <th className="p-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center p-8">
                                            <div className="flex flex-col items-center">
                                                <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Loading report data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center p-8 text-gray-500">
                                            No reports available for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map(report => (
                                        <tr key={report.id} className="text-gray-700 hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-semibold text-gray-800">{report.name}</td>
                                            <td className="p-3">{report.year}</td>
                                            <td className="p-3 capitalize">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                    ${report.type === 'inventory' ? 'bg-blue-100 text-blue-800' : 
                                                      report.type === 'mother' ? 'bg-purple-100 text-purple-800' :
                                                      'bg-cyan-100 text-cyan-800'}`}>
                                                    {report.type === 'inventory' ? 'Inventory' : 
                                                     report.type === 'mother' ? 'Maternal Health' : 'Child Health'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-semibold">{report.size}</span>
                                                {report.type === 'mother' && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({report.data.summary.highRiskPregnancies} high-risk)
                                                    </span>
                                                )}
                                                {report.type === 'children' && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({report.data.summary.underweight} underweight)
                                                    </span>
                                                )}
                                                {report.type === 'inventory' && report.data.summary && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({report.data.summary.criticalCount} critical)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 flex items-center space-x-2">
                                                <button 
                                                    onClick={() => generateReport(report)}
                                                    className={`p-2 rounded-full transition-colors ${
                                                        report.type === 'mother' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-800' :
                                                        report.type === 'children' ? 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-800' :
                                                        'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800'
                                                    }`}
                                                    title="Download PDF Report"
                                                >
                                                    <DownloadIcon />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedReport(report)}
                                                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                                    title="View Summary"
                                                >
                                                    <ViewIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar with Statistics */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-3">Report Generation Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Current Year:</span>
                                <span className="font-semibold">{currentYear}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Report Type:</span>
                                <span className="font-semibold capitalize">
                                    {reportCategory === 'mother' ? 'Maternal Health (BHW)' : 
                                     reportCategory === 'children' ? 'Child Health (BNS)' : 'Inventory (All)'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Frequency:</span>
                                <span className="font-semibold">{frequency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Reports Available:</span>
                                <span className="font-semibold">{reportList.length}</span>
                            </div>
                            {reportCategory === 'inventory' && (
                                <div className="border-t pt-3 mt-3 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Owner Filter:</span>
                                        <span className="font-semibold">{filterOwner}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category Filter:</span>
                                        <span className="font-semibold">{filterCategory}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status Filter:</span>
                                        <span className="font-semibold">{filterStatus}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* System Overview */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-3">System Overview ({currentYear})</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Maternal Health (BHW)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-purple-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Total Mothers</p>
                                        <p className="font-bold text-purple-600">{maternalSummary.totalRegistered}</p>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">High-Risk</p>
                                        <p className="font-bold text-red-600">{maternalSummary.highRiskPregnancies}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Child Health (BNS)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-cyan-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Total Children</p>
                                        <p className="font-bold text-cyan-600">{childHealthSummary.totalChildren}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Underweight</p>
                                        <p className="font-bold text-yellow-600">{childHealthSummary.underweight}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-2">Inventory</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Total Items</p>
                                        <p className="font-bold text-blue-600">{inventorySummary.totalItems}</p>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Critical Stock</p>
                                        <p className="font-bold text-red-600">{inventorySummary.criticalCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-3">User Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Logged in as:</span>
                                <span className={`font-semibold ${
                                    currentUserProfile?.role === 'Midwife' ? 'text-purple-600' :
                                    currentUserProfile?.role === 'Admin' ? 'text-green-600' :
                                    'text-blue-600'
                                }`}>
                                    {currentUserProfile?.role || 'User'}
                                </span>
                            </div>
                            {currentUserProfile && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-semibold">{currentUserProfile.first_name} {currentUserProfile.last_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Role:</span>
                                        <span className={`font-semibold ${
                                            currentUserProfile.role === 'Midwife' ? 'text-purple-600' :
                                            currentUserProfile.role === 'Admin' ? 'text-green-600' :
                                            'text-blue-600'
                                        }`}>
                                            {currentUserProfile.role}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="pt-2 border-t text-xs text-gray-500">
                                <p>Last updated: {new Date().toLocaleDateString()}</p>
                                <p>{currentUserProfile?.role === 'Midwife' ? 'Full system access for monitoring and reporting' :
                                    currentUserProfile?.role === 'Admin' ? 'Administrator access with full system control' :
                                    'System reporting access'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
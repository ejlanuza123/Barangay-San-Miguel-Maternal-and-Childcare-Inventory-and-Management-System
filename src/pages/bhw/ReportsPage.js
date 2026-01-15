// src\pages\bhw\ReportsPage.js
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
const loadImage = (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Resolve with null if image fails to load
    });
};

const getRemainingShelfLife = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const getQuarterMonths = (q) => {
    return [
        [0, 1, 2],    // Q1: Jan, Feb, Mar
        [3, 4, 5],    // Q2: Apr, May, Jun
        [6, 7, 8],    // Q3: Jul, Aug, Sep
        [9, 10, 11]   // Q4: Oct, Nov, Dec
    ][q - 1];
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Calculate maternal summary statistics
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

// --- MODAL COMPONENTS ---
const ViewReportModal = ({ reportItem, onClose, onDownload }) => {
    const { name, year, type, data } = reportItem;
    
    // Calculate summary stats
    let summaryStats = [];
    if (type === 'inventory') {
        const {
            totalItems,
            totalQuantity,
            normalCount,
            lowCount,
            criticalCount,
            expiredCount,
            nearExpiryCount
        } = data.summary;
        
        summaryStats = [
            { label: 'Total Items', value: totalItems, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Quantity', value: totalQuantity, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Low Stock', value: lowCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Critical', value: criticalCount, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Expired', value: expiredCount, color: 'text-red-700', bg: 'bg-red-100' },
            { label: 'Near Expiry', value: nearExpiryCount, color: 'text-orange-600', bg: 'bg-orange-50' }
        ];
    } else {
        // Maternal report stats
        const summary = data.summary;
        summaryStats = [
            { label: 'Total Mothers', value: summary.totalRegistered, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'New Registrations', value: summary.newRegistrations, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Mothers', value: summary.activeMothers, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'High-Risk', value: summary.highRiskPregnancies, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Low-Risk', value: summary.lowRiskPregnancies, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Needs Follow-up', value: summary.mothersNoRecentVisit, color: 'text-orange-600', bg: 'bg-orange-50' }
        ];
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
            <motion.div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, y: -30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 30 }}
            >
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Report Summary: {name}</h2>
                    <p className="text-sm text-gray-500">
                        Year: {year} | Type: {type === 'inventory' ? 'Inventory Report' : 'Maternal Health Report'}
                    </p>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {summaryStats.map((s, i) => (
                            <div key={i} className={`${s.bg} p-4 rounded-lg text-center`}>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Additional Info for Maternal Reports */}
                    {type === 'mother' && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="font-bold text-gray-700 mb-2">Maternal Health Overview:</h3>
                            <div className="text-sm text-gray-600">
                                <p>• Comprehensive maternal health report for BHW monitoring</p>
                                <p>• Includes high-risk pregnancy tracking and follow-up compliance</p>
                                <p>• Identifies mothers needing immediate outreach and follow-up</p>
                            </div>
                        </div>
                    )}

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
export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState(null);
    const [allData, setAllData] = useState({ 
        patients: [], 
        inventory: [],
        profiles: [],
        appointments: [] 
    });
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNoDataPop, setShowNoDataPop] = useState(false);
    const { addNotification } = useNotification();
    const { user } = useAuth();
    
    // Report Configuration States
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState('mother'); // 'mother' or 'inventory'
    const [frequency, setFrequency] = useState('quarterly'); // 'quarterly' or 'monthly'
    
    // For inventory filters
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterOwnerRole, setFilterOwnerRole] = useState('All');

    // Get current user's profile
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const isBHW = true; // This page is for BHW only

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all necessary data for BHW
            const [
                patientsRes, 
                inventoryRes, 
                profilesRes, 
                userProfileRes,
                appointmentsRes
            ] = await Promise.all([
                supabase.from('patients').select('*').eq('is_deleted', false),
                supabase.from('inventory').select('*').eq('is_deleted', false),
                supabase.from('profiles').select('*'),
                supabase.from('profiles').select('*').eq('id', user?.id).single(),
                supabase.from('appointments').select('*').eq('status', 'Completed')
            ]);

            setAllData({
                patients: patientsRes.data || [],
                inventory: inventoryRes.data || [],
                profiles: profilesRes.data || [],
                appointments: appointmentsRes.data || []
            });

            if (userProfileRes.data) {
                setCurrentUserProfile(userProfileRes.data);
                // Auto-set owner filter to BHW
                setFilterOwnerRole('BHW');
            }
        } catch (error) {
            addNotification(`Error fetching data: ${error.message}`, 'error');
        }
        setLoading(false);
    }, [addNotification, user?.id]);

    useEffect(() => { 
        fetchAllData(); 
    }, [fetchAllData]);

    // Calculate inventory summary statistics
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

    // Generate comprehensive maternal health report PDF
    // Replace the generateMaternalReport function with this corrected version:

// Generate comprehensive maternal health report PDF
    const generateMaternalReport = async (reportItem) => {
        const { name, year, data } = reportItem;
        
        // Check if data exists
        if (!data.patients || data.patients.length === 0) {
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
        doc.setDrawColor(200);
        // Left Logo Placeholder
        if (leftLogo) {
            // doc.addImage(imgData, format, x, y, width, height)
            doc.addImage(leftLogo, 'PNG', 15, 10, 25, 25);
        } else {
            // Fallback if image fails
            doc.rect(15, 10, 25, 25); 
            doc.setFontSize(8).setTextColor(150, 150, 150).text("LOGO", 18, 23);
        }
        
        // Right Logo
        if (rightLogo) {
            doc.addImage(rightLogo, 'PNG', pageWidth - 40, 10, 25, 25);
        } else {
            // Fallback
            doc.rect(pageWidth - 40, 10, 25, 25);
            doc.text("LOGO", pageWidth - 36, 23);
        }

        // Main Title
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("BARANGAY SAN MIGUEL HEALTH CENTER", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("MATERNAL HEALTH RECORDS REPORT", pageWidth / 2, 28, { align: "center" });
        
        // Report Details
        doc.setFontSize(10);
        doc.text(`Report Period: ${name} ${year}`, 15, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 40, { align: "right" });
        
        // Generated By (BHW)
        if (currentUserProfile) {
            doc.text(`Generated By: ${currentUserProfile.first_name} ${currentUserProfile.last_name} (BHW)`, 15, 45);
        }

        doc.line(15, 50, pageWidth - 15, 50);

        let currentY = 60;

        // --- 1. MATERNAL SUMMARY (OVERVIEW SECTION) ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(142, 68, 173); // Purple
        doc.text("1. MATERNAL SUMMARY (OVERVIEW)", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const summary = data.summary;
        
        // Add spacing after section title
        currentY += 8;
        
        // Summary statistics in two columns
        const col1 = 15;
        const col2 = 90;
        
        doc.text(`Total Registered Mothers: ${summary.totalRegistered}`, col1, currentY);
        doc.text(`New Registrations: ${summary.newRegistrations}`, col1, currentY + 6);
        doc.text(`Active Mothers (with visits): ${summary.activeMothers}`, col1, currentY + 12);
        
        doc.text(`High-Risk Pregnancies: ${summary.highRiskPregnancies}`, col2, currentY);
        doc.text(`Low-Risk Pregnancies: ${summary.lowRiskPregnancies}`, col2, currentY + 6);
        doc.text(`Mothers with no recent visit: ${summary.mothersNoRecentVisit}`, col2, currentY + 12);

        currentY += 30; // Space after summary section

        // Check if we need a new page
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        // --- 2. NEW MATERNAL REGISTRATIONS ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185); // Blue
        doc.text("2. NEW MATERNAL REGISTRATIONS", 15, currentY);
        
        const newRegistrations = data.patients
            .filter(p => new Date(p.created_at) >= data.startDate && new Date(p.created_at) <= data.endDate)
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
                startY: currentY + 8, // Add spacing after title
                head: [['Patient ID', 'Full Name', 'Age', 'Address', 'Weeks', 'Risk Level', 'Reg. Date']],
                body: registrationRows,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
                columnStyles: {
                    0: { cellWidth: 25 }, // ID
                    1: { cellWidth: 35 }, // Name
                    2: { cellWidth: 15 }, // Age
                    3: { cellWidth: 30 }, // Address
                    4: { cellWidth: 20 }, // Weeks
                    5: { cellWidth: 25 }, // Risk Level
                    6: { cellWidth: 25 }  // Date
                }
            });
            currentY = doc.lastAutoTable.finalY + 15; // Add space after table
        } else {
            currentY += 8; // Space after title
            doc.setFontSize(10).setTextColor(150, 150, 150);
            doc.text("No new registrations for this period.", 20, currentY);
            currentY += 15;
        }

        // Check if we need a new page
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        // --- 3. MATERNAL VISIT / FOLLOW-UP ACTIVITY ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(39, 174, 96); // Green
        
        const recentVisits = data.patients
            .filter(p => p.last_visit && new Date(p.last_visit) >= data.startDate && new Date(p.last_visit) <= data.endDate)
            .sort((a, b) => new Date(b.last_visit) - new Date(a.last_visit));
        
        const visitRows = recentVisits.map(patient => [
            formatDate(patient.last_visit),
            `${patient.first_name} ${patient.last_name}`.substring(0, 25),
            patient.purok || '-',
            patient.risk_level || '-',
            patient.weeks ? `${patient.weeks} weeks` : '-'
        ]);

        
        // Check if we need a new page
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        // --- 4. HIGH-RISK PREGNANCY MONITORING ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(192, 57, 43); // Red
        doc.text("3. HIGH-RISK PREGNANCY MONITORING", 15, currentY);
        
        const highRiskPatients = data.patients
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
                startY: currentY + 8, // Add spacing after title
                head: [['Patient Name', 'Age', 'Weeks', 'Risk Level', 'Last Visit', 'Medical Notes']],
                body: highRiskRows,
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
                columnStyles: {
                    0: { cellWidth: 30 }, // Name
                    1: { cellWidth: 15 }, // Age
                    2: { cellWidth: 20 }, // Weeks
                    3: { cellWidth: 20 }, // Risk
                    4: { cellWidth: 25 }, // Last Visit
                    5: { cellWidth: 40 }  // Notes
                }
            });
            currentY = doc.lastAutoTable.finalY + 15; // Add space after table
        } else {
            currentY += 8; // Space after title
            doc.setFontSize(10).setTextColor(150, 150, 150);
            doc.text("No high-risk pregnancies recorded for this period.", 20, currentY);
            currentY += 15;
        }

        // Check if we need a new page
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        // --- 5. MISSED OR INACTIVE PATIENTS ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(230, 126, 34); // Orange
        doc.text("4. MISSED OR INACTIVE PATIENTS (60+ days)", 15, currentY);
        
        const inactiveRows = summary.mothersInactive60Days.map(patient => [
            `${patient.first_name} ${patient.last_name}`.substring(0, 25),
            formatDate(patient.last_visit),
            patient.contact_no || '-',
            `${patient.purok || ''} ${patient.street || ''}`.substring(0, 30)
        ]);

        if (inactiveRows.length > 0) {
            autoTable(doc, {
                startY: currentY + 8, // Add spacing after title
                head: [['Patient Name', 'Last Visit', 'Contact', 'Address']],
                body: inactiveRows,
                theme: 'grid',
                headStyles: { fillColor: [230, 126, 34] },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 },
                columnStyles: {
                    0: { cellWidth: 35 }, // Name
                    1: { cellWidth: 30 }, // Last Visit
                    2: { cellWidth: 30 }, // Contact
                    3: { cellWidth: 50 }  // Address
                }
            });
            currentY = doc.lastAutoTable.finalY + 15; // Add space after table
        } else {
            currentY += 8; // Space after title
            doc.setFontSize(10).setTextColor(150, 150, 150);
            doc.text("No inactive patients (60+ days) for this period.", 20, currentY);
            currentY += 15;
        }

        // Check if we need a new page
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        // --- 6. MATERNAL HEALTH NOTES ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(52, 152, 219); // Light Blue
        doc.text("5. MATERNAL HEALTH NOTES SUMMARY", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        // Collect all medical history notes
        let allMedicalNotes = [];
        data.patients.forEach(patient => {
            if (patient.medical_history) {
                const notes = extractMedicalNotes(patient.medical_history);
                if (notes) {
                    allMedicalNotes.push({
                        patient: `${patient.first_name} ${patient.last_name}`,
                        note: notes
                    });
                }
            }
        });

        currentY += 8; // Space after title
        
        if (allMedicalNotes.length > 0) {
            // Show only first 8 notes to save space
            const notesToShow = allMedicalNotes.slice(0, 8);
            notesToShow.forEach((item, index) => {
                if (currentY > pageHeight - 20) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(`• ${item.patient}:`, 20, currentY);
                // Wrap long notes
                const lines = doc.splitTextToSize(item.note, pageWidth - 40);
                lines.forEach((line, lineIndex) => {
                    if (currentY > pageHeight - 20) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(line, 25, currentY + 5 + (lineIndex * 5));
                });
                currentY += 10 + (lines.length * 5);
            });
            
            if (allMedicalNotes.length > 8) {
                doc.text(`... and ${allMedicalNotes.length - 8} more notes`, 20, currentY);
                currentY += 10;
            }
        } else {
            doc.text("No medical notes recorded for this period.", 20, currentY);
            currentY += 15;
        }

        // --- 7. SIGNATURES ---
        // Ensure we have enough space for signatures
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY += 10; // Add some space before signatures
        }
        
        doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("PREPARED BY (BHW):", 15, currentY);
        doc.line(15, currentY + 5, 70, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        if (currentUserProfile) {
            doc.text(`${currentUserProfile.first_name} ${currentUserProfile.last_name}`, 15, currentY + 10);
            doc.text(`Barangay Health Worker`, 15, currentY + 15);
        }
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, currentY + 20);

        doc.setFontSize(10).setFont(undefined, 'bold');
        doc.text("NOTED BY (MIDWIFE):", pageWidth/2, currentY);
        doc.line(pageWidth/2, currentY + 5, pageWidth/2 + 60, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        doc.text("___________________________", pageWidth/2, currentY + 10);
        doc.text("Signature over Printed Name", pageWidth/2, currentY + 15);
        doc.text("Date: _______________", pageWidth/2, currentY + 20);

        // --- FOOTER ---
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL - Barangay Health Center Internal Document", pageWidth/2, pageHeight - 10, { align: "center" });

        // Save the PDF
        const fileName = `Maternal_Health_Report_${name.replace(/ /g, '_')}_${year}.pdf`;
        doc.save(fileName);
        
        setIsGenerating(false);
        
        // Log activity
        await logActivity('Maternal Health Report Generated', 
            `Generated comprehensive maternal health report: ${name} ${year} with ${data.patients.length} patients`);
        
        addNotification(`Maternal health report "${fileName}" generated successfully.`, 'success');
    };

    // Generate inventory report PDF (existing code)
    const generateInventoryReport = async (reportItem) => {
        const { name, year, data } = reportItem;
        
        // Check if data exists
        if (!data.inventory || data.inventory.length === 0) {
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
        doc.setDrawColor(200);
        // Left Logo Placeholder
        if (leftLogo) {
            doc.addImage(leftLogo, 'PNG', 15, 10, 25, 25);
        } else {
            doc.rect(15, 10, 25, 25);
        }
        
        // 3. Add Right Logo
        if (rightLogo) {
            doc.addImage(rightLogo, 'PNG', pageWidth - 40, 10, 25, 25);
        } else {
            doc.rect(pageWidth - 40, 10, 25, 25);
        }

        // Main Title
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("BARANGAY SAN MIGUEL HEALTH CENTER", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("COMPREHENSIVE INVENTORY STATUS REPORT", pageWidth / 2, 28, { align: "center" });
        
        // Report Details
        doc.setFontSize(10);
        doc.text(`Report: ${name} ${year}`, 15, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 40, { align: "right" });
        
        // Generated By (from user profile)
        if (currentUserProfile) {
            doc.text(`Generated By: ${currentUserProfile.first_name} ${currentUserProfile.last_name} (BHW)`, 15, 45);
        }

        doc.line(15, 50, pageWidth - 15, 50);

        let currentY = 60;

        // --- 1. INVENTORY SUMMARY SECTION ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("1. INVENTORY SUMMARY", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const summary = data.summary;
        const summaryCol1 = 15;
        const summaryCol2 = 80;
        const summaryCol3 = 130;
        
        doc.text(`Total Items: ${summary.totalItems}`, summaryCol1, currentY + 10);
        doc.text(`Total Quantity: ${summary.totalQuantity} units`, summaryCol1, currentY + 16);
        
        doc.text(`Normal Stock: ${summary.normalCount}`, summaryCol2, currentY + 10);
        doc.text(`Low Stock: ${summary.lowCount}`, summaryCol2, currentY + 16);
        doc.text(`Critical Stock: ${summary.criticalCount}`, summaryCol2, currentY + 22);
        
        doc.text(`Expired Items: ${summary.expiredCount}`, summaryCol3, currentY + 10);
        doc.text(`Near Expiry (30 days): ${summary.nearExpiryCount}`, summaryCol3, currentY + 16);

        currentY += 35;

        // --- 2. DISTRIBUTION TABLES ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("2. DISTRIBUTION ANALYSIS", 15, currentY);
        
        // Category Distribution
        const catRows = Object.entries(summary.byCategory).map(([cat, count]) => [cat, count.toString()]);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Category', 'Number of Items']],
            body: catRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: 15 }
        });

        // Source Distribution
        const sourceRows = Object.entries(summary.bySource).map(([source, count]) => [source, count.toString()]);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Supply Source', 'Number of Items']],
            body: sourceRows,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] },
            margin: { left: 15 }
        });

        currentY = doc.lastAutoTable.finalY + 15;

        // --- 3. DETAILED INVENTORY LIST ---
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("3. DETAILED INVENTORY LIST", 15, currentY);
        
        const detailedRows = data.inventory.map(item => [
            item.item_name || '-',
            item.category || '-',
            item.sku || '-',
            item.batch_no || '-',
            `${item.quantity || 0} ${item.unit || ''}`,
            item.status || '-',
            item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-',
            item.supplier || '-',
            item.owner_role || '-'
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Item Name', 'Category', 'SKU', 'Batch No', 'Quantity', 'Status', 'Expiry Date', 'Supplier', 'Owner Role']],
            body: detailedRows,
            theme: 'grid',
            headStyles: { fillColor: [230, 126, 34] },
            styles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // --- 4. EXPIRY & BATCH MONITORING ---
        if (data.inventory.some(item => item.expiry_date)) {
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
            doc.text("4. EXPIRY & BATCH MONITORING", 15, currentY);
            
            const expiryRows = data.inventory
                .filter(item => item.expiry_date)
                .map(item => {
                    // Fix: Properly handle the expiry status calculation
                    let daysRemaining = 'N/A';
                    let status = 'No Expiry Date';
                    
                    if (item.expiry_date) {
                        const expiryDate = new Date(item.expiry_date);
                        const today = new Date();
                        const diffTime = expiryDate - today;
                        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (daysRemaining < 0) {
                            status = 'EXPIRED';
                        } else if (daysRemaining <= 30) {
                            // CHANGE THIS:
                            // status = 'Urgent (≤30 days)'; 
                            // TO THIS:
                            status = 'Urgent (<= 30 days)'; 
                        } else if (daysRemaining <= 60) {
                            // CHANGE THIS:
                            // status = 'Warning (≤60 days)';
                            // TO THIS:
                            status = 'Warning (<= 60 days)';
                        } else if (daysRemaining <= 90) {
                            // CHANGE THIS:
                            // status = 'Monitor (≤90 days)';
                            // TO THIS:
                            status = 'Monitor (<= 90 days)';
                        } else {
                            status = 'Safe (> 90 days)';
                        }
                    }
                    
                    return [
                        item.item_name || '-',
                        item.batch_no || '-',
                        item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-',
                        daysRemaining === 'N/A' ? 'N/A' : `${daysRemaining} days`,
                        status,
                        item.quantity || 0
                    ];
                })
                .sort((a, b) => {
                    // Sort by days remaining (expired first, then urgent, etc.)
                    const daysA = a[3] === 'N/A' ? Infinity : parseInt(a[3]);
                    const daysB = b[3] === 'N/A' ? Infinity : parseInt(b[3]);
                    return daysA - daysB;
                });

            if (expiryRows.length > 0) {
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Item Name', 'Batch No', 'Expiry Date', 'Days Remaining', 'Status', 'Qty']],
                    body: expiryRows,
                    theme: 'striped',
                    headStyles: { fillColor: [192, 57, 43] },
                    styles: { fontSize: 8 },
                    margin: { left: 15 },
                    columnStyles: {
                        0: { cellWidth: 40 }, // Item Name
                        1: { cellWidth: 25 }, // Batch No
                        2: { cellWidth: 25 }, // Expiry Date
                        3: { cellWidth: 25 }, // Days Remaining
                        4: { cellWidth: 35 }, // Status
                        5: { cellWidth: 15 }  // Qty
                    }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }
        }
        // --- 5. REMARKS & NOTES ---
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(41, 128, 185);
        doc.text("5. REMARKS & RECOMMENDATIONS", 15, currentY);
        doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(0, 0, 0);
        
        const remarks = [
            summary.criticalCount > 0 ? `• ${summary.criticalCount} items require immediate reorder (Critical stock)` : '',
            summary.lowCount > 0 ? `• ${summary.lowCount} items need replenishment (Low stock)` : '',
            summary.expiredCount > 0 ? `• ${summary.expiredCount} expired items require disposal` : '',
            summary.nearExpiryCount > 0 ? `• ${summary.nearExpiryCount} items nearing expiry (within 30 days)` : '',
            '• Regular inventory audit recommended',
            '• Update stock levels after distribution'
        ].filter(r => r !== '');

        if (remarks.length > 0) {
            remarks.forEach((remark, index) => {
                doc.text(remark, 20, currentY + 10 + (index * 5));
            });
        } else {
            doc.text("No urgent actions required. Inventory status is satisfactory.", 20, currentY + 10);
        }

        currentY += remarks.length * 5 + 20;

        // --- 6. SIGNATURES ---
        doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(0, 0, 0);
        doc.text("PREPARED BY:", 15, currentY);
        doc.line(15, currentY + 5, 70, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        if (currentUserProfile) {
            doc.text(`${currentUserProfile.first_name} ${currentUserProfile.last_name}`, 15, currentY + 10);
            doc.text(`Barangay Health Worker`, 15, currentY + 15);
        }
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, currentY + 20);

        doc.setFontSize(10).setFont(undefined, 'bold');
        doc.text("REVIEWED BY:", pageWidth/2, currentY);
        doc.line(pageWidth/2, currentY + 5, pageWidth/2 + 55, currentY + 5);
        doc.setFontSize(8).setFont(undefined, 'normal');
        doc.text("Midwife / Health Officer", pageWidth/2, currentY + 10);
        doc.text("Signature over Printed Name", pageWidth/2, currentY + 15);
        doc.text("Date: _______________", pageWidth/2, currentY + 20);

        // --- FOOTER ---
        doc.setFontSize(8).setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL - Barangay Health Center Internal Document", pageWidth/2, pageHeight - 10, { align: "center" });

        // Save the PDF
        const fileName = `Inventory_Report_${name.replace(/ /g, '_')}_${year}.pdf`;
        doc.save(fileName);
        
        setIsGenerating(false);
        
        // Log activity
        await logActivity('Inventory Report Generated', 
            `Generated comprehensive inventory report: ${name} ${year} with ${data.inventory.length} items`);
        
        addNotification(`Inventory report "${fileName}" generated successfully.`, 'success');
    };

    // Main generate report function
    const generateReport = async (reportItem) => {
        if (reportItem.type === 'inventory') {
            await generateInventoryReport(reportItem);
        } else {
            await generateMaternalReport(reportItem);
        }
    };

    // Generate report list based on filters
    const reportList = useMemo(() => {
        const list = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        
        // Determine start and end dates for each report period
        if (frequency === 'quarterly') {
            for (let q = 1; q <= 4; q++) {
                const months = getQuarterMonths(q);
                const startMonth = months[0];
                const endMonth = months[2];
                const startDate = new Date(currentYear, startMonth, 1);
                const endDate = new Date(currentYear, endMonth + 1, 0); // Last day of end month
                
                list.push({
                    id: `Q${q}_${reportType}`,
                    name: `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'} Quarter`,
                    year: currentYear,
                    type: reportType,
                    months: months,
                    startDate: startDate,
                    endDate: endDate
                });
            }
        } else {
            monthNames.forEach((mName, idx) => {
                const startDate = new Date(currentYear, idx, 1);
                const endDate = new Date(currentYear, idx + 1, 0); // Last day of month
                
                list.push({
                    id: `M${idx + 1}_${reportType}`,
                    name: mName,
                    year: currentYear,
                    type: reportType,
                    months: [idx],
                    startDate: startDate,
                    endDate: endDate
                });
            });
        }

        // Attach filtered data to each report
        return list.map(item => {
            let dataPackage = {};
            
            if (item.type === 'mother') {
                // Filter patient data for maternal reports
                const allMothers = allData.patients;
                const summary = calculateMaternalSummary(allMothers, item.startDate, item.endDate);
                dataPackage = { 
                    patients: allMothers,
                    summary: summary,
                    startDate: item.startDate,
                    endDate: item.endDate
                };
            } else {
                // Filter inventory data with additional filters
                let filteredInv = allData.inventory.filter(i => {
                    const d = new Date(i.updated_at || i.created_at);
                    const monthMatch = item.months.includes(d.getMonth());
                    const yearMatch = d.getFullYear() === currentYear;
                    
                    // Apply additional filters
                    const categoryMatch = filterCategory === 'All' || i.category === filterCategory;
                    const statusMatch = filterStatus === 'All' || 
                                       (i.status && i.status.toLowerCase() === filterStatus.toLowerCase());
                    const ownerMatch = filterOwnerRole === 'All' || i.owner_role === filterOwnerRole;
                    
                    return monthMatch && yearMatch && categoryMatch && statusMatch && ownerMatch;
                });

                // Calculate summary for this filtered data
                const summary = calculateInventorySummary(filteredInv);
                dataPackage = { 
                    inventory: filteredInv,
                    summary: summary
                };
            }

            // Calculate "size" for display
            let size = '0 Items';
            if (item.type === 'mother') {
                size = `${dataPackage.patients?.length || 0} Mothers`;
            } else {
                size = `${dataPackage.inventory?.length || 0} Items`;
            }

            return { 
                ...item, 
                data: dataPackage, 
                size: size
            };
        });
    }, [allData, currentYear, frequency, reportType, filterCategory, filterStatus, filterOwnerRole]);

    const filteredReports = useMemo(() => {
        if (!searchTerm) return reportList;
        return reportList.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, reportList]);

    // Get unique categories, statuses, and owner roles for inventory filters
    const uniqueCategories = useMemo(() => {
        const categories = [...new Set(allData.inventory.map(item => item.category).filter(Boolean))];
        return ['All', ...categories.sort()];
    }, [allData.inventory]);

    const uniqueStatuses = useMemo(() => {
        const statuses = [...new Set(allData.inventory.map(item => item.status).filter(Boolean))];
        return ['All', ...statuses.sort()];
    }, [allData.inventory]);

    // Get maternal summary for sidebar
    const maternalSummary = useMemo(() => {
        return calculateMaternalSummary(
            allData.patients,
            new Date(currentYear, 0, 1),
            new Date(currentYear, 11, 31)
        );
    }, [allData.patients, currentYear]);

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
                            <h2 className="text-2xl font-bold text-gray-800">
                                BHW Reports Dashboard
                            </h2>
                            
                            {/* Year Selector */}
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
                                    onClick={() => setReportType('mother')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportType === 'mother' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Maternal Health Reports
                                </button>
                                <button 
                                    onClick={() => setReportType('inventory')} 
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportType === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Inventory Reports
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

                        {/* Additional Filters for Inventory Reports */}
                        {reportType === 'inventory' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border">
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
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Filter by Owner
                                        <span className="text-green-600 ml-1">(BHW Only)</span>
                                    </label>
                                    <select 
                                        value={filterOwnerRole}
                                        onChange={(e) => setFilterOwnerRole(e.target.value)}
                                        className="w-full text-sm border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                                        disabled={true}
                                    >
                                        <option value="BHW">BHW</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Locked to BHW role
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="relative w-full">
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

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['Report Name', 'Period', 'Type', 'Data Volume', 'Actions'].map(h => (
                                        <th key={h} className="p-3 font-semibold">{h}</th>
                                    ))}
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
                                                      'bg-purple-100 text-purple-800'}`}>
                                                    {report.type === 'inventory' ? 'Inventory' : 'Maternal Health'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-semibold">{report.size}</span>
                                                {report.type === 'mother' && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({report.data.summary.highRiskPregnancies} high-risk)
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
                                    {reportType === 'mother' ? 'Maternal Health' : 'Inventory'}
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
                            {reportType === 'inventory' && (
                                <div className="border-t pt-3 mt-3 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category Filter:</span>
                                        <span className="font-semibold">{filterCategory}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status Filter:</span>
                                        <span className="font-semibold">{filterStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Owner Filter:</span>
                                        <span className="font-semibold">
                                            {filterOwnerRole}
                                            <span className="text-green-600 ml-1">(Locked)</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Maternal Health Snapshot */}
                    {reportType === 'mother' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                            <h3 className="font-bold text-gray-700 mb-3">Maternal Health Snapshot</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Mothers:</span>
                                    <span className="font-semibold">{maternalSummary.totalRegistered}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">High-Risk:</span>
                                    <span className="font-semibold text-red-600">
                                        {maternalSummary.highRiskPregnancies}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Low-Risk:</span>
                                    <span className="font-semibold text-green-600">
                                        {maternalSummary.lowRiskPregnancies}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Needs Follow-up:</span>
                                    <span className="font-semibold text-orange-600">
                                        {maternalSummary.mothersNoRecentVisit}
                                    </span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Active (30 days):</span>
                                        <span className="font-semibold">{maternalSummary.activeMothers}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overall System Statistics */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-3">BHW System Overview</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Patients:</span>
                                <span className="font-semibold">{allData.patients.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Inventory Items:</span>
                                <span className="font-semibold">{allData.inventory.length}</span>
                            </div>
                            <div className="pt-2 border-t text-xs text-gray-500">
                                <p>Last updated: {new Date().toLocaleDateString()}</p>
                                <p>User: {currentUserProfile?.first_name} {currentUserProfile?.last_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
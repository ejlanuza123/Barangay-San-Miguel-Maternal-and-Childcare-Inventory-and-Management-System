import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import leftLogo from '../../assets/leftLogo.png';
import rightLogo from '../../assets/rightLogo.png';

// Icons - Updated with more modern ones
const AlertIcon = () => (
  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative">
      <div className="w-12 h-12 rounded-full absolute border-4 border-transparent border-t-blue-500 animate-spin"></div>
      <div className="w-12 h-12 rounded-full absolute border-4 border-transparent border-t-red-500 animate-spin" style={{ animationDelay: '0.1s' }}></div>
    </div>
  </div>
);

const IssuanceFormModal = ({ selectedItems, onClose, onComplete }) => {
    const { profile } = useAuth();
    const [entityName, setEntityName] = useState('');
    const [fundCluster, setFundCluster] = useState('');
    const [division, setDivision] = useState('City Health Office');
    const [rcc, setRcc] = useState('');
    const [risNo, setRisNo] = useState('');
    const [purpose, setPurpose] = useState('');
    
    const [quantities, setQuantities] = useState(
        selectedItems.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
    );

    const handleQuantityChange = (id, val) => {
        const numVal = parseInt(val) || 0;
        setQuantities(prev => ({ 
            ...prev, 
            [id]: Math.max(1, numVal) // Ensures minimum of 1
        }));
    };

    const handleGenerate = () => {
        // PDF generation code remains exactly the same
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- 1. HEADER ---
        doc.addImage(leftLogo, 'PNG', 15, 10, 20, 20); 
        doc.addImage(rightLogo, 'PNG', 175, 10, 20, 20);
        
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text("Republic of the Philippines", pageWidth / 2, 15, { align: "center" });
        doc.text("City of Puerto Princesa", pageWidth / 2, 20, { align: "center" });
        
        doc.setFont("times", "bold");
        doc.text("OFFICE OF THE CITY HEALTH OFFICER", pageWidth / 2, 25, { align: "center" });
        
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text("Brgy. Sta. Monica, Puerto Princesa City", pageWidth / 2, 30, { align: "center" });

        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("REQUEST AND ISSUANCE SLIP", pageWidth / 2, 45, { align: "center" });

        // --- 2. METADATA ROW ---
        autoTable(doc, {
            startY: 50,
            theme: 'plain',
            body: [
                [`Entity Name: ${entityName}`, `Fund Cluster: ${fundCluster}`]
            ],
            styles: { font: "times", fontSize: 10, cellPadding: 1 },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 'auto' }
            }
        });

        // --- 3. MAIN TABLE ---
        const tableBody = selectedItems.map((item, index) => [
            item.sku || '',
            item.unit || 'pc',
            item.item_name,
            quantities[item.id] || 0,
            item.quantity > 0 ? 'Yes' : 'No',
            ' ',
            ' ',
        ]);

        while (tableBody.length < 15) {
            tableBody.push(['', '', '', '', '', '', '']);
        }

        tableBody.push([{ content: `Purpose: ${purpose}`, colSpan: 7, styles: { fontStyle: 'bold', halign: 'left' } }]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 2,
            head: [
                [
                    { content: `Division: ${division}`, colSpan: 5, styles: { halign: 'left' } },
                    { content: `RIS No.: ${risNo}`, colSpan: 2, styles: { halign: 'left' } }
                ],
                [
                    { content: 'Requisition', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'Issuance', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }
                ],
                ['Stock No.', 'Unit', 'Description', 'Quantity', 'Stock Avail?', 'Quantity', 'Remarks']
            ],
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 255, 255], 
                textColor: [0, 0, 0], 
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                font: "times",
                fontSize: 10
            },
            styles: { 
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                font: "times",
                fontSize: 10,
                textColor: [0, 0, 0],
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 'auto', halign: 'left' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 20, halign: 'center' },
                6: { cellWidth: 30, halign: 'center' }
            }
        });

        // --- 4. SIGNATURE BLOCK ---
        const sigY = doc.lastAutoTable.finalY;
        
        autoTable(doc, {
            startY: sigY,
            theme: 'grid',
            body: [
                [
                    { content: '', styles: { cellWidth: 25, border: { left: 1, bottom: 0, top: 0 } } },
                    { content: 'Requested by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Approved by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Issued by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Received by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } }
                ],
                [
                    { content: 'Signature', styles: { fontStyle: 'normal' } },
                    { content: ' ', styles: { minCellHeight: 15 } },
                    { content: ' ', styles: { minCellHeight: 15 } },
                    { content: ' ', styles: { minCellHeight: 15 } },
                    { content: ' ', styles: { minCellHeight: 15 } }
                ],
                [
                    { content: 'Printed Name', styles: { fontStyle: 'normal' } },
                    { content: profile ? `${profile.first_name} ${profile.last_name}`.toUpperCase() : 'MIDWIFE NAME', styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'RICARDO P. PANGANIBAN, M.D.', styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'SUPPLY OFFICER', styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: ' ', styles: { halign: 'center' } }
                ],
                [
                    { content: 'Designation', styles: { fontStyle: 'normal' } },
                    { content: 'Midwife', styles: { halign: 'center' } },
                    { content: 'City Health Officer', styles: { halign: 'center' } },
                    { content: '', styles: { halign: 'center' } },
                    { content: 'Date:', styles: { halign: 'left' } }
                ],
                [
                    { content: 'Date', styles: { fontStyle: 'normal' } },
                    { content: new Date().toLocaleDateString(), styles: { halign: 'center' } },
                    { content: ' ', styles: { halign: 'center' } },
                    { content: ' ', styles: { halign: 'center' } },
                    { content: ' ', styles: { halign: 'center' } }
                ]
            ],
            styles: { 
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                font: "times",
                fontSize: 9,
                textColor: [0, 0, 0],
                cellPadding: 1
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 40 },
                3: { cellWidth: 40 },
                4: { cellWidth: 'auto' }
            }
        });

        doc.save(`RIS_${risNo || 'Draft'}_${new Date().toISOString().slice(0,10)}.pdf`);
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm">
            <motion.div 
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-white">Generate Request & Issuance Slip</h3>
                            <p className="text-blue-100 text-sm mt-1">Complete the form below to generate RIS</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Entity Name</label>
                            <input 
                                type="text" 
                                value={entityName} 
                                onChange={(e) => setEntityName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Fund Cluster</label>
                            <input 
                                type="text" 
                                value={fundCluster} 
                                onChange={(e) => setFundCluster(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter fund cluster"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Division</label>
                            <input 
                                type="text" 
                                value={division} 
                                onChange={(e) => setDivision(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="e.g. Nursing Services"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">RIS Number</label>
                            <input 
                                type="text" 
                                value={risNo} 
                                onChange={(e) => setRisNo(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-blue-50"
                                placeholder="e.g. 2024-001"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-800">Selected Items ({selectedItems.length})</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Scroll to view all</span>
                        </div>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                            <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr className="border-b">
                                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                            <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Unit</th>
                                            <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Stock</th>
                                            <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Qty Req.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedItems.map(item => (
                                            <motion.tr 
                                                key={item.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-blue-50/50 transition-colors"
                                            >
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-900">{item.item_name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{item.sku || 'No SKU'}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                                                        {item.unit || 'pc'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {item.quantity > 0 ? 'Available' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={quantities[item.id]} 
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-2 text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Purpose of Request</label>
                        <textarea 
                            rows="3" 
                            value={purpose} 
                            onChange={(e) => setPurpose(e.target.value)} 
                            className="w-full border border-gray-300 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            placeholder="Describe the purpose of this request... (e.g. For replenishment of BHW kits, monthly supplies, emergency response, etc.)"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{selectedItems.length} items selected</span>
                            <span className="mx-2">•</span>
                            <span>RIS No: <span className="font-mono font-bold">{risNo || 'Not set'}</span></span>
                        </div>
                        <div className="flex gap-3">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Cancel
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerate}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center gap-2"
                            >
                                <PrintIcon /> Generate RIS PDF
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default function ItemIssuancePage() {
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { addNotification } = useNotification();

    const fetchLowStock = useCallback(async () => {
        setLoading(true);
        const [bhwRes, bnsRes] = await Promise.all([
            supabase.from('inventory').select('*').or('status.eq.Low,status.eq.Critical'),
            supabase.from('bns_inventory').select('*').or('status.eq.Low,status.eq.Critical')
        ]);

        const combined = [
            ...(bhwRes.data || []).map(i => ({ ...i, source: 'BHW' })),
            ...(bnsRes.data || []).map(i => ({ ...i, source: 'BNS' }))
        ];

        setLowStockItems(combined);
        setLoading(false);
    }, []);

    useEffect(() => { 
        fetchLowStock(); 
    }, [fetchLowStock]);

    const handleCheckbox = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedItems(prev => 
            prev.length === lowStockItems.length 
                ? [] 
                : lowStockItems.map(i => i.id)
        );
    };

    const getSelectedObjects = () => lowStockItems.filter(i => selectedItems.includes(i.id));

    return (
        <>
            <AnimatePresence>
                {showForm && (
                    <IssuanceFormModal 
                        selectedItems={getSelectedObjects()} 
                        onClose={() => setShowForm(false)} 
                        onComplete={() => {
                            setShowForm(false);
                            addNotification("RIS generated successfully!", "success");
                            setSelectedItems([]);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-xl p-8 text-white mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <AlertIcon />
                                        </div>
                                        Low Stock Alert System
                                    </h1>
                                    <p className="text-red-100 text-lg opacity-90">
                                        Monitor inventory levels and generate Request & Issuance Slips (RIS) for items below reorder point
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                        <div className="text-2xl font-bold">{lowStockItems.length}</div>
                                        <div className="text-sm opacity-80">Critical Items</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="text-sm text-gray-500 mb-1">Selected Items</div>
                                <div className="text-2xl font-bold text-blue-600">{selectedItems.length}</div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="text-sm text-gray-500 mb-1">Critical Status</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {lowStockItems.filter(i => i.status === 'Critical').length}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="text-sm text-gray-500 mb-1">Low Status</div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {lowStockItems.filter(i => i.status === 'Low').length}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="text-sm text-gray-500 mb-1">Out of Stock</div>
                                <div className="text-2xl font-bold text-gray-700">
                                    {lowStockItems.filter(i => i.quantity === 0).length}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        {/* Table Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll} 
                                        checked={lowStockItems.length > 0 && selectedItems.length === lowStockItems.length}
                                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer transition-all"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        {selectedItems.length} of {lowStockItems.length} items selected
                                    </span>
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowForm(true)} 
                                    disabled={selectedItems.length === 0}
                                    className={`
                                        relative px-6 py-3 rounded-xl font-bold shadow-lg transition-all
                                        ${selectedItems.length > 0 
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' 
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <PrintIcon />
                                        Generate RIS
                                        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-md text-sm">
                                            {selectedItems.length}
                                        </span>
                                    </div>
                                </motion.button>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12"></th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU Code</th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Details</th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Availability</th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch No.</th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8">
                                                <LoadingSpinner />
                                            </td>
                                        </tr>
                                    ) : lowStockItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center">
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="inline-block p-8"
                                                >
                                                    <div className="text-green-500 mb-4">
                                                        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-700 mb-2">All Clear! 🎉</div>
                                                    <div className="text-gray-500 max-w-md mx-auto">
                                                        All inventory items are currently at healthy stock levels. No reordering needed at this time.
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    ) : (
                                        lowStockItems.map((item, index) => (
                                            <motion.tr 
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`
                                                    hover:bg-red-50/50 transition-all duration-200 cursor-pointer
                                                    ${selectedItems.includes(item.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                                                `}
                                                onClick={() => handleCheckbox(item.id)}
                                            >
                                                <td className="p-4">
                                                    <div className="relative">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedItems.includes(item.id)} 
                                                            onChange={(e) => { e.stopPropagation(); handleCheckbox(item.id); }} 
                                                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer transition-all"
                                                        />
                                                        {selectedItems.includes(item.id) && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <CheckIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg inline-block">
                                                        {item.sku || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900">{item.item_name}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">Source: {item.source}</span>
                                                        <span>{item.category || 'Uncategorized'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {item.quantity} 
                                                        <span className="text-sm text-gray-500 ml-1">{item.unit || 'pc'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`
                                                        inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                                                        ${item.quantity > 0 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                        }
                                                    `}>
                                                        {item.quantity > 0 ? (
                                                            <>
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                Available
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                                Out of Stock
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-gray-600 font-mono">
                                                        {item.batch_no || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`
                                                        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold
                                                        ${item.status === 'Critical' 
                                                            ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200' 
                                                            : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200'
                                                        }
                                                    `}>
                                                        {item.status === 'Critical' ? (
                                                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <div>
                                    Showing <span className="font-semibold">{lowStockItems.length}</span> low stock items
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <span>Critical</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                                        <span>Low</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
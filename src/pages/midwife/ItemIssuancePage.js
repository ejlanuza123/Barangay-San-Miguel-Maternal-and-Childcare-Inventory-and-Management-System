import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import leftLogo from '../../assets/leftLogo.png'; // Add your actual logo paths
import rightLogo from '../../assets/rightLogo.png'; 

// Icons
const AlertIcon = () => <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const PrintIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>;

const IssuanceFormModal = ({ selectedItems, onClose, onComplete }) => {
    const { profile } = useAuth();
    const [entityName, setEntityName] = useState('City Health Office');
    const [fundCluster, setFundCluster] = useState('');
    const [division, setDivision] = useState('');
    const [rcc, setRcc] = useState('');
    const [risNo, setRisNo] = useState('');
    const [purpose, setPurpose] = useState('');
    
    const [quantities, setQuantities] = useState(
        selectedItems.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
    );

    const handleQuantityChange = (id, val) => {
        setQuantities(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
    };

    const handleGenerate = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- 1. HEADER (Exact Layout) ---
        // Placeholder for Logos (Uncomment and set correct path/base64)
        doc.addImage(leftLogo, 'PNG', 15, 10, 20, 20); 
        doc.addImage(rightLogo, 'PNG', 175, 10, 20, 20);
        
        // Add "Logo Here" text placeholders if images are missing
        doc.setFontSize(8).text("", 15, 20);
        doc.text("", 175, 20);

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text("Republic of the Philippines", pageWidth / 2, 15, { align: "center" });
        doc.text("City of Puerto Princesa", pageWidth / 2, 20, { align: "center" });
        
        doc.setFont("times", "bold");
        doc.text("OFFICE OF THE CITY HEALTH OFFICER", pageWidth / 2, 25, { align: "center" });
        
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text("Brgy. Sta. Monica, Puerto Princesa City", pageWidth / 2, 30, { align: "center" });

        // Title
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("REQUEST AND ISSUANCE SLIP", pageWidth / 2, 45, { align: "center" });

        // --- 2. METADATA ROW ---
        // Using autoTable for precise alignment of the top form fields
        autoTable(doc, {
            startY: 50,
            theme: 'plain',
            body: [
                [`Entity Name: ${entityName}`, `Fund Cluster: ${fundCluster}`]
            ],
            styles: { font: "times", fontSize: 10, cellPadding: 1 },
            columnStyles: {
                0: { cellWidth: 120 }, // Wider for Entity Name
                1: { cellWidth: 'auto' }
            }
        });

        // --- 3. MAIN TABLE ---
        // Prepare Data Rows
        const tableBody = selectedItems.map((item, index) => [
            item.sku || '',             // Stock No.
            item.unit || 'pc',          // Unit
            item.item_name,             // Description
            quantities[item.id] || 0,   // Quantity (Requisition)
            item.quantity > 0 ? 'Yes' : 'No', // Stock Available? (Yes/No) <--- ADDED
            ' ',                        // Quantity (Issuance - Blank for manual)
            ' ',                        // Remarks (Issuance - Blank for manual)
        ]);

        // Fill empty rows to make the table look substantial (like the form)
        while (tableBody.length < 15) {
            tableBody.push(['', '', '', '', '', '', '']);
        }

        // Add Purpose Row at the bottom of data
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
                0: { cellWidth: 20, halign: 'center' }, // Stock No
                1: { cellWidth: 15, halign: 'center' }, // Unit
                2: { cellWidth: 'auto', halign: 'left' }, // Description
                3: { cellWidth: 20, halign: 'center' }, // Qty Req
                4: { cellWidth: 20, halign: 'center' }, // Stock Avail
                5: { cellWidth: 20, halign: 'center' }, // Qty Issued
                6: { cellWidth: 30, halign: 'center' }  // Remarks
            }
        });

        // --- 4. SIGNATURE BLOCK (Exact 4-Column Layout) ---
        const sigY = doc.lastAutoTable.finalY; // Attach directly to bottom of table
        
        // We use autoTable again to create the perfect signature grid
        autoTable(doc, {
            startY: sigY,
            theme: 'grid',
            body: [
                [
                    { content: '', styles: { cellWidth: 25, border: { left: 1, bottom: 0, top: 0 } } }, // Empty label col
                    { content: 'Requested by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Approved by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Issued by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } },
                    { content: 'Received by:', styles: { fontStyle: 'bold', border: { bottom: 0, top: 0, right: 1 } } }
                ],
                [
                    { content: 'Signature', styles: { fontStyle: 'normal' } },
                    { content: ' ', styles: { minCellHeight: 15 } }, // Space for sig
                    { content: ' ', styles: { minCellHeight: 15 } },
                    { content: ' ', styles: { minCellHeight: 15 } },
                    { content: ' ', styles: { minCellHeight: 15 } }
                ],
                [
                    { content: 'Printed Name', styles: { fontStyle: 'normal' } },
                    { content: profile ? `${profile.first_name} ${profile.last_name}`.toUpperCase() : 'MIDWIFE NAME', styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'RICARDO P. PANGANIBAN, M.D.', styles: { halign: 'center', fontStyle: 'bold' } }, // Example name
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

        // Save
        doc.save(`RIS_${risNo || 'Draft'}_${new Date().toISOString().slice(0,10)}.pdf`);
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Generate Request & Issuance Slip (RIS)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Entity Name</label>
                        <input type="text" value={entityName} onChange={(e) => setEntityName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Fund Cluster</label>
                        <input type="text" value={fundCluster} onChange={(e) => setFundCluster(e.target.value)} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Division</label>
                        <input type="text" value={division} onChange={(e) => setDivision(e.target.value)} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Nursing Services" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">RIS No.</label>
                        <input type="text" value={risNo} onChange={(e) => setRisNo(e.target.value)} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. 2024-001" />
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Requisition Items</h4>
                    <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b sticky top-0">
                                <tr>
                                    <th className="p-2">Description</th>
                                    <th className="p-2 w-24 text-center">Unit</th>
                                    <th className="p-2 w-24 text-center">Stock Avail?</th>
                                    <th className="p-2 w-24 text-center">Qty Req.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2">
                                            <div className="font-medium">{item.item_name}</div>
                                            <div className="text-xs text-gray-500">{item.sku ? `SKU: ${item.sku}` : ''}</div>
                                        </td>
                                        <td className="p-2 text-center text-gray-500">{item.unit || 'pc'}</td>
                                        <td className="p-2 text-center text-gray-500">
                                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.quantity > 0 ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={quantities[item.id]} 
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                className="w-16 border rounded p-1 text-center font-bold text-blue-600"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Purpose</label>
                    <textarea 
                        rows="2" 
                        value={purpose} 
                        onChange={(e) => setPurpose(e.target.value)} 
                        className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. For replenishment of BHW kits..."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
                    <button onClick={handleGenerate} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                        <PrintIcon /> Generate PDF
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function ItemIssuancePage() {
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]); // Array of IDs
    const [showForm, setShowForm] = useState(false);
    const { addNotification } = useNotification();

    const fetchLowStock = useCallback(async () => {
        setLoading(true);
        // Fetch both inventories
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

    useEffect(() => { fetchLowStock(); }, [fetchLowStock]);

    const handleCheckbox = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(prev => prev.filter(i => i !== id));
        } else {
            setSelectedItems(prev => [...prev, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === lowStockItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(lowStockItems.map(i => i.id));
        }
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
                            addNotification("RIS generated successfully.", "success");
                            setSelectedItems([]);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <AlertIcon /> Low Stock Alert & Issuance
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Review critical inventory and generate the official RIS form.</p>
                        </div>
                        <button 
                            onClick={() => setShowForm(true)} 
                            disabled={selectedItems.length === 0}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            <PrintIcon /> Generate RIS ({selectedItems.length})
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-red-50 text-red-800 uppercase font-semibold">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input type="checkbox" onChange={handleSelectAll} checked={lowStockItems.length > 0 && selectedItems.length === lowStockItems.length} className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                                    </th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4">Current Stock</th>
                                    <th className="p-4">Stock Available?</th>
                                    <th className="p-4">Batch No.</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">Scanning inventory...</td></tr>
                                ) : lowStockItems.length === 0 ? (
                                    <tr><td colSpan="7" className="p-12 text-center">
                                        <div className="text-green-600 font-bold text-lg mb-1">All Clear!</div>
                                        <div className="text-gray-500">No items are currently below the reorder point.</div>
                                    </td></tr>
                                ) : (
                                    lowStockItems.map(item => (
                                        <tr key={item.id} className="hover:bg-red-50 transition-colors cursor-pointer" onClick={() => handleCheckbox(item.id)}>
                                            <td className="p-4">
                                                <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={(e) => { e.stopPropagation(); handleCheckbox(item.id); }} className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                                            </td>
                                            <td className="p-4 text-xs font-mono text-gray-500">{item.sku || '-'}</td>
                                            <td className="p-4 font-semibold text-gray-800">{item.item_name}</td>
                                            <td className="p-4 text-red-600 font-bold">{item.quantity} {item.unit}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.quantity > 0 ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">{item.batch_no || 'N/A'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
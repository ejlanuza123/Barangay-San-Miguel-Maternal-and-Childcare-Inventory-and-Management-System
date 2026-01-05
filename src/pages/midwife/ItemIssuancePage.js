import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

// Icons
const AlertIcon = () => <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const PrintIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>;

const IssuanceFormModal = ({ selectedItems, onClose, onComplete }) => {
    const { profile } = useAuth();
    const [purpose, setPurpose] = useState('');
    const [requestingEntity, setRequestingEntity] = useState('Barangay Health Center');

    const handleGenerate = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(14).setFont(undefined, 'bold').text("REQUEST FOR SUPPLIES ISSUANCE", 105, 20, { align: "center" });
        doc.setFontSize(10).setFont(undefined, 'normal');
        
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
        doc.text(`Requesting Entity: ${requestingEntity}`, 15, 42);
        doc.text(`Requested By: ${profile.first_name} ${profile.last_name} (Midwife)`, 15, 49);
        doc.text(`Purpose: ${purpose}`, 15, 56);

        const tableBody = selectedItems.map(item => [
            item.item_name,
            item.category,
            `${item.quantity} ${item.unit || 'units'}`,
            item.status,
            item.source // BHW or BNS
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Item Name', 'Category', 'Current Stock', 'Status', 'Inventory Source']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [200, 0, 0] }, // Red header for urgency
        });

        doc.setFontSize(10).text("Prepared by:", 15, doc.lastAutoTable.finalY + 20);
        doc.text("__________________________", 15, doc.lastAutoTable.finalY + 35);
        doc.text(`${profile.first_name} ${profile.last_name}`, 15, doc.lastAutoTable.finalY + 42);
        doc.text("Midwife", 15, doc.lastAutoTable.finalY + 47);

        doc.text("Approved by:", 120, doc.lastAutoTable.finalY + 20);
        doc.text("__________________________", 120, doc.lastAutoTable.finalY + 35);
        doc.text("City Health Officer / Admin", 120, doc.lastAutoTable.finalY + 42);

        doc.save(`Issuance_Request_${new Date().toISOString().slice(0,10)}.pdf`);
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Create Issuance Request</h3>
                <p className="text-sm text-gray-500 mb-4">You are generating a request for {selectedItems.length} low-stock items.</p>
                
                <div className="space-y-3 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Requesting Entity</label>
                        <input type="text" value={requestingEntity} onChange={(e) => setRequestingEntity(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Purpose / Remarks</label>
                        <textarea rows="3" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Monthly replenishment..." className="w-full border rounded p-2 text-sm"></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm font-semibold">Cancel</button>
                    <button onClick={handleGenerate} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700">Generate PDF</button>
                </div>
            </div>
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
            ...(bhwRes.data || []).map(i => ({ ...i, source: 'BHW (Maternity)' })),
            ...(bnsRes.data || []).map(i => ({ ...i, source: 'BNS (Child)' }))
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
                            addNotification("Request generated successfully.", "success");
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
                            <p className="text-gray-500 text-sm mt-1">Review critical inventory and generate replenishment requests.</p>
                        </div>
                        <button 
                            onClick={() => setShowForm(true)} 
                            disabled={selectedItems.length === 0}
                            className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <PrintIcon /> Process Selected ({selectedItems.length})
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-red-50 text-red-800 uppercase font-semibold">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input type="checkbox" onChange={handleSelectAll} checked={lowStockItems.length > 0 && selectedItems.length === lowStockItems.length} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                    </th>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4">Current Stock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Source</th>
                                    <th className="p-4">Expiry</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Scanning inventory...</td></tr>
                                ) : lowStockItems.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-green-600 font-medium">All inventory levels are normal. No issuance needed.</td></tr>
                                ) : (
                                    lowStockItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleCheckbox(item.id)} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                            </td>
                                            <td className="p-4 font-semibold text-gray-800">{item.item_name}</td>
                                            <td className="p-4 text-red-600 font-bold">{item.quantity} {item.unit}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{item.source}</td>
                                            <td className="p-4">{item.expiration_date || 'N/A'}</td>
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
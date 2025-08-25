import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import AddInventoryModal from '../../pages/bhw/AddInventoryModal';
import { AnimatePresence } from 'framer-motion';

// --- ICONS ---
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;
const DotsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;


// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const styles = {
        normal: 'bg-green-100 text-green-700',
        low: 'bg-yellow-100 text-yellow-700',
        critical: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend of Stock</h3>
        <div className="space-y-2 text-sm">
            {/* UPDATED: Changed checkbox to a colored div to match the badge styles */}
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-green-300 border border-green-400"></div>
                <span className="text-gray-600">Normal</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-yellow-300 border border-yellow-400"></div>
                <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2 bg-red-300 border border-red-400"></div>
                <span className="text-gray-600">Critical</span>
            </div>
        </div>
    </div>
);


export default function InventoryPage() {
    const [allInventory, setAllInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // --- ADDED: State for search and filter ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
    });

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
        if (error) console.error("Error fetching inventory:", error);
        else setAllInventory(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // --- ADDED: Logic to filter inventory for display ---
    const filteredInventory = useMemo(() => {
        return allInventory
            .filter(item => {
                // Filter by category
                if (filters.category === 'All') return true;
                return item.category === filters.category;
            })
            .filter(item => {
                // Filter by search term (case-insensitive)
                if (!searchTerm) return true;
                return item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allInventory, searchTerm, filters]);

    return (
        <>
            <AnimatePresence>
                {isModalOpen && <AddInventoryModal onClose={() => setIsModalOpen(false)} onSave={fetchInventory} />}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <div className="relative w-full md:w-auto flex-grow">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input
                                type="text"
                                placeholder="Search Items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 form-input rounded-md border-gray-300 shadow-sm text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><FilterIcon /> Filter</button>
                                {isFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                        <div className="p-2 text-sm font-semibold border-b">Filter by Category</div>
                                        <div className="p-2">
                                            {['All', 'Medicines', 'Equipment', 'Supplies'].map(cat => (
                                                 <label key={cat} className="flex items-center space-x-2 text-sm">
                                                    <input type="radio" name="category" value={cat} checked={filters.category === cat} onChange={(e) => setFilters({...filters, category: e.target.value})} />
                                                    <span>{cat}</span>
                                                 </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    {['Item Name', 'Category', 'Stock', 'Status', 'Expiry Date', 'Actions'].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading && ( <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr> )}
                                {!loading && filteredInventory.map(item => (
                                    <tr key={item.id} className="text-gray-700">
                                        <td className="p-3 font-semibold">{item.item_name}</td>
                                        <td className="p-3">{item.category}</td>
                                        <td className="p-3">{item.quantity} units</td>
                                        <td className="p-3"><StatusBadge status={item.status.toLowerCase()} /></td>
                                        <td className="p-3">{item.expiry_date || '---'}</td>
                                        <td className="p-3"><button className="text-gray-400 hover:text-gray-600"><DotsIcon/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <button onClick={() => setIsModalOpen(true)} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm">+ Add New Item</button>
                    <StatusLegend />
                </div>
            </div>
        </>
    );
}
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; // Library for Excel export

// --- ICONS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"></path></svg>;
const ExportIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;

// --- HELPER & WIDGET COMPONENTS ---

// This new component renders the special quantity cell with the progress bar
const QuantityCell = ({ quantity, status }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'Critical':
                return { label: 'Critical', color: 'bg-red-500', width: Math.min(quantity, 100) };
            case 'Low':
                return { label: 'Low', color: 'bg-yellow-400', width: Math.min(quantity, 100) };
            case 'Normal':
                return { label: 'Normal', color: 'bg-green-500', width: Math.min(quantity, 100) };
            default:
                return { label: status, color: 'bg-gray-400', width: Math.min(quantity, 100) };
        }
    };

    const { label, color, width } = getStatusInfo();

    return (
        // --- MODIFIED: Font size reduced to make cell more compact ---
        <div className="text-xs">
            <p className="font-semibold">{quantity} unit - <span className="font-bold">{label}</span></p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${width}%` }}></div>
            </div>
        </div>
    );
};

const StatusLegend = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border h-fit">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend of Stock</h3>
        <div className="space-y-2 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-green-500"></div><span>Normal</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-yellow-400"></div><span>Low</span></div>
            <div className="flex items-center"><div className="w-4 h-4 rounded mr-2 bg-red-500"></div><span>Critical</span></div>
        </div>
    </div>
);
// --- NEW: Pagination helper component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    if (totalPages <= 1) return null;
    return (
        <nav className="flex items-center justify-center space-x-1 text-xs mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&lt;</button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded ${currentPage === number ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-100'}`}>
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50">&gt;</button>
        </nav>
    );
};
export default function AdminInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // --- NEW: State for pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    const fetchInventories = useCallback(async () => {
        setLoading(true);
        const [bhwRes, bnsRes] = await Promise.all([
            supabase.from('inventory').select('*')
        ]);
        
        const combined = [
            ...(bhwRes.data || []).map(item => ({...item, source: 'BHW'})),
            ...(bnsRes.data || []).map(item => ({...item, source: 'BNS'}))
        ];
        
        setAllItems(combined.sort((a, b) => a.item_name.localeCompare(b.item_name)));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventories();
    }, [fetchInventories]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allItems, searchTerm, activeCategory]);

    // --- MODIFIED: Pagination logic added ---
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        return filteredItems.slice(from, to);
    }, [filteredItems, currentPage, itemsPerPage]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredItems);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
        XLSX.writeFile(workbook, "Admin_Inventory_Report.xlsx");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm border">
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
                                {/* --- MODIFIED: The Filter button is now functional and renders a dropdown --- */}
                                <div className="relative">
                                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><FilterIcon /> Filter</button>
                                    <AnimatePresence>
                                        {isFilterOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 border"
                                            >
                                                <div className="p-2 text-xs font-semibold text-gray-600 border-b">Filter by Category</div>
                                                <div className="p-2">
                                                    {['All', 'Medicines', 'Vaccines', 'Equipment', 'Medical Supplies', 'Nutrition & Feeding', 'Child Hygiene & Care', 'Other Supplies'].map(cat => (
                                                        <label key={cat} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="category_filter"
                                                                value={cat}
                                                                checked={activeCategory === cat}
                                                                onChange={() => {
                                                                    setActiveCategory(cat);
                                                                    setCurrentPage(1); // Reset to first page
                                                                    setIsFilterOpen(false);
                                                                }}
                                                            />
                                                            <span className="text-sm">{cat}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"><ExportIcon /> Export</button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-gray-600">
                                        {['Stock ID', 'Name of Item', 'Category', 'Quantity', 'Expiry Date', 'Supplier'].map(h => <th key={h} className="p-2 font-semibold">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center p-6">Loading inventory...</td></tr>
                                    ) : paginatedItems.map((item, index) => {
                                        const stockNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr key={`${item.id}-${item.source}`} className="text-gray-700">
                                                <td className="p-2 font-medium">{`S-${String(stockNumber).padStart(3, '0')}`}</td>
                                                <td className="p-2 font-semibold">{item.item_name}</td>
                                                <td className="p-2">{item.category}</td>
                                                <td className="p-2 w-48"><QuantityCell quantity={item.quantity} status={item.status} /></td>
                                                <td className="p-2">{item.expiry_date || 'N/A'}</td>
                                                <td className="p-2">{item.supplier || 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>

                    <div className="lg:col-span-1">
                        <StatusLegend />
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../services/supabase";
import AddChildModal from "./AddChildModal";
import { AnimatePresence, motion } from "framer-motion";
import { logActivity } from "../../services/activityLogger";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import PatientQRCodeModal from "../../components/reusables/PatientQRCodeModal";
import HistoryModal from "../../components/reusables/HistoryModal"; // Import


// --- ICONS ---
const PillIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> );
const PlusIcon = () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> );
const TrashIcon = () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );
const HistoryIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> );

const ExportIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    ></path>
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>
  </svg>
);
const FilterIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"
    ></path>
  </svg>
);
const ViewIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    ></path>
  </svg>
);
const UpdateIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    ></path>
  </svg>
);
const DeleteIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>
  </svg>
);
const CalendarIcon = () => (
  <svg
    className="w-5 h-5 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    ></path>
  </svg>
);

// --- WIDGETS & HELPER COMPONENTS ---


const StatusBadge = ({ status }) => {
  const styles = {
    H: "bg-green-100 text-green-700",
    UW: "bg-yellow-100 text-yellow-700",
    OW: "bg-orange-100 text-orange-700",
    O: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${
        styles[status] || "bg-gray-100"
      }`}
    >
      {status}
    </span>
  );
};

const StatusLegend = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm border">
    <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
    <div className="space-y-2 text-xs">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-yellow-400"></div>
        <span className="font-semibold">UW</span> - Underweight
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-green-400"></div>
        <span className="font-semibold">H</span> - Healthy
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-orange-400"></div>
        <span className="font-semibold">OW</span> - Overweight
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-red-400"></div>
        <span className="font-semibold">O</span> - Obese
      </div>
      <div className="border-t my-2"></div>
      <div className="flex items-center space-x-2 text-gray-700">
        <ViewIcon />
        <span>View</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <UpdateIcon />
        <span>Update</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <HistoryIcon />
        <span>History/Log</span>
      </div>
    </div>
  </div>
);

const PrescriptionModal = ({ child, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('dispense');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [itemsToDispense, setItemsToDispense] = useState([{ 
    id: Date.now(), 
    itemId: "", 
    quantity: 1, 
    instructions: "",
    searchTerm: ""
  }]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { profile } = useAuth();
  const [searchInputs, setSearchInputs] = useState({});
  const [filteredInventories, setFilteredInventories] = useState({});

  // Load BNS Inventory - FIXED
  useEffect(() => {
    const fetchInventory = async () => {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .gt('quantity', 0)
        .eq('is_deleted', false) // <--- Added this filter
        .eq('owner_role', 'BNS');
      setInventoryItems(data || []);
    };
    fetchInventory();
  }, []);

  const handleAddItem = () => {
    const newId = Date.now();
    setItemsToDispense([...itemsToDispense, { 
      id: newId, 
      itemId: "", 
      quantity: 1, 
      instructions: "",
      searchTerm: ""
    }]);
  };

  const handleRemoveItem = (id) => {
    if (itemsToDispense.length === 1) {
      addNotification("At least one item is required", "warning");
      return;
    }
    setItemsToDispense(itemsToDispense.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = itemsToDispense.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'itemId') {
          updatedItem.searchTerm = "";
        }
        
        if (field === 'searchTerm') {
          updatedItem.itemId = "";
          
          const filtered = inventoryItems.filter(inv => 
            inv.item_name.toLowerCase().includes(value.toLowerCase()) &&
            inv.quantity > 0
          );
          setFilteredInventories(prev => ({ ...prev, [id]: filtered }));
        }
        
        return updatedItem;
      }
      return item;
    });
    setItemsToDispense(updatedItems);
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setLoading(true);

    for (const itemRequest of itemsToDispense) {
      if (!itemRequest.itemId) {
        addNotification("Please select an item for all rows.", "error");
        setLoading(false);
        return;
      }
      const inventoryItem = inventoryItems.find(i => i.id === itemRequest.itemId);
      if (!inventoryItem || inventoryItem.quantity < itemRequest.quantity) {
        addNotification(`Insufficient stock for ${inventoryItem ? inventoryItem.item_name : 'item'}. Available: ${inventoryItem?.quantity || 0}`, "error");
        setLoading(false);
        return;
      }
    }

    try {
      const newRecords = [];
      const updatePromises = [];

      for (const itemRequest of itemsToDispense) {
        const inventoryItem = inventoryItems.find(i => i.id === itemRequest.itemId);

        // Update bns_inventory for children
        updatePromises.push(
          supabase.from('bns_inventory')
            .update({ quantity: inventoryItem.quantity - parseInt(itemRequest.quantity) })
            .eq('id', inventoryItem.id)
        );

        newRecords.push({
          date: new Date().toISOString(),
          itemName: inventoryItem.item_name,
          quantity: itemRequest.quantity,
          instructions: itemRequest.instructions,
          issuer: `${profile.first_name} ${profile.last_name}`
        });
        
        await logActivity("Medicine Dispensed (Child)", `Dispensed ${itemRequest.quantity} ${inventoryItem.item_name} to ${child.first_name} ${child.last_name}`);
      }

      await Promise.all(updatePromises);

      // For children, use health_details instead of medical_history
      const currentDetails = child.health_details || {};
      const prescriptions = currentDetails.prescriptions || [];
      
      const { error: patError } = await supabase
        .from('child_records')
        .update({ health_details: { ...currentDetails, prescriptions: [...newRecords, ...prescriptions] } })
        .eq('id', child.id);
        
      if (patError) throw patError;
      
      addNotification("Medicines dispensed successfully.", "success");
      onSave(); 
      onClose();
    } catch (error) {
      console.error("Prescription error:", error);
      addNotification("Failed to dispense medicines.", "error");
    } finally {
      setLoading(false);
    }
  };

  // For children, prescriptions are in health_details.prescriptions
  const history = child.health_details?.prescriptions || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
      >
        {/* Header - Fixed */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Prescription & Dispensing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Child: <span className="font-semibold">{child.first_name} {child.last_name}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs - Fixed */}
        <div className="flex border-b flex-shrink-0">
          <button 
            onClick={() => setActiveTab('dispense')} 
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'dispense' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Dispense New
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'history' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              History
            </div>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dispense' ? (
            <form onSubmit={handleDispense} id="prescription-form" className="space-y-4">
              <div className="space-y-3">
                {itemsToDispense.map((item, index) => {
                  const selectedItem = inventoryItems.find(i => i.id === item.itemId);
                  const filteredItems = filteredInventories[item.id] || inventoryItems.filter(i => i.quantity > 0);
                  
                  return (
                    <div key={item.id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Item #{index + 1}</label>
                            {itemsToDispense.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          <div className="relative mb-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Search medicine..."
                              value={item.searchTerm || (selectedItem ? selectedItem.item_name : '')}
                              onChange={(e) => handleItemChange(item.id, 'searchTerm', e.target.value)}
                              onFocus={() => {
                                if (!item.itemId) {
                                  handleItemChange(item.id, 'searchTerm', '');
                                }
                              }}
                            />
                            
                            {item.searchTerm && filteredItems.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredItems.map(invItem => (
                                  <div
                                    key={invItem.id}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                                    onClick={() => {
                                      handleItemChange(item.id, 'itemId', invItem.id);
                                      setFilteredInventories(prev => ({ ...prev, [item.id]: [] }));
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{invItem.item_name}</span>
                                      <span className={`text-xs px-2 py-1 rounded-full ${invItem.quantity > 10 ? 'bg-green-100 text-green-800' : invItem.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        Stock: {invItem.quantity}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{invItem.category || 'Uncategorized'}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {selectedItem && (
                            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <div className="flex justify-between items-center text-sm">
                                <div>
                                  <span className="font-medium">{selectedItem.item_name}</span>
                                  <span className="text-gray-500 ml-2">({selectedItem.category})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${selectedItem.quantity > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    Available: {selectedItem.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Quantity</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  min="1" 
                                  max={selectedItem?.quantity || 999}
                                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                  required 
                                />
                                {selectedItem && (
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                    Max: {selectedItem.quantity}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Instructions</label>
                              <input 
                                type="text" 
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="e.g., 5ml daily"
                                value={item.instructions}
                                onChange={(e) => handleItemChange(item.id, 'instructions', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>
          ) : (
            <div>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 mt-3">No prescription history found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((rec, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-800">{rec.itemName}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                              Qty: {rec.quantity}
                            </span>
                          </div>
                          {rec.instructions && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-semibold">Instructions:</span> {rec.instructions}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(rec.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {rec.issuer || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          {activeTab === 'dispense' ? (
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Another Item
              </button>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="prescription-form"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Dispense All Items
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const UpcomingAppointmentsWidget = ({ appointments }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border">
    <h3 className="font-bold text-gray-700 text-sm mb-3">
      Upcoming Appointment
    </h3>
    <div className="space-y-3">
      {appointments.length > 0 ? (
        appointments.slice(0, 3).map((app) => (
          <div key={app.id} className="flex items-center space-x-2">
            <div className="bg-blue-100 p-1 rounded">
              <CalendarIcon />
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-xs">
                {app.patient_name}
              </p>
              <p className="text-xs text-blue-600 font-semibold">
                {app.reason}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No upcoming appointments.</p>
      )}
    </div>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPaginationItems = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 1,
      left = currentPage - delta,
      right = currentPage + delta,
      range = [],
      rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right))
        range.push(i);
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };
  const paginationItems = getPaginationItems();
  return (
    <nav className="flex items-center justify-center space-x-1 text-xs mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        &lt;
      </button>
      {paginationItems.map((item, index) =>
        item === "..." ? (
          <span key={index} className="px-2 py-1">
            ...
          </span>
        ) : (
          <button
            key={index}
            onClick={() => onPageChange(item)}
            className={`px-3 py-1 rounded ${
              currentPage === item
                ? "bg-blue-500 text-white font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        &gt;
      </button>
    </nav>
  );
};

const ViewChildModal = ({ child, onClose, onViewQRCode }) => {
  const details = child.health_details || {};
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text("Republic of the Philippines", 105, 10, { align: "center" });
    doc.text("CITY HEALTH DEPARTMENT", 105, 15, { align: "center" });
    doc.text("Nursing Services Division", 105, 20, { align: "center" });
    doc.text("City of Puerto Princesa", 105, 25, { align: "center" });
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("EXPANDED PROGRAM ON IMMUNIZATION", 105, 35, { align: "center" });
    doc.text("INDIVIDUAL TREATMENT RECORD (ITR)", 105, 40, { align: "center" });
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    
    autoTable(doc, {
      startY: 45,
      theme: "plain",
      body: [
        [`Name of BHS: ${details.bhs_name || "San Miguel"}`, `NHTS No.: ${details.nhts_no || "N/A"}`],
        [`Name of Child: ${child.first_name} ${child.last_name}`, `PhilHealth No.: ${details.philhealth_no || "N/A"}`],
        [`Date of Birth: ${child.dob || "N/A"}`, `Sex: ${child.sex || "N/A"}`],
        [`Time of Delivery: ${details.delivery_time || "N/A"}`, `Birth Weight: ${details.birth_weight || "N/A"} kg`],
        [`Place of Birth: ${details.place_of_birth || "N/A"}`, `Place of Delivery: ${details.place_of_delivery || "N/A"}`],
        [`Birth Order: ${details.birth_order || "N/A"}`, `Type of Delivery: ${details.delivery_type || "N/A"}`],
        [`Name of Mother: ${child.mother_name || "N/A"}`, `Age: ${details.mother_age || "N/A"}`],
        [`Name of Father: ${details.father_name || "N/A"}`, `Contact Number: ${details.contact_no || "N/A"}`],
        [`Name of Guardian: ${child.guardian_name || "N/A"}`, `Relationship: ${details.guardian_relationship || "N/A"}`],
        [`Address: ${child.address || "N/A"}`, `Nearest Landmark: ${details.nearest_landmark || "N/A"}`],
        [`NBS Referral Date: ${details.nbs_referral_date || "N/A"}`, `NBS Result: ${details.nbs_result || "N/A"}`],
        [`Attendant at Birth: ${details.birth_attendant || "N/A"}`, `AOG at Birth: ${details.aog_at_birth || "N/A"}`],
        [`Smoking History: ${details.smoking_history || "No"}`, `Family Number: ${details.family_number || "N/A"}`],
      ],
      styles: { fontSize: 8, cellPadding: 1 },
    });
    
    doc.setFontSize(10).setFont(undefined, "bold")
       .text("MOTHER'S IMMUNIZATION STATUS", 14, doc.lastAutoTable.finalY + 10);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      theme: "grid",
      head: [["Antigen", "Td1", "Td2", "Td3", "Td4", "Td5", "FIM"]],
      body: [[
        "Date Given",
        details.mother_immunization_Td1 || "-",
        details.mother_immunization_Td2 || "-",
        details.mother_immunization_Td3 || "-",
        details.mother_immunization_Td4 || "-",
        details.mother_immunization_Td5 || "-",
        details.mother_immunization_FIM || "-",
      ]],
      styles: { fontSize: 8, halign: "center" },
    });
    
    // Immunization Table
    const immunizationRows = [];
    const immunizations = [
      'BCG', 'Hepa B w/In 24 hrs', 'Pentavalent 1', 'Pentavalent 2', 'Pentavalent 3',
      'OPV1', 'OPV2', 'OPV3', 'IPV 1', 'IPV 2', 'PCV 1', 'PCV 2', 'PCV 3',
      'MCV 1', 'MCV 2', 'FIC'
    ];
    
    immunizations.forEach((imm, index) => {
      const immId = imm.toLowerCase().replace(/[\/\s]/g, '_').replace(/w\/in_24_hrs/, 'hepa_b');
      immunizationRows.push([
        imm,
        details[`immunization_${immId}_date`] || "-",
        details[`immunization_${immId}_age`] || "-",
        details[`immunization_${immId}_weight`] || "-",
        details[`immunization_${immId}_height`] || "-",
        details[`immunization_${immId}_nutritional`] || "-",
        details[`immunization_${immId}_admitted_by`] || "-",
        details[`immunization_${immId}_immunized_by`] || "-",
        details[`immunization_${immId}_next_visit`] || "-",
        details[`immunization_${immId}_remarks`] || "-",
      ]);
    });
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      theme: "grid",
      head: [["Immunization", "Date Given", "Age", "Weight", "Height", "Nutritional", "Admitted By", "Immunized By", "Next Visit", "Remarks"]],
      body: immunizationRows,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fontSize: 6 },
    });
    
    doc.save(`ITR_${child.last_name}_${child.first_name}.pdf`);
    logActivity("Downloaded PDF Record", `Generated PDF for child: ${child.child_id}`);
  };

  const SectionHeader = ({ title }) => (
    <h3 className="font-bold text-gray-700 text-sm mt-6 mb-3 pb-2 border-b">
      {title}
    </h3>
  );

  const Field = ({ label, value }) => (
    <div className="mb-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 text-sm">{value || "N/A"}</p>
    </div>
  );

  const CheckboxDisplay = ({ label, isChecked }) => (
    <div className="flex items-center space-x-2 mb-1">
      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
        {isChecked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );

  const ImmunizationTable = () => {
    const immunizations = [
      { id: 'bcg', label: 'BCG' },
      { id: 'hepa_b', label: 'Hepa B w/In 24 hrs' },
      { id: 'pentavalent_1', label: 'Pentavalent 1' },
      { id: 'pentavalent_2', label: 'Pentavalent 2' },
      { id: 'pentavalent_3', label: 'Pentavalent 3' },
      { id: 'opv_1', label: 'OPV 1' },
      { id: 'opv_2', label: 'OPV 2' },
      { id: 'opv_3', label: 'OPV 3' },
      { id: 'ipv_1', label: 'IPV 1' },
      { id: 'ipv_2', label: 'IPV 2' },
      { id: 'pcv_1', label: 'PCV 1' },
      { id: 'pcv_2', label: 'PCV 2' },
      { id: 'pcv_3', label: 'PCV 3' },
      { id: 'mcv_1', label: 'MCV 1' },
      { id: 'mcv_2', label: 'MCV 2' },
      { id: 'fic', label: 'FIC' }
    ];

    return (
      <div className="overflow-x-auto border rounded-md mt-2 max-h-60 overflow-y-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-1 border w-20">Immunization</th>
              <th className="p-1 border w-16">Date Given</th>
              <th className="p-1 border w-12">Age</th>
              <th className="p-1 border w-12">Weight</th>
              <th className="p-1 border w-12">Height</th>
              <th className="p-1 border w-12">Nutritional</th>
              <th className="p-1 border w-16">Admitted By</th>
              <th className="p-1 border w-16">Immunized By</th>
              <th className="p-1 border w-16">Next Visit</th>
              <th className="p-1 border w-16">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {immunizations.map((immunization) => (
              <tr key={immunization.id} className="hover:bg-gray-50">
                <td className="p-1 border font-semibold">{immunization.label}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_date`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_age`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_weight`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_height`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_nutritional`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_admitted_by`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_immunized_by`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_next_visit`] || "-"}</td>
                <td className="p-1 border">{details[`immunization_${immunization.id}_remarks`] || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const TimeField = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex space-x-2">
        {['admission', 'departure'].map((type) => (
          <div key={type} className="flex-1">
            <p className="text-xs text-gray-400 capitalize">{type}</p>
            <p className="font-semibold text-gray-800 text-sm">
              {details[`immunization_time_${type}`] || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Child Immunization Record
              </h2>
              <p className="text-sm text-gray-600">
                Viewing record for{" "}
                <span className="font-semibold">
                  {child.first_name} {child.last_name}
                </span>{" "}
                (ID: {child.child_id})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Section 1: Personal & Family Information */}
          <SectionHeader title="1. Personal & Family Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Field label="Name of BHS" value={details.bhs_name || "San Miguel"} />
            <Field label="Family Number" value={details.family_number} />
            <Field label="Child's Name" value={`${child.first_name} ${child.last_name}`} />
            <Field label="Sex" value={child.sex} />
            <Field label="Date of Birth" value={child.dob} />
            <Field label="Time of Delivery" value={details.delivery_time} />
            <Field label="Birth Weight" value={`${details.birth_weight || "N/A"} kg`} />
            <Field label="Place of Birth" value={details.place_of_birth} />
            <Field label="Place of Delivery" value={details.place_of_delivery} />
            <Field label="Birth Order" value={details.birth_order} />
            <Field label="Type of Delivery" value={details.delivery_type} />
          </div>

          {/* ID Numbers */}
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">ID Numbers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="NHTS No." value={details.nhts_no} />
              <Field label="PhilHealth No." value={details.philhealth_no} />
            </div>
          </div>

          {/* Section 2: Parent/Guardian Information */}
          <SectionHeader title="2. Parent/Guardian Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Field label="Name of Mother" value={child.mother_name} />
            <Field label="Age of Mother" value={details.mother_age} />
            <Field label="Name of Father" value={details.father_name} />
            <Field label="Contact Number" value={details.contact_no} />
            <Field label="Name of Guardian" value={child.guardian_name} />
            <Field label="Relationship" value={details.guardian_relationship} />
            <Field label="Address" value={child.address} />
            <Field label="Nearest Landmark" value={details.nearest_landmark} />
          </div>

          {/* Health Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Date Referred for Newborn Screening" value={details.nbs_referral_date} />
            <Field label="NBS Done (Result)" value={details.nbs_result} />
            <Field label="Attendant at Birth" value={details.birth_attendant} />
            <Field label="AOG at Birth" value={details.aog_at_birth} />
            <Field label="Parent/Guardian Smoking History" value={details.smoking_history} />
          </div>

          {/* Section 3: Mother's Immunization */}
          <SectionHeader title="3. Mother's Immunization Status" />
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-center text-xs border">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  {["Td1", "Td2", "Td3", "Td4", "Td5", "FIM"].map((antigen) => (
                    <th key={antigen} className="p-2 border">
                      {antigen}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {["Td1", "Td2", "Td3", "Td4", "Td5", "FIM"].map((antigen) => (
                    <td key={antigen} className="p-2 border">
                      {details[`mother_immunization_${antigen}`] || "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Exclusive Breastfeeding */}
          <SectionHeader title="4. Exclusive Breastfeeding" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((month, i) => (
              <div key={i} className="text-center p-2 border rounded bg-gray-50">
                <p className="font-bold text-xs">{month} Month</p>
                <CheckboxDisplay 
                  label="" 
                  isChecked={details[`breastfeeding_month_${i+1}`]} 
                />
              </div>
            ))}
          </div>

          {/* Section 5: Immunization Schedule */}
          <SectionHeader title="5. Immunization Schedule" />
          <div className="mb-4">
            <ImmunizationTable />
          </div>

          {/* Additional Medical Information */}
          <SectionHeader title="6. Additional Medical Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Field label="Vitamin A Supplementation Date" value={details.vitamin_a_date} />
              <Field label="Vitamin A Amount" value={details.vitamin_a_amount} />
            </div>
            <div>
            </div>
          </div>

          {/* Current Measurements */}
          <SectionHeader title="7. Current Measurements" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Field label="Weight (kg)" value={child.weight_kg} />
            <Field label="Height (cm)" value={child.height_cm} />
            <Field label="BMI" value={child.bmi} />
            <div>
              <p className="text-xs text-gray-500">Nutrition Status</p>
              <div className="mt-1">
                <StatusBadge status={child.nutrition_status} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center flex-shrink-0">
          <div className="text-xs text-gray-500">
            Last Updated: {new Date(child.updated_at || child.created_at).toLocaleDateString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onViewQRCode(child)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold text-sm hover:bg-purple-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              View QR Code
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-sm hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DeleteConfirmationModal = ({ patientName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <motion.div
      className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
      <p className="text-sm text-gray-600 my-4">
        Are you sure you want to delete the record for{" "}
        <span className="font-semibold">{patientName}</span>? This action cannot
        be undone.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm"
        >
          Yes, Delete
        </button>
      </div>
    </motion.div>
  </div>
);

export default function ChildHealthRecords() {
  const [childRecords, setChildRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedChildForQR, setSelectedChildForQR] = useState(null);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // NEW


  // Export functions
  const exportToPDF = async (filename = 'child_records') => {
    try {
      // Fetch ALL child records
      const { data: allChildren, error } = await supabase
        .from('child_records')
        .select('*')
        .eq('is_deleted', false)
        .order('child_id', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Child Health Records', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Total Records: ${allChildren.length}`, 105, 22, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
      
      // Table headers
      const headers = [
        ['Child ID', 'Last Name', 'First Name', 'Age', 'Sex', 'Weight (kg)', 
        'Height (cm)', 'BMI', 'Nutrition Status', 'Last Checkup', 'Mother Name']
      ];
      
      // Helper function for age calculation
      const calculateAgeForExport = (dob) => {
        if (!dob) return "";
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        return age > 0 ? age : "< 1";
      };
      
      // Table data
      const tableData = allChildren.map(child => [
        child.child_id,
        child.last_name || '',
        child.first_name || '',
        calculateAgeForExport(child.dob),
        child.sex || '',
        child.weight_kg || '',
        child.height_cm || '',
        child.bmi || '',
        child.nutrition_status || '',
        child.last_checkup || '',
        child.mother_name || ''
      ]);
      
      // Create table
      autoTable(doc, {
        startY: 35,
        head: headers,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        margin: { left: 10, right: 10 }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Save PDF
      doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
      logActivity('Exported Records', `Exported ${allChildren.length} child records to PDF`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      addNotification('Error exporting to PDF: ' + error.message, 'error');
    }
  };

  const exportToExcel = async (filename = 'child_records') => {
    try {
      // Fetch ALL child records
      const { data: allChildren, error } = await supabase
        .from('child_records')
        .select('*')
        .eq('is_deleted', false)
        .order('child_id', { ascending: true });

      if (error) throw error;
      
      // Helper function for age calculation
      const calculateAgeForExport = (dob) => {
        if (!dob) return "";
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        return age > 0 ? age : "< 1";
      };
      
      // Prepare data for Excel
      const worksheetData = [
        ['Child ID', 'Last Name', 'First Name', 'Date of Birth', 'Age', 'Sex', 
        'Place of Birth', 'Weight (kg)', 'Height (cm)', 'BMI', 'Nutrition Status', 
        'Last Checkup', 'Mother Name', 'Father Name', 'Guardian Name', 
        'NHTS No.', 'PhilHealth No.', 'Created At']
      ];
      
      allChildren.forEach(child => {
        const healthDetails = child.health_details || {};
        worksheetData.push([
          child.child_id,
          child.last_name,
          child.first_name,
          child.dob,
          calculateAgeForExport(child.dob),
          child.sex,
          healthDetails.place_of_birth || '',
          child.weight_kg,
          child.height_cm,
          child.bmi,
          child.nutrition_status,
          child.last_checkup,
          child.mother_name,
          child.father_name,
          child.guardian_name,
          healthDetails.nhts_no || '',
          healthDetails.philhealth_no || '',
          new Date(child.created_at).toLocaleDateString()
        ]);
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const colWidths = [
        {wch: 12}, // Child ID
        {wch: 15}, // Last Name
        {wch: 15}, // First Name
        {wch: 12}, // DOB
        {wch: 6},  // Age
        {wch: 8},  // Sex
        {wch: 15}, // Place of Birth
        {wch: 10}, // Weight
        {wch: 10}, // Height
        {wch: 10}, // BMI
        {wch: 15}, // Nutrition Status
        {wch: 12}, // Last Checkup
        {wch: 15}, // Mother Name
        {wch: 15}, // Father Name
        {wch: 15}, // Guardian Name
        {wch: 12}, // NHTS No.
        {wch: 12}, // PhilHealth No.
        {wch: 12}  // Created At
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Child Records');
      
      // Generate Excel file
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      logActivity('Exported Records', `Exported ${allChildren.length} child records to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      addNotification('Error exporting to Excel: ' + error.message, 'error');
    }
  };

  const handleShowHistory = (record) => {
      setSelectedChild(record);
      setIsHistoryModalOpen(true);
  };

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Reset to page 1 if searching
    const pageToFetch = searchTerm ? 1 : currentPage;
    const from = (pageToFetch - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // Build the query
    let query = supabase
      .from("child_records")
      .select("*", { count: "exact" })
      .eq('is_deleted', false);

    // Apply search filter if exists
    if (searchTerm) {
      const searchTermLower = `%${searchTerm.toLowerCase()}%`;
      query = query.or(
        `first_name.ilike.${searchTermLower},last_name.ilike.${searchTermLower},mother_name.ilike.${searchTermLower}`
      );
    }

    // Apply nutrition status filter if not 'All'
    if (activeFilter !== "All") {
      query = query.eq('nutrition_status', activeFilter);
    }

    // Execute the query with pagination
    const { data: recordsData, error: recordsError, count: recordsCount } = await query
      .order("child_id", { ascending: true })
      .range(from, to);
      
    if (recordsError) {
      console.error("Error fetching records:", recordsError);
      // If it's a range error, try fetching without range first
      if (recordsError.message.includes("range") || recordsError.message.includes("416")) {
        // Fetch without pagination to get count
        const { count } = await supabase
          .from("child_records")
          .select("*", { count: "exact", head: true })
          .eq('is_deleted', false);
        
        setChildRecords([]);
        setTotalRecords(count || 0);
      } else {
        addNotification(
          `Error fetching records: ${recordsError.message}`,
          "error"
        );
      }
    } else {
      setChildRecords(recordsData || []);
      setTotalRecords(recordsCount || 0);
    }

    // Rest of your existing code for appointments...
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("created_by", user.id)
      .order("date", { ascending: true })
      .limit(3);
      
    if (!appointmentsError) {
      setUpcomingAppointments(appointmentsData || []);
    }
    setLoading(false);
  }, [addNotification, currentPage, itemsPerPage, user, searchTerm, activeFilter]);// Add searchTerm and activeFilter to dependencies

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const calculateAge = (dob) => {
    if (!dob) return "";
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return age > 0 ? age : "< 1";
  };

  const handleDelete = async () => {
    if (!patientToDelete || !user) return;
    const { error } = await supabase
      .from("requestions")
      .insert([
        {
          worker_id: user.id,
          request_type: "Delete",
          target_table: "child_records",
          target_record_id: patientToDelete.id,
          request_data: {
            child_id: patientToDelete.child_id,
            name: `${patientToDelete.first_name} ${patientToDelete.last_name}`,
          },
          status: "Pending",
        },
      ]);
    if (error) {
      addNotification(
        `Error submitting delete request: ${error.message}`,
        "error"
      );
    } else {
      addNotification("Delete request submitted for approval.", "success");
      logActivity(
        "Child Record Delete Request",
        `Submitted request for ${patientToDelete.first_name} ${patientToDelete.last_name}`
      );
    }
    setPatientToDelete(null);
  };

  const handlePrescribe = (child) => {
      setSelectedChild(child);
      setIsPrescriptionModalOpen(true);
  };

  const filteredRecords = useMemo(() => {
    return childRecords.filter((record) =>
      `${record.first_name || ""} ${record.last_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [childRecords, searchTerm]);

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  return (
    <>
      <AnimatePresence>
        {isPrescriptionModalOpen && selectedChild && (
            <PrescriptionModal 
                child={selectedChild}
                onClose={() => setIsPrescriptionModalOpen(false)}
                onSave={fetchPageData}
            />
        )}
        {(modalMode === "add" || modalMode === "edit") && (
          <AddChildModal
            mode={modalMode}
            initialData={selectedChild}
            onClose={() => setModalMode(null)}
            onSave={() => {
              setModalMode(null);
              fetchPageData();
            }}
          />
        )}
        {modalMode === "view" && (
          <ViewChildModal
            child={selectedChild}
            onClose={() => setModalMode(null)}
            onViewQRCode={(child) => {
              setModalMode(null);
              setSelectedChildForQR(child);
            }}
          />
        )}
        {patientToDelete && (
          <DeleteConfirmationModal
            patientName={`${patientToDelete.first_name} ${patientToDelete.last_name}`}
            onConfirm={handleDelete}
            onCancel={() => setPatientToDelete(null)}
          />
        )}
        {selectedChildForQR && (
            <PatientQRCodeModal 
                subject={selectedChildForQR}      // Pass the child object as 'subject'
                idKey="child_id"                  // Tell the modal to use the 'child_id' field
                idLabel="Child ID"                // Tell the modal how to label the ID
                onClose={() => setSelectedChildForQR(null)} 
            />
        )}
        {isHistoryModalOpen && selectedChild && (
            <HistoryModal 
                title={`${selectedChild.first_name} ${selectedChild.last_name}`}
                queryTerm={selectedChild.first_name} // Searching by name
                onClose={() => setIsHistoryModalOpen(false)}
            />
        )}
      </AnimatePresence>
         <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <h2 className="text-xl font-bold text-gray-700">
                  Children Record List
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50 focus:bg-white"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                    >
                      <FilterIcon /> <span>Filter</span>
                    </button>
                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border"
                        >
                          <div className="p-2 text-xs font-semibold text-gray-600 border-b">
                            Filter by Status
                          </div>
                          <div className="p-2">
                            {["All", "H", "UW", "OW", "O"].map((status) => (
                              <label
                                key={status}
                                className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="status_filter"
                                  value={status}
                                  checked={activeFilter === status}
                                  onChange={() => {
                                    setActiveFilter(status);
                                    setCurrentPage(1);
                                    setIsFilterOpen(false);
                                  }}
                                />
                                <span className="text-sm">{status}</span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Export Button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsExportOpen(!isExportOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                    >
                      <ExportIcon /> <span>Export</span>
                    </button>
                    <AnimatePresence>
                      {isExportOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-20 border"
                        >
                          <div className="p-2 text-xs font-semibold text-gray-600 border-b">
                            Export Format
                          </div>
                          <div className="p-1">
                            <button
                              onClick={() => {
                                exportToPDF('child_records'); // Just pass the filename
                                setIsExportOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Export as PDF
                            </button>
                            <button
                              onClick={() => {
                                exportToExcel('child_records'); // Just pass the filename
                                setIsExportOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-green-50 text-green-600 hover:text-green-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Export as Excel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500 font-semibold">
                      {[
                        "Child ID",
                        "Last Name",
                        "First Name",
                        "Age",
                        "Weight(kg)",
                        "Height(cm)",
                        "BMI",
                        "Nutrition Status",
                        "Last Check up",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="px-2 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center p-4">
                          Loading records...
                        </td>
                      </tr>
                    ) : (
                      childRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="text-gray-600 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 font-medium">
                            {record.child_id}
                          </td>
                          <td className="px-2 py-2">{record.last_name}</td>
                          <td className="px-2 py-2">{record.first_name}</td>
                          <td className="px-2 py-2">
                            {calculateAge(record.dob)}
                          </td>
                          <td className="px-2 py-2">{record.weight_kg}</td>
                          <td className="px-2 py-2">{record.height_cm}</td>
                          <td className="px-2 py-2">{record.bmi}</td>
                          <td className="px-2 py-2">
                            <StatusBadge status={record.nutrition_status} />
                          </td>
                          <td className="px-2 py-2">{record.last_checkup}</td>
                          <td className="px-2 py-2">
                            <div className="flex space-x-1">
                              <button onClick={() => handlePrescribe(record)} className="text-purple-500 hover:text-purple-700 p-1 bg-purple-50 rounded" title="Prescribe"> <PillIcon /> </button>
                              <button
                                onClick={() => {
                                  setSelectedChild(record);
                                  setModalMode("view");
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="View"
                              >
                                <ViewIcon />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedChild(record);
                                  setModalMode("edit");
                                }}
                                className="text-gray-400 hover:text-green-600 p-1"
                                title="Edit"
                              >
                                <UpdateIcon />
                              </button>
                              <button onClick={() => handleShowHistory(record)} className="text-gray-400 hover:text-orange-600 p-1" title="View History"><HistoryIcon /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
          <div className="xl:col-span-1 space-y-4">
            <button
              onClick={() => {
                setSelectedChild(null);
                setModalMode("add");
              }}
              className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm"
            >
              + New Child Record
            </button>
            <StatusLegend />
            <UpcomingAppointmentsWidget appointments={upcomingAppointments} />
          </div>
        </div>
    </>
  );
}

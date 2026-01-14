import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "../../services/activityLogger";
import { useNotification } from "../../context/NotificationContext";

const SuccessIcon = () => (
  <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// Common units of measurement for dropdown
const UNIT_OPTIONS = [
  "Box", "Bottle", "Tablet", "Capsule", "Vial", "Ampule", 
  "Syringe", "Tube", "Pack", "Piece", "Set", "Kit",
  "Roll", "Sheet", "Pair", "Carton", "Can", "Packet",
  "Gram", "Kilogram", "Liter", "Milliliter", "Dozen", "Unit"
];

export default function AddInventoryModal({ onClose, onSave, mode = "add", initialData = null }) {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    quantity: "",
    unit: "",
    sku: "",
    batch_no: "",
    supply_source: "",
    manufacture_date: "",
    expiry_date: ""
  });
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState([{ ...formData }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        item_name: initialData.item_name || "",
        category: initialData.category || "",
        quantity: initialData.quantity || "",
        unit: initialData.unit || "",
        sku: initialData.sku || "",
        batch_no: initialData.batch_no || "",
        supply_source: initialData.supply_source || initialData.supplier || "",
        manufacture_date: initialData.manufacture_date || "",
        expiry_date: initialData.expiry_date || "",
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchChange = (index, field, value) => {
    const updatedItems = [...batchItems];
    updatedItems[index][field] = value;
    
    // Auto-generate SKU if item name changes and SKU is empty
    if (field === 'item_name' && !updatedItems[index].sku) {
      const namePart = value.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      updatedItems[index].sku = `${namePart}-${randomNum}`;
    }
    
    setBatchItems(updatedItems);
  };

  const addBatchRow = () => {
    setBatchItems([...batchItems, { ...formData, sku: "", item_name: "" }]);
  };

  const removeBatchRow = (index) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter((_, i) => i !== index));
    }
  };

  const validateBatchItems = () => {
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (!item.item_name || !item.category || !item.quantity || !item.unit || !item.supply_source) {
        return `Row ${i + 1}: Please fill all required fields`;
      }
      if (isNaN(item.quantity) || parseInt(item.quantity) <= 0) {
        return `Row ${i + 1}: Quantity must be a positive number`;
      }
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (batchMode) {
        // Batch save
        const validationError = validateBatchItems();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        const itemsToInsert = batchItems.map(item => ({
          item_name: item.item_name,
          category: item.category,
          quantity: parseInt(item.quantity),
          unit: item.unit,
          sku: item.sku ? item.sku.toUpperCase() : null,
          batch_no: item.batch_no || null, // Convert empty string to null
          supplier: item.supply_source,
          supply_source: item.supply_source,
          manufacture_date: item.manufacture_date || null, // FIX: Convert empty string to null
          expiry_date: item.expiry_date || null, // FIX: Convert empty string to null
          owner_role: 'BHW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from("inventory")
          .insert(itemsToInsert);

        if (insertError) throw insertError;

        // Log activity for batch insert
        await logActivity(
          "Batch Items Added", 
          `Added ${batchItems.length} items: ${batchItems.map(item => item.item_name).join(", ")}`
        );
        
        addNotification(`${batchItems.length} items added successfully!`, "success");
        onSave();
        onClose();
        
      } else {
        // Single item save
        const dataPayload = {
          ...formData,
          sku: formData.sku ? formData.sku.toUpperCase() : null,
          supplier: formData.supply_source,
          supply_source: formData.supply_source,
          // FIX: Convert empty strings to null for date fields
          manufacture_date: formData.manufacture_date || null,
          expiry_date: formData.expiry_date || null,
          batch_no: formData.batch_no || null,
          owner_role: 'BHW',
          updated_at: new Date().toISOString()
        };

        if (mode === "edit") {
          const { error: updateError } = await supabase
            .from("inventory")
            .update(dataPayload)
            .eq("id", initialData.id);
          
          if (updateError) throw updateError;
          
          await logActivity("Inventory Item Updated", `Updated item: ${formData.item_name}`);
          addNotification("Inventory item updated successfully.", "success");
        } else {
          const { error: insertError } = await supabase
            .from("inventory")
            .insert([dataPayload]);
          
          if (insertError) throw insertError;
          
          await logActivity("New Item Added", `Added item: ${formData.item_name}`);
          addNotification("New item added to inventory.", "success");
        }
        
        onSave();
        onClose();
      }
    } catch (err) {
      setError(err.message);
      addNotification(`Error: ${err.message}`, "error");
    }
    
    setLoading(false);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const title = mode === "edit" ? "Edit Item" : (batchMode ? "Add Multiple Items" : "Add New Item");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <AnimatePresence>
        {!showSuccess ? (
          <motion.div 
            key="form" 
            variants={modalVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit" 
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {mode === "add" && (
                  <button
                    type="button"
                    onClick={() => {
                      setBatchMode(!batchMode);
                      if (!batchMode) {
                        setBatchItems([{ ...formData }]);
                      }
                    }}
                    className="text-sm px-3 py-1.5 rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    {batchMode ? "Switch to Single Entry" : "Switch to Batch Entry"}
                  </button>
                )}
              </div>

              {batchMode ? (
                // IMPROVED BATCH ENTRY FORM
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="font-semibold text-blue-700">Batch Entry Mode</p>
                    </div>
                    <p className="mb-2">Add multiple items at once. Fill in the essential details for each row.</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        type="button"
                        onClick={addBatchRow}
                        className="text-sm px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Row
                      </button>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded font-medium">Total: {batchItems.length} items</span>
                        <span className="text-xs">(Required fields marked with *)</span>
                      </div>
                    </div>
                  </div>

                  {/* COMPACT BATCH TABLE */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="hidden md:block">
                      {/* Desktop - Compact 6-column layout */}
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr className="text-xs font-semibold text-gray-700">
                            <th className="p-3 text-left w-16">#</th>
                            <th className="p-3 text-left">
                              <span className="text-red-500">*</span> Item Name
                            </th>
                            <th className="p-3 text-left">
                              <span className="text-red-500">*</span> Category
                            </th>
                            <th className="p-3 text-left">
                              <span className="text-red-500">*</span> Qty
                            </th>
                            <th className="p-3 text-left">
                              <span className="text-red-500">*</span> Unit
                            </th>
                            <th className="p-3 text-left">SKU</th>
                            <th className="p-3 text-left w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {batchItems.map((item, index) => (
                            <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="p-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.item_name || ""}
                                  onChange={(e) => handleBatchChange(index, 'item_name', e.target.value)}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., Paracetamol 500mg"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={item.category || ""}
                                  onChange={(e) => handleBatchChange(index, 'category', e.target.value)}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select category</option>
                                  <option value="Medicines">Medicines</option>
                                  <option value="Nutrition and Feeding">Nutrition</option>
                                  <option value="Medical Supplies">Supplies</option>
                                  <option value="Vaccines">Vaccines</option>
                                  <option value="Equipment">Equipment</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={item.quantity || ""}
                                  onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                                  required
                                  min="1"
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={item.unit || ""}
                                  onChange={(e) => handleBatchChange(index, 'unit', e.target.value)}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select unit</option>
                                  <option value="Box">Box</option>
                                  <option value="Bottle">Bottle</option>
                                  <option value="Tablet">Tablet</option>
                                  <option value="Capsule">Capsule</option>
                                  <option value="Pack">Pack</option>
                                  <option value="Piece">Piece</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.sku || ""}
                                  onChange={(e) => handleBatchChange(index, 'sku', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Auto-generated"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {batchItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeBatchRow(index)}
                                      className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 font-medium flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile view - Even cleaner */}
                    <div className="md:hidden space-y-3 p-4">
                      {batchItems.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-center mb-3 pb-2 border-b">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-sm">Item {index + 1}</h4>
                            </div>
                            {batchItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBatchRow(index)}
                                className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100 flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                <span className="text-red-500">*</span> Item Name
                              </label>
                              <input
                                type="text"
                                value={item.item_name || ""}
                                onChange={(e) => handleBatchChange(index, 'item_name', e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                placeholder="Enter item name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                  <span className="text-red-500">*</span> Category
                                </label>
                                <select
                                  value={item.category || ""}
                                  onChange={(e) => handleBatchChange(index, 'category', e.target.value)}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select...</option>
                                  <option value="Medicines">Medicines</option>
                                  <option value="Nutrition and Feeding">Nutrition</option>
                                  <option value="Medical Supplies">Supplies</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                  <span className="text-red-500">*</span> Quantity
                                </label>
                                <input
                                  type="number"
                                  value={item.quantity || ""}
                                  onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                                  required
                                  min="1"
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                  <span className="text-red-500">*</span> Unit
                                </label>
                                <select
                                  value={item.unit || ""}
                                  onChange={(e) => handleBatchChange(index, 'unit', e.target.value)}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select unit</option>
                                  <option value="Box">Box</option>
                                  <option value="Bottle">Bottle</option>
                                  <option value="Tablet">Tablet</option>
                                  <option value="Pack">Pack</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                  SKU (Auto)
                                </label>
                                <input
                                  type="text"
                                  value={item.sku || ""}
                                  onChange={(e) => handleBatchChange(index, 'sku', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm uppercase"
                                  placeholder="Auto"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADDITIONAL OPTIONS SECTION - Collapsible for less clutter */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <details className="group">
                      <summary className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600 group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-sm">Additional Options (Optional)</span>
                        </div>
                        <span className="text-xs text-gray-500">Click to expand</span>
                      </summary>
                      <div className="p-4 border-t bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {batchItems.map((item, index) => (
                            <div key={index} className="space-y-3">
                              <div className="text-xs font-medium text-gray-700 bg-gray-50 p-2 rounded">
                                Item {index + 1}: {item.item_name || "Unnamed"}
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Supply Source</label>
                                <select
                                  value={item.supply_source || ""}
                                  onChange={(e) => handleBatchChange(index, 'supply_source', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Optional</option>
                                  <option value="City Health Office">City Health Office</option>
                                  <option value="LGU">LGU</option>
                                  <option value="DOH">DOH</option>
                                  <option value="Donation">Donation</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Batch/Lot No.</label>
                                <input
                                  type="text"
                                  value={item.batch_no || ""}
                                  onChange={(e) => handleBatchChange(index, 'batch_no', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                  placeholder="Optional"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Expiry Date</label>
                                <input
                                  type="date"
                                  value={item.expiry_date || ""}
                                  onChange={(e) => handleBatchChange(index, 'expiry_date', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{batchItems.length} items</span> ready to save
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={addBatchRow}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Another Item
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save {batchItems.length} Items
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // SINGLE ITEM FORM
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">SKU (Stock Keeping Unit)</label>
                    <input 
                      type="text" 
                      name="sku" 
                      value={formData.sku || ""} 
                      onChange={handleChange} 
                      placeholder="e.g. MED-001" 
                      className="w-full mt-1 p-2 border rounded-md text-sm uppercase" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Item Name / Description *</label>
                    <input 
                      type="text" 
                      name="item_name" 
                      value={formData.item_name || ""} 
                      onChange={handleChange} 
                      className="w-full mt-1 p-2 border rounded-md text-sm" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Supplier / Source *</label>
                      <select 
                        name="supply_source" 
                        value={formData.supply_source || ""} 
                        onChange={handleChange} 
                        className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" 
                        required
                      >
                        <option value="">Select Source...</option>
                        <option value="City Health Office">City Health Office</option>
                        <option value="LGU">LGU (Local)</option>
                        <option value="DOH">DOH (National)</option>
                        <option value="Donation">Donation</option>
                        <option value="Purchase">Direct Purchase</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Batch / Lot No.</label>
                      <input 
                        type="text" 
                        name="batch_no" 
                        value={formData.batch_no || ""} 
                        onChange={handleChange} 
                        className="w-full mt-1 p-2 border rounded-md text-sm" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Category *</label>
                      <select 
                        name="category" 
                        value={formData.category || ""} 
                        onChange={handleChange} 
                        className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" 
                        required 
                      >
                        <option value="">Select...</option>
                        <option value="Medicines">Medicines</option>
                        <option value="Nutrition and Feeding">Nutrition</option>
                        <option value="Medical Supplies">Supplies</option>
                        <option value="Vaccines">Vaccines</option>
                        <option value="Equipment">Equipment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Quantity *</label>
                      <input 
                        type="number" 
                        name="quantity" 
                        value={formData.quantity || ""} 
                        onChange={handleChange} 
                        min="1"
                        className="w-full mt-1 p-2 border rounded-md text-sm" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Unit of Measure (UOM) *</label>
                      <select 
                        name="unit" 
                        value={formData.unit || ""} 
                        onChange={handleChange} 
                        className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" 
                        required
                      >
                        <option value="">Select Unit...</option>
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Expiry Date</label>
                      <input 
                        type="date" 
                        name="expiry_date" 
                        value={formData.expiry_date || ""} 
                        onChange={handleChange} 
                        className="w-full mt-1 p-2 border rounded-md text-sm" 
                      />
                    </div>
                  </div>
                  
                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                  
                  <div className="flex justify-end items-center space-x-3 pt-4 border-t mt-4">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm"
                    >
                      {loading ? "Saving..." : mode === "edit" ? "Update Item" : "Save Item"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
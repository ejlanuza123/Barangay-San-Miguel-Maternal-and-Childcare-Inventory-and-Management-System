import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "../../services/activityLogger";
import { useNotification } from "../../context/NotificationContext";

const SuccessIcon = () => (
  <svg
    className="w-16 h-16 text-green-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);



export default function AddInventoryModal({ onClose, onSave, mode = "add", initialData = null }) {
  const [formData, setFormData] = useState({});
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
        // --- NEW FIELDS ---
        supplier: initialData.supplier || "",
        supply_source: initialData.supply_source || "",
        // ------------------
        manufacture_date: initialData.manufacture_date || "",
        expiry_date: initialData.expiry_date || "",
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- DUPLICATE CHECK LOGIC ---
    if (mode === "add") {
        // 1. Check for same Name + Batch No.
        const { data: duplicateItem, error: checkError } = await supabase
            .from("inventory")
            .select("id")
            .ilike("item_name", formData.item_name) // Case-insensitive check
            .eq("batch_no", formData.batch_no || "") // Empty batch is considered a value
            .maybeSingle();

        if (checkError) {
            console.error("Duplicate check error:", checkError);
        } else if (duplicateItem) {
            setError(`Item "${formData.item_name}" with Batch No. "${formData.batch_no || 'N/A'}" already exists. Please update the existing stock instead.`);
            setLoading(false);
            return;
        }

        // 2. Check for SKU uniqueness (only if SKU is provided)
        if (formData.sku) {
            const { data: duplicateSku } = await supabase
                .from("inventory")
                .select("id")
                .eq("sku", formData.sku.toUpperCase())
                .maybeSingle();

            if (duplicateSku) {
                setError(`The SKU "${formData.sku.toUpperCase()}" is already assigned to another item.`);
                setLoading(false);
                return;
            }
        }
    }
    // -----------------------------

    const dataPayload = {
        ...formData,
        sku: formData.sku ? formData.sku.toUpperCase() : null,
        updated_at: new Date().toISOString()
    };

    let result;
    if (mode === "edit") {
      result = await supabase.from("inventory").update(dataPayload).eq("id", initialData.id);
    } else {
      result = await supabase.from("inventory").insert([dataPayload]);
    }

    if (result.error) {
      setError(result.error.message);
      addNotification(`Error: ${result.error.message}`, "error");
    } else {
      if (mode === "add") {
        logActivity("New Item Added", `Added item: ${formData.item_name} (Batch: ${formData.batch_no})`);
        addNotification("New item added to inventory.", "success");
        onSave();
        onClose();
      } else {
        logActivity("Inventory Item Updated", `Updated item: ${formData.item_name}`);
        addNotification("Inventory item updated successfully.", "success");
        onSave();
        onClose();
      }
    }
    setLoading(false);
  };

  const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };
  const title = mode === "edit" ? "Edit Item" : "Add New Item";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <AnimatePresence>
        {!showSuccess ? (
          <motion.div key="form" variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
              <form onSubmit={handleSave} className="space-y-3">
                
                <div>
                  <label className="text-xs font-semibold text-gray-600">SKU (Stock Keeping Unit)</label>
                  <input type="text" name="sku" value={formData.sku || ""} onChange={handleChange} placeholder="e.g. MED-001" className="w-full mt-1 p-2 border rounded-md text-sm uppercase" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Item Name / Description</label>
                  <input type="text" name="item_name" value={formData.item_name || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                </div>

                {/* --- NEW SUPPLIER SECTION --- */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Supplier Name</label>
                        <input type="text" name="supplier" value={formData.supplier || ""} onChange={handleChange} placeholder="e.g. PharmaCorp" className="w-full mt-1 p-2 border rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Supply Source</label>
                         <select name="supply_source" value={formData.supply_source || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50">
                            <option value="">Select...</option>
                            <option value="LGU">LGU (Local)</option>
                            <option value="DOH">DOH (National)</option>
                            <option value="Donation">Donation</option>
                            <option value="Purchase">Direct Purchase</option>
                        </select>
                    </div>
                </div>
                {/* --------------------------- */}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Category</label>
                        <select name="category" value={formData.category || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm bg-gray-50" required >
                            <option value="">Select...</option>
                            <option value="Medicines">Medicines</option>
                            <option value="Nutrition and Feeding">Nutrition</option>
                            <option value="Medical Supplies">Supplies</option>
                            <option value="Vaccines">Vaccines</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Batch / Lot No.</label>
                        <input type="text" name="batch_no" value={formData.batch_no || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Quantity</label>
                        <input type="number" name="quantity" value={formData.quantity || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600">UOM (Unit)</label>
                        <input type="text" name="unit" value={formData.unit || ""} onChange={handleChange} placeholder="e.g. Box, Pc" className="w-full mt-1 p-2 border rounded-md text-sm" required />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Manufacture Date</label>
                        <input type="date" name="manufacture_date" value={formData.manufacture_date || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600">Expiry Date</label>
                        <input type="date" name="expiry_date" value={formData.expiry_date || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm" />
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                
                <div className="flex justify-end items-center space-x-3 pt-4 border-t mt-4">
                  <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm">{loading ? "Saving..." : "Save Item"}</button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

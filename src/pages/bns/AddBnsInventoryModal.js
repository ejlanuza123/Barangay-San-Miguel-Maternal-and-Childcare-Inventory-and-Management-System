import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { motion } from "framer-motion";
import { useNotification } from "../../context/NotificationContext";
import { logActivity } from "../../services/activityLogger";

export default function AddBnsInventoryModal({ onClose, onSave, mode = "add", initialData = null }) {
  const [formData, setFormData] = useState({});
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        ...initialData,
        sku: initialData.sku || "",
        batch_no: initialData.batch_no || "",
        supplier: initialData.supplier || "",
        supply_source: initialData.supply_source || ""
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- DUPLICATE CHECK LOGIC (BNS) ---
    if (mode === "add") {
        const { data: duplicateItem } = await supabase
            .from("bns_inventory")
            .select("id")
            .ilike("item_name", formData.item_name)
            .eq("batch_no", formData.batch_no || "")
            .maybeSingle();

        if (duplicateItem) {
            setError(`Item "${formData.item_name}" with Batch No. "${formData.batch_no || 'N/A'}" already exists.`);
            setLoading(false);
            return;
        }

        if (formData.sku) {
            const { data: duplicateSku } = await supabase
                .from("bns_inventory")
                .select("id")
                .eq("sku", formData.sku.toUpperCase())
                .maybeSingle();

            if (duplicateSku) {
                setError(`The SKU "${formData.sku.toUpperCase()}" is already assigned.`);
                setLoading(false);
                return;
            }
        }
    }
    // -----------------------------------
    
    const dataPayload = {
        ...formData,
        sku: formData.sku ? formData.sku.toUpperCase() : null,
    };

    let result;
    if (mode === "edit") {
      result = await supabase.from("bns_inventory").update(dataPayload).eq("id", initialData.id);
    } else {
      result = await supabase.from("bns_inventory").insert([dataPayload]);
    }

    if (result.error) {
      setError(result.error.message);
      addNotification(`Error: ${result.error.message}`, "error");
    } else {
      const action = mode === "edit" ? "BNS Inventory Updated" : "New BNS Item Added";
      await logActivity(action, `${mode === "edit" ? "Updated" : "Added"} item: ${formData.item_name}`);
      addNotification(`Item ${mode === "edit" ? "updated" : "added"} successfully.`, "success");
      onSave();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold mb-4">{mode === "edit" ? "Edit Item" : "Add New Item"}</h2>
        <form onSubmit={handleSave} className="space-y-3 text-sm">
          
          <div>
             <label className="font-semibold text-xs text-gray-600">SKU (Stock Keeping Unit)</label>
             <input type="text" name="sku" value={formData.sku || ""} onChange={handleChange} placeholder="e.g. NUT-001" className="w-full mt-1 p-2 border rounded uppercase" />
          </div>

          <div>
            <label className="font-semibold text-xs text-gray-600">Item Name</label>
            <input type="text" name="item_name" value={formData.item_name || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required />
          </div>

          {/* --- NEW SUPPLIER SECTION --- */}
          <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="text-xs font-semibold text-gray-600">Supplier Name</label>
                  <input type="text" name="supplier" value={formData.supplier || ""} onChange={handleChange} placeholder="e.g. DOH" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                  <label className="text-xs font-semibold text-gray-600">Supply Source</label>
                    <select name="supply_source" value={formData.supply_source || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded bg-gray-50">
                      <option value="">Select...</option>
                      <option value="LGU">LGU (Local)</option>
                      <option value="DOH">DOH (National)</option>
                      <option value="Donation">Donation</option>
                      <option value="Purchase">Direct Purchase</option>
                  </select>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="font-semibold text-xs text-gray-600">Category</label>
                <select name="category" value={formData.category || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded bg-gray-50" required>
                    <option value="">Select...</option>
                    <option value="Medicines">Medicines</option>
                    <option value="Nutrition and Feeding">Nutrition</option>
                    <option value="Child Hygiene and Care">Child Care</option>
                </select>
             </div>
             <div>
                <label className="font-semibold text-xs text-gray-600">Batch / Lot No.</label>
                <input type="text" name="batch_no" value={formData.batch_no || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
             </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-xs text-gray-600">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-xs text-gray-600">Unit (UOM)</label>
              <input type="text" name="unit" placeholder="e.g. Box" value={formData.unit || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required />
            </div>
          </div>

          <div>
            <label className="font-semibold text-xs text-gray-600">Expiration Date</label>
            <input type="date" name="expiration_date" value={formData.expiration_date || ""} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-semibold">{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

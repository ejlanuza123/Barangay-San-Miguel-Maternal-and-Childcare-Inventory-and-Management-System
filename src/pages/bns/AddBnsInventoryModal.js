import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { motion } from "framer-motion";
import { useNotification } from "../../context/NotificationContext";
import { logActivity } from "../../services/activityLogger";

export default function AddBnsInventoryModal({
  onClose,
  onSave,
  mode = "add",
  initialData = null,
}) {
  const [formData, setFormData] = useState({});
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    }
  }, [mode, initialData]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    // MODIFIED: All operations now point to 'bns_inventory'
    if (mode === "edit") {
      result = await supabase
        .from("bns_inventory")
        .update(formData)
        .eq("id", initialData.id);
    } else {
      result = await supabase.from("bns_inventory").insert([formData]);
    }

    if (result.error) {
      addNotification(`Error: ${result.error.message}`, "error");
    } else {
      const action =
        mode === "edit" ? "BNS Inventory Updated" : "New BNS Item Added";
      const details = `${mode === "edit" ? "Updated" : "Added"} item: ${
        formData.item_name
      }`;
      await logActivity(action, details);
      addNotification(
        `Item ${mode === "edit" ? "updated" : "added"} successfully.`,
        "success"
      );
      onSave();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold mb-4">
          {mode === "edit" ? "Edit Item" : "Add New Item"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold">Item Name</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name || ""}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded"
              required
            />
          </div>
          <div>
                                   {" "}
            <label className="font-semibold">Category</label>                   
               {" "}
            <select
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded bg-gray-50"
              required
            >
              SPOILER                            {" "}
              <option value="">Select a category...</option>                   
                      <option value="Medicines">Medicines</option>             
                           {" "}
              <option value="Nutrition and Feeding">
                Nutrition and Feeding
              </option>
              SPOILER                            {" "}
              <option value="Medical Supplies">Medical Supplies</option>       
                                  <option value="Vaccines">Vaccines</option>
              SPOILER                   _      {" "}
              <option value="Equipment">Equipment</option>                     
                   {" "}
              <option value="Child Hygiene and Care">
                Child Hygiene and Care
              </option>
                                  †  {" "}
            </select>
                               {" "}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Unit</label>
              <input
                type="text"
                name="unit"
                placeholder="e.g., Bottles, Boxes"
                value={formData.unit || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold">Expiration Date</label>
            <input
              type="date"
              name="expiration_date"
              value={formData.expiration_date || ""}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

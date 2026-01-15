import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "../../services/activityLogger";
import { useNotification } from "../../context/NotificationContext";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";

// --- Helper Icon for Profile Placeholder ---
const ProfileIcon = () => (
  <svg
    className="w-full h-full text-gray-300"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const InventoryInput = ({ label, fieldName, value, onChange, inventoryCategory, inventoryItems, onAddToQueue, amountFieldName, amountValue }) => {
  const [selectedItemId, setSelectedItemId] = useState("");
  
  // Filter inventory based on the category (e.g., 'Vaccines')
  const filteredItems = inventoryItems.filter(
    item => item.category === inventoryCategory && item.quantity > 0
  );

  const handleDateSet = (dateVal) => {
    // Update the form data with the date
    onChange({ target: { name: fieldName, value: dateVal } });
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    handleDateSet(today);
  };

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    
    // Find the item details
    const item = filteredItems.find(i => i.id === itemId);
    
    // Attempt to parse amount for deduction, default to 1 if not a valid number
    const qtyToDeduct = parseInt(amountValue) || 1;

    if (item) {
        // Add to the parent's deduction queue
        onAddToQueue({
            itemId: item.id,
            itemName: item.item_name,
            deductQty: qtyToDeduct, 
            category: inventoryCategory,
            dateGiven: value, // Use the current date value
            fieldName: fieldName
        });
    }
  };

  return (
    <div className="border p-2 rounded-md bg-gray-50 mb-2">
        <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
        
        {/* Date Section */}
        <div className="flex gap-2 mb-2">
            <input 
                type="date" 
                name={fieldName}
                value={value || ''} 
                onChange={(e) => handleDateSet(e.target.value)}
                className="w-full p-1 border rounded text-xs" 
            />
            <button 
                type="button" 
                onClick={handleSetToday}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
            >
                Today
            </button>
        </div>

        {/* Amount Given Section - Optional */}
        {amountFieldName && (
            <div className="mb-2">
                <label className="block text-[10px] text-gray-500 mb-0.5">Amount Given</label>
                <input 
                    type="text" 
                    name={amountFieldName}
                    value={amountValue || ''} 
                    onChange={onChange}
                    placeholder="e.g. 1 cap"
                    className="w-full p-1 border rounded text-xs" 
                />
            </div>
        )}

        {/* Inventory Section (Only show if date is filled) */}
        {value && (
            <div>
                <select 
                    className="w-full p-1 border rounded text-xs bg-white"
                    value={selectedItemId}
                    onChange={handleItemSelect}
                >
                    <option value="">-- Select Item to Deduct --</option>
                    {filteredItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.item_name} (Qty: {item.quantity})
                        </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                    Selecting an item will auto-deduct from inventory upon save.
                </p>
            </div>
        )}
    </div>
  );
};

// --- Helper Components for Each Step of the Form ---

const Step1 = ({ formData, handleChange, handleDobChange, newPatientId }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
    {/* Left Profile Section */}
    <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
      <div className="w-32 h-32 bg-white rounded-md border p-1 flex items-center justify-center">
        {newPatientId && newPatientId.startsWith("P-") ? (
          <QRCodeSVG value={newPatientId} size={120} />
        ) : (
          <ProfileIcon />
        )}
      </div>
      <div className="text-center mt-2">
        <p className="font-bold text-gray-700">Patient ID: {newPatientId}</p>
        {newPatientId.startsWith("P-") && (
          <p className="text-xs text-gray-500">(Patient ID Auto Generated)</p>
        )}
      </div>
    </div>

    {/* Right Side with Info + ID Numbers */}
    <div className="md:col-span-2 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Personal Information */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-700 mb-2">
            Personal Information
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-500">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob || ""}
                onChange={handleDobChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Blood Type</label>
              <select
                name="blood_type"
                value={formData.blood_type || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm bg-gray-50"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age || ""}
                readOnly
                placeholder="(Auto)"
                className="w-full p-2 border rounded-md text-sm bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* ID Numbers Box (Right Side) */}
        <div className="w-full md:w-1/3 space-y-4 p-4 border rounded-lg bg-gray-50 shadow">
          <h3 className="font-bold text-center">ID Numbers</h3>
          <div>
            <label className="text-sm">NHTS No.</label>
            <input
              type="text"
              name="nhts_no"
              value={formData.nhts_no || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm">PhilHealth No.</label>
            <input
              type="text"
              name="philhealth_no"
              value={formData.philhealth_no || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Family Folder No.</label>
            <input
              type="text"
              name="family_folder_no"
              value={formData.family_folder_no || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Contact No.</label>
            <input
              type="text"
              name="contact_no"
              value={formData.contact_no || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              name="sms_notifications_enabled"
              checked={formData.sms_notifications_enabled ?? true}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              id="sms-toggle"
            />
            <label
              htmlFor="sms-toggle"
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              Send SMS reminders for appointments.
            </label>
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Purok</label>
            <select
              name="purok"
              value={formData.purok || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm bg-gray-50"
            >
              <option value="">Select Purok</option>
              <option value="Purok Bagong Silang Zone 1">
                Purok Bagong Silang Zone 1
              </option>
              <option value="Purok Bagong Silang Zone 2">
                Purok Bagong Silang Zone 2
              </option>
              <option value="Purok Masigla Zone 1">Purok Masigla Zone 1</option>
              <option value="Purok Masigla Zone 2">Purok Masigla Zone 2</option>
              <option value="Purok Masaya">Purok Masaya</option>
              <option value="Purok Bagong Lipunan">Purok Bagong Lipunan</option>
              <option value="Purok Dagomboy">Purok Dagomboy</option>
              <option value="Purok Katarungan Zone 1">
                Purok Katarungan Zone 1
              </option>
              <option value="Purok Katarungan Zone 2">
                Purok Katarungan Zone 2
              </option>
              <option value="Purok Pagkakaisa">Purok Pagkakaisa</option>
              <option value="Purok Kilos-Agad">Purok Kilos-Agad</option>
              <option value="Purok Balikatan">Purok Balikatan</option>
              <option value="Purok Bayanihan">Purok Bayanihan</option>
              <option value="Purok Magkakapitbahay">
                Purok Magkakapitbahay
              </option>
              <option value="Purok Magara Zone 2">Purok Magara Zone 2</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Street</label>
            <input
              type="text"
              name="street"
              value={formData.street || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Obstetrical Score</h3>
        <div className="grid grid-cols-6 gap-2">
          <div>
            <label className="text-xs text-gray-500">G</label>
            <input
              type="number"
              name="g_score"
              value={formData.g_score || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">P</label>
            <input
              type="number"
              name="p_score"
              value={formData.p_score || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Term</label>
            <input
              type="number"
              name="term"
              value={formData.term || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Preterm</label>
            <input
              type="number"
              name="preterm"
              value={formData.preterm || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Abortion</label>
            <input
              type="number"
              name="abortion"
              value={formData.abortion || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Living Children</label>
            <input
              type="number"
              name="living_children"
              value={formData.living_children || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Step2 = ({ formData, handleChange }) => {
  const [pregnancyRows, setPregnancyRows] = useState([{ gravida: 1 }]);

  const addRow = () => {
    setPregnancyRows([...pregnancyRows, { gravida: pregnancyRows.length + 1 }]);
  };

  const removeRow = (index) => {
    if (pregnancyRows.length > 1) {
      const newRows = pregnancyRows.filter((_, i) => i !== index);
      setPregnancyRows(newRows);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div className="md:col-span-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">Pregnancy History</h3>
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            + Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                {["Gravida", "Outcome", "Sex", "NSD/CS", "Delivered At", ""].map(
                  (h) => (
                    <th key={h} className="p-2 border font-medium text-xs">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {pregnancyRows.map((row, index) => (
                <tr key={index}>
                  <td className="p-1 border">
                    <input
                      type="number"
                      name={`pregnancy_${index}_gravida`}
                      value={formData[`pregnancy_${index}_gravida`] || row.gravida}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-xs"
                      min="1"
                      placeholder="Gravida #"
                    />
                  </td>
                  <td className="p-1 border">
                    <select
                      name={`pregnancy_${index}_outcome`}
                      value={formData[`pregnancy_${index}_outcome`] || ""}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">Select Outcome</option>
                      <option value="Live Birth">Live Birth</option>
                      <option value="Stillbirth">Stillbirth</option>
                      <option value="Abortion">Abortion</option>
                      <option value="Miscarriage">Miscarriage</option>
                      <option value="Ectopic">Ectopic</option>
                      <option value="Molar">Molar</option>
                    </select>
                  </td>
                  <td className="p-1 border">
                    <select
                      name={`pregnancy_${index}_sex`}
                      value={formData[`pregnancy_${index}_sex`] || ""}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unknown">Unknown</option>
                      <option value="Multiple">Multiple</option>
                    </select>
                  </td>
                  <td className="p-1 border">
                    <select
                      name={`pregnancy_${index}_delivery_type`}
                      value={formData[`pregnancy_${index}_delivery_type`] || ""}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">Select Type</option>
                      <option value="NSD">NSD (Normal Spontaneous Delivery)</option>
                      <option value="CS">CS (Cesarean Section)</option>
                      <option value="Assisted">Assisted Delivery</option>
                      <option value="VBAC">VBAC</option>
                    </select>
                  </td>
                  <td className="p-1 border">
                    <input
                      type="text"
                      name={`pregnancy_${index}_delivered_at`}
                      value={formData[`pregnancy_${index}_delivered_at`] || ""}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-xs"
                      placeholder="e.g. Hospital, Home, Clinic"
                    />
                  </td>
                  <td className="p-1 border text-center">
                    {pregnancyRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">
            Past Menstrual Period
          </h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500">
                Last Menstrual Period (LMP)
              </label>
              <input
                type="date"
                name="lmp"
                value={formData.lmp || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Risk Code</label>
              <input
                type="text"
                name="risk_code"
                value={formData.risk_code || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Expected Date of Confinement (EDC)
              </label>
              <input
                type="date"
                name="edc"
                value={formData.edc || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Age of First Period</label>
              <input
                type="number"
                name="age_first_period"
                value={formData.age_first_period || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
                min="8"
                max="20"
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">OB History</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500">Age of Menarche</label>
              <input
                type="number"
                name="age_of_menarche"
                value={formData.age_of_menarche || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
                min="8"
                max="20"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount of Bleeding</label>
              <select
                name="bleeding_amount"
                value={formData.bleeding_amount || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm bg-gray-50"
              >
                <option value="">Select amount</option>
                <option value="Scanty">Scanty</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Duration of Menstruation (days)
              </label>
              <input
                type="number"
                name="menstruation_duration"
                value={formData.menstruation_duration || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ formData, handleChange, inventoryItems, onAddToQueue }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-1 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Vaccination Record</h3>
        <p className="text-[10px] text-gray-500 mb-2 italic">Select a date and an item to auto-deduct from inventory.</p>
        <div className="space-y-1">
            {["TT1", "TT2", "TT3", "TT4", "TT5", "FIM"].map((vaccine) => (
                <InventoryInput 
                    key={vaccine}
                    label={vaccine}
                    fieldName={`vaccine_${vaccine.toLowerCase()}`}
                    value={formData[`vaccine_${vaccine.toLowerCase()}`]}
                    onChange={handleChange}
                    inventoryCategory="Vaccines" 
                    inventoryItems={inventoryItems}
                    onAddToQueue={onAddToQueue}
                />
            ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Personal History</h3>
        <div className="p-4 border rounded-md space-y-1">
          {[
            "Diabetes Mellitus (DM)",
            "Asthma",
            "Cardiovascular Disease (CVD)",
            "Heart Disease",
            "Goiter",
          ].map((h) => (
            <div key={h} className="flex items-center">
              <input
                type="checkbox"
                name={`ph_${h}`}
                checked={formData[`ph_${h}`] || false}
                onChange={handleChange}
                className="mr-2"
              />{" "}
              <label className="text-sm">{h}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="lg:col-span-1 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Hereditary Disease History
        </h3>
        <div className="p-4 border rounded-md space-y-1">
          {[
            "Hypertension (HPN)",
            "Asthma",
            "Heart Disease",
            "Diabetes Mellitus",
            "Goiter",
          ].map((h) => (
            <div key={h} className="flex items-center">
              <input
                type="checkbox"
                name={`hdh_${h}`}
                checked={formData[`hdh_${h}`] || false}
                onChange={handleChange}
                className="mr-2"
              />{" "}
              <label className="text-sm">{h}</label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Social History</h3>
        <div className="p-4 border rounded-md space-y-1">
          {[
            "Smoker",
            "Ex-smoker",
            "Second-hand Smoker",
            "Alcohol Drinker",
            "Substance Abuse",
          ].map((h) => (
            <div key={h} className="flex items-center">
              <input
                type="checkbox"
                name={`sh_${h}`}
                checked={formData[`sh_${h}`] || false}
                onChange={handleChange}
                className="mr-2"
              />{" "}
              <label className="text-sm">{h}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="lg:col-span-1 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          History of Allergy and Drugs
        </h3>
        <div className="border rounded-md">
          <textarea
            name="allergy_history"
            value={formData.allergy_history || ""}
            onChange={handleChange}
            rows="5"
            className="w-full p-2 rounded-md text-sm border-none focus:ring-0"
          ></textarea>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Family Planning History
        </h3>
        <div className="border rounded-md">
          <textarea
            name="family_planning_history"
            value={formData.family_planning_history || ""}
            onChange={handleChange}
            rows="5"
            placeholder="Enter FP Method previously used"
            className="w-full p-2 rounded-md text-sm border-none focus:ring-0"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
);

const Step4 = ({ formData, handleChange, inventoryItems, onAddToQueue }) => {
  const [treatmentRows, setTreatmentRows] = useState([{}]);
  const [outcomeRows, setOutcomeRows] = useState([{}]);

  const addTreatmentRow = () => {
    setTreatmentRows([...treatmentRows, {}]);
  };

  const addOutcomeRow = () => {
    setOutcomeRows([...outcomeRows, {}]);
  };

  const treatmentHeaders = [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'arrival', label: 'Arrival', type: 'time' },
    { key: 'departure', label: 'Departure', type: 'time' },
    { key: 'height', label: 'Ht. (cm)', type: 'number' },
    { key: 'weight', label: 'Wt. (kg)', type: 'number' },
    { key: 'bp', label: 'BP', type: 'text', placeholder: '120/80' },
    { key: 'muac', label: 'MUAC (cm)', type: 'number' },
    { key: 'bmi', label: 'BMI', type: 'number', readOnly: true },
    { key: 'aog', label: 'AOG (wks)', type: 'number' },
    { key: 'fh', label: 'FH (cm)', type: 'number' },
    { key: 'fhb', label: 'FHB', type: 'select', options: ['+', '-', 'Not audible'] },
    { key: 'loc', label: 'LOC', type: 'select', options: ['Vertex', 'Breech', 'Transverse', 'Oblique'] },
    { key: 'presentation', label: 'Pres', type: 'select', options: ['Cephalic', 'Breech', 'Shoulder', 'Compound'] },
    { key: 'fe_fa', label: 'Fe+FA', type: 'select', options: ['Given', 'Not Given', 'Refused'] },
    { key: 'admitted', label: 'Admitted', type: 'select', options: ['Yes', 'No', 'Referred'] },
    { key: 'examined', label: 'Examined', type: 'select', options: ['Complete', 'Partial', 'Not done'] }
  ];

  const outcomeHeaders = [
    { key: 'date_terminated', label: 'Date Terminated', type: 'date' },
    { key: 'delivery_type', label: 'Type of Delivery', type: 'select', options: ['NSD', 'CS', 'Assisted', 'VBAC', 'Forceps', 'Vacuum'] },
    { key: 'outcome', label: 'Outcome', type: 'select', options: ['Live Birth', 'Stillbirth', 'Neonatal Death', 'Miscarriage', 'Abortion'] },
    { key: 'sex', label: 'Sex of Child', type: 'select', options: ['Male', 'Female', 'Multiple', 'Unknown'] },
    { key: 'birth_weight', label: 'Birth Weight (g)', type: 'number' },
    { key: 'age_weeks', label: 'Age in Weeks', type: 'number' },
    { key: 'place_of_birth', label: 'Place of Birth', type: 'select', options: ['Hospital', 'Home', 'Birthing Center', 'Clinic', 'On the way'] },
    { key: 'attended_by', label: 'Attended By', type: 'select', options: ['Doctor', 'Midwife', 'Nurse', 'Traditional Birth Attendant', 'Self'] }
  ];

  // Calculate BMI if height and weight are provided
  const calculateBMI = (height, weight) => {
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const handleTreatmentChange = (rowIndex, fieldKey, value) => {
    const fieldName = `treatment_${rowIndex}_${fieldKey}`;
    
    // Update form data
    handleChange({ 
      target: { 
        name: fieldName, 
        value: value 
      } 
    });

    // Auto-calculate BMI if height or weight changes
    if (fieldKey === 'height' || fieldKey === 'weight') {
      const height = fieldKey === 'height' ? value : formData[`treatment_${rowIndex}_height`];
      const weight = fieldKey === 'weight' ? value : formData[`treatment_${rowIndex}_weight`];
      
      const bmi = calculateBMI(parseFloat(height), parseFloat(weight));
      if (bmi) {
        handleChange({
          target: {
            name: `treatment_${rowIndex}_bmi`,
            value: bmi
          }
        });
      }
    }
  };

  return (
    <div className="space-y-6 text-sm">
      {/* PARENTAL INDIVIDUAL TREATMENT RECORD */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">
            PARENTAL INDIVIDUAL TREATMENT RECORD
          </h3>
          <button
            type="button"
            onClick={addTreatmentRow}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Visit
          </button>
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {treatmentHeaders.map((h) => (
                  <th
                    key={h.key}
                    className="p-2 border-r font-medium text-xs text-gray-600 whitespace-nowrap"
                  >
                    {h.label}
                  </th>
                ))}
                <th className="p-2 font-medium text-xs text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {treatmentRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {treatmentHeaders.map((h) => (
                    <td
                      key={`${h.key}-${rowIndex}`}
                      className="p-1 border-r border-t"
                    >
                      {h.type === 'select' ? (
                        <select
                          name={`treatment_${rowIndex}_${h.key}`}
                          value={formData[`treatment_${rowIndex}_${h.key}`] || ''}
                          onChange={(e) => handleTreatmentChange(rowIndex, h.key, e.target.value)}
                          className="w-full p-1 border rounded text-xs bg-white"
                        >
                          <option value="">Select</option>
                          {h.options.map((option, idx) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={h.type}
                          name={`treatment_${rowIndex}_${h.key}`}
                          value={formData[`treatment_${rowIndex}_${h.key}`] || ''}
                          onChange={(e) => handleTreatmentChange(rowIndex, h.key, e.target.value)}
                          className={`w-full p-1 border rounded text-xs ${h.readOnly ? 'bg-gray-100' : 'bg-white'}`}
                          placeholder={h.placeholder || h.label}
                          readOnly={h.readOnly}
                          min={h.type === 'number' ? '0' : undefined}
                          step={h.type === 'number' ? '0.1' : undefined}
                        />
                      )}
                    </td>
                  ))}
                  <td className="p-1 border-t border-r text-center align-middle">
                    {treatmentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTreatmentRows(treatmentRows.filter((_, i) => i !== rowIndex))}
                        className="text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded"
                        title="Remove visit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          BMI auto-calculated when Height (cm) and Weight (kg) are entered.
        </div>
      </div>

      {/* PREGNANCY OUTCOMES */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">Pregnancy Outcomes</h3>
          <button
            type="button"
            onClick={addOutcomeRow}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Outcome
          </button>
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {outcomeHeaders.map((h) => (
                  <th
                    key={h.key}
                    className="p-2 border-r font-medium text-xs text-gray-600 whitespace-nowrap"
                  >
                    {h.label}
                  </th>
                ))}
                <th className="p-2 font-medium text-xs text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {outcomeRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {outcomeHeaders.map((h) => (
                    <td
                      key={`${h.key}-${rowIndex}`}
                      className="p-1 border-r border-t"
                    >
                      {h.type === 'select' ? (
                        <select
                          name={`outcome_${rowIndex}_${h.key}`}
                          value={formData[`outcome_${rowIndex}_${h.key}`] || ''}
                          onChange={handleChange}
                          className="w-full p-1 border rounded text-xs bg-white"
                        >
                          <option value="">Select</option>
                          {h.options.map((option, idx) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={h.type}
                          name={`outcome_${rowIndex}_${h.key}`}
                          value={formData[`outcome_${rowIndex}_${h.key}`] || ''}
                          onChange={handleChange}
                          className="w-full p-1 border rounded text-xs bg-white"
                          placeholder={h.label}
                          min={h.type === 'number' ? '0' : undefined}
                          step={h.type === 'number' ? '1' : undefined}
                        />
                      )}
                    </td>
                  ))}
                  <td className="p-1 border-t border-r text-center align-middle">
                    {outcomeRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setOutcomeRows(outcomeRows.filter((_, i) => i !== rowIndex))}
                        className="text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded"
                        title="Remove outcome"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONSULTATION AND REFERRAL FORM */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Consultation and Referral Form</h3>
        <div className="p-4 border rounded-md space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Date*</label>
            <input
              type="date"
              name="consultation_date"
              value={formData.consultation_date || ""}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Complaints*
            </label>
            <textarea
              name="consultation_complaints"
              value={formData.consultation_complaints || ""}
              onChange={handleChange}
              rows="3"
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="Describe the patient's complaints..."
            ></textarea>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Referral Done For*
            </label>
            <select
              name="referral_type"
              value={formData.referral_type || ""}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="">Select referral type</option>
              <option value="Obstetric Ultrasound">Obstetric Ultrasound</option>
              <option value="High-risk Pregnancy">High-risk Pregnancy</option>
              <option value="Medical Consultation">Medical Consultation</option>
              <option value="Laboratory Tests">Laboratory Tests</option>
              <option value="Hospital Admission">Hospital Admission</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              name="referral_details"
              value={formData.referral_details || ""}
              onChange={handleChange}
              placeholder="Additional referral details (if other)"
              className="w-full mt-1 p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Doctor's Order*
            </label>
            <textarea
              name="doctors_order"
              value={formData.doctors_order || ""}
              onChange={handleChange}
              rows="3"
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="Enter doctor's orders..."
            ></textarea>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Remarks</label>
            <textarea
              name="consultation_remarks"
              value={formData.consultation_remarks || ""}
              onChange={handleChange}
              rows="2"
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="Additional remarks..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* MICRONUTRIENT SUPPLEMENTATION */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Micronutrient Supplementation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InventoryInput 
                label="Iron Supplementation / Ferrous Sulfate"
                fieldName="iron_supp_date"
                value={formData.iron_supp_date}
                onChange={handleChange}
                inventoryCategory="Medicines"
                inventoryItems={inventoryItems}
                onAddToQueue={onAddToQueue}
                amountFieldName="iron_supp_amount"
                amountValue={formData.iron_supp_amount}
            />
             <InventoryInput 
                label="Vitamin A (200,000 IU)"
                fieldName="vitamin_a_date"
                value={formData.vitamin_a_date}
                onChange={handleChange}
                inventoryCategory="Medicines"
                inventoryItems={inventoryItems}
                onAddToQueue={onAddToQueue}
                amountFieldName="vitamin_a_amount"
                amountValue={formData.vitamin_a_amount}
            />
        </div>
      </div>
    </div>
  );
};

export default function AddPatientModal({
  onClose,
  onSave,
  mode = "add",
  initialData = null,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addNotification } = useNotification();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({});
  const [patientId, setPatientId] = useState("Loading...");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [deductionQueue, setDeductionQueue] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pregnancyHistory, setPregnancyHistory] = useState([]);
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [pregnancyOutcomes, setPregnancyOutcomes] = useState([]);

  // Fetch inventory items
  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, item_name, quantity, category')
        .gt('quantity', 0);
      
      if (!error) {
        setInventoryItems(data || []);
      }
    };
    fetchInventory();

    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Handle adding items to deduction queue
  const handleAddToQueue = (itemData) => {
    setDeductionQueue(prev => {
      // Check if item already in queue for this field
      const existingIndex = prev.findIndex(item => 
        item.itemId === itemData.itemId && item.fieldName === itemData.fieldName
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        const newQueue = [...prev];
        newQueue[existingIndex] = itemData;
        return newQueue;
      } else {
        // Add new entry
        return [...prev, itemData];
      }
    });
    
    addNotification(`Added ${itemData.itemName} to deduction queue.`, 'info');
  };

  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Combines the medical_history JSON with the top-level patient fields
      const combinedData = {
        ...(initialData.medical_history || {}),
        first_name: initialData.first_name || "",
        middle_name: initialData.middle_name || "",
        last_name: initialData.last_name || "",
        age: initialData.age || "",
        contact_no: initialData.contact_no || "",
        risk_level: initialData.risk_level || "",
        weeks: initialData.weeks || "",
        last_visit: initialData.last_visit || "",
        patient_id: initialData.patient_id || "",
        purok: initialData.purok || "",
        street: initialData.street || "",
        sms_notifications_enabled:
          initialData.sms_notifications_enabled ?? true,
      };

      setFormData(combinedData);
      setPatientId(initialData.patient_id);
    } else {
      setFormData({
        sms_notifications_enabled: true,
      });
      const generateNewId = async () => {
        const { count, error } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true });
        if (error) {
          setPatientId("Error");
        } else {
          const nextId = (count || 0) + 1;
          setPatientId(`P-${String(nextId).padStart(3, "0")}`);
        }
      };
      generateNewId();
    }
  }, [mode, initialData]);

  // Calculate age from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return "";

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age < 0 ? "" : age.toString();
  };

  const handleDobChange = (e) => {
    const { name, value } = e.target;
    const calculatedAge = calculateAge(value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      age: calculatedAge,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    
    // Process inventory deductions first
    if (deductionQueue.length > 0) {
      try {
        for (const item of deductionQueue) {
          // Fetch current quantity to be safe
          const { data: currentItem, error: fetchError } = await supabase
            .from('inventory')
            .select('quantity, item_name')
            .eq('id', item.itemId)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (currentItem && currentItem.quantity >= item.deductQty) {
            // Update inventory
            const { error: invError } = await supabase
              .from('inventory')
              .update({ quantity: currentItem.quantity - item.deductQty })
              .eq('id', item.itemId);
            
            if (invError) throw invError;
            
            // Log activity
            await logActivity(
              'Stock Deducted', 
              `Used ${item.deductQty} unit(s) of ${item.itemName} for patient ${patientId}`
            );
            
            // Record transaction if we have a patient record
            if (initialData?.id || mode === "add") {
              const patientRecordId = mode === "edit" ? initialData.id : null;
              
              // In a real app, you would save this to inventory_transactions table
              // For now, we'll just log it
              console.log(`Transaction: ${item.deductQty} x ${item.itemName} for patient ${patientRecordId}`);
            }
            
            addNotification(`Deducted ${item.deductQty} of ${item.itemName} from inventory`, 'success');
          } else {
            addNotification(`Insufficient stock for ${item.itemName}. Available: ${currentItem?.quantity || 0}`, 'error');
          }
        }
      } catch (err) {
        console.error("Inventory deduction error", err);
        addNotification("Error updating inventory: " + err.message, "error");
      }
    }

    // Save patient data
    const patientData = {
      patient_id: patientId,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      age: formData.age,
      contact_no: formData.contact_no,
      risk_level: formData.risk_level,
      weeks: formData.weeks,
      last_visit: formData.last_visit,
      purok: formData.purok,
      street: formData.street,
      sms_notifications_enabled: formData.sms_notifications_enabled ?? true,
      medical_history: formData,
    };

    try {
      let result;
      if (mode === "edit") {
        result = await supabase.from("patients").update(patientData).eq("id", initialData.id);
      } else {
        result = await supabase.from("patients").insert([patientData]);
      }
      
      if (result.error) throw result.error;

      addNotification(mode === 'edit' ? "Patient record updated successfully." : "New patient added successfully.", "success");
      
      // Log activity
      await logActivity(
        mode === 'edit' ? 'Record Updated' : 'New Mother Record Added',
        `${mode === 'edit' ? 'Updated' : 'Added'} patient ${formData.first_name} ${formData.last_name} (${patientId})`
      );
      
      onSave();
      onClose();
      
    } catch (err) {
      setError("An error occurred: " + err.message);
      addNotification("Error saving patient: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "edit" ? "Edit Patient Record" : "New Patient Record";
  const isBHW = profile?.role === 'BHW';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
        <motion.div
          className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-12 p-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {deductionQueue.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 text-sm">
              <strong>Note: </strong>
              {deductionQueue.length} item(s) will be deducted from inventory upon save.
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
            PARENTAL INDIVIDUAL TREATMENT RECORD
          </h2>
          <p className="text-sm text-gray-500 text-center mb-4">
            Page {step} of 4
          </p>

          <div className="py-4">
            {step === 1 && (
              <Step1
                formData={formData}
                handleChange={handleChange}
                handleDobChange={handleDobChange}
                newPatientId={patientId}
              />
            )}
            {step === 2 && (
              <Step2 
                formData={formData} 
                handleChange={handleChange}
                isReadOnly={isBHW} 
              />
            )}
            {step === 3 && (
              <Step3 
                formData={formData} 
                handleChange={handleChange}
                inventoryItems={inventoryItems}
                onAddToQueue={handleAddToQueue}
              />
            )}
            {step === 4 && (
              <Step4 
                formData={formData} 
                handleChange={handleChange}
                inventoryItems={inventoryItems}
                onAddToQueue={handleAddToQueue}
              />
            )}
          </div>

          <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
              >
                Previous
              </button>
            )}
            {step < 4 && (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Next Page
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
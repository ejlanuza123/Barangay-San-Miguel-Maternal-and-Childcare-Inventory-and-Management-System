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
  
  const filteredItems = inventoryItems.filter(
    item => item.category === inventoryCategory && item.quantity > 0
  );

  const handleDateSet = (dateVal) => {
    onChange({ target: { name: fieldName, value: dateVal } });
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    handleDateSet(today);
  };

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    
    const item = filteredItems.find(i => i.id === itemId);
    const qtyToDeduct = parseInt(amountValue) || 1;

    if (item) {
        onAddToQueue({
            itemId: item.id,
            itemName: item.item_name,
            deductQty: qtyToDeduct, 
            category: inventoryCategory,
            dateGiven: value, 
            fieldName: fieldName
        });
    }
  };

  return (
    <div className="border p-2 rounded-md bg-gray-50 mb-2">
        <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
        
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

    <div className="md:col-span-2 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
              <option value="Purok Bagong Silang Zone 1">Purok Bagong Silang Zone 1</option>
              <option value="Purok Bagong Silang Zone 2">Purok Bagong Silang Zone 2</option>
              <option value="Purok Masigla Zone 1">Purok Masigla Zone 1</option>
              <option value="Purok Masigla Zone 2">Purok Masigla Zone 2</option>
              <option value="Purok Masaya">Purok Masaya</option>
              <option value="Purok Bagong Lipunan">Purok Bagong Lipunan</option>
              <option value="Purok Dagomboy">Purok Dagomboy</option>
              <option value="Purok Katarungan Zone 1">Purok Katarungan Zone 1</option>
              <option value="Purok Katarungan Zone 2">Purok Katarungan Zone 2</option>
              <option value="Purok Pagkakaisa">Purok Pagkakaisa</option>
              <option value="Purok Kilos-Agad">Purok Kilos-Agad</option>
              <option value="Purok Balikatan">Purok Balikatan</option>
              <option value="Purok Bayanihan">Purok Bayanihan</option>
              <option value="Purok Magkakapitbahay">Purok Magkakapitbahay</option>
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
        <div className="grid grid-cols-6 gap-2 mb-3">
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
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs font-semibold text-blue-900 mb-2">Obstetrical Score Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-800">
            <div><span className="font-semibold">G:</span> Gravida (total pregnancies)</div>
            <div><span className="font-semibold">P:</span> Parity (number of deliveries)</div>
            <div><span className="font-semibold">Term:</span> Deliveries at term (≥37 weeks)</div>
            <div><span className="font-semibold">Preterm:</span> Deliveries before 37 weeks</div>
            <div><span className="font-semibold">Abortion:</span> Abortions or miscarriages</div>
            <div><span className="font-semibold">Living Children:</span> Number of living children</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// REFACTORED: Use props for pregnancyRows, addRow, and removeRow
const Step2 = ({ formData, handleChange, pregnancyRows, addRow, removeRow }) => {
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
              <label className="text-xs text-gray-500">Risk Level</label>
              <select
                name="risk_level"
                value={formData.risk_level || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm bg-gray-50"
              >
                <option value="">Select Risk Level</option>
                <option value="NORMAL">NORMAL</option>
                <option value="MID RISK">MID RISK</option>
                <option value="HIGH RISK">HIGH RISK</option>
              </select>
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

// REFACTORED: Use props for handling tables
const Step4 = ({ 
  formData, 
  handleChange, 
  inventoryItems, 
  onAddToQueue, 
  treatmentRows, 
  setTreatmentRows, 
  outcomeRows, 
  setOutcomeRows, 
  addTreatmentRow, 
  addOutcomeRow 
}) => {
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

  const calculateBMI = (height, weight) => {
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const handleTreatmentChange = (rowIndex, fieldKey, value) => {
    const fieldName = `treatment_${rowIndex}_${fieldKey}`;
    
    handleChange({ 
      target: { 
        name: fieldName, 
        value: value 
      } 
    });

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
  submitAsRequest = false,
  requesterId = null,
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

  // REFACTORED: Moved state to the parent component
  const [pregnancyRows, setPregnancyRows] = useState([{ gravida: 1 }]);
  const [treatmentRows, setTreatmentRows] = useState([{}]);
  const [outcomeRows, setOutcomeRows] = useState([{}]);

  const addPregnancyRow = () => setPregnancyRows([...pregnancyRows, { gravida: pregnancyRows.length + 1 }]);
  const removePregnancyRow = (index) => {
    if (pregnancyRows.length > 1) setPregnancyRows(pregnancyRows.filter((_, i) => i !== index));
  };
  
  const addTreatmentRow = () => setTreatmentRows([...treatmentRows, {}]);
  const addOutcomeRow = () => setOutcomeRows([...outcomeRows, {}]);

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

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const handleAddToQueue = (itemData) => {
    setDeductionQueue(prev => {
      const existingIndex = prev.findIndex(item => 
        item.itemId === itemData.itemId && item.fieldName === itemData.fieldName
      );
      
      if (existingIndex >= 0) {
        const newQueue = [...prev];
        newQueue[existingIndex] = itemData;
        return newQueue;
      } else {
        return [...prev, itemData];
      }
    });
    
    addNotification(`Added ${itemData.itemName} to deduction queue.`, 'info');
  };

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const loadPatientData = async () => {
        try {
          setLoading(true);
          
          const baseData = {
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
            sms_notifications_enabled: initialData.sms_notifications_enabled ?? true,
            blood_type: initialData.blood_type || "",
            dob: initialData.dob || "",
            family_folder_no: initialData.family_folder_no || "",
            nhts_no: initialData.nhts_no || "",
            philhealth_no: initialData.philhealth_no || "",
            allergy_history: initialData.allergy_history || "",
            family_planning_history: initialData.family_planning_history || "",
          };

          let pregnancyRowsCount = 1;
          let treatmentRowsCount = 1;
          let outcomeRowsCount = 1;

          const { data: scoreData } = await supabase
            .from('maternal_obstetrical_score')
            .select('*')
            .eq('mother_record_id', initialData.id)
            .single();

          if (scoreData) {
            baseData.g_score = scoreData.g_score || "";
            baseData.p_score = scoreData.p_score || "";
            baseData.term = scoreData.term || "";
            baseData.preterm = scoreData.preterm || "";
            baseData.abortion = scoreData.abortion || "";
            baseData.living_children = scoreData.living_children || "";
          }

          const { data: obstetricalData } = await supabase
            .from('maternal_obstetrical_history')
            .select('*')
            .eq('mother_record_id', initialData.id);

          if (obstetricalData && obstetricalData.length > 0) {
            pregnancyRowsCount = obstetricalData.length;
            const pregnancyRowsList = obstetricalData.map((record) => ({
              gravida: record.gravida
            }));
            setPregnancyRows(pregnancyRowsList);
            
            obstetricalData.forEach((record, index) => {
              baseData[`pregnancy_${index}_gravida`] = record.gravida || "";
              baseData[`pregnancy_${index}_outcome`] = record.outcome || "";
              baseData[`pregnancy_${index}_sex`] = record.sex || "";
              baseData[`pregnancy_${index}_delivery_type`] = record.delivery_type || "";
              baseData[`pregnancy_${index}_delivered_at`] = record.delivered_at || "";
            });
          }

          const { data: menstrualData } = await supabase
            .from('maternal_menstrual_history')
            .select('*')
            .eq('mother_record_id', initialData.id)
            .single();

          if (menstrualData) {
            baseData.lmp = menstrualData.lmp || "";
            baseData.edc = menstrualData.edc || "";
            baseData.age_of_menarche = menstrualData.age_of_menarche || "";
            baseData.menstruation_duration = menstrualData.menstruation_duration || "";
            baseData.bleeding_amount = menstrualData.bleeding_amount || "";
            baseData.age_first_period = menstrualData.age_first_period || "";
          }

          const { data: vaccinesData } = await supabase
            .from('maternal_vaccinations')
            .select('*')
            .eq('mother_record_id', initialData.id);

          if (vaccinesData) {
            vaccinesData.forEach(vac => {
              const vaccineKey = `vaccine_${vac.vaccine_type.toLowerCase()}`;
              baseData[vaccineKey] = vac.date_given || "";
            });
          }

          const { data: conditionsData } = await supabase
            .from('maternal_medical_conditions')
            .select('*')
            .eq('mother_record_id', initialData.id);

          if (conditionsData) {
            conditionsData.forEach(cond => {
              if (cond.condition_category === 'Personal') {
                baseData[`ph_${cond.condition_type}`] = cond.is_present || false;
              } else if (cond.condition_category === 'Hereditary') {
                baseData[`hdh_${cond.condition_type}`] = cond.is_present || false;
              } else if (cond.condition_category === 'Social') {
                baseData[`sh_${cond.condition_type}`] = cond.is_present || false;
              }
            });
          }

          const { data: treatmentsData } = await supabase
            .from('maternal_treatment_records')
            .select('*')
            .eq('mother_record_id', initialData.id)
            .order('visit_date', { ascending: true });

          if (treatmentsData && treatmentsData.length > 0) {
            treatmentRowsCount = treatmentsData.length;
            const treatmentRowsList = treatmentsData.map((record) => ({
              date: record.visit_date,
              height: record.height_cm,
              weight: record.weight_kg
            }));
            setTreatmentRows(treatmentRowsList);
            
            treatmentsData.forEach((record, index) => {
              baseData[`treatment_${index}_date`] = record.visit_date || "";
              baseData[`treatment_${index}_arrival`] = record.arrival_time || "";
              baseData[`treatment_${index}_departure`] = record.departure_time || "";
              baseData[`treatment_${index}_height`] = record.height_cm || "";
              baseData[`treatment_${index}_weight`] = record.weight_kg || "";
              baseData[`treatment_${index}_bp`] = record.bp || "";
              baseData[`treatment_${index}_muac`] = record.muac_cm || "";
              baseData[`treatment_${index}_bmi`] = record.bmi || "";
              baseData[`treatment_${index}_aog`] = record.aog_weeks || "";
              baseData[`treatment_${index}_fh`] = record.fh_cm || "";
              baseData[`treatment_${index}_fhb`] = record.fhb || "";
              baseData[`treatment_${index}_loc`] = record.loc || "";
              baseData[`treatment_${index}_presentation`] = record.presentation || "";
              baseData[`treatment_${index}_fe_fa`] = record.fe_fa || "";
              baseData[`treatment_${index}_admitted`] = record.admitted || "";
              baseData[`treatment_${index}_examined`] = record.examined || "";
            });
          }

          const { data: outcomesData } = await supabase
            .from('maternal_pregnancy_outcomes')
            .select('*')
            .eq('mother_record_id', initialData.id);

          if (outcomesData && outcomesData.length > 0) {
            outcomeRowsCount = outcomesData.length;
            const outcomeRowsList = outcomesData.map((record) => ({
              date_terminated: record.date_terminated,
              outcome: record.outcome
            }));
            setOutcomeRows(outcomeRowsList);
            
            outcomesData.forEach((record, index) => {
              baseData[`outcome_${index}_date_terminated`] = record.date_terminated || "";
              baseData[`outcome_${index}_delivery_type`] = record.delivery_type || "";
              baseData[`outcome_${index}_outcome`] = record.outcome || "";
              baseData[`outcome_${index}_sex`] = record.child_sex || "";
              baseData[`outcome_${index}_birth_weight`] = record.birth_weight_grams || "";
              baseData[`outcome_${index}_age_weeks`] = record.age_weeks || "";
              baseData[`outcome_${index}_place_of_birth`] = record.place_of_birth || "";
              baseData[`outcome_${index}_attended_by`] = record.attended_by || "";
            });
          }

          const { data: suppsData } = await supabase
            .from('maternal_supplementation')
            .select('*')
            .eq('mother_record_id', initialData.id);

          if (suppsData) {
            suppsData.forEach(sup => {
              if (sup.supplement_type === 'Iron') {
                baseData.iron_supp_date = sup.date_given || "";
                baseData.iron_supp_amount = sup.amount || "";
              } else if (sup.supplement_type === 'Vitamin A') {
                baseData.vitamin_a_date = sup.date_given || "";
                baseData.vitamin_a_amount = sup.amount || "";
              }
            });
          }

          // Set all state updates together to avoid timing issues
          setFormData(baseData);
          setPatientId(initialData.patient_id);
          
        } catch (error) {
          console.error("Error loading patient data for edit:", error);
          addNotification("Error loading patient data", "error");
        } finally {
          setLoading(false);
        }
      };

      loadPatientData();
    } else {
      setFormData({
        sms_notifications_enabled: true,
      });
      const generateNewId = async () => {
        const { count, error } = await supabase
          .from("mother_records")
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
  }, [mode, initialData, addNotification]);

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
    
    try {
      if (!submitAsRequest && deductionQueue.length > 0) {
        for (const item of deductionQueue) {
          const { data: currentItem, error: fetchError } = await supabase
            .from('inventory')
            .select('quantity, item_name')
            .eq('id', item.itemId)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (currentItem && currentItem.quantity >= item.deductQty) {
            const { error: invError } = await supabase
              .from('inventory')
              .update({ quantity: currentItem.quantity - item.deductQty })
              .eq('id', item.itemId);
            
            if (invError) throw invError;
            
            await logActivity(
              'Stock Deducted', 
              `Used ${item.deductQty} unit(s) of ${item.itemName} for patient ${patientId}`
            );
            
            addNotification(`Deducted ${item.deductQty} of ${item.itemName} from inventory`, 'success');
          } else {
            throw new Error(`Insufficient stock for ${item.itemName}. Available: ${currentItem?.quantity || 0}`);
          }
        }
      }

      const validRiskLevels = ['NORMAL', 'MID RISK', 'HIGH RISK'];
      const riskLevel = formData.risk_level && formData.risk_level.trim() !== "" ? formData.risk_level : null;
      
      const patientData = {
        patient_id: patientId,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        age: formData.age ? parseInt(formData.age) : null,
        contact_no: formData.contact_no,
        risk_level: riskLevel && validRiskLevels.includes(riskLevel) ? riskLevel : null,
        weeks: formData.weeks ? parseInt(formData.weeks) : null,
        last_visit: formData.last_visit || null,
        purok: formData.purok,
        street: formData.street,
        sms_notifications_enabled: formData.sms_notifications_enabled ?? true,
        blood_type: formData.blood_type || null,
        dob: formData.dob || null,
        family_folder_no: formData.family_folder_no || null,
        nhts_no: formData.nhts_no || null,
        philhealth_no: formData.philhealth_no || null,
        allergy_history: formData.allergy_history || null,
        family_planning_history: formData.family_planning_history || null,
      };

      if (submitAsRequest) {
        const requesterAccountId = requesterId || profile?.id || currentUser?.id;
        if (!requesterAccountId) {
          throw new Error("Unable to submit request: missing requester account.");
        }

        const requestPayload = {
          worker_id: requesterAccountId,
          request_type: mode === "edit" ? "Update" : "Add",
          target_table: "mother_records",
          target_record_id: mode === "edit" ? initialData.id : requesterAccountId,
          request_data: patientData,
          status: "Pending",
        };

        const { error: requestError } = await supabase
          .from("requestions")
          .insert([requestPayload]);

        if (requestError) {
          throw requestError;
        }

        addNotification(
          mode === "edit"
            ? "Patient update request submitted for approval."
            : "New patient request submitted for approval.",
          "success"
        );

        await logActivity(
          mode === "edit" ? "Patient Update Request" : "Patient Add Request",
          `${mode === "edit" ? "Requested update" : "Requested add"} for patient ${formData.first_name || ""} ${formData.last_name || ""} (${patientId})`
        );

        onSave();
        onClose();
        return;
      }

      let patientRecordId;
      
      if (mode === "edit") {
        const { error: updateError } = await supabase
          .from("mother_records")
          .update(patientData)
          .eq("id", initialData.id);
        
        if (updateError) throw updateError;
        patientRecordId = initialData.id;

        await Promise.all([
          supabase.from('maternal_obstetrical_score').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_obstetrical_history').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_menstrual_history').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_vaccinations').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_medical_conditions').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_treatment_records').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_pregnancy_outcomes').delete().eq('mother_record_id', patientRecordId),
          supabase.from('maternal_supplementation').delete().eq('mother_record_id', patientRecordId),
        ]);
      } else {
        const { data, error: insertError } = await supabase
          .from("mother_records")
          .insert([patientData])
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        patientRecordId = data.id;
      }

      if (formData.g_score || formData.p_score || formData.term || formData.preterm || formData.abortion || formData.living_children) {
        const { error: scoreError } = await supabase
          .from('maternal_obstetrical_score')
          .insert([{
            mother_record_id: patientRecordId,
            g_score: formData.g_score ? parseInt(formData.g_score) : null,
            p_score: formData.p_score ? parseInt(formData.p_score) : null,
            term: formData.term ? parseInt(formData.term) : null,
            preterm: formData.preterm ? parseInt(formData.preterm) : null,
            abortion: formData.abortion ? parseInt(formData.abortion) : null,
            living_children: formData.living_children ? parseInt(formData.living_children) : null,
          }]);
        
        if (scoreError) throw new Error(`Error inserting obstetrical score: ${scoreError.message}`);
      }

      const pregnancyHistory = [];
      for (let i = 0; i <= 10; i++) {
        const outcome = formData[`pregnancy_${i}_outcome`];
        if (outcome) {
          pregnancyHistory.push({
            mother_record_id: patientRecordId,
            gravida: formData[`pregnancy_${i}_gravida`] || `G${i + 1}`,
            outcome: outcome,
            sex: formData[`pregnancy_${i}_sex`] || null,
            delivery_type: formData[`pregnancy_${i}_delivery_type`] || null,
            delivered_at: formData[`pregnancy_${i}_delivered_at`] || null
          });
        }
      }
      
      if (pregnancyHistory.length > 0) {
        const { error: histError } = await supabase
          .from('maternal_obstetrical_history')
          .insert(pregnancyHistory);
        
        if (histError) throw new Error(`Error inserting pregnancy history: ${histError.message}`);
      }

      if (formData.lmp || formData.edc || formData.age_of_menarche || formData.menstruation_duration || formData.bleeding_amount || formData.age_first_period) {
        const menstrualData = {
          mother_record_id: patientRecordId,
          lmp: formData.lmp || null,
          edc: formData.edc || null,
          age_of_menarche: formData.age_of_menarche ? parseInt(formData.age_of_menarche) : null,
          menstruation_duration: formData.menstruation_duration ? parseInt(formData.menstruation_duration) : null,
          bleeding_amount: formData.bleeding_amount || null,
          age_first_period: formData.age_first_period ? parseInt(formData.age_first_period) : null
        };
        
        const { error: mensError } = await supabase
          .from('maternal_menstrual_history')
          .insert([menstrualData]);
        
        if (mensError) throw new Error(`Error inserting menstrual history: ${mensError.message}`);
      }

      const vaccines = [];
      ['tt1', 'tt2', 'tt3', 'tt4', 'tt5', 'fim'].forEach(vac => {
        const date = formData[`vaccine_${vac}`];
        if (date) {
          vaccines.push({
            mother_record_id: patientRecordId,
            vaccine_type: vac.toUpperCase(),
            date_given: date
          });
        }
      });
      
      if (vaccines.length > 0) {
        const { error: vacError } = await supabase
          .from('maternal_vaccinations')
          .insert(vaccines);
        
        if (vacError) throw new Error(`Error inserting vaccinations: ${vacError.message}`);
      }

      const conditions = [];
      
      ['Diabetes Mellitus (DM)', 'Asthma', 'Cardiovascular Disease (CVD)', 'Heart Disease', 'Goiter'].forEach(cond => {
        conditions.push({
          mother_record_id: patientRecordId,
          condition_type: cond,
          condition_category: 'Personal',
          is_present: formData[`ph_${cond}`] || false
        });
      });
      
      ['Hypertension (HPN)', 'Asthma', 'Heart Disease', 'Diabetes Mellitus', 'Goiter'].forEach(cond => {
        conditions.push({
          mother_record_id: patientRecordId,
          condition_type: cond,
          condition_category: 'Hereditary',
          is_present: formData[`hdh_${cond}`] || false
        });
      });
      
      ['Smoker', 'Ex-smoker', 'Second-hand Smoker', 'Alcohol Drinker', 'Substance Abuse'].forEach(cond => {
        conditions.push({
          mother_record_id: patientRecordId,
          condition_type: cond,
          condition_category: 'Social',
          is_present: formData[`sh_${cond}`] || false
        });
      });
      
      const { error: condError } = await supabase
        .from('maternal_medical_conditions')
        .insert(conditions);
      
      if (condError) throw new Error(`Error inserting medical conditions: ${condError.message}`);

      const treatments = [];
      for (let i = 0; i <= 5; i++) {
        const visitDate = formData[`treatment_${i}_date`];
        if (visitDate) {
          treatments.push({
            mother_record_id: patientRecordId,
            visit_date: visitDate,
            arrival_time: formData[`treatment_${i}_arrival`] || null,
            departure_time: formData[`treatment_${i}_departure`] || null,
            height_cm: formData[`treatment_${i}_height`] ? parseFloat(formData[`treatment_${i}_height`]) : null,
            weight_kg: formData[`treatment_${i}_weight`] ? parseFloat(formData[`treatment_${i}_weight`]) : null,
            bp: formData[`treatment_${i}_bp`] || null,
            muac_cm: formData[`treatment_${i}_muac`] ? parseFloat(formData[`treatment_${i}_muac`]) : null,
            bmi: formData[`treatment_${i}_bmi`] ? parseFloat(formData[`treatment_${i}_bmi`]) : null,
            aog_weeks: formData[`treatment_${i}_aog`] ? parseInt(formData[`treatment_${i}_aog`]) : null,
            fh_cm: formData[`treatment_${i}_fh`] ? parseFloat(formData[`treatment_${i}_fh`]) : null,
            fhb: formData[`treatment_${i}_fhb`] || null,
            loc: formData[`treatment_${i}_loc`] || null,
            presentation: formData[`treatment_${i}_presentation`] || null,
            fe_fa: formData[`treatment_${i}_fe_fa`] || null,
            admitted: formData[`treatment_${i}_admitted`] || null,
            examined: formData[`treatment_${i}_examined`] || null
          });
        }
      }
      
      if (treatments.length > 0) {
        const { error: treatError } = await supabase
          .from('maternal_treatment_records')
          .insert(treatments);
        
        if (treatError) throw new Error(`Error inserting treatment records: ${treatError.message}`);
      }

      const outcomes = [];
      for (let i = 0; i <= 3; i++) {
        const outcomeDate = formData[`outcome_${i}_date_terminated`];
        if (outcomeDate) {
          outcomes.push({
            mother_record_id: patientRecordId,
            date_terminated: outcomeDate,
            delivery_type: formData[`outcome_${i}_delivery_type`] || null,
            outcome: formData[`outcome_${i}_outcome`] || null,
            child_sex: formData[`outcome_${i}_sex`] || null,
            birth_weight_grams: formData[`outcome_${i}_birth_weight`] ? parseInt(formData[`outcome_${i}_birth_weight`]) : null,
            age_weeks: formData[`outcome_${i}_age_weeks`] ? parseInt(formData[`outcome_${i}_age_weeks`]) : null,
            place_of_birth: formData[`outcome_${i}_place_of_birth`] || null,
            attended_by: formData[`outcome_${i}_attended_by`] || null
          });
        }
      }
      
      if (outcomes.length > 0) {
        const { error: outError } = await supabase
          .from('maternal_pregnancy_outcomes')
          .insert(outcomes);
        
        if (outError) throw new Error(`Error inserting pregnancy outcomes: ${outError.message}`);
      }

      const supplements = [];
      if (formData.iron_supp_date) {
        supplements.push({
          mother_record_id: patientRecordId,
          supplement_type: 'Iron',
          date_given: formData.iron_supp_date,
          amount: formData.iron_supp_amount || null
        });
      }
      if (formData.vitamin_a_date) {
        supplements.push({
          mother_record_id: patientRecordId,
          supplement_type: 'Vitamin A',
          date_given: formData.vitamin_a_date,
          amount: formData.vitamin_a_amount || null
        });
      }
      
      if (supplements.length > 0) {
        const { error: supError } = await supabase
          .from('maternal_supplementation')
          .insert(supplements);
        
        if (supError) throw new Error(`Error inserting supplementation: ${supError.message}`);
      }

      addNotification(mode === 'edit' ? "Patient record updated successfully." : "New patient added successfully.", "success");
      
      await logActivity(
        mode === 'edit' ? 'Patient Updated' : 'New Patient Added',
        `${mode === 'edit' ? 'Updated' : 'Added'} patient ${formData.first_name} ${formData.last_name} (${patientId})`
      );
      
      onSave();
      onClose();
      
    } catch (err) {
      console.error("Error during save operation:", err);
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
                pregnancyRows={pregnancyRows}
                addRow={addPregnancyRow}
                removeRow={removePregnancyRow}
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
                treatmentRows={treatmentRows}
                setTreatmentRows={setTreatmentRows}
                outcomeRows={outcomeRows}
                setOutcomeRows={setOutcomeRows}
                addTreatmentRow={addTreatmentRow}
                addOutcomeRow={addOutcomeRow}
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
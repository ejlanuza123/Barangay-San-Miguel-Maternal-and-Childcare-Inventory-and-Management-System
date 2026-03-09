import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const ProfileIcon = () => ( <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg> );
const BackIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> );

// --- Inventory Input Component ---
const InventoryInput = ({ label, fieldName, value, onChange, inventoryCategory, inventoryItems, onAddToQueue, amountFieldName, amountValue }) => {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredItems = inventoryItems.filter(
    item => item.category === inventoryCategory && item.quantity > 0
  );

  console.log('InventoryInput filtered items:', {
    inventoryCategory,
    totalItems: inventoryItems.length,
    filteredItems: filteredItems.length,
    category: inventoryCategory
  });

  const searchedItems = searchTerm 
    ? filteredItems.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredItems;

  const handleDateSet = (dateVal) => {
    onChange({ target: { name: fieldName, value: dateVal } });
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    handleDateSet(today);
  };

  const handleItemSelect = (item) => {
    setSelectedItemId(item.id);
    setSearchTerm(item.item_name);
    setShowDropdown(false);
    
    const qtyToDeduct = parseInt(amountValue) || 1;
    console.log('Adding to deduction queue:', {
        itemId: item.id,
        itemName: item.item_name,
        deductQty: qtyToDeduct,
        category: inventoryCategory,
        dateGiven: value,
        fieldName: fieldName
    });

    onAddToQueue({
        itemId: item.id,
        itemName: item.item_name,
        deductQty: qtyToDeduct, 
        category: inventoryCategory,
        dateGiven: value, 
        fieldName: fieldName
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedItemId("");
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for item selection
    setTimeout(() => setShowDropdown(false), 200);
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
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 whitespace-nowrap"
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
            <div className="relative">
                <label className="block text-[10px] text-gray-500 mb-0.5">Search Medicine</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Type to search medicine..."
                    className="w-full p-1 border rounded text-xs bg-white"
                />
                {showDropdown && searchedItems.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg max-h-40 overflow-y-auto">
                        {searchedItems.map(item => (
                            <div
                                key={item.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100 last:border-b-0"
                                onClick={() => handleItemSelect(item)}
                            >
                                <div className="font-medium">{item.item_name}</div>
                                <div className="text-gray-500">Qty: {item.quantity}</div>
                            </div>
                        ))}
                    </div>
                )}
                {showDropdown && searchedItems.length === 0 && searchTerm && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg p-2 text-xs text-gray-500">
                        No medicines found matching "{searchTerm}"
                    </div>
                )}
                {showDropdown && searchedItems.length === 0 && !searchTerm && filteredItems.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg p-2 text-xs text-gray-500">
                        Start typing to search medicines...
                    </div>
                )}
                {filteredItems.length === 0 && (
                    <p className="text-[10px] text-orange-600 mt-1">
                        No {inventoryCategory.toLowerCase()} items available in inventory. Please add items to the Inventory first.
                    </p>
                )}
                {filteredItems.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                        Selecting an item will auto-deduct from inventory upon save.
                    </p>
                )}
            </div>
        )}
    </div>
  );
};

// --- Form Step Components ---

// STEP 1: Personal Information
const Step1 = ({ formData, handleChange, newChildId }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
        {/* LEFT COLUMN: QR Code */}
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
            <div className="w-32 h-32 bg-white rounded-md border p-1 flex items-center justify-center">
                {newChildId && newChildId.startsWith('C-') ? (
                    <QRCodeSVG value={newChildId} size={120} />
                ) : (
                    <div className="w-full h-full bg-gray-100 animate-pulse rounded-sm"></div>
                )}
            </div>
            <div className="text-center mt-2">
                <p className="font-bold text-gray-700">Child ID: {newChildId}</p>
                {newChildId.startsWith("C-") && (
                    <p className="text-xs text-gray-500">(Auto Generated)</p>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: Personal Information */}
        <div className="md:col-span-2 space-y-4">
            {/* BHS & Family Info */}
            <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-blue-50">
                <div>
                    <label className="text-xs text-gray-500">Name of BHS</label>
                    <input type="text" name="bhs_name" value={formData.bhs_name || 'San Miguel'} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Family Number</label>
                    <input type="text" name="family_number" value={formData.family_number || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                </div>
            </div>

            {/* Child's Information */}
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Child's Information</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                        <label className="text-xs text-gray-500">First Name</label>
                        <input type="text" name="first_name" value={formData.first_name || ""} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Last Name</label>
                        <input type="text" name="last_name" value={formData.last_name || ""} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Sex</label>
                        <select name="sex" value={formData.sex || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-gray-50" required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-xs text-gray-500">Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Time of Delivery</label>
                        <input type="time" name="delivery_time" value={formData.delivery_time || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Birth Weight (kg)</label>
                        <input type="number" step="0.1" name="birth_weight" value={formData.birth_weight || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                    </div>
                </div>
            </div>

            {/* Birth Details */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-gray-500">Place of Birth</label>
                    <input type="text" name="place_of_birth" value={formData.place_of_birth || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Place of Delivery</label>
                    <input type="text" name="place_of_delivery" value={formData.place_of_delivery || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Birth Order</label>
                    <input type="number" name="birth_order" value={formData.birth_order || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Type of Delivery</label>
                    <select name="delivery_type" value={formData.delivery_type || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm">
                        <option value="">Select</option>
                        <option value="Normal">Normal</option>
                        <option value="Cesarean">Cesarean</option>
                        <option value="Forceps">Forceps</option>
                        <option value="Vacuum">Vacuum</option>
                    </select>
                </div>
            </div>

            {/* ID Numbers */}
            <div className="p-3 border rounded-lg bg-gray-50">
                <h3 className="font-bold text-center text-sm mb-2">ID Numbers</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500">NHTS No.</label>
                        <input type="text" name="nhts_no" value={formData.nhts_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">PhilHealth No.</label>
                        <input type="text" name="philhealth_no" value={formData.philhealth_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);


// STEP 2: Parent/Guardian & Address Information
// STEP 2: Parent/Guardian & Address Information
const Step2 = ({ formData, handleChange }) => {
  const [motherSearchTerm, setMotherSearchTerm] = useState(formData.mother_name || '');
  const [filteredMothers, setFilteredMothers] = useState([]);
  const [showMotherDropdown, setShowMotherDropdown] = useState(false);
  const [loadingMothers, setLoadingMothers] = useState(false);
  
  // Purok options
  const purokOptions = [
    "Purok Bagong Silang Zone 1",
    "Purok Bagong Silang Zone 2",
    "Purok Masigla Zone 1",
    "Purok Masigla Zone 2",
    "Purok Masaya",
    "Purok Bagong Lipunan",
    "Purok Dagomboy",
    "Purok Katarungan Zone 1",
    "Purok Katarungan Zone 2",
    "Purok Pagkakaisa",
    "Purok Kilos-Agad",
    "Purok Balikatan",
    "Purok Bayanihan",
    "Purok Magkakapitbahay",
    "Purok Magara Zone 2"
  ];

  // Helper function to calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch mothers from patients table
  useEffect(() => {
    const fetchMothers = async () => {
      if (motherSearchTerm.length < 2) {
        setFilteredMothers([]);
        return;
      }

      setLoadingMothers(true);
      try {
        const { data, error } = await supabase
          .from('mother_records')
          .select('id, first_name, last_name, middle_name, contact_no, age, dob, purok')
          .or(`first_name.ilike.%${motherSearchTerm}%,last_name.ilike.%${motherSearchTerm}%,middle_name.ilike.%${motherSearchTerm}%`)
          .limit(10);

        if (!error && data) {
          setFilteredMothers(data);
        }
      } catch (error) {
        console.error('Error fetching mothers:', error);
      } finally {
        setLoadingMothers(false);
      }
    };

    const debounceTimer = setTimeout(fetchMothers, 300);
    return () => clearTimeout(debounceTimer);
  }, [motherSearchTerm]);

  const handleMotherSearchChange = (e) => {
    const value = e.target.value;
    setMotherSearchTerm(value);
    setShowMotherDropdown(true);
    
    // Update form data
    handleChange({
      target: {
        name: 'mother_name',
        value: value
      }
    });
  };

  const selectMother = (mother) => {
    setMotherSearchTerm(`${mother.first_name} ${mother.last_name}`);
    setShowMotherDropdown(false);
    setFilteredMothers([]);
    
    // Update form data with mother information
    const updatedFormData = { ...formData };
    
    // Set mother name
    updatedFormData.mother_name = `${mother.first_name} ${mother.last_name}`;
    
    // Calculate and set mother age from DOB if available, otherwise use stored age
    if (mother.dob) {
      const calculatedAge = calculateAge(mother.dob);
      if (calculatedAge !== null) {
        updatedFormData.mother_age = calculatedAge;
      }
    } else if (mother.age) {
      updatedFormData.mother_age = mother.age;
    }
    
    // Set contact number if available
    if (mother.contact_no) {
      updatedFormData.contact_no = mother.contact_no;
    }
    
    // Set purok if available (but let user override from dropdown)
    if (mother.purok) {
      updatedFormData.address = mother.purok;
    }
    
    // Update all form fields at once
    Object.keys(updatedFormData).forEach(key => {
      handleChange({
        target: {
          name: key,
          value: updatedFormData[key]
        }
      });
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700 mb-3">Parent/Guardian Information</h3>
      
      {/* Parent Information */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Mother's Name with Autocomplete */}
        <div className="relative">
          <label className="text-xs text-gray-500">Name of Mother</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="mother_name"
              value={motherSearchTerm}
              onChange={handleMotherSearchChange}
              onFocus={() => setShowMotherDropdown(true)}
              onBlur={() => setTimeout(() => setShowMotherDropdown(false), 200)}
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
              placeholder="Search for mother..."
            />
            
            {/* Loading indicator */}
            {loadingMothers && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {/* Dropdown Results */}
            {showMotherDropdown && filteredMothers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredMothers.map((mother) => (
                  <div
                    key={mother.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    onMouseDown={() => selectMother(mother)}
                  >
                    <div className="font-medium text-sm">
                      {mother.first_name} {mother.last_name}
                      {mother.middle_name && ` ${mother.middle_name}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {mother.age && `Age: ${mother.age}`}
                      {mother.contact_no && ` • Contact: ${mother.contact_no}`}
                      {mother.purok && ` • Purok: ${mother.purok}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No results message */}
            {showMotherDropdown && motherSearchTerm.length >= 2 && filteredMothers.length === 0 && !loadingMothers && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="px-3 py-2 text-sm text-gray-500">
                  No mothers found. You can type the name manually.
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Start typing to search existing mothers or type manually
          </p>
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Age of Mother</label>
          <input
            type="number"
            name="mother_age"
            value={formData.mother_age || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Name of Father</label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Contact Number</label>
          <input
            type="text"
            name="contact_no"
            value={formData.contact_no || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {/* Guardian Information */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 border rounded-lg bg-gray-50">
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Name of Guardian (if different)</label>
          <input type="text" name="guardian_name" value={formData.guardian_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Relationship</label>
          <input type="text" name="guardian_relationship" value={formData.guardian_relationship || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">Address Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Barangay/Purok/Sitio/Zone</label>
            <div className="relative">
              <select
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-sm bg-white appearance-none"
              >
                <option value="">Select Purok...</option>
                {purokOptions.map((purok, index) => (
                  <option key={index} value={purok}>
                    {purok}
                  </option>
                ))}
                <option value="Other">Other (specify below)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {/* Show text input if "Other" is selected */}
            {formData.address === 'Other' && (
              <div className="mt-2">
                <input
                  type="text"
                  name="other_address"
                  value={formData.other_address || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Please specify purok/address..."
                />
              </div>
            )}
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Nearest Known Establishment/Neighbor</label>
            <input
              type="text"
              name="nearest_landmark"
              value={formData.nearest_landmark || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="e.g., Beside sari-sari store, Near church, etc."
            />
          </div>
        </div>
      </div>

      {/* Health Information */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-xs text-gray-500">Date Referred for Newborn Screening</label>
          <input
            type="date"
            name="nbs_referral_date"
            value={formData.nbs_referral_date || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">NBS Done (Result)</label>
          <input
            type="text"
            name="nbs_result"
            value={formData.nbs_result || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
            placeholder="Enter result if available"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Attendant at Birth</label>
          <input
            type="text"
            name="birth_attendant"
            value={formData.birth_attendant || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
            placeholder="e.g., Doctor, Midwife, Traditional"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">AOG at Birth</label>
          <input
            type="text"
            name="aog_at_birth"
            value={formData.aog_at_birth || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-sm"
            placeholder="e.g., 40 weeks"
          />
        </div>
      </div>

      {/* Smoking History */}
      <div className="mt-4">
        <h3 className="font-semibold text-gray-700 mb-2">Parent/Guardian Smoking History</h3>
        <div className="flex gap-6 p-3 border rounded-md">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="smoking_history"
              value="Yes"
              checked={formData.smoking_history === 'Yes'}
              onChange={handleChange}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="smoking_history"
              value="No"
              checked={formData.smoking_history === 'No'}
              onChange={handleChange}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// STEP 3: Medical & Immunization Information
// STEP 3: Medical & Immunization Information
const Step3 = ({ formData, handleChange, inventoryItems, onAddToQueue }) => {
    // Helper function to calculate BMI
    const calculateBMI = (weight, height) => {
        if (!weight || !height || weight <= 0 || height <= 0) return null;
        const heightInMeters = parseFloat(height) / 100;
        const bmi = parseFloat(weight) / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    };

    // Auto-calculate BMI when weight or height changes
    useEffect(() => {
        if (formData.weight_kg && formData.height_cm) {
            const calculatedBMI = calculateBMI(formData.weight_kg, formData.height_cm);
            if (calculatedBMI && formData.bmi !== calculatedBMI) {
                handleChange({
                    target: {
                        name: 'bmi',
                        value: calculatedBMI
                    }
                });
            }
        }
    }, [formData.weight_kg, formData.height_cm]);
    const immunizations = [
        { id: 'bcg', label: 'BCG', required: true },
        { id: 'hepa_b', label: 'Hepa B w/In 24 hrs', required: true },
        { id: 'pentavalent_1', label: 'Pentavalent 1', required: true },
        { id: 'pentavalent_2', label: 'Pentavalent 2', required: true },
        { id: 'pentavalent_3', label: 'Pentavalent 3', required: true },
        { id: 'opv_1', label: 'OPV 1', required: true },
        { id: 'opv_2', label: 'OPV 2', required: true },
        { id: 'opv_3', label: 'OPV 3', required: true },
        { id: 'ipv_1', label: 'IPV 1', required: true },
        { id: 'ipv_2', label: 'IPV 2', required: true },
        { id: 'pcv_1', label: 'PCV 1', required: true },
        { id: 'pcv_2', label: 'PCV 2', required: true },
        { id: 'pcv_3', label: 'PCV 3', required: true },
        { id: 'mcv_1', label: 'MCV 1', required: true },
        { id: 'mcv_2', label: 'MCV 2', required: true },
        { id: 'fic', label: 'FIC', required: false }
    ];

    return (
        <div className="space-y-4">
            {/* Mother's Immunization Status */}
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Mother's Immunization Status</h3>
                <div className="grid grid-cols-7 gap-1 p-3 border rounded-md bg-gray-50 text-center text-xs">
                    <div className="font-bold text-left">Antigen</div>
                    {['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].map(h => <div key={h} className="font-bold">{h}</div>)}
                    <div className="font-semibold text-left">Date Given</div>
                    {['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].map(key => (
                        <div key={key}>
                            <input type="date" name={`mother_immunization_${key}`} value={formData[`mother_immunization_${key}`] || ''} onChange={handleChange} className="w-full p-1 border rounded text-[10px]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Exclusive Breastfeeding */}
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Exclusive Breastfeeding (Check if applicable)</h3>
                <div className="grid grid-cols-6 gap-1 p-3 border rounded-md bg-gray-50 text-center text-xs">
                    {['1st', '2nd', '3rd', '4th', '5th', '6th'].map((m, i) => (
                        <div key={i} className="space-y-1">
                            <div className="font-bold">{m} Month</div>
                            <label className="flex items-center justify-center">
                                <input type="checkbox" name={`breastfeeding_month_${i+1}`} checked={formData[`breastfeeding_month_${i+1}`] || false} onChange={handleChange} className="w-4 h-4" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Immunization Table with Admission/Departure */}
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Immunization Schedule</h3>
                <div className="overflow-x-auto border rounded-md max-h-80">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-1 border text-center" colSpan="2">Time</th>
                                <th className="p-1 border w-20">Immunization</th>
                                <th className="p-1 border w-20">Date Given</th>
                                <th className="p-1 border w-16">Age</th>
                                <th className="p-1 border w-16">Weight</th>
                                <th className="p-1 border w-16">Height</th>
                                <th className="p-1 border w-20">Nutritional</th>
                                <th className="p-1 border w-20">Admitted By</th>
                                <th className="p-1 border w-20">Immunized By</th>
                                <th className="p-1 border w-24">Next Visit</th>
                                <th className="p-1 border w-20">Remarks</th>
                            </tr>
                            <tr>
                                <th className="p-1 border text-[10px] text-center">Admission</th>
                                <th className="p-1 border text-[10px] text-center">Departure</th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                                <th className="p-1 border"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {immunizations.map((immunization, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    {/* Admission Time */}
                                    <td className="p-1 border">
                                        <input 
                                            type="time" 
                                            name={`immunization_${immunization.id}_admission`} 
                                            value={formData[`immunization_${immunization.id}_admission`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                        />
                                    </td>
                                    
                                    {/* Departure Time */}
                                    <td className="p-1 border">
                                        <input 
                                            type="time" 
                                            name={`immunization_${immunization.id}_departure`} 
                                            value={formData[`immunization_${immunization.id}_departure`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                        />
                                    </td>
                                    
                                    {/* Immunization Type */}
                                    <td className="p-1 border font-semibold">{immunization.label}</td>
                                    
                                    {/* Date Given */}
                                    <td className="p-1 border">
                                        <input 
                                            type="date" 
                                            name={`immunization_${immunization.id}_date`} 
                                            value={formData[`immunization_${immunization.id}_date`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                        />
                                    </td>
                                    
                                    {/* Age */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_age`} 
                                            value={formData[`immunization_${immunization.id}_age`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="e.g., 6 weeks" 
                                        />
                                    </td>
                                    
                                    {/* Weight */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_weight`} 
                                            value={formData[`immunization_${immunization.id}_weight`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="kg" 
                                        />
                                    </td>
                                    
                                    {/* Height */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_height`} 
                                            value={formData[`immunization_${immunization.id}_height`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="cm" 
                                        />
                                    </td>
                                    
                                    {/* Nutritional Status */}
                                    <td className="p-1 border">
                                        <select 
                                            name={`immunization_${immunization.id}_nutritional`} 
                                            value={formData[`immunization_${immunization.id}_nutritional`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]"
                                        >
                                            <option value="">Select</option>
                                            <option value="UW">UW</option>
                                            <option value="H">H</option>
                                            <option value="OW">OW</option>
                                            <option value="O">O</option>
                                        </select>
                                    </td>
                                    
                                    {/* Admitted By */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_admitted_by`} 
                                            value={formData[`immunization_${immunization.id}_admitted_by`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="Staff name" 
                                        />
                                    </td>
                                    
                                    {/* Immunized By */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_immunized_by`} 
                                            value={formData[`immunization_${immunization.id}_immunized_by`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="Nurse/Midwife" 
                                        />
                                    </td>
                                    
                                    {/* Next Visit */}
                                    <td className="p-1 border">
                                        <input 
                                            type="date" 
                                            name={`immunization_${immunization.id}_next_visit`} 
                                            value={formData[`immunization_${immunization.id}_next_visit`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                        />
                                    </td>
                                    
                                    {/* Remarks */}
                                    <td className="p-1 border">
                                        <input 
                                            type="text" 
                                            name={`immunization_${immunization.id}_remarks`} 
                                            value={formData[`immunization_${immunization.id}_remarks`] || ''} 
                                            onChange={handleChange} 
                                            className="w-full p-1 text-[10px]" 
                                            placeholder="Notes" 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Current Measurements */}
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Current Measurements</h3>
                <div className="grid grid-cols-3 gap-3 p-3 border rounded-md bg-gray-50">
                    <div>
                        <label className="text-xs text-gray-500">Weight (kg)</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            name="weight_kg" 
                            value={formData.weight_kg || ''} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded-md text-sm" 
                            placeholder="e.g., 5.5"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Height (cm)</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            name="height_cm" 
                            value={formData.height_cm || ''} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded-md text-sm" 
                            placeholder="e.g., 50.5"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">BMI (Auto-calculated)</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            name="bmi" 
                            value={formData.bmi || ''} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded-md text-sm bg-gray-100" 
                            placeholder="Auto-calculated"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Additional Medical Information */}
            <div className="mt-4">
                <InventoryInput 
                    label="Vitamin A Supplementation (200,000 IU)"
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
    );
};

// --- Helper function to determine nutrition status from BMI ---
const getNutritionStatus = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 14.5) return 'UW';
    if (bmiValue >= 14.5 && bmiValue < 17.5) return 'H';
    if (bmiValue >= 17.5 && bmiValue < 20) return 'OW';
    if (bmiValue >= 20) return 'O';
    return null;
};

export default function AddChildModal({ onClose, onSave, mode = 'add', initialData = null }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [childId, setChildId] = useState('Loading...');
    const { addNotification } = useNotification();
    const { profile } = useAuth();
    
    // Inventory related state
    const [inventoryItems, setInventoryItems] = useState([]);
    const [deductionQueue, setDeductionQueue] = useState([]);

    useEffect(() => {
        const generateNewId = async () => {
            const { count, error } = await supabase.from('child_records').select('*', { count: 'exact', head: true });
            if (error) {
                setChildId('Error');
            } else {
                const nextId = (count || 0) + 1;
                setChildId(`C-${String(nextId).padStart(3, '0')}`);
            }
        };

        if (mode === 'edit' && initialData) {
            setFormData({
                // Step 1 Data
                first_name: initialData.first_name || '',
                last_name: initialData.last_name || '',
                child_name: initialData.child_name || '',
                dob: initialData.dob || '',
                sex: initialData.sex || '',
                birth_weight: initialData.birth_weight || '',
                place_of_birth: initialData.place_of_birth || '',
                place_of_delivery: initialData.place_of_delivery || '',
                birth_order: initialData.birth_order || '',
                delivery_type: initialData.delivery_type || '',
                delivery_time: initialData.delivery_time || '',
                bhs_name: initialData.bhs_name || 'San Miguel',
                family_number: initialData.family_number || '',
                nhts_no: initialData.nhts_no || '',
                philhealth_no: initialData.philhealth_no || '',
                
                // Step 2 Data
                mother_name: initialData.mother_name || '',
                mother_age: initialData.mother_age || '',
                father_name: initialData.father_name || '',
                contact_no: initialData.contact_no || '',
                guardian_name: initialData.guardian_name || '',
                guardian_relationship: initialData.guardian_relationship || '',
                address: initialData.address || '',
                nearest_landmark: initialData.nearest_landmark || '',
                nbs_referral_date: initialData.nbs_referral_date || '',
                nbs_result: initialData.nbs_result || '',
                birth_attendant: initialData.birth_attendant || '',
                aog_at_birth: initialData.aog_at_birth || '',
                smoking_history: initialData.smoking_history || '',
                
                // Step 3 Data
                weight_kg: initialData.weight_kg || '',
                height_cm: initialData.height_cm || '',
                bmi: initialData.bmi || '',
                vitamin_a_date: initialData.vitamin_a_date || '',
                vitamin_a_amount: initialData.vitamin_a_amount || '',
                
                // Include any additional health_details
                ...initialData.health_details
            });
            setChildId(initialData.child_id);

            // Fetch related immunization, breastfeeding, and measurements data
            const fetchRelatedData = async () => {
                try {
                    // Fetch mother immunizations
                    const { data: motherImms } = await supabase
                        .from('child_mother_immunizations')
                        .select('*')
                        .eq('child_record_id', initialData.id);
                    
                    if (motherImms) {
                        const updatedFormData = { ...formData };
                        motherImms.forEach(imm => {
                            updatedFormData[`mother_immunization_${imm.immunization_type}`] = imm.date_given || '';
                        });
                        setFormData(prev => ({ ...prev, ...updatedFormData }));
                    }

                    // Fetch breastfeeding records
                    const { data: bfRecords } = await supabase
                        .from('child_breastfeeding')
                        .select('*')
                        .eq('child_record_id', initialData.id);
                    
                    if (bfRecords) {
                        const updatedFormData = { ...formData };
                        bfRecords.forEach(bf => {
                            if (bf.is_exclusive) {
                                updatedFormData[`breastfeeding_month_${bf.month_number}`] = true;
                            }
                        });
                        setFormData(prev => ({ ...prev, ...updatedFormData }));
                    }

                    // Fetch child immunizations
                    const { data: childImms } = await supabase
                        .from('child_immunizations')
                        .select('*')
                        .eq('child_record_id', initialData.id);
                    
                    if (childImms) {
                        const updatedFormData = { ...formData };
                        childImms.forEach(imm => {
                            updatedFormData[`immunization_${imm.immunization_type}_admission`] = imm.admission_time || '';
                            updatedFormData[`immunization_${imm.immunization_type}_departure`] = imm.departure_time || '';
                            updatedFormData[`immunization_${imm.immunization_type}_date`] = imm.date_given || '';
                            updatedFormData[`immunization_${imm.immunization_type}_age`] = imm.age || '';
                            updatedFormData[`immunization_${imm.immunization_type}_weight`] = imm.weight_kg || '';
                            updatedFormData[`immunization_${imm.immunization_type}_height`] = imm.height_cm || '';
                            updatedFormData[`immunization_${imm.immunization_type}_nutritional`] = imm.nutritional_status || '';
                            updatedFormData[`immunization_${imm.immunization_type}_admitted_by`] = imm.admitted_by || '';
                            updatedFormData[`immunization_${imm.immunization_type}_immunized_by`] = imm.immunized_by || '';
                            updatedFormData[`immunization_${imm.immunization_type}_next_visit`] = imm.next_visit || '';
                            updatedFormData[`immunization_${imm.immunization_type}_remarks`] = imm.remarks || '';
                        });
                        setFormData(prev => ({ ...prev, ...updatedFormData }));
                    }
                } catch (error) {
                    console.error('Error fetching related data:', error);
                }
            };

            fetchRelatedData();
        } else {
            generateNewId();
            // Initialize with empty form data for new records
            setFormData({
                // Step 1
                first_name: '',
                last_name: '',
                child_name: '',
                dob: '',
                sex: '',
                birth_weight: '',
                place_of_birth: '',
                place_of_delivery: '',
                birth_order: '',
                delivery_type: '',
                delivery_time: '',
                bhs_name: 'San Miguel',
                family_number: '',
                nhts_no: '',
                philhealth_no: '',
                
                // Step 2
                mother_name: '',
                mother_age: '',
                father_name: '',
                contact_no: '',
                guardian_name: '',
                guardian_relationship: '',
                address: '',
                nearest_landmark: '',
                nbs_referral_date: '',
                nbs_result: '',
                birth_attendant: '',
                aog_at_birth: '',
                smoking_history: '',
                
                // Step 3
                weight_kg: '',
                height_cm: '',
                bmi: '',
                vitamin_a_date: '',
                vitamin_a_amount: '',
            });
        }
    }, [mode, initialData]);

    // Fetch inventory items
    useEffect(() => {
        const fetchInventory = async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .or('owner_role.eq.BNS,owner_role.is.null,owner_role.eq.BHW')
                .order('item_name');
            
            if (!error && data) {
                console.log('Fetched inventory items for BNS:', data);
                setInventoryItems(data);
            } else {
                console.error('Error fetching inventory:', error);
            }
        };

        fetchInventory();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleAddToQueue = (deductionItem) => {
        setDeductionQueue(prev => {
            // Remove any existing item with the same fieldName to avoid duplicates
            const filtered = prev.filter(item => item.fieldName !== deductionItem.fieldName);
            return [...filtered, deductionItem];
        });
    };

    const handleSave = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        const nutritionStatus = getNutritionStatus(formData.bmi);
        const lastCheckupDate = new Date().toISOString().split('T')[0];
        
        // Helper function to convert empty strings to null for date fields
        const sanitizeValue = (value) => {
            return value === '' || value === undefined ? null : value;
        };
        
        try {
            // 1. Insert main child record
            const recordData = {
                child_id: childId, 
                first_name: formData.first_name,
                last_name: formData.last_name,
                child_name: formData.child_name,
                dob: sanitizeValue(formData.dob),
                sex: formData.sex, 
                birth_weight: sanitizeValue(formData.birth_weight),
                place_of_birth: formData.place_of_birth,
                place_of_delivery: formData.place_of_delivery,
                birth_order: sanitizeValue(formData.birth_order),
                delivery_type: formData.delivery_type,
                delivery_time: sanitizeValue(formData.delivery_time),
                mother_name: formData.mother_name, 
                father_name: formData.father_name,
                mother_age: sanitizeValue(formData.mother_age),
                contact_no: formData.contact_no,
                guardian_name: formData.guardian_name,
                guardian_relationship: formData.guardian_relationship,
                address: formData.address,
                nearest_landmark: formData.nearest_landmark,
                bhs_name: formData.bhs_name,
                family_number: formData.family_number,
                nhts_no: formData.nhts_no,
                philhealth_no: formData.philhealth_no,
                nbs_referral_date: sanitizeValue(formData.nbs_referral_date),
                nbs_result: formData.nbs_result,
                birth_attendant: formData.birth_attendant,
                aog_at_birth: formData.aog_at_birth,
                smoking_history: formData.smoking_history,
                nutrition_status: nutritionStatus,
                last_checkup: lastCheckupDate,
                weight_kg: sanitizeValue(formData.weight_kg),
                height_cm: sanitizeValue(formData.height_cm),
                bmi: sanitizeValue(formData.bmi),
                vitamin_a_date: sanitizeValue(formData.vitamin_a_date),
                vitamin_a_amount: formData.vitamin_a_amount
            };

            let childRecordId;
            
            if (mode === 'edit') {
                const { error: updateError } = await supabase
                    .from('child_records')
                    .update(recordData)
                    .eq('id', initialData.id);
                
                if (updateError) throw updateError;
                childRecordId = initialData.id;
            } else {
                const { data, error: insertError } = await supabase
                    .from('child_records')
                    .insert([recordData])
                    .select('id')
                    .single();
                
                if (insertError) throw insertError;
                childRecordId = data.id;
            }

            // 2. Insert mother's immunizations
            const motherImmunizations = [];
            ['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].forEach(imm => {
                const date = formData[`mother_immunization_${imm}`];
                if (date) {
                    motherImmunizations.push({
                        child_record_id: childRecordId,
                        immunization_type: imm,
                        date_given: date
                    });
                }
            });
            
            if (motherImmunizations.length > 0) {
                const { error: immError } = await supabase
                    .from('child_mother_immunizations')
                    .insert(motherImmunizations);
                
                if (immError) console.error("Error inserting mother immunizations:", immError);
            }

            // 3. Insert breastfeeding records
            const breastfeeding = [];
            for (let i = 1; i <= 6; i++) {
                if (formData[`breastfeeding_month_${i}`]) {
                    breastfeeding.push({
                        child_record_id: childRecordId,
                        month_number: i,
                        is_exclusive: true
                    });
                }
            }
            
            if (breastfeeding.length > 0) {
                const { error: bfError } = await supabase
                    .from('child_breastfeeding')
                    .insert(breastfeeding);
                
                if (bfError) console.error("Error inserting breastfeeding records:", bfError);
            }

            // 4. Insert child immunizations
            const immunizations = [];
            const immTypes = ['bcg', 'hepa_b', 'pentavalent_1', 'pentavalent_2', 'pentavalent_3', 
                            'opv_1', 'opv_2', 'opv_3', 'ipv_1', 'ipv_2', 
                            'pcv_1', 'pcv_2', 'pcv_3', 'mcv_1', 'mcv_2', 'fic'];
            
            immTypes.forEach(immType => {
                const date = formData[`immunization_${immType}_date`];
                if (date) {
                    immunizations.push({
                        child_record_id: childRecordId,
                        immunization_type: immType,
                        date_given: date,
                        age: formData[`immunization_${immType}_age`],
                        weight_kg: formData[`immunization_${immType}_weight`],
                        height_cm: formData[`immunization_${immType}_height`],
                        nutritional_status: formData[`immunization_${immType}_nutritional`],
                        admitted_by: formData[`immunization_${immType}_admitted_by`],
                        immunized_by: formData[`immunization_${immType}_immunized_by`],
                        next_visit: formData[`immunization_${immType}_next_visit`],
                        remarks: formData[`immunization_${immType}_remarks`],
                        admission_time: formData[`immunization_${immType}_admission`],
                        departure_time: formData[`immunization_${immType}_departure`]
                    });
                }
            });
            
            if (immunizations.length > 0) {
                const { error: immError } = await supabase
                    .from('child_immunizations')
                    .insert(immunizations);
                
                if (immError) console.error("Error inserting child immunizations:", immError);
            }

            // 5. Insert current measurements
            if (formData.weight_kg || formData.height_cm || formData.bmi) {
                const { error: measError } = await supabase
                    .from('child_measurements')
                    .insert([{
                        child_record_id: childRecordId,
                        measurement_date: lastCheckupDate,
                        weight_kg: formData.weight_kg,
                        height_cm: formData.height_cm,
                        bmi: formData.bmi,
                        nutrition_status: nutritionStatus,
                        recorded_by: user?.id
                    }]);
                
                if (measError) console.error("Error inserting measurements:", measError);
            }

            // 6. Insert child supplementation (Vitamin A)
            if (formData.vitamin_a_date) {
                const { error: supError } = await supabase
                    .from('child_supplementation')
                    .insert([{
                        child_record_id: childRecordId,
                        supplement_type: 'Vitamin A',
                        date_given: formData.vitamin_a_date,
                        amount: formData.vitamin_a_amount,
                        administered_by: user?.id
                    }]);
                
                if (supError) console.error("Error inserting supplementation:", supError);
            }

            // 7. Process inventory deductions
            if (deductionQueue.length > 0) {
                console.log('Processing deduction queue:', deductionQueue);
                for (const deduction of deductionQueue) {
                    // First fetch the current item to get its quantity
                    const { data: currentItem, error: fetchError } = await supabase
                        .from('inventory')
                        .select('quantity')
                        .eq('id', deduction.itemId)
                        .single();
                    
                    if (fetchError) {
                        console.error(`Error fetching current inventory for ${deduction.itemName}:`, fetchError);
                        continue;
                    }
                    
                    if (currentItem && currentItem.quantity >= deduction.deductQty) {
                        const { error: deductError } = await supabase
                            .from('inventory')
                            .update({
                                quantity: currentItem.quantity - deduction.deductQty,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', deduction.itemId);
                        
                        if (deductError) {
                            console.error(`Error deducting inventory for ${deduction.itemName}:`, deductError);
                        } else {
                            console.log(`Successfully deducted ${deduction.deductQty} of ${deduction.itemName}`);
                            // Log the inventory deduction using activity logger
                            await logActivity(
                                'Stock Deducted',
                                `Used ${deduction.deductQty} unit(s) of ${deduction.itemName} for Vitamin A supplementation - child ${formData.first_name} ${formData.last_name}`
                            );
                            
                            addNotification(`Deducted ${deduction.deductQty} of ${deduction.itemName} from inventory`, 'success');
                        }
                    } else {
                        console.error(`Insufficient quantity for ${deduction.itemName}. Available: ${currentItem?.quantity || 0}, Required: ${deduction.deductQty}`);
                        addNotification(`Insufficient stock for ${deduction.itemName}. Available: ${currentItem?.quantity || 0}`, 'error');
                    }
                }
            } else {
                console.log('No items in deduction queue');
            }

            const fullName = `${formData.first_name} ${formData.last_name}`.trim();
            if (mode === 'edit') {
                addNotification('Child record updated successfully.', 'success');
                logActivity('Child Record Updated', `Updated record for ${fullName}`);
            } else {
                addNotification('New child added successfully.', 'success');
                logActivity('New Child Added', `Registered ${fullName}`);
            }
            onSave();
            onClose();
            
        } catch (err) {
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const title = mode === 'edit' ? 'Edit Child Immunization Record' : 'New Child Immunization Record';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
                <motion.div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8 p-6 max-h-[85vh] flex flex-col"
                    initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-center relative mb-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="absolute left-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <BackIcon />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 text-center">{title}</h2>
                    </div>

                    {/* Step Progress */}
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3].map((stepNum) => (
                                <React.Fragment key={stepNum}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {stepNum}
                                    </div>
                                    {stepNum < 3 && <div className={`w-16 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-grow overflow-y-auto">
                        {step === 1 && <Step1 formData={formData} handleChange={handleChange} newChildId={childId} />}
                        {step === 2 && <Step2 formData={formData} handleChange={handleChange} />}
                        {step === 3 && <Step3 formData={formData} handleChange={handleChange} inventoryItems={inventoryItems} onAddToQueue={handleAddToQueue} />}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <div>
                            {step > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
                                >
                                    Previous
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {step === 1 && (
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            )}
                            
                            {step < 3 ? (
                                <button 
                                    type="button" 
                                    onClick={() => setStep(step + 1)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
                                >
                                    Next
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSave} 
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold disabled:bg-gray-400 hover:bg-green-700"
                                >
                                    {loading ? 'Saving...' : 'Submit Record'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
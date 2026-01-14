import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';

const ProfileIcon = () => ( <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg> );
const BackIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> );

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
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="text-xs text-gray-500">Name of Child</label>
                        <input type="text" name="child_name" value={formData.child_name || ""} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
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
          .from('patients')
          .select('id, first_name, last_name, middle_name, contact_no, age, purok')
          .or(`first_name.ilike.%${motherSearchTerm}%,last_name.ilike.%${motherSearchTerm}%,middle_name.ilike.%${motherSearchTerm}%`)
          .eq('is_deleted', false)
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
    
    // Set mother age if available
    if (mother.age) {
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
const Step3 = ({ formData, handleChange }) => {
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

            {/* Additional Medical Information */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                    <label className="text-xs text-gray-500">Vitamin A Supplementation</label>
                    <div className="flex gap-2">
                        <input type="date" name="vitamin_a_date" value={formData.vitamin_a_date || ''} onChange={handleChange} className="w-1/2 p-2 border rounded-md text-sm" />
                        <input type="text" name="vitamin_a_amount" value={formData.vitamin_a_amount || ''} onChange={handleChange} className="w-1/2 p-2 border rounded-md text-sm" placeholder="Amount" />
                    </div>
                </div>
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
                vitamin_a_date: initialData.vitamin_a_date || '',
                vitamin_a_amount: initialData.vitamin_a_amount || '',
                
                // Include any additional health_details
                ...initialData.health_details
            });
            setChildId(initialData.child_id);
        } else {
            generateNewId();
            // Initialize with empty form data for new records
            setFormData({
                // Step 1
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
                vitamin_a_date: '',
                vitamin_a_amount: '',
            });
        }
    }, [mode, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        const childName = formData.child_name || '';
        const nutritionStatus = getNutritionStatus(formData.bmi);
        const lastCheckupDate = new Date().toISOString().split('T')[0];
        
        const recordData = {
            child_id: childId, 
            child_name: childName,
            dob: formData.dob,
            sex: formData.sex, 
            birth_weight: formData.birth_weight,
            place_of_birth: formData.place_of_birth,
            place_of_delivery: formData.place_of_delivery,
            birth_order: formData.birth_order,
            delivery_type: formData.delivery_type,
            delivery_time: formData.delivery_time,
            mother_name: formData.mother_name, 
            father_name: formData.father_name,
            mother_age: formData.mother_age,
            contact_no: formData.contact_no,
            guardian_name: formData.guardian_name,
            guardian_relationship: formData.guardian_relationship,
            address: formData.address,
            nearest_landmark: formData.nearest_landmark,
            bhs_name: formData.bhs_name,
            family_number: formData.family_number,
            nhts_no: formData.nhts_no,
            philhealth_no: formData.philhealth_no,
            nbs_referral_date: formData.nbs_referral_date,
            nbs_result: formData.nbs_result,
            birth_attendant: formData.birth_attendant,
            aog_at_birth: formData.aog_at_birth,
            smoking_history: formData.smoking_history,
            vitamin_a_date: formData.vitamin_a_date,
            vitamin_a_amount: formData.vitamin_a_amount,
            nutrition_status: nutritionStatus,
            last_checkup: lastCheckupDate, 
            health_details: formData // Stores ALL form fields
        };

        let result;
        if (mode === 'edit') {
            result = await supabase
                .from('child_records')
                .update(recordData)
                .eq('id', initialData.id);
        } else {
            result = await supabase.from('child_records').insert([recordData]);
        }

        if (result.error) {
            addNotification(`Error: ${result.error.message}`, 'error');
        } else {
            if (mode === 'edit') {
                addNotification('Child record updated successfully.', 'success');
                logActivity('Child Record Updated', `Updated record for ${childName}`);
            } else {
                addNotification('New child added successfully.', 'success');
                logActivity('New Child Added', `Registered ${childName}`);
            }
            onSave();
            onClose();
        }
        setLoading(false);
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
                        {step === 3 && <Step3 formData={formData} handleChange={handleChange} />}
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
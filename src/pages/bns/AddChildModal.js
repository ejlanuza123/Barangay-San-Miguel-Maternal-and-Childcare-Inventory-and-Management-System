import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../../services/activityLogger';
import { useNotification } from '../../context/NotificationContext';

const ProfileIcon = () => ( <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg> );
const BackIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> );

// --- Form Step Components ---
const Step1 = ({ formData, handleChange, newChildId }) => (
    <div className="space-y-4">
        <div className="flex items-start gap-6">
            <div className="flex-shrink-0 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-md border flex items-center justify-center"><ProfileIcon /></div>
                <p className="font-bold text-gray-700 mt-2">Child ID: {newChildId}</p>
                <p className="text-xs text-gray-500">(Auto Generated)</p>
            </div>
            <div className="flex-grow grid grid-cols-2 gap-4">
                <div><label className="text-sm">Name of BHS</label><input type="text" name="bhs_name" value={formData.bhs_name || 'San Miguel'} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                <div><label className="text-sm">Name of Child</label><input type="text" name="child_name" value={formData.child_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required /></div>
                <div><label className="text-sm">Date of Birth</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required /></div>
                <div><label className="text-sm">Sex</label><select name="sex" value={formData.sex || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" required><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div className="col-span-2"><label className="text-sm">Place of Birth</label><input type="text" name="place_of_birth" value={formData.place_of_birth || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                <div className="col-span-2"><label className="text-sm">Name of Mother</label><input type="text" name="mother_name" value={formData.mother_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                <div className="col-span-2"><label className="text-sm">Name of Father</label><input type="text" name="father_name" value={formData.father_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                <div className="col-span-2"><label className="text-sm">Name of Guardian</label><input type="text" name="guardian_name" value={formData.guardian_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
            </div>
            <div className="w-1/4 space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-bold text-center">ID Numbers</h3>
                <div><label className="text-sm">NHTS No.</label><input type="text" name="nhts_no" value={formData.nhts_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                <div><label className="text-sm">PhilHealth No.</label><input type="text" name="philhealth_no" value={formData.philhealth_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                
                <div className="border-t pt-4">
                    <h3 className="font-bold text-center mb-4">Measurements</h3>
                    <div><label className="text-sm">Weight (kg)</label><input type="number" step="0.1" name="weight_kg" value={formData.weight_kg || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="text-sm">Height (cm)</label><input type="number" step="0.1" name="height_cm" value={formData.height_cm || ''} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="text-sm">Body Mass Index (BMI)</label><input type="text" name="bmi" value={formData.bmi || ''} readOnly className="w-full p-2 border rounded-md bg-gray-200 cursor-not-allowed" /></div>
                </div>
            </div>
        </div>
    </div>
);

const Step2 = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <div>
            <h3 className="font-semibold text-gray-700 mb-2">Mother's Immunization Status</h3>
            <div className="grid grid-cols-6 gap-4 p-4 border rounded-md">
                {['Td1', 'Td2', 'Td3', 'Td4', 'Td5', 'FIM'].map(antigen => (
                    <div key={antigen}>
                        <label className="block text-center text-sm font-medium">{antigen}</label>
                        <input type="date" name={`mother_immunization_${antigen}`} value={formData[`mother_immunization_${antigen}`] || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md text-sm"/>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h3 className="font-semibold text-gray-700 mb-2">Exclusive Breastfeeding</h3>
            <div className="flex gap-4 p-4 border rounded-md">
                {['1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', '6th Month'].map(month => (
                    <label key={month} className="flex items-center space-x-2">
                        <input type="checkbox" name={`breastfeeding_${month.replace(' ', '_')}`} checked={formData[`breastfeeding_${month.replace(' ', '_')}`] || false} onChange={handleChange} />
                        <span className="text-sm">{month}</span>
                    </label>
                ))}
            </div>
        </div>
         <div>
            <h3 className="font-semibold text-gray-700 mb-2">Vitamin A (Date Given)</h3>
            <input type="date" name="vitamin_a_date" value={formData.vitamin_a_date || ''} onChange={handleChange} className="w-full max-w-xs p-2 border rounded-md text-sm" />
        </div>
    </div>
);

// --- NEW: Helper function to determine nutrition status from BMI ---
const getNutritionStatus = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 14.5) return 'UW';
    if (bmiValue >= 14.5 && bmiValue < 17.5) return 'H';
    if (bmiValue >= 17.5 && bmiValue < 20) return 'OW';
    if (bmiValue >= 20) return 'O';
    return null; // Return null if BMI is not in a valid range
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
            setFormData(initialData.health_details || {});
            setChildId(initialData.child_id);
        } else {
            generateNewId();
        }
    }, [mode, initialData]);

    // NEW: useEffect to automatically calculate BMI
    useEffect(() => {
        const weight = parseFloat(formData.weight_kg);
        const height = parseFloat(formData.height_cm);

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const bmiValue = weight / (heightInMeters * heightInMeters);
            // Update formData with the calculated BMI, rounded to one decimal place
            setFormData(prev => ({ ...prev, bmi: bmiValue.toFixed(1) }));
        }
    }, [formData.weight_kg, formData.height_cm]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        setLoading(true);
        
        const [firstName, ...lastNameParts] = (formData.child_name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        
        // --- MODIFIED: Automatically determine status and update checkup date ---
        const nutritionStatus = getNutritionStatus(formData.bmi);
        const lastCheckupDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        
        const recordData = {
            child_id: childId,
            first_name: firstName,
            last_name: lastName,
            dob: formData.dob,
            sex: formData.sex,
            mother_name: formData.mother_name,
            guardian_name: formData.guardian_name,
            weight_kg: formData.weight_kg || null,
            height_cm: formData.height_cm || null,
            bmi: formData.bmi || null,
            nhts_no: formData.nhts_no || null,
            philhealth_no: formData.philhealth_no || null,
            nutrition_status: nutritionStatus, // Add the calculated status
            last_checkup: lastCheckupDate, // Add the current date as the last checkup
            health_details: formData
        };

        let result;
        if (mode === 'edit') {
            result = await supabase.from('child_records').update(recordData).eq('id', initialData.id);
        } else {
            result = await supabase.from('child_records').insert([recordData]);
        }

        if (result.error) {
            addNotification(`Error: ${result.error.message}`, 'error');
        } else {
            const successMsg = mode === 'edit' ? 'Child record updated successfully.' : 'New child added successfully.';
            addNotification(successMsg, 'success');
            logActivity(mode === 'edit' ? 'Child Record Updated' : 'New Child Added', `ID: ${childId}, Name: ${formData.child_name}`);
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
                    className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-12 p-6"
                    initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                >
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
                    <div className="py-4">
                        {step === 1 && <Step1 formData={formData} handleChange={handleChange} newChildId={childId} />}
                        {step === 2 && <Step2 formData={formData} handleChange={handleChange} />}
                    </div>
                        <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t">
                            {/* Show Cancel button on Step 1 */}
                            {step === 1 && <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Cancel</button>}
                            
                            {/* Show Previous button on Step 2 */}
                            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Previous</button>}
                            
                            {/* Show Next Page button on Step 1 */}
                            {step < 2 && <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Next Page</button>}
                            
                            {/* Show Submit button on Step 2 */}
                            {step === 2 && (
                                <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold disabled:bg-gray-400">
                                    {loading ? 'Saving...' : 'Submit'}
                                </button>
                            )}
                        </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
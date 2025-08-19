import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Icon for Profile Placeholder ---
const ProfileIcon = () => (
    <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);


// --- Helper Components for Each Step of the Form ---

const Step1 = ({ formData, handleChange, newPatientId }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
        {/* Left Column: Patient Avatar and ID */}
        <div className="md:col-span-1 flex flex-col items-center mb-6 md:mb-0">
            <div className="w-32 h-32 bg-gray-100 rounded-md border flex items-center justify-center">
                <ProfileIcon />
            </div>
            <div className="text-center mt-2">
                <p className="font-bold text-gray-700">Patient ID: {newPatientId}</p>
                <p className="text-xs text-gray-500">(Patient ID Auto Generated)</p>
            </div>
        </div>

        {/* Right Column: All Form Fields */}
        <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <h3 className="font-semibold text-gray-700 mb-2">Personal Information</h3>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <div><label className="text-xs text-gray-500">Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                        <div><label className="text-xs text-gray-500">First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                        <div><label className="text-xs text-gray-500">Middle Name</label><input type="text" name="middle_name" value={formData.middle_name || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs text-gray-500">Date of Birth</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                        <div><label className="text-xs text-gray-500">Blood Type</label><select name="blood_type" value={formData.blood_type || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-gray-50"><option>Select Blood Type</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
                        <div><label className="text-xs text-gray-500">Age</label><input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    </div>
                </div>

                <div className="border rounded-lg p-3 sm:col-span-2">
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">ID Numbers</h3>
                     <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">NHTS No.</label><input type="text" name="nhts_no" value={formData.nhts_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                        <div><label className="text-xs text-gray-500">PhilHealth No.</label><input type="text" name="philhealth_no" value={formData.philhealth_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-gray-500">Family Folder No.</label><input type="text" name="family_folder_no" value={formData.family_folder_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Contact No.</label><input type="text" name="contact_no" value={formData.contact_no || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-gray-500">Purok</label><input type="text" name="purok" value={formData.purok || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Street</label><input type="text" name="street" value={formData.street || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                </div>
            </div>
             <div>
                <h3 className="font-semibold text-gray-700 mb-2">Obstetrical Score</h3>
                <div className="grid grid-cols-6 gap-2">
                    <div><label className="text-xs text-gray-500">G</label><input type="number" name="g_score" value={formData.g_score || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">P</label><input type="number" name="p_score" value={formData.p_score || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Term</label><input type="number" name="term" value={formData.term || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Preterm</label><input type="number" name="preterm" value={formData.preterm || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Abortion</label><input type="number" name="abortion" value={formData.abortion || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                    <div><label className="text-xs text-gray-500">Living Children</label><input type="number" name="living_children" value={formData.living_children || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" /></div>
                </div>
            </div>
        </div>
    </div>
);

const Step2 = ({ formData, handleChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
            <h3 className="font-semibold text-gray-700 mb-2">Pregnancy History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                        <tr>{['Gravida', 'Outcome', 'Sex', 'NSD/CS', 'Delivered At'].map(h => <th key={h} className="p-2 border font-medium text-xs">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(g => (
                            <tr key={g}>
                                <td className="p-1 border text-center font-semibold text-gray-600">G{g}</td>
                                <td className="p-1 border"><input type="text" name={`g${g}_outcome`} value={formData[`g${g}_outcome`] || ''} onChange={handleChange} className="w-full p-1 border-none text-xs focus:ring-0"/></td>
                                <td className="p-1 border"><input type="text" name={`g${g}_sex`} value={formData[`g${g}_sex`] || ''} onChange={handleChange} className="w-full p-1 border-none text-xs focus:ring-0"/></td>
                                <td className="p-1 border"><input type="text" name={`g${g}_delivery_type`} value={formData[`g${g}_delivery_type`] || ''} onChange={handleChange} className="w-full p-1 border-none text-xs focus:ring-0"/></td>
                                <td className="p-1 border"><input type="text" name={`g${g}_delivered_at`} value={formData[`g${g}_delivered_at`] || ''} onChange={handleChange} className="w-full p-1 border-none text-xs focus:ring-0"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="md:col-span-2 space-y-4">
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Past Menstrual Period</h3>
                <div className="space-y-2">
                    <div><label className="text-xs text-gray-500">Last Menstrual Period (LMP)</label><input type="date" name="lmp" value={formData.lmp || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                    <div><label className="text-xs text-gray-500">Risk Code</label><input type="text" name="risk_code" value={formData.risk_code || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                    <div><label className="text-xs text-gray-500">Expected Date of Confinement (EDC)</label><input type="date" name="edc" value={formData.edc || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                    <div><label className="text-xs text-gray-500">Age of First Period</label><input type="number" name="age_first_period" value={formData.age_first_period || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">OB History</h3>
                <div className="space-y-2">
                    <div><label className="text-xs text-gray-500">Age of Menarche</label><input type="number" name="age_of_menarche" value={formData.age_of_menarche || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                    <div><label className="text-xs text-gray-500">Amount of Bleeding</label><select name="bleeding_amount" value={formData.bleeding_amount || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-gray-50"><option>Select amount</option><option>Scanty</option><option>Moderate</option><option>Heavy</option></select></div>
                    <div><label className="text-xs text-gray-500">Duration of Menstruation (days)</label><input type="number" name="menstruation_duration" value={formData.menstruation_duration || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-sm"/></div>
                </div>
            </div>
        </div>
    </div>
);

const Step3 = ({ formData, handleChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Vaccination Record</h3>
                <div className="space-y-2">
                    {['TT1', 'TT2', 'TT3', 'TT4', 'TT5', 'FIM'].map(vaccine => (
                        <div key={vaccine} className="flex items-center justify-between">
                            <label className="text-sm text-gray-600">{vaccine}</label>
                            <input type="date" name={`vaccine_${vaccine.toLowerCase()}`} value={formData[`vaccine_${vaccine.toLowerCase()}`] || ''} onChange={handleChange} className="w-40 p-2 border rounded-md text-sm"/>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Personal History</h3>
                <div className="space-y-1">
                    {['Diabetes Mellitus (DM)', 'Asthma', 'Cardiovascular Disease (CVD)', 'Heart Disease', 'Goiter'].map(h => 
                        <div key={h} className="flex items-center"><input type="checkbox" name={`ph_${h}`} checked={formData[`ph_${h}`] || false} onChange={handleChange} className="mr-2"/> <label className="text-sm">{h}</label></div>
                    )}
                </div>
            </div>
        </div>
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">History of Allergy and Drugs</h3>
                <textarea name="allergy_history" value={formData.allergy_history || ''} onChange={handleChange} rows="5" className="w-full p-2 border rounded-md text-sm"></textarea>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Hereditary Disease History</h3>
                 <div className="space-y-1">
                    {['Hypertension (HPN)', 'Asthma', 'Heart Disease', 'Diabetes Mellitus', 'Goiter'].map(h => 
                        <div key={h} className="flex items-center"><input type="checkbox" name={`hdh_${h}`} checked={formData[`hdh_${h}`] || false} onChange={handleChange} className="mr-2"/> <label className="text-sm">{h}</label></div>
                    )}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Social History</h3>
                <div className="space-y-1">
                    {['Smoker', 'Ex-smoker', 'Second-hand Smoker', 'Alcohol Drinker', 'Substance Abuse'].map(h => 
                        <div key={h} className="flex items-center"><input type="checkbox" name={`sh_${h}`} checked={formData[`sh_${h}`] || false} onChange={handleChange} className="mr-2"/> <label className="text-sm">{h}</label></div>
                    )}
                </div>
            </div>
        </div>
        <div>
            <h3 className="font-semibold text-gray-700 mb-2">Family Planning History</h3>
            <textarea name="family_planning_history" value={formData.family_planning_history || ''} onChange={handleChange} rows="5" placeholder="Enter FP Method previously used" className="w-full p-2 border rounded-md text-sm"></textarea>
        </div>
    </div>
);


export default function AddPatientModal({ onClose, onSave }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newPatientId, setNewPatientId] = useState('Loading...');

    useEffect(() => {
        const generateNewId = async () => {
            const { count, error } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error("Error fetching patient count:", error);
                setNewPatientId('Error');
            } else {
                const nextId = (count || 0) + 1;
                const formattedId = `P-${String(nextId).padStart(3, '0')}`;
                setNewPatientId(formattedId);
            }
        };
        generateNewId();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        const { error } = await supabase.from('patients').insert([{
            patient_id: newPatientId,
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            age: formData.age,
            contact_no: formData.contact_no,
            medical_history: formData,
        }]);

        if (error) {
            setError(error.message);
        } else {
            onSave();
            onClose();
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
                <motion.div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-12 p-6"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h2 className="text-lg font-semibold text-gray-700">New Patient Record</h2>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-1">PARENTAL INDIVIDUAL TREATMENT RECORD</h2>
                    <p className="text-sm text-gray-500 text-center mb-4">Page {step} of 3</p>
                    
                    <div className="py-4">
                        {step === 1 && <Step1 formData={formData} handleChange={handleChange} newPatientId={newPatientId} />}
                        {step === 2 && <Step2 formData={formData} handleChange={handleChange} />}
                        {step === 3 && <Step3 formData={formData} handleChange={handleChange} />}
                    </div>

                    <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t">
                        {step > 1 && <button onClick={prevStep} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Previous</button>}
                        {step < 3 && <button onClick={nextStep} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Next Page</button>}
                        {step === 3 && (
                            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold">
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        )}
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
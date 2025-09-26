// src/components/reusables/QRCodeModal.js
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// This component displays the patient's QR code and prepares it for printing.
export default function QRCodeModal({ patient, onClose }) {
    if (!patient) return null;

    const handlePrint = () => {
        window.print(); // Triggers the browser's print dialog
    };

    return (
        <>
            {/* This style block uses CSS to hide everything except the modal when printing */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #qr-code-modal, #qr-code-modal * {
                            visibility: visible;
                        }
                        #qr-code-modal {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                    }
                `}
            </style>

            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                <div id="qr-code-modal" className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-8 text-center flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">
                        {`${patient.first_name} ${patient.last_name}`}
                    </h3>
                    <p className="text-gray-600 mb-4">Patient ID: {patient.patient_id}</p>
                    
                    {/* This is the QR Code component from the library */}
                    <QRCodeSVG 
                        value={patient.patient_id} // The data to encode
                        size={256}                 // The size of the QR code
                        level={"H"}                // Error correction level
                        includeMargin={true}
                    />

                    <p className="text-xs text-gray-400 mt-4">
                        Scan this code with the mobile app to quickly access the patient's records.
                    </p>

                    <div className="flex gap-4 mt-6 w-full">
                         <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
                        >
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
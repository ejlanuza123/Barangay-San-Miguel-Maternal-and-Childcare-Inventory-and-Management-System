// src/components/reusables/PatientQRCode.js
import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';

// --- Icon for the button ---
const DownloadIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v13"></path></svg>;

export default function PatientQRCode({ patient }) {
    const qrRef = useRef(null);

    const handleDownload = () => {
        // Find the canvas element rendered by the QRCode component
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
            // Convert the canvas to a PNG image file
            canvas.toBlob((blob) => {
                // Use file-saver to trigger a download
                saveAs(blob, `${patient.patient_id}_QR_Code.png`);
            });
        }
    };

    return (
        <div className="text-center p-4 border rounded-lg bg-gray-50 shadow">
            <h3 className="font-bold text-center mb-2">Patient QR Code</h3>
            
            {/* We use QRCodeCanvas because it's easy to convert to an image */}
            <div ref={qrRef} className="flex justify-center">
                <QRCodeCanvas 
                    value={patient.patient_id}
                    size={160}
                    level={"H"}
                    includeMargin={true}
                />
            </div>

            <button
                onClick={handleDownload}
                className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
                <DownloadIcon />
                Download QR
            </button>
        </div>
    );
}
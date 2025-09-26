// src/components/reusables/PatientQRCodeModal.js
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// This new modal component will display the QR code and handle the download
export default function PatientQRCodeModal({ patient, onClose }) {
    if (!patient) return null;

    const handleDownload = () => {
        // Find the SVG element rendered by the QR code component
        const svg = document.getElementById('patient-qr-code');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                
                // Create a link and trigger the download
                const downloadLink = document.createElement("a");
                downloadLink.href = pngFile;
                downloadLink.download = `${patient.patient_id}_QR_Code.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-xs p-6 text-center">
                <h3 className="text-lg font-bold mb-2">
                    {`${patient.first_name} ${patient.last_name}`}
                </h3>
                <p className="text-sm text-gray-500 mb-4">Patient ID: {patient.patient_id}</p>
                
                {/* The QR Code, with an ID so we can select it for download */}
                <QRCodeSVG 
                    id="patient-qr-code"
                    value={patient.patient_id}
                    size={200}
                    level={"H"}
                />

                <div className="flex gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Close</button>
                    <button onClick={handleDownload} className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg">Download</button>
                </div>
            </div>
        </div>
    );
}
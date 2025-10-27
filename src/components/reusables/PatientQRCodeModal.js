// src/components/reusables/PatientQRCodeModal.js
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { saveAs } from "file-saver";

// MODIFIED: This modal is now generic and can handle different record types
export default function PatientQRCodeModal({
  subject,
  idKey,
  idLabel,
  onClose,
}) {
  if (!subject) return null;

  const idValue = subject[idKey];
  const nameValue = `${subject.first_name || ""} ${subject.last_name || ""}`;

  const handleDownload = () => {
    const svg = document.getElementById("generic-qr-code-svg");
    if (svg) {
      // Temporarily add a white background for the PNG conversion
      const bgRect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      bgRect.setAttribute("width", "100%");
      bgRect.setAttribute("height", "100%");
      bgRect.setAttribute("fill", "white");
      svg.prepend(bgRect);

      const svgData = new XMLSerializer().serializeToString(svg);

      // Remove the temporary background
      svg.removeChild(bgRect);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx.drawImage(img, 0, 0, 256, 256);
        canvas.toBlob((blob) => {
          saveAs(blob, `${nameValue.replace(/ /g, "_")}_QR_Code.png`);
        });
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xs p-6 text-center">
        <h3 className="text-lg font-bold mb-2">{nameValue}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {idLabel}: {idValue}
        </p>

        {/* --- MODIFICATION --- */}
        {/* Added a flex container to center the QR code */}
        <div className="flex justify-center">
          <QRCodeSVG
            id="generic-qr-code-svg" // Use a generic ID
            value={idValue}
            size={200}
            level={"H"}
          />
        </div>
        {/* --- END MODIFICATION --- */}

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

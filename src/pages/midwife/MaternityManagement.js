import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../services/supabase";
import AddPatientModal from "../../pages/bhw/AddPatientModal";
import { AnimatePresence, motion } from "framer-motion";
import { logActivity } from "../../services/activityLogger";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import PatientQRCode from "../../components/reusables/PatientQRCode";
import PatientQRCodeModal from "../../components/reusables/PatientQRCodeModal";

// --- ICONS ---
const ExportIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    ></path>
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>
  </svg>
);
const FilterIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894L7 18.5V14.414L3.293 6.707A1 1 0 013 6V4z"
    ></path>
  </svg>
);
const ViewIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    ></path>
  </svg>
);
const UpdateIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    ></path>
  </svg>
);
const DeleteIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>
  </svg>
);
const CalendarIcon = () => (
  <svg
    className="w-5 h-5 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    ></path>
  </svg>
);
const QRIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4v16m8-8H4"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12h1m8-9v1m0 16v1m8-9h-1M4 12a8 8 0 018-8m0 16a8 8 0 01-8-8m16 0a8 8 0 01-8 8"
    ></path>
  </svg>
);

// --- Helper Components ---
const RiskLevelBadge = ({ level }) => {
  const levelStyles = {
    NORMAL: "bg-green-100 text-green-700",
    "MID RISK": "bg-yellow-100 text-yellow-700",
    "HIGH RISK": "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
        levelStyles[level] || "bg-gray-100 text-gray-800"
      }`}
    >
      {level}
    </span>
  );
};

const QuickStats = ({ stats }) => (
  <div className="bg-white p-3 rounded-lg shadow border">
    <h3 className="font-bold text-gray-700 text-sm mb-3">Quick Stats</h3>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Total Patients</span>
        <span className="font-bold text-gray-800">{stats.total}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Active Patients</span>
        <span className="font-bold text-gray-800">{stats.active}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Today's Visits</span>
        <span className="font-bold text-gray-800">{stats.today}</span>
      </div>
    </div>
  </div>
);

const UpcomingAppointmentsWidget = ({ appointments }) => (
  <div className="bg-white p-3 rounded-lg shadow border">
    <h3 className="font-bold text-gray-700 text-sm mb-3">
      Upcoming Appointment
    </h3>
    <div className="space-y-3">
      {appointments.length > 0 ? (
        appointments.map((app) => (
          <div key={app.id} className="flex items-center space-x-2">
            <div className="bg-blue-100 p-1 rounded">
              <CalendarIcon />
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-xs">
                {app.patient_name}
              </p>
              <p className="text-xs text-gray-500">{app.reason}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No upcoming appointments.</p>
      )}
    </div>
  </div>
);

const StatusLegend = () => (
  <div className="bg-white p-3 rounded-lg shadow border">
    <h3 className="font-bold text-gray-700 text-sm mb-3">Status Legend</h3>
    <div className="space-y-3 text-xs">
      <div className="flex items-center space-x-2 text-gray-700">
        <ViewIcon />
        <span>View</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <UpdateIcon />
        <span>Update</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <DeleteIcon />
        <span>Delete</span>
      </div>
      <div className="border-t my-2"></div>
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <span className="w-3 h-3 rounded-sm bg-green-500"></span>
        <span>NORMAL</span>
      </div>
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <span className="w-3 h-3 rounded-sm bg-yellow-500"></span>
        <span>MID RISK</span>
      </div>
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <span className="w-3 h-3 rounded-sm bg-red-500"></span>
        <span>HIGH RISK</span>
      </div>
    </div>
  </div>
);

// --- NEW/UPDATED MODALS ---
const DeleteConfirmationModal = ({ patientName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <motion.div
      className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
      <p className="text-sm text-gray-600 my-4">
        Are you sure you want to delete the record for{" "}
        <span className="font-semibold">{patientName}</span>? This action cannot
        be undone.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm"
        >
          Yes, Delete
        </button>
      </div>
    </motion.div>
  </div>
);

// MODIFIED: ViewPatientModal now displays all medical history details
const ViewPatientModal = ({ patient, onClose }) => {
  // Safely get the detailed records, or an empty object if it's null
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const details = patient.medical_history || {};
  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // --- PDF Header ---
    doc.setFontSize(10);
    doc.text("City Health Office, Nursing Services Division", 105, 15, {
      align: "center",
    });
    doc.text(
      "Maternal and Child Health Services, Puerto Princesa City",
      105,
      20,
      { align: "center" }
    );
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("PRENATAL INDIVIDUAL TREATMENT RECORD", 105, 30, {
      align: "center",
    });

    // --- Patient Details ---
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`Patient's ID No: ${patient.patient_id || "N/A"}`, 140, 40);

    autoTable(doc, {
      startY: 45,
      theme: "plain",
      body: [
        [
          `Complete/Full Name: ${patient.first_name} ${
            details.middle_name || ""
          } ${patient.last_name}`,
          `Age: ${patient.age || "N/A"}`,
        ],
        [
          `Date of Birth: ${details.dob || "N/A"}`,
          `Blood Type: ${details.blood_type || "N/A"}`,
        ],
        [
          `Address/Purok: ${details.purok || ""}, ${details.street || ""}`,
          `Contact No.: ${patient.contact_no || "N/A"}`,
        ],
      ],
      styles: { fontSize: 9, cellPadding: 1 },
    });

    // --- Obstetrical Score ---
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text("Obstetrical Score", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      theme: "grid",
      head: [["G", "P", "Term", "Preterm", "Abortion", "Living Children"]],
      body: [
        [
          details.g_score || "0",
          details.p_score || "0",
          details.term || "0",
          details.preterm || "0",
          details.abortion || "0",
          details.living_children || "0",
        ],
      ],
      styles: { fontSize: 8, halign: "center", cellPadding: 1 },
    });

    // --- Pregnancy History Table ---
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text("Pregnancy History", 14, doc.lastAutoTable.finalY + 10);
    const pregnancyHistoryBody = Array.from({ length: 10 }, (_, i) => {
      const g = i + 1;
      return [
        `G${g}`,
        details[`g${g}_outcome`] || "",
        details[`g${g}_sex`] || "",
        details[`g${g}_delivery_type`] || "",
        details[`g${g}_delivered_at`] || "",
      ];
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Gravida", "Outcome", "Sex", "NSD or CS", "Delivered at"]],
      body: pregnancyHistoryBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { halign: "center" },
    });

    // --- Menstrual and OB History ---
    doc.addPage();
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text("Menstrual & OB History", 14, 15);
    autoTable(doc, {
      startY: 20,
      theme: "plain",
      body: [
        [`Last Menstrual Period (LMP): ${details.lmp || "N/A"}`],
        [`Expected Date of Confinement (EDC): ${details.edc || "N/A"}`],
        [
          `Age of Menarche: ${details.age_of_menarche || "N/A"}`,
          `Duration of Menses: ${details.menstruation_duration || "N/A"} days`,
        ],
      ],
      styles: { fontSize: 9, cellPadding: 1 },
    });

    // --- Vaccination Record ---
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text(
        "Vaccination Record (Tetanus Toxoid)",
        14,
        doc.lastAutoTable.finalY + 10
      );
    const vaccineBody = [
      ["TT1", details.vaccine_tt1 || ""],
      ["TT2", details.vaccine_tt2 || ""],
      ["TT3", details.vaccine_tt3 || ""],
      ["TT4", details.vaccine_tt4 || ""],
      ["TT5", details.vaccine_tt5 || ""],
      ["FIM", details.vaccine_fim || ""],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Vaccine", "Date Given"]],
      body: vaccineBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
    });

    // --- Medical History ---
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text("Medical History", 14, doc.lastAutoTable.finalY + 10);
    const personalHistory = [
      "Diabetes Mellitus (DM)",
      "Asthma",
      "Cardiovascular Disease (CVD)",
      "Heart Disease",
      "Goiter",
    ]
      .map((h) => `${h}: ${details[`ph_${h}`] ? "Yes" : "No"}`)
      .join("\n");
    const hereditaryHistory = [
      "Hypertension (HPN)",
      "Asthma",
      "Heart Disease",
      "Diabetes Mellitus",
      "Goiter",
    ]
      .map((h) => `${h}: ${details[`hdh_${h}`] ? "Yes" : "No"}`)
      .join("\n");
    const socialHistory = [
      "Smoker",
      "Ex-smoker",
      "Second-hand Smoker",
      "Alcohol Drinker",
      "Substance Abuse",
    ]
      .map((h) => `${h}: ${details[`sh_${h}`] ? "Yes" : "No"}`)
      .join("\n");

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [
        ["Personal History", "Hereditary Disease History", "Social History"],
      ],
      body: [[personalHistory, hereditaryHistory, socialHistory]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, valign: "top" },
    });

    // --- Additional Information ---
    doc
      .setFontSize(10)
      .setFont(undefined, "bold")
      .text("Additional Information", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(9).setFont(undefined, "normal");
    doc.text(
      "History of Allergy to Foods & Drugs:",
      14,
      doc.lastAutoTable.finalY + 15
    );
    doc.text(
      details.allergy_history || "None",
      14,
      doc.lastAutoTable.finalY + 20,
      { maxWidth: 180 }
    );

    doc.text(
      "Family Planning History (Method previously used):",
      14,
      doc.lastAutoTable.finalY + 40
    );
    doc.text(
      details.family_planning_history || "None",
      14,
      doc.lastAutoTable.finalY + 45,
      { maxWidth: 180 }
    );

    doc.save(`ITR_${patient.last_name}_${patient.first_name}.pdf`);
    logActivity(
      "Downloaded PDF Record",
      `Generated PDF for patient: ${patient.patient_id}`
    );
  };
  <div className="md:col-span-1">
    <PatientQRCode patient={patient} />
  </div>;

  // Helper components for styling the document view
  const SectionHeader = ({ title }) => (
    <h3 className="font-bold text-gray-700 text-sm mt-6 mb-2 pb-1 border-b">
      {title}
    </h3>
  );
  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value || "N/A"}</p>
    </div>
  );
  const CheckboxDisplay = ({ label, isChecked }) => (
    <div className="flex items-center space-x-2">
      <div
        className={`w-4 h-4 border-2 rounded ${
          isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"
        }`}
      >
        {isChecked && (
          <svg
            className="w-full h-full text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <>
      {isQrModalVisible && (
        <PatientQRCodeModal
          subject={patient} // <-- Change 'patient' to 'subject'
          idKey="patient_id" // <-- Add this prop
          idLabel="Patient ID" // <-- Add this prop
          onClose={() => setIsQrModalVisible(false)}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div
          className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Header Section */}
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              Maternal Patient Record
            </h2>
            <p className="text-sm text-gray-600">
              Viewing record for{" "}
              <span className="font-semibold">
                {patient.first_name} {patient.last_name}
              </span>{" "}
              (ID: {patient.patient_id})
            </p>
          </div>

          {/* Main Content Body with Scrolling */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <SectionHeader title="Personal Information" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field
                label="Full Name"
                value={`${patient.first_name || ""} ${
                  details.middle_name || ""
                } ${patient.last_name || ""}`}
              />
              <Field label="Age" value={patient.age} />
              <Field label="Date of Birth" value={details.dob} />
              <Field label="Contact No." value={patient.contact_no} />
              <Field
                label="Address"
                value={`${details.purok || ""}, ${details.street || ""}`}
              />
              <Field label="Blood Type" value={details.blood_type} />
              <Field label="NHTS No." value={details.nhts_no} />
              <Field label="PhilHealth No." value={details.philhealth_no} />
              <Field
                label="Family Folder No."
                value={details.family_folder_no}
              />
              <Field label="Risk Level" value={patient.risk_level} />
            </div>

            <SectionHeader title="Obstetrical History" />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
              <Field label="Gravida (G)" value={details.g_score} />
              <Field label="Para (P)" value={details.p_score} />
              <Field label="Term" value={details.term} />
              <Field label="Preterm" value={details.preterm} />
              <Field label="Abortion" value={details.abortion} />
              <Field label="Living" value={details.living_children} />
            </div>

            {/* ADDED: Pregnancy History Table */}
            <SectionHeader title="Pregnancy History Details" />
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    {[
                      "Gravida",
                      "Outcome",
                      "Sex",
                      "NSD/CS",
                      "Delivered At",
                    ].map((h) => (
                      <th key={h} className="p-2 border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
                    <tr key={g}>
                      <td className="p-2 border font-semibold">G{g}</td>
                      <td className="p-2 border">
                        {details[`g${g}_outcome`] || "-"}
                      </td>
                      <td className="p-2 border">
                        {details[`g${g}_sex`] || "-"}
                      </td>
                      <td className="p-2 border">
                        {details[`g${g}_delivery_type`] || "-"}
                      </td>
                      <td className="p-2 border">
                        {details[`g${g}_delivered_at`] || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionHeader title="Menstrual & Pregnancy Details" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field label="LMP" value={details.lmp} />
              <Field label="EDC" value={details.edc} />
              <Field label="Age of Menarche" value={details.age_of_menarche} />
              <Field label="Weeks Pregnant" value={patient.weeks} />
              <Field
                label="Age of First Period"
                value={details.age_first_period}
              />
              <Field label="Bleeding Amount" value={details.bleeding_amount} />
              <Field
                label="Menstruation Duration"
                value={`${details.menstruation_duration || "N/A"} days`}
              />
              <Field label="Risk Code" value={details.risk_code} />
            </div>

            <SectionHeader title="Vaccination Record (Tetanus Toxoid)" />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
              {["TT1", "TT2", "TT3", "TT4", "TT5", "FIM"].map((vaccine) => (
                <Field
                  key={vaccine}
                  label={vaccine}
                  value={details[`vaccine_${vaccine.toLowerCase()}`]}
                />
              ))}
            </div>

            <SectionHeader title="Medical History" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Personal</h4>
                {[
                  "Diabetes Mellitus (DM)",
                  "Asthma",
                  "Cardiovascular Disease (CVD)",
                  "Heart Disease",
                  "Goiter",
                ].map((c) => (
                  <CheckboxDisplay
                    key={c}
                    label={c}
                    isChecked={details[`ph_${c}`]}
                  />
                ))}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Hereditary</h4>
                {[
                  "Hypertension (HPN)",
                  "Asthma",
                  "Heart Disease",
                  "Diabetes Mellitus",
                  "Goiter",
                ].map((c) => (
                  <CheckboxDisplay
                    key={c}
                    label={c}
                    isChecked={details[`hdh_${c}`]}
                  />
                ))}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Social</h4>
                {[
                  "Smoker",
                  "Ex-smoker",
                  "Second-hand Smoker",
                  "Alcohol Drinker",
                  "Substance Abuse",
                ].map((c) => (
                  <CheckboxDisplay
                    key={c}
                    label={c}
                    isChecked={details[`sh_${c}`]}
                  />
                ))}
              </div>
            </div>

            {/* ADDED: Allergy and Family Planning History */}
            <SectionHeader title="Additional Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  History of Allergy and Drugs
                </h4>
                <div className="bg-gray-50 p-3 rounded-md min-h-[80px] whitespace-pre-wrap">
                  {details.allergy_history || "No allergies recorded"}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Family Planning History
                </h4>
                <div className="bg-gray-50 p-3 rounded-md min-h-[80px] whitespace-pre-wrap">
                  {details.family_planning_history ||
                    "No family planning history recorded"}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-sm"
            >
              Close
            </button>
            {/* --- NEW DOWNLOAD BUTTON --- */}
            <button
              onClick={() => setIsQrModalVisible(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold text-sm"
            >
              View QR Code
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm"
            >
              Download as PDF
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-1 text-xs">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
      >
        &lt;
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-2 py-1 rounded ${
            currentPage === number
              ? "bg-blue-500 text-white font-semibold"
              : "hover:bg-gray-200"
          }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
      >
        &gt;
      </button>
    </nav>
  );
};

export default function MaternityManagement() {
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    risk_level: "All",
    search_type: "name",
  });

  const [modalMode, setModalMode] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [patientForQR, setPatientForQR] = useState(null); 
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Set how many patients per page
  const [totalPatients, setTotalPatients] = useState(0);

  // Export functions for Maternity Management
  const exportToPDF = async (filename = 'maternity_records') => {
    try {
      // Fetch ALL patient records
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select('*')
        .order('patient_id', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text('Maternal Health Records', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Total Records: ${allPatients.length}`, 105, 22, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
      
      // Table headers
      const headers = [
        ['Patient ID', 'Last Name', 'First Name', 'Age', 'Contact', 'Weeks Pregnant', 
        'Last Visit', 'Risk Level', 'Address']
      ];
      
      // Table data
      const tableData = allPatients.map(patient => {
        const medicalHistory = patient.medical_history || {};
        const address = `${medicalHistory.purok || ''}, ${medicalHistory.street || ''}`.trim();
        const addressDisplay = address || 'N/A';
        
        return [
          patient.patient_id,
          patient.last_name || '',
          patient.first_name || '',
          patient.age || '',
          patient.contact_no || '',
          patient.weeks || '',
          patient.last_visit || '',
          patient.risk_level || '',
          addressDisplay
        ];
      });
      
      // Create table
      autoTable(doc, {
        startY: 35,
        head: headers,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        margin: { left: 10, right: 10 }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Save PDF
      doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
      logActivity('Exported Records', `Exported ${allPatients.length} maternity records to PDF`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      addNotification('Error exporting to PDF: ' + error.message, 'error');
    }
  };

  const exportToExcel = async (filename = 'maternity_records') => {
    try {
      // Fetch ALL patient records
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select('*')
        .order('patient_id', { ascending: true });

      if (error) throw error;
      
      // Prepare data for Excel
      const worksheetData = [
        ['Patient ID', 'Last Name', 'First Name', 'Middle Name', 'Age', 'Contact No.', 
        'Weeks Pregnant', 'Last Visit', 'Risk Level', 'Purok', 'Street', 
        'Date of Birth', 'Blood Type', 'NHTS No.', 'PhilHealth No.', 'Created At']
      ];
      
      allPatients.forEach(patient => {
        const medicalHistory = patient.medical_history || {};
        worksheetData.push([
          patient.patient_id,
          patient.last_name,
          patient.first_name,
          patient.middle_name || '',
          patient.age,
          patient.contact_no,
          patient.weeks,
          patient.last_visit,
          patient.risk_level,
          medicalHistory.purok || '',
          medicalHistory.street || '',
          medicalHistory.dob || '',
          medicalHistory.blood_type || '',
          medicalHistory.nhts_no || '',
          medicalHistory.philhealth_no || '',
          new Date(patient.created_at).toLocaleDateString()
        ]);
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const colWidths = [
        {wch: 12}, // Patient ID
        {wch: 15}, // Last Name
        {wch: 15}, // First Name
        {wch: 15}, // Middle Name
        {wch: 6},  // Age
        {wch: 12}, // Contact No.
        {wch: 10}, // Weeks Pregnant
        {wch: 12}, // Last Visit
        {wch: 12}, // Risk Level
        {wch: 10}, // Purok
        {wch: 15}, // Street
        {wch: 12}, // Date of Birth
        {wch: 10}, // Blood Type
        {wch: 12}, // NHTS No.
        {wch: 12}, // PhilHealth No.
        {wch: 12}  // Created At
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Maternity Records');
      
      // Generate Excel file
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      logActivity('Exported Records', `Exported ${allPatients.length} maternity records to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      addNotification('Error exporting to Excel: ' + error.message, 'error');
    }
};

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    const { data: patientData, error: patientError, count: patientCount } = await supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq('is_deleted', false) // <--- ADD THIS LINE
      .order("patient_id", { ascending: true })
      .range(from, to);

    if (patientError) console.error("Error fetching patients:", patientError);
    else {
      setAllPatients(patientData || []);
      setTotalPatients(patientCount || 0);
    }

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("created_by", user.id) // Only get appointments created by the current BNS
      .order("date", { ascending: true })
      .limit(3);

    if (!appointmentsError) {
      setUpcomingAppointments(appointmentsData || []);
    }

    setLoading(false);
  }, [addNotification, currentPage, itemsPerPage, user]); // <-- Add 'user' as a dependency

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // --- CRUD Handlers ---
  const handleView = (patient) => {
    setSelectedPatient(patient);
    setModalMode("view");
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setModalMode("edit");
  };

  // src/pages/bhw/MaternityManagement.js

  const handleDelete = async () => {
    if (!patientToDelete) return;
    
    // CHANGE THIS BLOCK
    const { error } = await supabase
      .from("patients")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() }) // <--- SOFT DELETE
      .eq("id", patientToDelete.id);

    if (error) {
      addNotification(`Error deleting record: ${error.message}`, "error");
    } else {
      // Update the success message to be accurate
      addNotification("Mother Record moved to Recycle Bin.", "success");
      logActivity("Mother Record Deleted (Soft)", `Moved ${patientToDelete.first_name} ${patientToDelete.last_name} to trash`);
      fetchPageData(); 
    }
    setPatientToDelete(null);
  };

  const filteredPatients = useMemo(() => {
    // Filtering is now done on the client-side for the current page's data
    return allPatients
      .filter((patient) => {
        if (filters.risk_level === "All") return true;
        return patient.risk_level === filters.risk_level;
      })
      .filter((patient) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        if (filters.search_type === "id") {
          return patient.patient_id?.toLowerCase().includes(term);
        } else {
          const fullName = `${patient.first_name || ""} ${
            patient.middle_name || ""
          } ${patient.last_name || ""}`.toLowerCase();
          return fullName.includes(term);
        }
      });
  }, [allPatients, searchTerm, filters]);

  const totalPages = Math.ceil(totalPatients / itemsPerPage);

  return (
    <>
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <AddPatientModal
            mode={modalMode}
            initialData={selectedPatient}
            onClose={() => setModalMode(null)}
            onSave={fetchPageData}
          />
        )}
        {patientToDelete && (
          <DeleteConfirmationModal
            patientName={`${patientToDelete.first_name} ${patientToDelete.last_name}`}
            onConfirm={handleDelete}
            onCancel={() => setPatientToDelete(null)}
          />
        )}
        {modalMode === "view" && (
          <ViewPatientModal
            patient={selectedPatient}
            onClose={() => setModalMode(null)}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <h2 className="text-2xl font-bold text-gray-700">Maternal Records</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                    {" "}
                    <SearchIcon />{" "}
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2 py-1.5 w-full sm:w-auto text-sm rounded-md border bg-gray-50 focus:bg-white"
                  />
                </div>
                
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                  >
                    <FilterIcon /> <span>Filter</span>
                  </button>
                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-20 border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-600 border-b bg-gray-50">
                        Filter by Risk Level
                      </div>
                      <div className="p-3 space-y-2">
                        {["All", "NORMAL", "MID RISK", "HIGH RISK"].map(
                          (level) => (
                            <label
                              key={level}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md"
                            >
                              <input
                                type="radio"
                                name="risk_level"
                                value={level}
                                checked={filters.risk_level === level}
                                onChange={(e) => {
                                  setFilters({
                                    ...filters,
                                    risk_level: e.target.value,
                                  });
                                  setIsFilterOpen(false);
                                }}
                              />
                              <span className="text-sm">{level}</span>
                            </label>
                          )
                        )}
                      </div>
                      <div className="px-4 py-2 text-sm font-semibold text-gray-600 border-t bg-gray-50">
                        Search By
                      </div>
                      <div className="p-3 space-y-2">
                        {[
                          { label: "Name", value: "name" },
                          { label: "Patient ID", value: "id" },
                        ].map((type) => (
                          <label
                            key={type.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-md"
                          >
                            <input
                              type="radio"
                              name="search_type"
                              value={type.value}
                              checked={filters.search_type === type.value}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  search_type: e.target.value,
                                });
                                setIsFilterOpen(false);
                              }}
                            />
                            <span className="text-sm">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    disabled={exporting}
                    className={`flex items-center space-x-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50 ${
                      exporting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {exporting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <ExportIcon /> <span>Export</span>
                      </>
                    )}
                  </button>
                  <AnimatePresence>
                    {isExportOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-20 border"
                      >
                        <div className="p-2 text-xs font-semibold text-gray-600 border-b">
                          Export Format
                        </div>
                        <div className="p-1">
                          <button
                            onClick={() => {
                              exportToPDF('maternity_records');
                              setIsExportOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-red-50 text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Export as PDF
                          </button>
                          <button
                            onClick={() => {
                              exportToExcel('maternity_records');
                              setIsExportOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-green-50 text-green-600 hover:text-green-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export as Excel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 font-semibold">
                    {[
                      "ID",
                      "Full Name",
                      "Age",
                      "Contact",
                      "Weeks",
                      "Last Visit",
                      "Risk",
                      "Actions",
                    ].map((header) => (
                      <th key={header} className="px-2 py-2">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="text-gray-600">
                      <td className="px-2 py-2 font-medium">{p.patient_id}</td>
                      <td className="px-2 py-2">{`${p.first_name} ${
                        p.middle_name || ""
                      } ${p.last_name}`}</td>
                      <td className="px-2 py-2">{p.age}</td>
                      <td className="px-2 py-2">{p.contact_no}</td>
                      <td className="px-2 py-2">{p.weeks}</td>
                      <td className="px-2 py-2">{p.last_visit}</td>
                      <td className="px-2 py-2">
                        <RiskLevelBadge level={p.risk_level} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleView(p)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                          >
                            <ViewIcon />
                          </button>
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-gray-400 hover:text-green-600 p-1"
                          >
                            <UpdateIcon />
                          </button>
                          <button
                            onClick={() => setPatientToDelete(p)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedPatient(null);
                setModalMode("add");
              }}
              className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm"
            >
              + New Mother Patient
            </button>
            <QuickStats stats={stats} />
            <StatusLegend />
          </div>
        </div>
      </div>
    </>
  );
}

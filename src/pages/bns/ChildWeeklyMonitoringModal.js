import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../../services/supabase";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { logActivity } from "../../services/activityLogger";

const toYMD = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const calculateAgeInMonths = (dob, onDate = new Date()) => {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const check = new Date(onDate);
  const months = (check.getFullYear() - birth.getFullYear()) * 12 + (check.getMonth() - birth.getMonth());
  return months < 0 ? 0 : months;
};

const calculateBMI = (weightKg, heightCm) => {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || h <= 0) return null;
  const meters = h / 100;
  return Number((w / (meters * meters)).toFixed(2));
};

const getNutritionStatus = (bmi) => {
  if (!bmi) return "H";
  if (bmi < 18.5) return "UW";
  if (bmi < 25) return "H";
  if (bmi < 30) return "OW";
  return "O";
};

const getWeekLabel = (dateString) => {
  const date = new Date(dateString);
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayDiff = Math.floor((date - firstDay) / 86400000);
  const week = Math.ceil((dayDiff + firstDay.getDay() + 1) / 7);
  return `Week ${week}, ${date.getFullYear()}`;
};

export default function ChildWeeklyMonitoringModal({ child, isOpen, onClose, onSaved }) {
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    measurement_date: toYMD(new Date()),
    weight_kg: "",
    height_cm: "",
    contact_no: "",
  });

  const latestRecord = useMemo(() => (records.length > 0 ? records[0] : null), [records]);

  const fetchRecords = useCallback(async () => {
    if (!child?.id || !isOpen) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("child_measurements")
      .select("id, measurement_date, weight_kg, height_cm, bmi, nutrition_status, created_at")
      .eq("child_record_id", child.id)
      .order("measurement_date", { ascending: false });

    if (error) {
      addNotification("Unable to load weekly records.", "warning");
      setRecords([]);
    } else {
      setRecords(data || []);
    }

    setLoading(false);
  }, [child?.id, isOpen, addNotification]);

  useEffect(() => {
    if (!isOpen || !child) return;
    fetchRecords();
  }, [isOpen, child, fetchRecords]);

  useEffect(() => {
    if (!isOpen || !child) return;
    setFormData((prev) => ({
      ...prev,
      measurement_date: toYMD(new Date()),
      weight_kg: latestRecord?.weight_kg ?? child.weight_kg ?? "",
      height_cm: latestRecord?.height_cm ?? child.height_cm ?? "",
      contact_no: child.contact_no ?? "",
    }));
  }, [isOpen, child, latestRecord]);

  if (!isOpen || !child) return null;

  const ageMonthsNow = calculateAgeInMonths(child.dob);
  const computedBmi = calculateBMI(formData.weight_kg, formData.height_cm);
  const computedNutrition = getNutritionStatus(computedBmi);
  const effectiveContactNo = formData.contact_no?.trim() || child.contact_no || "N/A";

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveWeekly = async () => {
    if (!formData.measurement_date || !formData.weight_kg || !formData.height_cm) {
      addNotification("Please complete date, weight, and height.", "warning");
      return;
    }

    const bmi = calculateBMI(formData.weight_kg, formData.height_cm);
    const nutrition = getNutritionStatus(bmi);

    setSaving(true);
    const payload = {
      child_record_id: child.id,
      measurement_date: formData.measurement_date,
      weight_kg: Number(formData.weight_kg),
      height_cm: Number(formData.height_cm),
      bmi,
      nutrition_status: nutrition,
      recorded_by: user?.id || null,
    };

    const { error: insertError } = await supabase.from("child_measurements").insert([payload]);
    if (insertError) {
      setSaving(false);
      addNotification(
        `Unable to save weekly record: ${insertError.message}. Run the migration SQL first.`,
        "error"
      );
      return;
    }

    const { error: updateChildError } = await supabase
      .from("child_records")
      .update({
        weight_kg: payload.weight_kg,
        height_cm: payload.height_cm,
        bmi: payload.bmi,
        nutrition_status: payload.nutrition_status,
        last_checkup: payload.measurement_date,
        contact_no: formData.contact_no?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", child.id);

    if (updateChildError) {
      addNotification(`Weekly record saved, but summary update failed: ${updateChildError.message}`, "warning");
    } else {
      addNotification("Weekly child measurement recorded successfully.", "success");
      logActivity(
        "Recorded weekly child measurement",
        `Recorded weekly measurement for ${child.first_name} ${child.last_name} (${child.child_id})`
      );
    }

    setSaving(false);
    await fetchRecords();
    if (onSaved) onSaved();
  };

  const exportWeeklyHistoryPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Child Weekly Growth Monitoring", 105, 12, { align: "center" });

    doc.setFontSize(10);
    const infoRows = [
      ["Name of Father", child.father_name || "N/A", "Name of Mother", child.mother_name || "N/A"],
      ["Name of Child", `${child.first_name || ""} ${child.last_name || ""}`.trim(), "Birthday", child.dob || "N/A"],
      ["Age (months)", String(ageMonthsNow), "Cellphone", effectiveContactNo],
      ["Purok", child.address || "N/A", "Child ID", child.child_id || "N/A"],
    ];

    autoTable(doc, {
      startY: 18,
      head: [["Field", "Value", "Field", "Value"]],
      body: infoRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    const weeklyRows = records.map((r) => [
      getWeekLabel(r.measurement_date),
      r.measurement_date,
      calculateAgeInMonths(child.dob, r.measurement_date),
      r.weight_kg ?? "",
      r.height_cm ?? "",
      r.bmi ?? "",
      r.nutrition_status ?? "",
      child.address ?? "",
      effectiveContactNo,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Week", "Date", "Age (months)", "Weight", "Height", "BMI", "Status", "Purok", "Cellphone"]],
      body: weeklyRows,
      theme: "grid",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    const fileSafeName = `${child.last_name || "child"}_${child.first_name || "record"}`.replace(/\s+/g, "_");
    doc.save(`weekly_growth_${fileSafeName}.pdf`);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete?.id) return;

    setDeleting(true);
    const { error } = await supabase
      .from("child_measurements")
      .delete()
      .eq("id", recordToDelete.id)
      .eq("child_record_id", child.id);

    if (error) {
      addNotification(`Unable to remove weekly record: ${error.message}`, "error");
      setDeleting(false);
      return;
    }

    addNotification("Weekly record removed successfully.", "success");
    logActivity(
      "Removed weekly child measurement",
      `Removed weekly measurement for ${child.first_name} ${child.last_name} (${child.child_id})`
    );
    setRecordToDelete(null);
    setDeleting(false);
    await fetchRecords();
    if (onSaved) onSaved();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-cyan-50 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Weekly Child Growth Monitoring</h2>
            <p className="text-sm text-gray-600">
              {child.last_name}, {child.first_name} ({child.child_id})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">Close</button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg bg-gray-50 text-sm">
            <div><span className="font-semibold">Father:</span> {child.father_name || "N/A"}</div>
            <div><span className="font-semibold">Mother:</span> {child.mother_name || "N/A"}</div>
            <div><span className="font-semibold">Child:</span> {`${child.first_name || ""} ${child.last_name || ""}`.trim()}</div>
            <div><span className="font-semibold">Birthday:</span> {child.dob || "N/A"}</div>
            <div><span className="font-semibold">Age (months):</span> {ageMonthsNow}</div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-gray-700 mb-3">Record This Week</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date</label>
                <input type="date" name="measurement_date" value={formData.measurement_date} onChange={handleInput} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                <input type="number" step="0.01" name="weight_kg" value={formData.weight_kg} onChange={handleInput} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height (cm)</label>
                <input type="number" step="0.01" name="height_cm" value={formData.height_cm} onChange={handleInput} className="w-full p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Age in months</label>
                <input readOnly value={calculateAgeInMonths(child.dob, formData.measurement_date)} className="w-full p-2 border rounded-md bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Purok</label>
                <input readOnly value={child.address || "N/A"} className="w-full p-2 border rounded-md bg-gray-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cellphone</label>
                <input
                  type="text"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleInput}
                  placeholder="Enter or update contact number"
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Computed Status</label>
                <input readOnly value={`${computedBmi ?? "N/A"} (${computedNutrition})`} className="w-full p-2 border rounded-md bg-gray-100 text-sm" />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveWeekly}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Weekly Record"}
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700">Weekly History</h3>
              <button onClick={exportWeeklyHistoryPdf} className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700">
                Export Weekly PDF
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading records...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-gray-500">No weekly records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Week</th>
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Age (months)</th>
                      <th className="p-2 border">Weight</th>
                      <th className="p-2 border">Height</th>
                      <th className="p-2 border">BMI</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Purok (Profile)</th>
                      <th className="p-2 border">Cellphone (Profile)</th>
                      <th className="p-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-2 border font-semibold">{getWeekLabel(r.measurement_date)}</td>
                        <td className="p-2 border">{r.measurement_date}</td>
                        <td className="p-2 border">{calculateAgeInMonths(child.dob, r.measurement_date)}</td>
                        <td className="p-2 border">{r.weight_kg ?? "-"}</td>
                        <td className="p-2 border">{r.height_cm ?? "-"}</td>
                        <td className="p-2 border">{r.bmi ?? "-"}</td>
                        <td className="p-2 border">{r.nutrition_status ?? "-"}</td>
                        <td className="p-2 border">{child.address ?? "-"}</td>
                        <td className="p-2 border">{effectiveContactNo}</td>
                        <td className="p-2 border text-center">
                          <button
                            onClick={() => setRecordToDelete(r)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-[11px] font-semibold hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {recordToDelete && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h3 className="text-base font-bold text-gray-800">Confirm Removal</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to remove this weekly record dated
                <span className="font-semibold"> {recordToDelete.measurement_date}</span>?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setRecordToDelete(null)}
                  disabled={deleting}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRecord}
                  disabled={deleting}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Removing..." : "Yes, Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

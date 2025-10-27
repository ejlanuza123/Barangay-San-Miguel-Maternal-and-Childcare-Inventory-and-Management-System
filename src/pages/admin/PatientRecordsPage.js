import React, { useState } from "react";
import MaternityManagement from "../bhw/MaternityManagement";
import ChildHealthRecords from "../bns/ChildHealthRecords";

const PatientRecordsPage = () => {
  const [activeTab, setActiveTab] = useState("maternal"); // 'maternal' or 'child'

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Patient Records Management
      </h1>

      {/* Tab Navigation */}
      <div className="flex mb-4 border-b">
        <button
          onClick={() => setActiveTab("maternal")}
          className={`py-2 px-6 font-semibold rounded-t-lg transition-colors duration-200 ${
            activeTab === "maternal"
              ? "bg-white border-l border-t border-r text-blue-600"
              : "text-gray-500 hover:text-blue-500"
          }`}
        >
          Maternal Records (BHW)
        </button>
        <button
          onClick={() => setActiveTab("child")}
          className={`py-2 px-6 font-semibold rounded-t-lg transition-colors duration-200 ${
            activeTab === "child"
              ? "bg-white border-l border-t border-r text-blue-600"
              : "text-gray-500 hover:text-blue-500"
          }`}
        >
          Child Records (BNS)
        </button>
      </div>

      {/* Tab Content */}
      {/* We use the 'key' prop to force React to re-mount the components when the tab changes.
        This ensures their internal state (like search terms) is reset.
        We also pass 'readOnly={true}' to hide edit/delete/add buttons.
      */}
      {activeTab === "maternal" && (
        <div className="bg-white p-4 rounded-b-lg rounded-r-lg shadow-sm border">
          <MaternityManagement key="maternal" readOnly={true} />
        </div>
      )}

      {activeTab === "child" && (
        <div className="bg-white p-4 rounded-b-lg rounded-r-lg shadow-sm border">
          <ChildHealthRecords key="child" readOnly={true} />
        </div>
      )}
    </div>
  );
};

export default PatientRecordsPage;

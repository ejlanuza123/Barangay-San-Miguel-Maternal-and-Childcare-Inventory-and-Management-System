import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import illustration from "../../assets/illustration.png";
import logo from "../../assets/logo.jpg";

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setScrolledToBottom(true);
    }
  };

  const handleAgree = () => {
    if (hasAgreed && scrolledToBottom) {
      sessionStorage.setItem("termsAccepted", "true");
      navigate("/role-selection");
    }
  };

  const handleCheckboxChange = (e) => {
    if (scrolledToBottom) {
      setHasAgreed(e.target.checked);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Left Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center items-center text-white bg-green-500">
          <img
            src={logo}
            alt="Logo"
            className="w-32 h-32 rounded-full border-4 border-green-300 shadow-xl mb-6"
          />
          <h1 className="text-4xl font-bold drop-shadow-lg text-center">
            Barangay San Miguel Health Center
          </h1>
          <p className="text-sm font-semibold mt-2">
            Maternity and Infant Care Inventory Management
          </p>
          <img
            src={illustration}
            alt="Healthcare Illustration"
            className="w-full max-w-sm mt-8"
          />
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Terms and Conditions
            </h2>
            <div
              ref={contentRef}
              onScroll={handleScroll}
              className="prose max-w-none h-64 overflow-y-auto border p-4 rounded-md bg-gray-50 mb-6"
            >
              <p>
                Welcome to the Barangay San Miguel Maternity and Childcare
                Inventory System. By accessing or using the System, you agree to
                comply with and be bound by the following terms and conditions.
                Please read these Terms carefully.
              </p>

              <h4>1. Purpose of the System</h4>
              <p>
                The System is intended solely for improving the management of
                maternal and child healthcare services in Barangay San Miguel.
                It supports patient information, appointment scheduling,
                inventory monitoring, notification, and analytics for authorized
                users.
              </p>

              <h4>2. Authorized Users</h4>
              <p>
                The System is accessible only to Barangay Health Workers (BHWs),
                Barangay Nutrition Scholars (BNS), Barangay Officials, and other
                authorized personnel as approved by the barangay council. Users
                must only access features and information relevant to their
                official roles and responsibilities.
              </p>

              <h4>3. User Responsibilities</h4>
              <ul>
                <li>
                  Provide accurate and current information when entering or
                  updating any record in the System.
                </li>
                <li>
                  Maintain the confidentiality of login credentials; accounts
                  must not be shared.
                </li>
                <li>
                  Use the System exclusively for legitimate and authorized
                  healthcare activities within Barangay San Miguel.
                </li>
                <li>
                  Refrain from copying, altering, or distributing System data or
                  software without official approval.
                </li>
                <li>
                  Promptly report any suspected unauthorized account use to the
                  barangay administrator.
                </li>
              </ul>

              <h4>4. System Usage</h4>
              <ul>
                <li>
                  Access or modification of records is allowed only as necessary
                  for authorized healthcare operations.
                </li>
                <li>
                  All activity within the System must comply with barangay
                  guidelines and the principles of integrity and respect for
                  patient confidentiality.
                </li>
                <li>
                  Sharing data outside the authorized user group is strictly
                  prohibited.
                </li>
              </ul>

              <h4>5. Data Privacy Policy</h4>
              <p>
                The collection, processing, storage, and sharing of personal
                data in this System follow Republic Act No. 10173 or the Data
                Privacy Act of 2012 (Philippines):
              </p>

              <h5>a. Lawful Collection and Use</h5>
              <ul>
                <li>
                  Personal data collected by the System is processed only for
                  the legitimate purpose of improving healthcare services in
                  Barangay San Miguel.
                </li>
                <li>
                  Only data relevant to maternal and child healthcare (e.g.,
                  patient demographics, health histories, appointment records)
                  will be retained and processed.
                </li>
                <li>
                  Access to personal data is restricted to authorized users and
                  is granted based on necessity and job function.
                </li>
              </ul>

              <h5>b. Data Protection Measures</h5>
              <ul>
                <li>
                  The System uses secure authentication, user access controls,
                  and technical safeguards to maintain security and privacy.
                </li>
                <li>
                  All records are encrypted and protected against unauthorized
                  access, alteration, or disclosure.
                </li>
              </ul>

              <h5>c. Patient Rights</h5>
              <ul>
                <li>
                  Individuals have the right to access, correct, and update
                  their personal data stored in the System by submitting a
                  request through authorized health personnel.
                </li>
                <li>
                  All requests and updates will be processed promptly and in
                  accordance with the barangay’s data management procedures.
                </li>
              </ul>

              <h5>d. Retention and Disposal</h5>
              <ul>
                <li>
                  Personal data will be retained only as long as necessary to
                  fulfill healthcare purposes or as required by law.
                </li>
                <li>
                  Data will be securely deleted or anonymized when no longer
                  necessary.
                </li>
              </ul>

              <h5>e. Consent and Transparency</h5>
              <ul>
                <li>
                  Patients are informed about what information is collected and
                  how it will be used, at the time of data collection.
                </li>
                <li>
                  By participating in barangay healthcare programs or consenting
                  to registration, patients agree to the processing of their
                  information as described.
                </li>
              </ul>

              <h5>f. Compliance</h5>
              <p>
                The System complies with all requirements under Republic Act No.
                10173 (Data Privacy Act of 2012), and all users are expected to
                do the same.
              </p>
            </div>
            <div className="flex items-center space-x-3 mb-6">
              <input
                id="agree-checkbox"
                type="checkbox"
                checked={hasAgreed}
                onChange={handleCheckboxChange}
                disabled={!scrolledToBottom}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200"
              />
              <label
                htmlFor="agree-checkbox"
                className={`text-sm font-medium ${
                  scrolledToBottom ? "text-gray-700" : "text-gray-400"
                }`}
              >
                I have read and agree to the Terms and Conditions.
              </label>
            </div>
            <button
              onClick={handleAgree}
              disabled={!hasAgreed || !scrolledToBottom}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Agree and Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import React from "react";

const PrivacyPolicy = () => (
  <div>
    {/* --- NEW HEADER SECTION --- */}
    <div className="mb-6 pb-4 border-b">
      <h2 className="text-3xl font-bold text-gray-800">Data Privacy Policy</h2>
      <p className="text-sm text-gray-500 mt-1">
        Barangay San Miguel Maternity and Childcare Inventory System
      </p>
    </div>
    {/* --- END NEW HEADER SECTION --- */}

    <p className="text-sm text-gray-500 mb-6">
      Last updated: September 23, 2025
    </p>
    <div className="space-y-4 text-gray-700 leading-relaxed prose max-w-none">
      <h4>1. Policy Statement</h4>
      <p>
        This Data Privacy Policy outlines how the Barangay San Miguel Maternity
        and Childcare Inventory System (“the System”) collects, uses, stores,
        shares, and protects your personal data, in accordance with Republic Act
        No. 10173 or the Data Privacy Act of 2012 of the Philippines.
      </p>

      <h4>2. Collection of Personal Data</h4>
      <p>
        The System collects personal data necessary for the delivery of
        healthcare services, including but not limited to:
      </p>
      <ul>
        <li>Full name, age, sex, birthdate, address, and contact details;</li>
        <li>
          Medical histories, prenatal and postnatal records, immunization
          status, and other relevant health information;
        </li>
        <li>
          Guardian or parent information necessary for child health management.
        </li>
      </ul>
      <p>
        All personal information collected shall be limited to what is strictly
        necessary to achieve healthcare delivery and program objectives.
      </p>

      <h4>3. Use and Processing of Personal Data</h4>
      <p>All collected data is used solely for:</p>
      <ul>
        <li>
          Registration and management of maternal and child healthcare records;
        </li>
        <li>
          Scheduling and notification of appointments, vaccinations, and
          healthcare activities;
        </li>
        <li>Inventory management of medicines and supplies;</li>
        <li>
          Analytics and reporting to support barangay health planning and
          resource allocation.
        </li>
      </ul>
      <p>
        Data will not be used for any purpose other than those stated above
        without prior consent.
      </p>

      <h4>4. Storage and Protection of Personal Data</h4>
      <ul>
        <li>
          Personal data is stored securely in the System and protected with
          appropriate organizational, physical, and technical measures;
        </li>
        <li>
          Access is restricted to authorized personnel such as Barangay Health
          Workers (BHWs), Barangay Nutrition Scholars (BNS), and barangay
          officials;
        </li>
        <li>
          The System uses encryption, authentication, and access controls to
          prevent unauthorized use, alteration, or disclosure.
        </li>
      </ul>

      <h4>5. Data Sharing and Disclosure</h4>
      <ul>
        <li>
          Personal data will not be shared with third parties outside Barangay
          San Miguel's health administration unless required by law or with
          explicit consent from the individual;
        </li>
        <li>
          Data may be shared among authorized healthcare personnel exclusively
          for legitimate healthcare or administrative purposes.
        </li>
      </ul>

      <h4>6. Retention and Disposal</h4>
      <ul>
        <li>
          Personal and health-related information will be retained only as long
          as necessary for the purposes stated or as required by applicable
          laws;
        </li>
        <li>
          Secure disposal or anonymization will be carried out after the
          retention period.
        </li>
      </ul>

      <h4>7. Rights of Data Subjects</h4>
      <p>Under the Data Privacy Act, you have the right to:</p>
      <ul>
        <li>
          Be informed about the collection and processing of your personal data;
        </li>
        <li>Access your personal and health records in the System;</li>
        <li>
          Request corrections to your information if found to be inaccurate or
          outdated;
        </li>
        <li>
          Request the removal or blocking of your data if it is inaccurate,
          outdated, or collected without proper authorization;
        </li>
        <li>
          Withdraw consent for processing, subject to applicable limitations.
        </li>
      </ul>

      <h4>8. Consent</h4>
      <p>
        By providing your information or by availing of barangay healthcare
        services, you consent to the collection, use, processing, and storage of
        your data as described in this Policy in accordance with RA 10173.
      </p>

      <h4>9. Changes to the Policy</h4>
      <p>
        This Policy may be updated from time to time to comply with amendments
        in the law or to improve system practices. Significant changes will be
        posted and communicated through official barangay channels.
      </p>

      <h4>10. Inquiries and Complaints</h4>
      <p>
        For questions, concerns, or complaints regarding your data privacy, you
        may contact the Data Protection Officer or the Barangay San Miguel
        Health Office.
      </p>
    </div>
  </div>
);

export default PrivacyPolicy;

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import components
import TermsAndConditions from "./components/auth/TermsandConditions";
// import RoleSelection from "./components/auth/RoleSelection"; // REMOVED
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import RegisterVIP from "./components/auth/RegisterVIP";
import ForgotPassword from "./components/auth/ForgetPassword";
import ResetPassword from "./components/auth/ResetPassword";
import AppLayout from "./components/layout/AppLayout";
import PrivateRoute from "./components/auth/PrivateRoute";
import RoleGuard from "./components/auth/RoleGuard"; 

// Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import RequestionsPage from "./pages/admin/RequestionsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import PatientRecordsPage from "./pages/admin/PatientRecordsPage";
import AdminInventoryPage from "./pages/admin/InventoryPage";

import BhwDashboard from "./pages/bhw/BhwDashboard";
import MaternityManagement from "./pages/bhw/MaternityManagement";
import AppointmentPage from "./pages/bhw/AppointmentPage";
import InventoryPage from "./pages/bhw/InventoryPage";
import ReportsPage from "./pages/bhw/ReportsPage";

import BnsDashboard from "./pages/bns/BnsDashboard";
import ChildHealthRecords from "./pages/bns/ChildHealthRecords";
import BnsAppointmentPage from "./pages/bns/AppointmentPage";
import BnsInventoryPage from "./pages/bns/InventoryPage";
import BnsReportsPage from "./pages/bns/ReportsPage";

import UserDashboard from "./pages/user/UserDashboard";
import ScheduleAppointment from "./pages/user/ScheduleAppointment";
import ViewUserRecords from "./pages/user/ViewUserRecords";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            {/* Default route now goes directly to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registerVIP" element={<RegisterVIP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* --- PROTECTED APP LAYOUT --- */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              
              {/* 1. ADMIN ROUTES */}
              <Route element={<RoleGuard allowedRoles={['Admin']} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/requestions" element={<RequestionsPage />} />
                <Route path="admin/employees" element={<EmployeesPage />} />
                <Route path="admin/patient-records" element={<PatientRecordsPage />} />
                <Route path="admin/inventory" element={<AdminInventoryPage />} />
              </Route>

              {/* 2. BHW ROUTES */}
              <Route element={<RoleGuard allowedRoles={['BHW']} />}>
                <Route path="bhw/dashboard" element={<BhwDashboard />} />
                <Route path="bhw/maternity-management" element={<MaternityManagement />} />
                <Route path="bhw/appointment" element={<AppointmentPage />} />
                <Route path="bhw/inventory" element={<InventoryPage />} />
                <Route path="bhw/reports" element={<ReportsPage />} />
              </Route>

              {/* 3. BNS ROUTES */}
              <Route element={<RoleGuard allowedRoles={['BNS']} />}>
                <Route path="bns/dashboard" element={<BnsDashboard />} />
                <Route path="bns/child-records" element={<ChildHealthRecords />} />
                <Route path="bns/appointment" element={<BnsAppointmentPage />} />
                <Route path="bns/inventory" element={<BnsInventoryPage />} />
                <Route path="bns/reports" element={<BnsReportsPage />} />
              </Route>

              {/* 4. USER ROUTES */}
              <Route element={<RoleGuard allowedRoles={['USER/MOTHER/GUARDIAN']} />}>
                <Route path="user/dashboard" element={<UserDashboard />} />
                <Route path="user/schedule-appointment" element={<ScheduleAppointment />} />
                <Route path="user/records" element={<ViewUserRecords />} />
              </Route>

            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
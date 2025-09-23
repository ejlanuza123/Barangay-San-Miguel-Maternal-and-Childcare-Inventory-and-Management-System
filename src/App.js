import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import all necessary components
import TermsAndConditions from "./components/auth/TermsandConditions";
import RoleSelection from "./components/auth/RoleSelection";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import RegisterVIP from "./components/auth/RegisterVIP";
import ForgotPassword from "./components/auth/ForgetPassword";
import ResetPassword from "./components/auth/ResetPassword";
import AppLayout from "./components/layout/AppLayout";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RequestionsPage from "./pages/admin/RequestionsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import AdminInventoryPage from "./pages/admin/InventoryPage";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// --- BHW & BNS & User Imports ---
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

function App() {
  const termsAccepted = sessionStorage.getItem("termsAccepted") === "true";

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* --- PUBLIC & AUTH ROUTES --- */}
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />

            {/* THIS IS THE FIX: We remove the redirect logic from this specific route */}
            <Route path="/role-selection" element={<RoleSelection />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registerVIP" element={<RegisterVIP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* --- PROTECTED ROUTES --- */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              {/* Nest all protected pages here */}
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/requestions" element={<RequestionsPage />} />
              <Route path="admin/employees" element={<EmployeesPage />} />
              <Route path="admin/inventory" element={<AdminInventoryPage />} />
              <Route path="bhw/dashboard" element={<BhwDashboard />} />
              <Route
                path="bhw/maternity-management"
                element={<MaternityManagement />}
              />
              <Route path="bhw/appointment" element={<AppointmentPage />} />
              <Route path="bhw/inventory" element={<InventoryPage />} />
              <Route path="bhw/reports" element={<ReportsPage />} />
              <Route path="bns/dashboard" element={<BnsDashboard />} />
              <Route
                path="bns/child-records"
                element={<ChildHealthRecords />}
              />
              <Route path="bns/appointment" element={<BnsAppointmentPage />} />
              <Route path="bns/inventory" element={<BnsInventoryPage />} />
              <Route path="bns/reports" element={<BnsReportsPage />} />
              <Route path="user/dashboard" element={<UserDashboard />} />
              <Route
                path="user/schedule-appointment"
                element={<ScheduleAppointment />}
              />
              <Route path="user/records" element={<ViewUserRecords />} />
            </Route>

            {/* --- FALLBACK ROUTE --- */}
            <Route
              path="*"
              element={
                <Navigate
                  to={
                    termsAccepted ? "/role-selection" : "/terms-and-conditions"
                  }
                  replace
                />
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

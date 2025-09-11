import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all necessary components
import RoleSelection from './components/auth/RoleSelection';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RegisterVIP from './components/auth/RegisterVIP';
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';


// --- UPDATED IMPORTS ---
import BhwDashboard from './pages/bhw/BhwDashboard';
import MaternityManagement from './pages/bhw/MaternityManagement';
import AppointmentPage from './pages/bhw/AppointmentPage';
import InventoryPage from './pages/bhw/InventoryPage';
import ReportsPage from './pages/bhw/ReportsPage'; 
// BNS files 
import BnsDashboard from './pages/bns/BnsDashboard';
import ChildHealthRecords from './pages/bns/ChildHealthRecords'; 
import BnsAppointmentPage from './pages/bns/AppointmentPage'; 
import BnsInventoryPage from './pages/bns/InventoryPage'; 
import BnsReportsPage from './pages/bns/ReportsPage'; 


import UserDashboard from './pages/user/UserDashboard';
import ScheduleAppointment from './pages/user/ScheduleAppointment';
import ViewUserRecords from './pages/user/ViewUserRecords';

export default function App() {
  return (
    <Router>
        <AuthProvider>
        {/* --- 2. WRAP YOUR ROUTES WITH THE NOTIFICATION PROVIDER --- */}
            <NotificationProvider>

                  <Routes>
                    {/* Public routes */}
                    <Route path="/role-selection" element={<RoleSelection />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/registerVIP" element={<RegisterVIP />} />

                    {/* Protected routes */}
                    <Route 
                      path="/" 
                      element={
                        <PrivateRoute>
                          <AppLayout />
                        </PrivateRoute>
                      }
                    >
                      {/* Admin Routes */}
                      <Route path="admin/dashboard" element={<AdminDashboard />} />
                      <Route path="admin/manage-users" element={<ManageUsers />} />
                      
                      {/* --- UPDATED BHW ROUTES --- */}
                      <Route path="bhw/dashboard" element={<BhwDashboard />} />
                      <Route path="bhw/maternity-management" element={<MaternityManagement />} />
                      <Route path="bhw/appointment" element={<AppointmentPage />} />
                      <Route path="bhw/inventory" element={<InventoryPage />} />
                      <Route path="bhw/reports" element={<ReportsPage />} />
                        {/* BNS Routes */}
                            <Route path="bns/dashboard" element={<BnsDashboard />} />
                            <Route path="bns/child-records" element={<ChildHealthRecords />} />
                            <Route path="bns/appointment" element={<BnsAppointmentPage />} /> 
                            <Route path="bns/inventory" element={<BnsInventoryPage />} /> 
                            <Route path="bns/reports" element={<BnsReportsPage />} /> 
                      {/* User/Mother Routes */}
                      <Route path="user/dashboard" element={<UserDashboard />} />
                      <Route path="user/schedule-appointment" element={<ScheduleAppointment />} />
                      <Route path="user/records" element={<ViewUserRecords />} />
                    </Route>
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
            </NotificationProvider>
        </AuthProvider>
    </Router>
  );
}
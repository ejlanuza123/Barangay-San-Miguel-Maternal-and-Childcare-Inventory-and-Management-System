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
import BhwBnsDashboard from './pages/bhw-bns/BhwBnsDashboard';
import ViewRecords from './pages/bhw-bns/ViewRecords';
import UserDashboard from './pages/user/UserDashboard';
import ScheduleAppointment from './pages/user/ScheduleAppointment';
import ViewUserRecords from './pages/user/ViewUserRecords';

// NOTE: For now, the new BNS routes will point to the existing BHW components.
// You can create new, specialized components for BNS pages later.
// For example: import BnsDashboard from './pages/bns/BnsDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* These are the public routes anyone can access */}
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerVIP" element={<RegisterVIP />} />

        {/* This is the main route for logged-in users. It is protected. */}
        <Route 
          path="/*"
          element={
            <PrivateRoute>
              <AppLayout>
                <Routes>
                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/manage-users" element={<ManageUsers />} />
                  
                  {/* BHW (Barangay Health Worker) Routes */}
                  <Route path="/bhw/dashboard" element={<BhwBnsDashboard />} />
                  <Route path="/bhw/records" element={<ViewRecords />} />

                  {/* BNS (Barangay Nutrition Scholar) Routes */}
                  {/* These routes are new and reflect the separation of roles. */}
                  <Route path="/bns/dashboard" element={<BhwBnsDashboard />} /> 
                  <Route path="/bns/records" element={<ViewRecords />} /> 

                  {/* User/Mother Routes */}
                  <Route path="/user/dashboard" element={<UserDashboard />} />
                  <Route path="/user/schedule-appointment" element={<ScheduleAppointment />} />
                  <Route path="/user/records" element={<ViewUserRecords />} />
                  
                </Routes>
              </AppLayout>
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

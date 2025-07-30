import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children }) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && profile) {
      const isBasePath = location.pathname === '/' || location.pathname === '/dashboard';
      if (isBasePath) {
        switch (profile.role) {
          case 'Admin': navigate('/admin/dashboard', { replace: true }); break;
          // CORRECTED: Separate redirection for BHW and BNS
          case 'BHW': navigate('/bhw/dashboard', { replace: true }); break;
          case 'BNS': navigate('/bns/dashboard', { replace: true }); break;
          case 'USER/MOTHER/GUARDIAN': navigate('/user/dashboard', { replace: true }); break;
          default: navigate('/login', { replace: true });
        }
      }
    }
  }, [profile, loading, navigate, location.pathname]);

  if (!profile) {
    return <div className="flex h-screen items-center justify-center">Loading User Profile...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar role={profile.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header fullName={profile.full_name} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
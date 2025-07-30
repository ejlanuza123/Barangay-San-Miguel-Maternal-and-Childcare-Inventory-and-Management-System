import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

// --- ICON COMPONENTS ---
// It's best practice to keep these in their own file, but for this example, they are here.
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;

export default function Sidebar({ role }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/role-selection', { replace: true });
  };

  const getNavItems = () => {
    switch (role) {
      case 'Admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: <HomeIcon /> },
          { name: 'Manage Users', path: '/admin/manage-users', icon: <UsersIcon /> },
        ];
      case 'BHW':
        return [
          { name: 'Dashboard', path: '/bhw/dashboard', icon: <HomeIcon /> },
          { name: 'Maternity Mgmt', path: '/bhw/records', icon: <ClipboardListIcon /> },
          { name: 'Vaccine Inventory', path: '/bhw/inventory', icon: <ArchiveIcon /> },
        ];
      case 'BNS':
        return [
          { name: 'Dashboard', path: '/bns/dashboard', icon: <HomeIcon /> },
          { name: 'Child Nutrition', path: '/bns/records', icon: <ClipboardListIcon /> },
          { name: 'Supplements', path: '/bns/inventory', icon: <ArchiveIcon /> },
        ];
      case 'USER/MOTHER/GUARDIAN':
        return [
          { name: 'Dashboard', path: '/user/dashboard', icon: <HomeIcon /> },
          { name: 'My Records', path: '/user/records', icon: <ClipboardListIcon /> },
          { name: 'Appointments', path: '/user/schedule-appointment', icon: <CalendarIcon /> },
        ];
      default: return [];
    }
  };

  const navItems = getNavItems();
  const activeLinkStyle = { backgroundColor: '#0D9488', color: 'white' };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg" />
        <div>
          <h2 className="font-bold text-gray-800">BSM Health Center</h2>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-teal-50 hover:text-teal-600"
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600">
          <LogOutIcon />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}

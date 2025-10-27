import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";

// --- UPDATED: Smaller Icon Components ---
const DashboardIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    ></path>
  </svg>
);
const MaternityIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    ></path>
  </svg>
);
const AppointmentIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    ></path>
  </svg>
);
const InventoryIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    ></path>
  </svg>
);
const ReportsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    ></path>
  </svg>
);
const LogOutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 16l4-4m0 0l-4-4m4 4H3"
    ></path>
  </svg>
);
const UsersIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-6a3 3 0 100-6 3 3 0 000 6z"
    ></path>
  </svg>
);
const HelpIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);
const RequestionsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    ></path>
  </svg>
);
const EmployeesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    ></path>
  </svg>
);

export default function Sidebar({ role }) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/role-selection", { replace: true });
  };

  const getNavItems = () => {
    switch (role) {
      case "Admin":
        return [
          {
            name: "Admin Dashboard",
            path: "/admin/dashboard",
            icon: <DashboardIcon />,
          },
          {
            name: "Requestions",
            path: "/admin/requestions",
            icon: <RequestionsIcon />,
          },
          {
            name: "Employees",
            path: "/admin/employees",
            icon: <EmployeesIcon />,
          }, // This path should match the route
          {
            name: "Patient Records",
            path: "/admin/patient-records",
            icon: <MaternityIcon />,
          },
          {
            name: "Inventory",
            path: "/admin/inventory",
            icon: <InventoryIcon />,
          },
        ];
      case "BHW":
        return [
          {
            name: "Dashboard",
            path: "/bhw/dashboard",
            icon: <DashboardIcon />,
          },
          {
            name: "Maternity Management",
            path: "/bhw/maternity-management",
            icon: <MaternityIcon />,
          },
          {
            name: "Appointment",
            path: "/bhw/appointment",
            icon: <AppointmentIcon />,
          },
          {
            name: "Inventory",
            path: "/bhw/inventory",
            icon: <InventoryIcon />,
          },
          { name: "Reports", path: "/bhw/reports", icon: <ReportsIcon /> },
        ];
      case "BNS":
        return [
          {
            name: "Dashboard",
            path: "/bns/dashboard",
            icon: <DashboardIcon />,
          },
          {
            name: "Child Health Records",
            path: "/bns/child-records",
            icon: <MaternityIcon />,
          },
          {
            name: "Appointment",
            path: "/bns/appointment",
            icon: <AppointmentIcon />,
          },
          {
            name: "Inventory",
            path: "/bns/inventory",
            icon: <InventoryIcon />,
          },
          { name: "Reports", path: "/bns/reports", icon: <ReportsIcon /> },
        ];
      case "USER/MOTHER/GUARDIAN":
        return [
          {
            name: "Dashboard",
            path: "/user/dashboard",
            icon: <DashboardIcon />,
          },
          {
            name: "My Records",
            path: "/user/records",
            icon: <MaternityIcon />,
          },
          {
            name: "Schedule Appointment",
            path: "/user/appointment",
            icon: <AppointmentIcon />,
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const activeLinkStyle = {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontWeight: "600",
  };

  return (
    // --- UPDATED: Reduced width from w-72 to w-64 ---
    <div className="w-64 bg-white border-r flex flex-col h-screen pb-6">
      {/* --- UPDATED: Reduced padding, logo size, and font size --- */}
      <div className="p-3 border-b flex items-center space-x-2 flex-shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-md" />
        <div>
          <h2 className="font-bold text-sm text-gray-800">
            Barangay San Miguel
          </h2>
          <p className="text-xs font-semibold text-gray-600">Health Center</p>
        </div>
      </div>

      {/* --- UPDATED: Reduced padding and spacing for a tighter look --- */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            // --- UPDATED: Smaller padding, font size, and icon spacing ---
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md transition-colors duration-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            {item.icon}
            <span className="text-sm font-semibold">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* --- UPDATED: Reduced padding --- */}
      <NavLink
        to="/help"
        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
      >
        <HelpIcon />
        <span className="text-sm font-semibold">Help</span>
      </NavLink>
      <div className="px-3 py-2 border-t flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <LogOutIcon />
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>
    </div>
  );
}

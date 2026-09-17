import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
      isActive
        ? 'bg-[#1F5C73] text-white font-semibold'
        : 'text-[#1F2937] hover:bg-[#F6F7F8]'
    }`;

  return (
    <header className="bg-white border-b border-[#DADFE3] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base text-[#1F2937] tracking-tight">FundsRoom ERP</span>
            <span className="text-[11px] font-mono text-[#667085] border-l border-[#DADFE3] pl-3">Enterprise Ledger</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/enquiries" className={navLinkClass}>
              Enquiries
            </NavLink>
            <NavLink to="/quotations" className={navLinkClass}>
              Quotations
            </NavLink>
            <NavLink to="/sales-orders" className={navLinkClass}>
              Sales Orders
            </NavLink>
            <NavLink to="/inventory" className={navLinkClass}>
              Inventory Stock
            </NavLink>
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right hidden sm:block">
              <span className="font-medium text-[#1F2937] block">{user?.name}</span>
              <span className="text-[11px] text-[#667085] font-mono capitalize">{user?.role?.toLowerCase()}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-outline text-xs px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

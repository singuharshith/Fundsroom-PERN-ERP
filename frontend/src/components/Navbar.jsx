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
    `px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-[#D99A3D] text-[#E9E6DF] font-semibold'
        : 'border-transparent text-[#8F9799] hover:text-[#E9E6DF]'
    }`;

  return (
    <header class="bg-[#23282C] border-b border-[#3A4145] text-[#E9E6DF]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          {/* Logo & Environment */}
          <div class="flex items-center gap-3">
            <span class="font-bold text-sm text-[#E9E6DF] font-mono tracking-tight">
              FundsRoom ERP
            </span>
            <span class="text-[11px] font-mono text-[#8F9799] px-1.5 py-0.5 border border-[#3A4145] bg-[#1B1F22]">
              Production
            </span>
          </div>

          {/* Nav Links */}
          <nav class="flex items-center space-x-1">
            <NavLink to="/enquiries" class={navLinkClass}>
              Enquiries
            </NavLink>
            <NavLink to="/quotations" class={navLinkClass}>
              Quotations
            </NavLink>
            <NavLink to="/sales-orders" class={navLinkClass}>
              Sales orders
            </NavLink>
            <NavLink to="/inventory" class={navLinkClass}>
              Inventory
            </NavLink>
          </nav>

          {/* User info & Sign out */}
          <div class="flex items-center gap-3 text-xs font-mono">
            <div class="text-[#8F9799]">
              <span class="text-[#E9E6DF] font-medium">{user?.name}</span>
              <span class="mx-1.5 text-[#3A4145]">|</span>
              <span class={isAdmin ? 'text-[#D99A3D]' : 'text-[#5B84A8]'}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              class="px-2.5 py-1 text-xs text-[#8F9799] hover:text-[#E9E6DF] border border-[#3A4145] hover:bg-[#2A3034] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

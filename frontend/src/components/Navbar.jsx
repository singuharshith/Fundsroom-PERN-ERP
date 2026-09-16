import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, FileText, ShoppingBag, ClipboardList, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white font-semibold'
        : 'text-blue-100 hover:bg-blue-600 hover:text-white'
    }`;

  return (
    <nav class="bg-blue-900 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-600 rounded-lg">
              <Package class="w-6 h-6 text-white" />
            </div>
            <div>
              <span class="font-bold text-lg tracking-wide text-white">FundsRoom ERP</span>
              <span class="block text-xs text-blue-300">PERN Supply Chain Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div class="hidden md:flex items-center space-x-2">
            <NavLink to="/enquiries" class={navLinkClass}>
              <ClipboardList class="w-4 h-4" />
              Enquiries
            </NavLink>
            <NavLink to="/quotations" class={navLinkClass}>
              <FileText class="w-4 h-4" />
              Quotations
            </NavLink>
            <NavLink to="/sales-orders" class={navLinkClass}>
              <ShoppingBag class="w-4 h-4" />
              Sales Orders
            </NavLink>
            <NavLink to="/inventory" class={navLinkClass}>
              <Package class="w-4 h-4" />
              Inventory Stock
            </NavLink>
          </div>

          {/* User Status & Logout */}
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <div class="flex items-center gap-2 text-sm font-medium text-white">
                <User class="w-4 h-4 text-blue-300" />
                {user?.name}
              </div>
              <span
                class={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-0.5 ${
                  isAdmin ? 'bg-amber-400 text-amber-950' : 'bg-blue-500 text-white'
                }`}
              >
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut class="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

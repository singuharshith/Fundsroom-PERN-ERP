import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, FileText, ShoppingBag, ClipboardList, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base text-slate-900 tracking-tight">FundsRoom ERP</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">v1.0</span>
              </div>
              <span class="block text-[11px] text-slate-500 font-medium">Industrial Supply Chain & Inventory Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav class="hidden md:flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <NavLink to="/enquiries" class={navLinkClass}>
              <ClipboardList class="w-4 h-4" />
              1. Enquiries
            </NavLink>
            <NavLink to="/quotations" class={navLinkClass}>
              <FileText class="w-4 h-4" />
              2. Quotations
            </NavLink>
            <NavLink to="/sales-orders" class={navLinkClass}>
              <ShoppingBag class="w-4 h-4" />
              3. Sales Orders
            </NavLink>
            <NavLink to="/inventory" class={navLinkClass}>
              <Package class="w-4 h-4" />
              Inventory Stock
            </NavLink>
          </nav>

          {/* User Profile & Actions */}
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <User class="w-4 h-4" />
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-900 leading-tight">{user?.name}</div>
                <div class="flex items-center gap-1 mt-0.5">
                  <ShieldCheck class={`w-3 h-3 ${isAdmin ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span class={`text-[10px] font-bold uppercase ${isAdmin ? 'text-amber-700' : 'text-blue-700'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl transition-all border border-slate-200 hover:border-rose-200"
              title="Sign Out"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

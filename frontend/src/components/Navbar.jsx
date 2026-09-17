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
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base text-white tracking-tight">FundsRoom ERP</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">v1.0</span>
              </div>
              <span class="block text-[11px] text-slate-400 font-medium">Supply Chain & Inventory Operating System</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav class="hidden md:flex items-center space-x-1.5 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/50">
            <NavLink to="/enquiries" class={navLinkClass}>
              <ClipboardList class="w-4 h-4 text-blue-400" />
              1. Enquiries
            </NavLink>
            <NavLink to="/quotations" class={navLinkClass}>
              <FileText class="w-4 h-4 text-purple-400" />
              2. Quotations
            </NavLink>
            <NavLink to="/sales-orders" class={navLinkClass}>
              <ShoppingBag class="w-4 h-4 text-emerald-400" />
              3. Sales Orders
            </NavLink>
            <NavLink to="/inventory" class={navLinkClass}>
              <Package class="w-4 h-4 text-amber-400" />
              Inventory Stock
            </NavLink>
          </nav>

          {/* User Profile & Actions */}
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div class="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <User class="w-4 h-4" />
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-white leading-tight">{user?.name}</div>
                <div class="flex items-center gap-1 mt-0.5">
                  <ShieldCheck class={`w-3 h-3 ${isAdmin ? 'text-amber-400' : 'text-blue-400'}`} />
                  <span class={`text-[10px] font-bold uppercase ${isAdmin ? 'text-amber-400' : 'text-blue-400'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700 hover:border-red-600"
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

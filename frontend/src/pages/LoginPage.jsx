import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2, Package } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/sales-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center mb-3">
          <div class="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Package class="w-6 h-6" />
          </div>
        </div>
        <h1 class="text-2xl font-black text-slate-900 text-center tracking-tight">
          FundsRoom ERP System
        </h1>
        <p class="mt-1 text-center text-xs font-semibold text-slate-500">
          Sign in to access your industrial supply chain & inventory ledger
        </p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white border border-slate-200 p-8 shadow-sm rounded-2xl">
          {error && (
            <div class="mb-5 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
              <ShieldAlert class="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fundsroom.com"
                  class="w-full bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-xs font-mono font-semibold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  class="w-full bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-xs font-mono font-semibold text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-blue-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In to ERP System'}
              {!loading && <ArrowRight class="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div class="mt-8 pt-6 border-t border-slate-100">
            <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Click to Auto-Fill Test Account
            </span>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@fundsroom.com', 'Admin@123')}
                class="p-3 border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 rounded-xl text-left transition-all group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-amber-900 text-[11px]">ADMIN</span>
                  <CheckCircle2 class="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span class="block text-amber-700 font-mono text-[11px] mt-0.5 truncate">admin@fundsroom.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sales@fundsroom.com', 'Sales@123')}
                class="p-3 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 rounded-xl text-left transition-all group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-blue-900 text-[11px]">SALES_USER</span>
                  <CheckCircle2 class="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span class="block text-blue-700 font-mono text-[11px] mt-0.5 truncate">sales@fundsroom.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div class="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Lock class="w-6 h-6" />
          </div>
        </div>
        <h2 class="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          PERN ERP Login
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600">
          Sign in to access your sales & inventory management suite
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div class="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
              <ShieldAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-slate-700">Email Address</label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail class="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fundsroom.com"
                  class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700">Password</label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock class="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight class="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div class="mt-8 pt-6 border-t border-slate-200">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Test Login Credentials
            </p>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@fundsroom.com', 'Admin@123')}
                class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-left hover:bg-amber-100 transition-colors group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-900">ADMIN</span>
                  <CheckCircle2 class="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span class="block text-xs text-amber-700 font-mono mt-0.5 truncate">admin@fundsroom.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sales@fundsroom.com', 'Sales@123')}
                class="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-blue-900">SALES_USER</span>
                  <CheckCircle2 class="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span class="block text-xs text-blue-700 font-mono mt-0.5 truncate">sales@fundsroom.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

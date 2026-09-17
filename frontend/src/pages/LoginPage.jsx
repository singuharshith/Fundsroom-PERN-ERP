import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      setError(err.response?.data?.error || 'Authentication failed. Check user credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div class="min-h-screen bg-[#1B1F22] text-[#E9E6DF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="border border-[#3A4145] bg-[#23282C] p-3 text-center mb-4">
          <span class="font-mono text-xs text-[#8F9799] uppercase tracking-wider">Control-Room Terminal</span>
        </div>
        <h1 class="text-xl font-semibold text-[#E9E6DF] text-center">
          FundsRoom ERP system
        </h1>
        <p class="mt-1 text-center text-xs text-[#8F9799]">
          Authenticate to access industrial supply chain ledger
        </p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-[#23282C] border border-[#3A4145] p-6">
          {error && (
            <div class="mb-4 bg-[#1B1F22] border-l-2 border-[#B8543F] p-3 text-xs text-[#B8543F] font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-[#8F9799] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fundsroom.com"
                class="w-full bg-[#1B1F22] border border-[#3A4145] px-3 py-2 text-xs font-mono text-[#E9E6DF] focus:border-[#5B84A8] focus:outline-none rounded-[4px]"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-[#8F9799] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                class="w-full bg-[#1B1F22] border border-[#3A4145] px-3 py-2 text-xs font-mono text-[#E9E6DF] focus:border-[#5B84A8] focus:outline-none rounded-[4px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-[#D99A3D] text-[#1B1F22] font-semibold text-xs py-2.5 rounded-[4px] hover:bg-[#c48933] transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign in to terminal'}
            </button>
          </form>

          {/* Test Credentials */}
          <div class="mt-6 pt-5 border-t border-[#3A4145]">
            <span class="block text-[11px] font-mono text-[#8F9799] mb-2">
              Test authentication accounts
            </span>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@fundsroom.com', 'Admin@123')}
                class="p-2 border border-[#3A4145] bg-[#1B1F22] hover:bg-[#2A3034] text-left transition-colors"
              >
                <span class="block text-[#D99A3D] font-bold text-[10px]">ADMIN</span>
                <span class="block text-[#8F9799] text-[11px] truncate">admin@fundsroom.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sales@fundsroom.com', 'Sales@123')}
                class="p-2 border border-[#3A4145] bg-[#1B1F22] hover:bg-[#2A3034] text-left transition-colors"
              >
                <span class="block text-[#5B84A8] font-bold text-[10px]">SALES_USER</span>
                <span class="block text-[#8F9799] text-[11px] truncate">sales@fundsroom.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

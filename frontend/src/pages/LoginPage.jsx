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
    <div className="min-h-screen bg-white text-[#1F2937] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-xl font-semibold text-[#1F2937] text-center">
          FundsRoom ERP
        </h1>
        <p className="mt-1 text-center text-xs text-[#667085]">
          Sign in to access your enterprise ledger
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#F6F7F8] border border-[#DADFE3] p-6 rounded-[4px]">
          {error && (
            <div className="mb-4 bg-white border border-[#B23A32] p-3 rounded-[4px] text-xs font-medium text-[#B23A32]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fundsroom.com"
                className="w-full bg-white border border-[#DADFE3] px-3 py-2 text-xs font-mono text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#DADFE3] px-3 py-2 text-xs font-mono text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-[#DADFE3]">
            <span className="block text-[11px] font-semibold text-[#667085] text-center mb-2">
              Auto-fill test credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@fundsroom.com', 'Admin@123')}
                className="btn-outline text-left py-2 px-3 block"
              >
                <span className="font-semibold text-[#1F2937] block text-[11px]">Admin User</span>
                <span className="text-[#667085] font-mono text-[10px]">admin@fundsroom.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sales@fundsroom.com', 'Sales@123')}
                className="btn-outline text-left py-2 px-3 block"
              >
                <span className="font-semibold text-[#1F2937] block text-[11px]">Sales User</span>
                <span className="text-[#667085] font-mono text-[10px]">sales@fundsroom.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

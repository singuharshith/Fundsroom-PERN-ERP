import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[#1B1F22] text-[#E9E6DF]">
        <div class="text-center font-mono text-xs text-[#8F9799]">
          Querying terminal session...
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div class="min-h-screen bg-[#1B1F22] text-[#E9E6DF] flex flex-col">
      <Navbar />
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EnquiriesPage from './pages/EnquiriesPage';
import QuotationsPage from './pages/QuotationsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import InventoryPage from './pages/InventoryPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/enquiries" element={<EnquiriesPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/sales-orders" element={<SalesOrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/" element={<Navigate to="/sales-orders" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/sales-orders" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

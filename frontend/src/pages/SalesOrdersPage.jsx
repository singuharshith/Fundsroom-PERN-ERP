import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Eye, CheckCircle2, Truck, X, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);

  // Dispatch Form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchError, setDispatchError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { isAdmin, user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales-orders');
      setSalesOrders(res.data.sales_orders);
    } catch (err) {
      console.error('Failed to load Sales Orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (orderId) => {
    if (!isAdmin) {
      alert('Access Denied: Only ADMIN users can confirm sales orders and reserve inventory.');
      return;
    }

    if (!window.confirm('Confirm this Sales Order and reserve stock?')) return;

    try {
      await api.post(`/sales-orders/${orderId}/confirm`);
      alert('Sales Order confirmed and stock reserved successfully!');
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm Sales Order.');
    }
  };

  const handleOpenDispatch = (order) => {
    if (!isAdmin) {
      alert('Access Denied: Only ADMIN users can dispatch sales orders.');
      return;
    }
    setDispatchOrder(order);
    setVehicleNumber('');
    setDriverName('');
    setDispatchError('');
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchError('');

    if (!vehicleNumber || !driverName) {
      setDispatchError('Please enter both Vehicle Number and Driver Name.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/sales-orders/${dispatchOrder.id}/dispatch`, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
      });

      alert('Sales Order dispatched successfully!');
      setDispatchOrder(null);
      fetchData();
    } catch (err) {
      setDispatchError(err.response?.data?.error || 'Dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DISPATCHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag class="w-7 h-7 text-blue-600" />
            Sales Orders & Reservations
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage confirmed orders, inspect real-time inventory availability, and process dispatches
          </p>
        </div>
        <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <span class="font-medium text-slate-600">Active Role:</span>
          <span class={`font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div class="p-12 text-center text-slate-500">Loading Sales Orders...</div>
        ) : salesOrders.length === 0 ? (
          <div class="p-12 text-center text-slate-500">No Sales Orders found. Convert an Accepted Quotation to generate one.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4">Order #</th>
                  <th class="px-6 py-4">Customer</th>
                  <th class="px-6 py-4">Order Date</th>
                  <th class="px-6 py-4">Total Amount</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {salesOrders.map((order) => (
                  <tr key={order.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-semibold text-blue-600 font-mono">
                      {order.order_number}
                    </td>
                    <td class="px-6 py-4 font-medium text-slate-900">
                      {order.customer?.company_name}
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 font-mono text-base">
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Details"
                      >
                        <Eye class="w-4 h-4" />
                        Details
                      </button>

                      {order.status === 'PENDING' && (
                        isAdmin ? (
                          <button
                            onClick={() => handleConfirmReservation(order.id)}
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 class="w-3.5 h-3.5" />
                            Confirm & Reserve Stock
                          </button>
                        ) : (
                          <button
                            disabled
                            class="px-3 py-1 bg-slate-200 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                            title="Admin rights required to confirm reservation"
                          >
                            <ShieldAlert class="w-3.5 h-3.5" />
                            Reserve Stock (Admin Only)
                          </button>
                        )
                      )}

                      {order.status === 'CONFIRMED' && (
                        isAdmin ? (
                          <button
                            onClick={() => handleOpenDispatch(order)}
                            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Truck class="w-3.5 h-3.5" />
                            Dispatch Order
                          </button>
                        ) : (
                          <button
                            disabled
                            class="px-3 py-1 bg-slate-200 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                            title="Admin rights required to dispatch"
                          >
                            <ShieldAlert class="w-3.5 h-3.5" />
                            Dispatch (Admin Only)
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Stock Availability Modal */}
      {selectedOrder && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-xs font-semibold text-blue-600 font-mono uppercase tracking-wider">Sales Order Specification</span>
                <h3 class="text-xl font-bold text-slate-900">{selectedOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span class="block text-xs text-slate-400 font-medium">Customer</span>
                <span class="font-semibold text-slate-800">{selectedOrder.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Order Date</span>
                <span class="font-medium text-slate-800">{new Date(selectedOrder.order_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Total Amount</span>
                <span class="font-bold text-slate-900 font-mono">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Line Items & Live Inventory Availability */}
            <div>
              <h4 class="text-sm font-bold text-slate-900 mb-3">Line Items & Real-Time Stock Availability</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-2.5">Product</th>
                      <th class="px-4 py-2.5 text-center">Req Qty</th>
                      <th class="px-4 py-2.5 text-center">Physical</th>
                      <th class="px-4 py-2.5 text-center">Reserved</th>
                      <th class="px-4 py-2.5 text-center">Available</th>
                      <th class="px-4 py-2.5 text-right">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => {
                      const inv = item.product?.inventory;
                      const available = inv ? inv.available_quantity : 0;
                      const isStockShort = selectedOrder.status === 'PENDING' && available < item.quantity;

                      return (
                        <tr key={item.id} class={isStockShort ? 'bg-red-50/50' : ''}>
                          <td class="px-4 py-3 font-medium text-slate-800">
                            {item.product?.product_name}
                            <span class="block text-xs font-mono text-slate-400">{item.product?.product_code}</span>
                          </td>
                          <td class="px-4 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                          <td class="px-4 py-3 text-center font-mono text-slate-600">{inv ? inv.physical_quantity : 0}</td>
                          <td class="px-4 py-3 text-center font-mono text-amber-700 font-semibold">{inv ? inv.reserved_quantity : 0}</td>
                          <td class={`px-4 py-3 text-center font-mono font-bold ${isStockShort ? 'text-red-600' : 'text-emerald-700'}`}>
                            {available}
                          </td>
                          <td class="px-4 py-3 text-right">
                            {isStockShort ? (
                              <span class="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                                <AlertTriangle class="w-3 h-3" /> Short Stock
                              </span>
                            ) : (
                              <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Sufficient Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatches summary if dispatched */}
            {selectedOrder.dispatches?.length > 0 && (
              <div>
                <h4 class="text-sm font-bold text-slate-900 mb-2">Dispatch Log</h4>
                {selectedOrder.dispatches.map(d => (
                  <div key={d.id} class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                    <div class="font-bold text-emerald-900">Dispatch #{d.dispatch_number}</div>
                    <div>Vehicle: <span class="font-mono font-semibold">{d.vehicle_number}</span> | Driver: <span class="font-semibold">{d.driver_name}</span></div>
                    <div class="text-slate-500">Date: {new Date(d.dispatch_date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div class="pt-4 flex items-center justify-between border-t border-slate-100">
              <div>
                {selectedOrder.status === 'PENDING' && isAdmin && (
                  <button
                    onClick={() => handleConfirmReservation(selectedOrder.id)}
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                    Confirm & Reserve Stock Now
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && isAdmin && (
                  <button
                    onClick={() => { setSelectedOrder(null); handleOpenDispatch(selectedOrder); }}
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <Truck class="w-4 h-4" />
                    Process Dispatch
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Action Modal */}
      {dispatchOrder && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck class="w-5 h-5 text-emerald-600" />
                Dispatch Sales Order {dispatchOrder.order_number}
              </h3>
              <button
                onClick={() => setDispatchOrder(null)}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            {dispatchError && (
              <div class="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium border border-red-200">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Vehicle Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p class="font-bold">Inventory Impact Notice:</p>
                <p>Dispatching this order will permanently decrement both Physical Stock and Reserved Stock in database transaction.</p>
              </div>

              <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

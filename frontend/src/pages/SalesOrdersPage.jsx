import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WorkflowTracker from '../components/WorkflowTracker';
import { ShoppingBag, Eye, CheckCircle2, Truck, X, AlertTriangle, ShieldAlert, Lock, ArrowRight } from 'lucide-react';

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

    if (!window.confirm('Confirm this Sales Order and reserve stock atomically?')) return;

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
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DISPATCHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalOrdersCount = salesOrders.length;
  const pendingCount = salesOrders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = salesOrders.filter(o => o.status === 'CONFIRMED').length;
  const dispatchedCount = salesOrders.filter(o => o.status === 'DISPATCHED').length;

  return (
    <div class="space-y-6">
      {/* ERP Stepper Progress */}
      <WorkflowTracker currentStep={3} />

      {/* KPI Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Sales Orders</span>
          <div class="text-2xl font-black text-slate-900 mt-1">{totalOrdersCount}</div>
          <span class="text-xs text-slate-500 font-medium">Converted from quotations</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Reservations</span>
          <div class="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <span class="text-xs text-slate-500 font-medium">Awaiting Admin stock lock</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Confirmed & Reserved</span>
          <div class="text-2xl font-black text-blue-700 mt-1">{confirmedCount}</div>
          <span class="text-xs text-slate-500 font-medium">Ready for dispatch</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Dispatched Orders</span>
          <div class="text-2xl font-black text-emerald-600 mt-1">{dispatchedCount}</div>
          <span class="text-xs text-slate-500 font-medium">Fulfilled & shipped</span>
        </div>
      </div>

      {/* Page Action Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag class="w-6 h-6 text-emerald-600" />
            Sales Orders, Reservation & Dispatch (Steps 3, 4 & 5)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Confirm orders to lock inventory atomically, inspect stock availability, and process final dispatches
          </p>
        </div>
        <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <span>Active Role Protection:</span>
          <span class={`px-2 py-0.5 rounded-md font-bold text-white ${isAdmin ? 'bg-amber-500' : 'bg-blue-600'}`}>
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
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Order ID</th>
                  <th class="px-6 py-3.5">Customer</th>
                  <th class="px-6 py-3.5">Order Date</th>
                  <th class="px-6 py-3.5">Total Amount (₹)</th>
                  <th class="px-6 py-3.5">Pipeline Status</th>
                  <th class="px-6 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {salesOrders.map((order) => (
                  <tr key={order.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-bold text-emerald-700 font-mono text-xs">
                      {order.order_number}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 text-xs">
                      {order.customer?.company_name}
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 font-black text-slate-900 font-mono text-sm">
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Eye class="w-3.5 h-3.5" />
                        Inspect Stock
                      </button>

                      {order.status === 'PENDING' && (
                        isAdmin ? (
                          <button
                            onClick={() => handleConfirmReservation(order.id)}
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Lock class="w-3.5 h-3.5" />
                            Step 4: Reserve Stock (Admin)
                          </button>
                        ) : (
                          <button
                            disabled
                            class="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1 border border-slate-200"
                            title="Admin role required to reserve stock"
                          >
                            <ShieldAlert class="w-3 h-3 text-slate-400" />
                            Reserve (Admin Only)
                          </button>
                        )
                      )}

                      {order.status === 'CONFIRMED' && (
                        isAdmin ? (
                          <button
                            onClick={() => handleOpenDispatch(order)}
                            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Truck class="w-3.5 h-3.5" />
                            Step 5: Dispatch Order (Admin)
                          </button>
                        ) : (
                          <button
                            disabled
                            class="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1 border border-slate-200"
                            title="Admin role required to dispatch"
                          >
                            <ShieldAlert class="w-3 h-3 text-slate-400" />
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
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[11px] font-bold text-emerald-600 font-mono uppercase tracking-wider">Order Specification & Stock Verification</span>
                <h3 class="text-lg font-extrabold text-slate-900">{selectedOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                <span class="font-bold text-slate-900 text-sm">{selectedOrder.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Order Date</span>
                <span class="font-semibold text-slate-800">{new Date(selectedOrder.order_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Pipeline Status</span>
                <span class={`inline-block mt-0.5 px-2.5 py-0.5 text-xs font-bold rounded-md border ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Total Amount</span>
                <span class="font-black text-slate-900 font-mono text-sm">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Line Items & Live Inventory Availability */}
            <div>
              <h4 class="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Real-Time Inventory Stock Check</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table class="w-full text-left">
                  <thead class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-2.5">Product Description</th>
                      <th class="px-4 py-2.5 text-center">Order Qty</th>
                      <th class="px-4 py-2.5 text-center">Physical Stock</th>
                      <th class="px-4 py-2.5 text-center">Reserved Stock</th>
                      <th class="px-4 py-2.5 text-center">Available Stock</th>
                      <th class="px-4 py-2.5 text-right">Reservation Feasibility</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => {
                      const inv = item.product?.inventory;
                      const available = inv ? inv.available_quantity : 0;
                      const isStockShort = selectedOrder.status === 'PENDING' && available < item.quantity;

                      return (
                        <tr key={item.id} class={isStockShort ? 'bg-rose-50/50' : ''}>
                          <td class="px-4 py-3 font-semibold text-slate-800">
                            {item.product?.product_name}
                            <span class="block text-[11px] font-mono text-slate-400">{item.product?.product_code}</span>
                          </td>
                          <td class="px-4 py-3 text-center font-black text-slate-900">{item.quantity}</td>
                          <td class="px-4 py-3 text-center font-mono font-medium text-slate-600">{inv ? inv.physical_quantity : 0}</td>
                          <td class="px-4 py-3 text-center font-mono font-bold text-amber-700">{inv ? inv.reserved_quantity : 0}</td>
                          <td class={`px-4 py-3 text-center font-mono font-black text-sm ${isStockShort ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {available}
                          </td>
                          <td class="px-4 py-3 text-right">
                            {isStockShort ? (
                              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                                <AlertTriangle class="w-3 h-3" /> Insufficient Stock
                              </span>
                            ) : (
                              <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Ready to Reserve
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
                <h4 class="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Outbound Dispatch Details</h4>
                {selectedOrder.dispatches.map(d => (
                  <div key={d.id} class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                    <div class="font-bold text-emerald-900">Dispatch Voucher #{d.dispatch_number}</div>
                    <div class="font-medium text-slate-700">Vehicle: <span class="font-mono font-bold text-slate-900">{d.vehicle_number}</span> | Driver: <span class="font-bold text-slate-900">{d.driver_name}</span></div>
                    <div class="text-[11px] text-slate-500">Dispatch Time: {new Date(d.dispatch_date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div class="pt-3 flex items-center justify-between border-t border-slate-100">
              <div>
                {selectedOrder.status === 'PENDING' && isAdmin && (
                  <button
                    onClick={() => handleConfirmReservation(selectedOrder.id)}
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Lock class="w-4 h-4" />
                    Reserve Stock Now (Atomic Transaction)
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && isAdmin && (
                  <button
                    onClick={() => { setSelectedOrder(null); handleOpenDispatch(selectedOrder); }}
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Truck class="w-4 h-4" />
                    Process Outbound Dispatch
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Action Modal */}
      {dispatchOrder && (
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Step 5 Final Action</span>
                <h3 class="text-base font-extrabold text-slate-900">Dispatch Order {dispatchOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setDispatchOrder(null)}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            {dispatchError && (
              <div class="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-200">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} class="space-y-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  class="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  class="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p class="font-bold flex items-center gap-1">
                  <AlertTriangle class="w-3.5 h-3.5 text-amber-600" /> Stock Decrement Notice:
                </p>
                <p class="text-[11px] leading-relaxed">
                  Executing dispatch will permanently decrement both <strong>Physical Stock</strong> and <strong>Reserved Stock</strong> in a single atomic transaction.
                </p>
              </div>

              <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Confirm Outbound Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

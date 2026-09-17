import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WorkflowTracker from '../components/WorkflowTracker';

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [pulsingOrderId, setPulsingOrderId] = useState(null);

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
      alert('Access denied: ADMIN role required to confirm reservation.');
      return;
    }

    if (!window.confirm('Confirm sales order and reserve stock atomically?')) return;

    try {
      await api.post(`/sales-orders/${orderId}/confirm`);
      setPulsingOrderId(orderId);
      setTimeout(() => setPulsingOrderId(null), 800);
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm reservation.');
    }
  };

  const handleOpenDispatch = (order) => {
    if (!isAdmin) {
      alert('Access denied: ADMIN role required to dispatch order.');
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
      setDispatchError('Vehicle registration number and driver name are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/sales-orders/${dispatchOrder.id}/dispatch`, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
      });

      setDispatchOrder(null);
      fetchData();
    } catch (err) {
      setDispatchError(err.response?.data?.error || 'Dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border border-amber-300';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-800 border border-blue-300';
      case 'DISPATCHED':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  const totalOrdersCount = salesOrders.length;
  const pendingCount = salesOrders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = salesOrders.filter(o => o.status === 'CONFIRMED').length;
  const dispatchedCount = salesOrders.filter(o => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-6">
      {/* Routing Strip Tracker */}
      <WorkflowTracker currentStep={3} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sales Orders</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{totalOrdersCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Reservations</div>
          <div className="font-mono text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmed & Reserved</div>
          <div className="font-mono text-2xl font-bold text-blue-600 mt-1">{confirmedCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dispatched Orders</div>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1">{dispatchedCount}</div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Orders & Stock Reservations</h1>
          <p className="text-xs text-slate-600 mt-1">
            Confirmed orders lock inventory stock atomically in database transactions before final dispatch
          </p>
        </div>
        <div className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg self-start sm:self-auto">
          Logged-in user: <span className={isAdmin ? 'text-amber-700 font-bold' : 'text-blue-700 font-bold'}>{user?.role}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">Loading sales orders ledger...</div>
        ) : salesOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No sales orders found in ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order Code</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5 text-right">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesOrders.map((order) => {
                  const isPulsing = pulsingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPulsing ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-4 text-slate-900 font-semibold">
                        {order.customer?.company_name}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {new Date(order.order_date).toISOString().split('T')[0]}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                        ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2 font-mono">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-sans font-medium transition-colors"
                        >
                          Inspect
                        </button>

                        {order.status === 'PENDING' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleConfirmReservation(order.id)}
                              className="px-3.5 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold rounded-md shadow-sm transition-colors"
                            >
                              Reserve Stock
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-400 rounded-md font-sans cursor-not-allowed"
                            >
                              Reserve (Admin only)
                            </button>
                          )
                        )}

                        {order.status === 'CONFIRMED' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleOpenDispatch(order)}
                              className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold rounded-md shadow-sm transition-colors"
                            >
                              Dispatch
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-400 rounded-md font-sans cursor-not-allowed"
                            >
                              Dispatch (Admin only)
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Sales Order Ledger Entry</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedOrder.order_number}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Customer</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{selectedOrder.customer?.company_name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Order Date</span>
                <span className="font-mono text-slate-800 mt-0.5 block">{new Date(selectedOrder.order_date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Status</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Total Amount</span>
                <span className="font-mono text-slate-900 font-bold mt-0.5 block">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-xs font-bold text-slate-900">Stock Reservation Ledger</span>
                <span className="font-mono text-[11px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">AVAIL = PHYS − RSVD</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Requested</th>
                      <th className="p-3 text-right">Physical</th>
                      <th className="p-3 text-right">Reserved</th>
                      <th className="p-3 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => {
                      const inv = item.product?.inventory;
                      const available = inv ? inv.available_quantity : 0;
                      const isShort = selectedOrder.status === 'PENDING' && available < item.quantity;

                      return (
                        <tr key={item.id} className={isShort ? 'bg-rose-50/60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3 font-mono font-bold text-blue-600">{item.product?.product_code}</td>
                          <td className="p-3 font-medium text-slate-900">{item.product?.product_name}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{inv ? inv.physical_quantity : 0}</td>
                          <td className="p-3 text-right font-mono text-amber-700 font-semibold">{inv ? inv.reserved_quantity : 0}</td>
                          <td className={`p-3 text-right font-mono font-bold ${isShort ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {available}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.dispatches?.length > 0 && (
              <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-emerald-700">Dispatch Record</span>
                {selectedOrder.dispatches.map(d => (
                  <div key={d.id} className="font-mono text-slate-800">
                    {d.dispatch_number} | Vehicle: <span className="font-semibold text-slate-900">{d.vehicle_number}</span> | Driver: <span className="font-semibold text-slate-900">{d.driver_name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <div>
                {selectedOrder.status === 'PENDING' && isAdmin && (
                  <button
                    onClick={() => handleConfirmReservation(selectedOrder.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    Confirm & Reserve Stock
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && isAdmin && (
                  <button
                    onClick={() => { setSelectedOrder(null); handleOpenDispatch(selectedOrder); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    Dispatch Order
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-300 text-xs text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Dispatch Order {dispatchOrder.order_number}</h2>
              <button
                onClick={() => setDispatchOrder(null)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {dispatchError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs font-medium text-rose-700">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2.5 text-xs font-mono text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2.5 text-xs text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700">
                <span className="block font-mono text-blue-700 text-[10px] font-bold uppercase mb-0.5">Transaction Effect</span>
                Physical and reserved inventory stock will be decremented atomically upon confirmation.
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="px-4 py-2 border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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

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

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'border-l-[#D99A3D] text-[#D99A3D]';
      case 'CONFIRMED':
        return 'border-l-[#5B84A8] text-[#5B84A8]';
      case 'DISPATCHED':
        return 'border-l-[#5A9E7A] text-[#5A9E7A]';
      case 'CANCELLED':
        return 'border-l-[#B8543F] text-[#B8543F]';
      default:
        return 'border-l-[#8F9799] text-[#8F9799]';
    }
  };

  const totalOrdersCount = salesOrders.length;
  const pendingCount = salesOrders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = salesOrders.filter(o => o.status === 'CONFIRMED').length;
  const dispatchedCount = salesOrders.filter(o => o.status === 'DISPATCHED').length;

  return (
    <div class="space-y-5">
      {/* Routing Strip Tracker */}
      <WorkflowTracker currentStep={3} />

      {/* Hairline Stat Strip (Rule 4) */}
      <div class="bg-[#23282C] border border-[#3A4145] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3A4145]">
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#E9E6DF]">{totalOrdersCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Total sales orders</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#D99A3D]">{pendingCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Pending reservations</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#5B84A8]">{confirmedCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Confirmed & reserved</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#5A9E7A]">{dispatchedCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Dispatched orders</div>
        </div>
      </div>

      {/* Section Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3A4145] pb-4">
        <div>
          <h1 class="text-lg font-semibold text-[#E9E6DF]">Sales orders & reservations</h1>
          <p class="text-xs text-[#8F9799] mt-0.5">
            Confirmed orders lock stock atomically in transaction before final dispatch
          </p>
        </div>
        <div class="text-xs font-mono text-[#8F9799] bg-[#23282C] border border-[#3A4145] px-3 py-1.5 self-start sm:self-auto">
          User role: <span class={isAdmin ? 'text-[#D99A3D] font-bold' : 'text-[#5B84A8] font-bold'}>{user?.role}</span>
        </div>
      </div>

      {/* Table (Rule 8) */}
      <div class="bg-[#23282C] border border-[#3A4145]">
        {loading ? (
          <div class="p-8 text-center text-xs font-mono text-[#8F9799]">Querying database records...</div>
        ) : salesOrders.length === 0 ? (
          <div class="p-8 text-center text-xs text-[#8F9799]">No sales orders logged for this filter.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                <tr>
                  <th class="px-4 py-3">Order code</th>
                  <th class="px-4 py-3">Customer</th>
                  <th class="px-4 py-3">Order date</th>
                  <th class="px-4 py-3 text-right">Total amount</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3A4145]">
                {salesOrders.map((order) => {
                  const isPulsing = pulsingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      class={`hover:bg-[#2A3034] transition-colors ${
                        isPulsing ? 'animate-pulse-amber' : ''
                      }`}
                    >
                      <td class="px-4 py-3 font-mono font-semibold text-[#5A9E7A]">
                        {order.order_number}
                      </td>
                      <td class="px-4 py-3 text-[#E9E6DF] font-medium">
                        {order.customer?.company_name}
                      </td>
                      <td class="px-4 py-3 font-mono text-[#8F9799]">
                        {new Date(order.order_date).toISOString().split('T')[0]}
                      </td>
                      <td class="px-4 py-3 text-right font-mono font-semibold text-[#E9E6DF]">
                        ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td class="px-4 py-3">
                        <span class={`inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#1B1F22] rounded-[2px] ${getStatusBorderColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right space-x-1.5 font-mono">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          class="px-2 py-1 text-xs border border-[#3A4145] text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
                        >
                          Inspect
                        </button>

                        {order.status === 'PENDING' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleConfirmReservation(order.id)}
                              class="px-2.5 py-1 text-xs bg-[#D99A3D] text-[#1B1F22] font-semibold hover:bg-[#c48933] rounded-[4px]"
                            >
                              Reserve stock
                            </button>
                          ) : (
                            <button
                              disabled
                              class="px-2 py-1 text-xs border border-[#3A4145] text-[#8F9799] opacity-50 rounded-[4px] cursor-not-allowed"
                            >
                              Reserve (Admin only)
                            </button>
                          )
                        )}

                        {order.status === 'CONFIRMED' && (
                          isAdmin ? (
                            <button
                              onClick={() => handleOpenDispatch(order)}
                              class="px-2.5 py-1 text-xs bg-[#5A9E7A] text-[#1B1F22] font-semibold hover:bg-[#4d8a6a] rounded-[4px]"
                            >
                              Dispatch
                            </button>
                          ) : (
                            <button
                              disabled
                              class="px-2 py-1 text-xs border border-[#3A4145] text-[#8F9799] opacity-50 rounded-[4px] cursor-not-allowed"
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
        <div class="fixed inset-0 z-50 bg-[#1B1F22]/80 flex items-center justify-center p-4">
          <div class="bg-[#23282C] border border-[#3A4145] max-w-3xl w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <div>
                <span class="text-[11px] font-mono text-[#8F9799] uppercase">Sales order ledger entry</span>
                <h2 class="text-base font-semibold text-[#E9E6DF]">{selectedOrder.order_number}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="px-2 py-1 text-xs text-[#8F9799] border border-[#3A4145]"
              >
                Close
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#1B1F22] border border-[#3A4145] p-3">
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Customer</span>
                <span class="font-medium text-[#E9E6DF]">{selectedOrder.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Order date</span>
                <span class="font-mono text-[#E9E6DF]">{new Date(selectedOrder.order_date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#23282C] ${getStatusBorderColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Total amount</span>
                <span class="font-mono text-[#E9E6DF] font-semibold">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="block text-xs font-semibold text-[#E9E6DF]">Stock reservation ledger</span>
                <span class="font-mono text-[11px] text-[#8F9799]">AVAIL = PHYS − RSVD</span>
              </div>
              <table class="w-full text-left text-xs border border-[#3A4145]">
                <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                  <tr>
                    <th class="p-2">Code</th>
                    <th class="p-2">Product name</th>
                    <th class="p-2 text-right">Requested</th>
                    <th class="p-2 text-right">Physical</th>
                    <th class="p-2 text-right">Reserved</th>
                    <th class="p-2 text-right">Available</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3A4145]">
                  {selectedOrder.items?.map((item) => {
                    const inv = item.product?.inventory;
                    const available = inv ? inv.available_quantity : 0;
                    const isShort = selectedOrder.status === 'PENDING' && available < item.quantity;

                    return (
                      <tr key={item.id} class={isShort ? 'bg-[#B8543F]/10' : ''}>
                        <td class="p-2 font-mono text-[#5B84A8]">{item.product?.product_code}</td>
                        <td class="p-2 text-[#E9E6DF]">{item.product?.product_name}</td>
                        <td class="p-2 text-right font-mono font-semibold text-[#E9E6DF]">{item.quantity}</td>
                        <td class="p-2 text-right font-mono text-[#8F9799]">{inv ? inv.physical_quantity : 0}</td>
                        <td class="p-2 text-right font-mono text-[#D99A3D]">{inv ? inv.reserved_quantity : 0}</td>
                        <td class={`p-2 text-right font-mono font-bold ${isShort ? 'text-[#B8543F]' : 'text-[#5A9E7A]'}`}>
                          {available}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedOrder.dispatches?.length > 0 && (
              <div class="text-xs bg-[#1B1F22] border border-[#3A4145] p-3 space-y-1">
                <span class="block text-[10px] font-mono uppercase text-[#5A9E7A]">Dispatch record</span>
                {selectedOrder.dispatches.map(d => (
                  <div key={d.id} class="font-mono text-[#E9E6DF]">
                    {d.dispatch_number} | Vehicle: {d.vehicle_number} | Driver: {d.driver_name}
                  </div>
                ))}
              </div>
            )}

            <div class="pt-2 flex items-center justify-between">
              <div>
                {selectedOrder.status === 'PENDING' && isAdmin && (
                  <button
                    onClick={() => handleConfirmReservation(selectedOrder.id)}
                    class="bg-[#D99A3D] text-[#1B1F22] font-semibold text-xs px-3.5 py-1.5 rounded-[4px] hover:bg-[#c48933]"
                  >
                    Confirm & reserve stock
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && isAdmin && (
                  <button
                    onClick={() => { setSelectedOrder(null); handleOpenDispatch(selectedOrder); }}
                    class="bg-[#5A9E7A] text-[#1B1F22] font-semibold text-xs px-3.5 py-1.5 rounded-[4px] hover:bg-[#4d8a6a]"
                  >
                    Dispatch order
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                class="px-3 py-1.5 border border-[#3A4145] text-xs text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <div class="fixed inset-0 z-50 bg-[#1B1F22]/80 flex items-center justify-center p-4">
          <div class="bg-[#23282C] border border-[#3A4145] max-w-md w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <h2 class="text-base font-semibold text-[#E9E6DF]">Dispatch order {dispatchOrder.order_number}</h2>
              <button
                onClick={() => setDispatchOrder(null)}
                class="px-2 py-1 text-xs text-[#8F9799] border border-[#3A4145]"
              >
                Cancel
              </button>
            </div>

            {dispatchError && (
              <div class="bg-[#1B1F22] border-l-2 border-[#B8543F] p-3 text-xs font-mono text-[#B8543F]">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} class="space-y-3 text-xs">
              <div>
                <label class="block text-[#8F9799] mb-1">Vehicle registration number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs font-mono text-[#E9E6DF] rounded-[4px]"
                />
              </div>

              <div>
                <label class="block text-[#8F9799] mb-1">Driver name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs text-[#E9E6DF] rounded-[4px]"
                />
              </div>

              <div class="bg-[#1B1F22] border border-[#3A4145] p-3 text-xs text-[#8F9799]">
                <span class="block font-mono text-[#D99A3D] text-[10px] uppercase mb-1">Transaction effect</span>
                Physical and reserved inventory stock will be decremented atomically.
              </div>

              <div class="pt-3 flex justify-end gap-2 border-t border-[#3A4145]">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  class="px-3 py-1.5 border border-[#3A4145] text-xs text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="bg-[#5A9E7A] text-[#1B1F22] font-semibold text-xs px-4 py-1.5 rounded-[4px] hover:bg-[#4d8a6a] disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Confirm dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

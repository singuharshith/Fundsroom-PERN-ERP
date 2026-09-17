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

  const handleCancelOrder = async (orderId) => {
    if (!isAdmin) {
      alert('Access denied: ADMIN role required to cancel order.');
      return;
    }

    if (!window.confirm('Cancel this sales order? Stock reservations will be released.')) return;

    try {
      await api.post(`/sales-orders/${orderId}/cancel`);
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order.');
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="status-tag status-tag-warning">Pending</span>;
      case 'CONFIRMED':
        return <span className="status-tag status-tag-warning">Confirmed</span>;
      case 'DISPATCHED':
        return <span className="status-tag status-tag-success">Dispatched</span>;
      case 'CANCELLED':
        return <span className="status-tag status-tag-danger">Cancelled</span>;
      default:
        return <span className="status-tag status-tag-warning">{status}</span>;
    }
  };

  const totalOrdersCount = salesOrders.length;
  const pendingCount = salesOrders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = salesOrders.filter(o => o.status === 'CONFIRMED').length;
  const dispatchedCount = salesOrders.filter(o => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Title & Plain Text Breadcrumb */}
      <div>
        <h1 className="text-xl font-semibold text-[#1F2937]">Sales Orders & Stock Reservations</h1>
        <WorkflowTracker currentStep={3} />
      </div>

      {/* Stat Row: Plain numbers separated by 1px solid #DADFE3 vertical dividers */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DADFE3]">
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalOrdersCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Total sales orders</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{pendingCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Pending reservations</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{confirmedCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Confirmed & reserved</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{dispatchedCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Dispatched orders</div>
        </div>
      </div>

      {/* Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[#667085]">
          Confirmed orders lock inventory stock atomically in database transactions before final dispatch.
        </p>
        <div className="text-xs text-[#667085]">
          User role: <span className="font-semibold text-[#1F2937] capitalize">{user?.role?.toLowerCase()}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-[#667085]">Querying database records...</div>
        ) : salesOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No sales orders found in ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                <tr>
                  <th className="px-4 py-3">Order code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Order date</th>
                  <th className="px-4 py-3 text-right">Total amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADFE3]">
                {salesOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-[#F6F7F8] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-[#1F5C73]">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-[#1F2937] font-semibold">
                        {order.customer?.company_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#667085]">
                        {new Date(order.order_date).toISOString().split('T')[0]}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#1F2937]">
                        ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusTag(order.status)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn-outline text-xs px-2.5 py-1"
                        >
                          View Items
                        </button>

                        {order.status === 'PENDING' && (
                          isAdmin ? (
                            <>
                              <button
                                onClick={() => handleConfirmReservation(order.id)}
                                className="btn-primary text-xs px-2.5 py-1"
                              >
                                Confirm & Reserve Stock
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="btn-danger-outline text-xs px-2.5 py-1"
                              >
                                Cancel Order
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#667085]">Admin only</span>
                          )
                        )}

                        {order.status === 'CONFIRMED' && (
                          isAdmin ? (
                            <>
                              <button
                                onClick={() => handleOpenDispatch(order)}
                                className="btn-primary text-xs px-2.5 py-1"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="btn-danger-outline text-xs px-2.5 py-1"
                              >
                                Cancel Order
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#667085]">Admin only</span>
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-3xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <div>
                <span className="text-[11px] font-mono text-[#667085]">SALES ORDER DETAILS</span>
                <h2 className="text-base font-semibold text-[#1F2937]">{selectedOrder.order_number}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-outline text-xs px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F6F7F8] border border-[#DADFE3] p-3 rounded-[4px]">
              <div>
                <span className="block text-[11px] text-[#667085]">Customer</span>
                <span className="font-semibold text-[#1F2937]">{selectedOrder.customer?.company_name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Order date</span>
                <span className="font-mono text-[#1F2937]">{new Date(selectedOrder.order_date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Status</span>
                <span className="mt-0.5 inline-block">{getStatusTag(selectedOrder.status)}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Total amount</span>
                <span className="font-mono text-[#1F2937] font-semibold">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-xs font-semibold text-[#1F2937]">Stock reservation ledger</span>
                <span className="font-mono text-[11px] text-[#667085]">Available = Physical − Reserved</span>
              </div>
              <div className="border border-[#DADFE3] rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Product name</th>
                      <th className="p-2.5 text-right">Requested</th>
                      <th className="p-2.5 text-right">Physical</th>
                      <th className="p-2.5 text-right">Reserved</th>
                      <th className="p-2.5 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DADFE3]">
                    {selectedOrder.items?.map((item) => {
                      const inv = item.product?.inventory;
                      const available = inv ? inv.available_quantity : 0;
                      const isShort = selectedOrder.status === 'PENDING' && available < item.quantity;

                      return (
                        <tr key={item.id} className={isShort ? 'bg-[#FDF2F2]' : 'hover:bg-[#F6F7F8]'}>
                          <td className="p-2.5 font-mono font-semibold text-[#1F5C73]">{item.product?.product_code}</td>
                          <td className="p-2.5 text-[#1F2937]">{item.product?.product_name}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-[#1F2937]">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-[#667085]">{inv ? inv.physical_quantity : 0}</td>
                          <td className="p-2.5 text-right font-mono text-[#B4791F] font-semibold">{inv ? inv.reserved_quantity : 0}</td>
                          <td className={`p-2.5 text-right font-mono font-semibold ${isShort ? 'text-[#B23A32]' : 'text-[#2E7D5B]'}`}>
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
              <div className="text-xs bg-[#F6F7F8] border border-[#DADFE3] rounded-[4px] p-3 space-y-1">
                <span className="block text-[11px] font-semibold text-[#2E7D5B]">Dispatch record</span>
                {selectedOrder.dispatches.map(d => (
                  <div key={d.id} className="font-mono text-[#1F2937]">
                    {d.dispatch_number} | Vehicle: <span className="font-semibold">{d.vehicle_number}</span> | Driver: <span className="font-semibold">{d.driver_name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <div className="space-x-2">
                {selectedOrder.status === 'PENDING' && isAdmin && (
                  <>
                    <button
                      onClick={() => handleConfirmReservation(selectedOrder.id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Confirm & Reserve Stock
                    </button>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="btn-danger-outline text-xs px-3 py-1.5"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {selectedOrder.status === 'CONFIRMED' && isAdmin && (
                  <>
                    <button
                      onClick={() => { setSelectedOrder(null); handleOpenDispatch(selectedOrder); }}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Dispatch
                    </button>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="btn-danger-outline text-xs px-3 py-1.5"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-outline text-xs px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <h2 className="text-base font-semibold text-[#1F2937]">Dispatch order {dispatchOrder.order_number}</h2>
              <button
                onClick={() => setDispatchOrder(null)}
                className="btn-outline text-xs px-2.5 py-1"
              >
                Cancel
              </button>
            </div>

            {dispatchError && (
              <div className="bg-white border border-[#B23A32] p-3 rounded-[4px] text-xs font-medium text-[#B23A32]">
                {dispatchError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Vehicle registration number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Driver name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patil"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
                />
              </div>

              <div className="bg-[#F6F7F8] border border-[#DADFE3] p-3 rounded-[4px] text-xs text-[#667085]">
                <span className="block font-semibold text-[#1F2937] text-[11px] mb-0.5">Transaction effect</span>
                Physical and reserved inventory stock will be decremented atomically upon confirmation.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#DADFE3]">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs px-4 py-1.5"
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

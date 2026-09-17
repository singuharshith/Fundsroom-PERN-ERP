import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);
  const [restockError, setRestockError] = useState(null);
  const [restockSuccess, setRestockSuccess] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data.inventory);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRestockModal = (item = null) => {
    setRestockError(null);
    setRestockSuccess(null);
    if (item) {
      setSelectedProduct(item);
    } else if (inventory.length > 0) {
      setSelectedProduct(inventory[0]);
    }
    setRestockQty('');
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !restockQty || parseInt(restockQty, 10) <= 0) {
      setRestockError('Please specify a valid product and positive restock quantity.');
      return;
    }

    try {
      setRestockSubmitting(true);
      setRestockError(null);
      const res = await api.post('/inventory/restock', {
        product_id: selectedProduct.product_id || selectedProduct.id,
        quantity: parseInt(restockQty, 10),
      });

      setRestockSuccess(res.data.message || 'Inventory restocked successfully.');
      setTimeout(() => {
        setShowRestockModal(false);
        setRestockSuccess(null);
        fetchInventory();
      }, 1000);
    } catch (err) {
      setRestockError(err.response?.data?.error || 'Failed to restock inventory.');
    } finally {
      setRestockSubmitting(false);
    }
  };

  const totalSKUs = inventory.length;
  const totalPhysical = inventory.reduce((acc, i) => acc + i.physical_quantity, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reserved_quantity, 0);
  const totalAvailable = inventory.reduce((acc, i) => acc + i.available_quantity, 0);

  return (
    <div className="space-y-5 font-sans">
      {/* Title & Plain Text Breadcrumb */}
      <div>
        <h1 className="text-xl font-semibold text-[#1F2937]">Inventory Stock</h1>
        <WorkflowTracker currentStep={4} />
      </div>

      {/* Stat Row: Plain numbers separated by 1px solid #DADFE3 vertical dividers */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DADFE3]">
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalSKUs}</div>
          <div className="text-xs text-[#667085] mt-0.5">Total industrial SKUs</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalPhysical}</div>
          <div className="text-xs text-[#667085] mt-0.5">Physical units in stock</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalReserved}</div>
          <div className="text-xs text-[#667085] mt-0.5">Reserved units</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalAvailable}</div>
          <div className="text-xs text-[#667085] mt-0.5">Available units</div>
        </div>
      </div>

      {/* Plain formula sentence & actions above table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[#667085]">
          Available stock = Physical stock minus reserved stock. Stock is reserved automatically when Sales Orders are created.
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => openRestockModal(null)}
              className="bg-[#1F5C73] hover:bg-[#18485B] text-white text-xs font-semibold px-3 py-1.5 rounded-[4px] transition-colors"
            >
              + Add / Restock Stock
            </button>
          )}
          <button
            onClick={fetchInventory}
            className="btn-outline text-xs px-3 py-1.5"
          >
            Refresh stock
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-[#667085]">Querying database records...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No inventory items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                <tr>
                  <th className="px-4 py-3">Product code</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Base price (₹)</th>
                  <th className="px-4 py-3 text-center">Physical qty</th>
                  <th className="px-4 py-3 text-center">Reserved qty</th>
                  <th className="px-4 py-3 text-center">Available qty</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADFE3]">
                {inventory.map((item) => {
                  const isLowStock = item.available_quantity < 50;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F6F7F8] transition-colors ${
                        isLowStock ? 'border-l-[3px] border-l-[#B4791F]' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-[#1F5C73]">
                        {item.product_code}
                      </td>
                      <td className="px-4 py-3 text-[#1F2937] font-semibold">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-[#667085]">
                        <span className="px-1.5 py-0.5 bg-[#F6F7F8] border border-[#DADFE3] text-[11px] font-mono rounded-[4px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#1F2937]">
                        ₹{parseFloat(item.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-[#1F2937]">
                        {item.physical_quantity} <span className="text-[#667085] font-normal">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-[#B4791F]">
                        {item.reserved_quantity} <span className="text-[#667085] font-normal">{item.unit}</span>
                      </td>
                      <td className={`px-4 py-3 text-center font-mono font-semibold ${isLowStock ? 'text-[#B4791F]' : 'text-[#2E7D5B]'}`}>
                        {item.available_quantity} <span className="text-[#667085] font-normal text-xs">{item.unit}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openRestockModal(item)}
                            className="bg-[#1F5C73] hover:bg-[#18485B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-[4px] transition-colors"
                          >
                            + Add stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex justify-between items-center border-b border-[#DADFE3] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#1F2937]">Add Stock to Warehouse</h3>
                <p className="text-xs text-[#667085] mt-0.5">Admin function: Receive shipment / increment physical stock</p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-[#667085] hover:text-[#1F2937] text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {restockError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[4px]">
                {restockError}
              </div>
            )}

            {restockSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-[4px]">
                {restockSuccess}
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1F2937] mb-1">
                  Select Product SKU
                </label>
                <select
                  value={selectedProduct ? selectedProduct.product_id || selectedProduct.id : ''}
                  onChange={(e) => {
                    const found = inventory.find(
                      (i) => (i.product_id || i.id) === parseInt(e.target.value, 10)
                    );
                    setSelectedProduct(found);
                  }}
                  className="w-full text-xs p-2 border border-[#DADFE3] rounded-[4px] focus:outline-none focus:border-[#1F5C73] bg-white text-[#1F2937]"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.product_id || item.id}>
                      {item.product_code} — {item.product_name} (Current: {item.physical_quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-[#F6F7F8] p-3 border border-[#DADFE3] rounded-[4px] text-xs space-y-1">
                  <div className="flex justify-between text-[#667085]">
                    <span>Current Physical Qty:</span>
                    <span className="font-mono font-semibold text-[#1F2937]">{selectedProduct.physical_quantity} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>Currently Reserved:</span>
                    <span className="font-mono font-semibold text-[#B4791F]">{selectedProduct.reserved_quantity} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between text-[#667085]">
                    <span>Currently Available:</span>
                    <span className="font-mono font-semibold text-[#2E7D5B]">{selectedProduct.available_quantity} {selectedProduct.unit}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#1F2937] mb-1">
                  Restock Quantity (Units to Add)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full text-xs p-2 border border-[#DADFE3] rounded-[4px] focus:outline-none focus:border-[#1F5C73] font-mono text-[#1F2937]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DADFE3]">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="btn-outline text-xs px-3 py-1.5"
                  disabled={restockSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockSubmitting}
                  className="bg-[#1F5C73] hover:bg-[#18485B] text-white text-xs font-semibold px-4 py-1.5 rounded-[4px] transition-colors disabled:opacity-50"
                >
                  {restockSubmitting ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


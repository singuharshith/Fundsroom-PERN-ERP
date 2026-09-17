import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getStockStatusTag = (item) => {
    const available = item.available_quantity;
    if (available <= 0) {
      return (
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          Fully Reserved
        </span>
      );
    } else if (available < 50) {
      return (
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
        Healthy Stock
      </span>
    );
  };

  const totalSKUs = inventory.length;
  const totalPhysical = inventory.reduce((acc, i) => acc + i.physical_quantity, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reserved_quantity, 0);
  const totalAvailable = inventory.reduce((acc, i) => acc + i.available_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Step Tracker */}
      <WorkflowTracker currentStep={4} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total SKUs</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{totalSKUs}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Physical Stock</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{totalPhysical}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reserved Stock</div>
          <div className="font-mono text-2xl font-bold text-amber-600 mt-1">{totalReserved}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Stock</div>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1">{totalAvailable}</div>
        </div>
      </div>

      {/* Section Header & Formula */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Inventory Stock Ledger</h1>
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
              AVAIL = PHYS − RSVD
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Physical stock ledger vs reserved quantities locked for confirmed sales orders
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="px-4 py-2 bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-colors self-start sm:self-auto font-sans"
        >
          Refresh Ledger
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">Loading inventory ledger...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No inventory items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Product Code</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Base Price (₹)</th>
                  <th className="px-5 py-3.5 text-center">Physical Qty</th>
                  <th className="px-5 py-3.5 text-center">Reserved Qty</th>
                  <th className="px-5 py-3.5 text-center">Available Qty</th>
                  <th className="px-5 py-3.5 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {item.product_code}
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-semibold">
                      {item.product_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono rounded">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-800">
                      ₹{parseFloat(item.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">
                      {item.physical_quantity} <span className="text-slate-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-amber-700">
                      {item.reserved_quantity} <span className="text-slate-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-emerald-600 text-sm">
                      {item.available_quantity} <span className="text-slate-500 text-xs font-normal">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {getStockStatusTag(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

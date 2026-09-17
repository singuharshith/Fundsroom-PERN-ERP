import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';
import { Package, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

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
    } font-medium
      setLoading(false);
    }
  };

  const getStockStatusBadge = (item) => {
    const available = item.available_quantity;
    if (available <= 0) {
      return (
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
          <AlertTriangle class="w-3 h-3" /> Fully Reserved
        </span>
      );
    } else if (available < 50) {
      return (
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle class="w-3 h-3" /> Low Stock
        </span>
      );
    }
    return (
      <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
        <CheckCircle class="w-3 h-3" /> Healthy Stock
      </span>
    );
  };

  const totalSKUs = inventory.length;
  const totalPhysical = inventory.reduce((acc, i) => acc + i.physical_quantity, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reserved_quantity, 0);
  const totalAvailable = inventory.reduce((acc, i) => acc + i.available_quantity, 0);

  return (
    <div class="space-y-6">
      {/* ERP Stepper Progress */}
      <WorkflowTracker currentStep={4} />

      {/* KPI Overview Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Industrial SKUs</span>
          <div class="text-2xl font-black text-slate-900 mt-1">{totalSKUs}</div>
          <span class="text-xs text-slate-500 font-medium">Catalog products</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Total Physical Units</span>
          <div class="text-2xl font-black text-slate-800 mt-1 font-mono">{totalPhysical}</div>
          <span class="text-xs text-slate-500 font-medium">In warehouse storage</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Reserved Units</span>
          <div class="text-2xl font-black text-amber-700 mt-1 font-mono">{totalReserved}</div>
          <span class="text-xs text-slate-500 font-medium">Locked for confirmed orders</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Available Units</span>
          <div class="text-2xl font-black text-emerald-700 mt-1 font-mono">{totalAvailable}</div>
          <span class="text-xs text-slate-500 font-medium">Physical minus Reserved</span>
        </div>
      </div>

      {/* Page Action Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package class="w-6 h-6 text-amber-600" />
            Inventory Stock Matrix
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger. Formula: Available Quantity = Physical Quantity - Reserved Quantity
          </p>
        </div>
        <button
          onClick={fetchInventory}
          class="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw class="w-4 h-4" />
          Refresh Stock Ledger
        </button>
      </div>

      {/* Main Inventory Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div class="p-12 text-center text-slate-500">Loading inventory data...</div>
        ) : inventory.length === 0 ? (
          <div class="p-12 text-center text-slate-500">No inventory records available.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Product Code</th>
                  <th class="px-6 py-3.5">Product Description</th>
                  <th class="px-6 py-3.5">Category</th>
                  <th class="px-6 py-3.5 text-right">Base Price (₹)</th>
                  <th class="px-6 py-3.5 text-center">Physical Qty</th>
                  <th class="px-6 py-3.5 text-center">Reserved Qty</th>
                  <th class="px-6 py-3.5 text-center">Available Qty</th>
                  <th class="px-6 py-3.5 text-center">Health Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-mono font-bold text-amber-700 text-xs">
                      {item.product_code}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 text-xs">
                      {item.product_name}
                    </td>
                    <td class="px-6 py-4 text-xs font-medium text-slate-500">
                      <span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right font-mono font-semibold text-xs">
                      ₹{parseFloat(item.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-black text-slate-900 text-xs">
                      {item.physical_quantity} {item.unit}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-black text-amber-700 bg-amber-50/40 text-xs">
                      {item.reserved_quantity} {item.unit}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-black text-emerald-700 text-sm bg-emerald-50/40">
                      {item.available_quantity} {item.unit}
                    </td>
                    <td class="px-6 py-4 text-center">
                      {getStockStatusBadge(item)}
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

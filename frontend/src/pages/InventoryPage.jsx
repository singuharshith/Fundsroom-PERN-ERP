import React, { useState, useEffect } from 'react';
import api from '../api/axios';
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
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusBadge = (item) => {
    const available = item.available_quantity;
    if (available <= 0) {
      return (
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">
          <AlertTriangle class="w-3 h-3" /> Fully Reserved / Out
        </span>
      );
    } else if (available < 50) {
      return (
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full border border-amber-200">
          <AlertTriangle class="w-3 h-3" /> Low Stock
        </span>
      );
    }
    return (
      <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200">
        <CheckCircle class="w-3 h-3" /> In Stock
      </span>
    );
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package class="w-7 h-7 text-blue-600" />
            Inventory & Stock Availability
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Real-time physical vs reserved stock tracking. Available Quantity = Physical - Reserved
          </p>
        </div>
        <button
          onClick={fetchInventory}
          class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw class="w-4 h-4" />
          Refresh Stock
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
              <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4">Product Code</th>
                  <th class="px-6 py-4">Product Name</th>
                  <th class="px-6 py-4">Category</th>
                  <th class="px-6 py-4 text-right">Base Price</th>
                  <th class="px-6 py-4 text-center">Physical Qty</th>
                  <th class="px-6 py-4 text-center">Reserved Qty</th>
                  <th class="px-6 py-4 text-center">Available Qty</th>
                  <th class="px-6 py-4 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-mono font-semibold text-blue-600">
                      {item.product_code}
                    </td>
                    <td class="px-6 py-4 font-medium text-slate-900">
                      {item.product_name}
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right font-mono">
                      ₹{parseFloat(item.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-bold text-slate-900">
                      {item.physical_quantity} {item.unit}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-bold text-amber-700 bg-amber-50/50">
                      {item.reserved_quantity} {item.unit}
                    </td>
                    <td class="px-6 py-4 text-center font-mono font-bold text-emerald-700 text-base bg-emerald-50/50">
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

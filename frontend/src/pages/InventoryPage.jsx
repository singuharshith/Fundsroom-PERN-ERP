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
        <span class="inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 border-l-[#B8543F] text-[#B8543F] bg-[#1B1F22] rounded-[2px]">
          Fully reserved
        </span>
      );
    } else if (available < 50) {
      return (
        <span class="inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 border-l-[#D99A3D] text-[#D99A3D] bg-[#1B1F22] rounded-[2px]">
          Low stock
        </span>
      );
    }
    return (
      <span class="inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 border-l-[#5A9E7A] text-[#5A9E7A] bg-[#1B1F22] rounded-[2px]">
        Healthy stock
      </span>
    );
  };

  const totalSKUs = inventory.length;
  const totalPhysical = inventory.reduce((acc, i) => acc + i.physical_quantity, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reserved_quantity, 0);
  const totalAvailable = inventory.reduce((acc, i) => acc + i.available_quantity, 0);

  return (
    <div class="space-y-5">
      {/* Routing Strip Tracker */}
      <WorkflowTracker currentStep={4} />

      {/* Hairline Stat Strip (Rule 4) */}
      <div class="bg-[#23282C] border border-[#3A4145] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3A4145]">
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#E9E6DF]">{totalSKUs}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Total industrial SKUs</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#E9E6DF]">{totalPhysical}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Physical units in stock</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#D99A3D]">{totalReserved}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Reserved units</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#5A9E7A]">{totalAvailable}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Available units</div>
        </div>
      </div>

      {/* Section Header & Formula (Rule 10) */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3A4145] pb-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-semibold text-[#E9E6DF]">Inventory stock matrix</h1>
            <span class="font-mono text-xs text-[#8F9799] bg-[#1B1F22] border border-[#3A4145] px-2 py-0.5">
              AVAIL = PHYS − RSVD
            </span>
          </div>
          <p class="text-xs text-[#8F9799] mt-0.5">
            Physical stock ledger vs reserved quantities locked for confirmed orders
          </p>
        </div>
        <button
          onClick={fetchInventory}
          class="px-3.5 py-2 border border-[#3A4145] text-xs text-[#E9E6DF] hover:bg-[#2A3034] transition-colors rounded-[4px] self-start sm:self-auto font-mono"
        >
          Refresh ledger
        </button>
      </div>

      {/* Main Table (Rule 8) */}
      <div class="bg-[#23282C] border border-[#3A4145]">
        {loading ? (
          <div class="p-8 text-center text-xs font-mono text-[#8F9799]">Querying database records...</div>
        ) : inventory.length === 0 ? (
          <div class="p-8 text-center text-xs text-[#8F9799]">No inventory records logged for this filter.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                <tr>
                  <th class="px-4 py-3">Product code</th>
                  <th class="px-4 py-3">Description</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3 text-right">Base price (₹)</th>
                  <th class="px-4 py-3 text-center">Physical qty</th>
                  <th class="px-4 py-3 text-center">Reserved qty</th>
                  <th class="px-4 py-3 text-center">Available qty</th>
                  <th class="px-4 py-3 text-center">Stock status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3A4145]">
                {inventory.map((item) => (
                  <tr key={item.id} class="hover:bg-[#2A3034] transition-colors">
                    <td class="px-4 py-3 font-mono font-semibold text-[#5B84A8]">
                      {item.product_code}
                    </td>
                    <td class="px-4 py-3 text-[#E9E6DF] font-medium">
                      {item.product_name}
                    </td>
                    <td class="px-4 py-3 text-[#8F9799]">
                      <span class="px-1.5 py-0.5 bg-[#1B1F22] border border-[#3A4145] text-[11px] font-mono">
                        {item.category}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-[#E9E6DF]">
                      ₹{parseFloat(item.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-4 py-3 text-center font-mono font-bold text-[#E9E6DF]">
                      {item.physical_quantity} {item.unit}
                    </td>
                    <td class="px-4 py-3 text-center font-mono font-bold text-[#D99A3D]">
                      {item.reserved_quantity} {item.unit}
                    </td>
                    <td class="px-4 py-3 text-center font-mono font-bold text-[#5A9E7A] text-sm">
                      {item.available_quantity} {item.unit}
                    </td>
                    <td class="px-4 py-3 text-center">
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

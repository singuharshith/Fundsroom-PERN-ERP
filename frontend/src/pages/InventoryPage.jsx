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

      {/* Plain formula sentence above table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[#667085]">
          Available stock = Physical stock minus reserved stock.
        </p>
        <button
          onClick={fetchInventory}
          className="btn-outline text-xs px-3 py-1.5 self-start sm:self-auto"
        >
          Refresh stock
        </button>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

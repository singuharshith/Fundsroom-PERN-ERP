import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setEnquiries(enqRes.data.enquiries);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Failed to load enquiries data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerId) {
      setFormError('Select a customer account.');
      return;
    }
    if (!requiredDate) {
      setFormError('Select a required delivery date.');
      return;
    }

    const formattedItems = items.map(item => ({
      product_id: parseInt(item.product_id, 10),
      quantity: parseInt(item.quantity, 10),
    }));

    if (formattedItems.some(i => !i.product_id || isNaN(i.product_id))) {
      setFormError('Select a valid product for all items.');
      return;
    }

    if (formattedItems.some(i => !i.quantity || i.quantity <= 0)) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/enquiries', {
        customer_id: parseInt(customerId, 10),
        required_date: requiredDate,
        notes,
        items: formattedItems,
      });

      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setRequiredDate('');
    setNotes('');
    setItems([{ product_id: '', quantity: 1 }]);
    setFormError('');
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'NEW':
        return 'border-l-[#D99A3D] text-[#D99A3D]';
      case 'QUOTED':
        return 'border-l-[#5B84A8] text-[#5B84A8]';
      case 'WON':
        return 'border-l-[#5A9E7A] text-[#5A9E7A]';
      case 'LOST':
        return 'border-l-[#B8543F] text-[#B8543F]';
      default:
        return 'border-l-[#8F9799] text-[#8F9799]';
    }
  };

  const totalEnquiriesCount = enquiries.length;
  const newEnquiriesCount = enquiries.filter(e => e.status === 'NEW').length;
  const quotedCount = enquiries.filter(e => e.status === 'QUOTED').length;

  return (
    <div class="space-y-5">
      {/* Routing Strip Tracker */}
      <WorkflowTracker currentStep={1} />

      {/* Hairline Stat Strip (Rule 4) */}
      <div class="bg-[#23282C] border border-[#3A4145] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#3A4145]">
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#E9E6DF]">{totalEnquiriesCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Total enquiries</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#D99A3D]">{newEnquiriesCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">New pending enquiries</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#5B84A8]">{quotedCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Quoted enquiries</div>
        </div>
      </div>

      {/* Section Header & Primary Action */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3A4145] pb-4">
        <div>
          <h1 class="text-lg font-semibold text-[#E9E6DF]">Customer enquiries</h1>
          <p class="text-xs text-[#8F9799] mt-0.5">
            Initial product requirements logged by sales representatives
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          class="bg-[#D99A3D] hover:bg-[#c48933] text-[#1B1F22] font-semibold text-xs px-3.5 py-2 rounded-[4px] transition-colors self-start sm:self-auto"
        >
          Create enquiry
        </button>
      </div>

      {/* Table (Rule 8) */}
      <div class="bg-[#23282C] border border-[#3A4145]">
        {loading ? (
          <div class="p-8 text-center text-xs font-mono text-[#8F9799]">Querying database records...</div>
        ) : enquiries.length === 0 ? (
          <div class="p-8 text-center text-xs text-[#8F9799]">No enquiries logged for this filter.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                <tr>
                  <th class="px-4 py-3">Enquiry code</th>
                  <th class="px-4 py-3">Customer</th>
                  <th class="px-4 py-3">Enquiry date</th>
                  <th class="px-4 py-3">Required date</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Created by</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3A4145]">
                {enquiries.map((enq) => (
                  <tr key={enq.id} class="hover:bg-[#2A3034] transition-colors">
                    <td class="px-4 py-3 font-mono font-semibold text-[#5B84A8]">
                      {enq.enquiry_number}
                    </td>
                    <td class="px-4 py-3 text-[#E9E6DF]">
                      <div class="font-medium">{enq.customer?.company_name}</div>
                      <div class="text-[11px] text-[#8F9799] font-mono">{enq.customer?.city}</div>
                    </td>
                    <td class="px-4 py-3 font-mono text-[#8F9799]">
                      {new Date(enq.enquiry_date).toISOString().split('T')[0]}
                    </td>
                    <td class="px-4 py-3 font-mono text-[#8F9799]">
                      {new Date(enq.required_date).toISOString().split('T')[0]}
                    </td>
                    <td class="px-4 py-3">
                      <span class={`inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#1B1F22] rounded-[2px] ${getStatusBorderColor(enq.status)}`}>
                        {enq.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-[#8F9799]">
                      {enq.user?.name}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        class="px-2.5 py-1 text-xs border border-[#3A4145] text-[#E9E6DF] hover:bg-[#2A3034] transition-colors rounded-[4px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div class="fixed inset-0 z-50 bg-[#1B1F22]/80 flex items-center justify-center p-4">
          <div class="bg-[#23282C] border border-[#3A4145] max-w-2xl w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <div>
                <span class="text-[11px] font-mono text-[#8F9799] uppercase">Enquiry manifest</span>
                <h2 class="text-base font-semibold text-[#E9E6DF]">{selectedEnquiry.enquiry_number}</h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="px-2 py-1 text-xs text-[#8F9799] border border-[#3A4145] hover:text-[#E9E6DF]"
              >
                Close
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs bg-[#1B1F22] border border-[#3A4145] p-3">
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Customer</span>
                <span class="font-medium text-[#E9E6DF]">{selectedEnquiry.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Contact</span>
                <span class="font-medium text-[#8F9799]">{selectedEnquiry.customer?.contact_person} ({selectedEnquiry.customer?.mobile})</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Required date</span>
                <span class="font-mono text-[#E9E6DF]">{new Date(selectedEnquiry.required_date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#23282C] ${getStatusBorderColor(selectedEnquiry.status)}`}>
                  {selectedEnquiry.status}
                </span>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div class="text-xs bg-[#1B1F22] border border-[#3A4145] p-3 text-[#8F9799]">
                <span class="block text-[10px] font-mono uppercase text-[#E9E6DF] mb-1">Notes</span>
                {selectedEnquiry.notes}
              </div>
            )}

            <div>
              <span class="block text-xs font-semibold text-[#E9E6DF] mb-2">Line items manifest</span>
              <table class="w-full text-left text-xs border border-[#3A4145]">
                <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                  <tr>
                    <th class="p-2">Code</th>
                    <th class="p-2">Product name</th>
                    <th class="p-2 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3A4145]">
                  {selectedEnquiry.items?.map((item) => (
                    <tr key={item.id}>
                      <td class="p-2 font-mono text-[#5B84A8]">{item.product?.product_code}</td>
                      <td class="p-2 text-[#E9E6DF]">{item.product?.product_name}</td>
                      <td class="p-2 text-right font-mono font-semibold text-[#E9E6DF]">{item.quantity} {item.product?.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="px-3 py-1.5 border border-[#3A4145] text-xs text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div class="fixed inset-0 z-50 bg-[#1B1F22]/80 flex items-center justify-center p-4">
          <div class="bg-[#23282C] border border-[#3A4145] max-w-2xl w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <h2 class="text-base font-semibold text-[#E9E6DF]">Create customer enquiry</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                class="px-2 py-1 text-xs text-[#8F9799] border border-[#3A4145]"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div class="bg-[#1B1F22] border-l-2 border-[#B8543F] p-3 text-xs font-mono text-[#B8543F]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[#8F9799] mb-1">Customer account</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs text-[#E9E6DF] rounded-[4px]"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-[#8F9799] mb-1">Required date</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs font-mono text-[#E9E6DF] rounded-[4px]"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[#8F9799] mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any packaging or technical requirements..."
                  class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs text-[#E9E6DF] rounded-[4px]"
                />
              </div>

              {/* Line Items */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="block text-[#E9E6DF] font-semibold">Line items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    class="text-xs text-[#5B84A8] hover:underline font-mono"
                  >
                    + Add line item
                  </button>
                </div>

                <div class="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} class="flex items-center gap-2 bg-[#1B1F22] border border-[#3A4145] p-2">
                      <div class="flex-1">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          class="w-full bg-[#23282C] border border-[#3A4145] p-1.5 text-xs text-[#E9E6DF] rounded-[4px]"
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_code} - {p.product_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div class="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          class="w-full bg-[#23282C] border border-[#3A4145] p-1.5 text-xs font-mono text-[#E9E6DF] text-center rounded-[4px]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        class="text-[#B8543F] hover:underline text-xs disabled:opacity-30 px-1 font-mono"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-3 flex justify-end gap-2 border-t border-[#3A4145]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  class="px-3 py-1.5 border border-[#3A4145] text-xs text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="bg-[#D99A3D] text-[#1B1F22] font-semibold text-xs px-4 py-1.5 rounded-[4px] hover:bg-[#c48933] disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

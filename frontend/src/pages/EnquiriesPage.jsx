import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';
import { Plus, ClipboardList, Eye, X, Trash2 } from 'lucide-react';

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'QUOTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'WON':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOST':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const totalEnquiriesCount = enquiries.length;
  const newEnquiriesCount = enquiries.filter(e => e.status === 'NEW').length;
  const quotedCount = enquiries.filter(e => e.status === 'QUOTED').length;

  return (
    <div class="space-y-6">
      {/* ERP Stepper Progress */}
      <WorkflowTracker currentStep={1} />

      {/* KPI Overview Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enquiries</span>
          <div class="text-2xl font-black text-slate-900 mt-1">{totalEnquiriesCount}</div>
          <span class="text-xs text-slate-500 font-medium">Logged in supply system</span>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600">New Pending Enquiries</span>
          <div class="text-2xl font-black text-blue-600 mt-1">{newEnquiriesCount}</div>
          <span class="text-xs text-slate-500 font-medium">Awaiting price quotation</span>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-purple-600">Quoted Enquiries</span>
          <div class="text-2xl font-black text-purple-600 mt-1">{quotedCount}</div>
          <span class="text-xs text-slate-500 font-medium">Formally price-quoted</span>
        </div>
      </div>

      {/* Section Header & Action */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList class="w-6 h-6 text-blue-600" />
            Customer Enquiries (Step 1)
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Log incoming product inquiries from clients before generating formal pricing quotations
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus class="w-4 h-4" />
          Create New Enquiry
        </button>
      </div>

      {/* Main Table Card */}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div class="p-12 text-center text-slate-500 text-xs font-mono">Querying database records...</div>
        ) : enquiries.length === 0 ? (
          <div class="p-12 text-center text-slate-500 text-xs font-medium">No enquiries logged. Click above to create your first enquiry.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Enquiry ID</th>
                  <th class="px-6 py-3.5">Customer & City</th>
                  <th class="px-6 py-3.5">Enquiry Date</th>
                  <th class="px-6 py-3.5">Required Date</th>
                  <th class="px-6 py-3.5">Status</th>
                  <th class="px-6 py-3.5">Logged By</th>
                  <th class="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <tr key={enq.id} class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-blue-600 font-mono text-xs">
                      {enq.enquiry_number}
                    </td>
                    <td class="px-6 py-4">
                      <div class="font-bold text-slate-900 text-xs">{enq.customer?.company_name}</div>
                      <div class="text-[11px] text-slate-400 font-medium">{enq.customer?.city} • {enq.customer?.contact_person}</div>
                    </td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(enq.enquiry_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(enq.required_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadgeClass(enq.status)}`}>
                        {enq.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-600 font-medium">
                      {enq.user?.name}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        class="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Eye class="w-3.5 h-3.5" />
                        Inspect Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      {selectedEnquiry && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[11px] font-bold text-blue-600 font-mono uppercase tracking-wider">Step 1 Record Details</span>
                <h3 class="text-lg font-black text-slate-900">Enquiry {selectedEnquiry.enquiry_number}</h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                <span class="font-bold text-slate-900 text-sm">{selectedEnquiry.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Contact Person</span>
                <span class="font-medium text-slate-700">{selectedEnquiry.customer?.contact_person} ({selectedEnquiry.customer?.mobile})</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Required Date</span>
                <span class="font-mono text-slate-800 font-semibold">{new Date(selectedEnquiry.required_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Pipeline Status</span>
                <span class={`inline-block mt-0.5 px-2.5 py-0.5 text-xs font-bold rounded-lg border ${getStatusBadgeClass(selectedEnquiry.status)}`}>
                  {selectedEnquiry.status}
                </span>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div>
                <span class="block text-xs font-bold text-slate-700 mb-1">Notes / Instructions</span>
                <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">{selectedEnquiry.notes}</p>
              </div>
            )}

            <div>
              <h4 class="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Requested Product Items</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-2.5">Product Code</th>
                      <th class="px-4 py-2.5">Description</th>
                      <th class="px-4 py-2.5 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {selectedEnquiry.items?.map((item) => (
                      <tr key={item.id}>
                        <td class="px-4 py-3 font-mono font-bold text-blue-600">{item.product?.product_code}</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">{item.product?.product_name}</td>
                        <td class="px-4 py-3 text-right font-black text-slate-900 font-mono">{item.quantity} {item.product?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Step 1 New Record</span>
                <h3 class="text-lg font-black text-slate-900">Create Customer Enquiry</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div class="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Select Customer Account *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter packaging or technical instructions..."
                  class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {/* Dynamic Product Line Items */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block font-bold text-slate-700">Required Products & Quantities *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus class="w-3.5 h-3.5" /> Add Product Row
                  </button>
                </div>

                <div class="space-y-2.5">
                  {items.map((item, index) => (
                    <div key={index} class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div class="flex-1">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          class="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">-- Choose Product --</option>
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
                          class="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        class="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

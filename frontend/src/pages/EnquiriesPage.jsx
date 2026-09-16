import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, ClipboardList, Eye, X, Trash2, Calendar, Building, Package, User } from 'lucide-react';

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
      setFormError('Please select a customer.');
      return;
    }
    if (!requiredDate) {
      setFormError('Please select a required date.');
      return;
    }

    const formattedItems = items.map(item => ({
      product_id: parseInt(item.product_id, 10),
      quantity: parseInt(item.quantity, 10),
    }));

    if (formattedItems.some(i => !i.product_id || isNaN(i.product_id))) {
      setFormError('Please select a valid product for all line items.');
      return;
    }

    if (formattedItems.some(i => !i.quantity || i.quantity <= 0)) {
      setFormError('Quantity must be at least 1 for all line items.');
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
      setFormError(err.response?.data?.error || 'Failed to create enquiry.');
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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QUOTED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WON':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOST':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList class="w-7 h-7 text-blue-600" />
            Customer Enquiries
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Track and manage incoming customer enquiries and product requirements
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
        >
          <Plus class="w-4 h-4" />
          Create New Enquiry
        </button>
      </div>

      {/* Main Table Card */}
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div class="p-12 text-center text-slate-500">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div class="p-12 text-center text-slate-500">No enquiries found. Click above to create one.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4">Enquiry #</th>
                  <th class="px-6 py-4">Customer</th>
                  <th class="px-6 py-4">Enquiry Date</th>
                  <th class="px-6 py-4">Required Date</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4">Created By</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <tr key={enq.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-semibold text-blue-600 font-mono">
                      {enq.enquiry_number}
                    </td>
                    <td class="px-6 py-4">
                      <div class="font-medium text-slate-900">{enq.customer?.company_name}</div>
                      <div class="text-xs text-slate-400">{enq.customer?.city}</div>
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      {new Date(enq.enquiry_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      {new Date(enq.required_date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(enq.status)}`}>
                        {enq.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      {enq.user?.name}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Eye class="w-4 h-4" />
                        View
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
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-xs font-semibold text-blue-600 font-mono uppercase tracking-wider">Enquiry Details</span>
                <h3 class="text-xl font-bold text-slate-900">{selectedEnquiry.enquiry_number}</h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span class="block text-xs text-slate-400 font-medium">Customer</span>
                <span class="font-semibold text-slate-800">{selectedEnquiry.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Contact Person</span>
                <span class="font-medium text-slate-800">{selectedEnquiry.customer?.contact_person} ({selectedEnquiry.customer?.mobile})</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Required Date</span>
                <span class="font-medium text-slate-800">{new Date(selectedEnquiry.required_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Current Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(selectedEnquiry.status)}`}>
                  {selectedEnquiry.status}
                </span>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div>
                <span class="block text-xs text-slate-400 font-medium mb-1">Notes</span>
                <p class="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedEnquiry.notes}</p>
              </div>
            )}

            <div>
              <h4 class="text-sm font-bold text-slate-900 mb-3">Requested Products / Quantities</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-2.5">Code</th>
                      <th class="px-4 py-2.5">Product Name</th>
                      <th class="px-4 py-2.5 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {selectedEnquiry.items?.map((item) => (
                      <tr key={item.id}>
                        <td class="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{item.product?.product_code}</td>
                        <td class="px-4 py-3 font-medium text-slate-800">{item.product?.product_name}</td>
                        <td class="px-4 py-3 text-right font-bold text-slate-900">{item.quantity} {item.product?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedEnquiry(null)}
                class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 class="text-xl font-bold text-slate-900">Create New Customer Enquiry</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div class="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Required Date *</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific requirements, packaging, or delivery details..."
                  class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Dynamic Product Line Items */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-semibold text-slate-700">Enquiry Line Items *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus class="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                <div class="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div class="flex-1">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          class="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_code} - {p.product_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div class="w-28">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          class="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white text-center font-semibold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        class="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Create Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

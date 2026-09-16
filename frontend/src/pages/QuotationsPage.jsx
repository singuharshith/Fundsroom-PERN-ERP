import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, FileText, Eye, X, Check, XCircle, Send, ShoppingBag, Trash2 } from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Form State
  const [enquiryId, setEnquiryId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quoRes, enqRes, prodRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/enquiries'),
        api.get('/products'),
      ]);
      setQuotations(quoRes.data.quotations);
      setEnquiries(enqRes.data.enquiries);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Failed to load quotations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnquirySelect = (eId) => {
    setEnquiryId(eId);
    if (!eId) {
      setItems([]);
      return;
    }

    const enq = enquiries.find(e => e.id === parseInt(eId, 10));
    if (enq && enq.items) {
      const initialItems = enq.items.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        const basePrice = prod ? parseFloat(prod.base_price) : 0;
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: basePrice,
          discount_percent: 0,
          gst_percent: 18,
        };
      });
      setItems(initialItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, gst_percent: 18 },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateLineAmount = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const discount = parseFloat(item.discount_percent) || 0;
    const gst = parseFloat(item.gst_percent) || 0;

    const subtotal = qty * price;
    const afterDiscount = subtotal * (1 - discount / 100);
    const withGst = afterDiscount * (1 + gst / 100);
    return Math.round(withGst * 100) / 100;
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, item) => acc + calculateLineAmount(item), 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!enquiryId) {
      setFormError('Please select a customer enquiry.');
      return;
    }
    if (!validUntil) {
      setFormError('Please select validity expiration date.');
      return;
    }

    const formattedItems = items.map(item => ({
      product_id: parseInt(item.product_id, 10),
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price),
      discount_percent: parseFloat(item.discount_percent) || 0,
      gst_percent: parseFloat(item.gst_percent) || 18,
    }));

    if (formattedItems.some(i => !i.product_id || isNaN(i.product_id))) {
      setFormError('Please select a valid product for all line items.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/quotations', {
        enquiry_id: parseInt(enquiryId, 10),
        valid_until: validUntil,
        items: formattedItems,
      });

      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEnquiryId('');
    setValidUntil('');
    setItems([]);
    setFormError('');
  };

  const handleStatusChange = async (quotationId, newStatus) => {
    try {
      await api.patch(`/quotations/${quotationId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update quotation status.');
    }
  };

  const handleConvertOrder = async (quotationId) => {
    if (!window.confirm('Convert this ACCEPTED quotation into a Sales Order?')) return;

    try {
      await api.post(`/quotations/${quotationId}/convert`);
      alert('Quotation converted into Sales Order successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to convert quotation into Sales Order.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
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
            <FileText class="w-7 h-7 text-blue-600" />
            Quotations & Proposals
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Generate formal pricing quotations, track customer responses, and convert accepted deals
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
        >
          <Plus class="w-4 h-4" />
          Draft New Quotation
        </button>
      </div>

      {/* Main Table Card */}
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div class="p-12 text-center text-slate-500">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div class="p-12 text-center text-slate-500">No quotations generated yet. Draft one against an Enquiry.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4">Quotation #</th>
                  <th class="px-6 py-4">Customer</th>
                  <th class="px-6 py-4">Enquiry #</th>
                  <th class="px-6 py-4">Valid Until</th>
                  <th class="px-6 py-4">Grand Total</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {quotations.map((quo) => (
                  <tr key={quo.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-semibold text-blue-600 font-mono">
                      {quo.quotation_number}
                    </td>
                    <td class="px-6 py-4 font-medium text-slate-900">
                      {quo.customer?.company_name}
                    </td>
                    <td class="px-6 py-4 font-mono text-xs text-slate-500">
                      {quo.enquiry?.enquiry_number}
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                      {new Date(quo.valid_until).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 font-mono text-base">
                      ₹{parseFloat(quo.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(quo.status)}`}>
                        {quo.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedQuotation(quo)}
                        class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Quotation"
                      >
                        <Eye class="w-4 h-4" />
                      </button>

                      {quo.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(quo.id, 'SENT')}
                          class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Send class="w-3.5 h-3.5" />
                          Send
                        </button>
                      )}

                      {(quo.status === 'SENT' || quo.status === 'DRAFT') && (
                        <>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'ACCEPTED')}
                            class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Check class="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'REJECTED')}
                            class="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <XCircle class="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {quo.status === 'ACCEPTED' && !quo.sales_order && (
                        <button
                          onClick={() => handleConvertOrder(quo.id)}
                          class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <ShoppingBag class="w-3.5 h-3.5" />
                          Convert to Order
                        </button>
                      )}

                      {quo.sales_order && (
                        <span class="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          {quo.sales_order.order_number}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedQuotation && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-xs font-semibold text-blue-600 font-mono uppercase tracking-wider">Quotation Summary</span>
                <h3 class="text-xl font-bold text-slate-900">{selectedQuotation.quotation_number}</h3>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span class="block text-xs text-slate-400 font-medium">Customer</span>
                <span class="font-semibold text-slate-800">{selectedQuotation.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Enquiry Ref</span>
                <span class="font-mono text-xs text-blue-600">{selectedQuotation.enquiry?.enquiry_number}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Valid Until</span>
                <span class="font-medium text-slate-800">{new Date(selectedQuotation.valid_until).toLocaleDateString()}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-medium">Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(selectedQuotation.status)}`}>
                  {selectedQuotation.status}
                </span>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-bold text-slate-900 mb-3">Quotation Line Items (Calculated Server-Side)</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-2.5">Product</th>
                      <th class="px-4 py-2.5 text-right">Qty</th>
                      <th class="px-4 py-2.5 text-right">Unit Price</th>
                      <th class="px-4 py-2.5 text-right">Disc %</th>
                      <th class="px-4 py-2.5 text-right">GST %</th>
                      <th class="px-4 py-2.5 text-right">Line Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {selectedQuotation.items?.map((item) => (
                      <tr key={item.id}>
                        <td class="px-4 py-3 font-medium text-slate-800">{item.product?.product_name}</td>
                        <td class="px-4 py-3 text-right font-bold">{item.quantity}</td>
                        <td class="px-4 py-3 text-right font-mono">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td class="px-4 py-3 text-right font-mono">{parseFloat(item.discount_percent)}%</td>
                        <td class="px-4 py-3 text-right font-mono">{parseFloat(item.gst_percent)}%</td>
                        <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{parseFloat(item.line_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan="5" class="px-4 py-3 text-right text-slate-700">Calculated Grand Total:</td>
                      <td class="px-4 py-3 text-right font-mono text-base text-blue-700">₹{parseFloat(selectedQuotation.grand_total).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
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
          <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 class="text-xl font-bold text-slate-900">Draft New Quotation</h3>
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
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Select Customer Enquiry *</label>
                  <select
                    required
                    value={enquiryId}
                    onChange={(e) => handleEnquirySelect(e.target.value)}
                    class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Enquiry --</option>
                    {enquiries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} - {e.customer?.company_name} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Valid Until Date *</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-semibold text-slate-700">Line Items & Pricing (Auto-Calculated) *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus class="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th class="px-3 py-2">Product</th>
                        <th class="px-2 py-2 w-20 text-center">Qty</th>
                        <th class="px-2 py-2 w-28 text-center">Price (₹)</th>
                        <th class="px-2 py-2 w-24 text-center">Disc %</th>
                        <th class="px-2 py-2 w-24 text-center">GST %</th>
                        <th class="px-3 py-2 text-right">Line Total</th>
                        <th class="px-2 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <tr key={index} class="bg-white">
                          <td class="p-2">
                            <select
                              required
                              value={item.product_id}
                              onChange={(e) => {
                                const pId = e.target.value;
                                const prod = products.find(p => p.id === parseInt(pId, 10));
                                handleItemChange(index, 'product_id', pId);
                                if (prod) {
                                  handleItemChange(index, 'unit_price', parseFloat(prod.base_price));
                                }
                              }}
                              class="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
                              ))}
                            </select>
                          </td>
                          <td class="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              class="w-full p-2 border border-slate-300 rounded-lg text-sm text-center"
                            />
                          </td>
                          <td class="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              class="w-full p-2 border border-slate-300 rounded-lg text-sm text-center font-mono"
                            />
                          </td>
                          <td class="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                              class="w-full p-2 border border-slate-300 rounded-lg text-sm text-center font-mono"
                            />
                          </td>
                          <td class="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.gst_percent}
                              onChange={(e) => handleItemChange(index, 'gst_percent', e.target.value)}
                              class="w-full p-2 border border-slate-300 rounded-lg text-sm text-center font-mono"
                            />
                          </td>
                          <td class="p-2 text-right font-mono font-bold text-slate-900">
                            ₹{calculateLineAmount(item).toFixed(2)}
                          </td>
                          <td class="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              class="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot class="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan="5" class="p-3 text-right font-bold text-slate-700">Total Calculated Amount:</td>
                        <td class="p-3 text-right font-mono font-bold text-base text-blue-700">
                          ₹{calculateGrandTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
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
                  {submitting ? 'Saving...' : 'Save & Generate Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

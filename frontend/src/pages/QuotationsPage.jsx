import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import WorkflowTracker from '../components/WorkflowTracker';

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
      setFormError('Select a customer enquiry.');
      return;
    }
    if (!validUntil) {
      setFormError('Select a valid until expiration date.');
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
      setFormError('Select a valid product for all items.');
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
      setFormError(err.response?.data?.error || 'Failed to record quotation.');
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
      alert('Quotation converted into Sales Order successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to convert quotation into Sales Order.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border border-slate-300';
      case 'SENT':
        return 'bg-amber-50 text-amber-700 border border-amber-300';
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  const totalQuotationsCount = quotations.length;
  const acceptedCount = quotations.filter(q => q.status === 'ACCEPTED').length;
  const totalPipelineValue = quotations.reduce((acc, q) => acc + parseFloat(q.grand_total), 0);

  return (
    <div className="space-y-6">
      {/* Step Tracker */}
      <WorkflowTracker currentStep={2} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Quotations</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{totalQuotationsCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accepted Deals</div>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1">{acceptedCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Quoted Value</div>
          <div className="font-mono text-2xl font-bold text-blue-600 mt-1">
            ₹{totalPipelineValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Section Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quotations</h1>
          <p className="text-xs text-slate-600 mt-1">
            Formal price calculations with line-item discounts and GST calculation
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto flex items-center gap-2"
        >
          <span>+</span> Draft Quotation
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">Loading quotation ledger...</div>
        ) : quotations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No quotations recorded yet. Click 'Draft Quotation' to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Quotation Code</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Ref Enquiry</th>
                  <th className="px-5 py-3.5">Valid Until</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((quo) => (
                  <tr key={quo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {quo.quotation_number}
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-semibold">
                      {quo.customer?.company_name}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {quo.enquiry?.enquiry_number}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {new Date(quo.valid_until).toISOString().split('T')[0]}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                      ₹{parseFloat(quo.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md ${getStatusBadge(quo.status)}`}>
                        {quo.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 font-mono">
                      <button
                        onClick={() => setSelectedQuotation(quo)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md font-sans font-medium transition-colors"
                      >
                        Inspect
                      </button>

                      {quo.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(quo.id, 'SENT')}
                          className="px-3 py-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-md font-sans font-medium transition-colors"
                        >
                          Mark Sent
                        </button>
                      )}

                      {(quo.status === 'SENT' || quo.status === 'DRAFT') && (
                        <>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'ACCEPTED')}
                            className="px-3 py-1.5 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-md font-sans font-medium transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'REJECTED')}
                            className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-md font-sans font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {quo.status === 'ACCEPTED' && !quo.sales_order && (
                        <button
                          onClick={() => handleConvertOrder(quo.id)}
                          className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-medium rounded-md shadow-sm transition-colors"
                        >
                          Convert to Order
                        </button>
                      )}

                      {quo.sales_order && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-mono">
                          Order: {quo.sales_order.order_number}
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Quotation Sheet</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedQuotation.quotation_number}</h2>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Customer</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{selectedQuotation.customer?.company_name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Ref Enquiry</span>
                <span className="font-mono text-blue-600 mt-0.5 block font-medium">{selectedQuotation.enquiry?.enquiry_number}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Valid Until</span>
                <span className="font-mono text-slate-800 mt-0.5 block">{new Date(selectedQuotation.valid_until).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">Status</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${getStatusBadge(selectedQuotation.status)}`}>
                  {selectedQuotation.status}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-900 mb-2">Line Item Breakdown</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Disc %</th>
                      <th className="p-3 text-right">GST %</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuotation.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-900">{item.product?.product_name}</td>
                        <td className="p-3 text-right font-mono text-slate-800 font-semibold">{item.quantity}</td>
                        <td className="p-3 text-right font-mono text-slate-600">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{parseFloat(item.discount_percent)}%</td>
                        <td className="p-3 text-right font-mono text-slate-600">{parseFloat(item.gst_percent)}%</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">₹{parseFloat(item.line_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-mono">
                    <tr>
                      <td colSpan="5" className="p-3 text-right text-slate-600 uppercase text-[10px] font-bold">Grand Total:</td>
                      <td className="p-3 text-right text-blue-600 font-bold text-sm">₹{parseFloat(selectedQuotation.grand_total).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 border border-slate-300 text-xs text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Draft Price Quotation</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs font-medium text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Enquiry</label>
                  <select
                    required
                    value={enquiryId}
                    onChange={(e) => handleEnquirySelect(e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2.5 text-xs text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Enquiry</option>
                    {enquiries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} - {e.customer?.company_name} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2.5 text-xs font-mono text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Items Pricing Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-slate-900 font-bold">Pricing Matrix</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 w-16 text-center">Qty</th>
                        <th className="p-2.5 w-24 text-center">Price (₹)</th>
                        <th className="p-2.5 w-16 text-center">Disc %</th>
                        <th className="p-2.5 w-16 text-center">GST %</th>
                        <th className="p-2.5 text-right">Line Total</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="p-2">
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
                              className="w-full bg-white border border-slate-300 p-2 text-xs text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="">Select Product</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full bg-white border border-slate-300 p-2 text-xs font-mono text-slate-900 text-center rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              className="w-full bg-white border border-slate-300 p-2 text-xs font-mono text-slate-900 text-center rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                              className="w-full bg-white border border-slate-300 p-2 text-xs font-mono text-slate-900 text-center rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.gst_percent}
                              onChange={(e) => handleItemChange(index, 'gst_percent', e.target.value)}
                              className="w-full bg-white border border-slate-300 p-2 text-xs font-mono text-slate-900 text-center rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ₹{calculateLineAmount(item).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-mono">
                      <tr>
                        <td colSpan="5" className="p-3 text-right text-slate-600 uppercase text-[10px] font-bold">Calculated Grand Total:</td>
                        <td className="p-3 text-right font-bold text-blue-600 text-sm">
                          ₹{calculateGrandTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Record Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

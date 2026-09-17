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

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'border-l-[#5B84A8] text-[#5B84A8]';
      case 'SENT':
        return 'border-l-[#D99A3D] text-[#D99A3D]';
      case 'ACCEPTED':
        return 'border-l-[#5A9E7A] text-[#5A9E7A]';
      case 'REJECTED':
        return 'border-l-[#B8543F] text-[#B8543F]';
      default:
        return 'border-l-[#8F9799] text-[#8F9799]';
    }
  };

  const totalQuotationsCount = quotations.length;
  const acceptedCount = quotations.filter(q => q.status === 'ACCEPTED').length;
  const totalPipelineValue = quotations.reduce((acc, q) => acc + parseFloat(q.grand_total), 0);

  return (
    <div class="space-y-5">
      {/* Routing Strip Tracker */}
      <WorkflowTracker currentStep={2} />

      {/* Hairline Stat Strip (Rule 4) */}
      <div class="bg-[#23282C] border border-[#3A4145] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#3A4145]">
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#E9E6DF]">{totalQuotationsCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Total quotations</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#5A9E7A]">{acceptedCount}</div>
          <div class="text-xs text-[#8F9799] mt-0.5">Accepted deals</div>
        </div>
        <div class="p-4">
          <div class="font-mono text-2xl font-semibold text-[#D99A3D]">
            ₹{totalPipelineValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div class="text-xs text-[#8F9799] mt-0.5">Total quoted value</div>
        </div>
      </div>

      {/* Section Header & Action */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3A4145] pb-4">
        <div>
          <h1 class="text-lg font-semibold text-[#E9E6DF]">Quotations</h1>
          <p class="text-xs text-[#8F9799] mt-0.5">
            Formal price calculations with unit price, discount %, and GST %
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          class="bg-[#D99A3D] hover:bg-[#c48933] text-[#1B1F22] font-semibold text-xs px-3.5 py-2 rounded-[4px] transition-colors self-start sm:self-auto"
        >
          Draft quotation
        </button>
      </div>

      {/* Table (Rule 8) */}
      <div class="bg-[#23282C] border border-[#3A4145]">
        {loading ? (
          <div class="p-8 text-center text-xs font-mono text-[#8F9799]">Querying database records...</div>
        ) : quotations.length === 0 ? (
          <div class="p-8 text-center text-xs text-[#8F9799]">No quotations logged for this filter.</div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                <tr>
                  <th class="px-4 py-3">Quotation code</th>
                  <th class="px-4 py-3">Customer</th>
                  <th class="px-4 py-3">Ref enquiry</th>
                  <th class="px-4 py-3">Valid until</th>
                  <th class="px-4 py-3 text-right">Grand total</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3A4145]">
                {quotations.map((quo) => (
                  <tr key={quo.id} class="hover:bg-[#2A3034] transition-colors">
                    <td class="px-4 py-3 font-mono font-semibold text-[#5B84A8]">
                      {quo.quotation_number}
                    </td>
                    <td class="px-4 py-3 text-[#E9E6DF] font-medium">
                      {quo.customer?.company_name}
                    </td>
                    <td class="px-4 py-3 font-mono text-[#8F9799]">
                      {quo.enquiry?.enquiry_number}
                    </td>
                    <td class="px-4 py-3 font-mono text-[#8F9799]">
                      {new Date(quo.valid_until).toISOString().split('T')[0]}
                    </td>
                    <td class="px-4 py-3 text-right font-mono font-semibold text-[#E9E6DF]">
                      ₹{parseFloat(quo.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-4 py-3">
                      <span class={`inline-block px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#1B1F22] rounded-[2px] ${getStatusBorderColor(quo.status)}`}>
                        {quo.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right space-x-1.5 font-mono">
                      <button
                        onClick={() => setSelectedQuotation(quo)}
                        class="px-2 py-1 text-xs border border-[#3A4145] text-[#E9E6DF] hover:bg-[#2A3034] rounded-[4px]"
                      >
                        Inspect
                      </button>

                      {quo.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(quo.id, 'SENT')}
                          class="px-2 py-1 text-xs border border-[#3A4145] text-[#D99A3D] hover:bg-[#2A3034] rounded-[4px]"
                        >
                          Mark sent
                        </button>
                      )}

                      {(quo.status === 'SENT' || quo.status === 'DRAFT') && (
                        <>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'ACCEPTED')}
                            class="px-2 py-1 text-xs border border-[#5A9E7A] text-[#5A9E7A] hover:bg-[#5A9E7A]/10 rounded-[4px]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'REJECTED')}
                            class="px-2 py-1 text-xs border border-[#B8543F] text-[#B8543F] hover:bg-[#B8543F]/10 rounded-[4px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {quo.status === 'ACCEPTED' && !quo.sales_order && (
                        <button
                          onClick={() => handleConvertOrder(quo.id)}
                          class="px-2.5 py-1 text-xs bg-[#5A9E7A] text-[#1B1F22] font-semibold hover:bg-[#4d8a6a] rounded-[4px]"
                        >
                          Convert to order
                        </button>
                      )}

                      {quo.sales_order && (
                        <span class="text-[11px] text-[#5A9E7A] px-1.5 py-0.5 border border-[#5A9E7A]/40 bg-[#1B1F22]">
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
        <div class="fixed inset-0 z-50 bg-[#1B1F22]/80 flex items-center justify-center p-4">
          <div class="bg-[#23282C] border border-[#3A4145] max-w-3xl w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <div>
                <span class="text-[11px] font-mono text-[#8F9799] uppercase">Quotation calculation sheet</span>
                <h2 class="text-base font-semibold text-[#E9E6DF]">{selectedQuotation.quotation_number}</h2>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                class="px-2 py-1 text-xs text-[#8F9799] border border-[#3A4145]"
              >
                Close
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#1B1F22] border border-[#3A4145] p-3">
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Customer</span>
                <span class="font-medium text-[#E9E6DF]">{selectedQuotation.customer?.company_name}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Ref enquiry</span>
                <span class="font-mono text-[#5B84A8]">{selectedQuotation.enquiry?.enquiry_number}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Valid until</span>
                <span class="font-mono text-[#E9E6DF]">{new Date(selectedQuotation.valid_until).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span class="block text-[10px] text-[#8F9799] uppercase font-mono">Status</span>
                <span class={`inline-block mt-0.5 px-2 py-0.5 text-[11px] font-mono border-l-2 bg-[#23282C] ${getStatusBorderColor(selectedQuotation.status)}`}>
                  {selectedQuotation.status}
                </span>
              </div>
            </div>

            <div>
              <span class="block text-xs font-semibold text-[#E9E6DF] mb-2">Line item breakdown</span>
              <table class="w-full text-left text-xs border border-[#3A4145]">
                <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                  <tr>
                    <th class="p-2">Product name</th>
                    <th class="p-2 text-right">Qty</th>
                    <th class="p-2 text-right">Unit price</th>
                    <th class="p-2 text-right">Disc %</th>
                    <th class="p-2 text-right">GST %</th>
                    <th class="p-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3A4145]">
                  {selectedQuotation.items?.map((item) => (
                    <tr key={item.id}>
                      <td class="p-2 text-[#E9E6DF]">{item.product?.product_name}</td>
                      <td class="p-2 text-right font-mono text-[#E9E6DF]">{item.quantity}</td>
                      <td class="p-2 text-right font-mono text-[#8F9799]">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td class="p-2 text-right font-mono text-[#8F9799]">{parseFloat(item.discount_percent)}%</td>
                      <td class="p-2 text-right font-mono text-[#8F9799]">{parseFloat(item.gst_percent)}%</td>
                      <td class="p-2 text-right font-mono font-semibold text-[#E9E6DF]">₹{parseFloat(item.line_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot class="bg-[#1B1F22] border-t border-[#3A4145] font-mono">
                  <tr>
                    <td colSpan="5" class="p-2 text-right text-[#8F9799] uppercase text-[10px]">Server grand total:</td>
                    <td class="p-2 text-right text-[#D99A3D] font-bold text-sm">₹{parseFloat(selectedQuotation.grand_total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
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
          <div class="bg-[#23282C] border border-[#3A4145] max-w-3xl w-full p-5 space-y-4 rounded-[4px]">
            <div class="flex items-center justify-between pb-3 border-b border-[#3A4145]">
              <h2 class="text-base font-semibold text-[#E9E6DF]">Draft price quotation</h2>
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
                  <label class="block text-[#8F9799] mb-1">Customer enquiry</label>
                  <select
                    required
                    value={enquiryId}
                    onChange={(e) => handleEnquirySelect(e.target.value)}
                    class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs text-[#E9E6DF] rounded-[4px]"
                  >
                    <option value="">Select enquiry</option>
                    {enquiries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} - {e.customer?.company_name} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-[#8F9799] mb-1">Valid until date</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    class="w-full bg-[#1B1F22] border border-[#3A4145] p-2 text-xs font-mono text-[#E9E6DF] rounded-[4px]"
                  />
                </div>
              </div>

              {/* Items Pricing Table */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="block text-[#E9E6DF] font-semibold">Pricing matrix</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    class="text-xs text-[#5B84A8] hover:underline font-mono"
                  >
                    + Add item row
                  </button>
                </div>

                <div class="border border-[#3A4145]">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-[#1B1F22] border-b border-[#3A4145] text-[#8F9799] font-mono text-[11px] uppercase">
                      <tr>
                        <th class="p-2">Product</th>
                        <th class="p-2 w-16 text-center">Qty</th>
                        <th class="p-2 w-24 text-center">Price (₹)</th>
                        <th class="p-2 w-16 text-center">Disc %</th>
                        <th class="p-2 w-16 text-center">GST %</th>
                        <th class="p-2 text-right">Line total</th>
                        <th class="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#3A4145]">
                      {items.map((item, index) => (
                        <tr key={index} class="bg-[#23282C]">
                          <td class="p-1.5">
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
                              class="w-full bg-[#1B1F22] border border-[#3A4145] p-1.5 text-xs text-[#E9E6DF] rounded-[4px]"
                            >
                              <option value="">Select product</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
                              ))}
                            </select>
                          </td>
                          <td class="p-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              class="w-full bg-[#1B1F22] border border-[#3A4145] p-1.5 text-xs font-mono text-[#E9E6DF] text-center rounded-[4px]"
                            />
                          </td>
                          <td class="p-1.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              class="w-full bg-[#1B1F22] border border-[#3A4145] p-1.5 text-xs font-mono text-[#E9E6DF] text-center rounded-[4px]"
                            />
                          </td>
                          <td class="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                              class="w-full bg-[#1B1F22] border border-[#3A4145] p-1.5 text-xs font-mono text-[#E9E6DF] text-center rounded-[4px]"
                            />
                          </td>
                          <td class="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.gst_percent}
                              onChange={(e) => handleItemChange(index, 'gst_percent', e.target.value)}
                              class="w-full bg-[#1B1F22] border border-[#3A4145] p-1.5 text-xs font-mono text-[#E9E6DF] text-center rounded-[4px]"
                            />
                          </td>
                          <td class="p-1.5 text-right font-mono font-semibold text-[#E9E6DF]">
                            ₹{calculateLineAmount(item).toFixed(2)}
                          </td>
                          <td class="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              class="text-[#B8543F] hover:underline font-mono text-xs"
                            >
                              x
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot class="bg-[#1B1F22] border-t border-[#3A4145] font-mono">
                      <tr>
                        <td colSpan="5" class="p-2 text-right text-[#8F9799] uppercase text-[10px]">Calculated grand total:</td>
                        <td class="p-2 text-right font-bold text-[#D99A3D]">
                          ₹{calculateGrandTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
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
                  {submitting ? 'Saving...' : 'Record quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

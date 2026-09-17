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

  const getStatusTag = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="status-tag status-tag-warning">Draft</span>;
      case 'SENT':
        return <span className="status-tag status-tag-warning">Sent</span>;
      case 'ACCEPTED':
        return <span className="status-tag status-tag-success">Accepted</span>;
      case 'REJECTED':
        return <span className="status-tag status-tag-danger">Rejected</span>;
      default:
        return <span className="status-tag status-tag-warning">{status}</span>;
    }
  };

  const totalQuotationsCount = quotations.length;
  const acceptedCount = quotations.filter(q => q.status === 'ACCEPTED').length;
  const totalPipelineValue = quotations.reduce((acc, q) => acc + parseFloat(q.grand_total), 0);

  return (
    <div className="space-y-5 font-sans">
      {/* Title & Plain Text Breadcrumb */}
      <div>
        <h1 className="text-xl font-semibold text-[#1F2937]">Quotations</h1>
        <WorkflowTracker currentStep={2} />
      </div>

      {/* Stat Row: Plain numbers separated by 1px solid #DADFE3 vertical dividers */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DADFE3]">
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalQuotationsCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Total quotations</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{acceptedCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Accepted deals</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">
            ₹{totalPipelineValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-[#667085] mt-0.5">Total quoted value</div>
        </div>
      </div>

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[#667085]">
          Formal price calculations with line-item discounts and GST calculation.
        </p>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          Draft quotation
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-[#667085]">Querying database records...</div>
        ) : quotations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No quotations recorded. Click 'Draft quotation' to add one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                <tr>
                  <th className="px-4 py-3">Quotation code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Ref enquiry</th>
                  <th className="px-4 py-3">Valid until</th>
                  <th className="px-4 py-3 text-right">Grand total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADFE3]">
                {quotations.map((quo) => (
                  <tr key={quo.id} className="hover:bg-[#F6F7F8] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#1F5C73]">
                      {quo.quotation_number}
                    </td>
                    <td className="px-4 py-3 text-[#1F2937] font-semibold">
                      {quo.customer?.company_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#667085]">
                      {quo.enquiry?.enquiry_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#667085]">
                      {new Date(quo.valid_until).toISOString().split('T')[0]}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#1F2937]">
                      ₹{parseFloat(quo.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusTag(quo.status)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedQuotation(quo)}
                        className="btn-outline text-xs px-2.5 py-1"
                      >
                        View Items
                      </button>

                      {quo.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(quo.id, 'SENT')}
                          className="btn-primary text-xs px-2.5 py-1"
                        >
                          Mark Sent
                        </button>
                      )}

                      {quo.status === 'SENT' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'ACCEPTED')}
                            className="btn-primary text-xs px-2.5 py-1"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(quo.id, 'REJECTED')}
                            className="btn-danger-outline text-xs px-2.5 py-1"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {quo.status === 'ACCEPTED' && !quo.sales_order && (
                        <button
                          onClick={() => handleConvertOrder(quo.id)}
                          className="btn-primary text-xs px-2.5 py-1"
                        >
                          Convert to Sales Order
                        </button>
                      )}

                      {quo.sales_order && (
                        <span className="text-[11px] font-mono text-[#2E7D5B] bg-[#F6F7F8] border border-[#2E7D5B] px-2 py-0.5 rounded-[4px]">
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-3xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <div>
                <span className="text-[11px] font-mono text-[#667085]">QUOTATION DETAILS</span>
                <h2 className="text-base font-semibold text-[#1F2937]">{selectedQuotation.quotation_number}</h2>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="btn-outline text-xs px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F6F7F8] border border-[#DADFE3] p-3 rounded-[4px]">
              <div>
                <span className="block text-[11px] text-[#667085]">Customer</span>
                <span className="font-semibold text-[#1F2937]">{selectedQuotation.customer?.company_name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Ref enquiry</span>
                <span className="font-mono text-[#1F5C73]">{selectedQuotation.enquiry?.enquiry_number}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Valid until</span>
                <span className="font-mono text-[#1F2937]">{new Date(selectedQuotation.valid_until).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Status</span>
                <span className="mt-0.5 inline-block">{getStatusTag(selectedQuotation.status)}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#1F2937] mb-2">Line item breakdown</span>
              <div className="border border-[#DADFE3] rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                    <tr>
                      <th className="p-2.5">Product name</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit price</th>
                      <th className="p-2.5 text-right">Disc %</th>
                      <th className="p-2.5 text-right">GST %</th>
                      <th className="p-2.5 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DADFE3]">
                    {selectedQuotation.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 text-[#1F2937]">{item.product?.product_name}</td>
                        <td className="p-2.5 text-right font-mono text-[#1F2937]">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-[#667085]">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-[#667085]">{parseFloat(item.discount_percent)}%</td>
                        <td className="p-2.5 text-right font-mono text-[#667085]">{parseFloat(item.gst_percent)}%</td>
                        <td className="p-2.5 text-right font-mono font-semibold text-[#1F2937]">₹{parseFloat(item.line_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F6F7F8] border-t border-[#DADFE3] font-mono">
                    <tr>
                      <td colSpan="5" className="p-2.5 text-right text-[#667085] font-semibold">Grand Total:</td>
                      <td className="p-2.5 text-right text-[#1F5C73] font-bold text-sm">₹{parseFloat(selectedQuotation.grand_total).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="btn-outline text-xs px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-3xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <h2 className="text-base font-semibold text-[#1F2937]">Draft price quotation</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="btn-outline text-xs px-2.5 py-1"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="bg-white border border-[#B23A32] p-3 rounded-[4px] text-xs font-medium text-[#B23A32]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Customer enquiry</label>
                  <select
                    required
                    value={enquiryId}
                    onChange={(e) => handleEnquirySelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
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
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Valid until date</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
                  />
                </div>
              </div>

              {/* Items Pricing Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold text-[#1F2937]">Pricing matrix</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-[#1F5C73] font-semibold hover:underline"
                  >
                    + Add item row
                  </button>
                </div>

                <div className="border border-[#DADFE3] rounded-[4px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                      <tr>
                        <th className="p-2">Product</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-24 text-center">Price (₹)</th>
                        <th className="p-2 w-16 text-center">Disc %</th>
                        <th className="p-2 w-16 text-center">GST %</th>
                        <th className="p-2 text-right">Line total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DADFE3]">
                      {items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="p-1.5">
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
                              className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px]"
                            >
                              <option value="">Select product</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] text-center rounded-[4px]"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] text-center rounded-[4px]"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                              className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] text-center rounded-[4px]"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.gst_percent}
                              onChange={(e) => handleItemChange(index, 'gst_percent', e.target.value)}
                              className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] text-center rounded-[4px]"
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono font-semibold text-[#1F2937]">
                            ₹{calculateLineAmount(item).toFixed(2)}
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="text-[#B23A32] font-bold text-xs p-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F6F7F8] border-t border-[#DADFE3] font-mono">
                      <tr>
                        <td colSpan="5" className="p-2.5 text-right text-[#667085] font-semibold">Calculated grand total:</td>
                        <td className="p-2.5 text-right font-bold text-[#1F5C73]">
                          ₹{calculateGrandTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#DADFE3]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs px-4 py-1.5"
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

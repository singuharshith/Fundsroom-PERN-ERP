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

  const getStatusTag = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="status-tag status-tag-warning">New</span>;
      case 'QUOTED':
        return <span className="status-tag status-tag-warning">Quoted</span>;
      case 'WON':
        return <span className="status-tag status-tag-success">Won</span>;
      case 'LOST':
        return <span className="status-tag status-tag-danger">Lost</span>;
      default:
        return <span className="status-tag status-tag-warning">{status}</span>;
    }
  };

  const totalEnquiriesCount = enquiries.length;
  const newEnquiriesCount = enquiries.filter(e => e.status === 'NEW').length;
  const quotedCount = enquiries.filter(e => e.status === 'QUOTED').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Title & Plain Text Breadcrumb */}
      <div>
        <h1 className="text-xl font-semibold text-[#1F2937]">Enquiries</h1>
        <WorkflowTracker currentStep={1} />
      </div>

      {/* Stat Row: Plain numbers separated by 1px solid #DADFE3 vertical dividers */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DADFE3]">
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{totalEnquiriesCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Total enquiries</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{newEnquiriesCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">New pending enquiries</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-2xl font-semibold text-[#1F2937]">{quotedCount}</div>
          <div className="text-xs text-[#667085] mt-0.5">Quoted enquiries</div>
        </div>
      </div>

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[#667085]">
          Log incoming product requirements from clients before generating formal price quotations.
        </p>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          Create enquiry
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DADFE3] rounded-[4px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-[#667085]">Querying database records...</div>
        ) : enquiries.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No enquiries recorded. Click 'Create enquiry' to add one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F8] border-b border-[#DADFE3] text-[#667085] font-semibold text-xs">
                <tr>
                  <th className="px-4 py-3">Enquiry code</th>
                  <th className="px-4 py-3">Customer & city</th>
                  <th className="px-4 py-3">Enquiry date</th>
                  <th className="px-4 py-3">Required date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Logged by</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADFE3]">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[#F6F7F8] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#1F5C73]">
                      {enq.enquiry_number}
                    </td>
                    <td className="px-4 py-3 text-[#1F2937]">
                      <div className="font-semibold text-xs">{enq.customer?.company_name}</div>
                      <div className="text-[11px] text-[#667085]">{enq.customer?.city} • {enq.customer?.contact_person}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#667085]">
                      {new Date(enq.enquiry_date).toISOString().split('T')[0]}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#667085]">
                      {new Date(enq.required_date).toISOString().split('T')[0]}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusTag(enq.status)}
                    </td>
                    <td className="px-4 py-3 text-[#1F2937]">
                      {enq.user?.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="btn-outline text-xs px-2.5 py-1"
                      >
                        View Items
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-2xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <div>
                <span className="text-[11px] font-mono text-[#667085]">ENQUIRY DETAILS</span>
                <h3 className="text-base font-semibold text-[#1F2937]">{selectedEnquiry.enquiry_number}</h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="btn-outline text-xs px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F6F7F8] p-3 border border-[#DADFE3] rounded-[4px]">
              <div>
                <span className="block text-[11px] text-[#667085]">Customer</span>
                <span className="font-semibold text-[#1F2937]">{selectedEnquiry.customer?.company_name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Contact person</span>
                <span className="text-[#1F2937]">{selectedEnquiry.customer?.contact_person} ({selectedEnquiry.customer?.mobile})</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Required date</span>
                <span className="font-mono text-[#1F2937]">{new Date(selectedEnquiry.required_date).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#667085]">Status</span>
                <span className="mt-0.5 inline-block">{getStatusTag(selectedEnquiry.status)}</span>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div>
                <span className="block text-xs font-semibold text-[#1F2937] mb-1">Notes / Instructions</span>
                <p className="text-xs text-[#667085] bg-[#F6F7F8] p-3 border border-[#DADFE3] rounded-[4px]">{selectedEnquiry.notes}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-[#1F2937] mb-2">Requested line items</h4>
              <div className="border border-[#DADFE3] rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F8] text-xs text-[#667085] font-semibold border-b border-[#DADFE3]">
                    <tr>
                      <th className="px-3 py-2">Product code</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DADFE3]">
                    {selectedEnquiry.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-mono font-semibold text-[#1F5C73]">{item.product?.product_code}</td>
                        <td className="px-3 py-2.5 text-[#1F2937]">{item.product?.product_name}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#1F2937]">{item.quantity} {item.product?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#DADFE3]">
              <button
                onClick={() => setSelectedEnquiry(null)}
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
          <div className="bg-white border border-[#DADFE3] rounded-[4px] max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DADFE3]">
              <h3 className="text-base font-semibold text-[#1F2937]">Create customer enquiry</h3>
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
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Customer account</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
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
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Target delivery date</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter packaging or technical instructions..."
                  className="w-full p-2 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px] focus:outline-none focus:border-[#1F5C73]"
                />
              </div>

              {/* Dynamic Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#1F2937]">Required products & quantities</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-[#1F5C73] font-semibold hover:underline"
                  >
                    + Add product row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[#F6F7F8] p-2 border border-[#DADFE3] rounded-[4px]">
                      <div className="flex-1">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs text-[#1F2937] rounded-[4px]"
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_code} - {p.product_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full p-1.5 bg-white border border-[#DADFE3] text-xs font-mono text-[#1F2937] text-center rounded-[4px]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        className="text-[#B23A32] font-bold text-xs p-1 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DADFE3]">
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
                  {submitting ? 'Saving...' : 'Save enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

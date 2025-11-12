import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useCanGoBack } from '@tanstack/react-router';
import axiosInstance from '@/lib/axios';
import EstimateSelector from '@/features/estimates/estimates/components/estimate-selector';
import { useProjectStore } from '@/stores/projectStore';
import { Trash } from 'lucide-react';
;

const emptyItem = () => ({ description: '', quantity: 1, unit: '', unitPrice: 0 });

function formatDateToInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

export default function PurchaseOrderForm({ purchaseOrderId }) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);

  const CurrentProjectId = useProjectStore((state) => state.projectId)

  const defaultForm = {
    projectId: CurrentProjectId || "",
    reference: '',
    company: '',
    status: 'pending',
    date: formatDateToInput(new Date()),
    deliveryDate: formatDateToInput(new Date()),
    deliveryAddress: '',
    notes: '',
    vendorName: '',
    vendorContact: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    items: [emptyItem()],
    amount: 0,
    subcontractorId: '',
    estimateId: '',
    estimateLevel: 'estimate',
    estimateTargetId: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletedMode, setIsDeletedMode] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // ------------------- Fetch Projects -------------------
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projectsList'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/projects');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

      useEffect(() => {
    if (!isProjectsLoading && CurrentProjectId && !form.projectId) {
      setField("projectId", CurrentProjectId)
    }
  }, [isProjectsLoading, CurrentProjectId, form.projectId])

  // ------------------- Fetch existing PO -------------------
  useQuery({
    queryKey: ['purchaseOrder', purchaseOrderId],
    enabled: !!purchaseOrderId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/purchase-orders/${purchaseOrderId}`);
      return res.data;
    },
    onSuccess(po) {
      const normalized = {
        ...defaultForm,
        ...po,
        date: formatDateToInput(po?.date),
        deliveryDate: formatDateToInput(po?.deliveryDate),
        items: Array.isArray(po?.items) && po.items.length ? po.items : [emptyItem()],
      };
      setForm(normalized);
      setInitialSnapshot(JSON.stringify(normalized));
      setIsDeletedMode(!!po?.isDeleted);
    },
    onError() {
      setServerError('Failed to load purchase order data');
    },
  });


// Fetch subcontractors
const { data: subcontractors = [], isLoading: loadingSubs, isError: subsError } = useQuery({
  queryKey: ['subcontractors'],
  queryFn: async () => {
    const res = await axiosInstance.get('/api/subcontractors');
    return Array.isArray(res.data) ? res.data : []; // ensure always an array
  },
  staleTime: 1000 * 60 * 10,
});



  // ------------------- Mutations -------------------
  const createMutation = useMutation({
    mutationFn: (payload) => axiosInstance.post('/api/purchase-orders', payload).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['purchaseOrders']);
      navigate({ to: `/purchase-orders/${data._id}` });
    },
    onError: (err) => setServerError(err?.response?.data?.message || 'Failed to create purchase order'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      axiosInstance.put(`/api/purchase-orders/${purchaseOrderId}`, payload).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['purchaseOrders', purchaseOrderId]);
      navigate({ to: `/purchase-orders/${data._id}` });
    },
    onError: (err) => setServerError(err?.response?.data?.message || 'Failed to update purchase order'),
  });

  useEffect(() => () => (isMountedRef.current = false), []);

  // ------------------- Auto Calculate Total -------------------
  useEffect(() => {
    const amount = form.items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    setForm((f) => ({ ...f, amount }));
  }, [JSON.stringify(form.items)]);

  // ------------------- Unsaved Changes -------------------
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!initialSnapshot) return;
      if (JSON.stringify(form) !== initialSnapshot) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form, initialSnapshot]);

  const isDirty = useMemo(() => JSON.stringify(form) !== initialSnapshot, [form, initialSnapshot]);

  // ------------------- Helpers -------------------
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setItemField = (i, name, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)),
    }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i).length
        ? f.items.filter((_, idx) => idx !== i)
        : [emptyItem()],
    }));

  // ------------------- Validation -------------------
  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = 'Project ID is required';
    if (!form.company) e.company = 'Company name is required';
    if (!form.vendorName) e.vendorName = 'Vendor name is required';
    if (!form.deliveryAddress) e.deliveryAddress = 'Delivery address is required';
    if (!form.date) e.date = 'Order date is required';
    if (!form.deliveryDate) e.deliveryDate = 'Delivery date is required';
    if (form.date && form.deliveryDate && new Date(form.deliveryDate) < new Date(form.date))
      e.deliveryDate = 'Delivery date cannot be before order date';
    if (form.vendorEmail && !validateEmail(form.vendorEmail)) e.vendorEmail = 'Invalid email';

    form.items.forEach((it, idx) => {
      if (!it.description) e[`items.${idx}.description`] = 'Description required';
      if (!it.unit) e[`items.${idx}.unit`] = 'Unit required';
      if (!it.quantity || Number(it.quantity) <= 0)
        e[`items.${idx}.quantity`] = 'Quantity > 0 required';
      if (it.unitPrice === '' || Number(it.unitPrice) < 0)
        e[`items.${idx}.unitPrice`] = 'Invalid price';
    });

    setErrors(e);
    return !Object.keys(e).length;
  };

  const onEstimateChange = ({ estimateId, estimateLevel, estimateTargetId }) => {
    setForm((f) => ({ ...f, estimateId, estimateLevel, estimateTargetId }));
  };

  // ------------------- Submit -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSubmitting(true);
    const payload = {
      ...form,
      date: form.date ? new Date(form.date).toISOString() : null,
      deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : null,
    };
    try {
      if (purchaseOrderId) await updateMutation.mutateAsync(payload);
      else await createMutation.mutateAsync(payload);
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    if (canGoBack) window.history.back();
    else navigate({ to: '/purchase-orders' });
  };

  const handleSoftDelete = async () => {
    if (!purchaseOrderId) return;
    if (!confirm('Soft delete this purchase order?')) return;
    try {
      await axiosInstance.delete(`/api/purchase-orders/${purchaseOrderId}`);
      queryClient.invalidateQueries(['purchaseOrders']);
      navigate({ to: '/purchase-orders' });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Delete failed');
    }
  };

  const isLocked = ['approved', 'delivered'].includes(form.status) || isDeletedMode;

  // ------------------- Render -------------------
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={handleBack} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {purchaseOrderId ? 'Edit Purchase Order' : 'New Purchase Order'}
        </h2>
      </div>

      {serverError && <div className="bg-red-100 text-red-700 p-2 rounded">{serverError}</div>}

      {/* Estimate Selector */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-medium text-blue-700 mb-2">Link to Estimate</h3>
        <EstimateSelector onChange={onEstimateChange} />
        {form.estimateId && (
          <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
            <p><span className="font-medium">Estimate ID:</span> {form.estimateId}</p>
            <p><span className="font-medium">Linked Level:</span> {form.estimateLevel}</p>
            {form.estimateTargetId && (
              <p><span className="font-medium">Target ID:</span> {form.estimateTargetId}</p>
            )}
          </div>
        )}
      </div>

      {/* Basic Information */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Project</label>
            {isProjectsLoading ? (
              <p className="text-gray-500 text-sm">Loading projects...</p>
            ) : isProjectsError ? (
              <p className="text-red-500 text-sm">Failed to load projects</p>
            ) : (
              <select
                className="w-full border p-2 rounded"
                value={form.projectId}
                onChange={(e) => setField('projectId', e.target.value)}
                disabled={isLocked}
              >
                <option value="">— Choose Project —</option>
                {(projects || []).map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.title || p.projectName || p._id}
                  </option>
                ))}
              </select>
            )}
            {errors.projectId && <p className="text-red-500 text-sm">{errors.projectId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Company</label>
            <input
              className="w-full border p-2 rounded"
              value={form.company}
              onChange={(e) => setField('company', e.target.value)}
              disabled={isLocked}
            />
            {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
          </div>
        </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md p-2"
            value={form.date || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            disabled={isLocked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md p-2"
            value={form.deliveryDate || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveryDate: e.target.value }))}
            disabled={isLocked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter delivery address"
            value={form.deliveryAddress || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
            disabled={isLocked}
          />
        </div>
      </div>
      {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
      {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate}</p>}
      {errors.deliveryAddress && <p className="text-red-500 text-sm">{errors.deliveryAddress}</p>}  
      </section>


      {/* Vendor Info */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Vendor Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Vendor Name</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorName}
              onChange={(e) => setField('vendorName', e.target.value)}
            />
            {errors.vendorName && <p className="text-red-500 text-sm">{errors.vendorName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Contact</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorContact}
              onChange={(e) => setField('vendorContact', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Email</label>
            <input
              className="w-full border p-2 rounded"
              type="email"
              value={form.vendorEmail}
              onChange={(e) => setField('vendorEmail', e.target.value)}
            />
            {errors.vendorEmail && <p className="text-red-500 text-sm">{errors.vendorEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Phone</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorPhone}
              onChange={(e) => setField('vendorPhone', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Vendor Address</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorAddress}
              onChange={(e) => setField('vendorAddress', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Other Details */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Other Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
        <div>
        <label className="block text-sm font-medium">Subcontractor</label>
        {loadingSubs ? (
            <p className="text-gray-500 text-sm">Loading subcontractors…</p>
        ) : subsError ? (
            <p className="text-red-500 text-sm">Failed to load subcontractors</p>
        ) : (
            <select
            className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={form.subcontractorId}
            onChange={(e) => setField('subcontractorId', e.target.value)}
            >
            <option value="">— Select Subcontractor —</option>
            {(subcontractors || []).map((sub) => (
                <option key={sub._id} value={sub._id}>
                {sub.name || sub.companyName || `Subcontractor ${sub._id}`}
                </option>
            ))}
            </select>
        )}
        </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full border p-2 rounded"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Unit</th>
                <th className="p-2 border">Unit Price</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">
                    <input
                      className="w-full border p-1 rounded"
                      value={it.description}
                      onChange={(e) => setItemField(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border p-1 rounded"
                      value={it.quantity}
                      onChange={(e) => setItemField(idx, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      className="w-full border p-1 rounded"
                      value={it.unit}
                      onChange={(e) => setItemField(idx, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border p-1 rounded"
                      value={it.unitPrice}
                      onChange={(e) => setItemField(idx, 'unitPrice', e.target.value)}
                    />
                  </td>
                  {/* Row Total */}
                  <td className="p-0 border text-center font-medium">
                     KES {((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toLocaleString()}
                  </td>

                  {/* Remove Button */}
                  <td className="p-2 border text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={isLocked}
                      className="inline-flex items-center justify-center w-8 h-8 text-red-600 rounded hover:bg-red-100 hover:scale-110 transition-transform duration-200 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <Trash size={18} color="#ea343d" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={addItem}
            className="text-blue-600 hover:underline"
          >
            + Add Item
          </button>
          <div className="font-semibold text-gray-700">
            Total: <span className="text-blue-700">KES {form.amount.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Notes</h3>
        <textarea
          className="w-full border p-2 rounded min-h-[100px]"
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
        {!isLocked && (
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving…'
              : purchaseOrderId
              ? 'Save Changes'
              : 'Create Purchase Order'}
          </button>
        )}
        {purchaseOrderId && (
          <button
            type="button"
            onClick={handleSoftDelete}
            className="text-gray-500 border px-4 py-2 rounded hover:bg-gray-50"
          >
            {isDeletedMode ? 'Restore (admin)' : 'Soft Delete'}
          </button>
        )}
        <button
          type="button"
          onClick={handleBack}
          className="text-gray-700 border px-4 py-2 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

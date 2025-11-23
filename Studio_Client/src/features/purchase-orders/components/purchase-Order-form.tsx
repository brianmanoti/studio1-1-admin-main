import { useEffect, useMemo, useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useCanGoBack } from "@tanstack/react-router"
import axiosInstance from "@/lib/axios"
import { useDebounce } from "@/hooks/useDebounce"
import { useItemsVendors } from "@/hooks/use-items-vendors"

import type { Item, Vendor } from "@/contexts/items-vendors-context"

import { ItemFormModal } from "@/components/items/items-form-modal"
import { VendorFormModal } from "@/components/vendors/vendor-form-modal"
import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"
import { useProjectStore } from "@/stores/projectStore"
import { Trash } from "lucide-react"

const emptyItem = () => ({ description: "", quantity: 1, unit: "", unitPrice: 0 })

function formatDateToInput(d) {
  if (!d) return ""
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ""
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")
}

export default function PurchaseOrderForm({ purchaseOrderId }) {
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)
  const { setFormState } = useItemsVendors()

  const [attachments, setAttachments] = useState([])


  const CurrentProjectId = useProjectStore((state) => state.projectId)
  const defaultForm = {
    projectId: CurrentProjectId || "",
    reference: "",
    company: "",
    status: "pending",
    date: formatDateToInput(new Date()),
    deliveryDate: formatDateToInput(new Date()),
    deliveryAddress: "",
    notes: "",
    vendorName: "",
    vendorContact: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorAddress: "",
    items: [emptyItem()],
    amount: 0,
    estimateId: "",
    estimateLevel: "estimate",
    estimateTargetId: "",
  }

  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletedMode, setIsDeletedMode] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [activeRow, setActiveRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorSearch, setVendorSearch] = useState("")
  const [activeVendor, setActiveVendor] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 400)
  const debouncedVendorSearch = useDebounce(vendorSearch, 400)

  // ------------------- Fetch Projects -------------------
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ["projectsList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/projects")
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
  if (!isProjectsLoading && CurrentProjectId && !form.projectId) {
    setField("projectId", CurrentProjectId)
  }
}, [isProjectsLoading, CurrentProjectId, form.projectId])

  // ------------------- Fetch Items (for autocomplete) -------------------
  const { data: itemList = [] } = useQuery({
    queryKey: ["itemsList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/items")
      return res.data?.data || res.data || []
    },
    staleTime: 1000 * 60 * 10,
  })

  // ------------------- Fetch Vendors (for autocomplete) -------------------
  const { data: vendorList = [], isFetching: isVendorLoading } = useQuery({
    queryKey: ["vendorSearch", debouncedVendorSearch],
    enabled: !!debouncedVendorSearch,
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/vendors/search`, { params: { q: debouncedVendorSearch } })
      return res.data?.results || []
    },
  })

  console.log("Vendor List:", vendorList)

  // ------------------- Fetch existing PO -------------------
// ------------------- Fetch existing Purchase Order -------------------
const {
  data: purchaseOrder,
  isLoading: isPurchaseOrderLoading,
  isError: isPurchaseOrderError,
  error: purchaseOrderError,
} = useQuery({
  queryKey: ["purchaseOrder", purchaseOrderId],
  enabled: Boolean(purchaseOrderId),
  queryFn: async () => {
    const res = await axiosInstance.get(`/api/purchase-orders/${purchaseOrderId}`)
    return res.data
  },
  staleTime: 1000 * 60 * 5,
  retry: 2,
  onError: (err) => {
    console.error("Failed to load purchase order:", err)
    setServerError("Failed to load purchase order data")
  },
})

useEffect(() => {
  if (!purchaseOrder) return

  const po = purchaseOrder
  const normalized = {
    ...defaultForm,
    ...po,
    date: formatDateToInput(po?.date),
    deliveryDate: formatDateToInput(po?.deliveryDate),
    items: Array.isArray(po?.items) && po.items.length ? po.items : [emptyItem()],
  }

  setForm(normalized)
  setInitialSnapshot(JSON.stringify(normalized))
  setIsDeletedMode(Boolean(po?.isDeleted))
}, [purchaseOrder])



const createMutation = useMutation({
  mutationFn: (payload) =>
    axiosInstance.post("/api/purchase-orders", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((res) => res.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] })
    navigate({ to: `/projects/$projectId/purchaseOrders` })
  },
  onError: (err) => setServerError(err?.response?.data?.message || "Failed to create purchase order"),
})

const updateMutation = useMutation({
  mutationFn: (payload) =>
    axiosInstance.put(`/api/purchase-orders/${purchaseOrderId}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((res) => res.data),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["purchaseOrders", purchaseOrderId] })
    navigate({ to: `/projects/$projectId/purchaseOrders/${data._id}` })
  },
  onError: (err) => setServerError(err?.response?.data?.message || "Failed to update purchase order"),
})

  useEffect(() => () => (isMountedRef.current = false), [])

  // ------------------- Auto Calculate Total -------------------
  useEffect(() => {
    const amount = form.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
    setForm((f) => ({ ...f, amount }))
  }, [JSON.stringify(form.items)])

  // ------------------- Unsaved Changes -------------------
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!initialSnapshot) return
      if (JSON.stringify(form) !== initialSnapshot) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form, initialSnapshot])

  const isDirty = useMemo(() => JSON.stringify(form) !== initialSnapshot, [form, initialSnapshot])

  // ------------------- Handlers for item and vendor form submissions -------------------
  const handleItemSave = (item: Item) => {
    addItem()
    const newIndex = form.items.length
    setItemField(newIndex, "description", item.description)
    setItemField(newIndex, "unit", item.unit)
    setItemField(newIndex, "unitPrice", item.unitPrice)
  }

  const handleVendorSave = (vendor: Vendor) => {
    setField("vendorName", vendor.vendorName)
    setField("vendorEmail", vendor.vendorEmail || "")
    setField("vendorPhone", vendor.vendorPhone || "")
    setField("vendorAddress", vendor.vendorAddress || "")
    setField("vendorContact", vendor.vendorContact || "")
  }

  // ------------------- Helpers -------------------
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }))
  const setItemField = (i, name, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)),
    }))
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))
  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i).length ? f.items.filter((_, idx) => idx !== i) : [emptyItem()],
    }))

  // ------------------- Validation -------------------
  const validate = () => {
    const e = {}
    if (!form.projectId) e.projectId = "Project ID is required"
    if (!form.company) e.company = "Company name is required"
    if (!form.vendorName) e.vendorName = "Vendor name is required"
    if (!form.deliveryAddress) e.deliveryAddress = "Delivery address is required"
    if (!form.date) e.date = "Order date is required"
    if (!form.deliveryDate) e.deliveryDate = "Delivery date is required"
    if (form.date && form.deliveryDate && new Date(form.deliveryDate) < new Date(form.date))
      e.deliveryDate = "Delivery date cannot be before order date"
    if (form.vendorEmail && !validateEmail(form.vendorEmail)) e.vendorEmail = "Invalid email"

    form.items.forEach((it, idx) => {
      if (!it.description) e[`items.${idx}.description`] = "Description required"
      if (!it.unit) e[`items.${idx}.unit`] = "Unit required"
      if (!it.quantity || Number(it.quantity) <= 0) e[`items.${idx}.quantity`] = "Quantity > 0 required"
      if (it.unitPrice === "" || Number(it.unitPrice) < 0) e[`items.${idx}.unitPrice`] = "Invalid price"
    })

    setErrors(e)
    return !Object.keys(e).length
  }

  const onEstimateChange = ({ estimateId, estimateLevel, estimateTargetId }) => {
    setForm((f) => ({ ...f, estimateId, estimateLevel, estimateTargetId }))
  }

  // ------------------- Submit -------------------
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validate()) return window.scrollTo({ top: 0, behavior: "smooth" })
  setIsSubmitting(true)

  try {
    // Create FormData for multipart/form-data submission
    const formData = new FormData()

    // Add all regular fields
    Object.keys(form).forEach((key) => {
      if (key === "items") {
        formData.append("items", JSON.stringify(form.items))
      } else {
        formData.append(key, form[key])
      }
    })

    // Add attachments if any (assuming you have attachments state)
    attachments.forEach((file) => {
      formData.append("attachments", file)
    })

    if (purchaseOrderId) {
      await updateMutation.mutateAsync(formData)
    } else {
      await createMutation.mutateAsync(formData)
    }
  } finally {
    if (isMountedRef.current) setIsSubmitting(false)
  }
}
  // ------------------- Navigation Handlers -------------------

  const handleBack = () => {
    if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return
    if (canGoBack) window.history.back()
    else navigate({ to: "/purchase-orders" })
  }

  const handleSoftDelete = async () => {
    if (!purchaseOrderId) return
    if (!confirm("Soft delete this purchase order?")) return
    try {
      await axiosInstance.delete(`/api/purchase-orders/${purchaseOrderId}`)
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] })
      navigate({ to: "/purchase-orders" })
    } catch (err) {
      setServerError(err?.response?.data?.message || "Delete failed")
    }
  }

  const isLocked = ["approved", "delivered"].includes(form.status) || isDeletedMode

  // ------------------- Render -------------------
  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={handleBack} className="text-blue-600 hover:underline">
            ← Back
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {purchaseOrderId ? "Edit Purchase Order" : "New Purchase Order"}
          </h2>
        </div>

        {serverError && <div className="bg-red-100 text-red-700 p-2 rounded">{serverError}</div>}

        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="font-medium text-blue-700 mb-2">Link to Estimate</h3>
          <EstimateSelector onChange={onEstimateChange} />
          {form.estimateId && (
            <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
              <p>
                <span className="font-medium">Estimate ID:</span> {form.estimateId}
              </p>
              <p>
                <span className="font-medium">Linked Level:</span> {form.estimateLevel}
              </p>
              {form.estimateTargetId && (
                <p>
                  <span className="font-medium">Target ID:</span> {form.estimateTargetId}
                </p>
              )}
            </div>
          )}
        </div>

        <section className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            {isProjectsLoading ? (
              <p className="text-gray-500 text-sm">Loading projects...</p>
            ) : isProjectsError ? (
              <p className="text-red-500 text-sm">Failed to load projects</p>
            ) : (
              <select
                className="w-full border p-2 rounded"
                value={form.projectId}
                onChange={(e) => setField("projectId", e.target.value)}
                disabled={isLocked}
              >
                <option value="">— Choose Project —</option>
                {(projects || []).map((p) => (
                  <option key={p._id} value={p._id}>
                    {`${p.name} (${p.projectNumber}) — ${p.client?.companyName || "No Client"}`}
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
                onChange={(e) => setField("company", e.target.value)}
                disabled={isLocked}
              />
              {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={form.date || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              disabled={isLocked}
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={form.deliveryDate || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, deliveryDate: e.target.value }))}
              disabled={isLocked}
            />
            {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter delivery address"
              value={form.deliveryAddress || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
              disabled={isLocked}
            />
            {errors.deliveryAddress && <p className="text-red-500 text-sm">{errors.deliveryAddress}</p>}
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Vendor Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium">Vendor Name</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorName}
                onChange={(e) => {
                  setField("vendorName", e.target.value)
                  setVendorSearch(e.target.value)
                }}
                onFocus={() => setActiveVendor(true)}
                onBlur={() => setTimeout(() => setActiveVendor(false), 150)}
                disabled={isLocked}
              />
              {activeVendor && vendorSearch && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md w-full max-h-40 overflow-auto mt-1">
                  {isVendorLoading && <div className="px-2 py-1 text-gray-400 text-sm">Loading…</div>}
                  {vendorList.length > 0 ? (
                    vendorList.slice(0, 10).map((v) => (
                      <div
                        key={v._id}
                        onClick={() => {
                          setField("vendorName", v.companyName || v.vendorName)
                          setField("vendorEmail", v.email || "")
                          setField("vendorPhone", v.phone || "")
                          setField("vendorAddress", v.address || "")
                          setField("vendorContact", v.contactPerson || "")
                          setActiveVendor(false)
                        }}
                        className="px-2 py-1 hover:bg-blue-100 cursor-pointer text-sm"
                      >
                        {v.companyName || v.vendorName}
                        <span className="text-gray-500 text-xs"> ({v.category || "—"})</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-gray-400 italic text-sm">
                      No matches —{" "}
                      <span
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => setFormState({ type: "add-vendor" })}
                      >
                        + Add Vendor
                      </span>
                    </div>
                  )}
                </div>
              )}
              {errors.vendorName && <p className="text-red-500 text-sm">{errors.vendorName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Vendor Contact</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorContact}
                onChange={(e) => setField("vendorContact", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Vendor Email</label>
              <input
                className="w-full border p-2 rounded"
                type="email"
                value={form.vendorEmail}
                onChange={(e) => setField("vendorEmail", e.target.value)}
                disabled={isLocked}
              />
              {errors.vendorEmail && <p className="text-red-500 text-sm">{errors.vendorEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Vendor Phone</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorPhone}
                onChange={(e) => setField("vendorPhone", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Vendor Address</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorAddress}
                onChange={(e) => setField("vendorAddress", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        </section>

      <section className="space-y-2 relative">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Items</h3>

        <div className="overflow-x-auto relative">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-2 border">Name</th>
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
                <tr key={idx} className="relative">
                  {/* Name Field */}
                  <td className="p-2 border relative">
                    <input
                      className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                      value={it.name || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setItemField(idx, "name", val)
                        setSearchTerm(val)
                        setActiveRow(idx)
                      }}
                      onFocus={() => setActiveRow(idx)}
                      onBlur={() => setTimeout(() => setActiveRow(null), 200)}
                      placeholder="Enter name"
                      disabled={isLocked}
                    />
                  </td>

                  {/* Description Field */}
                  <td className="p-2 border relative">
                    <input
                      className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                      value={it.description || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setItemField(idx, "description", val)
                        setSearchTerm(val)
                        setActiveRow(idx)
                      }}
                      onFocus={() => setActiveRow(idx)}
                      onBlur={() => setTimeout(() => setActiveRow(null), 200)}
                      placeholder="Enter description"
                      disabled={isLocked}
                    />

                    {/* Overlay Dropdown */}
                    {activeRow === idx && searchTerm && (
                      <div className="fixed left-0 right-0 top-4 z-50 flex justify-center pointer-events-none">
                        <div className="mt-[calc(100vh/2)] w-full max-w-lg pointer-events-auto bg-white border border-gray-200 rounded-md shadow-lg overflow-auto max-h-60">
                          {itemList
                            .filter(
                              (item) =>
                                (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                            )
                            .slice(0, 10)
                            .map((item) => (
                              <div
                                key={item.id || item._id}
                                onClick={() => {
                                  setItemField(idx, "name", item.name || "")
                                  setItemField(idx, "description", item.description || "")
                                  setItemField(idx, "unit", item.unit || "")
                                  setItemField(idx, "unitPrice", item.unitPrice || 0)
                                  setActiveRow(null)
                                }}
                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                              >
                                <span className="font-medium">{item.name}</span>{" "}
                                <span className="text-gray-500 text-xs">
                                  ({item.description} — {item.unit}, KES {item.unitPrice})
                                </span>
                              </div>
                            ))}

                          {itemList.filter(
                            (item) =>
                              item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-gray-400 text-sm italic">
                              No matches —{" "}
                              <span
                                className="text-blue-600 cursor-pointer hover:underline"
                                onClick={() => setFormState({ type: "add-item" })}
                              >
                                + Add Item
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                      value={it.quantity}
                      onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                      disabled={isLocked}
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-2 border">
                    <input
                      className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                      value={it.unit}
                      onChange={(e) => setItemField(idx, "unit", e.target.value)}
                      disabled={isLocked}
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                      value={it.unitPrice}
                      onChange={(e) => setItemField(idx, "unitPrice", e.target.value)}
                      disabled={isLocked}
                    />
                  </td>

                  {/* Row Total */}
                  <td className="p-2 border text-center font-medium">
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
            className="text-blue-600 hover:underline disabled:opacity-50"
            disabled={isLocked}
          >
            + Add Item
          </button>

          <div className="font-semibold text-gray-700">
            Total: <span className="text-blue-700">KES {form.amount.toLocaleString()}</span>
          </div>
        </div>
      </section>

        <section>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Notes</h3>
          <textarea
            className="w-full border p-2 rounded min-h-[100px]"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={isLocked}
          />
        </section>

        <section>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Attachments</h3>
          <input
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files))}
            disabled={isLocked}
          />
          {attachments.length > 0 && (
            <ul className="mt-2">
              {attachments.map((file, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="ml-2 text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>


        <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
          {!isLocked && (
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : purchaseOrderId ? "Save Changes" : "Create Purchase Order"}
            </button>
          )}
          {purchaseOrderId && (
            <button
              type="button"
              onClick={handleSoftDelete}
              className="text-gray-500 border px-4 py-2 rounded hover:bg-gray-50"
            >
              {isDeletedMode ? "Restore (admin)" : "Soft Delete"}
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

      <ItemFormModal onSave={handleItemSave} />
      <VendorFormModal onSave={handleVendorSave} />
    </>
  )
}

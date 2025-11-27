"use client"

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
import { Trash2, X, ArrowLeft, FileText, Truck, Building, Package, Paperclip } from "lucide-react"
import ItemAutocomplete from "./items-auto-select"

const emptyItem = () => ({ description: "", quantity: 1, unit: "", unitPrice: 0 })

function formatDateToInput(d: string | Date) {
  if (!d) return ""
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ""
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")
}

export default function PurchaseOrderForm({ purchaseOrderId }: { purchaseOrderId?: string }) {
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)
  const { setFormState } = useItemsVendors()

  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<any[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([])

  const CurrentProjectId = useProjectStore((state) => state.projectId)
  
  const defaultForm = {
    projectId: CurrentProjectId || "",
    reference: "",
    company: "",
    status: "pending" as const,
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletedMode, setIsDeletedMode] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null)
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorSearch, setVendorSearch] = useState("")
  const [activeVendor, setActiveVendor] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 400)
  const debouncedVendorSearch = useDebounce(vendorSearch, 400)

  // ------------------- Data Fetching -------------------
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

  const { data: itemList = [] } = useQuery({
    queryKey: ["itemsList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/items")
      return res.data?.data || res.data || []
    },
    staleTime: 1000 * 60 * 10,
  })

  const { data: vendorList = [], isFetching: isVendorLoading } = useQuery({
    queryKey: ["vendorSearch", debouncedVendorSearch],
    enabled: !!debouncedVendorSearch,
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/vendors/search`, { params: { q: debouncedVendorSearch } })
      return res.data?.results || []
    },
  })

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

  // ------------------- Mutations -------------------
  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      axiosInstance
        .post("/api/purchase-orders", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] })
      navigate({ to: `/projects/$projectId/purchaseOrders` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to create purchase order"),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: FormData) =>
      axiosInstance
        .put(`/api/purchase-orders/${purchaseOrderId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders", purchaseOrderId] })
      navigate({ to: `/projects/$projectId/purchaseOrders/${data._id}` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to update purchase order"),
  })

  // ------------------- Effects -------------------
  useEffect(() => {
    if (!isProjectsLoading && CurrentProjectId && !form.projectId) {
      setField("projectId", CurrentProjectId)
    }
  }, [isProjectsLoading, CurrentProjectId, form.projectId])

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

    if (Array.isArray(po?.attachments)) {
      setExistingAttachments(po.attachments)
    }
  }, [purchaseOrder])

  useEffect(() => {
    const amount = form.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
    setForm((f) => ({ ...f, amount }))
  }, [JSON.stringify(form.items)])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!initialSnapshot) return
      if (JSON.stringify(form) !== initialSnapshot || newAttachments.length > 0 || deletedAttachmentIds.length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form, initialSnapshot, newAttachments, deletedAttachmentIds])

  useEffect(() => () => { isMountedRef.current = false }, [])

  // ------------------- Helpers -------------------
  const setField = (name: string, value: any) => setForm((f) => ({ ...f, [name]: value }))
  
  const setItemField = (i: number, name: string, value: any) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)),
    }))
  
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))
  
  const removeItem = (i: number) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i).length ? f.items.filter((_, idx) => idx !== i) : [emptyItem()],
    }))

  const isDirty = useMemo(
    () => JSON.stringify(form) !== initialSnapshot || newAttachments.length > 0 || deletedAttachmentIds.length > 0,
    [form, initialSnapshot, newAttachments, deletedAttachmentIds],
  )

  // ------------------- Event Handlers -------------------
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

  const onEstimateChange = ({ estimateId, estimateLevel, estimateTargetId }: { 
    estimateId: string; 
    estimateLevel: string; 
    estimateTargetId: string 
  }) => {
    setForm((f) => ({ ...f, estimateId, estimateLevel, estimateTargetId }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return window.scrollTo({ top: 0, behavior: "smooth" })
    setIsSubmitting(true)

    try {
      const formData = new FormData()

      Object.keys(form).forEach((key) => {
        if (key === "items") {
          formData.append("items", JSON.stringify(form.items))
        } else {
          formData.append(key, form[key as keyof typeof form])
        }
      })

      newAttachments.forEach((file) => {
        formData.append("attachments", file)
      })

      if (deletedAttachmentIds.length > 0) {
        formData.append("deletedAttachmentIds", JSON.stringify(deletedAttachmentIds))
      }

      if (purchaseOrderId) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
    } finally {
      if (isMountedRef.current) setIsSubmitting(false)
    }
  }

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

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setExistingAttachments((prev) => prev.filter((att) => att._id !== attachmentId))
    setDeletedAttachmentIds((prev) => [...prev, attachmentId])
  }

  const isLocked = ["approved", "delivered"].includes(form.status) || isDeletedMode

  // ------------------- Render -------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {purchaseOrderId ? "Edit Purchase Order" : "Create New Purchase Order"}
              </h1>
            </div>
            {isDirty && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{serverError}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Estimate Link Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Estimate Link</h2>
            </div>
            <EstimateSelector onChange={onEstimateChange} />
            {form.estimateId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-900">Estimate ID:</span>
                    <p className="text-blue-700">{form.estimateId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Linked Level:</span>
                    <p className="text-blue-700 capitalize">{form.estimateLevel}</p>
                  </div>
                  {form.estimateTargetId && (
                    <div>
                      <span className="font-medium text-blue-900">Target ID:</span>
                      <p className="text-blue-700">{form.estimateTargetId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Basic Information Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                {isProjectsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
                ) : isProjectsError ? (
                  <p className="text-red-600 text-sm">Failed to load projects</p>
                ) : (
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={form.projectId}
                    onChange={(e) => setField("projectId", e.target.value)}
                    disabled={isLocked}
                  >
                    <option value="">Select Project</option>
                    {(projects || []).map((p: any) => (
                      <option key={p._id} value={p._id}>
                        {`${p.name} (${p.projectNumber}) — ${p.client?.companyName || "No Client"}`}
                      </option>
                    ))}
                  </select>
                )}
                {errors.projectId && <p className="text-red-600 text-sm mt-1">{errors.projectId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  disabled={isLocked}
                  placeholder="Enter company name"
                />
                {errors.company && <p className="text-red-600 text-sm mt-1">{errors.company}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.date || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  disabled={isLocked}
                />
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.deliveryDate || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                  disabled={isLocked}
                />
                {errors.deliveryDate && <p className="text-red-600 text-sm mt-1">{errors.deliveryDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter delivery address"
                  value={form.deliveryAddress || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                  disabled={isLocked}
                />
                {errors.deliveryAddress && <p className="text-red-600 text-sm mt-1">{errors.deliveryAddress}</p>}
              </div>
            </div>
          </section>

          {/* Vendor Information Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Truck className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Vendor Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.vendorName}
                  onChange={(e) => {
                    setField("vendorName", e.target.value)
                    setVendorSearch(e.target.value)
                  }}
                  onFocus={() => setActiveVendor(true)}
                  onBlur={() => setTimeout(() => setActiveVendor(false), 150)}
                  disabled={isLocked}
                  placeholder="Search or enter vendor name"
                />
                {activeVendor && vendorSearch && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg w-full max-h-60 overflow-auto mt-1">
                    {isVendorLoading && (
                      <div className="px-3 py-2 text-gray-500 text-sm">Loading vendors...</div>
                    )}
                    {vendorList.length > 0 ? (
                      vendorList.slice(0, 10).map((v: any) => (
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
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{v.companyName || v.vendorName}</div>
                          <div className="text-gray-500 text-xs">{v.category || "No category"}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No matches —{" "}
                        <button
                          type="button"
                          className="text-blue-600 hover:underline"
                          onClick={() => setFormState({ type: "add-vendor" })}
                        >
                          Add New Vendor
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {errors.vendorName && <p className="text-red-600 text-sm mt-1">{errors.vendorName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Contact</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.vendorContact}
                  onChange={(e) => setField("vendorContact", e.target.value)}
                  disabled={isLocked}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Email</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  type="email"
                  value={form.vendorEmail}
                  onChange={(e) => setField("vendorEmail", e.target.value)}
                  disabled={isLocked}
                  placeholder="vendor@example.com"
                />
                {errors.vendorEmail && <p className="text-red-600 text-sm mt-1">{errors.vendorEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Phone</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.vendorPhone}
                  onChange={(e) => setField("vendorPhone", e.target.value)}
                  disabled={isLocked}
                  placeholder="Phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Address</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.vendorAddress}
                  onChange={(e) => setField("vendorAddress", e.target.value)}
                  disabled={isLocked}
                  placeholder="Full vendor address"
                />
              </div>
            </div>
          </section>

        {/* Items Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Total: <span className="text-blue-600">KES {form.amount.toLocaleString()}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm">Name</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-xs">Description</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm">Qty</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm">Unit</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm">Unit Price</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm">Total</th>
                  <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b text-sm"></th>
                </tr>
              </thead>

              <tbody>
                {form.items.map((it, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 border-b last:border-b-0 align-top"
                    style={{ verticalAlign: 'top' }}
                  >

                    {/* NAME AUTOCOMPLETE */}
                    <td className="px-2 py-1 relative align-top">
                      <ItemAutocomplete
                        value={it.name || ""}
                        placeholder="Item name"
                        disabled={isLocked}
                        items={itemList}
                        autoFocus={false} // 🔹 remove autofocus
                        onChange={(val) => setItemField(idx, "name", val)}
                        onSelect={(item) => {
                          setItemField(idx, "name", item.name || "");
                          setItemField(idx, "description", item.description || "");
                          setItemField(idx, "unit", item.unit || "");
                          setItemField(idx, "unitPrice", item.unitPrice || 0);
                        }}
                      />
                    </td>

                    {/* DESCRIPTION AUTOCOMPLETE */}
                    <td className="px-2 py-1 relative align-top text-xs break-words max-w-xs">
                      <ItemAutocomplete
                        value={it.description || ""}
                        placeholder="Item description"
                        disabled={isLocked}
                        items={itemList}
                        autoFocus={false} // 🔹 remove autofocus
                        onChange={(val) => setItemField(idx, "description", val)}
                        onSelect={(item) => {
                          setItemField(idx, "name", item.name || "");
                          setItemField(idx, "description", item.description || "");
                          setItemField(idx, "unit", item.unit || "");
                          setItemField(idx, "unitPrice", item.unitPrice || 0);
                        }}
                      />
                    </td>

                    {/* QTY */}
                    <td className="px-2 py-1 align-top">
                      <input
                        type="number"
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={it.quantity}
                        onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                        disabled={isLocked}
                        min="1"
                        autoFocus={false} // 🔹 remove autofocus
                      />
                    </td>

                    {/* UNIT */}
                    <td className="px-2 py-1 align-top">
                      <input
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={it.unit}
                        onChange={(e) => setItemField(idx, "unit", e.target.value)}
                        disabled={isLocked}
                        placeholder="Unit"
                        autoFocus={false} // 🔹 remove autofocus
                      />
                    </td>

                    {/* UNIT PRICE */}
                    <td className="px-2 py-1 align-top">
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={it.unitPrice}
                        onChange={(e) => setItemField(idx, "unitPrice", e.target.value)}
                        disabled={isLocked}
                        min="0"
                        step="0.01"
                        autoFocus={false} // 🔹 remove autofocus
                      />
                    </td>

                    {/* ROW TOTAL */}
                    <td className="px-2 py-1 font-medium text-gray-900 text-sm align-top">
                      KES {((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toLocaleString()}
                    </td>

                    {/* REMOVE BUTTON */}
                    <td className="px-2 py-1 align-top">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={isLocked || form.items.length <= 1}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              disabled={isLocked}
            >
              + Add Item
            </button>
          </div>
        </section>

          {/* Notes Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px]"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              disabled={isLocked}
              placeholder="Add any additional notes or instructions..."
            />
          </section>

          {/* Attachments Section */}
<section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center mb-6">
    <Paperclip className="h-5 w-5 text-blue-600 mr-2" />
    <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
  </div>

  {/* Existing Attachments */}
  {existingAttachments.length > 0 && (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Current Attachments</h3>
      <div className="space-y-2">
        {existingAttachments.map((attachment) => (
          <div
            key={attachment._id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
              <p className="text-xs text-gray-500">
                {Math.round(attachment.size / 1024)} KB •{" "}
                {new Date(attachment.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveExistingAttachment(attachment._id)}
              disabled={isLocked}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* File Upload */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Files</label>
    <input
      type="file"
      multiple
      onChange={(e) => {
        const selectedFiles = Array.from(e.target.files || []);
        setNewAttachments((prev) => [...prev, ...selectedFiles]); // append to existing
      }}
      disabled={isLocked}
      className="w-full border border-gray-300 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    />
  </div>

  {/* New Files Preview */}
  {newAttachments.length > 0 && (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Files to Upload</h3>
      <div className="space-y-2">
        {newAttachments.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{file.name}</p>
              <p className="text-xs text-green-700">{Math.round(file.size / 1024)} KB</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setNewAttachments((prev) => prev.filter((_, i) => i !== idx))
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
</section>


          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200">
            {!isLocked && (
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : purchaseOrderId ? "Save Changes" : "Create Purchase Order"}
              </button>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="text-gray-700 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <ItemFormModal onSave={handleItemSave} />
      <VendorFormModal onSave={handleVendorSave} />
    </div>
  )
}
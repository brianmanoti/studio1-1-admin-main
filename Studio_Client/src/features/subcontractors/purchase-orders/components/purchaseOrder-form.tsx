import React, { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useCanGoBack } from "@tanstack/react-router"
import axiosInstance from "@/lib/axios"
import { useDebounce } from "@/hooks/useDebounce"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import type { Item } from "@/contexts/items-vendors-context"

import { ItemFormModal } from "@/components/items/items-form-modal"
import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"
import { SubcontractorFormModal } from "@/components/subContractors/components/subcontractor-form-modal"
import { VendorFormModal } from "@/components/vendors/vendor-form-modal"
import { useProjectStore } from "@/stores/projectStore"
import { Trash, Download, Eye } from "lucide-react"

// Safe EstimateSelector Wrapper to prevent render issues
const SafeEstimateSelector = React.memo(({ onChange }) => {
  const [localData, setLocalData] = useState({
    estimateId: "",
    estimateLevel: "estimate",
    estimateTargetId: ""
  })
  const isInitialRender = useRef(true)

  const handleSafeChange = useCallback(({ estimateId, estimateLevel, estimateTargetId }) => {
    const newData = {
      estimateId: estimateId || "",
      estimateLevel: estimateLevel || "estimate",
      estimateTargetId: estimateTargetId || ""
    }
    setLocalData(newData)
  }, [])

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    // Use setTimeout to defer the onChange call
    const timeoutId = setTimeout(() => {
      onChange(localData)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [localData, onChange])

  return <EstimateSelector onChange={handleSafeChange} />
})

SafeEstimateSelector.displayName = 'SafeEstimateSelector'

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

export default function SubcontractorPoForm({ PurchaseOrderId }) {
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)
  const { setFormState } = useItemsVendors()

  const CurrentProjectId = useProjectStore((state) => state.projectId)

  const defaultForm = {
    projectId: CurrentProjectId || "",
    subcontractorId: "",
    reference: "",
    status: "pending",
    date: formatDateToInput(new Date()),
    deliveryDate: formatDateToInput(new Date()),
    deliveryAddress: "",
    notes: "",
    company: "",
    subcontractorName: "",
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
  const [subcontractorSearch, setSubcontractorSearch] = useState("")
  const [activeSubcontractor, setActiveSubcontractor] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [activeVendor, setActiveVendor] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [existingAttachments, setExistingAttachments] = useState([])

  // ------------------ Estimate State ------------------
  const [estimateData, setEstimateData] = useState({
    estimateId: "",
    estimateLevel: "estimate",
    estimateTargetId: ""
  })

  const debouncedSearch = useDebounce(searchTerm, 400)
  const debouncedSubcontractorSearch = useDebounce(subcontractorSearch, 400)
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

  // ------------------- Fetch Subcontractors (for autocomplete) -------------------
  const { 
    data: subcontractorData, 
    isFetching: isSubcontractorLoading,
    isError: isSubcontractorError 
  } = useQuery({
    queryKey: ["subcontractorSearch", debouncedSubcontractorSearch],
    enabled: !!debouncedSubcontractorSearch,
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/subcontractors/search`, { 
        params: { q: debouncedSubcontractorSearch } 
      })
      return res.data
    },
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

  // Extract subcontractors from the response data
  const subcontractorList = subcontractorData?.results || []

  // ------------------- Fetch existing PurchaseRecord -------------------
  const { data: PurchaseData, isLoading: isPurchaseLoading } = useQuery({
    queryKey: ['purchaseOrders', PurchaseOrderId],
    enabled: !!PurchaseOrderId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/purchase-orders/${PurchaseOrderId}`)
      return res.data
    },
    onSuccess(purchase) {
      if (!purchase) return
      
      // Map API response to form structure
      const normalized = {
        ...defaultForm,
        ...purchase,
        projectId: purchase.projectId?._id || purchase.projectId || "",
        date: formatDateToInput(purchase?.date),
        deliveryDate: formatDateToInput(purchase?.deliveryDate),
        items: Array.isArray(purchase?.items) && purchase.items.length ? purchase.items.map(item => ({
          description: item.name || item.description || "", // Use name as description for form
          quantity: item.quantity || 1,
          unit: item.unit || "",
          unitPrice: item.unitPrice || 0
        })) : [emptyItem()],
        subcontractorName: purchase.subcontractorName || "",
        vendorName: purchase.vendorName || "",
        vendorContact: purchase.vendorContact || "",
        vendorEmail: purchase.vendorEmail || "",
        vendorPhone: purchase.vendorPhone || "",
        vendorAddress: purchase.vendorAddress || "",
      }
      
      setForm(normalized)
      setInitialSnapshot(JSON.stringify(normalized))
      setIsDeletedMode(!!purchase?.isDeleted)
      
      // Set existing attachments
      if (Array.isArray(purchase.attachments)) {
        setExistingAttachments(purchase.attachments)
      }
      
      // Set estimate data if exists
      if (purchase.estimateId) {
        setEstimateData({
          estimateId: purchase.estimateId,
          estimateLevel: purchase.estimateLevel || "estimate",
          estimateTargetId: purchase.estimateTargetId || ""
        })
      }

      // Set search terms if exists
      if (purchase.vendorName) {
        setVendorSearch(purchase.vendorName)
      }
      if (purchase.subcontractorName) {
        setSubcontractorSearch(purchase.subcontractorName)
      }
    },
    onError() {
      setServerError("Failed to load Purchaserecord data")
    },
  })

  // ------------------- Mutations -------------------
  const createMutation = useMutation({
    mutationFn: (payload) => 
      axiosInstance.post("/api/purchase-orders", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] })
      navigate({ to: `/projects/$projectId/subcontractors/purchase-orders` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to create Purchaserecord"),
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => 
      axiosInstance.put(`/api/purchase-orders/${PurchaseOrderId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', PurchaseOrderId] })
      navigate({ to: `/subcontractors/purchase-orders/${data._id}` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to update Purchaserecord"),
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

  // ------------------- Estimate Change Handler -------------------
  const onEstimateChange = useCallback(({ estimateId, estimateLevel, estimateTargetId }) => {
    // Use requestAnimationFrame to defer state update
    requestAnimationFrame(() => {
      setEstimateData({ 
        estimateId: estimateId || "", 
        estimateLevel: estimateLevel || "estimate", 
        estimateTargetId: estimateTargetId || "" 
      })
    })
  }, [])

  // ------------------ Update Form when Estimate Data Changes ------------------
  useEffect(() => {
    setForm(f => ({
      ...f,
      estimateId: estimateData.estimateId,
      estimateLevel: estimateData.estimateLevel,
      estimateTargetId: estimateData.estimateTargetId
    }))
  }, [estimateData])

  // ------------------- Handlers -------------------
  const handleItemSave = useCallback((item: Item) => {
    addItem()
    const newIndex = form.items.length
    setItemField(newIndex, "description", item.description)
    setItemField(newIndex, "unit", item.unit)
    setItemField(newIndex, "unitPrice", item.unitPrice)
  }, [form.items.length])

  const handleSubcontractorSave = useCallback((subcontractor) => {
    setField("subcontractorId", subcontractor._id)
    setField("subcontractorName", subcontractor.companyName)
    setSubcontractorSearch(subcontractor.companyName)
    setActiveSubcontractor(false)
  }, [])

  const handleSubcontractorSelect = useCallback((subcontractor) => {
    setField("subcontractorId", subcontractor._id)
    setField("subcontractorName", subcontractor.companyName)
    setSubcontractorSearch(subcontractor.companyName)
    setActiveSubcontractor(false)
  }, [])

  const handleSubcontractorClear = useCallback(() => {
    setField("subcontractorId", "")
    setField("subcontractorName", "")
    setSubcontractorSearch("")
  }, [])

  // ------------------- Vendor Handlers -------------------
  const handleVendorSave = useCallback((vendor) => {
    setField("vendorName", vendor.companyName || vendor.vendorName)
    setField("vendorContact", vendor.contactPerson || "")
    setField("vendorEmail", vendor.email || "")
    setField("vendorPhone", vendor.phone || "")
    setField("vendorAddress", vendor.address || "")
    setVendorSearch(vendor.companyName || vendor.vendorName)
    setActiveVendor(false)
  }, [])

  const handleVendorSelect = useCallback((vendor) => {
    setField("vendorName", vendor.companyName || vendor.vendorName)
    setField("vendorContact", vendor.contactPerson || "")
    setField("vendorEmail", vendor.email || "")
    setField("vendorPhone", vendor.phone || "")
    setField("vendorAddress", vendor.address || "")
    setVendorSearch(vendor.companyName || vendor.vendorName)
    setActiveVendor(false)
  }, [])

  const handleVendorClear = useCallback(() => {
    setField("vendorName", "")
    setField("vendorContact", "")
    setField("vendorEmail", "")
    setField("vendorPhone", "")
    setField("vendorAddress", "")
    setVendorSearch("")
  }, [])

  // ------------------- Attachment Handlers -------------------
  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await axiosInstance.get(`/api/purchase-orders/attachments/${attachment._id}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', attachment.fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      setServerError('Failed to download attachment')
    }
  }

  const handleViewAttachment = async (attachment) => {
    try {
      const response = await axiosInstance.get(`/api/purchase-orders/attachments/${attachment._id}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      window.open(url, '_blank')
    } catch (error) {
      console.error('View failed:', error)
      setServerError('Failed to view attachment')
    }
  }

  const handleRemoveExistingAttachment = async (attachmentId) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return
    
    try {
      await axiosInstance.delete(`/api/purchase-orders/attachments/${attachmentId}`)
      setExistingAttachments(prev => prev.filter(att => att._id !== attachmentId))
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", PurchaseOrderId] })
    } catch (error) {
      console.error('Remove attachment failed:', error)
      setServerError('Failed to remove attachment')
    }
  }

  // ------------------- Helpers -------------------
  const setField = useCallback((name, value) => setForm((f) => ({ ...f, [name]: value })), [])
  
  const setItemField = useCallback((i, name, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)),
    })), [])
  
  const addItem = useCallback(() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] })), [])
  
  const removeItem = useCallback((i) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i).length ? f.items.filter((_, idx) => idx !== i) : [emptyItem()],
    })), [])

  // ------------------- Validation -------------------
  const validate = useCallback(() => {
    const e = {}
    if (!form.projectId) e.projectId = "Project ID is required"
    if (!form.company) e.company = "Company name is required"
    if (!form.vendorName && !form.subcontractorName) {
      e.vendorName = "Either Vendor or Subcontractor is required"
      e.subcontractorName = "Either Vendor or Subcontractor is required"
    }
    if (!form.deliveryAddress) e.deliveryAddress = "Delivery address is required"
    if (!form.date) e.date = "Order date is required"
    if (!form.deliveryDate) e.deliveryDate = "Delivery date is required"
    if (form.date && form.deliveryDate && new Date(form.deliveryDate) < new Date(form.date)) {
      e.deliveryDate = "Delivery date cannot be before order date"
    }
    if (form.vendorEmail && !validateEmail(form.vendorEmail)) e.vendorEmail = "Invalid email"

    form.items.forEach((it, idx) => {
      if (!it.description) e[`items.${idx}.description`] = "Description required"
      if (!it.unit) e[`items.${idx}.unit`] = "Unit required"
      if (!it.quantity || Number(it.quantity) <= 0) e[`items.${idx}.quantity`] = "Quantity > 0 required"
      if (it.unitPrice === "" || Number(it.unitPrice) < 0) e[`items.${idx}.unitPrice`] = "Invalid price"
    })

    setErrors(e)
    return !Object.keys(e).length
  }, [form])

  // ------------------- Submit -------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return window.scrollTo({ top: 0, behavior: "smooth" })
    setIsSubmitting(true)
    
    // Create FormData for multipart/form-data submission
    const formData = new FormData()

    // Add all regular fields
    Object.keys(form).forEach((key) => {
      if (key === "items") {
        // Transform items to match API structure (description becomes name)
        const apiItems = form.items.map(item => ({
          name: item.description, // Map description to name for API
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice)
        }))
        formData.append("items", JSON.stringify(apiItems))
      } else {
        formData.append(key, form[key])
      }
    })

    // Add new attachments if any
    attachments.forEach((file) => {
      formData.append("attachments", file)
    })

    try {
      if (PurchaseOrderId) await updateMutation.mutateAsync(formData)
      else await createMutation.mutateAsync(formData)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      if (isMountedRef.current) setIsSubmitting(false)
    }
  }

  const handleBack = useCallback(() => {
    if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return
    if (canGoBack) window.history.back()
    else navigate({ to: "/purchase-orders" })
  }, [isDirty, canGoBack, navigate])

  const handleSoftDelete = async () => {
    if (!PurchaseOrderId) return
    if (!confirm("Soft delete this Purchase record?")) return
    try {
      await axiosInstance.delete(`/api/purchase-orders/${PurchaseOrderId}`)
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      navigate({ to: "/purchase-orders" })
    } catch (err) {
      setServerError(err?.response?.data?.message || "Delete failed")
    }
  }

  const isLocked = ["approved", "delivered"].includes(form.status) || isDeletedMode

  // ------------------- Filtered Items for Autocomplete -------------------
  const filteredItems = useMemo(() => {
    if (!searchTerm) return []
    return itemList
      .filter((item) => item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10)
  }, [itemList, searchTerm])

  // Show loading state while fetching Purchasedata
  if (PurchaseOrderId && isPurchaseLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="text-center">Loading Purchaserecord...</div>
      </div>
    )
  }

  // ------------------- Render -------------------
  return (
    <>
      <form onSubmit={handleSubmit} className="w-full mx-auto p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={handleBack} className="text-blue-600 hover:underline">
            ← Back
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {PurchaseOrderId ? `Edit PurchaseRecord - ${PurchaseData?.poNumber || ''}` : "New PurchaseRecord"}
          </h2>
        </div>

        {serverError && (
          <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
            <strong>Error: </strong>{serverError}
          </div>
        )}

        {/* PurchaseNumber Display */}
        {PurchaseData?.poNumber && (
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-green-700 font-medium">PurchaseNumber: {PurchaseData.poNumber}</p>
          </div>
        )}

        {/* Estimate Selector - Fixed with Safe Wrapper */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="font-medium text-blue-700 mb-2">Link to Estimate</h3>
          <SafeEstimateSelector onChange={onEstimateChange} />
          {estimateData.estimateId && (
            <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
              <p>
                <span className="font-medium">Estimate ID:</span> {estimateData.estimateId}
              </p>
              <p>
                <span className="font-medium">Linked Level:</span> {estimateData.estimateLevel}
              </p>
              {estimateData.estimateTargetId && (
                <p>
                  <span className="font-medium">Target ID:</span> {estimateData.estimateTargetId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <section className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Project *</label>
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
                  required
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
              <label className="block text-sm font-medium">Company *</label>
              <input
                className="w-full border p-2 rounded"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
                disabled={isLocked}
                placeholder="Your company name"
                required
              />
              {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2"
                value={form.date || ""}
                onChange={(e) => setField("date", e.target.value)}
                disabled={isLocked}
                required
              />
              {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2"
                value={form.deliveryDate || ""}
                onChange={(e) => setField("deliveryDate", e.target.value)}
                disabled={isLocked}
                required
              />
              {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter delivery address"
                value={form.deliveryAddress || ""}
                onChange={(e) => setField("deliveryAddress", e.target.value)}
                disabled={isLocked}
                required
              />
              {errors.deliveryAddress && <p className="text-red-500 text-sm">{errors.deliveryAddress}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Reference</label>
            <input
              className="w-full border p-2 rounded"
              value={form.reference}
              onChange={(e) => setField("reference", e.target.value)}
              disabled={isLocked}
              placeholder="Optional reference number"
            />
          </div>
        </section>

        {/* Vendor Information Section */}
        <section className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Vendor Information</h3>
          <div className="relative">
            <label className="block text-sm font-medium">Vendor Name *</label>
            <div className="relative">
              <input
                className="w-full border p-2 rounded pr-10"
                value={vendorSearch}
                onChange={(e) => {
                  setVendorSearch(e.target.value)
                  setField("vendorName", e.target.value)
                  if (e.target.value === "") {
                    handleVendorClear()
                  }
                }}
                onFocus={() => setActiveVendor(true)}
                onBlur={() => setTimeout(() => setActiveVendor(false), 150)}
                disabled={isLocked}
                placeholder="Search vendors by company name..."
              />
              {form.vendorName && (
                <button
                  type="button"
                  onClick={handleVendorClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
            
            {activeVendor && vendorSearch && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md w-full max-h-60 overflow-auto mt-1">
                {isVendorLoading && (
                  <div className="px-4 py-2 text-gray-500 text-sm">Loading vendors...</div>
                )}
                {vendorList.length > 0 ? (
                  vendorList.map((vendor) => (
                    <div
                      key={vendor._id}
                      onClick={() => handleVendorSelect(vendor)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {vendor.companyName || vendor.vendorName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Contact: {vendor.contactPerson}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vendor.email} • {vendor.phone}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {vendor.category && <span>Category: {vendor.category}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  !isVendorLoading && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      <div>No vendors found</div>
                      <button
                        type="button"
                        onClick={() => setFormState({ type: "add-vendor" })}
                        className="text-blue-600 hover:underline mt-1"
                      >
                        + Add New Vendor
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
            {errors.vendorName && <p className="text-red-500 text-sm mt-1">{errors.vendorName}</p>}
            
            {form.vendorName && !activeVendor && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <span className="font-medium">Selected Vendor: </span>
                {form.vendorName}
                {form.vendorContact && ` • Contact: ${form.vendorContact}`}
                {form.vendorEmail && ` • Email: ${form.vendorEmail}`}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Contact Person</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorContact}
                onChange={(e) => setField("vendorContact", e.target.value)}
                disabled={isLocked}
                placeholder="Contact person name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                className="w-full border p-2 rounded"
                type="email"
                value={form.vendorEmail}
                onChange={(e) => setField("vendorEmail", e.target.value)}
                disabled={isLocked}
                placeholder="vendor@example.com"
              />
              {errors.vendorEmail && <p className="text-red-500 text-sm">{errors.vendorEmail}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorPhone}
                onChange={(e) => setField("vendorPhone", e.target.value)}
                disabled={isLocked}
                placeholder="Phone number"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Address</label>
              <input
                className="w-full border p-2 rounded"
                value={form.vendorAddress}
                onChange={(e) => setField("vendorAddress", e.target.value)}
                disabled={isLocked}
                placeholder="Vendor address"
              />
            </div>
          </div>
        </section>

        {/* Subcontractor Information Section */}
        <section className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Subcontractor Information</h3>
          <div className="relative">
            <label className="block text-sm font-medium">Subcontractor Name *</label>
            <div className="relative">
              <input
                className="w-full border p-2 rounded pr-10"
                value={subcontractorSearch}
                onChange={(e) => {
                  setSubcontractorSearch(e.target.value)
                  setField("subcontractorName", e.target.value)
                  if (e.target.value === "") {
                    handleSubcontractorClear()
                  }
                }}
                onFocus={() => setActiveSubcontractor(true)}
                onBlur={() => setTimeout(() => setActiveSubcontractor(false), 150)}
                disabled={isLocked}
                placeholder="Search subcontractors by company name..."
              />
              {form.subcontractorId && (
                <button
                  type="button"
                  onClick={handleSubcontractorClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
            
            {activeSubcontractor && subcontractorSearch && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md w-full max-h-60 overflow-auto mt-1">
                {isSubcontractorLoading && (
                  <div className="px-4 py-2 text-gray-500 text-sm">Loading subcontractors...</div>
                )}
                {isSubcontractorError && (
                  <div className="px-4 py-2 text-red-500 text-sm">Failed to load subcontractors</div>
                )}
                {!isSubcontractorLoading && !isSubcontractorError && subcontractorList.length > 0 ? (
                  subcontractorList.map((subcontractor) => (
                    <div
                      key={subcontractor._id}
                      onClick={() => handleSubcontractorSelect(subcontractor)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {subcontractor.companyName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Contact: {subcontractor.contactPerson}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subcontractor.email} • {subcontractor.phoneNumber}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {subcontractor.typeOfWork && subcontractor.typeOfWork !== 'user' && (
                          <span>Specialty: {subcontractor.typeOfWork}</span>
                        )}
                        {subcontractor.projects && subcontractor.projects.length > 0 && (
                          <span> • {subcontractor.projects.length} active project(s)</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  !isSubcontractorLoading && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      <div>No subcontractors found</div>
                      <button
                        type="button"
                        onClick={() => setFormState({ type: "add-subcontractor" })}
                        className="text-blue-600 hover:underline mt-1"
                      >
                        + Add New Subcontractor
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
            {errors.subcontractorName && <p className="text-red-500 text-sm mt-1">{errors.subcontractorName}</p>}
            
            {form.subcontractorId && !activeSubcontractor && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <span className="font-medium">Selected Subcontractor: </span>
                {form.subcontractorName}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              disabled={isLocked}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Items Section */}
        <section className="space-y-2 relative">
          <h3 className="font-semibold text-gray-700 border-b pb-2">PurchaseItems</h3>

          <div className="overflow-x-auto relative">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-2 border">Description *</th>
                  <th className="p-2 border">Qty *</th>
                  <th className="p-2 border">Unit *</th>
                  <th className="p-2 border">Unit Price *</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border"></th>
                </tr>
              </thead>

              <tbody>
                {form.items.map((it, idx) => (
                  <tr key={idx} className="relative">
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
                        required
                      />

                      {activeRow === idx && searchTerm && (
                        <div className="fixed left-0 right-0 top-4 z-50 flex justify-center pointer-events-none">
                          <div className="mt-[calc(100vh/2)] w-full max-w-lg pointer-events-auto bg-white border border-gray-200 rounded-md shadow-lg overflow-auto max-h-60">
                            {filteredItems.map((item) => (
                              <div
                                key={item.id || item._id}
                                onClick={() => {
                                  setItemField(idx, "description", item.description || "")
                                  setItemField(idx, "unit", item.unit || "")
                                  setItemField(idx, "unitPrice", item.unitPrice || 0)
                                  setActiveRow(null)
                                  setSearchTerm("")
                                }}
                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              >
                                <span className="font-medium">{item.description}</span>{" "}
                                <span className="text-gray-500 text-xs">
                                  ({item.unit}, KES {item.unitPrice?.toLocaleString()})
                                </span>
                              </div>
                            ))}

                            {filteredItems.length === 0 && (
                              <div className="px-4 py-2 text-gray-400 text-sm italic">
                                No matches —{" "}
                                <button
                                  type="button"
                                  className="text-blue-600 cursor-pointer hover:underline"
                                  onClick={() => setFormState({ type: "add-item" })}
                                >
                                  + Add New Item
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {errors[`items.${idx}.description`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.description`]}</p>
                      )}
                    </td>

                    <td className="p-2 border">
                      <input
                        type="number"
                        className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                        value={it.quantity}
                        onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                        disabled={isLocked}
                        min="1"
                        step="1"
                        required
                      />
                      {errors[`items.${idx}.quantity`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.quantity`]}</p>
                      )}
                    </td>

                    <td className="p-2 border">
                      <input
                        className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                        value={it.unit}
                        onChange={(e) => setItemField(idx, "unit", e.target.value)}
                        disabled={isLocked}
                        required
                      />
                      {errors[`items.${idx}.unit`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.unit`]}</p>
                      )}
                    </td>

                    <td className="p-2 border">
                      <input
                        type="number"
                        className="w-full border border-blue-200 p-1 rounded focus:ring-2 focus:ring-blue-300 outline-none"
                        value={it.unitPrice}
                        onChange={(e) => setItemField(idx, "unitPrice", e.target.value)}
                        disabled={isLocked}
                        min="0"
                        step="0.01"
                        required
                      />
                      {errors[`items.${idx}.unitPrice`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.unitPrice`]}</p>
                      )}
                    </td>

                    <td className="p-2 border text-center font-medium">
                      KES {((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toLocaleString()}
                    </td>

                    <td className="p-2 border text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 rounded hover:bg-red-100 hover:scale-110 transition-transform duration-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        disabled={isLocked || form.items.length === 1}
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

        {/* Notes Section */}
        <section>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Notes</h3>
          <textarea
            className="w-full border p-2 rounded min-h-[100px]"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={isLocked}
            placeholder="Any additional notes or instructions..."
          />
        </section>

        {/* Attachments Section */}
        <section>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Attachments</h3>
          
          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Existing Attachments:</h4>
              <ul className="space-y-2">
                {existingAttachments.map((attachment) => (
                  <li key={attachment._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.round(attachment.size / 1024)} KB • {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewAttachment(attachment)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="View attachment"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="text-green-600 hover:text-green-800 p-1 rounded"
                        title="Download attachment"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingAttachment(attachment._id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Remove attachment"
                        disabled={isLocked}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Attachments Upload */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              {existingAttachments.length > 0 ? 'Add More Attachments:' : 'Upload Attachments:'}
            </h4>
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files))}
              disabled={isLocked}
              className="w-full border border-gray-300 rounded-md p-2"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-2">
                {attachments.map((file, idx) => (
                  <li key={idx} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 p-2 rounded flex justify-between items-center">
                    <span>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline ml-2"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
          {!isLocked && (
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : PurchaseOrderId ? "Save Changes" : "Create PurchaseRecord"}
            </button>
          )}
          {PurchaseOrderId && (
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
      <SubcontractorFormModal onSave={handleSubcontractorSave} />
      <VendorFormModal onSave={handleVendorSave} />
    </>
  )
}
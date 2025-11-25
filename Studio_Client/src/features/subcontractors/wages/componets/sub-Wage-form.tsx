import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useCanGoBack } from "@tanstack/react-router"
import axiosInstance from "@/lib/axios"
import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"
import { useProjectStore } from "@/stores/projectStore"
import { Trash, Search, X } from "lucide-react"
import { useSubcontractorsSearch } from "@/components/export-use-subcontractor"

// ------------------ Helpers ------------------
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

// ------------------ Main Component ------------------
export default function SubWageOrderForm({ wageId }) {
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)
  const CurrentProjectId = useProjectStore(state => state.projectId)

  // ------------------ Form State ------------------
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
    subcontractorId: "",
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

  // ------------------ Estimate State ------------------
  const [estimateData, setEstimateData] = useState({
    estimateId: "",
    estimateLevel: "estimate",
    estimateTargetId: ""
  })

  // ------------------ Subcontractor Search ------------------
  const [subcontractorSearch, setSubcontractorSearch] = useState("")
  const [showSubcontractorDropdown, setShowSubcontractorDropdown] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)

  const {
    subcontractorsData,
    selectedSubcontractor,
    isLoading: loadingSubs,
    isError: subsError,
  } = useSubcontractorsSearch(subcontractorSearch, searchTrigger, form)

  const handleSubcontractorSelect = useCallback((sub) => {
    setForm(f => ({ 
      ...f, 
      subcontractorId: sub._id,
      vendorName: sub.contactPerson || sub.companyName || "",
      vendorContact: sub.contactPerson || "",
      vendorEmail: sub.email || "",
      vendorPhone: sub.phoneNumber || "",
      vendorAddress: sub.address || ""
    }))
    setSubcontractorSearch(`${sub.contactPerson} - ${sub.companyName}`)
    setShowSubcontractorDropdown(false)
  }, [])

  const handleSubcontractorClear = useCallback(() => {
    setForm(f => ({ 
      ...f, 
      subcontractorId: "",
      vendorName: "",
      vendorContact: "",
      vendorEmail: "",
      vendorPhone: "",
      vendorAddress: ""
    }))
    setSubcontractorSearch("")
    setShowSubcontractorDropdown(false)
  }, [])

  const handleSubcontractorSearchChange = useCallback((value) => {
    setSubcontractorSearch(value)
    setShowSubcontractorDropdown(true)
    setSearchTrigger(prev => prev + 1)
  }, [])

  // ------------------ Click Outside Handler ------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".subcontractor-search-container")) {
        setShowSubcontractorDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ------------------ Projects ------------------
  const { data: projects, isLoading: isProjectsLoading, isError: isProjectsError } = useQuery({
    queryKey: ["projectsList"],
    queryFn: async () => (await axiosInstance.get("/api/projects")).data,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!CurrentProjectId || !projects) return
    setForm(prev => (!prev.projectId || prev.projectId !== CurrentProjectId ? { ...prev, projectId: CurrentProjectId } : prev))
  }, [projects, CurrentProjectId])

  // ------------------ Fetch Existing Wage ------------------
  useQuery({
    queryKey: ["sub-wages", wageId],
    enabled: !!wageId,
    queryFn: async () => (await axiosInstance.get(`/api/wages/${wageId}`)).data,
    onSuccess: (po) => {
      const normalized = { 
        ...defaultForm, 
        ...po, 
        date: formatDateToInput(po.date), 
        deliveryDate: formatDateToInput(po.deliveryDate), 
        items: po.items?.length ? po.items : [emptyItem()] 
      }
      setForm(normalized)
      setInitialSnapshot(JSON.stringify(normalized))
      setIsDeletedMode(!!po?.isDeleted)
      
      // Set estimate data if exists
      if (po.estimateId) {
        setEstimateData({
          estimateId: po.estimateId,
          estimateLevel: po.estimateLevel || "estimate",
          estimateTargetId: po.estimateTargetId || ""
        })
      }
    },
    onError: () => setServerError("Failed to load wage data"),
  })

  // ------------------ Estimate Change Handler ------------------
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

  // ------------------ Mutations ------------------
  const createMutation = useMutation({
    mutationFn: payload => axiosInstance.post("/api/wages", payload).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sub-wages"])
      navigate({ to: `/projects/$projectId/subcontractors/wages` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to create wage order")
  })

  const updateMutation = useMutation({
    mutationFn: payload => axiosInstance.put(`/api/wages/${wageId}`, payload).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["sub-wages", wageId])
      navigate({ to: `/wages/${data._id}` })
    },
    onError: (err) => setServerError(err?.response?.data?.message || "Failed to update wage order")
  })

  useEffect(() => () => (isMountedRef.current = false), [])

  // ------------------ Auto Calculate Total ------------------
  useEffect(() => {
    const amount = form.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
    setForm(f => ({ ...f, amount }))
  }, [JSON.stringify(form.items)])

  // ------------------ Unsaved Changes ------------------
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!initialSnapshot) return
      if (JSON.stringify(form) !== initialSnapshot) { 
        e.preventDefault(); 
        e.returnValue = "" 
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form, initialSnapshot])

  const isDirty = useMemo(() => JSON.stringify(form) !== initialSnapshot, [form, initialSnapshot])

  // ------------------ Form Helpers ------------------
  const setField = useCallback((name, value) => setForm(f => ({ ...f, [name]: value })), [])
  
  const setItemField = useCallback((i, name, value) =>
    setForm(f => ({ ...f, items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)) })), [])
  
  const addItem = useCallback(() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] })), [])
  
  const removeItem = useCallback((i) => 
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i).length ? f.items.filter((_, idx) => idx !== i) : [emptyItem()] })), [])

  const validate = useCallback(() => {
    const e = {}
    if (!form.projectId) e.projectId = "Project ID is required"
    if (!form.company) e.company = "Company name is required"
    if (!form.vendorName) e.vendorName = "Vendor name is required"
    if (!form.deliveryAddress) e.deliveryAddress = "Delivery address is required"
    if (!form.date) e.date = "Order date is required"
    if (!form.deliveryDate) e.deliveryDate = "Delivery date is required"
    if (form.date && form.deliveryDate && new Date(form.deliveryDate) < new Date(form.date)) e.deliveryDate = "Delivery date cannot be before order date"
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

  // ------------------ Submit ------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return window.scrollTo({ top: 0, behavior: "smooth" })
    setIsSubmitting(true)

    const payload = {
      ...form,
      projectId: form.projectId,
      company: form.company.trim(),
      vendorName: form.vendorName.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      date: form.date ? new Date(form.date).toISOString() : null,
      deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : null,
      items: form.items.map(item => ({ 
        description: item.description.trim(), 
        quantity: Number(item.quantity), 
        unit: item.unit.trim(), 
        unitPrice: Number(item.unitPrice) 
      })),
      amount: Number(form.amount),
      ...(form.subcontractorId && { subcontractorId: form.subcontractorId }),
      ...(form.estimateId && { 
        estimateId: form.estimateId, 
        estimateLevel: form.estimateLevel, 
        estimateTargetId: form.estimateTargetId 
      })
    }

    try {
      if (wageId) await updateMutation.mutateAsync(payload)
      else await createMutation.mutateAsync(payload)
    } catch (err) { 
      console.error(err) 
    } finally { 
      if (isMountedRef.current) setIsSubmitting(false) 
    }
  }

  const handleBack = useCallback(() => {
    if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return
    if (canGoBack) window.history.back()
    else navigate({ to: "/wages" })
  }, [isDirty, canGoBack, navigate])

  const handleSoftDelete = async () => {
    if (!wageId) return
    if (!confirm("Soft delete this wage order?")) return
    try {
      await axiosInstance.delete(`/api/wages/${wageId}`)
      queryClient.invalidateQueries(["sub-wages", wageId])
      navigate({ to: "/wages" })
    } catch (err) { 
      setServerError(err?.response?.data?.message || "Delete failed") 
    }
  }

  const isLocked = ["approved", "delivered"].includes(form.status) || isDeletedMode

  // ------------------- Render -------------------
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-sm">
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={handleBack} className="text-blue-600 hover:underline">← Back</button>
        <h2 className="text-xl font-semibold text-gray-800">{wageId ? "Edit Wage Order" : "New Wage Order"}</h2>
      </div>

      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong>{serverError}
        </div>
      )}

      {/* Estimate Selector - Fixed with Safe Wrapper */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-medium text-blue-700 mb-2">Link to Estimate</h3>
        <SafeEstimateSelector onChange={onEstimateChange} />
        {estimateData.estimateId && (
          <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
            <p><span className="font-medium">Estimate ID:</span> {estimateData.estimateId}</p>
            <p><span className="font-medium">Linked Level:</span> {estimateData.estimateLevel}</p>
            {estimateData.estimateTargetId && (
              <p><span className="font-medium">Target ID:</span> {estimateData.estimateTargetId}</p>
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
                value={form.projectId || ""}
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
              required
            />
            {errors.company && <p className="text-red-500 text-sm">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
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
      </section>

      {/* Vendor Info */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Vendor Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Vendor Name *</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorName}
              onChange={(e) => setField("vendorName", e.target.value)}
              required
            />
            {errors.vendorName && <p className="text-red-500 text-sm">{errors.vendorName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Contact</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorContact}
              onChange={(e) => setField("vendorContact", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Email</label>
            <input
              className="w-full border p-2 rounded"
              type="email"
              value={form.vendorEmail}
              onChange={(e) => setField("vendorEmail", e.target.value)}
            />
            {errors.vendorEmail && <p className="text-red-500 text-sm">{errors.vendorEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Vendor Phone</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorPhone}
              onChange={(e) => setField("vendorPhone", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Vendor Address</label>
            <input
              className="w-full border p-2 rounded"
              value={form.vendorAddress}
              onChange={(e) => setField("vendorAddress", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Other Details */}
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-700 border-b pb-2">Other Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Subcontractor Search Field */}
          <div className="subcontractor-search-container relative">
            <label className="block text-sm font-medium">Subcontractor</label>
            <div className="relative">
              <input
                type="text"
                className="w-full border p-2 rounded pr-10 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Search by contact person or company..."
                value={subcontractorSearch}
                onChange={(e) => handleSubcontractorSearchChange(e.target.value)}
                onFocus={() => {
                  setTimeout(() => {
                    setShowSubcontractorDropdown(true)
                    setSearchTrigger(prev => prev + 1)
                  }, 0)
                }}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                {form.subcontractorId && (
                  <button
                    type="button"
                    onClick={handleSubcontractorClear}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
                <Search size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Dropdown Results */}
            {showSubcontractorDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {loadingSubs ? (
                  <div className="p-3 text-sm text-gray-500">Loading subcontractors...</div>
                ) : subsError ? (
                  <div className="p-3 text-sm text-red-500">Failed to load subcontractors</div>
                ) : subcontractorsData?.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    {subcontractorSearch ? "No subcontractors found" : "Start typing to search subcontractors"}
                  </div>
                ) : (
                  subcontractorsData?.map((sub) => (
                    <div
                      key={sub._id}
                      className={`p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 ${
                        form.subcontractorId === sub._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSubcontractorSelect(sub)}
                    >
                      <div className="font-medium text-gray-900">
                        {sub.contactPerson} - {sub.companyName}
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                        {sub.email && <span>{sub.email}</span>}
                        {sub.phoneNumber && <span>• {sub.phoneNumber}</span>}
                        {sub.typeOfWork && sub.typeOfWork !== 'user' && <span>• {sub.typeOfWork}</span>}
                      </div>
                      {sub.projects && sub.projects.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          {sub.projects.length} active project(s)
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected subcontractor info */}
            {selectedSubcontractor && !showSubcontractorDropdown && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <span className="font-medium">Selected: </span>
                {selectedSubcontractor.contactPerson} - {selectedSubcontractor.companyName}
                {selectedSubcontractor.email && ` • ${selectedSubcontractor.email}`}
                {selectedSubcontractor.phoneNumber && ` • ${selectedSubcontractor.phoneNumber}`}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full border p-2 rounded"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
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
                <tr key={idx}>
                  <td className="p-2 border">
                    <input
                      className="w-full border p-1 rounded"
                      value={it.description}
                      onChange={(e) => setItemField(idx, "description", e.target.value)}
                      required
                    />
                    {errors[`items.${idx}.description`] && (
                      <p className="text-red-500 text-xs">{errors[`items.${idx}.description`]}</p>
                    )}
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border p-1 rounded"
                      value={it.quantity}
                      onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                      min="1"
                      step="1"
                      required
                    />
                    {errors[`items.${idx}.quantity`] && (
                      <p className="text-red-500 text-xs">{errors[`items.${idx}.quantity`]}</p>
                    )}
                  </td>
                  <td className="p-2 border">
                    <input
                      className="w-full border p-1 rounded"
                      value={it.unit}
                      onChange={(e) => setItemField(idx, "unit", e.target.value)}
                      required
                    />
                    {errors[`items.${idx}.unit`] && (
                      <p className="text-red-500 text-xs">{errors[`items.${idx}.unit`]}</p>
                    )}
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="w-full border p-1 rounded"
                      value={it.unitPrice}
                      onChange={(e) => setItemField(idx, "unitPrice", e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors[`items.${idx}.unitPrice`] && (
                      <p className="text-red-500 text-xs">{errors[`items.${idx}.unitPrice`]}</p>
                    )}
                  </td>
                  <td className="p-2 border text-center font-medium">
                    KES {((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toLocaleString()}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={isLocked || form.items.length === 1}
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
          <button type="button" onClick={addItem} className="text-blue-600 hover:underline">
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
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Any additional notes..."
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
        {!isLocked && (
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : wageId ? "Save Changes" : "Create Wage Order"}
          </button>
        )}
        {wageId && (
          <button
            type="button"
            onClick={handleSoftDelete}
            className="text-gray-500 border px-4 py-2 rounded hover:bg-gray-50"
          >
            {isDeletedMode ? "Restore" : "Soft Delete"}
          </button>
        )}
        <button type="button" onClick={handleBack} className="text-gray-700 border px-4 py-2 rounded hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
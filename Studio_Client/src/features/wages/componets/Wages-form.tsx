"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
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
import { Trash2, X, ArrowLeft, FileText, Truck, Building, Package, Paperclip, AlertCircle, File, Image, Download, CheckCircle } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ItemAutocomplete from "@/components/items/items-auto-select"

const emptyItem = () => ({ description: "", quantity: 1, unit: "", unitPrice: 0, name: "" })

function formatDateToInput(d: string | Date) {
  if (!d) return ""
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ""
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")
}

// File type detection helper
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
    return <Image size={16} className="text-blue-500" />
  }
  if (['pdf'].includes(extension || '')) {
    return <FileText size={16} className="text-red-500" />
  }
  if (['doc', 'docx'].includes(extension || '')) {
    return <FileText size={16} className="text-blue-600" />
  }
  if (['xls', 'xlsx'].includes(extension || '')) {
    return <FileText size={16} className="text-green-600" />
  }
  return <File size={16} className="text-gray-500" />
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Safe number formatter
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "KES 0"
  }
  return `KES ${amount.toLocaleString()}`
}

// Safe item total calculator
const calculateItemTotal = (quantity: number | string, unitPrice: number | string) => {
  const qty = Number(quantity) || 0
  const price = Number(unitPrice) || 0
  return formatCurrency(qty * price)
}

export default function WageOrderForm({ wageId }: { wageId?: string }) {
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const queryClient = useQueryClient()
  const isMountedRef = useRef(true)
  const { setFormState } = useItemsVendors()

  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<any[]>([])
  const [removeAttachments, setRemoveAttachments] = useState<string[]>([])
  const [forceReplaceAttachments, setForceReplaceAttachments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    estimateLevel: "group",
    estimateTargetId: "",
  }

  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null)
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

  // Fetch estimates for the current project
  const {
    data: estimates = [],
    isLoading: isLoadingEstimates,
  } = useQuery({
    queryKey: ["estimatesByProject", CurrentProjectId],
    queryFn: async () => {
      if (!CurrentProjectId) return []
      try {
        const res = await axiosInstance.get(`/api/estimates/project/${CurrentProjectId}`)
        return res.data
      } catch (err) {
        if (err.response?.status === 404) return []
        throw err
      }
    },
    enabled: !!CurrentProjectId,
    staleTime: 5 * 60 * 1000,
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
    data: wageOrder,
    isLoading: isWageOrderLoading,
    isError: isWageOrderError,
  } = useQuery({
    queryKey: ["wages", wageId],
    enabled: Boolean(wageId),
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/wages/${wageId}`)
      return res.data
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
    onError: (err) => {
      console.error("Failed to load wage order:", err)
      setServerError("Failed to load wage order data")
    },
  })

  // ------------------- Mutations -------------------
  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      axiosInstance
        .post("/api/wages", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wages"] })
      setSubmitAttempted(false)
      setSuccessMessage("Purchase order created successfully!")
      setIsSubmitting(false)
      setTimeout(() => {
        setSuccessMessage(null)
        navigate({ 
          to: `/projects/$projectId/wages`,
          params: { projectId: data.projectId?._id || data.projectId || CurrentProjectId }
        })
      }, 2000)
    },
    onError: (err) => {
      setServerError(err?.response?.data?.message || "Failed to create wage order")
      setIsSubmitting(false)
      setSubmitAttempted(true)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: FormData) =>
      axiosInstance
        .put(`/api/wages/${wageId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wages", wageId] })
      queryClient.invalidateQueries({ queryKey: ["wages"] })
      setSubmitAttempted(false)
      
      // Handle nested projectId structure from API response
      const projectId = data.projectId?._id || data.projectId
      
      const updatedForm = {
        ...data,
        projectId: projectId || "",
        date: formatDateToInput(data.date),
        deliveryDate: formatDateToInput(data.deliveryDate),
        items: Array.isArray(data.items) && data.items.length ? 
          data.items.map(item => ({
            description: item.description || "",
            quantity: item.quantity || 1,
            unit: item.unit || "",
            unitPrice: item.unitPrice || 0,
            name: item.name || ""
          })) : [emptyItem()],
        amount: data.amount || 0,
      }
      
      setForm(updatedForm)
      setInitialSnapshot(JSON.stringify(updatedForm))
      setExistingAttachments(data.attachments || [])
      
      setNewAttachments([])
      setRemoveAttachments([])
      setForceReplaceAttachments(false)
      
      setSuccessMessage("Purchase order updated successfully!")
      setIsSubmitting(false)
      setTimeout(() => {
        setSuccessMessage(null)
        navigate({ 
          to: `/projects/$projectId/wages`,
          params: { projectId: projectId || CurrentProjectId }
        })
      }, 2000)
    },
    onError: (err) => {
      setServerError(err?.response?.data?.message || "Failed to update wage order")
      setIsSubmitting(false)
      setSubmitAttempted(true)
    },
  })

  // ------------------- Effects -------------------
  // Auto-fill project ID when available
  useEffect(() => {
    if (!isProjectsLoading && CurrentProjectId && !form.projectId && !wageId) {
      setField("projectId", CurrentProjectId)
    }
  }, [isProjectsLoading, CurrentProjectId, form.projectId, wageId])

  // Auto-select first estimate when estimates load and no estimate is selected
  useEffect(() => {
    if (estimates.length > 0 && !form.estimateId && !wageId) {
      const firstEstimate = estimates[0]
      if (firstEstimate) {
        setForm(prev => ({
          ...prev,
          estimateId: firstEstimate.estimateId || firstEstimate._id,
          estimateLevel: "estimate",
          estimateTargetId: firstEstimate.estimateId || firstEstimate._id
        }))
      }
    }
  }, [estimates, wageId])

  // Load wage order data when editing - FIXED for nested projectId
  useEffect(() => {
    if (!wageOrder || !wageId) return

    // Handle nested projectId structure
    const projectId = wageOrder.projectId?._id || wageOrder.projectId

    const poFormData = {
      projectId: projectId || "",
      reference: wageOrder.reference || "",
      company: wageOrder.company || "",
      status: wageOrder.status || "pending",
      date: formatDateToInput(wageOrder.date),
      deliveryDate: formatDateToInput(wageOrder.deliveryDate),
      deliveryAddress: wageOrder.deliveryAddress || "",
      notes: wageOrder.notes || "",
      vendorName: wageOrder.vendorName || "",
      vendorContact: wageOrder.vendorContact || "",
      vendorEmail: wageOrder.vendorEmail || "",
      vendorPhone: wageOrder.vendorPhone || "",
      vendorAddress: wageOrder.vendorAddress || "",
      items: Array.isArray(wageOrder.items) && wageOrder.items.length ? 
        wageOrder.items.map(item => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unit: item.unit || "",
          unitPrice: item.unitPrice || 0,
          name: item.name || "",
          _id: item._id // Preserve item IDs for updates
        })) : [emptyItem()],
      amount: wageOrder.amount || 0,
      estimateId: wageOrder.estimateId || "",
      estimateLevel: wageOrder.estimateLevel || "estimate",
      estimateTargetId: wageOrder.estimateTargetId || "",
    }

    setForm(poFormData)
    setInitialSnapshot(JSON.stringify(poFormData))

    if (Array.isArray(wageOrder.attachments)) {
      setExistingAttachments(wageOrder.attachments)
    }
  }, [wageOrder, wageId])

  // Calculate amount using useMemo
  const calculatedAmount = useMemo(() => 
    form.items.reduce((acc, it) => {
      const quantity = Number(it.quantity) || 0
      const unitPrice = Number(it.unitPrice) || 0
      return acc + (quantity * unitPrice)
    }, 0),
    [form.items]
  )

  // Update form with calculated amount
  useEffect(() => {
    if (calculatedAmount !== form.amount) {
      setForm(f => ({ ...f, amount: calculatedAmount }))
    }
  }, [calculatedAmount, form.amount])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!initialSnapshot) return
      if (JSON.stringify(form) !== initialSnapshot || newAttachments.length > 0 || removeAttachments.length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form, initialSnapshot, newAttachments, removeAttachments])

  useEffect(() => () => { isMountedRef.current = false }, [])

  // ------------------- Helpers -------------------
  const setField = useCallback((name: string, value: any) => 
    setForm((f) => ({ ...f, [name]: value })), [])
  
  const setItemField = useCallback((i: number, name: string, value: any) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (i === idx ? { ...it, [name]: value } : it)),
    })), [])
  
  const addItem = useCallback(() => 
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] })), [])
  
  const removeItem = useCallback((i: number) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i).length ? f.items.filter((_, idx) => idx !== i) : [emptyItem()],
    })), [])

  const isDirty = useMemo(
    () => JSON.stringify(form) !== initialSnapshot || newAttachments.length > 0 || removeAttachments.length > 0,
    [form, initialSnapshot, newAttachments, removeAttachments],
  )

  // ------------------- Attachment Handlers -------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const uniqueNewFiles = selectedFiles.filter(newFile => 
      !newAttachments.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    )
    
    setNewAttachments(prev => [...prev, ...uniqueNewFiles])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setExistingAttachments(prev => prev.filter(att => att._id !== attachmentId))
    setRemoveAttachments(prev => [...prev, attachmentId])
  }

  const handleDownloadAttachment = (attachment: any) => {
    // Create download URL from the stored file path
    const fileUrl = attachment.url || `${axiosInstance.defaults.baseURL}/${attachment.path}`
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAllNewAttachments = () => {
    setNewAttachments([])
  }

  const handleReplaceAllAttachments = () => {
    if (confirm("This will remove ALL existing attachments and replace them with the new files. Continue?")) {
      setForceReplaceAttachments(true)
      setRemoveAttachments(existingAttachments.map(att => att._id))
      setExistingAttachments([])
    }
  }

  // ------------------- Event Handlers -------------------
  const handleItemSave = useCallback((item: Item) => {
    addItem()
    const newIndex = form.items.length
    setItemField(newIndex, "description", item.description)
    setItemField(newIndex, "unit", item.unit)
    setItemField(newIndex, "unitPrice", item.unitPrice)
    setItemField(newIndex, "name", item.name || "")
  }, [addItem, setItemField, form.items.length])

  const handleVendorSave = useCallback((vendor: Vendor) => {
    setField("vendorName", vendor.vendorName)
    setField("vendorEmail", vendor.vendorEmail || "")
    setField("vendorPhone", vendor.vendorPhone || "")
    setField("vendorAddress", vendor.vendorAddress || "")
    setField("vendorContact", vendor.vendorContact || "")
  }, [setField])

  const onEstimateChange = useCallback(({ estimateId, estimateLevel, estimateTargetId }: { 
    estimateId: string; 
    estimateLevel: string; 
    estimateTargetId: string 
  }) => {
    setForm((f) => ({ ...f, estimateId, estimateLevel, estimateTargetId }))
  }, [])

  const estimateInitialValues = useMemo(() => ({
    estimateId: form.estimateId,
    estimateLevel: form.estimateLevel,
    estimateTargetId: form.estimateTargetId
  }), [form.estimateId, form.estimateLevel, form.estimateTargetId])

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
  setSubmitAttempted(true)
  
  if (!validate()) {
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }
  
  setIsSubmitting(true)
  setServerError(null)

  try {
    const formData = new FormData()

    // FIXED: Now includes the amount field
    Object.keys(form).forEach((key) => {
      if (key === "items") {
        // Remove _id from items before sending to avoid validation issues
        const itemsToSend = form.items.map(({ _id, ...item }) => item)
        formData.append("items", JSON.stringify(itemsToSend))
      } else if (key !== "_id") {  // ← ONLY exclude _id
        const value = form[key as keyof typeof form]
        formData.append(key, value !== undefined && value !== null ? value.toString() : "")
      }
    })

    newAttachments.forEach((file) => {
      formData.append("attachments", file)
    })

    if (removeAttachments.length > 0) {
      formData.append("removeAttachments", JSON.stringify(removeAttachments))
    }

    if (forceReplaceAttachments) {
      formData.append("forceReplaceAttachments", "true")
    }

    if (wageId) {
      await updateMutation.mutateAsync(formData)
    } else {
      await createMutation.mutateAsync(formData)
    }
  } catch (error) {
    console.error("Submission error:", error)
  }
}

  const handleBack = () => {
    if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return
    if (canGoBack) window.history.back()
    else navigate({ to: "/wages" })
  }

  const clearServerError = () => {
    setServerError(null)
    setSubmitAttempted(false)
  }

  const isLocked = ["approved", "delivered"].includes(form.status)

  // Show loading state when fetching Wage order data
  if (wageId && isWageOrderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Wage order...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                {wageId ? "Edit Wage Order" : "Create New Wage Order"}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {isDirty && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unsaved Changes
                </span>
              )}
              {submitAttempted && serverError && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle size={14} className="mr-1" />
                  Save Failed
                </span>
              )}
              {forceReplaceAttachments && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Replace All Files
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-1 text-sm text-green-700">{successMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Server Error Alert - Dismissible */}
        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Unable to Save</h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>{serverError}</p>
                    <p className="mt-1 text-red-600">
                      Please check your data and try again. You can still edit the form and resubmit.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearServerError}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={16} />
              </button>
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
            <EstimateSelector 
              onChange={onEstimateChange}
              initialValues={estimateInitialValues}
            />
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
                  <Select
                    value={form.projectId}
                    onValueChange={(value) => setField("projectId", value)}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select Project">
                        {form.projectId && projects?.find((p: any) => p._id === form.projectId)?.name || "Select Project"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(projects || []).map((p: any) => (
                        <SelectItem key={p._id} value={p._id}>
                          {`${p.name} (${p.projectNumber}) — ${p.client?.companyName || "No Client"}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Total: <span className="text-blue-600">{formatCurrency(form.amount)}</span>
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
                          autoFocus={false}
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
                          autoFocus={false}
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
                          autoFocus={false}
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
                          autoFocus={false}
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
                          autoFocus={false}
                        />
                      </td>

                      {/* ROW TOTAL */}
                      <td className="px-2 py-1 font-medium text-gray-900 text-sm align-top">
                        {calculateItemTotal(it.quantity, it.unitPrice)}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Paperclip className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
              </div>
              <div className="flex items-center space-x-3">
                {newAttachments.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNewAttachments}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear New Files
                  </button>
                )}
                {existingAttachments.length > 0 && newAttachments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReplaceAllAttachments}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Replace All Files
                  </button>
                )}
              </div>
            </div>

            {/* File Upload Area */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload New Files
                <span className="text-gray-500 text-sm font-normal ml-2">
                  (Select multiple files)
                </span>
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to browse or drag and drop files here
                </p>
                <p className="text-xs text-gray-500">
                  Supports images, PDFs, documents, and other files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isLocked}
                  className="hidden"
                  accept="*/*"
                />
              </div>
              {newAttachments.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {newAttachments.length} file(s) selected for upload
                </p>
              )}
            </div>

            {/* New Files Preview */}
            {newAttachments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">
                    New
                  </span>
                  Files to Upload ({newAttachments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newAttachments.map((file, index) => (
                    <div
                      key={`new-${index}-${file.name}`}
                      className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-1">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-green-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              {formatFileSize(file.size)}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Type: {file.type || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewAttachment(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors flex-shrink-0 ml-2"
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                    Current
                  </span>
                  Existing Attachments ({existingAttachments.length})
                  {removeAttachments.length > 0 && (
                    <span className="ml-2 text-xs text-red-600">
                      ({removeAttachments.length} marked for removal)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingAttachments.map((attachment) => {
                    const isMarkedForRemoval = removeAttachments.includes(attachment._id)
                    return (
                      <div
                        key={attachment._id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isMarkedForRemoval 
                            ? 'border-red-300 bg-red-50 opacity-60' 
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-1">
                              {getFileIcon(attachment.fileName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${
                                isMarkedForRemoval ? 'text-red-900' : 'text-gray-900'
                              }`} title={attachment.fileName}>
                                {attachment.fileName}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isMarkedForRemoval ? 'text-red-700' : 'text-gray-700'
                              }`}>
                                {formatFileSize(attachment.size)}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isMarkedForRemoval ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                              </p>
                              {isMarkedForRemoval && (
                                <p className="text-xs text-red-600 font-medium mt-1">
                                  Will be removed on save
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1 ml-2">
                            {attachment.url && !isMarkedForRemoval && (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1 rounded transition-colors"
                                title="Download file"
                              >
                                <Download size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingAttachment(attachment._id)}
                              disabled={isLocked}
                              className={`p-1 rounded transition-colors ${
                                isMarkedForRemoval
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                              }`}
                              title={isMarkedForRemoval ? "File will be removed" : "Remove file"}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200">
            {!isLocked && (
              <>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : submitAttempted ? (
                    <>
                      <AlertCircle size={16} className="mr-2" />
                      Try Again
                    </>
                  ) : wageId ? (
                    "Save Changes"
                  ) : (
                    "Create Wage Order"
                  )}
                </button>
                
                {submitAttempted && serverError && (
                  <button
                    type="button"
                    onClick={clearServerError}
                    className="text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Dismiss Error
                  </button>
                )}
              </>
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
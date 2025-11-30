"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjectStore } from "@/stores/projectStore"
import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"

interface Project {
  _id: string
  name: string
}

interface ProjectSub {
  projectId: string
  estimateId: string
  allocationLevel: "group" | "section" | "subsection"
  allocationRef: string
  allocatedBudget?: number
  totalWages?: number
  totalExpenses?: number
  totalPOS?: number
  balance?: number
  progress?: number
}

interface Subcontractor {
  _id?: string
  vendorId?: string
  companyName: string
  contactPerson: string
  phoneNumber: string
  email: string
  category: string
  projects?: ProjectSub[]
}

export function SubcontractorFormModal({ onSave }: { onSave?: (subcontractor: Subcontractor) => void }) {
  const { formState, setFormState } = useItemsVendors()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Subcontractor>({
    vendorId: "",
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    category: "",
    projects: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [estimateSelection, setEstimateSelection] = useState<any>(null)

  const isOpen = formState?.type === "add-subcontractor" || formState?.type === "edit-subcontractor"
  const isEditMode = formState?.type === "edit-subcontractor"

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => axiosInstance.get("/api/projects").then((res) => res.data?.data || []),
    enabled: isOpen,
  })

  const projects = projectsData || []

  useEffect(() => {
    if (isEditMode && formState?.data) {
      setFormData(formState.data)
    } else if (!isOpen) {
      setFormData({
        vendorId: "",
        companyName: "",
        contactPerson: "",
        phoneNumber: "",
        email: "",
        category: "",
        projects: [],
      })
      setErrors({})
      setSelectedProject("")
      setEstimateSelection(null)
    }
  }, [isOpen, isEditMode, formState?.data])

  const createMutation = useMutation({
    mutationFn: (data: Subcontractor) => axiosInstance.post("/api/subcontractors", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
      onSave?.(res.data?.data || res.data)
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Subcontractor) => axiosInstance.put(`/api/subcontractors/${data._id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
      onSave?.(res.data?.data || res.data)
      handleClose()
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.companyName?.trim()) e.companyName = "Company name is required"
    if (!formData.contactPerson?.trim()) e.contactPerson = "Contact person is required"
    if (!formData.phoneNumber?.trim()) e.phoneNumber = "Phone number is required"
    if (!formData.email?.trim()) e.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email"
    if (!formData.category?.trim()) e.category = "Category is required"
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleAddProject = () => {
    if (!selectedProject || !estimateSelection) {
      alert("Please select both project and estimate allocation")
      return
    }

    const newProject: ProjectSub = {
      projectId: selectedProject,
      estimateId: estimateSelection.estimateId,
      allocationLevel: estimateSelection.estimateLevel,
      allocationRef: estimateSelection.estimateTargetId,
      allocatedBudget: 0,
      totalWages: 0,
      totalExpenses: 0,
      totalPOS: 0,
      balance: 0,
      progress: 0,
    }

    setFormData({
      ...formData,
      projects: [...(formData.projects || []), newProject],
    })
    setSelectedProject("")
    setEstimateSelection(null)
  }

  const handleRemoveProject = (index: number) => {
    setFormData({
      ...formData,
      projects: formData.projects?.filter((_, i) => i !== index) || [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (isEditMode) {
      await updateMutation.mutateAsync(formData)
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const handleClose = () => {
    setFormState(null)
  }

  if (!isOpen) return null

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{isEditMode ? "Edit Subcontractor" : "Add Subcontractor"}</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl" disabled={isLoading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {formData.vendorId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
              <input
                type="text"
                value={formData.vendorId}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-100"
              />
            </div>
          )}

          {/* General Info */}
          {["companyName", "category", "contactPerson", "phoneNumber", "email"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field.replace(/([A-Z])/g, " $1")} *
              </label>
              <input
                type={field === "email" ? "email" : field === "phoneNumber" ? "tel" : "text"}
                value={(formData as any)[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                disabled={isLoading}
              />
              {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
            </div>
          ))}

          {/* Projects Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Projects & Allocations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <Select
                  value={selectedProject}
                  onValueChange={(val) => {
                    setSelectedProject(val)
                    useProjectStore.setState({ projectId: val })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <div className="col-span-1 md:col-span-2">
                  <EstimateSelector
                    onChange={(val) => setEstimateSelection(val)}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddProject}
              className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              disabled={isLoading || !selectedProject || !estimateSelection}
            >
              + Add Allocation
            </button>

            {formData.projects && formData.projects.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.projects.map((project, index) => {
                  const projectName =
                    projects.find((p: Project) => p._id === project.projectId)?.name || project.projectId
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                      <span>
                        {projectName} → {project.estimateId} ({project.allocationLevel})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : isEditMode ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              Cancelz
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

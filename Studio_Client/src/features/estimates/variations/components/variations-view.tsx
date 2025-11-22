import  { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ChevronDown, ChevronRight, Trash2, ArrowLeft, Save, Edit, Eye } from "lucide-react"
import { z } from "zod"
import { useNavigate, useParams } from "@tanstack/react-router"

// Zod validation schema
const variationSchema = z.object({
  name: z.string().min(1, "Variation name is required"),
  projectId: z.string().min(1, "Project is required"),
  estimateId: z.string().min(1, "Estimate is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
})

// Format large numbers for display
const formatNumber = (value) => {
  if (!value && value !== 0) return ""
  return new Intl.NumberFormat('en-KE').format(value)
}

// Parse formatted numbers back to raw values
const parseNumber = (value) => {
  if (!value) return 0
  return parseFloat(value.replace(/,/g, '')) || 0
}

// Helper function to safely extract name from project object
const getProjectName = (project) => {
  if (!project) return ''
  if (typeof project.name === 'string') return project.name
  if (typeof project.name === 'object' && project.name !== null) return project.name.name || ''
  return project.name || ''
}

export default function VariationDetailPage() {
  const params = useParams({ strict: false }) as { variationId: string }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [variationName, setVariationName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [estimateId, setEstimateId] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [groups, setGroups] = useState([])
  const [expanded, setExpanded] = useState({})
  const [validationErrors, setValidationErrors] = useState({})

  // Fetch variation by ID
  const { data: variation, isLoading, error } = useQuery({
    queryKey: ["variation", params.variationId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/variations/${params.variationId}`)
      return response.data
    },
    enabled: !!params.variationId,
  })

  // Fetch projects and estimates
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await axiosInstance.get("/api/projects")).data,
  })

  const { data: estimates = [] } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => (await axiosInstance.get("/api/estimates")).data,
  })

  // Update mutation
  const updateVariationMutation = useMutation({
    mutationFn: async (variationData) => {
      const response = await axiosInstance.put(`/api/variations/${params.variationId}`, variationData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success("Variation updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["variation", params.variationId] })
      setIsEditing(false)
    },
    onError: (error) => {
      console.error("Error updating variation:", error)
      toast.error("Failed to update variation. Please try again.")
    }
  })

useEffect(() => {
  if (variation && projects.length > 0) {
    // Normalize projectId to string that matches a project _id
    let id = "";
    if (typeof variation.projectId === "string") {
      id = variation.projectId;
    } else if (variation.projectId?._id) {
      id = variation.projectId._id;
    } else if (variation.projectId?.name) {
      // fallback: find project by name in projects list
      const match = projects.find(p => getProjectName(p) === variation.projectId.name);
      id = match?._id || "";
    }

    setProjectId(id);
    setVariationName(variation.name || "");
    setEstimateId(variation.estimateId || "");
    setDescription(variation.description || "");
    setNotes(variation.notes || "");
    setGroups(variation.groups || []);

    // Expand all groups by default
    const initialExpanded: Record<string, boolean> = {};
    variation.groups?.forEach(group => {
      initialExpanded[group._id || group.grpId] = true;
      group.sections?.forEach(section => {
        initialExpanded[section._id || section.secId] = true;
      });
    });
    setExpanded(initialExpanded);
  }
}, [variation, projects]);


  // Validate form data
  const validateForm = () => {
    try {
      variationSchema.parse({
        name: variationName,
        projectId,
        estimateId,
        description,
        notes,
      })
      setValidationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {}
        error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message
        })
        setValidationErrors(errors)
      }
      return false
    }
  }

  const getProjectName = (project: any) => {
  if (!project) return ""

  // If pure string
  if (typeof project === "string") return project

  // If { name: "Project" }
  if (typeof project.name === "string") return project.name

  // If { name: { name: "Project" } }
  if (typeof project.name === "object" && project.name?.name) {
    return project.name.name
  }

  // fallback
  return project.name || ""
}


  // Add new group
  const addNewGroup = () => {
    const groupIndex = groups.length
    const groupCode = generateGroupCode(groupIndex)
    
    const newGroup = {
      id: crypto.randomUUID(),
      grpId: "",
      code: groupCode,
      description: "",
      quantity: 0,
      unit: "",
      rate: 0,
      amount: 0,
      total: 0,
      spent: 0,
      balance: 0,
      sections: [],
      notes: []
    }
    setGroups([...groups, newGroup])
    setExpanded(prev => ({ ...prev, [newGroup.id]: true }))
  }

  // Add new section to group
  const addNewSection = (groupId) => {
    const group = groups.find(g => g.id === groupId || g._id === groupId || g.grpId === groupId)
    if (!group) return

    const sectionIndex = group.sections.length
    const sectionCode = generateSectionCode(group.code, sectionIndex)
    
    const newSection = {
      id: crypto.randomUUID(),
      secId: "",
      code: sectionCode,
      description: "",
      quantity: 0,
      unit: "",
      rate: 0,
      amount: 0,
      total: 0,
      spent: 0,
      balance: 0,
      subsections: [],
      notes: []
    }

    setGroups(groups.map(group => 
      (group.id === groupId || group._id === groupId || group.grpId === groupId)
        ? { ...group, sections: [...group.sections, newSection] }
        : group
    ))
    setExpanded(prev => ({ ...prev, [newSection.id]: true }))
  }

  // Add new subsection to section
  const addNewSubsection = (groupId, sectionId) => {
    const group = groups.find(g => g.id === groupId || g._id === groupId || g.grpId === groupId)
    if (!group) return

    const section = group.sections.find(s => s.id === sectionId || s._id === sectionId || s.secId === sectionId)
    if (!section) return

    const subsectionIndex = section.subsections.length
    const subsectionCode = generateSubsectionCode(section.code, subsectionIndex)

    const newSubsection = {
      id: crypto.randomUUID(),
      subId: "",
      code: subsectionCode,
      description: "",
      quantity: 1,
      unit: "",
      rate: 0,
      amount: 0,
      total: 0,
      spent: 0,
      balance: 0,
      notes: []
    }

    setGroups(groups.map(group => 
      (group.id === groupId || group._id === groupId || group.grpId === groupId)
        ? {
            ...group,
            sections: group.sections.map(section =>
              (section.id === sectionId || section._id === sectionId || section.secId === sectionId)
                ? { ...section, subsections: [...section.subsections, newSubsection] }
                : section
            )
          }
        : group
    ))
  }

  // Delete operations
  const deleteGroup = (groupId) => {
    if (groups.length > 1) {
      setGroups(groups.filter(group => 
        !(group.id === groupId || group._id === groupId || group.grpId === groupId)
      ))
    }
  }

  const deleteSection = (groupId, sectionId) => {
    setGroups(groups.map(group => {
      if (group.id === groupId || group._id === groupId || group.grpId === groupId) {
        return {
          ...group,
          sections: group.sections.filter(section => 
            !(section.id === sectionId || section._id === sectionId || section.secId === sectionId)
          )
        }
      }
      return group
    }))
  }

  const deleteSubsection = (groupId, sectionId, subsectionId) => {
    setGroups(groups.map(group => {
      if (group.id === groupId || group._id === groupId || group.grpId === groupId) {
        return {
          ...group,
          sections: group.sections.map(section => {
            if (section.id === sectionId || section._id === sectionId || section.secId === sectionId) {
              return {
                ...section,
                subsections: section.subsections.filter(sub => 
                  !(sub.id === subsectionId || sub._id === subsectionId || sub.subId === subsectionId)
                )
              }
            }
            return section
          })
        }
      }
      return group
    }))
  }

  // Update operations
  const updateGroup = (groupId, key, value) => {
    setGroups(groups.map(group => 
      (group.id === groupId || group._id === groupId || group.grpId === groupId) ? { 
        ...group, 
        [key]: value === undefined || value === null ? "" : value 
      } : group
    ))
  }

  const updateSection = (groupId, sectionId, key, value) => {
    setGroups(groups.map(group => 
      (group.id === groupId || group._id === groupId || group.grpId === groupId)
        ? {
            ...group,
            sections: group.sections.map(section =>
              (section.id === sectionId || section._id === sectionId || section.secId === sectionId) ? { 
                ...section, 
                [key]: value === undefined || value === null ? "" : value 
              } : section
            )
          }
        : group
    ))
  }

  const updateSubsection = (groupId, sectionId, subsectionId, key, value) => {
    setGroups(groups.map(group => 
      (group.id === groupId || group._id === groupId || group.grpId === groupId)
        ? {
            ...group,
            sections: group.sections.map(section =>
              (section.id === sectionId || section._id === sectionId || section.secId === sectionId)
                ? {
                    ...section,
                    subsections: section.subsections.map(subsection =>
                      (subsection.id === subsectionId || subsection._id === subsectionId || subsection.subId === subsectionId) ? { 
                        ...subsection, 
                        [key]: value === undefined || value === null ? "" : value 
                      } : subsection
                    )
                  }
                : section
            )
          }
        : group
    ))
  }

  // Handle number inputs with formatting
  const handleNumberInput = (groupId, sectionId, subsectionId, key, value) => {
    const numericValue = parseNumber(value)
    if (subsectionId) {
      updateSubsection(groupId, sectionId, subsectionId, key, numericValue)
    } else if (sectionId) {
      updateSection(groupId, sectionId, key, numericValue)
    } else {
      updateGroup(groupId, key, numericValue)
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const updatedGroups = groups.map(group => {
      let groupTotal = 0;
      
      const updatedSections = group.sections.map(section => {
        let sectionTotal = 0;
        
        const updatedSubsections = section.subsections.map(subsection => {
          const subsectionTotal = (subsection.quantity || 0) * (subsection.rate || 0);
          const subsectionAmount = subsectionTotal || subsection.amount || 0;
          const subsectionBalance = subsectionAmount - (subsection.spent || 0);
          
          return {
            ...subsection,
            amount: subsectionAmount,
            total: subsectionAmount,
            balance: subsectionBalance
          };
        });
        
        sectionTotal = updatedSubsections.reduce((sum, sub) => sum + sub.total, 0);
        
        if (sectionTotal === 0 && (section.quantity || section.rate)) {
          sectionTotal = (section.quantity || 0) * (section.rate || 0);
        }
        
        const sectionAmount = sectionTotal || section.amount || 0;
        const sectionBalance = sectionAmount - (section.spent || 0);
        
        groupTotal += sectionAmount;
        
        return {
          ...section,
          subsections: updatedSubsections,
          amount: sectionAmount,
          total: sectionAmount,
          balance: sectionBalance
        };
      });
      
      if (groupTotal === 0 && (group.quantity || group.rate)) {
        groupTotal = (group.quantity || 0) * (group.rate || 0);
      }
      
      const groupAmount = groupTotal || group.amount || 0;
      const groupBalance = groupAmount - (group.spent || 0);
      
      return {
        ...group,
        sections: updatedSections,
        amount: groupAmount,
        total: groupAmount,
        balance: groupBalance
      };
    });
    
    const variationTotal = updatedGroups.reduce((sum, group) => sum + (group.total || 0), 0);
    const variationBalance = variationTotal - 0;
    const variationAmount = variationTotal;
    
    return {
      groups: updatedGroups,
      amount: variationAmount,
      total: variationTotal,
      balance: variationBalance
    };
  }

  const calculatedData = calculateTotals()

  // Toggle expand/collapse
  const toggle = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Save function
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    try {
      const variationData = {
        name: variationName,
        projectId,
        estimateId,
        description,
        notes,
        groups: calculatedData.groups.map(group => ({
          ...group,
          id: undefined,
          sections: group.sections.map(section => ({
            ...section,
            id: undefined,
            subsections: section.subsections.map(subsection => ({
              ...subsection,
              id: undefined
            }))
          }))
        })),
        amount: calculatedData.amount,
        total: calculatedData.total,
        spent: variation?.spent || 0,
        balance: calculatedData.balance
      }
      
      updateVariationMutation.mutate(variationData)
    } catch (error) {
      console.error("Error preparing variation data:", error)
      toast.error("Failed to prepare variation data. Please try again.")
    }
  }

  const formatKES = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0)

  // Helper functions for code generation
  const generateGroupCode = (index) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return index < 26 ? letters[index] : `A${Math.floor(index / 26)}${letters[index % 26]}`
  }

  const generateSectionCode = (groupCode, index) => {
    return `${groupCode}${index + 1}`
  }

  const generateSubsectionCode = (sectionCode, index) => {
    return `${sectionCode}.${index + 1}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading variation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error loading variation</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!variation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Variation not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Find the current project and estimate for display
  const currentProject = projects.find(p => p._id === variation.projectId)
  const currentEstimate = estimates.find(e => e.estimateId === variation.estimateId)

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium capitalize">{variation.status}</span>
            </div>
            <div className="text-sm text-gray-500">
              Variation ID: <span className="font-mono font-medium">{variation.variationId}</span>
            </div>
            
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4" />
                Edit Variation
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form data
                    setVariationName(variation.name || "")
                    setProjectId(variation.projectId || "")
                    setEstimateId(variation.estimateId || "")
                    setDescription(variation.description || "")
                    setNotes(variation.notes || "")
                    setGroups(variation.groups || [])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateVariationMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4" />
                  {updateVariationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {isEditing ? (
                <Input
                  value={variationName}
                  onChange={(e) => setVariationName(e.target.value)}
                  className="text-2xl font-bold p-0 border-none focus:ring-0"
                  placeholder="Variation Name"
                />
              ) : (
                variation.name
              )}
              {!isEditing && <Eye className="w-6 h-6 text-gray-400" />}
            </CardTitle>
            {validationErrors.name && (
              <p className="text-sm text-red-600">{validationErrors.name}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Variation Name *</Label>
                {isEditing ? (
                  <Input 
                    placeholder="Enter variation name" 
                    value={variationName}
                    onChange={(e) => {
                      setVariationName(e.target.value)
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: undefined }))
                      }
                    }}
                    className="bg-white"
                  />
                ) : (
                  <div className="bg-white border rounded-md px-3 py-2 text-gray-900">
                    {variation.name}
                  </div>
                )}
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Project *</Label>
                {isEditing ? (
                  <Select 
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value)
                      if (validationErrors.projectId) {
                        setValidationErrors(prev => ({ ...prev, projectId: undefined }))
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {getProjectName(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                <div className="bg-white border rounded-md px-3 py-2 text-gray-900">
                  {getProjectName(
                    currentProject ||
                    variation.projectId ||
                    projects.find(p => p._id === variation.projectId)
                  )}
                </div>
                )}
                {validationErrors.projectId && (
                  <p className="text-sm text-red-600">{validationErrors.projectId}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estimate *</Label>
                {isEditing ? (
                  <Select 
                    value={estimateId}
                    onValueChange={(value) => {
                      setEstimateId(value)
                      if (validationErrors.estimateId) {
                        setValidationErrors(prev => ({ ...prev, estimateId: undefined }))
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select estimate" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimates.map((e) => (
                        <SelectItem key={e.estimateId} value={e.estimateId}>
                          {e.name || e.estimateId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-white border rounded-md px-3 py-2 text-gray-900">
                    {currentEstimate?.name || variation.estimateId}
                  </div>
                )}
                {validationErrors.estimateId && (
                  <p className="text-sm text-red-600">{validationErrors.estimateId}</p>
                )}
              </div>
              
              {isEditing && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-transparent">Action</Label>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={addNewGroup}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Group
                  </Button>
                </div>
              )}
            </div>

            {/* Description & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                {isEditing ? (
                  <Textarea 
                    placeholder="Enter variation description" 
                    rows={3} 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white"
                  />
                ) : (
                  <div className="bg-white border rounded-md px-3 py-2 text-gray-900 min-h-[80px]">
                    {variation.description || <span className="text-gray-400">No description</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                {isEditing ? (
                  <Textarea 
                    placeholder="Additional notes" 
                    rows={3} 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white"
                  />
                ) : (
                  <div className="bg-white border rounded-md px-3 py-2 text-gray-900 min-h-[80px]">
                    {variation.notes || <span className="text-gray-400">No notes</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Bill of Quantities */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Bill of Quantities</h3>
                <div className="text-lg font-bold text-blue-600">
                  Total: {formatKES(calculatedData.total)}
                </div>
              </div>

              {/* Groups */}
              <div className="space-y-4 overflow-hidden">
                {calculatedData.groups.map((group) => (
                  <div key={group._id || group.grpId || group.id} className="border rounded-lg bg-white overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-blue-50 p-4 border-b">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggle(group._id || group.grpId || group.id)}
                          className="flex items-center text-blue-700 hover:text-blue-800"
                        >
                          {expanded[group._id || group.grpId || group.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1 min-w-0">
                          <div className="sm:col-span-1">
                            <div className="bg-white border rounded px-3 py-2 text-center font-mono font-bold text-blue-600 min-w-[60px]">
                              {group.code}
                            </div>
                          </div>
                          <div className="sm:col-span-7 min-w-0">
                            {isEditing ? (
                              <Input
                                value={group.description || ""}
                                onChange={(e) => updateGroup(group._id || group.grpId || group.id, "description", e.target.value)}
                                placeholder="Group description"
                                className="bg-white font-medium w-full"
                              />
                            ) : (
                              <div className="bg-white border rounded-md px-3 py-2 font-medium">
                                {group.description}
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-2 text-right font-semibold text-blue-600 whitespace-nowrap">
                            {formatKES(group.total)}
                          </div>
                          <div className="sm:col-span-2 flex justify-end gap-2">
                            {isEditing && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => addNewSection(group._id || group.grpId || group.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Plus className="w-4 h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Section</span>
                                </Button>
                                {groups.length > 1 && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => deleteGroup(group._id || group.grpId || group.id)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sections */}
                    {expanded[group._id || group.grpId || group.id] && (
                      <div className="divide-y">
                        {group.sections.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <p>No sections added yet.</p>
                            {isEditing && (
                              <Button 
                                variant="outline" 
                                onClick={() => addNewSection(group._id || group.grpId || group.id)}
                                className="mt-2"
                              >
                                <Plus className="w-4 h-4 mr-2" /> Add First Section
                              </Button>
                            )}
                          </div>
                        ) : (
                          group.sections.map((section) => (
                            <div key={section._id || section.secId || section.id} className="bg-gray-50">
                              {/* Section Header */}
                              <div className="p-4 border-b">
                                <div className="flex items-center gap-4 ml-4 sm:ml-8">
                                  <button
                                    onClick={() => toggle(section._id || section.secId || section.id)}
                                    className="flex items-center text-gray-700 hover:text-gray-800"
                                  >
                                    {expanded[section._id || section.secId || section.id] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1 min-w-0">
                                    <div className="sm:col-span-1">
                                      <div className="bg-white border rounded px-3 py-2 text-center font-mono text-gray-700 min-w-[60px]">
                                        {section.code}
                                      </div>
                                    </div>
                                    <div className="sm:col-span-7 min-w-0">
                                      {isEditing ? (
                                        <Input
                                          value={section.description || ""}
                                          onChange={(e) => updateSection(
                                            group._id || group.grpId || group.id,
                                            section._id || section.secId || section.id,
                                            "description",
                                            e.target.value
                                          )}
                                          placeholder="Section description"
                                          className="bg-white w-full"
                                        />
                                      ) : (
                                        <div className="bg-white border rounded-md px-3 py-2">
                                          {section.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="sm:col-span-2 text-right font-medium text-gray-700 whitespace-nowrap">
                                      {formatKES(section.total)}
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end gap-2">
                                      {isEditing && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => addNewSubsection(
                                              group._id || group.grpId || group.id,
                                              section._id || section.secId || section.id
                                            )}
                                            className="bg-white"
                                          >
                                            <Plus className="w-4 h-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Item</span>
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => deleteSection(
                                              group._id || group.grpId || group.id,
                                              section._id || section.secId || section.id
                                            )}
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Subsections */}
                              {expanded[section._id || section.secId || section.id] && (
                                <div className="bg-white">
                                  {section.subsections.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                      <p>No items added yet.</p>
                                      {isEditing && (
                                        <Button 
                                          variant="outline" 
                                          onClick={() => addNewSubsection(
                                            group._id || group.grpId || group.id,
                                            section._id || section.secId || section.id
                                          )}
                                          className="mt-2"
                                        >
                                          <Plus className="w-4 h-4 mr-2" /> Add First Item
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-4 overflow-x-auto">
                                      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-600 border-b min-w-[800px]">
                                        <div className="col-span-2">Code</div>
                                        <div className="col-span-5">Description</div>
                                        <div className="col-span-1 text-right">Qty</div>
                                        <div className="col-span-1 text-center">Unit</div>
                                        <div className="col-span-2 text-right">Rate</div>
                                        <div className="col-span-1 text-right">Amount</div>
                                      </div>
                                      <div className="space-y-2 mt-2 min-w-[800px]">
                                        {section.subsections.map((subsection) => (
                                          <div key={subsection._id || subsection.subId || subsection.id} className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-gray-50 rounded">
                                            <div className="col-span-2">
                                              <div className="bg-gray-50 border rounded px-3 py-2 text-center font-mono text-sm text-gray-600">
                                                {subsection.code}
                                              </div>
                                            </div>
                                            <div className="col-span-5">
                                              {isEditing ? (
                                                <Input
                                                  value={subsection.description || ""}
                                                  onChange={(e) => updateSubsection(
                                                    group._id || group.grpId || group.id,
                                                    section._id || section.secId || section.id,
                                                    subsection._id || subsection.subId || subsection.id,
                                                    "description",
                                                    e.target.value
                                                  )}
                                                  placeholder="Item description"
                                                  className="bg-gray-50"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border rounded-md px-3 py-2">
                                                  {subsection.description}
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-span-1">
                                              {isEditing ? (
                                                <Input
                                                  type="text"
                                                  value={formatNumber(subsection.quantity)}
                                                  onChange={(e) => handleNumberInput(
                                                    group._id || group.grpId || group.id,
                                                    section._id || section.secId || section.id,
                                                    subsection._id || subsection.subId || subsection.id,
                                                    "quantity",
                                                    e.target.value
                                                  )}
                                                  className="bg-gray-50 text-right"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border rounded-md px-3 py-2 text-right">
                                                  {formatNumber(subsection.quantity)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-span-1">
                                              {isEditing ? (
                                                <Input
                                                  value={subsection.unit || ""}
                                                  onChange={(e) => updateSubsection(
                                                    group._id || group.grpId || group.id,
                                                    section._id || section.secId || section.id,
                                                    subsection._id || subsection.subId || subsection.id,
                                                    "unit",
                                                    e.target.value
                                                  )}
                                                  className="bg-gray-50 text-center"
                                                  placeholder="m²"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border rounded-md px-3 py-2 text-center">
                                                  {subsection.unit}
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-span-2">
                                              {isEditing ? (
                                                <Input
                                                  type="text"
                                                  value={formatNumber(subsection.rate)}
                                                  onChange={(e) => handleNumberInput(
                                                    group._id || group.grpId || group.id,
                                                    section._id || section.secId || section.id,
                                                    subsection._id || subsection.subId || subsection.id,
                                                    "rate",
                                                    e.target.value
                                                  )}
                                                  className="bg-gray-50 text-right"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border rounded-md px-3 py-2 text-right">
                                                  {formatNumber(subsection.rate)}
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-span-1 text-right font-medium text-blue-600 whitespace-nowrap">
                                              {formatKES(subsection.total)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Another Group Button */}
              {isEditing && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={addNewGroup}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Another Group
                  </Button>
                </div>
              )}
            </div>

            {/* Summary */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatKES(variation.total)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatKES(variation.balance)}</div>
                  <div className="text-sm text-gray-600">Balance</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatKES(variation.spent)}</div>
                  <div className="text-sm text-gray-600">Spent</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
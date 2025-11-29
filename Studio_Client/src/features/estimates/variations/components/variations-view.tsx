import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ChevronDown, ChevronRight, Trash2, ArrowLeft, Save, Edit, Eye, Calculator } from "lucide-react"
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

// Enhanced number formatting for large values
const formatNumber = (value) => {
  if (!value && value !== 0) return ""
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }
  return new Intl.NumberFormat('en-KE').format(value)
}

// Enhanced number parsing for large values
const parseNumber = (value) => {
  if (!value) return 0
  
  // Handle abbreviated formats (1.5M, 2.3B, etc.)
  const match = value.trim().toUpperCase().match(/^([0-9.,]+)([KMB])?$/)
  if (match) {
    let numValue = parseFloat(match[1].replace(/,/g, ''))
    const suffix = match[2]
    
    switch (suffix) {
      case 'K': return numValue * 1000
      case 'M': return numValue * 1000000
      case 'B': return numValue * 1000000000
      default: return numValue
    }
  }
  
  return parseFloat(value.replace(/,/g, '')) || 0
}

// Professional currency formatting for large amounts
const formatKES = (value) => {
  const num = value || 0
  if (num >= 1000000000) {
    return `KES ${(num / 1000000000).toFixed(2)}B`
  } else if (num >= 1000000) {
    return `KES ${(num / 1000000).toFixed(2)}M`
  } else if (num >= 1000) {
    return `KES ${(num / 1000).toFixed(2)}K`
  }
  
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
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
      const initialExpanded = {};
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

  // Enhanced number input handler with large number support
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

  // Calculate totals with large number support
  const calculateTotals = () => {
    const updatedGroups = groups.map(group => {
      let groupTotal = 0;
      
      const updatedSections = group.sections.map(section => {
        let sectionTotal = 0;
        
        const updatedSubsections = section.subsections.map(subsection => {
          const subsectionTotal = (subsection.quantity || 0) * (subsection.rate || 0);
          const subsectionAmount = subsectionTotal || subsection.amount || 0;
          
          return {
            ...subsection,
            amount: subsectionAmount,
            total: subsectionAmount
          };
        });
        
        sectionTotal = updatedSubsections.reduce((sum, sub) => sum + sub.total, 0);
        
        if (sectionTotal === 0 && (section.quantity || section.rate)) {
          sectionTotal = (section.quantity || 0) * (section.rate || 0);
        }
        
        const sectionAmount = sectionTotal || section.amount || 0;
        groupTotal += sectionAmount;
        
        return {
          ...section,
          subsections: updatedSubsections,
          amount: sectionAmount,
          total: sectionAmount
        };
      });
      
      if (groupTotal === 0 && (group.quantity || group.rate)) {
        groupTotal = (group.quantity || 0) * (group.rate || 0);
      }
      
      const groupAmount = groupTotal || group.amount || 0;
      
      return {
        ...group,
        sections: updatedSections,
        amount: groupAmount,
        total: groupAmount
      };
    });
    
    const variationTotal = updatedGroups.reduce((sum, group) => sum + (group.total || 0), 0);
    const variationAmount = variationTotal;
    
    return {
      groups: updatedGroups,
      amount: variationAmount,
      total: variationTotal
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
        total: calculatedData.total
      }
      
      updateVariationMutation.mutate(variationData)
    } catch (error) {
      console.error("Error preparing variation data:", error)
      toast.error("Failed to prepare variation data. Please try again.")
    }
  }

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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md border font-mono">
                ID: {variation.variationId}
              </div>
            </div>
            
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                <Edit className="w-4 h-4" />
                Edit Variation
              </Button>
            ) : (
              <div className="flex gap-2 flex-wrap">
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
                  className="whitespace-nowrap"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateVariationMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  {updateVariationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card className="w-full shadow-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              {isEditing ? (
                <Input
                  value={variationName}
                  onChange={(e) => setVariationName(e.target.value)}
                  className="text-2xl font-bold p-0 border-none focus:ring-0 bg-transparent"
                  placeholder="Variation Name"
                />
              ) : (
                <span className="truncate">{variation.name}</span>
              )}
              {!isEditing && <Eye className="w-6 h-6 text-gray-400 flex-shrink-0" />}
            </CardTitle>
            {validationErrors.name && (
              <p className="text-sm text-red-600 mt-2">{validationErrors.name}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6 p-4 sm:p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 sm:p-6 bg-white rounded-lg border shadow-xs">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Variation Name *</Label>
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
                    className="bg-white border-gray-300 focus:border-blue-500"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2.5 text-gray-900 font-medium">
                    {variation.name}
                  </div>
                )}
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Project *</Label>
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
                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500">
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
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2.5 text-gray-900">
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
                <Label className="text-sm font-semibold text-gray-700">Estimate *</Label>
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
                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500">
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
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2.5 text-gray-900">
                    {currentEstimate?.name || variation.estimateId}
                  </div>
                )}
                {validationErrors.estimateId && (
                  <p className="text-sm text-red-600">{validationErrors.estimateId}</p>
                )}
              </div>
              
              {isEditing && (
                <div className="space-y-2 flex flex-col justify-end">
                  <Label className="text-sm font-semibold text-gray-700 invisible">Action</Label>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={addNewGroup}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Group
                  </Button>
                </div>
              )}
            </div>

            {/* Description & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                {isEditing ? (
                  <Textarea 
                    placeholder="Enter variation description" 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border-gray-300 focus:border-blue-500 resize-vertical min-h-[100px]"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-3 text-gray-900 min-h-[100px] whitespace-pre-wrap">
                    {variation.description || <span className="text-gray-400 italic">No description provided</span>}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                {isEditing ? (
                  <Textarea 
                    placeholder="Additional notes and remarks" 
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white border-gray-300 focus:border-blue-500 resize-vertical min-h-[100px]"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-3 text-gray-900 min-h-[100px] whitespace-pre-wrap">
                    {variation.notes || <span className="text-gray-400 italic">No notes available</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Bill of Quantities */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border shadow-xs">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bill of Quantities</h3>
                  <p className="text-sm text-gray-600 mt-1">Detailed cost breakdown and item specifications</p>
                </div>
                <div className="text-xl font-bold text-blue-600 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 whitespace-nowrap">
                  Total: {formatKES(calculatedData.total)}
                </div>
              </div>

              {/* Groups */}
              <div className="space-y-4">
                {calculatedData.groups.map((group) => (
                  <div key={group._id || group.grpId || group.id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(group._id || group.grpId || group.id)}
                          className="flex items-center text-blue-700 hover:text-blue-800 mt-1 flex-shrink-0"
                        >
                          {expanded[group._id || group.grpId || group.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="grid grid-cols-1 xs:grid-cols-12 gap-3 items-start flex-1 min-w-0">
                          <div className="xs:col-span-1">
                            <div className="bg-white border border-blue-300 rounded-lg px-3 py-2.5 text-center font-mono font-bold text-blue-700 text-sm min-w-[70px] shadow-xs">
                              {group.code}
                            </div>
                          </div>
                          <div className="xs:col-span-6 min-w-0">
                            {isEditing ? (
                              <Input
                                value={group.description || ""}
                                onChange={(e) => updateGroup(group._id || group.grpId || group.id, "description", e.target.value)}
                                placeholder="Group description"
                                className="bg-white border-gray-300 font-semibold w-full text-base"
                              />
                            ) : (
                              <div className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 font-semibold text-gray-900">
                                {group.description}
                              </div>
                            )}
                          </div>
                          <div className="xs:col-span-2 text-right font-bold text-blue-700 whitespace-nowrap text-lg">
                            {formatKES(group.total)}
                          </div>
                          <div className="xs:col-span-3 flex justify-end gap-2 flex-wrap">
                            {isEditing && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => addNewSection(group._id || group.grpId || group.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Section</span>
                                </Button>
                                {groups.length > 1 && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => deleteGroup(group._id || group.grpId || group.id)}
                                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
                      <div className="divide-y divide-gray-100">
                        {group.sections.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 bg-gray-50">
                            <p className="text-lg mb-2">No sections added yet</p>
                            {isEditing && (
                              <Button 
                                variant="outline" 
                                onClick={() => addNewSection(group._id || group.grpId || group.id)}
                                className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="w-4 h-4 mr-2" /> Add First Section
                              </Button>
                            )}
                          </div>
                        ) : (
                          group.sections.map((section) => (
                            <div key={section._id || section.secId || section.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                              {/* Section Header */}
                              <div className="p-4 border-b border-gray-100">
                                <div className="flex items-start gap-3 ml-2 sm:ml-6">
                                  <button
                                    onClick={() => toggle(section._id || section.secId || section.id)}
                                    className="flex items-center text-gray-600 hover:text-gray-800 mt-1 flex-shrink-0"
                                  >
                                    {expanded[section._id || section.secId || section.id] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  
                                  <div className="grid grid-cols-1 xs:grid-cols-12 gap-3 items-start flex-1 min-w-0">
                                    <div className="xs:col-span-1">
                                      <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-center font-mono text-gray-700 text-sm min-w-[70px]">
                                        {section.code}
                                      </div>
                                    </div>
                                    <div className="xs:col-span-6 min-w-0">
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
                                          className="bg-white border-gray-300 w-full"
                                        />
                                      ) : (
                                        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                                          {section.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="xs:col-span-2 text-right font-semibold text-gray-700 whitespace-nowrap text-base">
                                      {formatKES(section.total)}
                                    </div>
                                    <div className="xs:col-span-3 flex justify-end gap-2 flex-wrap">
                                      {isEditing && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => addNewSubsection(
                                              group._id || group.grpId || group.id,
                                              section._id || section.secId || section.id
                                            )}
                                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                                          >
                                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Item</span>
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => deleteSection(
                                              group._id || group.grpId || group.id,
                                              section._id || section.secId || section.id
                                            )}
                                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm"
                                          >
                                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
                                    <div className="p-6 text-center text-gray-500 bg-white">
                                      <p className="text-base mb-2">No items added yet</p>
                                      {isEditing && (
                                        <Button 
                                          variant="outline" 
                                          onClick={() => addNewSubsection(
                                            group._id || group.grpId || group.id,
                                            section._id || section.secId || section.id
                                          )}
                                          className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                        >
                                          <Plus className="w-4 h-4 mr-2" /> Add First Item
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-4 overflow-x-auto">
                                      {/* Table Header */}
                                      <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200 bg-gray-50 rounded-lg min-w-[900px]">
                                        <div className="col-span-2">Code</div>
                                        <div className="col-span-4">Description</div>
                                        <div className="col-span-1 text-right">Quantity</div>
                                        <div className="col-span-1 text-center">Unit</div>
                                        <div className="col-span-2 text-right">Rate (KES)</div>
                                        <div className="col-span-2 text-right">Amount</div>
                                      </div>
                                      
                                      {/* Table Rows */}
                                      <div className="space-y-2 mt-3 min-w-[900px]">
                                        {section.subsections.map((subsection) => (
                                          <div key={subsection._id || subsection.subId || subsection.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 bg-white hover:bg-blue-50/30 rounded-lg border border-transparent hover:border-blue-200 transition-all">
                                            {/* Code */}
                                            <div className="col-span-2">
                                              <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-center font-mono text-sm text-gray-600 font-medium">
                                                {subsection.code}
                                              </div>
                                            </div>
                                            
                                            {/* Description */}
                                            <div className="col-span-4">
                                              {isEditing ? (
                                                <Textarea
                                                  value={subsection.description || ""}
                                                  onChange={(e) => updateSubsection(
                                                    group._id || group.grpId || group.id,
                                                    section._id || section.secId || section.id,
                                                    subsection._id || subsection.subId || subsection.id,
                                                    "description",
                                                    e.target.value
                                                  )}
                                                  placeholder="Item description"
                                                  className="bg-gray-50 border-gray-300 resize-vertical min-h-[60px] text-sm"
                                                  rows={2}
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm min-h-[60px] flex items-center">
                                                  {subsection.description}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Quantity */}
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
                                                  className="bg-gray-50 border-gray-300 text-right font-mono text-sm"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-right font-mono text-sm">
                                                  {formatNumber(subsection.quantity)}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Unit */}
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
                                                  className="bg-gray-50 border-gray-300 text-center font-mono text-sm"
                                                  placeholder="m²"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-center font-mono text-sm">
                                                  {subsection.unit}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Rate */}
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
                                                  className="bg-gray-50 border-gray-300 text-right font-mono text-sm"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-right font-mono text-sm">
                                                  {formatKES(subsection.rate).replace('KES ', '')}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Amount */}
                                            <div className="col-span-2 text-right font-semibold text-blue-600 whitespace-nowrap text-sm">
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
                <div className="flex justify-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={addNewGroup}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 border-2 border-dashed py-6 px-8 text-lg"
                  >
                    <Plus className="w-5 h-5 mr-3" /> Add Another Group
                  </Button>
                </div>
              )}
            </div>

            {/* Summary */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-xs">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{formatKES(variation.total)}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Amount</div>
                  <div className="text-xs text-gray-500 mt-1">Final calculated total</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-xs">
                  <div className="text-3xl font-bold text-green-600 mb-2">{groups.length}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Groups</div>
                  <div className="text-xs text-gray-500 mt-1">Total groups in variation</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-xs">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {groups.reduce((acc, group) => acc + group.sections.length, 0)}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sections</div>
                  <div className="text-xs text-gray-500 mt-1">Total sections across all groups</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
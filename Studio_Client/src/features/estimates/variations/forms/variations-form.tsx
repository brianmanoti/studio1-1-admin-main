import React, { useEffect, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ChevronDown, ChevronRight, Trash2, ArrowLeft } from "lucide-react"
import { z } from "zod"

// Zod validation schema
const variationSchema = z.object({
  name: z.string().min(1, "Variation name is required"),
  projectId: z.string().min(1, "Project is required"),
  estimateId: z.string().min(1, "Estimate is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
})

// Generate A-Z, A1-Z1, A1.1 style codes
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

export default function ProjectForm() {
  const navigate = useNavigate()
  const [variationName, setVariationName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [estimateId, setEstimateId] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [groups, setGroups] = useState([])
  const [expanded, setExpanded] = useState({})
  const [validationErrors, setValidationErrors] = useState({})

  // Use mutation for creating variation
  const createVariationMutation = useMutation({
    mutationFn: async (variationData) => {
      const response = await axiosInstance.post("/api/variations", variationData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success("Variation created successfully!")
      // Redirect to variations list or the created variation
      navigate("/variations")
    },
    onError: (error) => {
      console.error("Error creating variation:", error)
      toast.error("Failed to create variation. Please try again.")
    }
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await axiosInstance.get("/api/projects")).data,
  })

  const { data: estimates = [] } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => (await axiosInstance.get("/api/estimates")).data,
  })

  // Initialize with one empty group
  useEffect(() => {
    if (groups.length === 0) {
      addNewGroup()
    }
  }, [])

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
    const group = groups.find(g => g.id === groupId)
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
      group.id === groupId 
        ? { ...group, sections: [...group.sections, newSection] }
        : group
    ))
    setExpanded(prev => ({ ...prev, [newSection.id]: true }))
  }

  // Add new subsection to section
  const addNewSubsection = (groupId, sectionId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const section = group.sections.find(s => s.id === sectionId)
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
      group.id === groupId 
        ? {
            ...group,
            sections: group.sections.map(section =>
              section.id === sectionId
                ? { ...section, subsections: [...section.subsections, newSubsection] }
                : section
            )
          }
        : group
    ))
  }

  // Delete operations with code regeneration
  const deleteGroup = (groupId) => {
    if (groups.length > 1) {
      const updatedGroups = groups.filter(group => group.id !== groupId)
      // Regenerate all group codes
      const regeneratedGroups = updatedGroups.map((group, index) => ({
        ...group,
        code: generateGroupCode(index),
        sections: group.sections.map((section, sectionIndex) => ({
          ...section,
          code: generateSectionCode(generateGroupCode(index), sectionIndex),
          subsections: section.subsections.map((subsection, subsectionIndex) => ({
            ...subsection,
            code: generateSubsectionCode(generateSectionCode(generateGroupCode(index), sectionIndex), subsectionIndex)
          }))
        }))
      }))
      setGroups(regeneratedGroups)
    }
  }

  const deleteSection = (groupId, sectionId) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        const updatedSections = group.sections.filter(section => section.id !== sectionId)
        // Regenerate section codes for this group
        const regeneratedSections = updatedSections.map((section, index) => ({
          ...section,
          code: generateSectionCode(group.code, index),
          subsections: section.subsections.map((subsection, subsectionIndex) => ({
            ...subsection,
            code: generateSubsectionCode(generateSectionCode(group.code, index), subsectionIndex)
          }))
        }))
        return { ...group, sections: regeneratedSections }
      }
      return group
    }))
  }

  const deleteSubsection = (groupId, sectionId, subsectionId) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          sections: group.sections.map(section => {
            if (section.id === sectionId) {
              const updatedSubsections = section.subsections.filter(sub => sub.id !== subsectionId)
              // Regenerate subsection codes for this section
              const regeneratedSubsections = updatedSubsections.map((subsection, index) => ({
                ...subsection,
                code: generateSubsectionCode(section.code, index)
              }))
              return { ...section, subsections: regeneratedSubsections }
            }
            return section
          })
        }
      }
      return group
    }))
  }

  // Update operations with number formatting
  const updateGroup = (groupId, key, value) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { 
        ...group, 
        [key]: value === undefined || value === null ? "" : value 
      } : group
    ))
  }

  const updateSection = (groupId, sectionId, key, value) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            sections: group.sections.map(section =>
              section.id === sectionId ? { 
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
      group.id === groupId 
        ? {
            ...group,
            sections: group.sections.map(section =>
              section.id === sectionId
                ? {
                    ...section,
                    subsections: section.subsections.map(subsection =>
                      subsection.id === subsectionId ? { 
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

  // Calculate totals exactly like MongoDB schema
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
        
        // Calculate section total from subsections
        sectionTotal = updatedSubsections.reduce((sum, sub) => sum + sub.total, 0);
        
        // If section has no subsections, use direct values
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
      
      // If group has no sections, use direct values
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
    
    // Calculate variation total
    const variationTotal = updatedGroups.reduce((sum, group) => sum + (group.total || 0), 0);
    const variationBalance = variationTotal - 0; // No spent at variation level in form
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

  // Save function using mutation
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
          // Remove temporary id, keep grpId for MongoDB to generate
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
        spent: 0, // Default to 0 in form
        balance: calculatedData.balance
      }
      
      console.log("Saving variation data:", variationData)
      createVariationMutation.mutate(variationData)
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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Create Variation</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Variation Name *</Label>
                <Input 
                  placeholder="Enter variation name" 
                  value={variationName || ""}
                  onChange={(e) => {
                    setVariationName(e.target.value)
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: undefined }))
                    }
                  }}
                  className="bg-white"
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Project *</Label>
                <Select 
                  value={projectId || ""}
                  onValueChange={(value) => {
                    setProjectId(value)
                    if (validationErrors.projectId) {
                      setValidationErrors(prev => ({ ...prev, projectId: undefined }))
                    }
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={projectsLoading ? "Loading..." : "Select project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.projectId && (
                  <p className="text-sm text-red-600">{validationErrors.projectId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estimate *</Label>
                <Select 
                  value={estimateId || ""}
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
                      <SelectItem key={e.estimateId} value={e.estimateId}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.estimateId && (
                  <p className="text-sm text-red-600">{validationErrors.estimateId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-transparent">Action</Label>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={addNewGroup}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Group
                </Button>
              </div>
            </div>

            {/* Description & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea 
                  placeholder="Enter variation description" 
                  rows={3} 
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea 
                  placeholder="Additional notes" 
                  rows={3} 
                  value={notes || ""}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white"
                />
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
                {calculatedData.groups.map((group, groupIndex) => (
                  <div key={group.id} className="border rounded-lg bg-white overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-blue-50 p-4 border-b">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggle(group.id)}
                          className="flex items-center text-blue-700 hover:text-blue-800"
                        >
                          {expanded[group.id] ? (
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
                            <Input
                              value={group.description || ""}
                              onChange={(e) => updateGroup(group.id, "description", e.target.value)}
                              placeholder="Group description"
                              className="bg-white font-medium w-full"
                            />
                          </div>
                          <div className="sm:col-span-2 text-right font-semibold text-blue-600 whitespace-nowrap">
                            {formatKES(group.total)}
                          </div>
                          <div className="sm:col-span-2 flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => addNewSection(group.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Section</span>
                            </Button>
                            {groups.length > 1 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteGroup(group.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sections - Only show when group is expanded */}
                    {expanded[group.id] && (
                      <div className="divide-y">
                        {group.sections.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <p>No sections added yet.</p>
                            <Button 
                              variant="outline" 
                              onClick={() => addNewSection(group.id)}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add First Section
                            </Button>
                          </div>
                        ) : (
                          group.sections.map((section, sectionIndex) => (
                            <div key={section.id} className="bg-gray-50">
                              {/* Section Header */}
                              <div className="p-4 border-b">
                                <div className="flex items-center gap-4 ml-4 sm:ml-8">
                                  <button
                                    onClick={() => toggle(section.id)}
                                    className="flex items-center text-gray-700 hover:text-gray-800"
                                  >
                                    {expanded[section.id] ? (
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
                                      <Input
                                        value={section.description || ""}
                                        onChange={(e) => updateSection(group.id, section.id, "description", e.target.value)}
                                        placeholder="Section description"
                                        className="bg-white w-full"
                                      />
                                    </div>
                                    <div className="sm:col-span-2 text-right font-medium text-gray-700 whitespace-nowrap">
                                      {formatKES(section.total)}
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => addNewSubsection(group.id, section.id)}
                                        className="bg-white"
                                      >
                                        <Plus className="w-4 h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Item</span>
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => deleteSection(group.id, section.id)}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Subsections - Only show when section is expanded */}
                              {expanded[section.id] && (
                                <div className="bg-white">
                                  {section.subsections.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                      <p>No items added yet.</p>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => addNewSubsection(group.id, section.id)}
                                        className="mt-2"
                                      >
                                        <Plus className="w-4 h-4 mr-2" /> Add First Item
                                      </Button>
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
                                        {section.subsections.map((subsection, subsectionIndex) => (
                                          <div key={subsection.id} className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-gray-50 rounded">
                                            <div className="col-span-2">
                                              <div className="bg-gray-50 border rounded px-3 py-2 text-center font-mono text-sm text-gray-600">
                                                {subsection.code}
                                              </div>
                                            </div>
                                            <div className="col-span-5">
                                              <Input
                                                value={subsection.description || ""}
                                                onChange={(e) => updateSubsection(group.id, section.id, subsection.id, "description", e.target.value)}
                                                placeholder="Item description"
                                                className="bg-gray-50"
                                              />
                                            </div>
                                            <div className="col-span-1">
                                              <Input
                                                type="text"
                                                value={formatNumber(subsection.quantity)}
                                                onChange={(e) => handleNumberInput(group.id, section.id, subsection.id, "quantity", e.target.value)}
                                                className="bg-gray-50 text-right"
                                                placeholder="0"
                                              />
                                            </div>
                                            <div className="col-span-1">
                                              <Input
                                                value={subsection.unit || ""}
                                                onChange={(e) => updateSubsection(group.id, section.id, subsection.id, "unit", e.target.value)}
                                                className="bg-gray-50 text-center"
                                                placeholder="m²"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <Input
                                                type="text"
                                                value={formatNumber(subsection.rate)}
                                                onChange={(e) => handleNumberInput(group.id, section.id, subsection.id, "rate", e.target.value)}
                                                className="bg-gray-50 text-right"
                                                placeholder="0"
                                              />
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
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={addNewGroup}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Another Group
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg min-w-[140px]"
                onClick={handleSave}
                disabled={createVariationMutation.isPending}
              >
                {createVariationMutation.isPending ? "Saving..." : "Save Variation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
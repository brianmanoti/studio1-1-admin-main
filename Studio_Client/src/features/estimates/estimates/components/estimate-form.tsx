import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Upload, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  FileText, 
  Calculator,
  Building,
  Layers,
  Table,
  ListTree,
  Grid3X3
} from "lucide-react"
import { ImportExcelModal } from "./import-excel-modal"
import axiosInstance from "@/lib/axios"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useProjectStore } from "@/stores/projectStore"

// --- Updated Interfaces to match the response ---
interface EstimateData {
  projectId: string
  name: string
  description?: string
  notes?: string
  date?: string
  status?: string
  groups: Group[]
  totals?: TotalLine[]
}

interface TotalLine {
  description: string
  amount: number
}

interface Group {
  id?: string
  code: string
  description: string
  quantity: number
  unit?: string
  rate: number
  total: number
  calculatedTotal?: number
  sections?: Section[]
  items?: any[]
  rowNumber?: number
  itemCount?: number
}

interface Section {
  id?: string
  code: string
  description: string
  quantity: number
  unit?: string
  rate: number
  total: number
  calculatedTotal?: number
  amount?: number
  subsections?: Subsection[]
  items?: any[]
  rowNumber?: number
  itemCount?: number
}

interface Subsection {
  id?: string
  code: string
  description: string
  quantity: number
  unit?: string
  rate: number
  total: number
  calculatedTotal?: number
  amount?: number
  items?: any[]
  rowNumber?: number
  itemCount?: number
}

interface EstimateResponse {
  _id: string
  projectId: string
  name: string
  description: string
  status: string
  date: string
  groups: Group[]
  totals: TotalLine[]
  createdAt: string
  updatedAt: string
}

// Excel Import Response Interface
interface ExcelImportResponse {
  success: boolean
  message: string
  summary: {
    fileName: string
    fileSize: number
    totalAmount: number
    totalItems: number
    totalGroups: number
    totalSections: number
    totalSubsections: number
    sheetCount: number
  }
  data: {
    groups: Group[]
    items: any[]
    totals: {
      grandTotal: number
      totalItems: number
      totalGroups: number
      totalSections: number
      totalSubsections: number
    }
  }
  calculations: {
    grandTotal: number
  }
}

type CreationMode = "import" | "scratch"
type ViewMode = "form" | "preview"
type DataView = "table" | "hierarchy" | "cards"

// Confirmation Dialog State
interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export default function EstimateForm() {
  const currentProjectId = useProjectStore((s) => s.projectId)
  const [groups, setGroups] = useState<Group[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [creationMode, setCreationMode] = useState<CreationMode>("scratch")
  const [viewMode, setViewMode] = useState<ViewMode>("form")
  const [dataView, setDataView] = useState<DataView>("table")
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [savedEstimates, setSavedEstimates] = useState<EstimateResponse[]>([])

   const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || "")

   // Add this after your state declarations
useEffect(() => {
  // Sync the project store ID with the form when it changes
  if (currentProjectId) {
    setSelectedProjectId(currentProjectId)
  }
}, [currentProjectId])


  // Confirmation Dialog State
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default"
  })

  // Top-level fields
  const [estimateName, setEstimateName] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Draft")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])

  // Utility functions
  const formatKES = (value: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value || 0)

  // Calculate totals
  const calculateTotals = () => {
    const grandTotal = groups.reduce((sum, group) => sum + (group.total || group.calculatedTotal || 0), 0)
    const totalItems = groups.reduce((sum, group) => 
      sum + (group.sections?.reduce((secSum, section) => 
        secSum + (section.subsections?.length || 0), 0) || 0), 0
    )
    return { grandTotal, totalItems }
  }

  const { grandTotal, totalItems } = calculateTotals()

const { data: projects = [] } = useQuery({
  queryKey: ["project"],
  queryFn: async () => {
    const res = await axiosInstance.get("/api/projects")
    return res.data                
  },
})


  const { data: estimates = [], refetch: refetchEstimates } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const res = await fetch("/api/estimates")
      if (!res.ok) throw new Error("Failed to fetch estimates")
      return res.json()
    },
  })

  // Save estimate mutation
  const mutation = useMutation({
    mutationFn: async (data: EstimateData) => {
      const res = await axiosInstance.post("/api/estimates", data)
      return res.data
    },
    onSuccess: (data) => {
      toast.success("Estimate saved successfully!")
      setSavedEstimates(prev => [data, ...prev])
      refetchEstimates()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to save estimate")
    },
  })

  // Load estimate into form
  const loadEstimate = (estimate: EstimateResponse) => {
    setEstimateName(estimate.name)
    setDescription(estimate.description)
    setNotes(estimate.notes || "")
    setStatus(estimate.status)
    setDate(estimate.date)
    setSelectedProjectId(estimate.projectId) 
    setGroups(estimate.groups || [])
    setViewMode("form")
    toast.success("Estimate loaded for editing")
  }

  // --- Confirmation Dialog Functions ---
  const showConfirmation = (config: Omit<ConfirmationState, 'isOpen'>) => {
    setConfirmation({
      ...config,
      isOpen: true
    })
  }

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }))
  }

  const handleConfirm = () => {
    confirmation.onConfirm()
    closeConfirmation()
  }

  // --- Delete Functions with Confirmation ---
  const deleteGroup = (index: number) => {
    showConfirmation({
      title: "Delete Group",
      message: "Are you sure you want to delete this group and all its contents? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        setGroups(groups.filter((_, i) => i !== index))
        toast.success("Group deleted successfully")
      }
    })
  }

  const deleteSection = (groupIndex: number, sectionIndex: number) => {
    showConfirmation({
      title: "Delete Section",
      message: "Are you sure you want to delete this section and all its subsections? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        const updatedGroups = [...groups]
        updatedGroups[groupIndex].sections = updatedGroups[groupIndex].sections?.filter((_, i) => i !== sectionIndex)
        setGroups(updatedGroups)
        toast.success("Section deleted successfully")
      }
    })
  }

  const deleteSubsection = (groupIndex: number, sectionIndex: number, subsectionIndex: number) => {
    showConfirmation({
      title: "Delete Item",
      message: "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        const updatedGroups = [...groups]
        updatedGroups[groupIndex].sections![sectionIndex].subsections = 
          updatedGroups[groupIndex].sections![sectionIndex].subsections?.filter((_, i) => i !== subsectionIndex)
        setGroups(updatedGroups)
        toast.success("Item deleted successfully")
      }
    })
  }

  // --- Handle Excel Import ---
  const handleImportSuccess = (data: ExcelImportResponse) => {
    console.log("📥 Imported data:", data)
    
    let importedGroups: Group[] = []
    
    // Extract the grand total from the backend response
    const backendGrandTotal = data.summary?.totalAmount || data.calculations?.grandTotal || 0
    console.log("💰 Backend Grand Total:", backendGrandTotal)

    // Handle the new API response structure - extract from data.groups
    if (data.data && data.data.groups && Array.isArray(data.data.groups)) {
      importedGroups = data.data.groups.map((group: Group) => ({
        id: group.code || `group-${Date.now()}-${Math.random()}`,
        code: group.code,
        description: group.description || 'Unnamed Group',
        quantity: group.quantity || 0,
        unit: group.unit || '',
        rate: group.rate || 0,
        total: group.total || group.calculatedTotal || 0,
        calculatedTotal: group.calculatedTotal,
        sections: processSections(group.sections || []),
        items: group.items || [],
        rowNumber: group.rowNumber,
        itemCount: group.itemCount,
      }))
    }

    console.log("✅ Final arranged groups:", importedGroups)

    setGroups(importedGroups)
    setCreationMode("import")
    setDataView("table") // Switch to table view after import
    
    const importSummary = {
      totalGroups: importedGroups.length,
      totalItems: calculateTotalItems(importedGroups),
      grandTotal: backendGrandTotal,
      backendCalculated: true
    }
    
    toast.success(
      `Imported ${importSummary.totalGroups} groups with ${importSummary.totalItems} items! ` +
      `Grand Total: ${formatKES(importSummary.grandTotal)}`
    )
  }

  // Helper function to process sections
  const processSections = (sections: Section[]): Section[] => {
    return sections
      .filter(section => 
        section.itemCount > 0 || 
        section.calculatedTotal !== undefined ||
        (section.items && section.items.length > 0)
      )
      .map(section => ({
        id: section.code || `section-${Date.now()}-${Math.random()}`,
        code: section.code,
        description: section.description || 'Unnamed Section',
        quantity: section.quantity || 0,
        unit: section.unit || '',
        rate: section.rate || 0,
        total: section.total || 0,
        calculatedTotal: section.calculatedTotal,
        amount: section.calculatedTotal || section.amount || 0,
        subsections: processSubsections(section.subsections || section.items || []),
        items: section.items || [],
        rowNumber: section.rowNumber,
        itemCount: section.itemCount,
      }))
  }

  // Helper function to process subsections
  const processSubsections = (items: Subsection[]): Subsection[] => {
    return items
      .filter(item => 
        item.amount !== undefined || 
        item.calculatedTotal !== undefined ||
        (item.quantity > 0 && item.rate > 0)
      )
      .map(item => ({
        id: item.code || `sub-${Date.now()}-${Math.random()}`,
        code: item.code,
        description: item.description || 'Unnamed Item',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        rate: item.rate || 0,
        total: item.total || 0,
        calculatedTotal: item.calculatedTotal,
        amount: item.calculatedTotal || item.amount || 0,
        items: item.items || [],
        rowNumber: item.rowNumber,
        itemCount: item.itemCount,
      }))
  }

  // Helper function to calculate total items
  const calculateTotalItems = (groups: Group[]): number => {
    return groups.reduce((total, group) => {
      const groupItems = group.sections?.reduce((sectionTotal, section) => {
        return sectionTotal + (section.subsections?.length || 0)
      }, 0) || 0
      return total + groupItems
    }, 0)
  }

  // Update manual creation functions
  const addGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      code: "",
      description: "",
      quantity: 0,
      unit: "",
      rate: 0,
      total: 0,
      sections: [],
    }
    setGroups([...groups, newGroup])
  }

  const addSection = (groupIndex: number) => {
    const updatedGroups = [...groups]
    const targetGroup = updatedGroups[groupIndex]
    
    if (!targetGroup.sections) targetGroup.sections = []
    
    targetGroup.sections.push({
      id: `section-${Date.now()}`,
      code: "",
      description: "",
      quantity: 0,
      unit: "",
      rate: 0,
      total: 0,
      amount: 0,
      subsections: [],
    })
    
    setGroups(updatedGroups)
  }

  const addSubsection = (groupIndex: number, sectionIndex: number) => {
    const updatedGroups = [...groups]
    const targetSection = updatedGroups[groupIndex].sections?.[sectionIndex]
    
    if (targetSection) {
      if (!targetSection.subsections) targetSection.subsections = []
      
      targetSection.subsections.push({
        id: `sub-${Date.now()}`,
        code: "",
        description: "",
        quantity: 0,
        unit: "",
        rate: 0,
        total: 0,
        amount: 0,
      })
      
      setGroups(updatedGroups)
    }
  }

  // Update functions with calculation
  const updateGroup = (index: number, field: string, value: any) => {
    const updatedGroups = [...groups]
    updatedGroups[index] = { ...updatedGroups[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      const group = updatedGroups[index]
      updatedGroups[index].total = (group.quantity || 0) * (group.rate || 0)
    }
    
    setGroups(updatedGroups)
  }

  const updateSection = (groupIndex: number, sectionIndex: number, field: string, value: any) => {
    const updatedGroups = [...groups]
    const section = updatedGroups[groupIndex].sections?.[sectionIndex]
    
    if (section) {
      updatedGroups[groupIndex].sections![sectionIndex] = { ...section, [field]: value }
      
      if (field === 'quantity' || field === 'rate') {
        updatedGroups[groupIndex].sections![sectionIndex].amount = (section.quantity || 0) * (section.rate || 0)
        updatedGroups[groupIndex].sections![sectionIndex].total = (section.quantity || 0) * (section.rate || 0)
      }
      
      setGroups(updatedGroups)
    }
  }

  const updateSubsection = (groupIndex: number, sectionIndex: number, subsectionIndex: number, field: string, value: any) => {
    const updatedGroups = [...groups]
    const subsection = updatedGroups[groupIndex].sections?.[sectionIndex]?.subsections?.[subsectionIndex]
    
    if (subsection) {
      updatedGroups[groupIndex].sections![sectionIndex].subsections![subsectionIndex] = { 
        ...subsection, 
        [field]: value 
      }
      
      if (field === 'quantity' || field === 'rate') {
        updatedGroups[groupIndex].sections![sectionIndex].subsections![subsectionIndex].amount = 
          (subsection.quantity || 0) * (subsection.rate || 0)
        updatedGroups[groupIndex].sections![sectionIndex].subsections![subsectionIndex].total = 
          (subsection.quantity || 0) * (subsection.rate || 0)
      }
      
      setGroups(updatedGroups)
    }
  }

  // --- Submit Handler ---
  const handleSubmit = async () => {
    try {
      if (!selectedProjectId) {
        toast.error("Select a project first")
        return
      }

      if (!estimateName.trim()) {
        toast.error("Estimate name is required")
        return
      }

      if (groups.length === 0) {
        toast.error("Add at least one group to the estimate")
        return
      }

      // Clean and normalize data
      const cleanedGroups = groups.map((group) => {
        const cleanedSections = (group.sections || []).map((section) => {
          const cleanedSubsections = (section.subsections || []).map((sub) => ({
            code: sub.code || "",
            description: sub.description || "",
            quantity: Number(sub.quantity) || 0,
            unit: sub.unit || "",
            rate: Number(sub.rate) || 0,
            amount: Number(sub.amount) || (Number(sub.quantity) || 0) * (Number(sub.rate) || 0),
            total: Number(sub.total) || (Number(sub.quantity) || 0) * (Number(sub.rate) || 0),
          }))

          const sectionAmount = Number(section.amount) || (Number(section.quantity) || 0) * (Number(section.rate) || 0)

          return {
            code: section.code || "",
            description: section.description || "",
            quantity: Number(section.quantity) || 0,
            unit: section.unit || "",
            rate: Number(section.rate) || 0,
            amount: sectionAmount,
            total: sectionAmount,
            subsections: cleanedSubsections,
          }
        })

        const groupTotal = Number(group.total) || (group.sections?.reduce((sum, sec) => sum + (sec.amount || 0), 0) || 0)

        return {
          code: group.code || "",
          description: group.description || "",
          quantity: Number(group.quantity) || 0,
          unit: group.unit || "",
          rate: Number(group.rate) || 0,
          total: groupTotal,
          amount: Number(group.amount) || (Number(group.quantity) || 0) * (Number(group.rate) || 0),
          sections: cleanedSections,
        }
      })

      const grandTotals: TotalLine[] = [
        { description: "GRAND TOTAL", amount: grandTotal },
      ]

      const payload: EstimateData = {
        projectId: selectedProjectId,
        name: estimateName.trim(),
        description: description.trim(),
        notes: notes.trim(),
        date,
        status,
        groups: cleanedGroups,
        totals: grandTotals,
      }

      await mutation.mutateAsync(payload)
    } catch (error: any) {
      console.error(" Error submitting estimate:", error)
      toast.error("Failed to save estimate. Please try again.")
    }
  }

  // --- Reset Form ---
  const resetForm = () => {
    setGroups([])
    setEstimateName("")
    setDescription("")
    setNotes("")
    setSelectedProjectId(currentProjectId || "") 
    setStatus("Draft")
    setDate(new Date().toISOString().split("T")[0])
    toast.success("Form reset successfully")
  }

  // --- Data View Components ---
  const renderTableView = () => (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <UITable>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12">Level</TableHead>
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-right">Quantity</TableHead>
                <TableHead className="w-20">Unit</TableHead>
                <TableHead className="w-24 text-right">Rate (KES)</TableHead>
                <TableHead className="w-28 text-right">Amount (KES)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group, groupIndex) => (
                <>
                  {/* Group Row */}
                  <TableRow key={group.id} className="bg-primary/5 hover:bg-primary/10 font-semibold">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(prev => ({
                          ...prev,
                          [group.id!]: !prev[group.id!]
                        }))}
                      >
                        {expanded[group.id!] ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{group.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{group.description}</div>
                        {group.code && (
                          <div className="text-sm text-muted-foreground">Code: {group.code}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{group.quantity || '-'}</TableCell>
                    <TableCell>{group.unit || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{group.rate ? formatKES(group.rate) : '-'}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatKES(group.total || group.calculatedTotal || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(groupIndex)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Sections */}
                  {expanded[group.id!] && group.sections?.map((section, sectionIndex) => (
                    <>
                      <TableRow key={section.id} className="bg-blue-50/30 hover:bg-blue-50/50 font-medium">
                        <TableCell>
                          <div className="ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpanded(prev => ({
                                ...prev,
                                [section.id!]: !prev[section.id!]
                              }))}
                            >
                              {expanded[section.id!] ? 
                                <ChevronDown className="w-3 h-3" /> : 
                                <ChevronRight className="w-3 h-3" />
                              }
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm pl-8">{section.code}</TableCell>
                        <TableCell>
                          <div className="pl-2">
                            <div className="font-medium">{section.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{section.quantity || '-'}</TableCell>
                        <TableCell>{section.unit || '-'}</TableCell>
                        <TableCell className="text-right font-mono">{section.rate ? formatKES(section.rate) : '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatKES(section.amount || section.calculatedTotal || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSection(groupIndex, sectionIndex)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Subsections */}
                      {expanded[section.id!] && section.subsections?.map((subsection, subsectionIndex) => (
                        <TableRow key={subsection.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="ml-8">
                              <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs pl-12 text-muted-foreground">
                            {subsection.code}
                          </TableCell>
                          <TableCell>
                            <div className="pl-4">
                              <div className="text-sm">{subsection.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{subsection.quantity}</TableCell>
                          <TableCell className="text-sm">{subsection.unit}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatKES(subsection.rate)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatKES(subsection.amount || subsection.calculatedTotal || 0)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSubsection(groupIndex, sectionIndex, subsectionIndex)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </>
              ))}
            </TableBody>
          </UITable>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <Table className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Import an Excel file or add data manually to see the table view
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderHierarchyView = () => (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => (
        <Card key={group.id} className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(prev => ({
                    ...prev,
                    [group.id!]: !prev[group.id!]
                  }))}
                >
                  {expanded[group.id!] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </Button>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    {group.description || `Group ${groupIndex + 1}`}
                    {group.code && (
                      <Badge variant="secondary" className="ml-2">
                        {group.code}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {formatKES(group.total || group.calculatedTotal || 0)}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGroup(groupIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expanded[group.id!] && (
            <CardContent className="space-y-4 border-t pt-4">
              {group.sections?.map((section, sectionIndex) => (
                <Card key={section.id} className="bg-muted/20 border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold">{section.description}</h4>
                        </div>
                        {section.code && (
                          <Badge variant="outline">{section.code}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {formatKES(section.amount || section.calculatedTotal || 0)}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSection(groupIndex, sectionIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {section.subsections?.map((subsection, subsectionIndex) => (
                      <div key={subsection.id} className="ml-6 p-3 bg-background rounded-lg border mb-2 last:mb-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary/50" />
                            <div>
                              <h5 className="text-sm font-medium">{subsection.description}</h5>
                            </div>
                            {subsection.code && (
                              <Badge variant="outline" className="text-xs">
                                {subsection.code}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-mono">
                                {formatKES(subsection.amount || subsection.calculatedTotal || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {subsection.quantity} {subsection.unit} × {formatKES(subsection.rate)}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSubsection(groupIndex, sectionIndex, subsectionIndex)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )

  // --- Render Manual Entry Form ---
  const renderManualEntry = () => (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <Card key={group.id} className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(prev => ({
                    ...prev,
                    [group.id!]: !prev[group.id!]
                  }))}
                >
                  {expanded[group.id!] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </Button>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    {group.description || `Group ${groupIndex + 1}`}
                    {group.code && (
                      <Badge variant="secondary" className="ml-2">
                        {group.code}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {formatKES(group.total || group.calculatedTotal || 0)}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGroup(groupIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Group Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Code</Label>
                <Input
                  placeholder="A"
                  value={group.code || ""}
                  onChange={(e) => updateGroup(groupIndex, 'code', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Group Description *</Label>
                <Input
                  placeholder="PRELIMINARIES"
                  value={group.description}
                  onChange={(e) => updateGroup(groupIndex, 'description', e.target.value)}
                  className="font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={group.quantity}
                  onChange={(e) => updateGroup(groupIndex, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rate (KES)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={group.rate}
                  onChange={(e) => updateGroup(groupIndex, 'rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Unit</Label>
                <Input
                  placeholder="LS"
                  value={group.unit || ""}
                  onChange={(e) => updateGroup(groupIndex, 'unit', e.target.value)}
                />
              </div>
            </div>

            {/* Sections */}
            {expanded[group.id!] && (
              <div className="ml-6 space-y-4 border-l-2 border-l-muted pl-6">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Sections
                  </h5>
                  <Button size="sm" onClick={() => addSection(groupIndex)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Section
                  </Button>
                </div>

                {group.sections?.map((section, sectionIndex) => (
                  <Card key={section.id} className="bg-muted/20 border">
                    <CardContent className="p-4 space-y-3">
                      {/* Section Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h6 className="font-medium">
                            {section.description || `Section ${sectionIndex + 1}`}
                          </h6>
                          {section.code && (
                            <Badge variant="outline" className="text-xs">
                              {section.code}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {formatKES(section.amount || section.calculatedTotal || 0)}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSection(groupIndex, sectionIndex)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Section Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        <Input
                          placeholder="B1"
                          value={section.code || ""}
                          onChange={(e) => updateSection(groupIndex, sectionIndex, 'code', e.target.value)}
                        />
                        <Input
                          placeholder="Section Description"
                          value={section.description}
                          onChange={(e) => updateSection(groupIndex, sectionIndex, 'description', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={section.quantity}
                          onChange={(e) => updateSection(groupIndex, sectionIndex, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={section.rate}
                          onChange={(e) => updateSection(groupIndex, sectionIndex, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      {/* Subsections */}
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <h6 className="text-sm font-medium">Items</h6>
                          <Button size="sm" onClick={() => addSubsection(groupIndex, sectionIndex)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Item
                          </Button>
                        </div>

                        {section.subsections?.map((subsection, subsectionIndex) => (
                          <Card key={subsection.id} className="bg-background border">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="text-sm font-medium">
                                  {subsection.description || `Item ${subsectionIndex + 1}`}
                                </h6>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {formatKES(subsection.amount || subsection.calculatedTotal || 0)}
                                  </Badge>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteSubsection(groupIndex, sectionIndex, subsectionIndex)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                <Input
                                  placeholder="B1.1"
                                  value={subsection.code || ""}
                                  onChange={(e) => updateSubsection(groupIndex, sectionIndex, subsectionIndex, 'code', e.target.value)}
                                />
                                <Input
                                  placeholder="Item Description"
                                  value={subsection.description}
                                  onChange={(e) => updateSubsection(groupIndex, sectionIndex, subsectionIndex, 'description', e.target.value)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Qty"
                                  value={subsection.quantity}
                                  onChange={(e) => updateSubsection(groupIndex, sectionIndex, subsectionIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Rate"
                                  value={subsection.rate}
                                  onChange={(e) => updateSubsection(groupIndex, sectionIndex, subsectionIndex, 'rate', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Input
                                  placeholder="Unit"
                                  value={subsection.unit || ""}
                                  onChange={(e) => updateSubsection(groupIndex, sectionIndex, subsectionIndex, 'unit', e.target.value)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={addGroup} className="w-full" variant="outline">
        <Plus className="w-4 h-4 mr-2" /> Add New Group
      </Button>
    </div>
  )

  // --- Render Imported Data ---
  const renderImportedData = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Excel Import Successful!
            </h4>
            <p className="text-green-600 text-sm">
              {groups.length} groups imported • {calculateTotalItems(groups)} total items
            </p>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 font-mono">
            {formatKES(grandTotal)}
          </Badge>
        </div>
      </div>

      {/* Data View Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              Imported Data
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">View:</Label>
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={dataView === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDataView("table")}
                  className="h-8 px-3"
                >
                  <Table className="w-4 h-4" />
                </Button>
                <Button
                  variant={dataView === "hierarchy" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDataView("hierarchy")}
                  className="h-8 px-3"
                >
                  <ListTree className="w-4 h-4" />
                </Button>
                <Button
                  variant={dataView === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDataView("cards")}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataView === "table" && renderTableView()}
          {dataView === "hierarchy" && renderHierarchyView()}
          {dataView === "cards" && renderManualEntry()}
        </CardContent>
      </Card>
    </div>
  )

  // --- Render Summary Card ---
  const renderSummaryCard = () => (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
            <div className="text-sm text-blue-600 font-medium">Groups</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{totalItems}</div>
            <div className="text-sm text-green-600 font-medium">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{formatKES(grandTotal)}</div>
            <div className="text-sm text-purple-600 font-medium">Grand Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmation.isOpen} onOpenChange={closeConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{confirmation.cancelText}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={confirmation.variant === "destructive" ? 
                "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
              }
            >
              {confirmation.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Construction Estimate</h1>
          <p className="text-gray-600 mt-1">Create and manage project estimates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Estimate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="estimate">Estimate Builder</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="w-full space-y-2">
                <Label>Project *</Label>
                <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project">
                      {projects.find((p) => p._id === selectedProjectId)?.name || "Select Project"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <Label>Estimate Name *</Label>
                  <Input 
                    placeholder="e.g., Main Construction Estimate" 
                    value={estimateName} 
                    onChange={(e) => setEstimateName(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Creation Method</Label>
                  <Select value={creationMode} onValueChange={(value: CreationMode) => setCreationMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scratch">Create from Scratch</SelectItem>
                      <SelectItem value="import">Import from Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Brief description of this estimate..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Any additional notes or comments..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  rows={2}
                />
              </div>

              {creationMode === "import" && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <h4 className="font-semibold">Import BOQ Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload an Excel file with your Bill of Quantities
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsImportModalOpen(true)} 
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Import Excel
                  </Button>
                  <ImportExcelModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImportSuccess={handleImportSuccess}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimate" className="space-y-6">
          {renderSummaryCard()}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Estimate Builder
                {groups.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {groups.length} Groups
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Estimate Data</h3>
                  <p className="text-muted-foreground mb-4">
                    {creationMode === "import" 
                      ? "Import an Excel file or switch to manual entry to start building your estimate."
                      : "Start by adding your first group to build the estimate structure."
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={addGroup}>
                      <Plus className="w-4 h-4 mr-2" /> Add First Group
                    </Button>
                    {creationMode === "scratch" && (
                      <Button 
                        variant="outline" 
                        onClick={() => setCreationMode("import")}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Import Excel
                      </Button>
                    )}
                  </div>
                </div>
              ) : creationMode === "import" ? (
                renderImportedData()
              ) : (
                renderManualEntry()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {renderSummaryCard()}
          
          <Card>
            <CardHeader>
              <CardTitle>Ready to Save</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Estimate Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Project:</span>
                      <span className="font-medium">
                        {projects.find((p: any) => p._id === selectedProjectId)?.name || "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimate Name:</span>
                      <span className="font-medium">{estimateName || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Groups:</span>
                      <span className="font-medium">{groups.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Grand Total:</span>
                      <span className="font-bold text-lg">{formatKES(grandTotal)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${selectedProjectId ? 'text-green-600' : 'text-amber-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${selectedProjectId ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {selectedProjectId ? 'Project selected' : 'Project required'}
                    </div>
                    <div className={`flex items-center gap-2 ${estimateName ? 'text-green-600' : 'text-amber-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${estimateName ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {estimateName ? 'Estimate name set' : 'Estimate name required'}
                    </div>
                    <div className={`flex items-center gap-2 ${groups.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${groups.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {groups.length > 0 ? 'Estimate data added' : 'Estimate data required'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedProjectId || !estimateName || groups.length === 0 || mutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  {mutation.isPending ? (
                    <>Saving Estimate...</>
                  ) : (
                    <>Save Estimate • {formatKES(grandTotal)}</>
                  )}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  size="lg"
                  disabled={mutation.isPending}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}